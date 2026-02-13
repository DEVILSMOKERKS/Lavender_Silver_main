import React, { useState, useEffect, useContext } from 'react';
import './ShopBannerManagement.css';
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';

// Import static fallback images
import shopBanner1 from '../../../assets/img/banner/shop-banner2.jpg';
import shopBanner2 from '../../../assets/img/banner/shop-ban.jpg';
import shopBanner3 from '../../../assets/img/banner/shop.jpg';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Static fallback images
const fallbackImages = [
  { image: shopBanner1, alt: 'Shop Banner 1' },
  { image: shopBanner2, alt: 'Shop Banner 2' },
  { image: shopBanner3, alt: 'Shop Banner 3' }
];

const ShopBannerManagement = () => {
  const { showNotification } = useNotification();
  const { token } = useContext(AdminContext);
  const [loading, setLoading] = useState(false);
  const [bannersExist, setBannersExist] = useState(false);
  const [bannerData, setBannerData] = useState({
    first_banner_image: '',
    first_banner_alt: '',
    second_banner_image: '',
    second_banner_alt: '',
    third_banner_image: '',
    third_banner_alt: ''
  });

  useEffect(() => {
    fetchBannerData();
  }, []);

  // Helper function to get display image (database or fallback)
  const getDisplayImage = (bannerNumber) => {
    const imageFields = ['first_banner_image', 'second_banner_image', 'third_banner_image'];
    const altFields = ['first_banner_alt', 'second_banner_alt', 'third_banner_alt'];

    const imageField = imageFields[bannerNumber - 1];
    const altField = altFields[bannerNumber - 1];

    const dbImage = bannerData[imageField];
    const dbAlt = bannerData[altField];

    if (dbImage && bannersExist) {
      // Use database image if it exists and banners are in database
      return {
        src: dbImage.startsWith('http') ? dbImage : `${API_BASE_URL}${dbImage}`,
        alt: dbAlt || `Banner ${bannerNumber}`
      };
    } else {
      // Use fallback image
      return {
        src: fallbackImages[bannerNumber - 1].image,
        alt: fallbackImages[bannerNumber - 1].alt
      };
    }
  };

  const fetchBannerData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shop-banners`);

      if (response.data.success && response.data.data) {
        setBannerData(response.data.data);
        setBannersExist(true);
      } else {
        setBannersExist(false);
        setBannerData({
          first_banner_image: '',
          first_banner_alt: '',
          second_banner_image: '',
          second_banner_alt: '',
          third_banner_image: '',
          third_banner_alt: ''
        });
      }
    } catch (error) {
      console.error('🚨 Error fetching shop banner data:', error);
      setBannersExist(false);
      showNotification('Failed to load shop banner data. Please try again.', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBannerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_BASE_URL}/api/shop-banners/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setBannerData(prev => ({
          ...prev,
          [fieldName]: response.data.data.image_url
        }));
        showNotification('Image uploaded successfully!', 'success');
      } else {
        showNotification('Failed to upload image', 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error?.response?.data?.error);
      showNotification(error?.response?.data?.error || 'Error uploading image. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (bannersExist) {
        // Update existing banners
        const response = await axios.put(`${API_BASE_URL}/api/shop-banners`, bannerData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          showNotification('Shop banners updated successfully!', 'success');
          fetchBannerData(); // Refresh data
        } else {
          showNotification(response.data.message || 'Failed to update banners', 'error');
        }
      } else {
        // Create new banners
        const response = await axios.post(`${API_BASE_URL}/api/shop-banners`, bannerData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          showNotification('Shop banners created successfully!', 'success');
          setBannersExist(true);
          fetchBannerData(); // Refresh data
        } else {
          showNotification(response.data.message || 'Failed to create banners', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving banners:', error);

      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        showNotification('Network error: No response from server', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderBannerForm = (bannerNumber, imageField, altField) => (
    <div className="shop-banner-management-banner-section">
      <h3>Banner {bannerNumber}</h3>

      <div className="shop-banner-management-form-group">
        <label>Image URL:</label>
        <input
          type="text"
          name={imageField}
          value={bannerData[imageField]}
          onChange={handleInputChange}
          placeholder={`Enter banner ${bannerNumber} image URL`}
          required
        />
      </div>

      <div className="shop-banner-management-form-group">
        <label>Upload Image (Alternative):</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, imageField)}
          className="shop-banner-management-file-input"
        />
        <small>Upload an image file or provide a URL above</small>
      </div>

      <div className="shop-banner-management-form-group">
        <label>Alt Text:</label>
        <input
          type="text"
          name={altField}
          value={bannerData[altField]}
          onChange={handleInputChange}
          placeholder={`Enter banner ${bannerNumber} alt text`}
          required
        />
      </div>

      <div className="shop-banner-management-image-preview">
        <label>Preview:</label>
        <img
          src={getDisplayImage(bannerNumber).src}
          alt={getDisplayImage(bannerNumber).alt}
          className="shop-banner-management-preview-image"
        />
      </div>
    </div>
  );

  return (
    <div className="shop-banner-management">
      <div className="shop-banner-management-header">
        <h1>Shop Banner Management</h1>
        <p>Manage the three banners displayed on the shop page</p>
      </div>

      <div className="shop-banner-management-content">
        {loading && <div className="shop-banner-management-loading">Loading...</div>}

        <div className="shop-banner-management-form-section">
          <h2>{bannersExist ? 'Update Shop Banners' : 'Create Shop Banners'}</h2>

          {bannersExist && (
            <div className="shop-banner-management-update-note">
              <p>📝 Banners already exist. You can update them below.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="shop-banner-management-form">
            {renderBannerForm(1, 'first_banner_image', 'first_banner_alt')}
            {renderBannerForm(2, 'second_banner_image', 'second_banner_alt')}
            {renderBannerForm(3, 'third_banner_image', 'third_banner_alt')}

            <div className="shop-banner-management-form-actions">
              <button
                type="submit"
                disabled={loading}
                className="shop-banner-management-submit-btn"
              >
                {loading ? 'Saving...' : (bannersExist ? 'Update Banners' : 'Create Banners')}
              </button>
            </div>
          </form>
        </div>

        {bannersExist && (
          <div className="shop-banner-management-current-banners">
            <h3>Current Banners</h3>
            <div className="shop-banner-management-banners-grid">
              {[1, 2, 3].map((num) => {
                const imageField = `${['first', 'second', 'third'][num - 1]}_banner_image`;
                const altField = `${['first', 'second', 'third'][num - 1]}_banner_alt`;

                return (
                  <div key={num} className="shop-banner-management-current-banner">
                    <h4>Banner {num}</h4>
                    {bannerData[imageField] ? (
                      <img
                        src={bannerData[imageField].startsWith('http') ? bannerData[imageField] : `${API_BASE_URL}${bannerData[imageField]}`}
                        alt={bannerData[altField] || `Banner ${num}`}
                        className="shop-banner-management-current-image"
                      />
                    ) : (
                      <div className="shop-banner-management-no-image">
                        No image set
                      </div>
                    )}
                    <p className="shop-banner-management-alt-text">
                      <strong>Alt Text:</strong> {bannerData[altField] || 'Not set'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopBannerManagement; 