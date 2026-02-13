const db = require('../config/db');
const { logUserActivity } = require('./emailAutomation.controller');
const { sendEmail } = require('../utils/emailSender');
const facebookPixelTracker = require('../utils/facebookPixelTracker');

// =======================================
// CART OPERATIONS
// =======================================

// Get user's cart
const getUserCart = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [cartItems] = await db.execute(`
            SELECT 
                ci.*,
                p.item_name as product_name,
                p.slug as product_slug,
                p.sku,
                p.stamp,
                p.discount,
                p.total_rs,
                p.rate as product_rate,
                po.sell_price as option_sell_price,
                po.value as option_value,
                po.size as selected_size,
                po.weight as selected_weight,
                po.dimensions,
                po.metal_color,
                po.gender,
                po.occasion,
                pi.image_url,
                c.name as category_name,
                sc.name as subcategory_name
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_options po ON ci.product_option_id = po.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = 1
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
            WHERE ci.user_id = ?
            ORDER BY ci.added_at DESC
        `, [user_id]);

        // Calculate total price for each item using dynamic pricing logic
        const cartWithTotals = cartItems.map(item => {
            // Dynamic pricing logic - prioritize product option pricing
            let sellPrice = 0;

            // Try to get price from product_options sell_price first
            if (item.option_sell_price) {
                sellPrice = Number(item.option_sell_price);
            }
            // Try to get price from product_options value
            else if (item.option_value) {
                sellPrice = Number(item.option_value);
            }
            // Try to get price from products total_rs
            else if (item.total_rs) {
                sellPrice = Number(item.total_rs);
            }
            // Fallback to 0 if no price found
            else {
                sellPrice = 0;
            }

            const discount = parseFloat(item.discount || 0);
            const finalPrice = discount > 0 ? sellPrice - (sellPrice * discount / 100) : sellPrice;
            const totalPrice = finalPrice * item.quantity;

            return {
                ...item,
                product_price: sellPrice,
                sell_price: sellPrice,
                final_price: finalPrice,
                total_price: totalPrice,
                // Include option details for frontend
                option_details: {
                    size: item.size,
                    weight: item.weight,
                    dimensions: item.dimensions,
                    metal_color: item.metal_color,
                    gender: item.gender,
                    occasion: item.occasion
                }
            };
        });

        // Calculate cart totals
        const subtotal = cartWithTotals.reduce((sum, item) => sum + item.total_price, 0);
        const totalItems = cartWithTotals.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            data: {
                items: cartWithTotals,
                summary: {
                    subtotal,
                    total_items: totalItems,
                    item_count: cartWithTotals.length
                }
            }
        });
    } catch (error) {
        console.error('Error getting user cart:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const {
            product_id,
            quantity = 1,
            product_option_id
        } = req.body;

        // Validate product exists
        const [products] = await db.execute(
            'SELECT * FROM products WHERE id = ? AND status = "active"',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let finalProductOptionId = product_option_id;

        // If no product_option_id provided, get the first available option
        if (!finalProductOptionId) {
            const [options] = await db.execute(
                'SELECT id FROM product_options WHERE product_id = ? ORDER BY id ASC LIMIT 1',
                [product_id]
            );

            if (options.length > 0) {
                finalProductOptionId = options[0].id;
            }
        }

        // Check if item already exists in cart with same product_option_id
        const [existingItems] = await db.execute(
            'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND product_option_id = ?',
            [user_id, product_id, finalProductOptionId]
        );

        if (existingItems.length > 0) {
            // Update quantity of existing item
            const existingItem = existingItems[0];
            const newQuantity = existingItem.quantity + quantity;

            await db.execute(
                'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newQuantity, existingItem.id]
            );

            res.json({
                success: true,
                message: 'Cart item quantity updated',
                data: { id: existingItem.id, quantity: newQuantity }
            });
        } else {
            // Add new item to cart
            const [result] = await db.execute(
                'INSERT INTO cart_items (user_id, product_id, quantity, product_option_id) VALUES (?, ?, ?, ?)',
                [user_id, product_id, quantity, finalProductOptionId]
            );

            res.status(201).json({
                success: true,
                message: 'Item added to cart',
                data: { id: result.insertId }
            });

            // Log user activity for email automation
            try {
                await logUserActivity(user_id, 'add_to_cart', {
                    product_id,
                    quantity,
                    cart_item_id: result.insertId
                });
            } catch (activityError) {
                console.error('Activity logging error:', activityError);
            }

            // Track Facebook Pixel AddToCart event
            try {
                const product = products[0];
                const productPrice = parseFloat(product.total_rs || 0);
                await facebookPixelTracker.trackAddToCart(user_id, product_id, product.item_name, productPrice, quantity);
            } catch (pixelError) {
                console.error('Facebook Pixel tracking error:', pixelError);
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update cart item
const updateCartItem = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { cart_item_id } = req.params;
        const { quantity, product_option_id } = req.body;

        // Validate cart item belongs to user
        const [cartItems] = await db.execute(
            'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
            [cart_item_id, user_id]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        // Update cart item
        const updateFields = [];
        const updateValues = [];

        if (quantity !== undefined) {
            updateFields.push('quantity = ?');
            updateValues.push(quantity);
        }

        if (product_option_id !== undefined) {
            updateFields.push('product_option_id = ?');
            updateValues.push(product_option_id);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(cart_item_id);

        await db.execute(
            `UPDATE cart_items SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'Cart item updated successfully'
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { cart_item_id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
            [cart_item_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        // Check if cart is now empty and reset abandoned cart tracking if it is
        const [remainingItems] = await db.execute(
            'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?',
            [user_id]
        );

        if (remainingItems[0].count === 0) {
            // Cart is now empty, reset abandoned cart email tracking
            const { resetAbandonedCartTracking } = require('./emailAutomation.controller');
            await resetAbandonedCartTracking(user_id);
        }

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Clear user's cart
const clearCart = async (req, res) => {
    try {
        const user_id = req.user.id;

        await db.execute(
            'DELETE FROM cart_items WHERE user_id = ?',
            [user_id]
        );

        // Reset abandoned cart email tracking since user cleared their cart
        const { resetAbandonedCartTracking } = require('./emailAutomation.controller');
        await resetAbandonedCartTracking(user_id);

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get cart summary
const getCartSummary = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [cartItems] = await db.execute(`
            SELECT 
                ci.quantity,
                po.sell_price,
                po.value,
                p.discount
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_options po ON ci.product_option_id = po.id
            WHERE ci.user_id = ?
        `, [user_id]);

        const summary = cartItems.reduce((acc, item) => {
            const productPrice = parseFloat(item.sell_price || item.value || 0);
            const discount = parseFloat(item.discount || 0);
            const finalPrice = discount > 0 ? productPrice - (productPrice * discount / 100) : productPrice;
            const total = finalPrice * item.quantity;

            acc.subtotal += total;
            acc.total_items += item.quantity;
            acc.item_count += 1;

            return acc;
        }, { subtotal: 0, total_items: 0, item_count: 0 });

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error getting cart summary:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Move item from wishlist to cart
const moveFromWishlistToCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { wishlist_item_id } = req.params;
        const { quantity = 1 } = req.body;

        // Get wishlist item
        const [wishlistItems] = await db.execute(
            'SELECT * FROM wishlist_items WHERE id = ? AND user_id = ?',
            [wishlist_item_id, user_id]
        );

        if (wishlistItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Wishlist item not found' });
        }

        const wishlistItem = wishlistItems[0];

        // Add to cart
        await db.execute(
            'INSERT INTO cart_items (user_id, product_id, quantity, product_option_id) VALUES (?, ?, ?, ?)',
            [user_id, wishlistItem.product_id, quantity, wishlistItem.product_option_id]
        );

        // Remove from wishlist
        await db.execute(
            'DELETE FROM wishlist_items WHERE id = ?',
            [wishlist_item_id]
        );

        res.json({
            success: true,
            message: 'Item moved from wishlist to cart'
        });
    } catch (error) {
        console.error('Error moving from wishlist to cart:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// =======================================
// ADMIN CART OPERATIONS
// =======================================

// Get all user carts (admin only)
const getAllUserCarts = async (req, res) => {
    try {
        const [cartItems] = await db.execute(`
            SELECT 
                ci.*,
                p.item_name as product_name,
                p.slug as product_slug,
                p.sku,
                p.discount,
                p.total_rs,
                p.rate as product_rate,
                p.tunch,
                po.sell_price,
                po.value,
                po.size as selected_size,
                po.weight as selected_weight,
                po.dimensions,
                po.metal_color,
                po.gender,
                po.occasion,
                pi.image_url,
                c.name as category_name,
                sc.name as subcategory_name,
                ssc.name as sub_subcategory_name,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_options po ON ci.product_option_id = po.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = 1
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
            LEFT JOIN sub_subcategories ssc ON pcm.sub_subcategory_id = ssc.id
            JOIN user u ON ci.user_id = u.id
            ORDER BY ci.added_at DESC
        `);
        // Group cart items by user
        const userCarts = {};
        cartItems.forEach(item => {
            if (!userCarts[item.user_id]) {
                userCarts[item.user_id] = {
                    user_id: item.user_id,
                    user_name: item.user_name,
                    user_email: item.user_email,
                    user_phone: item.user_phone,
                    items: [],
                    total_items: 0,
                    subtotal: 0
                };
            }

            // Dynamic pricing logic - only use product_options pricing
            let sellPrice = 0;

            // Try to get price from product_options sell_price first
            if (item.sell_price) {
                sellPrice = Number(item.sell_price);
            }
            // Try to get price from product_options value
            else if (item.value) {
                sellPrice = Number(item.value);
            }
            // Try to get price from products total_rs as fallback
            else if (item.total_rs) {
                sellPrice = Number(item.total_rs);
            }
            // Try to get price from products rate as last fallback
            else if (item.product_rate) {
                sellPrice = Number(item.product_rate);
            }
            // Fallback to 0 if no price found
            else {
                sellPrice = 0;
            }

            const discount = parseFloat(item.discount || 0);
            const finalPrice = discount > 0 ? sellPrice - (sellPrice * discount / 100) : sellPrice;
            const totalPrice = finalPrice * item.quantity;

            userCarts[item.user_id].items.push({
                ...item,
                sell_price: sellPrice,
                final_price: finalPrice,
                total_price: totalPrice,
                // Include option details for frontend
                option_details: {
                    size: item.selected_size,
                    weight: item.selected_weight,
                    dimensions: item.dimensions || null,
                    metal_color: item.metal_color || null,
                    gender: item.gender || null,
                    occasion: item.occasion || null
                }
            });
            userCarts[item.user_id].total_items += item.quantity;
            userCarts[item.user_id].subtotal += totalPrice;
        });

        const cartsArray = Object.values(userCarts);

        res.json({
            success: true,
            data: {
                carts: cartsArray,
                total_carts: cartsArray.length,
                total_items: cartsArray.reduce((sum, cart) => sum + cart.total_items, 0),
                total_revenue: cartsArray.reduce((sum, cart) => sum + cart.subtotal, 0)
            }
        });
    } catch (error) {
        console.error('Error getting all user carts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get specific user cart (admin only)
const getUserCartByAdmin = async (req, res) => {
    try {
        const { user_id } = req.params;

        const [cartItems] = await db.execute(`
            SELECT 
                ci.*,
                p.item_name as product_name,
                p.slug as product_slug,
                p.sku,
                p.discount,
                p.total_rs,
                p.rate as product_rate,
                po.sell_price,
                po.value,
                po.size as selected_size,
                po.weight as selected_weight,
                pi.image_url,
                c.name as category_name,
                sc.name as subcategory_name,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_options po ON ci.product_option_id = po.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = 1
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
            JOIN user u ON ci.user_id = u.id
            WHERE ci.user_id = ?
            ORDER BY ci.added_at DESC
        `, [user_id]);

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'User cart not found' });
        }

        // Calculate totals with dynamic pricing logic
        const cartWithTotals = cartItems.map(item => {
            // Dynamic pricing logic - only use product_options pricing
            let sellPrice = 0;

            // Try to get price from product_options sell_price first
            if (item.sell_price) {
                sellPrice = Number(item.sell_price);
            }
            // Try to get price from product_options value
            else if (item.value) {
                sellPrice = Number(item.value);
            }
            // Try to get price from products total_rs as fallback
            else if (item.total_rs) {
                sellPrice = Number(item.total_rs);
            }
            // Try to get price from products rate as last fallback
            else if (item.product_rate) {
                sellPrice = Number(item.product_rate);
            }
            // Fallback to 0 if no price found
            else {
                sellPrice = 0;
            }

            const discount = parseFloat(item.discount || 0);
            const finalPrice = discount > 0 ? sellPrice - (sellPrice * discount / 100) : sellPrice;
            const totalPrice = finalPrice * item.quantity;

            return {
                ...item,
                sell_price: sellPrice,
                final_price: finalPrice,
                total_price: totalPrice
            };
        });

        const subtotal = cartWithTotals.reduce((sum, item) => sum + item.total_price, 0);
        const totalItems = cartWithTotals.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            data: {
                user: {
                    id: cartItems[0].user_id,
                    name: cartItems[0].user_name,
                    email: cartItems[0].user_email,
                    phone: cartItems[0].user_phone
                },
                items: cartWithTotals,
                summary: {
                    subtotal,
                    total_items: totalItems,
                    item_count: cartWithTotals.length
                }
            }
        });
    } catch (error) {
        console.error('Error getting user cart by admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send invoice to user (admin only)
const sendInvoiceToUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { message = '' } = req.body;

        // Get user cart
        const [cartItems] = await db.execute(`
            SELECT 
                ci.*,
                p.item_name as product_name,
                p.slug as product_slug,
                p.sku,
                p.discount,
                p.total_rs,
                p.rate as product_rate,
                po.sell_price,
                po.value,
                po.size as selected_size,
                po.weight as selected_weight,
                pi.image_url,
                c.name as category_name,
                sc.name as subcategory_name,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_options po ON ci.product_option_id = po.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = 1
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
            JOIN user u ON ci.user_id = u.id
            WHERE ci.user_id = ?
            ORDER BY ci.added_at DESC
        `, [user_id]);

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'User cart not found' });
        }

        // Calculate totals with dynamic pricing logic
        const cartWithTotals = cartItems.map(item => {
            // Dynamic pricing logic - only use product_options pricing
            let sellPrice = 0;

            // Try to get price from product_options sell_price first
            if (item.sell_price) {
                sellPrice = Number(item.sell_price);
            }
            // Try to get price from product_options value
            else if (item.value) {
                sellPrice = Number(item.value);
            }
            // Try to get price from products total_rs as fallback
            else if (item.total_rs) {
                sellPrice = Number(item.total_rs);
            }
            // Try to get price from products rate as last fallback
            else if (item.product_rate) {
                sellPrice = Number(item.product_rate);
            }
            // Fallback to 0 if no price found
            else {
                sellPrice = 0;
            }

            const discount = parseFloat(item.discount || 0);
            const finalPrice = discount > 0 ? sellPrice - (sellPrice * discount / 100) : sellPrice;
            const totalPrice = finalPrice * item.quantity;

            return {
                ...item,
                sell_price: sellPrice,
                final_price: finalPrice,
                total_price: totalPrice
            };
        });

        const subtotal = cartWithTotals.reduce((sum, item) => sum + item.total_price, 0);
        const totalItems = cartWithTotals.reduce((sum, item) => sum + item.quantity, 0);

        // Generate invoice HTML
        const invoiceHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #16784f; text-align: center;">PVJ Invoice</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${cartItems[0].user_name}</p>
                    <p><strong>Email:</strong> ${cartItems[0].user_email}</p>
                    <p><strong>Phone:</strong> ${cartItems[0].user_phone}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #16784f; color: white;">
                            <th style="padding: 12px; text-align: left;">Product</th>
                            <th style="padding: 12px; text-align: center;">Quantity</th>
                            <th style="padding: 12px; text-align: right;">Price</th>
                            <th style="padding: 12px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cartWithTotals.map(item => `
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px;">
                                    <div><strong>${item.product_name}</strong></div>
                                    <div style="font-size: 12px; color: #666;">
                                        ${item.selected_size ? `Size: ${item.selected_size}` : ''}
                                        ${item.selected_weight ? `Weight: ${item.selected_weight}` : ''}
                                    </div>
                                </td>
                                <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                                <td style="padding: 12px; text-align: right;">₹${item.final_price.toFixed(2)}</td>
                                <td style="padding: 12px; text-align: right;">₹${item.total_price.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px;">
                    <p>Total Items: ${totalItems}</p>
                    <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
                </div>
                
                ${message ? `
                    <div style="background: #e6f7ef; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <h4>Message from PVJ:</h4>
                        <p>${message}</p>
                    </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 30px; color: #666;">
                    <p>Thank you for choosing PVJ!</p>
                    <p>For any queries, please contact us.</p>
                </div>
            </div>
        `;

        // Send email
        const emailResult = await sendEmail({
            to: cartItems[0].user_email,
            subject: 'Your PVJ Cart Invoice',
            html: invoiceHTML
        });

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send invoice email: ' + emailResult.error
            });
        }

        res.json({
            success: true,
            message: 'Invoice sent successfully to ' + cartItems[0].user_email,
            data: {
                user: {
                    id: cartItems[0].user_id,
                    name: cartItems[0].user_name,
                    email: cartItems[0].user_email
                },
                invoice_total: subtotal,
                items_count: totalItems
            }
        });
    } catch (error) {
        console.error('Error sending invoice:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Remove cart item (admin only)
const removeCartItemByAdmin = async (req, res) => {
    try {
        const { cart_item_id } = req.params;

        // Get cart item details for logging
        const [cartItems] = await db.execute(
            'SELECT ci.*, u.email as user_email FROM cart_items ci JOIN user u ON ci.user_id = u.id WHERE ci.id = ?',
            [cart_item_id]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        const [result] = await db.execute(
            'DELETE FROM cart_items WHERE id = ?',
            [cart_item_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        res.json({
            success: true,
            message: 'Cart item removed successfully'
        });
    } catch (error) {
        console.error('Error removing cart item by admin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getUserCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary,
    moveFromWishlistToCart,
    getAllUserCarts,
    getUserCartByAdmin,
    sendInvoiceToUser,
    removeCartItemByAdmin
}; 