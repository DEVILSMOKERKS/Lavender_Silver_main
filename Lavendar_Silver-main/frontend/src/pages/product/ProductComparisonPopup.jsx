import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ProductComparisonPopup.css';

const ProductComparisonPopup = ({ isOpen, onClose, currentProductId, onProductSelect }) => {
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (isOpen && currentProductId) {
      fetchSimilarProducts();
    }
  }, [isOpen, currentProductId]);

  const fetchSimilarProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${currentProductId}/similar-for-comparison?limit=8`);
      if (response.data.success) {
        setSimilarProducts(response.data.data.similar_products);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
      setError('Failed to load similar products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    onProductSelect(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="comparison-popup-overlay" onClick={onClose}>
      <div className="comparison-popup" onClick={(e) => e.stopPropagation()}>
        <div className="comparison-popup-header">
          <h3>Compare Products</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} color="white"/>
          </button>
        </div>

        <div className="comparison-popup-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading similar products...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchSimilarProducts} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : similarProducts.length === 0 ? (
            <div className="empty-state">
              <p>No similar products found for comparison</p>
            </div>
          ) : (
            <>
              <p className="comparison-instruction">
                Select a product to compare with the current item
              </p>
              <div className="similar-products-grid">
                {similarProducts.map((product) => (
                  <div key={product.id} className="similar-product-card">
                    <div className="product-image-container">
                      <img
                        src={`${API_BASE_URL}${product.image}`}
                        alt={product.item_name}
                        className="product-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                      {product.discount > 0 && (
                        <div className="discount-badge">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>

                    <div className="product-info">
                      <h4 className="product-name">{product.item_name}</h4>
                      <p className="product-category">{product.category} • {product.subcategory}</p>

                      <div className="product-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              fill={star <= Math.floor(parseFloat(product.avg_rating)) ? "#FFD700" : "none"}
                              color="#FFD700"
                            />
                          ))}
                        </div>
                        <span className="rating-text">
                          {product.avg_rating} ({product.review_count} reviews)
                        </span>
                      </div>

                      <div className="product-price">
                        <span className="current-price">₹{product.current_price?.toLocaleString() || '0'}</span>
                        {product.original_price && product.original_price > product.current_price && (
                          <span className="original-price">₹{product.original_price?.toLocaleString()}</span>
                        )}
                      </div>

                      <div className="product-actions">
                        <button
                          className="compare-btn"
                          onClick={() => handleProductSelect(product)}
                        >
                          Compare Now
                        </button>
                        <Link
                          to={`/product/${product.slug}`}
                          className="view-details-btn"
                          onClick={onClose}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductComparisonPopup; 