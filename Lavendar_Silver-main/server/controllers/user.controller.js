const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/bcryptUtil');
const phone = require('phone').default || require('phone');
const { triggerWelcomeEmail, logUserActivity } = require('./emailAutomation.controller');
const { sendEmail } = require('../utils/emailSender');
const { validateEmail } = require('../utils/emailValidator');

// OTP storage for forgot password
const forgotPasswordOtpStorage = new Map();

exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, photo, dob, phone: phoneNum, anniversary, address } = req.body;
    // Check all fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required', data: null });
    }
    // Email format check
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email is invalid', data: null });
    }
    // Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character', data: null });
    }
    // Confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match', data: null });
    }
    const [existingRows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
    if (existingRows[0]) {
      return res.status(400).json({ success: false, message: 'Email already registered', data: null });
    }
    const hashed = await hashPassword(password);
    const [insertResult] = await db.execute(
      'INSERT INTO user (name, email, password, photo, dob, phone, anniversary, address, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashed, photo || null, dob || null, phoneNum || null, anniversary || null, JSON.stringify(address || {}), false]
    );
    const userId = insertResult.insertId;

    // Create welcome notification
    await db.execute(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [userId, 'success', `${name} -New User Registered!`]
    );

    // Automatically subscribe user to promotional emails
    try {
      await db.execute(
        'INSERT INTO email_subscribers (email, name, user_id, is_active) VALUES (?, ?, ?, ?)',
        [email, name, userId, 1]
      );
    } catch (subscriptionError) {
      console.error('Error subscribing user to emails:', subscriptionError);
      // Don't fail registration if subscription fails
    }

    const [userRows] = await db.execute('SELECT * FROM user WHERE id = ?', [userId]);
    const user = userRows[0];
    if (user && user.password) delete user.password;
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

    // Trigger welcome email automation
    try {
      await triggerWelcomeEmail(userId, user.email, user.name);
      await logUserActivity(userId, 'signup', { email: user.email, name: user.name });
    } catch (emailError) {
      console.error('Welcome email trigger error:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({ success: true, message: 'Registered', data: { token, user } });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required', data: null });
    }
    const [userRows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
    const user = userRows[0];
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials', data: null });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid credentials', data: null });
    }

    // Check user status before allowing login
    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'You have been blocked. Please contact support.',
        data: null,
        blocked: true
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily blocked for 30 days. Please contact support.',
        data: null,
        inactive: true
      });
    }

    if (user && user.password) delete user.password;
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.status(200).json({ success: true, message: 'Login successful', data: { token, user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getUser = async (req, res) => {
  try {
    const [userRows] = await db.execute('SELECT * FROM user WHERE id = ?', [req.params.id]);
    const user = userRows[0];
    if (user && user.password) delete user.password;
    if (!user) return res.status(404).json({ success: false, message: 'User not found', data: null });
    res.status(200).json({ success: true, message: 'User found', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Only allow specific fields to be updated
    const allowedFields = ['name', 'email', 'photo', 'dob', 'phone', 'anniversary', 'address', 'address_country', 'address_state', 'address_city', 'address_place', 'address_pincode'];
    const updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }
    // Phone validation and formatting
    if (updateData.phone !== undefined && updateData.phone) {
      // Remove all non-digit characters first
      const cleanedPhone = updateData.phone.replace(/\D/g, '');

      // If phone starts with 91 and has more than 10 digits, remove 91 prefix
      let phoneToValidate = cleanedPhone;
      if (cleanedPhone.length > 10 && cleanedPhone.startsWith('91')) {
        phoneToValidate = cleanedPhone.substring(2);
      }

      // Validate phone number
      const result = phone(phoneToValidate);
      if (!result.isValid) {
        // Try with country code
        const resultWithCode = phone(`+91${phoneToValidate}`);
        if (resultWithCode.isValid) {
          updateData.phone = resultWithCode.phoneNumber;
        } else {
          return res.status(400).json({ success: false, message: 'Invalid phone number', data: null });
        }
      } else {
        // Always store in E.164 format (e.g., +919950108143)
        updateData.phone = result.phoneNumber;
      }
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update', data: null });
    }
    // Build update query
    const fields = [];
    const values = [];
    for (const key in updateData) {
      fields.push(`${key} = ?`);
      values.push(key === 'address' ? JSON.stringify(updateData[key]) : updateData[key]);
    }
    values.push(req.params.id);
    const [result] = await db.execute(
      `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found', data: null });
    const [userRows] = await db.execute('SELECT * FROM user WHERE id = ?', [req.params.id]);
    const user = userRows[0];
    if (user && user.password) delete user.password;
    res.status(200).json({ success: true, message: 'User updated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let query = 'SELECT * FROM user WHERE 1=1';
    const params = [];

    if (status && status !== 'All Status') {
      query += ' AND status = ?';
      params.push(status);
    }
    // Assuming 'type' maps to a property, e.g. a premium flag, for now, we will filter by name/email
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    const [users] = await db.execute(query, params);
    users.forEach(user => delete user.password);
    res.status(200).json({ success: true, message: 'Users retrieved', data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive', 'Blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const [result] = await db.execute(
      'UPDATE user SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM user WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found', data: null });
    res.status(200).json({ success: true, message: 'User deleted', data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.updateUserPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
    }
    const photoPath = `/profiles/${req.file.filename}`;
    // Update photo directly
    const [result] = await db.execute('UPDATE user SET photo = ? WHERE id = ?', [photoPath, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found', data: null });
    const [userRows] = await db.execute('SELECT * FROM user WHERE id = ?', [req.params.id]);
    const user = userRows[0];
    if (user && user.password) delete user.password;
    res.status(200).json({ success: true, message: 'User photo updated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// Check current user status for auto-logout functionality
exports.checkUserStatus = async (req, res) => {
  try {
    const [userRows] = await db.execute('SELECT status FROM user WHERE id = ?', [req.user.id]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'You have been blocked. Please contact support.',
        data: null,
        blocked: true,
        autoLogout: true
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily blocked for 30 days. Please contact support.',
        data: null,
        inactive: true,
        autoLogout: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status checked',
      data: { status: user.status }
    });
  } catch (err) {
    console.error('Error checking user status:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// ===== FORGOT PASSWORD FUNCTIONS =====

// Send OTP for forgot password
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ success: false, message: emailValidation.reason });
    }

    // Check if user exists
    const [userRows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
    const user = userRows[0];
    if (!user) {
      return res.status(400).json({ success: false, message: 'No user found with this email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    forgotPasswordOtpStorage.set(email, {
      otp,
      expiresAt,
      userId: user.id
    });

    // Send OTP email
    const emailResult = await sendEmail({
      to: email,
      subject: 'PVJ Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">PVJ Jewellers & Sons</h1>
            <h2 style="color: #6b705c; font-weight: 400;">Password Reset Request</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Hello ${user.name || 'User'},</p>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">You have requested to reset your password. Please use the following OTP to verify your identity:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <div style="display: inline-block; background: #6b705c; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">This OTP is valid for 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">If you didn't request this password reset, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Best regards,<br>PVJ Jewellers & Sons Team</p>
          </div>
        </div>
      `
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.',
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email address'
    });

  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Verify OTP for forgot password
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Get stored OTP data
    const storedData = forgotPasswordOtpStorage.get(email);
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this email' });
    }

    const { otp: storedOtp, expiresAt } = storedData;

    // Check if OTP is expired
    if (new Date() > new Date(expiresAt)) {
      forgotPasswordOtpStorage.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    // Get stored OTP data
    const storedData = forgotPasswordOtpStorage.get(email);
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this email' });
    }

    const { otp: storedOtp, expiresAt, userId } = storedData;

    // Check if OTP is expired
    if (new Date() > new Date(expiresAt)) {
      forgotPasswordOtpStorage.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (storedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in database
    await db.execute('UPDATE user SET password = ? WHERE id = ?', [hashedPassword, userId]);

    // Clean up OTP storage
    forgotPasswordOtpStorage.delete(email);

    // Send confirmation email
    const [userRows] = await db.execute('SELECT * FROM user WHERE id = ?', [userId]);
    const user = userRows[0];

    await sendEmail({
      to: email,
      subject: 'PVJ Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">PVJ Jewellers & Sons</h1>
            <h2 style="color: #6b705c; font-weight: 400;">Password Reset Successful</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Hello ${user.name || 'User'},</p>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Your password has been successfully reset.</p>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">You can now log in with your new password.</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">If you didn't make this change, please contact support immediately.</p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Best regards,<br>PVJ Jewellers & Sons Team</p>
          </div>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Change user password
exports.changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required', data: null });
    }

    // Get current user info
    const [userRows] = await db.execute('SELECT * FROM user WHERE id = ?', [userId]);
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect', data: null });
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password', data: null });
    }

    // Validate new password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters and include uppercase, lowercase, number, and special character',
        data: null
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await db.execute('UPDATE user SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'PVJ Password Changed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed Successfully</h2>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
            <p>Best regards,<br>PVJ Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Password change email error:', emailError);
      // Don't fail password change if email fails
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: null
    });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};