import React, { useRef, useState, useEffect } from "react";
import "./youMayAlsoLike.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import productImage from "../../assets/img/product_image.png";

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

const YouMayAlsoLike = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const [showPrevButton, setShowPrevButton] = useState(false);
  const [showNextButton, setShowNextButton] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products`, {
          params: { limit: 6 }
        });

        // Extract products array from response.data.data
        const responseData = response.data;
        const productsData = Array.isArray(responseData.data) ? responseData.data : [];

        if (!productsData.length) {
          console.warn('No products found in the response');
          setProducts([]);
          return;
        }

        // Transform the API data to match the expected format
        const formattedProducts = productsData.map(product => {
          const firstOption = product.product_options && product.product_options.length > 0 ? product.product_options[0] : null;
          // Use sell_price first, then value as fallback
          const priceValue = firstOption ? (firstOption.sell_price || firstOption.value) : null;
          return {
            id: product.id || Math.random().toString(36).substr(2, 9),
            title: product.item_name || product.title || 'Product',
            price: priceValue ? `₹${Number(priceValue).toLocaleString('en-IN')}` : '₹0',
            img: (product.images && product.images[0] &&
              (typeof product.images[0] === 'string' ? `${API_BASE_URL}${product.images[0]}` : `${API_BASE_URL}${product.images[0]?.image_url}`)) ||
              (product.image) ||
              productImage,
            slug: product.slug || `product-${product.id || Math.random().toString(36).substr(2, 9)}`,
          };
        });

        setProducts(formattedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Check scroll position and update button visibility
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      setShowPrevButton(scrollLeft > 0);
      setShowNextButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (products.length > 0 && scrollContainerRef.current) {
      checkScrollButtons();
      const container = scrollContainerRef.current;
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [products]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.product-card-like')?.offsetWidth || 280;
      scrollContainerRef.current.scrollBy({
        left: -cardWidth - 20,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.product-card-like')?.offsetWidth || 280;
      scrollContainerRef.current.scrollBy({
        left: cardWidth + 20,
        behavior: 'smooth'
      });
    }
  };

  // For drag vs click detection
  const dragInfo = useRef({ x: 0, y: 0, moved: false });

  const handleMouseDown = (e) => {
    dragInfo.current = { x: e.clientX, y: e.clientY, moved: false };
  };

  const handleMouseMove = (e) => {
    if (dragInfo.current.x !== null) {
      const dx = Math.abs(e.clientX - dragInfo.current.x);
      const dy = Math.abs(e.clientY - dragInfo.current.y);
      if (dx > 5 || dy > 5) dragInfo.current.moved = true;
    }
  };

  const handleMouseUp = (slug) => (e) => {
    if (!dragInfo.current.moved) {
      navigate(`/product/${slug}`);
    }
    dragInfo.current = { x: 0, y: 0, moved: false };
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    dragInfo.current = { x: touch.clientX, y: touch.clientY, moved: false };
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (dragInfo.current.x !== null) {
      const dx = Math.abs(touch.clientX - dragInfo.current.x);
      const dy = Math.abs(touch.clientY - dragInfo.current.y);
      if (dx > 5 || dy > 5) dragInfo.current.moved = true;
    }
  };

  const handleTouchEnd = (slug) => (e) => {
    if (!dragInfo.current.moved) {
      navigate(`/product/${slug}`);
    }
    dragInfo.current = { x: 0, y: 0, moved: false };
  };

  if (loading) {
    return (
      <div className="you-may-also-like-container">
        <h3 className="you-may-also-like-title">You May Also Like</h3>
        <div className="loading-products">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="you-may-also-like-container">
        <h3 className="you-may-also-like-title">You May Also Like</h3>
        <div className="error-message">Error loading products: {error}</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="you-may-also-like-container">
        <h3 className="you-may-also-like-title">You May Also Like</h3>
        <div className="you-may-also-like-no-products">
          <div className="you-may-also-like-no-products-icon">
            <div className="you-may-also-like-icon-circle">
              <span className="you-may-also-like-icon">💎</span>
            </div>
          </div>
          <div className="you-may-also-like-no-products-content">
            <h4 className="you-may-also-like-no-products-title">More Products Coming Soon</h4>
            <p className="you-may-also-like-no-products-desc">
              We're adding more beautiful jewelry pieces to our collection. Check back soon for amazing new products!
            </p>
            <div className="you-may-also-like-no-products-features">
              <div className="you-may-also-like-feature-item">
                <span className="you-may-also-like-feature-icon">✨</span>
                <span className="you-may-also-like-feature-text">New Arrivals</span>
              </div>
              <div className="you-may-also-like-feature-item">
                <span className="you-may-also-like-feature-icon">🏆</span>
                <span className="you-may-also-like-feature-text">Premium Quality</span>
              </div>
              <div className="you-may-also-like-feature-item">
                <span className="you-may-also-like-feature-icon">🎨</span>
                <span className="you-may-also-like-feature-text">Unique Designs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="you-may-also-like-container">
      <h3 className="you-may-also-like-title">You May Also Like</h3>
      <div className="you-may-also-like-scroll-wrapper">
        {showPrevButton && (
          <button className="you-may-also-like-scroll-btn prev-btn" onClick={scrollLeft} aria-label="Previous">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div
          className="you-may-also-like-scroll-container"
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card-like-wrapper"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp(product.slug || product.id)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd(product.slug || product.id)}
              role="button"
              tabIndex={0}
            >
              <div className="product-card-like">
                <div className="product-image-container-like">
                  <img src={product.img} alt={product.title} className="product-image-like" loading="lazy" decoding="async" />
                </div>
                <div className="product-info-like">
                  <p className="product-price-like">{product.price}</p>
                  <p className="product-title-like">{product.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {showNextButton && (
          <button className="you-may-also-like-scroll-btn next-btn" onClick={scrollRight} aria-label="Next">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default YouMayAlsoLike;
