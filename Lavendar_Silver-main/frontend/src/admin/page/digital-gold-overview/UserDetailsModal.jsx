import React from 'react';
import { X, User, Phone, Mail, MapPin, TrendingUp, DollarSign } from 'lucide-react';
import './UserDetailsModal.css';

const UserDetailsModal = ({ isOpen, onClose, userData }) => {
    if (!isOpen || !userData) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="user-details-modal-overlay" onClick={onClose}>
            <div className="user-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-details-modal-header">
                    <h3>User Details & Digital Gold Portfolio</h3>
                    <button className="user-details-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="user-details-modal-content">
                    {/* User Information Section */}
                    <div className="user-info-section">
                        <h4>Personal Information</h4>
                        <div className="user-info-grid">
                            <div className="info-item">
                                <User size={16} />
                                <div className="info-content">
                                    <span className="info-label">Full Name</span>
                                    <span className="info-value">{userData.name || 'Not provided'}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <Mail size={16} />
                                <div className="info-content">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{userData.email || 'Not provided'}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <Phone size={16} />
                                <div className="info-content">
                                    <span className="info-label">Phone Number</span>
                                    <span className="info-value">{userData.phone || 'Not provided'}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <MapPin size={16} />
                                <div className="info-content">
                                    <span className="info-label">Address</span>
                                    <span className="info-value">
                                        {userData.address ? JSON.parse(userData.address).formatted || 'Not provided' : 'Not provided'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Digital Gold Portfolio Section */}
                    <div className="portfolio-section">
                        <h4>Digital Gold Portfolio</h4>
                        <div className="portfolio-stats">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <TrendingUp size={20} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Total Gold (grams)</span>
                                    <span className="stat-value">{userData.total_gold_grams || 0} g</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <DollarSign size={20} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Total Investment</span>
                                    <span className="stat-value">{formatCurrency(userData.total_investment || 0)}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <TrendingUp size={20} />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">Profit/Loss</span>
                                    <span className={`stat-value ${(userData.total_profit_loss || 0) >= 0 ? 'positive' : 'negative'}`}>
                                        {formatCurrency(userData.total_profit_loss || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions Section */}
                    {userData.recent_transactions && userData.recent_transactions.length > 0 && (
                        <div className="transactions-section">
                            <h4>Recent Transactions</h4>
                            <div className="transactions-list">
                                {userData.recent_transactions.slice(0, 5).map((transaction) => (
                                    <div key={transaction.id} className="transaction-item">
                                        <div className="transaction-header">
                                            <span className={`transaction-type ${transaction.transaction_type}`}>
                                                {transaction.transaction_type === 'buy' ? 'Buy' : 'Sell'}
                                            </span>
                                            <span className="transaction-date">
                                                {formatDate(transaction.created_at)}
                                            </span>
                                        </div>
                                        <div className="transaction-details">
                                            <span className="transaction-amount">
                                                {transaction.gold_grams} g @ {formatCurrency(transaction.rate_per_gram)}/g
                                            </span>
                                            <span className="transaction-total">
                                                {formatCurrency(transaction.total_amount)}
                                            </span>
                                        </div>
                                        <div className="transaction-status">
                                            <span className={`status-badge ${transaction.transaction_status}`}>
                                                {transaction.transaction_status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Account Information */}
                    <div className="account-info-section">
                        <h4>Account Information</h4>
                        <div className="account-info-grid">
                            <div className="account-info-item">
                                <span className="info-label">Member Since</span>
                                <span className="info-value">{formatDate(userData.created_at)}</span>
                            </div>
                            <div className="account-info-item">
                                <span className="info-label">Account Status</span>
                                <span className={`status-badge ${userData.status || 'active'}`}>
                                    {userData.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal; 