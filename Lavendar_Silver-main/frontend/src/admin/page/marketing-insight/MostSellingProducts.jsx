import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartLine, FaBox, FaRupeeSign, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';
import './MostSellingProducts.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const MostSellingProducts = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('this_month');
    const [limit, setLimit] = useState(5);

    const periods = [
        { value: 'all', label: 'All Time' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'this_year', label: 'This Year' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'last_3_months', label: 'Last 3 Months' },
        { value: 'last_6_months', label: 'Last 6 Months' }
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_BASE_URL}/api/sales/most-selling-products`, {
                params: { period, limit }
            });

            setData(response.data.data);
        } catch (err) {
            console.error('Error fetching most selling products:', err);
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, limit]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    const getPeriodLabel = (value) => {
        const periodObj = periods.find(p => p.value === value);
        return periodObj ? periodObj.label : value;
    };

    if (loading) {
        return (
            <div className="most-selling-products-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading most selling products...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="most-selling-products-container">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h3>Error Loading Data</h3>
                    <p>{error}</p>
                    <button onClick={fetchData} className="retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="most-selling-products-container">
            {/* Header Section */}
            <div className="header-section">
                <div className="header-content">
                    <div className="header-icon">
                        <FaChartLine />
                    </div>
                    <div className="header-text">
                        <h1>Most Selling Products</h1>
                        <p>Track your top-performing products and their sales trends</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="filter-group">
                        <label htmlFor="period">Time Period:</label>
                        <select
                            id="period"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="filter-select"
                        >
                            {periods.map(p => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="limit">Show Top:</label>
                        <select
                            id="limit"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value))}
                            className="filter-select"
                        >
                            <option value={5}>5 Products</option>
                            <option value={10}>10 Products</option>
                            <option value={15}>15 Products</option>
                            <option value={20}>20 Products</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {data?.summary && (
                <div className="summary-cards">
                    <div className="summary-card">
                        <div className="card-icon orders">
                            <FaBox />
                        </div>
                        <div className="card-content">
                            <h3>{formatNumber(data.summary.total_orders)}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="card-icon revenue">
                            <FaRupeeSign />
                        </div>
                        <div className="card-content">
                            <h3>{formatCurrency(data.summary.total_revenue)}</h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="card-icon items">
                            <FaBox />
                        </div>
                        <div className="card-content">
                            <h3>{formatNumber(data.summary.total_items_sold)}</h3>
                            <p>Items Sold</p>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="card-icon customers">
                            <FaUsers />
                        </div>
                        <div className="card-content">
                            <h3>{formatNumber(data.summary.unique_customers)}</h3>
                            <p>Unique Customers</p>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="card-icon products">
                            <FaBox />
                        </div>
                        <div className="card-content">
                            <h3>{formatNumber(data.summary.unique_products_sold)}</h3>
                            <p>Products Sold</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Products Table */}
            <div className="products-section">
                <div className="section-header">
                    <h2>Top {limit} Most Selling Products</h2>
                    <p>Period: {getPeriodLabel(period)}</p>
                </div>

                <div className="products-table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Quantity Sold</th>
                                <th>Revenue</th>
                                <th>Orders</th>
                                <th>Avg Price</th>
                                <th>Customers</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.top_products?.map((product, index) => (
                                <tr key={product.id} className={index < 3 ? 'top-product' : ''}>
                                    <td className="rank-cell">
                                        <div className={`rank-badge rank-${index + 1}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="product-cell">
                                        <div className="product-info">
                                            <h4>{product.item_name}</h4>
                                            <span className="product-slug">{product.slug}</span>
                                        </div>
                                    </td>
                                    <td className="sku-cell">{product.sku}</td>
                                    <td className="quantity-cell">
                                        <strong>{formatNumber(product.total_quantity_sold)}</strong>
                                    </td>
                                    <td className="revenue-cell">
                                        <strong>{formatCurrency(product.total_revenue)}</strong>
                                    </td>
                                    <td className="orders-cell">{formatNumber(product.total_orders)}</td>
                                    <td className="price-cell">{formatCurrency(product.average_price)}</td>
                                    <td className="customers-cell">{formatNumber(product.unique_customers)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Monthly Breakdown */}
            {data?.monthly_breakdown && data.monthly_breakdown.length > 0 && (
                <div className="monthly-breakdown-section">
                    <div className="section-header">
                        <h2>Monthly Sales Breakdown</h2>
                        <p>Detailed monthly performance for top products</p>
                    </div>

                    <div className="monthly-charts">
                        {data.monthly_breakdown.slice(0, 3).map((product, index) => (
                            <div key={product.product_id} className="monthly-chart-card">
                                <div className="chart-header">
                                    <h3>{product.product_name}</h3>
                                    <span className="product-rank">#{index + 1}</span>
                                </div>

                                <div className="chart-content">
                                    <div className="monthly-stats">
                                        {product.monthly_stats.slice(0, 6).map((month, monthIndex) => (
                                            <div key={month.month} className="month-stat">
                                                <div className="month-label">
                                                    {new Date(month.month + '-01').toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        year: '2-digit'
                                                    })}
                                                </div>
                                                <div className="month-data">
                                                    <div className="stat-item">
                                                        <span className="stat-label">Qty:</span>
                                                        <span className="stat-value">{formatNumber(month.quantity_sold)}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Revenue:</span>
                                                        <span className="stat-value">{formatCurrency(month.revenue)}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Orders:</span>
                                                        <span className="stat-value">{formatNumber(month.orders_count)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Data State */}
            {(!data?.top_products || data.top_products.length === 0) && (
                <div className="no-data-container">
                    <div className="no-data-icon">📊</div>
                    <h3>No Sales Data Available</h3>
                    <p>No products have been sold in the selected time period.</p>
                </div>
            )}
        </div>
    );
};

export default MostSellingProducts; 