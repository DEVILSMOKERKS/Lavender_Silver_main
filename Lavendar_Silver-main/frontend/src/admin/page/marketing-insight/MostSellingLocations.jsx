import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaChartLine, FaRupeeSign, FaUsers, FaBox, FaGlobe } from 'react-icons/fa';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';
import SalesMap from './SalesMap';
import './MostSellingLocations.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const MostSellingLocations = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [period, setPeriod] = useState('this_month');
    const [limit, setLimit] = useState(10);

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

            const response = await axios.get(`${API_BASE_URL}/api/sales/most-selling-locations`, {
                params: { period, limit }
            });

            setData(response.data.data);
        } catch (err) {
            console.error('Error fetching most selling locations:', err);
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

    const getLocationDisplayName = (location) => {
        return `${location.shipping_city}, ${location.shipping_state}, ${location.shipping_country}`;
    };

    if (loading) {
        return (
            <div className="most-selling-locations-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading most selling locations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="most-selling-locations-container">
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
        <div className="most-selling-locations-container">
            {/* Header Section */}
            <div className="header-section">
                <div className="header-content">
                    <div className="header-icon">
                        <FaMapMarkerAlt />
                    </div>
                    <div className="header-text">
                        <h1>Most Selling Locations</h1>
                        <p>Track your top-performing locations and their sales trends</p>
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
                            <option value={5}>5 Locations</option>
                            <option value={10}>10 Locations</option>
                            <option value={15}>15 Locations</option>
                            <option value={20}>20 Locations</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {data?.summary && (
                <div className="summary-cards">
                    <div className="summary-card">
                        <div className="card-icon locations">
                            <FaGlobe />
                        </div>
                        <div className="card-content">
                            <h3>{formatNumber(data.summary.total_locations)}</h3>
                            <p>Total Locations</p>
                        </div>
                    </div>

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
                        <div className="card-icon customers">
                            <FaUsers />
                        </div>
                        <div className="card-content">
                            <h3>{formatNumber(data.summary.total_customers)}</h3>
                            <p>Total Customers</p>
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
                        <div className="card-icon avg-order">
                            <FaChartLine />
                        </div>
                        <div className="card-content">
                            <h3>{formatCurrency(data.summary.overall_avg_order_value)}</h3>
                            <p>Avg Order Value</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Locations Table */}
            <div className="locations-section">
                <div className="section-header">
                    <h2>Top {limit} Most Selling Locations</h2>
                    <p>Period: {getPeriodLabel(period)}</p>
                </div>

                <div className="locations-table-container">
                    <table className="locations-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Location</th>
                                <th>Orders</th>
                                <th>Customers</th>
                                <th>Items Sold</th>
                                <th>Revenue</th>
                                <th>Avg Order Value</th>
                                <th>Min Order</th>
                                <th>Max Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.top_locations?.map((location, index) => (
                                <tr key={`${location.shipping_city}-${location.shipping_state}-${location.shipping_country}`}
                                    className={index < 3 ? 'top-location' : ''}>
                                    <td className="rank-cell">
                                        <div className={`rank-badge rank-${index + 1}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="location-cell">
                                        <div className="location-info">
                                            <h4>{location.shipping_city}</h4>
                                            <span className="location-details">
                                                {location.shipping_state}, {location.shipping_country}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="orders-cell">
                                        <strong>{formatNumber(location.total_orders)}</strong>
                                    </td>
                                    <td className="customers-cell">{formatNumber(location.unique_customers)}</td>
                                    <td className="items-cell">{formatNumber(location.total_items_sold)}</td>
                                    <td className="revenue-cell">
                                        <strong>{formatCurrency(location.total_revenue)}</strong>
                                    </td>
                                    <td className="avg-order-cell">{formatCurrency(location.average_order_value)}</td>
                                    <td className="min-order-cell">{formatCurrency(location.min_order_value)}</td>
                                    <td className="max-order-cell">{formatCurrency(location.max_order_value)}</td>
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
                        <p>Detailed monthly performance for top locations</p>
                    </div>

                    <div className="monthly-charts">
                        {data.monthly_breakdown.slice(0, 3).map((location, index) => (
                            <div key={location.location} className="monthly-chart-card">
                                <div className="chart-header">
                                    <h3>{location.location}</h3>
                                    <span className="location-rank">#{index + 1}</span>
                                </div>

                                <div className="chart-content">
                                    <div className="monthly-stats">
                                        {location.monthly_stats.slice(0, 6).map((month, monthIndex) => (
                                            <div key={month.month} className="month-stat">
                                                <div className="month-label">
                                                    {new Date(month.month + '-01').toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        year: '2-digit'
                                                    })}
                                                </div>
                                                <div className="month-data">
                                                    <div className="stat-item">
                                                        <span className="stat-label">Orders:</span>
                                                        <span className="stat-value">{formatNumber(month.orders_count)}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Customers:</span>
                                                        <span className="stat-value">{formatNumber(month.customers_count)}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Items:</span>
                                                        <span className="stat-value">{formatNumber(month.items_sold)}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Revenue:</span>
                                                        <span className="stat-value">{formatCurrency(month.revenue)}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Avg Order:</span>
                                                        <span className="stat-value">{formatCurrency(month.avg_order_value)}</span>
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

            {/* Location Map Visualization */}
            <div className="location-map-section">
                <div className="section-header">
                    <h2>Geographic Distribution</h2>
                    <p>Visual representation of your top selling locations</p>
                </div>

                <div className="location-map-container">
                    <div className="map-section">
                        <SalesMap locations={data?.top_locations || []} />
                    </div>

                    <div className="location-stats-grid">
                        {data?.top_locations?.slice(0, 6).map((location, index) => (
                            <div key={`${location.shipping_city}-${location.shipping_state}-${location.shipping_country}`}
                                className="location-stat-card">
                                <div className="stat-card-header">
                                    <div className={`location-marker marker-${index + 1}`}>
                                        {index + 1}
                                    </div>
                                    <div className="location-name">
                                        <h4>{location.shipping_city}</h4>
                                        <span>{location.shipping_state}</span>
                                    </div>
                                </div>
                                <div className="stat-card-body">
                                    <div className="stat-row">
                                        <span>Revenue:</span>
                                        <strong>{formatCurrency(location.total_revenue)}</strong>
                                    </div>
                                    <div className="stat-row">
                                        <span>Orders:</span>
                                        <span>{formatNumber(location.total_orders)}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span>Customers:</span>
                                        <span>{formatNumber(location.unique_customers)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* No Data State */}
            {(!data?.top_locations || data.top_locations.length === 0) && (
                <div className="no-data-container">
                    <div className="no-data-icon">🌍</div>
                    <h3>No Location Data Available</h3>
                    <p>No orders have been placed in the selected time period.</p>
                </div>
            )}
        </div>
    );
};

export default MostSellingLocations; 