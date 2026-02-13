import React, { useState, useEffect, useContext } from 'react';
import { X, ShoppingCart, TrendingUp, Clock, Info, User, Shield } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import './RatesPopup.css';

const RatesPopup = ({ isOpen, onClose }) => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetal, setSelectedMetal] = useState('all');
    const [purchaseAmounts, setPurchaseAmounts] = useState({});
    const [selectedRate, setSelectedRate] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [exchangeRates, setExchangeRates] = useState({});
    const [selectedCurrency, setSelectedCurrency] = useState('INR');

    const [showPurchaseForm, setShowPurchaseForm] = useState({});
    const [purchaseDetails, setPurchaseDetails] = useState({});
    const [showRazorpayModal, setShowRazorpayModal] = useState(false);
    const [razorpayOrder, setRazorpayOrder] = useState(null);
    const { user, token } = useUser();
    const { showNotification } = useNotification();

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (isOpen) {
            fetchLatestRates();
            fetchExchangeRates();

        }
    }, [isOpen, user]);

    const fetchLatestRates = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/metal-rates/rates/latest`);
            if (response.data.success) {
                setRates(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching rates:', error);
            showNotification('Error fetching rates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchExchangeRates = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/metal-rates/exchange-rates?base=INR`);
            if (response.data.success) {
                setExchangeRates(response.data.data.rates || {});
            }
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
        }
    };



    const autoFillUserDetails = (rateId) => {
        if (user) {
            const userDetails = {
                name: user.name || '',
                phone: user.phone || '',
                address: user.address ? JSON.parse(user.address).formatted || '' : ''
            };

            setPurchaseDetails(prev => ({
                ...prev,
                [rateId]: userDetails
            }));
        }
    };

    const handlePurchase = async (rate) => {
        if (!user) {
            showNotification('Please login to make a purchase', 'warning');
            return;
        }

        const purchaseAmount = purchaseAmounts[rate.id];
        if (!purchaseAmount || purchaseAmount <= 0) {
            showNotification('Please enter a valid amount', 'warning');
            return;
        }

        // Show purchase form and auto-fill user details
        setShowPurchaseForm(prev => ({ ...prev, [rate.id]: true }));
        setSelectedRate(rate);
        autoFillUserDetails(rate.id);
    };

    const handlePurchaseSubmit = async (rate) => {
        const details = purchaseDetails[rate.id];
        if (!details || !details.name || !details.phone || !details.address) {
            showNotification('Please fill all required fields', 'warning');
            return;
        }

        try {
            setProcessingPayment(true);

            const purchaseAmount = purchaseAmounts[rate.id];
            const totalAmount = purchaseAmount * rate.rate_per_gram;

            // Create Razorpay order first
            const orderResponse = await axios.post(`${API_BASE_URL}/api/digital-gold/create-order`, {
                amount: totalAmount,
                currency: 'INR',
                receipt: `dg_${Date.now()}`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!orderResponse.data.success) {
                throw new Error('Failed to create payment order');
            }

            const orderData = orderResponse.data.data;

            // Create digital gold transaction
            const transactionData = {
                user_id: user.id,
                transaction_type: 'buy',
                gold_grams: purchaseAmount,
                rate_per_gram: rate.rate_per_gram,
                total_amount: totalAmount,
                metal_type: rate.metal_name,
                metal_purity: rate.purity_name,
                making_charges: 0, // Default making charges
                payment_method: 'online',
                admin_notes: `Purchase: ${details.name}, Phone: ${details.phone}, Address: ${details.address}`
            };

            const transactionResponse = await axios.post(`${API_BASE_URL}/api/digital-gold/transactions`, transactionData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (transactionResponse.data.success) {
                // Show Razorpay payment modal with order data
                setRazorpayOrder({
                    transaction_id: transactionResponse.data.data.id,
                    razorpay_order_id: orderData.order_id,
                    amount: totalAmount,
                    currency: 'INR',
                    description: `${purchaseAmount}g ${rate.purity_name} ${rate.metal_name}`,
                    customer_name: details.name,
                    customer_phone: details.phone,
                    customer_email: user.email || 'customer@example.com'
                });
                setShowRazorpayModal(true);
            }
        } catch (error) {
            console.error('Purchase error:', error);
            showNotification('Purchase failed. Please try again.', 'error');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Load Razorpay script if not already loaded
    const loadRazorpayScript = () => {
        return new Promise((resolve, reject) => {
            // Check if Razorpay is already loaded
            if (window.Razorpay && typeof window.Razorpay === 'function') {
                resolve(true);
                return;
            }

            // Check if script is already being loaded
            const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => {
                    if (window.Razorpay && typeof window.Razorpay === 'function') {
                        resolve(true);
                    } else {
                        reject(new Error('Razorpay SDK failed to initialize'));
                    }
                });
                existingScript.addEventListener('error', () => {
                    reject(new Error('Failed to load Razorpay script'));
                });
                return;
            }

            // Load the script
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
                // Wait a bit for Razorpay to initialize
                setTimeout(() => {
                    if (window.Razorpay && typeof window.Razorpay === 'function') {
                        resolve(true);
                    } else {
                        reject(new Error('Razorpay SDK failed to initialize'));
                    }
                }, 100);
            };
            script.onerror = () => {
                reject(new Error('Failed to load Razorpay script'));
            };
            document.body.appendChild(script);
        });
    };

    const handleRazorpayPayment = async () => {
        if (!razorpayOrder) return;

        try {
            // Load Razorpay script first
            await loadRazorpayScript();

            // Verify Razorpay is available
            if (!window.Razorpay || typeof window.Razorpay !== 'function') {
                throw new Error('Razorpay SDK is not available');
            }

            // Initialize Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Live Razorpay key
                amount: razorpayOrder.amount * 100, // Amount in paise
                currency: razorpayOrder.currency,
                name: 'PVJ Jewellery',
                description: razorpayOrder.description,
                order_id: razorpayOrder.razorpay_order_id,
                handler: async function (response) {
                    try {
                        // Verify payment with backend
                        const verifyResponse = await axios.post(`${API_BASE_URL}/api/digital-gold/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (verifyResponse.data.success) {
                            // Update transaction status
                            await axios.put(`${API_BASE_URL}/api/digital-gold/transactions/${razorpayOrder.transaction_id}/status`, {
                                status: 'success',
                                payment_id: response.razorpay_payment_id
                            }, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            showNotification('Payment successful! Digital gold purchase completed.', 'success');
                            setShowRazorpayModal(false);
                            setRazorpayOrder(null);
                            onClose();
                            setPurchaseAmounts(prev => ({ ...prev, [selectedRate.id]: '' }));
                            setPurchaseDetails(prev => ({ ...prev, [selectedRate.id]: {} }));
                            setShowPurchaseForm(prev => ({ ...prev, [selectedRate.id]: false }));
                        } else {
                            showNotification('Payment verification failed. Please contact support.', 'error');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        showNotification('Payment verification failed. Please contact support.', 'error');
                    }
                },
                prefill: {
                    name: razorpayOrder.customer_name,
                    contact: razorpayOrder.customer_phone,
                    email: razorpayOrder.customer_email
                },
                theme: {
                    color: '#0E593C'
                },
                modal: {
                    ondismiss: function () {
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Razorpay error:', error);
            showNotification(error.message || 'Payment gateway error. Please try again.', 'error');
        }
    };

    const filteredRates = selectedMetal === 'all'
        ? rates
        : rates.filter(rate => rate.metal_name.toLowerCase() === selectedMetal.toLowerCase());

    const uniqueMetals = [...new Set(rates.map(rate => rate.metal_name))];
    const currencySymbols = {
        INR: '₹',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        AUD: 'A$',
        CAD: 'C$',
        CHF: 'CHF',
        CNY: '¥',
        SEK: 'kr',
        NZD: 'NZ$',
    };

    if (!isOpen) return null;

    return (
        <div className="rates-popup-overlay" onClick={onClose}>
            <div className="rates-popup" onClick={(e) => e.stopPropagation()}>
                <div className="rates-popup-header">
                    <h2>Live Metal Rates</h2>
                    <button className="rates-popup-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="rates-popup-content">
                    {loading ? (
                        <div className="rates-popup-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading latest rates...</p>
                        </div>
                    ) : (
                        <>
                            <div className="rates-popup-filters">
                                <div className="metal-filter">
                                    <label>Filter by Metal:</label>
                                    <select
                                        value={selectedMetal}
                                        onChange={(e) => setSelectedMetal(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Metals</option>
                                        {uniqueMetals.map(metal => (
                                            <option key={metal} value={metal}>{metal}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="currency-filter">
                                    <label>Currency:</label>
                                    <select
                                        value={selectedCurrency}
                                        onChange={(e) => setSelectedCurrency(e.target.value)}
                                        className="filter-select"
                                    >
                                        {Object.keys(currencySymbols).map((currency) => (
                                            <option key={currency} value={currency}>{currency}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="rates-grid">
                                {filteredRates.map((rate) => {
                                    const purchaseAmount = purchaseAmounts[rate.id] || '';
                                    const exchangeRate = exchangeRates[selectedCurrency] || 1;
                                    const currencySymbol = currencySymbols[selectedCurrency] || selectedCurrency;
                                    const convertedRatePerGram = rate.rate_per_gram * exchangeRate;
                                    const convertedRatePer10g = rate.rate_per_10g * exchangeRate;
                                    const totalAmount = purchaseAmount * convertedRatePerGram;
                                    const isPurchaseFormOpen = showPurchaseForm[rate.id];
                                    const details = purchaseDetails[rate.id] || {};

                                    return (
                                        <div key={rate.id} className="rate-card">
                                            <div className="rate-card-header">
                                                <h3>{rate.purity_name} {rate.metal_name}</h3>
                                                {rate.source === 'api' && (
                                                    <span className={`rate-status live`}>
                                                        Live
                                                    </span>
                                                )}
                                            </div>

                                            <div className="rate-details">
                                                <div className="rate-row">
                                                    <span>Per Gram:</span>
                                                    <span className="rate-value">{currencySymbol}{convertedRatePerGram.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="rate-row">
                                                    <span>Per 10g:</span>
                                                    <span className="rate-value">{currencySymbol}{convertedRatePer10g.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>

                                            <div className="rate-purchase">
                                                <div className="purchase-input">
                                                    <label>Purchase Amount (in grams):</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter amount in grams"
                                                        value={purchaseAmount}
                                                        onChange={(e) => setPurchaseAmounts(prev => ({ ...prev, [rate.id]: e.target.value }))}
                                                        min="0.1"
                                                        step="0.1"
                                                        disabled={processingPayment}
                                                        className="purchase-input-field"
                                                    />
                                                </div>

                                                {purchaseAmount && purchaseAmount > 0 && (
                                                    <div className="purchase-summary">
                                                        <div className="total-amount">
                                                            Total: {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        <button
                                                            className={`purchase-btn ${processingPayment ? 'processing' : ''}`}
                                                            onClick={() => handlePurchase(rate)}
                                                            disabled={processingPayment}
                                                        >
                                                            {processingPayment ? (
                                                                <>
                                                                    <div className="spinner"></div>
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShoppingCart size={16} />
                                                                    Buy Now
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Purchase Form */}
                                            {isPurchaseFormOpen && (
                                                <div className="purchase-form">
                                                    <h4>Purchase Details</h4>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Full Name *</label>
                                                            <input
                                                                type="text"
                                                                value={details.name || ''}
                                                                onChange={(e) => setPurchaseDetails(prev => ({
                                                                    ...prev,
                                                                    [rate.id]: { ...prev[rate.id], name: e.target.value }
                                                                }))}
                                                                placeholder="Enter your full name"
                                                                className="form-input"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Phone Number *</label>
                                                            <input
                                                                type="tel"
                                                                value={details.phone || ''}
                                                                onChange={(e) => setPurchaseDetails(prev => ({
                                                                    ...prev,
                                                                    [rate.id]: { ...prev[rate.id], phone: e.target.value }
                                                                }))}
                                                                placeholder="Enter phone number"
                                                                className="form-input"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Delivery Address *</label>
                                                        <textarea
                                                            value={details.address || ''}
                                                            onChange={(e) => setPurchaseDetails(prev => ({
                                                                ...prev,
                                                                [rate.id]: { ...prev[rate.id], address: e.target.value }
                                                            }))}
                                                            placeholder="Enter complete delivery address"
                                                            className="form-textarea"
                                                            rows="3"
                                                        />
                                                    </div>
                                                    <div className="form-actions">
                                                        <button
                                                            className="cancel-btn"
                                                            onClick={() => setShowPurchaseForm(prev => ({ ...prev, [rate.id]: false }))}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            className="confirm-btn"
                                                            onClick={() => handlePurchaseSubmit(rate)}
                                                            disabled={processingPayment}
                                                        >
                                                            {processingPayment ? 'Processing...' : 'Confirm Purchase'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="rate-footer">
                                                <div className="rate-updated">
                                                    <Clock size={12} />
                                                    Updated: {new Date(rate.updated_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="rates-popup-info">
                                <div className="info-item">
                                    <Info size={16} />
                                    <span>Rates are updated multiple times daily</span>
                                </div>
                                <div className="info-item">
                                    <TrendingUp size={16} />
                                    <span>Secure digital gold purchase with Razorpay</span>
                                </div>
                                {!user && (
                                    <div className="info-item">
                                        <User size={16} />
                                        <span style={{ color: '#dc2626' }}>Please login to make purchases</span>
                                    </div>
                                )}

                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Razorpay Payment Modal */}
            {showRazorpayModal && razorpayOrder && (
                <div className="razorpay-modal-overlay" onClick={() => setShowRazorpayModal(false)}>
                    <div className="razorpay-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="razorpay-modal-header">
                            <h3>Complete Payment</h3>
                            <button className="razorpay-modal-close" onClick={() => setShowRazorpayModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="razorpay-modal-content">
                            <div className="payment-summary">
                                <h4>Payment Summary</h4>
                                <div className="payment-details">
                                    <div className="payment-row">
                                        <span>Amount:</span>
                                        <span>₹{razorpayOrder.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="payment-row">
                                        <span>Description:</span>
                                        <span>{razorpayOrder.description}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="payment-actions">
                                <button className="cancel-payment-btn" onClick={() => setShowRazorpayModal(false)}>
                                    Cancel
                                </button>
                                <button className="proceed-payment-btn" onClick={handleRazorpayPayment}>
                                    Proceed to Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatesPopup;