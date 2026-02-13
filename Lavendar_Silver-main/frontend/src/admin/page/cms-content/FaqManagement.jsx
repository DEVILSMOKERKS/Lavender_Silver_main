import React, { useState, useEffect, useContext } from 'react';
import './FaqManagement.css';
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FaqManagement = () => {
  const { showNotification } = useNotification();
  const { token } = useContext(AdminContext);
  const [activeTab, setActiveTab] = useState('general-enquiry');
  const [loading, setLoading] = useState(false);
  const [faqData, setFaqData] = useState({
    generalEnquiry: [],
    placingAnOrder: [],
    shipping: [],
    maintenance: []
  });

  // Form states for each section (multiple entries)
  const [generalEnquiryEntries, setGeneralEnquiryEntries] = useState([
    { heading: 'GENERAL_ENQUIRY', question: '', answer: '', status: 'collapsed' }
  ]);

  const [placingAnOrderEntries, setPlacingAnOrderEntries] = useState([
    { heading: 'PLACING_AN_ORDER', question: '', answer: '', status: 'collapsed' }
  ]);

  const [shippingEntries, setShippingEntries] = useState([
    { heading: 'SHIPPING', question: '', answer: '', status: 'collapsed' }
  ]);

  const [maintenanceEntries, setMaintenanceEntries] = useState([
    { heading: 'MAINTENANCE', question: '', answer: '', status: 'collapsed' }
  ]);

  // State to track if data exists for each section
  const [hasGeneralEnquiryData, setHasGeneralEnquiryData] = useState(false);
  const [hasPlacingAnOrderData, setHasPlacingAnOrderData] = useState(false);
  const [hasShippingData, setHasShippingData] = useState(false);
  const [hasMaintenanceData, setHasMaintenanceData] = useState(false);

  // Tabs configuration
  const tabs = [
    { id: 'general-enquiry', label: 'General Enquiry' },
    { id: 'placing-an-order', label: 'Placing An Order' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'maintenance', label: 'Maintenance' }
  ];

  useEffect(() => {
    fetchFaqData();
  }, []);

  const fetchFaqData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/faq/all`);

      if (response.data.success) {
        const data = response.data.data;

        setFaqData({
          generalEnquiry: data.generalEnquiry || [],
          placingAnOrder: data.placingAnOrder || [],
          shipping: data.shipping || [],
          maintenance: data.maintenance || []
        });

        // Check if data exists and pre-fill forms
        if (data.generalEnquiry && data.generalEnquiry.length > 0) {
          setHasGeneralEnquiryData(true);
          const entries = data.generalEnquiry.map(faq => ({
            id: faq.id,
            heading: faq.heading || 'GENERAL_ENQUIRY',
            question: faq.question,
            answer: faq.answer,
            status: faq.status
          }));
          setGeneralEnquiryEntries(entries);
        } else {
          setHasGeneralEnquiryData(false);
          setGeneralEnquiryEntries([{ heading: 'GENERAL_ENQUIRY', question: '', answer: '', status: 'collapsed' }]);
        }

        if (data.placingAnOrder && data.placingAnOrder.length > 0) {
          setHasPlacingAnOrderData(true);
          setPlacingAnOrderEntries(data.placingAnOrder.map(faq => ({
            id: faq.id,
            heading: faq.heading || 'PLACING_AN_ORDER',
            question: faq.question,
            answer: faq.answer,
            status: faq.status
          })));
        } else {
          setHasPlacingAnOrderData(false);
          setPlacingAnOrderEntries([{ heading: 'PLACING_AN_ORDER', question: '', answer: '', status: 'collapsed' }]);
        }

        if (data.shipping && data.shipping.length > 0) {
          setHasShippingData(true);
          setShippingEntries(data.shipping.map(faq => ({
            id: faq.id,
            heading: faq.heading || 'SHIPPING',
            question: faq.question,
            answer: faq.answer,
            status: faq.status
          })));
        } else {
          setHasShippingData(false);
          setShippingEntries([{ heading: 'SHIPPING', question: '', answer: '', status: 'collapsed' }]);
        }

        if (data.maintenance && data.maintenance.length > 0) {
          setHasMaintenanceData(true);
          setMaintenanceEntries(data.maintenance.map(faq => ({
            id: faq.id,
            heading: faq.heading || 'MAINTENANCE',
            question: faq.question,
            answer: faq.answer,
            status: faq.status
          })));
        } else {
          setHasMaintenanceData(false);
          setMaintenanceEntries([{ heading: 'MAINTENANCE', question: '', answer: '', status: 'collapsed' }]);
        }

      } else {
        console.error('❌ Failed to fetch FAQ data:', response.data.message);
        // Set default empty state
        setFaqData({
          generalEnquiry: [],
          placingAnOrder: [],
          shipping: [],
          maintenance: []
        });
      }
    } catch (error) {
      console.error('🚨 Error fetching FAQ data:', error);
      console.error('Error Response:', error.response);

      // Set default empty state even on error
      setFaqData({
        generalEnquiry: [],
        placingAnOrder: [],
        shipping: [],
        maintenance: []
      });

      setHasGeneralEnquiryData(false);
      setHasPlacingAnOrderData(false);
      setHasShippingData(false);
      setHasMaintenanceData(false);

      // Show error notification
      showNotification('Failed to load FAQ data. Please try again.', 'error');
    }
  };

  // Handle form submissions
  // Helper functions for multiple entries
  const addGeneralEnquiryEntry = () => {
    setGeneralEnquiryEntries([...generalEnquiryEntries, { heading: 'GENERAL_ENQUIRY', question: '', answer: '', status: 'collapsed' }]);
  };

  const removeGeneralEnquiryEntry = (index) => {
    if (generalEnquiryEntries.length > 1) {
      setGeneralEnquiryEntries(generalEnquiryEntries.filter((_, i) => i !== index));
    }
  };

  const updateGeneralEnquiryEntry = (index, field, value) => {
    const updatedEntries = [...generalEnquiryEntries];
    updatedEntries[index][field] = value;
    setGeneralEnquiryEntries(updatedEntries);
  };

  const addPlacingAnOrderEntry = () => {
    setPlacingAnOrderEntries([...placingAnOrderEntries, { heading: 'PLACING_AN_ORDER', question: '', answer: '', status: 'collapsed' }]);
  };

  const removePlacingAnOrderEntry = (index) => {
    if (placingAnOrderEntries.length > 1) {
      setPlacingAnOrderEntries(placingAnOrderEntries.filter((_, i) => i !== index));
    }
  };

  const updatePlacingAnOrderEntry = (index, field, value) => {
    const updatedEntries = [...placingAnOrderEntries];
    updatedEntries[index][field] = value;
    setPlacingAnOrderEntries(updatedEntries);
  };

  const addShippingEntry = () => {
    setShippingEntries([...shippingEntries, { heading: 'SHIPPING', question: '', answer: '', status: 'collapsed' }]);
  };

  const removeShippingEntry = (index) => {
    if (shippingEntries.length > 1) {
      setShippingEntries(shippingEntries.filter((_, i) => i !== index));
    }
  };

  const updateShippingEntry = (index, field, value) => {
    const updatedEntries = [...shippingEntries];
    updatedEntries[index][field] = value;
    setShippingEntries(updatedEntries);
  };

  const addMaintenanceEntry = () => {
    setMaintenanceEntries([...maintenanceEntries, { heading: 'MAINTENANCE', question: '', answer: '', status: 'collapsed' }]);
  };

  const removeMaintenanceEntry = (index) => {
    if (maintenanceEntries.length > 1) {
      setMaintenanceEntries(maintenanceEntries.filter((_, i) => i !== index));
    }
  };

  const updateMaintenanceEntry = (index, field, value) => {
    const updatedEntries = [...maintenanceEntries];
    updatedEntries[index][field] = value;
    setMaintenanceEntries(updatedEntries);
  };

  const handleGeneralEnquirySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasGeneralEnquiryData) {
        // Update existing entries
        const promises = generalEnquiryEntries.map(entry =>
          axios.put(`${API_BASE_URL}/api/faq/general-enquiry/${entry.id}`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('General Enquiry FAQs updated successfully', 'success');
      } else {
        // Create new entries
        const promises = generalEnquiryEntries.map(entry =>
          axios.post(`${API_BASE_URL}/api/faq/general-enquiry`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('General Enquiry FAQs added successfully', 'success');
      }
      fetchFaqData();
    } catch (error) {
      console.error('General Enquiry Error:', error);
      console.error('Error Response:', error.response);

      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        showNotification('Network error: No response from server', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlacingAnOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasPlacingAnOrderData) {
        // Update existing entries
        const promises = placingAnOrderEntries.map(entry =>
          axios.put(`${API_BASE_URL}/api/faq/placing-an-order/${entry.id}`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Placing An Order FAQs updated successfully', 'success');
      } else {
        // Create new entries
        const promises = placingAnOrderEntries.map(entry =>
          axios.post(`${API_BASE_URL}/api/faq/placing-an-order`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Placing An Order FAQs added successfully', 'success');
      }
      fetchFaqData();
    } catch (error) {
      console.error('Placing An Order Error:', error);
      console.error('Error Response:', error.response);

      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        showNotification('Network error: No response from server', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasShippingData) {
        // Update existing entries
        const promises = shippingEntries.map(entry =>
          axios.put(`${API_BASE_URL}/api/faq/shipping/${entry.id}`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Shipping FAQs updated successfully', 'success');
      } else {
        // Create new entries
        const promises = shippingEntries.map(entry =>
          axios.post(`${API_BASE_URL}/api/faq/shipping`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Shipping FAQs added successfully', 'success');
      }
      fetchFaqData();
    } catch (error) {
      console.error('Shipping Error:', error);
      console.error('Error Response:', error.response);

      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        showNotification('Network error: No response from server', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasMaintenanceData) {
        // Update existing entries
        const promises = maintenanceEntries.map(entry =>
          axios.put(`${API_BASE_URL}/api/faq/maintenance/${entry.id}`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Maintenance FAQs updated successfully', 'success');
      } else {
        // Create new entries
        const promises = maintenanceEntries.map(entry =>
          axios.post(`${API_BASE_URL}/api/faq/maintenance`, entry, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Maintenance FAQs added successfully', 'success');
      }
      fetchFaqData();
    } catch (error) {
      console.error('Maintenance Error:', error);
      console.error('Error Response:', error.response);

      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        showNotification('Network error: No response from server', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update FAQ status
  const updateFaqStatus = async (section, id, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/faq/${section}/${id}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        showNotification(`FAQ status updated successfully`, 'success');
        fetchFaqData();
      } else {
        showNotification(response.data.message || 'Error updating FAQ status', 'error');
      }
    } catch (error) {
      console.error('Update FAQ Status Error:', error);
      showNotification('Error updating FAQ status', 'error');
    }
  };

  return (
    <div className="faq-management">
      <div className="faq-management-faq-header">
        <h1>FAQ Management</h1>
        <p>Manage Frequently Asked Questions for different sections</p>
      </div>

      <div className="faq-management-faq-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`faq-management-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="faq-management-faq-content">
        {loading && <div className="faq-management-loading">Loading...</div>}

        {/* General Enquiry Tab */}
        {activeTab === 'general-enquiry' && (
          <div className="faq-management-tab-content">
            <h2>General Enquiry FAQ</h2>

            {/* Add New FAQ Form */}
            <div className="faq-management-add-faq-section">
              <h3>{hasGeneralEnquiryData ? 'Update FAQs' : 'Add New FAQs'}</h3>
              {hasGeneralEnquiryData && (
                <div className="faq-management-update-note">
                  <p>📝 Data exists for this section. You can update the existing FAQs below.</p>
                </div>
              )}
              <form onSubmit={handleGeneralEnquirySubmit}>
                {generalEnquiryEntries.map((entry, index) => (
                  <div key={index} className="faq-management-faq-entry-card">
                    <div className="faq-management-entry-header">
                      <h4>FAQ Entry {index + 1}</h4>
                      {generalEnquiryEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGeneralEnquiryEntry(index)}
                          className="faq-management-remove-entry-btn"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    {index === 0 && (
                      <div className="faq-management-form-group">
                        <label>Heading</label>
                        <input
                          type="text"
                          value={entry.heading}
                          onChange={(e) => updateGeneralEnquiryEntry(index, 'heading', e.target.value)}
                          placeholder="Enter heading (e.g., GENERAL_ENQUIRY)"
                          required
                        />
                      </div>
                    )}

                    <div className="faq-management-form-group">
                      <label>Question</label>
                      <input
                        type="text"
                        value={entry.question}
                        onChange={(e) => updateGeneralEnquiryEntry(index, 'question', e.target.value)}
                        placeholder="Enter your question"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Answer</label>
                      <textarea
                        value={entry.answer}
                        onChange={(e) => updateGeneralEnquiryEntry(index, 'answer', e.target.value)}
                        placeholder="Enter the answer"
                        rows="4"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Status</label>
                      <select
                        value={entry.status}
                        onChange={(e) => updateGeneralEnquiryEntry(index, 'status', e.target.value)}
                      >
                        <option value="collapsed">Collapsed</option>
                        <option value="expanded">Expanded</option>
                      </select>
                    </div>
                  </div>
                ))}
                <div className="faq-management-form-actions">
                  {!hasGeneralEnquiryData && (
                    <button type="button" onClick={addGeneralEnquiryEntry} className="faq-management-add-more-btn">
                      ➕ Add More FAQ
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="faq-management-submit-btn">
                    {hasGeneralEnquiryData ? 'Update FAQs' : 'Add All FAQs'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing FAQs List - Only show when no data exists */}
            {!hasGeneralEnquiryData && (
              <div className="faq-management-existing-faqs">
                <h3>Existing FAQs</h3>
                {faqData.generalEnquiry.length === 0 ? (
                  <p className="faq-management-no-data">No FAQs found for this section.</p>
                ) : (
                  faqData.generalEnquiry.map((faq, index) => (
                    <div key={faq.id} className="faq-management-faq-item">
                      <div className="faq-management-faq-header">
                        <h4>Q{index + 1}: {faq.question}</h4>
                        <div className="faq-management-faq-actions">
                          <button
                            onClick={() => updateFaqStatus('general-enquiry', faq.id, faq.status === 'expanded' ? 'collapsed' : 'expanded')}
                            className={`faq-management-status-btn ${faq.status === 'expanded' ? 'expanded' : 'collapsed'}`}
                          >
                            {faq.status === 'expanded' ? 'Expanded' : 'Collapsed'}
                          </button>
                        </div>
                      </div>
                      <div className="faq-management-faq-answer">
                        <p><strong>A:</strong> {faq.answer}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Placing An Order Tab */}
        {activeTab === 'placing-an-order' && (
          <div className="faq-management-tab-content">
            <h2>Placing An Order FAQ</h2>

            {/* Add New FAQ Form */}
            <div className="faq-management-add-faq-section">
              <h3>{hasPlacingAnOrderData ? 'Update FAQs' : 'Add New FAQs'}</h3>
              {hasPlacingAnOrderData && (
                <div className="faq-management-update-note">
                  <p>📝 Data exists for this section. You can update the existing FAQs below.</p>
                </div>
              )}
              <form onSubmit={handlePlacingAnOrderSubmit}>
                {placingAnOrderEntries.map((entry, index) => (
                  <div key={index} className="faq-management-faq-entry-card">
                    <div className="faq-management-entry-header">
                      <h4>FAQ Entry {index + 1}</h4>
                      {placingAnOrderEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlacingAnOrderEntry(index)}
                          className="faq-management-remove-entry-btn"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    {index === 0 && (
                      <div className="faq-management-form-group">
                        <label>Heading</label>
                        <input
                          type="text"
                          value={entry.heading}
                          onChange={(e) => updatePlacingAnOrderEntry(index, 'heading', e.target.value)}
                          placeholder="Enter heading (e.g., PLACING_AN_ORDER)"
                          required
                        />
                      </div>
                    )}

                    <div className="faq-management-form-group">
                      <label>Question</label>
                      <input
                        type="text"
                        value={entry.question}
                        onChange={(e) => updatePlacingAnOrderEntry(index, 'question', e.target.value)}
                        placeholder="Enter your question"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Answer</label>
                      <textarea
                        value={entry.answer}
                        onChange={(e) => updatePlacingAnOrderEntry(index, 'answer', e.target.value)}
                        placeholder="Enter the answer"
                        rows="4"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Status</label>
                      <select
                        value={entry.status}
                        onChange={(e) => updatePlacingAnOrderEntry(index, 'status', e.target.value)}
                      >
                        <option value="collapsed">Collapsed</option>
                        <option value="expanded">Expanded</option>
                      </select>
                    </div>
                  </div>
                ))}
                <div className="faq-management-form-actions">
                  {!hasPlacingAnOrderData && (
                    <button type="button" onClick={addPlacingAnOrderEntry} className="faq-management-add-more-btn">
                      ➕ Add More FAQ
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="faq-management-submit-btn">
                    {hasPlacingAnOrderData ? 'Update FAQs' : 'Add All FAQs'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing FAQs List - Only show when no data exists */}
            {!hasPlacingAnOrderData && (
              <div className="faq-management-existing-faqs">
                <h3>Existing FAQs</h3>
                {faqData.placingAnOrder.length === 0 ? (
                  <p className="faq-management-no-data">No FAQs found for this section.</p>
                ) : (
                  faqData.placingAnOrder.map((faq, index) => (
                    <div key={faq.id} className="faq-management-faq-item">
                      <div className="faq-management-faq-header">
                        <h4>Q{index + 1}: {faq.question}</h4>
                        <div className="faq-management-faq-actions">
                          <button
                            onClick={() => updateFaqStatus('placing-an-order', faq.id, faq.status === 'expanded' ? 'collapsed' : 'expanded')}
                            className={`faq-management-status-btn ${faq.status === 'expanded' ? 'expanded' : 'collapsed'}`}
                          >
                            {faq.status === 'expanded' ? 'Expanded' : 'Collapsed'}
                          </button>
                        </div>
                      </div>
                      <div className="faq-management-faq-answer">
                        <p><strong>A:</strong> {faq.answer}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <div className="faq-management-tab-content">
            <h2>Shipping FAQ</h2>

            {/* Add New FAQ Form */}
            <div className="faq-management-add-faq-section">
              <h3>{hasShippingData ? 'Update FAQs' : 'Add New FAQs'}</h3>
              {hasShippingData && (
                <div className="faq-management-update-note">
                  <p>📝 Data exists for this section. You can update the existing FAQs below.</p>
                </div>
              )}
              <form onSubmit={handleShippingSubmit}>
                {shippingEntries.map((entry, index) => (
                  <div key={index} className="faq-management-faq-entry-card">
                    <div className="faq-management-entry-header">
                      <h4>FAQ Entry {index + 1}</h4>
                      {shippingEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShippingEntry(index)}
                          className="faq-management-remove-entry-btn"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    {index === 0 && (
                      <div className="faq-management-form-group">
                        <label>Heading</label>
                        <input
                          type="text"
                          value={entry.heading}
                          onChange={(e) => updateShippingEntry(index, 'heading', e.target.value)}
                          placeholder="Enter heading (e.g., SHIPPING)"
                          required
                        />
                      </div>
                    )}

                    <div className="faq-management-form-group">
                      <label>Question</label>
                      <input
                        type="text"
                        value={entry.question}
                        onChange={(e) => updateShippingEntry(index, 'question', e.target.value)}
                        placeholder="Enter your question"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Answer</label>
                      <textarea
                        value={entry.answer}
                        onChange={(e) => updateShippingEntry(index, 'answer', e.target.value)}
                        placeholder="Enter the answer"
                        rows="4"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Status</label>
                      <select
                        value={entry.status}
                        onChange={(e) => updateShippingEntry(index, 'status', e.target.value)}
                      >
                        <option value="collapsed">Collapsed</option>
                        <option value="expanded">Expanded</option>
                      </select>
                    </div>
                  </div>
                ))}
                <div className="faq-management-form-actions">
                  {!hasShippingData && (
                    <button type="button" onClick={addShippingEntry} className="faq-management-add-more-btn">
                      ➕ Add More FAQ
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="faq-management-submit-btn">
                    {hasShippingData ? 'Update FAQs' : 'Add All FAQs'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing FAQs List - Only show when no data exists */}
            {!hasShippingData && (
              <div className="faq-management-existing-faqs">
                <h3>Existing FAQs</h3>
                {faqData.shipping.length === 0 ? (
                  <p className="faq-management-no-data">No FAQs found for this section.</p>
                ) : (
                  faqData.shipping.map((faq, index) => (
                    <div key={faq.id} className="faq-management-faq-item">
                      <div className="faq-management-faq-header">
                        <h4>Q{index + 1}: {faq.question}</h4>
                        <div className="faq-management-faq-actions">
                          <button
                            onClick={() => updateFaqStatus('shipping', faq.id, faq.status === 'expanded' ? 'collapsed' : 'expanded')}
                            className={`faq-management-status-btn ${faq.status === 'expanded' ? 'expanded' : 'collapsed'}`}
                          >
                            {faq.status === 'expanded' ? 'Expanded' : 'Collapsed'}
                          </button>
                        </div>
                      </div>
                      <div className="faq-management-faq-answer">
                        <p><strong>A:</strong> {faq.answer}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="faq-management-tab-content">
            <h2>Maintenance FAQ</h2>

            {/* Add New FAQ Form */}
            <div className="faq-management-add-faq-section">
              <h3>{hasMaintenanceData ? 'Update FAQs' : 'Add New FAQs'}</h3>
              {hasMaintenanceData && (
                <div className="faq-management-update-note">
                  <p>📝 Data exists for this section. You can update the existing FAQs below.</p>
                </div>
              )}
              <form onSubmit={handleMaintenanceSubmit}>
                {maintenanceEntries.map((entry, index) => (
                  <div key={index} className="faq-management-faq-entry-card">
                    <div className="faq-management-entry-header">
                      <h4>FAQ Entry {index + 1}</h4>
                      {maintenanceEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMaintenanceEntry(index)}
                          className="faq-management-remove-entry-btn"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    {index === 0 && (
                      <div className="faq-management-form-group">
                        <label>Heading</label>
                        <input
                          type="text"
                          value={entry.heading}
                          onChange={(e) => updateMaintenanceEntry(index, 'heading', e.target.value)}
                          placeholder="Enter heading (e.g., MAINTENANCE)"
                          required
                        />
                      </div>
                    )}

                    <div className="faq-management-form-group">
                      <label>Question</label>
                      <input
                        type="text"
                        value={entry.question}
                        onChange={(e) => updateMaintenanceEntry(index, 'question', e.target.value)}
                        placeholder="Enter your question"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Answer</label>
                      <textarea
                        value={entry.answer}
                        onChange={(e) => updateMaintenanceEntry(index, 'answer', e.target.value)}
                        placeholder="Enter the answer"
                        rows="4"
                        required
                      />
                    </div>
                    <div className="faq-management-form-group">
                      <label>Status</label>
                      <select
                        value={entry.status}
                        onChange={(e) => updateMaintenanceEntry(index, 'status', e.target.value)}
                      >
                        <option value="collapsed">Collapsed</option>
                        <option value="expanded">Expanded</option>
                      </select>
                    </div>
                  </div>
                ))}
                <div className="faq-management-form-actions">
                  {!hasMaintenanceData && (
                    <button type="button" onClick={addMaintenanceEntry} className="faq-management-add-more-btn">
                      ➕ Add More FAQ
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="faq-management-submit-btn">
                    {hasMaintenanceData ? 'Update FAQs' : 'Add All FAQs'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing FAQs List - Only show when no data exists */}
            {!hasMaintenanceData && (
              <div className="faq-management-existing-faqs">
                <h3>Existing FAQs</h3>
                {faqData.maintenance.length === 0 ? (
                  <p className="faq-management-no-data">No FAQs found for this section.</p>
                ) : (
                  faqData.maintenance.map((faq, index) => (
                    <div key={faq.id} className="faq-management-faq-item">
                      <div className="faq-management-faq-header">
                        <h4>Q{index + 1}: {faq.question}</h4>
                        <div className="faq-management-faq-actions">
                          <button
                            onClick={() => updateFaqStatus('maintenance', faq.id, faq.status === 'expanded' ? 'collapsed' : 'expanded')}
                            className={`faq-management-status-btn ${faq.status === 'expanded' ? 'expanded' : 'collapsed'}`}
                          >
                            {faq.status === 'expanded' ? 'Expanded' : 'Collapsed'}
                          </button>
                        </div>
                      </div>
                      <div className="faq-management-faq-answer">
                        <p><strong>A:</strong> {faq.answer}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaqManagement; 