import React, { useState, useEffect } from "react";
import axios from "axios";
import './customerReview.css';

const CustomerReview = ({ productId, onWriteReview }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products/${productId}/reviews`);
        // Filter out flagged reviews
        const filteredReviews = (response.data.data || []).filter(review => !review.is_flagged);
        setReviews(filteredReviews);
        setAverageRating(parseFloat(response.data.averageRating) || 0);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]); // ✅ Include productId in dependency array

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, reviews.length));
  };

  const handleViewLess = () => {
    setVisibleCount(3);
  };

  if (loading) {
    return <div className="customer-review-container">Loading reviews...</div>;
  }

  return (
    <div className="customer-review-container">
      <h2 className="customer-review-title">Customer Review</h2>
      {reviews.length > 0 ? (
        <div className="customer-review-summary">
          <div className="customer-review-rating">
            <div className="rating-value">{averageRating.toFixed(1)}</div>
            <div className="rating-label">
              Based on {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </div>
          </div>
          <div className="customer-review-highlights">
            <div className="highlights-title">What Customers Say</div>
            <ul className="highlights-list">
              {reviews.slice(0, 3).map((review, idx) => {
                // Generate highlight from review text
                const highlight = review.review_text
                  ? review.review_text.length > 50
                    ? review.review_text.substring(0, 50) + '...'
                    : review.review_text
                  : "Great product experience";
                return <li key={idx}>{highlight}</li>;
              })}
            </ul>
          </div>
          <div className="customer-review-mentions">
            <div className="mentions-title">Top Mentions</div>
            <div className="mentions-list">
              {(() => {
                // Extract common words from reviews for mentions
                const allWords = reviews
                  .flatMap(review => review.review_text?.toLowerCase().split(/\s+/) || [])
                  .filter(word => word.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));

                const wordCount = {};
                allWords.forEach(word => {
                  wordCount[word] = (wordCount[word] || 0) + 1;
                });

                const topWords = Object.entries(wordCount)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

                return topWords.length > 0 ? topWords : ['Quality', 'Design', 'Craftsmanship', 'Elegant'];
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-reviews-container">
          <div className="no-reviews-content">
            <div className="no-reviews-icon">⭐</div>
            <h3>No Reviews Yet</h3>
            <p>Be the first one to review this product!</p>
          </div>
        </div>
      )}
      {reviews.length > 0 && (
        <>
          {reviews.slice(0, visibleCount).map((review, idx) => (
            <div className="customer-review-card" key={review.id || idx}>
              <div className="review-avatar">{review.user_name?.[0] || "U"}</div>
              <div className="review-content">
                <div className="review-header">
                  <span className="review-author">{review.user_name || "User"}</span>
                  <span className="review-rating-row-inline">
                    <span className="review-date">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                        : "Unknown date"}
                    </span>
                    <span className="review-rating">
                      {[...Array(5)].map((_, i) => {
                        const rating = parseInt(review.rating) || 0;
                        return (
                          <span
                            key={i}
                            className={`star ${i < rating ? 'filled' : ''}`}
                          >
                            ★
                          </span>
                        );
                      })}
                    </span>
                  </span>
                </div>
                <div className="review-text">{review.review_text || "No comment provided."}</div>
                {review.images && review.images.length > 0 && (
                  <div className="review-images">
                    {review.images.map((image, imgIdx) => (
                      <img
                        key={imgIdx}
                        className="review-image"
                        src={`${API_BASE_URL}${image.image_url}`}
                        alt="review"
                      />
                    ))}
                  </div>
                )}
                {review.admin_message && (
                  <div className="admin-reply">
                    <div className="admin-reply-header">
                      <span className="admin-reply-label">Admin Reply:</span>
                      <div className="admin-reply-text">{review.admin_message}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="customer-review-loadmore-row">
            {visibleCount < reviews.length ? (
              <button className="customer-review-loadmore" onClick={handleLoadMore}>
                Load More Reviews
              </button>
            ) : visibleCount > 3 ? (
              <button className="customer-review-loadmore" onClick={handleViewLess}>
                View Less
              </button>
            ) : null}
          </div>
        </>
      )}
      <button className="customer-review-write-btn" onClick={onWriteReview}>
        Write A Review
      </button>
    </div>
  );
};

export default CustomerReview;
