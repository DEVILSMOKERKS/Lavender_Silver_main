import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import './OrdersManagement.css';
import axios from 'axios';
import { Search, Filter, Box, Clock, Truck, CheckCircle, Edit, Trash2, ArrowUpDown, Save, XCircle, ChevronDown, Loader as LoaderIcon, FileText } from 'lucide-react';
import { AdminContext } from '../../../../context/AdminContext';

// Lazy load heavy Invoice component (uses html2canvas and jsPDF)
const Invoice = lazy(() => import('./Invoice'));

const statusColors = {
  delivered: 'delivered',
  shipped: 'shipped',
  processing: 'pending',
  pending: 'pending',
  cancelled: 'cancel',
  cancel: 'cancel',
};

const statusOptions = [
  { value: 'All', label: 'All' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancel', label: 'Cancel' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL;

const OrdersManagement = () => {
  const { token } = useContext(AdminContext);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [showInvoice, setShowInvoice] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1, current_page: 1, limit: 20 });

  // Fetch orders from backend API
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const fetchOrders = async () => {
      try {
        const params = {
          limit: pagination.limit,
          search,
          status: filter
        };
        const res = await axios.get(`${API_BASE_URL}/api/orders`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, total_pages: 1, current_page: 1, limit: 20 });
      } catch (err) {
        setOrders([]);
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [search, filter, token]);

  // Update summary calculation to use orders directly
  const summary = {
    total: orders.length,
    pending: orders.filter(o => o.order_status && o.order_status.toLowerCase() === 'processing').length,
    shipped: orders.filter(o => o.order_status && o.order_status.toLowerCase() === 'shipped').length,
    delivered: orders.filter(o => o.order_status && o.order_status.toLowerCase() === 'delivered').length,
    cancel: orders.filter(o => o.order_status && o.order_status.toLowerCase() === 'cancelled').length,
  };

  // Edit order handlers
  const handleEditClick = (order) => {
    setEditOrder(order.id);
    setEditForm({ order_status: order.order_status });
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  const handleEditSave = async (order) => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/orders/${order.id}`, {
        order_status: editForm.order_status || order.order_status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, order_status: editForm.order_status } : o));
      setEditOrder(null);
    } catch (err) {
      console.error('Error saving order:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleEditCancel = () => {
    setEditOrder(null);
  };

  // Handle order delete
  const handleDelete = async (order) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setDeleteOrderId(null); 
    } catch (err) {
      console.error('Error deleting order:', err);
    } finally {
      setLoading(false);
    }
  };



  // Invoice popup
  const handleInvoice = async (order) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const orderData = {
          ...res.data.data,
          items: Array.isArray(res.data.data.items) ? res.data.data.items : []
        };
        setShowInvoice(orderData);
      } else {
        // Fallback: use order data from list if available
        const fallbackData = {
          ...order,
          items: Array.isArray(order.items) ? order.items : []
        };
        console.warn('Using fallback order data:', fallbackData);
        setShowInvoice(fallbackData);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      // Fallback: use order data from list if available
      const fallbackData = {
        ...order,
        items: Array.isArray(order.items) ? order.items : []
      };
      console.warn('Using fallback order data after error:', fallbackData);
      setShowInvoice(fallbackData);
    }
  };
  const closeInvoice = () => setShowInvoice(null);

  return (
    <div className="admin-orders-management-container">
      <div className="admin-orders-header-row">
        <h2 className="admin-orders-title">Orders Management</h2>
        <div className="admin-orders-controls-row">
          {/* Filter dropdown for status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <Filter size={18} style={{ color: '#7c2d4a' }} />
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                className="admin-filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ paddingRight: '28px', border: 'none', outline: 'none', boxShadow: 'none' }}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#fff' }} />
            </div>
          </div>
          <div className="admin-search-group">
            <input
              className="admin-search-input"
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="admin-search-icon"><Search size={18} /></span>
          </div>
        </div>
      </div>
      <div className="admin-orders-summary-row">
        <div className="admin-orders-summary-cards">
          <div className="admin-summary-card total">
            <div className="admin-icon-box total"><Box size={32} /></div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Total Order</div>
              <div className="admin-summary-value">{summary.total}</div>
            </div>
          </div>
          <div className="admin-summary-card pending">
            <div className="admin-icon-box pending"><Clock size={32} /></div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Pending</div>
              <div className="admin-summary-value">{summary.pending}</div>
            </div>
          </div>
          <div className="admin-summary-card shipped">
            <div className="admin-icon-box shipped"><Truck size={32} /></div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Shipped</div>
              <div className="admin-summary-value">{summary.shipped}</div>
            </div>
          </div>
          <div className="admin-summary-card delivered">
            <div className="admin-icon-box delivered"><CheckCircle size={32} /></div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Delivered</div>
              <div className="admin-summary-value">{summary.delivered}</div>
            </div>
          </div>
          <div className="admin-summary-card cancel">
            <div className="admin-icon-box cancel"><XCircle size={32} /></div>
            <div className="admin-summary-info">
              <div className="admin-summary-label">Cancel</div>
              <div className="admin-summary-value">{summary.cancel}</div>
            </div>
          </div>
        </div>
      </div>
      <div className='admin-show-entries' style={{ display: 'flex', alignItems: 'center', padding: '10px', fontSize: '18px' }}>
        <span style={{ marginRight: 8 }}>Show</span>
        <select className="admin-show-entries-select">
          <option>10</option>
          <option>25</option>
          <option>50</option>
          <option>100</option>
        </select>
        <span>Entries</span>
      </div>
      <div className="admin-orders-table-wrapper">
        <table className="admin-orders-table">
          <thead>
            <tr>
              <th>ORDER DETAILS</th>
              <th>CUSTOMER</th>
              <th>PRODUCTS</th>
              <th>ITEMS</th>
              <th>TOTAL</th>
              <th style={{ paddingLeft: "2.5rem" }}>STATUS</th>
              <th style={{ textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No orders found.</td></tr>
            ) : orders.map((order, index) => (
              <tr key={index}>
                <td>
                  <div>{order.id}</div>
                  <div className="admin-order-date">{order.order_number}</div>
                </td>
                <td>
                  <div className="admin-customer-name">{order.customer_name || '-'}</div>
                  <div className="admin-customer-email">{order.customer_email || '-'}</div>
                  {order.customer_phone && (
                    <div className="admin-customer-phone">{order.customer_phone}</div>
                  )}
                </td>
                <td>
                  {order.items && order.items.length ? (
                    <div className="admin-order-products">
                      {order.items.slice(0, 2).map((item, productIdx) => (
                        <div key={`${order.id}-${item.id || productIdx}`}>
                          {item.quantity || 1}x{' '}
                          {item.product_name || item.item_name || (item.product_id ? `Product #${item.product_id}` : 'Product')}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="admin-more-items">+{order.items.length - 2} more</div>
                      )}
                    </div>
                  ) : (
                    <span className="admin-empty-text">—</span>
                  )}
                </td>
                <td>{order.item_count || (order.items ? order.items.length : 0)}</td>
                <td>
                  <div>₹{Number(order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                      Discount: -₹{Number(order.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      {order.discount_code && ` (${order.discount_code})`}
                    </div>
                  )}
                </td>
                <td>
                  {editOrder === order.id ? (
                    <select
                      name="order_status"
                      value={editForm.order_status || order.order_status}
                      onChange={handleEditChange}
                      style={{ fontSize: 15, padding: 2, borderRadius: 4, border: '1px solid #ccc' }}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span className={`admin-status-badge ${statusColors[(order.order_status || '').toLowerCase()] || ''}`}>
                      {order.order_status || '-'}
                    </span>
                  )}
                </td>
                <td>
                  <div className="admin-action-btn-group">

                    <button className="admin-action-btn invoice" onClick={() => handleInvoice(order)} title="Generate Invoice"><FileText size={15} /></button>
                    {editOrder === order.id ? (
                      <>
                        <button className="admin-action-btn edit" onClick={() => handleEditSave(order)} style={{ background: '#c7a16e', color: '#fff', marginRight: 4 }} title="Save"><Save size={18} /></button>
                        <button className="admin-action-btn delete" onClick={handleEditCancel} style={{ background: '#eee', color: '#333' }} title="Cancel"><XCircle size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button className="admin-action-btn edit" onClick={() => handleEditClick(order)}>
                          <Edit size={15} />
                        </button>
                        <div className="admin-action-divider"></div>
                        <button className="admin-action-btn delete" onClick={() => setDeleteOrderId(order)}>
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Popup */}
      {deleteOrderId && (
        <div className="admin-popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="admin-delete-popup-unique" onClick={e => e.stopPropagation()}>
            <div className="admin-delete-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 11v6M14 11v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="admin-delete-title">Delete Order?</div>
            <div className="admin-delete-desc">
              Are you sure you want to delete this order?<br />
              <span style={{ color: '#7c2d4a', fontWeight: 600 }}>Order Number: {deleteOrderId.order_number}</span>
            </div>
            <div className="admin-delete-btn-row">
              <button className="admin-delete-btn confirm" onClick={() => handleDelete(deleteOrderId)}>Yes, Delete</button>
              <button className="admin-delete-btn cancel" onClick={() => setDeleteOrderId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}


      {/* Invoice Popup */}
      {showInvoice && (
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading invoice...</div>}>
          <Invoice order={showInvoice} onClose={closeInvoice} />
        </Suspense>
      )}
    </div>
  );
};

export default OrdersManagement;
