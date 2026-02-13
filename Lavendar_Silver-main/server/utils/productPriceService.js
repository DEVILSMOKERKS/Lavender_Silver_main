const db = require('../config/db');
const { calculateProductPrice, logPriceCalculation } = require('../controllers/productPriceCalculation.controller');

// =======================================
// PRODUCT PRICE SERVICE UTILITIES
// =======================================

/**
 * Service class for handling product price calculations
 */
class ProductPriceService {

    /**
     * Calculate price for a product with given parameters
     * @param {Object} productData - Product data object
     * @returns {Object} Calculation result
     */
    static async calculatePrice(productData) {
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
        } = productData;

        return await calculateProductPrice(
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
    }

    /**
     * Get current metal rate for a specific metal type and purity
     * @param {number} metalTypeId - Metal type ID
     * @param {number} purityId - Purity ID
     * @returns {Object} Metal rate data
     */
    static async getCurrentMetalRate(metalTypeId, purityId) {
        try {
            const [rates] = await db.execute(`
                SELECT 
                    mr.rate_per_gram,
                    mr.rate_per_10g,
                    mr.source,
                    mr.updated_by,
                    mr.created_at,
                    mt.name as metal_name,
                    mt.symbol as metal_symbol,
                    mp.purity_name,
                    mp.purity_value,
                    mp.tunch_value
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mr.metal_type_id = ? AND mr.purity_id = ? AND mr.is_live = 1
                ORDER BY mr.created_at DESC
                LIMIT 1
            `, [metalTypeId, purityId]);

            return rates.length > 0 ? rates[0] : null;
        } catch (error) {
            console.error('Error getting current metal rate:', error);
            throw error;
        }
    }

    /**
     * Validate product price calculation parameters
     * @param {Object} params - Calculation parameters
     * @returns {Object} Validation result
     */
    static validateCalculationParams(params) {
        const errors = [];

        if (!params.metal_type_id) {
            errors.push('Metal type ID is required');
        }

        if (!params.purity_id) {
            errors.push('Purity ID is required');
        }

        if (!params.gross_weight || parseFloat(params.gross_weight) <= 0) {
            errors.push('Valid gross weight is required');
        }

        if (params.less_weight && parseFloat(params.less_weight) < 0) {
            errors.push('Less weight cannot be negative');
        }

        if (params.additional_weight && parseFloat(params.additional_weight) < 0) {
            errors.push('Additional weight cannot be negative');
        }

        if (params.tunch && (parseFloat(params.tunch) < 0 || parseFloat(params.tunch) > 100)) {
            errors.push('Purity must be between 0 and 100');
        }

        if (params.wastage && (parseFloat(params.wastage) < 0 || parseFloat(params.wastage) > 100)) {
            errors.push('Wastage must be between 0 and 100');
        }

        if (params.labour_value && parseFloat(params.labour_value) < 0) {
            errors.push('Labour value cannot be negative');
        }

        if (params.other_charges && parseFloat(params.other_charges) < 0) {
            errors.push('Other charges cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format price calculation result for display
     * @param {Object} calculationResult - Raw calculation result
     * @returns {Object} Formatted result
     */
    static formatCalculationResult(calculationResult) {
        if (!calculationResult.success) {
            return calculationResult;
        }

        const data = calculationResult.data;
        return {
            success: true,
            data: {
                ...data,
                formattedBreakdown: {
                    metalValue: `₹${data.metalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    labourCost: `₹${data.labourCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    otherCharges: `₹${data.otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    total: `₹${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    fineWeight: `${data.fineWeight.toFixed(3)}g`,
                    ratePerGram: `₹${data.ratePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g`
                },
                calculationSummary: {
                    metalType: data.metalName,
                    purity: data.purityName,
                    grossWeight: `${data.grossWeight}g`,
                    netWeight: `${data.netWeight}g`,
                    fineWeight: `${data.fineWeight}g`,
                    labourType: data.labourType,
                    labourValue: data.labourValue
                }
            }
        };
    }

    /**
     * Compare two price calculations and return the difference
     * @param {Object} oldCalculation - Old calculation result
     * @param {Object} newCalculation - New calculation result
     * @returns {Object} Comparison result
     */
    static compareCalculations(oldCalculation, newCalculation) {
        if (!oldCalculation.success || !newCalculation.success) {
            return {
                success: false,
                error: 'Both calculations must be successful for comparison'
            };
        }

        const oldData = oldCalculation.data;
        const newData = newCalculation.data;

        const priceDifference = newData.total - oldData.total;
        const priceChangePercentage = oldData.total > 0 ? (priceDifference / oldData.total) * 100 : 0;

        const fineWeightDifference = newData.fineWeight - oldData.fineWeight;
        const metalValueDifference = newData.metalValue - oldData.metalValue;

        return {
            success: true,
            comparison: {
                price: {
                    old: oldData.total,
                    new: newData.total,
                    difference: priceDifference,
                    changePercentage: priceChangePercentage,
                    isIncrease: priceDifference > 0,
                    isDecrease: priceDifference < 0
                },
                fineWeight: {
                    old: oldData.fineWeight,
                    new: newData.fineWeight,
                    difference: fineWeightDifference
                },
                metalValue: {
                    old: oldData.metalValue,
                    new: newData.metalValue,
                    difference: metalValueDifference
                },
                rate: {
                    old: oldData.ratePerGram,
                    new: newData.ratePerGram,
                    difference: newData.ratePerGram - oldData.ratePerGram
                }
            },
            summary: {
                hasPriceChange: priceDifference !== 0,
                hasWeightChange: fineWeightDifference !== 0,
                hasRateChange: newData.ratePerGram !== oldData.ratePerGram,
                significantChange: Math.abs(priceChangePercentage) > 5 // 5% threshold
            }
        };
    }

    /**
     * Get price calculation statistics for a metal type
     * @param {number} metalTypeId - Metal type ID
     * @param {number} days - Number of days to look back
     * @returns {Object} Statistics
     */
    static async getPriceStatistics(metalTypeId, days = 30) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_calculations,
                    AVG(new_price - old_price) as avg_price_change,
                    MAX(new_price - old_price) as max_price_increase,
                    MIN(new_price - old_price) as max_price_decrease,
                    AVG(((new_price - old_price) / old_price) * 100) as avg_percentage_change
                FROM product_price_history
                WHERE metal_type_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                AND old_price > 0
            `, [metalTypeId, days]);

            return {
                success: true,
                data: stats[0] || {
                    total_calculations: 0,
                    avg_price_change: 0,
                    max_price_increase: 0,
                    max_price_decrease: 0,
                    avg_percentage_change: 0
                }
            };
        } catch (error) {
            console.error('Error getting price statistics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = ProductPriceService;
