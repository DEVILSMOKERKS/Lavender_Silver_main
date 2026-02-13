import React, { useRef, useEffect, useState } from "react";
import "./signaturePieces.css";
import productImg from "../../assets/img/signatureImg.png";
import cartIcon from "../../assets/img/icons/cart.png";
import { Link, useNavigate } from "react-router-dom";
import diamondImg from "../../assets/img/icons/diamond.png";
import flowerImg1 from "../../assets/img/beautiful-ethnic-mandala-design-desktop.png?w=410&format=webp&q=75";
import flowerImg2 from "../../assets/img/beautiful-ethnic-mandala-design-desktop.png?w=410&format=webp&q=75";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import wishlistIcon from "../../assets/img/icons/wishlist.png";
import cartPlusIcon from "../../assets/img/icons/cartPlus.png";
import { useWishlistCart } from "../../context/wishlistCartContext";
import filledHeartIcon from "../../assets/img/icons/Like.png";
import { useNotification } from "../../context/NotificationContext";
import axios from "axios";

const SignaturePieces = () => {
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(4);
  const { wishlist, addToWishlist, removeFromWishlist, cart, addToCart } =
    useWishlistCart();
  const navigate = useNavigate();
  const [latestSignatureProducts, setLatestSignatureProducts] = useState([]);
  const [loadingSignature, setLoadingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState(null);

  const isInWishlist = (id) => wishlist.some((item) => item.id === id);
  const isInCart = (id) => cart.some((item) => item.id === id);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 600;
      setIsMobile(mobile);

      // Calculate visible items based on screen size
      if (window.innerWidth >= 1200) {
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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const fetchLatestSignature = async () => {
      setLoadingSignature(true);
      setSignatureError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products/section/signature_pieces`);
        setLatestSignatureProducts(res.data?.data || []);
      } catch (err) {
        console.error('Error fetching signature products:', err);
        setSignatureError(
          err.message || "Failed to fetch latest signature products"
        );
      } finally {
        setLoadingSignature(false);
      }
    };
    fetchLatestSignature();
  }, []);

  // Cache card width to avoid forced reflows
  const cardWidthRef = React.useRef(0);
  const gap = 20;
  const scrollTimeoutRef = React.useRef(null);

  // Calculate and cache card width once
  React.useEffect(() => {
    if (carouselRef.current && latestSignatureProducts.length > 0) {
      const cards = carouselRef.current.querySelectorAll('.signature-slide');
      if (cards.length > 0) {
        // Use requestAnimationFrame to batch the read
        const rafId = requestAnimationFrame(() => {
          cardWidthRef.current = cards[0].offsetWidth || 0;
        });
        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [latestSignatureProducts.length]);

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
        const cards = container.querySelectorAll('.signature-slide');
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
        const cards = container.querySelectorAll('.signature-slide');
        if (cards.length > 0) {
          cardWidthRef.current = cards[0].offsetWidth || 0;
        }
      }

      if (cardWidthRef.current > 0) {
        const newIndex = Math.round(scrollLeft / (cardWidthRef.current + gap));
        setCurrentIndex(Math.min(newIndex, latestSignatureProducts.length - 1));
      }
    });
  };

  const handleWishlistClick = (product) => {
    // Get the first product option for default values
    const firstOption = Array.isArray(product.product_options) && product.product_options.length > 0
      ? product.product_options[0]
      : {};

    const productWithImageAndOptions = {
      ...product,
      image: product.images?.[0]?.image_url
        ? `${import.meta.env.VITE_API_URL}${product.images[0].image_url}`
        : productImg,
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
        : productImg,
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
      // Product already in cart, do nothing or show notification
    } else {
      addToCart(productWithImageAndOptions);
    }
  };

  const renderDots = () => {
    if (!isMobile || latestSignatureProducts.length === 0) return null;

    // On mobile, show max 5 dots
    const maxDots = 5;
    const visibleDots = Math.min(maxDots, latestSignatureProducts.length);

    return (
      <ul className="signature-custom-dots">
        {Array.from({ length: visibleDots }, (_, i) => {
          let color = "#d1d1d1";
          if (i === currentIndex) color = "#16784f";
          else if (Math.abs(i - currentIndex) === 1) color = "#949494";

          return (
            <li key={i} className={i === currentIndex ? "active" : ""}>
              <button
                type="button"
                className="signature-dot-button"
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

  // If no signature products found, show Coming Soon UI
  if (latestSignatureProducts.length === 0) {
    return (
      <section className="signature-section">
        <img src={flowerImg1} alt="flower" className="flower-decoration flower-top-right" loading="lazy" decoding="async" width="385" height="385" />
        <img src={flowerImg2} alt="flower" className="flower-decoration flower-bottom-left" loading="lazy" decoding="async" width="410" height="410" />
        <div className="signature-container">
          <div className="signature-header">
            <div className="logo-container">
              <img src={diamondImg} alt="Diamond Logo" className="diamond-img" loading="lazy" decoding="async" />
            </div>
            <div className="signature-header-title-wrapper">
              <span className="signature-header-line"></span>
              <h2>PVJ Signature Pieces</h2>
              <span className="signature-header-line"></span>
            </div>
          </div>
          <div className="signature-coming-soon-container">
            <div className="signature-coming-soon-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="var(--green-primary)" />
                <path d="M19 15L19.74 17.74L22.5 18.5L19.74 19.26L19 22L18.26 19.26L15.5 18.5L18.26 17.74L19 15Z" fill="var(--maroon-primary)" />
                <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="var(--gold-primary)" />
              </svg>
            </div>
            <h3 className="signature-coming-soon-title">Coming Soon!</h3>
            <p className="signature-coming-soon-description">
              We're preparing to showcase our signature pieces collection.
              Stay tuned for our exclusive collection that will showcase the finest jewelry.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="signature-section">
      <img
        src={flowerImg1}
        alt="flower"
        className="flower-decoration flower-top-right"
        loading="lazy"
        width="385"
        height="385"
      />
      <img
        src={flowerImg2}
        alt="flower"
        className="flower-decoration flower-bottom-left"
        loading="lazy"
        width="410"
        height="410"
      />
      <div className="signature-container">
        <div className="signature-header">
          <div className="logo-container">
            <img src={diamondImg} alt="Diamond Logo" className="diamond-img" loading="lazy" decoding="async" width="100" height="100" />
          </div>
          <div className="signature-header-title-wrapper">
            <span className="signature-header-line"></span>
            <h2>PVJ Signature Pieces</h2>
            <span className="signature-header-line"></span>
          </div>
          <p>Our Most Loved Gold Products By Customers</p>
        </div>
        <div className="signature-carousel-wrapper">
          <div
            className="signature-carousel"
            ref={carouselRef}
            onScroll={handleScroll}
          >
            {latestSignatureProducts.map((product, idx) => (
              <div
                className="signature-slide"
                key={`signature-${product.id}-${idx}`} // Added unique key
                tabIndex={-1}
                aria-hidden={undefined}
              >
                <div className="signature-card">
                  <div
                    className="signature-img-wrap"
                    tabIndex={-1}
                    role="group"
                  >
                    {/* Wishlist icon logic (optional, can be adapted) */}
                    <span className="signature-tag">{product.tag || "Bestseller"}</span>
                    <img
                      src={
                        isInWishlist(product.id)
                          ? filledHeartIcon
                          : wishlistIcon
                      }
                      alt="Wishlist"
                      className="signature-heart-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleWishlistClick(product);
                      }}
                      loading="lazy"
                    />
                    <Link
                      to={`/product/${product.slug || product.id}`}
                      className="signature-img-link"
                      tabIndex={-1}
                    >
                      <img
                        src={
                          product.images?.[0]?.image_url
                            ? `${import.meta.env.VITE_API_URL}${product.images[0].image_url}`
                            : productImg
                        }
                        alt={product.item_name}
                        className="signature-img signature-img-link"
                        loading="lazy"
                      />
                    </Link>
                    {/* Cart icon for mobile only */}
                    {isMobile &&
                      ((!product?.pieces || product.pieces === 0) ? (
                        <button
                          className="signature-cart-btn signature-cart-btn-mobile"
                          type="button"
                          tabIndex={-1}
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                          title="Out of Stock"
                        >
                          <FaShoppingCart className="signature-cart-icon" style={{ opacity: 0.5 }} />
                        </button>
                      ) : isInCart(product.id) ? (
                        <button
                          className="signature-cart-btn signature-cart-btn-mobile signature-cart-btn-go-to-cart"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate("/carts");
                          }}
                        >
                          <FaShoppingCart className="signature-cart-icon" />
                        </button>
                      ) : (
                        <button
                          className="signature-cart-btn signature-cart-btn-mobile"
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                        >
                          <img
                            src={cartPlusIcon}
                            alt="Add to Cart"
                            className="signature-cart-img-icon"
                            loading="lazy"
                          />
                        </button>
                      ))}
                  </div>
                  <div className="signature-card-body">
                    <div className="signature-title-row">
                      <Link
                        to={`/product/${product.slug || product.id}`}
                        className="signature-title-link"
                        tabIndex={-1}
                      >
                        <h3 className="signature-title-text">
                          {product.item_name ? product.item_name.charAt(0).toUpperCase() + product.item_name.slice(1) : 'Product'}
                        </h3>
                      </Link>
                      <div className="signature-rating-row">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className="signature-star"
                          />
                        ))}
                        <span className="signature-rating-count">
                          ({product.ratingCount || 0})
                        </span>
                      </div>
                    </div>
                    <div className="signature-description">
                      {product.description}
                      {product.product_options?.[0] && (
                        <div className="signature-option-details">
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
                    <div className="signature-price-row">
                      <span className="signature-price">
                        {product.product_options?.[0]?.sell_price
                          ? `₹${product.product_options[0].sell_price}`
                          : ""}
                      </span>
                      <span className="signature-old-price">
                        {product.product_options?.[0]?.actual_price
                          ? `₹${product.product_options[0].actual_price}`
                          : ""}
                      </span>
                    </div>
                    {/* Desktop Only - show only if not in mobile view and only for the current product */}
                    {!isMobile &&
                      ((!product?.pieces || product.pieces === 0) ? (
                        <button
                          className="signature-cart-btn signature-cart-btn-desktop"
                          tabIndex={-1}
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        >
                          Out of Stock
                        </button>
                      ) : isInCart(product.id) ? (
                        <button
                          className="signature-cart-btn signature-cart-btn-desktop signature-cart-btn-go-to-cart"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate("/carts");
                          }}
                        >
                          Go to Cart
                        </button>
                      ) : (
                        <button
                          className="signature-cart-btn signature-cart-btn-desktop"
                          tabIndex={-1}
                          onClick={() => handleAddToCart(product)}
                        >
                          Add To Cart
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {renderDots()}
        </div>
        <div className="signature-footer">
          <Link to="/shop?filter=bestseller" className="signature-view-btn">
            View Best Sellers
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SignaturePieces;
