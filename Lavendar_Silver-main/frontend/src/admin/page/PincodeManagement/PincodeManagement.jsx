import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Truck,
  CreditCard,
  Edit2,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  X,
  AlertTriangle,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import './PincodeManagement.css';
import axios from 'axios';
import { useNotification } from '../../../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const PincodeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Pincode');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [codFilter, setCodFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All States');
  const [pincodes, setPincodes] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [stats, setStats] = useState({
    activePincodes: 0,
    codAvailable: 0,
    totalPincodes: 0,
    inactivePincodes: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState(null);
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: '',
    district: '',
    zone: 'Tier2',
    delivery_available: true,
    cod_available: true,
    estimated_delivery_days: 3,
    status: 'active'
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    limit: 20
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pincodeToDelete, setPincodeToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const { showNotification } = useNotification();

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Fetch pincodes
  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const status = selectedFilter === 'All Pincode' ? '' : selectedFilter;
      const zone = zoneFilter === 'All Zones' ? '' : zoneFilter;
      const delivery = deliveryFilter === 'All' ? '' : (deliveryFilter === 'Available' ? '1' : '0');
      const cod = codFilter === 'All' ? '' : (codFilter === 'Available' ? '1' : '0');
      const state = stateFilter === 'All States' ? '' : stateFilter;

      const response = await axios.get(`${API_BASE_URL}/api/pincodes`, {
        params: {
          page: pagination.current_page,
          limit: pagination.limit,
          search: searchTerm,
          status: status,
          zone: zone,
          delivery_available: delivery,
          cod_available: cod,
          state: state
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setPincodes(response.data.data);
        setStats(response.data.stats);
        setPagination({
          ...pagination,
          total_pages: response.data.pagination.total_pages,
          current_page: response.data.pagination.current_page
        });

        // Extract unique states for filter dropdown
        if (response.data.allStates) {
          setAllStates(response.data.allStates);
        }
      }
    } catch (error) {
      console.error('Error fetching pincodes:', error);
      showNotification('Failed to fetch pincodes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPincodes();
  }, [searchTerm, selectedFilter, pagination.current_page]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.current_page === 1) {
        fetchPincodes();
      } else {
        setPagination({ ...pagination, current_page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle filter changes - reset to page 1
  useEffect(() => {
    setPagination({ ...pagination, current_page: 1 });
  }, [selectedFilter, zoneFilter, deliveryFilter, codFilter, stateFilter]);

  // Fetch pincode details from API
  const fetchPincodeDetails = async (pincode) => {
    if (!pincode || pincode.trim().length !== 6) {
      return null;
    }

    setIsFetchingPincode(true);
    setPincodeError('');

    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/pincodes/fetch-details`, {
        params: { pincode: pincode.trim() },
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000
      });

      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        setPincodeError(response.data?.message || 'Invalid pincode. Please check and try again.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error);
      if (error.response) {
        setPincodeError(error.response.data?.message || 'Unable to fetch pincode details. Please try again.');
      } else if (error.request) {
        setPincodeError('Network error. Please check your connection.');
      } else {
        setPincodeError('Unable to fetch pincode details. Please fill manually.');
      }
      return null;
    } finally {
      setIsFetchingPincode(false);
    }
  };

  // Handle pincode input change
  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    const trimmedValue = value.trim();

    // Update pincode in form data immediately
    setFormData(prev => ({ ...prev, pincode: value }));
    setPincodeError('');

    // If 6 digits entered, fetch details from API
    if (trimmedValue.length === 6) {
      const details = await fetchPincodeDetails(trimmedValue);
      if (details) {
        // Auto-fill city, state, and district from API response
        setFormData(prev => ({
          ...prev,
          pincode: details.pincode,
          city: details.city || prev.city,
          state: details.state || prev.state,
          district: details.district || prev.district
        }));
      }
    } else if (trimmedValue.length < 6 && trimmedValue.length > 0) {
      // Clear auto-filled data if pincode is incomplete
      setFormData(prev => ({
        ...prev,
        pincode: value
      }));
    }
  };

  // Open modal for add/edit
  const openModal = (pincode = null) => {
    if (pincode) {
      setEditingPincode(pincode);
      setFormData({
        pincode: pincode.pincode,
        city: pincode.city,
        state: pincode.state,
        district: pincode.district || '',
        zone: pincode.zone,
        delivery_available: pincode.delivery_available === 1,
        cod_available: pincode.cod_available === 1,
        estimated_delivery_days: pincode.estimated_delivery_days,
        status: pincode.status
      });
    } else {
      setEditingPincode(null);
      setFormData({
        pincode: '',
        city: '',
        state: '',
        district: '',
        zone: 'Tier2',
        delivery_available: true,
        cod_available: true,
        estimated_delivery_days: 3,
        status: 'active'
      });
      setPincodeError('');
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingPincode(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Normalize form data - ensure numbers are properly set
    const normalizedData = {
      ...formData,
      estimated_delivery_days: formData.estimated_delivery_days === '' ? 1 : (parseInt(formData.estimated_delivery_days) || 1),
    };

    try {
      const token = getAuthToken();
      const url = editingPincode
        ? `${API_BASE_URL}/api/pincodes/${editingPincode.id}`
        : `${API_BASE_URL}/api/pincodes`;

      const method = editingPincode ? 'put' : 'post';

      const response = await axios[method](url, normalizedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification(
          editingPincode ? 'Pincode updated successfully' : 'Pincode created successfully',
          'success'
        );
        closeModal();
        fetchPincodes();
      }
    } catch (error) {
      console.error('Error saving pincode:', error);
      showNotification(
        error.response?.data?.message || 'Failed to save pincode',
        'error'
      );
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (pincode) => {
    setPincodeToDelete(pincode);
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPincodeToDelete(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!pincodeToDelete) return;

    try {
      const token = getAuthToken();
      const response = await axios.delete(`${API_BASE_URL}/api/pincodes/${pincodeToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('Pincode deleted successfully', 'success');
        closeDeleteModal();
        fetchPincodes();
      }
    } catch (error) {
      console.error('Error deleting pincode:', error);
      showNotification(
        error.response?.data?.message || 'Failed to delete pincode',
        'error'
      );
      closeDeleteModal();
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, trend, color }) => (
    <div className="adminpincodemanagement-stat-card">
      <div className="adminpincodemanagement-stat-header">
        <span className="adminpincodemanagement-stat-title">{title}</span>
        <div className={`adminpincodemanagement-stat-icon ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="adminpincodemanagement-stat-value">{value}</div>
      <div className={`adminpincodemanagement-stat-change adminpincodemanagement-stat-change-${trend}`}>
        <span className="adminpincodemanagement-stat-change-arrow">
          {trend === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </span>
        <span className="adminpincodemanagement-stat-change-value">{change}</span>
      </div>
    </div>
  );

  const statsData = [
    {
      title: 'Total Pincodes',
      value: stats.totalPincodes.toString(),
      change: 'All pincodes in system',
      icon: MapPin,
      trend: 'up',
      color: 'green'
    },
    {
      title: 'Active Pincode',
      value: stats.activePincodes.toString(),
      change: 'Currently active',
      icon: MapPin,
      trend: 'up',
      color: 'blue'
    },
    {
      title: 'COD Available',
      value: stats.codAvailable.toString(),
      change: 'Pincodes with COD',
      icon: CreditCard,
      trend: 'up',
      color: 'purple'
    },
    {
      title: 'Inactive Pincodes',
      value: stats.inactivePincodes.toString(),
      change: 'Currently inactive',
      icon: Clock,
      trend: 'down',
      color: 'red'
    }
  ];

  return (
    <div className="adminpincodemanagement-pincode-management">
      {/* Header */}
      <div className="adminpincodemanagement-header">
        <h1 className="adminpincodemanagement-page-title">PINCODE MANAGEMENT</h1>
      </div>
      <div className="adminpincodemanagement-header-controls-box">
        <div className="adminpincodemanagement-header-controls">
          <div className="adminpincodemanagement-search-container">
            <Search className="adminpincodemanagement-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by pincode, city, state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminpincodemanagement-search-input"
            />
          </div>

          <div className="adminpincodemanagement-header-actions">
            <button
              className="adminpincodemanagement-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {showFilters ? (
                <ChevronDown size={14} style={{ transform: 'rotate(180deg)', transition: 'transform 0.2s' }} />
              ) : (
                <ChevronDown size={14} style={{ transition: 'transform 0.2s' }} />
              )}
            </button>

            <button
              className="adminpincodemanagement-add-pincode-btn"
              onClick={() => openModal()}
            >
              <Plus size={16} />
              Add Pincode
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="adminpincodemanagement-filters-section">
          <div className="adminpincodemanagement-filters-header">
            <h3 className="adminpincodemanagement-filters-title">Filter Options</h3>
            <button
              className="adminpincodemanagement-filters-close"
              onClick={() => setShowFilters(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="adminpincodemanagement-filters-content">
            <div className="adminpincodemanagement-filters-row">
              <div className="adminpincodemanagement-filter-dropdown">
                <label className="adminpincodemanagement-filter-label">Status</label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="adminpincodemanagement-filter-select"
                >
                  <option value="All Pincode">All Pincode</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="adminpincodemanagement-filter-dropdown">
                <label className="adminpincodemanagement-filter-label">Zone</label>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="adminpincodemanagement-filter-select"
                >
                  <option value="All Zones">All Zones</option>
                  <option value="Metro">Metro</option>
                  <option value="Tier1">Tier 1</option>
                  <option value="Tier2">Tier 2</option>
                  <option value="Tier3">Tier 3</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div className="adminpincodemanagement-filter-dropdown">
                <label className="adminpincodemanagement-filter-label">Delivery</label>
                <select
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value)}
                  className="adminpincodemanagement-filter-select"
                >
                  <option value="All">All Delivery</option>
                  <option value="Available">Delivery Available</option>
                  <option value="Not Available">Delivery Not Available</option>
                </select>
              </div>

              <div className="adminpincodemanagement-filter-dropdown">
                <label className="adminpincodemanagement-filter-label">COD</label>
                <select
                  value={codFilter}
                  onChange={(e) => setCodFilter(e.target.value)}
                  className="adminpincodemanagement-filter-select"
                >
                  <option value="All">All COD</option>
                  <option value="Available">COD Available</option>
                  <option value="Not Available">COD Not Available</option>
                </select>
              </div>

              <div className="adminpincodemanagement-filter-dropdown">
                <label className="adminpincodemanagement-filter-label">State</label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="adminpincodemanagement-filter-select"
                >
                  <option value="All States">All States</option>
                  {allStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="adminpincodemanagement-filters-actions">
              <button
                className="adminpincodemanagement-clear-filters-btn"
                onClick={() => {
                  setSelectedFilter('All Pincode');
                  setZoneFilter('All Zones');
                  setDeliveryFilter('All');
                  setCodFilter('All');
                  setStateFilter('All States');
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="adminpincodemanagement-stats-grid">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Table Section */}
      <div className="adminpincodemanagement-table-section">
        <h2 className="adminpincodemanagement-table-title">Serviceable Pincodes</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <>
            <div className="adminpincodemanagement-table-container">
              <table className="adminpincodemanagement-data-table">
                <thead>
                  <tr>
                    <th>
                      <div className="adminpincodemanagement-table-header">
                        <ArrowUpDown size={14} className="adminpincodemanagement-sort-icon" />
                        <span>LOCATION</span>
                      </div>
                    </th>
                    <th>
                      <div className="adminpincodemanagement-table-header">
                        <ArrowUpDown size={14} className="adminpincodemanagement-sort-icon" />
                        <span>ZONE</span>
                      </div>
                    </th>
                    <th>
                      <div className="adminpincodemanagement-table-header">
                        <ArrowUpDown size={14} className="adminpincodemanagement-sort-icon" />
                        <span>DELIVERY OPTIONS</span>
                      </div>
                    </th>
                    <th>
                      <div className="adminpincodemanagement-table-header">
                        <ArrowUpDown size={14} className="adminpincodemanagement-sort-icon" />
                        <span>ETA</span>
                      </div>
                    </th>
                    <th>
                      <div className="adminpincodemanagement-table-header">
                        <ArrowUpDown size={14} className="adminpincodemanagement-sort-icon" />
                        <span>STATUS</span>
                      </div>
                    </th>
                    <th>
                      <div className="adminpincodemanagement-table-header">
                        <ArrowUpDown size={14} className="adminpincodemanagement-sort-icon" />
                        <span>ACTIONS</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pincodes.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                        No pincodes found
                      </td>
                    </tr>
                  ) : (
                    pincodes.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="adminpincodemanagement-location-cell">
                            <MapPin size={16} className="adminpincodemanagement-location-icon" />
                            <div>
                              <div className="adminpincodemanagement-pincode">{row.pincode}</div>
                              <div className="adminpincodemanagement-location">
                                {row.city}, {row.state}
                                {row.district && ` (${row.district})`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="adminpincodemanagement-zone-badge">{row.zone}</span>
                        </td>
                        <td>
                          <div className="adminpincodemanagement-delivery-options">
                            {row.delivery_available === 1 && (
                              <div className="adminpincodemanagement-delivery-option">
                                <Truck size={14} />
                                <span>Delivery Available</span>
                              </div>
                            )}
                            {row.cod_available === 1 && (
                              <div className="adminpincodemanagement-delivery-option adminpincodemanagement-cod">
                                <span>COD Available</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="adminpincodemanagement-eta-cell">
                            <Clock size={14} />
                            <span>{row.estimated_delivery_days} Day{row.estimated_delivery_days !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`adminpincodemanagement-status-badge ${row.status === 'active' ? 'adminpincodemanagement-active' : 'adminpincodemanagement-inactive'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <div className="adminpincodemanagement-actions">
                            <button
                              className="adminpincodemanagement-action-btn adminpincodemanagement-edit"
                              onClick={() => openModal(row)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="adminpincodemanagement-action-btn adminpincodemanagement-delete"
                              onClick={() => openDeleteModal(row)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="adminpincodemanagement-pagination">
                <button
                  onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                  disabled={pagination.current_page === pagination.total_pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="adminpincodemanagement-modal-overlay" onClick={closeModal}>
          <div className="adminpincodemanagement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adminpincodemanagement-modal-header">
              <h2>{editingPincode ? 'Edit Pincode' : 'Add New Pincode'}</h2>
              <button className="adminpincodemanagement-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="adminpincodemanagement-modal-form">
              <div className="adminpincodemanagement-form-row">
                <div className="adminpincodemanagement-form-group adminpincodemanagement-pincode-group">
                  <label>Pincode *</label>
                  <div className="adminpincodemanagement-pincode-input-wrapper">
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={handlePincodeChange}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value.length > 0 && value.length < 6) {
                          setPincodeError('Pincode must be exactly 6 digits');
                        } else if (value.length === 6 && !pincodeError && !isFetchingPincode) {
                          // If 6 digits and no error, try fetching again
                          handlePincodeChange(e);
                        }
                      }}
                      maxLength={6}
                      placeholder="Enter 6-digit pincode"
                      className={pincodeError ? 'adminpincodemanagement-input-error' : ''}
                      required
                      disabled={isFetchingPincode}
                      autoComplete="off"
                    />
                    {isFetchingPincode && (
                      <span className="adminpincodemanagement-loading-indicator">Loading...</span>
                    )}
                  </div>
                  {pincodeError && (
                    <span className="adminpincodemanagement-validation-message adminpincodemanagement-validation-error">
                      {pincodeError}
                    </span>
                  )}
                  {!pincodeError && formData.pincode.length === 6 && !isFetchingPincode && formData.city && (
                    <span className="adminpincodemanagement-validation-message adminpincodemanagement-validation-success">
                      Pincode details loaded successfully
                    </span>
                  )}
                </div>
                <div className="adminpincodemanagement-form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                      setFormData({ ...formData, city: value });
                    }}
                    placeholder="City name"
                    required
                    pattern="[A-Za-z\s]{2,}"
                    title="City must contain at least 2 letters"
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="adminpincodemanagement-form-row">
                <div className="adminpincodemanagement-form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                      setFormData({ ...formData, state: value });
                    }}
                    placeholder="State name"
                    required
                    pattern="[A-Za-z\s]{2,}"
                    title="State must contain at least 2 letters"
                    maxLength={100}
                  />
                </div>
                <div className="adminpincodemanagement-form-group">
                  <label>District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                      setFormData({ ...formData, district: value });
                    }}
                    placeholder="District name (optional)"
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="adminpincodemanagement-form-row">
                <div className="adminpincodemanagement-form-group">
                  <label>Zone</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  >
                    <option value="Metro">Metro</option>
                    <option value="Tier1">Tier 1</option>
                    <option value="Tier2">Tier 2</option>
                    <option value="Tier3">Tier 3</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div className="adminpincodemanagement-form-group">
                  <label>Estimated Delivery Days</label>
                  <input
                    type="number"
                    value={formData.estimated_delivery_days === '' ? '' : formData.estimated_delivery_days}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({
                        ...formData,
                        estimated_delivery_days: value === '' ? '' : (parseInt(value) || 0)
                      });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                        setFormData({ ...formData, estimated_delivery_days: 1 });
                      }
                    }}
                    min="1"
                  />
                </div>
              </div>
              <div className="adminpincodemanagement-form-row">
                <div className="adminpincodemanagement-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.delivery_available}
                      onChange={(e) => setFormData({ ...formData, delivery_available: e.target.checked })}
                    />
                    Delivery Available
                  </label>
                </div>
                <div className="adminpincodemanagement-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.cod_available}
                      onChange={(e) => setFormData({ ...formData, cod_available: e.target.checked })}
                    />
                    COD Available
                  </label>
                </div>
              </div>
              <div className="adminpincodemanagement-form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="adminpincodemanagement-modal-actions">
                <button type="button" onClick={closeModal}>Cancel</button>
                <button type="submit">{editingPincode ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && pincodeToDelete && (
        <div className="adminpincodemanagement-modal-overlay" onClick={closeDeleteModal}>
          <div className="adminpincodemanagement-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adminpincodemanagement-delete-modal-header">
              <div className="adminpincodemanagement-delete-modal-icon">
                <AlertTriangle size={24} />
              </div>
              <h2>Delete Pincode</h2>
            </div>
            <div className="adminpincodemanagement-delete-modal-content">
              <p>Are you sure you want to delete this pincode?</p>
              <div className="adminpincodemanagement-delete-modal-pincode-info">
                <strong>Pincode:</strong> {pincodeToDelete.pincode}
                <br />
                <strong>Location:</strong> {pincodeToDelete.city}, {pincodeToDelete.state}
              </div>
              <p className="adminpincodemanagement-delete-modal-warning">
                This action cannot be undone.
              </p>
            </div>
            <div className="adminpincodemanagement-delete-modal-actions">
              <button
                type="button"
                className="adminpincodemanagement-delete-modal-cancel"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adminpincodemanagement-delete-modal-confirm"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PincodeManagement;
