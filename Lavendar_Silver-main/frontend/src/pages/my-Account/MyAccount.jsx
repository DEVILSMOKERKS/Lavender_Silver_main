import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import icon1 from '../../assets/img/icons/user 5.png';
import icon2 from '../../assets/img/icons/return 1.png';
import icon3 from '../../assets/img/icons/invoice 1.png';
import icon4 from '../../assets/img/icons/discount 2.png';
import icon5 from '../../assets/img/icons/support1.png';
import icon6 from '../../assets/img/icons/rupees.png';
import icon7 from '../../assets/img/icons/ring 1.png';
import { Video } from 'lucide-react';
import star from '../../assets/img/icons/star2.png';
import edit from '../../assets/img/icons/editing 1.png';
import boxIcon from '../../assets/img/icons/package2.png';
import viewIcon from '../../assets/img/icons/vision.png';
import cartPlusIcon from '../../assets/img/icons/cartPlus.png';
import productImg from '../../assets/img/signatureImg.png';
import './myAccount.css';
import { UserContext } from '../../context/UserContext';
import { useWishlistCart } from '../../context/wishlistCartContext';
import InvoicesAndCertifications from './InvoicesAndCertifications';
import OffersAndDiscounts from './OffersAndDiscounts';
import HelpAndSupport from './HelpAndSupport';
import UserBalance from './UserBalance';
import DigitalGold from './DigitalGold';
import CustomJewelryRequests from './CustomJewelryRequests';
import UserVideoConsultations from './UserVideoConsultations';
import axios from 'axios';
import countryData from 'country-telephone-data';
import { useNotification } from '../../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;


const menuItems = [
  { label: 'My Profile', to: '/profile', icon: icon1 },
  { label: 'Orders', to: '/orders', icon: icon2 },
  { label: 'Digital Gold', to: '/digital-gold', icon: icon6 },
  { label: 'Custom Jewelry', to: '/custom-jewelry-requests', icon: icon7 },
  { label: 'Invoices & Certifications', to: '/invoices', icon: icon3 },
  { label: 'Offers & Discounts', to: '/offers', icon: icon4 },
  { label: 'Help & Support', to: '/support', icon: icon5 },
  { label: 'Balance & Payments', to: '/balance', icon: icon6 },
  { label: 'Video Consultation', to: '/video-cart/booking', icon: null, isVideoConsultation: true },
];

// Error boundary for MyAccountForm
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <div>Something went wrong in your profile form.</div>;
  return children;
}


const getCountryByIso2 = (iso2) => {
  return countryData.allCountries.find(c => c.iso2 === iso2) || countryData.allCountries.find(c => c.iso2 === 'in');
};

const parsePhone = (phone) => {
  if (!phone) return { country: 'in', number: '' };
  // Try to match country code
  const match = countryData.allCountries.find(c => phone.startsWith('+' + c.dialCode));
  if (match) {
    return {
      country: match.iso2,
      number: phone.replace('+' + match.dialCode, ''),
    };
  }
  return { country: 'in', number: phone };
};

// GeoDB API functions - These will be defined inside the MyAccountForm component

