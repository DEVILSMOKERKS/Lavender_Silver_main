import React, { useState, useEffect, useContext } from 'react';
import './AboutUsManagement.css';
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AboutUsManagement = () => {
  const { showNotification } = useNotification();
  const { token } = useContext(AdminContext);
  const [activeTab, setActiveTab] = useState('about-section');
  const [loading, setLoading] = useState(false);
  const [aboutData, setAboutData] = useState({
    aboutSection: null,
    missionVision: [],
    journeyTimeline: [],
    craftsmanship: null,
    whatMakesUs: null,
    whoWeAre: null
  });

  // Form states
  const [aboutSectionForm, setAboutSectionForm] = useState({
    section_title: '',
    subheading: '',
    description: '',
    button_text: '',
    badge_text: '',
    is_active: true
  });

  const [missionVisionForm, setMissionVisionForm] = useState({
    type: 'mission',
    title: '',
    description: '',
    is_active: true
  });

  const [journeyForm, setJourneyForm] = useState({
    heading_title: '',
    year: '',
    description: '',
    sort_order: 0,
    is_active: true
  });

  const [journeyHeading, setJourneyHeading] = useState('');
  const [journeyEntries, setJourneyEntries] = useState([
    {
      year: '',
      description: '',
      sort_order: 0,
      is_active: true,
      image_url: null
    }
  ]);

  const [missionVisionEntries, setMissionVisionEntries] = useState([
    {
      type: 'mission',
      title: '',
      description: '',
      is_active: true,
      icon_url: null
    }
  ]);

  const [craftsmanshipForm, setCraftsmanshipForm] = useState({
    heading_title: '',
    subheading: '',
    card1_title: '',
    card1_description: '',
    card2_title: '',
    card2_description: '',
    card3_title: '',
    card3_description: '',
    is_active: true
  });

  const [whatMakesUsForm, setWhatMakesUsForm] = useState({
    section_heading: '',
    point1_title: '',
    point1_subtitle: '',
    point2_title: '',
    point2_subtitle: '',
    point3_title: '',
    point3_subtitle: '',
    point4_title: '',
    point4_subtitle: '',
    is_active: true
  });

  const [whoWeAreForm, setWhoWeAreForm] = useState({
    heading_title: '',
    subheading_title: '',
    content_paragraph: '',
    bold_text: '',
    is_active: true
  });

  // File states
  const [aboutSectionFiles, setAboutSectionFiles] = useState({
    image_url: null
  });

  const [missionVisionFiles, setMissionVisionFiles] = useState({
    icon_url: null
  });

  const [journeyFiles, setJourneyFiles] = useState({
    image_url: null
  });

  const [craftsmanshipFiles, setCraftsmanshipFiles] = useState({
    card1_icon_url: null,
    card2_icon_url: null,
    card3_icon_url: null
  });

  const [whatMakesUsFiles, setWhatMakesUsFiles] = useState({
    background_image: null,
    side_image: null
  });

  const [whoWeAreFiles, setWhoWeAreFiles] = useState({
    image_url: null
  });

  // Fetch all about us data
  const fetchAboutUsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/about-us/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const { data } = response.data;
      if (response.data.success) {
        setAboutData(data);
        // Pre-fill forms with existing data
        if (data.aboutSection) {
          setAboutSectionForm({
            section_title: data.aboutSection.section_title || '',
            subheading: data.aboutSection.subheading || '',
            description: data.aboutSection.description || '',
            button_text: data.aboutSection.button_text || '',
            badge_text: data.aboutSection.badge_text || '',
            is_active: data.aboutSection.is_active
          });
        }
        if (data.craftsmanship) {
          setCraftsmanshipForm({
            heading_title: data.craftsmanship.heading_title || '',
            subheading: data.craftsmanship.subheading || '',
            card1_title: data.craftsmanship.card1_title || '',
            card1_description: data.craftsmanship.card1_description || '',
            card2_title: data.craftsmanship.card2_title || '',
            card2_description: data.craftsmanship.card2_description || '',
            card3_title: data.craftsmanship.card3_title || '',
            card3_description: data.craftsmanship.card3_description || '',
            is_active: data.craftsmanship.is_active
          });
        }
        if (data.whatMakesUs) {
          setWhatMakesUsForm({
            section_heading: data.whatMakesUs.section_heading || '',
            point1_title: data.whatMakesUs.point1_title || '',
            point1_subtitle: data.whatMakesUs.point1_subtitle || '',
            point2_title: data.whatMakesUs.point2_title || '',
            point2_subtitle: data.whatMakesUs.point2_subtitle || '',
            point3_title: data.whatMakesUs.point3_title || '',
            point3_subtitle: data.whatMakesUs.point3_subtitle || '',
            point4_title: data.whatMakesUs.point4_title || '',
            point4_subtitle: data.whatMakesUs.point4_subtitle || '',
            is_active: data.whatMakesUs.is_active
          });
        }
        if (data.whoWeAre) {
          setWhoWeAreForm({
            heading_title: data.whoWeAre.heading_title || '',
            subheading_title: data.whoWeAre.subheading_title || '',
            content_paragraph: data.whoWeAre.content_paragraph || '',
            bold_text: data.whoWeAre.bold_text || '',
            is_active: data.whoWeAre.is_active
          });
        }

        // Pre-fill journey timeline form if data exists
        if (data.journeyTimeline && data.journeyTimeline.length > 0) {
          const firstEntry = data.journeyTimeline[0];
          setJourneyHeading(firstEntry.heading_title || '');

          const journeyEntriesData = data.journeyTimeline.map(item => ({
            year: item.year || '',
            description: item.description || '',
            sort_order: item.sort_order || 0,
            is_active: item.is_active,
            image_url: null // Don't pre-fill files
          }));
          setJourneyEntries(journeyEntriesData);
        }

        // Pre-fill mission vision form if data exists
        if (data.missionVision && data.missionVision.length > 0) {
          const missionVisionEntriesData = data.missionVision.map(item => ({
            type: item.type || 'mission',
            title: item.title || '',
            description: item.description || '',
            is_active: item.is_active,
            icon_url: null // Don't pre-fill files
          }));
          setMissionVisionEntries(missionVisionEntriesData);
        }
      }
    } catch (error) {
      showNotification('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutUsData();
  }, []);

  // Helper function to create FormData
  const createFormData = (formData, files) => {
    const data = new FormData();

    // Add form fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });

    // Add files
    if (files) {
      Object.keys(files).forEach(key => {
        if (files[key]) {
          data.append(key, files[key]);
        }
      });
    }

    return data;
  };

  // Journey Timeline helper functions
  const addJourneyEntry = () => {
    setJourneyEntries([...journeyEntries, {
      year: '',
      description: '',
      sort_order: journeyEntries.length,
      is_active: true,
      image_url: null
    }]);
  };

  const removeJourneyEntry = (index) => {
    if (journeyEntries.length > 1) {
      const newEntries = journeyEntries.filter((_, i) => i !== index);
      setJourneyEntries(newEntries);
    }
  };

  const updateJourneyEntry = (index, field, value) => {
    const newEntries = [...journeyEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setJourneyEntries(newEntries);
  };

  const updateJourneyEntryFile = (index, file) => {
    const newEntries = [...journeyEntries];
    newEntries[index] = { ...newEntries[index], image_url: file };
    setJourneyEntries(newEntries);
  };

  const addMissionVisionEntry = () => {
    setMissionVisionEntries([
      ...missionVisionEntries,
      {
        type: 'mission',
        title: '',
        description: '',
        is_active: true,
        icon_url: null
      }
    ]);
  };

  const removeMissionVisionEntry = (index) => {
    if (missionVisionEntries.length > 1) {
      const updatedEntries = missionVisionEntries.filter((_, i) => i !== index);
      setMissionVisionEntries(updatedEntries);
    }
  };

  const updateMissionVisionEntry = (index, field, value) => {
    const updatedEntries = [...missionVisionEntries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setMissionVisionEntries(updatedEntries);
  };

  const updateMissionVisionEntryFile = (index, file) => {
    const updatedEntries = [...missionVisionEntries];
    updatedEntries[index] = { ...updatedEntries[index], icon_url: file };
    setMissionVisionEntries(updatedEntries);
  };

  // Handle form submissions
  const handleAboutSectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = aboutData.aboutSection
        ? `${API_BASE_URL}/api/about-us/section/${aboutData.aboutSection.id}`
        : `${API_BASE_URL}/api/about-us/section`;
      const method = aboutData.aboutSection ? 'put' : 'post';

      const formData = createFormData(aboutSectionForm, aboutSectionFiles);

      const response = await axios[method](url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showNotification(aboutData.aboutSection ? 'About section updated successfully' : 'About section created successfully', 'success');
        fetchAboutUsData();
        // Clear files after successful upload
        setAboutSectionFiles({ image_url: null });
      } else {
        showNotification(response.data.message || 'Error updating about section', 'error');
      }
    } catch (error) {
      console.error('About Section Error:', error);
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

  const handleMissionVisionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (aboutData.missionVision && aboutData.missionVision.length > 0) {
        // Update existing entries
        const promises = aboutData.missionVision.map(async (existingItem, index) => {
          const entry = missionVisionEntries[index];
          if (!entry) return null;

          const formData = new FormData();

          // Add form fields
          Object.keys(entry).forEach(key => {
            if (key !== 'icon_url' && entry[key] !== null && entry[key] !== undefined) {
              formData.append(key, entry[key]);
            }
          });

          // Add image file if exists
          if (entry.icon_url) {
            formData.append('icon_url', entry.icon_url);
          }

          return axios.put(`${API_BASE_URL}/api/about-us/mission-vision/${existingItem.id}`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        });

        await Promise.all(promises.filter(Boolean));
        showNotification('Mission & Vision updated successfully', 'success');
      } else {
        // Create new entries
        const promises = missionVisionEntries.map(async (entry, index) => {
          const formData = new FormData();

          // Add form fields
          Object.keys(entry).forEach(key => {
            if (key !== 'icon_url' && entry[key] !== null && entry[key] !== undefined) {
              formData.append(key, entry[key]);
            }
          });

          // Add image file if exists
          if (entry.icon_url) {
            formData.append('icon_url', entry.icon_url);
          }

          return axios.post(`${API_BASE_URL}/api/about-us/mission-vision`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        });

        await Promise.all(promises);
        showNotification('Mission & Vision entries created successfully', 'success');

        // Reset form after create
        setMissionVisionEntries([{
          type: 'mission',
          title: '',
          description: '',
          is_active: true,
          icon_url: null
        }]);
      }

      fetchAboutUsData();
    } catch (error) {
      console.error('Mission Vision Error:', error);
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

  const handleJourneySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (aboutData.journeyTimeline && aboutData.journeyTimeline.length > 0) {
        // Update existing entries
        const promises = aboutData.journeyTimeline.map(async (existingItem, index) => {
          const entry = journeyEntries[index];
          if (!entry) return null;

          const formData = new FormData();
          formData.append('heading_title', journeyHeading);

          // Add form fields
          Object.keys(entry).forEach(key => {
            if (key !== 'image_url' && entry[key] !== null && entry[key] !== undefined) {
              formData.append(key, entry[key]);
            }
          });

          // Add image file if exists
          if (entry.image_url) {
            formData.append('image_url', entry.image_url);
          }

          return axios.put(`${API_BASE_URL}/api/about-us/journey/${existingItem.id}`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        });

        await Promise.all(promises.filter(Boolean));
        showNotification('Journey timeline updated successfully', 'success');
      } else {
        // Create new entries
        const promises = journeyEntries.map(async (entry, index) => {
          const formData = new FormData();

          // Add common heading title for all entries
          formData.append('heading_title', journeyHeading);

          // Add form fields
          Object.keys(entry).forEach(key => {
            if (key !== 'image_url' && entry[key] !== null && entry[key] !== undefined) {
              formData.append(key, entry[key]);
            }
          });

          // Add image file if exists
          if (entry.image_url) {
            formData.append('image_url', entry.image_url);
          }

          return axios.post(`${API_BASE_URL}/api/about-us/journey`, formData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        });

        await Promise.all(promises);
        showNotification('Journey timeline entries created successfully', 'success');

        // Reset form after create
        setJourneyHeading('');
        setJourneyEntries([{
          year: '',
          description: '',
          sort_order: 0,
          is_active: true,
          image_url: null
        }]);
      }

      fetchAboutUsData();
    } catch (error) {
      console.error('Journey Timeline Error:', error);
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

  const handleCraftsmanshipSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = aboutData.craftsmanship
        ? `${API_BASE_URL}/api/about-us/craftsmanship/${aboutData.craftsmanship.id}`
        : `${API_BASE_URL}/api/about-us/craftsmanship`;
      const method = aboutData.craftsmanship ? 'put' : 'post';

      const formData = createFormData(craftsmanshipForm, craftsmanshipFiles);

      const response = await axios[method](url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showNotification('Craftsmanship section updated successfully', 'success');
        fetchAboutUsData();
        setCraftsmanshipFiles({ card1_icon_url: null, card2_icon_url: null, card3_icon_url: null });
      } else {
        showNotification(response.data.message || 'Error updating craftsmanship section', 'error');
      }
    } catch (error) {
      console.error('Craftsmanship Error:', error);
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

  const handleWhatMakesUsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = aboutData.whatMakesUs
        ? `${API_BASE_URL}/api/about-us/what-makes-us/${aboutData.whatMakesUs.id}`
        : `${API_BASE_URL}/api/about-us/what-makes-us`;
      const method = aboutData.whatMakesUs ? 'put' : 'post';

      const formData = createFormData(whatMakesUsForm, whatMakesUsFiles);

      const response = await axios[method](url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showNotification(aboutData.whatMakesUs ? 'What Makes Us section updated successfully' : 'What Makes Us section created successfully', 'success');
        fetchAboutUsData();
        setWhatMakesUsFiles({ background_image: null, side_image: null });
      } else {
        showNotification(response.data.message || 'Error updating what makes us section', 'error');
      }
    } catch (error) {
      console.error('What Makes Us Error:', error);
      console.error('Error Response:', error.response);

      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        // Request was made but no response received
        showNotification('Network error: No response from server', 'error');
      } else {
        // Something else happened
        showNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWhoWeAreSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = aboutData.whoWeAre
        ? `${API_BASE_URL}/api/about-us/who-we-are/${aboutData.whoWeAre.id}`
        : `${API_BASE_URL}/api/about-us/who-we-are`;
      const method = aboutData.whoWeAre ? 'put' : 'post';

      const formData = createFormData(whoWeAreForm, whoWeAreFiles);

      const response = await axios[method](url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showNotification('Who We Are section updated successfully', 'success');
        fetchAboutUsData();
        setWhoWeAreFiles({ image_url: null });
      } else {
        showNotification(response.data.message || 'Error updating who we are section', 'error');
      }
    } catch (error) {
      console.error('Who We Are Error:', error);
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

  // Update mission/vision
  const updateMissionVision = async (id, updatedData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/about-us/mission-vision/${id}`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('Mission/Vision updated successfully', 'success');
        fetchAboutUsData();
      } else {
        showNotification(response.data.message || 'Error updating mission/vision', 'error');
      }
    } catch (error) {
      console.error('Update Mission Vision Error:', error);
      console.error('Error Response:', error.response);

      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        showNotification('Network error: No response from server', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    }
  };

  // Update journey timeline
  const updateJourneyTimeline = async (id, updatedData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/about-us/journey/${id}`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showNotification('Journey timeline updated successfully', 'success');
        fetchAboutUsData();
      } else {
        showNotification(response.data.message || 'Error updating journey timeline', 'error');
      }
    } catch (error) {
      console.error('Update Journey Timeline Error:', error);
      console.error('Error Response:', error.response);

      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        showNotification(`Error: ${errorMessage}`, 'error');
      } else if (error.request) {
        showNotification('Network error: No response from server', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    }
  };

  const tabs = [
    { id: 'about-section', label: 'About Section' },
    { id: 'mission-vision', label: 'Mission & Vision' },
    { id: 'journey', label: 'Journey Timeline' },
    { id: 'craftsmanship', label: 'Craftsmanship' },
    { id: 'what-makes-us', label: 'What Makes Us' },
    { id: 'who-we-are', label: 'Who We Are' }
  ];

  return (
    <div className="about-us-management">
      <div className="about-us-management-about-us-header">
        <h1>About Us Management</h1>
        <p>Manage all About Us page content and sections</p>
      </div>

      <div className="about-us-management-about-us-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`about-us-management-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="about-us-management-about-us-content">
        {loading && <div className="about-us-management-loading">Loading...</div>}

        {/* About Section Tab */}
        {activeTab === 'about-section' && (
          <div className="about-us-management-tab-content">
            <h2>About Section</h2>
            {!aboutData.aboutSection ? (
              <div className="about-us-management-no-data-message">
                <p>No About Section data found. Please create the initial data.</p>
              </div>
            ) : null}
            <form onSubmit={handleAboutSectionSubmit}>
              <div className="about-us-management-form-group">
                <label>Section Title</label>
                <input
                  type="text"
                  value={aboutSectionForm.section_title}
                  onChange={(e) => setAboutSectionForm({ ...aboutSectionForm, section_title: e.target.value })}
                  placeholder="e.g., WHO WE ARE"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Subheading</label>
                <input
                  type="text"
                  value={aboutSectionForm.subheading}
                  onChange={(e) => setAboutSectionForm({ ...aboutSectionForm, subheading: e.target.value })}
                  placeholder="e.g., CRAFTING MORE THAN JEWELLERY..."
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Description</label>
                <textarea
                  value={aboutSectionForm.description}
                  onChange={(e) => setAboutSectionForm({ ...aboutSectionForm, description: e.target.value })}
                  placeholder="Main content paragraph"
                  rows="4"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Button Text</label>
                <input
                  type="text"
                  value={aboutSectionForm.button_text}
                  onChange={(e) => setAboutSectionForm({ ...aboutSectionForm, button_text: e.target.value })}
                  placeholder="e.g., View More"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAboutSectionFiles({ ...aboutSectionFiles, image_url: e.target.files[0] })}
                />
                {aboutData.aboutSection?.image_url && (
                  <div className="about-us-management-current-image">
                    <p>Current: {aboutData.aboutSection.image_url}</p>
                  </div>
                )}
              </div>
              <div className="about-us-management-form-group">
                <label>Badge Text</label>
                <input
                  type="text"
                  value={aboutSectionForm.badge_text}
                  onChange={(e) => setAboutSectionForm({ ...aboutSectionForm, badge_text: e.target.value })}
                  placeholder="e.g., PVJ"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={aboutSectionForm.is_active}
                    onChange={(e) => setAboutSectionForm({ ...aboutSectionForm, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <button type="submit" disabled={loading}>
                {aboutData.aboutSection ? 'Update' : 'Create'} About Section
              </button>
              {aboutData.aboutSection && (
                <div className="about-us-management-update-note">
                  <p>✅ Data exists. You can update the content above.</p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Mission & Vision Tab */}
        {activeTab === 'mission-vision' && (
          <div className="about-us-management-tab-content">
            <h2>Mission & Vision</h2>

            {!aboutData.missionVision || aboutData.missionVision.length === 0 ? (
              <div className="about-us-management-no-data-message">
                <p>No Mission & Vision data found. Please create the initial data.</p>
              </div>
            ) : null}

            <form onSubmit={handleMissionVisionSubmit}>
              {missionVisionEntries.map((entry, index) => (
                <div key={index} className="about-us-management-journey-entry-card">
                  <div className="about-us-management-entry-header">
                    <h4>Entry {index + 1}</h4>
                    {missionVisionEntries.length > 1 && (!aboutData.missionVision || aboutData.missionVision.length === 0) && (
                      <button
                        type="button"
                        onClick={() => removeMissionVisionEntry(index)}
                        className="about-us-management-remove-entry-btn"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  <div className="about-us-management-form-row">
                    <div className="about-us-management-form-group">
                      <label>Type</label>
                      <select
                        value={index === 0 ? 'mission' : 'vision'}
                        disabled
                      >
                        {index === 0 ? (
                          <option value="mission">Mission</option>
                        ) : (
                          <option value="vision">Vision</option>
                        )}
                      </select>
                    </div>
                    <div className="about-us-management-form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => updateMissionVisionEntry(index, 'title', e.target.value)}
                        placeholder={index === 0 ? "e.g., OUR MISSION" : "e.g., OUR VISION"}
                      />
                    </div>
                  </div>
                  <div className="about-us-management-form-group">
                    <label>Description</label>
                    <textarea
                      value={entry.description}
                      onChange={(e) => updateMissionVisionEntry(index, 'description', e.target.value)}
                      placeholder="Description content"
                      rows="3"
                    />
                  </div>
                  <div className="about-us-management-form-group">
                    <label>Icon Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateMissionVisionEntryFile(index, e.target.files[0])}
                    />
                    {aboutData.missionVision && aboutData.missionVision[index]?.icon_url && (
                      <div className="about-us-management-current-image">
                        <p>Current: {aboutData.missionVision[index].icon_url}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="about-us-management-form-actions">
                {missionVisionEntries.length < 2 && (!aboutData.missionVision || aboutData.missionVision.length === 0) && (
                  <button
                    type="button"
                    onClick={addMissionVisionEntry}
                    className="about-us-management-add-more-btn"
                  >
                    ➕ Add More Entry
                  </button>
                )}
                <button type="submit" disabled={loading} className="about-us-management-submit-btn">
                  {aboutData.missionVision && aboutData.missionVision.length > 0 ? 'Update' : 'Add All'} Mission & Vision
                </button>
              </div>

              {aboutData.missionVision && aboutData.missionVision.length > 0 && (
                <div className="about-us-management-update-note">
                  <p>✅ Data exists. You can update the content above.</p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Journey Timeline Tab */}
        {activeTab === 'journey' && (
          <div className="about-us-management-tab-content">
            <h2>Journey Timeline</h2>

            {!aboutData.journeyTimeline || aboutData.journeyTimeline.length === 0 ? (
              <div className="about-us-management-no-data-message">
                <p>No Journey Timeline data found. Please create the initial data.</p>
              </div>
            ) : null}

            <form onSubmit={handleJourneySubmit}>
              {/* Common Heading Title */}
              <div className="about-us-management-common-heading-section">
                <div className="about-us-management-form-group">
                  <label>Heading Title (Common for all entries)</label>
                  <input
                    type="text"
                    value={journeyHeading}
                    onChange={(e) => setJourneyHeading(e.target.value)}
                    placeholder="e.g., THE JOURNEY"
                  />
                </div>
              </div>

              {journeyEntries.map((entry, index) => (
                <div key={index} className="about-us-management-journey-entry-card">
                  <div className="about-us-management-entry-header">
                    <h4>Entry {index + 1}</h4>
                    {journeyEntries.length > 1 && (!aboutData.journeyTimeline || aboutData.journeyTimeline.length === 0) && (
                      <button
                        type="button"
                        onClick={() => removeJourneyEntry(index)}
                        className="about-us-management-remove-entry-btn"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="about-us-management-form-row">
                    <div className="about-us-management-form-group">
                      <label>Year</label>
                      <input
                        type="text"
                        value={entry.year}
                        onChange={(e) => updateJourneyEntry(index, 'year', e.target.value)}
                        placeholder="e.g., 2018"
                      />
                    </div>
                    <div className="about-us-management-form-group">
                      <label>Sort Order</label>
                      <input
                        type="number"
                        value={entry.sort_order}
                        onChange={(e) => updateJourneyEntry(index, 'sort_order', parseInt(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="about-us-management-form-group">
                    <label>Description</label>
                    <textarea
                      value={entry.description}
                      onChange={(e) => updateJourneyEntry(index, 'description', e.target.value)}
                      placeholder="Description content"
                      rows="3"
                    />
                  </div>

                  <div className="about-us-management-form-group">
                    <label>Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateJourneyEntryFile(index, e.target.files[0])}
                    />
                    {aboutData.journeyTimeline && aboutData.journeyTimeline[index]?.image_url && (
                      <div className="about-us-management-current-image">
                        <p>Current: {aboutData.journeyTimeline[index].image_url}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="about-us-management-form-actions">
                {(!aboutData.journeyTimeline || aboutData.journeyTimeline.length === 0) && (
                  <button
                    type="button"
                    onClick={addJourneyEntry}
                    className="about-us-management-add-more-btn"
                  >
                    ➕ Add More Entry
                  </button>
                )}
                <button type="submit" disabled={loading} className="about-us-management-submit-btn">
                  {aboutData.journeyTimeline && aboutData.journeyTimeline.length > 0 ? 'Update' : 'Add All'} Journey Entries
                </button>
              </div>

              {aboutData.journeyTimeline && aboutData.journeyTimeline.length > 0 && (
                <div className="about-us-management-update-note">
                  <p>✅ Data exists. You can update the content above.</p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Craftsmanship Tab */}
        {activeTab === 'craftsmanship' && (
          <div className="about-us-management-tab-content">
            <h2>Craftsmanship & Quality</h2>
            {!aboutData.craftsmanship ? (
              <div className="about-us-management-no-data-message">
                <p>No Craftsmanship data found. Please create the initial data.</p>
              </div>
            ) : null}
            <form onSubmit={handleCraftsmanshipSubmit}>
              <div className="about-us-management-form-group">
                <label>Heading Title</label>
                <input
                  type="text"
                  value={craftsmanshipForm.heading_title}
                  onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, heading_title: e.target.value })}
                  placeholder="e.g., Craftsmanship & Quality"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Subheading</label>
                <textarea
                  value={craftsmanshipForm.subheading}
                  onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, subheading: e.target.value })}
                  placeholder="e.g., Every Piece Is A Promise..."
                  rows="3"
                />
              </div>

              {/* Card 1 */}
              <div className="about-us-management-card-section">
                <h3>Card 1</h3>
                <div className="about-us-management-form-group">
                  <label>Icon Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCraftsmanshipFiles({ ...craftsmanshipFiles, card1_icon_url: e.target.files[0] })}
                  />
                  {aboutData.craftsmanship?.card1_icon_url && (
                    <div className="about-us-management-current-image">
                      <p>Current: {aboutData.craftsmanship.card1_icon_url}</p>
                    </div>
                  )}
                </div>
                <div className="about-us-management-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={craftsmanshipForm.card1_title}
                    onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, card1_title: e.target.value })}
                    placeholder="e.g., Artisan Crafted"
                  />
                </div>
                <div className="about-us-management-form-group">
                  <label>Description</label>
                  <textarea
                    value={craftsmanshipForm.card1_description}
                    onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, card1_description: e.target.value })}
                    placeholder="Description"
                    rows="2"
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="about-us-management-card-section">
                <h3>Card 2</h3>
                <div className="about-us-management-form-group">
                  <label>Icon Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCraftsmanshipFiles({ ...craftsmanshipFiles, card2_icon_url: e.target.files[0] })}
                  />
                  {aboutData.craftsmanship?.card2_icon_url && (
                    <div className="about-us-management-current-image">
                      <p>Current: {aboutData.craftsmanship.card2_icon_url}</p>
                    </div>
                  )}
                </div>
                <div className="about-us-management-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={craftsmanshipForm.card2_title}
                    onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, card2_title: e.target.value })}
                    placeholder="Title"
                  />
                </div>
                <div className="about-us-management-form-group">
                  <label>Description</label>
                  <textarea
                    value={craftsmanshipForm.card2_description}
                    onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, card2_description: e.target.value })}
                    placeholder="Description"
                    rows="2"
                  />
                </div>
              </div>

              {/* Card 3 */}
              <div className="about-us-management-card-section">
                <h3>Card 3</h3>
                <div className="about-us-management-form-group">
                  <label>Icon Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCraftsmanshipFiles({ ...craftsmanshipFiles, card3_icon_url: e.target.files[0] })}
                  />
                  {aboutData.craftsmanship?.card3_icon_url && (
                    <div className="about-us-management-current-image">
                      <p>Current: {aboutData.craftsmanship.card3_icon_url}</p>
                    </div>
                  )}
                </div>
                <div className="about-us-management-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={craftsmanshipForm.card3_title}
                    onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, card3_title: e.target.value })}
                    placeholder="Title"
                  />
                </div>
                <div className="about-us-management-form-group">
                  <label>Description</label>
                  <textarea
                    value={craftsmanshipForm.card3_description}
                    onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, card3_description: e.target.value })}
                    placeholder="Description"
                    rows="2"
                  />
                </div>
              </div>

              <div className="about-us-management-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={craftsmanshipForm.is_active}
                    onChange={(e) => setCraftsmanshipForm({ ...craftsmanshipForm, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <button type="submit" disabled={loading}>
                {aboutData.craftsmanship ? 'Update' : 'Create'} Craftsmanship Section
              </button>
              {aboutData.craftsmanship && (
                <div className="about-us-management-update-note">
                  <p>✅ Data exists. You can update the content above.</p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* What Makes Us Tab */}
        {activeTab === 'what-makes-us' && (
          <div className="about-us-management-tab-content">
            <h2>What Makes Us Different</h2>
            {!aboutData.whatMakesUs ? (
              <div className="about-us-management-no-data-message">
                <p>No What Makes Us data found. Please create the initial data.</p>
              </div>
            ) : null}
            <form onSubmit={handleWhatMakesUsSubmit}>
              <div className="about-us-management-form-group">
                <label>Section Heading</label>
                <input
                  type="text"
                  value={whatMakesUsForm.section_heading}
                  onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, section_heading: e.target.value })}
                  placeholder="e.g., WHAT MAKES US DIFFERENT"
                />
              </div>
              <div className="about-us-management-form-row">
                <div className="about-us-management-form-group">
                  <label>Background Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWhatMakesUsFiles({ ...whatMakesUsFiles, background_image: e.target.files[0] })}
                  />
                  {aboutData.whatMakesUs?.background_image && (
                    <div className="about-us-management-current-image">
                      <p>Current: {aboutData.whatMakesUs.background_image}</p>
                    </div>
                  )}
                </div>
                <div className="about-us-management-form-group">
                  <label>Side Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWhatMakesUsFiles({ ...whatMakesUsFiles, side_image: e.target.files[0] })}
                  />
                  {aboutData.whatMakesUs?.side_image && (
                    <div className="about-us-management-current-image">
                      <p>Current: {aboutData.whatMakesUs.side_image}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Point 1 */}
              <div className="about-us-management-point-section">
                <h3>Point 1</h3>
                <div className="about-us-management-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={whatMakesUsForm.point1_title}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point1_title: e.target.value })}
                    placeholder="Point 1 title"
                  />
                </div>
                <div className="about-us-management-form-group">
                  <label>Subtitle</label>
                  <textarea
                    value={whatMakesUsForm.point1_subtitle}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point1_subtitle: e.target.value })}
                    placeholder="Point 1 subtitle"
                    rows="2"
                  />
                </div>
              </div>

              {/* Point 2 */}
              <div className="about-us-management-point-section">
                <h3>Point 2</h3>
                <div className="about-us-management-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={whatMakesUsForm.point2_title}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point2_title: e.target.value })}
                    placeholder="Point 2 title"
                  />
                </div>
                <div className="about-us-management-form-group">
                  <label>Subtitle</label>
                  <textarea
                    value={whatMakesUsForm.point2_subtitle}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point2_subtitle: e.target.value })}
                    placeholder="Point 2 subtitle"
                    rows="2"
                  />
                </div>
              </div>

              {/* Point 3 */}
              <div className="about-us-management-point-section">
                <h3>Point 3</h3>
                <div className="about-us-management-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={whatMakesUsForm.point3_title}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point3_title: e.target.value })}
                    placeholder="Point 3 title"
                  />
                </div>
                <div className="about-us-management-form-group">
                  <label>Subtitle</label>
                  <textarea
                    value={whatMakesUsForm.point3_subtitle}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point3_subtitle: e.target.value })}
                    placeholder="Point 3 subtitle"
                    rows="2"
                  />
                </div>
              </div>

              {/* Point 4 */}
              <div className="about-us-management-point-section">
                <h3>Point 4</h3>
                <div className="about-us-management-form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={whatMakesUsForm.point4_title}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point4_title: e.target.value })}
                    placeholder="Point 4 title"
                  />
                </div>
                <div className="about-us-management-form-group">
                  <label>Subtitle</label>
                  <textarea
                    value={whatMakesUsForm.point4_subtitle}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, point4_subtitle: e.target.value })}
                    placeholder="Point 4 subtitle"
                    rows="2"
                  />
                </div>
              </div>

              <div className="about-us-management-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={whatMakesUsForm.is_active}
                    onChange={(e) => setWhatMakesUsForm({ ...whatMakesUsForm, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <button type="submit" disabled={loading}>
                {aboutData.whatMakesUs ? 'Update' : 'Create'} What Makes Us Section
              </button>
              {aboutData.whatMakesUs && (
                <div className="about-us-management-update-note">
                  <p>✅ Data exists. You can update the content above.</p>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Who We Are Tab */}
        {activeTab === 'who-we-are' && (
          <div className="about-us-management-tab-content">
            <h2>Who We Are</h2>
            {!aboutData.whoWeAre ? (
              <div className="about-us-management-no-data-message">
                <p>No Who We Are data found. Please create the initial data.</p>
              </div>
            ) : null}
            <form onSubmit={handleWhoWeAreSubmit}>
              <div className="about-us-management-form-group">
                <label>Heading Title</label>
                <input
                  type="text"
                  value={whoWeAreForm.heading_title}
                  onChange={(e) => setWhoWeAreForm({ ...whoWeAreForm, heading_title: e.target.value })}
                  placeholder="e.g., WHO WE ARE"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Subheading Title</label>
                <input
                  type="text"
                  value={whoWeAreForm.subheading_title}
                  onChange={(e) => setWhoWeAreForm({ ...whoWeAreForm, subheading_title: e.target.value })}
                  placeholder="e.g., CRAFTING MORE THAN JEWELLERY — WE CRAFT EMOTIONS"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Content Paragraph</label>
                <textarea
                  value={whoWeAreForm.content_paragraph}
                  onChange={(e) => setWhoWeAreForm({ ...whoWeAreForm, content_paragraph: e.target.value })}
                  placeholder="Main content paragraph"
                  rows="6"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Bold Text</label>
                <input
                  type="text"
                  value={whoWeAreForm.bold_text}
                  onChange={(e) => setWhoWeAreForm({ ...whoWeAreForm, bold_text: e.target.value })}
                  placeholder="Bold ending sentence"
                />
              </div>
              <div className="about-us-management-form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setWhoWeAreFiles({ ...whoWeAreFiles, image_url: e.target.files[0] })}
                />
                {aboutData.whoWeAre?.image_url && (
                  <div className="about-us-management-current-image">
                    <p>Current: {aboutData.whoWeAre.image_url}</p>
                  </div>
                )}
              </div>
              <div className="about-us-management-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={whoWeAreForm.is_active}
                    onChange={(e) => setWhoWeAreForm({ ...whoWeAreForm, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <button type="submit" disabled={loading}>
                {aboutData.whoWeAre ? 'Update' : 'Create'} Who We Are Section
              </button>
              {aboutData.whoWeAre && (
                <div className="about-us-management-update-note">
                  <p>✅ Data exists. You can update the content above.</p>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutUsManagement; 