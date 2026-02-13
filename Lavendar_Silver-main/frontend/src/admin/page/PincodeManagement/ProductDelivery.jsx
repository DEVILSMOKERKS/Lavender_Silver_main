import React, { useState } from 'react';
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
  Settings,
  IndianRupee,
  Package
} from 'lucide-react';
import './ProductDelivery.css';

const ProductDelivery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Pincode');

  // Update statsData to match the image
  const statsData = [
    {
      title: 'Active Rules',
      value: '3',
      change: '+3 from last period',
      icon: Settings,
      trend: 'up',
      color: 'green'
    },
    {
      title: 'COD Enabled',
      value: '2',
      change: '+5 from last period',
      icon: IndianRupee,
      trend: 'up',
      color: 'blue'
    },
    {
      title: 'Express Delivery',
      value: '1',
      change: '+2 from last period',
      icon: Package,
      trend: 'up',
      color: 'purple'
    },
    {
      title: 'Avg. ETA',
      value: <><b>2.0 Days</b></>,
      change: <><span style={{ color: 'red' }}>-0.1</span> from last month</>,
      icon: Clock,
      trend: 'down',
      color: 'red'
    }
  ];

  // Update tableData to match the image
  const tableData = [
    {
      id: 1,
      product: 'Product Name',
      category: 'category',
      coverage: '3 Pincode',
      deliveryAvailable: true,
      codAvailable: true,
      eta: '1 Day',
      charges: '₹50',
      priority: 'Standard',
      status: 'Active',
      priorityColor: 'blue',
    },
    {
      id: 2,
      product: 'Product Name',
      category: 'category',
      coverage: '3 Pincode',
      deliveryAvailable: true,
      codAvailable: true,
      eta: '1 Day',
      charges: '₹50',
      priority: 'Standard',
      status: 'Active',
      priorityColor: 'blue',
    },
    {
      id: 3,
      product: 'Product Name',
      category: 'category',
      coverage: '3 Pincode',
      deliveryAvailable: true,
      codAvailable: true,
      eta: '1 Day',
      charges: '₹50',
      priority: 'Express',
      status: 'Active',
      priorityColor: 'purple',
    },
    {
      id: 4,
      product: 'Product Name',
      category: 'category',
      coverage: '3 Pincode',
      deliveryAvailable: true,
      codAvailable: true,
      eta: '1 Day',
      charges: '₹50',
      priority: 'Standard',
      status: 'Active',
      priorityColor: 'blue',
    },
  ];

  const StatCard = ({ title, value, change, icon: Icon, trend, color }) => (
    <div className="adminProductDelivery-stat-card">
      <div className="adminProductDelivery-stat-header">
        <span className="adminProductDelivery-stat-title">{title}</span>
        <div className={`adminProductDelivery-stat-icon ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="adminProductDelivery-stat-value">{value}</div>
      <div className={`adminProductDelivery-stat-change adminProductDelivery-stat-change-${trend}`}>
        <span className="adminProductDelivery-stat-change-arrow">
          {trend === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </span>
        <span className="adminProductDelivery-stat-change-value">{change}</span>
      </div>
    </div>
  );

  return (
    <div className="adminProductDelivery-pincode-management">
      {/* Header */}
      <div className="adminProductDelivery-header">
        <h1 className="adminProductDelivery-page-title">PRODUCT DELIVERY</h1>
      </div>
      <div className="adminProductDelivery-header-controls-box">
        <div className="adminProductDelivery-header-controls">
          <div className="adminProductDelivery-search-container">
            <Search className="adminProductDelivery-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search Product by name and id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adminProductDelivery-search-input"
            />
          </div>

          <div className="adminProductDelivery-filter-dropdown">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="adminProductDelivery-filter-select"
            >
              <option value="All Pincode">All Pincode</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="adminProductDelivery-dropdown-icon" size={16} />
          </div>

          <button className="adminProductDelivery-add-pincode-btn">
            <Plus size={16} />
            Add Custom Rule
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="adminProductDelivery-stats-grid">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Table Section */}
      <div className="adminProductDelivery-table-section">
        <h2 className="adminProductDelivery-table-title">DELIVERY RULES</h2>

        <div className="adminProductDelivery-table-container">
          <table className="adminProductDelivery-data-table">
            <thead>
              <tr>
                <th>
                  <div className="adminProductDelivery-table-header">
                    <ArrowUpDown size={14} className="adminProductDelivery-sort-icon" />
                    <span>PRODUCT</span>
                  </div>
                </th>
                <th>
                  <div className="adminProductDelivery-table-header">
                    <ArrowUpDown size={14} className="adminProductDelivery-sort-icon" />
                    <span>COVERAGE</span>
                  </div>
                </th>
                <th>
                  <div className="adminProductDelivery-table-header">
                    <ArrowUpDown size={14} className="adminProductDelivery-sort-icon" />
                    <span>DELIVERY OPTIONS</span>
                  </div>
                </th>
                <th>
                  <div className="adminProductDelivery-table-header">
                    <ArrowUpDown size={14} className="adminProductDelivery-sort-icon" />
                    <span>ETA & CHARGES</span>
                  </div>
                </th>
                <th>
                  <div className="adminProductDelivery-table-header">
                    <ArrowUpDown size={14} className="adminProductDelivery-sort-icon" />
                    <span>PRIORITY</span>
                  </div>
                </th>
                <th>
                  <div className="adminProductDelivery-table-header">
                    <ArrowUpDown size={14} className="adminProductDelivery-sort-icon" />
                    <span>STATUS</span>
                  </div>
                </th>
                <th>
                  <div className="adminProductDelivery-table-header">
                    <ArrowUpDown size={14} className="adminProductDelivery-sort-icon" />
                    <span>ACTIONS</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.id}>
                  {/* PRODUCT */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Package size={22} style={{ color: '#bdbdbd' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#222', fontSize: 14 }}>Product Name</div>
                        <div style={{ fontSize: 12, color: '#888', textAlign: "start" }}>category</div>
                      </div>
                    </div>
                  </td>
                  {/* COVERAGE */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={16} style={{ color: '#bdbdbd' }} />
                      <span style={{ fontWeight: 500, color: '#222', fontSize: 14 }}>3 Pincode</span>
                    </div>
                  </td>
                  {/* DELIVERY OPTIONS */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                      <a href="#" className='adminProductDelivery-option' style={{ color: '#2a7e7e', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>  <Truck size={14} /> Delivery Available</a>
                      <a href="#" style={{ fontWeight: 500, fontSize: 14, cursor: 'pointer', textAlign: "start", color: "black" }}>COD Available</a>
                    </div>
                  </td>
                  {/* ETA & CHARGES */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} style={{ color: '#bdbdbd' }} />
                        <span style={{ fontSize: 14, color: '#222' }}>1 Day</span>
                      </div>
                      <span style={{ fontSize: 14, color: '#222', textAlign: "start", marginLeft: "15px" }}>₹50</span>
                    </div>
                  </td>
                  {/* PRIORITY */}
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 14px',
                      borderRadius: 12,
                      background: row.priority === 'Express' ? '#f3eaff' : '#DEE9FF',
                      color: row.priority === 'Express' ? '#a259e6' : '#2E62D1',
                      fontWeight: 500,
                      fontSize: 14
                    }}>{row.priority}</span>
                  </td>
                  {/* STATUS */}
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 14px',
                      borderRadius: 12,
                      background: '#D9FFEE',
                      color: 'var(--pvj-green)',
                      fontWeight: 500,
                      fontSize: 14
                    }}>Active</span>
                  </td>
                  {/* ACTIONS */}
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ background: '#eaf4ff', color: '#3a8dde', border: 'none', borderRadius: 4, padding: 6, cursor: 'pointer' }}>
                        <Edit2 size={16} />
                      </button>
                      <button style={{ background: '#ffeaea', color: '#e74c3c', border: 'none', borderRadius: 4, padding: 6, cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
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

export default ProductDelivery;