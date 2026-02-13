import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Search,
  Plus,
  Link,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  X,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { AdminContext } from '../../../context/AdminContext';
import './SocialLinks.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SocialLinks = () => {
  const { token } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideIcons, setHideIcons] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [currentLink, setCurrentLink] = useState(null);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [socialLinks, setSocialLinks] = useState([]);

  const [form, setForm] = useState({
    platform: '',
    link: '',
    is_active: true
  });

  // All available platforms
  const ALL_PLATFORMS = [
    'Phone Number',
    'Email',
    'Address',
    'YouTube',
    'Facebook',
    'Instagram',
    'Website',
    'Twitter'
  ];

  // Get available platforms (not already in database)
  const getAvailablePlatforms = () => {
    // Get all platforms that are already in the database
    const usedPlatforms = socialLinks.map(link => link.platform);

    // When editing, include the current platform
    if (modalType === 'edit' && currentLink) {
      return ALL_PLATFORMS.filter(platform =>
        !usedPlatforms.includes(platform) || platform === currentLink.platform
      );
    }
    // When adding, only show unused platforms
    return ALL_PLATFORMS.filter(platform => !usedPlatforms.includes(platform));
  };

  // Fetch social links
  const fetchSocialLinks = async () => {
    setLoading(true);
    try {
      const headers = token ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      } : {};

      const res = await axios.get(`${API_BASE_URL}/api/home-banners/social-links`, { headers });
      setSocialLinks(res.data.data || []);
    } catch (err) {
      console.error('Error fetching social links:', err);
      setError(err.response?.data?.message || 'Failed to fetch social links');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Open modal for add/edit
  const openModal = (type, link = null) => {
    setModalType(type);
    setCurrentLink(link);
    if (type === 'add') {
      setForm({
        platform: '',
        link: '',
        is_active: true
      });
    } else {
      setForm({
        platform: link.platform,
        link: link.link || link.url || '', // Support both link and url for backward compatibility
        is_active: link.is_active !== undefined ? link.is_active : true
      });
    }
    setShowModal(true);
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const apiUrl = `${API_BASE_URL}/api/home-banners/social-links`;

      const formData = form;

      if (modalType === 'add') {
        // For new links, wrap in a links array as expected by the backend
        const response = await axios.post(
          apiUrl,
          { links: [{ ...formData }] }, // Wrap in links array
          { headers }
        );
        // The backend returns the created links in response.data.data
        if (response.data.data && response.data.data.length > 0) {
          setSocialLinks([...socialLinks, response.data.data[0]]);
        }
      } else {
        // For updates, use PUT with the link ID in the URL
        // Include click_count from the current link or default to 0
        const updateData = {
          ...formData,
          click: currentLink.click_count || 0  // Map click_count to click for the backend
        };

        await axios.put(
          `${apiUrl}/${currentLink.id}`,
          updateData,
          { headers }
        );
        setSocialLinks(socialLinks.map(link =>
          link.id === currentLink.id ? { ...link, ...formData } : link
        ));
      }
      setShowModal(false);
      fetchSocialLinks();
    } catch (err) {
      console.error('Error saving social link:', err);
      setError(err.response?.data?.message || 'Failed to save social link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (!linkToDelete) return;

    setLoading(true);
    try {
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.delete(
        `${API_BASE_URL}/api/home-banners/social-links/${linkToDelete.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setShowDeleteConfirm(false);
      fetchSocialLinks();
    } catch (err) {
      setError('Failed to delete social link');
    }
    setLoading(false);
  };

  // Stats calculation
  const statsData = [
    {
      title: 'Total Links',
      value: socialLinks.length,
      icon: <Link className="admin-social-links-w-5 admin-social-links-h-5" />,
      color: 'blue'
    },
    {
      title: 'Active Links',
      value: socialLinks.filter(link => link.is_active).length,
      icon: <Eye className="admin-social-links-w-5 admin-social-links-h-5" />,
      color: 'green'
    }
  ];

  const socialLinksData = socialLinks
    .filter(link =>
      link.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.link || link.url || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.position - b.position);

  const getStatusStyle = (status) => {
    return status === 'Active' ? 'admin-social-links-status-active' : 'admin-social-links-status-inactive';
  };

  return (
    <div className="admin-social-link-container">
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="admin-social-link-modal-overlay">
          <div className="admin-social-link-modal">
            <button
              className="admin-social-link-modal-close"
              onClick={() => setShowModal(false)}
              disabled={loading}
            >
              <X />
            </button>
            <h2>{modalType === 'add' ? 'Add Social Link' : 'Edit Social Link'}</h2>
            <form onSubmit={handleSubmit} className="admin-social-link-form">
              <div className="admin-social-link-form-group">
                <label>Platform</label>
                <select
                  name="platform"
                  value={form.platform}
                  onChange={handleChange}
                  className="admin-social-link-form-control"
                  required
                  disabled={modalType === 'edit'}
                  style={modalType === 'edit' ? { cursor: 'not-allowed', backgroundColor: '#f5f5f5' } : {}}
                >
                  <option value="">Select Platform</option>
                  {getAvailablePlatforms().map(platform => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                {modalType === 'edit' && (
                  <div className="admin-social-link-form-help" style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                    Platform cannot be changed when editing
                  </div>
                )}
              </div>

              <div className="admin-social-link-form-group">
                <label>{form.platform === 'Address' ? 'Address/Location' : 'Link/Contact'}</label>
                {form.platform === 'Address' ? (
                  <textarea
                    name="link"
                    value={form.link}
                    onChange={handleChange}
                    className="admin-social-link-form-control"
                    placeholder="Enter full address (e.g., Plot no.9 Chandra Nagar Durgapura Bypass, Vaishali Nagar, Jaipur, Rajasthan, Pin 302018)"
                    rows={3}
                    required
                  />
                ) : (
                  <input
                    type="text"
                    name="link"
                    value={form.link}
                    onChange={handleChange}
                    className="admin-social-link-form-control"
                    placeholder={
                      form.platform === 'Phone Number' ? '+91 9876543210' :
                        form.platform === 'Email' ? 'contact@example.com' :
                          form.platform === 'YouTube' ? 'https://youtube.com/@channel' :
                            form.platform === 'Facebook' ? 'https://facebook.com/yourpage' :
                              form.platform === 'Instagram' ? 'https://instagram.com/yourprofile' :
                                'https://example.com/your-profile'
                    }
                    required
                  />
                )}
              </div>

              <div className="admin-social-link-form-group">
                <label className="admin-social-link-checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="admin-social-link-checkbox"
                  />
                  <span>Active</span>
                </label>
                <div className="admin-social-link-form-help">
                  {form.is_active ? 'This link will be visible on the website' : 'This link will be hidden on the website'}
                </div>
              </div>

              {error && <div className="admin-social-link-error">{error}</div>}

              <div className="admin-social-link-form-actions">
                <button
                  type="button"
                  className="admin-social-link-btn admin-social-link-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-social-link-btn admin-social-link-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="admin-social-link-animate-spin" />
                      {modalType === 'add' ? 'Adding...' : 'Saving...'}
                    </>
                  ) : modalType === 'add' ? (
                    'Add Link'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && linkToDelete && (
        <div className="admin-social-link-delete-modal-overlay">
          <div className="admin-social-link-delete-modal">
            <Trash2 size={42} className="delete-modal-icon" />
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete the social link for "<strong>{linkToDelete.platform}</strong>"?
              <br />
              This action cannot be undone.
            </p>
            {error && <div className="admin-social-link-error">{error}</div>}
            <div className="admin-social-link-delete-modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="delete-cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="delete-confirm-btn"
                disabled={loading}
              >
                {loading ? <Loader2 className="spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-social-link-container">
        <div className="admin-social-link-header">
          <h2>Social Links</h2>
          <div className="admin-social-link-actions">
            <div className="admin-social-link-search">
              <Search className="admin-social-link-search-icon" />
              <input
                type="text"
                placeholder="Search social links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-social-link-search-input"
              />
            </div>
            <button
              className="admin-social-link-add-btn"
              onClick={() => openModal('add')}
            >
              <Plus className="admin-social-link-add-icon" />
              Add New Link
            </button>
          </div>
        </div>

        <div className="admin-social-link-stats-grid">
          {statsData.map((stat, index) => (
            <div key={index} className="admin-social-link-stat-card">
              <div className="admin-social-link-stat-content">
                <div className="admin-social-link-stat-text">
                  <h3>{stat.title}</h3>
                  <p className="admin-social-link-stat-value">{stat.value}</p>
                </div>
                <div className="admin-social-link-stat-icon">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && !socialLinks.length ? (
          <div className="admin-loading">
            <Loader2 className="admin-animate-spin" />
            <span>Loading social links...</span>
          </div>
        ) : (
          <div className="admin-social-link-table-container">
            <table className="admin-social-link-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Link</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {socialLinksData.length > 0 ? (
                  socialLinksData.map((link, index) => (
                    <tr key={link.id || index}>
                      <td>
                        <div className="admin-social-link-platform">
                          {link.icon && <i className={link.icon}></i>}
                          <span>{link.platform}</span>
                        </div>
                      </td>
                      <td>
                        {link.platform === 'Address' ? (
                          <span className="admin-social-links-link" style={{ whiteSpace: 'pre-line' }}>{link.link || link.url || ''}</span>
                        ) : (
                          <a
                            href={
                              link.platform === 'Phone Number' ? `tel:${link.link || link.url}` :
                                link.platform === 'Email' ? `mailto:${link.link || link.url}` :
                                  link.link || link.url
                            }
                            target={link.platform === 'Phone Number' || link.platform === 'Email' ? '_self' : '_blank'}
                            rel="noopener noreferrer"
                            className="admin-social-links-link"
                            onClick={async () => {
                              try {
                                await axios.post(`${API_BASE_URL}/api/home-banners/social-links/${link.id}/click`);
                              } catch (err) {
                                console.error('Failed to track click:', err);
                              }
                            }}
                          >
                            {link.link || link.url}
                          </a>
                        )}
                      </td>
                      <td>
                        <span className={`admin-social-link-status admin-social-link-status-${link.is_active ? 'active' : 'inactive'}`}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-social-link-actions">
                          <button
                            className="admin-social-link-btn-edit"
                            onClick={() => openModal('edit', link)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="admin-social-link-btn-delete"
                            onClick={() => {
                              setLinkToDelete(link);
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="admin-no-data">
                      No social links found. Click "Add New Link" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialLinks;