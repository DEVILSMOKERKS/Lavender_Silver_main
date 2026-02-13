const db = require('../config/db');

// Get all gemstones
exports.getAllGemstones = async (req, res) => {
    try {
        const query = 'SELECT * FROM gemstone_catalog ORDER BY name';
        const [gemstones] = await db.query(query);
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

// Get gemstones by type
exports.getGemstonesByType = async (req, res) => {
    try {
        const { type } = req.params;
        if (!['diamond', 'stone'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be "diamond" or "stone"'
            });
        }

        const query = 'SELECT * FROM gemstone_catalog WHERE type = ? ORDER BY name';
        const [gemstones] = await db.query(query, [type]);
        res.json({
            success: true,
            data: gemstones
        });
    } catch (error) {
        console.error('Error fetching gemstones by type:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gemstones by type'
        });
    }
};

// Get gemstone by ID
exports.getGemstoneById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM gemstone_catalog WHERE id = ?';
        const [rows] = await db.query(query, [id]);
        const gemstone = rows[0];

        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        res.json({
            success: true,
            data: gemstone
        });
    } catch (error) {
        console.error('Error fetching gemstone by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gemstone'
        });
    }
};

// Create new gemstone
exports.createGemstone = async (req, res) => {
    try {
        const { name, type } = req.body;

        // Validation
        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name and type are required'
            });
        }

        if (!['diamond', 'stone'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be "diamond" or "stone"'
            });
        }

        // Check if name already exists
        const checkQuery = 'SELECT COUNT(*) as count FROM gemstone_catalog WHERE name = ?';
        const [checkRows] = await db.query(checkQuery, [name]);
        if (checkRows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'A gemstone with this name already exists'
            });
        }

        // Create gemstone
        const insertQuery = 'INSERT INTO gemstone_catalog (name, type) VALUES (?, ?)';
        const [result] = await db.query(insertQuery, [name, type]);
        const id = result.insertId;

        res.status(201).json({
            success: true,
            message: 'Gemstone created successfully',
            data: { id, name, type }
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
exports.updateGemstone = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;

        // Validation
        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name and type are required'
            });
        }

        if (!['diamond', 'stone'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be "diamond" or "stone"'
            });
        }

        // Check if gemstone exists
        const checkQuery = 'SELECT * FROM gemstone_catalog WHERE id = ?';
        const [checkRows] = await db.query(checkQuery, [id]);
        if (checkRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        // Check if name already exists (excluding current gemstone)
        const nameCheckQuery = 'SELECT COUNT(*) as count FROM gemstone_catalog WHERE name = ? AND id != ?';
        const [nameCheckRows] = await db.query(nameCheckQuery, [name, id]);
        if (nameCheckRows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'A gemstone with this name already exists'
            });
        }

        // Update gemstone
        const updateQuery = 'UPDATE gemstone_catalog SET name = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        await db.query(updateQuery, [name, type, id]);

        // Fetch updated gemstone
        const [updatedRows] = await db.query('SELECT * FROM gemstone_catalog WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Gemstone updated successfully',
            data: updatedRows[0]
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
exports.deleteGemstone = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if gemstone exists
        const checkQuery = 'SELECT * FROM gemstone_catalog WHERE id = ?';
        const [checkRows] = await db.query(checkQuery, [id]);
        if (checkRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        // Delete gemstone
        const deleteQuery = 'DELETE FROM gemstone_catalog WHERE id = ?';
        await db.query(deleteQuery, [id]);

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


