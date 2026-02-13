import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Award, Truck, ChevronDown, Clock, MapPin, Check } from 'lucide-react';
import './product.css';
import discountIcon from '../../assets/img/icons/discount.png';
import videowhiteIcon from '../../assets/img/icons/videoWhite.png';
import DownArrow from '../../assets/img/icons/down-black.png';
import cartIocn from '../../assets/img/icons/cart.png';
import compareIocn from '../../assets/img/icons/compareIcon.png';
import heartIocn from '../../assets/img/icons/heart.png';
import { GoHeartFill } from "react-icons/go";
import { Link, useNavigate, useParams } from 'react-router-dom';
import Similer from '../../components/similer/Similer';
import ProductBanner from './ProductBanner';
import { lazy, Suspense } from 'react';

const ReviewPopup = lazy(() => import('./ReviewPopup'));
import { useWishlistCart } from '../../context/wishlistCartContext';
import { useNotification } from '../../context/NotificationContext';
import ProductImagePopup from './ProductImagePopup';
import ProductComparisonPopup from './ProductComparisonPopup';
import { useUser } from '../../context/UserContext';
import axios from 'axios';
import ProductLoader from '../../components/Loader/ProductLoader';

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

const Product = () => {
  const { productName } = useParams();
  const { user, token } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCustomization, setSelectedCustomization] = useState('');
  const [selectedPurity, setSelectedPurity] = useState('');
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [weightDropdownOpen, setWeightDropdownOpen] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showComparisonPopup, setShowComparisonPopup] = useState(false);
  const [reviewPopupOpen, setReviewPopupOpen] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const [pincode, setPincode] = useState('');
  const [pincodeData, setPincodeData] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState(null);
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [copiedOffer, setCopiedOffer] = useState(null);

  // Cart & Wishlist Context
  const {
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    isInCart,
    isInWishlist
  } = useWishlistCart();
  const { showNotification } = useNotification();
  const { addToVideoCart } = useWishlistCart();

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        let productData = null;

        // Try slug first
        try {
          const { data } = await axios.get(`${API_BASE_URL}/api/products/slug/${productName}`);
          if (data.success) productData = data.data;
        } catch (slugError) {
          // If slug fails and productName is numeric, try ID
          if (!isNaN(productName)) {
            try {
              const { data } = await axios.get(`${API_BASE_URL}/api/products/${productName}`);
              if (data.success) productData = data.data;
            } catch (idError) {
              console.error('Both slug and ID fetch failed:', idError);
              throw idError;
            }
          } else {
            throw slugError;
          }
        }

        if (productData) {
          setProduct(productData);

          // Set default selections from first option
          if (productData.product_options?.length > 0) {
            const firstOption = productData.product_options[0];
            setSelectedSize(firstOption.size || '');
            setSelectedWeight(firstOption.weight || '');
            setSelectedCustomization(firstOption.metal_type || '');
            setSelectedPurity(firstOption.quality || '');
          }

          // Set initial quantity based on stock
          if (productData.pieces && productData.pieces > 0) {
            setQuantity(prev => prev > productData.pieces ? productData.pieces : prev);
          } else {
            setQuantity(0);
          }
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError(error.message || 'Failed to load product');
        showNotification('Error loading product. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (productName) fetchProduct();
  }, [API_BASE_URL, productName, showNotification]);

  // Update quantity if stock changes
  useEffect(() => {
    if (product?.pieces !== undefined) {
      if (product.pieces === 0) setQuantity(0);
      else if (quantity > product.pieces) setQuantity(product.pieces);
      else if (quantity < 1 && product.pieces > 0) setQuantity(1);
    }
  }, [product?.pieces, quantity]);

  // Calculate price
  const calculatePrice = () => {
    if (!product) return 0;

    const selectedOption = product.product_options?.find(option =>
      option.size === selectedSize &&
      option.weight === selectedWeight &&
      option.metal_type === selectedCustomization &&
      option.quality === selectedPurity
    );

    if (selectedOption) {
      if (selectedOption.sell_price) return Number(selectedOption.sell_price);
      if (selectedOption.value) return Number(selectedOption.value);
    }

    // Fallbacks
    if (product.final_price) return Number(product.final_price);
    if (product.value) return Number(product.value);
    if (product.total_rs) return Number(product.total_rs);
    if (product.price) {
      return typeof product.price === 'string' 
        ? Number(product.price.replace(/[^\d.]/g, '')) 
        : Number(product.price);
    }
    return 0;
  };

  const price = calculatePrice();

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!product?.original_price) return null;
    const original = Number(product.original_price);
    if (original > price) {
      return Math.round(((original - price) / original) * 100);
    }
    return null;
  };

  const discountPercentage = calculateDiscount();

  // Pincode handler
  const handlePincodeCheck = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!pincode.trim() || pincode.trim().length !== 6) return;

    setPincodeLoading(true);
    setPincodeError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pincodes/lookup`, {
        params: { pincode: pincode.trim() }
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setPincodeData({
          city: data.places?.map(p => p.name).join(', ') || data.district || '',
          state: data.state || '',
          estimatedDeliveryText: '5 to 7 business days',
        });
      } else {
        setPincodeData(null);
        setPincodeError('Invalid pincode. Please check and try again.');
      }
    } catch (error) {
      setPincodeData(null);
      setPincodeError(error.response?.data?.message || 'Failed to check pincode');
    } finally {
      setPincodeLoading(false);
    }
  }, [pincode, API_BASE_URL]);

  // Auto-check pincode
  useEffect(() => {
    if (pincode.trim().length === 6) {
      handlePincodeCheck();
    } else {
      setPincodeData(null);
      setPincodeError(null);
    }
  }, [pincode, handlePincodeCheck]);

  // Loading state
  if (loading) return <ProductLoader />;

  // Error state
  if (error) {
    return (
      <div className="product-container">
        <div className="product-error-container">
          <div className="product-error-content">
            <div className="product-error-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#0e593c" />
              </svg>
            </div>
            <h2 className="product-error-title">Oops! Product not found</h2>
            <p className="product-error-message">{error}</p>
            <div className="product-error-actions">
              <button onClick={() => window.location.reload()} className="product-error-retry-btn">
                Try Again
              </button>
              <Link to="/" className="product-error-home-btn">Go to Home</Link>
              <Link to="/shop" className="product-error-shop-btn">Browse Shop</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-container">
        <div className="product-error-container">
          <div className="product-error-content">
            <h2 className="product-error-title">Product Not Found</h2>
            <p className="product-error-message">The product you're looking for doesn't exist.</p>
            <Link to="/shop" className="product-error-home-btn">Browse Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  // Handlers
  const handleCartToggle = () => {
    const firstOption = product?.product_options?.[0] || {};
    const productWithOptions = {
      ...product,
      image: product?.images?.[0]?.image_url
        ? `${API_BASE_URL}${product.images[0].image_url}`
        : product?.image || product?.img || '',
      product_option_id: firstOption.id || null,
      product_id: product.id,
      quantity: quantity
    };

    if (isInCart(product.id)) {
      removeFromCart(product.id);
    } else {
      addToCart(productWithOptions);
    }
  };

  const handleWishlistToggle = () => {
    const firstOption = product?.product_options?.[0] || {};
    const productWithOptions = {
      ...product,
      image: product?.images?.[0]?.image_url
        ? `${API_BASE_URL}${product.images[0].image_url}`
        : product?.image || product?.img || '',
      product_option_id: firstOption.id || null,
      product_id: product.id
    };

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(productWithOptions);
    }
  };

  const handleBookNow = () => {
    const firstOption = product?.product_options?.[0] || {};
    const productWithOptions = {
      ...product,
      image: product?.images?.[0]?.image_url
        ? `${API_BASE_URL}${product.images[0].image_url}`
        : product?.image || product?.img || '',
      product_option_id: firstOption.id || null,
      product_id: product.id,
      quantity: 1
    };

    for (let i = 0; i < quantity; i++) {
      addToVideoCart(productWithOptions);
    }
    navigate('/video-cart');
  };

  const handleCopyOffer = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedOffer(code);
    showNotification(`Coupon ${code} copied!`, 'success');
    setTimeout(() => setCopiedOffer(null), 2000);
  };

  // Extract options
  const sizeOptions = [...new Set(product?.product_options?.map(o => o.size).filter(Boolean) || [])];
  const weightOptions = [...new Set(product?.product_options?.map(o => o.weight).filter(Boolean) || [])];
  const metalTypes = [...new Set(product?.product_options?.map(o => o.metal_type).filter(Boolean) || [])];
  const diamondQualities = [...new Set(product?.product_options?.map(o => o.quality).filter(Boolean) || [])];

  // Media handling
  const images = product?.images?.length > 0
    ? product.images.map(img => ({
        type: 'image',
        url: img.image_url ? `${API_BASE_URL}${img.image_url}` : img,
      }))
    : [];

  const videos = product?.product_videos?.length > 0
    ? product.product_videos.map(video => ({
        type: 'video',
        url: `${API_BASE_URL}${video.video_url}`,
      }))
    : [];

  const media = [...images, ...videos];
  const currentMedia = media[currentImageIndex] || null;

  const nextImage = () => {
    if (media.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % media.length);
    }
  };

  const prevImage = () => {
    if (media.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    }
  };

  // Mock data for UI (replace with actual API data)
  const mockOffers = [
    { code: 'SWEET16', desc: 'EXTRA 16% OFF on Silver Jewellery above ₹1999' },
    { code: 'LOVE20', desc: 'FLAT 20% OFF on Silver Jewellery orders above ₹4499' },
    { code: 'LOVE10', desc: 'FLAT 10% OFF on Silver Jewellery orders above ₹2499' },
  ];

  const mockSpecs = [
    { label: 'Material', value: product.metal_type || '925 Silver' },
    { label: 'Plating', value: product.plating || 'Rose Gold' },
    { label: 'Length', value: product.length || '25 cm + 5 cm Adjustable' },
    { label: 'Stone Type', value: product.stone_type || 'Zircon' },
    { label: 'Net Quantity', value: '1 Unit' },
  ];

  return (
    <div className="product-container">
      {/* Split Layout */}
      <div className="product-split-layout">
        {/* Left Column - Sticky Images */}
        <div className="product-left-column">
          <div 
            className="product-main-image-container" 
            onClick={() => setShowImagePopup(true)}
          >
            {currentMedia?.type === 'video' ? (
              <video 
                src={currentMedia.url} 
                controls 
                className="product-main-image"
              />
            ) : (
              <img 
                src={currentMedia?.url || 'https://via.placeholder.com/600'} 
                alt={product.name} 
                className="product-main-image"
              />
            )}
            
            {/* Navigation buttons */}
            {media.length > 1 && (
              <>
                <button className="product-nav-btn product-prev-btn" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                  <ChevronLeft size={24} />
                </button>
                <button className="product-nav-btn product-next-btn" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {media.length > 1 && (
            <div className="product-thumbnail-row">
              {media.map((item, index) => (
                <div
                  key={index}
                  className={`product-thumbnail-container ${currentImageIndex === index ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  {item.type === 'video' ? (
                    <div className="product-video-thumbnail">
                      <div className="product-video-play-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M8 5v14l11-7z" fill="white" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt={`thumb-${index}`} 
                      className="product-thumbnail" 
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Details */}
        <div className="product-right-column">
          {/* Breadcrumb */}
          <div className="product-breadcrumb">
            <span>Home</span> / <span>{product?.categories?.name || 'Jewellery'}</span> / <span>{product?.subcategories?.name || 'Product'}</span>
          </div>

          {/* Title */}
          <h1 className="product-title">{product?.item_name || product?.name}</h1>
          <p className="product-collection-name">Made With Pure 925 Silver</p>

          {/* Price */}
          <div className="price-block">
            <div className="product-price-section">
              <span className="product-current-price">₹{(price * quantity).toLocaleString()}</span>
              {product.original_price && Number(product.original_price) > price && (
                <>
                  <span className="product-original-price">₹{Number(product.original_price).toLocaleString()}</span>
                  {discountPercentage && (
                    <span className="product-discount-badge">{discountPercentage}% OFF</span>
                  )}
                </>
              )}
            </div>
            <span className="product-mrp-incl">MRP incl. of all taxes</span>
          </div>

          {/* Tax Info */}
          <div className="product-tax-info">inclusive of all taxes</div>

          {/* Size & Weight Selection */}
          {(sizeOptions.length > 0 || weightOptions.length > 0 || metalTypes.length > 0 || diamondQualities.length > 0) && (
            <div className="product-selection-section">
              {/* Size Dropdown */}
              {sizeOptions.length > 0 && (
                <div className="product-dropdown-group">
                  <label>Size:</label>
                  <button
                    className="product-dropdown-btn"
                    onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                  >
                    <span>{selectedSize || 'Select Size'}</span>
                    <img src={DownArrow} alt="down" className="product-dropdown-arrow" />
                  </button>
                  {sizeDropdownOpen && (
                    <div className="product-dropdown-menu">
                      {sizeOptions.map(option => (
                        <div
                          key={option}
                          className={`product-dropdown-item ${selectedSize === option ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedSize(option);
                            setSizeDropdownOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Weight Dropdown */}
              {weightOptions.length > 0 && (
                <div className="product-dropdown-group">
                  <label>Weight:</label>
                  <button
                    className="product-dropdown-btn"
                    onClick={() => setWeightDropdownOpen(!weightDropdownOpen)}
                  >
                    <span>{selectedWeight || 'Select Weight'}</span>
                    <img src={DownArrow} alt="down" className="product-dropdown-arrow" />
                  </button>
                  {weightDropdownOpen && (
                    <div className="product-dropdown-menu">
                      {weightOptions.map(option => (
                        <div
                          key={option}
                          className={`product-dropdown-item ${selectedWeight === option ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedWeight(option);
                            setWeightDropdownOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Metal Type Buttons */}
              {metalTypes.length > 0 && (
                <div className="product-button-group">
                  <label>Metal Type:</label>
                  <div className="product-options-row">
                    {metalTypes.map(metal => (
                      <button
                        key={metal}
                        className={`product-option-btn ${selectedCustomization === metal ? 'active' : ''}`}
                        onClick={() => setSelectedCustomization(metal)}
                      >
                        {metal}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Diamond Quality Buttons */}
              {diamondQualities.length > 0 && (
                <div className="product-button-group">
                  <label>Diamond Quality:</label>
                  <div className="product-options-row">
                    {diamondQualities.map(quality => (
                      <button
                        key={quality}
                        className={`product-option-btn ${selectedPurity === quality ? 'active' : ''}`}
                        onClick={() => setSelectedPurity(quality)}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="product-quantity-section">
            <label>Quantity</label>
            <div className="product-quantity-box">
              <button
                className="product-quantity-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                –
              </button>
              <span className="product-quantity-value">{quantity}</span>
              <button
                className="product-quantity-btn"
                onClick={() => {
                  const maxPieces = product?.pieces || 0;
                  if (maxPieces > 0 && quantity < maxPieces) {
                    setQuantity(quantity + 1);
                  }
                }}
                disabled={!product?.pieces || product.pieces === 0 || quantity >= product.pieces}
              >
                +
                
              </button>
            </div>
            {product?.pieces && product.pieces > 0 && product.pieces < 10 && (
              <span className={`product-stock-warning ${product.pieces <= 3 ? 'product-stock-critical' : ''}`}>
                ⚠️ Only {product.pieces} {product.pieces === 1 ? 'piece' : 'pieces'} remaining!
              </span>
            )}
          </div>

          {/* Pincode Check */}
          <div className="pincode-section">
            <label className="product-pincode-label">Estimated Delivery Time</label>
            <form className="product-pincode-form" onSubmit={handlePincodeCheck}>
              <input
                className="product-pincode-input"
                type="text"
                placeholder="Enter pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              />
              <button 
                className="product-pincode-submit" 
                type="submit" 
                disabled={pincodeLoading || pincode.length !== 6}
              >
                {pincodeLoading ? '...' : 'Check'}
              </button>
            </form>
            
            {pincodeError && <div className="pincode-error">{pincodeError}</div>}
            
            {pincodeData && (
              <div className="pincode-success">
                <div>
                  <Check size={16} style={{ marginRight: '4px' }} /> Delivery Available
                </div>
                <div className="delivery-detail">
                  <span>To:</span> {pincodeData.city}, {pincodeData.state}<br />
                  <span>Est. Delivery:</span> {pincodeData.estimatedDeliveryText}
                </div>
              </div>
            )}

            {!pincodeData && !pincodeError && (
              <div className="product-pincode-hint">
                Enter pincode to check delivery availability
              </div>
            )}

            {/* Store Info Link */}
            <div className="delivery-info-links">
              <a onClick={() => setShowStoreInfo(!showStoreInfo)}>Phone number not available</a>
              {showStoreInfo && (
                <div className="store-info">
                  <MapPin size={16} /> Available at a store near you<br />
                  <span>-- km away</span>
                </div>
              )}
            </div>
          </div>

          {/* Offers Section */}
          <div className="product-offers-section">
            <div className="product-offers-title">
              Offers For You
              <span>(Can be applied at checkout)</span>
            </div>
            <div className="offers-list">
              {mockOffers.map((offer, idx) => (
                <div key={idx} className="offer-item">
                  <span className="offer-tag">
                    EXTRA {offer.code.includes('16') ? '16%' : offer.code.includes('20') ? '20%' : '10%'} OFF
                  </span>
                  <span className="offer-desc">{offer.desc}</span>
                  <button
                    className={`offer-copy-btn ${copiedOffer === offer.code ? 'copied' : ''}`}
                    onClick={() => handleCopyOffer(offer.code)}
                  >
                    {copiedOffer === offer.code ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              ))}
            </div>
            <div className="more-offers-link">+1 more offer</div>
          </div>

          {/* Product Meta Grid */}
          <div className="product-meta-grid">
            {mockSpecs.map((spec, idx) => (
              <div key={idx} className="meta-item">
                <span className="meta-label">{spec.label}</span>
                <span className="meta-value">{spec.value}</span>
              </div>
            ))}
          </div>

          {/* Schedule Call / Book Now (Your existing feature) */}
          <div className="product-info">
            <div className="product-info-row">
              <div className='product-info-row1'>
                <img src={videowhiteIcon} alt="video" className="product-info-label" />
                <span className="product-info-value">Schedule video call</span>
              </div>
              <button className="product-schedule-info" onClick={handleBookNow}>
                Book Now
              </button>
            </div>
          </div>

          {/* Monthly Plan Button */}
          <div className="product-monthly-plan-section">
            <button
              className="product-monthly-plan-btn"
              onClick={() => {
                if (!user || !token) {
                  showNotification('Please login to access the Monthly Plan', 'warning');
                  return;
                }
                navigate('/goldmine');
              }}
            >
              10+1 MONTHLY PLAN
            </button>
          </div>

          {/* Action Buttons */}
          <div className="product-action-buttons">
            <button
              className="product-add-to-cart-btn"
              onClick={handleCartToggle}
              disabled={!product?.pieces || product.pieces === 0}
            >
              <img src={cartIocn} alt="cart" />
              {!product?.pieces || product.pieces === 0 
                ? 'Out of Stock' 
                : (isInCart(product.id) ? 'Remove from Cart' : 'Add to Cart')}
            </button>
            <button className="product-wishlist-btn" onClick={handleWishlistToggle}>
              {isInWishlist(product.id) ? (
                <GoHeartFill size={24} color="#000" />
              ) : (
                <img src={heartIocn} alt="wishlist" />
              )}
            </button>
            <button className="product-share-btn" onClick={() => setShowComparisonPopup(true)}>
              <img src={compareIocn} alt="compare" />
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="product-trust-indicators">
            <div className="product-trust-item">
              <Truck size={18} /> Free Express Shipping
            </div>
            <div className="product-trust-item">
              <Award size={18} /> 15 Days Returns
            </div>
            <div className="product-trust-item">
              <Award size={18} /> Certified Jewellery
            </div>
          </div>

          {/* Product Description */}
          <div className="product-description-section">
            <h3 className="section-title">Product Description</h3>
            <div className="product-description-content">
              {isDescriptionExpanded || !isMobile
                ? product?.description || 'No description available.'
                : product?.description?.slice(0, 200) + '...'}
              {isMobile && product?.description?.length > 200 && (
                <span 
                  className="read-more-toggle" 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                  {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                </span>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="product-specs-grid">
            <div className="spec-group">
              <h4 className="spec-group-title">Basic Information</h4>
              {product?.item_name && (
                <div className="spec-item">
                  <span className="spec-label">Product Name:</span>
                  <span className="spec-value">{product.item_name}</span>
                </div>
              )}
              {product?.categories?.name && (
                <div className="spec-item">
                  <span className="spec-label">Category:</span>
                  <span className="spec-value">{product.categories.name}</span>
                </div>
              )}
              {product?.subcategories?.name && (
                <div className="spec-item">
                  <span className="spec-label">Subcategory:</span>
                  <span className="spec-value">{product.subcategories.name}</span>
                </div>
              )}
            </div>

            <div className="spec-group">
              <h4 className="spec-group-title">Weight & Price</h4>
              {product?.gross_weight && (
                <div className="spec-item">
                  <span className="spec-label">Gross Weight:</span>
                  <span className="spec-value">{product.gross_weight} grams</span>
                </div>
              )}
              {product?.fine_weight && (
                <div className="spec-item">
                  <span className="spec-label">Fine Weight:</span>
                  <span className="spec-value">{product.fine_weight} grams</span>
                </div>
              )}
              {product?.rate && (
                <div className="spec-item">
                  <span className="spec-label">Rate/Gram:</span>
                  <span className="spec-value">₹{product.rate}</span>
                </div>
              )}
            </div>

            <div className="spec-group">
              <h4 className="spec-group-title">Additional Details</h4>
              {product?.design_type && (
                <div className="spec-item">
                  <span className="spec-label">Design Type:</span>
                  <span className="spec-value">{product.design_type}</span>
                </div>
              )}
              {product?.stamp && (
                <div className="spec-item">
                  <span className="spec-label">Stamp:</span>
                  <span className="spec-value">{product.stamp}</span>
                </div>
              )}
              {product?.certificate_number && (
                <div className="spec-item">
                  <span className="spec-label">Certificate:</span>
                  <span className="spec-value">{product.certificate_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="product-collapsible-sections">
            {product?.price_breakup && (
              <details className="product-collapsible-item">
                <summary>
                  Price Breakup
                  <ChevronDown className="product-collapsible-arrow" />
                </summary>
                <div className="product-breakup-content">
                  {product.price_breakup.metal_cost && (
                    <div className="product-breakup-row">
                      <span>Metal Cost:</span>
                      <span>₹{Number(product.price_breakup.metal_cost).toLocaleString()}</span>
                    </div>
                  )}
                  {product.price_breakup.diamond_cost && (
                    <div className="product-breakup-row">
                      <span>Diamond Cost:</span>
                      <span>₹{Number(product.price_breakup.diamond_cost).toLocaleString()}</span>
                    </div>
                  )}
                  {product.price_breakup.making_charges && (
                    <div className="product-breakup-row">
                      <span>Making Charges:</span>
                      <span>₹{Number(product.price_breakup.making_charges).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="product-breakup-row total">
                    <span>Total:</span>
                    <span>₹{(Number(product.price_breakup.metal_cost || 0) +
                      Number(product.price_breakup.diamond_cost || 0) +
                      Number(product.price_breakup.making_charges || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </details>
            )}

            {product?.certificates?.length > 0 && (
              <details className="product-collapsible-item">
                <summary>
                  Certifications
                  <ChevronDown className="product-collapsible-arrow" />
                </summary>
                <div className="product-cert-content">
                  <div className="product-cert-box">
                    {product.certificates.map((cert, idx) => (
                      <div key={idx} className="product-cert-item">
                        {cert.certificate_name}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>

      {/* Similar Products */}
      <div className="similr-section">
        <Similer currentProduct={product} />
      </div>

      {/* Product Banner */}
      <div className="productBanner-section">
        <ProductBanner />
      </div>

      {/* Popups */}
      {reviewPopupOpen && (
        <Suspense fallback={<ProductLoader />}>
          <ReviewPopup
            open={reviewPopupOpen}
            onClose={() => setReviewPopupOpen(false)}
            onReviewSubmit={() => {
              setReviewPopupOpen(false);
              setReviewRefreshKey(prev => prev + 1);
            }}
            productId={product?.id}
          />
        </Suspense>
      )}

      {showImagePopup && (
        <Suspense fallback={<ProductLoader />}>
          <ProductImagePopup
            images={media}
            initialIndex={currentImageIndex}
            onClose={() => setShowImagePopup(false)}
          />
        </Suspense>
      )}

      {showComparisonPopup && (
        <Suspense fallback={<ProductLoader />}>
          <ProductComparisonPopup
            isOpen={showComparisonPopup}
            onClose={() => setShowComparisonPopup(false)}
            currentProductId={product?.id}
            onProductSelect={(selected) => navigate(`/compare/${product.id}/${selected.id}`)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Product;