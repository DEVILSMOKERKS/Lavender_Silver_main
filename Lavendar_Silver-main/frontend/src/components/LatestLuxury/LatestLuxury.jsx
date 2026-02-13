import React, { useRef, useEffect, useState } from "react";
import "./latestLuxury.css";
import productImg from "../../assets/img/signatureImg.png";
import cartIcon from "../../assets/img/icons/cart.png";
import { Link, useNavigate } from "react-router-dom";
import diamondImg from "../../assets/img/icons/diamond.png";
import flowerImg2 from "../../assets/img/beautiful-ethnic-mandala-design-2.png?w=410&format=webp&q=75";
import { FaStar } from "react-icons/fa";
import wishlistIcon from "../../assets/img/icons/wishlist.png";
import cartPlusIcon from "../../assets/img/icons/cartPlus.png";
import JewelleryDiamondIcon from "../../assets/img/icons/jewelry-diamond.png"
import { useWishlistCart } from "../../context/wishlistCartContext";
import filledHeartIcon from "../../assets/img/icons/Like.png";
import { FaShoppingCart } from "react-icons/fa";
import axios from 'axios';
import { getResponsiveImage } from '../../utils/responsiveImage';

const LatestLuxury = () => {
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(4);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [luxuryProducts, setLuxuryProducts] = useState([]);

  // Wishlist/Cart context
  const {
    wishlist,
    cart,
    addToWishlist,
    removeFromWishlist,
    addToCart,
  } = useWishlistCart();

  const isInWishlist = (id) => wishlist.some(item => item.id === id);
  const isInCart = (id) => cart.some(item => item.id === id);

  const handleWishlistClick = (product) => {
    // Get the first product option for default values
    const firstOption = Array.isArray(product.product_options) && product.product_options.length > 0
      ? product.product_options[0]
      : {};

    const productWithImageAndOptions = {
      ...product,
      image: product.images?.[0]?.image_url
        ? `${import.meta.env.VITE_API_URL}${product.images[0].image_url}`
        : (product.img ? product.img : (product.image ? product.image : productImg)),
      // Extract product options for wishlist/cart
      selected_size: firstOption.size ? firstOption.size : (product.selected_size ? product.selected_size : ""),
      selected_weight: firstOption.weight ? firstOption.weight : (product.selected_weight ? product.selected_weight : ""),
      selected_metal_type: firstOption.metal_type ? firstOption.metal_type : (product.selected_metal_type ? product.selected_metal_type : ""),
      selected_diamond_quality: firstOption.quality ? firstOption.quality : (product.selected_diamond_quality ? product.selected_diamond_quality : ""),
      custom_price: firstOption.value ? firstOption.value : (product.custom_price ? product.custom_price : ""),
      product_id: product.id
    };

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(productWithImageAndOptions);
    }
  };

  const handleAddToCart = (product) => {
    // Get the first product option for default values
    const firstOption = Array.isArray(product.product_options) && product.product_options.length > 0
      ? product.product_options[0]
      : {};

    const productWithImageAndOptions = {
      ...product,
      image: product.images?.[0]?.image_url
        ? `${import.meta.env.VITE_API_URL}${product.images[0].image_url}`
        : (product.img ? product.img : (product.image ? product.image : productImg)),
      // Extract product options for wishlist/cart
      selected_size: firstOption.size ? firstOption.size : (product.selected_size ? product.selected_size : ""),
      selected_weight: firstOption.weight ? firstOption.weight : (product.selected_weight ? product.selected_weight : ""),
      selected_metal_type: firstOption.metal_type ? firstOption.metal_type : (product.selected_metal_type ? product.selected_metal_type : ""),
      selected_diamond_quality: firstOption.quality ? firstOption.quality : (product.selected_diamond_quality ? product.selected_diamond_quality : ""),
      custom_price: firstOption.value ? firstOption.value : (product.custom_price ? product.custom_price : ""),
      product_id: product.id,
      quantity: 1
    };

    if (isInCart(product.id)) {
      // showNotification("Already in cart", "info"); // Removed as per edit hint
    } else {
      addToCart(productWithImageAndOptions);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 600;
      setIsMobile(mobile);

      // Calculate visible items based on screen size
      if (window.innerWidth >= 1400) {
        setVisibleItems(4);
      } else if (window.innerWidth >= 1200) {
        setVisibleItems(4);
      } else if (window.innerWidth >= 900) {
        setVisibleItems(3);
      } else if (window.innerWidth >= 600) {
        setVisibleItems(2);
      } else {
        setVisibleItems(1);
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    // Fetch latest luxury products from API (section endpoint)
    const fetchLatestLuxury = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products/section/latest_luxury`);
        if (res.data && res.data.success) {
          setLuxuryProducts(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching latest luxury products:', err); // Debugging log
      }
    };
    fetchLatestLuxury();
  }, []);

  // Cache card width to avoid forced reflows
  const cardWidthRef = React.useRef(0);
  const gap = 20;
  const scrollTimeoutRef = React.useRef(null);

  // Calculate and cache card width once
  React.useEffect(() => {
    if (carouselRef.current && luxuryProducts.length > 0) {
      const cards = carouselRef.current.querySelectorAll('.latest-luxury-slide');
      if (cards.length > 0) {
        // Use requestAnimationFrame to batch the read
        const rafId = requestAnimationFrame(() => {
          cardWidthRef.current = cards[0].offsetWidth || 0;
        });
        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [luxuryProducts.length]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToIndex = (index) => {
    if (!carouselRef.current) return;

    const container = carouselRef.current;

    // Use cached width or calculate in RAF
    requestAnimationFrame(() => {
      if (cardWidthRef.current === 0) {
        const cards = container.querySelectorAll('.latest-luxury-slide');
        if (cards.length > 0) {
          cardWidthRef.current = cards[0].offsetWidth || 0;
        }
      }

      const scrollPosition = index * (cardWidthRef.current + gap);
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });

      setCurrentIndex(index);
    });
  };

  // Throttle scroll handler to reduce forced reflows
  const handleScroll = () => {
    if (!carouselRef.current) return;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      cancelAnimationFrame(scrollTimeoutRef.current);
    }

    // Batch reads in requestAnimationFrame
    scrollTimeoutRef.current = requestAnimationFrame(() => {
      const container = carouselRef.current;
      if (!container) return;

      const scrollLeft = container.scrollLeft;

      // Use cached width if available
      if (cardWidthRef.current === 0) {
        const cards = container.querySelectorAll('.latest-luxury-slide');
        if (cards.length > 0) {
          cardWidthRef.current = cards[0].offsetWidth || 0;
        }
      }

      if (cardWidthRef.current > 0) {
        const newIndex = Math.round(scrollLeft / (cardWidthRef.current + gap));
        setCurrentIndex(Math.min(newIndex, luxuryProducts.length - 1));
      }
    });
  };

  const renderDots = () => {
    if (!isMobile || luxuryProducts.length === 0) return null;

    return (
      <ul className="latest-luxury-custom-dots">
        {luxuryProducts.map((_, i) => {
          let color = '#d1d1d1';
          if (i === currentIndex) color = '#16784f';
          else if (Math.abs(i - currentIndex) === 1) color = '#949494';

          return (
            <li key={i} className={i === currentIndex ? 'active' : ''}>
              <button
                type="button"
                style={{
                  background: color,
                  borderRadius: '50%',
                  width: 8,
                  height: 8,
                  margin: '0 6px',
                  border: 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="latest-luxury-section" id="latest-luxury-section-id">
      <img src={JewelleryDiamondIcon} alt="Jewellery Diamond" className="jewellery-diamond-top-left" loading="lazy" decoding="async" />
      <img src={flowerImg2} alt="flower" className="flower-decoration flower-bottom-left" loading="lazy" decoding="async" width="410" height="410" />
      <div className="latest-luxury-container">
        <div className="latest-luxury-header">
          <div className="logo-container">
            <img src={diamondImg} alt="Diamond Logo" className="diamond-img" loading="lazy" decoding="async" width="100" height="100" />
          </div>
          <div className="latest-luxury-header-title-wrapper">
            <span className="latest-luxury-header-line"></span>
            <h2>THE LATEST IN LUXURY BY <span>PVJ</span></h2>
            <span className="latest-luxury-header-line"></span>
          </div>
          <p>Discover Our Most Valuable & Premium Luxury Collection</p>
        </div>
        <div className="latest-luxury-carousel-wrapper">
          {/* Show 'Coming Soon' UI if no products */}
          {luxuryProducts.length === 0 ? (
            <div className="latest-luxury-coming-soon-container">
              <div className="latest-luxury-coming-soon-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="var(--green-primary)" />
                  <path d="M19 15L19.74 17.74L22.5 18.5L19.74 19.26L19 22L18.26 19.26L15.5 18.5L18.26 17.74L19 15Z" fill="var(--maroon-primary)" />
                  <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="var(--gold-primary)" />
                </svg>
              </div>
              <h3 className="latest-luxury-coming-soon-title">Coming Soon!</h3>
              <p className="latest-luxury-coming-soon-description">
                We're preparing to showcase our latest luxury collection.<br />
                Stay tuned for our exclusive high-end collection that will showcase the finest jewelry.
              </p>
            </div>
          ) : (
            <>
              <div
                className="latest-luxury-carousel"
                ref={carouselRef}
                onScroll={handleScroll}
              >
                {luxuryProducts.map((product, idx) => {
                  const baseImageUrl = product.images?.[0]?.image_url
                    ? `${import.meta.env.VITE_API_URL}${product.images[0].image_url}`
                    : productImg;
                  const isBackendImage = baseImageUrl.includes('backend.pvjewellers.in') || (baseImageUrl.startsWith('/') && !baseImageUrl.startsWith('/assets'));
                  const imageConfig = isBackendImage ? getResponsiveImage(baseImageUrl, { thumbnail: 300, card: 500, full: 650, quality: 55 }) : { src: baseImageUrl, srcSet: undefined };
                  const productImage = imageConfig.src;
                  const sellPrice = product.product_options?.[0]?.sell_price;
                  const actualPrice = product.product_options?.[0]?.actual_price;
                  return (
                    <div className="latest-luxury-slide" key={`luxury-${product.id}-${idx}`}>
                      <div className="latest-luxury-card"
                        onMouseEnter={() => setHovered(product.id)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <Link
                          to={`/product/${product.slug || product.id}`}
                          className="latest-luxury-img-wrap"
                        >
                          <img
                            src={isInWishlist(product.id) ? filledHeartIcon : wishlistIcon}
                            alt="Wishlist"
                            className={`latest-luxury-heart-btn${isInWishlist(product.id) ? ' active' : ''}`}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleWishlistClick(product);
                            }}
                            title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          />
                          {/* CartPlus or Go to Cart button at bottom right */}
                          {(!product?.pieces || product.pieces === 0) ? (
                            <button
                              className="latest-luxury-cart-btn"
                              tabIndex={-1}
                              disabled
                              style={{ opacity: 0.6, cursor: 'not-allowed', pointerEvents: 'none' }}
                              title="Out of Stock"
                            >
                              <FaShoppingCart className="latest-luxury-cart-icon" style={{ opacity: 0.5 }} />
                            </button>
                          ) : isInCart(product.id) ? (
                            <button
                              className="latest-luxury-cart-btn latest-luxury-cart-btn-go-to-cart"
                              tabIndex={-1}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate("/carts");
                              }}
                            >
                              <FaShoppingCart className="latest-luxury-cart-icon" />
                            </button>
                          ) : (
                            <img
                              src={cartPlusIcon}
                              alt="Add to Cart"
                              className="latest-luxury-cart-btn"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                            />
                          )}
                          <img
                            src={productImage}
                            srcSet={imageConfig.srcSet}
                            sizes="(max-width: 768px) 300px, 500px"
                            alt={product.item_name}
                            className="latest-luxury-img"
                            loading="lazy"
                            decoding="async"
                            width="300"
                            height="300"
                          />
                        </Link>
                        <div className="latest-luxury-card-body">
                          <div className="latest-luxury-title-row">
                            <h3>{product.item_name ? product.item_name.charAt(0).toUpperCase() + product.item_name.slice(1) : 'Product'}</h3>
                            <div className="latest-luxury-rating-row">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className="latest-luxury-star" />
                              ))}
                              <span className="latest-luxury-rating-count">({product.ratingCount || 0})</span>
                            </div>
                          </div>
                          <div className="latest-luxury-description">
                            {product.description || "Lorem Ipsum Is Simply Dummy Text Simply........"}
                            {product.product_options?.[0] && (
                              <div className="latest-luxury-option-details">
                                {product.product_options[0].size && (
                                  <span>Size: {product.product_options[0].size}</span>
                                )}
                                {product.product_options[0].weight && (
                                  <span>Weight: {product.product_options[0].weight}</span>
                                )}
                                {product.product_options[0].metal_color && (
                                  <span>Metal: {product.product_options[0].metal_color}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="latest-luxury-price-row">
                            <span className="latest-luxury-price">{sellPrice ? `₹${sellPrice}` : ""}</span>
                            <span className="latest-luxury-old-price">{actualPrice ? `₹${actualPrice}` : ""}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {renderDots()}
            </>
          )}
        </div>
        <div className="latest-luxury-footer">
          <Link to="/shop" className="latest-luxury-view-btn">View All Product</Link>
        </div>
      </div>
    </section>
  );
};

export default LatestLuxury;
