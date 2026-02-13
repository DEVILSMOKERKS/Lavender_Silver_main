import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNotification } from '../../../context/NotificationContext';
import { AdminContext } from '../../../context/AdminContext';
import './ClientDiaryManagement.css';

const ClientDiaryManagement = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        image_url: '',
        alt_text: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { showNotification } = useNotification();
    const { token } = useContext(AdminContext);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/client-diary`);

            if (response.data.success) {
                setImages(response.data.data);
            } else {
                showNotification('Failed to fetch images', 'error');
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            showNotification('Error loading images', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post(
                `${API_BASE_URL}/api/client-diary/upload`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    image_url: response.data.data.image_url
                }));
                showNotification('Image uploaded successfully!', 'success');
            } else {
                showNotification('Failed to upload image', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showNotification('Error uploading image', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation for new image
        if (!editingId) {
            if (!formData.image_url) {
                showNotification('Please upload an image file', 'error');
                return;
            }
            if (!formData.alt_text || formData.alt_text.trim() === '') {
                showNotification('Please enter alt text for the image', 'error');
                return;
            }
        }

        // Validation for edit mode
        if (editingId) {
            if (!formData.alt_text || formData.alt_text.trim() === '') {
                showNotification('Please enter alt text for the image', 'error');
                return;
            }
        }

        try {
            if (editingId) {
                // Update existing image - check if new file is uploaded
                const formDataToSend = new FormData();
                formDataToSend.append('alt_text', formData.alt_text.trim());

                // If there's a new file, add it to FormData
                const fileInput = document.getElementById('client-diary-upload');
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    formDataToSend.append('image', fileInput.files[0]);
                }

                const response = await axios.put(
                    `${API_BASE_URL}/api/client-diary/${editingId}`,
                    formDataToSend,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (response.data.success) {
                    showNotification('Image updated successfully!', 'success');
                    setEditingId(null);
                } else {
                    showNotification('Failed to update image', 'error');
                }
            } else {
                // Create new image
                const response = await axios.post(
                    `${API_BASE_URL}/api/client-diary`,
                    {
                        image_url: formData.image_url,
                        alt_text: formData.alt_text.trim()
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.success) {
                    showNotification('Image added successfully!', 'success');
                } else {
                    showNotification('Failed to add image', 'error');
                }
            }

            setFormData({ image_url: '', alt_text: '' });
            // Reset file input
            const fileInput = document.getElementById('client-diary-upload');
            if (fileInput) {
                fileInput.value = '';
            }
            fetchImages();
        } catch (error) {
            console.error('Error saving image:', error);
            showNotification('Error saving image', 'error');
        }
    };

    const handleEdit = (image) => {
        setFormData({
            image_url: image.image_url,
            alt_text: image.alt_text || ''
        });
        setEditingId(image.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `${API_BASE_URL}/api/client-diary/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                showNotification('Image deleted successfully!', 'success');
                fetchImages();
            } else {
                showNotification('Failed to delete image', 'error');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            showNotification('Error deleting image', 'error');
        }
    };

    const handleCancel = () => {
        setFormData({ image_url: '', alt_text: '' });
        setEditingId(null);
    };

    const getImageUrl = (imageUrl) => {
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        return `${API_BASE_URL}${imageUrl}`;
    };

    if (loading) {
        return (
            <div className="admin-client-diary-management">
                <div className="admin-client-diary-management-loading">
                    <div className="admin-loading-spinner"></div>
                    <p>Loading client diary images...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-client-diary-management">
            <div className="admin-client-diary-management-header">
                <div className="admin-header-content">
                    <h1 className="admin-page-title">Client Diary Images Management</h1>
                    <p className="admin-page-subtitle">Manage client diary images displayed in the carousel</p>
                </div>
                <div className="admin-header-stats">
                    <div className="admin-stat-card">
                        <span className="admin-stat-number">{images.length}</span>
                        <span className="admin-stat-label">Total Images</span>
                    </div>
                </div>
            </div>

            <div className="admin-client-diary-management-content">
                <div className="admin-client-diary-management-form-section">
                    <div className="admin-form-header">
                        <h2 className="admin-form-title">
                            <span className="admin-form-icon">📸</span>
                            {editingId ? 'Edit Image' : 'Add New Image'}
                        </h2>
                        <p className="admin-form-description">
                            {editingId ? 'Update the selected image details' : 'Add a new image to the client diary carousel'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="admin-client-diary-management-form">
                        <div className="admin-form-row">
                            <div className="admin-form-group admin-form-group-full">
                                <label className="admin-form-label">
                                    <span className="admin-label-icon">📁</span>
                                    Upload Image
                                </label>
                                <div className="admin-file-upload-area">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="admin-file-input"
                                        disabled={uploading}
                                        id="client-diary-upload"
                                        required={!editingId}
                                    />
                                    <label htmlFor="client-diary-upload" className="admin-file-upload-label">
                                        {uploading ? (
                                            <div className="admin-upload-progress">
                                                <div className="admin-upload-spinner"></div>
                                                <span>Uploading...</span>
                                            </div>
                                        ) : (
                                            <div className="admin-upload-content">
                                                <span className="admin-upload-icon">📤</span>
                                                <span className="admin-upload-text">Choose Image File</span>
                                                <span className="admin-upload-hint">or drag and drop</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                                <small className="admin-form-help">Upload an image file for the client diary</small>
                            </div>
                        </div>

                        <div className="admin-form-row">
                            <div className="admin-form-group admin-form-group-full">
                                <label className="admin-form-label">
                                    <span className="admin-label-icon">🏷️</span>
                                    Alt Text
                                </label>
                                <input
                                    type="text"
                                    name="alt_text"
                                    value={formData.alt_text}
                                    onChange={handleInputChange}
                                    placeholder="Describe the image for accessibility"
                                    className="admin-form-input"
                                />
                                <small className="admin-form-help">Important for SEO and accessibility</small>
                            </div>
                        </div>

                        {formData.image_url && (
                            <div className="admin-form-row">
                                <div className="admin-form-group admin-form-group-full">
                                    <label className="admin-form-label">
                                        <span className="admin-label-icon">👁️</span>
                                        Preview
                                    </label>
                                    <div className="admin-image-preview-container">
                                        <img
                                            src={getImageUrl(formData.image_url)}
                                            alt={formData.alt_text || 'Preview'}
                                            className="admin-image-preview"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className={`admin-btn admin-btn-primary admin-btn-large ${(!formData.image_url && !editingId) || !formData.alt_text.trim() ? 'admin-btn-disabled' : ''}`}
                                disabled={(!formData.image_url && !editingId) || !formData.alt_text.trim()}
                            >
                                <span className="admin-btn-icon">✅</span>
                                {editingId ? 'Update Image' : 'Add Image'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="admin-btn admin-btn-secondary admin-btn-large"
                                >
                                    <span className="admin-btn-icon">❌</span>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="admin-client-diary-management-images-section">
                    <div className="admin-section-header">
                        <h3 className="admin-section-title">
                            <span className="admin-section-icon">🖼️</span>
                            Current Images ({images.length})
                        </h3>
                        <div className="admin-section-actions">
                            <button className="admin-btn admin-btn-outline admin-btn-small">
                                <span className="admin-btn-icon">🔄</span>
                                Refresh
                            </button>
                        </div>
                    </div>

                    {images.length === 0 ? (
                        <div className="admin-empty-state">
                            <div className="admin-empty-icon">📷</div>
                            <h4 className="admin-empty-title">No Images Found</h4>
                            <p className="admin-empty-description">Add some images to get started with the client diary carousel.</p>
                        </div>
                    ) : (
                        <div className="admin-client-diary-management-images-grid">
                            {images.map((image) => (
                                <div key={image.id} className="admin-image-card">
                                    <div className="admin-image-card-header">
                                        <div className="admin-image-status">
                                            <span className="admin-status-dot admin-status-active"></span>
                                            <span className="admin-status-text">Active</span>
                                        </div>
                                        <div className="admin-image-actions">
                                            <button
                                                onClick={() => handleEdit(image)}
                                                className="admin-action-btn admin-action-edit"
                                                title="Edit Image"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(image.id)}
                                                className="admin-action-btn admin-action-delete"
                                                title="Delete Image"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="admin-image-wrapper">
                                        <img
                                            src={getImageUrl(image.image_url)}
                                            alt={image.alt_text || 'Client diary image'}
                                            className="admin-image"
                                        />
                                    </div>
                                    <div className="admin-image-info">
                                        <p className="admin-image-alt">
                                            {image.alt_text || 'No alt text provided'}
                                        </p>
                                        <p className="admin-image-date">
                                            Added: {new Date(image.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDiaryManagement;
