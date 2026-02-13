const db = require('../config/db');

const notificationController = {
    // Get all notifications (paginated, admin only)
    getAllNotifications: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;

            // Validate and convert parameters to integers
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;

            // Ensure positive values
            const safeLimit = Math.max(1, Math.min(limitNum, 100)); // Max 100 items per page
            const safeOffset = Math.max(0, offset);

            // Convert to numbers and ensure they're integers
            const limitNumInt = parseInt(safeLimit) || 20;
            const offsetNumInt = parseInt(safeOffset) || 0;

            const [rows] = await db.execute(
                `SELECT * FROM notifications ORDER BY created_at DESC LIMIT ${limitNumInt} OFFSET ${offsetNumInt}`,
                []
            );
            const [countRows] = await db.execute('SELECT COUNT(*) as total FROM notifications');
            res.json({
                success: true,
                data: rows,
                pagination: {
                    total: countRows[0].total,
                    total_pages: Math.ceil(countRows[0].total / safeLimit),
                    current_page: pageNum,
                    limit: safeLimit
                }
            });
        } catch (error) {
            console.error('Error in getAllNotifications:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create a notification (admin/system use)
    createNotification: async (req, res) => {
        try {
            const { type = 'info', message } = req.body;
            if (!message) {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }
            await db.execute(
                'INSERT INTO notifications (type, message) VALUES (?, ?)',
                [type, message]
            );
            res.status(201).json({ success: true, message: 'Notification created' });
        } catch (error) {
            console.error('Error in createNotification:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Mark a notification as read (by id)
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'UPDATE notifications SET is_read = 1 WHERE id = ?',
                [id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Notification not found' });
            }
            res.json({ success: true, message: 'Notification marked as read' });
        } catch (error) {
            console.error('Error in markAsRead:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete a notification (by id)
    deleteNotification: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM notifications WHERE id = ?',
                [id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Notification not found' });
            }
            res.json({ success: true, message: 'Notification deleted' });
        } catch (error) {
            console.error('Error in deleteNotification:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete all notifications (admin only)
    deleteAllNotifications: async (req, res) => {
        try {
            await db.execute('DELETE FROM notifications');
            res.json({ success: true, message: 'All notifications deleted' });
        } catch (error) {
            console.error('Error in deleteAllNotifications:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = notificationController; 