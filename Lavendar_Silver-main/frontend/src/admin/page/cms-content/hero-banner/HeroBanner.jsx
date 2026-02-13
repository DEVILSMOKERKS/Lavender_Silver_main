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
  Loader2,
  GripVertical
} from 'lucide-react';
import './HeroBanner.css';
import { AdminContext } from '../../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL; // Adjust if needed

const HeroBanner = () => {
  const { token } = useContext(AdminContext);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [currentBanner, setCurrentBanner] = useState(null);
  const [form, setForm] = useState({
    title: '',
    alt_text: '',
    description: '',
    position: 1,
    device_type: 'desktop',
    is_active: true,
    image: null,
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [updatingPositions, setUpdatingPositions] = useState(false);

  // Fetch banners
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/home-banners`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let banners = res.data.data;
      // Sort by position to maintain order
      banners.sort((a, b) => (a.position || 0) - (b.position || 0));
      if (search) {
        banners = banners.filter(
          (b) =>
            b.title.toLowerCase().includes(search.toLowerCase()) ||
            (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
        );
      }
      setBanners(banners);
    } catch (err) {
      setError(`${err.response?.data?.message || 'Failed to fetch banners'}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line
  }, [search]);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Open modal for add/edit
  const openModal = (type, banner = null) => {
    setModalType(type);
    setCurrentBanner(banner);
    if (type === 'edit' && banner) {
      setForm({
        title: banner.title || '',
        alt_text: banner.alt_text || '',
        description: banner.description || '',
        position: banner.position || 1,
        device_type: banner.device_type || 'desktop',
        is_active: banner.is_active === 1 || banner.is_active === true,
        image: null,
      });
    } else {
      // Calculate next available position for new item based on device_type
      // Default to 'desktop' for new items
      const defaultDeviceType = 'desktop';
      const deviceBanners = banners.filter(b => b.device_type === defaultDeviceType);
      const maxPosition = deviceBanners.length > 0 
        ? Math.max(...deviceBanners.map(b => Number(b.position) || 0))
        : 0;
      const nextPosition = maxPosition + 1;
      
      setForm({
        title: '',
        alt_text: '',
        description: '',
        position: nextPosition,
        device_type: defaultDeviceType,
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
    // Prevent duplicate position on add (only within same device type)
    if (modalType === 'add') {
      const isDuplicatePosition = (banners || []).some(
        (b) => Number(b.position) === Number(form.position) && b.device_type === form.device_type
      );
      if (isDuplicatePosition) {
        setError(`A ${form.device_type} banner with position ${form.position} already exists. Please choose a different position.`);
        setLoading(false);
        return;
      }
    }
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('alt_text', form.alt_text);
      formData.append('description', form.description);
      formData.append('position', form.position);
      formData.append('device_type', form.device_type);
      formData.append('is_active', form.is_active ? 1 : 0);
      if (imageFile) {
        formData.append('images', imageFile);
      }
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
      if (modalType === 'add') {
        await axios.post(`${API_BASE_URL}/api/home-banners`, formData, config);
      } else if (modalType === 'edit' && currentBanner) {
        await axios.put(`${API_BASE_URL}/api/home-banners/${currentBanner.id}`, formData, config);
      }
      fetchBanners();
      closeModal();
    } catch (err) {
      // Log the full error for debugging
      console.error('Banner API error:', err, err.response);
      let errorMsg = 'Failed to save banner';
      if (err.response) {
        errorMsg = `Error ${err.response.status}: `;
        if (err.response.data?.message) {
          errorMsg += err.response.data.message;
        } else if (err.response.data?.error) {
          errorMsg += err.response.data.error;
        } else if (typeof err.response.data === 'string') {
          errorMsg += err.response.data;
        } else {
          errorMsg += 'Unknown error from server.';
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
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
    if (!bannerToDelete) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/home-banners/${bannerToDelete.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchBanners(); // Refresh the list
    } catch (err) {
      setError(`${err.response?.data?.message || 'Failed to delete banner'}`);
    }
    setLoading(false);
    setShowDeleteConfirm(false);
    setBannerToDelete(null);
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

    // Reorder banners locally
    const newBanners = [...banners];
    const draggedBanner = newBanners[draggedIndex];
    newBanners.splice(draggedIndex, 1);
    newBanners.splice(dropIndex, 0, draggedBanner);

    // Update positions based on new order
    const updatedPositions = newBanners.map((banner, index) => ({
      id: banner.id,
      position: index + 1
    }));

    // Update local state immediately for better UX
    setBanners(newBanners.map((banner, index) => ({
      ...banner,
      position: index + 1
    })));

    // Update positions in backend
    setUpdatingPositions(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/home-banners/positions/update`,
        { positions: updatedPositions },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      // Refresh to ensure consistency
      fetchBanners();
    } catch (err) {
      setError(`${err.response?.data?.message || 'Failed to update banner positions'}`);
      // Revert on error
      fetchBanners();
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

  return (
    <div className="admin-hero-banner-root">
      <div className="admin-hero-banner-header">
        <h1 className="admin-hero-banner-title">Hero Banners</h1>
        <div className="admin-hero-banner-controls">
          <div className="admin-hero-banner-search-container">
            <Search className="admin-hero-banner-search-icon" />
            <input
              type="text"
              placeholder="Search banners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-hero-banner-search-input"
            />
          </div>
          <button className="admin-hero-banner-add-btn" onClick={() => openModal('add')}>
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>
      </div>

      {error && <div className="admin-hero-banner-error">{error}</div>}

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
              <th>Alt Text</th>
              <th>Description</th>
              <th>Position</th>
              <th>Device Type</th>
              <th>Status</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center' }}><Loader2 className="spin" /> Loading...</td></tr>
            ) : !Array.isArray(banners) || banners.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center' }}>No banners found</td></tr>
            ) : (
              (banners || []).map((banner, index) => (
                <tr
                  key={banner.id}
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
                  <td>{banner.id}</td>
                  <td>{banner.title}</td>
                  <td>{banner.alt_text}</td>
                  <td>{banner.description}</td>
                  <td>{banner.position}</td>
                  <td>
                    <span className={`device-type-badge ${banner.device_type}`}>
                      {banner.device_type === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
                    </span>
                  </td>
                  <td>{banner.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="admin-hero-banner-images">
                      {banner.image_url ? (
                        <img
                          src={
                            banner.image_url
                              ? `${API_BASE_URL}${banner.image_url}`
                              : ''
                          }
                          alt={banner.alt_text || 'banner'}
                          className="admin-hero-banner-thumb"
                        />
                      ) : (
                        <ImageIcon className="admin-hero-banner-noimg" />
                      )}
                    </div>
                  </td>
                  <td>
                    <button className="admin-hero-banner-action-btn" onClick={() => openModal('edit', banner)}><Edit className="w-4 h-4" /></button>
                    <button className="admin-hero-banner-action-btn" onClick={() => handleDeleteClick(banner)}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="admin-hero-banner-modal-overlay">
          <div className="admin-hero-banner-modal">
            <button className="admin-hero-banner-modal-close" onClick={closeModal}><X /></button>
            <h2>{modalType === 'add' ? 'Add Banner' : 'Edit Banner'}</h2>
            <form onSubmit={handleSubmit} className="admin-hero-banner-form">
              <label>Title
                <input type="text" name="title" value={form.title} onChange={handleChange} required />
              </label>
              <label>Alt Text
                <input type="text" name="alt_text" value={form.alt_text} onChange={handleChange} />
              </label>
              <label>Description
                <textarea name="description" value={form.description} onChange={handleChange} />
              </label>
              <label>Position
                <input type="number" name="position" value={form.position} onChange={handleChange} min="1" />
              </label>
              <label>Device Type *
                <select name="device_type" value={form.device_type} onChange={handleChange} required>
                  <option value="desktop">🖥️ Desktop</option>
                  <option value="mobile">📱 Mobile</option>
                </select>
              </label>
              <label>Status
                <select name="is_active" value={form.is_active ? '1' : '0'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === '1' }))}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
              <label>Image
                <div className="admin-hero-banner-file-upload-wrapper">
                  <label htmlFor="hero-banner-image-upload" className="admin-hero-banner-upload-btn">
                    <UploadCloud className="w-4 h-4" />
                    {imageFile ? imageFile.name : (modalType === 'edit' && currentBanner && currentBanner.image_url ? 'Change Image' : 'Choose Image')}
                  </label>
                  <input 
                    type="file" 
                    id="hero-banner-image-upload"
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="admin-hero-banner-file-input"
                  />
                </div>
                {modalType === 'edit' && currentBanner && currentBanner.image_url && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={
                        currentBanner.image_url
                          ? `${API_BASE_URL}${currentBanner.image_url}`
                          : ''
                      }
                      alt="Current"
                      className="admin-hero-banner-thumb"
                    />
                  </div>
                )}
                {uploading && <span><Loader2 className="spin" /> Uploading...</span>}
              </label>
              <div className="admin-hero-banner-modal-actions">
                <button type="submit" className="admin-hero-banner-save-btn" disabled={loading || uploading}>
                  {loading ? <Loader2 className="spin" /> : (modalType === 'add' ? 'Add Banner' : 'Save Changes')}
                </button>
                <button type="button" className="admin-hero-banner-cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && bannerToDelete && (
        <div className="admin-hero-banner-delete-modal-overlay">
          <div className="admin-hero-banner-delete-modal">
            <Trash2 size={42} className="delete-modal-icon" />
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete the banner titled "<strong>{bannerToDelete.title}</strong>"?
              <br />
              This action cannot be undone.
            </p>
            <div className="admin-hero-banner-delete-modal-actions">
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

export default HeroBanner; 