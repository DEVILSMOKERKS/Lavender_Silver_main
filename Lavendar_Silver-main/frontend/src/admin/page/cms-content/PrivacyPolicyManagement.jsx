import React, { useState, useEffect, useContext } from 'react';
import './PrivacyPolicyManagement.css';
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const PrivacyPolicyManagement = () => {
  const { showNotification } = useNotification();
  const { token } = useContext(AdminContext);
  const [activeTab, setActiveTab] = useState('header');
  const [loading, setLoading] = useState(false);
  const [policyData, setPolicyData] = useState({
    header: null,
    sections: []
  });

  // Form states for header and sections
  const [headerForm, setHeaderForm] = useState({
    page_title: '',
    last_updated: ''
  });

  const [sectionEntries, setSectionEntries] = useState([
    {
      section_number: '',
      section_title: '',
      content: '',
      parent_section_number: '',
      is_main_section: true,
      subsections: []
    }
  ]);

  // State to track if data exists
  const [hasHeaderData, setHasHeaderData] = useState(false);
  const [hasSectionsData, setHasSectionsData] = useState(false);

  // Tabs configuration
  const tabs = [
    { id: 'header', label: 'Header', icon: '📋' },
    { id: 'sections', label: 'Policy Sections', icon: '📄' }
  ];

  useEffect(() => {
    fetchPolicyData();
  }, []);

  const fetchPolicyData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/privacy-policy/all`);

      if (response.data.success) {
        const data = response.data.data;

        setPolicyData({
          header: data.header || null,
          sections: data.sections || []
        });

        // Check if header data exists and pre-fill form
        if (data.header) {
          setHasHeaderData(true);
          setHeaderForm({
            page_title: data.header.page_title || '',
            last_updated: data.header.last_updated || ''
          });
        } else {
          setHasHeaderData(false);
          setHeaderForm({
            page_title: '',
            last_updated: ''
          });
        }

        // Check if sections data exists and pre-fill form
        if (data.sections && data.sections.length > 0) {
          setHasSectionsData(true);

          // Group sections by main sections and subsections
          const mainSections = data.sections.filter(section => !section.parent_section_number);
          const subsections = data.sections.filter(section => section.parent_section_number);

          const entries = mainSections.map(section => {
            const sectionSubsections = subsections.filter(sub => sub.parent_section_number === section.section_number);
            return {
              id: section.id,
              section_number: section.section_number || '',
              section_title: section.section_title || '',
              content: section.content || '',
              parent_section_number: section.parent_section_number || '',
              is_main_section: true,
              subsections: sectionSubsections.map(sub => ({
                id: sub.id,
                section_number: sub.section_number || '',
                section_title: sub.section_title || '',
                content: sub.content || '',
                parent_section_number: sub.parent_section_number || ''
              }))
            };
          });

          setSectionEntries(entries);
        } else {
          setHasSectionsData(false);
          setSectionEntries([{
            section_number: '',
            section_title: '',
            content: '',
            parent_section_number: '',
            is_main_section: true,
            subsections: []
          }]);
        }

      } else {
        console.error('❌ Failed to fetch Privacy Policy data:', response.data.message);
        // Set default empty state
        setPolicyData({
          header: null,
          sections: []
        });
      }
    } catch (error) {
      console.error('🚨 Error fetching Privacy Policy data:', error);
      console.error('Error Response:', error.response);

      // Set default empty state even on error
      setPolicyData({
        header: null,
        sections: []
      });

      setHasHeaderData(false);
      setHasSectionsData(false);

      // Show error notification
      showNotification('Failed to load Privacy Policy data. Please try again.', 'error');
    }
  };

  // Helper functions for multiple sections
  const addSectionEntry = () => {
    setSectionEntries([...sectionEntries, {
      section_number: '',
      section_title: '',
      content: '',
      parent_section_number: '',
      is_main_section: true,
      subsections: []
    }]);
  };

  const removeSectionEntry = (index) => {
    if (sectionEntries.length > 1) {
      setSectionEntries(sectionEntries.filter((_, i) => i !== index));
    }
  };

  const updateSectionEntry = (index, field, value) => {
    const updatedEntries = [...sectionEntries];
    updatedEntries[index][field] = value;

    // If section number is updated, update all subsection numbers
    if (field === 'section_number' && value) {
      updatedEntries[index].subsections.forEach((subsection, subIndex) => {
        subsection.section_number = `${value}.${subIndex + 1}`;
        subsection.parent_section_number = value;
      });
    }

    setSectionEntries(updatedEntries);
  };

  const addSubsection = (sectionIndex) => {
    const updatedEntries = [...sectionEntries];
    const parentSection = updatedEntries[sectionIndex];

    // If section number is empty, use the index + 1 as default
    const sectionNumber = parentSection.section_number || (sectionIndex + 1).toString();
    const subsectionNumber = `${sectionNumber}.${parentSection.subsections.length + 1}`;

    updatedEntries[sectionIndex].subsections.push({
      section_number: subsectionNumber,
      section_title: '',
      content: '',
      parent_section_number: sectionNumber
    });

    // Also update the main section number if it was empty
    if (!parentSection.section_number) {
      updatedEntries[sectionIndex].section_number = sectionNumber;
    }

    setSectionEntries(updatedEntries);
  };

  const removeSubsection = (sectionIndex, subsectionIndex) => {
    const updatedEntries = [...sectionEntries];
    updatedEntries[sectionIndex].subsections.splice(subsectionIndex, 1);

    // Update subsection numbers
    updatedEntries[sectionIndex].subsections.forEach((subsection, index) => {
      subsection.section_number = `${updatedEntries[sectionIndex].section_number}.${index + 1}`;
    });

    setSectionEntries(updatedEntries);
  };

  const updateSubsection = (sectionIndex, subsectionIndex, field, value) => {
    const updatedEntries = [...sectionEntries];
    updatedEntries[sectionIndex].subsections[subsectionIndex][field] = value;
    setSectionEntries(updatedEntries);
  };

  // Handle form submissions
  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasHeaderData) {
        // Update existing header
        const response = await axios.put(`${API_BASE_URL}/api/privacy-policy/header/${policyData.header.id}`, headerForm, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        showNotification('Header updated successfully', 'success');
      } else {
        // Create new header
        const response = await axios.post(`${API_BASE_URL}/api/privacy-policy/header`, headerForm, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        showNotification('Header created successfully', 'success');
      }
      fetchPolicyData();
    } catch (error) {
      console.error('Header Error:', error);
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

  const handleSectionsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasSectionsData) {
        // Update existing sections and subsections
        const allSections = [];

        // Add main sections
        sectionEntries.forEach(entry => {
          allSections.push(entry);
          // Add subsections
          entry.subsections.forEach(subsection => {
            allSections.push(subsection);
          });
        });

        const promises = allSections.map(section =>
          axios.put(`${API_BASE_URL}/api/privacy-policy/sections/${section.id}`, section, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Policy sections updated successfully', 'success');
      } else {
        // Create new sections and subsections
        const allSections = [];

        // Add main sections
        sectionEntries.forEach(entry => {
          allSections.push(entry);
          // Add subsections
          entry.subsections.forEach(subsection => {
            allSections.push(subsection);
          });
        });

        const promises = allSections.map(section =>
          axios.post(`${API_BASE_URL}/api/privacy-policy/sections`, section, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(promises);
        showNotification('Policy sections created successfully', 'success');
      }
      fetchPolicyData();
    } catch (error) {
      console.error('Sections Error:', error);
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

  return (
    <div className="privacy-policy-management">
      <div className="privacy-policy-management-page-header">
        <h1>Privacy Policy Management</h1>
        <p>Manage Privacy Policy content for the website</p>
      </div>

      {/* Loading State */}
      {loading && <div className="privacy-policy-management-loading">Loading...</div>}

      {/* Tabs */}
      <div className="privacy-policy-management-policy-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`privacy-policy-management-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="privacy-policy-management-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'header' && (
        <div className="privacy-policy-management-tab-content">
          <h2>Policy Header</h2>

          {/* Header Form */}
          <div className="privacy-policy-management-add-policy-section">
            <h3>{hasHeaderData ? 'Update Header' : 'Add Header'}</h3>
            {hasHeaderData && (
              <div className="privacy-policy-management-update-note">
                <p>📝 Header data exists. You can update the existing header below.</p>
              </div>
            )}
            <form onSubmit={handleHeaderSubmit}>
              <div className="privacy-policy-management-form-group">
                <label>Page Title</label>
                <input
                  type="text"
                  value={headerForm.page_title}
                  onChange={(e) => setHeaderForm({ ...headerForm, page_title: e.target.value })}
                  placeholder="Enter page title (e.g., PRIVACY POLICY)"
                  required
                />
              </div>
              <div className="privacy-policy-management-form-group">
                <label>Last Updated Date</label>
                <input
                  type="date"
                  value={headerForm.last_updated}
                  onChange={(e) => setHeaderForm({ ...headerForm, last_updated: e.target.value })}
                  required
                />
              </div>
              <div className="privacy-policy-management-form-actions">
                <button type="submit" disabled={loading} className="privacy-policy-management-submit-btn">
                  {hasHeaderData ? 'Update Header' : 'Add Header'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Header Display */}
          {!hasHeaderData && policyData.header && (
            <div className="privacy-policy-management-existing-policy">
              <h3>Existing Header</h3>
              <div className="privacy-policy-management-policy-item">
                <h4>Title: {policyData.header.page_title}</h4>
                <p>Last Updated: {policyData.header.last_updated}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="privacy-policy-management-tab-content">
          <h2>Policy Sections</h2>

          {/* Sections Form */}
          <div className="privacy-policy-management-add-policy-section">
            <h3>{hasSectionsData ? 'Update Sections' : 'Add Sections'}</h3>
            {hasSectionsData && (
              <div className="privacy-policy-management-update-note">
                <p>📝 Policy sections exist. You can update the existing sections below.</p>
              </div>
            )}
            <form onSubmit={handleSectionsSubmit}>
              {sectionEntries.map((entry, index) => (
                <div key={index} className="privacy-policy-management-policy-entry-card">
                  <div className="privacy-policy-management-entry-header">
                    <h4>Main Section {index + 1}</h4>
                    {sectionEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSectionEntry(index)}
                        className="privacy-policy-management-remove-entry-btn"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  {/* Main Section Fields */}
                  <div className="privacy-policy-management-form-group">
                    <label>Section Number</label>
                    <input
                      type="text"
                      value={entry.section_number}
                      onChange={(e) => updateSectionEntry(index, 'section_number', e.target.value)}
                      placeholder="Enter section number (e.g., 1, 2, 3)"
                      required
                    />
                  </div>
                  <div className="privacy-policy-management-form-group">
                    <label>Section Title</label>
                    <input
                      type="text"
                      value={entry.section_title}
                      onChange={(e) => updateSectionEntry(index, 'section_title', e.target.value)}
                      placeholder="Enter section title (e.g., INTRODUCTION, INFORMATION WE COLLECT)"
                      required
                    />
                  </div>
                  <div className="privacy-policy-management-form-group">
                    <label>Content</label>
                    <textarea
                      value={entry.content}
                      onChange={(e) => updateSectionEntry(index, 'content', e.target.value)}
                      placeholder="Enter main section content"
                      rows="4"
                    />
                  </div>

                  {/* Subsections */}
                  <div className="privacy-policy-management-subsections-container">
                    <div className="privacy-policy-management-subsections-header">
                      <h5>Subsections</h5>
                      <button
                        type="button"
                        onClick={() => addSubsection(index)}
                        className="privacy-policy-management-add-subsection-btn"
                      >
                        ➕ Add Subsection
                      </button>
                    </div>

                    {entry.subsections.map((subsection, subIndex) => (
                      <div key={subIndex} className="privacy-policy-management-subsection-card">
                        <div className="privacy-policy-management-subsection-header">
                          <h6>Subsection {subIndex + 1}</h6>
                          <button
                            type="button"
                            onClick={() => removeSubsection(index, subIndex)}
                            className="privacy-policy-management-remove-subsection-btn"
                          >
                            ✕ Remove
                          </button>
                        </div>

                        <div className="privacy-policy-management-form-group">
                          <label>Subsection Number</label>
                          <input
                            type="text"
                            value={subsection.section_number}
                            onChange={(e) => updateSubsection(index, subIndex, 'section_number', e.target.value)}
                            placeholder={`${entry.section_number}.${subIndex + 1}`}
                            required
                          />
                        </div>
                        <div className="privacy-policy-management-form-group">
                          <label>Subsection Title</label>
                          <input
                            type="text"
                            value={subsection.section_title}
                            onChange={(e) => updateSubsection(index, subIndex, 'section_title', e.target.value)}
                            placeholder="Enter subsection title (e.g., Personal Information)"
                            required
                          />
                        </div>
                        <div className="privacy-policy-management-form-group">
                          <label>Subsection Content</label>
                          <textarea
                            value={subsection.content}
                            onChange={(e) => updateSubsection(index, subIndex, 'content', e.target.value)}
                            placeholder="Enter subsection content"
                            rows="4"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="privacy-policy-management-form-actions">
                {!hasSectionsData && (
                  <button type="button" onClick={addSectionEntry} className="privacy-policy-management-add-more-btn">
                    ➕ Add More Section
                  </button>
                )}
                <button type="submit" disabled={loading} className="privacy-policy-management-submit-btn">
                  {hasSectionsData ? 'Update Sections' : 'Add All Sections'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Sections Display */}
          {!hasSectionsData && policyData.sections.length > 0 && (
            <div className="privacy-policy-management-existing-policy">
              <h3>Existing Sections</h3>
              {(() => {
                // Group sections by main sections and subsections
                const mainSections = policyData.sections.filter(section => !section.parent_section_number);
                const subsections = policyData.sections.filter(section => section.parent_section_number);

                return mainSections.map((section, index) => {
                  const sectionSubsections = subsections.filter(sub => sub.parent_section_number === section.section_number);
                  return (
                    <div key={section.id} className="privacy-policy-management-policy-item">
                      <h4>{section.section_number} {section.section_title}</h4>
                      <p>{section.content}</p>

                      {/* Show subsections */}
                      {sectionSubsections.length > 0 && (
                        <div className="privacy-policy-management-subsections-display">
                          <h5>Subsections:</h5>
                          {sectionSubsections.map((subsection, subIndex) => (
                            <div key={subsection.id} className="privacy-policy-management-subsection-display">
                              <h6>{subsection.section_number} {subsection.section_title}</h6>
                              <p>{subsection.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicyManagement; 