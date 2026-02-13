import React, { useState, useEffect, useContext, lazy, Suspense, useMemo } from 'react';
import { Coins, TrendingUp, IndianRupee, CheckCircle, Clock, X, Filter } from 'lucide-react';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import './DigitalGold.css';
import AppLoader from '../../components/Loader/AppLoader';

// Lazy load heavy modal component
const RatesPopup = lazy(() => import('../../components/RatesPopup/RatesPopup'));

const DigitalGold = () => {
    const { user, token } = useContext(UserContext);
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [portfolio, setPortfolio] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [selectedMetalFilter, setSelectedMetalFilter] = useState('All');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

    const [showSellModal, setShowSellModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showRatesPopup, setShowRatesPopup] = useState(false);
    const [pendingTransaction, setPendingTransaction] = useState(null);
    const [sellAmount, setSellAmount] = useState('');
    const [currentRate, setCurrentRate] = useState(0);
    const [allCurrentRates, setAllCurrentRates] = useState([]); // Store all rates to lookup by metal and purity
    const [userHoldings, setUserHoldings] = useState([]);
    const [selectedHolding, setSelectedHolding] = useState(null);
    const [sellGrams, setSellGrams] = useState('');
    const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [pendingSellTransaction, setPendingSellTransaction] = useState(null);
    const [bankDetails, setBankDetails] = useState({
        account_number: '',
        ifsc_code: '',
        account_holder_name: '',
        bank_name: ''
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (user && token) {
            fetchDigitalGoldData();
            fetchUserHoldings();
        }
    }, [user, token]);

    const fetchDigitalGoldData = async () => {
        try {
            setLoading(true);

            // Fetch user's transactions to calculate portfolio
            const transactionsResponse = await axios.get(`${API_BASE_URL}/api/digital-gold/transactions?user_id=${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });



            // Fetch current metal rates
            const rateResponse = await axios.get(`${API_BASE_URL}/api/metal-rates/rates/latest`);

            // Store all rates for lookup by metal type and purity
            const rates = rateResponse.data.data || [];
            setAllCurrentRates(rates);

            // Calculate portfolio from successful transactions
            const transactions = transactionsResponse.data.data || [];
            const successfulBuyTransactions = transactions.filter(tx =>
                tx.transaction_type === 'buy' && tx.transaction_status === 'success'
            );
            const successfulSellTransactions = transactions.filter(tx =>
                tx.transaction_type === 'sell' && tx.transaction_status === 'success'
            );

            const totalGoldBought = successfulBuyTransactions.reduce((sum, tx) => sum + parseFloat(tx.gold_grams), 0);
            const totalGoldSold = successfulSellTransactions.reduce((sum, tx) => sum + parseFloat(tx.gold_grams), 0);
            const totalInvestment = successfulBuyTransactions.reduce((sum, tx) => sum + parseFloat(tx.total_amount), 0);

            const portfolioData = {
                total_gold_grams: totalGoldBought - totalGoldSold,
                total_investment: totalInvestment
            };

            setPortfolio(portfolioData);
            setTransactions(transactions);

            // Get current gold rate (24K) for portfolio summary
            const goldRate = rates.find(rate =>
                rate.metal_name === 'Gold' && rate.purity_name === '24K'
            );
            setCurrentRate(goldRate?.rate_per_gram || 6000);

        } catch (error) {
            console.error('Error fetching digital gold data:', error);
            showNotification('Error loading digital gold data', 'error');
            // Set default values if API fails
            setPortfolio({ total_gold_grams: 0, total_investment: 0 });
            setTransactions([]);

            setCurrentRate(6000);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserHoldings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/digital-gold/holdings/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setUserHoldings(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user holdings:', error);
        }
    };

    const handleSellGold = async () => {
        if (!selectedHolding) {
            showNotification('Please select a metal holding to sell', 'warning');
            return;
        }

        if (!sellGrams || parseFloat(sellGrams) <= 0) {
            showNotification('Please enter a valid amount to sell', 'warning');
            return;
        }

        if (parseFloat(sellGrams) > selectedHolding.total_grams) {
            showNotification(`You cannot sell more than ${selectedHolding.total_grams}g of ${selectedHolding.metal_purity} ${selectedHolding.metal_type}`, 'warning');
            return;
        }

        try {
            const totalAmount = parseFloat(sellGrams) * selectedHolding.current_rate_per_gram;

            // Create sell transaction (Step 1: Save as pending)
            const transactionData = {
                user_id: user.id,
                metal_type: selectedHolding.metal_type,
                metal_purity: selectedHolding.metal_purity,
                sell_grams: parseFloat(sellGrams),
                rate_per_gram: selectedHolding.current_rate_per_gram,
                total_amount: totalAmount,
                payment_method: 'online'
            };

            const response = await axios.post(`${API_BASE_URL}/api/digital-gold/sell`, transactionData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setPendingSellTransaction(response.data.data);
                setShowSellModal(false);
                setShowConfirmationModal(true); // Show confirmation modal instead of bank details
                setSellGrams('');
                setSelectedHolding(null);
                showNotification('Sell order created successfully! Please confirm to proceed.', 'success');
            }
        } catch (error) {
            console.error('Error creating sell transaction:', error);
            showNotification(error.response?.data?.message || 'Error creating sell order', 'error');
        }
    };

    const handleCompletePayment = async (transaction) => {
        setPendingTransaction(transaction);
        setShowPaymentModal(true);
    };

    const handleRazorpayPayment = async () => {
        if (!pendingTransaction) return;

        try {
            // Create Razorpay order
            const orderResponse = await axios.post(`${API_BASE_URL}/api/digital-gold/create-order`, {
                amount: pendingTransaction.total_amount,
                currency: 'INR',
                receipt: `dg_${Date.now()}`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!orderResponse.data.success) {
                throw new Error('Failed to create payment order');
            }

            const orderData = orderResponse.data.data;

            // Initialize Razorpay
            const options = {
                key: 'rzp_live_RepxCmn4eqow4z',
                amount: pendingTransaction.total_amount * 100,
                currency: 'INR',
                name: 'PVJ Jewellery',
                description: `${pendingTransaction.gold_grams}g Gold Purchase`,
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        // Verify payment
                        const verifyResponse = await axios.post(`${API_BASE_URL}/api/digital-gold/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (verifyResponse.data.success) {
                            // Update transaction status
                            await axios.put(`${API_BASE_URL}/api/digital-gold/transactions/${pendingTransaction.id}/status`, {
                                status: 'success',
                                payment_id: response.razorpay_payment_id
                            }, {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            showNotification('Payment successful! Digital gold purchase completed.', 'success');
                            setShowPaymentModal(false);
                            setPendingTransaction(null);
                            fetchDigitalGoldData(); // Refresh data
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        showNotification('Payment verification failed', 'error');
                    }
                },
                prefill: {
                    name: user.name,
                    contact: user.phone,
                    email: user.email
                },
                theme: {
                    color: '#0E593C'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Error initiating payment:', error);
            showNotification('Error initiating payment', 'error');
        }
    };

    const handleProcessSellTransaction = async () => {
        if (!pendingSellTransaction) return;

        // Validate bank details
        if (!bankDetails.account_number || !bankDetails.ifsc_code ||
            !bankDetails.account_holder_name || !bankDetails.bank_name) {
            showNotification('Please fill all bank details', 'warning');
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/digital-gold/sell/${pendingSellTransaction.id}/process`, {
                bank_details: bankDetails
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                showNotification('Sell order processed successfully! Refund will be processed within 3-5 business days.', 'success');
                setShowBankDetailsModal(false);
                setShowConfirmationModal(false);
                setPendingSellTransaction(null);
                setBankDetails({
                    account_number: '',
                    ifsc_code: '',
                    account_holder_name: '',
                    bank_name: ''
                });
                fetchDigitalGoldData();
                fetchUserHoldings();
            }
        } catch (error) {
            console.error('Error processing sell transaction:', error);
            showNotification('Error processing sell order', 'error');
        }
    };

    const handleConfirmSell = async () => {
        if (!pendingSellTransaction) return;

        try {
            // Step 2: Process the pending transaction
            const response = await axios.post(`${API_BASE_URL}/api/digital-gold/sell/${pendingSellTransaction.id}/confirm`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                showNotification('Sell order confirmed successfully! Please provide bank details for refund.', 'success');
                setShowConfirmationModal(false);
                setShowBankDetailsModal(true);
            }
        } catch (error) {
            console.error('Error confirming sell transaction:', error);
            showNotification('Error confirming sell order', 'error');
        }
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount).toLocaleString()}`;
    };

    const formatGrams = (grams) => {
        return `${parseFloat(grams).toFixed(2)}g`;
    };

    // Get the current rate for a specific transaction based on its metal type and purity
    const getCurrentRateForTransaction = (transaction) => {
        if (!transaction || !allCurrentRates.length) return 0;
        
        const metalType = transaction.metal_type || 'Gold';
        const purity = transaction.metal_purity || '24K';
        
        // Find matching rate
        const matchingRate = allCurrentRates.find(rate => 
            rate.metal_name === metalType && rate.purity_name === purity
        );
        
        return matchingRate ? parseFloat(matchingRate.rate_per_gram) || 0 : 0;
    };

    // Get unique metal types from transactions and holdings
    const availableMetals = useMemo(() => {
        const metals = new Set();
        metals.add('All');
        
        // Add metals from transactions
        transactions.forEach(tx => {
            if (tx.metal_type) {
                metals.add(tx.metal_type);
            }
        });
        
        // Add metals from holdings
        userHoldings.forEach(holding => {
            if (holding.metal_type) {
                metals.add(holding.metal_type);
            }
        });
        
        return Array.from(metals).sort();
    }, [transactions, userHoldings]);

    // Calculate filtered portfolio based on selected metal
    const filteredPortfolio = useMemo(() => {
        if (!portfolio || !transactions.length) {
            return { total_metal_grams: 0, total_investment: 0, current_value: 0, metal_name: 'Metal' };
        }

        if (selectedMetalFilter === 'All') {
            // Calculate for all metals combined
            const successfulBuyTransactions = transactions.filter(tx =>
                tx.transaction_type === 'buy' && tx.transaction_status === 'success'
            );
            const successfulSellTransactions = transactions.filter(tx =>
                tx.transaction_type === 'sell' && tx.transaction_status === 'success'
            );

            let totalMetalGrams = 0;
            let totalInvestment = 0;
            let totalCurrentValue = 0;

            // Group by metal type and calculate
            const metalGroups = {};
            successfulBuyTransactions.forEach(tx => {
                const metalType = tx.metal_type || 'Gold';
                if (!metalGroups[metalType]) {
                    metalGroups[metalType] = { bought: 0, sold: 0, investment: 0 };
                }
                metalGroups[metalType].bought += parseFloat(tx.gold_grams || 0);
                metalGroups[metalType].investment += parseFloat(tx.total_amount || 0);
            });

            successfulSellTransactions.forEach(tx => {
                const metalType = tx.metal_type || 'Gold';
                if (!metalGroups[metalType]) {
                    metalGroups[metalType] = { bought: 0, sold: 0, investment: 0 };
                }
                metalGroups[metalType].sold += parseFloat(tx.gold_grams || 0);
            });

            // Calculate current value for each metal
            Object.keys(metalGroups).forEach(metalType => {
                const netGrams = metalGroups[metalType].bought - metalGroups[metalType].sold;
                if (netGrams > 0) {
                    // Find the most common purity for this metal type
                    const metalTransactions = successfulBuyTransactions.filter(tx => (tx.metal_type || 'Gold') === metalType);
                    const purityCounts = {};
                    metalTransactions.forEach(tx => {
                        const purity = tx.metal_purity || '24K';
                        purityCounts[purity] = (purityCounts[purity] || 0) + 1;
                    });
                    const mostCommonPurity = Object.keys(purityCounts).reduce((a, b) => purityCounts[a] > purityCounts[b] ? a : b, '24K');
                    
                    const rate = allCurrentRates.find(r => 
                        r.metal_name === metalType && r.purity_name === mostCommonPurity
                    );
                    const currentRate = rate ? parseFloat(rate.rate_per_gram) : 0;
                    
                    totalMetalGrams += netGrams;
                    totalInvestment += metalGroups[metalType].investment;
                    totalCurrentValue += netGrams * currentRate;
                }
            });

            return {
                total_metal_grams: totalMetalGrams,
                total_investment: totalInvestment,
                current_value: totalCurrentValue,
                metal_name: 'All Metals'
            };
        } else {
            // Filter by selected metal
            const filteredBuyTransactions = transactions.filter(tx =>
                tx.transaction_type === 'buy' && 
                tx.transaction_status === 'success' &&
                (tx.metal_type || 'Gold') === selectedMetalFilter
            );
            const filteredSellTransactions = transactions.filter(tx =>
                tx.transaction_type === 'sell' && 
                tx.transaction_status === 'success' &&
                (tx.metal_type || 'Gold') === selectedMetalFilter
            );

            const totalMetalBought = filteredBuyTransactions.reduce((sum, tx) => sum + parseFloat(tx.gold_grams || 0), 0);
            const totalMetalSold = filteredSellTransactions.reduce((sum, tx) => sum + parseFloat(tx.gold_grams || 0), 0);
            const totalInvestment = filteredBuyTransactions.reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0);
            const totalMetalGrams = totalMetalBought - totalMetalSold;

            // Find the most common purity for this metal type
            const purityCounts = {};
            filteredBuyTransactions.forEach(tx => {
                const purity = tx.metal_purity || '24K';
                purityCounts[purity] = (purityCounts[purity] || 0) + 1;
            });
            const mostCommonPurity = Object.keys(purityCounts).length > 0
                ? Object.keys(purityCounts).reduce((a, b) => purityCounts[a] > purityCounts[b] ? a : b, '24K')
                : '24K';

            // Get current rate for this metal and purity
            const rate = allCurrentRates.find(r => 
                r.metal_name === selectedMetalFilter && r.purity_name === mostCommonPurity
            );
            const currentRate = rate ? parseFloat(rate.rate_per_gram) : 0;
            const currentValue = totalMetalGrams * currentRate;

            return {
                total_metal_grams: totalMetalGrams,
                total_investment: totalInvestment,
                current_value: currentValue,
                metal_name: selectedMetalFilter
            };
        }
    }, [portfolio, transactions, selectedMetalFilter, allCurrentRates]);

    if (loading) {
        return (
            <div className="digital-gold-container">
                <div className="digital-gold-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your digital gold portfolio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="digital-gold-container">
            {/* Portfolio Summary */}
            <div className="digital-gold-portfolio">
                <h3 className="digital-gold-section-title">
                    <Coins className="digital-gold-icon" />
                    Your Digital Gold Portfolio
                </h3>

                {/* Filter Section */}
                {availableMetals.length > 1 && (
                    <div className="digital-gold-filter-section">
                        <div className="filter-label">
                            <Filter className="filter-icon" />
                            <span>Filter by Metal:</span>
                        </div>
                        <select
                            className="digital-gold-filter-select"
                            value={selectedMetalFilter}
                            onChange={(e) => setSelectedMetalFilter(e.target.value)}
                        >
                            {availableMetals.map((metal) => (
                                <option key={metal} value={metal}>
                                    {metal}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="digital-gold-stats">
                    <div className="digital-gold-stat-card">
                        <div className="stat-icon">
                            <Coins />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total {filteredPortfolio.metal_name}</div>
                            <div className="stat-value">{formatGrams(filteredPortfolio.total_metal_grams || 0)}</div>
                        </div>
                    </div>

                    <div className="digital-gold-stat-card">
                        <div className="stat-icon">
                            <IndianRupee />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total Investment</div>
                            <div className="stat-value">{formatCurrency(filteredPortfolio.total_investment || 0)}</div>
                        </div>
                    </div>

                    <div className="digital-gold-stat-card">
                        <div className="stat-icon">
                            <TrendingUp />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Current Value</div>
                            <div className="stat-value">{formatCurrency(filteredPortfolio.current_value || 0)}</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="digital-gold-actions">
                    {filteredPortfolio.total_metal_grams > 0 && (
                        <button
                            className="digital-gold-btn digital-gold-sell-btn"
                            onClick={() => setShowSellModal(true)}
                        >
                            Sell {selectedMetalFilter === 'All' ? 'Metal' : selectedMetalFilter}
                        </button>
                    )}

                    <button
                        className="digital-gold-btn digital-gold-buy-btn"
                        onClick={() => setShowRatesPopup(true)}
                    >
                        Buy More {selectedMetalFilter === 'All' ? 'Metal' : selectedMetalFilter}
                    </button>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="digital-gold-transactions">
                <div className="digital-gold-transactions-header">
                    <h3 className="digital-gold-section-title">
                        <TrendingUp className="digital-gold-icon" />
                        Recent Transactions
                    </h3>
                    {transactions.length > 0 && (
                        <select
                            className="digital-gold-status-filter"
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="success">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    )}
                </div>

                {transactions.length === 0 ? (
                    <div className="digital-gold-empty">
                        <p>No transactions yet. Start buying digital gold to see your history here!</p>
                    </div>
                ) : (
                    <div className="digital-gold-transactions-list">
                        {transactions
                            .filter(transaction => {
                                if (selectedStatusFilter === 'All') return true;
                                return transaction.transaction_status === selectedStatusFilter;
                            })
                            .slice(0, 5)
                            .map((transaction, index) => (
                            <div key={index} className={`transaction-card ${transaction.transaction_status}`}>
                                <div className="transaction-header">
                                    <div className={`transaction-type ${transaction.transaction_type}`}>
                                        {transaction.transaction_type === 'buy' ? 'Buy' : 'Sell'}
                                    </div>
                                    <div className={`transaction-status ${transaction.transaction_status}`}>
                                        {transaction.transaction_status === 'success' && <CheckCircle size={16} />}
                                        {transaction.transaction_status === 'pending' && <Clock size={16} />}
                                        {transaction.transaction_status === 'failed' && <X size={16} />}
                                        <span className="status-text">
                                            {transaction.transaction_status === 'success' 
                                                ? 'Confirmed' 
                                                : transaction.transaction_status.charAt(0).toUpperCase() + transaction.transaction_status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                <div className="transaction-details">
                                    <div className="transaction-amount">
                                        {formatGrams(transaction.gold_grams)} {transaction.metal_type || 'Gold'}
                                    </div>
                                    <div className="transaction-metal-info">
                                        <span className="metal-purity">{transaction.metal_purity || '24K'}</span>
                                        {transaction.making_charges > 0 && (
                                            <span className="making-charges">Touch: {formatCurrency(transaction.making_charges)}</span>
                                        )}
                                    </div>
                                    <div className="transaction-rate">
                                        Rate: {formatCurrency(transaction.rate_per_gram)}/gram
                                    </div>
                                    <div className="transaction-value">
                                        {formatCurrency(transaction.total_amount)}
                                    </div>
                                    {transaction.transaction_status === 'success' && transaction.transaction_type === 'buy' && (() => {
                                        // Get the correct current rate for this transaction's metal type and purity
                                        const transactionCurrentRate = getCurrentRateForTransaction(transaction);
                                        const currentValue = transaction.gold_grams * transactionCurrentRate;
                                        const profitLoss = currentValue - transaction.total_amount;
                                        
                                        return (
                                            <div className="transaction-profit">
                                                Current Value: {formatCurrency(currentValue)}
                                                <span className={`profit-indicator ${profitLoss >= 0 ? 'profit' : 'loss'}`}>
                                                    {profitLoss >= 0 ? '+' : ''}
                                                    {formatCurrency(profitLoss)}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    {transaction.payment_method && (
                                        <div className="transaction-payment-method">
                                            Payment: {transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1)}
                                        </div>
                                    )}
                                </div>

                                <div className="transaction-footer">
                                    <div className="transaction-date">
                                        {new Date(transaction.created_at).toLocaleDateString()}
                                    </div>
                                    {transaction.transaction_reference && (
                                        <div className="transaction-id">
                                            ID: {transaction.transaction_reference}
                                        </div>
                                    )}
                                </div>

                                {transaction.transaction_status === 'pending' && transaction.transaction_type === 'buy' && (
                                    <button
                                        className="digital-gold-complete-payment-btn"
                                        onClick={() => handleCompletePayment(transaction)}
                                    >
                                        Complete Payment
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sell Modal */}
            {showSellModal && (
                <div className="digital-gold-modal-overlay">
                    <div className="digital-gold-modal">
                        <div className="digital-gold-modal-header">
                            <h3>Sell Digital Gold</h3>
                            <button
                                className="digital-gold-modal-close"
                                onClick={() => setShowSellModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="digital-gold-modal-content">
                            <div className="sell-form-group">
                                <label>Select Metal Holding to Sell</label>
                                <select
                                    value={selectedHolding ? `${selectedHolding.metal_type}_${selectedHolding.metal_purity}` : ''}
                                    onChange={(e) => {
                                        const [metalType, metalPurity] = e.target.value.split('_');
                                        const holding = userHoldings.find(h => h.metal_type === metalType && h.metal_purity === metalPurity);
                                        setSelectedHolding(holding);
                                        setSellGrams(''); // Reset grams when new holding is selected
                                    }}
                                    className="digital-gold-select"
                                >
                                    <option value="">Select a holding</option>
                                    {userHoldings.map((holding, index) => (
                                        <option key={index} value={`${holding.metal_type}_${holding.metal_purity}`}>
                                            {holding.metal_type} {holding.metal_purity} ({holding.total_grams}g)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedHolding && (
                                <>
                                    <div className="sell-form-group">
                                        <label>Amount to Sell (grams)</label>
                                        <input
                                            type="number"
                                            value={sellGrams}
                                            onChange={(e) => setSellGrams(e.target.value)}
                                            placeholder="Enter amount in grams"
                                            min="0.01"
                                            max={selectedHolding.total_grams}
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="sell-summary">
                                        <div className="sell-summary-item">
                                            <span>Current Rate:</span>
                                            <span>{formatCurrency(selectedHolding.current_rate_per_gram)}/gram</span>
                                        </div>
                                        <div className="sell-summary-item">
                                            <span>Total Value:</span>
                                            <span>{formatCurrency((sellGrams || 0) * selectedHolding.current_rate_per_gram)}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="digital-gold-modal-actions">
                                <button
                                    className="digital-gold-btn digital-gold-cancel-btn"
                                    onClick={() => setShowSellModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="digital-gold-btn digital-gold-confirm-btn"
                                    onClick={handleSellGold}
                                    disabled={!selectedHolding || !sellGrams}
                                >
                                    Confirm Sell
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmationModal && pendingSellTransaction && (
                <div className="digital-gold-modal-overlay">
                    <div className="digital-gold-modal">
                        <div className="digital-gold-modal-header">
                            <h3>Confirm Sell Order</h3>
                            <button
                                className="digital-gold-modal-close"
                                onClick={() => setShowConfirmationModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="digital-gold-modal-content">
                            <div className="confirmation-summary">
                                <p>Please review your sell order details:</p>
                                <div className="confirmation-details">
                                    <div className="confirmation-item">
                                        <span>Metal Type:</span>
                                        <span>{pendingSellTransaction.sell_details?.metal_type} {pendingSellTransaction.sell_details?.metal_purity}</span>
                                    </div>
                                    <div className="confirmation-item">
                                        <span>Amount to Sell:</span>
                                        <span>{formatGrams(pendingSellTransaction.sell_details?.grams)}</span>
                                    </div>
                                    <div className="confirmation-item">
                                        <span>Rate per Gram:</span>
                                        <span>{formatCurrency(pendingSellTransaction.sell_details?.rate_per_gram)}</span>
                                    </div>
                                    <div className="confirmation-item confirmation-total">
                                        <span>Total Value:</span>
                                        <span>{formatCurrency(pendingSellTransaction.sell_details?.total_amount)}</span>
                                    </div>
                                </div>
                                <p className="confirmation-note">
                                    <strong>Note:</strong> Once confirmed, this sell order will be processed and cannot be cancelled.
                                </p>
                            </div>

                            <div className="digital-gold-modal-actions">
                                <button
                                    className="digital-gold-btn digital-gold-cancel-btn"
                                    onClick={() => setShowConfirmationModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="digital-gold-btn digital-gold-confirm-btn"
                                    onClick={handleConfirmSell}
                                >
                                    Confirm Sell
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Details Modal */}
            {showBankDetailsModal && pendingSellTransaction && (
                <div className="digital-gold-modal-overlay">
                    <div className="digital-gold-modal">
                        <div className="digital-gold-modal-header">
                            <h3>Enter Bank Details</h3>
                            <button
                                className="digital-gold-modal-close"
                                onClick={() => setShowBankDetailsModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="digital-gold-modal-content">
                            <div className="bank-details-form">
                                <div className="form-group">
                                    <label>Account Number</label>
                                    <input
                                        type="text"
                                        value={bankDetails.account_number}
                                        onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                                        placeholder="Enter account number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>IFSC Code</label>
                                    <input
                                        type="text"
                                        value={bankDetails.ifsc_code}
                                        onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
                                        placeholder="Enter IFSC code"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.account_holder_name}
                                        onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                                        placeholder="Enter account holder name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankDetails.bank_name}
                                        onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                                        placeholder="Enter bank name"
                                    />
                                </div>
                            </div>

                            <div className="digital-gold-modal-actions">
                                <button
                                    className="digital-gold-btn digital-gold-cancel-btn"
                                    onClick={() => setShowBankDetailsModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="digital-gold-btn digital-gold-confirm-btn"
                                    onClick={handleProcessSellTransaction}
                                    disabled={!bankDetails.account_number || !bankDetails.ifsc_code ||
                                        !bankDetails.account_holder_name || !bankDetails.bank_name}
                                >
                                    Confirm Bank Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && pendingTransaction && (
                <div className="digital-gold-modal-overlay">
                    <div className="digital-gold-modal">
                        <div className="digital-gold-modal-header">
                            <h3>Complete Payment</h3>
                            <button
                                className="digital-gold-modal-close"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="digital-gold-modal-content">
                            <div className="payment-summary">
                                <div className="payment-summary-item">
                                    <span>Gold Amount:</span>
                                    <span>{formatGrams(pendingTransaction.gold_grams)}</span>
                                </div>
                                <div className="payment-summary-item">
                                    <span>Rate:</span>
                                    <span>{formatCurrency(pendingTransaction.rate_per_gram)}/gram</span>
                                </div>
                                <div className="payment-summary-item payment-total">
                                    <span>Total Amount:</span>
                                    <span>{formatCurrency(pendingTransaction.total_amount)}</span>
                                </div>
                            </div>

                            <div className="digital-gold-modal-actions">
                                <button
                                    className="digital-gold-btn digital-gold-cancel-btn"
                                    onClick={() => setShowPaymentModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="digital-gold-btn digital-gold-confirm-btn"
                                    onClick={handleRazorpayPayment}
                                >
                                    Pay Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rates Popup */}
            {showRatesPopup && (
                <Suspense fallback={<AppLoader />}>
                    <RatesPopup
                        isOpen={showRatesPopup}
                        onClose={() => {
                            setShowRatesPopup(false);
                            // Refresh data when popup closes in case user made a purchase
                            fetchDigitalGoldData();
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default DigitalGold; 