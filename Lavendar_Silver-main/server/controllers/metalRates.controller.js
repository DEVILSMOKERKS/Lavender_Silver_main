const db = require('../config/db');
const axios = require('axios');
const { autoUpdateProductPrices, logPriceCalculation } = require('./productPriceCalculation.controller');

// =======================================
// METAL RATES CONTROLLER
// =======================================

// Get all metal types
const getMetalTypes = async (req, res) => {
    try {
        const [metalTypes] = await db.execute(
            'SELECT * FROM metal_types WHERE is_active = 1 ORDER BY sort_order, name'
        );
        res.json({ success: true, data: metalTypes });
    } catch (error) {
        console.error('Error getting metal types:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Create new metal type
const createMetalType = async (req, res) => {
    try {
        const { name, symbol, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Metal type name is required'
            });
        }

        // Check if metal type already exists
        const [existing] = await db.execute(
            'SELECT id FROM metal_types WHERE name = ?',
            [name]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Metal type already exists'
            });
        }

        // Get max sort order
        const [maxOrder] = await db.execute(
            'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM metal_types'
        );
        const sortOrder = maxOrder[0].max_order + 1;

        const [result] = await db.execute(
            'INSERT INTO metal_types (name, symbol, description, sort_order) VALUES (?, ?, ?, ?)',
            [name, symbol || null, description || null, sortOrder]
        );

        const [newMetalType] = await db.execute(
            'SELECT * FROM metal_types WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Metal type created successfully',
            data: newMetalType[0]
        });
    } catch (error) {
        console.error('Error creating metal type:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating metal type'
        });
    }
};

// Delete metal type
const deleteMetalType = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if metal type exists
        const [existing] = await db.execute(
            'SELECT * FROM metal_types WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Metal type not found'
            });
        }

        // Check if metal type is being used in rates
        const [usedInRates] = await db.execute(
            'SELECT COUNT(*) as count FROM metal_rates WHERE metal_type_id = ?',
            [id]
        );

        if (usedInRates[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete metal type as it is being used in rates'
            });
        }

        // Check if metal type is being used in products
        const [usedInProducts] = await db.execute(
            'SELECT COUNT(*) as count FROM product_options WHERE metal_type_id = ?',
            [id]
        );

        if (usedInProducts[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete metal type as it is being used in products'
            });
        }

        await db.execute('DELETE FROM metal_types WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Metal type deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting metal type:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting metal type'
        });
    }
};

