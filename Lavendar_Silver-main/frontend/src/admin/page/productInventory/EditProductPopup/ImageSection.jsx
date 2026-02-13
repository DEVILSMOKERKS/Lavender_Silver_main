import React, { useState, useEffect } from 'react';
import { Upload, X, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../../../context/NotificationContext';
import './ImageSection.css';

const ImageSection = ({
    productId,
    images,
    setImages,
    imageFiles,
    setImageFiles,
    onImageUpdate
}) => {
    const { showNotification } = useNotification();
    const [uploading, setUploading] = useState(false);
    const [deletingImage, setDeletingImage] = useState(null);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                showNotification('Only image files are allowed', 'error');
                return false;
            }
            if (file.size > 1000 * 1024 * 1024) { // 1000MB (1GB) limit
                showNotification('Image size should be less than 1000MB (1GB)', 'error');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            validFiles.forEach(file => {
                formData.append('images', file);
            });
            formData.append('product_id', productId);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/images`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                const newImages = response.data.data;
                setImages(prev => [...prev, ...newImages]);
                setImageFiles(prev => [...prev, ...validFiles]);
                showNotification('Images uploaded successfully', 'success');
                if (onImageUpdate) {
                    onImageUpdate();
                }
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            showNotification(
                error.response?.data?.message || 'Error uploading images',
                'error'
            );
        } finally {
            setUploading(false);
        }
    };

    const handleImageDelete = async (imageId, index) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        setDeletingImage(imageId);
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/images/${imageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                setImages(prev => prev.filter((_, i) => i !== index));
                setImageFiles(prev => prev.filter((_, i) => i !== index));
                showNotification('Image deleted successfully', 'success');
                if (onImageUpdate) {
                    onImageUpdate();
                }
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            showNotification(
                error.response?.data?.message || 'Error deleting image',
                'error'
            );
        } finally {
            setDeletingImage(null);
        }
    };

    return (
        <div className="image-section-container">
            <h3 className="image-section-title">Product Images</h3>

            {/* Image Upload */}
            <div className="image-upload-section">
                <label className="image-upload-label">
                    <Upload size={20} />
                    <span>Upload Images</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
                {uploading ? <span className="uploading-text">Uploading...</span> : null}
            </div>

            {/* Image Grid */}
            <div className="image-grid">
                {images.map((image, index) => (
                    <div key={image.id} className="image-item">
                        <img
                            src={`${import.meta.env.VITE_API_URL}${image.image_url}`}
                            alt={`Product ${index + 1}`}
                            className="product-image"
                        />
                        <div className="image-overlay">
                            <button
                                className="image-delete-btn"
                                onClick={() => handleImageDelete(image.id, index)}
                                disabled={deletingImage === image.id}
                            >
                                {deletingImage === image.id ? (
                                    <span>Deleting...</span>
                                ) : (
                                    <Trash2 size={16} />
                                )}
                            </button>
                            <span className="image-order">{index + 1}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageSection;
