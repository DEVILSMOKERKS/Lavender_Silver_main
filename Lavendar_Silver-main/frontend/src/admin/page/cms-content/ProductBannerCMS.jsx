import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './productBannerCMS.css';
import { useNotification } from '../../../context/NotificationContext';

const apiUrl = import.meta.env.VITE_API_URL;

const ProductBanner = () => {
    const { showNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        background_image: null,
        device_type: 'desktop'
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [banners, setBanners] = useState([]);
    const [editingBanner, setEditingBanner] = useState(null);

    // Fetch existing banner data on component mount
    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/admin/product-banners`);
            if (response.data.success && response.data.data) {
                setBanners(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            showNotification('Error loading banner data', 'error');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Image size should be less than 5MB', 'error');
                return;
            }

            if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
                showNotification('Only JPEG, PNG and WebP images are allowed', 'error');
                return;
            }

            setFormData(prev => ({
                ...prev,
                background_image: file
            }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('subtitle', formData.subtitle);
            formDataToSend.append('device_type', formData.device_type);
            if (formData.background_image) {
                formDataToSend.append('background_image', formData.background_image);
            }

            // Make sure Content-Type is not set manually for FormData
            const response = await axios.post(`${apiUrl}/api/admin/product-banner`, formDataToSend);

            if (response.data.success) {
                showNotification(
                    editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!',
                    'success'
                );
                setIsModalOpen(false);
                setEditingBanner(null);
                resetForm();
                fetchBanners(); // Refresh data
            }
        } catch (error) {
            console.error('Error saving banner:', error);
            showNotification(error.response?.data?.error || 'Error saving banner', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            background_image: null,
            device_type: 'desktop'
        });
        setPreview(null);
    };

    const handleEditBanner = (banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            background_image: null,
            device_type: banner.device_type
        });
        setPreview(banner.background_image ? `${apiUrl}${banner.background_image}` : null);
        setIsModalOpen(true);
    };

    const handleCreateBanner = () => {
        setEditingBanner(null);
        resetForm();
        setIsModalOpen(true);
    };

    const getBannerForDevice = (deviceType) => {
        return banners.find(banner => banner.device_type === deviceType);
    };

    // Check if both desktop and mobile banners exist
    const hasBothBanners = () => {
        const desktopBanner = getBannerForDevice('desktop');
        const mobileBanner = getBannerForDevice('mobile');
        return desktopBanner && mobileBanner;
    };

    return (
        <div className="banner-cms-wrapper">
            <div className="banner-cms-header">
                <div className="banner-cms-title-section">
                    <h1>Product Banner Settings</h1>
                    <p className="banner-cms-subtext">Manage your product page banner content and appearance for different devices</p>
                </div>
                {!hasBothBanners() && (
                    <button
                        type="button"
                        className="banner-cms-create-btn"
                        onClick={handleCreateBanner}
                    >
                        Create New Banner
                    </button>
                )}
            </div>

            <div className="banner-cms-banners-section">
                <h3 className="banner-cms-preview-title">Current Banners</h3>
                <div className="banner-cms-banners-grid">
                    {['desktop', 'mobile'].map(deviceType => {
                        const banner = getBannerForDevice(deviceType);
                        return (
                            <div key={deviceType} className="banner-cms-device-banner">
                                <div className="banner-cms-device-header">
                                    <h4>{deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Banner</h4>
                                    <button
                                        type="button"
                                        className="banner-cms-edit-btn"
                                        onClick={() => banner ? handleEditBanner(banner) : handleCreateBanner()}
                                    >
                                        {banner ? 'Edit' : 'Create'}
                                    </button>
                                </div>
                                {banner ? (
                                    <div
                                        className="banner-cms-preview-banner"
                                        style={{
                                            backgroundImage: banner.background_image ? `url("${apiUrl}${banner.background_image}")` : 'none',
                                            backgroundColor: !banner.background_image ? '#f5f5f5' : 'transparent',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        <div className="banner-cms-preview-content">
                                            <h1>{banner.title}</h1>
                                            <p>{banner.subtitle}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="banner-cms-no-banner">
                                        <p>No {deviceType} banner created yet</p>
                                        <button
                                            type="button"
                                            className="banner-cms-create-device-btn"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, device_type: deviceType }));
                                                handleCreateBanner();
                                            }}
                                        >
                                            Create {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Banner
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="banner-cms-modal-overlay">
                    <div className="banner-cms-modal">
                        <div className="banner-cms-modal-header">
                            <h2>{editingBanner ? 'Update Product Banner' : 'Create Product Banner'}</h2>
                            <button
                                className="banner-cms-modal-close"
                                onClick={() => !loading && setIsModalOpen(false)}
                                disabled={loading}
                            >
                                ×
                            </button>
                        </div>
                        <div className="banner-cms-modal-content">
                            <form id="bannerForm" onSubmit={handleSubmit} className="banner-cms-form">
                                <div className="form-section">
                                    <div className="form-group">
                                        <label htmlFor="device_type">Device Type</label>
                                        <select
                                            id="device_type"
                                            name="device_type"
                                            value={formData.device_type}
                                            onChange={handleInputChange}
                                            required
                                            className="form-control"
                                            disabled={!!editingBanner}
                                        >
                                            <option value="desktop">Desktop</option>
                                            <option value="mobile">Mobile</option>
                                        </select>
                                        <small className="form-text">Select the device type for this banner</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="title">Banner Title</label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Enter banner title"
                                            required
                                            className="form-control"
                                        />
                                        <small className="form-text">Main heading displayed on the banner</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="subtitle">Banner Subtitle</label>
                                        <textarea
                                            id="subtitle"
                                            name="subtitle"
                                            value={formData.subtitle}
                                            onChange={handleInputChange}
                                            placeholder="Enter banner subtitle"
                                            className="form-control"
                                            rows="3"
                                        />
                                        <small className="form-text">Supporting text shown below the title</small>
                                    </div>

                                    <div className="form-group">
                                        <label>Banner Image</label>
                                        <div className="image-upload-container">
                                            {preview && (
                                                <div className="image-preview">
                                                    <img
                                                        src={preview}
                                                        alt="Banner preview"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                            <div className="upload-controls">
                                                <label htmlFor="background_image" className="upload-btn">
                                                    {editingBanner ? 'Change Image' : 'Upload Image'}
                                                </label>
                                                <input
                                                    type="file"
                                                    id="background_image"
                                                    onChange={handleImageChange}
                                                    accept="image/jpeg,image/png,image/webp"
                                                    className="file-file"
                                                    {...(!editingBanner && { required: true })}
                                                />
                                                <small className="form-text">
                                                    Recommended size: 1920x400px. Max size: 5MB.<br />
                                                    Supported formats: JPEG, PNG, WebP
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="banner-cms-modal-footer">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => !loading && setIsModalOpen(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductBanner;
