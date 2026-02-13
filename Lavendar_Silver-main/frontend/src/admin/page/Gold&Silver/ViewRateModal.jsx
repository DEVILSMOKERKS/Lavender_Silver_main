import React, { useState, useEffect } from 'react';
import { X, Eye, TrendingUp, TrendingDown, Clock, User, Edit, CheckCircle } from 'lucide-react';
import './ViewRateModal.css';

const ViewRateModal = ({ isOpen, onClose, rate, onUpdate }) => {
    const [priceHistory, setPriceHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch price history for this rate
    const fetchPriceHistory = async () => {
        if (!rate) return;

        setLoadingHistory(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/metal-rates/rates/history?metal_type_id=${rate.metal_type_id}&purity_id=${rate.purity_id}&limit=10`);
            const data = await response.json();
            if (data.success) {
                setPriceHistory(data.data);
            }
        } catch (error) {
            console.error('Error fetching price history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (isOpen && rate) {
            fetchPriceHistory();
        }
    }, [isOpen, rate]);

    if (!isOpen || !rate) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleUpdate = () => {
        if (onUpdate) {
            onUpdate(rate);
        }
        onClose();
    };

    return (
        <div className="view-rate-modal-overlay">
            <div className="view-rate-modal">
                <div className="view-rate-modal-header">
                    <div className="view-rate-modal-title">
                        <Eye className="view-rate-icon" />
                        <h2>Rate Details</h2>
                    </div>
                    <button className="view-rate-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="view-rate-content">
                    {/* Metal Information */}
                    <div className="view-rate-section">
                        <h3>Metal Information</h3>
                        <div className="view-rate-metal-info-grid">
                            <div className="view-rate-info-item">
                                <span className="view-rate-info-label">Metal Type</span>
                                <span className="view-rate-info-value">{rate.metal_name}</span>
                            </div>
                            <div className="view-rate-info-item">
                                <span className="view-rate-info-label">Symbol</span>
                                <span className="view-rate-info-value">{rate.metal_symbol}</span>
                            </div>
                            <div className="view-rate-info-item">
                                <span className="view-rate-info-label">Purity</span>
                                <span className="view-rate-info-value">{rate.purity_name} ({rate.purity_value}%)</span>
                            </div>
                        </div>
                    </div>

                    {/* Rate Information */}
                    <div className="view-rate-section">
                        <h3>Current Rates</h3>
                        <div className="view-rate-rate-info-grid">
                            <div className="view-rate-rate-card primary">
                                <div className="view-rate-rate-label">Per Gram</div>
                                <div className="view-rate-rate-value">{formatCurrency(rate.rate_per_gram)}</div>
                                <div className="view-rate-rate-unit">per gram</div>
                            </div>
                            <div className="view-rate-rate-card">
                                <div className="view-rate-rate-label">Per 10g</div>
                                <div className="view-rate-rate-value">{formatCurrency(rate.rate_per_10g)}</div>
                                <div className="view-rate-rate-unit">per 10 grams</div>
                            </div>
                        </div>
                    </div>

                    {/* Status Information */}
                    <div className="view-rate-section">
                        <h3>Status Information</h3>
                        <div className="view-rate-status-info-grid">
                            <div className="view-rate-status-item">
                                <CheckCircle className="view-rate-status-icon" />
                                <div className="view-rate-status-content">
                                    <span className="view-rate-status-label">Status</span>
                                    <span className="view-rate-status-value">
                                        {rate.is_live ? 'Live' : 'Inactive'}
                                    </span>
                                </div>
                                <span className={`view-rate-status-badge ${rate.is_live ? 'live' : 'inactive'}`}>
                                    {rate.is_live ? 'LIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="view-rate-status-item">
                                <User className="view-rate-status-icon" />
                                <div className="view-rate-status-content">
                                    <span className="view-rate-status-label">Updated By</span>
                                    <span className="view-rate-status-value">{rate.updated_by}</span>
                                </div>
                            </div>
                            <div className="view-rate-status-item">
                                <Clock className="view-rate-status-icon" />
                                <div className="view-rate-status-content">
                                    <span className="view-rate-status-label">Last Updated</span>
                                    <span className="view-rate-status-value">{formatDate(rate.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Source Information */}
                    <div className="view-rate-section">
                        <h3>Source Information</h3>
                        <div className="view-rate-source-info">
                            <span className="view-rate-source-label">Data Source:</span>
                            <span className={`view-rate-source-badge ${rate.source === 'api' ? 'api' : 'user'}`}>
                                {rate.source === 'api' ? 'API' : 'USER'}
                            </span>
                        </div>
                    </div>

                    {/* Price History */}
                    {priceHistory.length > 0 && (
                        <div className="view-rate-section">
                            <h3>Price History</h3>
                            <div className="view-rate-price-history-list">
                                {priceHistory.map((history, index) => (
                                    <div key={index} className="view-rate-price-history-item">
                                        <div className="view-rate-history-date">
                                            {formatDate(history.created_at)}
                                        </div>
                                        <div className="view-rate-history-details">
                                            <div className="view-rate-history-rate">
                                                <span className="view-rate-old-rate">
                                                    {formatCurrency(history.old_rate_per_gram)}
                                                </span>
                                                <span className="view-rate-arrow">→</span>
                                                <span className="view-rate-new-rate">
                                                    {formatCurrency(history.new_rate_per_gram)}
                                                </span>
                                            </div>
                                            <span className={`view-rate-history-change ${history.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                                                {history.change_percentage >= 0 ? '+' : ''}{history.change_percentage}%
                                            </span>
                                        </div>
                                        {history.change_reason && (
                                            <div className="view-rate-history-reason">
                                                Reason: {history.change_reason}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="view-rate-modal-actions">
                    <button
                        type="button"
                        className="view-rate-modal-update-btn"
                        onClick={handleUpdate}
                    >
                        <Edit size={16} />
                        Update Rate
                    </button>
                    <button
                        type="button"
                        className="view-rate-modal-close-btn"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewRateModal; 