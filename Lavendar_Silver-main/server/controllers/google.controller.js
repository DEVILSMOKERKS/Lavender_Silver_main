const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-8);
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleAdminLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'No credential provided' });
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    console.error('Google token verification error:', err);
    return res.status(400).json({ success: false, message: 'Invalid Google token' });
  }

  const { email } = ticket.getPayload();

  try {
    // Check if admin exists with this email
    const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    const admin = adminRows[0];

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found with this email',
        data: null
      });
    }

    // Generate admin token
    const token = jwt.sign(
      { id: admin.id, role: 'admin', type: 'admin' },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: { token, admin }
    });

  } catch (error) {
    console.error('Error in Google admin login:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ success: false, message: 'No credential provided' });

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    console.error('Google token verification error:', err);
    return res.status(400).json({ success: false, message: 'Invalid Google token' });
  }

  const { email, name, picture } = ticket.getPayload();

  // 1. Check if admin exists
  const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
  const admin = adminRows[0];
  if (admin) {
    const token = jwt.sign({ id: admin.id, role: 'admin', type: 'admin' }, process.env.JWT_SECRET);
    return res.status(200).json({ success: true, message: 'Admin login successful', data: { token, admin } });
  }

  // 2. Check if user exists
  const [userRows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
  let user = userRows[0];
  if (!user) {
    return res.status(404).json({ success: false, message: 'Please sign up first', data: null });
  }

  // 3. Check user status
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

  // 4. Set is_verified true if not already
  if (!user.is_verified) {
    await db.execute('UPDATE user SET is_verified = ? WHERE id = ?', [true, user.id]);
    const [updatedRows] = await db.execute('SELECT * FROM user WHERE id = ?', [user.id]);
    user = updatedRows[0];
  }
  // 4. Check if social_logins entry exists
  const [socialRows] = await db.execute(
    'SELECT * FROM social_logins WHERE user_id = ? AND provider = ?',
    [user.id, 'google']
  );
  if (!socialRows[0]) {
    await db.execute(
      'INSERT INTO social_logins (user_id, provider, provider_id) VALUES (?, ?, ?)',
      [user.id, 'google', email]
    );
  }
  // 5. Generate token and respond
  const token = jwt.sign({ id: user.id, type: 'user' }, process.env.JWT_SECRET);
  res.status(200).json({ success: true, message: 'Google login successful', data: { token, user } });
};

exports.googleSignup = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'No credential provided' });
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    console.error('Google token verification error:', err);
    return res.status(400).json({ success: false, message: 'Invalid Google token' });
  }

  const { email, name, picture } = ticket.getPayload();
  if (!email) {
    return res.status(400).json({ success: false, message: 'No email found in Google profile' });
  }

  try {
    // Check if user already exists
    const [userRows] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
    if (userRows.length > 0) {
      // If user exists, automatically proceed with login
      const [adminRows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
      const admin = adminRows[0];

      if (admin) {
        const token = jwt.sign({ id: admin.id, role: 'admin', type: 'admin' }, process.env.JWT_SECRET);
        return res.status(200).json({ success: true, message: 'Admin login successful', data: { token, admin } });
      }

      const user = userRows[0];

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

      const token = jwt.sign({ id: user.id, type: 'user' }, process.env.JWT_SECRET);
      return res.status(200).json({
        success: true,
        message: 'User exists. Logged in successfully.',
        data: { token, user }
      });
    }

    // Create new user with generated password
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get connection from pool for transaction
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Create user
      const [result] = await connection.execute(
        'INSERT INTO user (name, email, password, is_verified, photo) VALUES (?, ?, ?, ?, ?)',
        [name || email.split('@')[0], email, hashedPassword, true, picture || null]
      );

      const userId = result.insertId;

      // Create social login entry
      await connection.execute(
        'INSERT INTO social_logins (user_id, provider, provider_id) VALUES (?, ?, ?)',
        [userId, 'google', email]
      );

      // Commit transaction
      await connection.commit();

      // Get the newly created user
      const [newUserRows] = await db.execute('SELECT * FROM user WHERE id = ?', [userId]);
      const user = newUserRows[0];

      // Generate token for automatic login
      const token = jwt.sign({ id: user.id, type: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });

      // Remove sensitive data before sending response
      const { password: _, ...userData } = user;

      return res.status(201).json({
        success: true,
        message: 'Google signup successful and logged in',
        data: {
          token,
          user: userData,
          defaultEmail: email,
          isNewUser: true
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error in Google signup:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
