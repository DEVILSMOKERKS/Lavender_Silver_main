const db = require('../config/db');

// Get all Facebook Pixel configurations
exports.getAllPixelConfigs = async (req, res) => {
    try {
        const [configs] = await db.query(
            `SELECT fp.*, a.name as admin_name 
             FROM facebook_pixel_config fp 
             LEFT JOIN admins a ON fp.created_by = a.id`
        );
        res.json(configs);
    } catch (error) {
        console.error('Error fetching pixel configs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get active Facebook Pixel configuration for frontend
exports.getActivePixelConfig = async (req, res) => {
    try {
        const [configs] = await db.query(
            `SELECT pixel_id, event_tracking 
             FROM facebook_pixel_config 
             WHERE is_active = 1 AND tracking_status = 'active' 
             LIMIT 1`
        );

        if (configs.length === 0) {
            return res.json({ success: true, data: null });
        }

        const config = configs[0];
        config.event_tracking = JSON.parse(config.event_tracking || '{}');

        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error fetching active pixel config:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Add new Facebook Pixel configuration
exports.addPixelConfig = async (req, res) => {
    const { pixel_id, access_token, event_tracking } = req.body;
    const admin_id = req.admin.id; // Assuming admin info is added by auth middleware

    try {
        // Allow empty/null credentials - they will be stored but tracking won't work
        const [result] = await db.query(
            `INSERT INTO facebook_pixel_config 
             (pixel_id, access_token, event_tracking, created_by) 
             VALUES (?, ?, ?, ?)`,
            [
                pixel_id || null,
                access_token || null,
                JSON.stringify(event_tracking || {}),
                admin_id
            ]
        );

        res.status(201).json({
            message: 'Facebook Pixel configuration added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding pixel config:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update Facebook Pixel configuration
exports.updatePixelConfig = async (req, res) => {
    const { id } = req.params;
    const { pixel_id, access_token, is_active, tracking_status, event_tracking } = req.body;

    try {
        // Allow empty/null credentials - they will be stored but tracking won't work
        await db.query(
            `UPDATE facebook_pixel_config 
             SET pixel_id = ?, 
                 access_token = ?,
                 is_active = ?,
                 tracking_status = ?,
                 event_tracking = ?
             WHERE id = ?`,
            [
                pixel_id || null,
                access_token || null,
                is_active !== undefined ? is_active : true,
                tracking_status || 'active',
                JSON.stringify(event_tracking || {}),
                id
            ]
        );

        res.json({ message: 'Facebook Pixel configuration updated successfully' });
    } catch (error) {
        console.error('Error updating pixel config:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete Facebook Pixel configuration
exports.deletePixelConfig = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM facebook_pixel_config WHERE id = ?', [id]);
        res.json({ message: 'Facebook Pixel configuration deleted successfully' });
    } catch (error) {
        console.error('Error deleting pixel config:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get single Facebook Pixel configuration
exports.getPixelConfig = async (req, res) => {
    const { id } = req.params;

    try {
        const [config] = await db.query(
            `SELECT fp.*, a.name as admin_name 
             FROM facebook_pixel_config fp 
             LEFT JOIN admins a ON fp.created_by = a.id 
             WHERE fp.id = ?`,
            [id]
        );

        if (config.length === 0) {
            return res.status(404).json({ message: 'Facebook Pixel configuration not found' });
        }

        res.json(config[0]);
    } catch (error) {
        console.error('Error fetching pixel config:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
