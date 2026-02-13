import React, { useState, useEffect, useContext } from 'react';
import { X, Save, Edit3, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';
import './UpdateRateModal.css';

const UpdateRateModal = ({ isOpen, onClose, selectedRate = null, onSuccess }) => {
    const { token } = useContext(AdminContext);
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        metal_type_id: '',
        purity_id: '',
        tunch_value: '',
        rate_per_10g: '',
        rate_per_gram: '',
        change_reason: ''
    });
    const [metalTypes, setMetalTypes] = useState([]);
    const [purities, setPurities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [originalRate, setOriginalRate] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch metal types
    const fetchMetalTypes = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types`);
            if (response.data.success) {
                setMetalTypes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching metal types:', error);
        }
    };

    // Fetch purities for selected metal type
    const fetchPurities = async (metalTypeId) => {
        if (!metalTypeId) {
            setPurities([]);
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types/${metalTypeId}/purities`);
            if (response.data.success) {
                setPurities(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching purities:', error);
        }
    };

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

    // Calculate change percentage based on 10g rate
    const calculateChangePercentage = (newRate, oldRate) => {
        if (!oldRate || !newRate) return 0;
        return ((newRate - oldRate) / oldRate) * 100;
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

            // Auto-fill change reason based on rate change
            if (value && originalRate) {
                const newRate = parseFloat(value);
                const oldRate = parseFloat(originalRate.rate_per_10g);
                const changePercentage = ((newRate - oldRate) / oldRate) * 100;

                let reason = '';
                if (changePercentage > 0) {
                    reason = `Rate increased by ${changePercentage.toFixed(2)}% - Market price adjustment`;
                } else if (changePercentage < 0) {
                    reason = `Rate decreased by ${Math.abs(changePercentage).toFixed(2)}% - Market price adjustment`;
                } else {
                    reason = 'Rate updated - Market price adjustment';
                }

                setFormData(prev => ({
                    ...prev,
                    change_reason: reason
                }));
            }
        }

        // Auto-calculate other rates when per gram rate changes
        if (name === 'rate_per_gram') {
            const calculatedRates = calculateRatesFrom1g(value);
            setFormData(prev => ({
                ...prev,
                rate_per_10g: calculatedRates.rate_per_10g
            }));

            // Auto-fill change reason based on rate change
            if (value && originalRate) {
                const newRate = parseFloat(value);
                const oldRate = parseFloat(originalRate.rate_per_gram);
                const changePercentage = ((newRate - oldRate) / oldRate) * 100;

                let reason = '';
                if (changePercentage > 0) {
                    reason = `Rate increased by ${changePercentage.toFixed(2)}% - Market price adjustment`;
                } else if (changePercentage < 0) {
                    reason = `Rate decreased by ${Math.abs(changePercentage).toFixed(2)}% - Market price adjustment`;
                } else {
                    reason = 'Rate updated - Market price adjustment';
                }

                setFormData(prev => ({
                    ...prev,
                    change_reason: reason
                }));
            }
        }
    };

    // Handle metal type change
    const handleMetalTypeChange = (e) => {
        const metalTypeId = e.target.value;
        setFormData(prev => ({
            ...prev,
            metal_type_id: metalTypeId,
            purity_id: '' // Reset purity when metal type changes
        }));
        fetchPurities(metalTypeId);
    };

    // Validate form
    const validateForm = () => {

        const newErrors = {};
        if (!formData.metal_type_id) {
            newErrors.metal_type_id = 'Metal type is required';
        }
        if (!formData.purity_id) {
            newErrors.purity_id = 'Purity is required';
        }
        if (!formData.rate_per_10g && !formData.rate_per_gram) {
            newErrors.rate_per_10g = 'Either Rate per 10g or Rate per Gram is required';
            newErrors.rate_per_gram = 'Either Rate per 10g or Rate per Gram is required';
        }
        if (!formData.change_reason) {
            newErrors.change_reason = 'Change reason is required';
        }

        if (formData.rate_per_10g && parseFloat(formData.rate_per_10g) <= 0) {
            newErrors.rate_per_10g = 'Rate must be greater than 0';
        }
        if (formData.rate_per_gram && parseFloat(formData.rate_per_gram) <= 0) {
            newErrors.rate_per_gram = 'Rate must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!token) {
            showNotification('Please login as admin to perform this action.', 'error');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                ...formData,
                rate_per_gram: parseFloat(formData.rate_per_gram),
                rate_per_10g: parseFloat(formData.rate_per_10g)
            };

            const response = await axios.put(`${API_BASE_URL}/api/metal-rates/rates/update`, submitData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });


            if (response.data.success) {
                showNotification('Rate updated successfully!', 'success');
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            }
        } catch (error) {
            console.error('UpdateRateModal: Error updating rate:', error);
            console.error('UpdateRateModal: Error response:', error.response?.data);
            if (error.response?.data?.message) {
                showNotification(error.response.data.message, 'error');
            } else {
                showNotification('Error updating rate. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Initialize form data when modal opens
    useEffect(() => {

        if (isOpen && selectedRate) {
            fetchMetalTypes();
            setOriginalRate(selectedRate);
            setFormData({
                metal_type_id: selectedRate.metal_type_id,
                purity_id: selectedRate.purity_id,
                tunch_value: selectedRate.tunch_value ? selectedRate.tunch_value.toString() : '',
                rate_per_10g: selectedRate.rate_per_10g ? selectedRate.rate_per_10g.toString() : '',
                rate_per_gram: selectedRate.rate_per_gram ? selectedRate.rate_per_gram.toString() : '',
                change_reason: ''
            });

            fetchPurities(selectedRate.metal_type_id);
            setErrors({});
        }
    }, [isOpen, selectedRate]);

    if (!isOpen || !selectedRate) return null;

    const changePercentage = calculateChangePercentage(
        parseFloat(formData.rate_per_10g),
        originalRate?.rate_per_10g
    );

    return (
        <div className="update-rate-modal-overlay">
            <div className="update-rate-modal">
                <div className="update-rate-modal-header">
                    <div className="update-rate-modal-title">
                        <Edit3 className="update-rate-icon" />
                        <h2>Update Metal Rate</h2>
                    </div>
                    <button className="update-rate-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="update-rate-current-info">
                    <div className="current-rate-display">
                        <h3>Current Rate</h3>
                        <div className="current-rate-details">
                            <span className="metal-info">{selectedRate.purity_name} {selectedRate.metal_name}</span>
                            <span className="current-price">₹{selectedRate.rate_per_10g?.toLocaleString()}/10g</span>
                        </div>
                        <div className="current-rate-details">
                            <span className="metal-info">Per Gram: ₹{selectedRate.rate_per_gram?.toLocaleString()}</span>
                        </div>
                        <div className="current-rate-details">
                            <span className="metal-info">Purity Value: {selectedRate.tunch_value || 'N/A'}</span>
                        </div>
                        <div className="current-rate-details">
                            <span className="metal-info">Last Updated: {new Date(selectedRate.updated_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="update-rate-modal-form">
                    <div className="update-rate-form-section">
                        <h3>Update Information</h3>
                        <div className="update-rate-form-row">
                            <div className="update-rate-form-group">
                                <label>Metal Type</label>
                                <select
                                    name="metal_type_id"
                                    value={formData.metal_type_id}
                                    onChange={handleMetalTypeChange}
                                    className={errors.metal_type_id ? 'error' : ''}
                                    disabled
                                >
                                    <option value="">Select Metal Type</option>
                                    {metalTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                {errors.metal_type_id && <span className="error-message">{errors.metal_type_id}</span>}
                            </div>

                            <div className="update-rate-form-group">
                                <label>Purity (Karat)</label>
                                <select
                                    name="purity_id"
                                    value={formData.purity_id}
                                    onChange={handleInputChange}
                                    className={errors.purity_id ? 'error' : ''}
                                    disabled
                                >
                                    <option value="">Select Purity</option>
                                    {purities.map(purity => (
                                        <option key={purity.id} value={purity.id}>{purity.purity_name}</option>
                                    ))}
                                </select>
                                {errors.purity_id && <span className="error-message">{errors.purity_id}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="update-rate-form-section">
                        <h3>New Rate Information</h3>
                        <p className="rate-instruction">Fill either Rate per 10g or Rate per Gram - the other will auto-calculate</p>
                        <div className="update-rate-form-row">
                            <div className="update-rate-form-group">
                                <label>New Rate per 10g (₹)</label>
                                <input
                                    type="number"
                                    name="rate_per_10g"
                                    value={formData.rate_per_10g}
                                    onChange={handleInputChange}
                                    placeholder="Enter new rate per 10g"
                                    step="0.01"
                                    min="0"
                                    className={errors.rate_per_10g ? 'error' : ''}
                                />
                                {errors.rate_per_10g && <span className="error-message">{errors.rate_per_10g}</span>}
                            </div>

                            <div className="update-rate-form-group">
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

                        <div className="update-rate-form-row">
                            <div className="update-rate-form-group">
                                <label>Purity Value</label>
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

                            <div className="update-rate-form-group">
                                <label>Change Reason *</label>
                                <textarea
                                    name="change_reason"
                                    value={formData.change_reason}
                                    onChange={handleInputChange}
                                    placeholder="Enter reason for updating this rate"
                                    rows="3"
                                    className={errors.change_reason ? 'error' : ''}
                                />
                                {errors.change_reason && <span className="error-message">{errors.change_reason}</span>}
                            </div>
                        </div>

                        {changePercentage !== 0 && (
                            <div className="change-indicator">
                                <TrendingUp className={`change-icon ${changePercentage > 0 ? 'positive' : 'negative'}`} />
                                <span className={`change-text ${changePercentage > 0 ? 'positive' : 'negative'}`}>
                                    {changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(2)}% change
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="update-rate-modal-actions">
                        <button type="button" className="update-rate-modal-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="update-rate-modal-save" disabled={loading}>
                            {loading ? 'Updating...' : <><Save size={16} /> Update Rate</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateRateModal; 