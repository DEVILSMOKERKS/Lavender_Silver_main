import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';
import './PredictionManagement.css';

const PredictionManagement = () => {
    const { token } = useContext(AdminContext);
    const { showNotification } = useNotification();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        metal_type: 'Gold',
        current_price: '',
        predicted_price: '',
        price_change: '',
        market_confidence: 65,
        forecast_period: '24 hours',
        market_analysis: '',
        recommend_buy: '',
        is_active: true
    });

    useEffect(() => {
        fetchPredictions();
    }, []);

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_BASE_URL}/api/metal-rates/predictions/admin/all`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setPredictions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
            showNotification('Error fetching predictions', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch current price when metal type changes
    const fetchCurrentPrice = async (metalType) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/metal-rates/predictions/current-price/${metalType}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const currentPrice = response.data.data.rate_per_10g;
                setFormData(prev => {
                    const newFormData = {
                        ...prev,
                        current_price: currentPrice
                    };
                    
                    // Auto-calculate price_change if predicted_price exists
                    if (prev.predicted_price && currentPrice > 0) {
                        const predictedPrice = parseFloat(prev.predicted_price);
                        const calculatedChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
                        newFormData.price_change = calculatedChange.toFixed(2);
                    }
                    
                    return newFormData;
                });
            }
        } catch (error) {
            console.error('Error fetching current price:', error);
            showNotification(
                `Unable to fetch current ${metalType} price. Please enter manually.`,
                'warning'
            );
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // If metal_type changes, fetch current price
        if (name === 'metal_type' && value !== formData.metal_type) {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
                current_price: '' // Clear current price to show loading
            }));
            fetchCurrentPrice(value);
            return;
        }

        // If recommend_buy text changes, auto-fill other fields
        if (name === 'recommend_buy') {
            const recommendText = value.trim().toLowerCase();
            
            // Auto-fill based on text content (only if text is not empty)
            let autoFilledData = {};
            
            if (value.trim()) {
                // Auto-fill market_confidence based on text
                if (recommendText.includes('high') || recommendText.includes('strong') || recommendText.includes('excellent') || recommendText.includes('very good')) {
                    autoFilledData.market_confidence = 85;
                } else if (recommendText.includes('medium') || recommendText.includes('moderate') || recommendText.includes('good') || recommendText.includes('fair')) {
                    autoFilledData.market_confidence = 70;
                } else if (recommendText.includes('low') || recommendText.includes('weak') || recommendText.includes('poor') || recommendText.includes('bad')) {
                    autoFilledData.market_confidence = 55;
                } else {
                    // Keep existing value or default
                    autoFilledData.market_confidence = formData.market_confidence || 65;
                }
                
                // Auto-fill forecast_period if mentioned in text
                if (recommendText.includes('hour') || recommendText.includes('hr')) {
                    const hourMatch = recommendText.match(/(\d+)\s*(?:hour|hr)/);
                    if (hourMatch) {
                        autoFilledData.forecast_period = `${hourMatch[1]} hours`;
                    } else if (!formData.forecast_period || formData.forecast_period === '24 hours') {
                        autoFilledData.forecast_period = '24 hours';
                    }
                } else if (recommendText.includes('day')) {
                    const dayMatch = recommendText.match(/(\d+)\s*days?/);
                    if (dayMatch) {
                        autoFilledData.forecast_period = `${dayMatch[1]} days`;
                    } else if (!formData.forecast_period || formData.forecast_period === '24 hours') {
                        autoFilledData.forecast_period = '7 days';
                    }
                } else if (recommendText.includes('week')) {
                    const weekMatch = recommendText.match(/(\d+)\s*weeks?/);
                    if (weekMatch) {
                        autoFilledData.forecast_period = `${weekMatch[1]} weeks`;
                    } else if (!formData.forecast_period || formData.forecast_period === '24 hours') {
                        autoFilledData.forecast_period = '1 week';
                    }
                } else if (recommendText.includes('month')) {
                    const monthMatch = recommendText.match(/(\d+)\s*months?/);
                    if (monthMatch) {
                        autoFilledData.forecast_period = `${monthMatch[1]} months`;
                    } else if (!formData.forecast_period || formData.forecast_period === '24 hours') {
                        autoFilledData.forecast_period = '1 month';
                    }
                }
                
                // Auto-fill market_analysis if not already filled
                if (!formData.market_analysis || formData.market_analysis.trim() === '') {
                    autoFilledData.market_analysis = value;
                }
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: value,
                ...autoFilledData
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-calculate price_change if both prices are provided
        if (name === 'current_price' || name === 'predicted_price') {
            const currentPrice = name === 'current_price' ? parseFloat(value) : parseFloat(formData.current_price);
            const predictedPrice = name === 'predicted_price' ? parseFloat(value) : parseFloat(formData.predicted_price);
            
            if (currentPrice && predictedPrice && currentPrice > 0) {
                const calculatedChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
                setFormData(prev => ({
                    ...prev,
                    price_change: calculatedChange.toFixed(2)
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                current_price: parseFloat(formData.current_price),
                predicted_price: parseFloat(formData.predicted_price),
                price_change: parseFloat(formData.price_change) || 0,
                market_confidence: parseInt(formData.market_confidence) || 65,
                recommend_buy: formData.recommend_buy || '' // Send text directly to backend
            };

            if (editingId) {
                await axios.put(
                    `${API_BASE_URL}/api/metal-rates/predictions/admin/${editingId}`,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                showNotification('Prediction updated successfully', 'success');
            } else {
                await axios.post(
                    `${API_BASE_URL}/api/metal-rates/predictions/admin`,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                showNotification('Prediction created successfully', 'success');
            }

            setShowAddModal(false);
            setEditingId(null);
            resetForm();
            fetchPredictions();
        } catch (error) {
            console.error('Error saving prediction:', error);
            showNotification(
                error.response?.data?.message || 'Error saving prediction',
                'error'
            );
        }
    };

    const handleEdit = (prediction) => {
        setEditingId(prediction.id);
        setFormData({
            metal_type: prediction.metal_type,
            current_price: prediction.current_price,
            predicted_price: prediction.predicted_price,
            price_change: prediction.price_change,
            market_confidence: prediction.market_confidence,
            forecast_period: prediction.forecast_period,
            market_analysis: prediction.market_analysis || '',
            recommend_buy: prediction.recommend_buy || '',
            is_active: prediction.is_active === 1
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this prediction?')) return;

        try {
            await axios.delete(
                `${API_BASE_URL}/api/metal-rates/predictions/admin/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            showNotification('Prediction deleted successfully', 'success');
            fetchPredictions();
        } catch (error) {
            console.error('Error deleting prediction:', error);
            showNotification('Error deleting prediction', 'error');
        }
    };

    const activeGold = predictions.find(p => p.metal_type === 'Gold' && p.is_active === 1);
    const activeSilver = predictions.find(p => p.metal_type === 'Silver' && p.is_active === 1);
    const hasBothPredictions = activeGold && activeSilver;
    const availableMetalTypes = [];
    if (!activeGold) availableMetalTypes.push('Gold');
    if (!activeSilver) availableMetalTypes.push('Silver');

    const resetForm = () => {
        // Set default metal type to first available metal type
        const defaultMetal = availableMetalTypes.length > 0 ? availableMetalTypes[0] : 'Gold';
        setFormData({
            metal_type: defaultMetal,
            current_price: '',
            predicted_price: '',
            price_change: '',
            market_confidence: 65,
            forecast_period: '24 hours',
            market_analysis: '',
            recommend_buy: '',
            is_active: true
        });
        setEditingId(null);
    };

    return (
        <div className="prediction-management-container">
            <div className="prediction-management-header">
                <h2>Metal Price Predictions Management</h2>
                {!hasBothPredictions && (
                    <button
                        className="add-prediction-btn"
                        onClick={async () => {
                            resetForm();
                            setShowAddModal(true);
                            // Auto-fetch current price for default metal type
                            const defaultMetal = availableMetalTypes.length > 0 ? availableMetalTypes[0] : 'Gold';
                            await fetchCurrentPrice(defaultMetal);
                        }}
                    >
                        <Plus size={18} />
                        Add Prediction
                    </button>
                )}
            </div>

            {/* Active Predictions Status */}
            <div className="active-predictions-status">
                <div className="status-card">
                    <h3>Gold</h3>
                    {activeGold ? (
                        <div className="status-active">
                            <span className="status-indicator active"></span>
                            Active
                        </div>
                    ) : (
                        <div className="status-inactive">
                            <span className="status-indicator inactive"></span>
                            No Active Prediction
                        </div>
                    )}
                </div>
                <div className="status-card">
                    <h3>Silver</h3>
                    {activeSilver ? (
                        <div className="status-active">
                            <span className="status-indicator active"></span>
                            Active
                        </div>
                    ) : (
                        <div className="status-inactive">
                            <span className="status-indicator inactive"></span>
                            No Active Prediction
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading predictions...</div>
            ) : (
                <div className="predictions-table-container">
                    <table className="predictions-table">
                        <thead>
                            <tr>
                                <th>Metal Type</th>
                                <th>Current Price</th>
                                <th>Predicted Price</th>
                                <th>Price Change</th>
                                <th>Confidence</th>
                                <th>Forecast Period</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="no-data">
                                        No predictions found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                predictions.map((prediction) => (
                                    <tr key={prediction.id} className={prediction.is_active === 1 ? 'active-row' : ''}>
                                        <td>{prediction.metal_type}</td>
                                        <td>₹{parseFloat(prediction.current_price).toLocaleString()}</td>
                                        <td>₹{parseFloat(prediction.predicted_price).toLocaleString()}</td>
                                        <td className={prediction.price_change >= 0 ? 'positive' : 'negative'}>
                                            {prediction.price_change >= 0 ? '+' : ''}{prediction.price_change}%
                                        </td>
                                        <td>{prediction.market_confidence}%</td>
                                        <td>{prediction.forecast_period}</td>
                                        <td>
                                            <span className={`status-badge ${prediction.is_active === 1 ? 'active' : 'inactive'}`}>
                                                {prediction.is_active === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => handleEdit(prediction)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(prediction.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Prediction' : 'Add New Prediction'}</h3>
                            <button
                                className="close-btn"
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetForm();
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="prediction-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Metal Type *</label>
                                    <select
                                        name="metal_type"
                                        value={formData.metal_type}
                                        onChange={handleInputChange}
                                        required
                                        disabled={editingId !== null || hasBothPredictions}
                                    >
                                        {editingId ? (
                                            // Edit mode: show current metal type only
                                            <>
                                                {formData.metal_type === 'Gold' && <option value="Gold">Gold (24K)</option>}
                                                {formData.metal_type === 'Silver' && <option value="Silver">Silver</option>}
                                            </>
                                        ) : (
                                            // Add mode: show only available metal types
                                            <>
                                                {!activeGold && <option value="Gold">Gold (24K)</option>}
                                                {!activeSilver && <option value="Silver">Silver</option>}
                                            </>
                                        )}
                                    </select>
                                    {!editingId && (
                                        <small>Current price will be auto-fetched from metal rates</small>
                                    )}
                                    {hasBothPredictions && !editingId && (
                                        <small style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>
                                            Both Gold and Silver predictions already exist. Edit existing predictions instead.
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Forecast Period *</label>
                                    <input
                                        type="text"
                                        name="forecast_period"
                                        value={formData.forecast_period}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 30 minutes, 2 hours, 5 days, 3 months"
                                        required
                                    />
                                    <small>Enter custom time period (e.g., "30 minutes", "2 hours", "5 days", "3 months")</small>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Current Price (₹ per 10g) *</label>
                                    <input
                                        type="number"
                                        name="current_price"
                                        value={formData.current_price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        required
                                        placeholder={formData.metal_type === 'Gold' ? 'Auto-fetched from 24K Gold rate' : 'Auto-fetched from Silver rate'}
                                    />
                                    <small>
                                        {formData.metal_type === 'Gold' 
                                            ? 'Fetched from 24K Gold rate' 
                                            : 'Fetched from highest purity Silver rate'}
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Predicted Price (₹) *</label>
                                    <input
                                        type="number"
                                        name="predicted_price"
                                        value={formData.predicted_price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Price Change (%)</label>
                                    <input
                                        type="number"
                                        name="price_change"
                                        value={formData.price_change}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        readOnly
                                        className="readonly"
                                    />
                                    <small>Auto-calculated from prices</small>
                                </div>

                                <div className="form-group">
                                    <label>Market Confidence (%) *</label>
                                    <input
                                        type="number"
                                        name="market_confidence"
                                        value={formData.market_confidence}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Market Analysis</label>
                                <textarea
                                    name="market_analysis"
                                    value={formData.market_analysis}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Enter market analysis text..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Recommend Buy *</label>
                                    <input
                                        type="text"
                                        name="recommend_buy"
                                        value={formData.recommend_buy}
                                        onChange={handleInputChange}
                                        placeholder="Enter recommendation text (e.g., 'High confidence, 24 hours forecast')"
                                        required
                                    />
                                    <small>Other fields will auto-fill based on this text</small>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                        />
                                        Active (Only one active prediction per metal type)
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn">
                                    <Save size={18} />
                                    {editingId ? 'Update' : 'Create'} Prediction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionManagement;

