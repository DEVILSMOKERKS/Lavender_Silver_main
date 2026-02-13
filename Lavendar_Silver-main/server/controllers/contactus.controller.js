const pool = require("../config/db");
const { validateEmail } = require("../utils/emailValidator");
const { realignTableIds } = require("../utils/realignTableIds");
const { sendEmail } = require("../utils/emailSender");
const { contactThankYouEmail } = require("../utils/contactEmailTemplates");

// Helper function to create admin notification email
const createAdminNotificationEmail = (name, email, phone, subject, message) => {
  const formattedMessage = message.replace(/\n/g, "<br>");
  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission - PVJ Jewellery</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0e593c 0%, #1a7a5a 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">New Contact Form Submission</h1>
                    <p style="color: #f8f9fa; margin: 10px 0 0 0; font-size: 16px;">PVJ Jewellery Contact Form</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #0e593c; margin: 0 0 20px 0; font-size: 24px;">Contact Details</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0e593c;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #0e593c; width: 120px;">Name:</td>
                                <td style="padding: 8px 0; color: #333333;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #0e593c;">Email:</td>
                                <td style="padding: 8px 0; color: #333333;"><a href="mailto:${email}" style="color: #0e593c; text-decoration: none;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #0e593c;">Phone:</td>
                                <td style="padding: 8px 0; color: #333333;"><a href="tel:${phone}" style="color: #0e593c; text-decoration: none;">${phone}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #0e593c;">Subject:</td>
                                <td style="padding: 8px 0; color: #333333;">${subject}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin: 25px 0;">
                        <h3 style="color: #0e593c; margin: 0 0 15px 0; font-size: 18px;">Message:</h3>
                        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; color: #333333; line-height: 1.6; font-size: 16px;">
                            ${formattedMessage}
                        </div>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; color: #856404; font-size: 14px; font-weight: bold;">Action Required:</p>
                        <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">Please review this contact form submission and respond to the customer within 24-48 hours.</p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">© 2024 PVJ Jewellery. All rights reserved.</p>
                    <p style="margin: 5px 0 0 0; color: #999999; font-size: 12px;">This is an automated notification email.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// POST /api/contact-us
exports.createContactUs = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !phone || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  // Use professional email validation
  const emailValidation = validateEmail(email, { allowOnlyPublic: true });
  if (!emailValidation.valid) {
    return res
      .status(400)
      .json({ success: false, message: emailValidation.reason });
  }

  // Phone format check (basic, 7-15 digits)
  if (!/^\d{7,15}$/.test(phone)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid phone number." });
  }

  try {
    // Store subject and message separately in database
    await pool.query(
      "INSERT INTO contact_us (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, subject, message]
    );

    // Get user_id from email if user exists
    let userId = null;
    try {
      const [userRows] = await pool.query('SELECT id FROM user WHERE email = ?', [email]);
      if (userRows.length > 0) {
        userId = userRows[0].id;
      }
    } catch (userError) {
      console.error('Error finding user:', userError);
    }

    // Create notification (user_id can be null for guest users)
    try {
      await pool.query(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
        [userId || null, 'success', 'Thank you for contacting us! We will get back to you soon.']
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail contact form submission if notification fails
    }

    // Get admin email from environment or use default
    const adminEmail =
      process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "admin@pvj.com";

    // Send notification email to admin
    try {
      const adminEmailSubject = `New Contact Form Submission from ${name}`;
      const adminEmailHtml = createAdminNotificationEmail(
        name,
        email,
        phone,
        subject,
        message
      );

      await sendEmail({
        to: adminEmail,
        subject: adminEmailSubject,
        html: adminEmailHtml,
      });
    } catch (adminEmailError) {
      console.error("Error sending admin notification email:", adminEmailError);
    }

    // Send thank you email to the user
    try {
      const emailSubject = "Thank You for Contacting PVJ Jewellery";
      const emailHtml = contactThankYouEmail(name);

      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Error sending thank you email:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been received. We will get back to you soon!",
    });
  } catch (err) {
    console.error("Error creating contact form submission:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message, error: err.message });
  }
};

// GET /api/contact-us (admin only)
exports.getAllContactUs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, subject, message, created_at FROM contact_us ORDER BY created_at DESC"
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message, error: err.message });
  }
};

// DELETE /api/contact-us/:id (admin only)
exports.deleteContactUs = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Contact ID is required." });
  }

  try {
    // Check if contact exists
    const [contact] = await pool.query(
      "SELECT id, name, email FROM contact_us WHERE id = ?",
      [id]
    );
    if (contact.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Contact message not found." });
    }

    // Delete the contact
    await pool.query("DELETE FROM contact_us WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting contact message:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// (Optional) Admin-only: Realign IDs for contact_us table
exports.realignContactUsIds = async (req, res) => {
  const result = await realignTableIds("contact_us");
  if (result.success) {
    return res.status(200).json({ success: true, message: result.message });
  } else {
    return res.status(500).json({ success: false, message: result.message });
  }
};
