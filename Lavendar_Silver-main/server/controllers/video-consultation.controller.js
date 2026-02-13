const db = require('../config/db');
const { sendOTP, sendConsultationConfirmation, sendRescheduleNotification, sendStatusUpdateNotification } = require('../utils/emailSender');
const facebookPixelTracker = require('../utils/facebookPixelTracker');

// Global OTP storage (in production, use Redis or similar)
const otpStorage = new Map();

// Create consultation request
const { v4: uuidv4 } = require('uuid');
const sendWhatsAppOTP = async (whatsappNumber, otp, name) => {
    // Integrate with WhatsApp API in production
};

// Send WhatsApp message function
const sendWhatsAppMessage = async (whatsappNumber, message) => {
    try {
        // TODO: Integrate with your preferred WhatsApp API service
        // Examples: Twilio, WhatsApp Business API, or custom implementation

        // For now, we'll log the message (replace with actual API call)

        // Example Twilio implementation (uncomment and configure):
        /*
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await client.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${whatsappNumber}`
        });
        */

        // Example WhatsApp Business API implementation (uncomment and configure):
        /*
        const axios = require('axios');
        
        await axios.post('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
            messaging_product: 'whatsapp',
            to: whatsappNumber,
            type: 'text',
            text: { body: message }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        */

        return true;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return false;
    }
};

