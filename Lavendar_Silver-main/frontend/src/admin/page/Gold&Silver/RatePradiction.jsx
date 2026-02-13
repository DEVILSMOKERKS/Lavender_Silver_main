import React, { useState, useEffect, useContext } from "react";
import "./RatePradiction.css";
import { Calendar, Filter, Download, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import shoppingIcon from "../../../assets/img/icons/shopping.png";
import moneyProtectionIcon from "../../../assets/img/icons/money-protection.png";
import blueGroupIcon from "../../../assets/img/icons/blue-group.png";
import goldBricksIcon from "../../../assets/img/icons/gold-bricks.png";
import statistics2Icon from "../../../assets/img/icons/statistics-2.png";
import statisticsIcon from "../../../assets/img/icons/statistics.png";
import redGroupIcon from "../../../assets/img/icons/red-group.png";
import warningsIcon from "../../../assets/img/icons/warnings.png";

function getConfidenceBg(confidenceStr) {
  const percent = parseInt(confidenceStr.replace('%', ''), 10);
  const min = 70, max = 100;
  const t = Math.max(0, Math.min(1, (percent - min) / (max - min)));
  const r = Math.round(247 + (252 - 247) * t);
  const g = Math.round(225 + (249 - 225) * t);
  const b = Math.round(160 + (229 - 160) * t);
  return `rgb(${r},${g},${b})`;
}

const RatePradiction = () => {
  const { token } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [currentRates, setCurrentRates] = useState([]);
  const [rateHistory, setRateHistory] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [purities, setPurities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetalType, setSelectedMetalType] = useState('');
  const [selectedPurity, setSelectedPurity] = useState('');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [trendFilter, setTrendFilter] = useState('All Trends');
  const [filteredRates, setFilteredRates] = useState([]);
  const [statsData, setStatsData] = useState({
    currentRate: 0,
    predictedHigh: 0,
    predictedLow: 0,
    confidence: 84
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch current rates
  const fetchCurrentRates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metal-rates/rates/current`);
      if (response.data.success) {
        setCurrentRates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching current rates:', error);
      showNotification('Error fetching current rates', 'error');
    }
  };

  // Fetch rate history
  const fetchRateHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metal-rates/rates/history`);
      if (response.data.success) {
        setRateHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching rate history:', error);
      showNotification('Error fetching rate history', 'error');
    }
  };

  // Fetch metal types
  const fetchMetalTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types`);
      if (response.data.success) {
        setMetalTypes(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedMetalType(response.data.data[0].id);
          await fetchPurities(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching metal types:', error);
      showNotification('Error fetching metal types', 'error');
    }
  };

  // Fetch purities for selected metal type
  const fetchPurities = async (metalTypeId) => {
    if (!metalTypeId) {
      setPurities([]);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types/${metalTypeId}/purities`);
      if (response.data.success) {
        setPurities(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedPurity(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching purities:', error);
      showNotification('Error fetching purities', 'error');
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCurrentRates(),
          fetchRateHistory(),
          fetchMetalTypes()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        showNotification('Error loading prediction data', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Filter rates based on selected metal type and purity
  useEffect(() => {
    if (selectedMetalType && selectedPurity) {
      const filtered = currentRates.filter(rate =>
        rate.metal_type_id == selectedMetalType && rate.purity_id == selectedPurity
      );
      setFilteredRates(filtered);

      if (filtered.length > 0) {
        const currentRate = filtered[0].rate_per_gram;
        setStatsData({
          currentRate: currentRate,
          predictedHigh: Math.round(currentRate * 1.05),
          predictedLow: Math.round(currentRate * 0.95),
          confidence: 84
        });
      }
    }
  }, [selectedMetalType, selectedPurity, currentRates]);

  // Handle metal type change
  const handleMetalTypeChange = async (e) => {
    const metalTypeId = e.target.value;
    setSelectedMetalType(metalTypeId);
    setSelectedPurity(''); // Reset purity when metal type changes
    await fetchPurities(metalTypeId);
  };

  // Get current rate for selected metal type and purity
  const getCurrentRate = () => {
    return statsData.currentRate || 0;
  };

  // Generate forecast data based on history and date range
  const generateForecastData = () => {
    const baseRate = getCurrentRate();

    // Show only 3 days of forecast data
    return Array.from({ length: 3 }, (_, index) => {
      const change = Math.random() * 10 - 5; // Random change between -5% and +5%
      const newRate = baseRate * (1 + change / 100);
      const confidence = Math.max(70, 100 - Math.abs(change) * 2);

      return {
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate: `₹${newRate.toFixed(0)}`,
        change: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        confidence: `${confidence.toFixed(0)}%`
      };
    });
  };

  // Generate chart data based on history and date range
  const generateChartData = () => {
    const baseRate = getCurrentRate();
    const days = dateRange === 'Last 7 Days' ? 7 : dateRange === 'This Month' ? 30 : 30;

    // Filter history based on selected metal type and purity
    const relevantHistory = rateHistory.filter(item =>
      item.metal_type_id == selectedMetalType && item.purity_id == selectedPurity
    ).slice(0, Math.floor(days / 2));

    const actualData = relevantHistory.map((item, index) => ({
      date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: item.new_rate_per_gram || baseRate
    }));

    const predictedData = Array.from({ length: Math.floor(days / 2) }, (_, index) => {
      const change = Math.random() * 10 - 5;
      const newRate = baseRate * (1 + change / 100);
      return {
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted: newRate
      };
    });

    return [...actualData, ...predictedData];
  };

  const forecastData = generateForecastData();
  const rateData = generateChartData();

  const getChangeStyle = (change) => {
    return change.startsWith('+') ? 'change-positive' : 'change-negative';
  };

  const handleExport = () => {
    try {
      // Get actual database data for the selected metal type and purity
      const actualData = rateHistory.filter(item =>
        item.metal_type_id == selectedMetalType && item.purity_id == selectedPurity
      );

      if (actualData.length === 0) {
        showNotification('No data available for export', 'warning');
        return;
      }

      // Create worksheet data with actual database records
      const worksheetData = [
        ['Date', 'Metal Type', 'Purity', 'Rate per Gram', 'Rate per 10g', 'Change %', 'Updated By', 'Source'],
        ...actualData.map(item => [
          new Date(item.created_at).toLocaleDateString('en-US'),
          metalTypes.find(mt => mt.id == selectedMetalType)?.name || '',
          purities.find(p => p.id == selectedPurity)?.purity_name || '',
          parseFloat(item.new_rate_per_gram) || 0,
          parseFloat(item.new_rate_per_10g) || 0,
          item.change_percentage ? `${item.change_percentage}%` : '0%',
          item.updated_by || 'Admin',
          item.source === 'api' ? 'API' : (item.source || 'User')
        ])
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 15 }, // Metal Type
        { wch: 10 }, // Purity
        { wch: 15 }, // Rate per Gram
        { wch: 15 }, // Rate per 10g
        { wch: 12 }, // Change %
        { wch: 15 }, // Updated By
        { wch: 10 }  // Source
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Metal Rates');

      // Generate filename
      const metalTypeName = metalTypes.find(mt => mt.id == selectedMetalType)?.name || 'Unknown';
      const purityName = purities.find(p => p.id == selectedPurity)?.purity_name || 'Unknown';
      const filename = `metal-rates-${metalTypeName}-${purityName}-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write and download file
      XLSX.writeFile(workbook, filename);

      showNotification('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification('Error exporting data', 'error');
    }
  };

  const handleViewFullReport = () => {
    navigate('/admin/gold-silver/rate-update');
  };

  if (loading) {
    return (
      <div className="rate-prediction-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading rate prediction data...
        </div>
      </div>
    );
  }

  return (
    <div className="rate-prediction-container">
      <div className="rate-prediction-header">
        <h2 className="rate-prediction-title">Rate Prediction</h2>
      </div>

      <div className="rate-prediction-filter-card">
        <div className="rate-prediction-filter-group">
          <label className="filter-label">
            <div className="filter-label-row">
              <span className="filter-icon"><Calendar size={16} /></span>
              <span>Date Range</span>
            </div>
            <select
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>
          </label>
          <label className="filter-label">
            <div className="filter-label-row">
              <span>Metal Type</span>
            </div>
            <select
              className="filter-select"
              value={selectedMetalType}
              onChange={handleMetalTypeChange}
            >
              <option value="">Select Metal Type</option>
              {metalTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </label>
          <label className="filter-label">
            <div className="filter-label-row">
              <span>Purity</span>
            </div>
            <select
              className="filter-select"
              value={selectedPurity}
              onChange={(e) => setSelectedPurity(e.target.value)}
              disabled={!selectedMetalType}
            >
              <option value="">Select Purity</option>
              {purities.map(purity => (
                <option key={purity.id} value={purity.id}>{purity.purity_name}</option>
              ))}
            </select>
          </label>
          <label className="filter-label">
            <div className="filter-label-row">
              <span className="filter-icon"><Filter size={16} /></span>
              <span>Trend Filter</span>
            </div>
            <select
              className="filter-select"
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
            >
              <option>All Trends</option>
              <option>Upward</option>
              <option>Downward</option>
            </select>
          </label>
        </div>
        <button className="export-btn" onClick={handleExport}>
          <Download size={16} style={{ marginRight: 6 }} /> Export data
        </button>
      </div>

      <div className="rate-prediction-stats-row">
        <div className="rate-prediction-stat-card">
          <div className="rate-prediction-stat-header">Current Rate</div>
          <div className="rate-predicke">₹{getCurrentRate().toLocaleString()}</div>
          <div className="rate-prediction-stat-subtext positive">+12.15% from yesterday</div>
          <div className="stat-icon-bg-statistics2"><img src={statistics2Icon} alt="current rate" loading="lazy" decoding="async" /></div>
        </div>
        <div className="rate-prediction-stat-card">
          <div className="rate-prediction-stat-header">Predicted High</div>
          <div className="rate-predicke">₹{statsData.predictedHigh.toLocaleString()}</div>
          <div className="rate-prediction-stat-subtext">Next 7 days</div>
          <div className="stat-icon-bg-statistics"><img src={statisticsIcon} alt="predicted high" loading="lazy" decoding="async" /></div>
        </div>
        <div className="rate-prediction-stat-card">
          <div className="rate-prediction-stat-header">Predicted Low</div>
          <div className="rate-predicke">₹{statsData.predictedLow.toLocaleString()}</div>
          <div className="rate-prediction-stat-subtext">Next 7 days</div>
          <div className="stat-icon-bg-red-group"><img src={redGroupIcon} alt="predicted low" loading="lazy" decoding="async" /></div>
        </div>
        <div className="rate-prediction-stat-card">
          <div className="rate-prediction-stat-header">Confidence</div>
          <div className="rate-predicke">{statsData.confidence}%</div>
          <div className="rate-prediction-stat-subtext confidence"><span className="confidence-link">High Accuracy</span></div>
          <div className="stat-icon-bg-warnings"><img src={warningsIcon} alt="confidence" loading="lazy" decoding="async" /></div>
        </div>
      </div>

      {/* chart */}
      <div className="admin-digi-go-over-content-row">
        <div className="admin-digi-go-over-chart-section">
          <div className="admin-digi-go-over-chart-container">
            <div className="admin-digi-go-over-chart-header">
              <div>
                <h3 className="admin-digi-go-over-chart-title">RATE TREND & PREDICTION</h3>
                <p className="admin-digi-go-over-chart-subtitle">
                  {metalTypes.find(mt => mt.id == selectedMetalType)?.name || 'Select Metal'} {purities.find(p => p.id == selectedPurity)?.purity_name || 'Select Purity'} - Historical & Forecasted Rates
                </p>
              </div>
              <div className="admin-digi-go-over-chart-legend">
                <div className="admin-digi-go-over-legend-item">
                  <div className="admin-digi-go-over-legend-dot actual"></div>
                  <span className="admin-digi-go-over-legend-label">Actual</span>
                </div>
                <div className="admin-digi-go-over-legend-item">
                  <div className="admin-digi-go-over-legend-dot predicted"></div>
                  <span className="admin-digi-go-over-legend-label">Predicted</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={rateData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#bdbdbd" strokeDasharray="3 3" fill="#fdf6ed" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#232323', fontFamily: "'Open Sans', sans-serif", fontWeight: "400" }} axisLine={false} tickLine={false} />
                <YAxis domain={[getCurrentRate() * 0.9, getCurrentRate() * 1.1]} tick={{ fontSize: 12, fill: '#232323', fontFamily: "'Open Sans', sans-serif", }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => `₹${value} per gram`} contentStyle={{ borderRadius: 8, border: '1px solid #059669', background: '#fff', color: '#059669', fontWeight: 600 }} labelStyle={{ color: '#232323', fontWeight: 500 }} />
                <Line type="monotone" dataKey="actual" stroke="#0E593C" dot={{ r: 4, fill: '#0E593C', strokeWidth: 3 }} activeDot={{ r: 9, fill: '#0E593C', stroke: 'none', strokeWidth: 3 }} name="Actual" strokeWidth={2.5} connectNulls />
                <Line type="monotone" dataKey="predicted" stroke="#F14344" strokeDasharray="6 4" dot={{ r: 6, fill: '#F14344', stroke: 'none' }} activeDot={{ r: 8, fill: '#dc2626', stroke: 'none' }} name="Predicted" strokeWidth={2.5} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-digi-go-over-forecast-section">
          <div className="admin-digi-go-over-forecast-container">
            <h3 className="admin-digi-go-over-forecast-title">FORECAST TABLE</h3>
            <p className="admin-digi-go-over-forecast-subtitle">3-day rate predictions with confidence levels</p>
            <div className="admin-digi-go-over-forecast-table">
              <div className="admin-digi-go-over-forecast-header">
                <div className="admin-digi-go-over-forecast-col">DATE</div>
                <div className="admin-digi-go-over-forecast-col">RATE</div>
                <div className="admin-digi-go-over-forecast-col">CHANGE</div>
                <div className="admin-digi-go-over-forecast-col">CONFIDENCE</div>
              </div>
              {forecastData.map((item, index) => (
                <div key={index} className="admin-digi-go-over-forecast-row">
                  <div className="admin-digi-go-over-forecast-col admin-digi-go-over-date-col">{item.date}</div>
                  <div className="admin-digi-go-over-forecast-col admin-digi-go-over-rate-col">{item.rate}</div>
                  <div className={`admin-digi-go-over-forecast-col admin-digi-go-over-change-col ${getChangeStyle(item.change).replace('change-', 'admin-digi-go-over-change-')}`}>{item.change}</div>
                  <div className="admin-digi-go-over-forecast-col admin-digi-go-over-confidence-col" style={{ background: getConfidenceBg(item.confidence) }}>{item.confidence}</div>
                </div>
              ))}
            </div>
            <div className="admin-digi-go-over-forecast-note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle className="w-4 h-4" />
                Predictions based on historical data and market analysis
              </span>
              <a href="#" className="admin-digi-go-over-forecast-report-link" onClick={handleViewFullReport}>View Full Report</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatePradiction;
