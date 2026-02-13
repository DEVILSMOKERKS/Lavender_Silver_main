import React, { useEffect, useState } from 'react';
import './CartManagement.css';
import {
  Clock,
  User,
  Mail,
  Search,
  ShoppingCart,
  IndianRupee,
  Trash2,
  Eye
} from 'lucide-react';

import axios from 'axios';
import { useNotification } from '../../../../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CartManagement = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [apiError, setApiError] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceMessage, setInvoiceMessage] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [viewAllData, setViewAllData] = useState(null);
  const [showViewItemModal, setShowViewItemModal] = useState(false);
  const [viewItemData, setViewItemData] = useState(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/carts`);

      if (response.data.success) {
        setCarts(response.data.data.carts);
      } else {
        setApiError('Failed to fetch carts');
      }
    } catch (error) {
      console.error('Error fetching carts:', error);
      setApiError('Failed to fetch carts');
    } finally {
      setLoading(false);
    }
  };

  // Search and filter
  const filteredCarts = carts.filter(cart => {
    const searchLower = search.toLowerCase();
    return (
      cart.user_name.toLowerCase().includes(searchLower) ||
      cart.user_email.toLowerCase().includes(searchLower) ||
      cart.user_phone?.toLowerCase().includes(searchLower)
    );
  });

  // Dynamic summary counts
  const summaryCounts = {
    total: filteredCarts.length,
    total_items: filteredCarts.reduce((sum, cart) => sum + cart.total_items, 0),
    total_revenue: filteredCarts.reduce((sum, cart) => sum + cart.subtotal, 0),
    active_customers: filteredCarts.filter(cart => cart.items.length > 0).length,
  };

  const summaryData = [
    {
      icon: <ShoppingCart />, label: 'Total Carts', value: summaryCounts.total, bg: '#e6f0fa', iconBg: '#bcd6fa', iconColor: '#3a6fd8',
    },
    {
      icon: <Clock />, label: 'Total Items', value: summaryCounts.total_items, bg: '#fdf7e6', iconBg: '#fbe9b6', iconColor: '#e6b800',
    },
    {
      icon: <User />, label: 'Active Customers', value: summaryCounts.active_customers, bg: '#f6f0fa', iconBg: '#e3d6fa', iconColor: '#a259d9',
    },
    {
      icon: <IndianRupee />, label: 'Total Revenue', value: `₹${summaryCounts.total_revenue.toLocaleString()}`, bg: '#e6faf2', iconBg: '#b6fbe0', iconColor: '#16784f',
    },
  ];

  // Delete Modal
  const handleDeleteOpen = (cartItemId) => {
    setDeleteId(cartItemId);
    setShowDeleteModal(true);
  };

  const handleDeleteClose = () => setShowDeleteModal(false);

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/api/admin/carts/${deleteId}`);

      if (response.data.success) {
        // Update carts state immediately by removing the deleted item
        setCarts(prevCarts => {
          return prevCarts.map(cart => {
            const updatedItems = cart.items.filter(item => item.id !== deleteId);
            if (updatedItems.length !== cart.items.length) {
              // Recalculate cart totals
              const total_items = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
              const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

              return {
                ...cart,
                items: updatedItems,
                total_items,
                subtotal
              };
            }
            return cart;
          }).filter(cart => cart.items.length > 0); // Remove empty carts
        });

        setShowDeleteModal(false);
        showNotification('Cart item deleted successfully', 'success');
      } else {
        setApiError('Failed to delete cart item');
        showNotification('Failed to delete cart item', 'error');
      }
    } catch (error) {
      console.error('Error deleting cart item:', error);
      setApiError('Failed to delete cart item');
      showNotification('Failed to delete cart item', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Invoice Modal
  const handleInvoiceOpen = (cart) => {
    setInvoiceData(cart);
    setInvoiceMessage('');
    setShowInvoiceModal(true);
  };

  const handleInvoiceClose = () => setShowInvoiceModal(false);

  const handleSendInvoice = async () => {
    try {
      setSendingInvoice(true);
      const response = await axios.post(`${API_BASE_URL}/api/admin/carts/${invoiceData.user_id}/send-invoice`, {
        message: invoiceMessage
      });

      if (response.data.success) {
        showNotification('Invoice sent successfully to ' + invoiceData.user_email, 'success');
        setShowInvoiceModal(false);
      } else {
        setApiError('Failed to send invoice');
        showNotification('Failed to send invoice', 'error');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      setApiError('Failed to send invoice');
      showNotification('Failed to send invoice', 'error');
    } finally {
      setSendingInvoice(false);
    }
  };

  // View All Modal
  const handleViewAllOpen = (cart) => {
    setViewAllData(cart);
    setShowViewAllModal(true);
  };

  const handleViewAllClose = () => setShowViewAllModal(false);

  // View Item Modal
  const handleViewItemOpen = (item) => {
    setViewItemData(item);
    setShowViewItemModal(true);
  };

  const handleViewItemClose = () => setShowViewItemModal(false);

  // Handle immediate deletion from View All modal
  const handleDeleteFromViewAll = async (itemId, cartId) => {
    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/api/admin/carts/${itemId}`);

      if (response.data.success) {
        // Update carts state immediately
        setCarts(prevCarts => {
          return prevCarts.map(cart => {
            if (cart.user_id === cartId) {
              const updatedItems = cart.items.filter(item => item.id !== itemId);
              const total_items = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
              const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);

              return {
                ...cart,
                items: updatedItems,
                total_items,
                subtotal
              };
            }
            return cart;
          }).filter(cart => cart.items.length > 0);
        });

        // Update viewAllData if it's the same cart
        if (viewAllData && viewAllData.user_id === cartId) {
          setViewAllData(prev => {
            const updatedItems = prev.items.filter(item => item.id !== itemId);
            return {
              ...prev,
              items: updatedItems,
              total_items: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
              subtotal: updatedItems.reduce((sum, item) => sum + item.total_price, 0)
            };
          });
        }

        showNotification('Cart item deleted successfully', 'success');
      } else {
        setApiError('Failed to delete cart item');
        showNotification('Failed to delete cart item', 'error');
      }
    } catch (error) {
      console.error('Error deleting cart item:', error);
      setApiError('Failed to delete cart item');
      showNotification('Failed to delete cart item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admincartManagement-container">
      <div className="admincartManagement-header-row">
        <h2 className="admincartManagement-title">Cart Management</h2>
        <div className="admincartManagement-header-search-group">
          <div className="admincartManagement-search-box">
            <input type="text" placeholder="Search by customer name, email, or phone" value={search} onChange={e => setSearch(e.target.value)} />
            <span className="admincartManagement-search-icon"><Search size={15} /></span>
          </div>
        </div>
      </div>

      <div className="admincartManagement-summary-row">
        {summaryData.map((item, idx) => (
          <div className="admincartManagement-summary-card" key={idx} style={{ background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: item.iconBg, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(item.icon, { color: item.iconColor, size: 28 })}
              </span>
              <div>
                <div style={{ fontSize: 14, color: '#222', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>{item.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admincartManagement-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>Loading...</div>
        ) : filteredCarts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
            {search ? 'No carts found matching your search' : 'No carts found'}
          </div>
        ) : (
          filteredCarts.map((cart, idx) => (
            <div className="admincartManagement-consult-card" key={idx}>
              <div className="admincartManagement-consult-header-row">
                <div className="admincartManagement-consult-header">
                  <span className="admincartManagement-card-icon"><ShoppingCart size={22} /></span>
                  <span className="admincartManagement-consult-id">Cart #{cart.user_id}</span>
                  <span className="admincartManagement-consult-status">
                    {cart.items.length} items
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="admincartManagement-consult-col-title">Customer Information</div>
                  <div className="admincartManagement-consult-detail"><b>Name:</b> {cart.user_name}</div>
                  <div className="admincartManagement-consult-detail"><b>Email:</b> {cart.user_email}</div>
                  <div className="admincartManagement-consult-detail"><b>Phone:</b> {cart.user_phone || 'N/A'}</div>
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="admincartManagement-consult-col-title">Cart Items</div>
                  <div style={{ marginBottom: '10px' }}>
                    {cart.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="admincartManagement-cart-item">
                        <div className="admincartManagement-cart-item-content">
                          <div className="admincartManagement-cart-item-name">{item.product_name}</div>
                          <div className="admincartManagement-cart-item-actions">
                            <span className="admincartManagement-view-icon" onClick={() => handleViewItemOpen(item)}>
                              <Eye color="#16784f" size={15} />
                            </span>
                            <span className="admincartManagement-delete-icon" onClick={() => handleDeleteOpen(item.id)}>
                              <Trash2 color="#e74c3c" size={15} />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {cart.items.length > 3 && (
                      <button
                        onClick={() => handleViewAllOpen(cart)}
                        className="admincartManagement-view-all-btn"
                      >
                        View All ({cart.items.length} items)
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="admincartManagement-consult-col-title">Summary</div>
                  <div className="admincartManagement-consult-detail">Items <span style={{ marginLeft: 8 }}>{cart.total_items}</span></div>
                  <div className="admincartManagement-consult-detail" style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>Total Amount <span style={{ marginLeft: 8 }}>₹{cart.subtotal.toLocaleString()}</span></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #eee', margin: '16px 0 0 0', paddingTop: 12, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="admincartManagement-consult-reschedule" onClick={() => handleInvoiceOpen(cart)}>Send Invoice</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="admincartManagement-modal">
          <div className="admincartManagement-modal-content">
            <h3>Are you sure you want to delete this cart item?</h3>
            <div className="admincartManagement-modal-btn-row">
              <button className="admincartManagement-modal-btn" onClick={handleDeleteConfirm}>Delete</button>
              <button className="admincartManagement-modal-btn admincartManagement-modal-btn-secondary" onClick={handleDeleteClose}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="admincartManagement-modal">
          <div className="admincartManagement-modal-content">
            <h3>Send Invoice to Customer</h3>
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Customer:</strong> {invoiceData.user_name}</p>
              <p><strong>Email:</strong> {invoiceData.user_email}</p>
              <p><strong>Total Items:</strong> {invoiceData.total_items}</p>
              <p><strong>Total Amount:</strong> ₹{invoiceData.subtotal.toLocaleString()}</p>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message (optional):</label>
              <textarea
                value={invoiceMessage}
                onChange={(e) => setInvoiceMessage(e.target.value)}
                placeholder="Add a personal message to the invoice..."
                className="admincartManagement-modal-input"
                rows={4}
              />
            </div>
            <div className="admincartManagement-modal-btn-row">
              <button
                className="admincartManagement-modal-btn"
                onClick={handleSendInvoice}
                disabled={sendingInvoice}
              >
                {sendingInvoice ? 'Sending...' : 'Send Invoice'}
              </button>
              <button className="admincartManagement-modal-btn admincartManagement-modal-btn-secondary" onClick={handleInvoiceClose}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View All Modal */}
      {showViewAllModal && viewAllData && (
        <div className="admincartManagement-modal">
          <div className="admincartManagement-modal-content admincartManagement-view-item-modal">
            <h3>All Cart Items - {viewAllData.user_name}</h3>
            <div className="admincartManagement-view-item-details">
              {viewAllData.items && viewAllData.items.length > 0 ? (
                viewAllData.items.map((item, i) => (
                  <div key={i} className="admincartManagement-view-all-item">
                    <div className="admincartManagement-view-all-item-content">
                      <div className="admincartManagement-view-all-item-image-wrapper">
                        {item.image_url ? (
                          <img
                            src={item.image_url.startsWith('http') || item.image_url.startsWith('data:')
                              ? item.image_url
                              : (item.image_url.startsWith('/') ? `${API_BASE_URL}${item.image_url}` : `${API_BASE_URL}/${item.image_url}`)}
                            alt={item.product_name}
                            className="admincartManagement-view-all-item-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="admincartManagement-view-all-item-image-placeholder" style={{ display: item.image_url ? 'none' : 'flex' }}>
                          <ShoppingCart size={24} color="#999" />
                        </div>
                      </div>
                      <div className="admincartManagement-view-all-item-details">
                        <div className="admincartManagement-view-all-item-name">{item.product_name}</div>
                        <div className="admincartManagement-view-all-item-specs">
                          <span><strong>Qty:</strong> {item.quantity}</span>
                          {item.selected_size && <span><strong>Size:</strong> {item.selected_size}</span>}
                          {item.selected_weight && <span><strong>Weight:</strong> {item.selected_weight}</span>}
                          {item.sell_price && <span><strong>Unit Price:</strong> ₹{parseFloat(item.sell_price || item.final_price || item.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>}
                        </div>
                      </div>
                      <div className="admincartManagement-view-all-item-actions">
                        <div className="admincartManagement-view-all-item-price">₹{parseFloat(item.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <span className="admincartManagement-view-all-delete-icon" onClick={() => {
                          handleDeleteFromViewAll(item.id, viewAllData.user_id);
                        }}>
                          <Trash2 color="#e74c3c" size={15} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No items found</div>
              )}
            </div>
            <div className="admincartManagement-modal-btn-row">
              <button className="admincartManagement-modal-btn admincartManagement-modal-btn-secondary" onClick={handleViewAllClose}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Item Modal - Exact Invoice Table Format */}
      {showViewItemModal && viewItemData && (
        <div className="admincartManagement-modal">
          <div className="admincartManagement-modal-content admincartManagement-invoice-table-modal">
            {/* Website URL Header */}
            <div className="admincartManagement-invoice-website-header">
              Website: https://pvjewellers.in/
            </div>

            {/* Order Items Section */}
            <div className="admincartManagement-invoice-order-items-section">
              <h3 className="admincartManagement-invoice-order-items-title">Order Items</h3>

              {/* Main Items Table */}
              <div className="admincartManagement-invoice-table-container">
                <table className="admincartManagement-invoice-order-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Sub-subcategory</th>
                      <th>Size</th>
                      <th>Weight</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {/* Image Column */}
                      <td className="admincartManagement-invoice-image-cell">
                        {viewItemData.image_url ? (
                          <img
                            src={viewItemData.image_url.startsWith('http') || viewItemData.image_url.startsWith('data:')
                              ? viewItemData.image_url
                              : (viewItemData.image_url.startsWith('/') ? `${API_BASE_URL}${viewItemData.image_url}` : `${API_BASE_URL}/${viewItemData.image_url}`)}
                            alt={viewItemData.product_name}
                            className="admincartManagement-invoice-item-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="admincartManagement-invoice-item-image-placeholder" style={{ display: viewItemData.image_url ? 'none' : 'flex' }}>
                          <ShoppingCart size={24} color="#999" />
                        </div>
                      </td>

                      {/* Product Column */}
                      <td className="admincartManagement-invoice-product-cell">
                        <div className="admincartManagement-invoice-product-name">
                          {viewItemData.product_name}
                        </div>
                        {viewItemData.tunch && parseFloat(viewItemData.tunch) > 0 && (
                          <div className="admincartManagement-invoice-product-tunch">
                            Purity: {viewItemData.tunch}%
                          </div>
                        )}
                      </td>

                      {/* SKU Column */}
                      <td>{viewItemData.sku || 'N/A'}</td>

                      {/* Category Column */}
                      <td>{viewItemData.category_name || 'N/A'}</td>

                      {/* Subcategory Column */}
                      <td>{viewItemData.subcategory_name || 'N/A'}</td>

                      {/* Sub-subcategory Column */}
                      <td>{viewItemData.sub_subcategory_name || 'N/A'}</td>

                      {/* Size Column */}
                      <td>{viewItemData.selected_size || 'N/A'}</td>

                      {/* Weight Column */}
                      <td>{viewItemData.selected_weight ? `${viewItemData.selected_weight} g` : 'N/A'}</td>

                      {/* Quantity Column */}
                      <td>{viewItemData.quantity || 1}</td>

                      {/* Rate Column */}
                      <td className="admincartManagement-invoice-rate-cell">
                        ₹{parseFloat(viewItemData.sell_price || viewItemData.product_rate || viewItemData.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total Column */}
                      <td className="admincartManagement-invoice-total-cell">
                        ₹{parseFloat(viewItemData.total_price || (viewItemData.final_price || viewItemData.sell_price || 0) * (viewItemData.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Price Breakdown Section */}
              <div className="admincartManagement-invoice-price-breakdown">
                <div className="admincartManagement-invoice-breakdown-row">
                  <span className="admincartManagement-invoice-breakdown-label">Base Price:</span>
                  <span className="admincartManagement-invoice-breakdown-value">
                    ₹{parseFloat(viewItemData.sell_price || viewItemData.product_rate || viewItemData.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {viewItemData.discount && parseFloat(viewItemData.discount) > 0 && (
                  <div className="admincartManagement-invoice-breakdown-row">
                    <span className="admincartManagement-invoice-breakdown-label">Discount ({viewItemData.discount}%):</span>
                    <span className="admincartManagement-invoice-breakdown-value admincartManagement-invoice-discount-breakdown">
                      -₹{((parseFloat(viewItemData.sell_price || viewItemData.product_rate || viewItemData.value || 0) * parseFloat(viewItemData.discount || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="admincartManagement-invoice-breakdown-row admincartManagement-invoice-breakdown-final">
                  <span className="admincartManagement-invoice-breakdown-label">Final Price (per item):</span>
                  <span className="admincartManagement-invoice-breakdown-value admincartManagement-invoice-final-breakdown">
                    ₹{parseFloat(viewItemData.final_price || viewItemData.sell_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="admincartManagement-modal-btn-row">
              <button className="admincartManagement-modal-btn admincartManagement-modal-btn-secondary" onClick={handleViewItemClose}>Close</button>
            </div>
          </div>
        </div>
      )}

      {apiError && <div style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{apiError}</div>}
    </div>
  );
};

export default CartManagement;