const createConsultationRequest = async (req, res) => {
    try {
        const {
            name,
            email,
            whatsapp_number,
            cart_snapshot,
            consultation_date,
            consultation_time,
            consultation_duration = 15,
            admin_notes
        } = req.body;

        // Get guest_id from cookies or generate one
        let guestId = req.cookies.guest_id || null;

        // If no guest_id in cookies, generate one
        if (!guestId) {
            guestId = uuidv4();
            // Set cookie in response
            res.cookie('guest_id', guestId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
            });
        }

        if (!name || !email || !whatsapp_number || !cart_snapshot) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, WhatsApp number, and cart snapshot are required'
            });
        }

        // Check if OTP already exists and is not expired
        const existingOtp = otpStorage.get(email);
        if (existingOtp && new Date() < new Date(existingOtp.expiresAt)) {
            return res.status(400).json({
                success: false,
                message: 'OTP already sent. Please wait before requesting again.'
            });
        }

        // Generate OTP and store globally
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

        // Store OTP globally with expiry
        otpStorage.set(email, {
            otp,
            expiresAt: otpExpiresAt,
            whatsappNumber: whatsapp_number
        });

        // Determine user_id and anonymous_id
        let userId = null;
        let anonymousId = null;

        if (req.user && req.user.id) {
            // Logged-in user
            userId = req.user.id;
            anonymousId = null;
        } else {
            // Guest user
            userId = null;
            anonymousId = guestId;
        }

        // Ensure cart_snapshot is properly formatted
        let formattedCartSnapshot = cart_snapshot;
        if (typeof cart_snapshot === 'string') {
            try {
                formattedCartSnapshot = JSON.parse(cart_snapshot);
            } catch (e) {
                formattedCartSnapshot = [];
            }
        }

        // Insert into DB
        const [result] = await db.execute(
            `INSERT INTO video_consultation_requests 
            (user_id, anonymous_id, name, email, whatsapp_number, otp_verified, cart_snapshot, 
             consultation_date, consultation_time, consultation_duration, status, admin_notes) 
             VALUES (?, ?, ?, ?, ?, false, ?, ?, ?, ?, 'requested', ?)`,
            [
                userId,
                anonymousId,
                name,
                email,
                whatsapp_number,
                JSON.stringify(formattedCartSnapshot),
                consultation_date || null,
                consultation_time || null,
                consultation_duration,
                admin_notes || null
            ]
        );

        await sendWhatsAppOTP(whatsapp_number, otp, name);

        // Send OTP email
        try {
            const { videoConsultationTemplates } = require('../utils/defaultEmailTemplates');
            const { sendEmail } = require('../utils/emailSender');

            const emailHtml = videoConsultationTemplates.otpVerification(name, otp);

            await sendEmail({
                to: email,
                subject: '🎥 Video Consultation OTP - PVJ',
                html: emailHtml
            });

        } catch (emailError) {
            console.error('Error sending OTP email:', emailError);
        }

        // Send OTP WhatsApp message
        try {
            const { videoConsultationTemplates } = require('../utils/defaultEmailTemplates');

            const whatsappMessage = videoConsultationTemplates.whatsappMessage(name, otp);
            await sendWhatsAppMessage(whatsapp_number, whatsappMessage);
        } catch (whatsappError) {
            console.error('Error sending OTP WhatsApp message:', whatsappError);
        }

        res.status(201).json({
            success: true,
            message: 'Consultation request created. OTP sent to your email and WhatsApp.',
            data: {
                request_id: result.insertId,
                email,
                whatsapp_number: whatsapp_number,
                user_id: userId,
                anonymous_id: anonymousId
            }
        });
    } catch (error) {
        console.error('Error creating consultation request:', error);
        res.status(500).json({ success: false, message: 'Error creating consultation request' });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        // Get OTP from global storage
        const storedOtpData = otpStorage.get(email);
        if (!storedOtpData) {
            return res.status(400).json({ success: false, message: 'No pending request found' });
        }

        const { otp: storedOtp, expiresAt, whatsappNumber } = storedOtpData;

        if (storedOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (new Date() > new Date(expiresAt)) {
            // Clean up expired OTP
            otpStorage.delete(email);
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        // Get consultation request details
        const [requests] = await db.execute(
            `SELECT * FROM video_consultation_requests WHERE email = ? AND status = 'requested' ORDER BY created_at DESC LIMIT 1`,
            [email]
        );

        if (requests.length === 0) {
            return res.status(400).json({ success: false, message: 'Consultation request not found' });
        }

        const consultationRequest = requests[0];

        // Update database
        await db.execute(
            `UPDATE video_consultation_requests SET otp_verified = true, status = 'otp_verified', updated_at = NOW() WHERE email = ? AND status = 'requested'`,
            [email]
        );

        // Clean up OTP from storage
        otpStorage.delete(email);

        // Send confirmation email
        try {
            const { videoConsultationTemplates } = require('../utils/defaultEmailTemplates');

            // Parse cart snapshot for email
            let cartItems = [];
            try {
                const snapshot = consultationRequest.cart_snapshot;

                if (snapshot) {
                    cartItems = typeof snapshot === 'string'
                        ? JSON.parse(snapshot)
                        : Array.isArray(snapshot)
                            ? snapshot
                            : [];
                }
            } catch (e) {
                console.error('❌ Error parsing cart_snapshot:', e);
                cartItems = [];
            }

            // Enrich cartItems with product details
            if (cartItems.length > 0) {
                const productIds = cartItems.map(item => item.product_id);
                const [productRows] = await db.execute(
                    `SELECT p.id, p.item_name, p.sku, p.description, 
                            (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image_url
                     FROM products p
                     WHERE p.id IN (${productIds.map(() => '?').join(',')})`,
                    productIds
                );
                const productMap = {};
                productRows.forEach(prod => { productMap[prod.id] = prod; });
                cartItems = cartItems.map(item => {
                    let merged = { ...item, ...productMap[item.product_id] };
                    if (merged.image_url) {
                        merged.image_url = process.env.BASE_URL + merged.image_url;
                    }
                    return merged;
                });
            }

            // Send booking confirmation email
            const emailHtml = videoConsultationTemplates.bookingConfirmation(
                consultationRequest.name,
                consultationRequest.consultation_date || 'To be scheduled',
                consultationRequest.consultation_time || 'To be scheduled',
                cartItems
            );

            // Import email sender
            const { sendEmail } = require('../utils/emailSender');

            await sendEmail({
                to: consultationRequest.email,
                subject: '🎉 Video Consultation Confirmed - PVJ',
                html: emailHtml
            });

        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
        }

        // Send WhatsApp confirmation message
        try {
            if (whatsappNumber) {
                const { videoConsultationTemplates } = require('../utils/defaultEmailTemplates');

                const whatsappMessage = videoConsultationTemplates.whatsappMessage(
                    consultationRequest.name,
                    'CONFIRMED'
                );

                // Send WhatsApp message (implement your WhatsApp API integration here)
                await sendWhatsAppMessage(whatsappNumber, whatsappMessage);
            }
        } catch (whatsappError) {
            console.error('Error sending WhatsApp confirmation:', whatsappError);
        }

        res.json({
            success: true,
            message: 'OTP verified successfully. Confirmation sent to your email and WhatsApp.',
            data: {
                consultation_id: consultationRequest.id,
                email: consultationRequest.email,
                whatsapp_number: whatsappNumber
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Error verifying OTP' });
    }
};

// Get user consultation requests
const getUserConsultationRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        // Validate and convert parameters to integers
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;

        let query = `
      SELECT id, name, email, consultation_date, consultation_time, 
             consultation_duration, status, created_at, updated_at
      FROM video_consultation_requests 
      WHERE user_id = ?
    `;
        let params = [userId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT ${parseInt(limitNum) || 10} OFFSET ${parseInt(offset) || 0}`;

        const [requests] = await db.execute(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM video_consultation_requests WHERE user_id = ?';
        let countParams = [userId];

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: requests,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limitNum),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching user consultation requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consultation requests'
        });
    }
};

// Cancel user consultation
const cancelUserConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await db.execute(
            `UPDATE video_consultation_requests 
       SET status = 'cancelled' 
       WHERE id = ? AND user_id = ? AND status IN ('requested', 'otp_verified', 'confirmed')`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found or cannot be cancelled'
            });
        }

        res.json({
            success: true,
            message: 'Consultation cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling consultation:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling consultation'
        });
    }
};

// Get all consultation requests (admin)
const getAllConsultationRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search, date_from, date_to } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT vcr.id, vcr.name, vcr.email, vcr.whatsapp_number,
             vcr.consultation_date, vcr.consultation_time, vcr.consultation_duration,
             vcr.status, vcr.otp_verified, vcr.admin_notes, vcr.created_at, vcr.updated_at,
             vcr.cart_snapshot, vcr.video_booking_status,
             u.name as user_name, u.email as user_email
      FROM video_consultation_requests vcr
      LEFT JOIN user u ON vcr.user_id = u.id
      WHERE 1=1
    `;
        let params = [];

        if (status) {
            query += ' AND vcr.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (vcr.name LIKE ? OR vcr.email LIKE ? OR vcr.whatsapp_number LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (date_from) {
            query += ' AND DATE(vcr.created_at) >= ?';
            params.push(date_from);
        }

        if (date_to) {
            query += ' AND DATE(vcr.created_at) <= ?';
            params.push(date_to);
        }

        query += ` ORDER BY vcr.created_at DESC LIMIT ${parseInt(limit) || 10} OFFSET ${parseInt(offset) || 0}`;

        const [requests] = await db.execute(query, params);

        // Parse cart_snapshot and format dates
        const formattedRequests = await Promise.all(requests.map(async (r) => {
            let parsedCartSnapshot = [];
            try {
                if (r.cart_snapshot) {
                    parsedCartSnapshot = typeof r.cart_snapshot === 'string' ? JSON.parse(r.cart_snapshot) : r.cart_snapshot;

                    // Enhance cart snapshot with actual data instead of just IDs
                    if (Array.isArray(parsedCartSnapshot) && parsedCartSnapshot.length > 0) {
                        const enhancedCartSnapshot = await Promise.all(parsedCartSnapshot.map(async (item) => {
                            const enhancedItem = { ...item };

                            // Fetch user data if user_id exists
                            if (item.user_id) {
                                try {
                                    const [userResult] = await db.execute(
                                        'SELECT id, name, email, phone FROM user WHERE id = ?',
                                        [item.user_id]
                                    );
                                    if (userResult.length > 0) {
                                        enhancedItem.user_name = userResult[0].name;
                                        enhancedItem.user_email = userResult[0].email;
                                        enhancedItem.user_phone = userResult[0].phone;
                                    }
                                } catch (error) {
                                    console.error('Error fetching user data:', error);
                                }
                            }

                            // Fetch product data if product_id exists
                            if (item.product_id) {
                                try {
                                    const [productResult] = await db.execute(`
                                        SELECT p.id, p.item_name, p.sku, p.description, p.total_rs,
                                               c.name as category_name, sc.name as subcategory_name
                                        FROM products p
                                        LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                                        LEFT JOIN categories c ON pcm.category_id = c.id
                                        LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
                                        WHERE p.id = ?
                                    `, [item.product_id]);
                                    if (productResult.length > 0) {
                                        enhancedItem.product_name = productResult[0].item_name;
                                        enhancedItem.product_sku = productResult[0].sku;
                                        enhancedItem.product_description = productResult[0].description;
                                        enhancedItem.product_price = productResult[0].total_rs;
                                        enhancedItem.category_name = productResult[0].category_name;
                                        enhancedItem.subcategory_name = productResult[0].subcategory_name;
                                    }
                                } catch (error) {
                                    console.error('Error fetching product data:', error);
                                }
                            }

                            // Remove diamond_quality field as requested
                            delete enhancedItem.diamond_quality;

                            return enhancedItem;
                        }));
                        parsedCartSnapshot = enhancedCartSnapshot;
                    }
                }
            } catch (e) {
                console.error('Error parsing cart_snapshot for request ID:', r.id, e);
                parsedCartSnapshot = [];
            }

            return {
                ...r,
                cart_snapshot: parsedCartSnapshot,
                created_at: r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '',
                updated_at: r.updated_at ? new Date(r.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '',
            };
        }));

        // Get total count
        let countQuery = `
      SELECT COUNT(*) as total 
      FROM video_consultation_requests vcr
      WHERE 1=1
    `;
        let countParams = [];

        if (status) {
            countQuery += ' AND vcr.status = ?';
            countParams.push(status);
        }

        if (search) {
            countQuery += ' AND (vcr.name LIKE ? OR vcr.email LIKE ? OR vcr.whatsapp_number LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (date_from) {
            countQuery += ' AND DATE(vcr.created_at) >= ?';
            countParams.push(date_from);
        }

        if (date_to) {
            countQuery += ' AND DATE(vcr.created_at) <= ?';
            countParams.push(date_to);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: formattedRequests,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching consultation requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consultation requests'
        });
    }
};

// Get consultation request by ID (admin)
const getConsultationRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const [requests] = await db.execute(
            `SELECT vcr.*, u.name as user_name, u.email as user_email
       FROM video_consultation_requests vcr
       LEFT JOIN user u ON vcr.user_id = u.id
       WHERE vcr.id = ?`,
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        const request = requests[0];

        // Parse cart_snapshot and enhance with actual data
        try {
            let parsedCartSnapshot = request.cart_snapshot ? JSON.parse(request.cart_snapshot) : [];

            // Enhance cart snapshot with actual data instead of just IDs
            if (Array.isArray(parsedCartSnapshot) && parsedCartSnapshot.length > 0) {
                const enhancedCartSnapshot = await Promise.all(parsedCartSnapshot.map(async (item) => {
                    const enhancedItem = { ...item };

                    // Fetch user data if user_id exists
                    if (item.user_id) {
                        try {
                            const [userResult] = await db.execute(
                                'SELECT id, name, email, phone FROM user WHERE id = ?',
                                [item.user_id]
                            );
                            if (userResult.length > 0) {
                                enhancedItem.user_name = userResult[0].name;
                                enhancedItem.user_email = userResult[0].email;
                                enhancedItem.user_phone = userResult[0].phone;
                            }
                        } catch (error) {
                            console.error('Error fetching user data:', error);
                        }
                    }

                    // Fetch product data if product_id exists
                    if (item.product_id) {
                        try {
                            const [productResult] = await db.execute(`
                                SELECT p.id, p.item_name, p.sku, p.description, p.total_rs,
                                       c.name as category_name, sc.name as subcategory_name
                                FROM products p
                                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                                LEFT JOIN categories c ON pcm.category_id = c.id
                                LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
                                WHERE p.id = ?
                            `, [item.product_id]);
                            if (productResult.length > 0) {
                                enhancedItem.product_name = productResult[0].item_name;
                                enhancedItem.product_sku = productResult[0].sku;
                                enhancedItem.product_description = productResult[0].description;
                                enhancedItem.product_price = productResult[0].total_rs || productResult[0].base_price;
                                enhancedItem.category_name = productResult[0].category_name;
                                enhancedItem.subcategory_name = productResult[0].subcategory_name;
                            }
                        } catch (error) {
                            console.error('Error fetching product data:', error);
                        }
                    }

                    // Remove diamond_quality field as requested
                    delete enhancedItem.diamond_quality;

                    return enhancedItem;
                }));
                request.cart_snapshot = enhancedCartSnapshot;
            } else {
                request.cart_snapshot = parsedCartSnapshot;
            }
        } catch (e) {
            console.error('Error parsing cart_snapshot for request ID:', request.id, e);
            request.cart_snapshot = [];
        }

        res.json({
            success: true,
            data: request
        });

    } catch (error) {
        console.error('Error fetching consultation request:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consultation request'
        });
    }
};

// Update consultation status (admin)
const updateConsultationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, video_booking_status, admin_notes } = req.body;



        if (!status && !video_booking_status) {
            return res.status(400).json({
                success: false,
                message: 'Status or video_booking_status is required'
            });
        }

        let updateFields = [];
        let updateValues = [];

        if (status) {
            const validStatuses = ['requested', 'otp_verified', 'confirmed', 'completed', 'cancelled', 'scheduled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (video_booking_status) {
            const validBookingStatuses = ['scheduled', 'completed', 'cancelled'];
            if (!validBookingStatuses.includes(video_booking_status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid video_booking_status'
                });
            }
            updateFields.push('video_booking_status = ?');
            updateValues.push(video_booking_status);
        }

        if (admin_notes !== undefined) {
            updateFields.push('admin_notes = ?');
            updateValues.push(admin_notes);
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        const [result] = await db.execute(
            `UPDATE video_consultation_requests 
       SET ${updateFields.join(', ')}
       WHERE id = ?`,
            [...updateValues, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        // Send status update notification email for ALL status changes
        if (status || video_booking_status) {
            const [request] = await db.execute(
                'SELECT name, email, consultation_date, consultation_time, status, video_booking_status FROM video_consultation_requests WHERE id = ?',
                [id]
            );

            if (request.length > 0 && request[0].email) {
                try {
                    // Determine which status to use for email - prioritize the changed status
                    let statusToSend = null;
                    let statusType = null;

                    if (status) {
                        statusToSend = status;
                        statusType = 'status';
                    } else if (video_booking_status) {
                        statusToSend = video_booking_status;
                        statusType = 'video_booking_status';
                    } else {
                        // Fallback to current status if no change detected
                        statusToSend = request[0].status || request[0].video_booking_status;
                        statusType = request[0].status ? 'status' : 'video_booking_status';
                    }

                    if (!statusToSend) {
                    } else {
                        if (statusToSend === 'confirmed' && statusType === 'status') {
                            const emailResult = await sendConsultationConfirmation(
                                request[0].email,
                                request[0].name,
                                request[0].consultation_date || 'To be scheduled',
                                request[0].consultation_time || 'To be scheduled'
                            );

                            if (!emailResult || !emailResult.success) {
                                console.error(`Failed to send confirmation email:`, emailResult?.error || 'Unknown error');
                            }
                        } else {
                            const emailResult = await sendStatusUpdateNotification(
                                request[0].email,
                                request[0].name,
                                id,
                                statusToSend,
                                request[0].consultation_date || null,
                                request[0].consultation_time || null,
                                admin_notes || ''
                            );
                            if (!emailResult || !emailResult.success) {
                                console.error(`Failed to send status update email:`, emailResult?.error || 'Unknown error');
                            }
                        }
                    }

                    const { sendEmail } = require('../utils/emailSender');
                    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pvj.com';
                    const adminSubject = `Video Consultation Status Updated - CON-${id}`;
                    const adminHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Video Consultation Status Update</h2>
                            <p>A video consultation status has been updated by an admin.</p>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p><strong>Consultation ID:</strong> CON-${id}</p>
                                <p><strong>Customer:</strong> ${request[0].name}</p>
                                <p><strong>Customer Email:</strong> ${request[0].email}</p>
                                <p><strong>New Status:</strong> ${statusToSend.charAt(0).toUpperCase() + statusToSend.slice(1)}</p>
                                <p><strong>Date:</strong> ${request[0].consultation_date || 'N/A'}</p>
                                <p><strong>Time:</strong> ${request[0].consultation_time || 'N/A'}</p>
                                ${admin_notes ? `<p><strong>Admin Notes:</strong> ${admin_notes}</p>` : ''}
                            </div>
                        </div>
                    `;

                    try {
                        const adminEmailResult = await sendEmail({
                            to: adminEmail,
                            subject: adminSubject,
                            html: adminHtml
                        });
                    } catch (adminEmailError) {
                        console.error('Error sending admin notification email:', adminEmailError);
                    }
                } catch (emailError) {
                    console.error('Error sending status update notification email:', emailError);
                }
            }
        }

        res.json({
            success: true,
            message: 'Consultation status updated successfully'
        });

    } catch (error) {
        console.error('Error updating consultation status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating consultation status'
        });
    }
};

// Update admin notes (admin)
const updateAdminNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        const [result] = await db.execute(
            `UPDATE video_consultation_requests 
       SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [admin_notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        res.json({
            success: true,
            message: 'Admin notes updated successfully'
        });

    } catch (error) {
        console.error('Error updating admin notes:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating admin notes'
        });
    }
};

// Delete consultation request (admin)
const deleteConsultationRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM video_consultation_requests WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        res.json({
            success: true,
            message: 'Consultation request deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting consultation request:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting consultation request'
        });
    }
};

// Get consultation statistics (admin)
const getConsultationStatistics = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        let dateFilter = '';
        let params = [];

        if (date_from && date_to) {
            dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
            params = [date_from, date_to];
        }

        // Total requests
        const [totalResult] = await db.execute(
            `SELECT COUNT(*) as total FROM video_consultation_requests ${dateFilter}`,
            params
        );

        // Status-wise counts
        const [statusResult] = await db.execute(
            `SELECT status, COUNT(*) as count 
       FROM video_consultation_requests ${dateFilter}
       GROUP BY status`,
            params
        );

        // Daily requests for last 30 days
        const [dailyResult] = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM video_consultation_requests 
       WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
        );

        // OTP verification rate
        const [otpResult] = await db.execute(
            `SELECT 
         COUNT(*) as total_requests,
         SUM(CASE WHEN otp_verified = true THEN 1 ELSE 0 END) as verified_requests
       FROM video_consultation_requests ${dateFilter}`,
            params
        );

        const statistics = {
            total_requests: totalResult[0].total,
            status_breakdown: statusResult,
            daily_requests: dailyResult,
            otp_verification_rate: otpResult[0].total_requests > 0
                ? (otpResult[0].verified_requests / otpResult[0].total_requests * 100).toFixed(2)
                : 0
        };

        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        console.error('Error fetching consultation statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consultation statistics'
        });
    }
};

