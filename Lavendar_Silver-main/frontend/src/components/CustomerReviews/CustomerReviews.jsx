import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CustomerReviews.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CustomerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch recent reviews from all products
        const response = await axios.get(`${API_BASE_URL}/api/reviews/recent?limit=3`);
        
        if (response.data && response.data.success) {
          const filteredReviews = (response.data.data || []).filter(review => !review.is_flagged);
          setReviews(filteredReviews.slice(0, 3));
        } else if (response.data && Array.isArray(response.data)) {
          const filteredReviews = response.data.filter(review => !review.is_flagged);
          setReviews(filteredReviews.slice(0, 3));
        } else {
          // Fallback to sample reviews if API doesn't return data
          setReviews(getSampleReviews());
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Use sample reviews on error
        setReviews(getSampleReviews());
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const getSampleReviews = () => [
    {
      id: 1,
      user_name: 'Rohit Kumar',
      user_location: 'Delhi',
      rating: 5,
      review_text: 'Absolutely stunning! The quality is exceptional and the design is exactly as shown. Highly recommend!',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      product_image: null,
      product_name: 'Silver Pendant'
    },
    {
      id: 2,
      user_name: 'Priya Sharma',
      user_location: 'Mumbai',
      rating: 5,
      review_text: 'Beautiful craftsmanship! The attention to detail is remarkable. My friends are asking where I got this from!',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      product_image: null,
      product_name: 'Gold Ring'
    },
    {
      id: 3,
      user_name: 'Amit Patel',
      user_location: 'Bangalore',
      rating: 5,
      review_text: 'Exceeded my expectations! The jewelry looks even better in person. Fast delivery and excellent packaging.',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      product_image: null,
      product_name: 'Diamond Necklace'
    }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getProductImage = (review) => {
    if (review.product_image) {
      return review.product_image.startsWith('http') 
        ? review.product_image 
        : `${API_BASE_URL}${review.product_image}`;
    }
    // Return placeholder or product default image
    return null;
  };

  if (loading) {
    return (
      <div className="customer-reviews-section">
        <div className="customer-reviews-container">
          <div className="reviews-loading">Loading reviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-reviews-section">
      <div className="customer-reviews-container">
        <h2 className="customer-reviews-title">What Our Customers Say</h2>
        <div className="customer-reviews-grid">
          {reviews.map((review) => (
            <div key={review.id} className="customer-review-card">
              <div className="review-card-content">
                <div className="review-card-header">
                  <div className="review-customer-info">
                    <div className="review-customer-name">
                      {review.user_name || 'Customer'}
                      {review.user_location && (
                        <span className="review-customer-location">, {review.user_location}</span>
                      )}
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`review-star ${i < (review.rating || 5) ? 'filled' : ''}`}
                          fill={i < (review.rating || 5) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="review-date">{formatDate(review.created_at)}</div>
                </div>
                <p className="review-text">{review.review_text || 'Great product!'}</p>
              </div>
              {getProductImage(review) && (
                <div className="review-product-image">
                  <img 
                    src={getProductImage(review)} 
                    alt={review.product_name || 'Product'} 
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerReviews;
