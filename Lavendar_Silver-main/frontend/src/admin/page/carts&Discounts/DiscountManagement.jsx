import React, { useState, useEffect, useContext } from 'react'
import './DiscountManagement.css';
import { Download, Search, ShoppingCart, AlertCircle, TrendingUp, Clock, ArrowUpDown, SquarePen, Power, Plus, X, Trash2 } from 'lucide-react';
import redOnOffIcon from '../../../assets/img/icons/red-on-off-button.png';
import greeeenOnOffIcon from '../../../assets/img/icons/green-on-off-button.png';
import * as XLSX from 'xlsx';
import { MdLocalOffer } from "react-icons/md";
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import { AdminContext } from "../../../context/AdminContext"

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Date formatting utility
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Format date for HTML input (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

// Format date for API (YYYY-MM-DD format for MySQL DATE columns)
const formatDateForAPI = (dateString) => {
  if (!dateString) return null;
  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Convert ISO string or Date object to YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API Services
const getAllDiscounts = async (token) => {
  try {
    const response = await api.get('/api/discounts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // Handle both old and new response formats
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return getDummyDiscounts(); // Fallback to dummy data if API fails
  }
};

const createDiscount = async (discountData, token) => {
  try {
    // Format dates to YYYY-MM-DD before sending to API
    const formattedData = {
      ...discountData,
      start_date: formatDateForAPI(discountData.start_date),
      end_date: formatDateForAPI(discountData.end_date)
    };
    const response = await api.post('/api/discounts', formattedData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // Handle the new response structure
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to create discount');
    }
  } catch (error) {
    console.error('Error creating discount:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create discount';
    throw new Error(errorMessage);
  }
};

const updateDiscount = async (id, discountData, token) => {
  try {
    // Format dates to YYYY-MM-DD before sending to API
    const formattedData = {
      ...discountData,
      start_date: formatDateForAPI(discountData.start_date),
      end_date: formatDateForAPI(discountData.end_date)
    };
    const response = await api.put(`/api/discounts/${id}`, formattedData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating discount:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to update discount';
    throw new Error(errorMessage);
  }
};

const deleteDiscount = async (id, token) => {
  try {
    const response = await api.delete(`/api/discounts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting discount:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to delete discount';
    throw new Error(errorMessage);
  }
};

// Dummy data generator for testing
const getDummyDiscounts = () => {
  const generateDummyDiscount = (id) => {
    const isActive = Math.random() > 0.3;
    const usageLimit = Math.floor(Math.random() * 500) + 100;
    const currentUsage = Math.floor(Math.random() * usageLimit);

    return {
      id,
      name: `Discount ${id}`,
      type: Math.random() > 0.5 ? 'percentage' : 'fixed',
      value: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 5000) + 500,
      code: `CODE${id}${Math.floor(Math.random() * 1000)}`,
      usageLimit,
      currentUsage,
      startDate: '2025-07-01',
      endDate: '2025-12-31',
      status: isActive ? 'active' : 'inactive'
    };
  };

  return Array(10).fill(null).map((_, idx) => generateDummyDiscount(idx + 1));
};

const DiscountManagement = () => {
  const { showNotification } = useNotification();
  const { token } = useContext(AdminContext); // Get token from AdminContext
  const [discounts, setDiscounts] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: '',
    end_date: '',
    minimum_order_amount: '',
    max_discount_amount: '',
    show_on_frontend: true,
    send_in_email: false,
    is_hidden: false,
    status: 'active'
  });
  const [stats, setStats] = useState({
    totalUsage: 0,
    conversionRate: 0,
    revenueImpact: 0,
    activeDiscounts: 0,
    changes: {
      usageChange: 0,
      conversionChange: 0,
      revenueChange: 0,
      activeChange: 0
    }
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key

  // Fetch discounts from API
  const fetchDiscounts = async () => {
    if (!token) return;
    try {
      const data = await getAllDiscounts(token);
      const discountsArray = Array.isArray(data) ? data : (data.data || []);
      // Force state update by creating new array reference
      setDiscounts([...discountsArray]);
      // Force table re-render
      setRefreshKey(prev => prev + 1);
      return discountsArray;
    } catch (error) {
      console.error('Error fetching discounts:', error);
      showNotification('Failed to refresh discounts. Please try again.', 'error');
      return [];
    }
  };

  // Fetch discounts only on first load and when token changes
  useEffect(() => {
    fetchDiscounts();
    // eslint-disable-next-line
  }, [token]);

  // Fix: Update stats after status change
  const updateStats = (discountsArray) => {
    // Calculate current period stats
    const now = new Date();
    const lastMonth = new Date(now.getTime());
    lastMonth.setMonth(now.getMonth() - 1);
    const currentPeriodDiscounts = discountsArray.filter(d => {
      const startDate = d.startDate || d.start_date;
      return startDate && new Date(startDate) >= lastMonth;
    });
    const activeOnes = currentPeriodDiscounts.filter(d => d.status === 'active');
    setStats(prev => ({ ...prev, activeDiscounts: activeOnes.length }));
  };

  // Filter discounts whenever discounts, searchTerm, filterType, or dateFilter changes
  useEffect(() => {
    let filtered = [...discounts];
    if (searchTerm) {
      filtered = filtered.filter(d =>
        (d.title || d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(d => (d.status || 'inactive') === filterType);
    }
    const now = new Date();
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(d => {
        const startDate = d.start_date || d.startDate;
        return startDate && new Date(startDate) >= sevenDaysAgo;
      });
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(d => {
        const startDate = d.start_date || d.startDate;
        return startDate && new Date(startDate) >= thirtyDaysAgo;
      });
    }
    setFilteredDiscounts(filtered);
    updateStats(filtered); // Update stats for filtered data
  }, [discounts, searchTerm, filterType, dateFilter]);

  // After add/edit/delete, re-fetch discounts
  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!token) {
      showNotification('Authentication token not found. Please login again.', 'error');
      return;
    }
    if (!formData.title || !formData.code || !formData.discount_value) {
      showNotification('Please fill in all required fields: Title, Code, and Discount Value', 'error');
      return;
    }
    const discountValue = parseFloat(formData.discount_value);
    if (isNaN(discountValue) || discountValue <= 0) {
      showNotification('Discount value must be a positive number', 'error');
      return;
    }
    if (formData.discount_type === 'percentage' && discountValue > 100) {
      showNotification('Percentage discount cannot be more than 100%', 'error');
      return;
    }
    if (formData.discount_type === 'fixed' && discountValue > 10000) {
      showNotification('Fixed discount amount seems too high. Please verify.', 'warning');
    }
    try {
      // Format dates before sending and ensure discount_value is a number
      const formattedFormData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value), // Convert to number
        start_date: formatDateForAPI(formData.start_date),
        end_date: formatDateForAPI(formData.end_date),
        minimum_order_amount: formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null
      };
      
      if (isEditMode && editingDiscountId) {
        await updateDiscount(editingDiscountId, formattedFormData, token);
        showNotification('Discount updated successfully!', 'success');
      } else {
        await createDiscount(formattedFormData, token);
        showNotification('Discount created successfully!', 'success');
      }
      
      // Close modal first
      setShowAddForm(false);
      setIsEditMode(false);
      setEditingDiscountId(null);
      
      // Wait a moment for database to commit
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force refresh from server - await to ensure it completes
      await fetchDiscounts();
      
      // Reset form
      setFormData({
        title: '',
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        start_date: '',
        end_date: '',
        minimum_order_amount: '',
        max_discount_amount: '',
        show_on_frontend: true,
        send_in_email: false,
        is_hidden: false,
        status: 'active'
      });
    } catch (error) {
      showNotification(error.message || 'Failed to create discount. Please try again.', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    try {
      if (!token) {
        showNotification('Authentication token not found. Please login again.', 'error');
        return;
      }
      await deleteDiscount(id, token);
      
      // Wait a moment for database to commit
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force refresh from server
      await fetchDiscounts();
      
      showNotification('Discount deleted successfully!', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to delete discount', 'error');
    }
  };

  const handleEdit = async (id) => {
    const discount = discounts.find(d => d.id === id);
    if (!discount) {
      showNotification('Discount not found', 'error');
      return;
    }
    setFormData({
      title: discount.title || '',
      code: discount.code || '',
      description: discount.description || '',
      discount_type: discount.discount_type || 'percentage',
      discount_value: discount.discount_value || '',
      start_date: formatDateForInput(discount.start_date),
      end_date: formatDateForInput(discount.end_date),
      minimum_order_amount: discount.minimum_order_amount || '',
      max_discount_amount: discount.max_discount_amount || '',
      show_on_frontend: discount.show_on_frontend || false,
      send_in_email: discount.send_in_email || false,
      is_hidden: discount.is_hidden || false,
      status: discount.status || 'active'
    });
    setIsEditMode(true);
    setEditingDiscountId(id);
    setShowAddForm(true);
  };

  const handleExportData = () => {
    if (filteredDiscounts.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = filteredDiscounts.map(item => ({
      'Discount Name': item.name || item.title,
      'Code': item.code,
      'Type': item.type || item.discount_type,
      'Value': item.value || item.discount_value,
      'Usage': item.currentUsage || '0',
      'Usage Limit': item.usageLimit || '0',
      'Start Date': item.startDate || item.start_date,
      'End Date': item.endDate || item.end_date,
      'Status': item.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Discounts");
    XLSX.writeFile(wb, "Discounts_Export.xlsx");
  };

  const handleToggleStatus = async (id) => {
    try {
      if (!token) {
        showNotification('Authentication token not found. Please login again.', 'error');
        return;
      }

      const discount = discounts.find(d => d.id === id);
      const newStatus = discount.status === 'active' ? 'inactive' : 'active';

      const response = await updateDiscount(id, { ...discount, status: newStatus }, token);

      const updatedDiscounts = discounts.map(d => {
        if (d.id === id) {
          return { ...d, status: newStatus };
        }
        return d;
      });

      setDiscounts(updatedDiscounts);
      updateStats(updatedDiscounts); // Update Active Discounts stat

      // Show success notification
      showNotification(`Discount status successfully changed to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error toggling discount status:', error);
      // Show error notification
      showNotification(error.message || 'Failed to update discount status', 'error');
    }
  };

  // Fix: Open delete modal instead of window.confirm
  const openDeleteModal = (id) => {
    setDeleteTargetId(id);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteTargetId(null);
    setDeleteModalOpen(false);
  };
  const confirmDelete = async () => {
    if (deleteTargetId) {
      await handleDelete(deleteTargetId);
      closeDeleteModal();
    }
  };

  return (
    <div className="admin-discount-container">
      <h2 className="admin-discount-title">Cart Management</h2>
      {/* search */}
      <div className="admin-discount-search-section">
        <div className="admin-discount-search-box">
          <div className="admin-discount-search-filters">
            <div className="admin-discount-search-wrapper">
              <Search className="admin-discount-search-icon" />
              <input
                className="admin-discount-search-input"
                placeholder="Search Product by name and Id.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="admin-discount-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Carts</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="admin-discount-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="admin-discount-export-wrapper" style={{ display: 'flex', gap: '10px' }}>
            <button className="admin-discount-export-btn" onClick={handleExportData}>
              <Download />
              Export data
            </button>
            <button
              className="admin-discount-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              <Plus />
              Add Discount
            </button>
          </div>
        </div>
      </div>

      {/* Add Discount Form Popup */}
      {showAddForm && (
        <div className="admin-discount-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddForm(false);
          }
        }}>
          <div className="admin-discount-modal-content">
            <div className="admin-discount-modal-header">
              <h3 className="admin-discount-modal-title">{isEditMode ? 'Edit Discount' : 'Add New Discount'}</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="admin-discount-modal-close"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleAddNew} className="admin-discount-modal-form">
              <div className="admin-discount-form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="admin-discount-modal-input"
                />
              </div>
              <div className="admin-discount-form-group">
                <label>Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="admin-discount-modal-input"
                />
              </div>
              <div className="admin-discount-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="admin-discount-modal-input"
                  rows="3"
                />
              </div>
              <div className="admin-discount-form-group">
                <label>Discount Type</label>
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  required
                  className="admin-discount-modal-input"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="admin-discount-form-group">
                <label>Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}</label>
                <input
                  type="number"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleInputChange}
                  required
                  placeholder={formData.discount_type === 'percentage' ? 'Enter percentage (e.g., 10 for 10%)' : 'Enter amount in rupees (e.g., 100)'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  step={formData.discount_type === 'percentage' ? '0.01' : '1'}
                  className="admin-discount-modal-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="admin-discount-form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="admin-discount-modal-input"
                  />
                </div>
                <div className="admin-discount-form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    className="admin-discount-modal-input"
                  />
                </div>
              </div>
              <div className="admin-discount-form-group">
                <label>Minimum Order Amount</label>
                <input
                  type="number"
                  name="minimum_order_amount"
                  value={formData.minimum_order_amount}
                  onChange={handleInputChange}
                  className="admin-discount-modal-input"
                />
              </div>
              <div className="admin-discount-form-group">
                <label>Maximum Discount Amount</label>
                <input
                  type="number"
                  name="max_discount_amount"
                  value={formData.max_discount_amount}
                  onChange={handleInputChange}
                  className="admin-discount-modal-input"
                />
              </div>

              {/* Discount Display Options */}
              <div>
                <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Discount Display Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="display_option"
                      value="frontend"
                      checked={formData.show_on_frontend && !formData.send_in_email && !formData.is_hidden}
                      onChange={() => setFormData(prev => ({ ...prev, show_on_frontend: true, send_in_email: false, is_hidden: false }))}
                    />
                    <span>Show on Frontend (Visible to customers)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="display_option"
                      value="email"
                      checked={formData.send_in_email && !formData.is_hidden}
                      onChange={() => setFormData(prev => ({ ...prev, show_on_frontend: false, send_in_email: true, is_hidden: false }))}
                    />
                    <span>Send in Email (Email campaigns only)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="display_option"
                      value="hidden"
                      checked={formData.is_hidden}
                      onChange={() => setFormData(prev => ({ ...prev, show_on_frontend: false, send_in_email: false, is_hidden: true }))}
                    />
                    <span>Hidden (Admin use only)</span>
                  </label>
                </div>
              </div>

              <div className="admin-discount-modal-btn-row">
                <button
                  type="submit"
                  className="admin-discount-modal-submit-btn"
                >
                  {isEditMode ? 'Update Discount' : 'Create Discount'}
                </button>
                <button
                  type="button"
                  className="admin-discount-modal-cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* search */}
      <div className="admin-discount-stats-row">
        <div className="admin-discount-stats-card">
          <div className="admin-discount-stats-card-header">
            <h3>Total Usage</h3>
            <span className="admin-discount-stats-icon admin-discount-stats-icon-blue"><ShoppingCart className="admin-discount-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-discount-stats-value">{stats.totalUsage}</h3>
          <p className={`admin-discount-stats-change ${stats.changes.usageChange >= 0 ? 'admin-discount-positive' : 'admin-discount-negative'}`}>
            <span className="admin-discount-stats-percentage">{stats.changes.usageChange >= 0 ? '+' : ''}{stats.changes.usageChange.toFixed(2)}%</span> from last period</p>
        </div>
        <div className="admin-discount-stats-card">
          <div className="admin-discount-stats-card-header">
            <h3>Conversion Rate</h3>
            <span className="admin-discount-stats-icon admin-discount-stats-icon-red"><AlertCircle className="admin-discount-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-discount-stats-value">{stats.conversionRate}%</h3>
          <p className={`admin-discount-stats-change ${stats.changes.conversionChange >= 0 ? 'admin-discount-positive' : 'admin-discount-negative'}`}>
            <span className="admin-discount-stats-percentage">{stats.changes.conversionChange >= 0 ? '+' : ''}{stats.changes.conversionChange.toFixed(2)}%</span> from last period</p>
        </div>
        <div className="admin-discount-stats-card">
          <div className="admin-discount-stats-card-header">
            <h3>Revenue Impact</h3>
            <span className="admin-discount-stats-icon admin-discount-stats-icon-purple"><TrendingUp className="admin-discount-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-discount-stats-value">₹{stats.revenueImpact}</h3>
          <p className={`admin-discount-stats-change ${stats.changes.revenueChange >= 0 ? 'admin-discount-positive' : 'admin-discount-negative'}`}>
            <span className="admin-discount-stats-percentage">{stats.changes.revenueChange >= 0 ? '+' : ''}{stats.changes.revenueChange.toFixed(2)}%</span> from last period</p>
        </div>
        <div className="admin-discount-stats-card">
          <div className="admin-discount-stats-card-header">
            <h3>Active Discounts</h3>
            <span className="admin-discount-stats-icon admin-discount-stats-icon-green"><Clock className="admin-discount-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-discount-stats-value">{stats.activeDiscounts}</h3>
          <p className={`admin-discount-stats-change ${stats.changes.activeChange >= 0 ? 'admin-discount-positive' : 'admin-discount-negative'}`}>
            <span className="admin-discount-stats-percentage">{stats.changes.activeChange >= 0 ? '+' : ''}{stats.changes.activeChange.toFixed(2)}%</span> from last month</p>
        </div>
      </div>
      <h3 className="admin-discount-table-title">Shopping carts</h3>
      <div className="admin-discount-table-wrapper" key={refreshKey}>
        <table className="admin-discount-table">
          <thead>
            <tr>
              <th><span className="admin-discount-table-header-flex"><ArrowUpDown className="admin-discount-table-arrow-icon" /> DISCOUNT NAME</span></th>
              <th><span className="admin-discount-table-header-flex"><ArrowUpDown className="admin-discount-table-arrow-icon" /> TYPE & VALUE</span></th>
              <th><span className="admin-discount-table-header-flex"><ArrowUpDown className="admin-discount-table-arrow-icon" /> CODE</span></th>
              <th><span className="admin-discount-table-header-flex"><ArrowUpDown className="admin-discount-table-arrow-icon" /> USAGE</span></th>
              <th><span className="admin-discount-table-header-flex"><ArrowUpDown className="admin-discount-table-arrow-icon" /> PERIOD</span></th>
              <th><span className="admin-discount-table-header-flex"><ArrowUpDown className="admin-discount-table-arrow-icon" /> STATUS</span></th>
              <th><span className="admin-discount-table-header-flex"><ArrowUpDown className="admin-discount-table-arrow-icon" /> ACTIONS</span></th>
            </tr>
          </thead>
          <tbody className='admin-discount-tbody'>
            {filteredDiscounts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <MdLocalOffer size={40} style={{ color: '#888' }} />
                    <h3 style={{ color: '#666', fontWeight: 500, margin: 0 }}>No Discounts Found</h3>
                    <p style={{ color: '#888', margin: 0 }}>Try adjusting your filters or add a new discount</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDiscounts.map((discount, index) => {
                // Ensure discount_value is properly parsed and formatted
                const discountValue = parseFloat(discount.discount_value) || 0;
                return (
                <tr key={`${discount.id}-${discountValue}-${index}`}>
                  <td>{discount.title || ''}</td>
                  <td style={{ color: '#3b7c3f', fontWeight: 500 }}>
                    {discount.discount_type === 'percentage'
                      ? `${discountValue.toFixed(2)}%`
                      : `₹${discountValue.toFixed(2)}`}
                  </td>
                  <td>
                    <span style={{ background: '#e5e5e5', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                      {discount.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#2d3a8c', fontWeight: 500 }}>{discount.currentUsage || 0}</span>
                      <span style={{ color: '#888' }}>/ {discount.usageLimit || 'Unlimited'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>Start: {formatDate(discount.start_date)}</span>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>End: {formatDate(discount.end_date)}</span>
                    </div>
                  </td>
                  <td>
                    {discount.status === 'active'
                      ? <span style={{ background: '#e6f9f0', color: '#3b7c3f', padding: '2px 12px', borderRadius: 12, fontWeight: 500 }}>Active</span>
                      : <span style={{ background: '#ffeaea', color: '#d32f2f', padding: '2px 12px', borderRadius: 12, fontWeight: 500 }}>Inactive</span>
                    }
                  </td>
                  <td style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      className="admin-action-btn admin-action-btn-green"
                      title="Edit"
                      onClick={() => handleEdit(discount.id)}
                    >
                      <div className="admin-action-icon-bg"><SquarePen size={18} /></div>
                    </button>
                    <span className="admin-action-divider"></span>
                    <button
                      className="admin-action-btn admin-action-btn-red"
                      title="Delete"
                      onClick={() => openDeleteModal(discount.id)}
                    >
                      <div className="admin-action-icon-bg">
                        <Trash2 size={18} />
                      </div>
                    </button>
                    <span className="admin-action-divider"></span>
                    <button
                      className="admin-action-btn"
                      title="Power"
                      onClick={() => handleToggleStatus(discount.id)}
                    >
                      <div className="admin-action-icon-bg">
                        <img
                          src={discount.status === 'active' ? redOnOffIcon : greeeenOnOffIcon}
                          alt="on-off"
                          className="admin-action-onoff-icon"
                        />
                      </div>
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="admin-discount-delete-modal-overlay">
          <div className="admin-discount-delete-modal">
            <h3>Delete Discount</h3>
            <p>Are you sure you want to delete this discount?</p>
            <div className="admin-discount-delete-modal-actions">
              <button className="admin-discount-delete-btn" onClick={confirmDelete}><Trash2 size={16} /> Delete</button>
              <button className="admin-discount-cancel-btn" onClick={closeDeleteModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManagement;