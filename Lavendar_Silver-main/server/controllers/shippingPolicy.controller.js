const pool = require('../config/db');

const shippingPolicyController = {
    // Get all shipping policy data (header + sections)
    getAllShippingPolicyData: async (req, res) => {
        try {
            const [headerRows] = await pool.query('SELECT * FROM shipping_policy_header ORDER BY id DESC LIMIT 1');
            const [sectionRows] = await pool.query('SELECT * FROM shipping_policy ORDER BY section_number');

            return res.json({
                success: true,
                data: {
                    header: headerRows[0] || null,
                    sections: sectionRows
                }
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get header only
    getHeader: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM shipping_policy_header ORDER BY id DESC LIMIT 1');
            return res.json({ success: true, data: rows[0] || null });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get sections only
    getSections: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM shipping_policy ORDER BY section_number');
            return res.json({ success: true, data: rows });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    // Create header
    createHeader: async (req, res) => {
        const { page_title, last_updated } = req.body;
        try {
            const [result] = await pool.query(
                'INSERT INTO shipping_policy_header (page_title, last_updated) VALUES (?, ?)',
                [page_title, last_updated]
            );
            const [newRecord] = await pool.query('SELECT * FROM shipping_policy_header WHERE id = ?', [result.insertId]);
            return res.json({ success: true, data: newRecord[0] });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    // Update header
    updateHeader: async (req, res) => {
        const { id } = req.params;
        const { page_title, last_updated } = req.body;
        try {
            await pool.query(
                'UPDATE shipping_policy_header SET page_title = ?, last_updated = ? WHERE id = ?',
                [page_title, last_updated, id]
            );
            const [updatedRecord] = await pool.query('SELECT * FROM shipping_policy_header WHERE id = ?', [id]);
            return res.json({ success: true, data: updatedRecord[0] });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    // Create section
    createSection: async (req, res) => {
        const { section_number, section_title, content, parent_section_number } = req.body;
        try {
            const [result] = await pool.query(
                'INSERT INTO shipping_policy (section_number, section_title, content, parent_section_number) VALUES (?, ?, ?, ?)',
                [section_number, section_title, content, parent_section_number]
            );
            const [newRecord] = await pool.query('SELECT * FROM shipping_policy WHERE id = ?', [result.insertId]);
            return res.json({ success: true, data: newRecord[0] });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    // Update section
    updateSection: async (req, res) => {
        const { id } = req.params;
        const { section_number, section_title, content, parent_section_number } = req.body;
        try {
            await pool.query(
                'UPDATE shipping_policy SET section_number = ?, section_title = ?, content = ?, parent_section_number = ? WHERE id = ?',
                [section_number, section_title, content, parent_section_number, id]
            );
            const [updatedRecord] = await pool.query('SELECT * FROM shipping_policy WHERE id = ?', [id]);
            return res.json({ success: true, data: updatedRecord[0] });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
};

module.exports = shippingPolicyController; 