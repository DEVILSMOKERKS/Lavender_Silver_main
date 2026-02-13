const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-8);
};

exports.facebookAdminLogin = async (req, res) => {
    const { email, accessToken } = req.body;

    if (!email || !accessToken) {
        return res.status(400).json({
            success: false,
            message: 'Email and access token are required'
        });
    }

    try {
        // Check if admin exists with this email
        const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
        const admin = adminRows[0];

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'No admin account found with this email',
                data: null
            });
        }

        // Generate admin token
        const token = jwt.sign(
            { id: admin.id, role: 'admin', type: 'admin' },
            process.env.JWT_SECRET
        );

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            data: { token, admin }
        });

    } catch (error) {
        console.error('Error in Facebook admin login:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.facebookLogin = async (req, res) => {
    const { email, name, picture, accessToken } = req.body;

    if (!email || !accessToken) {
        return res.status(400).json({ success: false, message: 'Email and access token are required' });
    }

    try {
        // Verify Facebook access token (you can add additional verification here)
        // For now, we'll trust the frontend verification

        // 1. Check if admin exists
        const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
        const admin = adminRows[0];
        if (admin) {
            const token = jwt.sign({ id: admin.id, role: 'admin', type: 'admin' }, process.env.JWT_SECRET);
            return res.status(200).json({ success: true, message: 'Admin login successful', data: { token, admin } });
        }

        // 2. Check if user exists
        const [userRows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
        let user = userRows[0];
        if (!user) {
            return res.status(404).json({ success: false, message: 'Please sign up first', data: null });
        }

        // 3. Check user status
        if (user.status === 'Blocked') {
            return res.status(403).json({
                success: false,
                message: 'You have been blocked. Please contact support.',
                data: null,
                blocked: true
            });
        }

        if (user.status === 'Inactive') {
            return res.status(403).json({
                success: false,
                message: 'Your account is temporarily blocked for 30 days. Please contact support.',
                data: null,
                inactive: true
            });
        }

        // 4. Set is_verified true if not already
        if (!user.is_verified) {
            await db.execute('UPDATE user SET is_verified = ? WHERE id = ?', [true, user.id]);
            const [updatedRows] = await db.execute('SELECT * FROM user WHERE id = ?', [user.id]);
            user = updatedRows[0];
        }

        // 5. Check if social_logins entry exists
        const [socialRows] = await db.execute(
            'SELECT * FROM social_logins WHERE user_id = ? AND provider = ?',
            [user.id, 'facebook']
        );
        if (!socialRows[0]) {
            await db.execute(
                'INSERT INTO social_logins (user_id, provider, provider_id) VALUES (?, ?, ?)',
                [user.id, 'facebook', email]
            );
        }

        // 6. Generate token and respond
        const token = jwt.sign({ id: user.id, type: 'user' }, process.env.JWT_SECRET);
        res.status(200).json({ success: true, message: 'Facebook login successful', data: { token, user } });
    } catch (err) {
        console.error('Facebook login error:', err);
        res.status(500).json({
            success: false,
            message: 'Facebook login failed',
            data: null,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.facebookSignup = async (req, res) => {
    const { email, name, picture, accessToken } = req.body;

    if (!email || !accessToken) {
        return res.status(400).json({ success: false, message: 'Email and access token are required' });
    }

    try {
        // Verify Facebook access token (you can add additional verification here)
        // For now, we'll trust the frontend verification

        // Check if user already exists
        const [userRows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
        if (userRows.length > 0) {
            // If user exists, automatically proceed with login
            const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
            const admin = adminRows[0];

            if (admin) {
                const token = jwt.sign({ id: admin.id, role: 'admin', type: 'admin' }, process.env.JWT_SECRET);
                return res.status(200).json({ success: true, message: 'Admin login successful', data: { token, admin } });
            }

            const user = userRows[0];

            // Check user status before allowing login
            if (user.status === 'Blocked') {
                return res.status(403).json({
                    success: false,
                    message: 'You have been blocked. Please contact support.',
                    data: null,
                    blocked: true
                });
            }

            if (user.status === 'Inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account is temporarily blocked for 30 days. Please contact support.',
                    data: null,
                    inactive: true
                });
            }

            const token = jwt.sign({ id: user.id, type: 'user' }, process.env.JWT_SECRET);
            return res.status(200).json({
                success: true,
                message: 'User exists. Logged in successfully.',
                data: { token, user }
            });
        }

        // Create new user with generated password
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Get connection from pool for transaction
        const connection = await db.getConnection();

        try {
            // Start transaction
            await connection.beginTransaction();

            // Create user
            const [result] = await connection.execute(
                'INSERT INTO user (name, email, password, is_verified, photo) VALUES (?, ?, ?, ?, ?)',
                [name || email.split('@')[0], email, hashedPassword, true, picture || null]
            );

            const userId = result.insertId;

            // Create social login entry
            await connection.execute(
                'INSERT INTO social_logins (user_id, provider, provider_id) VALUES (?, ?, ?)',
                [userId, 'facebook', email]
            );

            // Commit transaction
            await connection.commit();

            // Get the newly created user
            const [newUserRows] = await db.execute('SELECT * FROM user WHERE id = ?', [userId]);
            const user = newUserRows[0];

            // Generate token for automatic login
            const token = jwt.sign({ id: user.id, type: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });

            // Remove sensitive data before sending response
            const { password: _, ...userData } = user;

            return res.status(201).json({
                success: true,
                message: 'Facebook signup successful and logged in',
                data: {
                    token,
                    user: userData,
                    defaultEmail: email,
                    isNewUser: true
                }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error in Facebook signup:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during signup',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
