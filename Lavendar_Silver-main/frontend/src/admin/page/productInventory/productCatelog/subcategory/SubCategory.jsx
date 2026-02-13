import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Filter, RefreshCw, Save, X, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNotification } from '../../../../../context/NotificationContext';
import { AdminContext } from '../../../../../context/AdminContext';
import './SubCategory.css';

const SubCategory = () => {
    const { showNotification } = useNotification();
    const { admin, token: adminToken } = useContext(AdminContext);
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category_id: '',
        description: '',
        status: 'active',
        image: null
    });
    const [successPopup, setSuccessPopup] = useState({ show: false, message: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subcategoryToDelete, setSubcategoryToDelete] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchSubcategories();
        fetchCategories();
    }, []);

    // Success popup auto-dismiss
    useEffect(() => {
        if (successPopup.show) {
            const timer = setTimeout(() => setSuccessPopup({ show: false, message: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [successPopup.show]);

    const fetchSubcategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/subcategories`);
            if (response.data.success) {
                setSubcategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            showNotification('Error fetching subcategories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/categories`);
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        } else if (name === 'name') {
            const slugValue = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({
                ...prev,
                name: value,
                slug: slugValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            category_id: '',
            description: '',
            status: 'active',
            image: null
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification('Name is required', 'error');
            return;
        }

        if (!formData.category_id) {
            showNotification('Please select a category', 'error');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('slug', formData.slug);
            formDataToSend.append('category_id', formData.category_id);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('status', formData.status);
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            const url = editingId
                ? `${API_BASE_URL}/api/subcategories/${editingId}`
                : `${API_BASE_URL}/api/subcategories`;

            const method = editingId ? 'put' : 'post';

            const response = await axios[method](url, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                showNotification(
                    editingId ? 'Subcategory updated successfully' : 'Subcategory created successfully',
                    'success'
                );
                setSuccessPopup({
                    show: true,
                    message: editingId ? 'Subcategory updated successfully' : 'Subcategory created successfully'
                });
                fetchSubcategories();
                setShowModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error saving subcategory:', error);
            showNotification('Error saving subcategory', 'error');
        }
    };

    const handleEdit = (subcategory) => {
        setFormData({
            name: subcategory.name,
            slug: subcategory.slug,
            category_id: subcategory.category_id,
            description: subcategory.description || '',
            status: subcategory.status,
            image: null
        });
        setEditingId(subcategory.id);
        setShowModal(true);
    };

    const openDeleteModal = (subcategory) => {
        setSubcategoryToDelete(subcategory);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setSubcategoryToDelete(null);
        setShowDeleteModal(false);
    };

    const confirmDelete = async () => {
        if (!subcategoryToDelete) return;
        setLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/api/subcategories/${subcategoryToDelete.id}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            showNotification('Subcategory deleted successfully', 'success');
            setSuccessPopup({
                show: true,
                message: 'Subcategory deleted successfully'
            });
            fetchSubcategories();
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            showNotification('Error deleting subcategory', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredSubcategories = subcategories.filter(subcategory => {
        const category = categories.find(cat => cat.id === subcategory.category_id);
        const matchesSearch = subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subcategory.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterCategory === 'all' || subcategory.category_id == filterCategory;
        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="admin-subcategory-container">
            {successPopup.show && (
                <div className="admin-subcategory-toast-animated show">
                    <CheckCircle2 size={20} style={{ marginRight: 8, color: '#198754' }} />
                    {successPopup.message}
                </div>
            )}

            <div className="admin-subcategory-header">
                <h1>Subcategories Management</h1>
                <button
                    className="admin-add-subcategory-btn"
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <Plus size={20} />
                    Add Subcategory
                </button>
            </div>

            <div className="admin-search-filter-section">
                <div className="admin-search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search subcategories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="admin-filter-box">
                    <Filter size={20} />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className="admin-refresh-btn"
                    onClick={fetchSubcategories}
                    disabled={loading}
                >
                    <RefreshCw size={20} className={loading ? 'admin-spinning' : ''} />
                    Refresh
                </button>
            </div>

            <div className="admin-admin-subcategory-table-container">
                <table className="admin-subcategory-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Image</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="admin-admin-loading-cell">
                                    <div className="admin-loading">Loading subcategories...</div>
                                </td>
                            </tr>
                        ) : filteredSubcategories.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="admin-admin-no-data-cell">
                                    <div className="admin-no-data">
                                        {searchTerm || filterCategory !== 'all'
                                            ? 'No subcategories found matching your criteria'
                                            : 'No subcategories available. Add your first subcategory!'}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredSubcategories.map((subcategory) => {
                                const category = categories.find(cat => cat.id === subcategory.category_id);
                                return (
                                    <tr key={subcategory.id} className="admin-subcategory-row">
                                        <td className="admin-id-cell">{subcategory.id}</td>
                                        <td className="admin-name-cell">
                                            <div className="admin-name-content">
                                                <span className="admin-subcategory-name">{subcategory.name}</span>
                                            </div>
                                        </td>
                                        <td className="admin-slug-cell">
                                            <span className="admin-subcategory-slug">{subcategory.slug}</span>
                                        </td>
                                        <td className="admin-category-cell">
                                            <span className="admin-category-badge">
                                                {category?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="admin-description-cell">
                                            <span className="admin-subcategory-description">
                                                {subcategory.description || 'No description provided'}
                                            </span>
                                        </td>
                                        <td className="admin-status-cell">
                                            <span className={`admin-status-badge ${subcategory.status}`}>
                                                {subcategory.status}
                                            </span>
                                        </td>
                                        <td className="admin-image-cell">
                                            {subcategory.image_url ? (
                                                <img
                                                    src={`${API_BASE_URL}${subcategory.image_url}`}
                                                    alt={subcategory.name}
                                                    className="admin-subcategory-image"
                                                />
                                            ) : (
                                                <div className="admin-admin-no-image-placeholder">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="admin-created-cell">
                                            <span className="admin-created-date">
                                                {formatDate(subcategory.created_at)}
                                            </span>
                                        </td>
                                        <td className="admin-actions-cell">
                                            <div className="admin-subcategory-actions">
                                                <button
                                                    className="admin-edit-btn"
                                                    onClick={() => handleEdit(subcategory)}
                                                    title="Edit subcategory"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="admin-delete-btn"
                                                    onClick={() => openDeleteModal(subcategory)}
                                                    title="Delete subcategory"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editingId ? 'Edit Subcategory' : 'Add New Subcategory'}</h2>
                            <button
                                className="admin-close-btn"
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="admin-subcategory-form">
                            <div className="admin-form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter subcategory name"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="slug">Slug</label>
                                <input
                                    type="text"
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    placeholder="Auto-generated from name if empty"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="category_id">Category *</label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter description (optional)"
                                    rows="3"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="image">Image</label>
                                <input
                                    type="file"
                                    id="image"
                                    name="image"
                                    onChange={handleInputChange}
                                    accept="image/*"
                                />
                            </div>

                            <div className="admin-form-actions">
                                <button
                                    type="button"
                                    className="admin-cancel-btn"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="admin-save-btn">
                                    <Save size={16} />
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && subcategoryToDelete && (
                <div className="admin-subcategory-delete-modal-overlay" onClick={closeDeleteModal}>
                    <div className="admin-subcategory-delete-modal admin-subcategory-delete-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="admin-subcategory-delete-modal-close" onClick={closeDeleteModal}>
                            <X size={20} />
                        </button>
                        <div className="admin-subcategory-delete-icon-unique">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </div>
                        <h2 className="admin-subcategory-delete-modal-title admin-subcategory-delete-title">Delete Subcategory</h2>
                        <div className="admin-subcategory-delete-warning">This action cannot be undone.</div>
                        <p style={{ textAlign: 'center', margin: '12px 0 24px 0', color: '#444', fontWeight: 500 }}>
                            Are you sure you want to delete <b>{subcategoryToDelete.name}</b>?
                        </p>
                        <div className="admin-subcategory-delete-modal-actions">
                            <button className="admin-subcategory-delete-cancel-btn" onClick={closeDeleteModal} disabled={loading}>
                                Cancel
                            </button>
                            <button className="admin-subcategory-delete-save-btn" style={{ background: '#dc2626' }} onClick={confirmDelete} disabled={loading}>
                                {loading ? <Loader2 className="admin-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubCategory;