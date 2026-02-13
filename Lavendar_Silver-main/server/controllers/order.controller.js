const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const { triggerOrderConfirmationEmail, logUserActivity } = require('./emailAutomation.controller');
const facebookPixelTracker = require('../utils/facebookPixelTracker');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RepxCmn4eqow4z',
    key_secret: process.env.RAZORPAY_SECRET_KEY || 'SaunWpUXDinUBWupcCUlbx42',
});

const orderController = {
    getAllOrders: async (req, res) => {
        try {
            let { page = 1, limit = 20, search = '', status = '' } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 20;
            const offset = (page - 1) * limit;

            let where = 'WHERE 1=1';
            const params = [];

            if (search) {
                where += ' AND (o.id LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR o.order_number LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (status && status !== 'All') {
                where += ' AND o.order_status = ?';
                params.push(status);
            }

            // Join user and count order items (remove product_names)
            const [orderRows] = await db.execute(
                `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
                        COUNT(oi.id) as item_count
                 FROM orders o
                 LEFT JOIN user u ON o.user_id = u.id
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 ${where}
                 GROUP BY o.id
                 ORDER BY o.created_at DESC
                 LIMIT ${parseInt(limit) || 20} OFFSET ${parseInt(offset) || 0}`,
                params
            );
            let orders = orderRows;

            // Fetch items for all returned orders so that admin UI & invoices have product data
            if (orders.length > 0) {
                const orderIds = orders.map(order => order.id);
                const placeholders = orderIds.map(() => '?').join(',');
                const [items] = await db.execute(
                    `SELECT 
                        oi.*,
                        p.item_name AS product_name,
                        p.sku AS product_sku,
                        p.rate AS product_rate,
                        p.gross_weight,
                        p.less_weight,
                        c.name AS category_name,
                        sc.name AS subcategory_name,
                        ssc.name AS sub_subcategory_name,
                        (
                            SELECT image_url 
                            FROM product_images 
                            WHERE product_id = p.id 
                            ORDER BY is_thumbnail DESC, sort_order ASC 
                            LIMIT 1
                        ) AS product_image
                     FROM order_items oi
                     LEFT JOIN products p ON oi.product_id = p.id
                     LEFT JOIN categories c ON p.category_id = c.id
                     LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
                     LEFT JOIN sub_subcategories ssc ON p.sub_subcategory_id = ssc.id
                     WHERE oi.order_id IN (${placeholders})`,
                    orderIds
                );

                const itemsMap = {};
                items.forEach(item => {
                    if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
                    itemsMap[item.order_id].push(item);
                });

                orders = orders.map(order => {
                    const orderItems = itemsMap[order.id] || [];
                    return {
                        ...order,
                        items: orderItems,
                        product_summary: orderItems.length
                            ? orderItems.map(it => `${it.quantity || 1}x ${it.product_name || `Product #${it.product_id || ''}`}`).join(', ')
                            : null
                    };
                });
            }
            const [countRows] = await db.execute(
                `SELECT COUNT(*) as total FROM orders o ${where}`,
                params
            );
            res.json({
                success: true,
                data: orders,
                pagination: {
                    total: countRows[0].total,
                    total_pages: Math.ceil(countRows[0].total / limit),
                    current_page: page,
                    limit
                }
            });
        } catch (err) {
            console.error('Error in getAllOrders:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get user orders (for authenticated user)
    getUserOrders: async (req, res) => {
        try {
            const userId = req.user.id; // From auth middleware
            let { page = 1, limit = 20, status = '' } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 20;
            const offset = (page - 1) * limit;

            let where = 'WHERE o.user_id = ?';
            const params = [userId];

            if (status && status !== 'All') {
                where += ' AND o.order_status = ?';
                params.push(status);
            }

            // Get orders with item details
            const [orders] = await db.execute(
                `SELECT o.*, 
                        COUNT(oi.id) as item_count,
                        GROUP_CONCAT(CONCAT(oi.quantity, 'x ', COALESCE(p.item_name, 'Product')) SEPARATOR ', ') as product_names
                 FROM orders o
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 LEFT JOIN products p ON oi.product_id = p.id
                 ${where}
                 GROUP BY o.id
                 ORDER BY o.created_at DESC
                 LIMIT ${parseInt(limit) || 20} OFFSET ${parseInt(offset) || 0}`,
                params
            );

            // Get order items for each order
            const ordersWithItems = await Promise.all(orders.map(async (order) => {
                const [items] = await db.execute(`
                    SELECT oi.*, p.item_name as product_name, p.slug as product_slug
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = ?
                `, [order.id]);

                return {
                    ...order,
                    items: items
                };
            }));

            const [countRows] = await db.execute(
                `SELECT COUNT(*) as total FROM orders o ${where}`,
                params
            );

            res.json({
                success: true,
                data: ordersWithItems,
                pagination: {
                    total: countRows[0].total,
                    total_pages: Math.ceil(countRows[0].total / limit),
                    current_page: page,
                    limit
                }
            });
        } catch (err) {
            console.error('Error in getUserOrders:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Get order by ID (with items and customer info) - user can only view their own orders, admin can view any
    getOrderById: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id; // From auth middleware
            const isAdmin = req.user.role === 'admin' || req.admin; // Check if user is admin

            // Build query - admin can view any order, regular user can only view their own
            let whereClause = 'WHERE o.id = ?';
            const params = [id];

            if (!isAdmin) {
                whereClause += ' AND o.user_id = ?';
                params.push(userId);
            }

            // Join user table to get customer info
            const [orders] = await db.execute(
                `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
                 FROM orders o
                 LEFT JOIN user u ON o.user_id = u.id
                 ${whereClause}`,
                params
            );

            if (!orders.length) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // Get order items with product details
            const [items] = await db.execute(
                `SELECT 
                    oi.*,
                    p.item_name AS product_name,
                    p.sku AS product_sku,
                    p.rate AS product_rate,
                    p.gross_weight,
                    p.less_weight,
                    c.name AS category_name,
                    sc.name AS subcategory_name,
                    ssc.name AS sub_subcategory_name,
                    (
                        SELECT image_url 
                        FROM product_images 
                        WHERE product_id = p.id 
                        ORDER BY is_thumbnail DESC, sort_order ASC 
                        LIMIT 1
                    ) AS product_image
                 FROM order_items oi
                 LEFT JOIN products p ON oi.product_id = p.id
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
                 LEFT JOIN sub_subcategories ssc ON p.sub_subcategory_id = ssc.id
                 WHERE oi.order_id = ?`,
                [id]
            );

            res.json({ success: true, data: { ...orders[0], items } });
        } catch (err) {
            console.error('Error in getOrderById:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },


    async createOrder(req, res) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const {
                user_id, user_name, user_email, user_phone,
                total_amount, payment_method,
                shipping_city, shipping_state, shipping_country,
                shipping_postal_code, shipping_address, cod_charge, items,
                order_token, // For duplicate order prevention
                payment_id, // Razorpay payment ID (if payment already done)
                payment_status, // Payment status (if payment already done)
                discount_code, // Discount coupon code
                discount_amount, // Discount amount applied
                pan_number, // PAN Number (required for orders >= ₹2,00,000)
                aadhaar_number // Aadhaar Number (required for orders >= ₹2,00,000)
            } = req.body;

            // Check if payment is already done (payment success)
            const isPaymentDone = payment_id && (payment_status === 'paid' || payment_method !== 'cod');

            // ==========================================
            // INPUT VALIDATION
            // ==========================================
            const errors = [];

            if (!user_name || typeof user_name !== 'string' || user_name.trim() === '') {
                errors.push('User name is required');
            }
            if (!user_email || typeof user_email !== 'string' || !user_email.includes('@')) {
                errors.push('Valid email is required');
            }
            if (!user_phone || typeof user_phone !== 'string' || user_phone.trim() === '') {
                errors.push('Phone number is required');
            }
            if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
                errors.push('Valid total amount is required');
            }
            if (!payment_method || !['cod', 'online', 'upi', 'wallet'].includes(payment_method)) {
                errors.push('Valid payment method is required');
            }
            if (!shipping_address || typeof shipping_address !== 'string' || shipping_address.trim() === '') {
                errors.push('Shipping address is required');
            }
            if (!shipping_city || typeof shipping_city !== 'string' || shipping_city.trim() === '') {
                errors.push('Shipping city is required');
            }
            if (!shipping_state || typeof shipping_state !== 'string' || shipping_state.trim() === '') {
                errors.push('Shipping state is required');
            }
            if (!shipping_country || typeof shipping_country !== 'string' || shipping_country.trim() === '') {
                errors.push('Shipping country is required');
            }
            if (!shipping_postal_code || typeof shipping_postal_code !== 'string' || shipping_postal_code.trim() === '') {
                errors.push('Shipping postal code is required');
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                errors.push('At least one item is required');
            }

            // PAN and Aadhaar validation for high-value orders (>= ₹2,00,000)
            const parsedTotalAmount = parseFloat(total_amount) || 0;
            const isHighValueOrder = parsedTotalAmount >= 200000;

            if (isHighValueOrder) {
                // PAN validation: 5 uppercase letters + 4 digits + 1 uppercase letter
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!pan_number || typeof pan_number !== 'string' || pan_number.trim() === '') {
                    errors.push('PAN Number is required for orders above ₹2,00,000');
                } else {
                    const panUpper = pan_number.trim().toUpperCase();
                    if (!panRegex.test(panUpper)) {
                        errors.push('Invalid PAN format. Format: ABCDE1234F (5 uppercase letters + 4 digits + 1 uppercase letter)');
                    }
                }

                // Aadhaar validation: Exactly 12 numeric digits
                const aadhaarRegex = /^[0-9]{12}$/;
                if (!aadhaar_number || typeof aadhaar_number !== 'string' || aadhaar_number.trim() === '') {
                    errors.push('Aadhaar Number is required for orders above ₹2,00,000');
                } else {
                    const aadhaarClean = aadhaar_number.trim().replace(/\s/g, '');
                    if (!aadhaarRegex.test(aadhaarClean)) {
                        errors.push('Invalid Aadhaar format. Must be exactly 12 numeric digits');
                    }
                }
            }

            if (errors.length > 0) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }


            if (isPaymentDone && payment_id) {
                const truncatedPaymentId = payment_id.substring(0, 100);
                const [existingOrderByPaymentId] = await conn.execute(
                    'SELECT id, order_number, payment_status FROM orders WHERE payment_id = ? LIMIT 1',
                    [truncatedPaymentId]
                );
                if (existingOrderByPaymentId.length > 0) {
                    await conn.rollback();
                    return res.status(409).json({
                        success: false,
                        message: 'Order already exists for this payment',
                        order_id: existingOrderByPaymentId[0].id,
                        order_number: existingOrderByPaymentId[0].order_number,
                        payment_status: existingOrderByPaymentId[0].payment_status
                    });
                }
            }

            if (order_token) {
                const tokenPaymentId = `order_token_${order_token}`;
                const [existingOrderByToken] = await conn.execute(
                    'SELECT id, order_number FROM orders WHERE payment_id = ? LIMIT 1',
                    [tokenPaymentId]
                );
                if (existingOrderByToken.length > 0) {
                    await conn.rollback();
                    return res.status(409).json({
                        success: false,
                        message: 'Duplicate order detected',
                        order_id: existingOrderByToken[0].id,
                        order_number: existingOrderByToken[0].order_number
                    });
                }
            }

            let finalUserId = user_id;
            if (!finalUserId) {
                const [existingUsers] = await conn.execute(
                    'SELECT id FROM user WHERE email = ? OR phone = ? LIMIT 1 FOR UPDATE',
                    [user_email, user_phone]
                );
                if (existingUsers.length > 0) {
                    finalUserId = existingUsers[0].id;
                } else {
                    try {
                        const [userResult] = await conn.execute(
                            'INSERT INTO user (name, email, phone) VALUES (?, ?, ?)',
                            [user_name.trim(), user_email.trim(), user_phone.trim()]
                        );
                        finalUserId = userResult.insertId;
                    } catch (userError) {
                        if (userError.code === 'ER_DUP_ENTRY') {
                            const [duplicateUsers] = await conn.execute(
                                'SELECT id FROM user WHERE email = ? OR phone = ? LIMIT 1',
                                [user_email, user_phone]
                            );
                            if (duplicateUsers.length > 0) {
                                finalUserId = duplicateUsers[0].id;
                            } else {
                                throw userError;
                            }
                        } else {
                            throw userError;
                        }
                    }
                }
            }

            if (finalUserId && user_phone) {
                const [currentUser] = await conn.execute(
                    'SELECT phone FROM user WHERE id = ?',
                    [finalUserId]
                );
                if (currentUser.length > 0 && currentUser[0].phone !== user_phone) {
                    await conn.execute(
                        'UPDATE user SET phone = ? WHERE id = ?',
                        [user_phone.trim(), finalUserId]
                    );
                }
            }

            const validatedItems = [];
            let calculatedTotal = 0;
            const productIds = items.map(item => item.product_id);

            const placeholders = productIds.map(() => '?').join(',');
            const [allProducts] = await conn.execute(
                `SELECT id, item_name, rate, labour, labour_on, discount, tunch, additional_weight, 
                        wastage_percentage, diamond_weight, stone_weight, other, status, total_rs
                 FROM products WHERE id IN (${placeholders})`,
                productIds
            );

            const productMap = {};
            allProducts.forEach(product => {
                productMap[product.id] = product;
            });

            const productOptionIds = items
                .filter(item => item.product_option_id)
                .map(item => item.product_option_id);

            let productOptionMap = {};
            if (productOptionIds.length > 0) {
                const optionPlaceholders = productOptionIds.map(() => '?').join(',');
                const [allProductOptions] = await conn.execute(
                    `SELECT id, product_id, sell_price, value, size, weight, metal_color 
                     FROM product_options WHERE id IN (${optionPlaceholders})`,
                    productOptionIds
                );
                allProductOptions.forEach(option => {
                    productOptionMap[option.id] = option;
                });
            }

            for (const item of items) {
                if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
                    await conn.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Invalid quantity for product ${item.product_id || 'unknown'}`
                    });
                }

                const product = productMap[item.product_id];
                if (!product) {
                    await conn.rollback();
                    return res.status(404).json({
                        success: false,
                        message: `Product with ID ${item.product_id} not found`
                    });
                }
                if (product.status !== 'active') {
                    await conn.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Product "${product.item_name || product.id}" is not available for purchase`
                    });
                }

                if (item.product_option_id) {
                    const productOption = productOptionMap[item.product_option_id];
                    if (!productOption) {
                        await conn.rollback();
                        return res.status(404).json({
                            success: false,
                            message: `Product option with ID ${item.product_option_id} not found`
                        });
                    }
                    if (productOption.product_id !== item.product_id) {
                        await conn.rollback();
                        return res.status(400).json({
                            success: false,
                            message: `Product option ${item.product_option_id} does not belong to product ${item.product_id}`
                        });
                    }
                }

                let validPrice = 0;
                let dbPrice = 0;

                if (item.product_option_id && productOptionMap[item.product_option_id]) {
                    const option = productOptionMap[item.product_option_id];
                    dbPrice = parseFloat(option.sell_price || option.value || 0);
                } else {
                    dbPrice = parseFloat(product.total_rs || product.rate || 0);
                }

                // CRITICAL: If payment is already done, use the paid amount (item.price) directly
                // This is the amount user actually paid via Razorpay
                if (isPaymentDone) {
                    const paidPrice = parseFloat(item.price || 0);
                    if (paidPrice > 0) {
                        validPrice = paidPrice;
                    } else {
                        // Fallback if item.price is not available
                        const fallbackPrice = items.length > 0 ? parseFloat(total_amount) / items.length : 1;
                        validPrice = Math.max(fallbackPrice, 1);
                    }
                } else {
                    // Payment not done - use database price with validation
                    validPrice = dbPrice;

                    if (item.custom_price) {
                        const customPrice = parseFloat(item.custom_price);
                        if (dbPrice > 0) {
                            const priceDiff = Math.abs(customPrice - dbPrice);
                            const maxDiff = dbPrice * 0.2;
                            if (priceDiff > maxDiff) {
                                console.log(`[Order] Price mismatch for product ${item.product_id}: DB=${dbPrice}, Frontend=${customPrice}`);
                                validPrice = dbPrice;
                            } else {
                                validPrice = customPrice;
                            }
                        } else {
                            if (customPrice > 0) {
                                validPrice = customPrice;
                            }
                        }
                    }

                    if (validPrice <= 0) {
                        await conn.rollback();
                        return res.status(400).json({
                            success: false,
                            message: `Product "${product.item_name || product.id}" has invalid price. Database: ${dbPrice}, Custom: ${item.custom_price || 'N/A'}, Frontend: ${item.price || 'N/A'}`
                        });
                    }
                }

                const itemTotal = validPrice * item.quantity;
                calculatedTotal += itemTotal;

                validatedItems.push({
                    ...item,
                    validatedPrice: validPrice,
                    itemTotal
                });
            }

            const codCharge = parseFloat(cod_charge || 0);
            const finalCalculatedTotal = calculatedTotal + codCharge;
            const totalTolerance = finalCalculatedTotal * 0.05;

            let finalOrderTotal = finalCalculatedTotal;
            if (isPaymentDone && Math.abs(parseFloat(total_amount) - finalCalculatedTotal) > totalTolerance) {
                finalOrderTotal = parseFloat(total_amount);
                console.log(`[Order] Payment done, using paid amount instead of calculated: ${finalOrderTotal} (calculated: ${finalCalculatedTotal})`);
            } else if (!isPaymentDone && Math.abs(parseFloat(total_amount) - finalCalculatedTotal) > totalTolerance) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Order total mismatch',
                    expected: finalCalculatedTotal,
                    received: total_amount
                });
            }

            const order_number = 'PVJ-' + uuidv4().split('-')[0].toUpperCase();

            let final_payment_status = payment_status || 'pending';
            if (payment_method === 'cod') {
                final_payment_status = 'pending';
            } else if (isPaymentDone && payment_status === 'paid') {
                final_payment_status = 'paid';
            } else if (payment_method === 'online' || payment_method === 'upi' || payment_method === 'wallet') {
                final_payment_status = 'pending';
            }

            const order_status = 'processing';
            let final_payment_id = null;
            if (isPaymentDone && payment_id) {
                final_payment_id = payment_id.substring(0, 100);
            } else if (order_token) {
                const tokenPaymentId = `order_token_${order_token}`;
                final_payment_id = tokenPaymentId.substring(0, 100);
            }

            // Prepare PAN and Aadhaar values (normalize and clean)
            let finalPanNumber = null;
            let finalAadhaarNumber = null;
            
            if (isHighValueOrder) {
                if (pan_number && typeof pan_number === 'string' && pan_number.trim()) {
                    finalPanNumber = pan_number.trim().toUpperCase();
                }
                if (aadhaar_number && typeof aadhaar_number === 'string' && aadhaar_number.trim()) {
                    finalAadhaarNumber = aadhaar_number.trim().replace(/\s/g, '');
                }
            }

            const [orderResult] = await conn.execute(`
                INSERT INTO orders 
                (user_id, order_number, total_amount, payment_status, order_status, payment_method, payment_id, shipping_city, shipping_state, shipping_country, shipping_postal_code, shipping_address, cod_charge, discount_code, discount_amount, pan_number, aadhaar_number) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [finalUserId, order_number, finalOrderTotal, final_payment_status, order_status, payment_method, final_payment_id, shipping_city.trim(), shipping_state.trim(), shipping_country.trim(), shipping_postal_code.trim(), shipping_address.trim(), codCharge, discount_code || null, parseFloat(discount_amount || 0), finalPanNumber, finalAadhaarNumber]
            );
            const orderId = orderResult.insertId;

            const [allLessWeightData] = await conn.execute(
                `SELECT product_id, item, weight, sale_value 
                 FROM product_less_weight 
                 WHERE product_id IN (${placeholders}) 
                 ORDER BY product_id, id LIMIT ${productIds.length}`,
                productIds
            );

            const lessWeightMap = {};
            allLessWeightData.forEach(lw => {
                if (!lessWeightMap[lw.product_id]) {
                    lessWeightMap[lw.product_id] = {
                        item_name: lw.item || null,
                        weight: parseFloat(lw.weight || 0),
                        sale_value: parseFloat(lw.sale_value || 0)
                    };
                }
            });

            for (const item of validatedItems) {
                const product = productMap[item.product_id];
                const lessWeight = lessWeightMap[item.product_id] || {
                    item_name: null,
                    weight: 0,
                    sale_value: 0
                };
                const productOption = item.product_option_id ? productOptionMap[item.product_option_id] : null;

                await conn.execute(`
                    INSERT INTO order_items 
                    (order_id, product_id, product_option_id, quantity, price, item_name, rate, labour, labour_on, less_weight_item_name, less_weight_weight, less_weight_sale_value, discount, tunch, additional_weight, wastage_percentage, diamond_weight, stone_weight, other, size, weight, metal_type, custom_price) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        item.product_id,
                        item.product_option_id || null,
                        item.quantity,
                        item.validatedPrice,
                        product.item_name || null,
                        parseFloat(product.rate || 0),
                        parseFloat(product.labour || 0),
                        product.labour_on || 'Wt',
                        lessWeight.item_name,
                        lessWeight.weight,
                        lessWeight.sale_value,
                        parseFloat(product.discount || 0),
                        parseFloat(product.tunch || 100.00),
                        parseFloat(product.additional_weight || 0),
                        parseFloat(product.wastage_percentage || 0),
                        parseFloat(product.diamond_weight || 0),
                        parseFloat(product.stone_weight || 0),
                        parseFloat(product.other || 0),
                        productOption ? productOption.size : (item.size || null),
                        productOption ? productOption.weight : (item.weight || null),
                        productOption ? productOption.metal_color : (item.metal_type || null),
                        item.custom_price || null
                    ]
                );
            }

            try {
                await conn.execute(
                    'DELETE FROM cart_items WHERE user_id = ?',
                    [finalUserId]
                );
            } catch (cartError) {
                console.error('Error clearing cart:', cartError);
            }

            await conn.commit();

            try {
                const { resetAbandonedCartTracking } = require('./emailAutomation.controller');
                await resetAbandonedCartTracking(finalUserId);
            } catch (resetError) {
                console.error('Error resetting abandoned cart tracking:', resetError);
            }

            try {
                const orderDetails = {
                    order_number,
                    total: finalOrderTotal,
                    items: validatedItems.map(item => ({
                        product_id: item.product_id,
                        product_option_id: item.product_option_id,
                        quantity: item.quantity,
                        price: item.validatedPrice
                    })),
                    shipping_address: shipping_address,
                    shipping_city: shipping_city,
                    shipping_state: shipping_state,
                    shipping_country: shipping_country,
                    shipping_postal_code: shipping_postal_code,
                    payment_method: payment_method,
                    cod_charge: codCharge
                };
                await triggerOrderConfirmationEmail(finalUserId, user_email, user_name, orderDetails);
                await logUserActivity(finalUserId, 'purchase', {
                    order_id: orderId,
                    order_number,
                    total_amount: finalOrderTotal
                });
            } catch (emailError) {
                console.error('Order confirmation email trigger error:', emailError);
            }

            try {
                const { sendEmail } = require('../utils/emailSender');
                const adminEmail = process.env.ADMIN_EMAIL || 'admin@pvjjewels.com';

                const adminEmailContent = `
                    <h2>New Order Received</h2>
                    <p><strong>Order Number:</strong> ${order_number}</p>
                    <p><strong>Customer:</strong> ${user_name}</p>
                    <p><strong>Email:</strong> ${user_email}</p>
                    <p><strong>Phone:</strong> ${user_phone}</p>
                    <p><strong>Total Amount:</strong> ₹${finalOrderTotal}</p>
                    <p><strong>Payment Method:</strong> ${payment_method}</p>
                    <p><strong>Payment Status:</strong> ${final_payment_status}</p>
                    <p><strong>Shipping Address:</strong> ${shipping_address}, ${shipping_city}, ${shipping_state} - ${shipping_postal_code}</p>
                    <p><strong>Items:</strong> ${validatedItems.length} item(s)</p>
                    <p><strong>Order Time:</strong> ${new Date().toLocaleString()}</p>
                `;

                await sendEmail({
                    to: adminEmail,
                    subject: `New Order: ${order_number} - ₹${finalOrderTotal}`,
                    html: adminEmailContent
                });
            } catch (adminEmailError) {
                console.error('Admin notification email error:', adminEmailError);
            }

            try {
                await facebookPixelTracker.trackPurchase(finalUserId, orderId, order_number, finalOrderTotal);
            } catch (pixelError) {
                console.error('Facebook Pixel tracking error:', pixelError);
            }

            // Create notification (user_id can be null for guest users)
            try {
                await conn.execute(
                    'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                    [finalUserId || null, 'success', `Order #${order_number} has been placed successfully! Total: ₹${finalOrderTotal}`]
                );
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
                // Don't fail order creation if notification fails
            }

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                order_id: orderId,
                order_number,
                total_amount: finalOrderTotal,
                payment_status: final_payment_status,
            });

        } catch (err) {
            await conn.rollback();
            console.error('Error in createOrder:', err);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            conn.release();
        }
    },

    async createRazorpayOrder(req, res) {

        const { amount, currency = 'INR', receipt } = req.body;
        try {
            if (!amount || isNaN(amount) || amount <= 0) {
                console.error('Invalid amount provided:', amount);
                return res.status(400).json({ success: false, message: 'Invalid amount provided' });
            }
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(amount * 100),
                currency,
                receipt: receipt || `pvj_${Date.now()}`,
            });
            res.json({ success: true, razorpay_order_id: razorpayOrder.id });
        } catch (err) {
            console.error('Error in createRazorpayOrder:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },


    updateOrderPayment: async (req, res) => {
        try {
            const { id } = req.params;
            const { payment_id, payment_status } = req.body;
            const [result] = await db.execute(
                `UPDATE orders SET payment_id=?, payment_status=?, updated_at=NOW() WHERE id=?`,
                [payment_id, payment_status, id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });
            res.json({ success: true, message: 'Order payment updated' });
        } catch (err) {
            console.error('Error in updateOrderPayment:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },


    updateOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { order_status, payment_status, shipping_city, shipping_state, shipping_country, shipping_postal_code, shipping_address, cod_charge } = req.body;

            const updateFields = [];
            const updateValues = [];

            if (order_status !== undefined) {
                updateFields.push('order_status = ?');
                updateValues.push(order_status);
            }
            if (payment_status !== undefined) {
                updateFields.push('payment_status = ?');
                updateValues.push(payment_status);
            }
            if (shipping_city !== undefined && shipping_city !== null && shipping_city !== '') {
                updateFields.push('shipping_city = ?');
                updateValues.push(shipping_city);
            }
            if (shipping_state !== undefined && shipping_state !== null && shipping_state !== '') {
                updateFields.push('shipping_state = ?');
                updateValues.push(shipping_state);
            }
            if (shipping_country !== undefined && shipping_country !== null && shipping_country !== '') {
                updateFields.push('shipping_country = ?');
                updateValues.push(shipping_country);
            }
            if (shipping_postal_code !== undefined && shipping_postal_code !== null && shipping_postal_code !== '') {
                updateFields.push('shipping_postal_code = ?');
                updateValues.push(shipping_postal_code);
            }
            if (shipping_address !== undefined && shipping_address !== null && shipping_address !== '') {
                updateFields.push('shipping_address = ?');
                updateValues.push(shipping_address);
            }
            if (cod_charge !== undefined) {
                updateFields.push('cod_charge = ?');
                updateValues.push(cod_charge);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }

            updateFields.push('updated_at = NOW()');
            updateValues.push(id);

            const [result] = await db.execute(
                `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });
            res.json({ success: true, message: 'Order updated' });
        } catch (err) {
            console.error('Error in updateOrder:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    deleteOrder: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const { id } = req.params;
            await conn.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
            const [result] = await conn.execute('DELETE FROM orders WHERE id = ?', [id]);
            await conn.commit();
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found' });
            res.json({ success: true, message: 'Order deleted' });
        } catch (err) {
            await conn.rollback();
            console.error('Error in deleteOrder:', err);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            conn.release();
        }
    },

    getOrderItems: async (req, res) => {
        try {
            const { order_id } = req.query;
            let query = 'SELECT * FROM order_items';
            const params = [];
            if (order_id) {
                query += ' WHERE order_id = ?';
                params.push(order_id);
            }
            const [items] = await db.execute(query, params);
            res.json({ success: true, data: items });
        } catch (err) {
            console.error('Error in getOrderItems:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },
    updateOrderItem: async (req, res) => {
        try {
            const { id } = req.params;
            const { quantity, price, item_name, rate, labour, labour_on, less_weight_item_name, less_weight_weight, less_weight_sale_value, discount, tunch, additional_weight, wastage_percentage, diamond_weight, stone_weight, other, size, weight, metal_type, custom_price } = req.body;
            const [result] = await db.execute(
                `UPDATE order_items SET quantity=?, price=?, item_name=?, rate=?, labour=?, labour_on=?, less_weight_item_name=?, less_weight_weight=?, less_weight_sale_value=?, discount=?, tunch=?, additional_weight=?, wastage_percentage=?, diamond_weight=?, stone_weight=?, other=?, size=?, weight=?, metal_type=?, custom_price=? WHERE id=?`,
                [quantity, price, item_name || null, rate || 0, labour || 0, labour_on || 'Wt', less_weight_item_name || null, less_weight_weight || 0, less_weight_sale_value || 0, discount || 0, tunch || 100.00, additional_weight || 0, wastage_percentage || 0, diamond_weight || 0, stone_weight || 0, other || 0, size, weight, metal_type, custom_price, id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order item not found' });
            res.json({ success: true, message: 'Order item updated' });
        } catch (err) {
            console.error('Error in updateOrderItem:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },
    deleteOrderItem: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute('DELETE FROM order_items WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order item not found' });
            res.json({ success: true, message: 'Order item deleted' });
        } catch (err) {
            console.error('Error in deleteOrderItem:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    generateInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const [orders] = await db.execute(`
                SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
                FROM orders o
                JOIN user u ON o.user_id = u.id
                WHERE o.id = ? AND o.user_id = ?
            `, [id, userId]);

            if (orders.length === 0) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const order = orders[0];

            const [items] = await db.execute(
                `SELECT 
                    oi.*,
                    p.item_name AS product_name,
                    p.sku AS product_sku,
                    p.rate AS product_rate,
                    p.gross_weight,
                    p.less_weight,
                    c.name AS category_name,
                    sc.name AS subcategory_name,
                    ssc.name AS sub_subcategory_name,
                    (
                        SELECT image_url 
                        FROM product_images 
                        WHERE product_id = p.id 
                        ORDER BY is_thumbnail DESC, sort_order ASC 
                        LIMIT 1
                    ) AS product_image
                 FROM order_items oi
                 LEFT JOIN products p ON oi.product_id = p.id
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
                 LEFT JOIN sub_subcategories ssc ON p.sub_subcategory_id = ssc.id
                 WHERE oi.order_id = ?`,
                [id]
            );

            res.json({
                success: true,
                message: 'Invoice generation is now handled client-side. Use the order data to generate PDF.',
                data: { ...order, items }
            });
        } catch (err) {
            console.error('Error generating invoice:', err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    }
};

module.exports = orderController;