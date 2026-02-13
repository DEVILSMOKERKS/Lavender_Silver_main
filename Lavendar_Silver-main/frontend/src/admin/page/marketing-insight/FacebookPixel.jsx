import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../../context/AdminContext';
import './FacebookPixel.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FacebookPixel = () => {
    const { token } = useContext(AdminContext);
    const [pixelConfigs, setPixelConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        pixel_id: '',
        access_token: '',
        is_active: true,
        tracking_status: 'active',
        event_tracking: {
            addToCart: true,
            addToWishlist: true,
            purchase: true,
            videoConsultation: true,
        }
    });
    const [editingId, setEditingId] = useState(null);

    // Fetch all pixel configurations
    const fetchPixelConfigs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/facebook-pixel`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPixelConfigs(response.data);
        } catch (error) {
            console.error('Error fetching pixel configs:', error);
            toast.error('Failed to fetch pixel configurations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPixelConfigs();
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/facebook-pixel/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Pixel configuration updated successfully');
            } else {
                await axios.post(`${API_BASE_URL}/api/facebook-pixel`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Pixel configuration added successfully');
            }
            fetchPixelConfigs();
            resetForm();
        } catch (error) {
            console.error('Error saving pixel config:', error);
            toast.error('Failed to save pixel configuration');
        }
    };

    // Handle edit
    const handleEdit = (config) => {
        setEditingId(config.id);
        setFormData({
            pixel_id: config.pixel_id || '',
            access_token: config.access_token || '',
            is_active: config.is_active !== undefined ? config.is_active : true,
            tracking_status: config.tracking_status || 'active',
            event_tracking: config.event_tracking ? JSON.parse(config.event_tracking) : {
                addToCart: true,
                addToWishlist: true,
                purchase: true,
                videoConsultation: true,
            }
        });
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this configuration?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/facebook-pixel/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Pixel configuration deleted successfully');
                fetchPixelConfigs();
            } catch (error) {
                console.error('Error deleting pixel config:', error);
                toast.error('Failed to delete pixel configuration');
            }
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            pixel_id: '',
            access_token: '',
            is_active: true,
            tracking_status: 'active',
            event_tracking: {
                addToCart: true,
                addToWishlist: true,
                purchase: true,
                videoConsultation: true,
            }
        });
        setEditingId(null);
    };

    return (
        <div className="facebook-pixel-container">
            <h2>{editingId ? 'Edit' : 'Add'} Facebook Pixel Configuration</h2>

            <form onSubmit={handleSubmit} className="pixel-form">
                <div className="form-group">
                    <label>Pixel ID (Optional):</label>
                    <input
                        type="text"
                        value={formData.pixel_id || ''}
                        onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
                        placeholder="Leave empty if not configured"
                    />
                </div>

                <div className="form-group">
                    <label>Access Token (Optional):</label>
                    <input
                        type="text"
                        value={formData.access_token || ''}
                        onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                        placeholder="Leave empty if not configured"
                    />
                </div>

                <div className="form-group">
                    <label>Status:</label>
                    <select
                        value={formData.tracking_status}
                        onChange={(e) => setFormData({ ...formData, tracking_status: e.target.value })}
                    >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Event Tracking:</label>
                    <div className="event-tracking-options">
                        {Object.entries(formData.event_tracking).map(([event, enabled]) => (
                            <label key={event}>
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        event_tracking: {
                                            ...formData.event_tracking,
                                            [event]: e.target.checked
                                        }
                                    })}
                                />
                                {event === 'addToCart' ? 'Add to Cart' :
                                    event === 'addToWishlist' ? 'Add to Wishlist' :
                                        event === 'purchase' ? 'Purchase' :
                                            event === 'videoConsultation' ? 'Video Consultation' : event}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-save">
                        {editingId ? 'Update' : 'Add'} Configuration
                    </button>
                    {editingId && (
                        <button type="button" className="btn-cancel" onClick={resetForm}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="pixel-configs">
                <h3>Existing Configurations</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Pixel ID</th>
                                <th>Status</th>
                                <th>Created By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pixelConfigs.map((config) => (
                                <tr key={config.id}>
                                    <td>{config.pixel_id}</td>
                                    <td>
                                        <span className={`status-${config.tracking_status}`}>
                                            {config.tracking_status}
                                        </span>
                                    </td>
                                    <td>{config.admin_name}</td>
                                    <td>
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(config)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(config.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default FacebookPixel;
