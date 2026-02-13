import React, { useRef, useState, useEffect, useContext } from 'react';
import './Header.css';
import { ChevronDown, Search, Bell, Mail, X, Lock, MapPin, Heart, ShoppingBag, User, Menu } from 'lucide-react';
import logo from '../../../assets/img/Logo/green-logo.png';
import { AdminContext } from '../../../context/AdminContext';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, Video, ListOrdered, BookOpen, BookMarked, HeartHandshake, FileText, Users, UserCircle, Ticket, BarChart2, Star, TrendingUp, MapPin as MapPinIcon, Truck, Tag, ShieldCheck, Image, GalleryHorizontal, Sparkles, Coins, Layers, Mail as MailIcon, MessageCircle, FileCheck2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const adminPages = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Orders Management', path: '/admin/orders/orders-management', icon: ShoppingCart },
    { label: 'Video Consultations', path: '/admin/orders/video-consultations', icon: Video },
    { label: 'Cart Management', path: '/admin/orders/cart-management', icon: ListOrdered },
    { label: 'Product Listing', path: '/admin/products/listing', icon: BookOpen },
    { label: 'Wishlist Monitoring', path: '/admin/products/wishlist-monitoring', icon: HeartHandshake },
    { label: 'Certificate Management', path: '/admin/products/certificate-management', icon: FileText },
    { label: 'Product Categories', path: '/admin/products/product-catelog', icon: Layers },
    { label: 'Cart and Discount', path: '/admin/carts-discounts/cart-and-discount', icon: Tag },
    { label: 'Discount Management', path: '/admin/carts-discounts/discount-management', icon: ShieldCheck },
    { label: 'Pincode Management', path: '/admin/shipping/pincode-management', icon: MapPinIcon },
    { label: 'User Account', path: '/admin/user-management/user-account', icon: UserCircle },
    { label: 'Support Ticket', path: '/admin/user-management/support-ticket', icon: Ticket },
    { label: 'Blog Guide', path: '/admin/marketing/blog-guide', icon: FileText },
    { label: 'Email Automation', path: '/admin/marketing/email-automation', icon: Mail },
    { label: 'Review Rating', path: '/admin/marketing/review-rating', icon: Star },
    { label: 'Rate Prediction', path: '/admin/gold-silver/rate-prediction', icon: TrendingUp },
    { label: 'Rate Update', path: '/admin/gold-silver/rate-update', icon: BarChart2 },
    { label: 'Cms Tracker', path: '/admin/cms/cms-tracker', icon: FileText },
    { label: 'Social Links', path: '/admin/cms/social-links', icon: MessageCircle },
    { label: 'Hero Banner', path: '/admin/cms/hero-banner', icon: Image },
    { label: 'Featured Images', path: '/admin/cms/featured-images', icon: GalleryHorizontal },
    { label: 'PVJ Prediction', path: '/admin/cms/pvj-prediction', icon: Sparkles },
    { label: 'Digital Gold Overview', path: '/admin/digital-gold', icon: Coins },
    { label: 'Plan Controller Center', path: '/admin/plan-controller-center', icon: FileCheck2 },
];

