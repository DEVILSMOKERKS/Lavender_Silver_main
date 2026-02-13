import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import './UserBalance.css';

// Load Razorpay scripte
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserBalance = () => {
  const { user } = useContext(UserContext);
  const { showNotification } = useNotification();
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState({ text: '', type: '', show: false });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch user's total paid amount
      const paidAmountResponse = await axios.get(`${API_BASE_URL}/api/goldmine/user-total-paid-amount`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (paidAmountResponse.data.success) {
        setTotalPaidAmount(parseFloat(paidAmountResponse.data.data.totalPaidAmount) || 0);
      }

      // Fetch user subscriptions
      const subscriptionsResponse = await axios.get(`${API_BASE_URL}/api/goldmine/user-subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (subscriptionsResponse.data.success) {
        setSubscriptions(subscriptionsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showNotification('Failed to load user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getNextPaymentMonth = (subscription) => {
    const paidMonths = subscription.paid_months_count || 0;
    return paidMonths + 1;
  };

  const canPayNextMonth = (subscription) => {
    const nextMonth = getNextPaymentMonth(subscription);
    return nextMonth <= 11 && subscription.status !== 'completed';
  };

  const handlePayNextMonth = async (subscription) => {
    try {
      const nextMonth = getNextPaymentMonth(subscription);

      // Load Razorpay
      const Razorpay = await loadRazorpayScript();
      if (!Razorpay) {
        showNotification('Failed to load payment gateway', 'error');
        return;
      }

      const token = localStorage.getItem('token');

      // Create payment order
      const orderResponse = await axios.post(`${API_BASE_URL}/api/goldmine/create-monthly-payment-order`, {
        subscriptionId: subscription.id,
        monthNumber: nextMonth
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!orderResponse.data.success) {
        const errorMessage = orderResponse.data.message || 'Failed to create payment order';

        // If it's a "month already paid" error, show inline message
        if (errorMessage.includes('This month payment already paid')) {
          setPaymentMessage({
            text: 'This month payment already paid. You can pay for the next month in the following month.',
            type: 'warning',
            show: true
          });

          // Auto-hide message after 2 seconds
          setTimeout(() => {
            setPaymentMessage({ text: '', type: '', show: false });
          }, 2000);
        } else {
          showNotification(errorMessage, 'error');
        }
        return;
      }

      const orderData = orderResponse.data.data;

      // Initialize Razorpay payment
      const options = {
        key: 'rzp_live_RepxCmn4eqow4z',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'PVJ GoldMine',
        description: `Month ${nextMonth} Payment - Subscription #${subscription.subscription_number}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await axios.post(`${API_BASE_URL}/api/goldmine/verify-monthly-payment`, {
              subscriptionId: subscription.id,
              monthNumber: nextMonth,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyResponse.data.success) {
              showNotification('Payment successful!', 'success');
              fetchUserData(); // Refresh data
            } else {
              showNotification(verifyResponse.data.message || 'Payment verification failed', 'error');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            showNotification('Payment verification failed', 'error');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.mobile || ''
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (error) {
      // Check if it's a 400 error with "month already paid" message
      if (error.response && error.response.status === 400) {
        const errorMessage = error.response.data?.message || '';
        if (errorMessage.includes('This month payment already paid')) {
          setPaymentMessage({
            text: 'This month payment already paid. You can pay for the next month in the following month.',
            type: 'warning',
            show: true
          });

          // Auto-hide message after 2 seconds
          setTimeout(() => {
            setPaymentMessage({ text: '', type: '', show: false });
          }, 2000);
          return; // Exit early to prevent console.error
        } else {
          console.error('Payment error:', error);
          showNotification(errorMessage || 'Payment request failed', 'error');
        }
      } else {
        console.error('Payment error:', error);
        showNotification('Failed to initiate payment', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="user-balance-container">
        <div className="user-balance-loading">
          <div className="user-balance-spinner"></div>
          <p>Loading your account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-balance-container">
      {/* Total Paid Amount Section */}
      <div className="user-balance-section">
        <h2 className="user-balance-title">Total Amount Paid</h2>
        <div className="user-balance-card">
          <div className="user-balance-amount">
            <span className="user-balance-currency">₹</span>
            <span className="user-balance-value">{(parseFloat(totalPaidAmount) || 0).toFixed(2)}</span>
          </div>
          <div className="user-balance-description">
            <p>This is the total amount you have paid for your GoldMine subscriptions</p>
          </div>
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="user-balance-section">
        <h2 className="user-balance-title">GoldMine Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <div className="user-balance-no-subscriptions">
            <p>No active subscriptions found.</p>
            <p>Start your GoldMine journey today!</p>
          </div>
        ) : (
          <div className="user-balance-subscriptions">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="user-balance-subscription-card">
                <div className="user-balance-subscription-header">
                  <h3>Subscription #{subscription.subscription_number}</h3>
                  <span className={`user-balance-status user-balance-status-${subscription.status.toLowerCase()}`}>
                    {subscription.status}
                  </span>
                </div>

                <div className="user-balance-subscription-details">
                  <div className="user-balance-detail-row">
                    <span>Monthly Amount:</span>
                    <span className="user-balance-detail-value">₹{subscription.monthly_amount}</span>
                  </div>
                  <div className="user-balance-detail-row">
                    <span>Paid Months:</span>
                    <span className="user-balance-detail-value">
                      {subscription.paid_months_count || 0}/11
                    </span>
                  </div>
                  <div className="user-balance-detail-row">
                    <span>Next Payment:</span>
                    <span className="user-balance-detail-value">
                      Month {getNextPaymentMonth(subscription)}
                    </span>
                  </div>
                  <div className="user-balance-detail-row">
                    <span>Total Paid for this Subscription:</span>
                    <span className="user-balance-detail-value">
                      ₹{(parseFloat(subscription.total_paid_amount) || 0).toFixed(2)}
                    </span>
                  </div>
                  {canPayNextMonth(subscription) && (
                    <div className="user-balance-payment-section">
                      <button
                        className="user-balance-pay-btn"
                        onClick={() => handlePayNextMonth(subscription)}
                        title="Click to pay for the next month. You can only pay once per month."
                      >
                        Pay Month {getNextPaymentMonth(subscription)} - ₹{subscription.monthly_amount}
                      </button>
                      <p className="user-balance-payment-note">
                        Note: You can only pay for one month per month period.
                      </p>
                      {paymentMessage.show && (
                        <div className={`user-balance-payment-message user-balance-payment-message-${paymentMessage.type}`}>
                          {paymentMessage.text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBalance; 