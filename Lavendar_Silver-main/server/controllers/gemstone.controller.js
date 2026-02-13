const db = require('../config/db');

// Get all gemstones
const getAllGemstones = async (req, res) => {
    try {
        const [gemstones] = await db.execute(`
            SELECT * FROM gemstones 
            WHERE is_active = TRUE 
            ORDER BY sort_order ASC, name ASC
        `);

        res.json({
            success: true,
            data: gemstones
        });
    } catch (error) {
        console.error('Error fetching gemstones:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gemstones'
        });
    }
};

// Get gemstone by ID
const getGemstoneById = async (req, res) => {
    try {
        const { id } = req.params;
        const [gemstones] = await db.execute(
            'SELECT * FROM gemstones WHERE id = ?',
            [id]
        );

        if (gemstones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        res.json({
            success: true,
            data: gemstones[0]
        });
    } catch (error) {
        console.error('Error fetching gemstone:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gemstone'
        });
    }
};

// Create new gemstone
const createGemstone = async (req, res) => {
    try {
        const { name, type, description, sort_order } = req.body;

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name and type are required'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO gemstones (name, type, description, sort_order) VALUES (?, ?, ?, ?)',
            [name, type, description || null, sort_order || 0]
        );

        const [newGemstone] = await db.execute(
            'SELECT * FROM gemstones WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Gemstone created successfully',
            data: newGemstone[0]
        });
    } catch (error) {
        console.error('Error creating gemstone:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating gemstone'
        });
    }
};

// Update gemstone
const updateGemstone = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, description, sort_order, is_active } = req.body;

        const [existing] = await db.execute(
            'SELECT * FROM gemstones WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        await db.execute(
            'UPDATE gemstones SET name = ?, type = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [name, type, description, sort_order, is_active, id]
        );

        const [updated] = await db.execute(
            'SELECT * FROM gemstones WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Gemstone updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating gemstone:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating gemstone'
        });
    }
};

// Delete gemstone
const deleteGemstone = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute(
            'SELECT * FROM gemstones WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        // Check if gemstone is being used in products
        const [usedInProducts] = await db.execute(
            'SELECT COUNT(*) as count FROM product_stones WHERE stone_name = ?',
            [existing[0].name]
        );

        if (usedInProducts[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete gemstone as it is being used in products'
            });
        }

        await db.execute('DELETE FROM gemstones WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Gemstone deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting gemstone:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting gemstone'
        });
    }
};

module.exports = {
    getAllGemstones,
    getGemstoneById,
    createGemstone,
    updateGemstone,
    deleteGemstone
}; 