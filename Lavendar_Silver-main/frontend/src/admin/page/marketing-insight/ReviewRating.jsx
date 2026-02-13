import React, { useState, useEffect, useContext } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import {
  Search,
  Download,
  Eye,
  MessageSquare,
  Edit3,
  Trash2,
  Dot,
  Star,
  BadgeCheck,
  ArrowUpDown,
  MessageCircleMore,
  Flag,
} from "lucide-react";
import "./ReviewRating.css";
import personImage from '../../../assets/img/person.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ReviewRating = () => {
  const { token } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [ratingFilter, setRatingFilter] = useState("All Rating");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={18}
        className={`admin-review-star ${index < rating ? "admin-review-star-filled" : "admin-review-star-empty"}`}
        fill={index < rating ? "#fbbf24" : "none"}
      />
    ));
  };

  const getStatusClass = (isFlagged) => {
    return isFlagged ? "admin-review-status-flagged" : "admin-review-status-published";
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    const csvData = reviews.map(review => ({
      ID: review.id,
      Reviewer: review.user_name,
      Email: review.user_email,
      Product: review.product_name,
      Rating: review.rating,
      Comment: review.review_text,
      Date: formatDate(review.created_at),
      Status: review.is_flagged ? 'Flagged' : 'Published'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reviews_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = (review) => {
    setSelectedReview(review);
    setShowDeletePopup(true);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/reviews`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setReviews(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        toast.error('Failed to load reviews');
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedReview) return;

    try {
      await axios.post(
        `${API_BASE_URL}/api/reviews/${selectedReview.id}/message`,
        { message: message.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Message sent successfully');
      setShowMessageForm(false);
      setMessage('');
      const fetchReviews = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/admin/reviews`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          setReviews(response.data);
        } catch (err) {
          console.error('Error fetching reviews:', err);
          toast.error('Failed to load reviews');
        }
      };
      fetchReviews();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };

  const handleFlagReview = async (reviewId, isFlagged) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/reviews/${reviewId}/flag`,
        { is_flagged: isFlagged },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the local state to reflect the change
      const updatedReviews = reviews.map(review =>
        review.id === reviewId
          ? { ...review, is_flagged: isFlagged }
          : review
      );
      setReviews(updatedReviews);
      toast.success(`Review ${isFlagged ? 'flagged' : 'unflagged'} successfully`);
    } catch (err) {
      console.error('Error updating review status:', err);
      toast.error('Failed to update review status');
    }
  };

  const confirmDelete = async () => {
    if (!selectedReview) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/reviews/${selectedReview.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state to remove the deleted review
      setReviews(reviews.filter((review) => review.id !== selectedReview.id));
      toast.success('Review deleted successfully');
    } catch (err) {
      toast.error('Failed to delete review');
      console.error('Error deleting review:', err);
    } finally {
      setShowDeletePopup(false);
      setSelectedReview(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      (review.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (review.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (review.review_text?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" ||
      (statusFilter === "Published" && !review.is_flagged) ||
      (statusFilter === "Flagged" && review.is_flagged);

    const matchesRating =
      ratingFilter === "All Rating" ||
      review.rating?.toString() === ratingFilter;

    return matchesSearch && matchesStatus && matchesRating;
  });

  if (loading) {
    return (
      <div className="admin-review-loading">
        <div className="admin-review-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-review-error">
        <p>Error loading reviews. Please try again later.</p>
        <button
          className="admin-review-retry"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-review-container">
      <div className="admin-review-header">
        <h1 className="admin-review-title">
          Review & Rating
        </h1>
      </div>

      <div className="admin-review-search-section">
        <div className="admin-review-search-box">
          <div className="admin-review-search-filters">
            <div className="admin-review-search-wrapper">
              <Search className="admin-review-search-icon" />
              <input
                className="admin-review-search-input"
                placeholder="Search reviews, products, or reviewers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="admin-review-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Published">Published</option>
              <option value="Flagged">Flagged</option>
            </select>
            <select
              className="admin-review-filter-select"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="All Rating">All Rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div className="admin-review-export-wrapper">
            <button
              className="admin-review-export-btn"
              onClick={handleExport}
              title="Export to Excel"
            >
              <Download size={16} />
              Export Review
            </button>
          </div>
        </div>
      </div>

      <div className="admin-review-table-container">
        <table className="admin-review-table">
          <thead>
            <tr>
              <th>
                <div className="admin-review-header-cell">
                  <span>
                    <ArrowUpDown
                      size={14}
                      className="admin-review-sort-icon"
                    />
                    REVIEWER
                  </span>
                </div>
              </th>
              <th>
                <div className="admin-review-header-cell">
                  <span>
                    <ArrowUpDown
                      size={14}
                      className="admin-review-sort-icon"
                    />
                    PRODUCT
                  </span>
                </div>
              </th>
              <th>
                <div className="admin-review-header-cell">
                  <span>
                    <ArrowUpDown
                      size={14}
                      className="admin-review-sort-icon"
                    />
                    RATING
                  </span>
                </div>
              </th>
              <th>
                <div className="admin-review-header-cell">
                  <span>
                    <ArrowUpDown
                      size={14}
                      className="admin-review-sort-icon"
                    />
                    COMMENT
                  </span>
                </div>
              </th>
              <th>
                <div className="admin-review-header-cell">
                  <span>
                    <ArrowUpDown
                      size={14}
                      className="admin-review-sort-icon"
                    />
                    DATE
                  </span>
                </div>
              </th>
              <th>
                <div className="admin-review-header-cell">
                  <span>
                    <ArrowUpDown
                      size={14}
                      className="admin-review-sort-icon"
                    />
                    STATUS
                  </span>
                </div>
              </th>
              <th>
                <div className="admin-review-header-cell">
                  <span>
                    <ArrowUpDown
                      size={14}
                      className="admin-review-sort-icon"
                    />
                    ACTIONS
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id}>
                <td>
                  <div className="admin-review-reviewer-cell">
                    <div className="admin-review-avatar">
                      <img
                        src={review.user_photo || personImage}
                        alt={review.user_name}
                      />
                    </div>
                    <div className="admin-review-reviewer-info">
                      <span className="admin-review-reviewer-name">
                        {review.user_name}
                      </span>
                      <span className="admin-review-reviewer-email">
                        {review.user_email}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="admin-review-product-name">
                    {review.product_name}
                  </span>
                </td>
                <td>
                  <div className="admin-review-rating-cell">
                    <div className="admin-review-stars">
                      {renderStars(review.rating)}
                    </div>
                    <span className="admin-review-rating-count">
                      ({review.rating})
                    </span>
                  </div>
                </td>
                <td>
                  <span className="admin-review-comment" title={review.review_text || ''}>
                    {review.review_text ? (review.review_text.length > 30 ? `${review.review_text.substring(0, 30)}...` : review.review_text) : ''}
                  </span>
                </td>
                <td>
                  <span className="admin-review-date">{formatDate(review.created_at)}</span>
                </td>
                <td>
                  <span
                    className={`admin-review-status ${getStatusClass(
                      review.is_flagged
                    )}`}
                  >
                    {review.is_flagged ? "Flagged" : "Published"}
                  </span>
                </td>
                <td>
                  <div className="admin-review-actions">
                    <button
                      className="admin-review-action-btn admin-review-view-btn"
                      onClick={() => {
                        setSelectedReview(review);
                        setShowViewModal(true);
                      }}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="admin-review-action-btn admin-review-message-btn"
                      onClick={() => {
                        setSelectedReview(review);
                        setShowMessageForm(true);
                        setMessage('');
                      }}
                      title="Send Message"
                    >
                      <MessageCircleMore size={16} />
                    </button>
                    <button
                      className="admin-review-action-btn admin-review-flag-btn"
                      onClick={() => handleFlagReview(review.id, !review.is_flagged)}
                      title={review.is_flagged ? "Unflag Review" : "Flag Review"}
                      style={{ color: review.is_flagged ? "#FF0000" : "#8A8A8A" }}
                    >
                      <Flag size={16} />
                    </button>
                    <button
                      className="admin-review-action-btn admin-review-delete-btn"
                      onClick={() => handleDelete(review)}
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {showViewModal && selectedReview && (
        <div className="admin-review-view-modal-overlay">
          <div className="admin-review-view-modal">
            <div className="admin-review-view-modal-header">
              <h2 className="admin-review-view-modal-title">Review Details</h2>
              <button
                className="admin-review-view-modal-close"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedReview(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="admin-review-view-modal-content">
              <div className="admin-review-view-modal-row">
                <span className="admin-review-view-modal-label">Reviewer:</span>
                <span className="admin-review-view-modal-value">
                  <div className="admin-review-reviewer-details">
                    <img
                      src={selectedReview.user_photo || personImage}
                      alt={selectedReview.user_name}
                      className="admin-review-reviewer-avatar"
                    />
                    <div>
                      <div>{selectedReview.user_name}</div>
                      <div className="admin-review-reviewer-email">{selectedReview.user_email}</div>
                    </div>
                  </div>
                </span>
              </div>
              <div className="admin-review-view-modal-row">
                <span className="admin-review-view-modal-label">Product:</span>
                <span className="admin-review-view-modal-value">{selectedReview.product_name}</span>
              </div>
              <div className="admin-review-view-modal-row">
                <span className="admin-review-view-modal-label">Rating:</span>
                <span className="admin-review-view-modal-value">
                  <div className="admin-review-stars">
                    {renderStars(selectedReview.rating)}
                  </div>
                </span>
              </div>
              <div className="admin-review-view-modal-row">
                <span className="admin-review-view-modal-label">Comment:</span>
                <span className="admin-review-view-modal-value">{selectedReview.review_text}</span>
              </div>
              <div className="admin-review-view-modal-row">
                <span className="admin-review-view-modal-label">Date:</span>
                <span className="admin-review-view-modal-value">
                  {formatDate(selectedReview.created_at)}
                </span>
              </div>
              <div className="admin-review-view-modal-row">
                <span className="admin-review-view-modal-label">Status:</span>
                <span className="admin-review-view-modal-value">
                  {selectedReview.is_flagged ? "Flagged" : "Published"}
                </span>
              </div>
              <div className="admin-review-view-modal-row">
                <span className="admin-review-view-modal-label">User ID:</span>
                <span className="admin-review-view-modal-value">
                  {selectedReview.user_id}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && selectedReview && (
        <div className="admin-review-delete-modal-overlay">
          <div className="admin-review-delete-popup">
            <div className="admin-review-delete-message">
              Are you sure you want to delete this review?
            </div>
            <div className="admin-review-delete-buttons">
              <button
                className="admin-review-delete-cancel"
                onClick={() => {
                  setShowDeletePopup(false);
                  setSelectedReview(null);
                }}
              >
                Cancel
              </button>
              <button
                className="admin-review-delete-confirm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Form Modal */}
      {showMessageForm && selectedReview && (
        <div className="admin-review-message-modal-overlay">
          <div className="admin-review-message-modal-content">
            <h3>Send Message to {selectedReview.reviewer}</h3>
            <textarea
              className="admin-review-message-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
            />
            <div className="admin-review-message-modal-buttons">
              <button
                className="admin-review-message-modal-btn admin-review-message-cancel-btn"
                onClick={() => setShowMessageForm(false)}
              >
                Cancel
              </button>
              <button
                className="admin-review-message-modal-btn admin-review-message-send-btn"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewRating;