// Reschedule consultation (admin)
const rescheduleConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const { consultation_date, consultation_time, admin_notes } = req.body;

        if (!consultation_date || !consultation_time) {
            return res.status(400).json({
                success: false,
                message: 'Consultation date and time are required'
            });
        }

        // Get old date and time before updating
        const [oldRequest] = await db.execute(
            'SELECT name, email, consultation_date, consultation_time FROM video_consultation_requests WHERE id = ?',
            [id]
        );

        if (oldRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        const oldDate = oldRequest[0].consultation_date;
        const oldTime = oldRequest[0].consultation_time;

        const [result] = await db.execute(
            `UPDATE video_consultation_requests 
       SET consultation_date = ?, consultation_time = ?, 
           admin_notes = CONCAT(COALESCE(admin_notes, ''), '\nRescheduled to: ', ?, ' ', ?),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [consultation_date, consultation_time, consultation_date, consultation_time, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consultation request not found'
            });
        }

        // Send reschedule notification email to user
        if (oldRequest.length > 0 && oldRequest[0].email) {
            try {
                const emailResult = await sendRescheduleNotification(
                    oldRequest[0].email,
                    oldRequest[0].name,
                    id,
                    oldDate || 'Not scheduled', // old date
                    oldTime || 'Not scheduled', // old time
                    consultation_date, // new date
                    consultation_time, // new time
                    admin_notes || ''
                );
                if (!emailResult || !emailResult.success) {
                    console.error('Failed to send reschedule notification email:', emailResult?.error || 'Unknown error');
                }

                const { sendEmail } = require('../utils/emailSender');
                const adminEmail = process.env.ADMIN_EMAIL || 'admin@pvj.com';
                const adminSubject = `Video Consultation Rescheduled - CON-${id}`;
                const adminHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Video Consultation Rescheduled</h2>
                        <p>A video consultation has been rescheduled by an admin.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p><strong>Consultation ID:</strong> CON-${id}</p>
                            <p><strong>Customer:</strong> ${oldRequest[0].name}</p>
                            <p><strong>Customer Email:</strong> ${oldRequest[0].email}</p>
                            <p><strong>Previous Date:</strong> ${oldDate || 'N/A'}</p>
                            <p><strong>Previous Time:</strong> ${oldTime || 'N/A'}</p>
                            <p><strong>New Date:</strong> ${consultation_date}</p>
                            <p><strong>New Time:</strong> ${consultation_time}</p>
                            ${admin_notes ? `<p><strong>Admin Notes:</strong> ${admin_notes}</p>` : ''}
                        </div>
                    </div>
                `;

                try {
                    const adminEmailResult = await sendEmail({
                        to: adminEmail,
                        subject: adminSubject,
                        html: adminHtml
                    });
                } catch (adminEmailError) {
                    console.error('Error sending admin reschedule notification email:', adminEmailError);
                }
            } catch (emailError) {
                console.error('Error sending reschedule notification email:', emailError);
                console.error('Error details:', {
                    consultationId: id,
                    email: oldRequest[0].email,
                    error: emailError.message || emailError
                });
                // Don't fail the request if email fails, but log it clearly
            }
        }

        res.json({
            success: true,
            message: 'Consultation rescheduled successfully'
        });

    } catch (error) {
        console.error('Error rescheduling consultation:', error);
        res.status(500).json({
            success: false,
            message: 'Error rescheduling consultation'
        });
    }
};

