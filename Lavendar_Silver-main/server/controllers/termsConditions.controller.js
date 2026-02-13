const pool = require('../config/db');

// =======================================
// TERMS & CONDITIONS CONTROLLER
// =======================================

// GET /api/terms-conditions/all - Get all Terms & Conditions data
exports.getAllTermsConditionsData = async (req, res) => {
    try {
        // Fetch data from terms conditions tables
        const [header] = await pool.query('SELECT * FROM terms_conditions_header ORDER BY id');
        const [sections] = await pool.query('SELECT * FROM terms_conditions ORDER BY id');

        return res.json({
            success: true,
            data: {
                header: header[0] || null,
                sections: sections || []
            }
        });
    } catch (err) {
        console.error('Terms & Conditions getAllData Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// HEADER CRUD
// =======================================

// GET /api/terms-conditions/header
exports.getHeader = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM terms_conditions_header ORDER BY id');
        return res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/terms-conditions/header
exports.createHeader = async (req, res) => {
    const { page_title, last_updated } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO terms_conditions_header (page_title, last_updated) VALUES (?, ?)',
            [page_title, last_updated]
        );
        const [newRecord] = await pool.query('SELECT * FROM terms_conditions_header WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/terms-conditions/header/:id
exports.updateHeader = async (req, res) => {
    const { id } = req.params;
    const { page_title, last_updated } = req.body;
    try {
        await pool.query(
            'UPDATE terms_conditions_header SET page_title = ?, last_updated = ? WHERE id = ?',
            [page_title, last_updated, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM terms_conditions_header WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// SECTIONS CRUD
// =======================================

// GET /api/terms-conditions/sections
exports.getSections = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM terms_conditions ORDER BY id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/terms-conditions/sections
exports.createSection = async (req, res) => {
    const { section_number, section_title, content, parent_section_number } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO terms_conditions (section_number, section_title, content, parent_section_number) VALUES (?, ?, ?, ?)',
            [section_number, section_title, content, parent_section_number]
        );
        const [newRecord] = await pool.query('SELECT * FROM terms_conditions WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/terms-conditions/sections/:id
exports.updateSection = async (req, res) => {
    const { id } = req.params;
    const { section_number, section_title, content, parent_section_number } = req.body;
    try {
        await pool.query(
            'UPDATE terms_conditions SET section_number = ?, section_title = ?, content = ?, parent_section_number = ? WHERE id = ?',
            [section_number, section_title, content, parent_section_number, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM terms_conditions WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}; 