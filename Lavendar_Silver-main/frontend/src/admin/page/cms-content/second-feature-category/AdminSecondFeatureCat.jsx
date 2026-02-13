import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
  UploadCloud,
  Loader2
} from 'lucide-react';
import './AdminSecondFeatureCat.css';
import { AdminContext } from '../../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminSecondFeatureCat = () => {
  const { token } = useContext(AdminContext);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [currentBanner, setCurrentBanner] = useState(null);
  const [form, setForm] = useState({
    title: '',
    alt_text: '',
    category_id: '',
    subcategory_id: '',
    is_active: true,
    image: null,
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch subcategories
  const fetchSubcategories = async (categoryId = null) => {
    try {
      const url = categoryId
        ? `${API_BASE_URL}/api/subcategories?category_id=${categoryId}`
        : `${API_BASE_URL}/api/subcategories`;
      const res = await axios.get(url);
      setSubcategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch subcategories:', err);
    }
  };

  // Fetch banners function
  const fetchBanners = async (searchTerm = search) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/home-banners/second-feature-category`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let banners = res.data.data;
      if (searchTerm) {
        banners = banners.filter(
          (b) =>
            b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.alt_text && b.alt_text.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      setBanners(banners);
    } catch (err) {
      setError('Failed to fetch banners');
    }
    setLoading(false);
  };

  // Fetch data using useEffect
  useEffect(() => {
    fetchBanners(search);
    fetchCategories();
    fetchSubcategories();
  }, [search, token]);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    // If category changes, fetch subcategories and reset subcategory
    if (name === 'category_id') {
      fetchSubcategories(value);
      setForm((prev) => ({ ...prev, subcategory_id: '' }));
    }
  };

  // Open modal for add/edit
  const openModal = (type, banner = null) => {
    setModalType(type);
    setCurrentBanner(banner);
    if (type === 'edit' && banner) {
      setForm({
        title: banner.title || '',
        alt_text: banner.alt_text || '',
        category_id: banner.category_id || '',
        subcategory_id: banner.subcategory_id || '',
        is_active: banner.is_active === 1 || banner.is_active === true,
        image: null,
      });
      // Fetch subcategories for the selected category
      if (banner.category_id) {
        fetchSubcategories(banner.category_id);
      }
    } else {
      setForm({
        title: '',
        alt_text: '',
        category_id: '',
        subcategory_id: '',
        is_active: true,
        image: null,
      });
      setImageFile(null);
    }
    setShowModal(true);
    setError('');
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentBanner(null);
    setError('');
    setImageFile(null);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0] || null);
  };

  // Add or update banner
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check for duplicate title in frontend
    const isDuplicateTitle = banners.some(banner =>
      banner.title.toLowerCase() === form.title.toLowerCase() &&
      (modalType === 'add' || banner.id !== currentBanner.id)
    );

    if (isDuplicateTitle) {
      setError('Title already exists. Please choose a different title.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('alt_text', form.alt_text);
      formData.append('category_id', form.category_id);
      formData.append('subcategory_id', form.subcategory_id);
      formData.append('is_active', form.is_active ? 1 : 0);
      if (imageFile) {
        formData.append('images', imageFile);
      }

      if (modalType === 'add') {
        await axios.post(`${API_BASE_URL}/api/home-banners/second-feature-category`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await axios.put(`${API_BASE_URL}/api/home-banners/second-feature-category/${currentBanner.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      fetchBanners();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save banner');
    }
    setLoading(false);
  };

  // Trigger the delete confirmation modal
  const handleDeleteClick = (banner) => {
    setBannerToDelete(banner);
    setShowDeleteConfirm(true);
  };

  // Delete banner after confirmation
  const confirmDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/home-banners/second-feature-category/${bannerToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBanners();
      setShowDeleteConfirm(false);
      setBannerToDelete(null);
    } catch (err) {
      setError('Failed to delete banner');
    }
    setLoading(false);
  };

  return (
    <div className="admin-sec-feat-cat-root">
      <div className="admin-sec-feat-cat-header">
        <h1 className="admin-sec-feat-cat-title">Second Feature Category</h1>
        <div className="admin-sec-feat-cat-controls">
          <div className="admin-sec-feat-cat-search-container">
            <Search className="admin-sec-feat-cat-search-icon" />
            <input
              type="text"
              placeholder="Search banners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-sec-feat-cat-search-input"
            />
          </div>
          <button className="admin-sec-feat-cat-add-btn" onClick={() => openModal('add')}>
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {error && <div className="admin-sec-feat-cat-error">{error}</div>}

      <div className="admin-sec-feat-cat-table-container">
        <table className="admin-sec-feat-cat-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Alt Text</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader2 className="spin" /> Loading...
                </td>
              </tr>
            ) : banners.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No banners found
                </td>
              </tr>
            ) : (
              banners.map((banner) => {
                const category = categories.find(c => c.id === banner.category_id);
                const subcategory = subcategories.find(s => s.id === banner.subcategory_id);

                return (
                  <tr key={banner.id}>
                    <td>
                      <div className="admin-sec-feat-cat-images">
                        {banner.image_url ? (
                          <img
                            src={`${API_BASE_URL}${banner.image_url}`}
                            alt={banner.alt_text || banner.title}
                            className="admin-sec-feat-cat-thumb"
                          />
                        ) : (
                          <ImageIcon className="admin-sec-feat-cat-noimg" />
                        )}
                      </div>
                    </td>
                    <td>{banner.title}</td>
                    <td>{banner.alt_text}</td>
                    <td>{category ? category.name : 'N/A'}</td>
                    <td>{subcategory ? subcategory.name : 'N/A'}</td>
                    <td>
                      <span style={{ color: banner.is_active ? '#10b981' : '#ef4444' }}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-sec-feat-cat-action-btn" onClick={() => openModal('edit', banner)}><Edit className="w-4 h-4" /></button>
                      <button className="admin-sec-feat-cat-action-btn" onClick={() => handleDeleteClick(banner)}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="admin-sec-feat-cat-modal-overlay">
          <div className="admin-sec-feat-cat-modal">
            <button className="admin-sec-feat-cat-modal-close" onClick={closeModal}><X /></button>
            <h2>{modalType === 'add' ? 'Add Banner' : 'Edit Banner'}</h2>
            <form onSubmit={handleSubmit} className="admin-sec-feat-cat-form">
              <label>Title
                <input type="text" name="title" value={form.title} onChange={handleChange} required />
              </label>
              <label>Alt Text
                <input type="text" name="alt_text" value={form.alt_text} onChange={handleChange} />
              </label>
              <label>Category
                <select name="category_id" value={form.category_id} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label>Subcategory
                <select name="subcategory_id" value={form.subcategory_id} onChange={handleChange} required>
                  <option value="">Select Subcategory</option>
                  {subcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
              </label>
              <label>Status
                <select name="is_active" value={form.is_active ? '1' : '0'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === '1' }))}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
              <label>Image :
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{
                    backgroundColor: '#0e593c',
                    color: 'white',
                    border: '1px solid #0e593c',
                    padding: '6px 8px',
                    borderRadius: '4px'
                  }}
                />
                {modalType === 'edit' && currentBanner && currentBanner.image_url && (
                  <div style={{ marginTop: 8, }}>
                    <img
                      src={
                        currentBanner.image_url
                          ? `${API_BASE_URL}${currentBanner.image_url}`
                          : ''
                      }
                      alt="Current"
                      className="admin-sec-feat-cat-thumb"
                    />
                  </div>
                )}
                {uploading && <span><Loader2 className="spin" /> Uploading...</span>}
              </label>
              <div className="admin-sec-feat-cat-modal-actions">
                <button type="submit" className="admin-sec-feat-cat-save-btn" disabled={loading || uploading}>
                  {loading ? <Loader2 className="spin" /> : (modalType === 'add' ? 'Add Banner' : 'Save Changes')}
                </button>
                <button type="button" className="admin-sec-feat-cat-cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && bannerToDelete && (
        <div className="admin-sec-feat-cat-delete-modal-overlay">
          <div className="admin-sec-feat-cat-delete-modal">
            <Trash2 size={42} className="delete-modal-icon" />
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete the banner titled "<strong>{bannerToDelete.title}</strong>"?
              <br />
              This action cannot be undone.
            </p>
            <div className="admin-sec-feat-cat-delete-modal-actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="delete-cancel-btn" disabled={loading}>
                Cancel
              </button>
              <button onClick={confirmDelete} className="delete-confirm-btn" disabled={loading}>
                {loading ? <Loader2 className="spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecondFeatureCat;
