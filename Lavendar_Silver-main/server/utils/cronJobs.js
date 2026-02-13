const cron = require('node-cron');
const { checkAbandonedCarts } = require('../controllers/emailAutomation.controller');

// Initialize cron jobs for email automation
const initializeCronJobs = () => {


    // Check for abandoned carts every 2 minutes
    cron.schedule('*/2 * * * *', async () => {

        try {
            const result = await checkAbandonedCarts();
            if (result && result.processed > 0) {

            }
        } catch (error) {
            console.error('❌ Error checking abandoned carts:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Daily cleanup of old activity logs (keep last 90 days)
    cron.schedule('0 2 * * *', async () => {
        try {
            const db = require('../config/db');
            const [result] = await db.execute(
                'DELETE FROM user_activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
            );
        } catch (error) {
            console.error('❌ Error cleaning up activity logs:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Weekly cleanup of old email logs (keep last 180 days)
    cron.schedule('0 3 * * 0', async () => {
        try {
            const db = require('../config/db');
            const [result] = await db.execute(
                'DELETE FROM email_automation_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)'
            );
        } catch (error) {
            console.error('❌ Error cleaning up email logs:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });


};

module.exports = { initializeCronJobs }; 