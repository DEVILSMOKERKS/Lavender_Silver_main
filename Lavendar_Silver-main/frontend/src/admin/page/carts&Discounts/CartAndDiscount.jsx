import React, { useEffect, useState, useContext } from 'react';
import { Download, Search, ShoppingCart, AlertCircle, TrendingUp, Clock, ArrowUpDown, Eye, Edit, Trash2, Plus } from 'lucide-react';
import './CartAndDiscount.css';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import * as XLSX from 'xlsx';
import { useNotification } from '../../../context/NotificationContext';
import personImage from '../../../assets/img/person.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CartAndDiscount = () => {
  const { token } = useContext(AdminContext);
  const [coupons, setCoupons] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [form, setForm] = useState({ user_id: '', coupon_code: '', discount_id: '', status: 'active' });
  const [editId, setEditId] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [users, setUsers] = useState([]);
  // Add state for error/success messages
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const { showNotification } = useNotification();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Helper: get date N days ago
  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  // Calculate stats for current and previous 30 days
  const now = new Date();
  const last30 = coupons.filter(c => new Date(c.created_at) >= daysAgo(30));
  const prev30 = coupons.filter(c => new Date(c.created_at) < daysAgo(30) && new Date(c.created_at) >= daysAgo(60));
  function percentChange(current, prev) {
    if (prev === 0) return current === 0 ? '0%' : '+100%';
    const change = ((current - prev) / prev) * 100;
    return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
  }
  const activeCount = last30.filter(c => c.status === 'active').length;
  const usedCount = last30.filter(c => c.status === 'used').length;
  const expiredCount = last30.filter(c => c.status === 'expired').length;
  const totalValue = last30.length;
  const prevActive = prev30.filter(c => c.status === 'active').length;
  const prevUsed = prev30.filter(c => c.status === 'used').length;
  const prevExpired = prev30.filter(c => c.status === 'expired').length;
  const prevTotal = prev30.length;
  const activeChange = percentChange(activeCount, prevActive);
  const usedChange = percentChange(usedCount, prevUsed);
  const expiredChange = percentChange(expiredCount, prevExpired);
  const totalChange = percentChange(totalValue, prevTotal);

  // Fetch all coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/discounts/user-coupons`;
      if (statusFilter !== 'All') url = `${API_BASE_URL}/api/discounts/user-coupons/status/${statusFilter.toLowerCase()}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setCoupons(res.data.data || []);
    } catch {
      setCoupons([]);
    }
    setLoading(false);
  };

  // Fetch discounts for dropdown
  const fetchDiscounts = async () => {
    setDiscountsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/discounts`, { headers: { Authorization: `Bearer ${token}` } });
      setDiscounts(res.data.data || []);
    } catch {
      setDiscounts([]);
    }
    setDiscountsLoading(false);
  };
  // Fetch users for dropdown
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.data || []);
    } catch {
      setUsers([]);
    }
    setUsersLoading(false);
  };

  // Fetch coupons only after users and discounts are loaded
  useEffect(() => {
    if (!usersLoading && !discountsLoading) fetchCoupons();
    // eslint-disable-next-line
  }, [usersLoading, discountsLoading, statusFilter]);
  useEffect(() => { fetchDiscounts(); fetchUsers(); }, []);

  // When discount_id changes, auto-fill coupon_code with selected discount's code (only in create mode)
  useEffect(() => {
    if (form.discount_id) {
      const selected = discounts.find(d => d.id == form.discount_id);
      if (selected && selected.code) {
        setForm(f => {
          if (modalType === 'create') {
            return { ...f, coupon_code: selected.code };
          } else {
            // In edit mode, only update coupon_code if discount_id changes
            return { ...f, coupon_code: selected.code };
          }
        });
      }
    } else {
      setForm(f => ({ ...f, coupon_code: '' }));
    }
    // eslint-disable-next-line
  }, [form.discount_id, discounts, modalType]);

  // Filtered coupons by search
  const filteredCoupons = coupons.filter(c => {
    const s = search.toLowerCase();
    return (
      (c.coupon_code && c.coupon_code.toLowerCase().includes(s)) ||
      (c.user_id && users.find(u => u.id === c.user_id && (u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s))))
    );
  });

  // Modal open/close
  const openCreateModal = () => { setModalType('create'); setForm({ user_id: '', coupon_code: '', discount_id: '', status: 'active' }); setShowModal(true); };
  // Edit coupon: update form with selected coupon's data
  const openEditModal = (c) => {
    setModalType('edit');
    setEditId(c.id);
    setForm({ user_id: c.user_id, coupon_code: c.coupon_code, discount_id: c.discount_id, status: c.status });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditId(null); };

  // Create or update coupon
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!form.user_id || !form.coupon_code || !form.discount_id || !form.status) {
      setFormError('All fields are required.');
      return;
    }
    try {
      if (modalType === 'create') {
        await axios.post(`${API_BASE_URL}/api/discounts/user-coupons`, form, { headers: { Authorization: `Bearer ${token}` } });
        setFormSuccess('Coupon created successfully!');
      } else {
        await axios.put(`${API_BASE_URL}/api/discounts/user-coupons/${editId}`, form, { headers: { Authorization: `Bearer ${token}` } });
        setFormSuccess('Coupon updated successfully!');
      }
      setTimeout(() => {
        closeModal();
        fetchCoupons();
        setFormSuccess('');
      }, 1000);
    } catch (err) {
      setFormError('Failed to save coupon.');
    }
  };
  // Coupon code copy notification
  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    showNotification('Coupon code copied!', 'success');
  };

  // Delete coupon with confirmation popup
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/discounts/user-coupons/${deleteId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCoupons();
      showNotification('Coupon deleted!', 'success');
    } catch {
      showNotification('Failed to delete coupon.', 'error');
    }
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  // Export data as XLSX
  const handleExport = () => {
    const dataToExport = filteredCoupons.map(c => {
      const user = users.find(u => u.id === c.user_id) || {};
      const discount = discounts.find(d => d.id === c.discount_id) || {};
      return {
        'User Name': user.name || '-',
        'User Email': user.email || '-',
        'Coupon Code': c.coupon_code,
        'Discount': discount.title || '-',
        'Status': c.status,
        'Used At': c.used_at ? new Date(c.used_at).toLocaleString() : '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UserCoupons');
    XLSX.writeFile(wb, 'User_Coupons.xlsx');
  };

  return (
    <div className="admin-coupon-container">
      <h2 className="admin-coupon-title">Cart Management</h2>
      <div className="admin-coupon-search-section">
        <div className="admin-coupon-search-box">
          <div className="admin-coupon-search-filters">
            <div className="admin-coupon-search-wrapper">
              <Search className="admin-coupon-search-icon" />
              <input className="admin-coupon-search-input" placeholder="Search Product by name and Id.." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="admin-coupon-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Used</option>
              <option>Expired</option>
            </select>
            <button className="admin-coupon-add-btn" onClick={openCreateModal}><Plus size={16} />Add Coupon</button>
          </div>
          <div className="admin-coupon-export-wrapper">
            <button className="admin-coupon-export-btn" onClick={handleExport}>
              <Download />
              Export data
            </button>
          </div>
        </div>
      </div>
      <div className="admin-coupon-stats-row">
        <div className="admin-coupon-stats-card">
          <div className="admin-coupon-stats-card-header">
            <h3>Active Coupons</h3>
            <span className="admin-coupon-stats-icon admin-coupon-stats-icon-blue"><ShoppingCart className="admin-coupon-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-coupon-stats-value">{activeCount}</h3>
          <p className={`admin-coupon-stats-change ${activeChange.startsWith('+') ? 'admin-coupon-positive' : 'admin-coupon-negative'}`}>
            <span className="admin-coupon-stats-percentage">{activeChange}</span> from last period</p>
        </div>
        <div className="admin-coupon-stats-card">
          <div className="admin-coupon-stats-card-header">
            <h3>Used Coupons</h3>
            <span className="admin-coupon-stats-icon admin-coupon-stats-icon-red"><AlertCircle className="admin-coupon-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-coupon-stats-value">{usedCount}</h3>
          <p className={`admin-coupon-stats-change ${usedChange.startsWith('+') ? 'admin-coupon-positive' : 'admin-coupon-negative'}`}><span className="admin-coupon-stats-percentage">{usedChange}</span> from last period</p>
        </div>
        <div className="admin-coupon-stats-card">
          <div className="admin-coupon-stats-card-header">
            <h3>Expired Coupons</h3>
            <span className="admin-coupon-stats-icon admin-coupon-stats-icon-purple"><TrendingUp className="admin-coupon-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-coupon-stats-value">{expiredCount}</h3>
          <p className={`admin-coupon-stats-change ${expiredChange.startsWith('+') ? 'admin-coupon-positive' : 'admin-coupon-negative'}`}><span className="admin-coupon-stats-percentage">{expiredChange}</span> from last period</p>
        </div>
        <div className="admin-coupon-stats-card">
          <div className="admin-coupon-stats-card-header">
            <h3>Total Coupons</h3>
            <span className="admin-coupon-stats-icon admin-coupon-stats-icon-green"><Clock className="admin-coupon-stats-lucide-icon" /></span>
          </div>
          <h3 className="admin-coupon-stats-value">{totalValue}</h3>
          <p className={`admin-coupon-stats-change ${totalChange.startsWith('+') ? 'admin-coupon-positive' : 'admin-coupon-negative'}`}><span className="admin-coupon-stats-percentage">{totalChange}</span> from last month</p>
        </div>
      </div>
      <h3 className="admin-coupon-table-title">User Coupons</h3>
      <div className="admin-coupon-table-wrapper">
        <table className="admin-coupon-table">
          <thead>
            <tr>
              <th><span className="admin-coupon-table-header-flex"><ArrowUpDown className="admin-coupon-table-arrow-icon" /> USER</span></th>
              <th><span className="admin-coupon-table-header-flex"><ArrowUpDown className="admin-coupon-table-arrow-icon" /> COUPON CODE</span></th>
              <th><span className="admin-coupon-table-header-flex"><ArrowUpDown className="admin-coupon-table-arrow-icon" /> DISCOUNT</span></th>
              <th><span className="admin-coupon-table-header-flex"><ArrowUpDown className="admin-coupon-table-arrow-icon" /> STATUS</span></th>
              <th><span className="admin-coupon-table-header-flex"><ArrowUpDown className="admin-coupon-table-arrow-icon" /> USED AT</span></th>
              <th><span className="admin-coupon-table-header-flex"><ArrowUpDown className="admin-coupon-table-arrow-icon" /> ACTIONS</span></th>
            </tr>
          </thead>
          <tbody className='admin-coupon-tbody'>
            {(loading || usersLoading || discountsLoading) ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td></tr> :
              filteredCoupons.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>No coupons found.</td></tr> :
                filteredCoupons.map((c, idx) => {
                  const user = users.find(u => u.id === c.user_id) || {};
                  const discount = discounts.find(d => d.id === c.discount_id) || {};
                  return (
                    <tr key={c.id}>
                      <td className="admin-coupon-customer-cell">
                        <img className="admin-coupon-customer-avatar" src={user.photo || personImage} alt="avatar" />
                        <div>
                          <div className="admin-coupon-customer-name">{user.name || '-'}</div>
                          <div className="admin-coupon-customer-email">{user.email || '-'}</div>
                        </div>
                      </td>
                      <td>{c.coupon_code}{discount.title ? ` - ${discount.title}` : ''}</td>
                      <td>{discount.title || '-'}</td>
                      <td><span className={c.status === 'expired' ? 'admin-coupon-status-badge admin-coupon-abandoned' : 'admin-coupon-status-badge admin-coupon-active'}>{c.status}</span></td>
                      <td>{c.status === 'used' ? 1 : 0}</td>
                      <td className="admin-coupon-action-cell">
                        <button className="admin-coupon-edit-btn" onClick={() => openEditModal(c)}><Edit size={18} /></button>
                        <button className="admin-coupon-delete-btn" onClick={() => handleDelete(c.id)}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {/* Modal for create/edit coupon */}
      {showModal && (
        <div className="admin-coupon-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}>
          <div className="admin-coupon-modal-content">
            <div className="admin-coupon-modal-header">
              <h3 className="admin-coupon-modal-title">{modalType === 'create' ? 'Create User Coupon' : 'Edit User Coupon'}</h3>
              <button className="admin-coupon-modal-close" onClick={closeModal}>×</button>
            </div>
            {formError && <div className="admin-coupon-modal-error">{formError}</div>}
            {formSuccess && <div className="admin-coupon-modal-success">{formSuccess}</div>}
            <form onSubmit={handleSubmit} className="admin-coupon-modal-form">
              {modalType === 'create' ? (
                <>
                  <select name="user_id" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required className="admin-coupon-modal-input">
                    <option value="">Select User</option>
                    {users.map(u => <option value={u.id} key={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                  <input name="coupon_code" value={form.coupon_code} readOnly placeholder="Coupon Code" required className="admin-coupon-modal-input" type="text" />
                  <select name="discount_id" value={form.discount_id} onChange={e => setForm(f => ({ ...f, discount_id: e.target.value }))} required className="admin-coupon-modal-input">
                    <option value="">Select Discount</option>
                    {discounts.map(d => <option value={d.id} key={d.id}>{d.title}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <input name="coupon_code" value={form.coupon_code} readOnly className="admin-coupon-modal-input" type="text" />
                  <input name="discount_title" value={discounts.find(d => d.id == form.discount_id)?.title || ''} readOnly className="admin-coupon-modal-input" type="text" />
                </>
              )}
              <select name="status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="admin-coupon-modal-input">
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
              </select>
              <div className="admin-coupon-modal-btn-row">
                <button type="submit" className="admin-coupon-modal-submit-btn">{modalType === 'create' ? 'Create' : 'Update'}</button>
                <button type="button" className="admin-coupon-modal-cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="admin-coupon-delete-confirm-overlay">
          <div className="admin-coupon-delete-confirm">
            <div className="admin-coupon-delete-title">Delete Coupon?</div>
            <div className="admin-coupon-delete-desc">Are you sure you want to delete this coupon?</div>
            <div className="admin-coupon-delete-btn-row">
              <button className="admin-coupon-delete-btn" onClick={confirmDelete}>Yes, Delete</button>
              <button className="admin-coupon-cancel-btn" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartAndDiscount;
