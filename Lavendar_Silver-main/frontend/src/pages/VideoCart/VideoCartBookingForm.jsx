import React, { useState, useEffect } from "react";
import { FaEnvelope, FaWhatsapp, FaUser, FaVideo, FaPhone } from 'react-icons/fa';
import { MdDateRange, MdNotes } from 'react-icons/md';
import './VideoCart.css';
import VideoCartStepper from './VideoCartStepper';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { useWishlistCart } from '../../context/wishlistCartContext';
import { useDynamicLinks } from '../../hooks/useDynamicLinks';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function getOrSetGuestId() {
  let guestId = null;
  document.cookie.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key === 'guest_id') guestId = value;
  });
  if (!guestId) {
    guestId = crypto.randomUUID();
    document.cookie = `guest_id=${guestId}; path=/; max-age=${60 * 60 * 24 * 365 * 10}`;
  }
  return guestId;
}

// Helper function to clean and format phone number
function formatPhoneNumber(phone) {
  if (!phone) return '+91';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove +91 if it exists at the start
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  
  // Extract only the 10 digits
  const digits = cleaned.replace(/\D/g, '').slice(0, 10);
  
  // Return formatted as +91XXXXXXXXXX
  return digits.length === 10 ? `+91${digits}` : '+91';
}

