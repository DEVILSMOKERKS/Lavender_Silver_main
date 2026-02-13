const db = require('../config/db');

// Get current price for a metal type (24K for Gold, highest purity for Silver)
const getCurrentPriceForMetal = async (req, res) => {
    try {
        const { metal_type } = req.params;

        if (!metal_type || !['Gold', 'Silver'].includes(metal_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid metal type. Must be Gold or Silver'
            });
        }

        let query;
        if (metal_type === 'Gold') {
            // Get 24K Gold rate
            query = `
                SELECT 
                    mr.rate_per_10g,
                    mr.rate_per_gram,
                    mp.purity_name
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mt.name = 'Gold' AND mp.purity_name = '24K' AND mr.is_live = 1
                ORDER BY mr.updated_at DESC
                LIMIT 1
            `;
        } else {
            // Get highest purity Silver rate
            query = `
                SELECT 
                    mr.rate_per_10g,
                    mr.rate_per_gram,
                    mp.purity_name
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mt.name = 'Silver' AND mr.is_live = 1
                ORDER BY mp.purity_value DESC, mr.updated_at DESC
                LIMIT 1
            `;
        }

        const [rows] = await db.execute(query);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `${metal_type} rates not found. Please update rates in admin panel.`
            });
        }

        res.json({
            success: true,
            data: {
                rate_per_10g: parseFloat(rows[0].rate_per_10g) || 0,
                rate_per_gram: parseFloat(rows[0].rate_per_gram) || 0,
                purity: rows[0].purity_name
            }
        });
    } catch (error) {
        console.error('Error fetching current price:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching current price',
            error: error.message
        });
    }
};

// Get all predictions (public - for frontend)
const getAllPredictions = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                id,
                metal_type,
                current_price,
                predicted_price,
                price_change,
                market_confidence,
                forecast_period,
                market_analysis,
                recommend_buy,
                is_active,
                created_at,
                updated_at
            FROM metal_predictions
            WHERE is_active = 1
            ORDER BY metal_type, updated_at DESC
        `);

        // Format data for frontend
        const predictions = {
            gold: null,
            silver: null,
            lastUpdated: null,
            source: 'database'
        };

        rows.forEach(row => {
            const prediction = {
                currentPrice: parseFloat(row.current_price) || 0,
                predictedPrice: parseFloat(row.predicted_price) || 0,
                priceChange: parseFloat(row.price_change) || 0,
                confidence: row.market_confidence || 65,
                timeframe: row.forecast_period || '24 hours',
                recommendBuy: row.recommend_buy && row.recommend_buy.trim() ? true : false,
                recommendBuyText: row.recommend_buy || '',
                marketAnalysis: row.market_analysis || ''
            };

            if (row.metal_type === 'Gold') {
                predictions.gold = prediction;
            } else if (row.metal_type === 'Silver') {
                predictions.silver = prediction;
            }

            if (!predictions.lastUpdated || new Date(row.updated_at) > new Date(predictions.lastUpdated)) {
                predictions.lastUpdated = row.updated_at;
            }
        });

        res.json({
            success: true,
            data: predictions
        });
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching predictions',
            error: error.message
        });
    }
};

// Get all predictions (admin - with inactive)
const getAllPredictionsAdmin = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                id,
                metal_type,
                current_price,
                predicted_price,
                price_change,
                market_confidence,
                forecast_period,
                market_analysis,
                recommend_buy,
                is_active,
                created_at,
                updated_at
            FROM metal_predictions
            ORDER BY metal_type, updated_at DESC
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching predictions',
            error: error.message
        });
    }
};

// Get single prediction by ID
const getPredictionById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(
            'SELECT * FROM metal_predictions WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Prediction not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching prediction:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching prediction',
            error: error.message
        });
    }
};

// Create new prediction
const createPrediction = async (req, res) => {
    try {
        const {
            metal_type,
            current_price,
            predicted_price,
            price_change,
            market_confidence,
            forecast_period,
            market_analysis,
            recommend_buy,
            is_active
        } = req.body;

        // Validation
        if (!metal_type || !current_price || !predicted_price) {
            return res.status(400).json({
                success: false,
                message: 'Metal type, current price, and predicted price are required'
            });
        }

        if (!['Gold', 'Silver'].includes(metal_type)) {
            return res.status(400).json({
                success: false,
                message: 'Metal type must be Gold or Silver'
            });
        }

        // Calculate price_change if not provided
        let calculatedPriceChange = price_change;
        if (!calculatedPriceChange && current_price && predicted_price) {
            calculatedPriceChange = ((parseFloat(predicted_price) - parseFloat(current_price)) / parseFloat(current_price)) * 100;
        }

        // Deactivate old prediction for this metal type if new one is active
        if (is_active !== 0) {
            await db.execute(
                'UPDATE metal_predictions SET is_active = 0 WHERE metal_type = ? AND is_active = 1',
                [metal_type]
            );
        }

        // Insert new prediction
        // recommend_buy is now TEXT, so store the text value directly
        const recommendBuyText = typeof recommend_buy === 'string' ? recommend_buy : (recommend_buy ? 'Yes' : '');
        
        const [result] = await db.execute(
            `INSERT INTO metal_predictions 
            (metal_type, current_price, predicted_price, price_change, market_confidence, 
             forecast_period, market_analysis, recommend_buy, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                metal_type,
                current_price,
                predicted_price,
                calculatedPriceChange || 0,
                market_confidence || 65,
                forecast_period || '24 hours',
                market_analysis || null,
                recommendBuyText || null,
                is_active !== undefined ? is_active : 1
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Prediction created successfully',
            data: {
                id: result.insertId,
                ...req.body
            }
        });
    } catch (error) {
        console.error('Error creating prediction:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating prediction',
            error: error.message
        });
    }
};

