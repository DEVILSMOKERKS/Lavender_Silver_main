const db = require('../config/db');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailSender');

// =======================================
// DIGITAL GOLD CONTROLLER
// =======================================

// Get metal types and purities for dropdown
const getMetalTypesAndPurities = async (req, res) => {
    try {
        const [metalTypes] = await db.execute('SELECT id, name, symbol FROM metal_types WHERE is_active = 1');
        const [purities] = await db.execute('SELECT id, purity_name, purity_value FROM metal_purities WHERE is_active = 1');

        res.json({
            success: true,
            data: {
                metalTypes,
                purities
            }
        });
    } catch (error) {
        console.error('Error getting metal types and purities:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get digital gold overview statistics
const getDigitalGoldStats = async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get total gold sold
            const [totalGoldResult] = await connection.execute(`
                SELECT COALESCE(SUM(gold_grams), 0) as total_gold_grams
                FROM digital_gold_transactions 
                WHERE transaction_type = 'buy' AND transaction_status = 'success'
            `);

            // Get total investment
            const [totalInvestmentResult] = await connection.execute(`
                SELECT COALESCE(SUM(total_amount), 0) as total_investment
                FROM digital_gold_transactions 
                WHERE transaction_type = 'buy' AND transaction_status = 'success'
            `);

            // Get active users count
            const [activeUsersResult] = await connection.execute(`
                SELECT COUNT(DISTINCT user_id) as active_users
                FROM digital_gold_transactions 
                WHERE transaction_status = 'success'
            `);

            // Get current gold rate (from metal rates)
            const [currentRateResult] = await connection.execute(`
                SELECT rate_per_gram 
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mt.name = 'Gold' AND mp.purity_name = '24K' AND mr.is_live = 1
                LIMIT 1
            `);

            await connection.commit();

            const stats = {
                totalGoldSold: parseFloat(totalGoldResult[0]?.total_gold_grams || 0).toFixed(2) + 'g',
                totalInvestment: '₹' + parseFloat(totalInvestmentResult[0]?.total_investment || 0).toLocaleString(),
                activeUsers: (activeUsersResult[0]?.active_users || 0).toLocaleString(),
                currentGoldRate: '₹' + parseFloat(currentRateResult[0]?.rate_per_gram || 6000).toFixed(0) + '/g'
            };

            res.json({ success: true, data: stats });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error getting digital gold stats:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all digital gold transactions
const getDigitalGoldTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status, search, user_id } = req.query;

        // Validate and convert parameters to integers
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const offset = (pageNum - 1) * limitNum;

        // Security check: If user_id is provided and user is not admin, ensure they can only see their own transactions
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.type === 'admin');
        const requestedUserId = user_id ? parseInt(user_id) : null;
        const authenticatedUserId = req.user ? req.user.id : null;

        // If user_id is provided and user is not admin, verify they're requesting their own data
        if (requestedUserId && !isAdmin && authenticatedUserId && requestedUserId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You can only view your own transactions'
            });
        }

        // If user is authenticated but not admin, and no user_id provided, show only their transactions
        const filterUserId = (requestedUserId && isAdmin) ? requestedUserId : 
                             (authenticatedUserId && !isAdmin) ? authenticatedUserId : 
                             requestedUserId;

        let query = `
            SELECT 
                dgt.id,
                dgt.transaction_type,
                dgt.gold_grams,
                dgt.rate_per_gram,
                dgt.total_amount,
                dgt.transaction_status,
                dgt.payment_method,
                dgt.transaction_reference,
                dgt.created_at,
                dgt.metal_type,
                dgt.metal_purity,
                u.name as user_name,
                u.email as user_email,
                u.id as user_id
            FROM digital_gold_transactions dgt
            JOIN user u ON dgt.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by user_id if provided or if user is authenticated (non-admin)
        if (filterUserId) {
            query += ' AND dgt.user_id = ?';
            params.push(filterUserId);
        }

        if (type && type !== 'All Types') {
            query += ' AND dgt.transaction_type = ?';
            params.push(type.toLowerCase());
        }

        if (status && status !== 'All Status') {
            query += ' AND dgt.transaction_status = ?';
            params.push(status.toLowerCase());
        }

        if (search) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ? OR dgt.transaction_reference LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY dgt.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;


        const [transactions] = await db.execute(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total
            FROM digital_gold_transactions dgt
            JOIN user u ON dgt.user_id = u.id
            WHERE 1=1
        `;
        const countParams = [];

        // Apply same user_id filter to count query
        if (filterUserId) {
            countQuery += ' AND dgt.user_id = ?';
            countParams.push(filterUserId);
        }

        if (type && type !== 'All Types') {
            countQuery += ' AND dgt.transaction_type = ?';
            countParams.push(type.toLowerCase());
        }

        if (status && status !== 'All Status') {
            countQuery += ' AND dgt.transaction_status = ?';
            countParams.push(status.toLowerCase());
        }

        if (search) {
            countQuery += ' AND (u.name LIKE ? OR u.email LIKE ? OR dgt.transaction_reference LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;


        res.json({
            success: true,
            data: transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error getting digital gold transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Create digital gold transaction
const createDigitalGoldTransaction = async (req, res) => {
    try {
        const {
            user_id,
            transaction_type,
            gold_grams,
            rate_per_gram,
            total_amount,
            payment_method,
            admin_notes
        } = req.body;

        // Generate unique transaction reference
        const transaction_reference = `DG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const [result] = await db.execute(`
            INSERT INTO digital_gold_transactions (
                user_id, transaction_type, gold_grams, rate_per_gram, 
                total_amount, metal_type, metal_purity, making_charges,
                payment_method, transaction_reference, 
                transaction_status, admin_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `, [user_id, transaction_type, gold_grams, rate_per_gram, total_amount,
            req.body.metal_type || 'Gold', req.body.metal_purity || '24K',
            req.body.making_charges || 0, payment_method, transaction_reference, admin_notes]);

        const transactionId = result.insertId;

        // Create notification for user
        try {
            await db.execute(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [user_id, 'success', `Digital Gold ${transaction_type} transaction created! Reference: ${transaction_reference}`]
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't fail transaction if notification fails
        }

        // Get user details for response
        const [userDetails] = await db.execute(`
            SELECT name, email, phone, address FROM user WHERE id = ?
        `, [user_id]);

        // Send email notification for pending transaction
        try {
            const user = userDetails[0];
            if (user && user.email) {
                const emailSubject = `Digital Gold ${transaction_type.toUpperCase()} Transaction Pending - PVJ`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                        <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #0e593c; margin: 0; font-size: 28px;">Transaction Pending</h1>
                                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your digital gold ${transaction_type} transaction is pending</p>
                            </div>
                            
                            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                                <h2 style="color: #1976d2; margin: 0 0 15px 0; font-size: 20px;">Transaction Details</h2>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Transaction ID:</td>
                                        <td style="padding: 8px 0; color: #666;">${transaction_reference}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Type:</td>
                                        <td style="padding: 8px 0; color: #666;">${transaction_type.toUpperCase()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Amount:</td>
                                        <td style="padding: 8px 0; color: #666;">${gold_grams}g</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Rate per Gram:</td>
                                        <td style="padding: 8px 0; color: #666;">₹${rate_per_gram}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Total Amount:</td>
                                        <td style="padding: 8px 0; color: #666;">₹${total_amount}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Status:</td>
                                        <td style="padding: 8px 0; color: #ff9800; font-weight: bold;">PENDING</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                                <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                                    <li style="margin-bottom: 8px;">Our team will review your transaction within 24 hours</li>
                                    <li style="margin-bottom: 8px;">You'll receive an email confirmation once processed</li>
                                    <li style="margin-bottom: 8px;">Track your transaction status in your account dashboard</li>
                                    <li style="margin-bottom: 0;">Contact support if you have any questions</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <p style="color: #666; margin: 0; font-size: 14px;">
                                    Thank you for choosing PVJ Digital Gold!
                                </p>
                                <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                                    If you have any questions, please contact our support team.
                                </p>
                            </div>
                        </div>
                    </div>
                `;

                await sendEmail({
                    to: user.email,
                    subject: emailSubject,
                    html: emailHtml
                });

            }
        } catch (emailError) {
            console.error('Failed to send pending transaction email:', emailError);
            // Don't fail the transaction creation if email fails
        }

        res.json({
            success: true,
            message: 'Digital gold transaction created successfully',
            data: {
                id: transactionId,
                transaction_reference,
                user_details: userDetails[0] || {}
            }
        });
    } catch (error) {
        console.error('Error creating digital gold transaction:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update transaction status and user balance
const updateTransactionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, payment_id } = req.body;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get transaction details
            const [transaction] = await connection.execute(`
                SELECT * FROM digital_gold_transactions WHERE id = ?
            `, [id]);

            if (transaction.length === 0) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }

            const transactionData = transaction[0];

            // Update transaction status
            await connection.execute(`
                UPDATE digital_gold_transactions
                SET transaction_status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, payment_id, id]);

            // If payment is successful, update user's digital gold balance
            if (status === 'success' && transactionData.transaction_type === 'buy') {
                const balanceChange = transactionData.gold_grams;
                const investmentChange = transactionData.total_amount;

                // Check if user exists in digital_gold_users
                const [existingUser] = await connection.execute(
                    'SELECT * FROM digital_gold_users WHERE user_id = ?',
                    [transactionData.user_id]
                );

                if (existingUser.length > 0) {
                    // Update existing user
                    await connection.execute(`
                        UPDATE digital_gold_users
                        SET total_gold_grams = total_gold_grams + ?,
                            total_investment = total_investment + ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                    `, [balanceChange, investmentChange, transactionData.user_id]);
                } else {
                    // Create new user record
                    await connection.execute(`
                        INSERT INTO digital_gold_users (user_id, total_gold_grams, total_investment)
                        VALUES (?, ?, ?)
                    `, [transactionData.user_id, balanceChange, investmentChange]);
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'Transaction status updated successfully',
                data: { id, status, payment_id }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating transaction status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.execute(`
            SELECT id, name, email, phone, address, status, created_at, updated_at
            FROM user
            WHERE id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Error getting user by ID:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get transaction details before deletion
            const [transaction] = await connection.execute(
                'SELECT * FROM digital_gold_transactions WHERE id = ?',
                [id]
            );

            if (transaction.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }

            const tx = transaction[0];

            // Reverse the transaction effects on user balance
            const balanceChange = tx.transaction_type === 'buy' ? -tx.gold_grams : tx.gold_grams;
            const investmentChange = tx.transaction_type === 'buy' ? -tx.total_amount : tx.total_amount;

            await connection.execute(`
                UPDATE digital_gold_users 
                SET total_gold_grams = total_gold_grams + ?, 
                    total_investment = total_investment + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `, [balanceChange, investmentChange, tx.user_id]);

            // Delete the transaction
            await connection.execute(
                'DELETE FROM digital_gold_transactions WHERE id = ?',
                [id]
            );

            await connection.commit();

            res.json({ success: true, message: 'Transaction deleted successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



// Get rate trend data for chart
const getRateTrendData = async (req, res) => {
    try {
        // Get actual rates from metal_rates_history for the last 7 days
        const [actualRates] = await db.execute(`
            SELECT 
                DATE(mrh.created_at) as date,
                mrh.new_rate_per_gram as actual
            FROM metal_rates_history mrh
            JOIN metal_types mt ON mrh.metal_type_id = mt.id
            JOIN metal_purities mp ON mrh.purity_id = mp.id
            WHERE mt.name = 'Gold' AND mp.purity_name = '24K'
            AND mrh.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ORDER BY mrh.created_at ASC
        `);

        // Generate predicted data for next 4 days
        const latestRate = actualRates.length > 0 ? actualRates[actualRates.length - 1].actual : 6000;
        const predictedData = Array.from({ length: 4 }, (_, index) => {
            const change = Math.random() * 10 - 5; // Random change between -5% and +5%
            const newRate = latestRate * (1 + change / 100);
            return {
                date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                predicted: Math.round(newRate)
            };
        });

        const chartData = [
            ...actualRates.map(rate => ({
                date: rate.date,
                actual: rate.actual
            })),
            ...predictedData
        ];

        res.json({ success: true, data: chartData });
    } catch (error) {
        console.error('Error getting rate trend data:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get forecast data
const getForecastData = async (req, res) => {
    try {
        const baseRate = 6000; // Current gold rate
        const forecastData = Array.from({ length: 5 }, (_, index) => {
            const change = Math.random() * 10 - 5;
            const newRate = baseRate * (1 + change / 100);
            const confidence = Math.max(70, 100 - Math.abs(change) * 2);

            return {
                date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                rate: `₹${Math.round(newRate)}`,
                change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
                confidence: `${confidence.toFixed(0)}%`
            };
        });

        res.json({ success: true, data: forecastData });
    } catch (error) {
        console.error('Error getting forecast data:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Create Razorpay order for digital gold purchase
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        // Create order data for Razorpay
        const orderData = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency,
            receipt: receipt || `dg_${Date.now()}`,
            notes: {
                source: 'digital_gold_purchase'
            }
        };

        // Create order using Razorpay API
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: 'rzp_live_RepxCmn4eqow4z',
            key_secret: 'SaunWpUXDinUBWupcCUlbx42'
        });

        const order = await razorpay.orders.create(orderData);

        res.json({
            success: true,
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            }
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

// Get user transactions with metal details
const getUserTransactions = async (req, res) => {
    try {
        const { user_id } = req.params;
        const authenticatedUserId = req.user ? req.user.id : null;
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.type === 'admin');

        // Security check: Non-admin users can only view their own transactions
        if (!isAdmin && authenticatedUserId && parseInt(user_id) !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You can only view your own transactions'
            });
        }

        const [transactions] = await db.execute(`
            SELECT 
                id,
                transaction_type,
                gold_grams,
                rate_per_gram,
                total_amount,
                metal_type,
                metal_purity,
                making_charges,
                transaction_status,
                payment_method,
                transaction_reference,
                created_at,
                updated_at
            FROM digital_gold_transactions 
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [user_id]);

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Error getting user transactions:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify Razorpay payment
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const signature = crypto
            .createHmac('sha256', 'SaunWpUXDinUBWupcCUlbx42')
            .update(text)
            .digest('hex');

        if (signature === razorpay_signature) {
            // Payment verified successfully
            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

// Get user's available metal holdings for sell
const getUserHoldings = async (req, res) => {
    try {
        const { user_id } = req.params;

        // Get all successful buy transactions grouped by metal type and purity
        const [holdings] = await db.execute(`
            SELECT 
                metal_type,
                metal_purity,
                SUM(gold_grams) as total_grams,
                AVG(rate_per_gram) as avg_rate_per_gram,
                SUM(total_amount) as total_investment,
                COUNT(*) as transaction_count,
                MIN(created_at) as first_purchase_date,
                MAX(created_at) as last_purchase_date
            FROM digital_gold_transactions
            WHERE user_id = ? 
                AND transaction_type = 'buy' 
                AND transaction_status = 'success'
            GROUP BY metal_type, metal_purity
            HAVING total_grams > 0
            ORDER BY metal_type, metal_purity
        `, [user_id]);

        // Get current rates for each metal type and purity
        const currentRates = {};
        for (const holding of holdings) {
            const [rateResult] = await db.execute(`
                SELECT mr.rate_per_gram
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mt.name = ? AND mp.purity_name = ? AND mr.is_live = 1
                LIMIT 1
            `, [holding.metal_type, holding.metal_purity]);

            currentRates[`${holding.metal_type}_${holding.metal_purity}`] =
                parseFloat(rateResult[0]?.rate_per_gram || 0); // Use actual rate without division
        }

        // Calculate current value and profit/loss for each holding
        const holdingsWithValues = holdings.map(holding => {
            const currentRate = currentRates[`${holding.metal_type}_${holding.metal_purity}`] || 0;
            const currentValue = holding.total_grams * currentRate;
            const profitLoss = currentValue - holding.total_investment;
            const profitLossPercentage = (profitLoss / holding.total_investment) * 100;

            return {
                ...holding,
                current_rate_per_gram: currentRate,
                current_value: currentValue,
                profit_loss: profitLoss,
                profit_loss_percentage: profitLossPercentage,
                profit_loss_status: profitLoss >= 0 ? 'profit' : 'loss'
            };
        });

        res.json({
            success: true,
            data: holdingsWithValues
        });
    } catch (error) {
        console.error('Error getting user holdings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Create sell transaction with specific metal selection
const createSellTransaction = async (req, res) => {
    try {
        const {
            user_id,
            metal_type,
            metal_purity,
            sell_grams,
            rate_per_gram,
            total_amount,
            payment_method = 'online'
        } = req.body;

        // Validate that user has enough of this specific metal type and purity
        const [holdings] = await db.execute(`
            SELECT SUM(gold_grams) as available_grams
            FROM digital_gold_transactions
            WHERE user_id = ? 
                AND transaction_type = 'buy' 
                AND transaction_status = 'success'
                AND metal_type = ?
                AND metal_purity = ?
        `, [user_id, metal_type, metal_purity]);

        const availableGrams = parseFloat(holdings[0]?.available_grams || 0);

        if (availableGrams < parseFloat(sell_grams)) {
            return res.status(400).json({
                success: false,
                message: `You only have ${availableGrams}g of ${metal_purity} ${metal_type} available for sale`
            });
        }

        // Generate unique transaction reference
        const transaction_reference = `DG_SELL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create sell transaction
        const [result] = await db.execute(`
            INSERT INTO digital_gold_transactions (
                user_id, transaction_type, gold_grams, rate_per_gram,
                total_amount, metal_type, metal_purity, making_charges,
                payment_method, transaction_reference, 
                transaction_status, admin_notes
            ) VALUES (?, 'sell', ?, ?, ?, ?, ?, 0, ?, ?, 'pending', ?)
        `, [user_id, sell_grams, rate_per_gram, total_amount, metal_type, metal_purity,
            payment_method, transaction_reference, `Sell: ${sell_grams}g ${metal_purity} ${metal_type}`]);

        const transactionId = result.insertId;

        // Create notification for user
        try {
            await db.execute(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [user_id, 'success', `Digital Gold sell transaction created! Reference: ${transaction_reference}`]
            );
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't fail transaction if notification fails
        }

        // Get user details for response
        const [userDetails] = await db.execute(`
            SELECT name, email, phone, address FROM user WHERE id = ?
        `, [user_id]);

        // Send email notification for pending sell transaction
        try {
            const user = userDetails[0];
            if (user && user.email) {
                const emailSubject = `Digital Gold SELL Transaction Pending - PVJ`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                        <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #0e593c; margin: 0; font-size: 28px;">Sell Transaction Pending</h1>
                                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your digital gold sell transaction is pending confirmation</p>
                            </div>
                            
                            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                                <h2 style="color: #1976d2; margin: 0 0 15px 0; font-size: 20px;">Sell Details</h2>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Transaction ID:</td>
                                        <td style="padding: 8px 0; color: #666;">${transaction_reference}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Metal Type:</td>
                                        <td style="padding: 8px 0; color: #666;">${metal_type} ${metal_purity}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Amount to Sell:</td>
                                        <td style="padding: 8px 0; color: #666;">${sell_grams}g</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Rate per Gram:</td>
                                        <td style="padding: 8px 0; color: #666;">₹${rate_per_gram}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Total Value:</td>
                                        <td style="padding: 8px 0; color: #666;">₹${total_amount}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Status:</td>
                                        <td style="padding: 8px 0; color: #ff9800; font-weight: bold;">PENDING CONFIRMATION</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                                <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">Next Steps</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                                    <li style="margin-bottom: 8px;">Please confirm your sell order in your account dashboard</li>
                                    <li style="margin-bottom: 8px;">Once confirmed, provide your bank details for refund</li>
                                    <li style="margin-bottom: 8px;">Refund will be processed within 3-5 business days</li>
                                    <li style="margin-bottom: 0;">You can cancel this transaction before confirmation</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <p style="color: #666; margin: 0; font-size: 14px;">
                                    Thank you for choosing PVJ Digital Gold!
                                </p>
                                <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                                    If you have any questions, please contact our support team.
                                </p>
                            </div>
                        </div>
                    </div>
                `;

                await sendEmail({
                    to: user.email,
                    subject: emailSubject,
                    html: emailHtml
                });

            }
        } catch (emailError) {
            console.error('Failed to send pending sell transaction email:', emailError);
            // Don't fail the transaction creation if email fails
        }

        res.json({
            success: true,
            message: 'Sell transaction created successfully',
            data: {
                id: transactionId,
                transaction_reference,
                user_details: userDetails[0] || {},
                sell_details: {
                    metal_type,
                    metal_purity,
                    grams: sell_grams,
                    rate_per_gram,
                    total_amount
                }
            }
        });
    } catch (error) {
        console.error('Error creating sell transaction:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Confirm sell transaction (Step 2)
const confirmSellTransaction = async (req, res) => {
    try {
        const { transaction_id } = req.params;

        // Get transaction details
        const [transactionResult] = await db.execute(`
            SELECT * FROM digital_gold_transactions WHERE id = ?
        `, [transaction_id]);

        if (transactionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        const transaction = transactionResult[0];

        if (transaction.transaction_type !== 'sell') {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type'
            });
        }

        if (transaction.transaction_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Transaction is not in pending status'
            });
        }

        // Get user details for email
        const [userDetails] = await db.execute(`
            SELECT name, email FROM user WHERE id = ?
        `, [transaction.user_id]);

        // Update transaction status to confirmed
        await db.execute(`
            UPDATE digital_gold_transactions 
            SET transaction_status = 'confirmed', 
                admin_notes = CONCAT(admin_notes, ' | Sell order confirmed by user'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [transaction_id]);

        // Send email notification for confirmed sell transaction
        try {
            const user = userDetails[0];
            if (user && user.email) {
                const emailSubject = `Digital Gold SELL Transaction Confirmed - PVJ`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                        <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #0e593c; margin: 0; font-size: 28px;">Sell Transaction Confirmed</h1>
                                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your digital gold sell transaction has been confirmed</p>
                            </div>
                            
                            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                                <h2 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 20px;">Transaction Details</h2>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Transaction ID:</td>
                                        <td style="padding: 8px 0; color: #666;">${transaction.transaction_reference}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Metal Type:</td>
                                        <td style="padding: 8px 0; color: #666;">${transaction.metal_type} ${transaction.metal_purity}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Amount to Sell:</td>
                                        <td style="padding: 8px 0; color: #666;">${transaction.gold_grams}g</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Rate per Gram:</td>
                                        <td style="padding: 8px 0; color: #666;">₹${transaction.rate_per_gram}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Total Value:</td>
                                        <td style="padding: 8px 0; color: #666;">₹${transaction.total_amount}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-weight: bold; color: #333;">Status:</td>
                                        <td style="padding: 8px 0; color: #2e7d32; font-weight: bold;">CONFIRMED</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                                <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">Next Steps</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                                    <li style="margin-bottom: 8px;">Please provide your bank details for refund processing</li>
                                    <li style="margin-bottom: 8px;">Refund will be processed within 3-5 business days</li>
                                    <li style="margin-bottom: 8px;">You'll receive a confirmation email once refund is initiated</li>
                                    <li style="margin-bottom: 0;">Track your transaction status in your account dashboard</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <p style="color: #666; margin: 0; font-size: 14px;">
                                    Thank you for choosing PVJ Digital Gold!
                                </p>
                                <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                                    If you have any questions, please contact our support team.
                                </p>
                            </div>
                        </div>
                    </div>
                `;

                await sendEmail({
                    to: user.email,
                    subject: emailSubject,
                    html: emailHtml
                });

            }
        } catch (emailError) {
            console.error('Failed to send confirmed sell transaction email:', emailError);
            // Don't fail the confirmation if email fails
        }

        res.json({
            success: true,
            message: 'Sell transaction confirmed successfully',
            data: {
                transaction_id,
                status: 'confirmed'
            }
        });
    } catch (error) {
        console.error('Error confirming sell transaction:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Process sell transaction and initiate refund
const processSellTransaction = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const { bank_details } = req.body;

        // Get transaction details
        const [transactionResult] = await db.execute(`
            SELECT * FROM digital_gold_transactions WHERE id = ?
        `, [transaction_id]);

        if (transactionResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        const transaction = transactionResult[0];

        if (transaction.transaction_type !== 'sell') {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type'
            });
        }

        if (transaction.transaction_status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Transaction is not in confirmed status'
            });
        }

        // Update transaction status to processing
        await db.execute(`
            UPDATE digital_gold_transactions 
            SET transaction_status = 'processing', 
                admin_notes = CONCAT(admin_notes, ' | Processing refund with bank details...')
            WHERE id = ?
        `, [transaction_id]);

        // Here you would integrate with your payment gateway for refund
        // For now, we'll simulate a successful refund
        // In production, you would call Razorpay's refund API or your bank's API

        // Update transaction status to success
        await db.execute(`
            UPDATE digital_gold_transactions 
            SET transaction_status = 'success', 
                admin_notes = CONCAT(admin_notes, ' | Refund processed successfully'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [transaction_id]);

        res.json({
            success: true,
            message: 'Sell transaction processed successfully. Refund will be processed within 3-5 business days.',
            data: {
                transaction_id,
                refund_amount: transaction.total_amount,
                estimated_processing_time: '3-5 business days'
            }
        });
    } catch (error) {
        console.error('Error processing sell transaction:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getMetalTypesAndPurities,
    getDigitalGoldStats,
    getDigitalGoldTransactions,
    createDigitalGoldTransaction,
    updateTransactionStatus,
    deleteTransaction,

    getRateTrendData,
    getForecastData,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getUserById,
    getUserTransactions,
    getUserHoldings,
    createSellTransaction,
    confirmSellTransaction,
    processSellTransaction
}; 