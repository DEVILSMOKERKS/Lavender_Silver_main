import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Filter, RefreshCw, Save, X, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../../../../context/NotificationContext';
import { AdminContext } from '../../../../../context/AdminContext';
import './SubSubcategory.css';

const SubSubcategory = () => {
    const { showNotification } = useNotification();
    const { admin, token: adminToken } = useContext(AdminContext);
    const [subSubcategories, setSubSubcategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubcategory, setFilterSubcategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subcategory_id: '',
        description: '',
        sort_order: 0,
        status: 'active'
    });
    const [successPopup, setSuccessPopup] = useState({ show: false, message: '' });

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchSubSubcategories();
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

    const fetchSubSubcategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/sub-subcategories`);
            if (response.data.success) {
                setSubSubcategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching sub-subcategories:', error);
            showNotification('Error fetching sub-subcategories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubcategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/subcategories`);
            if (response.data.success) {
                setSubcategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching subcategories:', error);
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
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        // Auto-calculate next sort_order
        const maxSortOrder = subSubcategories.length > 0
            ? Math.max(...subSubcategories.map(ss => ss.sort_order || 0))
            : 0;
        const nextSortOrder = maxSortOrder + 1;

        setFormData({
            name: '',
            subcategory_id: '',
            description: '',
            sort_order: nextSortOrder,
            status: 'active'
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification('Name is required', 'error');
            return;
        }

        if (!formData.subcategory_id) {
            showNotification('Please select a subcategory', 'error');
            return;
        }

        try {
            const url = editingId
                ? `${API_BASE_URL}/api/sub-subcategories/${editingId}`
                : `${API_BASE_URL}/api/sub-subcategories`;

            const method = editingId ? 'put' : 'post';

            // Prepare payload - ensure no undefined values
            const payload = {
                name: formData.name || '',
                subcategory_id: formData.subcategory_id || '',
                description: formData.description && formData.description.trim() ? formData.description.trim() : null,
                sort_order: formData.sort_order ? parseInt(formData.sort_order) : 0,
                status: formData.status || 'active'
            };

            const response = await axios[method](url, payload, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            if (response.data.success) {
                showNotification(
                    editingId ? 'Sub-subcategory updated successfully' : 'Sub-subcategory created successfully',
                    'success'
                );
                setSuccessPopup({
                    show: true,
                    message: editingId ? 'Sub-subcategory updated successfully' : 'Sub-subcategory created successfully'
                });
                fetchSubSubcategories();
                setShowModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error saving sub-subcategory:', error);
            showNotification('Error saving sub-subcategory', 'error');
        }
    };

    const handleEdit = (subSubcategory) => {
        // Ensure sort_order is a number
        let sortOrder = subSubcategory.sort_order !== null && subSubcategory.sort_order !== undefined
            ? parseInt(subSubcategory.sort_order)
            : 0;

        // If sort_order is 0, calculate next available number (max + 1)
        if (sortOrder === 0) {
            const maxSortOrder = subSubcategories.length > 0
                ? Math.max(...subSubcategories.map(ss => parseInt(ss.sort_order) || 0))
                : 0;
            sortOrder = maxSortOrder + 1;
        }

        setFormData({
            name: subSubcategory.name || '',
            subcategory_id: subSubcategory.subcategory_id || '',
            description: subSubcategory.description || '',
            sort_order: sortOrder,
            status: subSubcategory.status || 'active'
        });
        setEditingId(subSubcategory.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this sub-subcategory?')) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/api/sub-subcategories/${id}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            showNotification('Sub-subcategory deleted successfully', 'success');
            setSuccessPopup({
                show: true,
                message: 'Sub-subcategory deleted successfully'
            });
            fetchSubSubcategories();
        } catch (error) {
            console.error('Error deleting sub-subcategory:', error);
            showNotification('Error deleting sub-subcategory', 'error');
        }
    };

    const filteredSubSubcategories = subSubcategories.filter(subSubcategory => {
        const matchesSearch = subSubcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subSubcategory.subcategory_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subSubcategory.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterSubcategory === 'all' || subSubcategory.subcategory_id == filterSubcategory;
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
        <div className="admin-sub-subcategory-container">
            {successPopup.show && (
                <div className="admin-sub-subcategory-toast-animated show">
                    <CheckCircle2 size={20} style={{ marginRight: 8, color: '#198754' }} />
                    {successPopup.message}
                </div>
            )}

            <div className="admin-sub-subcategory-header">
                <h1>Sub-Subcategories Management</h1>
                <button
                    className="admin-add-sub-subcategory-btn"
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <Plus size={20} />
                    Add Sub-Subcategory
                </button>
            </div>

            <div className="admin-search-filter-section">
                <div className="admin-search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search sub-subcategories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="admin-filter-box">
                    <Filter size={20} />
                    <select
                        value={filterSubcategory}
                        onChange={(e) => setFilterSubcategory(e.target.value)}
                    >
                        <option value="all">All Subcategories</option>
                        {subcategories.map(subcategory => (
                            <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className="admin-refresh-btn"
                    onClick={fetchSubSubcategories}
                    disabled={loading}
                >
                    <RefreshCw size={20} className={loading ? 'admin-spinning' : ''} />
                    Refresh
                </button>
            </div>

            <div className="admin-admin-sub-subcategory-table-container">
                <table className="admin-sub-subcategory-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Subcategory</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Sort Order</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="admin-admin-loading-cell">
                                    <div className="admin-loading">Loading sub-subcategories...</div>
                                </td>
                            </tr>
                        ) : filteredSubSubcategories.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="admin-admin-no-data-cell">
                                    <div className="admin-no-data">
                                        {searchTerm || filterSubcategory !== 'all'
                                            ? 'No sub-subcategories found matching your criteria'
                                            : 'No sub-subcategories available. Add your first sub-subcategory!'}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredSubSubcategories.map((subSubcategory) => (
                                <tr key={subSubcategory.id} className="admin-sub-subcategory-row">
                                    <td className="admin-id-cell">{subSubcategory.id}</td>
                                    <td className="admin-name-cell">
                                        <div className="admin-name-content">
                                            <span className="admin-sub-subadmin-category-name">{subSubcategory.name}</span>
                                        </div>
                                    </td>
                                    <td className="admin-subadmin-category-cell">
                                        <span className="admin-sub-subcategory-badge">
                                            {subSubcategory.subcategory_name}
                                        </span>
                                    </td>
                                    <td className="admin-category-cell">
                                        <span className="admin-category-name">{subSubcategory.category_name}</span>
                                    </td>
                                    <td className="admin-description-cell">
                                        <span className="admin-sub-subcategory-description">
                                            {subSubcategory.description || 'No description provided'}
                                        </span>
                                    </td>
                                    <td className="admin-admin-sort-order-cell">
                                        <span className="admin-sort-order">{subSubcategory.sort_order}</span>
                                    </td>
                                    <td className="admin-created-cell">
                                        <span className="admin-created-date">
                                            {formatDate(subSubcategory.created_at)}
                                        </span>
                                    </td>
                                    <td className="admin-actions-cell">
                                        <div className="admin-sub-subcategory-actions">
                                            <button
                                                className="admin-edit-btn"
                                                onClick={() => handleEdit(subSubcategory)}
                                                title="Edit sub-subcategory"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="admin-delete-btn"
                                                onClick={() => handleDelete(subSubcategory.id)}
                                                title="Delete sub-subcategory"
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

            {/* Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editingId ? 'Edit Sub-Subcategory' : 'Add New Sub-Subcategory'}</h2>
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

                        <form onSubmit={handleSubmit} className="admin-sub-subcategory-form">
                            <div className="admin-form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter sub-subcategory name"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="subcategory_id">Subcategory *</label>
                                <select
                                    id="subcategory_id"
                                    name="subcategory_id"
                                    value={formData.subcategory_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a subcategory</option>
                                    {subcategories.map(subcategory => (
                                        <option key={subcategory.id} value={subcategory.id}>
                                            {subcategory.name}
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
                                <label htmlFor="sort_order">Sort Order</label>
                                <input
                                    type="number"
                                    id="sort_order"
                                    name="sort_order"
                                    value={formData.sort_order !== null && formData.sort_order !== undefined ? formData.sort_order : ''}
                                    onChange={handleInputChange}
                                    placeholder={editingId ? "Enter sort order" : "Auto"}
                                    min="0"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="status">Status *</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
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
        </div>
    );
};

export default SubSubcategory;