// Update prediction
const updatePrediction = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            metal_type,
            current_price,
            predicted_price,
            price_change,
            market_confidence,
            forecast_period,
            market_analysis,
            recommend_buy,
            is_active
        } = req.body;

        // Check if prediction exists
        const [existing] = await db.execute(
            'SELECT * FROM metal_predictions WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Prediction not found'
            });
        }

        // Calculate price_change if not provided
        let calculatedPriceChange = price_change;
        if (!calculatedPriceChange && current_price && predicted_price) {
            calculatedPriceChange = ((parseFloat(predicted_price) - parseFloat(current_price)) / parseFloat(current_price)) * 100;
        }

        // If activating this prediction, deactivate others of same metal type
        if (is_active === 1 && existing[0].is_active === 0) {
            await db.execute(
                'UPDATE metal_predictions SET is_active = 0 WHERE metal_type = ? AND id != ? AND is_active = 1',
                [existing[0].metal_type, id]
            );
        }

        // Update prediction
        // recommend_buy is now TEXT, so store the text value directly
        let recommendBuyText = existing[0].recommend_buy || null;
        if (recommend_buy !== undefined) {
            recommendBuyText = typeof recommend_buy === 'string' ? recommend_buy : (recommend_buy ? 'Yes' : '');
        }
        
        await db.execute(
            `UPDATE metal_predictions 
            SET metal_type = ?, current_price = ?, predicted_price = ?, price_change = ?, 
                market_confidence = ?, forecast_period = ?, market_analysis = ?, 
                recommend_buy = ?, is_active = ?
            WHERE id = ?`,
            [
                metal_type || existing[0].metal_type,
                current_price !== undefined ? current_price : existing[0].current_price,
                predicted_price !== undefined ? predicted_price : existing[0].predicted_price,
                calculatedPriceChange !== undefined ? calculatedPriceChange : existing[0].price_change,
                market_confidence !== undefined ? market_confidence : existing[0].market_confidence,
                forecast_period || existing[0].forecast_period,
                market_analysis !== undefined ? market_analysis : existing[0].market_analysis,
                recommendBuyText,
                is_active !== undefined ? is_active : existing[0].is_active,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Prediction updated successfully'
        });
    } catch (error) {
        console.error('Error updating prediction:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating prediction',
            error: error.message
        });
    }
};

// Delete prediction
const deletePrediction = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM metal_predictions WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Prediction not found'
            });
        }

        res.json({
            success: true,
            message: 'Prediction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting prediction:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting prediction',
            error: error.message
        });
    }
};

module.exports = {
    getCurrentPriceForMetal,
    getAllPredictions,
    getAllPredictionsAdmin,
    getPredictionById,
    createPrediction,
    updatePrediction,
    deletePrediction
};

