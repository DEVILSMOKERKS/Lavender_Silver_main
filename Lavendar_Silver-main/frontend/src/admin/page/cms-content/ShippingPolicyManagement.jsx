import React, { useState, useEffect, useContext } from 'react';
import './ShippingPolicyManagement.css';
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ShippingPolicyManagement = () => {
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
    { id: 'sections', label: 'Shipping Sections', icon: '📄' }
  ];

  useEffect(() => {
    fetchPolicyData();
  }, []);

  const fetchPolicyData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shipping-policy/all`);

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
              })).sort((a, b) => {
                const numA = parseFloat(a.section_number);
                const numB = parseFloat(b.section_number);
                return numA - numB;
              })
            };
          }).sort((a, b) => {
            const numA = parseFloat(a.section_number);
            const numB = parseFloat(b.section_number);
            return numA - numB;
          });
          setSectionEntries(entries);
        } else {
          setHasSectionsData(false);
          setSectionEntries([
            {
              section_number: '',
              section_title: '',
              content: '',
              parent_section_number: '',
              is_main_section: true,
              subsections: []
            }
          ]);
        }
      } else {
        showNotification('Failed to fetch Shipping Policy data.', 'error');
        console.error('❌ Failed to fetch Shipping Policy data:', response.data.message);
      }
    } catch (error) {
      showNotification('Error fetching Shipping Policy data.', 'error');
      console.error('🚨 Error fetching Shipping Policy data:', error);
      console.error('Error Response:', error.response);
      setHasHeaderData(false);
      setHasSectionsData(false);
      setHeaderForm({ page_title: '', last_updated: '' });
      setSectionEntries([
        {
          section_number: '',
          section_title: '',
          content: '',
          parent_section_number: '',
          is_main_section: true,
          subsections: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeaderForm(prev => ({ ...prev, [name]: value }));
  };

  const addSectionEntry = () => {
    setSectionEntries(prev => [
      ...prev,
      {
        section_number: '',
        section_title: '',
        content: '',
        parent_section_number: '',
        is_main_section: true,
        subsections: []
      }
    ]);
  };

  const removeSectionEntry = (index) => {
    setSectionEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateSectionEntry = (index, field, value) => {
    setSectionEntries(prev => {
      const newEntries = [...prev];
      newEntries[index][field] = value;

      // If section_number changes, update all its subsections' parent_section_number and section_number
      if (field === 'section_number') {
        const oldSectionNumber = prev[index].section_number;
        const newSectionNumber = value;

        newEntries[index].subsections = newEntries[index].subsections.map(sub => {
          let newSubNumber = sub.section_number;
          if (oldSectionNumber && newSectionNumber && newSubNumber.startsWith(`${oldSectionNumber}.`)) {
            newSubNumber = `${newSectionNumber}.${newSubNumber.split('.').slice(1).join('.')}`;
          } else if (!oldSectionNumber && newSectionNumber) {
            // If main section number was empty and now set, assign new subsection numbers
            const subIndex = parseFloat(sub.section_number.split('.')[1]);
            if (!isNaN(subIndex)) {
              newSubNumber = `${newSectionNumber}.${subIndex}`;
            }
          }
          return {
            ...sub,
            parent_section_number: newSectionNumber,
            section_number: newSubNumber
          };
        });
      }
      return newEntries;
    });
  };

  const addSubsection = (sectionIndex) => {
    setSectionEntries(prev => {
      const newEntries = [...prev];
      const mainSection = newEntries[sectionIndex];
      const baseSectionNumber = mainSection.section_number || (newEntries.length > 0 ? (newEntries.indexOf(mainSection) + 1).toString() : '1');
      const newSubsectionNumber = `${baseSectionNumber}.${mainSection.subsections.length + 1}`;

      mainSection.subsections.push({
        section_number: newSubsectionNumber,
        section_title: '',
        content: '',
        parent_section_number: baseSectionNumber
      });
      return newEntries;
    });
  };

  const removeSubsection = (sectionIndex, subsectionIndex) => {
    setSectionEntries(prev => {
      const newEntries = [...prev];
      newEntries[sectionIndex].subsections = newEntries[sectionIndex].subsections.filter((_, i) => i !== subsectionIndex);
      // Re-number subsections after removal
      newEntries[sectionIndex].subsections = newEntries[sectionIndex].subsections.map((sub, i) => ({
        ...sub,
        section_number: `${newEntries[sectionIndex].section_number}.${i + 1}`
      }));
      return newEntries;
    });
  };

  const updateSubsection = (sectionIndex, subsectionIndex, field, value) => {
    setSectionEntries(prev => {
      const newEntries = [...prev];
      newEntries[sectionIndex].subsections[subsectionIndex][field] = value;
      return newEntries;
    });
  };

  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      let response;
      if (hasHeaderData && policyData.header?.id) {
        response = await axios.put(`${API_BASE_URL}/api/shipping-policy/header/${policyData.header.id}`, headerForm, config);
      } else {
        response = await axios.post(`${API_BASE_URL}/api/shipping-policy/header`, headerForm, config);
      }

      if (response.data.success) {
        showNotification(`Header ${hasHeaderData ? 'updated' : 'created'} successfully!`, 'success');
        fetchPolicyData(); // Re-fetch data to update state
      } else {
        showNotification(`Failed to ${hasHeaderData ? 'update' : 'create'} header.`, 'error');
        console.error('Header submission error:', response.data.message);
      }
    } catch (error) {
      showNotification(`Error ${hasHeaderData ? 'updating' : 'creating'} header.`, 'error');
      console.error('Header submission error:', error);
      console.error('Error Response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      // Flatten all sections and subsections into a single array for submission
      const allSectionsToSubmit = [];
      sectionEntries.forEach(mainSection => {
        allSectionsToSubmit.push({
          id: mainSection.id, // Include ID for updates
          section_number: mainSection.section_number,
          section_title: mainSection.section_title,
          content: mainSection.content,
          parent_section_number: null // Main sections have no parent
        });
        mainSection.subsections.forEach(sub => {
          allSectionsToSubmit.push({
            id: sub.id, // Include ID for updates
            section_number: sub.section_number,
            section_title: sub.section_title,
            content: sub.content,
            parent_section_number: sub.parent_section_number
          });
        });
      });

      // Determine which sections need to be created and which need to be updated
      const existingSectionIds = policyData.sections.map(s => s.id);
      const sectionsToCreate = allSectionsToSubmit.filter(s => !s.id);
      const sectionsToUpdate = allSectionsToSubmit.filter(s => s.id && existingSectionIds.includes(s.id));

      // For simplicity, we'll delete all existing and re-create/update.
      // A more robust solution would involve diffing and only sending changes.
      // For now, we'll just send all current entries as updates/creates.
      // If we want to handle deletions, we'd need to compare `policyData.sections` with `allSectionsToSubmit`

      // If data exists, we assume we are updating existing entries or adding new ones.
      // If no data exists, we are creating new entries.

      let results;
      if (hasSectionsData) {
        // For update, we send all current entries. Backend should handle upsert logic or
        // we need to explicitly delete old ones not present in current `sectionEntries`.
        // For this implementation, we'll send all as PUT requests if they have an ID, POST if not.
        const updatePromises = allSectionsToSubmit.map(section => {
          if (section.id) {
            return axios.put(`${API_BASE_URL}/api/shipping-policy/sections/${section.id}`, section, config);
          } else {
            return axios.post(`${API_BASE_URL}/api/shipping-policy/sections`, section, config);
          }
        });
        results = await Promise.all(updatePromises);
      } else {
        // For create, send all as POST requests
        const createPromises = allSectionsToSubmit.map(section =>
          axios.post(`${API_BASE_URL}/api/shipping-policy/sections`, section, config)
        );
        results = await Promise.all(createPromises);
      }

      const allSuccess = results.every(res => res.data.success);

      if (allSuccess) {
        showNotification(`Sections ${hasSectionsData ? 'updated' : 'created'} successfully!`, 'success');
        fetchPolicyData(); // Re-fetch data to update state
      } else {
        showNotification(`Failed to ${hasSectionsData ? 'update' : 'create'} some sections.`, 'error');
        console.error('Sections submission error:', results);
      }
    } catch (error) {
      showNotification(`Error ${hasSectionsData ? 'updating' : 'creating'} sections.`, 'error');
      console.error('Sections submission error:', error);
      console.error('Error Response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading Shipping Policy Management...</div>;
  }

  return (
    <div className="shipping-policy-management">
      <header className="shipping-policy-management-page-header">
        <h1>Shipping Policy Management</h1>
        <p>Manage the content for your website's Shipping Policy page.</p>
      </header>

      <div className="shipping-policy-management-policy-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`shipping-policy-management-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="shipping-policy-management-tab-icon">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="shipping-policy-management-tab-content">
        {activeTab === 'header' && (
          <form onSubmit={handleHeaderSubmit}>
            <h2>{hasHeaderData ? 'Update Header' : 'Create Header'}</h2>
            {hasHeaderData && (
              <div className="shipping-policy-management-update-note">
                <p>Note: Header data already exists. You are in update mode.</p>
              </div>
            )}
            <div className="shipping-policy-management-form-group">
              <label htmlFor="page_title">Page Title</label>
              <input
                type="text"
                id="page_title"
                name="page_title"
                value={headerForm.page_title}
                onChange={handleHeaderChange}
                placeholder="e.g., SHIPPING POLICY"
                required
              />
            </div>
            <div className="shipping-policy-management-form-group">
              <label htmlFor="last_updated">Last Updated Date</label>
              <input
                type="date"
                id="last_updated"
                name="last_updated"
                value={headerForm.last_updated ? new Date(headerForm.last_updated).toISOString().split('T')[0] : ''}
                onChange={handleHeaderChange}
              />
            </div>
            <div className="shipping-policy-management-form-actions">
              <button type="submit" className="shipping-policy-management-submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (hasHeaderData ? 'Update Header' : 'Create Header')}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'sections' && (
          <form onSubmit={handleSectionsSubmit}>
            <h2>{hasSectionsData ? 'Update Shipping Sections' : 'Create Shipping Sections'}</h2>
            {hasSectionsData && (
              <div className="shipping-policy-management-update-note">
                <p>Note: Shipping sections data already exists. You are in update mode.</p>
              </div>
            )}

            <div className="shipping-policy-management-add-policy-section">
              {sectionEntries.map((entry, sectionIndex) => (
                <div key={sectionIndex} className="shipping-policy-management-policy-entry-card">
                  <div className="shipping-policy-management-entry-header">
                    <h4>Main Section {sectionIndex + 1}</h4>
                    {!hasSectionsData && ( // Only show remove button in create mode
                      <button
                        type="button"
                        className="shipping-policy-management-remove-entry-btn"
                        onClick={() => removeSectionEntry(sectionIndex)}
                      >
                        Remove Section
                      </button>
                    )}
                  </div>
                  <div className="shipping-policy-management-form-group">
                    <label htmlFor={`section_number-${sectionIndex}`}>Section Number</label>
                    <input
                      type="text"
                      id={`section_number-${sectionIndex}`}
                      name="section_number"
                      value={entry.section_number}
                      onChange={(e) => updateSectionEntry(sectionIndex, 'section_number', e.target.value)}
                      placeholder="e.g., 1, 2, 3"
                      required
                    />
                  </div>
                  <div className="shipping-policy-management-form-group">
                    <label htmlFor={`section_title-${sectionIndex}`}>Section Title</label>
                    <input
                      type="text"
                      id={`section_title-${sectionIndex}`}
                      name="section_title"
                      value={entry.section_title}
                      onChange={(e) => updateSectionEntry(sectionIndex, 'section_title', e.target.value)}
                      placeholder="e.g., SHIPPING INFORMATION"
                      required
                    />
                  </div>
                  <div className="shipping-policy-management-form-group">
                    <label htmlFor={`content-${sectionIndex}`}>Content</label>
                    <textarea
                      id={`content-${sectionIndex}`}
                      name="content"
                      value={entry.content}
                      onChange={(e) => updateSectionEntry(sectionIndex, 'content', e.target.value)}
                      placeholder="Enter section content here..."
                    ></textarea>
                  </div>

                  {/* Subsections */}
                  <div className="shipping-policy-management-subsections-container">
                    <div className="shipping-policy-management-subsections-header">
                      <h5>Subsections for {entry.section_number || 'this section'}</h5>
                      <button
                        type="button"
                        className="shipping-policy-management-add-subsection-btn"
                        onClick={() => addSubsection(sectionIndex)}
                      >
                        Add Subsection
                      </button>
                    </div>
                    {entry.subsections.map((subsection, subsectionIndex) => (
                      <div key={subsectionIndex} className="shipping-policy-management-subsection-card">
                        <div className="shipping-policy-management-subsection-header">
                          <h6>Subsection {subsection.section_number || `${entry.section_number}.${subsectionIndex + 1}`}</h6>
                          <button
                            type="button"
                            className="shipping-policy-management-remove-subsection-btn"
                            onClick={() => removeSubsection(sectionIndex, subsectionIndex)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="shipping-policy-management-form-group">
                          <label htmlFor={`subsection_number-${sectionIndex}-${subsectionIndex}`}>Subsection Number</label>
                          <input
                            type="text"
                            id={`subsection_number-${sectionIndex}-${subsectionIndex}`}
                            name="section_number"
                            value={subsection.section_number}
                            onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, 'section_number', e.target.value)}
                            placeholder="e.g., 1.1, 2.1"
                            required
                          />
                        </div>
                        <div className="shipping-policy-management-form-group">
                          <label htmlFor={`subsection_title-${sectionIndex}-${subsectionIndex}`}>Subsection Title</label>
                          <input
                            type="text"
                            id={`subsection_title-${sectionIndex}-${subsectionIndex}`}
                            name="section_title"
                            value={subsection.section_title}
                            onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, 'section_title', e.target.value)}
                            placeholder="e.g., Metro Cities"
                            required
                          />
                        </div>
                        <div className="shipping-policy-management-form-group">
                          <label htmlFor={`subsection_content-${sectionIndex}-${subsectionIndex}`}>Content</label>
                          <textarea
                            id={`subsection_content-${sectionIndex}-${subsectionIndex}`}
                            name="content"
                            value={subsection.content}
                            onChange={(e) => updateSubsection(sectionIndex, subsectionIndex, 'content', e.target.value)}
                            placeholder="Enter subsection content here..."
                          ></textarea>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!hasSectionsData && (
              <button type="button" className="shipping-policy-management-add-more-btn" onClick={addSectionEntry}>
                Add New Section
              </button>
            )}

            <div className="shipping-policy-management-form-actions">
              <button type="submit" className="shipping-policy-management-submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (hasSectionsData ? 'Update Sections' : 'Create Sections')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShippingPolicyManagement; 