const getGuestConsultationRequests = async (req, res) => {
    try {
        const anonymousId = req.cookies.guest_id;

        if (!anonymousId) {
            return res.status(400).json({
                success: false,
                message: 'Anonymous ID not found in cookies'
            });
        }

        const [requests] = await db.execute(
            `SELECT id, name, email, consultation_date, consultation_time, 
                    consultation_duration, status, created_at, updated_at
             FROM video_consultation_requests 
             WHERE anonymous_id = ?
             ORDER BY created_at DESC`,
            [anonymousId]
        );

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching guest consultation requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consultation requests'
        });
    }
};

// =============================
// VIDEO CART ITEMS CRUD (for logged-in users)
// =============================

// Get all video cart items for logged-in user
const getVideoCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const [items] = await db.execute(`
            SELECT 
                vci.*,
                p.item_name as product_name,
                p.slug as product_slug,
                p.sku,
                p.stamp,
                p.discount,
                p.total_rs,
                po.sell_price as option_sell_price,
                po.sell_price as option_value,
                po.size,
                po.weight,
                po.dimensions,
                po.metal_color,
                po.gender,
                po.occasion,
                pi.image_url
            FROM video_cart_items vci
            JOIN products p ON vci.product_id = p.id
            LEFT JOIN product_options po ON vci.product_option_id = po.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = 1
            WHERE vci.user_id = ?
            ORDER BY vci.added_at DESC
        `, [userId]);

        // Calculate final price for each item using dynamic pricing
        const itemsWithPrices = items.map(item => {
            // Dynamic pricing logic - prioritize product option pricing
            let sellPrice = 0;

            // Try to get price from product_options sell_price first
            if (item.option_sell_price) {
                sellPrice = Number(item.option_sell_price);
            }
            // Try to get price from product_options value
            else if (item.option_value) {
                sellPrice = Number(item.option_value);
            }
            // Try to get price from products total_rs
            else if (item.total_rs) {
                sellPrice = Number(item.total_rs);
            }
            // Fallback to 0 if no price found
            else {
                sellPrice = 0;
            }

            const discount = parseFloat(item.discount || 0);
            const finalPrice = discount > 0 ? sellPrice - (sellPrice * discount / 100) : sellPrice;
            const totalPrice = finalPrice * item.quantity;

            return {
                ...item,
                product_price: sellPrice,
                final_price: finalPrice,
                total_price: totalPrice,
                // Include option details for frontend
                option_details: {
                    size: item.size,
                    weight: item.weight,
                    dimensions: item.dimensions,
                    metal_color: item.metal_color,
                    gender: item.gender,
                    occasion: item.occasion
                }
            };
        });

        res.json({ success: true, data: itemsWithPrices });
    } catch (error) {
        console.error('Error fetching video cart:', error);
        res.status(500).json({ success: false, message: 'Error fetching video cart' });
    }
};

