const pool = require('../config/db');
const { validateEmail } = require('../utils/emailValidator');
const { realignTableIds } = require('../utils/realignTableIds');
const { sendEliteMemberWelcome } = require('../utils/emailSender');

// POST /api/elite-members
exports.createEliteMember = async (req, res) => {
    const { email, gender } = req.body;
    if (!email || !gender) {
        return res.status(400).json({ success: false, message: 'Email and gender are required.' });
    }
    // Use professional email validation
    const emailValidation = validateEmail(email, { allowOnlyPublic: true });
    if (!emailValidation.valid) {
        return res.status(400).json({ success: false, message: emailValidation.reason });
    }
    if (!['Male', 'Female', 'Other'].includes(gender)) {
        return res.status(400).json({ success: false, message: 'Invalid gender value.' });
    }
    try {
        // Prevent duplicate email
        const [exists] = await pool.query('SELECT id FROM elite_members WHERE email = ?', [email]);
        if (exists.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already subscribed.' });
        }
        await pool.query(
            'INSERT INTO elite_members (email, gender) VALUES (?, ?)',
            [email, gender]
        );

        // Get user_id from email if user exists
        let userId = null;
        try {
            const [userRows] = await pool.query('SELECT id FROM user WHERE email = ?', [email]);
            if (userRows.length > 0) {
                userId = userRows[0].id;
            }
        } catch (userError) {
            console.error('Error finding user:', userError);
        }

        // Create notification (user_id can be null for guest users)
        try {
            await pool.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [userId || null, 'success', 'Welcome to Elite Members! You have successfully subscribed as an elite member.']
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't fail the registration if notification fails
        }

        // Send welcome email using backend template
        try {
            await sendEliteMemberWelcome(email, gender);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't fail the registration if email fails
        }

        return res.status(201).json({ success: true, message: 'Successfully subscribed as elite member.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/elite-members (admin only)
exports.getAllEliteMembers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM elite_members ORDER BY subscribed_at DESC');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Send elite member welcome email
exports.sendEliteWelcomeEmail = async (req, res) => {
    const { email, gender } = req.body;
    if (!email || !gender) {
        return res.status(400).json({ success: false, message: 'Email and gender are required.' });
    }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
        return res.status(400).json({ success: false, message: 'Invalid gender value.' });
    }

    try {
        const result = await sendEliteMemberWelcome(email, gender);
        if (result.success) {
            return res.status(200).json({ success: true, message: 'Welcome email sent successfully.' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to send welcome email.' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/elite-members/:id (admin only)
exports.deleteEliteMember = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Member ID is required.' });
    }

    try {
        // Check if member exists
        const [member] = await pool.query('SELECT id, email FROM elite_members WHERE id = ?', [id]);
        if (member.length === 0) {
            return res.status(404).json({ success: false, message: 'Elite member not found.' });
        }

        // Delete the member
        await pool.query('DELETE FROM elite_members WHERE id = ?', [id]);

        return res.status(200).json({
            success: true,
            message: 'Elite member deleted successfully.'
        });
    } catch (err) {
        console.error('Error deleting elite member:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// (Optional) Admin-only: Realign IDs for elite_members table
exports.realignEliteMemberIds = async (req, res) => {
    const result = await realignTableIds('elite_members');
    if (result.success) {
        return res.status(200).json({ success: true, message: result.message });
    } else {
        return res.status(500).json({ success: false, message: result.message });
    }
};
