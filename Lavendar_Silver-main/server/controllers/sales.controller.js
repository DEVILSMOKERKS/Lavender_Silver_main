const db = require('../config/db');

// Input validation helper
const validateInputs = (period, limit) => {
    const validPeriods = ['all', 'this_month', 'last_month', 'this_year', 'last_year', 'last_3_months', 'last_6_months'];
    const validPeriod = validPeriods.includes(period) ? period : 'all';
    const validLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 50); // Between 1 and 50
    return { validPeriod, validLimit };
};

// Date filter builder with proper parameterization
const buildDateFilter = (period) => {
    const filters = {
        this_month: {
            condition: 'AND MONTH(o.created_at) = MONTH(CURRENT_DATE()) AND YEAR(o.created_at) = YEAR(CURRENT_DATE())',
            params: []
        },
        last_month: {
            condition: 'AND MONTH(o.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(o.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))',
            params: []
        },
        this_year: {
            condition: 'AND YEAR(o.created_at) = YEAR(CURRENT_DATE())',
            params: []
        },
        last_year: {
            condition: 'AND YEAR(o.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR))',
            params: []
        },
        last_3_months: {
            condition: 'AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)',
            params: []
        },
        last_6_months: {
            condition: 'AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)',
            params: []
        },
        all: {
            condition: '',
            params: []
        }
    };
    return filters[period] || filters.all;
};

