import React, { useState, useEffect, useContext } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';
import './CreateRateModal.css';

const CreateRateModal = ({ isOpen, onClose, onSuccess }) => {
    const { token } = useContext(AdminContext);
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        metal_type_name: '',
        metal_type_symbol: '',
        purity_name: '',
        purity_value: '',
        tunch_value: '',
        rate_per_10g: '',
        rate_per_gram: '',
        change_reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Calculate rates based on per 10g rate
    const calculateRatesFrom10g = (ratePer10g) => {
        if (!ratePer10g) return { rate_per_gram: '' };
        const rate = parseFloat(ratePer10g);
        return {
            rate_per_gram: (rate / 10).toFixed(2)
        };
    };

    // Calculate rates based on per gram rate
    const calculateRatesFrom1g = (ratePerGram) => {
        if (!ratePerGram) return { rate_per_10g: '' };
        const rate = parseFloat(ratePerGram);
        return {
            rate_per_10g: (rate * 10).toFixed(2)
        };
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Auto-calculate other rates when per 10g rate changes
        if (name === 'rate_per_10g') {
            const calculatedRates = calculateRatesFrom10g(value);
            setFormData(prev => ({
                ...prev,
                rate_per_gram: calculatedRates.rate_per_gram
            }));
        }

        // Auto-calculate other rates when per gram rate changes
        if (name === 'rate_per_gram') {
            const calculatedRates = calculateRatesFrom1g(value);
            setFormData(prev => ({
                ...prev,
                rate_per_10g: calculatedRates.rate_per_10g
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        if (!formData.metal_type_name) newErrors.metal_type_name = 'Metal type name is required';
        if (!formData.metal_type_symbol) newErrors.metal_type_symbol = 'Metal type symbol is required';
        if (!formData.purity_name) newErrors.purity_name = 'Purity name is required';
        if (!formData.purity_value) newErrors.purity_value = 'Purity value is required';
        if (!formData.tunch_value) newErrors.tunch_value = 'Purity value is required';
        if (!formData.rate_per_10g && !formData.rate_per_gram) {
            newErrors.rate_per_10g = 'Either Rate per 10g or Rate per Gram is required';
            newErrors.rate_per_gram = 'Either Rate per 10g or Rate per Gram is required';
        }
        if (!formData.change_reason) newErrors.change_reason = 'Change reason is required';

        if (formData.rate_per_10g && parseFloat(formData.rate_per_10g) <= 0) {
            newErrors.rate_per_10g = 'Rate must be greater than 0';
        }
        if (formData.rate_per_gram && parseFloat(formData.rate_per_gram) <= 0) {
            newErrors.rate_per_gram = 'Rate must be greater than 0';
        }

        if (formData.purity_value && (parseFloat(formData.purity_value) <= 0 || parseFloat(formData.purity_value) > 100)) {
            newErrors.purity_value = 'Purity value must be between 0 and 100';
        }
        if (formData.tunch_value && (parseFloat(formData.tunch_value) <= 0 || parseFloat(formData.tunch_value) > 1000)) {
            newErrors.tunch_value = 'Purity value must be between 0 and 1000';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!token) {
            showNotification('Please login as admin to perform this action.', 'error');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                metal_type_name: formData.metal_type_name.trim(),
                metal_type_symbol: formData.metal_type_symbol.trim(),
                purity_name: formData.purity_name.trim(),
                purity_value: parseFloat(formData.purity_value),
                tunch_value: parseFloat(formData.tunch_value),
                rate_per_gram: parseFloat(formData.rate_per_gram),
                rate_per_10g: parseFloat(formData.rate_per_10g),
                change_reason: formData.change_reason.trim()
            };

            const response = await axios.post(`${API_BASE_URL}/api/metal-rates/rates/create`, submitData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error creating metal type and rate:', error);
            if (error.response?.data?.message) {
                showNotification(error.response.data.message, 'error');
            } else {
                showNotification('Error creating metal type and rate. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                metal_type_name: '',
                metal_type_symbol: '',
                purity_name: '',
                purity_value: '',
                tunch_value: '',
                rate_per_10g: '',
                rate_per_gram: '',
                change_reason: ''
            });
            setErrors({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="create-rate-modal-overlay">
            <div className="create-rate-modal">
                <div className="create-rate-modal-header">
                    <div className="create-rate-modal-title">
                        <Sparkles className="create-rate-icon" />
                        <h2>Add New Metal Type & Rate</h2>
                    </div>
                    <button className="create-rate-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="create-rate-modal-form">
                    <div className="create-rate-form-section">
                        <h3>Metal Type Information</h3>
                        <div className="create-rate-form-row">
                            <div className="create-rate-form-group">
                                <label>Metal Type Name *</label>
                                <input
                                    type="text"
                                    name="metal_type_name"
                                    value={formData.metal_type_name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Gold, Silver, Platinum"
                                    className={errors.metal_type_name ? 'error' : ''}
                                />
                                {errors.metal_type_name && <span className="error-message">{errors.metal_type_name}</span>}
                            </div>

                            <div className="create-rate-form-group">
                                <label>Metal Type Symbol *</label>
                                <input
                                    type="text"
                                    name="metal_type_symbol"
                                    value={formData.metal_type_symbol}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Au, Ag, Pt"
                                    className={errors.metal_type_symbol ? 'error' : ''}
                                />
                                {errors.metal_type_symbol && <span className="error-message">{errors.metal_type_symbol}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="create-rate-form-section">
                        <h3>Purity Information</h3>
                        <div className="create-rate-form-row">
                            <div className="create-rate-form-group">
                                <label>Purity Name *</label>
                                <input
                                    type="text"
                                    name="purity_name"
                                    value={formData.purity_name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 24K, 22K, 18K, 14K"
                                    className={errors.purity_name ? 'error' : ''}
                                />
                                {errors.purity_name && <span className="error-message">{errors.purity_name}</span>}
                            </div>

                            <div className="create-rate-form-group">
                                <label>Purity Value (%) *</label>
                                <input
                                    type="number"
                                    name="purity_value"
                                    value={formData.purity_value}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 99.9, 91.7, 75.0, 58.5"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    className={errors.purity_value ? 'error' : ''}
                                />
                                {errors.purity_value && <span className="error-message">{errors.purity_value}</span>}
                            </div>

                            <div className="create-rate-form-group">
                                <label>Purity Value *</label>
                                <input
                                    type="number"
                                    name="tunch_value"
                                    value={formData.tunch_value}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 999, 916, 750, 585"
                                    step="1"
                                    min="0"
                                    max="1000"
                                    className={errors.tunch_value ? 'error' : ''}
                                />
                                {errors.tunch_value && <span className="error-message">{errors.tunch_value}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="create-rate-form-section">
                        <h3>Rate Information</h3>
                        <p className="rate-instruction">Fill either Rate per 10g or Rate per Gram - the other will auto-calculate</p>
                        <div className="create-rate-form-row">
                            <div className="create-rate-form-group">
                                <label>Rate per 10g (₹)</label>
                                <input
                                    type="number"
                                    name="rate_per_10g"
                                    value={formData.rate_per_10g}
                                    onChange={handleInputChange}
                                    placeholder="Enter rate per 10g (e.g., 48000)"
                                    step="0.01"
                                    min="0"
                                    className={errors.rate_per_10g ? 'error' : ''}
                                />
                                {errors.rate_per_10g && <span className="error-message">{errors.rate_per_10g}</span>}
                            </div>

                            <div className="create-rate-form-group">
                                <label>Rate per Gram (₹)</label>
                                <input
                                    type="number"
                                    name="rate_per_gram"
                                    value={formData.rate_per_gram}
                                    onChange={handleInputChange}
                                    placeholder="Enter rate per gram or auto-calculated"
                                    step="0.01"
                                    min="0"
                                    className={errors.rate_per_gram ? 'error' : ''}
                                />
                                {errors.rate_per_gram && <span className="error-message">{errors.rate_per_gram}</span>}
                            </div>
                        </div>

                        <div className="create-rate-form-row">
                            <div className="create-rate-form-group">
                                <label>Change Reason *</label>
                                <textarea
                                    name="change_reason"
                                    value={formData.change_reason}
                                    onChange={handleInputChange}
                                    placeholder="Enter reason for creating this metal type and rate"
                                    rows="3"
                                    className={errors.change_reason ? 'error' : ''}
                                />
                                {errors.change_reason && <span className="error-message">{errors.change_reason}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="create-rate-modal-actions">
                        <button type="button" className="create-rate-modal-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="create-rate-modal-save" disabled={loading}>
                            {loading ? 'Creating...' : <><Plus size={16} /> Add Metal Type & Rate</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRateModal; 