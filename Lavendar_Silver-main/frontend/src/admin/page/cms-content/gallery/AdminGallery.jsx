import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, X, Save, Image as ImageIcon, GripVertical, Loader2 } from 'lucide-react';
import { useNotification } from '../../../../context/NotificationContext';
import { AdminContext } from '../../../../context/AdminContext';
import './AdminGallery.css';

const AdminGallery = () => {
    const { showNotification } = useNotification();
    const { token: adminToken } = useContext(AdminContext);
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deviceTypeFilter, setDeviceTypeFilter] = useState('all'); // 'all', 'desktop', 'mobile'
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        image: null,
        category_id: '',
        isActive: true,
        position: 1,
        device_type: 'desktop'
    });
    const [imagePreview, setImagePreview] = useState('');
    const [categories, setCategories] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [updatingPositions, setUpdatingPositions] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchGalleryItems();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/categories`);
            if (response.data && response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchGalleryItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/gallery`);
            if (response.data.success) {
                let items = response.data.data;
                // Sort by device_type and position
                items.sort((a, b) => {
                    if (a.device_type !== b.device_type) {
                        return a.device_type.localeCompare(b.device_type);
                    }
                    return (a.position || 0) - (b.position || 0);
                });
                setGalleryItems(items);
            }
        } catch (error) {
            console.error('Error fetching gallery items:', error);
            showNotification('Error fetching gallery items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            
            // Auto-update position when device_type changes
            if (name === 'device_type' && !editingId) {
                const deviceItems = galleryItems.filter(item => item.device_type === value);
                const maxPosition = deviceItems.length > 0 
                    ? Math.max(...deviceItems.map(item => Number(item.position) || 0))
                    : 0;
                newData.position = Math.min(maxPosition + 1, 3); // Max 3 positions
            }
            
            return newData;
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file
            }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        // Calculate next available position for new item based on device_type
        const defaultDeviceType = 'desktop';
        const deviceItems = galleryItems.filter(item => item.device_type === defaultDeviceType);
        const maxPosition = deviceItems.length > 0 
            ? Math.max(...deviceItems.map(item => Number(item.position) || 0))
            : 0;
        const nextPosition = Math.min(maxPosition + 1, 3); // Max 3 positions
        
        setFormData({
            title: '',
            image: null,
            category_id: '',
            isActive: true,
            position: nextPosition,
            device_type: defaultDeviceType
        });
        setImagePreview('');
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showNotification('Title is required', 'error');
            return;
        }

        setIsSaving(true);
        setUploadProgress(0);

        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('category_id', formData.category_id);
        formDataToSend.append('isActive', formData.isActive);
        formDataToSend.append('position', formData.position);
        formDataToSend.append('device_type', formData.device_type);

        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }

        try {
            const url = editingId
                ? `${API_BASE_URL}/api/gallery/${editingId}`
                : `${API_BASE_URL}/api/gallery`;

            const method = editingId ? 'put' : 'post';

            const response = await axios[method](url, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${adminToken}`
                },
                timeout: 30000, // Increase timeout to 30 seconds
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            if (response.data.success) {
                showNotification(
                    editingId ? 'Gallery item updated successfully' : 'Gallery item added successfully',
                    'success'
                );
                fetchGalleryItems();
                setShowModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error saving gallery item:', error);

            let errorMessage = 'Error saving gallery item';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please try again with a smaller image or check your connection.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showNotification(errorMessage, 'error');
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            title: item.title,
            category_id: item.category_id || '',
            isActive: item.is_active === 1,
            position: item.position || 1,
            device_type: item.device_type || 'desktop',
            image: null
        });
        setImagePreview(item.imageUrl ? `${API_BASE_URL}${item.imageUrl}` : '');
        setEditingId(item.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this gallery item?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/api/gallery/${id}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            showNotification('Gallery item deleted successfully', 'success');
            fetchGalleryItems();
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            showNotification('Error deleting gallery item', 'error');
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target);
        e.target.style.opacity = '0.5';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e, dropIndex) => {
        e.preventDefault();
        setDragOverIndex(null);

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        const draggedItem = filteredItems[draggedIndex];
        const dropItem = filteredItems[dropIndex];

        // Only allow drag and drop within the same device type
        if (draggedItem.device_type !== dropItem.device_type) {
            setDraggedIndex(null);
            return;
        }

        // Reorder items locally
        const deviceItems = filteredItems.filter(item => item.device_type === draggedItem.device_type);
        const otherItems = filteredItems.filter(item => item.device_type !== draggedItem.device_type);
        
        const draggedItemIndex = deviceItems.findIndex(item => item.id === draggedItem.id);
        const dropItemIndex = deviceItems.findIndex(item => item.id === dropItem.id);
        
        const newDeviceItems = [...deviceItems];
        const [removed] = newDeviceItems.splice(draggedItemIndex, 1);
        newDeviceItems.splice(dropItemIndex, 0, removed);

        // Update positions based on new order
        const updatedPositions = newDeviceItems.map((item, index) => ({
            id: item.id,
            position: index + 1
        }));

        // Update local state immediately for better UX
        const allItems = [...otherItems, ...newDeviceItems];
        allItems.sort((a, b) => {
            if (a.device_type !== b.device_type) {
                return a.device_type.localeCompare(b.device_type);
            }
            return (a.position || 0) - (b.position || 0);
        });
        setGalleryItems(allItems);

        // Update positions in backend
        setUpdatingPositions(true);
        try {
            await axios.put(
                `${API_BASE_URL}/api/gallery/positions/update`,
                { positions: updatedPositions },
                {
                    headers: { Authorization: `Bearer ${adminToken}` }
                }
            );
            // Refresh to ensure consistency
            fetchGalleryItems();
        } catch (err) {
            showNotification(`${err.response?.data?.message || 'Failed to update gallery positions'}`, 'error');
            // Revert on error
            fetchGalleryItems();
        } finally {
            setUpdatingPositions(false);
            setDraggedIndex(null);
        }
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const filteredItems = galleryItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDevice = deviceTypeFilter === 'all' || item.device_type === deviceTypeFilter;
        return matchesSearch && matchesDevice;
    });

    return (
        <div className="admin-gallery-container">
            <div className="admin-gallery-header">
                <h1>Gallery Management</h1>
                <button
                    className="admin-add-btn"
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <Plus size={20} />
                    Add Gallery Item
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div className="admin-search-box" style={{ flex: '1', minWidth: '200px' }}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search gallery items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Device Type:</label>
                    <select
                        value={deviceTypeFilter}
                        onChange={(e) => setDeviceTypeFilter(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            backgroundColor: '#fff'
                        }}
                    >
                        <option value="all">All</option>
                        <option value="desktop">Desktop</option>
                        <option value="mobile">Mobile</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="admin-loading">Loading gallery items...</div>
            ) : (
                <div className="admin-hero-banner-table-container">
                    {updatingPositions && (
                        <div style={{ padding: '10px', textAlign: 'center', background: '#f0f9ff', borderBottom: '1px solid #e0e7ff' }}>
                            <Loader2 className="spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                            Updating positions...
                        </div>
                    )}
                    <table className="admin-hero-banner-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Position</th>
                                <th>Device Type</th>
                                <th>Status</th>
                                <th>Image</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                        className={`admin-hero-banner-draggable-row ${
                                            draggedIndex === index ? 'dragging' : ''
                                        } ${
                                            dragOverIndex === index ? 'drag-over' : ''
                                        }`}
                                    >
                                        <td
                                            className="admin-hero-banner-drag-handle"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <GripVertical size={18} />
                                        </td>
                                        <td>{item.id}</td>
                                        <td>{item.title}</td>
                                        <td>{item.category_name || 'N/A'}</td>
                                        <td>{item.position}</td>
                                        <td>
                                            <span className={`device-type-badge ${item.device_type}`}>
                                                {item.device_type === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
                                            </span>
                                        </td>
                                        <td>{item.is_active === 1 || item.is_active === true ? 'Active' : 'Inactive'}</td>
                                        <td>
                                            <div className="admin-hero-banner-images">
                                                {item.imageUrl ? (
                                                    <img
                                                        src={`${API_BASE_URL}${item.imageUrl}`}
                                                        alt={item.title || 'gallery'}
                                                        className="admin-hero-banner-thumb"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '/placeholder-image.jpg';
                                                        }}
                                                    />
                                                ) : (
                                                    <ImageIcon className="admin-hero-banner-noimg" />
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <button className="admin-hero-banner-action-btn" onClick={() => handleEdit(item)} title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="admin-hero-banner-action-btn" onClick={() => handleDelete(item.id)} title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center' }}>
                                        {searchTerm ? 'No matching gallery items found' : 'No gallery items found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="gallery-modal-overlay" onClick={() => !isSaving && setShowModal(false)}>
                    <div className="gallery-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Gallery Item' : 'Add New Gallery Item'}</h2>
                            <button
                                className="close-btn"
                                onClick={() => {
                                    if (!isSaving) {
                                        setShowModal(false);
                                        resetForm();
                                    }
                                }}
                                disabled={isSaving}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="gallery-form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>


                            <div className="gallery-form-group">
                                <label htmlFor="category_id">Category</label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="gallery-form-group">
                                <label htmlFor="device_type">Device Type *</label>
                                <select
                                    id="device_type"
                                    name="device_type"
                                    value={formData.device_type}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="desktop">🖥️ Desktop</option>
                                    <option value="mobile">📱 Mobile</option>
                                </select>
                            </div>

                            <div className="gallery-form-group">
                                <label htmlFor="position">Position (1-3)</label>
                                <select
                                    id="position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                </select>
                            </div>

                            <div className="gallery-form-group">
                                <label htmlFor="isActive" className="gallery-checkbox-label">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="gallery-checkbox-input"
                                    />
                                    <span className="gallery-checkbox-custom"></span>
                                    <span className="gallery-checkbox-text">Active</span>
                                </label>
                            </div>

                            <div className="gallery-form-group">
                                <label>Image {!editingId && '*'}</label>
                                <div className="image-upload-container">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="image-preview"
                                        />
                                    ) : (
                                        <div className="image-upload-placeholder">
                                            <ImageIcon size={48} />
                                            <span>Click to upload image</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="image-upload-input"
                                        required={!editingId}
                                    />
                                </div>
                            </div>

                            <div className="gallery-form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        if (!isSaving) {
                                            setShowModal(false);
                                            resetForm();
                                        }
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <div style={{ width: '100%' }}>
                                    {isSaving && uploadProgress > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    Uploading...
                                                </span>
                                                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    {uploadProgress}%
                                                </span>
                                            </div>
                                            <div style={{
                                                width: '100%',
                                                height: '6px',
                                                backgroundColor: '#e5e7eb',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${uploadProgress}%`,
                                                    height: '100%',
                                                    backgroundColor: '#10b981',
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="spinner" style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    border: '2px solid #ffffff',
                                                    borderTop: '2px solid transparent',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                    marginRight: '8px'
                                                }}></div>
                                                {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} style={{ marginRight: '8px' }} />
                                                {editingId ? 'Update' : 'Save'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGallery;
