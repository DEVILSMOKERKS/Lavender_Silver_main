const pool = require('../config/db');
const defaultTemplates = require('./defaultEmailTemplates');

// Subscribe existing users to promotional emails
async function subscribeExistingUsers() {
    try {
        // Get all users who are not already subscribed
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.email 
            FROM user u 
            LEFT JOIN email_subscribers es ON u.email = es.email 
            WHERE es.email IS NULL
        `);

        if (users.length > 0) {
            for (const user of users) {
                try {
                    await pool.query(
                        'INSERT INTO email_subscribers (email, name, user_id, is_active) VALUES (?, ?, ?, ?)',
                        [user.email, user.name, user.id, 1]
                    );
                } catch (error) {
                    console.error(`Error subscribing user ${user.email}:`, error);
                }
            }
        } 
    } catch (error) {
        console.error('❌ Error subscribing existing users:', error);
    }
}

// Initialize email automation system with default templates and campaigns
async function initializeEmailAutomation() {
    try {
        // Subscribe existing users to promotional emails
        await subscribeExistingUsers();

        // Insert default templates
        if (Array.isArray(defaultTemplates)) {
            for (const template of defaultTemplates) {
                const [existing] = await pool.query(
                    'SELECT id FROM email_templates WHERE name = ? AND category = ?',
                    [template.name, template.category]
                );

                if (existing.length === 0) {
                    await pool.query(
                        'INSERT INTO email_templates (name, subject, html_content, text_content, variables, category) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            template.name,
                            template.subject,
                            template.html_content,
                            template.text_content,
                            JSON.stringify(template.variables),
                            template.category
                        ]
                    );
                } 
            }
        } 

        // Initialize email automation settings
        const defaultSettings = [
            { setting_key: 'abandoned_cart_delay', setting_value: '2', description: 'Delay in minutes before sending abandoned cart emails' },
            { setting_key: 'welcome_email_delay', setting_value: '5', description: 'Delay in minutes before sending welcome emails' },
            { setting_key: 'max_emails_per_day', setting_value: '1000', description: 'Maximum emails that can be sent per day' }
        ];

        for (const setting of defaultSettings) {
            const [existing] = await pool.query(
                'SELECT id FROM email_automation_settings WHERE setting_key = ?',
                [setting.setting_key]
            );

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO email_automation_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
                    [setting.setting_key, setting.setting_value, setting.description]
                );
            } else {
                // Update existing setting to ensure 2-minute delay for abandoned cart
                if (setting.setting_key === 'abandoned_cart_delay') {
                    await pool.query(
                        'UPDATE email_automation_settings SET setting_value = ? WHERE setting_key = ?',
                        [setting.setting_value, setting.setting_key]
                    );
                } 
            }
        }

        // Get template IDs for campaigns
        const [welcomeTemplate] = await pool.query(
            'SELECT id FROM email_templates WHERE category = "Welcome" LIMIT 1'
        );
        const [abandonedCartTemplate] = await pool.query(
            'SELECT id FROM email_templates WHERE category = "Abandoned Cart" LIMIT 1'
        );
        const [orderConfirmationTemplate] = await pool.query(
            'SELECT id FROM email_templates WHERE category = "Order Confirmation" LIMIT 1'
        );
        const [promotionalTemplate] = await pool.query(
            'SELECT id FROM email_templates WHERE category = "Promotional" LIMIT 1'
        );

        // Create default campaigns
        const defaultCampaigns = [
            {
                name: 'Welcome Series - New Customers',
                type: 'Welcome Series',
                subject: 'Welcome to PVJ - Your Premium Jewelry Destination!',
                template_id: welcomeTemplate[0]?.id,
                audience_type: 'New Signups',
                trigger_type: 'Event-based',
                trigger_event: 'user_signup',
                delay_minutes: 5,
                status: 'Active'
            },
            {
                name: 'Abandoned Cart Recovery',
                type: 'Abandoned Cart',
                subject: 'Complete Your Purchase - Your Cart is Waiting!',
                template_id: abandonedCartTemplate[0]?.id,
                audience_type: 'Cart Abandoners',
                trigger_type: 'Event-based',
                trigger_event: 'cart_abandoned',
                delay_minutes: 2,
                status: 'Active'
            },
            {
                name: 'Order Confirmation',
                type: 'Order Confirmation',
                subject: 'Order Confirmed - Thank You for Your Purchase!',
                template_id: orderConfirmationTemplate[0]?.id,
                audience_type: 'Recent Purchasers',
                trigger_type: 'Event-based',
                trigger_event: 'order_placed',
                delay_minutes: 0,
                status: 'Active'
            },
            {
                name: 'New Product Launch',
                type: 'Promotional',
                subject: 'New Arrival: Exclusive Jewelry Collection!',
                template_id: promotionalTemplate[0]?.id,
                audience_type: 'All Users',
                trigger_type: 'Event-based',
                trigger_event: 'new_product',
                delay_minutes: 0,
                status: 'Active'
            },
            {
                name: 'Special Offers & Coupons',
                type: 'Promotional',
                subject: 'Special Offer: Exclusive Discount Just for You!',
                template_id: promotionalTemplate[0]?.id,
                audience_type: 'All Users',
                trigger_type: 'Event-based',
                trigger_event: 'new_coupon',
                delay_minutes: 0,
                status: 'Active'
            }
        ];

        for (const campaign of defaultCampaigns) {
            const [existing] = await pool.query(
                'SELECT id FROM email_campaigns WHERE name = ? AND type = ?',
                [campaign.name, campaign.type]
            );

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO email_campaigns (name, type, subject, template_id, audience_type, trigger_type, trigger_event, delay_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        campaign.name,
                        campaign.type,
                        campaign.subject,
                        campaign.template_id,
                        campaign.audience_type,
                        campaign.trigger_type,
                        campaign.trigger_event,
                        campaign.delay_minutes,
                        campaign.status
                    ]
                );
            } else {
                // Update existing abandoned cart campaign to use 2-minute delay
                if (campaign.type === 'Abandoned Cart') {
                    await pool.query(
                        'UPDATE email_campaigns SET delay_minutes = ? WHERE name = ? AND type = ?',
                        [campaign.delay_minutes, campaign.name, campaign.type]
                    );
                } 
            }
        }

    } catch (error) {
        console.error('❌ Error initializing email automation:', error);
        throw error;
    }
}

// Function to check if email automation is initialized
async function isEmailAutomationInitialized() {
    try {
        const [templates] = await pool.query('SELECT COUNT(*) as count FROM email_templates');
        const [campaigns] = await pool.query('SELECT COUNT(*) as count FROM email_campaigns');

        return templates[0].count > 0 && campaigns[0].count > 0;
    } catch (error) {
        console.error('Error checking email automation initialization:', error);
        return false;
    }
}

module.exports = {
    initializeEmailAutomation,
    isEmailAutomationInitialized,
    subscribeExistingUsers
};