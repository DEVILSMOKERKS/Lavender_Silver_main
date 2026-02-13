import React, { useState, useEffect, useContext } from 'react';
import {
  Search,
  TrendingUp,
  Users,
  IndianRupee,
  Coins,
  ChevronDown,
  ArrowUpDown,
  User
} from 'lucide-react';
import './DigitalGoldOverview.css';
import deleteImg from '../../../assets/img/icons/delete.png';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';
import UserDetailsModal from './UserDetailsModal';
import DeleteTransactionModal from './DeleteTransactionModal';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DigitalGoldOverview = () => {
  const { token } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [rateData, setRateData] = useState({ data: [], domain: ['auto', 'auto'] });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [combinedMetalOptions, setCombinedMetalOptions] = useState([]);
  const [selectedCombinedOption, setSelectedCombinedOption] = useState('');
  const [chartSubtitle, setChartSubtitle] = useState('Gold 24k - Historical & Forecasted Rates');
  const [chartMetalFilter, setChartMetalFilter] = useState('Gold'); // For switching between Gold/Silver in chart
  const [isChartVisible, setIsChartVisible] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch digital gold stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/digital-gold/stats`);
      if (response.data.success) {
        const stats = response.data.data;
        setStatsData([
          {
            title: 'Total Gold Sold',
            value: stats.totalGoldSold,
            icon: <Coins className="w-5 h-5" />,
            color: 'green'
          },
          {
            title: 'Total Investment',
            value: stats.totalInvestment,
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'blue'
          },
          {
            title: 'Active Users',
            value: stats.activeUsers,
            icon: <Users className="w-5 h-5" />,
            color: 'purple'
          },
          {
            title: 'Gold Rate Today 24k',
            value: stats.currentGoldRate,
            icon: <IndianRupee className="w-5 h-5" />,
            color: 'pink'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showNotification('Error fetching digital gold stats', 'error');
    }
  };

  // Fetch all transactions once (for client-side filtering)
  const fetchTransactions = async () => {
    try {
      const params = {
        page: 1,
        limit: 1000 // Fetch all transactions for client-side filtering
      };

      const response = await axios.get(`${API_BASE_URL}/api/digital-gold/transactions`, { params });
      if (response.data.success) {
        const mappedData = response.data.data.map(tx => ({
          userName: tx.user_name,
          type: tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1),
          amount: `₹${parseFloat(tx.total_amount).toLocaleString()}`,
          gold: `${parseFloat(tx.gold_grams).toFixed(1)}g`,
          date: new Date(tx.created_at).toLocaleDateString('en-US'),
          status: tx.transaction_status.charAt(0).toUpperCase() + tx.transaction_status.slice(1),
          id: tx.id,
          user_id: tx.user_id,
          metal_type: tx.metal_type || 'Gold',
          purity_name: tx.metal_purity || '24K',
          purity_value: tx.metal_purity === '24K' ? '99.00' : tx.metal_purity === '22K' ? '91.67' : '75.00',
          original_metal_type: tx.metal_type || 'Gold',
          original_purity_name: tx.metal_purity || '24K'
        }));
        setAllTransactions(mappedData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('Error fetching transactions', 'error');
    }
  };

  // Helper function to parse forecast_period and calculate date
  const calculateForecastDate = (baseDate, forecastPeriod) => {
    if (!forecastPeriod) return baseDate;
    
    const period = forecastPeriod.toLowerCase().trim();
    const date = new Date(baseDate);
    
    // Parse different formats: "24 hours", "5 days", "3 months", etc.
    const hoursMatch = period.match(/(\d+)\s*hour/);
    const daysMatch = period.match(/(\d+)\s*day/);
    const monthsMatch = period.match(/(\d+)\s*month/);
    const weeksMatch = period.match(/(\d+)\s*week/);
    
    if (hoursMatch) {
      date.setHours(date.getHours() + parseInt(hoursMatch[1]));
    } else if (daysMatch) {
      date.setDate(date.getDate() + parseInt(daysMatch[1]));
    } else if (weeksMatch) {
      date.setDate(date.getDate() + (parseInt(weeksMatch[1]) * 7));
    } else if (monthsMatch) {
      date.setMonth(date.getMonth() + parseInt(monthsMatch[1]));
    } else {
      // Default to 24 hours if format not recognized
      date.setHours(date.getHours() + 24);
    }
    
    return date;
  };

  // Fetch rate trend data from prediction management based on selected metal and purity
  const fetchRateTrendData = async (metalName = 'Gold', purityName = '24K', predictionMetal = null) => {
    try {
      // Fetch all predictions from admin API
      const predictionsResponse = await axios.get(`${API_BASE_URL}/api/metal-rates/predictions/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let chartData = [];
      let minRate = null;
      let maxRate = null;

      // Find prediction for predictionMetal (Gold/Silver toggle) or chartMetalFilter
      const metalForPrediction = predictionMetal || chartMetalFilter;
      let selectedPrediction = null;
      if (predictionsResponse.data.success && Array.isArray(predictionsResponse.data.data)) {
        selectedPrediction = predictionsResponse.data.data.find(
          pred => pred.metal_type === metalForPrediction && pred.is_active === 1
        );
      }

      // Add prediction data if available - only 2 points: current price and predicted price
      if (selectedPrediction) {
        const currentPrice = parseFloat(selectedPrediction.current_price) || 6000;
        const predictedPrice = parseFloat(selectedPrediction.predicted_price) || currentPrice;
        
        // Get updated_at date from prediction (this is the "Update at" column) - First point
        const updatedAtDate = selectedPrediction.updated_at 
          ? new Date(selectedPrediction.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        
        // Calculate forecast date based on forecast_period - Second point
        const forecastPeriod = selectedPrediction.forecast_period || '24 hours';
        const forecastDate = calculateForecastDate(updatedAtDate, forecastPeriod);
        const forecastDateStr = forecastDate.toISOString().split('T')[0];
        
        // Set min/max rates
        minRate = Math.min(currentPrice, predictedPrice);
        maxRate = Math.max(currentPrice, predictedPrice);
        
        // Add only 2 points: current price and predicted price
        // Add a connecting value for the line between dots
        const roundedCurrentPrice = Math.round(currentPrice);
        const roundedPredictedPrice = Math.round(predictedPrice);
        
        chartData = [
          {
            date: updatedAtDate,
            currentPrice: roundedCurrentPrice,
            connectingValue: roundedCurrentPrice // For connecting line
          },
          {
            date: forecastDateStr,
            predicted: roundedPredictedPrice,
            connectingValue: roundedPredictedPrice // For connecting line
          }
        ];
      } else {
        // Fallback: if no prediction data, show empty chart
        chartData = [];
        minRate = null;
        maxRate = null;
      }

      // Update chart subtitle
      setChartSubtitle(`${metalName} ${purityName} - Historical & Forecasted Rates`);

      // Set Y-axis domain with padding
      if (minRate !== null && maxRate !== null && chartData.length > 0) {
        const padding = Math.max((maxRate - minRate) * 0.15, 500); // At least 500 padding
        setRateData({
          data: chartData,
          domain: [Math.max(0, Math.floor(minRate - padding)), Math.ceil(maxRate + padding)]
        });
      } else {
        setRateData({
          data: chartData,
          domain: ['auto', 'auto']
        });
      }
    } catch (error) {
      console.error('Error fetching rate trend data:', error);
      showNotification('Error fetching rate trend data', 'error');
    }
  };




  // Fetch metal types and purities dynamically from rate-update API
  const fetchMetalTypesAndPurities = async () => {
    try {
      // Fetch metal types from rate-update API
      const metalTypesResponse = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types`);
      
      if (!metalTypesResponse.data.success || !Array.isArray(metalTypesResponse.data.data)) {
        console.error('Invalid metal types response:', metalTypesResponse.data);
        showNotification('Failed to fetch metal types', 'error');
        setCombinedMetalOptions([]);
        return;
      }

      const metalTypesData = metalTypesResponse.data.data;

      // Fetch purities for each metal type and create combined options
      const combined = [];

      for (const metal of metalTypesData) {
        try {
          const puritiesResponse = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types/${metal.id}/purities`);
          
          if (puritiesResponse.data.success && Array.isArray(puritiesResponse.data.data)) {
            const purities = puritiesResponse.data.data;

            // Create combined options for this metal type
            purities.forEach(purity => {
              combined.push({
                id: `${metal.id}-${purity.id}`,
                metalTypeId: metal.id,
                purityId: purity.id,
                label: `${metal.name} ${purity.purity_name}`,
                metalName: metal.name,
                purityName: purity.purity_name,
                purityValue: purity.purity_value || '0'
              });
            });
          }
        } catch (purityError) {
          console.error(`Error fetching purities for metal type ${metal.id}:`, purityError);
        }
      }

      setCombinedMetalOptions(combined);
    } catch (error) {
      console.error('Error fetching metal types and purities:', error);
      showNotification('Error fetching metal types and purities', 'error');
      setCombinedMetalOptions([]);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStats(),
          fetchTransactions(),
          fetchMetalTypesAndPurities()
        ]);
        // Fetch initial chart data for Gold 24K
        await fetchRateTrendData('Gold', '24K', 'Gold');
      } catch (error) {
        console.error('Error initializing data:', error);
        showNotification('Error loading digital gold data', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show delete confirmation modal
  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  // Delete transaction after confirmation
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/digital-gold/transactions/${transactionToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showNotification('Transaction deleted successfully', 'success');
        // Remove from allTransactions (client-side update)
        setAllTransactions(prev => prev.filter(tx => tx.id !== transactionToDelete.id));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showNotification('Error deleting transaction', 'error');
    } finally {
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  const handleViewUserDetails = async (userId) => {
    try {
      // Fetch user details and transactions
      const [userResponse, transactionsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/digital-gold/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/digital-gold/transactions?user_id=${userId}`)
      ]);

      const userData = {
        ...userResponse.data.data,
        recent_transactions: transactionsResponse.data.data.slice(0, 5)
      };

      setSelectedUser(userData);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      showNotification('Error loading user details', 'error');
    }
  };

  const handleCombinedOptionChange = (e) => {
    const selectedId = e.target.value;
    setSelectedCombinedOption(selectedId);
    // Chart will update via useEffect
  };

  // Update chart when select option or chart metal filter changes
  useEffect(() => {
    if (selectedCombinedOption && combinedMetalOptions.length > 0) {
      const selectedOption = combinedMetalOptions.find(option => option.id === selectedCombinedOption);
      if (selectedOption) {
        // Use selected option's metal for historical data, chartMetalFilter for predictions
        fetchRateTrendData(selectedOption.metalName, selectedOption.purityName, chartMetalFilter);
      }
    } else {
      // Reset to default based on chartMetalFilter
      fetchRateTrendData(chartMetalFilter, '24K', chartMetalFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCombinedOption, combinedMetalOptions, chartMetalFilter]);

  // Client-side filtering for transactions
  useEffect(() => {
    let filtered = [...allTransactions];

    // Filter by selected metal and purity
    if (selectedCombinedOption) {
      const selectedOption = combinedMetalOptions.find(option => option.id === selectedCombinedOption);
      if (selectedOption) {
        filtered = filtered.filter(tx => {
          const metalMatch = tx.original_metal_type?.toLowerCase() === selectedOption.metalName?.toLowerCase();
          const purityMatch = tx.original_purity_name?.toLowerCase() === selectedOption.purityName?.toLowerCase();
          return metalMatch && purityMatch;
        });
      }
    }

    // Filter by type
    if (typeFilter !== 'All Types') {
      filtered = filtered.filter(tx => tx.type.toLowerCase() === typeFilter.toLowerCase());
    }

    // Filter by status
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter(tx => tx.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.userName?.toLowerCase().includes(searchLower) ||
        tx.metal_type?.toLowerCase().includes(searchLower) ||
        tx.purity_name?.toLowerCase().includes(searchLower)
      );
    }

    setTransactionData(filtered);
  }, [allTransactions, selectedCombinedOption, typeFilter, statusFilter, searchTerm, combinedMetalOptions]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Success':
        return 'status-success';
      case 'Pending':
        return 'status-pending';
      default:
        return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="admin-digi-go-over">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading digital gold data...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-digi-go-over">
      <div className="admin-digi-go-over-header">
        <h1 className="admin-digi-go-over-title">DIGITAL GOLD</h1>

        <div className="admin-digi-go-over-controls">
          <div className="admin-digi-go-over-search-container">
            <Search className="admin-digi-go-over-search-icon" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-digi-go-over-search-input"
            />
          </div>

          <div className="admin-digi-go-over-filters">
            <div className="admin-digi-go-over-filter-dropdown">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="admin-digi-go-over-filter-select"
              >
                <option>All Types</option>
                <option>Buy</option>
                <option>Sell</option>
              </select>
              <ChevronDown className="admin-digi-go-over-dropdown-icon" />
            </div>

            <div className="admin-digi-go-over-filter-dropdown">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-digi-go-over-filter-select"
              >
                <option>All Status</option>
                <option>Success</option>
                <option>Pending</option>
              </select>
              <ChevronDown className="admin-digi-go-over-dropdown-icon" />
            </div>
          </div>

          <div className="admin-digi-go-over-metal-selector">
            <div className="admin-digi-go-over-select-group">
              <select
                value={selectedCombinedOption}
                onChange={handleCombinedOptionChange}
                className="admin-digi-go-over-select"
              >
                <option value="">Select Metal & Purity</option>
                {combinedMetalOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({option.purityValue}%)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-digi-go-over-stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className={`admin-digi-go-over-stat-card stat-${stat.color}`}>
            <div className="admin-digi-go-over-stat-content">
              <div className="admin-digi-go-over-stat-text">
                <h3 className="admin-digi-go-over-stat-title">{stat.title}</h3>
                <p className="admin-digi-go-over-stat-value">{stat.value}</p>
              </div>
              <div className={`admin-digi-go-over-stat-icon admin-digi-go-over-stat-icon-${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-digi-go-over-content-row">
        <div className="admin-digi-go-over-chart-section">
          <div className="admin-digi-go-over-chart-container">
            <div className="admin-digi-go-over-chart-header">
              <div>
                <h3 className="admin-digi-go-over-chart-title">RATE TREND & PREDICTION</h3>
                <p className="admin-digi-go-over-chart-subtitle">{chartSubtitle}</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="admin-digi-go-over-chart-legend">
                  <div className="admin-digi-go-over-legend-item">
                    <div className="admin-digi-go-over-legend-dot" style={{ background: '#10b981', width: '12px', height: '12px', borderRadius: '50%' }}></div>
                    <span className="admin-digi-go-over-legend-label">Current Price</span>
                  </div>
                  <div className="admin-digi-go-over-legend-item">
                    <div className="admin-digi-go-over-legend-dot predicted"></div>
                    <span className="admin-digi-go-over-legend-label">Predicted</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid #e5e7eb', paddingLeft: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: "'Open Sans', sans-serif" }}>Prediction:</span>
                  <button
                    onClick={() => {
                      setChartMetalFilter('Gold');
                      const selectedOption = selectedCombinedOption ? combinedMetalOptions.find(opt => opt.id === selectedCombinedOption) : null;
                      fetchRateTrendData(selectedOption ? selectedOption.metalName : 'Gold', selectedOption ? selectedOption.purityName : '24K', 'Gold');
                    }}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: chartMetalFilter === 'Gold' ? '#0E593C' : 'white',
                      color: chartMetalFilter === 'Gold' ? 'white' : '#232323',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: chartMetalFilter === 'Gold' ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    Gold
                  </button>
                  <button
                    onClick={() => {
                      setChartMetalFilter('Silver');
                      const selectedOption = selectedCombinedOption ? combinedMetalOptions.find(opt => opt.id === selectedCombinedOption) : null;
                      fetchRateTrendData(selectedOption ? selectedOption.metalName : 'Silver', selectedOption ? selectedOption.purityName : '24K', 'Silver');
                    }}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: chartMetalFilter === 'Silver' ? '#0E593C' : 'white',
                      color: chartMetalFilter === 'Silver' ? 'white' : '#232323',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: chartMetalFilter === 'Silver' ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    Silver
                  </button>
                </div>
                <button 
                  onClick={() => setIsChartVisible(!isChartVisible)}
                  className="admin-digi-go-over-chart-toggle-btn"
                  title={isChartVisible ? "Hide Chart" : "Show Chart"}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    transition: 'all 0.2s'
                  }}
                >
                  <ChevronDown 
                    style={{ 
                      transform: isChartVisible ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }} 
                    size={20} 
                  />
                </button>
              </div>
            </div>
            
            {isChartVisible && (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={rateData?.data || []} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#bdbdbd" strokeDasharray="3 3" fill="#fdf6ed" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#232323', fontFamily: "'Open Sans', sans-serif", fontWeight: "400" }} axisLine={false} tickLine={false} />
                  <YAxis domain={rateData?.domain || ['auto', 'auto']} tick={{ fontSize: 12, fill: '#232323', fontFamily: "'Open Sans', sans-serif", }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `₹${value} per gram`} contentStyle={{ borderRadius: 8, border: '1px solid #059669', background: '#fff', color: '#059669', fontWeight: 600 }} labelStyle={{ color: '#232323', fontWeight: 500 }} />
                  {/* Connecting line between current price and predicted price - must be first to render behind dots */}
                  <Line 
                    type="linear" 
                    dataKey="connectingValue"
                    stroke="#6b7280" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls={true}
                    name=""
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="currentPrice" 
                    stroke="#10b981" 
                    dot={{ r: 10, fill: '#10b981', stroke: 'white', strokeWidth: 2 }} 
                    activeDot={{ r: 12, fill: '#10b981', stroke: 'white', strokeWidth: 2 }} 
                    name="Current Price" 
                    strokeWidth={0} 
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#F14344" 
                    dot={{ r: 10, fill: '#F14344', stroke: 'white', strokeWidth: 2 }} 
                    activeDot={{ r: 12, fill: '#dc2626', stroke: 'white', strokeWidth: 2 }} 
                    name="Predicted" 
                    strokeWidth={0} 
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="admin-digi-go-over-bottom-row">
        <div className="admin-digi-go-over-transactions-section">
          <div className="admin-digi-go-over-transactions-container">
            <h3 className="admin-digi-go-over-transactions-title">DIGITAL GOLD TRANSACTIONS SUMMARY</h3>

            <div className="admin-digi-go-over-transactions-table">
              <div className="admin-digi-go-over-transactions-header">
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />USER NAME</span></div>
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />TYPE</span></div>
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />METAL & PURITY</span></div>
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />AMOUNT (₹)</span></div>
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />GOLD (G)</span></div>
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />DATE</span></div>
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />STATUS</span></div>
                <div className="admin-digi-go-over-trans-col"><span className="admin-digi-go-over-header-flex"><ArrowUpDown className="admin-digi-go-over-header-icon" />ACTIONS</span></div>
              </div>

              {transactionData.map((item, index) => (
                <div key={index} className="admin-digi-go-over-transactions-row">
                  <div className="admin-digi-go-over-trans-col admin-digi-go-over-user-col">
                    <button
                      className="user-name-btn"
                      onClick={() => handleViewUserDetails(item.user_id)}
                    >
                      <User size={14} />
                      {item.userName}
                    </button>
                  </div>
                  <div className="admin-digi-go-over-trans-col">
                    <span className={`admin-digi-go-over-type-badge admin-digi-go-over-type-${item.type.toLowerCase()}`}>{item.type}</span>
                  </div>
                  <div className="admin-digi-go-over-trans-col admin-digi-go-over-metal-purity-col">
                    <div className="admin-digi-go-over-metal-info">
                      <span className="admin-digi-go-over-metal-type">{item.metal_type}</span>
                      <span className="admin-digi-go-over-purity">{item.purity_name} ({item.purity_value}%)</span>
                    </div>
                  </div>
                  <div className="admin-digi-go-over-trans-col admin-digi-go-over-amount-col">{item.amount}</div>
                  <div className="admin-digi-go-over-trans-col admin-digi-go-over-gold-col">{item.gold}</div>
                  <div className="admin-digi-go-over-trans-col admin-digi-go-over-date-col">{item.date}</div>
                  <div className="admin-digi-go-over-trans-col">
                    <span className={`admin-digi-go-over-status-badge ${getStatusStyle(item.status).replace('status-', 'admin-digi-go-over-status-')}`}>{item.status}</span>
                  </div>
                  <div className="admin-digi-go-over-trans-col admin-digi-go-over-actions-col">
                    <div className="admin-digi-go-over-action-buttons">
                      <button
                        className="admin-digi-go-over-action-btn admin-digi-go-over-delete-btn"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <img src={deleteImg} alt="delete" height="18px" width="18px" loading="lazy" decoding="async" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        userData={selectedUser}
      />

      {/* Delete Transaction Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteTransaction}
        transactionData={transactionToDelete}
      />

    </div>
  );
};

export default DigitalGoldOverview;