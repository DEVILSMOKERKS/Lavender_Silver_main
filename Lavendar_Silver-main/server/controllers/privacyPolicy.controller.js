const pool = require('../config/db');

// =======================================
// PRIVACY POLICY CONTROLLER
// =======================================

// GET /api/privacy-policy/all - Get all Privacy Policy data
exports.getAllPrivacyPolicyData = async (req, res) => {
    try {
        // Fetch data from privacy policy tables
        const [header] = await pool.query('SELECT * FROM privacy_policy_header ORDER BY id');
        const [sections] = await pool.query('SELECT * FROM privacy_policy ORDER BY id');

        return res.json({
            success: true,
            data: {
                header: header[0] || null,
                sections: sections || []
            }
        });
    } catch (err) {
        console.error('Privacy Policy getAllData Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// HEADER CRUD
// =======================================

// GET /api/privacy-policy/header
exports.getHeader = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM privacy_policy_header ORDER BY id');
        return res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/privacy-policy/header
exports.createHeader = async (req, res) => {
    const { page_title, last_updated } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO privacy_policy_header (page_title, last_updated) VALUES (?, ?)',
            [page_title, last_updated]
        );
        const [newRecord] = await pool.query('SELECT * FROM privacy_policy_header WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/privacy-policy/header/:id
exports.updateHeader = async (req, res) => {
    const { id } = req.params;
    const { page_title, last_updated } = req.body;
    try {
        await pool.query(
            'UPDATE privacy_policy_header SET page_title = ?, last_updated = ? WHERE id = ?',
            [page_title, last_updated, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM privacy_policy_header WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// SECTIONS CRUD
// =======================================

// GET /api/privacy-policy/sections
exports.getSections = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM privacy_policy ORDER BY id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/privacy-policy/sections
exports.createSection = async (req, res) => {
    const { section_number, section_title, content, parent_section_number } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO privacy_policy (section_number, section_title, content, parent_section_number) VALUES (?, ?, ?, ?)',
            [section_number, section_title, content, parent_section_number]
        );
        const [newRecord] = await pool.query('SELECT * FROM privacy_policy WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/privacy-policy/sections/:id
exports.updateSection = async (req, res) => {
    const { id } = req.params;
    const { section_number, section_title, content, parent_section_number } = req.body;
    try {
        await pool.query(
            'UPDATE privacy_policy SET section_number = ?, section_title = ?, content = ?, parent_section_number = ? WHERE id = ?',
            [section_number, section_title, content, parent_section_number, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM privacy_policy WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}; 