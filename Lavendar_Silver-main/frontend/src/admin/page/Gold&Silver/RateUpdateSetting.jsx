import React, { useState, useEffect, useContext } from 'react';
import {
  ChevronDown,
  Clock,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  User,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';
import CreateRateModal from './CreateRateModal';
import ViewRateModal from './ViewRateModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Save } from 'lucide-react';
import './RateUpdateSetting.css';

const RateUpdateSetting = () => {
  const { token } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const [metalType, setMetalType] = useState('Gold');
  const [selectedPurity, setSelectedPurity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRates, setCurrentRates] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [purities, setPurities] = useState([]);
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate] = useState('2 minutes ago');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryDeleteModalOpen, setIsHistoryDeleteModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [rateToDelete, setRateToDelete] = useState(null);
  const [historyToDelete, setHistoryToDelete] = useState(null);

  // Inline editing states
  const [editingRates, setEditingRates] = useState({});
  const [savingRates, setSavingRates] = useState({});
  const [originalRates, setOriginalRates] = useState({});
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch current rates
  const fetchCurrentRates = React.useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metal-rates/rates/current`);
      if (response.data.success) {
        setCurrentRates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching current rates:', error);
    }
  }, [API_BASE_URL]);

  // Fetch metal types
  const fetchMetalTypes = React.useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types`);
      if (response.data.success) {
        setMetalTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching metal types:', error);
    }
  }, [API_BASE_URL]);

  // Fetch purities for selected metal type
  const fetchPurities = React.useCallback(async (metalTypeName) => {
    if (!metalTypeName || metalTypeName === '') {
      setPurities([]);
      setSelectedPurity('');
      return;
    }
    try {
      const metalType = metalTypes.find(mt => mt.name === metalTypeName);
      if (metalType) {
        const response = await axios.get(`${API_BASE_URL}/api/metal-rates/metal-types/${metalType.id}/purities`);
        if (response.data.success) {
          setPurities(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching purities:', error);
    }
  }, [API_BASE_URL, metalTypes]);

  // Fetch rate history
  const fetchRateHistory = React.useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metal-rates/rates/history`);
      if (response.data.success) {
        setRateHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching rate history:', error);
    }
  }, [API_BASE_URL]);

  // Handle create modal open
  const handleAddRate = () => {
    setIsCreateModalOpen(true);
  };

  // Handle create modal close
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Calculate rates based on per 10g rate
  const calculateRatesFrom10g = (ratePer10g) => {
    if (!ratePer10g) return { rate_per_gram: '' };
    const rate = parseFloat(ratePer10g);
    if (isNaN(rate)) return { rate_per_gram: '' };
    return {
      rate_per_gram: (rate / 10).toFixed(2)
    };
  };

  // Calculate rates based on per gram rate
  const calculateRatesFrom1g = (ratePerGram) => {
    if (!ratePerGram) return { rate_per_10g: '' };
    const rate = parseFloat(ratePerGram);
    if (isNaN(rate)) return { rate_per_10g: '' };
    return {
      rate_per_10g: (rate * 10).toFixed(2)
    };
  };

  // Generate change reason based on percentage change
  const generateChangeReason = (changePercentage) => {
    if (changePercentage > 0) {
      return `Rate increased by ${changePercentage.toFixed(2)}% - Market price adjustment`;
    } else if (changePercentage < 0) {
      return `Rate decreased by ${Math.abs(changePercentage).toFixed(2)}% - Market price adjustment`;
    } else {
      return 'Rate updated - Market price adjustment';
    }
  };

  // Handle inline edit start
  const handleStartEdit = (rate) => {
    setOriginalRates({
      ...originalRates,
      [rate.id]: {
        rate_per_gram: rate.rate_per_gram,
        rate_per_10g: rate.rate_per_10g,
        tunch_value: rate.tunch_value
      }
    });
    setEditingRates({
      ...editingRates,
      [rate.id]: {
        rate_per_gram: rate.rate_per_gram?.toString() || '',
        rate_per_10g: rate.rate_per_10g?.toString() || '',
        tunch_value: rate.tunch_value?.toString() || '',
        change_reason: ''
      }
    });
  };

  // Handle inline edit change
  const handleEditChange = (rateId, field, value) => {
    const originalRate = originalRates[rateId];
    let updatedData = {
      ...editingRates[rateId],
      [field]: value
    };

    // Auto-calculate rate_per_gram when rate_per_10g changes
    if (field === 'rate_per_10g' && value) {
      const calculatedRates = calculateRatesFrom10g(value);
      updatedData.rate_per_gram = calculatedRates.rate_per_gram;

      // Auto-generate change reason
      if (originalRate) {
        const newRate = parseFloat(value);
        const oldRate = parseFloat(originalRate.rate_per_10g);
        if (!isNaN(newRate) && !isNaN(oldRate) && oldRate > 0) {
          const changePercentage = ((newRate - oldRate) / oldRate) * 100;
          updatedData.change_reason = generateChangeReason(changePercentage);
        }
      }
    }

    // Auto-calculate rate_per_10g when rate_per_gram changes
    if (field === 'rate_per_gram' && value) {
      const calculatedRates = calculateRatesFrom1g(value);
      updatedData.rate_per_10g = calculatedRates.rate_per_10g;

      // Auto-generate change reason
      if (originalRate) {
        const newRate = parseFloat(value);
        const oldRate = parseFloat(originalRate.rate_per_gram);
        if (!isNaN(newRate) && !isNaN(oldRate) && oldRate > 0) {
          const changePercentage = ((newRate - oldRate) / oldRate) * 100;
          updatedData.change_reason = generateChangeReason(changePercentage);
        }
      }
    }

    setEditingRates({
      ...editingRates,
      [rateId]: updatedData
    });
  };

  // Handle edit all start
  const handleStartEditAll = () => {
    const newOriginalRates = {};
    const newEditingRates = {};
    
    filteredRates.forEach(rate => {
      newOriginalRates[rate.id] = {
        rate_per_gram: rate.rate_per_gram,
        rate_per_10g: rate.rate_per_10g,
        tunch_value: rate.tunch_value
      };
      newEditingRates[rate.id] = {
        rate_per_gram: rate.rate_per_gram?.toString() || '',
        rate_per_10g: rate.rate_per_10g?.toString() || '',
        tunch_value: rate.tunch_value?.toString() || '',
        change_reason: ''
      };
    });
    
    setOriginalRates(newOriginalRates);
    setEditingRates(newEditingRates);
    setIsEditingAll(true);
  };

  // Handle cancel edit all
  const handleCancelEditAll = () => {
    setEditingRates({});
    setOriginalRates({});
    setIsEditingAll(false);
  };

  // Handle save all
  const handleSaveAll = async () => {
    setSavingAll(true);
    let successCount = 0;
    let failCount = 0;

    const ratesToUpdate = Object.keys(editingRates);
    
    for (const rateId of ratesToUpdate) {
      const rate = currentRates.find(r => r.id === parseInt(rateId));
      if (!rate) continue;

      const editedData = editingRates[rateId];
      const ratePerGram = parseFloat(editedData.rate_per_gram);
      const ratePer10g = parseFloat(editedData.rate_per_10g);
      const tunchValue = editedData.tunch_value ? parseFloat(editedData.tunch_value) : null;

      // Validation
      if (isNaN(ratePerGram) && isNaN(ratePer10g)) continue;

      // Ensure change reason exists
      if (!editedData.change_reason || editedData.change_reason.trim() === '') {
        if (originalRates[rateId]) {
          const newRate = parseFloat(editedData.rate_per_10g);
          const oldRate = parseFloat(originalRates[rateId].rate_per_10g);
          if (!isNaN(newRate) && !isNaN(oldRate) && oldRate > 0) {
            const changePercentage = ((newRate - oldRate) / oldRate) * 100;
            editedData.change_reason = generateChangeReason(changePercentage);
          } else {
            editedData.change_reason = 'Rate updated - Market price adjustment';
          }
        } else {
          editedData.change_reason = 'Rate updated - Market price adjustment';
        }
      }

      try {
        const submitData = {
          metal_type_id: rate.metal_type_id,
          purity_id: rate.purity_id,
          rate_per_gram: !isNaN(ratePerGram) && ratePerGram > 0 ? ratePerGram : undefined,
          rate_per_10g: !isNaN(ratePer10g) && ratePer10g > 0 ? ratePer10g : undefined,
          tunch_value: tunchValue !== null && !isNaN(tunchValue) ? tunchValue : undefined,
          source: 'manual',
          change_reason: editedData.change_reason || 'Updated via admin panel'
        };

        const response = await axios.put(`${API_BASE_URL}/api/metal-rates/rates/update`, submitData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error updating rate ${rateId}:`, error);
        failCount++;
      }
    }

    setSavingAll(false);
    
    if (successCount > 0) {
      showNotification(`${successCount} rate(s) updated successfully!${failCount > 0 ? ` (${failCount} failed)` : ''}`, 'success');
      setEditingRates({});
      setOriginalRates({});
      setIsEditingAll(false);
      await handleRateSuccess();
    } else if (failCount > 0) {
      showNotification('Failed to update rates. Please try again.', 'error');
    }
  };

  // Handle inline save
  const handleSaveRate = async (rate) => {
    if (!editingRates[rate.id]) return;

    const editedData = editingRates[rate.id];
    const ratePerGram = parseFloat(editedData.rate_per_gram);
    const ratePer10g = parseFloat(editedData.rate_per_10g);
    const tunchValue = editedData.tunch_value ? parseFloat(editedData.tunch_value) : null;

    // Validation
    if (isNaN(ratePerGram) && isNaN(ratePer10g)) {
      showNotification('Please enter at least one rate value', 'error');
      return;
    }

    if ((!isNaN(ratePerGram) && ratePerGram <= 0) && (!isNaN(ratePer10g) && ratePer10g <= 0)) {
      showNotification('Rates must be greater than 0', 'error');
      return;
    }

    // Change reason auto-generated, but ensure it exists
    if (!editedData.change_reason || editedData.change_reason.trim() === '') {
      // Auto-generate if not present
      if (originalRates[rate.id]) {
        const newRate = parseFloat(editedData.rate_per_10g);
        const oldRate = parseFloat(originalRates[rate.id].rate_per_10g);
        if (!isNaN(newRate) && !isNaN(oldRate) && oldRate > 0) {
          const changePercentage = ((newRate - oldRate) / oldRate) * 100;
          editedData.change_reason = generateChangeReason(changePercentage);
        } else {
          editedData.change_reason = 'Rate updated - Market price adjustment';
        }
      } else {
        editedData.change_reason = 'Rate updated - Market price adjustment';
      }
    }

    setSavingRates({ ...savingRates, [rate.id]: true });

    try {
      const submitData = {
        metal_type_id: rate.metal_type_id,
        purity_id: rate.purity_id,
        rate_per_gram: !isNaN(ratePerGram) && ratePerGram > 0 ? ratePerGram : undefined,
        rate_per_10g: !isNaN(ratePer10g) && ratePer10g > 0 ? ratePer10g : undefined,
        tunch_value: tunchValue !== null && !isNaN(tunchValue) ? tunchValue : undefined,
        source: 'manual',
        change_reason: editedData.change_reason || 'Updated via admin panel'
      };

      const response = await axios.put(`${API_BASE_URL}/api/metal-rates/rates/update`, submitData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('Rate updated successfully!', 'success');
        // Remove from editing and original states
        const newEditingRates = { ...editingRates };
        const newOriginalRates = { ...originalRates };
        delete newEditingRates[rate.id];
        delete newOriginalRates[rate.id];
        setEditingRates(newEditingRates);
        setOriginalRates(newOriginalRates);
        // Refresh rates
        await handleRateSuccess();
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Error updating rate. Please try again.', 'error');
      }
    } finally {
      const newSavingRates = { ...savingRates };
      delete newSavingRates[rate.id];
      setSavingRates(newSavingRates);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = (rateId) => {
    const newEditingRates = { ...editingRates };
    const newOriginalRates = { ...originalRates };
    delete newEditingRates[rateId];
    delete newOriginalRates[rateId];
    setEditingRates(newEditingRates);
    setOriginalRates(newOriginalRates);
  };

  // Handle successful rate operation
  const handleRateSuccess = async () => {
    await Promise.all([
      fetchCurrentRates(),
      fetchRateHistory(),
      fetchMetalTypes()
    ]);
    showNotification('Rate operation completed successfully', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Handle view rate details
  const handleViewRate = (rate) => {
    setSelectedRate(rate);
    setIsViewModalOpen(true);
  };

  // Handle update from view modal
  const handleUpdateFromView = (rate) => {
    setSelectedRate(rate);
    setIsViewModalOpen(false);
    handleStartEdit(rate);
  };

  // Handle delete rate
  const handleDeleteRate = (rate) => {
    setRateToDelete(rate);
    setIsDeleteModalOpen(true);
  };

  // Handle delete history entry
  const handleDeleteHistory = (history) => {
    setHistoryToDelete(history);
    setIsHistoryDeleteModalOpen(true);
  };

  // Handle confirm history delete
  const handleConfirmHistoryDelete = async () => {
    if (!historyToDelete) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/metal-rates/history/${historyToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('History entry deleted successfully', 'success');
        await fetchRateHistory();
      }
    } catch (error) {
      console.error('Error deleting history entry:', error);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Error deleting history entry', 'error');
      }
    } finally {
      setIsHistoryDeleteModalOpen(false);
      setHistoryToDelete(null);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!rateToDelete) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/metal-rates/rates/${rateToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('Rate deleted successfully', 'success');
        await Promise.all([
          fetchCurrentRates(),
          fetchRateHistory(),
          fetchMetalTypes()
        ]);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting rate:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Error deleting rate', 'error');
      }
    } finally {
      setIsDeleteModalOpen(false);
      setRateToDelete(null);
    }
  };

  // Handle cleanup orphaned data
  const handleCleanup = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/metal-rates/cleanup`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('Orphaned data cleaned up successfully', 'success');
        fetchCurrentRates();
        fetchMetalTypes();
        fetchRateHistory();
      }
    } catch (error) {
      console.error('Error cleaning up data:', error);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Error cleaning up data', 'error');
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCurrentRates(),
        fetchMetalTypes(),
        fetchRateHistory()
      ]);
      setLoading(false);
    };

    initializeData();
  }, [fetchCurrentRates, fetchMetalTypes, fetchRateHistory]);

  // Fetch purities when metal types are loaded or metal type changes
  useEffect(() => {
    if (metalTypes.length > 0 && metalType) {
      fetchPurities(metalType);
    }
  }, [metalTypes, metalType, fetchPurities]);

  // Filter rates by metal type and purity
  const filteredRates = currentRates.filter(rate => {
    const metalMatch = !metalType || metalType === '' || rate.metal_name.toLowerCase().includes(metalType.toLowerCase());
    const purityMatch = !selectedPurity || selectedPurity === '' || rate.purity_name.toLowerCase().includes(selectedPurity.toLowerCase());
    return metalMatch && purityMatch;
  });

  // Filter history by search term
  const filteredHistory = rateHistory.filter(rate =>
    rate.metal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.purity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="rate-update-sett-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading rates...
        </div>
      </div>
    );
  }

  return (
    <div className="rate-update-sett-container">
      <div className="rate-update-sett-header">
        <h1>RATE UPDATE SETTING</h1>
      </div>

      <div className="rate-update-sett-controls-section">
        <div className="rate-update-sett-metal-type-dropdown">
          <label>Metal Type</label>
          <div className="rate-update-sett-dropdown">
            <select value={metalType} onChange={(e) => setMetalType(e.target.value)}>
              <option value="">All Metals</option>
              {metalTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
            <ChevronDown className="rate-update-sett-dropdown-icon" />
          </div>
        </div>

        <div className="rate-update-sett-purity-dropdown">
          <label>Purity</label>
          <div className="rate-update-sett-dropdown">
            <select value={selectedPurity} onChange={(e) => setSelectedPurity(e.target.value)}>
              <option value="">All Purities</option>
              {purities.map(purity => (
                <option key={purity.id} value={purity.purity_name}>{purity.purity_name}</option>
              ))}
            </select>
            <ChevronDown className="rate-update-sett-dropdown-icon" />
          </div>
        </div>

        <div className="rate-update-sett-status-info">
          <div className="rate-update-sett-status-item">
            <Clock className="rate-update-sett-status-icon last-update" />
            <div>
              <div className="rate-update-sett-status-label">Last Update</div>
              <div className="rate-update-sett-status-value last-update">{lastUpdate}</div>
            </div>
          </div>
        </div>

        {isEditingAll ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="rate-update-sett-update-rate-btn" 
              onClick={handleSaveAll}
              disabled={savingAll}
              style={{ backgroundColor: '#059669' }}
            >
              <Save size={16} />
              {savingAll ? 'Saving...' : 'Save All'}
            </button>
            <button 
              className="rate-update-sett-update-rate-btn" 
              onClick={handleCancelEditAll}
              disabled={savingAll}
              style={{ backgroundColor: '#6b7280' }}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="rate-update-sett-update-rate-btn" onClick={handleStartEditAll} style={{ backgroundColor: '#3b82f6' }}>
              <Edit size={16} />
              Edit All
            </button>
            <button className="rate-update-sett-update-rate-btn" onClick={handleAddRate}>
              <Plus size={16} />
              Add Metal
            </button>
          </div>
        )}
        
        <button
          className="rate-update-sett-update-rate-btn"
          onClick={handleCleanup}
          style={{ marginLeft: '10px', backgroundColor: '#dc2626' }}
        >
          <Trash2 size={16} />
          Cleanup
        </button>
      </div>

      <div className="rate-update-sett-rates-cards">
        {filteredRates.map((rate) => {
          const isEditing = isEditingAll || editingRates[rate.id];
          const isSaving = savingRates[rate.id] || (isEditingAll && savingAll);

          return (
            <div key={rate.id} className="rate-update-sett-rate-card">
              <div className="rate-update-sett-card-header">
                <h3>{rate.purity_name} {rate.metal_name}</h3>
                {rate.source === 'api' && (
                  <span className={`rate-update-sett-status-badge live`}>
                    Live
                  </span>
                )}
              </div>
              <div className="rate-update-sett-rate-info">
                <div className="rate-update-sett-rate-row">
                  <span>Purity:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="rate-update-sett-inline-input"
                      value={editingRates[rate.id]?.tunch_value || ''}
                      onChange={(e) => handleEditChange(rate.id, 'tunch_value', e.target.value)}
                      placeholder="Purity %"
                    />
                  ) : (
                    <span className="rate-update-sett-rate-value">
                      {rate.tunch_value ? `${rate.tunch_value}%` : 'N/A'}
                    </span>
                  )}
                </div>
                <div className="rate-update-sett-rate-row">
                  <span>Per Gram:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="rate-update-sett-inline-input"
                      value={editingRates[rate.id]?.rate_per_gram || ''}
                      onChange={(e) => handleEditChange(rate.id, 'rate_per_gram', e.target.value)}
                      placeholder="₹0.00"
                    />
                  ) : (
                    <span className="rate-update-sett-rate-value">₹{rate.rate_per_gram?.toLocaleString()}</span>
                  )}
                </div>
                <div className="rate-update-sett-rate-row">
                  <span>Per 10g:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="rate-update-sett-inline-input"
                      value={editingRates[rate.id]?.rate_per_10g || ''}
                      onChange={(e) => handleEditChange(rate.id, 'rate_per_10g', e.target.value)}
                      placeholder="₹0.00"
                    />
                  ) : (
                    <span className="rate-update-sett-rate-value">₹{rate.rate_per_10g?.toLocaleString()}</span>
                  )}
                </div>
                <div className="rate-update-sett-rate-row">
                  <span>Updated:</span>
                  <span className="rate-update-sett-rate-value">{new Date(rate.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              {!isEditingAll && (
                <div className="rate-update-sett-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="rate-update-sett-action-btn save"
                        title="Save Changes"
                        onClick={() => handleSaveRate(rate)}
                        disabled={isSaving}
                      >
                        <Save size={14} />
                      </button>
                      <button
                        className="rate-update-sett-action-btn cancel"
                        title="Cancel"
                        onClick={() => handleCancelEdit(rate.id)}
                        disabled={isSaving}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="rate-update-sett-action-btn view"
                        title="View Details"
                        onClick={() => handleViewRate(rate)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="rate-update-sett-action-btn edit"
                        title="Edit Rate"
                        onClick={() => handleStartEdit(rate)}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="rate-update-sett-action-btn delete"
                        title="Delete"
                        onClick={() => handleDeleteRate(rate)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rate-update-sett-trend-section">
        <div className="rate-update-sett-trend-header">
          <div>
            <h2>RATE TREND & PREDICTION</h2>
            <p>Historical & Forecasted Rates</p>
          </div>
          <div className="rate-update-sett-search-container">
            <Search className="rate-update-sett-search-icon" />
            <input
              type="text"
              placeholder="Search by metal, purity, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rate-update-sett-data-table">
          <table>
            <thead>
              <tr>
                <th>DATE & TIME</th>
                <th>METAL</th>
                <th>PURITY</th>
                <th>RATE PER GRAM</th>
                <th>UPDATED BY</th>
                <th>SOURCE</th>
                <th>CHANGE %</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                  <td>{row.metal_name}</td>
                  <td>{row.purity_name}</td>
                  <td>₹{row.new_rate_per_gram?.toLocaleString()}</td>
                  <td>
                    <div className="rate-update-sett-updated-by">
                      <User size={14} />
                      {row.updated_by}
                    </div>
                  </td>
                  <td>
                    <span className={`rate-update-sett-source-badge ${row.source === 'api' ? 'api' : 'user'}`}>
                      {row.source === 'api' ? 'API' : 'USER'}
                    </span>
                  </td>
                  <td>
                    <div className={`rate-update-sett-rate-change ${row.change_percentage >= 0 ? 'positive' : 'negative'}`}>
                      {row.change_percentage >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(row.change_percentage).toFixed(2)}%
                    </div>
                  </td>
                  <td>
                    <button 
                      className="rate-update-sett-action-btn delete"
                      title="Delete Entry"
                      onClick={() => handleDeleteHistory(row)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Rate Modal */}
      <CreateRateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleRateSuccess}
      />

      {/* View Rate Modal */}
      <ViewRateModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        rate={selectedRate}
        onUpdate={handleUpdateFromView}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Metal Rate"
        message={`Are you sure you want to delete the ${rateToDelete?.purity_name} ${rateToDelete?.metal_name} rate?`}
        itemName="metal rate"
      />
      {/* Delete Confirmation Modal for History */}
      <DeleteConfirmationModal
        isOpen={isHistoryDeleteModalOpen}
        onClose={() => setIsHistoryDeleteModalOpen(false)}
        onConfirm={handleConfirmHistoryDelete}
        title="Delete History Entry"
        message={`Are you sure you want to delete this history entry for ${historyToDelete?.purity_name} ${historyToDelete?.metal_name} from ${historyToDelete ? new Date(historyToDelete.created_at).toLocaleString() : ''}?`}
        itemName="history entry"
      />
    </div>
  );
};

export default RateUpdateSetting;