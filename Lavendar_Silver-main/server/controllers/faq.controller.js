const pool = require('../config/db');

// =======================================
// FAQ CONTROLLER
// =======================================

// GET /api/faq/all - Get all FAQ data
exports.getAllFaqData = async (req, res) => {
    try {
        // Fetch data from all FAQ tables
        const [generalEnquiry] = await pool.query('SELECT * FROM general_enquiry ORDER BY id');
        const [placingAnOrder] = await pool.query('SELECT * FROM placing_an_order ORDER BY id');
        const [shipping] = await pool.query('SELECT * FROM shipping ORDER BY id');
        const [maintenance] = await pool.query('SELECT * FROM maintenance ORDER BY id');

        return res.json({
            success: true,
            data: {
                generalEnquiry,
                placingAnOrder,
                shipping,
                maintenance
            }
        });
    } catch (err) {
        console.error('FAQ getAllFaqData Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// GENERAL ENQUIRY CRUD
// =======================================

// GET /api/faq/general-enquiry
exports.getGeneralEnquiry = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM general_enquiry ORDER BY id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/faq/general-enquiry
exports.createGeneralEnquiry = async (req, res) => {
    const { heading, question, answer, status } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO general_enquiry (heading, question, answer, status) VALUES (?, ?, ?, ?)',
            [heading, question, answer, status]
        );
        const [newRecord] = await pool.query('SELECT * FROM general_enquiry WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/faq/general-enquiry/:id
exports.updateGeneralEnquiry = async (req, res) => {
    const { id } = req.params;
    const { heading, question, answer, status } = req.body;
    try {
        await pool.query(
            'UPDATE general_enquiry SET heading = ?, question = ?, answer = ?, status = ? WHERE id = ?',
            [heading, question, answer, status, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM general_enquiry WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// PLACING AN ORDER CRUD
// =======================================

// GET /api/faq/placing-an-order
exports.getPlacingAnOrder = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM placing_an_order ORDER BY id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/faq/placing-an-order
exports.createPlacingAnOrder = async (req, res) => {
    const { heading, question, answer, status } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO placing_an_order (heading, question, answer, status) VALUES (?, ?, ?, ?)',
            [heading, question, answer, status]
        );
        const [newRecord] = await pool.query('SELECT * FROM placing_an_order WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/faq/placing-an-order/:id
exports.updatePlacingAnOrder = async (req, res) => {
    const { id } = req.params;
    const { heading, question, answer, status } = req.body;
    try {
        await pool.query(
            'UPDATE placing_an_order SET heading = ?, question = ?, answer = ?, status = ? WHERE id = ?',
            [heading, question, answer, status, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM placing_an_order WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// SHIPPING CRUD
// =======================================

// GET /api/faq/shipping
exports.getShipping = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM shipping ORDER BY id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/faq/shipping
exports.createShipping = async (req, res) => {
    const { heading, question, answer, status } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO shipping (heading, question, answer, status) VALUES (?, ?, ?, ?)',
            [heading, question, answer, status]
        );
        const [newRecord] = await pool.query('SELECT * FROM shipping WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/faq/shipping/:id
exports.updateShipping = async (req, res) => {
    const { id } = req.params;
    const { heading, question, answer, status } = req.body;
    try {
        await pool.query(
            'UPDATE shipping SET heading = ?, question = ?, answer = ?, status = ? WHERE id = ?',
            [heading, question, answer, status, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM shipping WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// MAINTENANCE CRUD
// =======================================

// GET /api/faq/maintenance
exports.getMaintenance = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM maintenance ORDER BY id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/faq/maintenance
exports.createMaintenance = async (req, res) => {
    const { heading, question, answer, status } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO maintenance (heading, question, answer, status) VALUES (?, ?, ?, ?)',
            [heading, question, answer, status]
        );
        const [newRecord] = await pool.query('SELECT * FROM maintenance WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/faq/maintenance/:id
exports.updateMaintenance = async (req, res) => {
    const { id } = req.params;
    const { heading, question, answer, status } = req.body;
    try {
        await pool.query(
            'UPDATE maintenance SET heading = ?, question = ?, answer = ?, status = ? WHERE id = ?',
            [heading, question, answer, status, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM maintenance WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}; 