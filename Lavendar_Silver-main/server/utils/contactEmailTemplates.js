// Contact Form Email Templates

/**
 * Generate thank you email HTML for contact form submission
 * @param {string} name - User's name
 * @returns {string} HTML email template
 */
const contactThankYouEmail = (name) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank You - PVJ Jewellery</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0e593c 0%, #1a7a5a 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Thank You, ${name}!</h1>
                    <p style="color: #f8f9fa; margin: 10px 0 0 0; font-size: 16px;">We've received your message</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #0e593c; margin: 0 0 20px 0; font-size: 24px;">Dear ${name},</h2>
                    
                    <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                        Thank you for reaching out to PVJ Jewellery! We're delighted to hear from you and appreciate you taking the time to contact us.
                    </p>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0e593c;">
                        <h3 style="color: #0e593c; margin: 0 0 15px 0; font-size: 18px;">What Happens Next?</h3>
                        <ul style="color: #333333; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Our team has received your message and will review it shortly</li>
                            <li>We'll get back to you within 24-48 hours</li>
                            <li>For urgent inquiries, please call us at <strong>+91 98874 55804</strong></li>
                        </ul>
                    </div>
                    
                    <p style="color: #333333; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                        In the meantime, feel free to explore our exquisite collection of jewelry and discover pieces that reflect your unique style and elegance.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://pvjjewellery.com/shop" style="display: inline-block; background: linear-gradient(135deg, #0e593c 0%, #1a7a5a 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Explore Our Collection</a>
                    </div>
                    
                    <div style="background-color: #0e593c; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; font-size: 18px;">Need Immediate Assistance?</h4>
                        <p style="margin: 0; font-size: 16px;">Call us at <strong>+91 98874 55804</strong></p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Our customer support team is ready to help you!</p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">Thank you for choosing PVJ Jewellery</p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">© 2024 PVJ Jewellery. All rights reserved.</p>
                    <div style="margin-top: 15px;">
                        <a href="https://pvjjewellery.com" style="color: #0e593c; text-decoration: none; margin: 0 10px; font-size: 12px;">Website</a>
                        <a href="tel:+919887455804" style="color: #0e593c; text-decoration: none; margin: 0 10px; font-size: 12px;">Call Us</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    contactThankYouEmail
};

