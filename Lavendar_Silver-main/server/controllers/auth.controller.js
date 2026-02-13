const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/bcryptUtil');
const nodemailer = require('nodemailer');
const { sendEmail, sendEmailUpdateOTP, sendEmailUpdateConfirmation } = require('../utils/emailSender');
const fs = require('fs');
const path = require('path');
const { validateEmail } = require('../utils/emailValidator');

// OTP storage for email updates
const emailUpdateOtpStorage = new Map();

function generateToken(payload, expiresIn = null) {
  const secret = process.env.JWT_SECRET;
  return jwt.sign(payload, secret, expiresIn ? { expiresIn } : {});
}

exports.registerAdmin = async (req, res) => {
  try {
    // Allow only one admin in the table
    const [adminCountRows] = await db.execute('SELECT COUNT(*) as count FROM admins');
    const adminCount = adminCountRows[0].count;
    if (adminCount && adminCount > 0) {
      return res.status(403).json({ success: false, message: 'Admin already exists. Only one admin allowed.', data: null });
    }
    const { name, email, password, photo } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required', data: null });
    }
    // Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character', data: null });
    }
    const [existingRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    if (existingRows[0]) {
      return res.status(400).json({ success: false, message: 'Email already registered', data: null });
    }
    const hashed = await hashPassword(password);
    const [insertResult] = await db.execute(
      'INSERT INTO admins (name, email, password, photo) VALUES (?, ?, ?, ?)',
      [name, email, hashed, photo || null]
    );
    const adminId = insertResult.insertId;
    const [adminRows] = await db.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
    const admin = adminRows[0];
    const token = generateToken({ id: admin.id, role: 'admin', type: 'admin' });
    res.status(201).json({ success: true, message: 'Admin registered', data: { token, admin } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required', data: null });
    }
    const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    const admin = adminRows[0];
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid credentials', data: null });
    }
    const match = await comparePassword(password, admin.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid credentials', data: null });
    }
    const token = generateToken({ id: admin.id, role: 'admin', type: 'admin' });
    res.status(200).json({ success: true, message: 'Login successful', data: { token, admin } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out', data: null });
};

exports.whoami = (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token', data: null });
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    res.status(200).json({ success: true, message: 'User info', data: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token', data: null });
  }
};



// Forgot Password (JWT-based, 5 min expiry, no DB columns)
exports.forgotPasswordAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required', error: 'No email provided' });
    const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    const admin = adminRows[0];
    if (!admin) {
      return res.status(400).json({ success: false, message: 'No admin found with this email', error: 'Admin not found' });
    }
    // Create a JWT token valid for 5 minutes
    const resetToken = jwt.sign({ id: admin.id, email: admin.email, type: 'admin', action: 'reset' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;
    const emailResult = await sendEmail({
      to: email,
      subject: 'Admin Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 5 minutes.</p>`
    });
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send email. Please try again later. ' + emailResult.error, error: emailResult.error });
    }
    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Reset Password (verify JWT, update password)
exports.resetPasswordAdmin = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password are required', error: 'Missing token or password' });
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link', error: err.message });
    }
    if (!decoded || decoded.action !== 'reset' || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid reset token', error: 'Invalid JWT payload' });
    }
    // Strong password check (reuse from registerAdmin)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character', error: 'Weak password' });
    }
    const hashed = await hashPassword(password);
    await db.execute('UPDATE admins SET password = ? WHERE id = ?', [hashed, decoded.id]);
    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/auth/admin/photo
exports.updateAdminPhoto = async (req, res) => {
  try {
    // Auth middleware should set req.adminId
    const adminId = req.adminId || (req.user && req.user.id);
    if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    // Get old photo path
    const [adminRows] = await db.execute('SELECT photo FROM admins WHERE id = ?', [adminId]);
    const oldPhoto = adminRows[0]?.photo;
    // Update DB
    const photoPath = `/profiles/${req.file.filename}`;
    await db.execute('UPDATE admins SET photo = ? WHERE id = ?', [photoPath, adminId]);
    // Delete old photo if exists and not null
    if (oldPhoto && oldPhoto !== photoPath) {
      const oldPath = path.join(__dirname, '..', 'public', oldPhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    // Return updated admin
    const [updatedRows] = await db.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
    const admin = updatedRows[0];
    if (admin && admin.password) delete admin.password;
    res.json({ success: true, message: 'Profile photo updated', data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Send OTP for email update
exports.sendEmailUpdateOTP = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const adminId = req.adminId || (req.user && req.user.id);

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!newEmail) {
      return res.status(400).json({ success: false, message: 'New email is required' });
    }

    // Validate email format and check for disposable emails
    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ success: false, message: emailValidation.reason });
    }

    // Check if new email already exists
    const [existingRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [newEmail]);
    if (existingRows[0]) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Get current admin info
    const [adminRows] = await db.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
    const admin = adminRows[0];
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    emailUpdateOtpStorage.set(adminId.toString(), {
      otp,
      newEmail,
      expiresAt,
      currentEmail: admin.email
    });

    // Send OTP email using the utility function
    const emailResult = await sendEmailUpdateOTP(newEmail, otp);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.',
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to new email address for verification'
    });

  } catch (err) {
    console.error('Email update OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Verify OTP and update email
exports.verifyEmailUpdateOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const adminId = req.adminId || (req.user && req.user.id);

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    // Get stored OTP data
    const storedData = emailUpdateOtpStorage.get(adminId.toString());
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'No pending email update request found' });
    }

    const { otp: storedOtp, newEmail, expiresAt, currentEmail } = storedData;

    // Check if OTP is expired
    if (new Date() > new Date(expiresAt)) {
      emailUpdateOtpStorage.delete(adminId.toString());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Update email in database
    await db.execute('UPDATE admins SET email = ? WHERE id = ?', [newEmail, adminId]);

    // Send confirmation emails using utility functions
    await sendEmailUpdateConfirmation(currentEmail, false);
    await sendEmailUpdateConfirmation(newEmail, true);

    // Clean up OTP storage
    emailUpdateOtpStorage.delete(adminId.toString());

    // Get updated admin data
    const [updatedRows] = await db.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
    const admin = updatedRows[0];
    if (admin && admin.password) delete admin.password;

    res.json({
      success: true,
      message: 'Email updated successfully',
      data: admin
    });

  } catch (err) {
    console.error('Email update verification error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Change admin password
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.adminId || (req.user && req.user.id);

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    // Get current admin info
    const [adminRows] = await db.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
    const admin = adminRows[0];
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    // Validate new password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await db.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedNewPassword, adminId]);

    // Send confirmation email
    const emailResult = await sendEmail({
      to: admin.email,
      subject: 'PVJ Admin Password Changed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Changed Successfully</h2>
          <p>Your admin password has been successfully changed.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
          <p>Best regards,<br>PVJ Team</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
