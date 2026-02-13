import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GoldMineSubscription.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const GoldMineSubscription = () => {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [monthlyAmount, setMonthlyAmount] = useState(1);

  // Form data
  const [personalDetails, setPersonalDetails] = useState({
    fullName: user?.name || '',
    mobileNumber: user?.phone || '',
    apartmentHouseFlat: '',
    pincode: '',
    localityTown: '',
    streetColonyArea: '',
    cityDistrict: '',
    landmark: '',
    state: ''
  });

  const [nomineeDetails, setNomineeDetails] = useState({
    nomineeFullName: '',
    relationship: 'Daughter',
    nationality: 'Indian'
  });

  const [paymentMethod, setPaymentMethod] = useState('cards');

  // Check authentication
  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
  }, [user, token, navigate]);

  // Calculate amounts
  const totalAmount = monthlyAmount * 10;
  const discountAmount = monthlyAmount;
  const finalJewelleryValue = monthlyAmount * 11;

  // Create subscription manually (not automatically)
  const createSubscription = async () => {
    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/api/goldmine/create`, {
        monthlyAmount: parseInt(monthlyAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubscriptionId(response.data.data.subscriptionId);
        setCurrentStep(1); // Move to first step after creating subscription
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error creating subscription: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Next button
  const handleNext = async () => {
    try {
      setLoading(true);

      if (currentStep === 1) {
        // Save personal details
        const response = await axios.post(`${API_BASE_URL}/api/goldmine/personal-details`, {
          subscriptionId,
          ...personalDetails
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Save nominee details
        const response = await axios.post(`${API_BASE_URL}/api/goldmine/nominee-details`, {
          subscriptionId,
          ...nomineeDetails
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error saving details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Subscription ID:', subscriptionId);
      alert(`Error saving details: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Back button
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  // Update subscription status after payment
  const updateSubscriptionStatus = async (paymentId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/goldmine/update-payment-status`, {
        subscriptionId,
        paymentId,
        status: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Payment successful! Your subscription is now active.');
        navigate('/my-account');
      } else {
        alert('Payment successful but status update failed. Please contact support.');
        navigate('/my-account');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Payment successful but status update failed. Please contact support.');
      navigate('/my-account');
    }
  };

  // Handle payment
  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create Razorpay subscription
      const response = await axios.post(`${API_BASE_URL}/api/goldmine/create-razorpay`, {
        subscriptionId,
        paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Initialize Razorpay
        const options = {
          key: 'rzp_live_RepxCmn4eqow4z',
          amount: response.data.data.amount,
          currency: 'INR',
          order_id: response.data.data.razorpayOrderId,
          name: 'PVJ Gold Mine',
          description: `Gold Mine Subscription - ₹${monthlyAmount}/month`,
          handler: function (response) {
            // Update subscription status to active
            updateSubscriptionStatus(response.razorpay_payment_id);
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: personalDetails.mobileNumber
          },
          theme: {
            color: '#0E593C'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!user || !token) {
    return null;
  }

  // Show subscription creation form
  if (!subscriptionId) {
    return (
      <div className="goldmine-subscription-container">
        <div className="goldmine-subscription-header">
          <div className="goldmine-subscription-logo">PVJ</div>
          <div className="goldmine-subscription-user-info">
            <span>Hi, {user.name}</span>
            <div className="goldmine-subscription-security-badge">
              <span className="goldmine-subscription-lock-icon">🔒</span>
              <span>100% SECURE</span>
            </div>
          </div>
        </div>

        <div className="goldmine-subscription-content">
          <div className="goldmine-subscription-form-section">
            <div className="goldmine-subscription-step-content">
              <h2>Create Your Gold Mine Subscription</h2>
              <p>Choose your monthly installment amount to start your jewelry journey.</p>

              <div className="goldmine-subscription-form-group">
                <label>
                  <span className="icon">💰</span>
                  Monthly Installment Amount (₹)
                </label>
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="100000"
                  placeholder="Enter monthly amount"
                  className="goldmine-subscription-amount-input"
                />
                <small>Minimum amount: ₹1</small>
              </div>

              <div className="goldmine-subscription-subscription-summary">
                <h3>Subscription Summary</h3>
                <div className="goldmine-subscription-summary-item">
                  <span>Monthly Amount:</span>
                  <span>₹{monthlyAmount}</span>
                </div>
                <div className="goldmine-subscription-summary-item">
                  <span>Total Amount (10 months):</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="goldmine-subscription-summary-item">
                  <span>11th Month Discount:</span>
                  <span>₹{discountAmount}</span>
                </div>
                <div className="goldmine-subscription-summary-item total">
                  <span>Final Jewelry Value:</span>
                  <span>₹{finalJewelleryValue}</span>
                </div>
              </div>

              <button
                className="goldmine-subscription-create-subscription-btn"
                onClick={createSubscription}
                disabled={loading || monthlyAmount < 1}
              >
                {loading ? 'Creating Subscription...' : 'Create Subscription'}
              </button>
            </div>
          </div>

          <div className="goldmine-subscription-info-section">
            <h3>Why Choose Gold Mine Plan?</h3>
            <div className="goldmine-subscription-benefits">
              <div className="goldmine-subscription-benefit-item">
                <span className="goldmine-subscription-benefit-icon">🎁</span>
                <div>
                  <h4>11th Month Free</h4>
                  <p>Pay for 10 months, get the 11th month completely free!</p>
                </div>
              </div>
              <div className="goldmine-subscription-benefit-item">
                <span className="goldmine-subscription-benefit-icon">💎</span>
                <div>
                  <h4>Premium Jewelry</h4>
                  <p>Choose from our exclusive collection of premium jewelry.</p>
                </div>
              </div>
              <div className="goldmine-subscription-benefit-item">
                <span className="goldmine-subscription-benefit-icon">🔒</span>
                <div>
                  <h4>Secure Payments</h4>
                  <p>100% secure payment gateway with multiple payment options.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="goldmine-subscription-container">
      {/* Header */}
      <div className="goldmine-subscription-header">
        <div className="goldmine-subscription-logo">PVJ</div>
        <div className="goldmine-subscription-progress-bar">
          <div className={`goldmine-subscription-progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="goldmine-subscription-step-number">1</div>
            <div className="goldmine-subscription-step-label">Personal Details</div>
          </div>
          <div className={`goldmine-subscription-progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="goldmine-subscription-step-number">2</div>
            <div className="goldmine-subscription-step-label">Nominee Details</div>
          </div>
          <div className={`goldmine-subscription-progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="goldmine-subscription-step-number">3</div>
            <div className="goldmine-subscription-step-label">Payment Details</div>
          </div>
        </div>
        <div className="goldmine-subscription-user-info">
          <span>Hi, {user.name}</span>
          <div className="goldmine-subscription-security-badge">
            <span className="goldmine-subscription-lock-icon">🔒</span>
            <span>100% SECURE</span>
          </div>
        </div>
      </div>

      <div className="goldmine-subscription-content">
        {/* Left Column - Form */}
        <div className="goldmine-subscription-form-section">
          {currentStep === 1 && (
            <div className="goldmine-subscription-step-content">
              <h2>Personal Details</h2>
              <p>Kindly enter your personal details for the fields mentioned below.</p>

              <div className="goldmine-subscription-form-grid">
                <div className="goldmine-subscription-form-group">
                  <label>
                    <span className="icon">📧</span>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="goldmine-subscription-readonly-input"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>
                    <span className="icon">📱</span>
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    value={personalDetails.mobileNumber}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      mobileNumber: e.target.value
                    })}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>
                    <span className="icon">👤</span>
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={personalDetails.fullName}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      fullName: e.target.value
                    })}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>Apartment/House/Flat No.</label>
                  <input
                    type="text"
                    value={personalDetails.apartmentHouseFlat}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      apartmentHouseFlat: e.target.value
                    })}
                    placeholder="Enter apartment/house/flat number"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={personalDetails.pincode}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      pincode: e.target.value
                    })}
                    placeholder="Enter pincode"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>Locality/Town</label>
                  <input
                    type="text"
                    value={personalDetails.localityTown}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      localityTown: e.target.value
                    })}
                    placeholder="Enter locality/town"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>Street/Colony/Area Name</label>
                  <input
                    type="text"
                    value={personalDetails.streetColonyArea}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      streetColonyArea: e.target.value
                    })}
                    placeholder="Enter street/colony/area"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>City/District</label>
                  <input
                    type="text"
                    value={personalDetails.cityDistrict}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      cityDistrict: e.target.value
                    })}
                    placeholder="Enter city/district"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>Landmark (Optional)</label>
                  <input
                    type="text"
                    value={personalDetails.landmark}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      landmark: e.target.value
                    })}
                    placeholder="Enter landmark"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>State</label>
                  <select
                    value={personalDetails.state}
                    onChange={(e) => setPersonalDetails({
                      ...personalDetails,
                      state: e.target.value
                    })}
                  >
                    <option value="">Select State</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                  </select>
                </div>
              </div>

              <p className="goldmine-subscription-acknowledgement">
                By clicking Next, I hereby acknowledge that I am above 18 years old and I am resident of India.
              </p>

              <button
                className="goldmine-subscription-next-btn"
                onClick={handleNext}
                disabled={loading ||
                  !personalDetails.fullName ||
                  !personalDetails.mobileNumber ||
                  !personalDetails.apartmentHouseFlat ||
                  !personalDetails.pincode ||
                  !personalDetails.localityTown ||
                  !personalDetails.streetColonyArea ||
                  !personalDetails.cityDistrict ||
                  !personalDetails.state}
              >
                {loading ? 'Saving...' : 'NEXT'}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="goldmine-subscription-step-content">
              <h2>Nominee Details</h2>
              <p>Enter details of the person who can redeem the plan benefits in case of unforeseen circumstances.</p>

              <div className="goldmine-subscription-form-grid">
                <div className="goldmine-subscription-form-group">
                  <label>Nominee's Full Name</label>
                  <input
                    type="text"
                    value={nomineeDetails.nomineeFullName}
                    onChange={(e) => setNomineeDetails({
                      ...nomineeDetails,
                      nomineeFullName: e.target.value
                    })}
                    placeholder="Enter nominee's full name"
                  />
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>Relationship</label>
                  <select
                    value={nomineeDetails.relationship}
                    onChange={(e) => setNomineeDetails({
                      ...nomineeDetails,
                      relationship: e.target.value
                    })}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="goldmine-subscription-form-group">
                  <label>Nationality</label>
                  <select
                    value={nomineeDetails.nationality}
                    onChange={(e) => setNomineeDetails({
                      ...nomineeDetails,
                      nationality: e.target.value
                    })}
                  >
                    <option value="Indian">Indian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <p className="goldmine-subscription-acknowledgement">
                By clicking Next, I hereby acknowledge that nominee is above 18 years old.
              </p>

              <div className="goldmine-subscription-button-group">
                <button className="goldmine-subscription-back-btn" onClick={handleBack}>
                  BACK
                </button>
                <button
                  className="goldmine-subscription-next-btn"
                  onClick={handleNext}
                  disabled={loading || !nomineeDetails.nomineeFullName || !nomineeDetails.relationship}
                >
                  {loading ? 'Saving...' : 'NEXT'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="goldmine-subscription-step-content">
              <h2>Proceed to Payment</h2>
              <p>Click below to complete your subscription payment.</p>
              <div className="goldmine-subscription-button-group">
                <button className="goldmine-subscription-back-btn" onClick={handleBack}>
                  BACK
                </button>
                <button
                  className="goldmine-subscription-proceed-btn"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'PROCEED TO PAY'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="goldmine-subscription-summary-section">
          <h2>Subscription Summary</h2>
          <p>Kindly check your monthly subscription amount.</p>

          <div className="goldmine-subscription-summary-box">
            <div className="goldmine-subscription-summary-row">
              <span>Subscription Amount (Monthly)</span>
              <span>₹ {monthlyAmount.toLocaleString()}</span>
            </div>
            <div className="goldmine-subscription-summary-row">
              <span>You Pay</span>
              <span>₹ {monthlyAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="goldmine-subscription-contact-info">
            Any Questions? Please call us at <a href="tel:18004190066">18004190066</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldMineSubscription;