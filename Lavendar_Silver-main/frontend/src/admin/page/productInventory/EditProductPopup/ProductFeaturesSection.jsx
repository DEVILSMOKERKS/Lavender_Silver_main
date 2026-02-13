import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import axios from 'axios';
import './ProductFeaturesSection.css';

const ProductFeaturesSection = ({ productId, productFeatures, onFeaturesUpdate }) => {
    const [featureInputs, setFeatureInputs] = useState(['']);
    const [showProductFeaturesPopup, setShowProductFeaturesPopup] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize feature inputs from product features
    useEffect(() => {
        if (productFeatures && productFeatures.length > 0) {
            // Collect all feature points from all feature records
            const allFeaturePoints = [];
            productFeatures.forEach(feature => {
                if (feature.feature_points && feature.feature_points.trim() !== '') {
                    allFeaturePoints.push(feature.feature_points.trim());
                }
            });
            setFeatureInputs(allFeaturePoints.length > 0 ? allFeaturePoints : ['']);
        } else {
            setFeatureInputs(['']);
        }
    }, [productFeatures]);

    // Handle modal close with escape key
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && showProductFeaturesPopup) {
                handleCloseFeaturesModal();
            }
        };

        if (showProductFeaturesPopup) {
            document.addEventListener('keydown', handleEscapeKey);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [showProductFeaturesPopup]);

    // Feature input handlers
    const addFeatureInput = () => {
        setFeatureInputs(prev => [...prev, '']);
    };

    const updateFeatureInput = (index, value) => {
        setFeatureInputs(prev => prev.map((input, i) => i === index ? value : input));
    };

    const removeFeatureInput = (index) => {
        setFeatureInputs(prev => {
            const newInputs = prev.filter((_, i) => i !== index);
            // Ensure at least one input field remains
            return newInputs.length === 0 ? [''] : newInputs;
        });
    };

    // Save features using appropriate API (create or update)
    const saveFeatureInputs = async () => {
        setSaving(true);
        try {
            const validInputs = featureInputs.filter(input => input.trim() !== '');

            if (validInputs.length > 0) {
                const featurePointsString = validInputs.join(',');

                let response;

                // If no existing features, use createProductFeature API
                if (!productFeatures || productFeatures.length === 0 || !productFeatures[0]?.id) {
                    response = await axios.post(
                        `${import.meta.env.VITE_API_URL}/api/products/${productId}/features`,
                        {
                            feature_points: featurePointsString
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                            }
                        }
                    );
                } else {
                    // If existing features, use updateProductFeature API
                    response = await axios.put(
                        `${import.meta.env.VITE_API_URL}/api/product-features/${productFeatures[0].id}`,
                        {
                            feature_points: featurePointsString
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                            }
                        }
                    );
                }

                if (response.data.success) {
                    // Update parent component with new features data
                    const updatedFeatures = response.data.data;
                    onFeaturesUpdate?.(updatedFeatures);
                    return true;
                } else {
                    throw new Error(response.data.message || 'Failed to save features');
                }
            } else {
                // If no valid inputs, delete all existing features if they exist
                if (productFeatures && productFeatures.length > 0) {
                    // Delete all feature records for this product
                    for (const feature of productFeatures) {
                        if (feature.id) {
                            await axios.delete(
                                `${import.meta.env.VITE_API_URL}/api/product-features/${feature.id}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                                    }
                                }
                            );
                        }
                    }
                    onFeaturesUpdate?.([]);
                }
                return true;
            }
        } catch (error) {
            console.error('Error saving product features:', error);
            alert('Failed to save product features. Please try again.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Handle modal close
    const handleCloseFeaturesModal = () => {
        setShowProductFeaturesPopup(false);
    };

    // Handle save and close
    const handleSaveAndCloseFeatures = async () => {
        const success = await saveFeatureInputs();
        if (success) {
            setShowProductFeaturesPopup(false);
        }
    };

    // Handle opening features modal
    const handleOpenFeaturesModal = () => {
        // Initialize feature inputs from current product features
        if (productFeatures && productFeatures.length > 0) {
            // Collect all feature points from all feature records
            const allFeaturePoints = [];
            productFeatures.forEach(feature => {
                if (feature.feature_points && feature.feature_points.trim() !== '') {
                    allFeaturePoints.push(feature.feature_points.trim());
                }
            });
            setFeatureInputs(allFeaturePoints.length > 0 ? allFeaturePoints : ['']);
        } else {
            setFeatureInputs(['']);
        }
        setShowProductFeaturesPopup(true);
    };

    return (
        <>
            {/* Product Features Button */}
            <div className="product-feature-edit-section">
                <div className="product-feature-edit-header-with-button">
                    <h4 className="product-feature-edit-subtitle">Product Features</h4>
                    <button
                        type="button"
                        onClick={handleOpenFeaturesModal}
                        className="product-feature-edit-add-btn"
                    >
                        <Plus size={16} />
                        Edit Features
                    </button>
                </div>

                {/* Display current features */}
                {productFeatures && productFeatures.length > 0 && (
                    <div className="product-feature-edit-current-display">
                        <h5>Current Features:</h5>
                        <div className="product-feature-edit-list">
                            {productFeatures.map((feature, index) => {
                                if (feature.feature_points && feature.feature_points.trim() !== '') {
                                    return (
                                        <span key={index} className="product-feature-edit-tag">
                                            {feature.feature_points.trim()}
                                        </span>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}

                {/* Show message when no features */}
                {(!productFeatures || !productFeatures.length || productFeatures.every(f => !f.feature_points || f.feature_points.trim() === '')) && (
                    <div className="product-feature-edit-no-message">
                        <p>No features added yet. Click "Edit Features" to add product features.</p>
                    </div>
                )}
            </div>

            {/* Product Features Popup */}
            {showProductFeaturesPopup && (
                <div
                    className="product-feature-edit-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleCloseFeaturesModal();
                        }
                    }}
                >
                    <div className="product-feature-edit-modal-content">
                        <div className="product-feature-edit-modal-header">
                            <h3>Product Features</h3>
                            <button
                                type="button"
                                className="product-feature-edit-modal-close-btn"
                                onClick={handleCloseFeaturesModal}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="product-feature-edit-modal-body">
                            {/* Feature Points Multiple Inputs */}
                            <div className="product-feature-edit-points-container">
                                <label className="product-feature-edit-points-label">Feature Points:</label>
                                <div className="product-feature-edit-inputs-list">
                                    {featureInputs.map((input, index) => (
                                        <div key={index} className="product-feature-edit-input-row">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => updateFeatureInput(index, e.target.value)}
                                                placeholder={`Feature point ${index + 1}`}
                                                className="product-feature-edit-input-field"
                                            />
                                            {featureInputs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeatureInput(index)}
                                                    className="product-feature-edit-remove-btn"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addFeatureInput}
                                        className="product-feature-edit-add-btn"
                                    >
                                        + Add Feature Point
                                    </button>
                                </div>
                                <div className="product-feature-edit-points-help">
                                    Add multiple feature points. Each input will be saved as a separate feature.
                                </div>
                            </div>
                        </div>
                        <div className="product-feature-edit-modal-actions">
                            <button
                                type="button"
                                className="product-feature-edit-modal-cancel-btn"
                                onClick={handleCloseFeaturesModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="product-feature-edit-modal-submit-btn"
                                onClick={handleSaveAndCloseFeatures}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Features'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductFeaturesSection;