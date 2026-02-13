const db = require('../config/db');

// =======================================
// PRODUCT PRICE CALCULATION CONTROLLER
// =======================================

/**
 * Calculate product price based on metal type, purity, and weight
 * @param {number} metalTypeId - Metal type ID
 * @param {number} purityId - Purity ID
 * @param {number} grossWeight - Gross weight in grams
 * @param {number} lessWeight - Less weight in grams
 * @param {number} additionalWeight - Additional weight in grams
 * @param {number} tunch - Tunch percentage
 * @param {number} wastage - Wastage percentage
 * @param {number} labourType - Labour type (Wt, Fl, Pc)
 * @param {number} labourValue - Labour value
 * @param {number} otherCharges - Other charges
 * @returns {Object} Calculated price breakdown
 */
const calculateProductPrice = async (metalTypeId, purityId, grossWeight, lessWeight = 0, additionalWeight = 0, tunch = 0, wastage = 0, labourType = 'Wt', labourValue = 0, otherCharges = 0) => {
    try {
        // Get current metal rate
        const [metalRate] = await db.execute(`
            SELECT mr.rate_per_gram, mr.rate_per_10g, mt.name as metal_name, mp.purity_name, mp.purity_value, mp.tunch_value
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mr.metal_type_id = ? AND mr.purity_id = ? AND mr.is_live = 1
            ORDER BY mr.created_at DESC
            LIMIT 1
        `, [metalTypeId, purityId]);

        if (metalRate.length === 0) {
            throw new Error('Metal rate not found');
        }

        const rate = metalRate[0];
        const ratePerGram = parseFloat(rate.rate_per_gram) || 0;

        // Calculate net weight
        const netWeight = parseFloat(grossWeight) - parseFloat(lessWeight);

        // Calculate fine weight (for metal value calculation)
        let workingWeight = netWeight + parseFloat(additionalWeight);

        // Apply tunch percentage if provided
        if (parseFloat(tunch) > 0) {
            workingWeight = workingWeight * (parseFloat(tunch) / 100);
        }

        // Apply wastage percentage if provided
        if (parseFloat(wastage) > 0) {
            const wastageAmount = workingWeight * (parseFloat(wastage) / 100);
            workingWeight = workingWeight + wastageAmount;
        }

        const fineWeight = workingWeight;

        // Calculate metal value
        const metalValue = fineWeight * ratePerGram;

        // Calculate net weight for labour calculation (Net Weight + Additional Weight)
        // This matches AddProductPopup logic exactly
        const netWeightForLabour = netWeight + parseFloat(additionalWeight);

        // Calculate labour cost based on type (matching AddProductPopup logic)
        let labourCost = 0;
        const labourValueFloat = parseFloat(labourValue);

        switch (labourType) {
            case 'Wt':
                // Weight Type: labour_value × net_weight (including additional weight)
                if (labourValueFloat > 0 && netWeightForLabour > 0) {
                    labourCost = labourValueFloat * netWeightForLabour;
                } else {
                    labourCost = 0;
                }
                break;
            case 'Fl':
                // Flat Type: Direct labour_value amount
                labourCost = labourValueFloat;
                break;
            case 'Pc':
                // Percentage Type: (net_weight × labour_percentage_value) × rate (including additional weight)
                if (labourValueFloat > 0 && netWeightForLabour > 0 && ratePerGram > 0) {
                    const labourWeight = netWeightForLabour * (labourValueFloat / 100);
                    labourCost = labourWeight * ratePerGram;
                } else {
                    labourCost = 0;
                }
                break;
            default:
                labourCost = 0;
        }

        // Calculate base total (without stones/diamonds add-ons)
        const baseTotal = metalValue + labourCost + parseFloat(otherCharges);

        return {
            success: true,
            data: {
                metalTypeId,
                purityId,
                metalName: rate.metal_name,
                purityName: rate.purity_name,
                ratePerGram,
                grossWeight: parseFloat(grossWeight),
                lessWeight: parseFloat(lessWeight),
                netWeight,
                additionalWeight: parseFloat(additionalWeight),
                netWeightForLabour, // Net weight used for labour calculation (including additional weight)
                tunch: parseFloat(tunch),
                wastage: parseFloat(wastage),
                fineWeight,
                metalValue,
                labourType,
                labourValue: parseFloat(labourValue),
                labourCost,
                otherCharges: parseFloat(otherCharges),
                total: baseTotal,
                calculationBreakdown: {
                    metalValue,
                    labourCost,
                    otherCharges: parseFloat(otherCharges),
                    total: baseTotal
                }
            }
        };
    } catch (error) {
        console.error('Error calculating product price:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Resolve purity id from a product option's metal_purity string
 */
const resolvePurityId = async (metalTypeId, optionPurity) => {
    if (!optionPurity) return null;
    const purityStr = String(optionPurity).trim().toUpperCase();

    // Try matching by purity_name (e.g., '22K')
    let [rows] = await db.execute(
        'SELECT id FROM metal_purities WHERE metal_type_id = ? AND UPPER(purity_name) = ? LIMIT 1',
        [metalTypeId, purityStr]
    );
    if (rows.length > 0) return rows[0].id;

    // Try matching by tunch_value (e.g., '916' or '999')
    const numeric = parseFloat(purityStr);
    if (!isNaN(numeric)) {
        [rows] = await db.execute(
            'SELECT id FROM metal_purities WHERE metal_type_id = ? AND (ROUND(tunch_value) = ? OR ROUND(purity_value) = ?) LIMIT 1',
            [metalTypeId, numeric, numeric]
        );
        if (rows.length > 0) return rows[0].id;
    }

    return null;
};

// Helper to determine if an item is diamond-like (mirrors frontend keywords)
const isDiamondItemName = (name = '') => {
    const itemName = String(name || '').toLowerCase();
    const diamondKeywords = [
        'diamond', 'solitaire', 'brilliant', 'princess', 'round diamond', 'pear diamond',
        'marquise diamond', 'asscher diamond', 'radiant diamond', 'cushion diamond',
        'baguette diamond', 'emerald cut diamond', 'oval cut diamond', 'heart diamond',
        'trillion diamond', 'briolette diamond', 'rose cut diamond', 'old mine cut diamond',
        'old european cut diamond', 'single cut diamond', 'full cut diamond', 'step cut diamond',
        'mixed cut diamond', 'fancy cut diamond', 'modified brilliant diamond', 'modified step diamond', 'cz', 'cubic zirconia'
    ];
    return diamondKeywords.some(k => itemName.includes(k));
};

/**
 * Auto-update product prices when metal rates change
 * @param {number} metalTypeId - Metal type ID that was updated
 * @param {number} purityId - Purity ID that was updated (optional)
 */
const autoUpdateProductPrices = async (metalTypeId, purityId = null) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Fetch affected products directly from products table
        let productsQuery = `
            SELECT 
                p.id, p.item_name, p.gross_weight, p.less_weight, p.additional_weight,
                p.tunch, p.wastage_percentage, p.labour, p.labour_on, p.other,
                p.total_rs, p.total_fine_weight,
                p.metal_id, p.metal_purity_id
            FROM products p
            WHERE p.metal_id = ?
        `;
        const queryParams = [metalTypeId];

        // If purityId provided, narrow down by matching product purity id
        if (purityId) {
            productsQuery += ' AND p.metal_purity_id = ?';
            queryParams.push(purityId);
        }

        const [products] = await connection.execute(productsQuery, queryParams);

        let updatedCount = 0;
        const updateResults = [];

        for (const product of products) {
            try {
                // Use product's metal_purity_id directly
                const effectivePurityId = product.metal_purity_id;
                if (!effectivePurityId) {
                    // Skip if no purity id set
                    updateResults.push({ productId: product.id, productName: product.item_name, skipped: true, reason: 'No metal purity set' });
                    continue;
                }

                // Calculate new price using product's fields mapped to schema
                const priceCalculation = await calculateProductPrice(
                    product.metal_id,
                    effectivePurityId,
                    product.gross_weight,
                    product.less_weight,
                    product.additional_weight,
                    product.tunch,
                    product.wastage_percentage,
                    product.labour_on || 'Wt',
                    product.labour || 0,
                    product.other || 0
                );

                if (priceCalculation.success) {
                    // Sum ALL sell values from product_less_weight (including diamonds and stones)
                    const [lwRows] = await connection.execute(
                        'SELECT item, sale_value FROM product_less_weight WHERE product_id = ?',
                        [product.id]
                    );
                    const allLessWeightSellValue = (lwRows || []).reduce((sum, row) => {
                        return sum + (parseFloat(row.sale_value) || 0);
                    }, 0);

                    const baseTotal = priceCalculation.data.total;
                    const finalTotal = baseTotal + allLessWeightSellValue;
                    const newFineWeight = priceCalculation.data.fineWeight;
                    const ratePerGram = priceCalculation.data.ratePerGram;

                    // Update product with new calculations (also set current rate)
                    await connection.execute(
                        'UPDATE products SET rate = ?, total_rs = ?, total_fine_weight = ?, updated_at = NOW() WHERE id = ?',
                        [ratePerGram, finalTotal, newFineWeight, product.id]
                    );

                    // Update product options sell_price to reflect product total
                    await connection.execute(
                        'UPDATE product_options SET sell_price = ?, updated_at = NOW() WHERE product_id = ?',
                        [finalTotal, product.id]
                    );

                    updatedCount++;
                    updateResults.push({
                        productId: product.id,
                        productName: product.item_name,
                        oldTotal: product.total_rs,
                        newTotal: finalTotal,
                        oldFineWeight: product.total_fine_weight,
                        newFineWeight,
                        ratePerGram
                    });
                } else {
                    updateResults.push({ productId: product.id, productName: product.item_name, error: priceCalculation.error });
                }
            } catch (error) {
                console.error(`Error updating product ${product.id}:`, error);
                updateResults.push({ productId: product.id, productName: product.item_name, error: error.message });
            }
        }

        await connection.commit();

        return {
            success: true,
            message: `Successfully updated ${updatedCount} products`,
            updatedCount,
            results: updateResults
        };

    } catch (error) {
        await connection.rollback();
        console.error('Error in auto-update product prices:', error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Get products that will be affected by metal rate changes
 */
const getAffectedProducts = async (req, res) => {
    try {
        const { metal_type_id, purity_id } = req.query;

        if (!metal_type_id) {
            return res.status(400).json({
                success: false,
                message: 'Metal type ID is required'
            });
        }

        let query = `
            SELECT 
                p.id, p.item_name, p.sku, p.gross_weight, p.less_weight, p.total_rs, p.total_fine_weight,
                mt.name as metal_name, mp.purity_name, mr.rate_per_gram
            FROM products p
            JOIN product_options po ON p.id = po.product_id
            LEFT JOIN metal_types mt ON po.metal_id = mt.id
            LEFT JOIN metal_purities mp ON (mp.metal_type_id = po.metal_id AND (UPPER(mp.purity_name) = UPPER(po.metal_purity) OR ROUND(mp.tunch_value) = po.metal_purity OR ROUND(mp.purity_value) = po.metal_purity))
            LEFT JOIN metal_rates mr ON (mr.metal_type_id = po.metal_id AND mr.purity_id = mp.id AND mr.is_live = 1)
            WHERE po.metal_id = ?
        `;

        const params = [metal_type_id];

        if (purity_id) {
            query += ' AND mp.id = ?';
            params.push(purity_id);
        }

        query += ' GROUP BY p.id ORDER BY p.created_at DESC';

        const [products] = await db.execute(query, params);

        res.json({
            success: true,
            data: products,
            count: products.length
        });

    } catch (error) {
        console.error('Error getting affected products:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Calculate price for a specific product
 */
const calculateProductPriceEndpoint = async (req, res) => {
    try {
        const {
            metal_type_id,
            purity_id,
            gross_weight,
            less_weight = 0,
            additional_weight = 0,
            tunch = 0,
            wastage = 0,
            labour_type = 'Wt',
            labour_value = 0,
            other_charges = 0
        } = req.body;

        if (!metal_type_id || !purity_id || !gross_weight) {
            return res.status(400).json({
                success: false,
                message: 'Metal type ID, purity ID, and gross weight are required'
            });
        }

        const result = await calculateProductPrice(
            metal_type_id,
            purity_id,
            gross_weight,
            less_weight,
            additional_weight,
            tunch,
            wastage,
            labour_type,
            labour_value,
            other_charges
        );

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        console.error('Error calculating product price:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Trigger auto-update for products when metal rates change
 */
const triggerProductPriceUpdate = async (req, res) => {
    try {
        const { metal_type_id, purity_id } = req.body;

        if (!metal_type_id) {
            return res.status(400).json({
                success: false,
                message: 'Metal type ID is required'
            });
        }

        const result = await autoUpdateProductPrices(metal_type_id, purity_id);

        res.json(result);

    } catch (error) {
        console.error('Error triggering product price update:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get price calculation history for a product
 */
const getProductPriceHistory = async (req, res) => {
    try {
        const { product_id } = req.params;

        const [history] = await db.execute(`
            SELECT ph.*, mt.name as metal_name, mp.purity_name
            FROM product_price_history ph
            LEFT JOIN metal_types mt ON ph.metal_type_id = mt.id
            LEFT JOIN metal_purities mp ON ph.purity_id = mp.id
            WHERE ph.product_id = ?
            ORDER BY ph.created_at DESC
            LIMIT 50
        `, [product_id]);

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Error getting product price history:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Log price calculation for audit trail
 */
const logPriceCalculation = async (productId, metalTypeId, purityId, oldPrice, newPrice, oldFineWeight, newFineWeight, reason = 'Metal rate update') => {
    try {
        await db.execute(`
            INSERT INTO product_price_history 
            (product_id, metal_type_id, purity_id, old_price, new_price, old_fine_weight, new_fine_weight, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [productId, metalTypeId, purityId, oldPrice, newPrice, oldFineWeight, newFineWeight, reason]);

    } catch (error) {
        console.error('Error logging price calculation:', error);
    }
};

module.exports = {
    calculateProductPrice,
    autoUpdateProductPrices,
    getAffectedProducts,
    calculateProductPriceEndpoint,
    triggerProductPriceUpdate,
    getProductPriceHistory,
    logPriceCalculation
};
