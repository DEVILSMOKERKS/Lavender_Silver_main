import React from "react";
import './VideoCart.css';
import productImg from '../../assets/img/Two-golden-rings-on-a-soft-surface-with-flowers.jpg';
import discountIcon from '../../assets/img/icons/discount.png';
import cartBan from '../../assets/img/banner/video-cartbanner.png';
import { Truck, ShieldCheck } from 'lucide-react';
import { Plus, Minus } from "lucide-react";
import { FaShoppingCart, FaVideo, FaRegStar, FaCheckCircle } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import VideoCartStepper from './VideoCartStepper';
import { useWishlistCart } from '../../context/wishlistCartContext';
import cartPlusIcon from '../../assets/img/icons/cartPlus.png';
import { useUser } from '../../context/UserContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper: Calculate sell price from product/option
const getSellPrice = (item, selectedOption) => {
  if (selectedOption && selectedOption.sell_price) {
    return Number(selectedOption.sell_price);
  }
  if (selectedOption && selectedOption.value) {
    return Number(selectedOption.value);
  }
  if (item.sell_price) {
    return Number(item.sell_price);
  }
  if (item.final_price) {
    return Number(item.final_price);
  }
  if (item.value) {
    return Number(item.value);
  }
  if (item.total_rs) {
    return Number(item.total_rs);
  }
  if (item.price) {
    return typeof item.price === 'string' ? Number(item.price.replace(/[^\d.]/g, '')) : Number(item.price);
  }
  return 0;
};

// Helper: Get product image URL
const getProductImage = (item, apiBaseUrl) => {
  if (item.images && item.images.length > 0) {
    const firstImage = item.images[0];
    if (typeof firstImage === 'string') {
      return `${apiBaseUrl}${firstImage}`;
    }
    if (firstImage.image_url) {
      return `${apiBaseUrl}${firstImage.image_url}`;
    }
  }
  if (item.image) {
    return item.image;
  }
  return productImg;
};

// Helper: Get option details
const getOptionDetails = (item, selectedOption) => {
  const optionDetails = item.option_details || {};
  return {
    size: optionDetails.size || selectedOption?.size || item.selected_size || '',
    weight: optionDetails.weight || selectedOption?.weight || item.selected_weight || '',
    metalType: optionDetails.metal_color || selectedOption?.metal_color || item.selected_metal_type || '',
    dimensions: optionDetails.dimensions || '',
    gender: optionDetails.gender || '',
    occasion: optionDetails.occasion || ''
  };
};