const Header = ({ onMenuClick, activeItem = 'DASHBOARD' }) => {
    const { admin, token, setAdmin, logoutAdmin } = useContext(AdminContext);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showEmailUpdate, setShowEmailUpdate] = useState(false);
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailUpdateLoading, setEmailUpdateLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifError, setNotifError] = useState('');
    const [showRouteDropdown, setShowRouteDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [deliveryPincode, setDeliveryPincode] = useState('560001');
    const [showPincodeInput, setShowPincodeInput] = useState(false);
    const searchInputRef = useRef(null);
    const pincodeInputRef = useRef(null);

    const avatarUrl = admin && admin.photo ? `${import.meta.env.VITE_API_URL}${admin.photo}` : null;
    const fallbackAvatar = admin && admin.name ? admin.name[0].toUpperCase() : 'A';

    const filteredPages = adminPages.filter(page =>
        page.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Fetch notifications and unread count (admin, all notifications)
    const fetchNotifications = async () => {
        if (!token) return;
        setNotifLoading(true);
        setNotifError('');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && Array.isArray(res.data.data)) {
                setNotifications(res.data.data.map(n => ({
                    ...n,
                    time: n.created_at ? new Date(n.created_at).toLocaleString() : '',
                })));
                setUnreadCount(res.data.data.filter(n => !n.is_read).length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
                setNotifError('No notifications found or invalid response.');
            }
        } catch (err) {
            setNotifications([]);
            setUnreadCount(0);
            setNotifError('Failed to load notifications.');
        } finally {
            setNotifLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line
    }, [token]);

    // When NotificationPanel closes, refresh notifications
    useEffect(() => {
        if (!showNotifications) {
            fetchNotifications();
        }
        // eslint-disable-next-line
    }, [showNotifications]);

    const handleDeleteNotification = async (id) => {
        if (!token) return;
        await axios.delete(`${API_BASE_URL}/api/notifications/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(notifications.filter(n => n.id !== id));
        setUnreadCount(notifications.filter(n => n.id !== id && !n.is_read).length);
    };

    const handleMarkAsRead = async (id) => {
        if (!token) return;
        await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(notifications.filter(n => n.id !== id && !n.is_read).length);
    };

    const handleClearAllNotifications = async () => {
        if (!token) return;
        await axios.delete(`${API_BASE_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications([]);
        setUnreadCount(0);
    };

    const handleUserMenuClick = (e) => {
        e.stopPropagation();
        setDropdownOpen((open) => !open);
    };

    const handleEditProfileClick = (e) => {
        e.stopPropagation();
        setDropdownOpen(false);
        fileInputRef.current.click();
    };

    const handleViewProfileClick = (e) => {
        e.stopPropagation();
        setDropdownOpen(false);
        setShowProfile(true);
    };

    const handleEditEmailClick = (e) => {
        e.stopPropagation();
        setDropdownOpen(false);
        setShowEmailUpdate(true);
        setNewEmail('');
        setEmailError('');
    };

    const handleChangePasswordClick = (e) => {
        e.stopPropagation();
        setDropdownOpen(false);
        setShowPasswordChange(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    const handlePasswordChange = async () => {
        if (!currentPassword.trim()) {
            setPasswordError('Please enter your current password');
            return;
        }

        if (!newPassword.trim()) {
            setPasswordError('Please enter a new password');
            return;
        }

        if (!confirmPassword.trim()) {
            setPasswordError('Please confirm your new password');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }

        setPasswordChangeLoading(true);
        setPasswordError('');

        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/auth/admin/change-password`,
                {
                    currentPassword: currentPassword.trim(),
                    newPassword: newPassword.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.data.success) {
                setShowPasswordChange(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setPasswordError(res.data.message || 'Failed to change password');
            }
        } catch (err) {
            setPasswordError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setPasswordChangeLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!newEmail.trim()) {
            setEmailError('Please enter a new email address');
            return;
        }

        setEmailUpdateLoading(true);
        setEmailError('');

        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/auth/admin/send-email-update-otp`,
                { newEmail: newEmail.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.data.success) {
                setShowEmailUpdate(false);
                setShowOtpVerification(true);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setEmailError(res.data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setEmailError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setEmailUpdateLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) {
            setOtpError('Please enter the OTP');
            return;
        }

        setOtpLoading(true);
        setOtpError('');

        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/auth/admin/verify-email-update-otp`,
                { otp: otp.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.data.success) {
                setShowOtpVerification(false);
                setOtp('');
                setNewEmail('');
                setAdmin(res.data.data);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setOtpError(res.data.message || 'Failed to verify OTP');
            }
        } catch (err) {
            setOtpError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setOtpLoading(true);
        setOtpError('');

        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/auth/admin/send-email-update-otp`,
                { newEmail: newEmail.trim() },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (res.data.success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setOtpError(res.data.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setOtpError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file && token) {
            setLoading(true);
            setError('');
            try {
                const formData = new FormData();
                formData.append('photo', file);
                const res = await axios.patch(
                    `${import.meta.env.VITE_API_URL}/api/auth/admin/photo`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );
                if (res.data.success && res.data.data) {
                    setAdmin(res.data.data);
                    setShowSuccess(true);
                } else {
                    setError(res.data.message || 'Failed to update profile photo');
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Network error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleLogout = async (e) => {
        e.stopPropagation();
        setDropdownOpen(false);
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            // Ignore error, proceed to clear context
        }
        logoutAdmin();
        navigate('/admin', { replace: true });
    };

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    useEffect(() => {
        const closeDropdown = () => setDropdownOpen(false);
        if (dropdownOpen) {
            window.addEventListener('click', closeDropdown);
        }
        return () => {
            window.removeEventListener('click', closeDropdown);
        };
    }, [dropdownOpen]);

    const handleSearchFocus = () => {
        setShowRouteDropdown(true);
    };
    
    const handleSearchBlur = (e) => {
        setTimeout(() => setShowRouteDropdown(false), 150);
    };
    
    const handleRouteClick = (path) => {
        setShowRouteDropdown(false);
        setSearchQuery("");
        navigate(path);
    };
    
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setShowRouteDropdown(true);
    };

    const handlePincodeClick = () => {
        setShowPincodeInput(true);
        setTimeout(() => {
            if (pincodeInputRef.current) {
                pincodeInputRef.current.focus();
            }
        }, 100);
    };

    const handlePincodeBlur = () => {
        setTimeout(() => setShowPincodeInput(false), 200);
    };

    const handlePincodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setDeliveryPincode(value);
    };

    const handlePincodeKeyPress = (e) => {
        if (e.key === 'Enter') {
            setShowPincodeInput(false);
        }
    };

    // Password strength validation
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 'none', score: 0 };

        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

        if (score <= 2) return { strength: 'weak', score };
        if (score <= 3) return { strength: 'fair', score };
        if (score <= 4) return { strength: 'good', score };
        return { strength: 'strong', score };
    };

    const getPasswordRequirements = (password) => {
        return [
            {
                text: 'At least 8 characters',
                met: password.length >= 8
            },
            {
                text: 'At least one lowercase letter',
                met: /[a-z]/.test(password)
            },
            {
                text: 'At least one uppercase letter',
                met: /[A-Z]/.test(password)
            },
            {
                text: 'At least one number',
                met: /\d/.test(password)
            },
            {
                text: 'At least one special character',
                met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
            }
        ];
    };

    const passwordStrength = getPasswordStrength(newPassword);
    const passwordRequirements = getPasswordRequirements(newPassword);

    return (
        <header className="admin-header giva-header">
            <div className="admin-header-left">
                <button className="admin-header-hamburger" onClick={onMenuClick} aria-label="Open menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div className="brand-logo">
                    <img src={logo} alt="GIVA Logo" className="header-logo" />
                </div>
            </div>
            
            <div className="admin-header-center">
                <div className="delivery-section">
                    <div className="delivery-label">
                        <MapPin size={16} color="#666" />
                        <span>Update Delivery Pincode</span>
                    </div>
                    <div className="delivery-pincode" onClick={handlePincodeClick}>
                        {showPincodeInput ? (
                            <input
                                ref={pincodeInputRef}
                                type="text"
                                value={deliveryPincode}
                                onChange={handlePincodeChange}
                                onBlur={handlePincodeBlur}
                                onKeyPress={handlePincodeKeyPress}
                                placeholder="Enter pincode"
                                maxLength="6"
                                className="pincode-input"
                                autoFocus
                            />
                        ) : (
                            <>
                                <span className="pincode-value">{deliveryPincode || 'Enter pincode'}</span>
                                <ChevronDown size={16} color="#666" />
                            </>
                        )}
                    </div>
                </div>
                
                <div className="search-section">
                    <div className="admin-header-search-wrapper">
                        <Search className="admin-header-search-icon" size={20} />
                        <input
                            type="text"
                            className="admin-header-search"
                            placeholder='Search "Pendants"'
                            ref={searchInputRef}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                    {showRouteDropdown && (
                        <div className="admin-header-search-dropdown">
                            {filteredPages.length > 0 ? filteredPages.map(page => (
                                <div
                                    key={page.path}
                                    className="admin-header-search-dropdown-item"
                                    onMouseDown={() => handleRouteClick(page.path)}
                                >
                                    {page.icon && <page.icon size={18} />}
                                    {page.label}
                                </div>
                            )) : (
                                <div className="no-results">No results found</div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="offer-badge">
                    <span className="offer-text">EXTRA 20% OFF</span>
                    <span className="offer-code">CODE:LOVE20</span>
                </div>
            </div>
            
            <div className="admin-header-right">
                <button className="nav-link">
                    <Heart size={20} />
                    <span>WISHLIST</span>
                </button>
                
                <button className="nav-link">
                    <ShoppingBag size={20} />
                    <span>CART</span>
                </button>
                
                <button
                    className="nav-link notification-btn"
                    onClick={() => setShowNotifications(true)}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                    )}
                </button>
                
                <div className="admin-header-user-menu" onClick={handleUserMenuClick}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={admin?.name || 'User'} className="admin-header-avatar" />
                    ) : (
                        <div className="admin-header-avatar admin-header-avatar-fallback">
                            {fallbackAvatar}
                        </div>
                    )}
                    <ChevronDown size={18} />
                    
                    {dropdownOpen && (
                        <div className="admin-header-dropdown-menu">
                            <div className="admin-header-dropdown-item" onClick={handleViewProfileClick}>
                                <User size={16} />
                                View Profile
                            </div>
                            <div className="admin-header-dropdown-item" onClick={handleEditProfileClick}>
                                Edit Profile
                            </div>
                            <div className="admin-header-dropdown-item" onClick={handleEditEmailClick}>
                                <Mail size={16} />
                                Update Email
                            </div>
                            <div className="admin-header-dropdown-item" onClick={handleChangePasswordClick}>
                                <Lock size={16} />
                                Change Password
                            </div>
                            <div className="admin-header-dropdown-divider"></div>
                            <div className="admin-header-dropdown-item" onClick={handleLogout}>
                                Logout
                            </div>
                        </div>
                    )}
                    
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            {/* Success/Error Messages */}
            {showSuccess && (
                <div className="admin-header-profile-success">Profile updated successfully</div>
            )}
            {error && <div className="admin-header-profile-error">{error}</div>}
            {notifError && <div className="admin-header-profile-error">{notifError}</div>}

            {/* Modals */}
            {showPasswordChange && (
                <div className="admin-header-profile-modal" onClick={() => setShowPasswordChange(false)}>
                    <div className="admin-header-profile-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Change Password</h2>
                            <button className="modal-close" onClick={() => setShowPasswordChange(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Enter your current password and choose a new password.</p>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="form-input"
                                />
                                {newPassword && (
                                    <div className="password-strength">
                                        <div>Password Strength: {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}</div>
                                        <div className="password-strength-bar">
                                            <div className={`password-strength-fill password-strength-${passwordStrength.strength}`}></div>
                                        </div>
                                        <div className="password-requirements">
                                            {passwordRequirements.map((req, index) => (
                                                <div key={index} className={`password-requirement ${req.met ? 'met' : 'unmet'}`}>
                                                    <span className="password-requirement-icon">
                                                        {req.met ? '✓' : '○'}
                                                    </span>
                                                    {req.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="form-input"
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <div className="error-message">Passwords do not match</div>
                                )}
                            </div>
                            {passwordError && <div className="error-message">{passwordError}</div>}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowPasswordChange(false)}
                                disabled={passwordChangeLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handlePasswordChange}
                                disabled={passwordChangeLoading || passwordStrength.score < 5 || newPassword !== confirmPassword}
                            >
                                {passwordChangeLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEmailUpdate && (
                <div className="admin-header-profile-modal" onClick={() => setShowEmailUpdate(false)}>
                    <div className="admin-header-profile-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Update Email Address</h2>
                            <button className="modal-close" onClick={() => setShowEmailUpdate(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Enter your new email address. An OTP will be sent for verification.</p>
                            <div className="form-group">
                                <label>New Email Address</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="Enter new email address"
                                    className="form-input"
                                />
                            </div>
                            {emailError && <div className="error-message">{emailError}</div>}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowEmailUpdate(false)}
                                disabled={emailUpdateLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSendOtp}
                                disabled={emailUpdateLoading}
                            >
                                {emailUpdateLoading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOtpVerification && (
                <div className="admin-header-profile-modal" onClick={() => setShowOtpVerification(false)}>
                    <div className="admin-header-profile-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Verify OTP</h2>
                            <button className="modal-close" onClick={() => setShowOtpVerification(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Enter the 6-digit OTP sent to <strong>{newEmail}</strong></p>
                            <div className="form-group">
                                <label>OTP Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Enter 6-digit OTP"
                                    className="form-input"
                                    maxLength={6}
                                />
                            </div>
                            {otpError && <div className="error-message">{otpError}</div>}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={handleResendOtp}
                                disabled={otpLoading}
                            >
                                {otpLoading ? 'Sending...' : 'Resend OTP'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleVerifyOtp}
                                disabled={otpLoading}
                            >
                                {otpLoading ? 'Verifying...' : 'Verify & Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProfile && admin && (
                <div className="admin-header-profile-modal" onClick={() => setShowProfile(false)}>
                    <div className="admin-header-profile-modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Admin Profile</h2>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="User" className="admin-header-avatar-large" loading="lazy" decoding="async" />
                        ) : (
                            <div className="admin-header-avatar-large admin-header-avatar-fallback-large">{fallbackAvatar}</div>
                        )}
                        <div><strong>Name:</strong> {admin.name}</div>
                        <div><strong>Email:</strong> {admin.email}</div>
                        <button className="admin-header-profile-close" onClick={() => setShowProfile(false)}>Close</button>
                    </div>
                </div>
            )}

            <NotificationPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onDeleteNotification={handleDeleteNotification}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAllNotifications}
                loading={notifLoading}
            />
        </header>
    );
};

export default Header;