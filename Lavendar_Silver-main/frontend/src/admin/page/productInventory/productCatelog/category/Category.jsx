import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Loader2, Image as ImageIcon, Search, CheckCircle2, Save } from 'lucide-react';
import { useNotification } from '../../../../../context/NotificationContext';
import { AdminContext } from '../../../../../context/AdminContext';
import './Category.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const initialForm = { name: '', slug: '', description: '', status: 'active', image: null };

const Category = () => {
  const { showNotification } = useNotification();
  const { admin, token: adminToken } = useContext(AdminContext);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [successPopup, setSuccessPopup] = useState({ show: false, message: '' });

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setError('Failed to fetch categories');
      setCategories([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Success popup auto-dismiss
  useEffect(() => {
    if (successPopup.show) {
      const timer = setTimeout(() => setSuccessPopup({ show: false, message: '' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [successPopup.show]);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm({ ...form, image: files[0] });
    } else if (name === 'name') {
      const slugValue = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setForm({ ...form, name: value, slug: slugValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Open modal for add/edit
  const openModal = (type, cat = null) => {
    if (type === 'edit' && cat) {
      setForm({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        status: cat.status || 'active',
        image: null
      });
      setEditingId(cat.id);
    } else {
      setForm(initialForm);
      setEditingId(null);
    }
    setShowModal(true);
    setError('');
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
    setError('');
  };

  // Open delete confirmation modal
  const openDeleteModal = (cat) => {
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setCategoryToDelete(null);
    setShowDeleteModal(false);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${categoryToDelete.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchCategories();
      setSuccessPopup({ show: true, message: 'Category deleted successfully' });
      showNotification('Category deleted successfully', 'success');
    } catch (err) {
      setError('Failed to delete category');
      showNotification('Failed to delete category', 'error');
    }
    setLoading(false);
    closeDeleteModal();
  };

  // Handle delete button click
  const handleDeleteClick = (cat) => {
    openDeleteModal(cat);
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.name.trim()) {
      setError('Name is required');
      showNotification('Name is required', 'error');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('slug', form.slug);
      formData.append('description', form.description || '');
      formData.append('status', form.status);
      if (form.image) {
        formData.append('image', form.image);
      }

      if (editingId) {
        // Update
        const response = await axios.put(`${API_BASE_URL}/api/categories/${editingId}`, formData, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setSuccessPopup({ show: true, message: 'Category updated successfully' });
          showNotification('Category updated successfully', 'success');
          setForm(initialForm);
          setEditingId(null);
          setShowModal(false);
          fetchCategories();
        } else {
          throw new Error(response.data.error || 'Failed to update category');
        }
      } else {
        // Create
        const response = await axios.post(`${API_BASE_URL}/api/categories`, formData, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setSuccessPopup({ show: true, message: 'Category created successfully' });
          showNotification('Category created successfully', 'success');
          setForm(initialForm);
          setEditingId(null);
          setShowModal(false);
          fetchCategories();
        } else {
          throw new Error(response.data.error || 'Failed to create category');
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save category';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
    setLoading(false);
  };

  // Filtered categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-product-catlog-category-wrapper">
      {successPopup.show && (
        <div className="admin-product-catlog-category-toast-animated show">
          <CheckCircle2 size={20} style={{ marginRight: 8, color: '#198754' }} />
          {successPopup.message}
        </div>
      )}
      <div className="admin-product-catlog-category-header">
        <h1 className="admin-product-catlog-category-title">Product Categories</h1>
        <div className="admin-product-catlog-category-controls">
          <div className="admin-product-catlog-category-search-container">
            <Search className="admin-product-catlog-category-search-icon" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-product-catlog-category-search-input"
            />
          </div>
          <button className="admin-product-catlog-category-add-btn" onClick={() => openModal('add')}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>
      {error && <div className="admin-product-catlog-category-error">{error}</div>}
      <div className="admin-admin-product-catlog-category-table-container">
        <table className="admin-product-catlog-category-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Status</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="admin-admin-loading-cell">
                  <div className="admin-loading">
                    <Loader2 className="admin-spin" /> Loading categories...
                  </div>
                </td>
              </tr>
            ) : !Array.isArray(filteredCategories) || filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-admin-no-data-cell">
                  <div className="admin-no-data">
                    {search
                      ? 'No categories found matching your search'
                      : 'No categories available. Add your first category!'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredCategories.map(cat => (
                <tr key={cat.id} className="admin-category-row">
                  <td className="admin-id-cell">{cat.id}</td>
                  <td className="admin-name-cell">
                    <div className="admin-name-content">
                      <span className="admin-category-name">{cat.name}</span>
                    </div>
                  </td>
                  <td className="admin-slug-cell">
                    <span className="admin-category-slug">{cat.slug}</span>
                  </td>
                  <td className="admin-description-cell">
                    <span className="admin-category-description">
                      {cat.description || 'No description provided'}
                    </span>
                  </td>
                  <td className="admin-status-cell">
                    <span className={`admin-status-badge ${cat.status}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="admin-image-cell">
                    {cat.image_url ? (
                      <img
                        src={`${API_BASE_URL}${cat.image_url}`}
                        alt={cat.name}
                        className="admin-category-image"
                      />
                    ) : (
                      <div className="admin-no-image-placeholder">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="admin-actions-cell">
                    <div className="admin-category-actions">
                      <button
                        className="admin-edit-btn"
                        onClick={() => openModal('edit', cat)}
                        title="Edit category"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleDeleteClick(cat)}
                        title="Delete category"
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
      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingId ? 'Edit Category' : 'Add New Category'}</h2>
              <button
                className="admin-close-btn"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-category-form">
              <div className="admin-form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                  required
                  autoFocus
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="slug">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="Enter category slug"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter description (optional)"
                  rows="3"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  accept="image/*"
                />
                {editingId && categories.find(c => c.id === editingId)?.image_url && (
                  <div className="admin-admin-admin-current-image-preview">
                    <span className="admin-admin-admin-current-image-label">Current Image:</span>
                    <img
                      src={`${API_BASE_URL}${categories.find(c => c.id === editingId)?.image_url}`}
                      alt="Current"
                      className="admin-admin-current-image"
                    />
                  </div>
                )}
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-save-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="admin-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="admin-product-catlog-category-modal-overlay" onClick={closeDeleteModal}>
          <div className="admin-product-catlog-category-modal admin-product-catlog-category-delete-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-product-catlog-category-modal-close" onClick={closeDeleteModal}>
              <X size={20} />
            </button>
            <div className="admin-product-catlog-category-delete-icon-unique">
              {/* Use a standard trash icon for delete, white color */}
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h2 className="admin-admin-product-catlog-category-modal-title admin-product-catlog-category-delete-title">Delete Category</h2>
            <div className="admin-product-catlog-category-delete-warning">This action cannot be undone.</div>
            <p style={{ textAlign: 'center', margin: '12px 0 24px 0', color: '#444', fontWeight: 500 }}>
              Are you sure you want to delete <b>{categoryToDelete.name}</b>?
            </p>
            <div className="admin-product-catlog-category-modal-actions">
              <button className="admin-product-catlog-category-cancel-btn" onClick={closeDeleteModal} disabled={loading}>
                Cancel
              </button>
              <button className="admin-product-catlog-category-save-btn" style={{ background: '#dc2626' }} onClick={confirmDelete} disabled={loading}>
                {loading ? <Loader2 className="admin-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category; 