// Add item to video cart
const addVideoCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            product_id,
            product_option_id,
            quantity = 1
        } = req.body;

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'product_id is required' });
        }

        // If product_option_id is provided, validate it exists
        let finalProductOptionId = product_option_id;
        if (product_option_id) {
            const [productOptions] = await db.execute(
                'SELECT * FROM product_options WHERE id = ? AND product_id = ?',
                [product_option_id, product_id]
            );

            if (productOptions.length === 0) {
                return res.status(404).json({ success: false, message: 'Product option not found' });
            }
        } else {
            // Get the first available product option if none specified
            const [firstOptions] = await db.execute(
                'SELECT * FROM product_options WHERE product_id = ? ORDER BY id ASC LIMIT 1',
                [product_id]
            );

            if (firstOptions.length === 0) {
                return res.status(404).json({ success: false, message: 'No product options available' });
            }

            finalProductOptionId = firstOptions[0].id;
        }

        // Check if item already exists with the same product and option
        const [existing] = await db.execute(
            `SELECT * FROM video_cart_items WHERE user_id = ? AND product_id = ? AND product_option_id = ?`,
            [userId, product_id, finalProductOptionId]
        );

        if (existing.length > 0) {
            // Update quantity
            await db.execute(
                `UPDATE video_cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ? AND product_option_id = ?`,
                [quantity, userId, product_id, finalProductOptionId]
            );
        } else {
            await db.execute(
                `INSERT INTO video_cart_items (user_id, product_id, product_option_id, quantity) VALUES (?, ?, ?, ?)`,
                [userId, product_id, finalProductOptionId, quantity]
            );
        }
        res.json({ success: true, message: 'Added to video cart' });
    } catch (error) {
        console.error('Error adding to video cart:', error);
        res.status(500).json({ success: false, message: 'Error adding to video cart' });
    }
};

