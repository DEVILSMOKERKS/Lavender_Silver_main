const db = require('../config/db');
const { triggerCouponEmail } = require('./emailAutomation.controller');

// Utility function to format date to YYYY-MM-DD for MySQL DATE columns
const formatDateForMySQL = (dateValue) => {
    if (!dateValue) return null;
    // If already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }
    // Convert ISO string or Date object to YYYY-MM-DD
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        return null;
    }
};

exports.createDiscount = async (req, res) => {
    try {
        const { code, title, description, discount_type, discount_value, start_date, end_date, minimum_order_amount, max_discount_amount, show_on_frontend, send_in_email, is_hidden, status } = req.body;

        // Validation
        if (!code || !title || !discount_type || !discount_value) {
            return res.status(400).json({
                success: false,
                error: 'Required fields are missing: code, title, discount_type, and discount_value are required'
            });
        }

        // Check if code already exists
        const [existingCode] = await db.execute('SELECT id FROM offers WHERE code = ?', [code]);
        if (existingCode.length > 0) {
            return res.status(409).json({
                success: false,
                error: `Discount code '${code}' already exists`
            });
        }

        // Format dates to YYYY-MM-DD for MySQL DATE columns
        const formattedStartDate = formatDateForMySQL(start_date);
        const formattedEndDate = formatDateForMySQL(end_date);
        const [result] = await db.execute(
            'INSERT INTO offers (code, title, description, discount_type, discount_value, start_date, end_date, minimum_order_amount, max_discount_amount, show_on_frontend, send_in_email, is_hidden, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [code, title, description, discount_type, discount_value, formattedStartDate, formattedEndDate, minimum_order_amount, max_discount_amount, show_on_frontend || true, send_in_email || false, is_hidden || false, status || 'active']
        );

        const newDiscount = {
            id: result.insertId,
            code,
            title,
            description,
            discount_type,
            discount_value,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            minimum_order_amount,
            max_discount_amount,
            show_on_frontend: show_on_frontend || true,
            send_in_email: send_in_email || false,
            is_hidden: is_hidden || false,
            status: status || 'active'
        };

        // Trigger coupon email to all users about the new coupon
        try {
            await triggerCouponEmail({
                code: code,
                discount: `${discount_value}${discount_type === 'percentage' ? '%' : ' Rs'}`,
                end_date: end_date || 'Limited Time'
            });
        } catch (emailError) {
            console.error('Error sending coupon email:', emailError);
            // Don't fail the coupon creation if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Discount created successfully',
            data: newDiscount
        });
    } catch (err) {
        console.error('Error creating discount:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to create discount'
        });
    }
};

exports.getAllDiscounts = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM offers ORDER BY created_at DESC');
        res.status(200).json({
            success: true,
            message: 'Discounts retrieved successfully',
            data: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDiscountById = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM offers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Discount not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateDiscount = async (req, res) => {
    try {
        const { code, title, description, discount_type, discount_value, start_date, end_date, minimum_order_amount, max_discount_amount, show_on_frontend, send_in_email, is_hidden, status } = req.body;
        const validStatus = (status === 'active' || status === 'inactive') ? status : 'active';
        const formattedStartDate = formatDateForMySQL(start_date);
        const formattedEndDate = formatDateForMySQL(end_date);
        
        // Ensure discount_value is a proper number and round to 2 decimal places
        const numericDiscountValue = parseFloat(discount_value);
        if (isNaN(numericDiscountValue)) {
            return res.status(400).json({ error: 'Invalid discount value' });
        }
        const roundedDiscountValue = Math.round(numericDiscountValue * 100) / 100;
        
        const numericMinOrder = minimum_order_amount ? parseFloat(minimum_order_amount) : null;
        const numericMaxDiscount = max_discount_amount ? parseFloat(max_discount_amount) : null;
        
        const [result] = await db.execute(
            'UPDATE offers SET code=?, title=?, description=?, discount_type=?, discount_value=?, start_date=?, end_date=?, minimum_order_amount=?, max_discount_amount=?, show_on_frontend=?, send_in_email=?, is_hidden=?, status=? WHERE id=?',
            [code, title, description, discount_type, roundedDiscountValue, formattedStartDate, formattedEndDate, numericMinOrder, numericMaxDiscount, show_on_frontend, send_in_email, is_hidden, validStatus, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Discount not found' });
        
        // Return the updated discount with proper values
        res.status(200).json({ 
            id: req.params.id, 
            code, 
            title, 
            description, 
            discount_type, 
            discount_value: roundedDiscountValue, 
            start_date: formattedStartDate, 
            end_date: formattedEndDate, 
            minimum_order_amount: numericMinOrder, 
            max_discount_amount: numericMaxDiscount, 
            show_on_frontend, 
            send_in_email, 
            is_hidden, 
            status: validStatus 
        });
    } catch (err) {
        console.error('Error updating discount:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDiscount = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM offers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Discount not found' });
        res.status(200).json({ message: 'Discount deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFrontendDiscounts = async (req, res) => {
    try {
        // First check if the offers table exists and has the required columns
        try {
            const [rows] = await db.execute(
                "SELECT * FROM offers WHERE show_on_frontend=1 AND is_hidden=0 AND status='active' ORDER BY created_at DESC"
            );
            res.status(200).json({ data: rows, success: true, message: 'Frontend discounts retrieved successfully' });
        } catch (tableError) {
            // If the table doesn't exist or columns are missing, return empty array
            res.status(200).json({ data: [], success: true, message: 'No discounts available' });
        }
    } catch (err) {
        console.error('Error in getFrontendDiscounts:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getEmailDiscounts = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM offers WHERE send_in_email=1 AND is_hidden=0 ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getHiddenDiscounts = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM offers WHERE is_hidden=1 ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// USER COUPONS CRUD
exports.createUserCoupon = async (req, res) => {
    try {
        const { user_id, coupon_code, discount_id, status } = req.body;
        if (!user_id || !coupon_code || !discount_id) {
            return res.status(400).json({ success: false, message: 'user_id, coupon_code, discount_id are required' });
        }
        const [result] = await db.execute(
            'INSERT INTO user_coupons (user_id, coupon_code, discount_id, status) VALUES (?, ?, ?, ?)',
            [user_id, coupon_code, discount_id, status || 'active']
        );
        res.status(201).json({ success: true, message: 'User coupon created', data: { id: result.insertId, user_id, coupon_code, discount_id, status: status || 'active' } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllUserCoupons = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM user_coupons ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUserCouponsByUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const [rows] = await db.execute('SELECT * FROM user_coupons WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUserCouponsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const [rows] = await db.execute('SELECT * FROM user_coupons WHERE status = ? ORDER BY created_at DESC', [status]);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateUserCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        if (!fields || Object.keys(fields).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        const setClause = Object.keys(fields).map(key => `${key} = ?`).join(', ');
        const values = Object.values(fields);
        values.push(id);
        const [result] = await db.execute(`UPDATE user_coupons SET ${setClause} WHERE id = ?`, values);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User coupon not found' });
        res.status(200).json({ success: true, message: 'User coupon updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteUserCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM user_coupons WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User coupon not found' });
        res.status(200).json({ success: true, message: 'User coupon deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}; 