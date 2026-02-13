import React, { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Mail,
  Phone,
  ChevronRight,
  Gem,
  Sparkles,
  Layers,
  Circle,
  Gift,
  Watch,
  Star,
  Tag,
  Video,
  Clock,
  MapPin,
  ShoppingBag,
  ChevronDown,
  Heart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useDynamicLinks } from '../../hooks/useDynamicLinks';
import { getTelURL, getMailtoURL, getGoogleMapsURL } from '../../utils/dynamicLinks';
import { useNotification } from '../../context/NotificationContext';
import logo from '../../assets/img/Logo/Logo.png'
import CartIcon from '../../assets/img/icons/cart.png'
import DownArrowIcon from '../../assets/img/icons/down-arrow.png'
import LikeIcon from '../../assets/img/icons/Like.png'
import MenuIcon from '../../assets/img/icons/menu.png'
import SearchIcon from '../../assets/img/icons/search.png'
import TrackIcon from '../../assets/img/icons/track-order.png'
import UserIcon from '../../assets/img/icons/user.png'
import LineIcon from '../../assets/img/icons/line.png'
import './Navbar.css';
import MegaMenu from '../MegaMenu/MegaMenu';
import ExploreMegaMenu from '../MegaMenu/ExploreMegaMenu';
import CategoryMegaMenu from '../MegaMenu/CategoryMegaMenu';
import RingsMegaMenu from '../MegaMenu/RingsMegaMenu';
import GemstoneMegaMenu from '../MegaMenu/GemstoneMegaMenu';
import ItemNameMegaMenu from '../MegaMenu/ItemNameMegaMenu';
import ShopMegaMenu from '../MegaMenu/ShopMegaMenu';
import SubMenu from '../SubMenu/SubMenu';
import { useWishlistCart } from '../../context/wishlistCartContext';
import SearchDropdown from './SearchDropdown';
import ringImg from '../../assets/img/ring.jpg';
import { lazy, Suspense } from 'react';
import AppLoader from '../Loader/AppLoader';
const RatesPopup = lazy(() => import('../RatesPopup/RatesPopup'));
import necklaceImg from '../../assets/img/necklace.jpg';
import braceletImg from '../../assets/img/bracelet.jpg';
import earRingImg from '../../assets/img/ear-ring2.jpg';