const salesController = {
    // Get most selling products with optimized queries
    getMostSellingProducts: async (req, res) => {
        const startTime = Date.now();
        try {

            // Validate and sanitize inputs
            const { period = 'all', limit = 5 } = req.query;
            const { validPeriod, validLimit } = validateInputs(period, limit);

            // Build date filter
            const dateFilter = buildDateFilter(validPeriod);

            // Optimized query with proper parameterization
            const [products] = await db.execute(`
                SELECT 
                    p.id,
                    p.item_name,
                    p.sku,
                    p.slug,
                    COUNT(DISTINCT o.id) as total_orders,
                    SUM(oi.quantity) as total_quantity_sold,
                    SUM(oi.quantity * oi.price) as total_revenue,
                    ROUND(AVG(oi.price), 2) as average_price,
                    MIN(oi.price) as min_price,
                    MAX(oi.price) as max_price,
                    COUNT(DISTINCT o.user_id) as unique_customers
                FROM products p
                INNER JOIN order_items oi ON p.id = oi.product_id
                INNER JOIN orders o ON oi.order_id = o.id
                WHERE o.payment_status = 'paid' 
                AND o.order_status != 'cancelled'
                ${dateFilter.condition}
                GROUP BY p.id, p.item_name, p.sku, p.slug
                ORDER BY total_quantity_sold DESC, total_revenue DESC
                LIMIT ${validLimit}
            `, []);

            // Optimized monthly breakdown - single query instead of N+1
            let monthlyData = [];
            if (products.length > 0) {
                const productIds = products.map(p => p.id);
                const placeholders = productIds.map(() => '?').join(',');

                // Build the complete query with proper parameter handling
                let monthlyQuery = `
                    SELECT 
                        oi.product_id,
                        DATE_FORMAT(o.created_at, '%Y-%m') as month,
                        SUM(oi.quantity) as quantity_sold,
                        SUM(oi.quantity * oi.price) as revenue,
                        COUNT(DISTINCT o.id) as orders_count
                    FROM order_items oi
                    INNER JOIN orders o ON oi.order_id = o.id
                    WHERE oi.product_id IN (${placeholders})
                    AND o.payment_status = 'paid' 
                    AND o.order_status != 'cancelled'
                    ${dateFilter.condition}
                    GROUP BY oi.product_id, DATE_FORMAT(o.created_at, '%Y-%m')
                    ORDER BY oi.product_id, month DESC
                `;

                const [monthlyStats] = await db.execute(monthlyQuery, productIds);

                // Group monthly stats by product
                const monthlyStatsByProduct = {};
                monthlyStats.forEach(stat => {
                    if (!monthlyStatsByProduct[stat.product_id]) {
                        monthlyStatsByProduct[stat.product_id] = [];
                    }
                    monthlyStatsByProduct[stat.product_id].push(stat);
                });

                // Build monthly data array
                monthlyData = products.map(product => ({
                    product_id: product.id,
                    product_name: product.item_name,
                    monthly_stats: (monthlyStatsByProduct[product.id] || []).slice(0, 12)
                }));
            }

            // Get overall summary with optimized query
            const [summary] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT o.id) as total_orders,
                    SUM(oi.quantity) as total_items_sold,
                    SUM(oi.quantity * oi.price) as total_revenue,
                    COUNT(DISTINCT o.user_id) as unique_customers,
                    COUNT(DISTINCT oi.product_id) as unique_products_sold
                FROM order_items oi
                INNER JOIN orders o ON oi.order_id = o.id
                WHERE o.payment_status = 'paid' 
                AND o.order_status != 'cancelled'
                ${dateFilter.condition}
            `, []);

            const executionTime = Date.now() - startTime;

            res.json({
                success: true,
                data: {
                    period: validPeriod,
                    summary: summary[0] || {
                        total_orders: 0,
                        total_items_sold: 0,
                        total_revenue: 0,
                        unique_customers: 0,
                        unique_products_sold: 0
                    },
                    top_products: products,
                    monthly_breakdown: monthlyData
                },
                meta: {
                    execution_time_ms: executionTime,
                    limit: validLimit,
                    products_count: products.length
                }
            });

        } catch (err) {
            console.error('Error in getMostSellingProducts:', err);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        }
    },

    // Get most selling locations with optimized queries
    getMostSellingLocations: async (req, res) => {
        const startTime = Date.now();
        try {

            // Validate and sanitize inputs
            const { period = 'all', limit = 10 } = req.query;
            const { validPeriod, validLimit } = validateInputs(period, limit);

            // Build date filter
            const dateFilter = buildDateFilter(validPeriod);

            // Optimized locations query
            const [locations] = await db.execute(`
                SELECT 
                    o.shipping_city,
                    o.shipping_state,
                    o.shipping_country,
                    COUNT(DISTINCT o.id) as total_orders,
                    COUNT(DISTINCT o.user_id) as unique_customers,
                    SUM(oi.quantity) as total_items_sold,
                    SUM(oi.quantity * oi.price) as total_revenue,
                    ROUND(AVG(oi.quantity * oi.price), 2) as average_order_value,
                    MIN(oi.quantity * oi.price) as min_order_value,
                    MAX(oi.quantity * oi.price) as max_order_value
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status = 'paid' 
                AND o.order_status != 'cancelled'
                ${dateFilter.condition}
                GROUP BY o.shipping_city, o.shipping_state, o.shipping_country
                ORDER BY total_revenue DESC, total_orders DESC
                LIMIT ${validLimit}
            `, []);

            // Optimized monthly breakdown for locations - single query
            let monthlyData = [];
            if (locations.length > 0) {
                const locationConditions = locations.map(loc =>
                    `(o.shipping_city = ? AND o.shipping_state = ? AND o.shipping_country = ?)`
                ).join(' OR ');
                const locationParams = locations.flatMap(loc =>
                    [loc.shipping_city, loc.shipping_state, loc.shipping_country]
                );

                const [monthlyStats] = await db.execute(`
                    SELECT 
                        o.shipping_city,
                        o.shipping_state,
                        o.shipping_country,
                        DATE_FORMAT(o.created_at, '%Y-%m') as month,
                        COUNT(DISTINCT o.id) as orders_count,
                        COUNT(DISTINCT o.user_id) as customers_count,
                        SUM(oi.quantity) as items_sold,
                        SUM(oi.quantity * oi.price) as revenue,
                        ROUND(AVG(oi.quantity * oi.price), 2) as avg_order_value
                    FROM orders o
                    INNER JOIN order_items oi ON o.id = oi.order_id
                    WHERE (${locationConditions})
                    AND o.payment_status = 'paid' 
                    AND o.order_status != 'cancelled'
                    ${dateFilter.condition}
                    GROUP BY o.shipping_city, o.shipping_state, o.shipping_country, DATE_FORMAT(o.created_at, '%Y-%m')
                    ORDER BY o.shipping_city, o.shipping_state, o.shipping_country, month DESC
                `, locationParams);

                // Group monthly stats by location
                const monthlyStatsByLocation = {};
                monthlyStats.forEach(stat => {
                    const locationKey = `${stat.shipping_city}, ${stat.shipping_state}, ${stat.shipping_country}`;
                    if (!monthlyStatsByLocation[locationKey]) {
                        monthlyStatsByLocation[locationKey] = [];
                    }
                    monthlyStatsByLocation[locationKey].push(stat);
                });

                // Build monthly data array
                monthlyData = locations.map(location => {
                    const locationKey = `${location.shipping_city}, ${location.shipping_state}, ${location.shipping_country}`;
                    return {
                        location: locationKey,
                        monthly_stats: (monthlyStatsByLocation[locationKey] || []).slice(0, 12)
                    };
                });
            }

            // Get location summary with optimized query
            const [locationSummary] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT CONCAT(o.shipping_city, ', ', o.shipping_state, ', ', o.shipping_country)) as total_locations,
                    COUNT(DISTINCT o.id) as total_orders,
                    COUNT(DISTINCT o.user_id) as total_customers,
                    SUM(oi.quantity) as total_items_sold,
                    SUM(oi.quantity * oi.price) as total_revenue,
                    ROUND(AVG(oi.quantity * oi.price), 2) as overall_avg_order_value
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status = 'paid' 
                AND o.order_status != 'cancelled'
                ${dateFilter.condition}
            `, []);

            const executionTime = Date.now() - startTime;

            res.json({
                success: true,
                data: {
                    period: validPeriod,
                    summary: locationSummary[0] || {
                        total_locations: 0,
                        total_orders: 0,
                        total_customers: 0,
                        total_items_sold: 0,
                        total_revenue: 0,
                        overall_avg_order_value: 0
                    },
                    top_locations: locations,
                    monthly_breakdown: monthlyData
                },
                meta: {
                    execution_time_ms: executionTime,
                    limit: validLimit,
                    locations_count: locations.length
                }
            });

        } catch (err) {
            console.error('Error in getMostSellingLocations:', err);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        }
    },

    // Get comprehensive sales dashboard data
    getSalesDashboard: async (req, res) => {
        try {
            const { period = 'this_month' } = req.query;

            let dateFilter = '';
            let params = [];

            // Apply date filters
            switch (period) {
                case 'this_month':
                    dateFilter = 'AND MONTH(o.created_at) = MONTH(CURRENT_DATE()) AND YEAR(o.created_at) = YEAR(CURRENT_DATE())';
                    break;
                case 'last_month':
                    dateFilter = 'AND MONTH(o.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(o.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))';
                    break;
                case 'this_year':
                    dateFilter = 'AND YEAR(o.created_at) = YEAR(CURRENT_DATE())';
                    break;
                case 'last_year':
                    dateFilter = 'AND YEAR(o.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR))';
                    break;
                case 'last_3_months':
                    dateFilter = 'AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)';
                    break;
                case 'last_6_months':
                    dateFilter = 'AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)';
                    break;
                default:
                    dateFilter = 'AND MONTH(o.created_at) = MONTH(CURRENT_DATE()) AND YEAR(o.created_at) = YEAR(CURRENT_DATE())';
                    break;
            }

            // Get overall sales metrics
            const [salesMetrics] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT o.id) as total_orders,
                    COUNT(DISTINCT o.user_id) as unique_customers,
                    SUM(oi.quantity) as total_items_sold,
                    SUM(oi.quantity * oi.price) as total_revenue,
                    AVG(oi.quantity * oi.price) as average_order_value,
                    COUNT(DISTINCT oi.product_id) as unique_products_sold,
                    COUNT(DISTINCT CONCAT(o.shipping_city, ', ', o.shipping_state)) as locations_served
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status = 'paid' AND o.order_status != 'cancelled'
                ${dateFilter}
            `, params);

            // Get top 5 products
            const [topProducts] = await db.execute(`
                SELECT 
                    p.id,
                    p.item_name,
                    p.sku,
                    SUM(oi.quantity) as quantity_sold,
                    SUM(oi.quantity * oi.price) as revenue
                FROM products p
                INNER JOIN order_items oi ON p.id = oi.product_id
                INNER JOIN orders o ON oi.order_id = o.id
                WHERE o.payment_status = 'paid' AND o.order_status != 'cancelled'
                ${dateFilter}
                GROUP BY p.id, p.item_name, p.sku
                ORDER BY quantity_sold DESC
                LIMIT 5
            `, params);

            // Get top 5 locations
            const [topLocations] = await db.execute(`
                SELECT 
                    o.shipping_city,
                    o.shipping_state,
                    COUNT(DISTINCT o.id) as orders_count,
                    SUM(oi.quantity * oi.price) as revenue
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status = 'paid' AND o.order_status != 'cancelled'
                ${dateFilter}
                GROUP BY o.shipping_city, o.shipping_state
                ORDER BY revenue DESC
                LIMIT 5
            `, params);

            // Get monthly trend for current year
            const [monthlyTrend] = await db.execute(`
                SELECT 
                    DATE_FORMAT(o.created_at, '%Y-%m') as month,
                    COUNT(DISTINCT o.id) as orders_count,
                    SUM(oi.quantity * oi.price) as revenue,
                    COUNT(DISTINCT o.user_id) as customers_count
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status = 'paid' 
                AND o.order_status != 'cancelled'
                AND YEAR(o.created_at) = YEAR(CURRENT_DATE())
                GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
                ORDER BY month ASC
            `);

            res.json({
                success: true,
                data: {
                    period,
                    sales_metrics: salesMetrics[0],
                    top_products,
                    top_locations,
                    monthly_trend: monthlyTrend
                }
            });

        } catch (err) {
            console.error('Error in getSalesDashboard:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get sales comparison between periods
    getSalesComparison: async (req, res) => {
        try {
            const { compare_with = 'last_month' } = req.query;

            let currentPeriodFilter = '';
            let comparePeriodFilter = '';

            // Define current and comparison period filters
            switch (compare_with) {
                case 'last_month':
                    currentPeriodFilter = 'AND MONTH(o.created_at) = MONTH(CURRENT_DATE()) AND YEAR(o.created_at) = YEAR(CURRENT_DATE())';
                    comparePeriodFilter = 'AND MONTH(o.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(o.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))';
                    break;
                case 'last_year':
                    currentPeriodFilter = 'AND YEAR(o.created_at) = YEAR(CURRENT_DATE())';
                    comparePeriodFilter = 'AND YEAR(o.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR))';
                    break;
                case 'last_3_months':
                    currentPeriodFilter = 'AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)';
                    comparePeriodFilter = 'AND o.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH) AND o.created_at < DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)';
                    break;
                default:
                    currentPeriodFilter = 'AND MONTH(o.created_at) = MONTH(CURRENT_DATE()) AND YEAR(o.created_at) = YEAR(CURRENT_DATE())';
                    comparePeriodFilter = 'AND MONTH(o.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(o.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))';
            }

            // Get current period metrics
            const [currentMetrics] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT o.id) as orders,
                    SUM(oi.quantity * oi.price) as revenue,
                    COUNT(DISTINCT o.user_id) as customers,
                    SUM(oi.quantity) as items_sold
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status = 'paid' AND o.order_status != 'cancelled'
                ${currentPeriodFilter}
            `);

            // Get comparison period metrics
            const [compareMetrics] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT o.id) as orders,
                    SUM(oi.quantity * oi.price) as revenue,
                    COUNT(DISTINCT o.user_id) as customers,
                    SUM(oi.quantity) as items_sold
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.order_id
                WHERE o.payment_status = 'paid' AND o.order_status != 'cancelled'
                ${comparePeriodFilter}
            `);

            // Calculate percentage changes
            const calculateChange = (current, previous) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            const comparison = {
                orders: {
                    current: currentMetrics[0].orders || 0,
                    previous: compareMetrics[0].orders || 0,
                    change_percentage: calculateChange(currentMetrics[0].orders || 0, compareMetrics[0].orders || 0)
                },
                revenue: {
                    current: currentMetrics[0].revenue || 0,
                    previous: compareMetrics[0].revenue || 0,
                    change_percentage: calculateChange(currentMetrics[0].revenue || 0, compareMetrics[0].revenue || 0)
                },
                customers: {
                    current: currentMetrics[0].customers || 0,
                    previous: compareMetrics[0].customers || 0,
                    change_percentage: calculateChange(currentMetrics[0].customers || 0, compareMetrics[0].customers || 0)
                },
                items_sold: {
                    current: currentMetrics[0].items_sold || 0,
                    previous: compareMetrics[0].items_sold || 0,
                    change_percentage: calculateChange(currentMetrics[0].items_sold || 0, compareMetrics[0].items_sold || 0)
                }
            };

            res.json({
                success: true,
                data: {
                    compare_with,
                    comparison
                }
            });

        } catch (err) {
            console.error('Error in getSalesComparison:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = salesController; 