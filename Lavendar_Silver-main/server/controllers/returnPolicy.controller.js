const pool = require('../config/db');

// =======================================
// RETURN & CANCELLATION POLICY CONTROLLER
// =======================================

// GET /api/return-policy/all - Get all Return Policy data
exports.getAllReturnPolicyData = async (req, res) => {
    try {
        // Fetch data from return policy tables
        const [header] = await pool.query('SELECT * FROM return_cancellation_header ORDER BY id');
        const [sections] = await pool.query('SELECT * FROM return_cancellation_policy ORDER BY id');

        return res.json({
            success: true,
            data: {
                header: header[0] || null,
                sections: sections || []
            }
        });
    } catch (err) {
        console.error('Return Policy getAllData Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// HEADER CRUD
// =======================================

// GET /api/return-policy/header
exports.getHeader = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM return_cancellation_header ORDER BY id');
        return res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/return-policy/header
exports.createHeader = async (req, res) => {
    const { page_title, last_updated } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO return_cancellation_header (page_title, last_updated) VALUES (?, ?)',
            [page_title, last_updated]
        );
        const [newRecord] = await pool.query('SELECT * FROM return_cancellation_header WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/return-policy/header/:id
exports.updateHeader = async (req, res) => {
    const { id } = req.params;
    const { page_title, last_updated } = req.body;
    try {
        await pool.query(
            'UPDATE return_cancellation_header SET page_title = ?, last_updated = ? WHERE id = ?',
            [page_title, last_updated, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM return_cancellation_header WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// SECTIONS CRUD
// =======================================

// GET /api/return-policy/sections
exports.getSections = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM return_cancellation_policy ORDER BY id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/return-policy/sections
exports.createSection = async (req, res) => {
    const { section_number, section_title, content, parent_section_number } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO return_cancellation_policy (section_number, section_title, content, parent_section_number) VALUES (?, ?, ?, ?)',
            [section_number, section_title, content, parent_section_number]
        );
        const [newRecord] = await pool.query('SELECT * FROM return_cancellation_policy WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/return-policy/sections/:id
exports.updateSection = async (req, res) => {
    const { id } = req.params;
    const { section_number, section_title, content, parent_section_number } = req.body;
    try {
        await pool.query(
            'UPDATE return_cancellation_policy SET section_number = ?, section_title = ?, content = ?, parent_section_number = ? WHERE id = ?',
            [section_number, section_title, content, parent_section_number, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM return_cancellation_policy WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}; 