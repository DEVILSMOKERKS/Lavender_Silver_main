// Default Email Templates for PVJ Email Automation

const defaultTemplates = [
    {
        name: 'Welcome Email Template',
        subject: 'Welcome to PVJ - Your Premium Jewelry Destination!',
        category: 'Welcome',
        html_content: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to PVJ</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #d4af37, #b8860b); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background: #d4af37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to PVJ!</h1>
                        <p>Premium Jewelry & Luxury Collection</p>
                    </div>
                    <div class="content">
                        <h2>Hello {{user_name}},</h2>
                        <p>Welcome to PVJ - your premier destination for exquisite jewelry and luxury collections!</p>
                        <p>We're thrilled to have you join our community of jewelry enthusiasts. Here's what you can expect from us:</p>
                        <ul>
                            <li>Exclusive collections of fine jewelry</li>
                            <li>Premium customer service</li>
                            <li>Special offers and discounts</li>
                            <li>Expert guidance for your jewelry needs</li>
                        </ul>
                        <p>Start exploring our collection today and discover the perfect piece for you or your loved ones.</p>
                        <a href="https://pvjewellers.in" class="button">Explore Our Collection</a>
                        <p>If you have any questions, feel free to reach out to our customer support team.</p>
                        <p>Best regards,<br>The PVJ Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 PVJ. All rights reserved.</p>
                        <p>You received this email because you signed up for PVJ. <a href="{{unsubscribe_link}}">Unsubscribe</a></p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text_content: `
            Welcome to PVJ!
            
            Hello {{user_name}},
            
            Welcome to PVJ - your premier destination for exquisite jewelry and luxury collections!
            
            We're thrilled to have you join our community of jewelry enthusiasts. Here's what you can expect from us:
            - Exclusive collections of fine jewelry
            - Premium customer service
            - Special offers and discounts
            - Expert guidance for your jewelry needs
            
            Start exploring our collection today and discover the perfect piece for you or your loved ones.
            
            Visit us at: https://pvjewellers.in
            
            Best regards,
            The PVJ Team
        `,
        variables: ['user_name', 'unsubscribe_link']
    },
    {
        name: 'Custom Jewelry Request Confirmation',
        subject: 'Custom Jewelry Request Submitted Successfully',
        category: 'Custom Jewelry',
        html_content: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Custom Jewelry Request</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
                    .content { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #0e593c; margin: 0; font-size: 28px; }
                    .header p { color: #666; margin: 10px 0 0 0; font-size: 16px; }
                    .details { background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
                    .details h2 { color: #0e593c; margin: 0 0 15px 0; font-size: 20px; }
                    .details table { width: 100%; border-collapse: collapse; }
                    .details td { padding: 8px 0; }
                    .details td:first-child { font-weight: bold; color: #333; }
                    .details td:last-child { color: #666; }
                    .next-steps { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
                    .next-steps h3 { color: #856404; margin: 0 0 15px 0; font-size: 18px; }
                    .next-steps ul { margin: 0; padding-left: 20px; color: #856404; }
                    .next-steps li { margin-bottom: 8px; }
                    .footer { text-align: center; margin-top: 30px; }
                    .footer p { color: #666; margin: 0; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <div class="header">
                            <h1>Custom Jewelry Request</h1>
                            <p>Your request has been submitted successfully!</p>
                        </div>
                        
                        <div class="details">
                            <h2>Request Details</h2>
                            <table>
                                <tr>
                                    <td>Request ID:</td>
                                    <td>#{{request_id}}</td>
                                </tr>
                                <tr>
                                    <td>Jewelry Type:</td>
                                    <td>{{jewelry_type}}</td>
                                </tr>
                                <tr>
                                    <td>Metal Type:</td>
                                    <td>{{metal_type}}</td>
                                </tr>
                                <tr>
                                    <td>Weight:</td>
                                    <td>{{weight}}g</td>
                                </tr>
                                <tr>
                                    <td>Budget:</td>
                                    <td>₹{{budget}}</td>
                                </tr>
                                <tr>
                                    <td>Status:</td>
                                    <td style="color: #0e593c; font-weight: bold;">Pending Review</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="next-steps">
                            <h3>What's Next?</h3>
                            <ul>
                                <li>Our design team will review your request within 24-48 hours</li>
                                <li>You'll receive updates via email and in your account</li>
                                <li>We may contact you for additional details if needed</li>
                                <li>Track your request status in your account dashboard</li>
                            </ul>
                        </div>
                        
                        <div class="footer">
                            <p>Thank you for choosing PVJ for your custom jewelry needs!</p>
                            <p>If you have any questions, please contact our support team.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text_content: `
            Custom Jewelry Request
            
            Your request has been submitted successfully!
            
            Request Details:
            - Request ID: #{{request_id}}
            - Jewelry Type: {{jewelry_type}}
            - Metal Type: {{metal_type}}
            - Weight: {{weight}}g
            - Budget: ₹{{budget}}
            - Status: Pending Review
            
            What's Next?
            - Our design team will review your request within 24-48 hours
            - You'll receive updates via email and in your account
            - We may contact you for additional details if needed
            - Track your request status in your account dashboard
            
            Thank you for choosing PVJ for your custom jewelry needs!
            If you have any questions, please contact our support team.
        `,
        variables: ['request_id', 'jewelry_type', 'metal_type', 'weight', 'budget']
    },
    {
        name: 'Custom Jewelry Admin Notification',
        subject: 'New Custom Jewelry Request - #{{request_id}}',
        category: 'Custom Jewelry',
        html_content: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Custom Request</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
                    .content { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #0e593c; margin: 0; font-size: 28px; }
                    .header p { color: #666; margin: 10px 0 0 0; font-size: 16px; }
                    .info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
                    .info h2 { color: #1976d2; margin: 0 0 15px 0; font-size: 20px; }
                    .info table { width: 100%; border-collapse: collapse; }
                    .info td { padding: 8px 0; }
                    .info td:first-child { font-weight: bold; color: #333; }
                    .info td:last-child { color: #666; }
                    .description { background: #fff3cd; padding: 20px; border-radius: 8px; }
                    .description h3 { color: #856404; margin: 0 0 15px 0; font-size: 18px; }
                    .description p { color: #856404; margin: 0; line-height: 1.6; }
                    .footer { text-align: center; margin-top: 30px; }
                    .footer p { color: #666; margin: 0; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <div class="header">
                            <h1>New Custom Request</h1>
                            <p>A new custom jewelry request has been submitted</p>
                        </div>
                        
                        <div class="info">
                            <h2>Request Information</h2>
                            <table>
                                <tr>
                                    <td>Request ID:</td>
                                    <td>#{{request_id}}</td>
                                </tr>
                                <tr>
                                    <td>Customer Email:</td>
                                    <td>{{customer_email}}</td>
                                </tr>
                                <tr>
                                    <td>Contact Number:</td>
                                    <td>{{contact_number}}</td>
                                </tr>
                                <tr>
                                    <td>Jewelry Type:</td>
                                    <td>{{jewelry_type}}</td>
                                </tr>
                                <tr>
                                    <td>Metal Type:</td>
                                    <td>{{metal_type}}</td>
                                </tr>
                                <tr>
                                    <td>Weight:</td>
                                    <td>{{weight}}g</td>
                                </tr>
                                <tr>
                                    <td>Budget:</td>
                                    <td>₹{{budget}}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="description">
                            <h3>Design Description</h3>
                            <p>{{design_description}}</p>
                        </div>
                        
                        <div class="footer">
                            <p>Please review this request in the admin panel.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text_content: `
            New Custom Jewelry Request
            
            A new custom jewelry request has been submitted.
            
            Request Information:
            - Request ID: #{{request_id}}
            - Customer Email: {{customer_email}}
            - Contact Number: {{contact_number}}
            - Jewelry Type: {{jewelry_type}}
            - Metal Type: {{metal_type}}
            - Weight: {{weight}}g
            - Budget: ₹{{budget}}
            
            Design Description:
            {{design_description}}
            
            Please review this request in the admin panel.
        `,
        variables: ['request_id', 'customer_email', 'contact_number', 'jewelry_type', 'metal_type', 'weight', 'budget', 'design_description']
    },
    {
        name: 'Abandoned Cart Reminder',
        subject: 'Complete Your Purchase - Your Cart is Waiting!',
        category: 'Abandoned Cart',
        html_content: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Complete Your Purchase</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #d4af37, #b8860b); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .cart-item { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #d4af37; }
                    .button { display: inline-block; padding: 12px 24px; background: #d4af37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Don't Miss Out!</h1>
                        <p>Your Cart is Waiting for You</p>
                    </div>
                    <div class="content">
                        <h2>Hello {{user_name}},</h2>
                        <p>We noticed you left some beautiful items in your cart. Don't let them slip away!</p>
                        
                        <div class="cart-item">
                            <h3>{{product_name}}</h3>
                            <p><strong>Price:</strong> ₹{{product_price}}</p>
                            <p>{{product_description}}</p>
                        </div>
                        
                        <p>Complete your purchase now and enjoy our premium jewelry collection!</p>
                        <a href="{{cart_link}}" class="button">Complete Purchase</a>
                        
                        <p>If you have any questions, feel free to contact our customer support.</p>
                        <p>Best regards,<br>The PVJ Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 PVJ. All rights reserved.</p>
                        <p>You received this email because you have items in your cart. <a href="{{unsubscribe_link}}">Unsubscribe</a></p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text_content: `
            Don't Miss Out! Your Cart is Waiting for You
            
            Hello {{user_name}},
            
            We noticed you left some beautiful items in your cart. Don't let them slip away!
            
            {{product_name}}
            Price: ₹{{product_price}}
            {{product_description}}
            
            Complete your purchase now and enjoy our premium jewelry collection!
            
            Visit your cart: {{cart_link}}
            
            If you have any questions, feel free to contact our customer support.
            
            Best regards,
            The PVJ Team
        `,
        variables: ['user_name', 'product_name', 'product_price', 'product_description', 'cart_link', 'unsubscribe_link']
    }
];

// Video Consultation Email Templates
const videoConsultationTemplates = {
    // OTP Verification Email
    otpVerification: (userName, otp) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Video Consultation OTP Verification</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0E593C; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
                .content { background: #fff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .otp-box { background: #f8f9fa; border: 2px dashed #0E593C; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                .otp-code { font-size: 32px; font-weight: bold; color: #0E593C; letter-spacing: 5px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .highlight { color: #0E593C; font-weight: bold; }
                .steps { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .step { margin: 10px 0; padding-left: 20px; position: relative; }
                .step:before { content: "✓"; color: #0E593C; font-weight: bold; position: absolute; left: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎥 Video Consultation</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff;">PVJ - Premium Jewellery</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${userName}!</h2>
                    
                    <p>Thank you for choosing PVJ for your personalized video consultation. To proceed with your booking, please verify your identity using the OTP below.</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0 0 10px 0; color: #666;">Your Verification Code:</p>
                        <div class="otp-code">${otp}</div>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Valid for 10 minutes</p>
                    </div>
                    
                    <div class="steps">
                        <h3 style="color: #2c3e50; margin-top: 0;">Next Steps:</h3>
                        <div class="step">Enter the OTP code above to verify your booking</div>
                        <div class="step">Our team will contact you within 24 hours</div>
                        <div class="step">Schedule your preferred consultation time</div>
                        <div class="step">Enjoy your personalized video consultation</div>
                    </div>
                    
                    <p><strong>Important Notes:</strong></p>
                    <ul style="color: #666;">
                        <li>This OTP is valid for 10 minutes only</li>
                        <li>Do not share this code with anyone</li>
                        <li>Our team will contact you on your WhatsApp number</li>
                        <li>Consultation duration: 15-30 minutes</li>
                    </ul>
                    
                    <p style="margin-top: 30px;">If you didn't request this consultation, please ignore this email.</p>
                </div>
                
                <div class="footer">
                    <p>© 2024 PVJ - Premium Jewellery. All rights reserved.</p>
                    <p>For support, contact us at <span class="highlight">support@pvj.com</span></p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Booking Confirmation Email
    bookingConfirmation: (userName, consultationDate, consultationTime, cartItems) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Video Consultation Confirmed</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0E593C; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
                .content { background: #fff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .appointment-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .cart-items { margin: 20px 0; }
                .cart-item { border: 1px solid #e9ecef; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fff; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .highlight { color: #0E593C; font-weight: bold; }
                .checkmark { color: #28a745; font-size: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Consultation Confirmed!</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff;">PVJ - Premium Jewellery</p>
                </div>
                
                <div class="content">
                    <div class="success-box">
                        <h2 style="color: #155724; margin-top: 0;"><span class="checkmark">✓</span> Your Video Consultation is Confirmed!</h2>
                        <p style="margin: 0; color: #155724;">Thank you for choosing PVJ. Your consultation has been successfully scheduled.</p>
                    </div>
                    
                    <h2>Hello ${userName}!</h2>
                    
                    <p>Your video consultation has been confirmed and scheduled. Here are the details:</p>
                    
                    <div class="appointment-details">
                        <h3 style="color: #2c3e50; margin-top: 0;">📅 Appointment Details</h3>
                        <p><strong>Date:</strong> ${consultationDate}</p>
                        <p><strong>Time:</strong> ${consultationTime}</p>
                        <p><strong>Duration:</strong> 15-30 minutes</p>
                        <p><strong>Platform:</strong> WhatsApp Video Call</p>
                    </div>
                    
                    ${cartItems.length > 0 ? `
                        <div class="cart-items">
                            <h3 style="color: #2c3e50;">🛍️ Selected Items for Consultation</h3>
                            ${cartItems.map(item => `
                                <div class="cart-item" style="margin-bottom: 20px; border-bottom:1px solid #eee; padding-bottom:12px;">
                                  <h4 style="margin: 0 0 10px 0; color: #2c3e50;">${item.name || ''}</h4>
                                  ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="max-width:90px;max-height:90px;margin-bottom:8px;display:block;" />` : ''}
                                  <p style="margin: 5px 0; color: #666;"><strong>SKU:</strong> ${item.sku || ''}</p>
                                  <p style="margin: 5px 0; color: #666;"><strong>Description:</strong> ${item.description || ''}</p>
                                  <p style="margin: 5px 0; color: #666;"><strong>Price:</strong> ₹${item.price ? Number(item.price).toLocaleString() : 'Contact for price'}</p>
                                  ${item.selected_metal_type ? `<p style="margin: 5px 0; color: #666;"><strong>Metal:</strong> ${item.selected_metal_type}</p>` : ''}
                                  ${item.selected_diamond_quality ? `<p style="margin: 5px 0; color: #666;"><strong>Quality:</strong> ${item.selected_diamond_quality}</p>` : ''}
                                  ${item.selected_size ? `<p style="margin: 5px 0; color: #666;"><strong>Size:</strong> ${item.selected_size}</p>` : ''}
                                  ${item.selected_weight ? `<p style="margin: 5px 0; color: #666;"><strong>Weight:</strong> ${item.selected_weight}</p>` : ''}
                                    </div>
                                `).join('')}
                        </div>
                    ` : ''}                    
                    
                    <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">📞 What to Expect</h3>
                        <ul style="color: #2c3e50;">
                            <li>Our representative will call you on your WhatsApp number</li>
                            <li>We'll show you the selected jewellery pieces in detail</li>
                            <li>Get real-time answers to all your questions</li>
                            <li>No pressure to purchase - consultation is free</li>
                            <li>Receive exclusive offers during the consultation</li>
                        </ul>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #856404; margin-top: 0;">⚠️ Important Reminders</h3>
                        <ul style="color: #856404;">
                            <li>Please ensure your WhatsApp is active during the scheduled time</li>
                            <li>Have a stable internet connection for the video call</li>
                            <li>Keep your selected items list handy for reference</li>
                            <li>Feel free to ask questions about any jewellery piece</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px;">If you need to reschedule or have any questions, please contact us at <span class="highlight">support@pvj.com</span> or call us at <span class="highlight">+91-XXXXXXXXXX</span>.</p>
                </div>
                
                <div class="footer">
                    <p>© 2024 PVJ - Premium Jewellery. All rights reserved.</p>
                    <p>Thank you for choosing PVJ for your jewellery consultation!</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // WhatsApp Message Template
    whatsappMessage: (userName, otp) => `
🎥 *PVJ Video Consultation*

Hello ${userName}! 

Your OTP for video consultation verification is:

*${otp}*

⏰ Valid for 10 minutes

📞 Enter this code to complete your booking

🔒 Keep this code secure and don't share with anyone

For support: support@pvj.com

*PVJ - Premium Jewellery*
    `
};

module.exports = {
    defaultTemplates,
    videoConsultationTemplates
}; 