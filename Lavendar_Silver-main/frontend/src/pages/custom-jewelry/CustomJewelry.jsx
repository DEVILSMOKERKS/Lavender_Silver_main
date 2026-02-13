import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from '../../utils/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { UserContext } from '../../context/UserContext';
import './CustomJewelry.css';

// Helper function to clean phone number - remove +91 and keep only 10 digits
const cleanPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    // Remove +91 or 91 prefix if present
    if (cleaned.startsWith('91') && cleaned.length > 10) {
        cleaned = cleaned.substring(2);
    }
    // Return only first 10 digits
    return cleaned.slice(0, 10);
};

const CustomJewelry = () => {
    const { user, token } = useContext(UserContext);
    const [formData, setFormData] = useState({
        jewelryType: '',
        metalType: '',
        weight: '',
        designDescription: '',
        budget: '',
        deliveryDate: '',
        contactNumber: cleanPhoneNumber(user?.phone || ''),
        email: user?.email || '',
        address: '',
        specialRequirements: ''
    });
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('form');
    const [errors, setErrors] = useState({});
    const { showNotification } = useNotification();

    // Update contact number when user changes, ensuring it's cleaned (only if field is empty)
    useEffect(() => {
        if (user?.phone) {
            const cleanedPhone = cleanPhoneNumber(user.phone);
            setFormData(prev => {
                // Only update if field is empty (don't overwrite user input)
                if (!prev.contactNumber || prev.contactNumber.trim() === '') {
                    return {
                        ...prev,
                        contactNumber: cleanedPhone
                    };
                }
                return prev;
            });
        }
    }, [user?.phone]);

    const jewelryTypes = [
        'Ring', 'Necklace', 'Earrings', 'Bracelet', 'Pendant',
        'Chain', 'Anklet', 'Bangles', 'Nose Ring', 'Toe Ring',
        'Mangalsutra', 'Temple Jewelry', 'Antique Jewelry', 'Modern Jewelry'
    ];

    const metalTypes = [
        'Gold (22K)', 'Gold (18K)', 'Gold (14K)', 'Gold (10K)',
        'Silver (925)', 'Silver (999)', 'Platinum', 'White Gold',
        'Rose Gold', 'Diamond', 'Gemstone', 'Pearl'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Special handling for contact number - only allow 10 digits, no +91
        if (name === 'contactNumber') {
            const cleaned = cleanPhoneNumber(value);
            setFormData(prev => ({
                ...prev,
                [name]: cleaned
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Field-level validation
    const validateField = (name, value) => {
        const fieldErrors = {};

        switch (name) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    fieldErrors.email = 'Email is required';
                } else if (!emailRegex.test(value)) {
                    fieldErrors.email = 'Please enter a valid email address';
                }
                break;
            case 'contactNumber':
                const phoneRegex = /^[6-9]\d{9}$/;
                if (!value) {
                    fieldErrors.contactNumber = 'Contact number is required';
                } else if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                    fieldErrors.contactNumber = 'Please enter a valid 10-digit phone number';
                }
                break;
            case 'weight':
                if (!value) {
                    fieldErrors.weight = 'Weight is required';
                } else if (parseFloat(value) <= 0) {
                    fieldErrors.weight = 'Weight must be greater than 0';
                }
                break;
            case 'budget':
                if (!value) {
                    fieldErrors.budget = 'Budget is required';
                } else if (parseFloat(value) <= 0) {
                    fieldErrors.budget = 'Budget must be greater than 0';
                }
                break;
            case 'jewelryType':
                if (!value) {
                    fieldErrors.jewelryType = 'Jewelry type is required';
                }
                break;
            case 'metalType':
                if (!value) {
                    fieldErrors.metalType = 'Metal type is required';
                }
                break;
            case 'designDescription':
                if (!value) {
                    fieldErrors.designDescription = 'Design description is required';
                } else if (value.trim().length < 10) {
                    fieldErrors.designDescription = 'Design description must be at least 10 characters';
                }
                break;
            case 'deliveryDate':
                if (value) {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                        fieldErrors.deliveryDate = 'Delivery date cannot be in the past';
                    }
                }
                break;
        }

        return fieldErrors;
    };

    // Validate entire form
    const validateForm = () => {
        const formErrors = {};

        // Validate all required fields
        Object.keys(formData).forEach(key => {
            const fieldError = validateField(key, formData[key]);
            Object.assign(formErrors, fieldError);
        });

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);

        // Check file count
        if (files.length > 5) {
            showNotification('Maximum 5 images allowed', 'error');
            return;
        }

        // Check file size (10MB = 10 * 1024 * 1024 bytes)
        const maxSize = 10 * 1024 * 1024;
        const oversizedFiles = files.filter(file => file.size > maxSize);

        if (oversizedFiles.length > 0) {
            showNotification(`File(s) too large. Maximum file size is 10MB.`, 'error');
            return;
        }

        // Check file types
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

        if (invalidFiles.length > 0) {
            showNotification('Only image files (JPEG, PNG, GIF, WebP) are allowed', 'error');
            return;
        }

        // Store the files directly for form submission
        setUploadedImages(files);
        showNotification('Images selected successfully!', 'success');
    };

    const removeImage = (index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
        showNotification('Image removed successfully!', 'success');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            showNotification('Please fix the errors in the form before submitting', 'error');
            return;
        }

        setIsSubmitting(true);
        setErrors({}); // Clear any previous errors

        try {
            // Create FormData for file upload
            const submitFormData = new FormData();

            // Add form fields - use user's email if logged in, otherwise use form email
            const emailToUse = user && user.email ? user.email : formData.email;
            // Always use form input (already cleaned), ensure it's cleaned before submission
            const contactToUse = cleanPhoneNumber(formData.contactNumber || '');

            submitFormData.append('jewelryType', formData.jewelryType);
            submitFormData.append('metalType', formData.metalType);
            submitFormData.append('weight', formData.weight);
            submitFormData.append('designDescription', formData.designDescription);
            submitFormData.append('budget', formData.budget);
            if (formData.deliveryDate) {
                submitFormData.append('deliveryDate', formData.deliveryDate);
            }
            submitFormData.append('contactNumber', contactToUse);
            submitFormData.append('email', emailToUse);
            if (formData.address) {
                submitFormData.append('address', formData.address);
            }
            if (formData.specialRequirements) {
                submitFormData.append('specialRequirements', formData.specialRequirements);
            }

            // Add uploaded images
            uploadedImages.forEach((image, index) => {
                submitFormData.append('referenceImages', image);
            });

            // Choose endpoint based on authentication status
            const endpoint = user && token ? '/api/custom-jewelry/create-auth' : '/api/custom-jewelry/create';

            // Add auth header if user is logged in
            const headers = {
                'Content-Type': 'multipart/form-data'
            };
            if (user && token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(endpoint, submitFormData, { headers });

            if (response.data.success) {
                setSubmitSuccess(true);
                setFormData({
                    jewelryType: '',
                    metalType: '',
                    weight: '',
                    designDescription: '',
                    budget: '',
                    deliveryDate: '',
                    contactNumber: '',
                    email: '',
                    address: '',
                    specialRequirements: ''
                });
                setUploadedImages([]);
                setErrors({});
                showNotification('Custom jewelry request submitted successfully! You will receive a confirmation email shortly.', 'success');

                // Refresh user requests if logged in
                if (user && token) {
                    // Trigger a refresh by navigating or reloading the requests page
                    setTimeout(() => {
                        if (window.location.pathname.includes('my-account')) {
                            window.location.reload();
                        }
                    }, 2000);
                }
            } else {
                const errorMessage = response.data.message || 'Failed to submit request. Please try again.';
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            let errorMessage = 'Failed to submit request. Please try again.';

            // Handle different error types
            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;

                // Handle validation errors from backend
                if (error.response.status === 400 && error.response.data?.errors) {
                    setErrors(error.response.data.errors);
                }
            } else if (error.request) {
                // Request made but no response
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            showNotification(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Custom Jewelry Design - PVJ</title>
                <meta name="description" content="Create your dream jewelry with our custom design service. Expert craftsmen bring your vision to life with premium materials and exceptional quality." />
                <meta name="keywords" content="custom jewelry, jewelry design, bespoke jewelry, personalized jewelry, gold jewelry, silver jewelry" />
            </Helmet>

            <div className="custom-jewelry-page">
                <div className="custom-jewelry-container">
                    <div className="custom-jewelry-hero">
                        <div className="hero-content">
                            <h1>Get It Custom</h1>
                            <p>Transform your vision into reality with our bespoke jewelry design service</p>
                            <div className="hero-features">
                                <div className="feature">
                                    <i className="fas fa-gem"></i>
                                    <span>Premium Materials</span>
                                </div>
                                <div className="feature">
                                    <i className="fas fa-tools"></i>
                                    <span>Expert Craftsmanship</span>
                                </div>
                                <div className="feature">
                                    <i className="fas fa-heart"></i>
                                    <span>Personalized Design</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="custom-jewelry-content">
                        <div className="custom-jewelry-tab-navigation">
                            <button
                                className={`custom-jewelry-tab-button ${activeTab === 'form' ? 'active' : ''}`}
                                onClick={() => setActiveTab('form')}
                            >
                                <i className="fas fa-edit"></i>
                                Custom Request
                            </button>
                            <button
                                className={`custom-jewelry-tab-button ${activeTab === 'process' ? 'active' : ''}`}
                                onClick={() => setActiveTab('process')}
                            >
                                <i className="fas fa-cogs"></i>
                                Our Process
                            </button>
                        </div>

                        <div className="tab-content">
                            {activeTab === 'form' && (
                                <div className="custom-form-section">
                                    {submitSuccess ? (
                                        <div className="custom-jewelry-success-message">
                                            <i className="fas fa-check-circle"></i>
                                            <h3>Request Submitted Successfully!</h3>
                                            <p>We've received your custom jewelry request. Our design team will review it and get back to you within 24-48 hours.</p>
                                            <button
                                                className="custom-jewelry-submit-another-btn"
                                                onClick={() => setSubmitSuccess(false)}
                                            >
                                                Submit Another Request
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="custom-jewelry-form">
                                            <div className="custom-jewelry-form-grid">
                                                <div className="custom-jewelry-form-group">
                                                    <label htmlFor="jewelryType">Jewelry Type *</label>
                                                    <select
                                                        id="jewelryType"
                                                        name="jewelryType"
                                                        value={formData.jewelryType}
                                                        onChange={handleInputChange}
                                                        className={errors.jewelryType ? 'error' : ''}
                                                        required
                                                    >
                                                        <option value="">Select Jewelry Type</option>
                                                        {jewelryTypes.map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                    {errors.jewelryType && <span className="error-message">{errors.jewelryType}</span>}
                                                </div>

                                                <div className="custom-jewelry-form-group">
                                                    <label htmlFor="metalType">Metal Type *</label>
                                                    <select
                                                        id="metalType"
                                                        name="metalType"
                                                        value={formData.metalType}
                                                        onChange={handleInputChange}
                                                        className={errors.metalType ? 'error' : ''}
                                                        required
                                                    >
                                                        <option value="">Select Metal Type</option>
                                                        {metalTypes.map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                    {errors.metalType && <span className="error-message">{errors.metalType}</span>}
                                                </div>

                                                <div className="custom-jewelry-form-group">
                                                    <label htmlFor="weight">Weight (grams) *</label>
                                                    <input
                                                        type="number"
                                                        id="weight"
                                                        name="weight"
                                                        value={formData.weight}
                                                        onChange={handleInputChange}
                                                        onBlur={(e) => {
                                                            const fieldErrors = validateField('weight', e.target.value);
                                                            setErrors(prev => ({ ...prev, ...fieldErrors }));
                                                        }}
                                                        step="0.01"
                                                        min="0"
                                                        className={errors.weight ? 'error' : ''}
                                                        required
                                                    />
                                                    {errors.weight && <span className="error-message">{errors.weight}</span>}
                                                </div>

                                                <div className="custom-jewelry-form-group">
                                                    <label htmlFor="budget">Budget (₹) *</label>
                                                    <input
                                                        type="number"
                                                        id="budget"
                                                        name="budget"
                                                        value={formData.budget}
                                                        onChange={handleInputChange}
                                                        onBlur={(e) => {
                                                            const fieldErrors = validateField('budget', e.target.value);
                                                            setErrors(prev => ({ ...prev, ...fieldErrors }));
                                                        }}
                                                        min="0"
                                                        className={errors.budget ? 'error' : ''}
                                                        required
                                                    />
                                                    {errors.budget && <span className="error-message">{errors.budget}</span>}
                                                </div>

                                                <div className="custom-jewelry-form-group full-width">
                                                    <label htmlFor="designDescription">Design Description *</label>
                                                    <textarea
                                                        id="designDescription"
                                                        name="designDescription"
                                                        value={formData.designDescription}
                                                        onChange={handleInputChange}
                                                        onBlur={(e) => {
                                                            const fieldErrors = validateField('designDescription', e.target.value);
                                                            setErrors(prev => ({ ...prev, ...fieldErrors }));
                                                        }}
                                                        rows="4"
                                                        placeholder="Describe your dream jewelry in detail..."
                                                        className={errors.designDescription ? 'error' : ''}
                                                        required
                                                    />
                                                    {errors.designDescription && <span className="error-message">{errors.designDescription}</span>}
                                                </div>

                                                <div className="custom-jewelry-form-group">
                                                    <label htmlFor="deliveryDate">Preferred Delivery Date</label>
                                                    <input
                                                        type="date"
                                                        id="deliveryDate"
                                                        name="deliveryDate"
                                                        value={formData.deliveryDate}
                                                        onChange={handleInputChange}
                                                        onBlur={(e) => {
                                                            const fieldErrors = validateField('deliveryDate', e.target.value);
                                                            setErrors(prev => ({ ...prev, ...fieldErrors }));
                                                        }}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className={errors.deliveryDate ? 'error' : ''}
                                                    />
                                                    {errors.deliveryDate && <span className="error-message">{errors.deliveryDate}</span>}
                                                </div>

                                                <div className="custom-jewelry-form-group">
                                                    <label htmlFor="contactNumber">Contact Number *</label>
                                                    <input
                                                        type="tel"
                                                        id="contactNumber"
                                                        name="contactNumber"
                                                        value={formData.contactNumber}
                                                        onChange={handleInputChange}
                                                        onBlur={(e) => {
                                                            const fieldErrors = validateField('contactNumber', e.target.value);
                                                            setErrors(prev => ({ ...prev, ...fieldErrors }));
                                                        }}
                                                        placeholder="Enter 10-digit phone number"
                                                        maxLength="10"
                                                        pattern="[0-9]{10}"
                                                        inputMode="numeric"
                                                        className={errors.contactNumber ? 'error' : ''}
                                                        required
                                                    />
                                                    {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
                                                </div>

                                                <div className="custom-jewelry-form-group">
                                                    <label htmlFor="email">Email *</label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={user && user.email ? user.email : formData.email}
                                                        onChange={handleInputChange}
                                                        onBlur={(e) => {
                                                            const fieldErrors = validateField('email', e.target.value);
                                                            setErrors(prev => ({ ...prev, ...fieldErrors }));
                                                        }}
                                                        disabled={user && user.email ? true : false}
                                                        className={errors.email ? 'error' : ''}
                                                        required
                                                    />
                                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                                    {user && user.email && (
                                                        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                                            Using your account email
                                                        </small>
                                                    )}
                                                </div>

                                                <div className="custom-jewelry-form-group full-width">
                                                    <label htmlFor="address">Delivery Address</label>
                                                    <textarea
                                                        id="address"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        rows="3"
                                                        placeholder="Enter your complete delivery address..."
                                                    />
                                                </div>

                                                <div className="custom-jewelry-form-group full-width">
                                                    <label htmlFor="referenceImages">Reference Images (Optional)</label>
                                                    <div className="custom-jewelry-image-upload-section">
                                                        <input
                                                            type="file"
                                                            id="referenceImages"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="custom-jewelry-file-input"
                                                        />
                                                        <label htmlFor="referenceImages" className="custom-jewelry-file-label">
                                                            <i className="fas fa-cloud-upload-alt"></i>
                                                            <span>Upload Reference Images (Max 5)</span>
                                                        </label>
                                                    </div>
                                                    {uploadedImages.length > 0 && (
                                                        <div className="custom-jewelry-uploaded-images">
                                                            {uploadedImages.map((file, index) => (
                                                                <div key={index} className="custom-jewelry-image-preview">
                                                                    <img
                                                                        src={URL.createObjectURL(file)}
                                                                        alt={`Reference ${index + 1}`}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            console.error('Failed to load image:', file.name);
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="custom-jewelry-remove-image"
                                                                        onClick={() => removeImage(index)}
                                                                    >
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="custom-jewelry-form-actions">
                                                <button
                                                    type="submit"
                                                    className="custom-jewelry-btn-submit"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-paper-plane"></i>
                                                            Submit Custom Request
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {activeTab === 'process' && (
                                <div className="custom-jewelry-process-section">
                                    <h2>Our Custom Jewelry Process</h2>

                                    <div className="custom-jewelry-process-steps">
                                        <div className="custom-jewelry-process-step">
                                            <div className="custom-jewelry-process-step-number">1</div>
                                            <div className="custom-jewelry-process-step-content">
                                                <h3>Consultation</h3>
                                                <p>Share your vision with our design experts</p>
                                            </div>
                                        </div>

                                        <div className="custom-jewelry-process-step">
                                            <div className="custom-jewelry-process-step-number">2</div>
                                            <div className="custom-jewelry-process-step-content">
                                                <h3>Design Creation</h3>
                                                <p>Our artisans create detailed sketches and 3D models</p>
                                            </div>
                                        </div>

                                        <div className="custom-jewelry-process-step">
                                            <div className="custom-jewelry-process-step-number">3</div>
                                            <div className="custom-jewelry-process-step-content">
                                                <h3>Approval</h3>
                                                <p>Review and approve the final design</p>
                                            </div>
                                        </div>

                                        <div className="custom-jewelry-process-step">
                                            <div className="custom-jewelry-process-step-number">4</div>
                                            <div className="custom-jewelry-process-step-content">
                                                <h3>Craftsmanship</h3>
                                                <p>Expert craftsmen bring your design to life</p>
                                            </div>
                                        </div>

                                        <div className="custom-jewelry-process-step">
                                            <div className="custom-jewelry-process-step-number">5</div>
                                            <div className="custom-jewelry-process-step-content">
                                                <h3>Quality Check</h3>
                                                <p>Rigorous quality testing and certification</p>
                                            </div>
                                        </div>

                                        <div className="custom-jewelry-process-step">
                                            <div className="custom-jewelry-process-step-number">6</div>
                                            <div className="custom-jewelry-process-step-content">
                                                <h3>Delivery</h3>
                                                <p>Safe and secure delivery to your doorstep</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomJewelry; 