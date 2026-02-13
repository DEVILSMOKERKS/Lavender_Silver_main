import React, { useState } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import './ReviewPopup.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ReviewPopup = ({ open, onClose, onReviewSubmit, productId }) => {
    const { showNotification } = useNotification();
    const { token, user } = useUser();
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [name, setName] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    if (!open) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImage(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating) {
            showNotification('Please select a rating', 'warning');
            return;
        }

        if (!token) {
            showNotification('Please login or signup first to write a review', 'error');
            onClose();
            return;
        }

        try {
            setLoading(true);
            setErrorMessage(''); // Clear any previous error messages

            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('review_text', review); // Use review_text, not comment
            formData.append('user_name', user?.name || name); // Use user's name if available
            if (image) {
                formData.append('image', image);
            }

            await axios.post(
                `${API_BASE_URL}/api/products/${productId}/reviews`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            showNotification('Review submitted successfully!', 'success');
            if (onReviewSubmit) {
                onReviewSubmit();  // Trigger parent component to refresh reviews
            }

            // Reset form
            setRating(0);
            setReview('');
            setName('');
            setImage(null);
            setImagePreview(null);

            // Close popup immediately
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            if (error.response?.status === 401) {
                showNotification('Please login or signup first to write a review', 'error');
                onClose(); // Close the review popup
            } else if (error.response?.status === 400 && error.response?.data?.message === 'You have already reviewed this product') {
                setErrorMessage('You have already submitted a review for this product. Thank you for your feedback!');
                // Auto-hide message after 3 seconds
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            } else {
                setErrorMessage('Failed to submit review. Please try again.');
                // Auto-hide message after 3 seconds
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-modal">
                <button className="review-popup-close" onClick={onClose}>&times;</button>
                <h2>Write a Review</h2>
                <form className="review-popup-form" onSubmit={handleSubmit}>
                    <div className="review-popup-rating">
                        <label htmlFor="review-popup-rating-stars">Rating:</label>
                        <div className="review-popup-stars" id="review-popup-rating-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={star <= rating ? 'star filled' : 'star'}
                                    onClick={() => setRating(star)}
                                    role="button"
                                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                    tabIndex={0}
                                >&#9733;</span>
                            ))}
                        </div>
                    </div>
                    <div className="review-popup-field">
                        <label htmlFor="review-popup-text">Your Review:</label>
                        <textarea
                            id="review-popup-text"
                            name="review"
                            value={review}
                            onChange={e => setReview(e.target.value)}
                            required
                            rows={4}
                            placeholder="Share your experience..."
                        />
                    </div>
                    <div className="review-popup-field">
                        <label htmlFor="review-popup-name">Your Name:</label>
                        <input
                            id="review-popup-name"
                            name="name"
                            type="text"
                            value={user?.name || name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="Enter your name"
                            readOnly={!!user?.name}
                        />
                    </div>
                    <div className="review-popup-field">
                        <label htmlFor="review-popup-image">Upload Image:</label>
                        <input
                            id="review-popup-image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="review-popup-image-preview">
                                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, marginTop: 8, borderRadius: 8 }} loading="lazy" decoding="async" />
                            </div>
                        )}
                    </div>
                    <button className="review-popup-submit" type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                    {errorMessage && (
                        <div className="review-popup-error-message">
                            {errorMessage}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ReviewPopup; 