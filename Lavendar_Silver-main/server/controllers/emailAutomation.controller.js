const pool = require('../config/db');
const { sendEmail } = require('../utils/emailSender');

// ========================================
// EMAIL CAMPAIGNS MANAGEMENT
// ========================================

// Create new email campaign
exports.createCampaign = async (req, res) => {
    const { name, type, subject, template_id, audience_type, trigger_type, trigger_event, delay_minutes, conditions } = req.body;

    if (!name || !type || !subject || !audience_type || !trigger_type) {
        return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO email_campaigns (name, type, subject, template_id, audience_type, trigger_type, trigger_event, delay_minutes, conditions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, type, subject, template_id, audience_type, trigger_type, trigger_event, delay_minutes, JSON.stringify(conditions)]
        );

        return res.status(201).json({
            success: true,
            message: 'Campaign created successfully.',
            campaign_id: result.insertId
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get all campaigns
exports.getAllCampaigns = async (req, res) => {
    try {
        const [campaigns] = await pool.query(`
            SELECT 
                ec.*,
                et.name as template_name,
                COUNT(eal.id) as total_sent,
                AVG(CASE WHEN eal.opened = 1 THEN 1 ELSE 0 END) * 100 as open_rate,
                AVG(CASE WHEN eal.clicked = 1 THEN 1 ELSE 0 END) * 100 as click_rate
            FROM email_campaigns ec
            LEFT JOIN email_templates et ON ec.template_id = et.id
            LEFT JOIN email_automation_logs eal ON ec.id = eal.campaign_id
            GROUP BY ec.id
            ORDER BY ec.created_at DESC
        `);

        return res.json({ success: true, data: campaigns });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update campaign status
exports.updateCampaignStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Paused', 'Draft'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    try {
        await pool.query('UPDATE email_campaigns SET status = ? WHERE id = ?', [status, id]);
        return res.json({ success: true, message: 'Campaign status updated successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Delete campaign
exports.deleteCampaign = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM email_campaigns WHERE id = ?', [id]);
        return res.json({ success: true, message: 'Campaign deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ========================================
// EMAIL TEMPLATES MANAGEMENT
// ========================================

// Create email template
exports.createTemplate = async (req, res) => {
    const { name, subject, html_content, text_content, variables, category } = req.body;

    if (!name || !subject || !html_content || !category) {
        return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO email_templates (name, subject, html_content, text_content, variables, category) VALUES (?, ?, ?, ?, ?, ?)',
            [name, subject, html_content, text_content, JSON.stringify(variables), category]
        );

        return res.status(201).json({
            success: true,
            message: 'Template created successfully.',
            template_id: result.insertId
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get all templates
exports.getAllTemplates = async (req, res) => {
    try {
        const [templates] = await pool.query('SELECT * FROM email_templates ORDER BY created_at DESC');
        return res.json({ success: true, data: templates });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
    const { id } = req.params;

    try {
        const [templates] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
        if (templates.length === 0) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }
        return res.json({ success: true, data: templates[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ========================================
// EMAIL AUTOMATION STATISTICS
// ========================================

// Get email automation statistics
exports.getEmailStats = async (req, res) => {
    try {
        // Total campaigns
        const [campaignCount] = await pool.query('SELECT COUNT(*) as count FROM email_campaigns');

        // Total subscribers
        const [subscriberCount] = await pool.query('SELECT COUNT(*) as count FROM email_subscribers WHERE is_active = 1');

        // Average open rate
        const [openRate] = await pool.query(`
            SELECT AVG(CASE WHEN opened = 1 THEN 1 ELSE 0 END) * 100 as rate 
            FROM email_automation_logs 
            WHERE email_sent = 1
        `);

        // Average click rate
        const [clickRate] = await pool.query(`
            SELECT AVG(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) * 100 as rate 
            FROM email_automation_logs 
            WHERE email_sent = 1
        `);

        return res.json({
            success: true,
            data: {
                total_campaigns: campaignCount[0].count,
                total_subscribers: subscriberCount[0].count,
                avg_open_rate: parseFloat(openRate[0].rate || 0).toFixed(1),
                avg_ctr: parseFloat(clickRate[0].rate || 0).toFixed(1)
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ========================================
// EMAIL AUTOMATION TRIGGERS
// ========================================

// Trigger welcome email for new signup
exports.triggerWelcomeEmail = async (userId, userEmail, userName) => {
    try {
        // Get welcome email campaign
        const [campaigns] = await pool.query(
            'SELECT * FROM email_campaigns WHERE type = "Welcome Series" AND status = "Active" LIMIT 1'
        );

        if (campaigns.length === 0) return;

        const campaign = campaigns[0];

        // Get template
        const [templates] = await pool.query(
            'SELECT * FROM email_templates WHERE id = ? AND category = "Welcome"',
            [campaign.template_id]
        );

        if (templates.length === 0) return;

        const template = templates[0];

        // Replace variables in template
        let htmlContent = template.html_content;
        htmlContent = htmlContent.replace(/\{\{user_name\}\}/g, userName);
        htmlContent = htmlContent.replace(/\{\{user_email\}\}/g, userEmail);

        // Send email
        const emailResult = await sendEmail({
            to: userEmail,
            subject: template.subject,
            html: htmlContent
        });

        // Log the email
        await pool.query(
            'INSERT INTO email_automation_logs (campaign_id, user_id, user_email, email_sent, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
            [campaign.id, userId, userEmail, emailResult.success, emailResult.success ? 'Sent' : 'Failed']
        );

        return emailResult;
    } catch (err) {
        console.error('Welcome email trigger error:', err);
    }
};

// Trigger abandoned cart email
exports.triggerAbandonedCartEmail = async (userId, userEmail, userName, cartItems) => {
    try {
        // Get abandoned cart campaign
        const [campaigns] = await pool.query(
            'SELECT * FROM email_campaigns WHERE type = "Abandoned Cart" AND status = "Active" LIMIT 1'
        );

        if (campaigns.length === 0) return;

        const campaign = campaigns[0];

        // Get template
        const [templates] = await pool.query(
            'SELECT * FROM email_templates WHERE id = ? AND category = "Abandoned Cart"',
            [campaign.template_id]
        );

        if (templates.length === 0) return;

        const template = templates[0];

        // Replace variables in template
        let htmlContent = template.html_content;
        htmlContent = htmlContent.replace(/\{\{user_name\}\}/g, userName);
        htmlContent = htmlContent.replace(/\{\{cart_items\}\}/g, JSON.stringify(cartItems));

        // Send email
        const emailResult = await sendEmail({
            to: userEmail,
            subject: template.subject,
            html: htmlContent
        });

        // Log the email
        await pool.query(
            'INSERT INTO email_automation_logs (campaign_id, user_id, user_email, email_sent, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
            [campaign.id, userId, userEmail, emailResult.success, emailResult.success ? 'Sent' : 'Failed']
        );

        return emailResult;
    } catch (err) {
        console.error('Abandoned cart email trigger error:', err);
    }
};

// Trigger order confirmation email
exports.triggerOrderConfirmationEmail = async (userId, userEmail, userName, orderDetails) => {
    try {
        // Get order confirmation campaign
        const [campaigns] = await pool.query(
            'SELECT * FROM email_campaigns WHERE type = "Order Confirmation" AND status = "Active" LIMIT 1'
        );

        if (campaigns.length === 0) return;

        const campaign = campaigns[0];

        // Get template
        const [templates] = await pool.query(
            'SELECT * FROM email_templates WHERE id = ? AND category = "Order Confirmation"',
            [campaign.template_id]
        );

        if (templates.length === 0) return;

        const template = templates[0];

        // Enrich order items with product names if items have product_id
        if (orderDetails.items && orderDetails.items.length > 0) {
            const productIds = orderDetails.items
                .map(item => item.product_id)
                .filter(id => id);

            if (productIds.length > 0) {
                const [products] = await pool.query(
                    `SELECT id, item_name FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
                    productIds
                );

                const productMap = {};
                products.forEach(prod => {
                    productMap[prod.id] = prod.item_name;
                });

                // Add product names to items
                orderDetails.items = orderDetails.items.map(item => ({
                    ...item,
                    product_name: item.product_name || productMap[item.product_id] || item.item_name || 'Product'
                }));
            }
        }

        // Replace variables in template
        let htmlContent = template.html_content;
        htmlContent = htmlContent.replace(/\{\{user_name\}\}/g, userName || 'Customer');
        htmlContent = htmlContent.replace(/\{\{order_number\}\}/g, orderDetails.order_number || 'N/A');
        htmlContent = htmlContent.replace(/\{\{order_total\}\}/g, orderDetails.total ? `₹${parseFloat(orderDetails.total).toLocaleString('en-IN')}` : '₹0');

        // Format order details for {{order_object}} placeholder
        let orderDetailsHtml = '';
        if (orderDetails) {
            orderDetailsHtml = `
                <div style="margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                    <h3 style="color: #0e593c; margin-top: 0;">Order Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #333; width: 40%;">Order Number:</td>
                            <td style="padding: 8px 0; color: #666;">${orderDetails.order_number || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #333;">Total Amount:</td>
                            <td style="padding: 8px 0; color: #666; font-size: 18px; font-weight: bold; color: #0e593c;">₹${orderDetails.total ? parseFloat(orderDetails.total).toLocaleString('en-IN') : '0'}</td>
                        </tr>
                        ${orderDetails.shipping_address ? `
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #333;">Shipping Address:</td>
                            <td style="padding: 8px 0; color: #666;">${orderDetails.shipping_address || ''}${orderDetails.shipping_city ? `, ${orderDetails.shipping_city}` : ''}${orderDetails.shipping_state ? `, ${orderDetails.shipping_state}` : ''}${orderDetails.shipping_postal_code ? ` - ${orderDetails.shipping_postal_code}` : ''}</td>
                        </tr>
                        ` : ''}
                        ${orderDetails.payment_method ? `
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #333;">Payment Method:</td>
                            <td style="padding: 8px 0; color: #666;">${orderDetails.payment_method}</td>
                        </tr>
                        ` : ''}
                    </table>
                    ${orderDetails.items && orderDetails.items.length > 0 ? `
                    <div style="margin-top: 20px;">
                        <h4 style="color: #333; margin-bottom: 10px;">Order Items:</h4>
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                            <thead>
                                <tr style="background: #0e593c; color: white;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th>
                                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantity</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderDetails.items.map((item, index) => `
                                    <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                                        <td style="padding: 10px; border: 1px solid #ddd;">
                                            ${item.product_name || item.item_name || 'Product'}${item.size ? ` (Size: ${item.size})` : ''}${item.weight ? ` (Weight: ${item.weight}g)` : ''}
                                        </td>
                                        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity || 1}</td>
                                        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₹${item.price ? parseFloat(item.price).toLocaleString('en-IN') : '0'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background: #e8f5e8; font-weight: bold;">
                                    <td colspan="2" style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total:</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ddd; color: #0e593c;">₹${orderDetails.total ? parseFloat(orderDetails.total).toLocaleString('en-IN') : '0'}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        // Replace {{order_object}} with formatted order details
        htmlContent = htmlContent.replace(/\{\{order_object\}\}/g, orderDetailsHtml);

        // Send email
        const emailResult = await sendEmail({
            to: userEmail,
            subject: template.subject,
            html: htmlContent
        });

        // Log the email
        await pool.query(
            'INSERT INTO email_automation_logs (campaign_id, user_id, user_email, email_sent, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
            [campaign.id, userId, userEmail, emailResult.success, emailResult.success ? 'Sent' : 'Failed']
        );

        return emailResult;
    } catch (err) {
        console.error('Order confirmation email trigger error:', err);
    }
};

// Trigger promotional email for new products/coupons
exports.triggerPromotionalEmail = async (productData = null, couponData = null) => {
    try {
        // Get promotional campaign
        const [campaigns] = await pool.query(
            'SELECT * FROM email_campaigns WHERE type = "Promotional" AND status = "Active" LIMIT 1'
        );

        if (campaigns.length === 0) return;

        const campaign = campaigns[0];

        // Get all active subscribers
        const [subscribers] = await pool.query(
            'SELECT * FROM email_subscribers WHERE is_active = 1'
        );

        if (subscribers.length === 0) return;

        // Get template
        const [templates] = await pool.query(
            'SELECT * FROM email_templates WHERE id = ? AND category = "Promotional"',
            [campaign.template_id]
        );

        if (templates.length === 0) return;

        const template = templates[0];

        // Send to all subscribers
        for (const subscriber of subscribers) {
            let htmlContent = template.html_content;

            if (productData) {
                htmlContent = htmlContent.replace(/\{\{product_name\}\}/g, productData.name);
                htmlContent = htmlContent.replace(/\{\{product_price\}\}/g, productData.price);
            }

            if (couponData) {
                htmlContent = htmlContent.replace(/\{\{coupon_code\}\}/g, couponData.code);
                htmlContent = htmlContent.replace(/\{\{discount_value\}\}/g, couponData.discount);
            }

            // Send email
            const emailResult = await sendEmail({
                to: subscriber.email,
                subject: template.subject,
                html: htmlContent
            });

            // Log the email
            await pool.query(
                'INSERT INTO email_automation_logs (campaign_id, user_id, user_email, email_sent, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
                [campaign.id, subscriber.user_id, subscriber.email, emailResult.success, emailResult.success ? 'Sent' : 'Failed']
            );
        }

        return { success: true, sent_to: subscribers.length };
    } catch (err) {
        console.error('Promotional email trigger error:', err);
    }
};

// Trigger Product Launch email specifically for new products
exports.triggerProductLaunchEmail = async (productData) => {
    try {

        // Get Product Launch campaign specifically
        const [campaigns] = await pool.query(
            'SELECT * FROM email_campaigns WHERE type = "Promotional" AND trigger_event = "new_product" AND status = "Active" LIMIT 1'
        );

        if (campaigns.length === 0) {
            return { success: false, error: 'No active Product Launch campaign found' };
        }

        const campaign = campaigns[0];

        // Get all active subscribers
        const [subscribers] = await pool.query(
            'SELECT * FROM email_subscribers WHERE is_active = 1'
        );

        if (subscribers.length === 0) {
            return { success: false, error: 'No active subscribers found' };
        }


        // Get the Product Launch template specifically
        const [templates] = await pool.query(
            'SELECT * FROM email_templates WHERE name = "New Product Launch" AND category = "Promotional" LIMIT 1'
        );

        if (templates.length === 0) {
            return { success: false, error: 'Product Launch template not found' };
        }

        const template = templates[0];

        let sentCount = 0;
        let failedCount = 0;

        // Send to all subscribers
        for (const subscriber of subscribers) {
            try {
                let htmlContent = template.html_content;
                let textContent = template.text_content || '';

                // Replace variables in HTML content
                htmlContent = htmlContent.replace(/\{\{user_name\}\}/g, subscriber.name || 'Valued Customer');
                htmlContent = htmlContent.replace(/\{\{product_name\}\}/g, productData.name);
                htmlContent = htmlContent.replace(/\{\{product_description\}\}/g, productData.description || '');
                htmlContent = htmlContent.replace(/\{\{product_price\}\}/g, productData.price || '');
                htmlContent = htmlContent.replace(/\{\{product_sku\}\}/g, productData.sku || '');
                htmlContent = htmlContent.replace(/\{\{product_url\}\}/g, `${process.env.FRONTEND_URL || 'https://pvjewellers.in'}/product/${productData.slug || productData.sku}`);

                // Replace variables in text content
                textContent = textContent.replace(/\{\{user_name\}\}/g, subscriber.name || 'Valued Customer');
                textContent = textContent.replace(/\{\{product_name\}\}/g, productData.name);
                textContent = textContent.replace(/\{\{product_description\}\}/g, productData.description || '');
                textContent = textContent.replace(/\{\{product_price\}\}/g, productData.price || '');
                textContent = textContent.replace(/\{\{product_sku\}\}/g, productData.sku || '');
                textContent = textContent.replace(/\{\{product_url\}\}/g, `${process.env.FRONTEND_URL || 'https://pvjewellers.in'}/product/${productData.slug || productData.sku}`);

                // Send email
                const emailResult = await sendEmail({
                    to: subscriber.email,
                    subject: template.subject,
                    html: htmlContent,
                    text: textContent
                });

                // Log the email
                await pool.query(
                    'INSERT INTO email_automation_logs (campaign_id, user_id, user_email, email_sent, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
                    [campaign.id, subscriber.user_id, subscriber.email, emailResult.success, emailResult.success ? 'Sent' : 'Failed']
                );

                if (emailResult.success) {
                    sentCount++;
                } else {
                    failedCount++;
                    console.error(`❌ Failed to send email to ${subscriber.email}:`, emailResult.error);
                }
            } catch (error) {
                failedCount++;
                console.error(`❌ Error sending email to ${subscriber.email}:`, error);
            }
        }

        return { success: true, sent_to: sentCount, failed: failedCount, total_subscribers: subscribers.length };
    } catch (err) {
        console.error('❌ Product Launch email trigger error:', err);
        return { success: false, error: err.message };
    }
};

// Trigger coupon email specifically for new coupons
exports.triggerCouponEmail = async (couponData) => {
    try {
        // Get coupon campaign specifically
        const [campaigns] = await pool.query(
            'SELECT * FROM email_campaigns WHERE type = "Promotional" AND trigger_event = "new_coupon" AND status = "Active" LIMIT 1'
        );

        if (campaigns.length === 0) {
            return;
        }

        const campaign = campaigns[0];

        // Get all active subscribers
        const [subscribers] = await pool.query(
            'SELECT * FROM email_subscribers WHERE is_active = 1'
        );

        if (subscribers.length === 0) {
            return;
        }

        // Get the Special Offer & Coupon template specifically
        const [templates] = await pool.query(
            'SELECT * FROM email_templates WHERE name = "Special Offer & Coupon" AND category = "Promotional" LIMIT 1'
        );

        if (templates.length === 0) {
            return;
        }

        const template = templates[0];

        // Send to all subscribers
        for (const subscriber of subscribers) {
            let htmlContent = template.html_content;
            let textContent = template.text_content;

            // Replace variables in HTML content
            htmlContent = htmlContent.replace(/\{\{user_name\}\}/g, subscriber.name || 'Valued Customer');
            htmlContent = htmlContent.replace(/\{\{coupon_code\}\}/g, couponData.code);
            htmlContent = htmlContent.replace(/\{\{discount_value\}\}/g, couponData.discount);
            htmlContent = htmlContent.replace(/\{\{expiry_date\}\}/g, couponData.end_date || 'Limited Time');

            // Replace variables in text content
            textContent = textContent.replace(/\{\{user_name\}\}/g, subscriber.name || 'Valued Customer');
            textContent = textContent.replace(/\{\{coupon_code\}\}/g, couponData.code);
            textContent = textContent.replace(/\{\{discount_value\}\}/g, couponData.discount);
            textContent = textContent.replace(/\{\{expiry_date\}\}/g, couponData.end_date || 'Limited Time');

            // Send email
            const emailResult = await sendEmail({
                to: subscriber.email,
                subject: template.subject,
                html: htmlContent,
                text: textContent
            });

            // Log the email (use 0 if user_id is null to avoid NOT NULL constraint error)
            await pool.query(
                'INSERT INTO email_automation_logs (campaign_id, user_id, user_email, email_sent, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
                [campaign.id, subscriber.user_id || 0, subscriber.email, emailResult.success, emailResult.success ? 'Sent' : 'Failed']
            );
        }

        return { success: true, sent_to: subscribers.length };
    } catch (err) {
        console.error('Coupon email trigger error:', err);
        return { success: false, error: err.message };
    }
};

// ========================================
// USER ACTIVITY TRACKING
// ========================================

// Log user activity
exports.logUserActivity = async (userId, activityType, activityData = {}) => {
    try {
        await pool.query(
            'INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)',
            [userId, activityType, JSON.stringify(activityData)]
        );
    } catch (err) {
        console.error('Activity logging error:', err);
    }
};

// Reset abandoned cart email tracking for a user (called when user makes purchase or clears cart)
exports.resetAbandonedCartTracking = async (userId) => {
    try {
        // Delete any pending abandoned cart email logs for this user
        await pool.query(`
            DELETE eal FROM email_automation_logs eal
            JOIN email_campaigns ec ON eal.campaign_id = ec.id
            WHERE eal.user_id = ? 
            AND ec.type = 'Abandoned Cart'
            AND eal.email_sent = 0
        `, [userId]);

    } catch (err) {
        console.error('Error resetting abandoned cart tracking:', err);
    }
};

// Check for abandoned carts and trigger emails
exports.checkAbandonedCarts = async () => {
    try {
        // Get settings
        const [settings] = await pool.query(
            'SELECT setting_value FROM email_automation_settings WHERE setting_key = "abandoned_cart_delay"'
        );

        const delayMinutes = settings.length > 0 ? parseInt(settings[0].setting_value) : 60;

        // Find abandoned carts that haven't been emailed yet
        const [abandonedCarts] = await pool.query(`
            SELECT 
                ci.user_id,
                u.email,
                u.name,
                MIN(ci.added_at) as added_at,
                GROUP_CONCAT(
                    CONCAT(
                        '{"product_id":', ci.product_id,
                        ',"quantity":', ci.quantity,
                        ',"price":', COALESCE(po.sell_price, po.value, 0),
                        '}'
                    ) SEPARATOR ','
                ) as cart_items
            FROM cart_items ci
            JOIN user u ON ci.user_id = u.id
            LEFT JOIN product_options po ON ci.product_option_id = po.id
            WHERE ci.added_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
            AND NOT EXISTS (
                SELECT 1 FROM orders o 
                WHERE o.user_id = ci.user_id 
                AND o.created_at > ci.added_at
            )
            AND NOT EXISTS (
                SELECT 1 FROM email_automation_logs eal
                JOIN email_campaigns ec ON eal.campaign_id = ec.id
                WHERE eal.user_id = ci.user_id 
                AND ec.type = 'Abandoned Cart'
                AND eal.email_sent = 1
                AND eal.sent_at > ci.added_at
            )
            GROUP BY ci.user_id, u.email, u.name
        `, [delayMinutes]);

        // Trigger abandoned cart emails
        for (const cart of abandonedCarts) {
            // Convert GROUP_CONCAT result to valid JSON array
            const cartItemsJson = '[' + cart.cart_items + ']';
            await this.triggerAbandonedCartEmail(
                cart.user_id,
                cart.email,
                cart.name,
                JSON.parse(cartItemsJson)
            );
        }

        return { success: true, processed: abandonedCarts.length };
    } catch (err) {
        console.error('Abandoned cart check error:', err);
    }
};

// ========================================
// EMAIL SUBSCRIBERS MANAGEMENT
// ========================================

// Add email subscriber
exports.addSubscriber = async (req, res) => {
    const { email, name, user_id } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        // Check if already subscribed
        const [existing] = await pool.query('SELECT * FROM email_subscribers WHERE email = ?', [email]);

        if (existing.length > 0) {
            if (existing[0].is_active) {
                return res.status(409).json({ success: false, message: 'Email already subscribed.' });
            } else {
                // Reactivate subscription
                await pool.query(
                    'UPDATE email_subscribers SET is_active = 1, unsubscription_date = NULL WHERE email = ?',
                    [email]
                );
                return res.json({ success: true, message: 'Subscription reactivated successfully.' });
            }
        }

        // Add new subscriber
        await pool.query(
            'INSERT INTO email_subscribers (email, name, user_id) VALUES (?, ?, ?)',
            [email, name, user_id]
        );

        // Create notification (user_id can be null for guest users)
        try {
            await pool.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [user_id || null, 'success', 'You have successfully subscribed to our newsletter!']
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't fail subscription if notification fails
        }

        return res.status(201).json({ success: true, message: 'Subscribed successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Unsubscribe email
exports.unsubscribeEmail = async (req, res) => {
    const { email } = req.params;

    try {
        await pool.query(
            'UPDATE email_subscribers SET is_active = 0, unsubscription_date = NOW() WHERE email = ?',
            [email]
        );

        return res.json({ success: true, message: 'Unsubscribed successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get all subscribers
exports.getAllSubscribers = async (req, res) => {
    try {
        const [subscribers] = await pool.query(`
            SELECT es.*, u.name as user_name 
            FROM email_subscribers es 
            LEFT JOIN user u ON es.user_id = u.id 
            ORDER BY es.subscription_date DESC
        `);
        return res.json({ success: true, data: subscribers });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ========================================
// MANUAL EMAIL SENDING FUNCTIONALITY
// ========================================

// Get users for manual email sending
exports.getUsersForManualEmail = async (req, res) => {
    try {
        const { filter = 'all', days = 30 } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        switch (filter) {
            case 'new_signups':
                whereClause += ' AND u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
                params.push(parseInt(days));
                break;
            case 'active_users':
                whereClause += ' AND EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY))';
                params.push(parseInt(days));
                break;
            case 'cart_abandoners':
                whereClause += ' AND EXISTS (SELECT 1 FROM cart_items ci WHERE ci.user_id = u.id AND ci.added_at < DATE_SUB(NOW(), INTERVAL 1 HOUR) AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.created_at > ci.added_at))';
                break;
            case 'recent_purchasers':
                whereClause += ' AND EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY))';
                params.push(parseInt(days));
                break;
            default:
                // All users
                break;
        }

        const [users] = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at as signup_date,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(o.total_amount) as total_spent
            FROM user u
            LEFT JOIN orders o ON u.id = o.user_id
            ${whereClause}
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `, params);

        return res.json({ success: true, data: users });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get products for manual email sending
exports.getProductsForManualEmail = async (req, res) => {
    try {
        const { filter = 'all', category = '' } = req.query;

        let whereClause = 'WHERE p.status = "active"';
        const params = [];

        switch (filter) {
            case 'new_products':
                whereClause += ' AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            case 'bestsellers':
                whereClause += ' AND EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY))';
                break;
            case 'luxury':
                whereClause += ' AND EXISTS (SELECT 1 FROM product_category_map pcm JOIN categories c ON pcm.category_id = c.id WHERE pcm.product_id = p.id AND c.name LIKE "%Luxury%")';
                break;
            case 'signature':
                whereClause += ' AND EXISTS (SELECT 1 FROM product_category_map pcm JOIN categories c ON pcm.category_id = c.id WHERE pcm.product_id = p.id AND c.name LIKE "%Signature%")';
                break;
            default:
                break;
        }

        if (category) {
            whereClause += ' AND EXISTS (SELECT 1 FROM product_category_map pcm JOIN categories c ON pcm.category_id = c.id WHERE pcm.product_id = p.id AND c.name = ?)';
            params.push(category);
        }

        const [products] = await pool.query(`
            SELECT 
                p.id,
                p.item_name,
                p.slug,
                p.description,
                po.sell_price as price,
                p.status,
                p.created_at,
                COUNT(DISTINCT oi.order_id) as total_orders,
                SUM(oi.quantity) as total_sold
            FROM products p
            LEFT JOIN product_options po ON p.id = po.product_id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            ${whereClause}
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, params);

        return res.json({ success: true, data: products });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get offers/coupons for manual email sending
exports.getOffersForManualEmail = async (req, res) => {
    try {
        const { filter = 'all', status = 'active' } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status === 'active') {
            whereClause += ' AND (o.end_date IS NULL OR o.end_date >= NOW())';
        }

        switch (filter) {
            case 'new_offers':
                whereClause += ' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'expiring_soon':
                whereClause += ' AND o.end_date IS NOT NULL AND o.end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)';
                break;
            case 'high_discount':
                whereClause += ' AND o.discount_value >= 20';
                break;
            default:
                break;
        }

        const [offers] = await pool.query(`
            SELECT 
                o.id,
                o.code,
                o.discount_value as discount_percentage,
                o.discount_value as discount_amount,
                o.minimum_order_amount as minimum_amount,
                o.max_discount_amount as maximum_discount,
                o.start_date,
                o.end_date,
                NULL as usage_limit,
                0 as used_count,
                o.created_at,
                o.status
            FROM offers o
            ${whereClause}
            ORDER BY o.created_at DESC
        `, params);

        return res.json({ success: true, data: offers });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Send manual email to selected users
exports.sendManualEmail = async (req, res) => {
    try {
        const {
            campaign_type,
            template_id,
            user_ids,
            product_id,
            offer_id,
            custom_subject,
            custom_message,
            template_content
        } = req.body;

        if (!campaign_type || !template_id || !user_ids || user_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Required fields are missing.' });
        }

        // Get template
        const [templates] = await pool.query(
            'SELECT * FROM email_templates WHERE id = ?',
            [template_id]
        );

        if (templates.length === 0) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        const template = templates[0];

        // Use custom template content if provided, otherwise use original template content
        const finalTemplateContent = template_content || template.html_content;

        // Get users
        const [users] = await pool.query(
            'SELECT * FROM user WHERE id IN (?)',
            [user_ids]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found.' });
        }

        // Get product data if provided
        let productData = null;
        if (product_id) {
            const [products] = await pool.query(
                'SELECT * FROM products WHERE id = ?',
                [product_id]
            );
            if (products.length > 0) {
                productData = products[0];
            }
        }

        // Get offer data if provided
        let offerData = null;
        if (offer_id) {
            const [offers] = await pool.query(
                'SELECT * FROM offers WHERE id = ?',
                [offer_id]
            );
            if (offers.length > 0) {
                offerData = offers[0];
            }
        }

        // Map campaign type to database enum values
        let dbCampaignType = campaign_type;
        if (campaign_type === 'Promotional') {
            dbCampaignType = 'Promotional';
        } else if (campaign_type === 'Product Launch') {
            dbCampaignType = 'Promotional'; // Product Launch emails are stored as Promotional type
        } else if (campaign_type === 'Welcome Series') {
            dbCampaignType = 'Welcome Series';
        } else if (campaign_type === 'Abandoned Cart') {
            dbCampaignType = 'Abandoned Cart';
        } else if (campaign_type === 'Order Confirmation') {
            dbCampaignType = 'Order Confirmation';
        } else {
            dbCampaignType = 'Promotional'; // Default to Promotional for other types
        }

        // Create campaign for tracking
        const [campaignResult] = await pool.query(
            'INSERT INTO email_campaigns (name, type, subject, template_id, audience_type, trigger_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                `Manual ${campaign_type} Campaign - ${new Date().toLocaleDateString()}`,
                dbCampaignType,
                custom_subject || template.subject,
                template_id,
                'Specific Segment',
                'Immediate',
                'Active'
            ]
        );

        const campaignId = campaignResult.insertId;
        let sentCount = 0;
        let failedCount = 0;

        // Send emails to each user with better error handling
        for (const user of users) {
            try {
                let htmlContent = finalTemplateContent;
                let textContent = template.text_content || '';

                // Replace variables in HTML content
                htmlContent = htmlContent.replace(/\{\{user_name\}\}/g, user.name || 'Valued Customer');
                htmlContent = htmlContent.replace(/\{\{user_email\}\}/g, user.email);

                // Replace variables in text content
                textContent = textContent.replace(/\{\{user_name\}\}/g, user.name || 'Valued Customer');
                textContent = textContent.replace(/\{\{user_email\}\}/g, user.email);

                // Add product variables if product is selected
                if (productData) {
                    htmlContent = htmlContent.replace(/\{\{product_name\}\}/g, productData.name);
                    htmlContent = htmlContent.replace(/\{\{product_description\}\}/g, productData.description || '');
                    htmlContent = htmlContent.replace(/\{\{product_price\}\}/g, productData.price || '');
                    htmlContent = htmlContent.replace(/\{\{product_sku\}\}/g, productData.sku || '');
                    htmlContent = htmlContent.replace(/\{\{product_url\}\}/g, `${process.env.FRONTEND_URL || 'https://pvjewellers.in'}/product/${productData.slug || productData.sku}`);

                    textContent = textContent.replace(/\{\{product_name\}\}/g, productData.name);
                    textContent = textContent.replace(/\{\{product_description\}\}/g, productData.description || '');
                    textContent = textContent.replace(/\{\{product_price\}\}/g, productData.price || '');
                    textContent = textContent.replace(/\{\{product_sku\}\}/g, productData.sku || '');
                    textContent = textContent.replace(/\{\{product_url\}\}/g, `${process.env.FRONTEND_URL || 'https://pvjewellers.in'}/product/${productData.slug || productData.sku}`);
                }

                // Add offer variables if offer is selected
                if (offerData) {
                    htmlContent = htmlContent.replace(/\{\{coupon_code\}\}/g, offerData.code);
                    htmlContent = htmlContent.replace(/\{\{discount_value\}\}/g, offerData.discount_value ? `${offerData.discount_value}%` : `₹${offerData.discount_value}`);
                    htmlContent = htmlContent.replace(/\{\{expiry_date\}\}/g, offerData.end_date ? new Date(offerData.end_date).toLocaleDateString() : 'Limited Time');

                    textContent = textContent.replace(/\{\{coupon_code\}\}/g, offerData.code);
                    textContent = textContent.replace(/\{\{discount_value\}\}/g, offerData.discount_value ? `${offerData.discount_value}%` : `₹${offerData.discount_value}`);
                    textContent = textContent.replace(/\{\{expiry_date\}\}/g, offerData.end_date ? new Date(offerData.end_date).toLocaleDateString() : 'Limited Time');
                }

                // Add custom message if provided
                if (custom_message) {
                    htmlContent = htmlContent.replace(/\{\{custom_message\}\}/g, custom_message);
                    textContent = textContent.replace(/\{\{custom_message\}\}/g, custom_message);
                }

                // Send email
                const emailResult = await sendEmail({
                    to: user.email,
                    subject: custom_subject || template.subject,
                    html: htmlContent,
                    text: textContent
                });

                // Log the email
                await pool.query(
                    'INSERT INTO email_automation_logs (campaign_id, user_id, user_email, email_sent, sent_at, status) VALUES (?, ?, ?, ?, NOW(), ?)',
                    [campaignId, user.id, user.email, emailResult.success, emailResult.success ? 'Sent' : 'Failed']
                );

                if (emailResult.success) {
                    sentCount++;
                } else {
                    failedCount++;
                    console.error(`Failed to send email to ${user.email}:`, emailResult.error);
                }

                // Add a small delay to prevent overwhelming the email service
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failedCount++;
                console.error(`Error sending email to ${user.email}:`, error);
            }
        }

        return res.json({
            success: true,
            message: `Manual email campaign completed. Sent: ${sentCount}, Failed: ${failedCount}`,
            data: {
                campaign_id: campaignId,
                total_users: users.length,
                sent_count: sentCount,
                failed_count: failedCount
            }
        });
    } catch (err) {
        console.error('Manual email sending error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get abandoned cart users for manual email
exports.getAbandonedCartUsers = async (req, res) => {
    try {
        const { hours = 1 } = req.query;

        const [abandonedCarts] = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                MIN(ci.added_at) as cart_added_at,
                COUNT(ci.id) as cart_items_count,
                SUM(COALESCE(po.sell_price, po.value, 0) * ci.quantity) as cart_total,
                GROUP_CONCAT(
                    CONCAT(
                        '{"product_id":', ci.product_id,
                        ',"quantity":', ci.quantity,
                        ',"price":', COALESCE(po.sell_price, po.value, 0),
                        '}'
                    ) SEPARATOR ','
                ) as cart_items
            FROM cart_items ci
            JOIN user u ON ci.user_id = u.id
            LEFT JOIN product_options po ON ci.product_option_id = po.id
            WHERE ci.added_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
            AND NOT EXISTS (
                SELECT 1 FROM orders o 
                WHERE o.user_id = ci.user_id 
                AND o.created_at > ci.added_at
            )
            AND NOT EXISTS (
                SELECT 1 FROM email_automation_logs eal
                JOIN email_campaigns ec ON eal.campaign_id = ec.id
                WHERE eal.user_id = ci.user_id 
                AND ec.type = 'Abandoned Cart'
                AND eal.email_sent = 1
                AND eal.sent_at > ci.added_at
            )
            GROUP BY u.id, u.name, u.email, u.phone
            ORDER BY MIN(ci.added_at) ASC
        `, [parseInt(hours)]);

        // Convert cart items string to JSON
        const usersWithCartItems = abandonedCarts.map(cart => ({
            ...cart,
            cart_items: JSON.parse('[' + cart.cart_items + ']')
        }));

        return res.json({ success: true, data: usersWithCartItems });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// No need for additional export since we're using exports.functionName format 