const MyAccountForm = ({
  form, setForm, isEditing, setIsEditing, hasChanged, setHasChanged, loading, setLoading, user, setUser, showSuccess
}) => {
  if (!form) return <div>Loading...</div>;
  const { token } = useContext(UserContext);
  // Country/phone state
  const [country, setCountry] = useState('in');
  const [localNumber, setLocalNumber] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Address fields state
  const [addressFields, setAddressFields] = useState({
    country: '',
    state: '',
    city: '',
    place: '',
    pincode: ''
  });

  // States for dropdown options
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countryAddressDropdownOpen, setCountryAddressDropdownOpen] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [addressCountrySearch, setAddressCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const countryAddressDropdownRef = useRef(null);

  useEffect(() => {
    // Parse phone to set country and number
    const parsed = parsePhone(user?.phone || '');
    setCountry(parsed.country);
    setLocalNumber(parsed.number);
    // Clean phone number - remove +91 prefix if present and keep only 10 digits
    let cleanPhone = user?.phone || '';
    if (cleanPhone) {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length > 10 && digits.startsWith('91')) {
        cleanPhone = digits.substring(2);
      } else if (digits.length === 10) {
        cleanPhone = digits;
      } else {
        cleanPhone = digits;
      }
    }
    setForm(f => ({ ...f, phone: cleanPhone }));
    setIsEditing(false);
    setHasChanged(false);
    setCountrySearch('');

    // Parse address if it exists
    if (user?.address && typeof user.address === 'object') {
      setAddressFields({
        country: user.address.country || '',
        state: user.address.state || '',
        city: user.address.city || '',
        place: user.address.place || '',
        pincode: user.address.pincode || ''
      });
    } else if (user?.address && typeof user.address === 'string') {
      // Try to parse string address if it's in JSON format
      try {
        const parsedAddress = JSON.parse(user.address);
        if (typeof parsedAddress === 'object') {
          setAddressFields({
            country: parsedAddress.country || '',
            state: parsedAddress.state || '',
            city: parsedAddress.city || '',
            place: parsedAddress.place || '',
            pincode: parsedAddress.pincode || ''
          });
        }
      } catch (e) {
        // If not in JSON format, keep as is
        setAddressFields({
          country: '',
          state: '',
          city: '',
          place: user?.address || '',
          pincode: ''
        });
      }
    }

    // Load countries on component mount
    // loadCountries(); // Removed
  }, [user]);

  useEffect(() => {
    const countryObj = getCountryByIso2(country);
    if (countryObj) {
      const full = localNumber ? `+${countryObj.dialCode}${localNumber}` : '';
      setForm(f => ({ ...f, phone: full }));
    }
  }, [country, localNumber]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
        setStateDropdownOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setCityDropdownOpen(false);
      }
      if (countryAddressDropdownRef.current && !countryAddressDropdownRef.current.contains(event.target)) {
        setCountryAddressDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, stateDropdownOpen, cityDropdownOpen, countryAddressDropdownOpen]);

  // Fetch states when country changes
  useEffect(() => {
    if (addressFields.country) {
      // loadStates(addressFields.country); // Removed
    }
  }, [addressFields.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (addressFields.state && addressFields.country) {
      // loadCities(addressFields.state, addressFields.country); // Removed
    }
  }, [addressFields.state, addressFields.country]);

  // Clear search terms when dropdowns close
  useEffect(() => {
    if (!countryAddressDropdownOpen) {
      setAddressCountrySearch('');
    }
  }, [countryAddressDropdownOpen]);

  useEffect(() => {
    if (!stateDropdownOpen) {
      setStateSearch('');
    }
  }, [stateDropdownOpen]);

  useEffect(() => {
    if (!cityDropdownOpen) {
      setCitySearch('');
    }
  }, [cityDropdownOpen]);

  const handleCountryChange = (iso2) => {
    setCountry(iso2);
    setHasChanged(true);
    setDropdownOpen(false);
    setCountrySearch('');
  };

  const handleNumberChange = (e) => {
    setLocalNumber(e.target.value.replace(/\D/g, ''));
    setHasChanged(true);
  };

  const handleCountrySearch = (e) => {
    setCountrySearch(e.target.value);
  };

  // Filtered country list
  const filteredCountries = countrySearch.length < 1
    ? countryData.allCountries
    : countryData.allCountries.filter(c =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch.replace('+', ''))
    );

  const countryObj = getCountryByIso2(country);
  const selectedLabel = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      <img
        src={`https://flagcdn.com/24x18/${countryObj.iso2.toLowerCase()}.png`}
        alt={countryObj.iso2}
        style={{ width: 24, height: 18, borderRadius: 2 }}
      />
      <span style={{ fontWeight: 600, fontSize: 16 }}>+{countryObj.dialCode}</span>
    </span>
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      const changed = Object.keys(updated).some(
        (key) => (user?.[key] || '') !== updated[key]
      );
      setHasChanged(changed);
      return updated;
    });
  };

  const handleAddressFieldChange = (field, value) => {
    setAddressFields(prev => {
      const updated = { ...prev, [field]: value };

      // Update the main form with the structured address
      setForm(prevForm => {
        const updatedForm = {
          ...prevForm,
          address: JSON.stringify(updated)
        };

        // Compare address properly - handle JSON string comparison
        const currentAddress = typeof user?.address === 'object'
          ? JSON.stringify(user.address)
          : (user?.address || '');
        const addressChanged = currentAddress !== updatedForm.address;

        // Check other fields for changes
        const otherFieldsChanged = Object.keys(updatedForm).some(
          (key) => key !== 'address' && (user?.[key] || '') !== updatedForm[key]
        );

        setHasChanged(addressChanged || otherFieldsChanged);

        return updatedForm;
      });

      return updated;
    });
  };

  // Password change handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const handlePasswordUpdate = async () => {
    setPasswordError('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/users/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        showSuccess('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordChange(false);
      } else {
        setPasswordError(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Country list for address
  const countryList = [
    { id: 'in', name: 'India' },
    { id: 'us', name: 'United States' },
    { id: 'uk', name: 'United Kingdom' },
    { id: 'ca', name: 'Canada' },
    { id: 'au', name: 'Australia' },
  ];

  return (
    <div className="myaccount_form_wrapper">
      <div className="myaccount_form_row">
        <div className="myaccount_form_group">
          <label htmlFor="name">Full name*</label>
          <input
            id="name"
            type="text"
            name="name"
            value={form?.name || ""}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder="Jay Sharma"
            autoComplete="name"
          />
        </div>
        <div className="myaccount_form_group">
          <label htmlFor="phone">Phone Number*</label>
          <div className="myaccount_phone_input" style={{ display: 'flex', alignItems: 'center' }}>
            {/* Custom country code dropdown */}
            <div
              ref={dropdownRef}
              style={{ position: 'relative', minWidth: 'min-content', width: 'min-content', marginRight: 6 }}
            >
              <div
                className="country-select-value"
                style={{
                  border: 'none',
                  padding: '4px 8px',
                  cursor: isEditing && !user?.phone ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  fontSize: 15,
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  borderRight: '1px solid #e0e0e0',
                  width: "max-content",
                }}
                onClick={() => {
                  if (isEditing && !user?.phone) setDropdownOpen(v => !v);
                }}
              >
                {selectedLabel}
              </div>
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 1000,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    width: 220,
                    maxHeight: 260,
                    overflowY: 'auto',
                    marginTop: 2,
                  }}
                >
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={handleCountrySearch}
                    placeholder="Search country..."
                    style={{
                      width: '95%',
                      margin: 6,
                      padding: 4,
                      border: '1px solid #eee',
                      borderRadius: 3,
                      fontSize: 14,
                    }}
                    autoFocus
                  />
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {filteredCountries.map(c => (
                      <div
                        key={c.iso2}
                        style={{
                          padding: '6px 10px',
                          cursor: 'pointer',
                          background: c.iso2 === country ? '#f0f0f0' : '#fff',
                          fontWeight: c.iso2 === country ? 600 : 400,
                        }}
                        onClick={() => handleCountryChange(c.iso2)}
                      >
                        {c.name} (+{c.dialCode})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={localNumber}
              onChange={handleNumberChange}
              readOnly={!isEditing || !!user?.phone}
              placeholder="1234567890"
              autoComplete="tel"
              style={{ width: 120, outline: "none", border: "none" }}
            />
          </div>
        </div>
      </div>
      <div className="myaccount_form_row">
        <div className="myaccount_form_group">
          <label htmlFor="email">Email ID*</label>
          <input
            id="email"
            type="email"
            name="email"
            value={form?.email || ""}
            onChange={handleChange}
            readOnly={!isEditing || !!user?.email}
            placeholder="Jay Sharma@gmail.com"
            autoComplete="email"
            className="myaccount_form_input"
          />
        </div>
      </div>

      {/* Address Fields */}
      <div className="myaccount_address_section">
        <h3 className="myaccount_address_heading">Address Details</h3>

        <div className="myaccount_form_row">
          {/* Country Input */}
          <div className="myaccount_form_group">
            <label htmlFor="country">Country*</label>
            <input id="country" type="text" name="country" value={addressFields.country} onChange={e => handleAddressFieldChange('country', e.target.value)} readOnly={!isEditing} placeholder="Country*" className="myaccount_form_input" />
          </div>

          {/* State Input */}
          <div className="myaccount_form_group">
            <label htmlFor="state">State*</label>
            <input id="state" type="text" name="state" value={addressFields.state} onChange={e => handleAddressFieldChange('state', e.target.value)} readOnly={!isEditing} placeholder="State*" className="myaccount_form_input" />
          </div>
        </div>

        <div className="myaccount_form_row">
          {/* City Input */}
          <div className="myaccount_form_group">
            <label htmlFor="city">City*</label>
            <input id="city" type="text" name="city" value={addressFields.city} onChange={e => handleAddressFieldChange('city', e.target.value)} readOnly={!isEditing} placeholder="City*" className="myaccount_form_input" />
          </div>

          {/* Pincode Input */}
          <div className="myaccount_form_group">
            <label htmlFor="pincode">Pincode*</label>
            <input
              id="pincode"
              type="text"
              value={addressFields.pincode || ""}
              onChange={(e) => handleAddressFieldChange('pincode', e.target.value)}
              readOnly={!isEditing}
              placeholder="Enter Pincode"
              className="myaccount_form_input"
              maxLength={6}
            />
          </div>
        </div>

        {/* Place/Address Input */}
        <div className="myaccount_form_row">
          <div className="myaccount_form_group">
            <label htmlFor="place">Address/Locality*</label>
            <textarea
              id="place"
              value={addressFields.place || ""}
              onChange={(e) => handleAddressFieldChange('place', e.target.value)}
              readOnly={!isEditing}
              placeholder="House/Flat No., Building, Street, Area"
              className="myaccount_form_textarea"
              rows={3}
            />
          </div>
        </div>
      </div>
      <div className="myaccount_form_row">
        <div className="myaccount_form_group">
          <label htmlFor="dob">Your Birthday*</label>
          <input
            type="date"
            name="dob"
            value={form?.dob ? form.dob.substring(0, 10) : ''}
            onChange={handleChange}
            disabled={!isEditing}
            max={new Date().toISOString().split('T')[0]}
            className="myaccount_form_input"
          />
        </div>
        <div className="myaccount_form_group">
          <label htmlFor="anniversary">Your Anniversary*</label>
          <input
            type="date"
            name="anniversary"
            value={form?.anniversary ? form.anniversary.substring(0, 10) : ''}
            onChange={handleChange}
            disabled={!isEditing}
            max={new Date().toISOString().split('T')[0]}
            className="myaccount_form_input"
          />
        </div>
      </div>

      {/* Password Change Section */}
      <div className="myaccount_form_row" style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #e9ecef' }}>
        <div className="myaccount_form_group" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <label style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Change Password</label>
            <button
              type="button"
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setPasswordError('');
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
              }}
              style={{
                padding: '8px 16px',
                background: showPasswordChange ? '#dc3545' : '#7c2d4a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {passwordError && (
                <div style={{
                  padding: '10px',
                  background: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  {passwordError}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Current Password*
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="myaccount_form_input"
                />
              </div>

              <div>
                <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  New Password*
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min 8 characters)"
                  className="myaccount_form_input"
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '12px' }}>
                  Must be at least 8 characters and include uppercase, lowercase, number, and special character
                </small>
              </div>

              <div>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Confirm New Password*
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="myaccount_form_input"
                />
              </div>

              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={passwordLoading}
                style={{
                  padding: '12px 24px',
                  background: passwordLoading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  alignSelf: 'flex-start',
                  minWidth: '150px'
                }}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Dynamic order card component
const OrdersCardList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reorderingOrder, setReorderingOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const { token } = useContext(UserContext);
  const { addToCart } = useWishlistCart();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          setError('Please login to view your orders');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/orders/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (err.response?.status === 401) {
          setError('Please login to view your orders');
        } else {
          setError('Failed to load orders. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const resolveImage = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = API_BASE_URL.replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#7B2B37';
      case 'processing':
        return '#FF6B35';
      case 'shipped':
        return '#2E86AB';
      case 'cancelled':
        return '#D62828';
      default:
        return '#666';
    }
  };

  const getStatusBg = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#F5E6EA';
      case 'processing':
        return '#FFF3E0';
      case 'shipped':
        return '#E3F2FD';
      case 'cancelled':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  const handleViewDetails = async (order) => {
    try {
      setLoadingDetails(true);
      setSelectedOrder(order);

      const response = await axios.get(`${API_BASE_URL}/api/orders/${order.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOrderDetails(response.data.data);
      } else {
        setError('Failed to load order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  const handleReorder = async (order) => {
    try {
      setReorderingOrder(order.id);

      // Fetch order details to get the items
      const response = await axios.get(`${API_BASE_URL}/api/orders/${order.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data.items) {
        const items = response.data.data.items;

        // Add each item to cart
        for (const item of items) {
          // Fetch product details to get complete product information
          const productResponse = await axios.get(`${API_BASE_URL}/api/products/${item.product_id}`);

          if (productResponse.data.success) {
            const product = productResponse.data.data;

            // Prepare product data for cart
            const productForCart = {
              id: product.id,
              name: product.item_name,
              image: product.images?.[0]?.image_url
                ? `${API_BASE_URL}${product.images[0].image_url}`
                : productImg,
              quantity: item.quantity,
              selected_size: item.size || "",
              selected_weight: item.weight || "",
              selected_metal_type: item.metal_type || "",
              selected_diamond_quality: item.quality || "",
              custom_price: item.price || product.value || "",
              product_id: product.id
            };

            await addToCart(productForCart, false); // Don't show notification for each item
          }
        }

        showNotification(`Added ${items.length} item(s) from order #${order.order_number} to cart`, 'success');
        navigate('/carts'); // Redirect to cart page
      } else {
        showNotification('Failed to reorder items', 'error');
      }
    } catch (err) {
      console.error('Error reordering:', err);
      showNotification('Failed to reorder items', 'error');
    } finally {
      setReorderingOrder(null);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel order #${order.order_number}?`)) {
      return;
    }

    try {
      setCancellingOrder(order.id);

      const response = await axios.put(
        `${API_BASE_URL}/api/orders/${order.id}`,
        { order_status: 'cancelled' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification('Order cancelled successfully', 'success');
        // Refresh orders list
        const refreshResponse = await axios.get(`${API_BASE_URL}/api/orders/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (refreshResponse.data.success) {
          setOrders(refreshResponse.data.data);
        }
      } else {
        showNotification(response.data.message || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showNotification(err.response?.data?.message || 'Failed to cancel order. Please try again.', 'error');
    } finally {
      setCancellingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="orders_container_loading">
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: '16px', color: '#0E593C' }}>
            Loading your orders...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders_container_error">
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#D62828',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #ffcdd2'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0E593C',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders_container_empty">
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', color: '#0E593C' }}>
            No Orders Yet
          </div>
          <div style={{ fontSize: '14px' }}>
            Start shopping to see your orders here!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders_container_main">
      {orders.map((order, idx) => (
        <div className="orders_card" key={order.id || idx}>
          {/* Left Section */}
          <div className="orders_card_left">
            <div className="orders_card_iconwrap">
              <img src={boxIcon} alt="box" className="orders_card_icon" loading="lazy" decoding="async" />
            </div>
            <div className="orders_card_info">
              <div className="orders_card_id_status">
                <span className="orders_card_id">#{order.order_number}</span>
                <span
                  className="orders_card_status"
                  style={{
                    backgroundColor: getStatusBg(order.order_status),
                    color: getStatusColor(order.order_status)
                  }}
                >
                  <span className="orders_card_status_tick">✔</span> {order.order_status}
                </span>
              </div>
              <div className="orders_card_item">
                {order.item_count} Item{order.item_count > 1 ? 's' : ''} · {order.product_names || 'Products'}
              </div>
              <div className="orders_card_date">Ordered On {formatDate(order.created_at)}</div>
            </div>
          </div>
          {/* Right Section */}
          <div className="orders_card_right">
            <div className="orders_card_amount">{formatAmount(order.total_amount)}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* View Details Button - Icon Only */}
              <button
                className="orders_card_btn"
                onClick={() => handleViewDetails(order)}
                disabled={loadingDetails}
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                  height: '40px',
                  transition: 'all 0.2s ease'
                }}
                title="View Details"
                onMouseEnter={(e) => {
                  e.target.style.background = '#e9ecef';
                  e.target.style.borderColor = '#dee2e6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8f9fa';
                  e.target.style.borderColor = '#e9ecef';
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#666',
                  fontWeight: 'bold'
                }}>
                  👁
                </div>
              </button>

              {/* Cancel Order Button - Only show if order can be cancelled */}
              {order.order_status?.toLowerCase() !== 'cancelled' && 
               order.order_status?.toLowerCase() !== 'delivered' && (
                <button
                  onClick={() => handleCancelOrder(order)}
                  disabled={cancellingOrder === order.id}
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    cursor: cancellingOrder === order.id ? 'not-allowed' : 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                    height: '40px',
                    transition: 'all 0.2s ease',
                    backgroundColor: cancellingOrder === order.id ? '#e9ecef' : '#f8f9fa',
                    opacity: cancellingOrder === order.id ? 0.6 : 1
                  }}
                  title="Cancel Order"
                  onMouseEnter={(e) => {
                    if (cancellingOrder !== order.id) {
                      e.target.style.background = '#ffebee';
                      e.target.style.borderColor = '#ffcdd2';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cancellingOrder !== order.id) {
                      e.target.style.background = '#f8f9fa';
                      e.target.style.borderColor = '#e9ecef';
                    }
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: '#D62828',
                    fontWeight: 'bold'
                  }}>
                    ✕
                  </div>
                </button>
              )}

              {/* Reorder Button */}
              <button
                onClick={() => handleReorder(order)}
                disabled={reorderingOrder === order.id}
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                  height: '40px',
                  transition: 'all 0.2s ease',
                  backgroundColor: reorderingOrder === order.id ? '#e9ecef' : '#f8f9fa'
                }}
                title="Reorder"
                onMouseEnter={(e) => {
                  if (reorderingOrder !== order.id) {
                    e.target.style.background = '#e9ecef';
                    e.target.style.borderColor = '#dee2e6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (reorderingOrder !== order.id) {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.borderColor = '#e9ecef';
                  }
                }}
              >
                <img
                  src={cartPlusIcon}
                  alt="reorder"
                  style={{
                    width: '20px',
                    height: '20px',
                    opacity: reorderingOrder === order.id ? 0.6 : 1
                  }}
                  loading="lazy"
                />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Order Details Modal - Invoice Style */}
      {selectedOrder && (
        <div className="order-details-overlay" onClick={closeOrderDetails}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-details-header">
              <h2>Order Details - {orderDetails?.order_number || selectedOrder?.order_number || 'Order'}</h2>
              <button className="order-details-close-btn" onClick={closeOrderDetails}>
                ×
              </button>
            </div>

            <div className="order-details-content">
              {loadingDetails ? (
                <div className="order-details-loading">
                  <div>Loading order details...</div>
                </div>
              ) : orderDetails ? (
                <>
                  {/* Header Section */}
                  <div className="order-details-header-section">
                    <div className="order-details-logo">PVJ JEWELRY</div>
                    <div className="order-details-title">ORDER DETAILS</div>
                    <div className="order-details-subtitle">Professional Jewelry & Accessories</div>
                  </div>

                  {/* Order Info Section */}
                  <div className="order-details-info-section">
                    <div className="order-details-customer-info">
                      <div className="order-details-info-title">Order Information</div>
                      <div className="order-details-info-content">
                        <div><strong>Order Number:</strong> {orderDetails.order_number || '-'}</div>
                        <div><strong>Order ID:</strong> {orderDetails.id || '-'}</div>
                        <div><strong>Date:</strong> {formatDate(orderDetails.created_at)}</div>
                        <div><strong>Time:</strong> {formatTime(orderDetails.created_at)}</div>
                        <div><strong>Status:</strong>
                          <span className="order-details-status-badge" style={{
                            backgroundColor: getStatusBg(orderDetails.order_status),
                            color: getStatusColor(orderDetails.order_status),
                          }}>
                            {orderDetails.order_status || '-'}
                          </span>
                        </div>
                        <div><strong>Payment Status:</strong> {orderDetails.payment_status || '-'}</div>
                        <div><strong>Payment Method:</strong> {orderDetails.payment_method || '-'}</div>
                      </div>
                    </div>

                    <div className="order-details-shipping-info">
                      <div className="order-details-info-title">Shipping Address</div>
                      <div className="order-details-info-content">
                        <div>{orderDetails.shipping_address || '-'}</div>
                        <div>{orderDetails.shipping_city || ''}{orderDetails.shipping_city && orderDetails.shipping_state ? ', ' : ''}{orderDetails.shipping_state || ''}</div>
                        <div>{orderDetails.shipping_country || ''} {orderDetails.shipping_postal_code ? `- ${orderDetails.shipping_postal_code}` : ''}</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div className="order-details-items-section">
                      <h3 className="order-details-items-title">Order Items</h3>
                      <div className="order-details-table-wrapper">
                        <table className="order-details-items-table">
                          <thead>
                            <tr>
                              <th>Image</th>
                              <th>Product</th>
                              <th>SKU</th>
                              <th>Size</th>
                              <th>Weight</th>
                              <th>Qty</th>
                              <th>Rate</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderDetails.items.map((item, index) => {
                              const price = Number(item?.price || item?.custom_price || item?.product_rate || 0);
                              const lineTotal = price * (item.quantity || 1);
                              const image = item?.product_image ? resolveImage(item.product_image) : null;
                              const productName = item?.product_name || item?.item_name || 'Product';
                              const productSku = item?.product_sku || item?.sku || '-';

                              return (
                                <tr key={item?.id || index}>
                                  <td>
                                    {image ? (
                                      <img
                                        src={image}
                                        alt={productName}
                                        className="order-details-item-image"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          const placeholder = e.target.nextElementSibling;
                                          if (placeholder) placeholder.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="order-details-item-placeholder" style={{ display: image ? 'none' : 'flex' }}>
                                      No Image
                                    </div>
                                  </td>
                                  <td>
                                    <div className="order-details-product-name">{productName}</div>
                                    {item?.metal_type && <div className="order-details-product-meta">Metal: {item.metal_type}</div>}
                                    {item?.quality && <div className="order-details-product-meta">Quality: {item.quality}</div>}
                                  </td>
                                  <td>{productSku}</td>
                                  <td>{item?.size || '-'}</td>
                                  <td>{item?.weight ? `${item.weight}${item.weight_unit || ' g'}` : '-'}</td>
                                  <td>{item.quantity || 1}</td>
                                  <td>{formatCurrency(price)}</td>
                                  <td>{formatCurrency(lineTotal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Total Section */}
                  <div className="order-details-total-section">
                    <div className="order-details-total-row">
                      <span className="order-details-total-label">Subtotal:</span>
                      <span className="order-details-total-value">{formatCurrency(orderDetails.total_amount || 0)}</span>
                    </div>
                    {orderDetails.cod_charge && Number(orderDetails.cod_charge) > 0 && (
                      <div className="order-details-total-row">
                        <span className="order-details-total-label">COD Charge:</span>
                        <span className="order-details-total-value">{formatCurrency(orderDetails.cod_charge)}</span>
                      </div>
                    )}
                    <div className="order-details-total-row order-details-grand-total">
                      <span className="order-details-total-label">Grand Total:</span>
                      <span className="order-details-total-value">
                        {formatCurrency((Number(orderDetails.total_amount || 0) + Number(orderDetails.cod_charge || 0)))}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="order-details-error">
                  Failed to load order details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MyAccount = () => {
  const { user, setUser } = useContext(UserContext);
  const location = useLocation();
  const userName = user?.name || 'User';
  const [selectedMenu, setSelectedMenu] = useState(() => {
    // Check URL hash first, then localStorage, then default
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'orders') {
      return 'Orders';
    }
    const savedMenu = localStorage.getItem('myAccountSelectedMenu');
    if (savedMenu === 'Orders') {
      return 'Orders';
    }
    return savedMenu ? savedMenu : menuItems[0].label;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMenuContentMobile, setShowMenuContentMobile] = useState(false);

  // Handle hash navigation on mount and hash change
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'orders') {
        setSelectedMenu('Orders');
        localStorage.setItem('myAccountSelectedMenu', 'Orders');
        // Scroll to top when navigating via hash
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    };

    // Check immediately on mount
    checkHash();

    // Also check when location changes
    const timeoutId = setTimeout(() => {
      checkHash();
    }, 100);

    // Also listen for hash changes
    window.addEventListener('hashchange', checkHash);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('hashchange', checkHash);
    };
  }, [location.pathname, location.hash]);

  // Additional check on component mount to ensure hash is read
  useEffect(() => {
    if (location.pathname === '/myaccount') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'orders') {
        setSelectedMenu('Orders');
        localStorage.setItem('myAccountSelectedMenu', 'Orders');
      }
    }
  }, [location.pathname]);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: typeof user?.address === 'object' ? (user?.address?.address || '') : (user?.address || ''),
    dob: user?.dob || '',
    anniversary: user?.anniversary || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === undefined || user === null) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: typeof user?.address === 'object' ? (user?.address?.address || '') : (user?.address || ''),
      dob: user?.dob || '',
      anniversary: user?.anniversary || '',
    });
    setIsEditing(false);
    setHasChanged(false);
  }, [user]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  useEffect(() => {
    localStorage.setItem('myAccountSelectedMenu', selectedMenu);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedMenu]);

  const handleEditOrUpdate = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    setLoading(true);
    try {
      const changedFields = {};

      // Compare and add changed fields
      Object.keys(form).forEach((key) => {
        // Special handling for address - compare JSON strings
        if (key === 'address') {
          const currentAddress = typeof user?.address === 'object'
            ? JSON.stringify(user.address)
            : (user?.address || '');
          const newAddress = form[key] || '';
          if (currentAddress !== newAddress) {
            // Parse the JSON string back to object for backend
            try {
              changedFields[key] = JSON.parse(newAddress);
            } catch {
              changedFields[key] = newAddress;
            }
          }
        } else if (key === 'phone') {
          // Clean phone number before comparison
          const currentPhone = (user?.[key] || '').replace(/\D/g, '');
          const newPhone = (form[key] || '').replace(/\D/g, '');
          if (currentPhone !== newPhone && form[key]) {
            changedFields[key] = form[key];
          }
        } else {
          // Regular field comparison
          const currentValue = user?.[key] || '';
          const newValue = form[key] || '';
          if (currentValue !== newValue) {
            changedFields[key] = form[key];
          }
        }
      });

      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        setHasChanged(false);
        setLoading(false);
        return;
      }

      console.log('📤 Sending update request with changedFields:', changedFields);

      const res = await axios.put(`${API_BASE_URL}/api/users/${user.id}`, changedFields, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        setUser(res.data.data);
        setIsEditing(false);
        setHasChanged(false);
        showSuccess('Profile updated successfully!');
        showNotification('Profile updated successfully!', 'success');
      } else {
        showNotification(res.data.message || 'Update failed', 'error');
      }
    } catch (err) {
      console.error('❌ Update error:', err);
      showNotification(err.response?.data?.message || err.message || 'Update failed', 'error');
    }
    setLoading(false);
  };

  // Mobile: Show selected menu content if showMenuContentMobile is true
  if (showMenuContentMobile && isMobile) {
    return (
      <div className="myaccount_profileonly_mobile">
        <div className="myaccount_right_top myaccount_right_top_mobile">
          <div className='myaccount_right_top_main_div'>
            <button className="myaccount_back_btn_mobile" onClick={() => setShowMenuContentMobile(false)}>
              <span className="myaccount_back_arrow">&larr;</span>
              <span className="myaccount_back_text">Back</span>
            </button>
            <div className="myaccount_right_heading_mobile">
              {selectedMenu === 'Invoices & Certifications' ? (
                <span>INVOICES</span>
              ) : selectedMenu === 'Video Consultation' ? (
                <>
                  <span>VIDEO</span>
                  <span>CONSULTATIONS</span>
                </>
              ) : (
                <span>{selectedMenu.toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="myaccount_right_top_actions">
            {selectedMenu === 'Video Consultation' && (
              <button
                className="myaccount_schedule_btn_mobile"
                onClick={() => navigate('/video-cart/booking')}
              >
                <Video size={16} />
                <span>Schedule</span>
              </button>
            )}
            {selectedMenu === 'My Profile' && (
              <button className="myaccount_edit_btn" onClick={handleEditOrUpdate} disabled={isEditing && (!hasChanged || loading)}>
                <img src={edit} alt="edit" className='myaccount_edit_btn_img' loading="lazy" decoding="async" />
                {isEditing ? (loading ? 'Updating...' : 'Update') : 'Edit'}
              </button>
            )}
          </div>
        </div>
        <div className={`myaccount_right_bottom${selectedMenu === 'Orders' ? ' orders_active' : ''}${selectedMenu === 'Invoices & Certifications' ? ' invoices_certifications_active' : ''}${selectedMenu === 'Offers & Discounts' ? ' offers_discounts_active' : ''}${selectedMenu === 'Balance & Payments' ? ' balance_payments_active' : ''}`}>
          {selectedMenu === 'My Profile' && (
            <ErrorBoundary>
              <MyAccountForm form={form} setForm={setForm} isEditing={isEditing} setIsEditing={setIsEditing} hasChanged={hasChanged} setHasChanged={setHasChanged} loading={loading} setLoading={setLoading} user={user} setUser={setUser} showSuccess={showSuccess} />
            </ErrorBoundary>
          )}
          {selectedMenu === 'Orders' && <OrdersCardList />}
          {selectedMenu === 'Custom Jewelry' && <CustomJewelryRequests />}
          {selectedMenu === 'Invoices & Certifications' && <InvoicesAndCertifications />}
          {selectedMenu === 'Offers & Discounts' && <OffersAndDiscounts />}
          {selectedMenu === 'Digital Gold' && <DigitalGold />}
          {selectedMenu === 'Help & Support' && <HelpAndSupport />}
          {selectedMenu === 'Balance & Payments' && <UserBalance />}
          {selectedMenu === 'Video Consultation' && <UserVideoConsultations />}
        </div>
      </div>
    );
  }

  return (
    <div className="myaccount_container">
      {successMsg && <div className="myaccount_success_msg">{successMsg}</div>}
      {/* Top Bar */}
      <div className="myaccount_topbar">
        <span className="myaccount_breadcrumb">Home</span>
        <span className="myaccount_arrow">&#8250;</span>
        <span className="myaccount_breadcrumb_active">My Account</span>
      </div>
      {/* Main Content */}
      <div className="myaccount_main">
        {/* Left Section */}
        <div className="myaccount_left">
          {/* Gradient Box */}
          <div className="myaccount_gradientbox">
            <div className='myaccount_gradientbox_border'>
              <img src={star} alt="star" className='myaccount_star_icon' loading="lazy" decoding="async" />
              <img src={star} alt="star" className='myaccount_star_icon2' loading="lazy" decoding="async" />
              <div className="myaccount_hello">HELLO</div>
              <div className="myaccount_username">{userName}</div>
              {isMobile && <div className="myaccount_email">{user?.email || ''}</div>}
            </div>
          </div>
          {/* Menu List */}
          <ul className="myaccount_menu">
            {menuItems.map((item, idx) => (
              <li
                key={item.label}
                className={`myaccount_menuitem ${selectedMenu === item.label ? 'myaccount_menuitem_active' : ''}`}
                onClick={() => {
                  // Scroll to top when menu item is clicked
                  window.scrollTo({ top: 0, behavior: 'smooth' });

                  if (item.isVideoConsultation) {
                    setSelectedMenu('Video Consultation');
                    if (isMobile) setShowMenuContentMobile(true);
                  } else {
                    setSelectedMenu(item.label);
                    if (isMobile) setShowMenuContentMobile(true);
                  }
                }}
              >
                <span className="myaccount_iconwrap">
                  {item.isVideoConsultation ? (
                    <Video size={20} style={{ color: '#fff' }} />
                  ) : (
                    <img src={item.icon} alt="icon" className="myaccount_icon" loading="lazy" decoding="async" />
                  )}
                </span>
                <span className="myaccount_link">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Right Section: Hide on mobile */}
        {!isMobile && (
          <div className="myaccount_right">
            {/* Top Section: Dynamic Heading and Edit/Update Button */}
            <div className="myaccount_right_top">
              <span className="myaccount_right_heading">
                {selectedMenu === 'Invoices & Certifications' ? 'INVOICES' :
                  selectedMenu === 'Video Consultation' ? 'VIDEO CONSULTATIONS' :
                    selectedMenu.toUpperCase()}
              </span>
              {selectedMenu === 'My Profile' && (
                <button
                  className="myaccount_edit_btn"
                  onClick={handleEditOrUpdate}
                  type="button"
                  disabled={isEditing && (!hasChanged || loading)}
                >
                  <img src={edit} alt="edit" className='myaccount_edit_btn_img' loading="lazy" decoding="async" />
                  {isEditing ? (loading ? 'Updating...' : 'Update') : 'Edit'}
                </button>
              )}
              {/* Video Consultation CTA Button - Only visible in Video Consultation section */}
              {selectedMenu === 'Video Consultation' && (
                <button
                  className="myaccount_video_consultation_btn"
                  onClick={() => navigate('/video-cart/booking')}
                  style={{
                    marginLeft: 'auto',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #7c2d4a 0%, #9a3d5f 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Video size={18} />
                  Schedule Video Consultation
                </button>
              )}
            </div>
            {/* Bottom Section: Form or other content */}
            <div className={`myaccount_right_bottom${selectedMenu === 'Orders' ? ' orders_active' : ''}${selectedMenu === 'Invoices & Certifications' ? ' invoices_certifications_active' : ''}${selectedMenu === 'Offers & Discounts' ? ' offers_discounts_active' : ''}${selectedMenu === 'Balance & Payments' ? ' balance_payments_active' : ''}`}>
              {selectedMenu === 'My Profile' && (
                <ErrorBoundary>
                  <MyAccountForm form={form} setForm={setForm} isEditing={isEditing} setIsEditing={setIsEditing} hasChanged={hasChanged} setHasChanged={setHasChanged} loading={loading} setLoading={setLoading} user={user} setUser={setUser} showSuccess={showSuccess} />
                </ErrorBoundary>
              )}
              {selectedMenu === 'Orders' && <OrdersCardList />}
              {selectedMenu === 'Custom Jewelry' && <CustomJewelryRequests />}
              {selectedMenu === 'Invoices & Certifications' && <InvoicesAndCertifications />}
              {selectedMenu === 'Offers & Discounts' && <OffersAndDiscounts />}
              {selectedMenu === 'Digital Gold' && <DigitalGold />}
              {selectedMenu === 'Help & Support' && <HelpAndSupport />}
              {selectedMenu === 'Balance & Payments' && <UserBalance />}
              {selectedMenu === 'Video Consultation' && <UserVideoConsultations />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAccount;
