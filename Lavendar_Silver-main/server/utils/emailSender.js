const nodemailer = require('nodemailer');

// Create transporter once (reuse for all emails)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail', 'sendgrid', etc.
    host: process.env.EMAIL_HOST, // for custom SMTP
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : undefined,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail({ to, subject, html, text, from, attachments }) {
    try {
        console.log(`[Email] Attempting to send email to: ${to}, subject: ${subject}`);
        
        if (!to || !subject || (!html && !text)) {
            const errorMsg = 'Missing required email fields (to, subject, html/text)';
            console.error(`[Email] ${errorMsg}`, { to, subject, hasHtml: !!html, hasText: !!text });
            throw new Error(errorMsg);
        }

        // Check if email configuration is set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            const errorMsg = 'Email configuration missing (EMAIL_USER or EMAIL_PASS not set)';
            console.error(`[Email] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        const mailOptions = {
            from: from || process.env.EMAIL_USER,
            to,
            subject,
            html,
            text,
            attachments,
        };
        
        console.log(`[Email] Sending email from: ${mailOptions.from} to: ${mailOptions.to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Email sent successfully. MessageId: ${info.messageId}`);
        return { success: true, info };
    } catch (error) {
        // Log error for debugging
        console.error('[Email] Email send error:', error);
        console.error('[Email] Error details:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        return { success: false, error: error.message || error };
    }
}

// Send OTP email
async function sendOTP(email, otp, name) {
    const subject = 'Your PVJ Video Consultation OTP';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p>Your OTP for video consultation request is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
            <p>Best regards,<br>PVJ Team</p>
        </div>
    `;

    return await sendEmail({ to: email, subject, html });
}

// Send consultation confirmation email
async function sendConsultationConfirmation(email, name, date, time) {
    const subject = 'Your PVJ Video Consultation Confirmed';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p>Your video consultation has been confirmed!</p>
            <div style="background: #f4f4f4; padding: 20px; margin: 20px 0;">
                <h3>Consultation Details:</h3>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
            </div>
            <p>We will contact you shortly with the video call link.</p>
            <p>Best regards,<br>PVJ Team</p>
        </div>
    `;

    return await sendEmail({ to: email, subject, html });
}

// Send email update OTP
async function sendEmailUpdateOTP(email, otp) {
    const subject = 'PVJ Admin Email Update - OTP Verification';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Update Request</h2>
            <p>You have requested to update your admin email address.</p>
            <p>Your OTP for email verification is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
            <p>If you didn't request this change, please ignore this email.</p>
            <p>Best regards,<br>PVJ Team</p>
        </div>
    `;

    return await sendEmail({ to: email, subject, html });
}

// Send email update confirmation
async function sendEmailUpdateConfirmation(email, isNewEmail = false) {
    const subject = isNewEmail ? 'PVJ Admin Email Update Confirmed' : 'PVJ Admin Email Updated';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Address Updated</h2>
            <p>Your admin email address has been successfully updated.</p>
            ${isNewEmail ?
            '<p>You will now receive all communications at this email address.</p>' :
            '<p>You will now receive all communications at your new email address.</p>'
        }
            <p>Best regards,<br>PVJ Team</p>
        </div>
    `;

    return await sendEmail({ to: email, subject, html });
}

// Send reschedule notification email
async function sendRescheduleNotification(email, name, consultationId, oldDate, oldTime, newDate, newTime, adminNotes) {
    console.log(`[Email] Preparing reschedule notification email to ${email} for consultation ${consultationId}`);
    
    if (!email || !name) {
        console.error('[Email] Missing required fields for reschedule notification:', { email, name });
        return { success: false, error: 'Missing required fields' };
    }

    const subject = 'Your PVJ Video Consultation Has Been Rescheduled';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #8B4513 0%, #D4AF37 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Consultation Rescheduled</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${name},</h2>
                <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                    Your video consultation has been rescheduled. Please find the updated details below:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                    <h3 style="color: #8B4513; margin: 0 0 15px 0; font-size: 18px;">Consultation Details:</h3>
                    <p style="margin: 8px 0; color: #333;"><strong>Consultation ID:</strong> CON-${consultationId}</p>
                    ${oldDate && oldTime ? `
                    <p style="margin: 8px 0; color: #666;"><strong>Previous Date & Time:</strong> ${oldDate} at ${oldTime}</p>
                    ` : ''}
                    <p style="margin: 8px 0; color: #16784f; font-size: 16px;"><strong>New Date:</strong> ${newDate}</p>
                    <p style="margin: 8px 0; color: #16784f; font-size: 16px;"><strong>New Time:</strong> ${newTime}</p>
                </div>
                ${adminNotes ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404;"><strong>Admin Notes:</strong> ${adminNotes}</p>
                </div>
                ` : ''}
                <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    We will contact you shortly with the video call link for your rescheduled consultation.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    If you have any questions or need to make further changes, please contact us.
                </p>
                <div style="background-color: #8B4513; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <h4 style="margin: 0 0 10px 0; font-size: 18px;">Need Assistance?</h4>
                    <p style="margin: 0; font-size: 16px;">Contact us at <strong>+91 98874 55804</strong></p>
                </div>
                <p style="color: #999; margin-top: 30px; font-size: 14px;">
                    Best regards,<br>
                    <strong>PVJ Team</strong>
                </p>
            </div>
        </div>
    `;

    return await sendEmail({ to: email, subject, html });
}

// Send status update notification email
async function sendStatusUpdateNotification(email, name, consultationId, status, date, time, adminNotes) {
    console.log(`[Email] Preparing status update notification email to ${email} for consultation ${consultationId}, status: ${status}`);
    
    if (!email || !name) {
        console.error('[Email] Missing required fields for status update notification:', { email, name });
        return { success: false, error: 'Missing required fields' };
    }

    const statusMessages = {
        'requested': 'Your consultation request has been received',
        'otp_verified': 'Your consultation request has been verified',
        'confirmed': 'Your video consultation has been confirmed',
        'scheduled': 'Your video consultation has been scheduled',
        'completed': 'Your video consultation has been completed',
        'cancelled': 'Your video consultation has been cancelled'
    };

    const statusColors = {
        'requested': '#007bff',
        'otp_verified': '#17a2b8',
        'confirmed': '#28a745',
        'scheduled': '#28a745',
        'completed': '#6c757d',
        'cancelled': '#dc3545'
    };

    const statusMessage = statusMessages[status] || 'Your consultation status has been updated';
    const statusColor = statusColors[status] || '#333';
    const subject = `PVJ Video Consultation Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #8B4513 0%, #D4AF37 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Consultation Status Update</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${name},</h2>
                <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                    ${statusMessage}. Please find the details below:
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                    <h3 style="color: #8B4513; margin: 0 0 15px 0; font-size: 18px;">Consultation Details:</h3>
                    <p style="margin: 8px 0; color: #333;"><strong>Consultation ID:</strong> CON-${consultationId}</p>
                    <p style="margin: 8px 0; color: ${statusColor}; font-size: 16px; font-weight: bold;">
                        <strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </p>
                    ${date ? `<p style="margin: 8px 0; color: #333;"><strong>Date:</strong> ${date}</p>` : ''}
                    ${time ? `<p style="margin: 8px 0; color: #333;"><strong>Time:</strong> ${time}</p>` : ''}
                </div>
                ${adminNotes ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404;"><strong>Admin Notes:</strong> ${adminNotes}</p>
                </div>
                ` : ''}
                ${status === 'confirmed' || status === 'scheduled' ? `
                <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    We will contact you shortly with the video call link for your consultation.
                </p>
                ` : ''}
                ${status === 'cancelled' ? `
                <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    If you have any questions or would like to reschedule, please contact us.
                </p>
                ` : ''}
                ${status === 'completed' ? `
                <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    Thank you for choosing PVJ! We hope you had a great consultation experience.
                </p>
                ` : ''}
                <div style="background-color: #8B4513; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <h4 style="margin: 0 0 10px 0; font-size: 18px;">Need Assistance?</h4>
                    <p style="margin: 0; font-size: 16px;">Contact us at <strong>+91 98874 55804</strong></p>
                </div>
                <p style="color: #999; margin-top: 30px; font-size: 14px;">
                    Best regards,<br>
                    <strong>PVJ Team</strong>
                </p>
            </div>
        </div>
    `;

    try {
        const result = await sendEmail({ to: email, subject, html });
        console.log(`[Email] Status update notification email sent to ${email}:`, result);
        return result;
    } catch (error) {
        console.error(`[Email] Error sending status update notification to ${email}:`, error);
        return { success: false, error: error.message || error };
    }
}

// Send Elite Member Welcome Email
async function sendEliteMemberWelcome(email, gender) {
    const subject = '🎉 Welcome to PVJ Elite Membership!';
    const genderTitle = gender === 'Female' ? 'Ms.' : gender === 'Male' ? 'Mr.' : '';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to PVJ Elite</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #8B4513 0%, #D4AF37 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to PVJ Elite</h1>
                    <p style="color: #f8f9fa; margin: 10px 0 0 0; font-size: 16px;">Your journey to exclusive luxury begins now!</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #8B4513; margin: 0 0 20px 0; font-size: 24px;">Dear ${genderTitle} Valued Member,</h2>
                    
                    <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                        Congratulations and welcome to the exclusive PVJ Elite Membership! We're thrilled to have you join our distinguished family of jewelry connoisseurs.
                    </p>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #D4AF37;">
                        <h3 style="color: #8B4513; margin: 0 0 15px 0; font-size: 18px;">Your Elite Benefits Include:</h3>
                        <ul style="color: #333333; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>🎯 Exclusive access to handpicked jewelry collections</li>
                            <li>🚀 Priority invitations to private launches and events</li>
                            <li>💎 Special member-only discounts and offers</li>
                            <li>👑 Personalized jewelry consultation services</li>
                            <li>🎁 Birthday and anniversary special surprises</li>
                            <li>📞 Dedicated customer support hotline</li>
                        </ul>
                    </div>
                    
                    <p style="color: #333333; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                        As an Elite Member, you'll be the first to discover our newest arrivals, limited edition pieces, and receive exclusive pricing on premium collections.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://pvjjewellery.com" style="display: inline-block; background: linear-gradient(135deg, #8B4513 0%, #D4AF37 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Explore Elite Collection</a>
                    </div>
                    
                    <div style="background-color: #8B4513; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; font-size: 18px;">Need Assistance?</h4>
                        <p style="margin: 0; font-size: 16px;">Contact us at <strong>+91 98874 55804</strong></p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Our Elite support team is ready to assist you!</p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">Thank you for choosing PVJ Jewellery</p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">© 2024 PVJ Jewellery. All rights reserved.</p>
                    <div style="margin-top: 15px;">
                        <a href="https://pvjjewellery.com" style="color: #D4AF37; text-decoration: none; margin: 0 10px; font-size: 12px;">Website</a>
                        <a href="tel:+919887455804" style="color: #D4AF37; text-decoration: none; margin: 0 10px; font-size: 12px;">Call Us</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({ to: email, subject, html });
}

module.exports = {
    sendEmail,
    sendOTP,
    sendConsultationConfirmation,
    sendEmailUpdateOTP,
    sendEmailUpdateConfirmation,
    sendRescheduleNotification,
    sendStatusUpdateNotification,
    sendEliteMemberWelcome
}; 