const Navbar = ({ onAccountClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout, token } = useContext(UserContext);
  const navigate = useNavigate();
  const [hoveredNavIndex, setHoveredNavIndex] = useState(null);
  const [menuHover, setMenuHover] = useState(false);
  const { links } = useDynamicLinks();
  const hideMenuTimeout = React.useRef();
  const { cart, wishlist, cartItemCount, wishlistItemCount } = useWishlistCart();
  const { showNotification } = useNotification();
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const [isRatesPopupOpen, setIsRatesPopupOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch metal rates
  useEffect(() => {
    const fetchLatestRates = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/metal-rates/rates/latest`);
        if (response.data.success) {
          setRates(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching rates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestRates();
    // Update rates every 5 minutes
    const interval = setInterval(fetchLatestRates, 300000);
    return () => clearInterval(interval);
  }, []);

  // Search logic with API integration
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 0) {
      setSearchLoading(true);
      // Debounce the API call to prevent too many requests
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/products`);
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          if (data.success) {
            // Filter and transform the data for the search results
            const searchTerm = value.toLowerCase();
            const filteredResults = data.data.filter(product =>
              product.item_name.toLowerCase().includes(searchTerm) ||
              (product.categories && product.categories.some(cat => cat.toLowerCase().includes(searchTerm))) ||
              (product.subcategories && product.subcategories.some(subcat => subcat.toLowerCase().includes(searchTerm)))
            ).map(product => ({
              id: product.id,
              name: product.item_name,
              slug: product.slug,
              image: product.images && product.images.length > 0 ? product.images[0] : null,
              price: product.product_options?.[0]?.sell_price || '',
              actualPrice: product.product_options?.[0]?.actual_price || '',
              discount: product.discount || 0
            }));
            setSearchResults(filteredResults);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 300); // debounce delay

      setShowSearchDropdown(true);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleProductClick = (slug) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/product/${slug}`);
  };

  const handleSearchButtonClick = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
    } else {
      // Focus the visible input
      if (window.innerWidth <= 768 && mobileInputRef.current) {
        mobileInputRef.current.focus();
      } else if (desktopInputRef.current) {
        desktopInputRef.current.focus();
      }
    }
  };

  const navigationItems = [
    { label: 'Shop by Category', icon: <Sparkles size={20} /> },
    { label: "Valentine's Sale", icon: <Tag size={20} /> },
    { label: 'Gifts for Him', icon: <Gift size={20} /> },
    { label: 'Gifts for Her', icon: <Gift size={20} /> },
    { label: 'Gift Card', icon: <Gift size={20} /> },
    { label: 'Gift Store', icon: <Gift size={20} /> },
    { label: 'Exclusive Collections', icon: <Star size={20} /> },
    { label: 'More', icon: <Circle size={20} /> }
  ];

  const handleNavItemClick = (category) => {
    setSelectedCategory(category);
    setIsSubMenuOpen(true);
  };

  const handleAccountClick = () => {
    if (user) {
      // If user is logged in, toggle dropdown
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      // If user is not logged in, open signup/login modal
      onAccountClick();
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    window.location.reload(); // Reload page after logout
  };

  const getUserDisplayName = () => {
    if (user && user.name) {
      // Show first name or full name (you can customize this)
      const nameParts = user.name.split(' ');
      return nameParts[0]; // Show first name only
    }
    return "Login";
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.account-section')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => document.body.classList.remove('menu-open');
  }, [isMobileMenuOpen]);

  const handleMenuMouseEnter = () => {
    clearTimeout(hideMenuTimeout.current);
    setMenuHover(true);
  };

  const handleMenuMouseLeave = () => {
    hideMenuTimeout.current = setTimeout(() => {
      setMenuHover(false);
      setHoveredNavIndex(null);
    }, 120); // small delay for smoothness
  };

  // Handle menu item click
  const handleMenuItemClick = (item, index, e) => {
    const label = item.label;

    if (label === 'Shop by Category') {
      e.preventDefault();
      navigate('/shop', { state: { clearFilters: true } });
    } else if (label === "Valentine's Sale") {
      e.preventDefault();
      navigate('/shop?sort=new');
    } else if (label === 'Gifts for Him') {
      e.preventDefault();
      navigate('/shop');
    } else if (label === 'Gifts for Her') {
      e.preventDefault();
      navigate('/shop');
    } else if (label === 'Gift Card') {
      e.preventDefault();
      navigate('/shop');
    } else if (label === 'Gift Store') {
      e.preventDefault();
      navigate('/shop');
    } else if (label === 'Exclusive Collections') {
      e.preventDefault();
      navigate('/shop?sort=best');
    } else if (label === 'More') {
      e.preventDefault();
      navigate('/shop');
    }
  };

  // Handle menu item hover - show mega menu for Shop by Category and Rings
  const handleMenuItemHover = (item, index) => {
    const label = item.label.toLowerCase();
    // Show mega menu for Shop by Category or Rings
    if (item.label === 'Shop by Category' || label === 'rings') {
      setHoveredNavIndex(index);
      setMenuHover(true);
    } else {
      setHoveredNavIndex(null);
      setMenuHover(false);
    }
  };

  return (
    <nav className="navbar">
      {/* Promotional Top Bar - GIVA Style */}
      <div className="navbar-promo-bar-giva desktop-only">
        <div className="navbar-container">
          <span>EXTRA 10% Off on Silver Jewellery above 999</span>
            </div>
          </div>

      {/* Mobile Promotional Bar */}
      <div className="navbar-promo-bar-giva mobile-only">
        <div className="navbar-container">
          <span>EXTRA 10% Off on Silver Jewellery above 999</span>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="navbar-top mobile-only">
        <div className="navbar-container">
          <div className="location-selector-top">
            <span>Location</span>
            <span className="location-value-top">{links.address || 'Select Location'}</span>
            </div>
          <div className="track-order">
            <img src={TrackIcon} alt='TrackIcon' height="16px" width="16px" loading="lazy" decoding="async" />
            <div onClick={() => {
              if (user && token) {
                localStorage.setItem('myAccountSelectedMenu', 'Orders');
                navigate('/myaccount#orders');
              } else {
                onAccountClick();
              }
            }} style={{ cursor: 'pointer' }}>Track Order</div>
          </div>
        </div>
      </div>

      {/* Main Navbar - GIVA Style */}
      <div className="navbar-main-giva">
        <div className="navbar-container-giva">
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <img src={MenuIcon} alt="MenuIcon" height="26px" width="26px" loading="lazy" decoding="async" />
          </button>

          {/* Left: Logo + Location */}
          <div className="navbar-left-giva">
            <div className="navbar-logo-giva">
            <Link to='/'>
                <img src={logo} alt="Lavender Silver Logo" height="40px" width="auto" loading="lazy" decoding="async" />
            </Link>
            </div>
            <div className="location-selector-giva" onClick={() => {}}>
              <MapPin size={16} className="location-icon-giva" />
              <div className="location-text-giva">
                <div className="location-main-text">Where to Deliver?</div>
                <div className="location-sub-text">Update Delivery Pincode</div>
                </div>
              <ChevronDown size={14} className="location-chevron-giva" />
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="search-container-giva desktop-only">
            <div className="search-wrapper-giva" style={{ position: 'relative' }}>
              <input
                ref={desktopInputRef}
                type="text"
                placeholder="Search 'Pendants'"
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input-giva"
              />
              <button className="search-button-giva" onClick={handleSearchButtonClick}>
                <img src={SearchIcon} alt='SearchIcon' height="18px" width="18px" loading="lazy" decoding="async" />
              </button>
              {showSearchDropdown && (
                <SearchDropdown
                  results={searchResults}
                  loading={searchLoading}
                  onProductClick={handleProductClick}
                  onClose={() => setShowSearchDropdown(false)}
                />
              )}
            </div>
          </div>

          {/* Right: Utility Icons */}
          <div className="navbar-utilities-giva desktop-only">
            <Link to="/shop" className="utility-icon-giva">
              <MapPin size={20} />
              <span>STORES</span>
            </Link>
            <div className="utility-icon-giva" onClick={handleAccountClick} style={{ cursor: 'pointer', position: 'relative' }}>
              <FiUser size={20} />
              <span>ACCOUNT</span>
              {isDropdownOpen && user && (
                <div className="account-dropdown">
                  <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); }}>
                    <FiUser size={16} />
                    <Link to="myaccount" onClick={() => setIsDropdownOpen(false)}>My Account</Link>
                  </div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    <FiLogOut size={16} />
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
            <Link to="/wishlist" className="utility-icon-giva" style={{ position: 'relative' }}>
              <Heart size={20} strokeWidth={1.5} className="utility-icon-heart" />
              <span>WISHLIST</span>
              {wishlistItemCount > 0 && (
                <span className="utility-badge-giva">{wishlistItemCount}</span>
              )}
            </Link>
            <Link to="/carts" className="utility-icon-giva" style={{ position: 'relative' }}>
              <img src={CartIcon} alt='CartIcon' height="20px" width="20px" loading="lazy" decoding="async" style={{ opacity: 0.8 }} />
              <span>CART</span>
              {cartItemCount > 0 && (
                <span className="utility-badge-giva">{cartItemCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Desktop */}
      <div
        className="navbar-menu desktop-only"
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
      >
        <div className="navbar-container-item ">
          <div className="menu-items">
            {navigationItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <div
                  className="menu-item-wrapper"
                  onMouseEnter={() => handleMenuItemHover(item, index)}
                  style={{ display: 'inline-block', position: 'relative' }}
                >
                  <Link
                    to="/shop"
                    className="menu-item"
                    onClick={(e) => handleMenuItemClick(item, index, e)}
                  >
                    {item.label}
                    <ChevronDown size={14} />
                  </Link>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* MegaMenu show on hover */}
        {menuHover && hoveredNavIndex !== null && (
          <div
            className="navbar-mega-menu-dropdown"
            style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 2000, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
          >
            {hoveredNavIndex === 0 && <MegaMenu />}
            {navigationItems[hoveredNavIndex]?.label?.toLowerCase().includes('ring') && (
              <RingsMegaMenu categorySlug="rings" categoryName="Rings" />
            )}
          </div>
        )}
      </div>

      {/* Mobile Search Bar - below green navbar */}
      <div className="mobile-search-bar mobile-only">
        <div className="search-wrapper" style={{ position: 'relative' }}>
          <input
            ref={mobileInputRef}
            type="text"
            placeholder="Search Rings"
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button className="search-button" onClick={handleSearchButtonClick}>
            <img src={SearchIcon} alt='SearchIcon' height="16px" width="16px" />
          </button>
          {showSearchDropdown && (
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              onProductClick={handleProductClick}
              onClose={() => setShowSearchDropdown(false)}
            />
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && !isSubMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className={`mobile-menu open`}
            onClick={e => e.stopPropagation()}
          >
            <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close Menu">×</button>

            <div className="mobile-menu-offer">
              <div className="offer-image">
                <img src={CartIcon} alt="Offer" loading="lazy" decoding="async" width="16" height="16" />
              </div>
              <div className="offer-details">
                <div className="offer-title">Welcome to Lavender Silver</div>
                <div className="offer-subtitle">Sign in to explore exclusive collections</div>
                <div className="offer-actions">
                  <Link to="/login" className="offer-login">LOGIN</Link>
                  <span>|</span>
                  <Link to="/signup" className="offer-signup">SIGN UP</Link>
                </div>
              </div>
            </div>

            <div className="mobile-nav-items">
              {navigationItems.map((item, index) => (
                <button key={index} className="mobile-nav-item" onClick={() => handleNavItemClick(item)}>
                  <div className="mobile-nav-item-content">
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={20} className="mobile-nav-chevron" />
                </button>
              ))}
            </div>

            {/* Social Media Section at the bottom */}
            <div className="mobile-menu-social">
              <div className="mobile-menu-social-label">Follow us on</div>
              <div className="mobile-menu-social-icons">
                <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="mobile-menu-social-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H6v4h4v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href={links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="mobile-menu-social-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                  </svg>
                </a>
                <a href={links.youtube} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="mobile-menu-social-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#777" />
                    <path d="M9.545 16.568l6.545-4.068-6.545-4.064v8.132z" fill="#fff" />
                    <path d="M22.54 6.42c-.24-.89-.94-1.59-1.82-1.82C18.19 4 12 4 12 4s-6.19 0-8.72.6c-.89.23-1.58.92-1.82 1.82C1 8.95 1 12 1 12s0 3.05.46 5.58c.24.89.94 1.59 1.82 1.82C5.81 20 12 20 12 20s6.19 0 8.72-.6c.89-.23 1.58-.92 1.82-1.82.46-2.53.46-5.58.46-5.58s0-3.05-.46-5.58zM9.55 16.57V8.44l6.54 4.07-6.54 4.06z" fill="none" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCategory && (
        <SubMenu
          isOpen={isSubMenuOpen}
          category={selectedCategory}
          onBack={() => setIsSubMenuOpen(false)}
          onClose={() => {
            setIsSubMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}

      {isRatesPopupOpen && (
        <Suspense fallback={<AppLoader />}>
          <RatesPopup isOpen={isRatesPopupOpen} onClose={() => setIsRatesPopupOpen(false)} />
        </Suspense>
      )}
    </nav>
  );
};

export default React.memo(Navbar);