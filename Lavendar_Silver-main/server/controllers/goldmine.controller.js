const db = require('../config/db');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: 'rzp_live_RepxCmn4eqow4z',
  key_secret: 'SaunWpUXDinUBWupcCUlbx42'
});

// Generate unique subscription number
const generateSubscriptionNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GM${timestamp}${random}`;
};

// Create new subscription
const createSubscription = async (req, res) => {
  try {
    const { monthlyAmount } = req.body;
    const userId = req.user.id;

    if (!monthlyAmount || monthlyAmount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Monthly amount must be at least ₹1'
      });
    }

    // Check if user already has an active subscription
    const [existingSubscriptions] = await db.execute(
      `SELECT id, status FROM goldmine_subscriptions 
       WHERE user_id = ? AND status IN ('active', 'pending')`,
      [userId]
    );

    if (existingSubscriptions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription. Please complete or cancel your existing subscription before creating a new one.'
      });
    }

    // Calculate amounts
    const totalAmount = monthlyAmount * 10; // 10 months
    const discountAmount = monthlyAmount; // 11th month discount
    const finalJewelleryValue = monthlyAmount * 11; // 11 months total

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 11);

    const subscriptionNumber = generateSubscriptionNumber();

    // Create subscription
    const [subscriptionResult] = await db.execute(
      `INSERT INTO goldmine_subscriptions 
       (user_id, subscription_number, monthly_amount, total_amount, discount_amount, 
        final_jewellery_value, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, subscriptionNumber, monthlyAmount, totalAmount, discountAmount,
        finalJewelleryValue, startDate, endDate]
    );

    const subscriptionId = subscriptionResult.insertId;

    // Add to history
    await db.execute(
      `INSERT INTO goldmine_subscription_history 
       (subscription_id, user_id, status, description) 
       VALUES (?, ?, 'created', 'Subscription created with monthly amount ₹${monthlyAmount}')`,
      [subscriptionId, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscriptionId,
        subscriptionNumber,
        monthlyAmount,
        totalAmount,
        discountAmount,
        finalJewelleryValue
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Save personal details
const savePersonalDetails = async (req, res) => {
  try {
    const {
      subscriptionId,
      fullName,
      mobileNumber,
      apartmentHouseFlat,
      pincode,
      localityTown,
      streetColonyArea,
      cityDistrict,
      landmark,
      state
    } = req.body;


    const userId = req.user?.id;
    let userEmail = req.user?.email;

    // If email is not in token, fetch it from database
    if (!userEmail && userId) {
      try {
        const [userRows] = await db.execute('SELECT email FROM user WHERE id = ?', [userId]);
        if (userRows.length > 0) {
          userEmail = userRows[0].email;
        }
      } catch (error) {
        console.error('Controller - Error fetching user email:', error);
      }
    }

    // Validate user data
    if (!userId || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User data is missing or invalid'
      });
    }

    // Validate required fields and ensure they're not empty strings
    if (!subscriptionId || !fullName?.trim() || !mobileNumber?.trim() || !apartmentHouseFlat?.trim() ||
      !pincode?.trim() || !localityTown?.trim() || !streetColonyArea?.trim() || !cityDistrict?.trim() || !state?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided and cannot be empty'
      });
    }

    // Clean up the data by trimming whitespace
    const cleanData = {
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      apartmentHouseFlat: apartmentHouseFlat.trim(),
      pincode: pincode.trim(),
      localityTown: localityTown.trim(),
      streetColonyArea: streetColonyArea.trim(),
      cityDistrict: cityDistrict.trim(),
      state: state.trim()
    };

    // Validate cleanData has all required properties
    const requiredFields = ['fullName', 'mobileNumber', 'apartmentHouseFlat', 'pincode', 'localityTown', 'streetColonyArea', 'cityDistrict', 'state'];
    for (const field of requiredFields) {
      if (!cleanData[field]) {
        return res.status(400).json({
          success: false,
          message: `Field ${field} is missing or empty after cleaning`
        });
      }
    }

    // Validate subscription exists and belongs to user
    const [subscriptionCheck] = await db.execute(
      'SELECT * FROM goldmine_subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, userId]
    );

    if (subscriptionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Handle optional landmark field - convert empty string to null
    const landmarkValue = (landmark && landmark.trim() !== '') ? landmark : null;


    // Create the parameters array and log each value
    const params = [
      subscriptionId,
      userId,
      cleanData.fullName,
      userEmail,
      cleanData.mobileNumber,
      cleanData.apartmentHouseFlat,
      cleanData.pincode,
      cleanData.localityTown,
      cleanData.streetColonyArea,
      cleanData.cityDistrict,
      landmarkValue,
      cleanData.state
    ];


    // Save personal details
    await db.execute(
      `INSERT INTO goldmine_personal_details 
       (subscription_id, user_id, full_name, email, mobile_number, apartment_house_flat, 
        pincode, locality_town, street_colony_area, city_district, landmark, state) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    // Update subscription history
    await db.execute(
      `INSERT INTO goldmine_subscription_history 
       (subscription_id, user_id, status, description) 
       VALUES (?, ?, 'personal_details_added', 'Personal details saved')`,
      [subscriptionId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Personal details saved successfully'
    });

  } catch (error) {
    console.error('Error saving personal details:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Save nominee details
const saveNomineeDetails = async (req, res) => {
  try {
    const {
      subscriptionId,
      nomineeFullName,
      relationship,
      nationality = 'Indian'
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!subscriptionId || !nomineeFullName || !relationship) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate subscription exists and belongs to user
    const [subscriptionCheck] = await db.execute(
      'SELECT * FROM goldmine_subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, userId]
    );

    if (subscriptionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Save nominee details
    await db.execute(
      `INSERT INTO goldmine_nominee_details 
       (subscription_id, user_id, nominee_full_name, relationship, nationality) 
       VALUES (?, ?, ?, ?, ?)`,
      [subscriptionId, userId, nomineeFullName, relationship, nationality]
    );

    // Update subscription history
    await db.execute(
      `INSERT INTO goldmine_subscription_history 
       (subscription_id, user_id, status, description) 
       VALUES (?, ?, 'nominee_details_added', 'Nominee details saved')`,
      [subscriptionId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Nominee details saved successfully'
    });

  } catch (error) {
    console.error('Error saving nominee details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create Razorpay subscription
const createRazorpaySubscription = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Get subscription details
    const [subscriptionData] = await db.execute(
      'SELECT * FROM goldmine_subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, userId]
    );

    if (subscriptionData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subscriptionData[0];

    // First, create a customer if not exists
    let customer;
    try {
      const existingCustomers = await razorpay.customers.all({
        email: req.user.email
      });

      if (existingCustomers.items && existingCustomers.items.length > 0) {
        customer = existingCustomers.items[0];
      } else {
        customer = await razorpay.customers.create({
          name: subscription.full_name || 'Gold Mine Customer',
          email: req.user.email,
          contact: subscription.mobile_number || ''
        });
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      // Create customer with minimal data
      customer = await razorpay.customers.create({
        name: 'Gold Mine Customer',
        email: req.user.email
      });
    }

    // For now, let's create a simple order instead of subscription
    // This will allow us to test the payment flow
    const order = await razorpay.orders.create({
      amount: subscription.monthly_amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `GM_${subscriptionId}_${Date.now()}`,
      notes: {
        subscription_id: subscriptionId.toString(),
        user_id: userId.toString(),
        payment_type: 'first_monthly_payment'
      }
    });

    // For now, we'll use the order ID as subscription ID
    const razorpaySubscriptionId = order.id;

    // Save payment details
    await db.execute(
      `INSERT INTO goldmine_payment_details 
       (subscription_id, user_id, payment_method, razorpay_subscription_id, razorpay_customer_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [subscriptionId, userId, paymentMethod, razorpaySubscriptionId, customer.id]
    );

    // Create monthly payment records
    const monthlyAmount = subscription.monthly_amount;
    for (let month = 1; month <= 11; month++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + month);

      const isDiscountMonth = month === 11;
      const amount = isDiscountMonth ? 0 : monthlyAmount; // 11th month is free

      await db.execute(
        `INSERT INTO goldmine_monthly_payments 
         (subscription_id, user_id, month_number, amount, due_date, is_discount_month) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [subscriptionId, userId, month, amount, dueDate, isDiscountMonth]
      );
    }

    // Create early redemption options
    const earlyRedemption6 = (monthlyAmount * 5) + (monthlyAmount * 0.25);
    const earlyRedemption8 = (monthlyAmount * 7) + (monthlyAmount * 0.5);

    await db.execute(
      `INSERT INTO goldmine_early_redemption 
       (subscription_id, user_id, redemption_month, redemption_amount) 
       VALUES (?, ?, 6, ?), (?, ?, 8, ?)`,
      [subscriptionId, userId, earlyRedemption6, subscriptionId, userId, earlyRedemption8]
    );

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        razorpayOrderId: order.id,
        razorpaySubscriptionId: razorpaySubscriptionId,
        subscriptionId: subscriptionId,
        amount: subscription.monthly_amount * 100
      }
    });

  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    console.error('Error details:', {
      statusCode: error.statusCode,
      error: error.error,
      message: error.message
    });

    // Send more specific error message
    let errorMessage = 'Failed to create Razorpay subscription';
    if (error.statusCode === 400) {
      errorMessage = 'Invalid request to Razorpay. Please check your payment details.';
    } else if (error.statusCode === 401) {
      errorMessage = 'Razorpay authentication failed. Please contact support.';
    } else if (error.statusCode === 500) {
      errorMessage = 'Razorpay service is temporarily unavailable. Please try again later.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// Get subscription details
const getSubscriptionDetails = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    // Get subscription
    const [subscriptionData] = await db.execute(
      'SELECT * FROM goldmine_subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, userId]
    );

    if (subscriptionData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subscriptionData[0];

    // Get personal details
    const [personalDetails] = await db.execute(
      'SELECT * FROM goldmine_personal_details WHERE subscription_id = ?',
      [subscriptionId]
    );

    // Get nominee details
    const [nomineeDetails] = await db.execute(
      'SELECT * FROM goldmine_nominee_details WHERE subscription_id = ?',
      [subscriptionId]
    );

    // Get payment details
    const [paymentDetails] = await db.execute(
      'SELECT * FROM goldmine_payment_details WHERE subscription_id = ?',
      [subscriptionId]
    );

    // Get monthly payments
    const [monthlyPayments] = await db.execute(
      'SELECT * FROM goldmine_monthly_payments WHERE subscription_id = ? ORDER BY month_number',
      [subscriptionId]
    );

    // Get early redemption options
    const [earlyRedemption] = await db.execute(
      'SELECT * FROM goldmine_early_redemption WHERE subscription_id = ?',
      [subscriptionId]
    );

    res.status(200).json({
      success: true,
      data: {
        subscription,
        personalDetails: personalDetails[0] || null,
        nomineeDetails: nomineeDetails[0] || null,
        paymentDetails: paymentDetails[0] || null,
        monthlyPayments,
        earlyRedemption
      }
    });

  } catch (error) {
    console.error('Error getting subscription details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user's active subscriptions
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const [subscriptions] = await db.execute(
      `SELECT gs.*, 
              MAX(gpd.full_name) as full_name, 
              MAX(gpd.mobile_number) as mobile_number,
              MAX(gnd.nominee_full_name) as nominee_full_name, 
              MAX(gnd.relationship) as relationship,
              MAX(gmd.payment_method) as payment_method, 
              MAX(gmd.razorpay_subscription_id) as razorpay_subscription_id,
              COALESCE(SUM(CASE WHEN gmp.payment_status = 'paid' THEN gmp.amount ELSE 0 END), 0) as total_paid_amount,
              COUNT(CASE WHEN gmp.payment_status = 'paid' THEN 1 END) as paid_months_count
       FROM goldmine_subscriptions gs
       LEFT JOIN goldmine_personal_details gpd ON gs.id = gpd.subscription_id
       LEFT JOIN goldmine_nominee_details gnd ON gs.id = gnd.subscription_id
       LEFT JOIN goldmine_payment_details gmd ON gs.id = gmd.subscription_id
       LEFT JOIN goldmine_monthly_payments gmp ON gs.id = gmp.subscription_id
       WHERE gs.user_id = ?
       GROUP BY gs.id
       ORDER BY gs.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { subscriptionId, paymentId, status } = req.body;
    const userId = req.user.id;

    // Validate subscription exists and belongs to user
    const [subscriptionCheck] = await db.execute(
      'SELECT * FROM goldmine_subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, userId]
    );

    if (subscriptionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription status
    await db.execute(
      'UPDATE goldmine_subscriptions SET status = ? WHERE id = ?',
      [status, subscriptionId]
    );

    // Update first monthly payment
    await db.execute(
      `UPDATE goldmine_monthly_payments 
       SET payment_status = 'paid', razorpay_payment_id = ?, payment_date = CURRENT_DATE
       WHERE subscription_id = ? AND month_number = 1`,
      [paymentId, subscriptionId]
    );

    // Add to history
    await db.execute(
      `INSERT INTO goldmine_subscription_history 
       (subscription_id, user_id, status, description) 
       VALUES (?, ?, 'payment_received', 'First payment received - ₹${subscriptionCheck[0].monthly_amount}')`,
      [subscriptionId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ========================================
// PLAN CONTROLLER CENTER - ADMIN APIs
// ========================================

// Get plan controller dashboard statistics
const getPlanControllerStats = async (req, res) => {
  try {
    // Get total enrolled users
    const [totalUsersResult] = await db.execute(
      `SELECT COUNT(DISTINCT user_id) as total FROM goldmine_subscriptions`
    );
    const totalEnrolledUsers = totalUsersResult[0].total;

    // Get active monthly plans (subscriptions with at least 1 payment but not completed)
    const [activePlansResult] = await db.execute(
      `SELECT COUNT(DISTINCT gs.id) as total 
       FROM goldmine_subscriptions gs
       WHERE gs.status != 'completed' 
       AND EXISTS (
         SELECT 1 FROM goldmine_monthly_payments gmp 
         WHERE gmp.subscription_id = gs.id AND gmp.payment_status = 'paid'
       )`
    );
    const activeMonthlyPlans = activePlansResult[0].total;

    // Get completed plans
    const [completedPlansResult] = await db.execute(
      `SELECT COUNT(*) as total FROM goldmine_subscriptions WHERE status = 'completed'`
    );
    const plansCompleted = completedPlansResult[0].total;

    // Get vouchers issued (completed plans with 11th month discount)
    const [vouchersResult] = await db.execute(
      `SELECT COUNT(*) as total FROM goldmine_subscriptions 
       WHERE status = 'completed' AND discount_amount > 0`
    );
    const vouchersIssued = vouchersResult[0].total;

    res.json({
      success: true,
      data: {
        totalEnrolledUsers: totalEnrolledUsers.toString(),
        activeMonthlyPlans: activeMonthlyPlans.toString(),
        plansCompleted: plansCompleted.toString(),
        vouchersIssued: vouchersIssued.toString()
      }
    });

  } catch (error) {
    console.error('Error fetching plan controller stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user installment details
const getUserInstallmentDetails = async (req, res) => {
  try {
    const { search, status } = req.query;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR gs.subscription_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'All Status') {
      whereClause += ` AND gs.status = ?`;
      params.push(status.toLowerCase());
    }

    const query = `
      SELECT 
        gs.id,
        gs.subscription_number,
        u.name as userName,
        u.email,
        gs.monthly_amount,
        gs.status as planStatus,
        gs.start_date,
        gs.end_date,
        (SELECT COUNT(*) FROM goldmine_monthly_payments gmp 
         WHERE gmp.subscription_id = gs.id AND gmp.payment_status = 'paid') as paidMonths,
        (SELECT COUNT(*) FROM goldmine_monthly_payments gmp 
         WHERE gmp.subscription_id = gs.id) as totalMonths,
        CASE 
          WHEN gs.status = 'completed' THEN 'Yes'
          ELSE 'No'
        END as hasVoucher,
        CASE 
          WHEN gs.status = 'completed' THEN 'Redeemed'
          WHEN EXISTS (
            SELECT 1 FROM goldmine_early_redemption ger 
            WHERE ger.subscription_id = gs.id AND ger.redeemed_at IS NOT NULL
          ) THEN 'Early Redeemed'
          WHEN EXISTS (
            SELECT 1 FROM goldmine_early_redemption ger 
            WHERE ger.subscription_id = gs.id AND ger.redeemed_at IS NULL
          ) THEN 'Early Redemption Pending'
          ELSE 'Not Applicable'
        END as redemptionStatus,
        CASE 
          WHEN gs.status = 'completed' THEN 'completed'
          WHEN (SELECT COUNT(*) FROM goldmine_monthly_payments gmp 
                WHERE gmp.subscription_id = gs.id AND gmp.payment_status = 'paid') > 0 THEN 'active'
          ELSE 'pending'
        END as calculatedStatus
      FROM goldmine_subscriptions gs
      JOIN user u ON gs.user_id = u.id
      WHERE 1=1 ${whereClause}
      ORDER BY gs.created_at DESC
    `;

    const [installments] = await db.execute(query, params);

    const formattedInstallments = installments.map(item => ({
      id: item.id,
      subscriptionNumber: item.subscription_number,
      userName: item.userName,
      email: item.email,
      monthlyAmount: `₹${item.monthly_amount}`,
      paidMonths: `${item.paidMonths}/${item.totalMonths}`,
      planStatus: item.calculatedStatus.charAt(0).toUpperCase() + item.calculatedStatus.slice(1),
      hasVoucher: item.hasVoucher,
      redemptionStatus: item.redemptionStatus,
      startDate: item.start_date,
      endDate: item.end_date
    }));

    res.json({
      success: true,
      data: formattedInstallments
    });

  } catch (error) {
    console.error('Error fetching user installment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get early redemption requests
const getEarlyRedemptionRequests = async (req, res) => {
  try {
    const { search, status } = req.query;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== 'All Status') {
      if (status.toLowerCase() === 'approved') {
        whereClause += ` AND ger.redeemed_at IS NOT NULL`;
      } else if (status.toLowerCase() === 'pending') {
        whereClause += ` AND ger.redeemed_at IS NULL`;
      }
    }

    const query = `
      SELECT 
        ger.id,
        ger.subscription_id,
        u.name as userName,
        u.email,
        gs.subscription_number,
        ger.redemption_month,
        ger.redemption_amount,
        ger.is_available,
        ger.redeemed_at,
        CASE 
          WHEN ger.redeemed_at IS NOT NULL THEN 'Approved'
          ELSE 'Pending'
        END as status,
        (SELECT COUNT(*) FROM goldmine_monthly_payments gmp 
         WHERE gmp.subscription_id = gs.id AND gmp.payment_status = 'paid') as currentMonth
      FROM goldmine_early_redemption ger
      JOIN goldmine_subscriptions gs ON ger.subscription_id = gs.id
      JOIN user u ON gs.user_id = u.id
      WHERE ger.is_available = true ${whereClause}
      ORDER BY ger.created_at DESC
    `;

    const [redemptions] = await db.execute(query, params);

    const formattedRedemptions = redemptions.map(item => ({
      id: item.id,
      subscriptionId: item.subscription_id,
      subscriptionNumber: item.subscription_number,
      userName: item.userName,
      email: item.email,
      currentMonth: item.currentMonth.toString(),
      requestedMonth: `Early Redemption (Month ${item.redemption_month})`,
      redemptionAmount: `₹${item.redemption_amount}`,
      status: item.status,
      redeemedAt: item.redeemed_at
    }));

    res.json({
      success: true,
      data: formattedRedemptions
    });

  } catch (error) {
    console.error('Error fetching early redemption requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Approve early redemption request
const approveEarlyRedemption = async (req, res) => {
  try {
    const { redemptionId } = req.params;

    // Check if redemption request exists
    const [redemptionResult] = await db.execute(
      `SELECT * FROM goldmine_early_redemption WHERE id = ? AND is_available = true`,
      [redemptionId]
    );

    if (redemptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Redemption request not found'
      });
    }

    const redemption = redemptionResult[0];

    // Update redemption status
    await db.execute(
      `UPDATE goldmine_early_redemption 
       SET redeemed_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [redemptionId]
    );

    // Update subscription status to completed
    await db.execute(
      `UPDATE goldmine_subscriptions SET status = 'completed' WHERE id = ?`,
      [redemption.subscription_id]
    );

    // Add to history
    await db.execute(
      `INSERT INTO goldmine_subscription_history 
       (subscription_id, user_id, status, description) 
       VALUES (?, ?, 'early_redemption_approved', 'Early redemption approved for month ${redemption.redemption_month}')`,
      [redemption.subscription_id, redemption.user_id]
    );

    res.json({
      success: true,
      message: 'Early redemption request approved successfully'
    });

  } catch (error) {
    console.error('Error approving early redemption:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete subscription/redemption (admin action)
const deletePlanItem = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'subscription') {
      // Delete subscription and related data
      await db.execute(
        `DELETE FROM goldmine_subscriptions WHERE id = ?`,
        [id]
      );
    } else if (type === 'redemption') {
      // Delete redemption request
      await db.execute(
        `DELETE FROM goldmine_early_redemption WHERE id = ?`,
        [id]
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type specified'
      });
    }

    res.json({
      success: true,
      message: `${type} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting plan item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Export full report
const exportPlanReport = async (req, res) => {
  try {
    const [subscriptions] = await db.execute(`
      SELECT 
        gs.subscription_number,
        u.name as userName,
        u.email,
        gs.monthly_amount,
        gs.status,
        gs.start_date,
        gs.end_date,
        (SELECT COUNT(*) FROM goldmine_monthly_payments gmp 
         WHERE gmp.subscription_id = gs.id AND gmp.payment_status = 'paid') as paidMonths,
        (SELECT COUNT(*) FROM goldmine_monthly_payments gmp 
         WHERE gmp.subscription_id = gs.id) as totalMonths
      FROM goldmine_subscriptions gs
      JOIN user u ON gs.user_id = u.id
      ORDER BY gs.created_at DESC
    `);

    const [redemptions] = await db.execute(`
      SELECT 
        ger.id,
        u.name as userName,
        u.email,
        ger.redemption_month,
        ger.redemption_amount,
        CASE 
          WHEN ger.redeemed_at IS NOT NULL THEN 'Approved'
          ELSE 'Pending'
        END as status,
        ger.created_at
      FROM goldmine_early_redemption ger
      JOIN goldmine_subscriptions gs ON ger.subscription_id = gs.id
      JOIN user u ON gs.user_id = u.id
      ORDER BY ger.created_at DESC
    `);

    const report = {
      generatedAt: new Date().toISOString(),
      subscriptions: subscriptions,
      redemptions: redemptions
    };

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error exporting plan report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Clean up duplicate subscriptions (admin function)
const cleanupDuplicateSubscriptions = async (req, res) => {
  try {
    // Find users with multiple active subscriptions
    const [duplicateUsers] = await db.execute(`
      SELECT user_id, COUNT(*) as subscription_count
      FROM goldmine_subscriptions 
      WHERE status IN ('active', 'pending')
      GROUP BY user_id 
      HAVING COUNT(*) > 1
    `);

    let cleanedCount = 0;

    for (const user of duplicateUsers) {
      // Get all active subscriptions for this user, ordered by creation date
      const [userSubscriptions] = await db.execute(`
        SELECT id, created_at 
        FROM goldmine_subscriptions 
        WHERE user_id = ? AND status IN ('active', 'pending')
        ORDER BY created_at ASC
      `, [user.user_id]);

      // Keep the first (oldest) subscription, delete the rest
      if (userSubscriptions.length > 1) {
        const subscriptionIdsToDelete = userSubscriptions.slice(1).map(sub => sub.id);

        // Delete related data first (foreign key constraints)
        for (const subId of subscriptionIdsToDelete) {
          await db.execute('DELETE FROM goldmine_subscription_history WHERE subscription_id = ?', [subId]);
          await db.execute('DELETE FROM goldmine_monthly_payments WHERE subscription_id = ?', [subId]);
          await db.execute('DELETE FROM goldmine_early_redemption WHERE subscription_id = ?', [subId]);
          await db.execute('DELETE FROM goldmine_personal_details WHERE subscription_id = ?', [subId]);
          await db.execute('DELETE FROM goldmine_nominee_details WHERE subscription_id = ?', [subId]);
          await db.execute('DELETE FROM goldmine_payment_details WHERE subscription_id = ?', [subId]);
        }

        // Delete the duplicate subscriptions
        await db.execute(
          'DELETE FROM goldmine_subscriptions WHERE id IN (?)',
          [subscriptionIdsToDelete]
        );

        cleanedCount += subscriptionIdsToDelete.length;
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} duplicate subscriptions`,
      data: {
        usersWithDuplicates: duplicateUsers.length,
        subscriptionsRemoved: cleanedCount
      }
    });

  } catch (error) {
    console.error('Error cleaning up duplicate subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Admin: Mark monthly payment as received
const markMonthlyPayment = async (req, res) => {
  try {
    const { subscriptionId, monthNumber } = req.body;

    // Check if subscription exists
    const [subscriptionResult] = await db.execute(
      `SELECT * FROM goldmine_subscriptions WHERE id = ?`,
      [subscriptionId]
    );

    if (subscriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subscriptionResult[0];

    // Check if payment for this month already exists
    const [existingPayment] = await db.execute(
      `SELECT * FROM goldmine_monthly_payments 
       WHERE subscription_id = ? AND month_number = ?`,
      [subscriptionId, monthNumber]
    );

    if (existingPayment.length > 0) {
      // Update existing payment
      await db.execute(
        `UPDATE goldmine_monthly_payments 
         SET payment_status = 'paid', payment_date = CURRENT_DATE
         WHERE subscription_id = ? AND month_number = ?`,
        [subscriptionId, monthNumber]
      );
    } else {
      // Create new payment record
      const dueDate = new Date(subscription.start_date);
      dueDate.setMonth(dueDate.getMonth() + monthNumber - 1);

      await db.execute(
        `INSERT INTO goldmine_monthly_payments 
         (subscription_id, user_id, month_number, amount, payment_status, payment_date, due_date)
         VALUES (?, ?, ?, ?, 'paid', CURRENT_DATE, ?)`,
        [subscriptionId, subscription.user_id, monthNumber, subscription.monthly_amount, dueDate]
      );
    }

    // Add to history
    await db.execute(
      `INSERT INTO goldmine_subscription_history 
       (subscription_id, user_id, status, description) 
       VALUES (?, ?, 'payment_received', 'Month ${monthNumber} payment received - ₹${subscription.monthly_amount}')`,
      [subscriptionId, subscription.user_id]
    );

    res.json({
      success: true,
      message: `Month ${monthNumber} payment marked as received`
    });

  } catch (error) {
    console.error('Error marking monthly payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};



// Get user's total paid amount (sum of all monthly payments)
const getUserTotalPaidAmount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Calculate total paid amount from monthly payments
    const [paidAmountResult] = await db.execute(`
      SELECT COALESCE(SUM(amount), 0) as total_paid_amount
      FROM goldmine_monthly_payments gmp
      JOIN goldmine_subscriptions gs ON gmp.subscription_id = gs.id
      WHERE gs.user_id = ? AND gmp.payment_status = 'paid'
    `, [userId]);

    const totalPaidAmount = paidAmountResult[0].total_paid_amount || 0;

    res.json({
      success: true,
      data: {
        totalPaidAmount: totalPaidAmount
      }
    });

  } catch (error) {
    console.error('Error getting user total paid amount:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create monthly payment order with Razorpay
const createMonthlyPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscriptionId, monthNumber } = req.body;

    // Check if subscription exists and belongs to user
    const [subscriptionResult] = await db.execute(
      `SELECT * FROM goldmine_subscriptions WHERE id = ? AND user_id = ?`,
      [subscriptionId, userId]
    );

    if (subscriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subscriptionResult[0];

    // Check if payment for this month already exists
    const [existingPayment] = await db.execute(
      `SELECT * FROM goldmine_monthly_payments 
       WHERE subscription_id = ? AND month_number = ?`,
      [subscriptionId, monthNumber]
    );

    if (existingPayment.length > 0 && existingPayment[0].payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: `Month ${monthNumber} payment already completed`
      });
    }

    // Validate month number
    if (monthNumber < 1 || monthNumber > 11) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month number. Must be between 1 and 11.'
      });
    }

    // Check if this is the next month to be paid
    const [paidMonthsResult] = await db.execute(
      `SELECT COUNT(*) as paid_count FROM goldmine_monthly_payments 
       WHERE subscription_id = ? AND payment_status = 'paid'`,
      [subscriptionId]
    );

    const nextMonthToPay = paidMonthsResult[0].paid_count + 1;
    if (monthNumber !== nextMonthToPay) {
      return res.status(400).json({
        success: false,
        message: `This month payment already paid. You can only pay for month ${nextMonthToPay}.`
      });
    }

    // Check if user is trying to pay for consecutive months in the same month period
    const [recentPaymentResult] = await db.execute(
      `SELECT payment_date FROM goldmine_monthly_payments 
       WHERE subscription_id = ? AND payment_status = 'paid' 
       ORDER BY payment_date DESC LIMIT 1`,
      [subscriptionId]
    );

    if (recentPaymentResult.length > 0) {
      const lastPaymentDate = new Date(recentPaymentResult[0].payment_date);
      const currentDate = new Date();

      // Check if the last payment was made in the same month and year
      if (lastPaymentDate.getMonth() === currentDate.getMonth() &&
        lastPaymentDate.getFullYear() === currentDate.getFullYear()) {
        return res.status(400).json({
          success: false,
          message: 'This month payment already paid. You can pay for the next month in the following month.'
        });
      }
    }

    // Additional validation: Check if this specific month number is already paid
    const [specificMonthPayment] = await db.execute(
      `SELECT * FROM goldmine_monthly_payments 
       WHERE subscription_id = ? AND month_number = ? AND payment_status = 'paid'`,
      [subscriptionId, monthNumber]
    );

    if (specificMonthPayment.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Month ${monthNumber} payment already completed.`
      });
    }

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: 'rzp_live_RepxCmn4eqow4z',
      key_secret: 'SaunWpUXDinUBWupcCUlbx42'
    });

    const orderOptions = {
      amount: Math.round(subscription.monthly_amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `monthly_payment_${subscriptionId}_${monthNumber}_${Date.now()}`,
      notes: {
        subscription_id: subscriptionId.toString(),
        month_number: monthNumber.toString(),
        user_id: userId.toString()
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });

  } catch (error) {
    console.error('Error creating monthly payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify monthly payment with Razorpay
const verifyMonthlyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      subscriptionId,
      monthNumber,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    // Check if subscription exists and belongs to user
    const [subscriptionResult] = await db.execute(
      `SELECT * FROM goldmine_subscriptions WHERE id = ? AND user_id = ?`,
      [subscriptionId, userId]
    );

    if (subscriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subscriptionResult[0];

    // Verify Razorpay signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', 'SaunWpUXDinUBWupcCUlbx42')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get connection for transaction
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Check if payment for this month already exists
      const [existingPayment] = await connection.execute(
        `SELECT * FROM goldmine_monthly_payments 
         WHERE subscription_id = ? AND month_number = ?`,
        [subscriptionId, monthNumber]
      );

      const dueDate = new Date(subscription.start_date);
      dueDate.setMonth(dueDate.getMonth() + monthNumber - 1);

      if (existingPayment.length > 0) {
        // Update existing payment
        await connection.execute(
          `UPDATE goldmine_monthly_payments 
           SET payment_status = 'paid', 
               razorpay_payment_id = ?, 
               payment_date = CURRENT_DATE
           WHERE subscription_id = ? AND month_number = ?`,
          [razorpay_payment_id, subscriptionId, monthNumber]
        );
      } else {
        // Create new payment record
        await connection.execute(
          `INSERT INTO goldmine_monthly_payments 
           (subscription_id, user_id, month_number, amount, payment_status, razorpay_payment_id, payment_date, due_date)
           VALUES (?, ?, ?, ?, 'paid', ?, CURRENT_DATE, ?)`,
          [subscriptionId, userId, monthNumber, subscription.monthly_amount, razorpay_payment_id, dueDate]
        );
      }

      // Add to history
      await connection.execute(
        `INSERT INTO goldmine_subscription_history 
         (subscription_id, user_id, status, description) 
         VALUES (?, ?, 'payment_received', 'Month ${monthNumber} payment completed via Razorpay - ₹${subscription.monthly_amount}')`,
        [subscriptionId, userId]
      );

      // Check if all 11 months are paid and update subscription status
      const [paidMonthsResult] = await connection.execute(
        `SELECT COUNT(*) as paid_count FROM goldmine_monthly_payments 
         WHERE subscription_id = ? AND payment_status = 'paid'`,
        [subscriptionId]
      );

      if (paidMonthsResult[0].paid_count >= 11) {
        await connection.execute(
          `UPDATE goldmine_subscriptions SET status = 'completed' WHERE id = ?`,
          [subscriptionId]
        );

        await connection.execute(
          `INSERT INTO goldmine_subscription_history 
           (subscription_id, user_id, status, description) 
           VALUES (?, ?, 'completed', 'All 11 months completed - Subscription fulfilled')`,
          [subscriptionId, userId]
        );
      }

      // Commit transaction
      await connection.commit();

      res.json({
        success: true,
        message: `Month ${monthNumber} payment verified and completed successfully`
      });

    } catch (error) {
      // Rollback transaction
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }

  } catch (error) {
    console.error('Error verifying monthly payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


module.exports = {
  createSubscription,
  savePersonalDetails,
  saveNomineeDetails,
  createRazorpaySubscription,
  getSubscriptionDetails,
  getUserSubscriptions,
  updatePaymentStatus,
  markMonthlyPayment,
  getUserTotalPaidAmount,
  createMonthlyPaymentOrder,
  verifyMonthlyPayment,
  // Plan Controller Center APIs
  getPlanControllerStats,
  getUserInstallmentDetails,
  getEarlyRedemptionRequests,
  approveEarlyRedemption,
  deletePlanItem,
  exportPlanReport,
  cleanupDuplicateSubscriptions
}; 