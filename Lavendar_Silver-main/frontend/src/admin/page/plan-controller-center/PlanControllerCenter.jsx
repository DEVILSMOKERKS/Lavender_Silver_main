import React, { useState, useEffect, useContext } from "react";
import { Search, Download, ChevronDown, ArrowUpDown } from "lucide-react";
import "./PlanControllerCenter.css";
import { AdminContext } from "../../../context/AdminContext";
import axios from "axios";

import blueGroup from "../../../assets/img/icons/blue-group.png";
import blueChecklist from "../../../assets/img/icons/blue-checklist.png";
import approved from "../../../assets/img/icons/approved.png";
import promoCode from "../../../assets/img/icons/promo-code.png";
import deleteImg from "../../../assets/img/icons/delete.png";

const PlanControllerCenter = () => {
  const { token } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [statsData, setStatsData] = useState([]);
  const [installmentData, setInstallmentData] = useState([]);
  const [redemptionData, setRedemptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/goldmine/admin/plan-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const result = response.data;
        const stats = [
          {
            title: "Total Enrolled Users",
            value: result.data.totalEnrolledUsers,
            color: "purple",
            img: blueGroup,
          },
          {
            title: "Active Monthly Plans",
            value: result.data.activeMonthlyPlans,
            img: blueChecklist,
            color: "blue",
          },
          {
            title: "Plans Completed",
            value: result.data.plansCompleted,
            img: approved,
            color: "green",
          },
          {
            title: "Vouchers Issued",
            value: result.data.vouchersIssued,
            img: promoCode,
            color: "pink",
          },
        ];
        setStatsData(stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard statistics');
    }
  };

  // Fetch installment details
  const fetchInstallments = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'All Status') params.status = statusFilter;

      const response = await axios.get(`${API_BASE_URL}/api/goldmine/admin/installments`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setInstallmentData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
      setError('Failed to load installment details');
    }
  };

  // Fetch redemption requests
  const fetchRedemptions = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'All Status') params.status = statusFilter;

      const response = await axios.get(`${API_BASE_URL}/api/goldmine/admin/redemptions`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setRedemptionData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      setError('Failed to load redemption requests');
    }
  };

  // Handle search and filter changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle delete action
  const handleDelete = async (type, id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/goldmine/admin/${type}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh data after deletion
      await Promise.all([fetchInstallments(), fetchRedemptions()]);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };


  // Handle export report
  const handleExportReport = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/goldmine/admin/export-report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Create and download CSV file
        const csvContent = convertToCSV(response.data.data);
        downloadCSV(csvContent, 'plan-controller-report.csv');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report');
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data) => {
    const subscriptions = data.subscriptions || [];
    const redemptions = data.redemptions || [];

    let csv = 'Subscription Number,User Name,Email,Monthly Amount,Status,Paid Months,Start Date,End Date\n';

    subscriptions.forEach(sub => {
      csv += `${sub.subscription_number},${sub.userName},${sub.email},${sub.monthly_amount},${sub.status},${sub.paidMonths}/${sub.totalMonths},${sub.start_date},${sub.end_date}\n`;
    });

    csv += '\nRedemption Requests\n';
    csv += 'User Name,Email,Redemption Month,Redemption Amount,Status,Created At\n';

    redemptions.forEach(red => {
      csv += `${red.userName},${red.email},${red.redemption_month},${red.redemption_amount},${red.status},${red.created_at}\n`;
    });

    return csv;
  };

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Load data on component mount and when search/filter changes
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchStats(),
          fetchInstallments(),
          fetchRedemptions()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchTerm, statusFilter, token]);

  const getPlanStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "admin-plan-center-status-completed";
      case "active":
        return "admin-plan-center-status-active";
      case "pending":
        return "admin-plan-center-status-pending";
      default:
        return "admin-plan-center-status-default";
    }
  };

  const getRedemptionStatusStyle = (status) => {
    switch (status) {
      case "Approved":
        return "admin-plan-center-status-approved";
      case "Pending":
        return "admin-plan-center-status-pending";
      default:
        return "admin-plan-center-status-default";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="admin-plan-center-controller">
        <div className="admin-plan-center-loading">
          <div className="admin-plan-center-spinner"></div>
          <p>Loading plan controller data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="admin-plan-center-controller">
        <div className="admin-plan-center-error">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-plan-center-controller">
      <div className="admin-plan-center-header">
        <h1 className="admin-plan-center-title">11+1 PLAN CONTROL CENTER</h1>

        <div className="admin-plan-center-controls">
          <div className="admin-plan-center-search-container">
            <Search className="admin-plan-center-search-icon" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="admin-plan-center-search-input"
            />
          </div>

          <div className="admin-plan-center-filter-dropdown">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="admin-plan-center-filter-select"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Pending</option>
            </select>
            <ChevronDown className="admin-plan-center-dropdown-icon" />
          </div>

          <div className="admin-plan-center-buttons">
            <button className="admin-plan-center-export-btn" onClick={handleExportReport}>
              <Download className="w-4 h-4" />
              Export Full Report
            </button>

          </div>
        </div>
      </div>

      <div className="admin-plan-center-stats-grid">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={`admin-plan-center-stat-card admin-plan-center-stat-${stat.color}`}
          >
            <div className="admin-plan-center-stat-content">
              <div className="admin-plan-center-stat-text">
                <h3 className="admin-plan-center-stat-title">{stat.title}</h3>
                <p className="admin-plan-center-stat-value">{stat.value}</p>
              </div>
              <div
                className={`admin-plan-center-stat-icon admin-plan-center-stat-icon-${stat.color}`}
              >
                <img
                  src={stat.img}
                  alt={stat.label || "statistic"}
                  className="admin-plan-center-stat-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-plan-center-section">
        <h2 className="admin-plan-center-section-title">
          USER INSTALLMENT DETAILS
        </h2>

        <div className="admin-plan-center-table-container">
          <table className="admin-plan-center-data-table">
            <thead>
              <tr>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    USER NAME
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    MONTHLY AMOUNT
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    PAID MONTHS
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    PLAN STATUS
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    11TH VOUCHER
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    REDEMPTION STATUS
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    ACTIONS
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {installmentData.map((item, index) => (
                <tr key={index}>
                  <td className="admin-plan-center-user-name-cell">
                    {item.userName}
                  </td>
                  <td className="admin-plan-center-amount-cell">
                    {item.monthlyAmount}
                  </td>
                  <td className="admin-plan-center-months-cell">
                    {item.paidMonths}
                  </td>
                  <td>
                    <span
                      className={`admin-plan-center-status-badge ${getPlanStatusStyle(
                        item.planStatus
                      )}`}
                    >
                      {item.planStatus}
                    </span>
                  </td>
                  <td className="admin-plan-center-voucher-cell">
                    {item.hasVoucher}
                  </td>
                  <td className="admin-plan-center-redemption-cell">
                    {item.redemptionStatus}
                  </td>
                  <td className="admin-plan-center-actions-cell">
                    <button
                      className="admin-plan-center-action-btn admin-plan-center-delete-btn"
                      onClick={() => handleDelete('subscription', item.id)}
                      title="Delete subscription"
                    >
                      <img
                        src={deleteImg}
                        alt="delete"
                        height="18px"
                        width="18px"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-plan-center-section">
        <h2 className="admin-plan-center-section-title">
          EARLY REDEMPTION REQUESTS
        </h2>

        <div className="admin-plan-center-table-container">
          <table className="admin-plan-center-data-table">
            <thead>
              <tr>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    USER NAME
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    CURRENT MONTH
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    REQUESTED MONTH
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    STATUS
                  </div>
                </th>
                <th>
                  <div className="admin-plan-center-th-dis">
                    <ArrowUpDown size={12} />
                    ACTIONS
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {redemptionData.map((item, index) => (
                <tr key={index}>
                  <td className="admin-plan-center-user-name-cell">
                    {item.userName}
                  </td>
                  <td className="admin-plan-center-month-cell">
                    {item.currentMonth}
                  </td>
                  <td className="admin-plan-center-request-cell">
                    {item.requestedMonth}
                  </td>
                  <td>
                    <span
                      className={`admin-plan-center-status-badge ${getRedemptionStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="admin-plan-center-actions-cell">
                    <button
                      className="admin-plan-center-action-btn admin-plan-center-delete-btn"
                      onClick={() => handleDelete('redemption', item.id)}
                      title="Delete redemption request"
                    >
                      <img
                        src={deleteImg}
                        alt="delete"
                        height="18px"
                        width="18px"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanControllerCenter;
