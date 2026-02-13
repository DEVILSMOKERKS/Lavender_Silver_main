const db = require('../config/db');
const { sendEmail } = require('../utils/emailSender');

const supportController = {
    // Admin: Get all tickets (grouped by ticket_id)
    getTickets: async (req, res) => {
        try {
            // Get latest message for each ticket_id
            const [rows] = await db.execute(`
                SELECT sm.ticket_id, sm.subject, sm.tag, sm.assigned_to, sm.priority, sm.status,
                       sm.created_at, sm.updated_at, u.id as user_id, u.name as user_name, u.email as user_email, u.photo as user_photo
                FROM support_messages sm
                JOIN user u ON sm.user_id = u.id
                INNER JOIN (
                    SELECT ticket_id, MAX(created_at) as max_created
                    FROM support_messages
                    WHERE ticket_id IS NOT NULL
                    GROUP BY ticket_id
                ) latest ON sm.ticket_id = latest.ticket_id AND sm.created_at = latest.max_created
                ORDER BY sm.created_at DESC
            `);
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // Admin: Get all messages for a ticket
    getTicketMessages: async (req, res) => {
        try {
            const { ticket_id } = req.params;
            const [rows] = await db.execute(
                'SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC',
                [ticket_id]
            );
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // Admin: Create a new ticket (first message)
    createTicket: async (req, res) => {
        try {
            const { user_id, subject, tag, assigned_to, priority, status, message } = req.body;
            if (!user_id || !subject || !message) {
                return res.status(400).json({ success: false, message: 'user_id, subject, and message are required' });
            }

            // Get user details for email
            const [userRows] = await db.execute('SELECT name, email FROM user WHERE id = ?', [user_id]);
            if (userRows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const user = userRows[0];

            // Generate ticket_id (e.g., TKT-001)
            const [last] = await db.execute('SELECT MAX(id) as max_id FROM support_messages');
            const nextId = (last[0].max_id || 0) + 1;
            const ticket_id = `TKT-${String(nextId).padStart(4, '0')}`;

            await db.execute(
                'INSERT INTO support_messages (user_id, sender, message, ticket_id, subject, tag, assigned_to, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    user_id,
                    'user',
                    message,
                    ticket_id,
                    subject ?? null,
                    tag ?? null,
                    assigned_to ?? null,
                    priority ?? 'Low',
                    status ?? 'Open'
                ]
            );

            // Create notification (user_id can be null for guest users)
            try {
                await db.execute(
                    'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                    [user_id || null, 'success', `Support ticket ${ticket_id} has been created successfully!`]
                );
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
                // Don't fail ticket creation if notification fails
            }

            // Send email notification to user
            try {
                const emailSubject = `Support Ticket Created - ${ticket_id}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Hello ${user.name},</h2>
                        <p>Your support ticket has been successfully created!</p>
                        <div style="background: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
                            <h3>Ticket Details:</h3>
                            <p><strong>Ticket ID:</strong> ${ticket_id}</p>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p><strong>Category:</strong> ${tag || 'Not specified'}</p>
                            <p><strong>Priority:</strong> ${priority || 'Low'}</p>
                            <p><strong>Status:</strong> ${status || 'Open'}</p>
                            <p><strong>Message:</strong> ${message}</p>
                        </div>
                        <p>Our support team will review your ticket and get back to you within 24 hours.</p>
                        <p>You can track your ticket status by logging into your account.</p>
                        <p>Best regards,<br>PVJ Support Team</p>
                    </div>
                `;

                await sendEmail({
                    to: user.email,
                    subject: emailSubject,
                    html: emailHtml
                });
            } catch (emailError) {
                console.error('Failed to send ticket confirmation email:', emailError);
                // Don't fail the ticket creation if email fails
            }

            res.status(201).json({ success: true, message: 'Ticket created', ticket_id });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // Admin: Reply to a ticket
    replyTicket: async (req, res) => {
        try {
            const { ticket_id } = req.params;
            const { message, status, priority, assigned_to, admin_message } = req.body;

            // Validate required fields
            if (!ticket_id) {
                return res.status(400).json({ success: false, message: 'ticket_id is required in URL parameters' });
            }
            if (!message || !message.trim()) {
                return res.status(400).json({ success: false, message: 'message is required' });
            }

            // Verify ticket exists and get user details
            const [ticketInfo] = await db.execute(`
                SELECT sm.user_id, sm.subject, u.name, u.email 
                FROM support_messages sm 
                JOIN user u ON sm.user_id = u.id 
                WHERE sm.ticket_id = ? 
                LIMIT 1
            `, [ticket_id]);

            if (!ticketInfo || ticketInfo.length === 0) {
                console.error(`[Support] Ticket not found: ${ticket_id}`);
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }

            const { user_id, subject, name, email } = ticketInfo[0];

            // IMPORTANT: Use the EXISTING ticket_id from params, do NOT create a new one
            // Insert reply message with the same ticket_id to continue the thread
            const [result] = await db.execute(
                'INSERT INTO support_messages (user_id, sender, message, admin_message, ticket_id, status, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [user_id, 'admin', message.trim(), admin_message ?? null, ticket_id, status || null, priority || null, assigned_to || null]
            );

            // Send email notification to user about admin reply
            try {
                const emailSubject = `Update on Your Support Ticket - ${ticket_id}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Hello ${name},</h2>
                        <p>Our support team has responded to your ticket.</p>
                        <div style="background: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
                            <h3>Ticket Details:</h3>
                            <p><strong>Ticket ID:</strong> ${ticket_id}</p>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p><strong>Status:</strong> ${status || 'Open'}</p>
                            <p><strong>Priority:</strong> ${priority || 'Low'}</p>
                        </div>
                        <div style="background: #e8f5e8; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #0E593C;">
                            <h4 style="margin: 0 0 10px 0; color: #0E593C;">Support Team Response:</h4>
                            <p style="margin: 0; line-height: 1.5;">${message}</p>
                        </div>
                        <p>You can view the full conversation by logging into your account.</p>
                        <p>Best regards,<br>PVJ Support Team</p>
                    </div>
                `;

                await sendEmail({
                    to: email,
                    subject: emailSubject,
                    html: emailHtml
                });
            } catch (emailError) {
                console.error('Failed to send ticket reply email:', emailError);
                // Don't fail the reply if email fails
            }

            res.status(201).json({ success: true, message: 'Reply sent' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // Admin: Update a ticket (edit priority, status, assigned_to only)
    updateTicket: async (req, res) => {
        try {
            const { ticket_id } = req.params;
            const { priority, status, assigned_to } = req.body;
            const [result] = await db.execute(
                'UPDATE support_messages SET priority=?, status=?, assigned_to=? WHERE ticket_id=?',
                [priority, status, assigned_to, ticket_id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Ticket not found' });
            res.json({ success: true, message: 'Ticket updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // Admin: Delete a ticket (all messages with this ticket_id)
    deleteTicket: async (req, res) => {
        try {
            const { ticket_id } = req.params;
            const [result] = await db.execute('DELETE FROM support_messages WHERE ticket_id = ?', [ticket_id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Ticket not found' });
            res.json({ success: true, message: 'Ticket deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // Admin: Get full details for a single ticket
    getTicketDetails: async (req, res) => {
        try {
            const { ticket_id } = req.params;

            const [ticketRows] = await db.execute(`
                SELECT 
                    sm.ticket_id, sm.subject, sm.tag, sm.assigned_to, sm.priority, sm.status, sm.created_at as ticket_created_at,
                    u.id as user_id, u.name, u.email, u.phone, u.dob, u.address
                FROM support_messages sm
                JOIN user u ON sm.user_id = u.id
                WHERE sm.ticket_id = ?
                LIMIT 1
            `, [ticket_id]);

            if (ticketRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }
            const ticketDetails = ticketRows[0];

            const [messages] = await db.execute(
                'SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY created_at ASC',
                [ticket_id]
            );

            res.json({
                success: true,
                data: {
                    details: ticketDetails,
                    messages: messages
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // User: Get all tickets for the authenticated user
    getUserTickets: async (req, res) => {
        try {
            const userId = req.user.id;

            const [rows] = await db.execute(`
                SELECT 
                    sm.ticket_id,
                    sm.subject,
                    sm.tag,
                    sm.priority,
                    sm.status,
                    sm.created_at,
                    sm.updated_at,
                    (SELECT message FROM support_messages 
                     WHERE ticket_id = sm.ticket_id 
                     ORDER BY created_at DESC LIMIT 1) as last_message
                FROM support_messages sm
                INNER JOIN (
                    SELECT ticket_id, MIN(id) as min_id
                    FROM support_messages
                    WHERE user_id = ? AND ticket_id IS NOT NULL
                    GROUP BY ticket_id
                ) first_msg ON sm.ticket_id = first_msg.ticket_id AND sm.id = first_msg.min_id
                WHERE sm.user_id = ? AND sm.ticket_id IS NOT NULL
                ORDER BY sm.created_at DESC
            `, [userId, userId]);

            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error fetching user tickets:', error);
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // User: Get all messages for a specific ticket
    getUserTicketMessages: async (req, res) => {
        try {
            const userId = req.user.id;
            const { ticket_id } = req.params;

            // Verify user owns this ticket
            const [ticketCheck] = await db.execute(
                'SELECT COUNT(*) as count FROM support_messages WHERE ticket_id = ? AND user_id = ?',
                [ticket_id, userId]
            );

            if (ticketCheck[0].count === 0) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }

            const [rows] = await db.execute(
                'SELECT * FROM support_messages WHERE ticket_id = ? AND user_id = ? ORDER BY created_at ASC',
                [ticket_id, userId]
            );

            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // User: Get all messages for the user (all tickets)
    getMessages: async (req, res) => {
        try {
            const userId = req.user.id;
            const [rows] = await db.execute(
                'SELECT * FROM support_messages WHERE user_id = ? ORDER BY created_at ASC',
                [userId]
            );
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // User: Send a message (user side, single-threaded)
    sendMessage: async (req, res) => {
        try {
            const userId = req.user.id;
            const { message, ticket_id } = req.body;
            if (!message) {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }

            // If ticket_id is provided, this is a reply to an existing ticket
            if (ticket_id) {
                // Verify user owns this ticket
                const [ticketCheck] = await db.execute(
                    'SELECT COUNT(*) as count FROM support_messages WHERE ticket_id = ? AND user_id = ?',
                    [ticket_id, userId]
                );

                if (ticketCheck[0].count === 0) {
                    return res.status(404).json({ success: false, message: 'Ticket not found' });
                }

                await db.execute(
                    'INSERT INTO support_messages (user_id, sender, message, ticket_id) VALUES (?, ?, ?, ?)',
                    [userId, 'user', message, ticket_id]
                );

                // Send email notification to admin about user reply
                try {
                    const [ticketInfo] = await db.execute(`
                        SELECT sm.subject, u.name, u.email 
                        FROM support_messages sm 
                        JOIN user u ON sm.user_id = u.id 
                        WHERE sm.ticket_id = ? 
                        LIMIT 1
                    `, [ticket_id]);

                    if (ticketInfo[0]) {
                        const { subject, name, email } = ticketInfo[0];
                        const emailSubject = `User Reply - Ticket ${ticket_id}`;
                        const emailHtml = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #333;">New User Reply</h2>
                                <p>A user has replied to their support ticket.</p>
                                <div style="background: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
                                    <h3>Ticket Details:</h3>
                                    <p><strong>Ticket ID:</strong> ${ticket_id}</p>
                                    <p><strong>Subject:</strong> ${subject}</p>
                                    <p><strong>User:</strong> ${name} (${email})</p>
                                </div>
                                <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
                                    <h4 style="margin: 0 0 10px 0; color: #856404;">User Message:</h4>
                                    <p style="margin: 0; line-height: 1.5;">${message}</p>
                                </div>
                                <p>Please respond to this ticket through the admin panel.</p>
                            </div>
                        `;

                        // Send to admin email (you can configure this in environment variables)
                        const adminEmail = process.env.ADMIN_EMAIL || 'admin@pvjjewelry.com';
                        await sendEmail({
                            to: adminEmail,
                            subject: emailSubject,
                            html: emailHtml
                        });
                    }
                } catch (emailError) {
                    console.error('Failed to send admin notification email:', emailError);
                }
            } else {
                // Create a new ticket
                await db.execute(
                    'INSERT INTO support_messages (user_id, sender, message) VALUES (?, ?, ?)',
                    [userId, 'user', message]
                );

                // Create notification for new ticket (user_id can be null for guest users)
                try {
                    await db.execute(
                        'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                        [userId || null, 'success', 'Your support message has been sent successfully!']
                    );
                } catch (notifError) {
                    console.error('Error creating notification:', notifError);
                    // Don't fail message sending if notification fails
                }
            }

            res.status(201).json({ success: true, message: 'Message sent' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },

    // Mark all messages as read for a user (by admin or user)
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.user.id || req.body.user_id;
            await db.execute('UPDATE support_messages SET is_read = 1 WHERE user_id = ?', [userId]);
            res.json({ success: true, message: 'All messages marked as read' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    },
};

module.exports = supportController; 