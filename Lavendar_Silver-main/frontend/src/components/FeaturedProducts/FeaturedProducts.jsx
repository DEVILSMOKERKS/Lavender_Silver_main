import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useWishlistCart } from '../../context/wishlistCartContext';
import './FeaturedProducts.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToWishlist, removeFromWishlist, wishlist, addToCart } = useWishlistCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products?limit=8&sort=best`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const handleWishlistToggle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return `${API_BASE_URL}${product.images[0]}`;
    }
    return null;
  };

  const getProductPrice = (product) => {
    if (product.product_options && product.product_options.length > 0) {
      return product.product_options[0].sell_price || 0;
    }
    return 0;
  };

  const getOriginalPrice = (product) => {
    if (product.product_options && product.product_options.length > 0) {
      return product.product_options[0].actual_price || 0;
    }
    return 0;
  };

  const calculateDiscount = (currentPrice, originalPrice) => {
    if (originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  };

  if (loading) {
    return <div style={{ minHeight: '400px' }} />;
  }

  return (
    <div className="featured-products-section">
      <div className="featured-products-container">
        <div className="featured-products-grid">
          {products.map((product) => {
            const imageUrl = getProductImage(product);
            const currentPrice = getProductPrice(product);
            const originalPrice = getOriginalPrice(product);
            const discount = calculateDiscount(currentPrice, originalPrice);
            const inWishlist = isInWishlist(product.id);
            const rating = product.rating || 4.5;
            const reviewCount = product.review_count || 0;

            return (
              <Link
                key={product.id}
                to={`/product/${product.slug || product.id}`}
                className="featured-product-card"
              >
                <div className="featured-product-image-wrapper">
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt={product.item_name || 'Product'} 
                      className="featured-product-image"
                      loading="lazy"
                    />
                  )}
                  <button
                    className={`featured-product-wishlist ${inWishlist ? 'active' : ''}`}
                    onClick={(e) => handleWishlistToggle(e, product)}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={18} fill={inWishlist ? '#9370DB' : 'none'} />
                  </button>
                  {discount > 0 && (
                    <div className="featured-product-discount">
                      EXTRA {discount}% OFF
                    </div>
                  )}
                </div>
                <div className="featured-product-info">
                  <div className="featured-product-rating">
                    <div className="featured-product-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < Math.floor(rating) ? '#FBBF24' : 'none'}
                          stroke={i < Math.floor(rating) ? '#FBBF24' : '#ccc'}
                        />
                      ))}
                    </div>
                    <span className="featured-product-review-count">({reviewCount})</span>
                  </div>
                  <h3 className="featured-product-name">
                    {product.item_name || 'Product Name'}
                  </h3>
                  <div className="featured-product-price-row">
                    <span className="featured-product-price">
                      ₹{currentPrice.toLocaleString()}
                    </span>
                    {originalPrice > currentPrice && (
                      <span className="featured-product-original-price">
                        ₹{originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    className="featured-product-add-cart"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
