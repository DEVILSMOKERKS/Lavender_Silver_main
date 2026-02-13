import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Heart, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import './ProductComparison.css';

const ProductComparison = () => {
  const { product1_id, product2_id } = useParams();
  const navigate = useNavigate();
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    specifications: true,
    priceBreakup: true,
    options: true,
    reviews: true
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (product1_id && product2_id) {
      fetchComparisonData();
    }
  }, [product1_id, product2_id]);

  const fetchComparisonData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/compare/${product1_id}/${product2_id}`);
      if (response.data.success) {
        setComparisonData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={16} fill="#FFD700" color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} size={16} fill="#FFD700" color="#FFD700" />);
      } else {
        stars.push(<Star key={i} size={16} fill="none" color="#FFD700" />);
      }
    }
    return stars;
  };

  const renderComparisonRow = (label, value1, value2, type = 'text') => {
    const isBetter = type === 'price' && typeof value1 === 'number' && typeof value2 === 'number' ? (value1 < value2) : false;
    
    return (
      <div className="comparison-row">
        <div className="comparison-label">{label}</div>
        <div className={`comparison-value ${type === 'price' && typeof value1 === 'number' && typeof value2 === 'number' && value1 < value2 ? 'better' : ''}`}>
          {type === 'price' && typeof value1 === 'number' ? `₹${value1.toLocaleString()}` : value1 || 'N/A'}
        </div>
        <div className={`comparison-value ${type === 'price' && typeof value1 === 'number' && typeof value2 === 'number' && value2 < value1 ? 'better' : ''}`}>
          {type === 'price' && typeof value2 === 'number' ? `₹${value2.toLocaleString()}` : value2 || 'N/A'}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ProductComparison-loading">
        <div className="ProductComparison-loading-spinner"></div>
        <p>Loading comparison data...</p>
      </div>
    );
  }

  if (error || !comparisonData) {
    return (
      <div className="ProductComparison-error">
        <h2>Error Loading Comparison</h2>
        <p>{error || 'Unable to load product comparison'}</p>
        <button onClick={() => navigate(-1)} className="ProductComparison-back-btn">
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  const { product1, product2 } = comparisonData;

  return (
    <div className="ProductComparison-page">
      <div className="ProductComparison-header">
        <button onClick={() => navigate(-1)} className="ProductComparison-back-btn">
          <ArrowLeft size={20} />
          Back to Products
        </button>
        <h1>Product Comparison</h1>
      </div>

      <div className="ProductComparison-container">
        {/* Product Headers */}
        <div className="ProductComparison-product-headers">
          <div className="ProductComparison-product-header">
            <div className="ProductComparison-product-image-container">
              <img
                src={`${API_BASE_URL}${product1.main_image}`}
                alt={product1.name}
                className="ProductComparison-product-image"
              />
            </div>
            <h2 className="ProductComparison-product-name">{product1.name}</h2>
            <p className="ProductComparison-product-category">{product1.category} • {product1.subcategory}</p>
            <div className="ProductComparison-product-rating">
              <div className="ProductComparison-stars">
                {renderStars(parseFloat(product1.avg_rating))}
              </div>
              <span className="ProductComparison-rating-text">
                {product1.avg_rating} ({product1.review_count} reviews)
              </span>
            </div>
            <div className="ProductComparison-product-price">
              <span className="ProductComparison-current-price">₹{product1.options?.[0]?.price?.toLocaleString() || 'Price on request'}</span>
              {product1.options?.[0]?.price && product1.options?.[0]?.price > 0 && (
                <span className="ProductComparison-original-price">₹{(product1.options?.[0]?.price * 1.1).toLocaleString()}</span>
              )}
            </div>
            <Link to={`/product/${product1.slug}`} className="ProductComparison-view-product-btn">
              View Product
            </Link>
          </div>

          <div className="ProductComparison-vs-divider">
            <span>VS</span>
          </div>

          <div className="ProductComparison-product-header">
            <div className="ProductComparison-product-image-container">
              <img
                src={`${API_BASE_URL}${product2.main_image}`}
                alt={product2.name}
                className="ProductComparison-product-image"
              />
            </div>
            <h2 className="ProductComparison-product-name">{product2.name}</h2>
            <p className="ProductComparison-product-category">{product2.category} • {product2.subcategory}</p>
            <div className="ProductComparison-product-rating">
              <div className="ProductComparison-stars">
                {renderStars(parseFloat(product2.avg_rating))}
              </div>
              <span className="ProductComparison-rating-text">
                {product2.avg_rating} ({product2.review_count} reviews)
              </span>
            </div>
            <div className="ProductComparison-product-price">
              <span className="ProductComparison-current-price">₹{product2.options?.[0]?.price?.toLocaleString() || 'Price on request'}</span>
              {product2.options?.[0]?.price && product2.options?.[0]?.price > 0 && (
                <span className="ProductComparison-original-price">₹{(product2.options?.[0]?.price * 1.1).toLocaleString()}</span>
              )}
            </div>
            <Link to={`/product/${product2.slug}`} className="ProductComparison-view-product-btn">
              View Product
            </Link>
          </div>
        </div>

        {/* Comparison Sections */}
        <div className="ProductComparison-comparison-sections">
          {/* Basic Information */}
          <div className="ProductComparison-comparison-section">
            <div className="ProductComparison-section-header">
              <h3>Basic Information</h3>
            </div>
            <div className="ProductComparison-comparison-table">
              {renderComparisonRow('Product Name', product1.name, product2.name)}
              {renderComparisonRow('Category', product1.category, product2.category)}
              {renderComparisonRow('Subcategory', product1.subcategory, product2.subcategory)}
              {renderComparisonRow('Current Price', product1.options?.[0]?.price || 'Price on request', product2.options?.[0]?.price || 'Price on request', 'price')}
              {renderComparisonRow('Original Price', product1.options?.[0]?.price ? (product1.options?.[0]?.price * 1.1) : 'N/A', product2.options?.[0]?.price ? (product2.options?.[0]?.price * 1.1) : 'N/A', 'price')}
              {renderComparisonRow('Discount', `${product1.discount}%`, `${product2.discount}%`)}
              {renderComparisonRow('Rating', product1.avg_rating, product2.avg_rating)}
              {renderComparisonRow('Reviews', product1.review_count, product2.review_count)}
            </div>
          </div>

          {/* Specifications */}
          <div className="ProductComparison-comparison-section">
            <div className="ProductComparison-section-header" onClick={() => toggleSection('specifications')}>
              <h3>Specifications</h3>
              {expandedSections.specifications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.specifications && (
              <div className="ProductComparison-comparison-table">
                {renderComparisonRow('Product Code', product1.specifications?.product_code, product2.specifications?.product_code)}
                {renderComparisonRow('Dimensions', product1.specifications?.dimensions, product2.specifications?.dimensions)}
                {renderComparisonRow('Product Weight', `${product1.specifications?.product_weight}g`, `${product2.specifications?.product_weight}g`)}
                {renderComparisonRow('Diamond Total Weight', `${product1.specifications?.diamond_total_weight}ct`, `${product2.specifications?.diamond_total_weight}ct`)}
                {renderComparisonRow('Number of Diamonds', product1.specifications?.diamond_count, product2.specifications?.diamond_count)}
                {renderComparisonRow('Diamond Quality', product1.specifications?.diamond_quality, product2.specifications?.diamond_quality)}
                {renderComparisonRow('Metal Type', product1.specifications?.metal_type, product2.specifications?.metal_type)}
                {renderComparisonRow('Metal Purity', product1.specifications?.metal_purity, product2.specifications?.metal_purity)}
                {renderComparisonRow('Metal Weight', `${product1.specifications?.metal_weight}g`, `${product2.specifications?.metal_weight}g`)}
              </div>
            )}
          </div>

          {/* Price Breakup */}
          <div className="ProductComparison-comparison-section">
            <div className="ProductComparison-section-header" onClick={() => toggleSection('priceBreakup')}>
              <h3>Price Breakup</h3>
              {expandedSections.priceBreakup ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.priceBreakup && (
              <div className="ProductComparison-comparison-table">
                {renderComparisonRow('Metal Cost', product1.price_breakup?.metal_cost, product2.price_breakup?.metal_cost, 'price')}
                {renderComparisonRow('Diamond Cost', product1.price_breakup?.diamond_cost, product2.price_breakup?.diamond_cost, 'price')}
                {renderComparisonRow('Making Charges', product1.price_breakup?.making_charges, product2.price_breakup?.making_charges, 'price')}
                {renderComparisonRow('Total Cost', 
                  (product1.price_breakup?.metal_cost || 0) + (product1.price_breakup?.diamond_cost || 0) + (product1.price_breakup?.making_charges || 0),
                  (product2.price_breakup?.metal_cost || 0) + (product2.price_breakup?.diamond_cost || 0) + (product2.price_breakup?.making_charges || 0),
                  'price'
                )}
              </div>
            )}
          </div>

          {/* Product Options */}
          <div className="ProductComparison-comparison-section">
            <div className="ProductComparison-section-header" onClick={() => toggleSection('options')}>
              <h3>Available Options</h3>
              {expandedSections.options ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSections.options && (
              <div className="ProductComparison-options-comparison">
                <div className="ProductComparison-options-column">
                  <h4>Product 1 Options</h4>
                  {product1.options?.length > 0 ? (
                    <div className="ProductComparison-options-list">
                      {product1.options.map((option, index) => (
                        <div key={index} className="ProductComparison-option-item">
                          <div>Size: {option.size}</div>
                          <div>Weight: {option.weight}</div>
                          <div>Metal: {option.metal_type}</div>
                          <div>Quality: {option.quality}</div>
                          <div className="ProductComparison-option-price">₹{option.price?.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ProductComparison-no-options">No options available</p>
                  )}
                </div>
                <div className="ProductComparison-options-column">
                  <h4>Product 2 Options</h4>
                  {product2.options?.length > 0 ? (
                    <div className="ProductComparison-options-list">
                      {product2.options.map((option, index) => (
                        <div key={index} className="ProductComparison-option-item">
                          <div>Size: {option.size}</div>
                          <div>Weight: {option.weight}</div>
                          <div>Metal: {option.metal_type}</div>
                          <div>Quality: {option.quality}</div>
                          <div className="ProductComparison-option-price">₹{option.price?.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ProductComparison-no-options">No options available</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="ProductComparison-comparison-section">
            <div className="ProductComparison-section-header">
              <h3>Description</h3>
            </div>
            <div className="ProductComparison-description-comparison">
              <div className="ProductComparison-description-column">
                <h4>Product 1</h4>
                <p>{product1.description || 'No description available'}</p>
              </div>
              <div className="ProductComparison-description-column">
                <h4>Product 2</h4>
                <p>{product2.description || 'No description available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ProductComparison-comparison-actions">
          <Link to={`/product/${product1.slug}`} className="ProductComparison-action-btn ProductComparison-primary">
            <ShoppingCart size={16} />
            Buy Product 1
          </Link>
          <Link to={`/product/${product2.slug}`} className="ProductComparison-action-btn ProductComparison-primary">
            <ShoppingCart size={16} />
            Buy Product 2
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductComparison;