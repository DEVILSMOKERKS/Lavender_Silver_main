import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { IndianRupee, ShoppingBag, Users, Wallet } from "lucide-react";
import "./dashboard.css";
import { AdminContext } from '../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const { token } = useContext(AdminContext);

  // State for each section
  const [stats, setStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  // Fetch all dashboard data in parallel
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
      axios.get(`${API_BASE_URL}/api/admin/orders?limit=5`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
      axios.get(`${API_BASE_URL}/api/admin/products/performance`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
      axios.get(`${API_BASE_URL}/api/admin/consultations`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
      axios.get(`${API_BASE_URL}/api/admin/support-tickets?limit=5`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
      axios.get(`${API_BASE_URL}/api/admin/dashboard/payment-status`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
    ])
      .then(([statsRes, ordersRes, prodPerfRes, consRes, ticketsRes, paymentStatusRes]) => {
        // stats
        setStats(statsRes.data.data ? [
          { title: "Total Sales", value: `₹${Number(statsRes.data.data.total_sales || 0).toLocaleString('en-IN')}`, icon: "rupee" },
          { title: "Total Orders", value: statsRes.data.data.total_orders || 0, icon: "bag" },
          { title: "New Customers", value: statsRes.data.data.new_customers || 0, icon: "users" },
          { title: "Total Revenue", value: `₹${Number(statsRes.data.data.total_revenue || 0).toLocaleString('en-IN')}`, icon: "wallet" },
        ] : []);
        setOrders(ordersRes.data.data || []);
        setProductPerformance(prodPerfRes.data.data || []);
        setConsultations(consRes.data.data || []);
        setSupportTickets(ticketsRes.data.data || []);
        setPaymentStatus(paymentStatusRes.data.data && paymentStatusRes.data.data.length ? paymentStatusRes.data.data : [
          { label: "Completed", value: 328 },
          { label: "Pending", value: 28 },
          { label: "Failed", value: 38 },
          { label: "Refunded", value: 38 },
        ]);
      })
      .catch(() => {
        setError("Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  }, [token]);


  // Fetch order details for popup
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setShowOrderPopup(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  // Lucide icon map for top-right
  const StatIcon = ({ type }) => {
    let IconComponent;
    switch (type) {
      case "rupee":
        IconComponent = IndianRupee;
        break;
      case "bag":
        IconComponent = ShoppingBag;
        break;
      case "users":
        IconComponent = Users;
        break;
      case "wallet":
        IconComponent = Wallet;
        break;
      default:
        return null;
    }
    return (
      <span className="dashboard-stat-icon-bg dashboard-stat-icon-bg-outline">
        <IconComponent size={20} stroke="#1dbf73" />
      </span>
    );
  };

  // Payment status color/class map
  const paymentStatusClassMap = {
    Completed: { bar: "payment-bar-completed", dot: "dot-completed" },
    Pending: { bar: "payment-bar-pending", dot: "dot-pending" },
    Failed: { bar: "payment-bar-failed", dot: "dot-failed" },
    Refunded: { bar: "payment-bar-refunded", dot: "dot-refunded" },
  };
  const totalPayments = paymentStatus.reduce((sum, s) => sum + s.value, 0);
  const getBarWidth = (val) => totalPayments ? `${(val / totalPayments) * 100}%` : '0%';

  // Loading/Error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  // Fallbacks for empty data (to keep UI stable)
  const statsData = stats.length ? stats : [
    { title: "Total Sales", value: "₹0", icon: "rupee" },
    { title: "Total Orders", value: "0", icon: "bag" },
    { title: "New Customers", value: "0", icon: "users" },
    { title: "Total Revenue", value: "₹0", icon: "wallet" },
  ];

  return (
    <div className="dashboard-container">
      {/* =====================
          Top Stats Cards
      ===================== */}
      <div className="dashboard-stats">
        {statsData.map((stat, i) => (
          <div className="dashboard-card dashboard-card-modern" key={i}>
            <div className="dashboard-card-header">
              <div>
                <div className="dashboard-card-title">{stat.title}</div>
                <div className="dashboard-card-value">{stat.value}</div>

              </div>
              <StatIcon type={stat.icon} />
            </div>
          </div>
        ))}
      </div>

      {/* =====================
          Recent Orders Table
      ===================== */}
      <div className="recent-orders-section dashboard-section-gap">
        <div
          className="recent-orders-title"
        >
          <span>Recent Orders</span>
          <Link to="/admin/orders/orders-management" className="dashboard-viewall-btn">View all</Link>
        </div>
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="order-id">Order ID</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(orders.length ? orders : []).map((order, i) => (
                <tr key={i} style={{ cursor: order.id ? 'pointer' : 'default' }}>
                  <td className="order-id">
                    <span className="order-id-link" onClick={() => fetchOrderDetails(order.id)}>{order.id}</span>
                  </td>
                  <td className="customer-name">{order.customer}</td>
                  <td className="product-name">{order.product_count || 0} items</td>
                  <td>
                    <b>{order.amount}</b>
                  </td>
                  <td>
                    <span className={`status-badge status-${(order.status || '').toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="order-date">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div >

      {/* =====================
          Product Performance Section
      ===================== */}
      <div className="dashboard-product-performance">
        <div className="product-performance-header">
          <span>Product Performance</span>
          <Link to="/admin/products/listing" className="dashboard-viewall-btn">View Report</Link>
        </div>
        <div className="product-performance-table-wrapper">
          <table className="product-performance-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Sales</th>
                <th>Growth</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(productPerformance.length ? productPerformance : []).map((row, i) => (
                <tr key={i}>
                  <td className="product-name">
                    <b>{row.product || 'Unknown Product'}</b>
                  </td>
                  <td>{row.category || 'Uncategorized'}</td>
                  <td>{row.sales || 0}</td>
                  <td className="product-growth">{row.growth || '+0%'}</td>
                  <td>₹{Number(row.revenue || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div >

      {/* =====================
          Consultations & Support Tickets Section
      ===================== */}
      <div className="dashboard-bottom-row">
        {/* Upcoming Consultations */}
        <div className="dashboard-consultations">
          <div className="consultations-header">
            <span>Upcoming Consultations</span>
            <Link to="/admin/orders/video-consultations" className="dashboard-viewall-btn">View all</Link>
          </div>
          <div className="consultations-list">
            {(consultations.length ? consultations : []).map((c, i) => (
              <div
                className={`consultation-card consultation-${(c.status || '').toLowerCase()}`}
                key={i}
              >
                <div className="consultation-main-row">
                  <span className="consultation-name">{c.name}</span>
                  <span
                    className={`consultation-status consultation-status-${(c.status || '').toLowerCase()}`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="consultation-details-row">
                  <span className="consultation-type">{c.type}</span>
                  <span className="consultation-date"> • {c.date}</span>
                  <span className="consultation-time"> • {c.time}</span> 
                </div>
              </div>
            ))}
          </div>
        </div >
        {/* Support Tickets */}
        < div className="dashboard-support-tickets" >
          <div className="support-tickets-header">
            <span>Support Tickets</span>
            <Link to="/admin/user-management/support-ticket" className="dashboard-viewall-btn">View all</Link>
          </div>
          <div className="support-tickets-list">
            {(supportTickets.length ? supportTickets : []).map((t, i) => (
              <div className="support-ticket-card" key={i}>
                <div className="support-ticket-main-row">
                  <span className="support-ticket-title">{t.title}</span>
                  <span className="support-ticket-time">{t.time}</span>
                </div>
                <div className="support-ticket-details-row">
                  <span className="support-ticket-user">{t.user}</span>
                  <span className="support-ticket-id">{t.ticketId}</span>
                  <div className="support-ticket-badges">
                    <span
                      className={`support-ticket-priority support-ticket-priority-${(t.priority || '').toLowerCase()}`}
                    >
                      {t.priority}
                    </span>
                    <span
                      className={`support-ticket-status support-ticket-status-${(t.status || '').toLowerCase().replace(/ /g, "-")}`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div >
      </div >
      {
        showOrderPopup && selectedOrder && (
          <div className="order-popup-overlay" onClick={() => setShowOrderPopup(false)}>
            <div className="order-popup" onClick={(e) => e.stopPropagation()}>
              <div className="order-popup-header">
                <h3>Order Details - #{selectedOrder.order_number}</h3>
                <button
                  className="order-popup-close"
                  onClick={() => setShowOrderPopup(false)}
                >
                  ×
                </button>
              </div>
              <div className="order-popup-content">
                <div className="order-info-section">
                  <h4>Order Information</h4>
                  <div className="order-info-grid">
                    <div className="order-info-item">
                      <span className="info-label">Order ID:</span>
                      <span className="info-value">{selectedOrder.order_number}</span>
                    </div>
                    <div className="order-info-item">
                      <span className="info-label">Customer:</span>
                      <span className="info-value">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="order-info-item">
                      <span className="info-label">Total Amount:</span>
                      <span className="info-value">₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="order-info-item">
                      <span className="info-label">Payment Status:</span>
                      <span className={`info-value status-${selectedOrder.payment_status}`}>
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                    <div className="order-info-item">
                      <span className="info-label">Order Status:</span>
                      <span className={`info-value status-${selectedOrder.order_status}`}>
                        {selectedOrder.order_status}
                      </span>
                    </div>
                    <div className="order-info-item">
                      <span className="info-label">Order Date:</span>
                      <span className="info-value">
                        {new Date(selectedOrder.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-products-section">
                  <h4>Products ({selectedOrder.products?.length || 0} items)</h4>
                  <div className="order-products-list">
                    {selectedOrder.products && selectedOrder.products.length > 0 ? (
                      selectedOrder.products.map((product, index) => (
                        <div key={index} className="order-product-item">
                          <div className="product-info">
                            <span className="product-name">{product.product_name}</span>
                            <span className="product-quantity">Qty: {product.quantity}</span>
                          </div>
                          <div className="product-price">
                            <span className="price">₹{Number(product.price).toLocaleString('en-IN')}</span>
                            <span className="total-price">₹{Number(product.price * product.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-products">No products found</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Dashboard;