// Get metal purities by metal type
const getMetalPurities = async (req, res) => {
    try {
        const { metal_type_id } = req.params;
        const [purities] = await db.execute(
            'SELECT * FROM metal_purities WHERE metal_type_id = ? AND is_active = 1 ORDER BY sort_order, purity_name',
            [metal_type_id]
        );
        res.json({ success: true, data: purities });
    } catch (error) {
        console.error('Error getting metal purities:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get current metal rates
const getCurrentRates = async (req, res) => {
    try {
        const [rates] = await db.execute(`
            SELECT 
                mr.id,
                mr.metal_type_id,
                mr.purity_id,
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.source,
                mr.updated_by,
                mr.is_live,
                mr.created_at,
                mr.updated_at,
                mt.name as metal_name,
                mt.symbol as metal_symbol,
                mp.purity_name,
                mp.purity_value,
                mp.tunch_value
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mr.is_live = 1
            ORDER BY mt.sort_order, mp.purity_value DESC
        `);
        res.json({ success: true, data: rates });
    } catch (error) {
        console.error('Error getting current rates:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get latest rates for popup
const getLatestRates = async (req, res) => {
    try {
        const [rates] = await db.execute(`
            SELECT 
                mr.id,
                mr.metal_type_id,
                mr.purity_id,
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.source,
                mr.updated_by,
                mr.is_live,
                mr.created_at,
                mr.updated_at,
                mt.name as metal_name,
                mt.symbol as metal_symbol,
                mp.purity_name,
                mp.purity_value,
                mp.tunch_value
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mr.is_live = 1
            ORDER BY mt.sort_order, mp.purity_value DESC
            LIMIT 6
        `);
        res.json({ success: true, data: rates });
    } catch (error) {
        console.error('Error getting latest rates:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update metal rate
const updateMetalRate = async (req, res) => {
    try {
        const { metal_type_id, purity_id, tunch_value, rate_per_gram, rate_per_10g, source, change_reason } = req.body;
        const updated_by = req.user?.name || 'Admin';

        // Validation
        if (!metal_type_id || !purity_id) {
            return res.status(400).json({
                success: false,
                message: 'Metal type ID and Purity ID are required'
            });
        }

        // Validate rate values
        const ratePerGram = parseFloat(rate_per_gram);
        const ratePer10g = parseFloat(rate_per_10g);

        if (isNaN(ratePerGram) && isNaN(ratePer10g)) {
            return res.status(400).json({
                success: false,
                message: 'Either rate_per_gram or rate_per_10g must be provided and valid'
            });
        }

        if (ratePerGram <= 0 && ratePer10g <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Rates must be greater than 0'
            });
        }

        // Calculate missing rate if one is provided
        let finalRatePerGram = ratePerGram;
        let finalRatePer10g = ratePer10g;

        if (!isNaN(ratePerGram) && ratePerGram > 0 && (isNaN(ratePer10g) || ratePer10g <= 0)) {
            finalRatePer10g = ratePerGram * 10;
        } else if (!isNaN(ratePer10g) && ratePer10g > 0 && (isNaN(ratePerGram) || ratePerGram <= 0)) {
            finalRatePerGram = ratePer10g / 10;
        }

        // Validate and set source (must be 'manual' or 'api' per ENUM constraint)
        const validSource = (source === 'manual' || source === 'api') ? source : 'manual';

        // Get current rate for comparison
        const [currentRate] = await db.execute(`
            SELECT 
                mr.id,
                mr.metal_type_id,
                mr.purity_id,
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.source,
                mr.updated_by,
                mr.is_live,
                mr.created_at,
                mr.updated_at,
                mt.name as metal_name,
                mt.symbol as metal_symbol,
                mp.purity_name,
                mp.purity_value,
                mp.tunch_value
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mr.metal_type_id = ? AND mr.purity_id = ? AND mr.is_live = 1
        `, [metal_type_id, purity_id]);

        // Calculate change percentage
        let change_percentage = 0;
        if (currentRate.length > 0 && currentRate[0].rate_per_gram && currentRate[0].rate_per_gram > 0) {
            const old_rate = parseFloat(currentRate[0].rate_per_gram);
            if (old_rate > 0) {
                change_percentage = ((finalRatePerGram - old_rate) / old_rate) * 100;
            }
        }

        // Get connection for transaction
        const connection = await db.getConnection();

        try {
            // Begin transaction
            await connection.beginTransaction();

            // Update tunch_value in metal_purities table if provided
            if (tunch_value !== undefined && tunch_value !== null && tunch_value !== '') {
                const tunchVal = parseFloat(tunch_value);
                if (!isNaN(tunchVal)) {
                    await connection.execute(
                        'UPDATE metal_purities SET tunch_value = ? WHERE id = ?',
                        [tunchVal, purity_id]
                    );
                }
            }

            // Update existing rate to not live
            await connection.execute(
                'UPDATE metal_rates SET is_live = 0 WHERE metal_type_id = ? AND purity_id = ?',
                [metal_type_id, purity_id]
            );

            // Insert new rate
            const [result] = await connection.execute(
                'INSERT INTO metal_rates (metal_type_id, purity_id, rate_per_gram, rate_per_10g, source, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
                [metal_type_id, purity_id, finalRatePerGram, finalRatePer10g, validSource, updated_by]
            );

            // Add to history
            if (currentRate.length > 0) {
                await connection.execute(
                    'INSERT INTO metal_rates_history (metal_type_id, purity_id, old_rate_per_gram, new_rate_per_gram, old_rate_per_10g, new_rate_per_10g, change_percentage, source, updated_by, change_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        metal_type_id, purity_id,
                        currentRate[0].rate_per_gram, finalRatePerGram,
                        currentRate[0].rate_per_10g, finalRatePer10g,
                        change_percentage, validSource, updated_by, change_reason || ''
                    ]
                );
            }

            await connection.commit();

            // Get updated rate
            const [newRate] = await db.execute(`
                SELECT 
                    mr.id,
                    mr.metal_type_id,
                    mr.purity_id,
                    mr.rate_per_gram,
                    mr.rate_per_10g,
                    mr.source,
                    mr.updated_by,
                    mr.is_live,
                    mr.created_at,
                    mr.updated_at,
                    mt.name as metal_name,
                    mt.symbol as metal_symbol,
                    mp.purity_name,
                    mp.purity_value,
                    mp.tunch_value
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mr.id = ?
            `, [result.insertId]);

            // Auto-update product prices in background (non-blocking)
            try {

                const updateResult = await autoUpdateProductPrices(metal_type_id, purity_id);


                // Log the update for audit trail
                if (updateResult.updatedCount > 0) {

                }
            } catch (updateError) {
                console.error('❌ Error auto-updating product prices:', updateError);
                // Don't fail the main request if auto-update fails
            }

            res.json({
                success: true,
                data: newRate[0],
                message: 'Rate updated successfully',
                productUpdateInfo: {
                    autoUpdateTriggered: true,
                    message: 'Product prices will be updated automatically'
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating metal rate:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Check if metal rate exists
const checkMetalRateExists = async (req, res) => {
    try {
        const { metal_type_id, purity_id } = req.params;
        const [existingRate] = await db.execute(`
            SELECT 
                mr.id,
                mr.metal_type_id,
                mr.purity_id,
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.source,
                mr.updated_by,
                mr.is_live,
                mr.created_at,
                mr.updated_at,
                mt.name as metal_name,
                mt.symbol as metal_symbol,
                mp.purity_name,
                mp.purity_value,
                mp.tunch_value
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mr.metal_type_id = ? AND mr.purity_id = ? AND mr.is_live = 1
        `, [metal_type_id, purity_id]);
        res.json({
            success: true,
            exists: existingRate.length > 0,
            data: existingRate[0] || null
        });
    } catch (error) {
        console.error('Error checking metal rate exists:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Create new metal rate
const createMetalRate = async (req, res) => {
    try {
        const {
            metal_type_name,
            metal_type_symbol,
            purity_name,
            purity_value,
            tunch_value,
            rate_per_gram,
            rate_per_10g,
            source,
            change_reason
        } = req.body;
        const created_by = req.user?.name || 'Admin';

        // Validate and set source (must be 'manual' or 'api' per ENUM constraint)
        const validSource = (source === 'manual' || source === 'api') ? source : 'manual';

        // Get connection for transaction
        const connection = await db.getConnection();

        try {
            // Begin transaction
            await connection.beginTransaction();

            // Check if metal type already exists
            const [existingMetalType] = await connection.execute(
                'SELECT * FROM metal_types WHERE name = ? OR symbol = ?',
                [metal_type_name, metal_type_symbol]
            );

            let metal_type_id;
            if (existingMetalType.length > 0) {
                metal_type_id = existingMetalType[0].id;
            } else {
                // Create new metal type
                const [metalTypeResult] = await connection.execute(
                    'INSERT INTO metal_types (name, symbol, is_active, sort_order) VALUES (?, ?, 1, 999)',
                    [metal_type_name, metal_type_symbol]
                );
                metal_type_id = metalTypeResult.insertId;
            }

            // Check if purity already exists for this metal type
            const [existingPurity] = await connection.execute(
                'SELECT * FROM metal_purities WHERE metal_type_id = ? AND purity_name = ?',
                [metal_type_id, purity_name]
            );

            let purity_id;
            if (existingPurity.length > 0) {
                purity_id = existingPurity[0].id;
            } else {
                // Create new purity
                const [purityResult] = await connection.execute(
                    'INSERT INTO metal_purities (metal_type_id, purity_name, purity_value, tunch_value, is_active, sort_order) VALUES (?, ?, ?, ?, 1, 999)',
                    [metal_type_id, purity_name, purity_value, tunch_value]
                );
                purity_id = purityResult.insertId;
            }

            // Check if rate already exists for this metal type and purity
            const [existingRate] = await connection.execute(`
                SELECT 
                    mr.id,
                    mr.metal_type_id,
                    mr.purity_id,
                    mr.rate_per_gram,
                    mr.rate_per_10g,
                    mr.source,
                    mr.updated_by,
                    mr.is_live,
                    mr.created_at,
                    mr.updated_at,
                    mt.name as metal_name,
                    mt.symbol as metal_symbol,
                    mp.purity_name,
                    mp.purity_value,
                    mp.tunch_value
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mr.metal_type_id = ? AND mr.purity_id = ? AND mr.is_live = 1
            `, [metal_type_id, purity_id]);

            if (existingRate.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                    success: false,
                    message: 'Rate already exists for this metal type and purity. Use update instead.'
                });
            }

            // Insert new rate
            const [result] = await connection.execute(
                'INSERT INTO metal_rates (metal_type_id, purity_id, rate_per_gram, rate_per_10g, source, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
                [metal_type_id, purity_id, rate_per_gram, rate_per_10g, validSource, created_by]
            );

            // Add to history as initial creation
            await connection.execute(
                'INSERT INTO metal_rates_history (metal_type_id, purity_id, old_rate_per_gram, new_rate_per_gram, old_rate_per_10g, new_rate_per_10g, change_percentage, source, updated_by, change_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    metal_type_id, purity_id,
                    0, rate_per_gram,  // No old rate for new creation
                    0, rate_per_10g,
                    0, validSource, created_by, change_reason || 'Initial rate creation'
                ]
            );

            await connection.commit();

            // Get created rate with metal type and purity details
            const [newRate] = await db.execute(`
                SELECT 
                    mr.id,
                    mr.metal_type_id,
                    mr.purity_id,
                    mr.rate_per_gram,
                    mr.rate_per_10g,
                    mr.source,
                    mr.updated_by,
                    mr.is_live,
                    mr.created_at,
                    mr.updated_at,
                    mt.name as metal_name,
                    mt.symbol as metal_symbol,
                    mp.purity_name,
                    mp.purity_value,
                    mp.tunch_value
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mr.id = ?
            `, [result.insertId]);

            res.json({
                success: true,
                data: newRate[0],
                message: 'Metal type, purity, and rate created successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating metal type and rate:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get rate history
const getRateHistory = async (req, res) => {
    try {
        const { metal_type_id, purity_id, page = 1, limit = 20 } = req.query;

        // Validate and convert parameters to integers
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT 
                mrh.id,
                mrh.metal_type_id,
                mrh.purity_id,
                mrh.old_rate_per_gram,
                mrh.new_rate_per_gram,
                mrh.old_rate_per_10g,
                mrh.new_rate_per_10g,
                mrh.change_percentage,
                mrh.source,
                mrh.updated_by,
                mrh.change_reason,
                mrh.created_at,
                mt.name as metal_name,
                mt.symbol as metal_symbol,
                mp.purity_name,
                mp.purity_value,
                mp.tunch_value
            FROM metal_rates_history mrh
            JOIN metal_types mt ON mrh.metal_type_id = mt.id
            JOIN metal_purities mp ON mrh.purity_id = mp.id
            WHERE 1=1
        `;
        const params = [];

        if (metal_type_id) {
            query += ' AND mrh.metal_type_id = ?';
            params.push(metal_type_id);
        }

        if (purity_id) {
            query += ' AND mrh.purity_id = ?';
            params.push(purity_id);
        }

        query += ` ORDER BY mrh.created_at DESC LIMIT ${parseInt(limitNum) || 20} OFFSET ${parseInt(offset) || 0}`;

        const [history] = await db.execute(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM metal_rates_history WHERE 1=1';
        const countParams = [];

        if (metal_type_id) {
            countQuery += ' AND metal_type_id = ?';
            countParams.push(metal_type_id);
        }

        if (purity_id) {
            countQuery += ' AND purity_id = ?';
            countParams.push(purity_id);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: history,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error getting rate history:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get API configuration
const getApiConfig = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Manual rate updates are enabled. No API sync configuration needed.',
            manual_updates: true,
            config: null
        });
    } catch (error) {
        console.error('Error getting API config:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting API configuration'
        });
    }
};

// Get rate statistics
const getRateStats = async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_rates,
                COUNT(CASE WHEN is_live = 1 THEN 1 END) as live_rates,
                MAX(updated_at) as last_update,
                COUNT(DISTINCT updated_by) as unique_updaters
            FROM metal_rates
        `);

        const [recentChanges] = await db.execute(`
            SELECT 
                COUNT(*) as changes_today
            FROM metal_rates_history 
            WHERE DATE(created_at) = CURDATE()
        `);

        res.json({
            success: true,
            data: {
                ...stats[0],
                ...recentChanges[0]
            }
        });
    } catch (error) {
        console.error('Error getting rate stats:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete metal rate
const deleteMetalRate = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted_by = req.user?.name || 'Admin';

        // Get connection for transaction
        const connection = await db.getConnection();

        try {
            // Begin transaction
            await connection.beginTransaction();

            // Get the rate details before deletion for history
            const [rateDetails] = await connection.execute(`
                SELECT 
                    mr.id,
                    mr.metal_type_id,
                    mr.purity_id,
                    mr.rate_per_gram,
                    mr.rate_per_10g,
                    mr.source,
                    mr.updated_by,
                    mr.is_live,
                    mr.created_at,
                    mr.updated_at,
                    mt.name as metal_name,
                    mt.symbol as metal_symbol,
                    mp.purity_name,
                    mp.purity_value,
                    mp.tunch_value
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mr.id = ?
            `, [id]);

            if (rateDetails.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: 'Rate not found'
                });
            }

            const rate = rateDetails[0];

            // Add to history as deletion
            await connection.execute(
                'INSERT INTO metal_rates_history (metal_type_id, purity_id, old_rate_per_gram, new_rate_per_gram, old_rate_per_10g, new_rate_per_10g, change_percentage, source, updated_by, change_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    rate.metal_type_id, rate.purity_id,
                    rate.rate_per_gram, 0,  // Set new rate to 0 for deletion
                    rate.rate_per_10g, 0,
                    -100, 'manual', deleted_by, 'Rate deleted'
                ]
            );

            // Delete the rate
            await connection.execute(
                'DELETE FROM metal_rates WHERE id = ?',
                [id]
            );

            // Check if this metal type has any other rates
            const [remainingRates] = await connection.execute(
                'SELECT COUNT(*) as count FROM metal_rates WHERE metal_type_id = ?',
                [rate.metal_type_id]
            );

            // If no rates left for this metal type, delete the metal type and its purities
            if (remainingRates[0].count === 0) {
                // Delete all purities for this metal type
                await connection.execute(
                    'DELETE FROM metal_purities WHERE metal_type_id = ?',
                    [rate.metal_type_id]
                );

                // Delete the metal type
                await connection.execute(
                    'DELETE FROM metal_types WHERE id = ?',
                    [rate.metal_type_id]
                );
            } else {
                // Check if this specific purity has any other rates
                const [remainingPurityRates] = await connection.execute(
                    'SELECT COUNT(*) as count FROM metal_rates WHERE metal_type_id = ? AND purity_id = ?',
                    [rate.metal_type_id, rate.purity_id]
                );

                // If no rates left for this purity, delete the purity
                if (remainingPurityRates[0].count === 0) {
                    await connection.execute(
                        'DELETE FROM metal_purities WHERE id = ?',
                        [rate.purity_id]
                    );
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'Rate deleted successfully',
                data: rate
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting metal rate:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Clean up orphaned metal types and purities
const cleanupOrphanedData = async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Delete metal types that have no rates
            await connection.execute(`
                DELETE mt FROM metal_types mt 
                LEFT JOIN metal_rates mr ON mt.id = mr.metal_type_id 
                WHERE mr.id IS NULL
            `);

            // Delete purities that have no rates
            await connection.execute(`
                DELETE mp FROM metal_purities mp 
                LEFT JOIN metal_rates mr ON mp.id = mr.purity_id 
                WHERE mr.id IS NULL
            `);

            await connection.commit();

            res.json({
                success: true,
                message: 'Orphaned data cleaned up successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error cleaning up orphaned data:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Fetch live metal prices from database (NO THIRD PARTY API)
const fetchLiveMetalPrices = async (req, res) => {
    try {
        // Get current rates from database (metal_rates table)
        // Get Gold current rate (24K)
        const [goldCurrentRate] = await db.execute(`
            SELECT 
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.updated_at,
                mt.name as metal_name,
                mp.purity_name
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mt.name = 'Gold' AND mp.purity_name = '24K' AND mr.is_live = 1
            ORDER BY mr.updated_at DESC
            LIMIT 1
        `);

        // Get Silver current rate (highest purity available)
        const [silverCurrentRate] = await db.execute(`
            SELECT 
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.updated_at,
                mt.name as metal_name,
                mp.purity_name
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mt.name = 'Silver' AND mr.is_live = 1
            ORDER BY mp.purity_value DESC, mr.updated_at DESC
            LIMIT 1
        `);

        // Check if we have current rates
        if (!goldCurrentRate || goldCurrentRate.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gold rates not found in database. Please update rates in admin panel.'
            });
        }

        if (!silverCurrentRate || silverCurrentRate.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Silver rates not found in database. Please update rates in admin panel.'
            });
        }

        const gold = {
            price_per_gram: parseFloat(goldCurrentRate[0].rate_per_gram) || 0,
            price_per_10g: parseFloat(goldCurrentRate[0].rate_per_10g) || 0,
            price_per_kg: parseFloat(goldCurrentRate[0].rate_per_gram) * 1000 || 0,
            currency: 'INR',
            metal: 'Gold',
            purity: goldCurrentRate[0].purity_name,
            last_updated: goldCurrentRate[0].updated_at
        };

        const silver = {
            price_per_gram: parseFloat(silverCurrentRate[0].rate_per_gram) || 0,
            price_per_10g: parseFloat(silverCurrentRate[0].rate_per_10g) || 0,
            price_per_kg: parseFloat(silverCurrentRate[0].rate_per_gram) * 1000 || 0,
            currency: 'INR',
            metal: 'Silver',
            purity: silverCurrentRate[0].purity_name,
            last_updated: silverCurrentRate[0].updated_at
        };

        const metalPrices = {
            gold: gold,
            silver: silver,
            timestamp: new Date().toISOString(),
            base_currency: 'INR',
            source: 'database'
        };

        res.json({
            success: true,
            data: metalPrices,
            cached: false,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error fetching live metal prices:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch metal prices. Please ensure metal rates are updated in the admin panel.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Helper function to calculate moving average
const calculateMovingAverage = (prices, period) => {
    if (prices.length < period) return null;
    const recentPrices = prices.slice(-period);
    const sum = recentPrices.reduce((acc, price) => acc + price, 0);
    return sum / period;
};

// Get exchange rates (proxy endpoint to avoid CORS)
const getExchangeRates = async (req, res) => {
    try {
        const baseCurrency = req.query.base || 'INR';
        const EXCHANGE_API_URL = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;

        const response = await axios.get(EXCHANGE_API_URL, {
            timeout: 10000 // 10 second timeout
        });

        res.json({
            success: true,
            data: {
                base: response.data.base,
                date: response.data.date,
                rates: response.data.rates || {}
            }
        });
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exchange rates',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Helper function to calculate linear regression for prediction
const calculateLinearRegression = (prices) => {
    if (prices.length < 2) return null;

    const n = prices.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    prices.forEach((price, index) => {
        const x = index + 1;
        const y = price;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value (n+1)
    const predictedValue = slope * (n + 1) + intercept;

    return {
        slope,
        intercept,
        predictedValue
    };
};

// Helper function to calculate volatility (standard deviation)
const calculateVolatility = (prices) => {
    if (prices.length < 2) return 0;

    const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Return as percentage of mean
    return (stdDev / mean) * 100;
};

// Helper function to calculate trend direction
const calculateTrend = (prices) => {
    if (prices.length < 2) return 0;

    const recent = prices.slice(-7); // Last 7 days
    const older = prices.slice(-14, -7); // Previous 7 days

    if (older.length === 0) {
        const first = recent[0];
        const last = recent[recent.length - 1];
        return ((last - first) / first) * 100;
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
};

// Get metal price predictions using actual algorithm
const getMetalPricePredictions = async (req, res) => {
    try {
        const [goldCurrentRate] = await db.execute(`
            SELECT 
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.updated_at
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mt.name = 'Gold' AND mp.purity_name = '24K' AND mr.is_live = 1
            ORDER BY mr.updated_at DESC
            LIMIT 1
        `);

        const [silverCurrentRate] = await db.execute(`
            SELECT 
                mr.rate_per_gram,
                mr.rate_per_10g,
                mr.updated_at
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mt.name = 'Silver' AND mr.is_live = 1
            ORDER BY mp.purity_value DESC, mr.updated_at DESC
            LIMIT 1
        `);

        if (!goldCurrentRate || goldCurrentRate.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gold rates not found in database. Please update rates in admin panel.'
            });
        }

        if (!silverCurrentRate || silverCurrentRate.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Silver rates not found in database. Please update rates in admin panel.'
            });
        }

        const gold = {
            price_per_gram: parseFloat(goldCurrentRate[0].rate_per_gram) || 0,
            price_per_10g: parseFloat(goldCurrentRate[0].rate_per_10g) || 0,
            price_per_kg: parseFloat(goldCurrentRate[0].rate_per_gram) * 1000 || 0
        };

        const silver = {
            price_per_gram: parseFloat(silverCurrentRate[0].rate_per_gram) || 0,
            price_per_10g: parseFloat(silverCurrentRate[0].rate_per_10g) || 0,
            price_per_kg: parseFloat(silverCurrentRate[0].rate_per_gram) * 1000 || 0
        };

        const [goldHistory] = await db.execute(`
            SELECT 
                mrh.new_rate_per_10g as rate,
                mrh.created_at
            FROM metal_rates_history mrh
            JOIN metal_types mt ON mrh.metal_type_id = mt.id
            JOIN metal_purities mp ON mrh.purity_id = mp.id
            WHERE mt.name = 'Gold' AND mp.purity_name = '24K'
            AND mrh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY mrh.created_at ASC
        `);

        const [silverHistory] = await db.execute(`
            SELECT 
                mrh.new_rate_per_10g as rate,
                mrh.created_at
            FROM metal_rates_history mrh
            JOIN metal_types mt ON mrh.metal_type_id = mt.id
            JOIN metal_purities mp ON mrh.purity_id = mp.id
            WHERE mt.name = 'Silver'
            AND mrh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY mrh.created_at ASC, mp.purity_value DESC
        `);

        const generatePrediction = (currentPrice, history, metalName) => {
            const historicalPrices = history.map(h => parseFloat(h.rate) || parseFloat(h.new_rate_per_10g) || 0).filter(p => p > 0);

            if (historicalPrices.length >= 7) {
                const ma7 = calculateMovingAverage(historicalPrices, 7);
                const ma14 = calculateMovingAverage(historicalPrices, 14);

                const regression = calculateLinearRegression(historicalPrices);

                const volatility = calculateVolatility(historicalPrices);

                const trend = calculateTrend(historicalPrices);

                let predictedPrice = currentPrice;

                if (regression && regression.predictedValue > 0) {
                    const regressionWeight = 0.6;
                    const maWeight = 0.3;
                    const currentWeight = 0.1;

                    predictedPrice = (regression.predictedValue * regressionWeight) +
                        (ma7 ? (ma7 * maWeight) : currentPrice * maWeight) +
                        (currentPrice * currentWeight);
                } else if (ma7) {
                    predictedPrice = (ma7 * 0.7) + (currentPrice * 0.3);
                }

                const minPrice = currentPrice * 0.9;
                const maxPrice = currentPrice * 1.1;
                predictedPrice = Math.max(minPrice, Math.min(maxPrice, predictedPrice));

                const priceChange = ((predictedPrice - currentPrice) / currentPrice) * 100;

                let confidence = 70;

                if (historicalPrices.length >= 14) confidence += 10;
                if (historicalPrices.length >= 21) confidence += 5;
                if (historicalPrices.length >= 30) confidence += 5;

                if (volatility < 2) confidence += 10;
                else if (volatility < 5) confidence += 5;
                else if (volatility > 10) confidence -= 10;
                else if (volatility > 15) confidence -= 15;

                confidence = Math.max(60, Math.min(95, confidence));

                const recommendBuy = trend > 0 && predictedPrice > currentPrice;

                return {
                    currentPrice: Math.round(currentPrice),
                    predictedPrice: Math.round(predictedPrice),
                    priceChange: Math.round(priceChange * 100) / 100,
                    confidence: Math.round(confidence),
                    timeframe: "24 hours",
                    recommendBuy: recommendBuy
                };
            } else {
                const trendPercent = 0.5 + (Math.random() * 1.5);
                const predictedPrice = currentPrice * (1 + trendPercent / 100);

                return {
                    currentPrice: Math.round(currentPrice),
                    predictedPrice: Math.round(predictedPrice),
                    priceChange: Math.round(trendPercent * 100) / 100,
                    confidence: 65,
                    timeframe: "24 hours",
                    recommendBuy: trendPercent > 0
                };
            }
        };

        const goldPrediction = generatePrediction(gold.price_per_10g, goldHistory, 'Gold');
        const silverPrediction = generatePrediction(silver.price_per_10g, silverHistory, 'Silver');

        const goldHistoricalPrices = goldHistory.map(h => parseFloat(h.rate) || parseFloat(h.new_rate_per_10g) || 0).filter(p => p > 0);
        const silverHistoricalPrices = silverHistory.map(h => parseFloat(h.rate) || parseFloat(h.new_rate_per_10g) || 0).filter(p => p > 0);
        const hasEnoughData = (goldHistoricalPrices.length >= 7 || silverHistoricalPrices.length >= 7);

        const predictions = {
            gold: goldPrediction,
            silver: silverPrediction,
            lastUpdated: new Date().toISOString(),
            source: hasEnoughData ? 'algorithm' : 'limited_data'
        };

        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        console.error('Error generating predictions:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to generate predictions. Please ensure metal rates are updated in the admin panel.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Delete rate history entry
const deleteRateHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM metal_rates_history WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'History entry not found'
            });
        }

        res.json({
            success: true,
            message: 'History entry deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting rate history:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getMetalTypes,
    createMetalType,
    deleteMetalType,
    getMetalPurities,
    getCurrentRates,
    getLatestRates,
    updateMetalRate,
    createMetalRate,
    checkMetalRateExists,
    getRateHistory,
    getApiConfig,
    getRateStats,
    deleteMetalRate,
    deleteRateHistory,
    cleanupOrphanedData,
    fetchLiveMetalPrices,
    getMetalPricePredictions,
    getExchangeRates
};