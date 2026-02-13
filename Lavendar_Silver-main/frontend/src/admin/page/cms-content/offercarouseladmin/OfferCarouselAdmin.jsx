import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Upload, X, Check } from 'lucide-react';
import axios from 'axios';
import { AdminContext } from '../../../../context/AdminContext';
import './OfferCarouselAdmin.css';

const OfferCarouselAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: ''
  });

  const { token: adminToken } = useContext(AdminContext);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/offer-carousel`);
      // Handle the new API response structure
      const carouselData = response.data.success ? response.data.data : response.data;
      setItems(carouselData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching carousel items:', error);
      toast.error('Failed to load carousel items');
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setFormData({ title: '' });
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      title: record.title,
    });
    setImagePreview(record.imageUrl || record.image_url ? `${API_BASE_URL}${record.imageUrl || record.image_url}` : '');
    showModal();
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/offer-carousel/${id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      toast.success('Carousel item deleted successfully');
      fetchItems();
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      toast.error('Failed to delete carousel item');
    }
  };

  const handleFileChange = (file) => {
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      toast.error('You can only upload image files!');
      return;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      toast.error('Image must be smaller than 5MB!');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!editingId && !imageFile) {
      toast.error('Please upload an image');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingId) {
        await axios.put(
          `${API_BASE_URL}/api/offer-carousel/${editingId}`,
          submitData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );
        toast.success('Carousel item updated successfully');
      } else {
        await axios.post(
          `${API_BASE_URL}/api/offer-carousel`,
          submitData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );
        toast.success('Carousel item added successfully');
      }

      handleCancel();
      fetchItems();
    } catch (error) {
      console.error('Error saving carousel item:', error);
      toast.error(error.response?.data?.message || 'Failed to save carousel item');
    }
  };

  const renderTableRows = () => {
    return items.map((item) => (
      <tr key={item.id}>
        <td>
          <img
            src={item.imageUrl || item.image_url ? `${API_BASE_URL}${item.imageUrl || item.image_url}` : ''}
            alt="Carousel"
            className="table-image"
          />
        </td>
        <td>
          <span className="table-title">{item.title}</span>
        </td>
        <td>
          <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div className="offer-carousel-admin-action-buttons">
            <button
              className="btn-edit"
              onClick={() => handleEdit(item)}
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              className="btn-delete"
              onClick={() => handleDelete(item.id)}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="offer-carousel-admin">
      <div className="header">
        <h1>Offer Carousel Management</h1>
        <button
          className="btn-primary"
          onClick={showModal}
        >
          <Plus size={16} />
          Add New Carousel Item
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows()}
            </tbody>
          </table>
        )}
      </div>

      {isModalVisible && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Carousel Item' : 'Add New Carousel Item'}</h2>
              <button className="modal-close" onClick={handleCancel}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter carousel item title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Image {!editingId && '*'}</label>
                <div className="file-upload-container">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" loading="lazy" decoding="async" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="file-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-placeholder">
                        <Upload size={24} />
                        <span>Click to upload image</span>
                        <small>Max size: 5MB</small>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  {editingId ? 'Update' : 'Submit'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferCarouselAdmin;
