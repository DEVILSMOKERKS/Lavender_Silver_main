import React, { useEffect, useState, useContext } from 'react';
import './VideoConsultations.css';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Mail,
  Phone,
  Video,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ShoppingCart
} from 'lucide-react';
import { FiChevronDown } from "react-icons/fi";
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';

const FILTER_OPTIONS = ['All', 'Completed', 'Scheduled', 'Cancelled'];

const getStatusColor = (status) => {
  if (status === 'completed') return 'green';
  if (status === 'scheduled') return 'scheduled';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'confirmed') return 'green';
  if (status === 'otp_verified') return 'scheduled';
  if (status === 'requested') return 'scheduled';
  return '';
};

// Utility for date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // If timeStr is ISO, extract time part
  if (timeStr.includes('T')) {
    return new Date(timeStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  // If timeStr is just HH:mm:ss
  return timeStr.slice(0, 5);
};

// Add a utility to format time in 12-hour format with AM/PM
const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  // If timeStr is ISO, extract time part
  let dateObj;
  if (timeStr.includes('T')) {
    dateObj = new Date(timeStr);
  } else {
    // Assume timeStr is HH:mm:ss or HH:mm
    const [h, m] = timeStr.split(':');
    dateObj = new Date();
    dateObj.setHours(Number(h), Number(m), 0, 0);
  }
  return dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const VideoConsultations = () => {
  const { token } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/video-consultation`;
  const API_URL = import.meta.env.VITE_API_URL;
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  });

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerNumber: '',
    date: '',
    time: '',
    notes: '',
    user_id: '',
    selectionType: 'category', // 'category', 'subcategory', 'products'
    selected_category_id: '',
    selected_subcategory_id: '',
    selected_product_ids: []
  });

  // New states for product selection
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [summaryCounts, setSummaryCounts] = useState({ total: 0, completed: 0, scheduled: 0, cancelled: 0 });
  const [cartModalOpenIdx, setCartModalOpenIdx] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const openCartModal = idx => {
    setCartModalOpenIdx(idx);
    setExpandedItems({}); // Reset expanded items when opening modal
  };
  const closeCartModal = () => {
    setCartModalOpenIdx(null);
    setExpandedItems({});
  };

  const toggleItemDetails = (itemIndex) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemIndex]: !prev[itemIndex]
    }));
  };

  // Fetch users for admin consultation creation
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch categories for admin consultation creation
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch subcategories for admin consultation creation
  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    setLoadingSubcategories(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/subcategories/${categoryId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setSubcategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // Fetch products for admin consultation creation
  const fetchProducts = async (categoryId, subcategoryId, productIds) => {
    setLoadingProducts(true);
    try {
      let url = `${API_BASE_URL}/admin/products?`;
      if (categoryId) url += `categoryId=${categoryId}&`;
      if (subcategoryId) url += `subcategoryId=${subcategoryId}&`;
      if (productIds && productIds.length > 0) {
        productIds.forEach(id => url += `productId=${id}&`);
      }

      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Delete consultation
  const handleDeleteConsultation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consultation?')) {
      return;
    }

    setDeleteLoadingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/requests/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.success) {
        showNotification('Consultation deleted successfully', 'success');
        fetchConsultations(); // Refresh the list
      } else {
        showNotification(data.message || 'Failed to delete consultation', 'error');
      }
    } catch (error) {
      console.error('Error deleting consultation:', error);
      showNotification('Error deleting consultation', 'error');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Fetch consultations from backend
  const fetchConsultations = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/admin/requests?`;
      if (filter !== 'All') url += `status=${filter.toLowerCase()}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      url += 'limit=100';
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setConsultations(data.data.map((c) => {
          return {
            ...c,
            id: `CON-${c.id}`,
            status: c.status,
            statusColor: getStatusColor(c.status),
            customer: { name: c.name, email: c.email, number: c.whatsapp_number, dob: c.dob },
            date: c.consultation_date,
            time: c.consultation_time,
            admin_notes: c.admin_notes || '',
            otp_verified: c.otp_verified,
            created_at: c.created_at,
            updated_at: c.updated_at,
            video_booking_status: c.video_booking_status,
            cart_snapshot: c.cart_snapshot
            // Add any other fields you want to show
          };
        }));
      } else {
        setConsultations([]);
      }
    } catch (e) {
      setConsultations([]);
    }
    setLoading(false);
  };

  // Fetch summary counts
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/statistics`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.status_breakdown)) {
        const breakdown = data.data.status_breakdown;
        setSummaryCounts({
          total: data.data.total_requests,
          completed: breakdown.find(b => b.status === 'completed')?.count || 0,
          scheduled: breakdown.find(b => b.status === 'scheduled')?.count || 0,
          cancelled: breakdown.find(b => b.status === 'cancelled')?.count || 0,
        });
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchConsultations();
    fetchSummary();
    // eslint-disable-next-line
  }, [filter, search]);

  // Filtered consultations (search is handled by backend, but keep for UI)
  const filteredConsultations = consultations;

  const summaryData = [
    { icon: <Calendar />, label: 'Total Consultations', value: summaryCounts.total, boxClass: 'total', bg: '#e6f0fa', color: '#3a6fd8' },
    { icon: <CheckCircle />, label: 'Completed', value: summaryCounts.completed, boxClass: 'completed', bg: '#eafaf1', color: '#16784f' },
    { icon: <Clock />, label: 'Scheduled', value: summaryCounts.scheduled, boxClass: 'scheduled', bg: '#f6f0fa', color: '#a259d9' },
    { icon: <XCircle />, label: 'Cancelled', value: summaryCounts.cancelled, boxClass: 'cancelled', bg: '#fee2e2', color: '#e74c3c' },
  ];

  // Handlers
  const handleFilterChange = (e) => setFilter(e.target.value);

  const handleCreateOpen = () => {
    setForm({
      customerName: '',
      customerEmail: '',
      customerNumber: '',
      date: '',
      time: '',
      notes: '',
      user_id: '',
      selectionType: 'category',
      selected_category_id: '',
      selected_subcategory_id: '',
      selected_product_ids: []
    });
    setShowCreateModal(true);
    // Fetch initial data
    fetchUsers();
    fetchCategories();
  };
  const handleCreateClose = () => setShowCreateModal(false);
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!form.customerName || !form.customerName.trim()) {
      showNotification('Please enter customer name.', 'error');
      return;
    }

    if (!form.customerEmail || !form.customerEmail.trim()) {
      showNotification('Please enter customer email.', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.customerEmail)) {
      showNotification('Please enter a valid email address.', 'error');
      return;
    }

    if (!form.customerNumber || !form.customerNumber.trim()) {
      showNotification('Please enter customer phone number.', 'error');
      return;
    }

    // Phone number validation (at least 10 digits)
    const phoneDigits = form.customerNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      showNotification('Please enter a valid phone number (at least 10 digits).', 'error');
      return;
    }

    if (!form.date) {
      showNotification('Please select a consultation date.', 'error');
      return;
    }

    // Date validation - cannot be in the past
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      showNotification('Consultation date cannot be in the past. Please select a future date.', 'error');
      return;
    }

    if (!form.time) {
      showNotification('Please select a consultation time.', 'error');
      return;
    }

    try {
      const payload = {
        name: form.customerName.trim(),
        email: form.customerEmail.trim(),
        whatsapp_number: form.customerNumber.trim(),
        consultation_date: form.date,
        consultation_time: form.time,
        admin_notes: form.notes || '',
        status: 'scheduled'
      };

      // Add user_id if selected
      if (form.user_id) {
        payload.user_id = form.user_id;
      }

      // Add product selection based on type
      if (form.selectionType === 'category' && form.selected_category_id) {
        payload.selected_category_id = form.selected_category_id;
      } else if (form.selectionType === 'subcategory' && form.selected_subcategory_id) {
        payload.selected_subcategory_id = form.selected_subcategory_id;
      } else if (form.selectionType === 'products' && form.selected_product_ids.length > 0) {
        payload.selected_product_ids = form.selected_product_ids;
      }

      const response = await fetch(`${API_BASE_URL}/admin/requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        fetchConsultations();
        fetchSummary();
        showNotification('Consultation created successfully!', 'success');
        // Reset form
        setForm({
          customerName: '',
          customerEmail: '',
          customerNumber: '',
          date: '',
          time: '',
          notes: '',
          user_id: '',
          selectionType: 'category',
          selected_category_id: '',
          selected_subcategory_id: '',
          selected_product_ids: []
        });
      } else {
        // Extract detailed error message
        const errorMessage = result.message || result.error || 'Failed to create consultation';
        showNotification(`Error: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
      let errorMessage = 'Failed to create consultation. Please try again.';

      if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.statusText || 'Unknown error'}`;
      }

      showNotification(errorMessage, 'error');
    }
  };

  const handleJoinCall = (c) => {
    // Format phone number for WhatsApp
    let phoneNumber = c.customer.number;

    // Remove any non-digit characters except +
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // If number doesn't start with +, add +91 (India country code)
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+91' + phoneNumber;
    }

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleRescheduleOpen = (consultation) => {
    setRescheduleData(consultation);
    // Convert date to yyyy-mm-dd for input
    let dateValue = '';
    if (consultation.date) {
      const d = new Date(consultation.date);
      if (!isNaN(d)) {
        dateValue = d.toISOString().slice(0, 10);
      } else if (/\d{4}-\d{2}-\d{2}/.test(consultation.date)) {
        dateValue = consultation.date;
      }
    }
    setForm({
      date: dateValue,
      time: consultation.time,
      notes: consultation.admin_notes || ''
    });
    setShowRescheduleModal(true);
  };
  const handleRescheduleClose = () => setShowRescheduleModal(false);
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/admin/requests/${rescheduleData.id.replace('CON-', '')}/reschedule`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          consultation_date: form.date,
          consultation_time: form.time,
          admin_notes: form.notes
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowRescheduleModal(false);
        fetchConsultations();
        fetchSummary();
        showNotification('Consultation rescheduled successfully!', 'success');
      } else {
        showNotification('Error rescheduling consultation: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error rescheduling consultation:', error);
      showNotification('Error rescheduling consultation. Please try again.', 'error');
    }
  };

  // Modal form input handler
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle selection type change
  const handleSelectionTypeChange = (e) => {
    const newType = e.target.value;
    setForm({
      ...form,
      selectionType: newType,
      selected_category_id: '',
      selected_subcategory_id: '',
      selected_product_ids: []
    });

    // Clear dependent data
    setSubcategories([]);
    setProducts([]);
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setForm({
      ...form,
      selected_category_id: categoryId,
      selected_subcategory_id: '',
      selected_product_ids: []
    });

    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
    }
    setProducts([]);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (e) => {
    const subcategoryId = e.target.value;
    setForm({
      ...form,
      selected_subcategory_id: subcategoryId,
      selected_product_ids: []
    });

    if (subcategoryId) {
      fetchProducts(null, subcategoryId);
    } else {
      setProducts([]);
    }
  };

  // Handle product selection
  const handleProductSelection = (productId, checked) => {
    let newProductIds = [...form.selected_product_ids];
    if (checked) {
      if (!newProductIds.includes(productId)) {
        newProductIds.push(productId);
      }
    } else {
      newProductIds = newProductIds.filter(id => id !== productId);
    }

    setForm({
      ...form,
      selected_product_ids: newProductIds
    });
  };

  // Handle user selection
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setForm({
      ...form,
      user_id: userId
    });

    // If user is selected, populate their details
    if (userId) {
      const selectedUser = users.find(user => user.id == userId);
      if (selectedUser) {
        setForm(prev => ({
          ...prev,
          user_id: userId,
          customerName: selectedUser.name || '',
          customerEmail: selectedUser.email || '',
          customerNumber: selectedUser.phone || ''
        }));
      }
    }
  };

  // Add a handler for phone input
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d+]/g, '');
    if (value.startsWith('+')) {
      value = '+' + value.slice(1).replace(/\+/g, '');
    } else {
      value = value.replace(/\+/g, '');
    }
    setForm({ ...form, customerNumber: value });
  };

  // Status change
  const handleStatusChange = async (id, newStatus) => {
    setStatusLoadingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/requests/${id.replace('CON-', '')}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus.toLowerCase() })
      });

      const result = await response.json();
      if (result.success) {
        fetchConsultations();
        fetchSummary();
        showNotification('Status updated successfully!', 'success');
      } else {
        showNotification('Error updating status: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Error updating status. Please try again.', 'error');
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Handle booking status change
  const handleBookingStatusChange = async (id, newStatus) => {
    setStatusLoadingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/requests/${id.replace('CON-', '')}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ video_booking_status: newStatus.toLowerCase() })
      });

      const result = await response.json();
      if (result.success) {
        fetchConsultations();
        fetchSummary();
        showNotification('Booking status updated successfully!', 'success');
      } else {
        showNotification('Error updating booking status: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      showNotification('Error updating booking status. Please try again.', 'error');
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Combined status and booking status change
  const handleStatusAndBookingChange = async (id, newStatus) => {
    setStatusLoadingId(id);
    try {
      let requestBody = {};

      // Determine whether this is a booking status or regular status
      const bookingStatuses = ['scheduled'];
      const regularStatuses = ['requested', 'otp_verified', 'confirmed', 'completed', 'cancelled'];

      if (bookingStatuses.includes(newStatus.toLowerCase())) {
        // This is a booking status change
        requestBody = {
          video_booking_status: newStatus.toLowerCase()
        };
      } else if (regularStatuses.includes(newStatus.toLowerCase())) {
        // This is a regular status change
        requestBody = {
          status: newStatus.toLowerCase()
        };
      } else {
        // Default to regular status
        requestBody = {
          status: newStatus.toLowerCase()
        };
      }

      const response = await fetch(`${API_BASE_URL}/admin/requests/${id.replace('CON-', '')}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      if (result.success) {
        fetchConsultations();
        fetchSummary();
        showNotification('Status updated successfully!', 'success');
      } else {
        showNotification('Error updating status: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Error updating status. Please try again.', 'error');
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Handle admin notes update
  const handleUpdateNotes = async (id, notes) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/requests/${id.replace('CON-', '')}/notes`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ admin_notes: notes })
      });

      const result = await response.json();
      if (result.success) {
        fetchConsultations();
        showNotification('Notes updated successfully!', 'success');
      } else {
        showNotification('Error updating notes: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      showNotification('Error updating notes. Please try again.', 'error');
    }
  };

  return (
    <div className="vc-container">
      <div className="vc-header-row">
        <h2 className="vc-title">Video Consultations</h2>
        <div className="vc-header-search-group">
          <div className="vc-search-box">
            <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="vc-modal-input" />
            <span className="vc-search-icon"><Search size={20} /></span>
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select className="vc-filter-btn" value={filter} onChange={handleFilterChange} style={{ minWidth: 120, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}>
              {FILTER_OPTIONS.map(opt => (
                <option value={opt} key={opt}>{opt}</option>
              ))}
            </select>
            <span className="vc-filter-btn__arrow"><FiChevronDown size={16} /></span>
          </div>
        </div>
        <div className="vc-schedule-desktop">
          <button className="vc-schedule-btn" onClick={handleCreateOpen}>Schedule Now</button>
        </div>
      </div>
      <div className="admin-orders-summary-row">
        <div className="admin-orders-summary-cards">
          {summaryData.map((item, idx) => (
            <div className={`admin-summary-card ${item.boxClass}`} key={idx}>
              <div className={`admin-icon-box ${item.boxClass}`} style={{ background: item.bg, color: item.color }}>
                {React.cloneElement(item.icon, { color: item.color, size: 32 })}
              </div>
              <div className="admin-summary-info">
                <div className="admin-summary-label">{item.label}</div>
                <div className="admin-summary-value">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="vc-list">
        {loading ? (
          <div>Loading...</div>
        ) : (
          filteredConsultations.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 18 }}>
              No consultations found.
            </div>
          ) : (
            filteredConsultations.map((c, idx) => (
              <div className="vc-card exact" key={idx}>
                <div className="vc-card-header-group">
                  <div className='vc-cart-group'>
                    <span className="vc-card-icon"><Video size={22} /></span>
                    <span className="vc-card-id">{c.id}</span>
                  </div>
                  <span className={`vc-card-status ${c.statusColor}`}>
                    {c.status === 'completed' && <CheckCircle size={16} color="#16784f" />}
                    {c.status === 'scheduled' && <Clock size={16} color="#a259d9" />}
                    {c.status === 'cancelled' && <XCircle size={16} color="#e74c3c" />}
                    {c.status === 'confirmed' && <CheckCircle size={16} color="#16784f" />}
                    {c.status === 'otp_verified' && <Clock size={16} color="#a259d9" />}
                    {c.status === 'requested' && <Clock size={16} color="#a259d9" />}
                    <select
                      className="vc-status-dropdown"
                      value={c.status}
                      onChange={e => handleStatusAndBookingChange(c.id, e.target.value)}
                      disabled={statusLoadingId === c.id}
                    >
                      <option value="requested">Requested</option>
                      <option value="otp_verified">OTP Verified</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {statusLoadingId === c.id ? 'Updating...' : ''}
                  </span>
                </div>
                <div className="vc-card-row">
                  <div className="vc-card-col">
                    <div className="vc-card-col-title">Customer Details</div>
                    <div className="vc-card-detail"><User size={16} /> {c.customer.name}</div>
                    <div className="vc-card-detail"><Mail size={16} /> {c.customer.email}</div>
                    <div className="vc-card-detail"><Phone size={16} /> {c.customer.number}</div>
                  </div>
                  <div className="vc-card-col">
                    <div className="vc-card-col-title">Consultation Details</div>
                    <div className="vc-card-detail"><Calendar size={16} /> {formatDate(c.date)}</div>
                    <div className="vc-card-detail"><Clock size={16} /> {formatTime12(c.time)}</div>
                  </div>
                  <div className="vc-card-col">
                    <div className="vc-card-col-title">Notes</div>
                    <div className="vc-card-detail">
                      {c.admin_notes || 'No notes'}
                      <button
                        style={{ marginLeft: 8, padding: '2px 6px', fontSize: '12px', background: '#16784f', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        onClick={() => {
                          const newNotes = prompt('Update admin notes:', c.admin_notes || '');
                          if (newNotes !== null) {
                            handleUpdateNotes(c.id, newNotes);
                          }
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="vc-card-detail" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b>Status:</b> {c.status.charAt(0).toUpperCase() + c.status.slice(1).replace('_', ' ')}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button className="vc-cart-view-btn" onClick={() => openCartModal(idx)}>View Cart Detail</button>
                    </div>
                  </div>
                  <div className="vc-card-col">
                    <div className="vc-card-actions">
                      <button className="vc-join-btn" onClick={() => handleJoinCall(c)}>Join call</button>
                      <button className="vc-reschedule-btn" onClick={() => handleRescheduleOpen(c)}>Reschedule</button>
                      {c.status !== 'completed' && c.status !== 'cancelled' && (
                        <button
                          className="vc-cancel-btn"
                          onClick={() => handleStatusAndBookingChange(c.id, 'cancelled')}
                          disabled={statusLoadingId === c.id}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="vc-delete-btn"
                        onClick={() => handleDeleteConsultation(c.id.replace('CON-', ''))}
                        disabled={deleteLoadingId === c.id.replace('CON-', '')}
                      >
                        {deleteLoadingId === c.id.replace('CON-', '') ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Create Consultation Modal */}
      {showCreateModal && (
        <div style={modalStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <h3>Schedule New Video Consultation</h3>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

              {/* User Selection */}
              <div className="vc-select-group">
                <label>Select User (Optional - Leave empty for guest)</label>
                <select
                  name="user_id"
                  value={form.user_id}
                  onChange={handleUserChange}
                  className="vc-modal-input"
                >
                  <option value="">Select User (or leave for guest)</option>
                  {loadingUsers ? (
                    <option>Loading users...</option>
                  ) : (
                    users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Customer Details */}
              <div className="vc-select-group">
                <label>User Details</label>
                <input name="customerName" value={form.customerName} onChange={handleFormChange} placeholder="User Name" required className="vc-modal-input" type="text" />
                <input name="customerEmail" value={form.customerEmail} onChange={handleFormChange} placeholder="User Email" required className="vc-modal-input" type="email" />
                <input name="customerNumber" value={form.customerNumber} onChange={handlePhoneChange} placeholder="User Mobile Number" required className="vc-modal-input" type="tel" />
              </div>

              {/* Consultation Details */}
              <div className="vc-select-group">
                <label>Consultation Details</label>
                <input name="date" value={form.date} onChange={handleFormChange} placeholder="Date" required className="vc-modal-input" type="date" />
                <input name="time" value={form.time} onChange={handleFormChange} placeholder="Time" required className="vc-modal-input" type="time" />
              </div>

              {/* Product Selection */}
              <div className="vc-product-selection">
                <label>Product Selection</label>

                {/* Selection Type */}
                <div className="vc-selection-type">
                  <div className="vc-radio-group">
                    <label className="vc-radio-option">
                      <input
                        type="radio"
                        name="selectionType"
                        value="category"
                        checked={form.selectionType === 'category'}
                        onChange={handleSelectionTypeChange}
                      />
                      Category
                    </label>
                    <label className="vc-radio-option">
                      <input
                        type="radio"
                        name="selectionType"
                        value="subcategory"
                        checked={form.selectionType === 'subcategory'}
                        onChange={handleSelectionTypeChange}
                      />
                      Subcategory
                    </label>
                    <label className="vc-radio-option">
                      <input
                        type="radio"
                        name="selectionType"
                        value="products"
                        checked={form.selectionType === 'products'}
                        onChange={handleSelectionTypeChange}
                      />
                      Specific Products
                    </label>
                  </div>
                </div>

                {/* Category Selection */}
                {form.selectionType === 'category' && (
                  <div className="vc-select-group">
                    <label>Select Category</label>
                    <select
                      name="selected_category_id"
                      value={form.selected_category_id}
                      onChange={handleCategoryChange}
                      className="vc-modal-input"
                    >
                      <option value="">Select Category</option>
                      {loadingCategories ? (
                        <option>Loading categories...</option>
                      ) : (
                        categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {/* Subcategory Selection */}
                {form.selectionType === 'subcategory' && (
                  <div className="vc-select-group">
                    <label>Select Category</label>
                    <select
                      name="selected_category_id"
                      value={form.selected_category_id}
                      onChange={handleCategoryChange}
                      className="vc-modal-input"
                    >
                      <option value="">Select Category</option>
                      {loadingCategories ? (
                        <option>Loading categories...</option>
                      ) : (
                        categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))
                      )}
                    </select>

                    <label>Select Subcategory</label>
                    <select
                      name="selected_subcategory_id"
                      value={form.selected_subcategory_id}
                      onChange={handleSubcategoryChange}
                      className="vc-modal-input"
                      disabled={!form.selected_category_id}
                    >
                      <option value="">Select Subcategory</option>
                      {loadingSubcategories ? (
                        <option>Loading subcategories...</option>
                      ) : (
                        subcategories.map(subcategory => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {/* Specific Products Selection */}
                {form.selectionType === 'products' && (
                  <div className="vc-select-group">
                    <label>Select Category</label>
                    <select
                      name="selected_category_id"
                      value={form.selected_category_id}
                      onChange={handleCategoryChange}
                      className="vc-modal-input"
                    >
                      <option value="">Select Category</option>
                      {loadingCategories ? (
                        <option>Loading categories...</option>
                      ) : (
                        categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))
                      )}
                    </select>

                    <label>Select Subcategory</label>
                    <select
                      name="selected_subcategory_id"
                      value={form.selected_subcategory_id}
                      onChange={handleSubcategoryChange}
                      className="vc-modal-input"
                      disabled={!form.selected_category_id}
                    >
                      <option value="">Select Subcategory</option>
                      {loadingSubcategories ? (
                        <option>Loading subcategories...</option>
                      ) : (
                        subcategories.map(subcategory => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))
                      )}
                    </select>

                    {/* Products List */}
                    {form.selected_subcategory_id && (
                      <div className="vc-products-list">
                        <label>Select Products</label>
                        {loadingProducts ? (
                          <div>Loading products...</div>
                        ) : products.length > 0 ? (
                          <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                            {products.map(product => (
                              <div key={product.id} className="vc-product-item">
                                <label className="vc-product-info">
                                  <input
                                    type="checkbox"
                                    checked={form.selected_product_ids.includes(product.id)}
                                    onChange={(e) => handleProductSelection(product.id, e.target.checked)}
                                  />
                                  <div className="vc-product-name">{product.item_name}</div>
                                  <div className="vc-product-details">
                                    SKU: {product.sku} | Price: ₹{product.sell_price > 0 ? product.sell_price : 'N/A'}
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>No products found</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Selection Summary */}
                {(form.selected_category_id || form.selected_subcategory_id || form.selected_product_ids.length > 0) && (
                  <div className="vc-selection-summary">
                    <label>Selection Summary:</label>
                    <div>
                      {form.selectionType === 'category' && form.selected_category_id && (
                        <span>Category: {categories.find(c => c.id == form.selected_category_id)?.name}</span>
                      )}
                      {form.selectionType === 'subcategory' && form.selected_subcategory_id && (
                        <span>Subcategory: {subcategories.find(s => s.id == form.selected_subcategory_id)?.name}</span>
                      )}
                      {form.selectionType === 'products' && form.selected_product_ids.length > 0 && (
                        <span>Products: {form.selected_product_ids.length} selected</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="vc-select-group">
                <label>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleFormChange} placeholder="Notes" className="vc-modal-input" />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={modalButtonStyle} className="vc-modal-btn">Create</button>
                <button type="button" style={modalButtonStyle} onClick={handleCreateClose} className="vc-modal-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3>Reschedule Consultation</h3>
            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input name="date" value={form.date} onChange={handleFormChange} placeholder="Date" required className="vc-modal-input" type="date" />
              <input name="time" value={form.time} onChange={handleFormChange} placeholder="Time" required className="vc-modal-input" type="time" />
              <textarea name="notes" value={form.notes} onChange={handleFormChange} placeholder="Notes" className="vc-modal-input" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={modalButtonStyle} className="vc-modal-btn">Update</button>
                <button type="button" style={modalButtonStyle} onClick={handleRescheduleClose} className="vc-modal-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cartModalOpenIdx !== null && (
        <div className="vc-cart-modal-overlay" onClick={closeCartModal}>
          <div className="vc-cart-modal" onClick={e => e.stopPropagation()}>
            <div className="vc-cart-modal-header">
              <b>Cart Snapshot</b>
              <button className="vc-cart-modal-close" onClick={closeCartModal}>×</button>
            </div>
            <div className="vc-cart-modal-body">
              {consultations[cartModalOpenIdx]?.cart_snapshot &&
                Array.isArray(consultations[cartModalOpenIdx].cart_snapshot) &&
                consultations[cartModalOpenIdx].cart_snapshot.length > 0 ? (
                consultations[cartModalOpenIdx].cart_snapshot.map((item, i) => {
                  // Get product image URL - check multiple possible fields
                  let productImage = null;

                  // Helper function to construct full image URL
                  const constructImageUrl = (imagePath) => {
                    if (!imagePath) return null;
                    // If already a full URL (http/https/data), return as is
                    if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:'))) {
                      return imagePath;
                    }
                    // If relative path, prepend API base URL
                    if (typeof imagePath === 'string') {
                      const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
                      return `${API_URL}${cleanPath}`;
                    }
                    return null;
                  };

                  // Check for images array first
                  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                    const firstImage = item.images[0];
                    if (typeof firstImage === 'string') {
                      productImage = constructImageUrl(firstImage);
                    } else if (firstImage && firstImage.image_url) {
                      productImage = constructImageUrl(firstImage.image_url);
                    } else if (firstImage && firstImage.url) {
                      productImage = constructImageUrl(firstImage.url);
                    }
                  }

                  // Check for direct image fields (check multiple possible field names)
                  if (!productImage) {
                    // Try common image field names
                    const imageFields = [
                      'image_url', 'image', 'product_image', 'Product Image',
                      'product_image_url', 'img', 'photo', 'thumbnail',
                      'main_image', 'primary_image', 'featured_image'
                    ];
                    
                    for (const field of imageFields) {
                      if (item[field]) {
                        productImage = constructImageUrl(item[field]);
                        if (productImage) break;
                      }
                    }
                  }

                  // If still no image, try to get from product data if it exists
                  if (!productImage && item.product) {
                    const product = typeof item.product === 'string' ? JSON.parse(item.product) : item.product;
                    if (product) {
                      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                        const firstImage = product.images[0];
                        if (typeof firstImage === 'string') {
                          productImage = constructImageUrl(firstImage);
                        } else if (firstImage?.image_url) {
                          productImage = constructImageUrl(firstImage.image_url);
                        }
                      } else if (product.image_url) {
                        productImage = constructImageUrl(product.image_url);
                      } else if (product.image) {
                        productImage = constructImageUrl(product.image);
                      }
                    }
                  }

                  // Extract names from objects
                  const categoryName = item.Categories?.name || item.categories?.name || item.category_name || null;
                  const subcategoryName = item.Subcategories?.name || item.subcategories?.name || item.subcategory_name || null;
                  const subSubcategoryName = item['Sub Subcategories']?.name || item.sub_subcategories?.name || item.sub_subcategory_name || null;

                  // Get product options for table display
                  const productOptions = item['Product Options'] || item.product_options || (Array.isArray(item.product_options) ? item.product_options : []);

                  // Define main fields to show directly
                  const mainFields = [
                    'Id', 'id',
                    'Sku', 'sku',
                    'Item Name', 'item_name', 'product_name', 'name',
                    'Product Name', 'Product Sku',
                    'Category', 'category_id', 'Category Id',
                    'Subcategory', 'subcategory_id', 'Subcategory Id',
                    'Sub Subcategory', 'sub_subcategory_id', 'Sub Subcategory Id',
                    'Quantity', 'quantity',
                    'Product Price', 'price', 'value', 'sell_price', 'Total Rs', 'total_rs'
                  ];

                  // Separate main and other fields
                  const mainData = [];
                  const otherData = [];

                  // Track which fields we've already added to avoid duplicates
                  const addedFields = new Set();

                  // Map of duplicate fields - prefer the first one in each group
                  const duplicateFieldGroups = [
                    ['Id', 'id', 'Product Id', 'product_id'],
                    ['Sku', 'sku', 'Product Sku', 'product_sku'],
                    ['Item Name', 'item_name', 'Product Name', 'product_name', 'name'],
                    ['Description', 'description', 'Product Description', 'product_description'],
                    ['Category Id', 'category_id', 'Category', 'category'],
                    ['Subcategory Id', 'subcategory_id', 'Subcategory', 'subcategory'],
                    ['Sub Subcategory Id', 'sub_subcategory_id', 'Sub Subcategory', 'sub_subcategory'],
                    ['Product Price', 'price', 'value', 'sell_price', 'Total Rs', 'total_rs']
                  ];

                  Object.entries(item).forEach(([key, value]) => {
                    // Skip null, undefined, or empty values
                    if (value === null || value === undefined || value === '') {
                      return;
                    }

                    // Skip image fields, Product Less Weight, Product Options
                    if (key === 'image_url' || key === 'image' || key === 'images' || key === 'product_image' ||
                      key === 'Product Less Weight' || key === 'product_less_weight' ||
                      key === 'Product Options' || key === 'product_options' ||
                      key === 'Categories' || key === 'categories' ||
                      key === 'Subcategories' || key === 'subcategories' ||
                      key === 'Sub Subcategories' || key === 'sub_subcategories') {
                      return;
                    }

                    // Check for duplicates - if this field is in a duplicate group, check if we've already added a field from that group
                    let isDuplicate = false;
                    const keyLower = key.toLowerCase();
                    const keyNormalized = key.replace(/_/g, ' ').toLowerCase();

                    for (const group of duplicateFieldGroups) {
                      const groupLower = group.map(f => f.toLowerCase());
                      const groupNormalized = group.map(f => f.replace(/_/g, ' ').toLowerCase());

                      // Check if this key matches any field in the group
                      const matchesGroup = groupLower.includes(keyLower) || groupNormalized.includes(keyNormalized);

                      if (matchesGroup) {
                        // Check if we've already added a field from this group
                        for (const groupField of group) {
                          const groupFieldLower = groupField.toLowerCase();
                          const groupFieldNormalized = groupField.replace(/_/g, ' ').toLowerCase();
                          if (addedFields.has(groupFieldLower) || addedFields.has(groupFieldNormalized)) {
                            isDuplicate = true;
                            break;
                          }
                        }

                        // If not duplicate, mark all fields in this group as added
                        if (!isDuplicate) {
                          group.forEach(f => {
                            addedFields.add(f.toLowerCase());
                            addedFields.add(f.replace(/_/g, ' ').toLowerCase());
                          });
                        }
                        break;
                      }
                    }

                    // Skip if it's a duplicate
                    if (isDuplicate) {
                      return;
                    }

                    // Check if it's a main field
                    const isMainField = mainFields.some(field =>
                      key.toLowerCase() === field.toLowerCase() ||
                      key.replace(/_/g, ' ').toLowerCase() === field.toLowerCase()
                    );

                    if (isMainField) {
                      mainData.push([key, value]);
                      addedFields.add(key.toLowerCase());
                      addedFields.add(key.replace(/_/g, ' ').toLowerCase());
                    } else {
                      otherData.push([key, value]);
                    }
                  });

                  const isExpanded = expandedItems[i] || false;

                  return (
                    <div key={i} className="vc-cart-modal-item-card">
                      <div className="vc-cart-modal-item-header">
                        <h4>Item {i + 1}</h4>
                      </div>
                      <div className="vc-cart-modal-item-content">
                        {/* Product Image */}
                        <div className="vc-cart-modal-item-image">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={item.item_name || item.product_name || item.name || 'Product'}
                              onError={(e) => {
                                // Show placeholder on error
                                e.target.style.display = 'none';
                                const placeholder = e.target.nextElementSibling;
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className="vc-cart-modal-item-image-placeholder"
                            style={{ display: productImage ? 'none' : 'flex' }}
                          >
                            <ShoppingCart size={32} color="#999" />
                            <span>No Image</span>
                          </div>
                        </div>

                        {/* Main Product Details */}
                        <div className="vc-cart-modal-item-info">
                          {mainData.map(([key, value]) => {
                            // Handle IDs with names
                            if (key === 'Category Id' || key === 'category_id') {
                              if (categoryName) {
                                return (
                                  <div key={key} className="vc-cart-modal-item-row">
                                    <span className="vc-cart-field-label">Category:</span>
                                    <span className="vc-cart-field-value">{categoryName}</span>
                                  </div>
                                );
                              }
                              return null;
                            }

                            if (key === 'Subcategory Id' || key === 'subcategory_id') {
                              if (subcategoryName) {
                                return (
                                  <div key={key} className="vc-cart-modal-item-row">
                                    <span className="vc-cart-field-label">Subcategory:</span>
                                    <span className="vc-cart-field-value">{subcategoryName}</span>
                                  </div>
                                );
                              }
                              return null;
                            }

                            if (key === 'Sub Subcategory Id' || key === 'sub_subcategory_id') {
                              if (subSubcategoryName) {
                                return (
                                  <div key={key} className="vc-cart-modal-item-row">
                                    <span className="vc-cart-field-label">Sub Subcategory:</span>
                                    <span className="vc-cart-field-value">{subSubcategoryName}</span>
                                  </div>
                                );
                              }
                              return null;
                            }

                            // Format the key for display
                            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                            // Format the value based on the key
                            let displayValue = value;

                            // Handle Customizable, Engraving, Hallmark (1 = Yes, 0 = No)
                            if (key === 'Customizable' || key === 'customizable' ||
                              key === 'Engraving' || key === 'engraving' ||
                              key === 'Hallmark' || key === 'hallmark') {
                              displayValue = (value === 1 || value === '1' || value === true) ? 'Yes' : 'No';
                            } else if (key === 'sell_price' || key === 'actual_price' || key === 'final_price' ||
                              key === 'price' || key === 'value' || key === 'Product Price' ||
                              key === 'Total Rs' || key === 'total_rs' || key === 'rate' ||
                              key === 'labour' || key === 'other') {
                              displayValue = `₹${parseFloat(value).toFixed(2)}`;
                            } else if (typeof value === 'boolean') {
                              displayValue = value ? 'Yes' : 'No';
                            } else if (typeof value === 'number') {
                              displayValue = value.toString();
                            }

                            return (
                              <div key={key} className="vc-cart-modal-item-row">
                                <span className="vc-cart-field-label">{displayKey}:</span>
                                <span className="vc-cart-field-value">{displayValue}</span>
                              </div>
                            );
                          })}

                          {/* Other Fields Dropdown */}
                          {otherData.length > 0 && (
                            <div className="vc-cart-other-fields">
                              <button
                                className="vc-cart-toggle-other-fields"
                                onClick={() => toggleItemDetails(i)}
                              >
                                <span>Other Details</span>
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                              {isExpanded && (
                                <div className="vc-cart-other-fields-content">
                                  {otherData.map(([key, value]) => {
                                    // Skip null, undefined, or empty values
                                    if (value === null || value === undefined || value === '') {
                                      return null;
                                    }

                                    // Skip image fields as they're handled separately
                                    if (key === 'image_url' || key === 'image' || key === 'images' || key === 'product_image') {
                                      return null;
                                    }

                                    // Skip Product Less Weight
                                    if (key === 'Product Less Weight' || key === 'product_less_weight') {
                                      return null;
                                    }

                                    // Skip Product Options - will show in table separately
                                    if (key === 'Product Options' || key === 'product_options') {
                                      return null;
                                    }

                                    // Format the key for display
                                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                                    // Format the value based on the key
                                    let displayValue = value;

                                    // Handle Customizable, Engraving, Hallmark (1 = Yes, 0 = No)
                                    if (key === 'Customizable' || key === 'customizable' ||
                                      key === 'Engraving' || key === 'engraving' ||
                                      key === 'Hallmark' || key === 'hallmark') {
                                      displayValue = (value === 1 || value === '1' || value === true) ? 'Yes' : 'No';
                                    } else if (key === 'sell_price' || key === 'actual_price' || key === 'final_price' ||
                                      key === 'price' || key === 'value' || key === 'rate' ||
                                      key === 'labour' || key === 'other' || key === 'purchase_rate' ||
                                      key === 'sale_rate' || key === 'purchase_value' || key === 'sale_value' ||
                                      key === 'total_profit') {
                                      displayValue = `₹${parseFloat(value).toFixed(2)}`;
                                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                                      if (value.name) {
                                        displayValue = value.name;
                                      } else {
                                        displayValue = JSON.stringify(value, null, 2);
                                      }
                                    } else if (Array.isArray(value)) {
                                      return null;
                                    } else if (typeof value === 'boolean') {
                                      displayValue = value ? 'Yes' : 'No';
                                    } else if (typeof value === 'number') {
                                      displayValue = value.toString();
                                    }

                                    return (
                                      <div key={key} className="vc-cart-modal-item-row">
                                        <span className="vc-cart-field-label">{displayKey}:</span>
                                        <span className="vc-cart-field-value">{displayValue}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Product Options Table */}
                          {productOptions && Array.isArray(productOptions) && productOptions.length > 0 && (
                            <div className="vc-cart-product-options-table">
                              <div className="vc-cart-field-label" style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>
                                Product Options:
                              </div>
                              <table className="vc-cart-options-table">
                                <thead>
                                  <tr>
                                    <th>Size</th>
                                    <th>Weight</th>
                                    <th>Metal Color</th>
                                    <th>Dimensions</th>
                                    <th>Gender</th>
                                    <th>Occasion</th>
                                    <th>Value</th>
                                    <th>Sell Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {productOptions.map((option, optIdx) => (
                                    <tr key={optIdx}>
                                      <td>{option.size || '-'}</td>
                                      <td>{option.weight || '-'}</td>
                                      <td>{option.metal_color || '-'}</td>
                                      <td>{option.dimensions || '-'}</td>
                                      <td>{option.gender || '-'}</td>
                                      <td>{option.occasion || '-'}</td>
                                      <td>{option.value ? `₹${parseFloat(option.value).toFixed(2)}` : '-'}</td>
                                      <td>{option.sell_price ? `₹${parseFloat(option.sell_price).toFixed(2)}` : '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="vc-cart-modal-empty">
                  <p>No cart items found.</p>
                  <p>This consultation may not have any products in the cart snapshot.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple modal styles (inline, so no CSS file change)
const modalStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContentStyle = {
  background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.15)'
};
const modalButtonStyle = {
  padding: '8px 18px', borderRadius: 6, border: 'none', background: '#16784f', color: '#fff', fontWeight: 500, cursor: 'pointer'
};

export default VideoConsultations;