const VideoCart = () => {
  const {
    videoCart,
    removeFromVideoCart,
    updateVideoCartQuantity,
    cart,
    addToCart,
    removeFromCart,
  } = useWishlistCart();
  const navigate = useNavigate();
  const { user, token } = useUser();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch product details for videoCart
  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const ids = Array.isArray(videoCart) ? videoCart.map(item => item.id) : [];

      if (!ids.length) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/products`, {
          params: { ids: ids.join(',') },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        setProducts(res.data?.data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [videoCart, token]);

  // Merge videoCart with backend products
  const videoCartMap = React.useMemo(() => {
    if (!Array.isArray(videoCart)) return {};
    return videoCart.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [videoCart]);

  const filteredProducts = React.useMemo(() => {
    if (!Array.isArray(videoCart) || !Array.isArray(products)) return [];

    return videoCart
      .map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (!product || !cartItem) return null;

        return {
          ...product,
          ...cartItem,
          option_details: cartItem.option_details || {
            size: cartItem.size || '',
            weight: cartItem.weight || '',
            dimensions: cartItem.dimensions || '',
            metal_color: cartItem.metal_color || '',
            gender: cartItem.gender || '',
            occasion: cartItem.occasion || ''
          },
          product_option_id: cartItem.product_option_id
        };
      })
      .filter(Boolean);
  }, [videoCart, products, videoCartMap]);

  // Calculate subtotal
  const subtotal = React.useMemo(() => {
    return filteredProducts.reduce((sum, item) => {
      const selectedOption = item.product_options?.[0] || null;
      const sellPrice = getSellPrice(item, selectedOption);
      const quantity = Number(item.quantity) || 1;
      return sum + (sellPrice * quantity);
    }, 0);
  }, [filteredProducts]);

  // Handlers
  const handleRemove = async (id) => {
    try {
      await removeFromVideoCart(id);
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const handleIncrease = async (item) => {
    try {
      const currentQuantity = Number(item.quantity) || 1;
      await updateVideoCartQuantity(item.id, currentQuantity + 1);
    } catch (err) {
      console.error('Error increasing quantity:', err);
    }
  };

  const handleDecrease = async (item) => {
    try {
      const currentQuantity = Number(item.quantity) || 1;
      if (currentQuantity > 1) {
        await updateVideoCartQuantity(item.id, currentQuantity - 1);
      } else {
        await handleRemove(item.id);
      }
    } catch (err) {
      console.error('Error decreasing quantity:', err);
    }
  };

  const handleCartToggle = (item) => {
    const inCart = cart.some(c => c.id === item.id);
    if (inCart) {
      removeFromCart(item.id);
    } else {
      addToCart(item);
    }
  };

  if (loading) {
    return (
      <div className="videocart-container">
        <h2 className="videocart-title">Your Video Call Cart</h2>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="videocart-container">
      <VideoCartStepper activeStep={0} />

      <div className="videocart-empty-message">
        <div className="videocart-empty-text">
          {videoCart.length > 0 ? (
            <>
              <div className="videocart-empty-title">
                <b>Browse Exquisite Jewellery Through Personalized Video Consultations.</b>
              </div>
              <div className="videocart-empty-desc">
                Explore Up To 10 Of Your Favourite Designs With A Dedicated Representative For A Convenient Virtual Shopping Experience.
              </div>
            </>
          ) : (
            <>
              <div className="videocart-empty-title">Your Video Call Cart Is Empty</div>
              <div className="videocart-empty-desc">
                Select Upto 10 Designs For Your Personalised Virtual Consultation With Our Representative.
              </div>
            </>
          )}
        </div>
        <div className="videocart-empty-image">
          <img src={cartBan} alt="cart" loading="lazy" decoding="async" />
        </div>
      </div>

      {videoCart.length > 0 ? (
        <>
          <div className="videocart-container">
            <h2 className="videocart-title">
              Your Video Call Cart <span className="videocart-item-count">({videoCart.length} Item{videoCart.length !== 1 ? 's' : ''})</span>
            </h2>
            <div className="videocart-content">
              <div className="videocart-cartbox">
                <div className="videocart-cart-header">
                  <span>PRODUCT</span>
                  <span>QUANTITY</span>
                  <span>PRICE</span>
                  <span>TOTAL</span>
                </div>
                {filteredProducts.map((item) => {
                  const selectedOption = item.product_options?.[0] || null;
                  const sellPrice = getSellPrice(item, selectedOption);
                  const optionDetails = getOptionDetails(item, selectedOption);
                  const imgSrc = getProductImage(item, API_BASE_URL);
                  const quantity = Number(item.quantity) || 1;
                  const actualPrice = Number(item.oldPrice || sellPrice || 0);
                  const discountPercent = actualPrice && sellPrice && actualPrice > sellPrice
                    ? Math.round(100 - (sellPrice / actualPrice) * 100)
                    : null;
                  const inCart = cart.some(c => c.id === item.id);

                  return (
                    <div className="videocart-cart-item" key={item.id}>
                      {/* Mobile structure */}
                      <div className="videocart-cart-item-mobile">
                        <div className="videocart-mobile-row">
                          <Link to={`/product/${item.slug || ''}`}>
                            <img src={imgSrc} alt="Product" className="videocart-product-img" />
                          </Link>
                          <button className="videocart-remove" onClick={() => handleRemove(item.id)}>×</button>
                          <div className="videocart-mobile-info">
                            <Link
                              to={`/product/${item.slug || ''}`}
                              className="videocart-product-name"
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              {item.item_name}
                            </Link>
                            <div className="videocart-collection">Collection name</div>
                            <div className="videocart-mobile-pricing">
                              <span className="videocart-mobile-price">₹{sellPrice.toLocaleString()}</span>
                              {discountPercent && discountPercent > 0 && (
                                <span className="videocart-mobile-discount">{discountPercent}% OFF</span>
                              )}
                            </div>
                            <div className="videocart-mobile-attrs">
                              {item.stamp && (
                                <div className="videocart-product-attr"><strong>Stamp:</strong> {item.stamp}</div>
                              )}
                              {optionDetails.size && (
                                <div className="videocart-product-attr"><strong>Size:</strong> {optionDetails.size}</div>
                              )}
                              {optionDetails.weight && (
                                <div className="videocart-product-attr"><strong>Weight:</strong> {optionDetails.weight}</div>
                              )}
                              {optionDetails.dimensions && (
                                <div className="videocart-product-attr"><strong>Dimensions:</strong> {optionDetails.dimensions}</div>
                              )}
                              {optionDetails.metalType && (
                                <div className="videocart-product-attr"><strong>Metal Type:</strong> {optionDetails.metalType}</div>
                              )}
                              {optionDetails.gender && (
                                <div className="videocart-product-attr"><strong>Gender:</strong> {optionDetails.gender}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="videocart-mobile-bottomrow">
                          <div className="videocart-qty">
                            <button
                              className="videocart-qty-btn"
                              onClick={() => handleDecrease(item)}
                              disabled={quantity <= 1}
                            >
                              <Minus size={18} />
                            </button>
                            <span className="videocart-qty-value">{quantity}</span>
                            <button className="videocart-qty-btn" onClick={() => handleIncrease(item)}>
                              <Plus size={18} />
                            </button>
                          </div>
                          <div className="videocart-mobile-total">₹{(sellPrice * quantity).toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Desktop structure */}
                      <div className="videocart-product-info">
                        <Link to={`/product/${item.slug || ''}`}>
                          <img src={imgSrc} alt="Product" className="videocart-product-img" />
                        </Link>
                        <div className="videocart-product-details">
                          <Link
                            to={`/product/${item.slug || ''}`}
                            className="videocart-product-name"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <strong>Title:</strong> {item.item_name}
                          </Link>
                          {item.stamp && (
                            <div className="videocart-product-attr"><strong>Stamp:</strong> {item.stamp}</div>
                          )}
                          {optionDetails.size && (
                            <div className="videocart-product-attr"><strong>Size:</strong> {optionDetails.size}</div>
                          )}
                          {optionDetails.weight && (
                            <div className="videocart-product-attr"><strong>Weight:</strong> {optionDetails.weight}</div>
                          )}
                          {optionDetails.dimensions && (
                            <div className="videocart-product-attr"><strong>Dimensions:</strong> {optionDetails.dimensions}</div>
                          )}
                          {optionDetails.metalType && (
                            <div className="videocart-product-attr"><strong>Metal Type:</strong> {optionDetails.metalType}</div>
                          )}
                          {optionDetails.gender && (
                            <div className="videocart-product-attr"><strong>Gender:</strong> {optionDetails.gender}</div>
                          )}
                        </div>
                      </div>
                      <div className="videocart-qty">
                        <button
                          className="videocart-qty-btn"
                          onClick={() => handleDecrease(item)}
                          disabled={quantity <= 1}
                        >
                          <Minus size={18} />
                        </button>
                        <span className="videocart-qty-value">{quantity}</span>
                        <button className="videocart-qty-btn" onClick={() => handleIncrease(item)}>
                          <Plus size={18} />
                        </button>
                      </div>
                      <div className="videocart-price">₹{sellPrice.toLocaleString()}</div>
                      <div className="videocart-total">₹{(sellPrice * quantity).toLocaleString()}</div>
                      <button className="videocart-remove" onClick={() => handleRemove(item.id)}>×</button>
                      <div className="videocart-product-offer-row">
                        {item.offer && (
                          <span className="videocart-offer-badge">
                            <img src={discountIcon} alt="offer" />
                            {item.offer}
                          </span>
                        )}
                        <button
                          className={`videocart-cart-btn${inCart ? ' active' : ''}`}
                          onClick={() => handleCartToggle(item)}
                          aria-label={inCart ? 'Remove from cart' : 'Add to cart'}
                          style={{ marginLeft: 12 }}
                        >
                          {inCart ? (
                            <FaShoppingCart size={22} color="var(--green-primary)" />
                          ) : (
                            <img src={cartPlusIcon} alt="cart" style={{ width: 22, height: 22 }} loading="lazy" decoding="async" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="videocart-features">
                  <div className="videocart-feature-badge">
                    <ShieldCheck />
                    Certified Jewellery
                  </div>
                  <div className="videocart-feature-badge">
                    <Truck />
                    Free Delivery
                  </div>
                </div>
              </div>
              <div className="videocart-summarybox">
                <div className="videocart-summary-title">Order Summary</div>
                <div className="videocart-summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="videocart-summary-row">
                  <span>Delivery Charge</span>
                  <span>Free</span>
                </div>
                <div className="videocart-summary-total">
                  <span>Total Payable</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="videocart-summary-actions">
                  <Link to="/shop" className="videocart-addmore-btn">Add More</Link>
                  <button
                    className="videocart-videocall-btn"
                    onClick={() => navigate('/video-cart/booking')}
                  >
                    <FaVideo style={{ marginRight: 8, verticalAlign: 'middle' }} /> Schedule Video Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="videocart-add-items">
            <div className="videocart-add-items-text">Add items in your video call cart</div>
            <Link to="/shop" className="videocart-customize-btn">Customize Your Look</Link>
          </div>

          <div className="videocart-howitworks-section">
            <div className="videocart-howitworks-title">How Does It Work?</div>
            <div className="videocart-howitworks-steps">
              <div className="videocart-howitworks-step">
                <div className="videocart-step-icon howitworks"><FaRegStar /></div>
                <div className="videocart-step-title">Curate Your Selections</div>
                <div className="videocart-step-desc">Add 1 to 10 Designs That Catch Your Eye To Your Video Call Cart.</div>
              </div>
              <div className="videocart-howitworks-step">
                <div className="videocart-step-icon howitworks"><FaVideo /></div>
                <div className="videocart-step-title">Browse Your Picks Virtually</div>
                <div className="videocart-step-desc">Our Representative Will Call You To Set Up A Time For Your Virtual Consultation, At Your Convenience.</div>
              </div>
              <div className="videocart-howitworks-step">
                <div className="videocart-step-icon howitworks"><FaCheckCircle /></div>
                <div className="videocart-step-title">Make The Perfect Choice</div>
                <div className="videocart-step-desc">Shortlist Your Favourites And Request Real-Time Photos And Videos With No Obligation To Purchase.</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoCart;
