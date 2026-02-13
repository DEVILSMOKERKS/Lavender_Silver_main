const db = require('../config/db');
const facebookPixelTracker = require('../utils/facebookPixelTracker');

// =======================================
// WISHLIST OPERATIONS
// =======================================

// Get user's wishlist
const getUserWishlist = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [wishlistItems] = await db.execute(`
            SELECT 
                wi.*,
                p.item_name as product_name,
                p.slug as product_slug,
                p.sku,
                p.stamp,
                p.discount,
                p.total_rs,
                po.sell_price as option_sell_price,
                po.value as option_value,
                po.size,
                po.weight,
                po.dimensions,
                po.metal_color,
                po.gender,
                po.occasion,
                pi.image_url,
                c.name as category_name,
                sc.name as subcategory_name
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN product_options po ON wi.product_option_id = po.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = 1
      LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
      LEFT JOIN categories c ON pcm.category_id = c.id
      LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
      WHERE wi.user_id = ?
      ORDER BY wi.added_at DESC
    `, [user_id]);

        // Calculate final price for each item using dynamic pricing logic
        const wishlistWithPrices = wishlistItems.map(item => {
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

            return {
                ...item,
                product_id: item.product_id || item.id,
                product_name: item.product_name || item.item_name,
                product_slug: item.product_slug || item.slug,
                product_price: sellPrice,
                final_price: finalPrice,
                image_url: item.image_url || null, // Ensure image_url is included
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

        res.json({
            success: true,
            data: {
                items: wishlistWithPrices,
                total_items: wishlistWithPrices.length
            }
        });
    } catch (error) {
        console.error('Error getting user wishlist:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
    try {
        const user_id = req.user.id;
        const {
            product_id,
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

        // If product_option_id is provided, validate it exists
        let finalProductOptionId = product_option_id;
        if (product_option_id) {
            const [productOptions] = await db.execute(
                'SELECT * FROM product_options WHERE id = ? AND product_id = ?',
                [product_option_id, product_id]
            );

            if (productOptions.length === 0) {
                return res.status(404).json({ success: false, message: 'Product option not found' });
            }
        } else {
            // Get the first available product option if none specified
            const [firstOptions] = await db.execute(
                'SELECT * FROM product_options WHERE product_id = ? ORDER BY id ASC LIMIT 1',
                [product_id]
            );

            if (firstOptions.length === 0) {
                return res.status(404).json({ success: false, message: 'No product options available' });
            }

            finalProductOptionId = firstOptions[0].id;
        }

        // Check if item already exists in wishlist with the same product and option
        const [existingItems] = await db.execute(
            'SELECT * FROM wishlist_items WHERE user_id = ? AND product_id = ? AND product_option_id = ?',
            [user_id, product_id, finalProductOptionId]
        );

        if (existingItems.length > 0) {
            return res.status(400).json({ success: false, message: 'Item already exists in wishlist' });
        }

        // Add new item to wishlist
        const [result] = await db.execute(
            'INSERT INTO wishlist_items (user_id, product_id, product_option_id) VALUES (?, ?, ?)',
            [user_id, product_id, finalProductOptionId]
        );

        res.status(201).json({
            success: true,
            message: 'Item added to wishlist',
            data: { id: result.insertId }
        });

        // Track Facebook Pixel AddToWishlist event
        try {
            const product = products[0];
            const productPrice = parseFloat(product.total_rs || 0);
            await facebookPixelTracker.trackAddToWishlist(user_id, product_id, product.name, productPrice);
        } catch (pixelError) {
            console.error('Facebook Pixel tracking error:', pixelError);
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update wishlist item
const updateWishlistItem = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { wishlist_item_id } = req.params;
        const { product_option_id } = req.body;

        // Validate wishlist item belongs to user
        const [wishlistItems] = await db.execute(
            'SELECT * FROM wishlist_items WHERE id = ? AND user_id = ?',
            [wishlist_item_id, user_id]
        );

        if (wishlistItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Wishlist item not found' });
        }

        // Update wishlist item
        const updateFields = [];
        const updateValues = [];

        if (product_option_id !== undefined) {
            updateFields.push('product_option_id = ?');
            updateValues.push(product_option_id);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updateValues.push(wishlist_item_id);

        await db.execute(
            `UPDATE wishlist_items SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'Wishlist item updated successfully'
        });
    } catch (error) {
        console.error('Error updating wishlist item:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { wishlist_item_id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM wishlist_items WHERE id = ? AND user_id = ?',
            [wishlist_item_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Wishlist item not found' });
        }

        res.json({
            success: true,
            message: 'Item removed from wishlist'
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Clear user's wishlist
const clearWishlist = async (req, res) => {
    try {
        const user_id = req.user.id;

        await db.execute(
            'DELETE FROM wishlist_items WHERE user_id = ?',
            [user_id]
        );

        res.json({
            success: true,
            message: 'Wishlist cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Check if product is in wishlist
const checkWishlistStatus = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { product_id } = req.params;

        const [wishlistItems] = await db.execute(
            'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        res.json({
            success: true,
            data: {
                is_in_wishlist: wishlistItems.length > 0,
                wishlist_item_id: wishlistItems.length > 0 ? wishlistItems[0].id : null
            }
        });
    } catch (error) {
        console.error('Error checking wishlist status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Move item from cart to wishlist
const moveFromCartToWishlist = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { cart_item_id } = req.params;

        // Get cart item
        const [cartItems] = await db.execute(
            'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
            [cart_item_id, user_id]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        const cartItem = cartItems[0];

        // Check if already in wishlist
        const [existingWishlist] = await db.execute(
            'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ? AND product_option_id = ?',
            [user_id, cartItem.product_id, cartItem.product_option_id]
        );

        if (existingWishlist.length > 0) {
            return res.status(400).json({ success: false, message: 'Item already exists in wishlist' });
        }

        // Add to wishlist
        await db.execute(
            'INSERT INTO wishlist_items (user_id, product_id, product_option_id) VALUES (?, ?, ?)',
            [user_id, cartItem.product_id, cartItem.product_option_id]
        );

        // Remove from cart
        await db.execute(
            'DELETE FROM cart_items WHERE id = ?',
            [cart_item_id]
        );

        res.json({
            success: true,
            message: 'Item moved from cart to wishlist'
        });
    } catch (error) {
        console.error('Error moving from cart to wishlist:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get wishlist summary
const getWishlistSummary = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [wishlistItems] = await db.execute(`
      SELECT 
        po.sell_price,
        po.value,
        p.discount
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN product_options po ON wi.product_option_id = po.id
      WHERE wi.user_id = ?
    `, [user_id]);

        const summary = wishlistItems.reduce((acc, item) => {
            const productPrice = parseFloat(item.sell_price || item.value || 0);
            const discount = parseFloat(item.discount || 0);
            const finalPrice = discount > 0 ? productPrice - (productPrice * discount / 100) : productPrice;
            acc.total_value += finalPrice;
            acc.item_count += 1;
            return acc;
        }, { total_value: 0, item_count: 0 });

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error getting wishlist summary:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// =======================================
// ADMIN WISHLIST MONITORING FUNCTIONS
// =======================================

// Get wishlist monitoring data (admin only)
const getWishlistMonitoringData = async (req, res) => {
    try {
        const { timePeriod = 'last_12_weeks', category = 'all' } = req.query;

        // Calculate date range based on time period
        let startDate = new Date();
        const now = new Date();

        switch (timePeriod) {
            case 'last_month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'last_3_months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'last_6_months':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case 'last_12_weeks':
            default:
                startDate.setDate(now.getDate() - 84); // 12 weeks
                break;
        }

        // Build category filter
        let categoryFilter = '';
        let categoryParams = [];
        if (category !== 'all' && category) {
            // Use case-insensitive comparison with TRIM to handle whitespace
            categoryFilter = 'AND (LOWER(TRIM(COALESCE(c1.name, c2.name))) = LOWER(TRIM(?)))';
            categoryParams.push(category.trim());
        }


        // Get wishlist monitoring data based on actual schema
        // Using COALESCE to check both product_category_map and products.category_id
        const [products] = await db.execute(`
            SELECT 
                p.id,
                p.item_name,
                p.slug,
                p.status,
                COALESCE(c1.name, c2.name, 'Uncategorized') as category_name,
                COALESCE(sc1.name, sc2.name) as subcategory_name,
                COALESCE(ssc1.name, ssc2.name) as sub_subcategory_name,
                COUNT(wi.id) as wishlist_count,
                COALESCE(SUM(po.sell_price), 0) as total_wishlist_value,
                COALESCE(p.pieces, 0) as total_quantity,
                CASE 
                    WHEN COUNT(wi.id) >= 30 THEN 'high_demand'
                    WHEN COUNT(wi.id) >= 15 THEN 'medium_demand'
                    ELSE 'low_demand'
                END as demand_level,
                CASE 
                    WHEN p.status = 'active' AND COALESCE(p.pieces, 0) > 0 THEN 'in_stock'
                    ELSE 'out_of_stock'
                END as stock_status,
                CASE 
                    WHEN COUNT(wi.id) > (
                        SELECT COALESCE(COUNT(wi2.id), 0)
                        FROM wishlist_items wi2 
                        WHERE wi2.product_id = p.id 
                        AND wi2.added_at < ?
                    ) THEN 'up'
                    WHEN COUNT(wi.id) < (
                        SELECT COALESCE(COUNT(wi2.id), 0)
                        FROM wishlist_items wi2 
                        WHERE wi2.product_id = p.id 
                        AND wi2.added_at < ?
                    ) THEN 'down'
                    ELSE 'stable'
                END as trend_direction
            FROM products p
            LEFT JOIN wishlist_items wi ON p.id = wi.product_id 
                AND wi.added_at >= ?
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c1 ON pcm.category_id = c1.id
            LEFT JOIN subcategories sc1 ON pcm.subcategory_id = sc1.id
            LEFT JOIN sub_subcategories ssc1 ON pcm.sub_subcategory_id = ssc1.id
            LEFT JOIN categories c2 ON p.category_id = c2.id
            LEFT JOIN subcategories sc2 ON p.subcategory_id = sc2.id
            LEFT JOIN sub_subcategories ssc2 ON p.sub_subcategory_id = ssc2.id
            LEFT JOIN product_options po ON p.id = po.product_id
            WHERE p.status = 'active'
            ${categoryFilter}
            GROUP BY p.id, p.item_name, p.slug, p.status, COALESCE(c1.name, c2.name, 'Uncategorized'), 
                     COALESCE(sc1.name, sc2.name), COALESCE(ssc1.name, ssc2.name)
            HAVING COUNT(wi.id) > 0
            ORDER BY COUNT(wi.id) DESC
            LIMIT 50
        `, [...categoryParams, startDate, startDate, startDate]);

        const productsWithConversion = products;

        // Calculate summary statistics
        const [summaryStats] = await db.execute(`
            SELECT 
                COUNT(DISTINCT wi.id) as total_wishlist_items,
                COUNT(DISTINCT wi.user_id) as unique_users,
                COALESCE(SUM(po.sell_price), 0) as total_wishlist_value,
                COUNT(CASE WHEN p.status = 'active' THEN 1 END) as in_stock_count,
                COUNT(CASE WHEN p.status = 'inactive' THEN 1 END) as out_of_stock_count
            FROM products p
            LEFT JOIN wishlist_items wi ON p.id = wi.product_id 
                AND wi.added_at >= ?
            LEFT JOIN product_options po ON p.id = po.product_id
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c1 ON pcm.category_id = c1.id
            LEFT JOIN categories c2 ON p.category_id = c2.id
            WHERE p.status = 'active'
            ${categoryFilter}
        `, [...categoryParams, startDate]);

        // Calculate high demand count separately
        const [highDemandCount] = await db.execute(`
            SELECT COUNT(*) as high_demand_count
            FROM (
                SELECT p.id, COUNT(wi.id) as wishlist_count
                FROM products p
                LEFT JOIN wishlist_items wi ON p.id = wi.product_id 
                    AND wi.added_at >= ?
                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                LEFT JOIN categories c1 ON pcm.category_id = c1.id
                LEFT JOIN categories c2 ON p.category_id = c2.id
                WHERE p.status = 'active'
                ${categoryFilter}
                GROUP BY p.id
                HAVING COUNT(wi.id) >= 30
            ) as high_demand_products
        `, [...categoryParams, startDate]);

        // Calculate previous period stats for comparison
        let previousStartDate = new Date(startDate);
        const periodDays = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
        previousStartDate.setDate(previousStartDate.getDate() - periodDays);

        const [previousStats] = await db.execute(`
            SELECT 
                COALESCE(SUM(po.sell_price), 0) as total_wishlist_value,
                COUNT(CASE WHEN p.status = 'inactive' THEN 1 END) as out_of_stock_count
            FROM products p
            LEFT JOIN wishlist_items wi ON p.id = wi.product_id 
                AND wi.added_at >= ? AND wi.added_at < ?
            LEFT JOIN product_options po ON p.id = po.product_id
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c1 ON pcm.category_id = c1.id
            LEFT JOIN categories c2 ON p.category_id = c2.id
            WHERE p.status = 'active'
            ${categoryFilter}
        `, [...categoryParams, previousStartDate, startDate]);

        const currentTotal = summaryStats[0]?.total_wishlist_value || 0;
        const previousTotal = previousStats[0]?.total_wishlist_value || 0;
        const totalChangePercent = previousTotal > 0
            ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(2)
            : 0;

        const currentOutOfStock = summaryStats[0]?.out_of_stock_count || 0;
        const previousOutOfStock = previousStats[0]?.out_of_stock_count || 0;
        const outOfStockChangePercent = previousOutOfStock > 0
            ? (((currentOutOfStock - previousOutOfStock) / previousOutOfStock) * 100).toFixed(2)
            : 0;

        const summary = {
            totalWishlist: currentTotal,
            highDemands: highDemandCount[0]?.high_demand_count || 0,
            outOfStock: currentOutOfStock,
            totalChangePercent: parseFloat(totalChangePercent),
            outOfStockChangePercent: parseFloat(outOfStockChangePercent)
        };

        res.json({
            success: true,
            data: {
                summary,
                products: productsWithConversion
            }
        });
    } catch (error) {
        console.error('Error getting wishlist monitoring data:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Export wishlist monitoring data (admin only)
const exportWishlistMonitoringData = async (req, res) => {
    try {
        const { timePeriod = 'last_12_weeks', category = 'all' } = req.query;

        // Calculate date range based on time period
        let startDate = new Date();
        const now = new Date();

        switch (timePeriod) {
            case 'last_month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'last_3_months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'last_6_months':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case 'last_12_weeks':
            default:
                startDate.setDate(now.getDate() - 84);
                break;
        }

        // Build category filter
        let categoryFilter = '';
        let categoryParams = [];
        if (category !== 'all' && category) {
            // Use case-insensitive comparison with TRIM to handle whitespace
            categoryFilter = 'AND LOWER(TRIM(c.name)) = LOWER(TRIM(?))';
            categoryParams.push(category.trim());
        }

        // Get export data based on actual schema
        const [exportData] = await db.execute(`
            SELECT 
                p.item_name as 'Product Name',
                c.name as 'Category',
                COUNT(wi.id) as 'Wishlist Count',
                COALESCE(SUM(po.sell_price), 0) as 'Total Wishlist Value',
                CASE 
                    WHEN p.status = 'active' THEN 'In Stock'
                    ELSE 'Out of Stock'
                END as 'Stock Status',
                p.created_at as 'Product Created Date',
                MAX(wi.added_at) as 'Last Wishlist Added Date'
            FROM products p
            LEFT JOIN wishlist_items wi ON p.id = wi.product_id 
                AND wi.added_at >= ?
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN product_options po ON p.id = po.product_id
            WHERE p.status = 'active'
            ${categoryFilter}
            GROUP BY p.id, p.item_name, c.name, p.status, p.created_at
            HAVING COUNT(wi.id) > 0
            ORDER BY COUNT(wi.id) DESC
        `, [...categoryParams, startDate]);

        // Convert to CSV
        const csvHeaders = [
            'Product Name',
            'Category',
            'Wishlist Count',
            'Total Wishlist Value',
            'Stock Status',
            'Product Created Date',
            'Last Wishlist Added Date'
        ];

        let csvContent = csvHeaders.join(',') + '\n';

        exportData.forEach(row => {
            const csvRow = [
                `"${row['Product Name'] || ''}"`,
                `"${row['Category'] || ''}"`,
                row['Wishlist Count'] || 0,
                row['Total Wishlist Value'] || 0,
                `"${row['Stock Status'] || ''}"`,
                `"${row['Product Created Date'] || ''}"`,
                `"${row['Last Wishlist Added Date'] || ''}"`
            ];
            csvContent += csvRow.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="wishlist-monitoring-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);

    } catch (error) {
        console.error('Error exporting wishlist monitoring data:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get available categories for wishlist monitoring (admin only)
const getWishlistMonitoringCategories = async (req, res) => {
    try {
        // Get categories that have products with wishlist items
        const [categories] = await db.execute(`
            SELECT DISTINCT c.id, c.name, c.slug
            FROM categories c
            WHERE c.status = 'active'
            AND (
                c.id IN (
                    SELECT DISTINCT COALESCE(pcm.category_id, p.category_id)
                    FROM products p
                    LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                    JOIN wishlist_items wi ON p.id = wi.product_id
                    WHERE p.status = 'active'
                    AND (pcm.category_id IS NOT NULL OR p.category_id IS NOT NULL)
                )
            )
            ORDER BY c.name ASC
        `);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error getting wishlist monitoring categories:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getUserWishlist,
    addToWishlist,
    updateWishlistItem,
    removeFromWishlist,
    clearWishlist,
    checkWishlistStatus,
    moveFromCartToWishlist,
    getWishlistSummary,
    getWishlistMonitoringData,
    exportWishlistMonitoringData,
    getWishlistMonitoringCategories
}; 