const VideoCartBookingForm = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user, token } = useUser();
  const { videoCart } = useWishlistCart();
  const { links } = useDynamicLinks();
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

  // Initialize form with user data if available
  const [form, setForm] = useState(() => {
    // Get user data from localStorage if available
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      email: userData.email || '',
      whatsapp: userData.phone ? formatPhoneNumber(userData.phone) : '+91',
      name: userData.name || '',
      notes: '',
      consultation_date: today, // Set default to today's date
      consultation_time: '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Update form when user data changes
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData && userData.id) {
      setForm(prev => ({
        ...prev,
        email: userData.email || prev.email,
        name: userData.name || prev.name,
        whatsapp: userData.phone ? formatPhoneNumber(userData.phone) : prev.whatsapp
      }));
    }
  }, [user]);

  // Dummy member check: Only allow WhatsApp numbers starting with '+91' and 10 digits after
  const isValidMember = (number) => {
    const regex = /^\+91\d{10}$/;
    return regex.test(number);
  };



  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for WhatsApp number field
    if (name === 'whatsapp') {
      // Allow user to type, but format on blur
      // Prevent invalid characters while typing
      let cleaned = value;
      
      // If user is typing, allow +91 prefix and digits
      if (value.startsWith('+91')) {
        // Extract digits after +91
        const digits = value.substring(3).replace(/\D/g, '').slice(0, 10);
        cleaned = `+91${digits}`;
      } else if (value.startsWith('91') && value.length > 2) {
        // If starts with 91, add + and limit to 10 digits
        const digits = value.substring(2).replace(/\D/g, '').slice(0, 10);
        cleaned = `+91${digits}`;
      } else if (value.startsWith('+')) {
        // If starts with + but not +91, keep as is (user might be editing)
        cleaned = value;
      } else {
        // Extract only digits and limit to 10, then add +91
        const digits = value.replace(/\D/g, '').slice(0, 10);
        cleaned = digits.length > 0 ? `+91${digits}` : '+91';
      }
      
      setForm(prev => ({ ...prev, [name]: cleaned }));
    } else {
      // For other fields, just update normally
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.whatsapp || !form.name) {
      showNotification('All fields are required.', 'error');
      return;
    }
    if (!isValidMember(form.whatsapp)) {
      showNotification('Only valid jewelry members can book. Enter WhatsApp as +91XXXXXXXXXX.', 'error');
      return;
    }

    // Validate consultation date before submitting
    if (!form.consultation_date) {
      showNotification('Please select a consultation date.', 'error');
      return;
    }

    const selectedDate = new Date(form.consultation_date);
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(selectedDate.getTime())) {
      showNotification('Please enter a valid date.', 'error');
      return;
    }

    // Prevent past dates
    if (selectedDate < todayDate) {
      showNotification('You cannot select a past date. Please choose today or a future date.', 'error');
      setForm(prev => ({ ...prev, consultation_date: today }));
      return;
    }

    // Prevent Sundays
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0) {
      showNotification('Video consultations are not available on Sundays. Please select another date.', 'error');
      // Set to next Monday if Sunday is selected
      const nextMonday = new Date(selectedDate);
      nextMonday.setDate(selectedDate.getDate() + 1);
      setForm(prev => ({ ...prev, consultation_date: nextMonday.toISOString().split('T')[0] }));
      return;
    }

    // Validate consultation time
    if (!form.consultation_time) {
      showNotification('Please select a consultation time.', 'error');
      return;
    }

    const [hours] = form.consultation_time.split(':');
    const hour = parseInt(hours, 10);
    if (hour < 10 || hour >= 19) {
      showNotification('Please select a time between 10 AM and 7 PM.', 'error');
      return;
    }
    setLoading(true);
    try {
      let payload = {
        ...form,
        whatsapp_number: form.whatsapp,
        admin_notes: form.notes,
        cart_snapshot: videoCart
      };

      // Ensure we have the guest_id cookie set
      getOrSetGuestId();

      let response;
      if (user && token) {
        // Logged-in user
        response = await axios.post(`${API_BASE_URL}/api/video-consultation/request`, payload, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true // Important for cookies
        });
      } else {
        // Guest user
        response = await axios.post(`${API_BASE_URL}/api/video-consultation/request`, payload, {
          withCredentials: true // Important for cookies
        });
      }

      setPendingEmail(form.email);
      setShowOtpInput(true);
      showNotification('OTP sent to your Email. Please enter OTP to confirm booking.', 'info');
    } catch (err) {
      console.error('Booking error:', err);
      showNotification('Backend error: ' + (err.response?.data?.message || 'Please try again later.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      showNotification('Please enter the OTP.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/video-consultation/verify-otp`, {
        email: pendingEmail,
        otp
      }, {
        withCredentials: true // Important for cookies
      });
      if (res.data.success) {
        showNotification('Booking confirmed! Redirecting...', 'success');
        setShowOtpInput(false);
        setTimeout(() => navigate('/video-cart/thankyou'), 1200);
      } else {
        showNotification(res.data.message || 'OTP verification failed.', 'error');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      showNotification('OTP verification failed: ' + (err.response?.data?.message || 'Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <VideoCartStepper activeStep={1} />
      <div className="videocart-bookingform-wrapper">
        <div className="videocart-bookingform">
          <h2 className="videocart-bookingform-title">Enter your details</h2>
          <div className="videocart-bookingform-sub">Booking Information</div>
          <form className="videocart-bookingform-fields" onSubmit={handleSubmit}>
            <div className="videocart-bookingform-row">
              <div className="videocart-bookingform-field">
                <span className="videocart-bookingform-icon"><FaUser /></span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="videocart-bookingform-row">
              <div className="videocart-bookingform-field">
                <span className="videocart-bookingform-icon"><FaEnvelope /></span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="videocart-bookingform-row">
              <div className="videocart-bookingform-field">
                <span className="videocart-bookingform-icon"><FaWhatsapp /></span>
                <input
                  type="text"
                  name="whatsapp"
                  placeholder={`WhatsApp Number (e.g. ${links.whatsapp})`}
                  value={form.whatsapp}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="videocart-bookingform-row">
              <div className="videocart-bookingform-field">
                <span className="videocart-bookingform-icon"><MdDateRange /></span>
                <input
                  type="date"
                  name="consultation_date"
                  value={form.consultation_date}
                  onChange={handleChange}
                  min={today}
                  required
                  style={{ cursor: 'text' }}
                />

              </div>
              <div className="videocart-bookingform-field">
                <span className="videocart-bookingform-icon"><MdDateRange /></span>
                <input
                  type="time"
                  name="consultation_time"
                  value={form.consultation_time}
                  onChange={handleChange}
                  min="10:00"
                  max="19:00"
                  required
                  title="Select time between 10 AM and 7 PM"
                />
              </div>
            </div>
            <div className="videocart-bookingform-row">
              <div className="videocart-bookingform-field" style={{ width: '100%', padding: 0 }}>
                <textarea name="notes" placeholder="Message/Notes for admin (optional)" value={form.notes} onChange={handleChange} style={{ width: '100%' }} />
              </div>
            </div>
            <button className="videocart-bookingform-btn" type="submit" disabled={loading}>
              <FaVideo style={{ marginRight: 8 }} /> {loading ? 'Booking...' : 'Book Video Call'}
            </button>
          </form>
          {showOtpInput && (
            <div className="otp-modal-overlay">
              <div className="otp-modal-content">
                <button type="button" className="otp-modal-close" onClick={() => setShowOtpInput(false)}>&times;</button>
                <form className="otp-form" onSubmit={handleOtpSubmit} style={{ marginTop: 0 }}>
                  <label htmlFor="otp" style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>Enter OTP sent to Email:</label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="otp-input"
                    style={{ width: '100%', padding: 8, marginBottom: 12, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
                  />
                  <button type="submit" className="otp-btn" disabled={loading} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#16784f', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VideoCartBookingForm;