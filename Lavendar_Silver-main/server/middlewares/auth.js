const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async function (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided', data: null });
    }
    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.user = decoded;

        // Check if user is admin (skip status check for admins)
        if (decoded.role === 'admin' || decoded.type === 'admin') {
            return next();
        }

        // Check user status for regular users
        try {
            const [userRows] = await db.execute('SELECT status FROM user WHERE id = ?', [decoded.id]);
            const user = userRows[0];

            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found', data: null });
            }

            // Check if user is blocked or inactive
            if (user.status === 'Blocked') {
                return res.status(403).json({
                    success: false,
                    message: 'You have been blocked. Please contact support.',
                    data: null,
                    blocked: true,
                    autoLogout: true
                });
            }

            if (user.status === 'Inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account is temporarily blocked for 30 days. Please contact support.',
                    data: null,
                    inactive: true,
                    autoLogout: true
                });
            }

        } catch (dbError) {
            console.error('Database error in auth middleware:', dbError);
            return res.status(500).json({ success: false, message: 'Server error', data: null });
        }

        next();
    } catch (err) {
        console.error('Auth middleware - Token verification failed:', err);

        // Check if token is expired
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
                data: null,
                tokenExpired: true,
                autoLogout: true
            });
        }

        return res.status(401).json({ success: false, message: 'Invalid token', data: null });
    }
};

// Optional auth middleware - works for both logged-in and guest users
module.exports.optionalAuth = async function (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // No token provided - guest user
        req.user = null;
        return next();
    }

    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        req.user = decoded;

        // Check if user is admin (skip status check for admins)
        if (decoded.role === 'admin' || decoded.type === 'admin') {
            return next();
        }

        // Check user status for regular users
        try {
            const [userRows] = await db.execute('SELECT status FROM user WHERE id = ?', [decoded.id]);
            const user = userRows[0];

            if (!user) {
                // User not found in DB - treat as guest
                req.user = null;
                return next();
            }

            // Check if user is blocked or inactive
            if (user.status === 'Blocked') {
                return res.status(403).json({
                    success: false,
                    message: 'You have been blocked. Please contact support.',
                    data: null,
                    blocked: true,
                    autoLogout: true
                });
            }

            if (user.status === 'Inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account is temporarily blocked for 30 days. Please contact support.',
                    data: null,
                    inactive: true,
                    autoLogout: true
                });
            }

        } catch (dbError) {
            console.error('Database error in optional auth middleware:', dbError);
            // On DB error, treat as guest user
            req.user = null;
            return next();
        }

        next();
    } catch (err) {
        console.error('Optional auth middleware - Token verification failed:', err);

        // Check if token is expired
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
                data: null,
                tokenExpired: true,
                autoLogout: true
            });
        }

        // Invalid token - treat as guest user
        req.user = null;
        return next();
    }
};

// Role-based middleware with DB check for admin
module.exports.requireRole = function (role) {
    return async function (req, res, next) {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role', data: null });
        }
        if (role === 'admin') {
            try {
                const [rows] = await db.execute('SELECT id FROM admins WHERE id = ?', [req.user.id]);
                if (!rows[0]) {
                    return res.status(403).json({ success: false, message: 'Forbidden: Admin not found', data: null });
                }
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Server error', data: null });
            }
        }
        next();
    };
};

// Admin authentication middleware
module.exports.authenticateAdmin = async function (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided', data: null });
    }

    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);

        // Check if user is admin
        if (decoded.role === 'admin' || decoded.type === 'admin') {
            req.user = decoded;
            return next();
        }

        return res.status(403).json({ success: false, message: 'Forbidden: Admin access required', data: null });
    } catch (err) {
        console.error('Admin auth middleware - Token verification failed:', err);

        // Check if token is expired
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
                data: null,
                tokenExpired: true,
                autoLogout: true
            });
        }

        return res.status(401).json({ success: false, message: 'Invalid token', data: null });
    }
}; 