// Update video cart item
const updateVideoCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { quantity, product_option_id } = req.body;

        // Validate quantity
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            return res.status(400).json({ success: false, message: 'Valid quantity is required' });
        }

        // Build update query dynamically based on what's provided
        let updateQuery;
        let updateParams;

        if (product_option_id !== undefined && product_option_id !== null) {
            // Update both quantity and product_option_id
            updateQuery = `UPDATE video_cart_items SET quantity = ?, product_option_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
            updateParams = [quantity, product_option_id, id, userId];
        } else {
            // Update only quantity (don't change product_option_id)
            updateQuery = `UPDATE video_cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
            updateParams = [quantity, id, userId];
        }

        const [result] = await db.execute(updateQuery, updateParams);

        if (result.affectedRows === 0) {
            console.error(`[VideoCart] Video cart item not found: id=${id}, userId=${userId}`);
            return res.status(404).json({ success: false, message: 'Video cart item not found' });
        }

        res.json({ success: true, message: 'Video cart item updated' });
    } catch (error) {
        console.error('[VideoCart] Error updating video cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating video cart item',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Remove video cart item
const removeVideoCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const [result] = await db.execute(
            `DELETE FROM video_cart_items WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Video cart item not found' });
        }
        res.json({ success: true, message: 'Video cart item removed' });
    } catch (error) {
        console.error('Error removing video cart item:', error);
        res.status(500).json({ success: false, message: 'Error removing video cart item' });
    }
};

// Clear all video cart items for user
const clearVideoCart = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.execute(
            `DELETE FROM video_cart_items WHERE user_id = ?`,
            [userId]
        );
        res.json({ success: true, message: 'Video cart cleared' });
    } catch (error) {
        console.error('Error clearing video cart:', error);
        res.status(500).json({ success: false, message: 'Error clearing video cart' });
    }
};

// Get all users for admin consultation creation
const getAllUsersForConsultation = async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, name, email, phone FROM user WHERE status = 'active' ORDER BY name ASC`
        );

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// Get categories for consultation
const getCategoriesForConsultation = async (req, res) => {
    try {
        const [categories] = await db.execute(
            `SELECT id, name FROM categories WHERE status = 'active' ORDER BY name ASC`
        );

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories'
        });
    }
};

