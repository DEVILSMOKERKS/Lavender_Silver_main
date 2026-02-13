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
import './AdminInstaImages.css';
import { AdminContext } from '../../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminInstaImages = () => {
  const { token } = useContext(AdminContext);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [currentImage, setCurrentImage] = useState(null);
  const [form, setForm] = useState({
    alt_text: '',
    position: 1,
    is_active: false,
    image: null,
    link: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // Fetch images function
  const fetchImages = async (searchTerm = search) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/home-banners/instagram-images`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // Show all images in admin panel regardless of status
      let images = res.data.data || [];
      if (searchTerm) {
        images = images.filter(
          (img) =>
            img.alt_text && img.alt_text.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setImages(images);
    } catch (err) {
      setError('Failed to fetch Instagram images');
    }
    setLoading(false);
  };

  // Fetch images using useEffect
  useEffect(() => {
    fetchImages(search);
  }, [search, token]);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Open modal for add/edit
  const openModal = (type, image = null) => {
    setModalType(type);
    setCurrentImage(image);
    if (type === 'edit' && image) {
      // Ensure is_active is properly set from the image data
      const isActive = image.is_active === true || image.is_active === 1 || image.is_active === '1';
      setForm({
        alt_text: image.alt_text || '',
        position: image.position || 1,
        is_active: isActive,
        image: null,
        link: image.link || '',
      });
    } else {
      setForm({
        alt_text: '',
        position: 1,
        is_active: true,
        image: null,
        link: '',
      });
      setImageFile(null);
    }
    setShowModal(true);
    setError('');
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentImage(null);
    setError('');
    setImageFile(null);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0] || null);
  };

  // Add or update image
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prevent duplicate position on add
    if (modalType === 'add') {
      const isDuplicatePosition = (images || []).some(
        (img) => Number(img.position) === Number(form.position)
      );
      if (isDuplicatePosition) {
        setError('An image with this position already exists. Please choose a different position.');
        setLoading(false);
        return;
      }
    }

    // Validate link URL if provided
    if (form.link && !form.link.startsWith('http') && !form.link.startsWith('https')) {
      setError('Please enter a valid URL starting with http:// or https://');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('alt_text', form.alt_text);
      formData.append('position', form.position);
      // Ensure is_active is properly converted to a boolean
      const isActive = form.is_active === true || form.is_active === 'true' || form.is_active === 1 || form.is_active === '1';
      formData.append('is_active', isActive);
      if (form.link) {
        formData.append('link', form.link);
      }

      if (imageFile) {
        formData.append('images', imageFile);
      }

      let response;
      if (modalType === 'add') {
        if (!imageFile) {
          setError('Please select an image to upload.');
          setLoading(false);
          return;
        }
        response = await axios.post(`${API_BASE_URL}/api/home-banners/instagram-images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await axios.put(`${API_BASE_URL}/api/home-banners/instagram-images/${currentImage.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (response.data.success) {
        await fetchImages();
        closeModal();
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
    setLoading(false);
  };

  // Trigger the delete confirmation modal
  const handleDeleteClick = (image) => {
    setImageToDelete(image);
    setShowDeleteConfirm(true);
  };

  // Delete image after confirmation
  const confirmDelete = async () => {
    if (!imageToDelete) return;
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/home-banners/instagram-images/${imageToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        await fetchImages();
        setShowDeleteConfirm(false);
        setImageToDelete(null);
      }
    } catch (err) {
      setError('Failed to delete image');
    }
    setLoading(false);
  };

  return (
    <div className="admin-insta-images-root">
      <div className="admin-insta-images-header">
        <h1 className="admin-insta-images-title">Instagram Images</h1>
        <div className="admin-insta-images-controls">
          <div className="admin-insta-images-search-container">
            <Search className="admin-insta-images-search-icon" />
            <input
              type="text"
              placeholder="Search by alt text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-insta-images-search-input"
            />
          </div>
          <button className="admin-insta-images-add-btn" onClick={() => openModal('add')}>
            <Plus size={16} /> Add Image
          </button>
        </div>
      </div>

      {error && <div className="admin-insta-images-error">{error}</div>}

      <div className="admin-insta-images-table-container">
        <table className="admin-insta-images-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Alt Text</th>
              <th>Position</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  <Loader2 className="spin" /> Loading...
                </td>
              </tr>
            ) : images.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  No Instagram images found.
                </td>
              </tr>
            ) : (
              images.map((image) => (
                <tr key={image.id}>
                  <td>{image.id}</td>
                  <td>
                    <div className="admin-insta-images-images">
                      {image.image_url ? (
                        <img
                          src={`${API_BASE_URL}${image.image_url}`}
                          alt={image.alt_text || 'Instagram image'}
                          className="admin-insta-images-thumb"
                        />
                      ) : (
                        <ImageIcon className="admin-insta-images-noimg" />
                      )}
                    </div>
                  </td>
                  <td>{image.alt_text || 'No alt text'}</td>
                  <td>{image.position}</td>
                  <td>
                    <span className={`status-badge ${image.is_active ? 'active' : 'inactive'}`}>
                      {image.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-insta-images-action-btn"
                      onClick={() => openModal('edit', image)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="admin-insta-images-action-btn"
                      onClick={() => handleDeleteClick(image)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="admin-insta-images-modal-overlay">
          <div className="admin-insta-images-modal">
            <button className="admin-insta-images-modal-close" onClick={closeModal}><X /></button>
            <h2>{modalType === 'add' ? 'Add Instagram Image' : 'Edit Instagram Image'}</h2>
            <form onSubmit={handleSubmit} className="admin-insta-images-form">
              <label>Alt Text
                <input type="text" name="alt_text" value={form.alt_text} onChange={handleChange} />
              </label>
              <label>Position
                <input type="number" name="position" value={form.position} onChange={handleChange} min="1" />
              </label>
              <label>Status
                <select
                  name="is_active"
                  value={form.is_active ? '1' : '0'}
                  onChange={e => setForm(prev => ({ ...prev, is_active: e.target.value === '1' }))}
                  className="admin-insta-images-select"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
              <label>Link (Optional)
                <input
                  type="url"
                  name="link"
                  value={form.link}
                  onChange={handleChange}
                  placeholder="https://www.instagram.com/p/..."
                  className="admin-insta-images-input"
                />
                <small className="admin-insta-images-hint">Leave empty to use default Instagram profile link</small>
              </label>
              <label>Image
                <input type="file" accept="image/*" onChange={handleImageChange} required={modalType === 'add'} />
                {modalType === 'edit' && currentImage && currentImage.image_url && (
                  <div style={{ marginTop: 8, }}>
                    <img
                      src={`${API_BASE_URL}${currentImage.image_url}`}
                      alt="Current"
                      className="admin-insta-images-thumb"
                    />
                  </div>
                )}
                {uploading && <span><Loader2 className="spin" /> Uploading...</span>}
              </label>
              <div className="admin-insta-images-modal-actions">
                <button type="submit" className="admin-insta-images-save-btn" disabled={loading || uploading}>
                  {loading ? <Loader2 className="spin" /> : (modalType === 'add' ? 'Add Image' : 'Save Changes')}
                </button>
                <button type="button" className="admin-insta-images-cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && imageToDelete && (
        <div className="admin-insta-images-delete-modal-overlay">
          <div className="admin-insta-images-delete-modal">
            <Trash2 size={42} className="delete-modal-icon" />
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete this Instagram image?
              <br />
              This action cannot be undone.
            </p>
            <div className="admin-insta-images-delete-modal-actions">
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

export default AdminInstaImages;