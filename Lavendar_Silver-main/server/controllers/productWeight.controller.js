const db = require('../config/db');

// Get product weight details
const getProductWeightDetails = async (req, res) => {
    try {
        const { product_id } = req.params;

        const [weightDetails] = await db.execute(
            'SELECT * FROM product_weight_details WHERE product_id = ?',
            [product_id]
        );

        if (weightDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product weight details not found'
            });
        }

        res.json({
            success: true,
            data: weightDetails[0]
        });
    } catch (error) {
        console.error('Error fetching product weight details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product weight details'
        });
    }
};

// Create or update product weight details
const createOrUpdateProductWeightDetails = async (req, res) => {
    try {
        const { product_id } = req.params;
        const {
            gross_weight,
            stone_weight,
            stone_pieces,
            stone_value,
            purchase_price,
            purchase_sell,
            actual_sell,
            sell_price
        } = req.body;

        // Calculate net weight
        const net_weight = (parseFloat(gross_weight) || 0) - (parseFloat(stone_weight) || 0);

        // Check if weight details already exist
        const [existing] = await db.execute(
            'SELECT * FROM product_weight_details WHERE product_id = ?',
            [product_id]
        );

        if (existing.length > 0) {
            // Update existing
            await db.execute(`
                UPDATE product_weight_details 
                SET gross_weight = ?, stone_weight = ?, stone_pieces = ?, stone_value = ?,
                    purchase_price = ?, purchase_sell = ?, actual_sell = ?, sell_price = ?, net_weight = ?
                WHERE product_id = ?
            `, [
                gross_weight, stone_weight, stone_pieces, stone_value,
                purchase_price, purchase_sell, actual_sell, sell_price, net_weight, product_id
            ]);
        } else {
            // Create new
            await db.execute(`
                INSERT INTO product_weight_details 
                (product_id, gross_weight, stone_weight, stone_pieces, stone_value,
                 purchase_price, purchase_sell, actual_sell, sell_price, net_weight)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                product_id, gross_weight, stone_weight, stone_pieces, stone_value,
                purchase_price, purchase_sell, actual_sell, sell_price, net_weight
            ]);
        }

        // Get updated data
        const [updated] = await db.execute(
            'SELECT * FROM product_weight_details WHERE product_id = ?',
            [product_id]
        );

        res.json({
            success: true,
            message: 'Product weight details saved successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error saving product weight details:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving product weight details'
        });
    }
};

// Delete product weight details
const deleteProductWeightDetails = async (req, res) => {
    try {
        const { product_id } = req.params;

        const [existing] = await db.execute(
            'SELECT * FROM product_weight_details WHERE product_id = ?',
            [product_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product weight details not found'
            });
        }

        await db.execute(
            'DELETE FROM product_weight_details WHERE product_id = ?',
            [product_id]
        );

        res.json({
            success: true,
            message: 'Product weight details deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product weight details:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product weight details'
        });
    }
};

// Get product stones
const getProductStones = async (req, res) => {
    try {
        const { product_id } = req.params;

        const [stones] = await db.execute(
            'SELECT * FROM product_stones WHERE product_id = ? ORDER BY created_at ASC',
            [product_id]
        );

        res.json({
            success: true,
            data: stones
        });
    } catch (error) {
        console.error('Error fetching product stones:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product stones'
        });
    }
};

// Add product stone
const addProductStone = async (req, res) => {
    try {
        const { product_id } = req.params;
        const {
            stone_type,
            stone_name,
            stone_weight,
            stone_count,
            stone_quality,
            stone_color,
            stone_clarity,
            stone_cut,
            stone_value
        } = req.body;

        if (!stone_type || !stone_name) {
            return res.status(400).json({
                success: false,
                message: 'Stone type and name are required'
            });
        }

        const [result] = await db.execute(`
            INSERT INTO product_stones 
            (product_id, stone_type, stone_name, stone_weight, stone_count, 
             stone_quality, stone_color, stone_clarity, stone_cut, stone_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            product_id, stone_type, stone_name, stone_weight, stone_count,
            stone_quality, stone_color, stone_clarity, stone_cut, stone_value
        ]);

        const [newStone] = await db.execute(
            'SELECT * FROM product_stones WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Stone added successfully',
            data: newStone[0]
        });
    } catch (error) {
        console.error('Error adding product stone:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product stone'
        });
    }
};

// Update product stone
const updateProductStone = async (req, res) => {
    try {
        const { stone_id } = req.params;
        const {
            stone_type,
            stone_name,
            stone_weight,
            stone_count,
            stone_quality,
            stone_color,
            stone_clarity,
            stone_cut,
            stone_value
        } = req.body;

        const [existing] = await db.execute(
            'SELECT * FROM product_stones WHERE id = ?',
            [stone_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stone not found'
            });
        }

        await db.execute(`
            UPDATE product_stones 
            SET stone_type = ?, stone_name = ?, stone_weight = ?, stone_count = ?,
                stone_quality = ?, stone_color = ?, stone_clarity = ?, stone_cut = ?, stone_value = ?
            WHERE id = ?
        `, [
            stone_type, stone_name, stone_weight, stone_count,
            stone_quality, stone_color, stone_clarity, stone_cut, stone_value, stone_id
        ]);

        const [updated] = await db.execute(
            'SELECT * FROM product_stones WHERE id = ?',
            [stone_id]
        );

        res.json({
            success: true,
            message: 'Stone updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating product stone:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product stone'
        });
    }
};

// Delete product stone
const deleteProductStone = async (req, res) => {
    try {
        const { stone_id } = req.params;

        const [existing] = await db.execute(
            'SELECT * FROM product_stones WHERE id = ?',
            [stone_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stone not found'
            });
        }

        await db.execute('DELETE FROM product_stones WHERE id = ?', [stone_id]);

        res.json({
            success: true,
            message: 'Stone deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product stone:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product stone'
        });
    }
};

module.exports = {
    getProductWeightDetails,
    createOrUpdateProductWeightDetails,
    deleteProductWeightDetails,
    getProductStones,
    addProductStone,
    updateProductStone,
    deleteProductStone
}; 