// Get subcategories for consultation
const getSubcategoriesForConsultation = async (req, res) => {
    try {
        const { categoryId } = req.params;

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }

        const [subcategories] = await db.execute(
            `SELECT id, name FROM subcategories WHERE category_id = ? AND status = 'active' ORDER BY name ASC`,
            [categoryId]
        );

        res.json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subcategories'
        });
    }
};

// Get products for consultation
const getProductsForConsultation = async (req, res) => {
    try {
        const { categoryId, subcategoryId, productId } = req.query;

        let query = `
            SELECT DISTINCT p.id, p.item_name, p.sku, p.description,
                   COALESCE(po.sell_price, 0) as sell_price,
                   po.metal_color, po.size, po.weight,
                   c.name as category_name, sc.name as subcategory_name
            FROM products p
            LEFT JOIN product_options po ON p.id = po.product_id
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
            WHERE p.status = 'active'
        `;

        let params = [];

        if (productId) {
            query += ' AND p.id = ?';
            params.push(productId);
        } else if (subcategoryId) {
            query += ' AND pcm.subcategory_id = ?';
            params.push(subcategoryId);
        } else if (categoryId) {
            query += ' AND pcm.category_id = ?';
            params.push(categoryId);
        }

        // Only filter by price if not requesting a specific product
        if (!productId) {
            query += ' AND po.sell_price > 0';
        }

        query += ' ORDER BY p.item_name ASC LIMIT 100';

        const [products] = await db.execute(query, params);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
};

const adminCreateConsultation = async (req, res) => {
    try {
        const {
            name,
            email,
            whatsapp_number,
            consultation_date,
            consultation_time,
            consultation_duration = 15,
            status = 'scheduled',
            admin_notes,
            user_id,
            selected_category_id,
            selected_subcategory_id,
            selected_product_ids
        } = req.body;
        if (!name || !email || !consultation_date || !consultation_time) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, consultation date & time are required'
            });
        }

        // Validate status - must be one of the valid enum values
        const validStatuses = ['requested', 'otp_verified', 'confirmed', 'completed', 'cancelled', 'scheduled'];
        const finalStatus = validStatuses.includes(status) ? status : 'scheduled';

        if (!validStatuses.includes(status)) {
            console.warn(`Invalid status '${status}' provided. Using default 'scheduled'`);
        }
        // Generate cart snapshot based on selection
        let cartSnapshot = [];

        if (selected_product_ids && selected_product_ids.length > 0) {
            // Specific products selected
            const placeholders = selected_product_ids.map(() => '?').join(',');
            const [products] = await db.execute(`
                SELECT DISTINCT p.id, p.item_name, p.sku, p.description,
                       COALESCE(po.sell_price, 0) as sell_price,
                       po.metal_color, po.size, po.weight,
                       c.name as category_name, sc.name as subcategory_name
                FROM products p
                LEFT JOIN product_options po ON p.id = po.product_id
                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                LEFT JOIN categories c ON pcm.category_id = c.id
                LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
                WHERE p.id IN (${placeholders}) AND p.status = 'active'
            `, selected_product_ids);

            cartSnapshot = products;
        } else if (selected_subcategory_id) {
            // Subcategory selected
            const [products] = await db.execute(`
                SELECT DISTINCT p.id, p.item_name, p.sku, p.description,
                       COALESCE(po.sell_price, 0) as sell_price,
                       po.metal_color, po.size, po.weight,
                       c.name as category_name, sc.name as subcategory_name
                FROM products p
                LEFT JOIN product_options po ON p.id = po.product_id
                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                LEFT JOIN categories c ON pcm.category_id = c.id
                LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
                WHERE pcm.subcategory_id = ? AND p.status = 'active'
                AND po.sell_price > 0
                ORDER BY p.item_name ASC LIMIT 100
            `, [selected_subcategory_id]);

            cartSnapshot = products;
        } else if (selected_category_id) {
            // Category selected
            const [products] = await db.execute(`
                SELECT DISTINCT p.id, p.item_name, p.sku, p.description,
                       COALESCE(po.sell_price, 0) as sell_price,
                       po.metal_color, po.size, po.weight,
                       c.name as category_name, sc.name as subcategory_name
                FROM products p
                LEFT JOIN product_options po ON p.id = po.product_id
                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                LEFT JOIN categories c ON pcm.category_id = c.id
                LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
                WHERE pcm.category_id = ? AND p.status = 'active'
                AND po.sell_price > 0
                ORDER BY p.item_name ASC LIMIT 100
            `, [selected_category_id]);

            cartSnapshot = products;
        }

        // Generate anonymous_id if no user_id provided
        let anonymousId = null;
        if (!user_id) {
            anonymousId = uuidv4();
        }

        const [result] = await db.execute(
            `INSERT INTO video_consultation_requests 
            (user_id, anonymous_id, name, email, whatsapp_number, cart_snapshot, 
             consultation_date, consultation_time, consultation_duration, status, admin_notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id || null,
                anonymousId,
                name,
                email,
                whatsapp_number || null,
                JSON.stringify(cartSnapshot),
                consultation_date,
                consultation_time,
                consultation_duration,
                finalStatus,
                admin_notes || null
            ]
        ); res.status(201).json({
            success: true,
            message: 'Consultation created successfully',
            data: {
                request_id: result.insertId,
                cart_snapshot: cartSnapshot
            }
        });

        // Track Facebook Pixel VideoConsultation event
        try {
            const userId = user_id || anonymousId;
            await facebookPixelTracker.trackVideoConsultation(userId, result.insertId, 'video_consultation');
        } catch (pixelError) {
            console.error('Facebook Pixel tracking error:', pixelError);
        }

    } catch (error) {
        console.error('Error creating consultation (admin):', error);
        res.status(500).json({
            success: false,
            message: 'Error creating consultation'
        });
    }
};

module.exports = {
    createConsultationRequest,
    verifyOTP,
    getUserConsultationRequests,
    cancelUserConsultation,
    getAllConsultationRequests,
    getConsultationRequestById,
    updateConsultationStatus,
    updateAdminNotes,
    deleteConsultationRequest,
    getConsultationStatistics,
    rescheduleConsultation,
    getGuestConsultationRequests,
    // Video cart CRUD
    getVideoCart,
    addVideoCartItem,
    updateVideoCartItem,
    removeVideoCartItem,
    clearVideoCart,
    // Admin consultation creation
    adminCreateConsultation,
    getAllUsersForConsultation,
    getCategoriesForConsultation,
    getSubcategoriesForConsultation,
    getProductsForConsultation
}; 