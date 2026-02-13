import React, { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  BarChart3,
  TrendingUp,
  Plus,
  Play,
  Pause,
  Copy,
  ChevronDown,
  ArrowUpDown,
  MessageSquareText,
  Edit,
  Trash2,
  Eye,
  Settings,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import './EmailAutomation.css';
import group from '../../../assets/img/icons/red-group.png';
import statistics from '../../../assets/img/icons/statistics-2.png';
import axios from '../../../utils/axiosConfig';

const EmailAutomation = () => {
  const [typeFilter, setTypeFilter] = useState('All Type');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [audienceFilter, setAudienceFilter] = useState('All Audience');
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    total_campaigns: 0,
    total_subscribers: 0,
    avg_open_rate: '0.0',
    avg_ctr: '0.0'
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success', // 'success' or 'error'
    duration: 5000
  });

  // Form states for creating campaigns
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'Transactional',
    subject: '',
    template_id: '',
    audience_type: 'New Signups',
    trigger_type: 'Event-based',
    trigger_event: '',
    delay_minutes: 0,
    status: 'Draft'
  });

  // Form states for creating templates
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    category: 'Welcome'
  });

  // Manual email sending states
  const [showManualEmailModal, setShowManualEmailModal] = useState(false);
  const [manualEmailForm, setManualEmailForm] = useState({
    campaign_type: 'Welcome Series',
    template_id: '',
    user_filter: 'all',
    product_id: '',
    offer_id: '',
    custom_subject: '',
    custom_message: '',
    template_content: ''
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [abandonedCartUsers, setAbandonedCartUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loadingManualData, setLoadingManualData] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  // Notification functions
  const showNotification = (message, type = 'success', duration = 5000) => {
    setNotification({
      show: true,
      message,
      type,
      duration
    });

    // Auto-hide notification after duration
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, statsRes, templatesRes] = await Promise.all([
        axios.get('/api/email-automation/campaigns'),
        axios.get('/api/email-automation/stats'),
        axios.get('/api/email-automation/templates')
      ]);

      setCampaigns(campaignsRes.data.data || []);
      setStats(statsRes.data.data || {});
      setTemplates(templatesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/email-automation/campaigns', campaignForm);
      setShowCreateModal(false);
      setCampaignForm({
        name: '',
        type: 'Transactional',
        subject: '',
        template_id: '',
        audience_type: 'New Signups',
        trigger_type: 'Event-based',
        trigger_event: '',
        delay_minutes: 0,
        status: 'Draft'
      });
      fetchData();
      showNotification('Campaign created successfully!', 'success');
    } catch (error) {
      console.error('Error creating campaign:', error);
      showNotification('Error creating campaign: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/email-automation/templates', templateForm);
      setShowTemplateModal(false);
      setTemplateForm({
        name: '',
        subject: '',
        html_content: '',
        text_content: '',
        category: 'Welcome'
      });
      fetchData();
      showNotification('Template created successfully!', 'success');
    } catch (error) {
      console.error('Error creating template:', error);
      showNotification('Error creating template: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      await axios.patch(`/api/email-automation/campaigns/${campaignId}/status`, {
        status: newStatus
      });
      fetchData();
      showNotification(`Campaign status updated to ${newStatus}!`, 'success');
    } catch (error) {
      console.error('Error updating campaign status:', error);
      showNotification('Error updating campaign status: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await axios.delete(`/api/email-automation/campaigns/${campaignId}`);
        fetchData();
        showNotification('Campaign deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting campaign:', error);
        showNotification('Error deleting campaign: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };


  // Manual email functions
  const handleOpenManualEmailModal = async () => {
    setShowManualEmailModal(true);
    await fetchManualEmailData();
  };

  const fetchManualEmailData = async () => {
    try {
      setLoadingManualData(true);
      const [usersRes, productsRes, offersRes, abandonedCartsRes] = await Promise.all([
        axios.get(`/api/email-automation/manual/users?filter=${manualEmailForm.user_filter}&days=${manualEmailForm.user_days}`),
        axios.get('/api/email-automation/manual/products'),
        axios.get('/api/email-automation/manual/offers'),
        axios.get('/api/email-automation/manual/abandoned-carts')
      ]);

      setAvailableUsers(usersRes.data.data || []);
      setAvailableProducts(productsRes.data.data || []);
      setAvailableOffers(offersRes.data.data || []);
      setAbandonedCartUsers(abandonedCartsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching manual email data:', error);
    } finally {
      setLoadingManualData(false);
    }
  };

  const handleManualEmailFormChange = async (field, value) => {
    setManualEmailForm(prev => ({ ...prev, [field]: value }));

    // If template_id changes, fetch template content
    if (field === 'template_id') {
      if (value) {
        try {
          const response = await axios.get(`/api/email-automation/templates/${value}`);
          const template = response.data.data;
          setManualEmailForm(prev => ({
            ...prev,
            template_content: template.html_content,
            custom_subject: template.subject
          }));
        } catch (error) {
          console.error('Error fetching template:', error);
        }
      } else {
        setManualEmailForm(prev => ({ ...prev, template_content: '', custom_subject: '' }));
      }
    }

    // If campaign type changes, fetch relevant data
    if (field === 'campaign_type') {
      if (value === 'Abandoned Cart') {
        // For abandoned cart, we'll use the abandoned cart users
        setSelectedUsers(abandonedCartUsers.map(user => user.id));
      } else {
        // For other types, fetch users based on filter
        try {
          const response = await axios.get(`/api/email-automation/manual/users?filter=${manualEmailForm.user_filter}&days=30`);
          setAvailableUsers(response.data.data || []);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }
    }
  };

  const handleUserSelection = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAllUsers = (checked) => {
    if (checked) {
      setSelectedUsers(availableUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSendManualEmail = async (e) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      showNotification('Please select at least one user to send email to.', 'error');
      return;
    }

    if (!manualEmailForm.template_id) {
      showNotification('Please select a template.', 'error');
      return;
    }

    try {
      setSendingEmail(true);

      // Use global axios with longer timeout for email sending
      const response = await axios.post('/api/email-automation/manual/send', {
        campaign_type: manualEmailForm.campaign_type,
        template_id: manualEmailForm.template_id,
        user_ids: selectedUsers,
        product_id: selectedProduct?.id || null,
        offer_id: selectedOffer?.id || null,
        custom_subject: manualEmailForm.custom_subject,
        custom_message: manualEmailForm.custom_message,
        template_content: manualEmailForm.template_content
      }, {
        timeout: 60000 // 60 seconds timeout for email sending
      });

      showNotification(response.data.message, 'success');
      setShowManualEmailModal(false);
      setManualEmailForm({
        campaign_type: 'Welcome Series',
        template_id: '',
        user_filter: 'all',
        product_id: '',
        offer_id: '',
        custom_subject: '',
        custom_message: '',
        template_content: ''
      });
      setSelectedUsers([]);
      setSelectedProduct(null);
      setSelectedOffer(null);
      fetchData(); // Refresh campaigns data
    } catch (error) {
      console.error('Error sending manual email:', error);
      showNotification('Error sending manual email: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'Transactional':
        return 'admin-email-auto__type-transactional';
      case 'Promotional':
        return 'admin-email-auto__type-promotional';
      case 'Abandoned Cart':
        return 'admin-email-auto__type-abandoned';
      case 'Welcome Series':
        return 'admin-email-auto__type-welcome';
      case 'Order Confirmation':
        return 'admin-email-auto__type-order';
      case 'Product Launch':
        return 'admin-email-auto__type-product';
      default:
        return 'admin-email-auto__type-transactional';
    }
  };

  const getStatusClass = (status) => {
    return status === 'Active' ? 'admin-email-auto__status-active' :
      status === 'Paused' ? 'admin-email-auto__status-paused' :
        'admin-email-auto__status-draft';
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const typeMatch = typeFilter === 'All Type' || campaign.type === typeFilter;
    const statusMatch = statusFilter === 'All Status' || campaign.status === statusFilter;
    const audienceMatch = audienceFilter === 'All Audience' || campaign.audience_type === audienceFilter;
    return typeMatch && statusMatch && audienceMatch;
  });

  if (loading) {
    return (
      <div className="admin-email-auto">
        <div className="admin-email-auto__loading">
          <div className="admin-email-auto__spinner"></div>
          <p>Loading email automation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-email-auto">
      <div className="admin-email-auto__header">
        <h1 className="admin-email-auto__title">Email Automation</h1>
        <div className="admin-email-auto__header-actions">
          <button
            className="admin-email-auto__btn admin-email-auto__btn-secondary"
            onClick={handleOpenManualEmailModal}
            title="Send Manual Email"
          >
            <Mail size={16} />
            Send Manual Email
          </button>
          <button
            className="admin-email-auto__btn admin-email-auto__btn-secondary"
            onClick={() => setShowTemplateModal(true)}
          >
            <Plus size={16} />
            New Template
          </button>
          <button
            className="admin-email-auto__btn admin-email-auto__btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      </div>

      <div className="admin-email-auto__stats-grid-wrapper">
        <div className="admin-email-auto__stats-grid">
          <div className="admin-email-auto__stat-card">
            <div className="admin-email-auto__stat-content">
              <div className="admin-email-auto__stat-label">Total Campaigns</div>
              <div className="admin-email-auto__stat-value">{stats.total_campaigns}</div>
            </div>
            <div className="admin-email-auto__stat-icon admin-email-auto__campaigns-icon">
              <MessageSquareText size={20} />
            </div>
          </div>

          <div className="admin-email-auto__stat-card">
            <div className="admin-email-auto__stat-content">
              <div className="admin-email-auto__stat-label">Total Subscribers</div>
              <div className="admin-email-auto__stat-value">{stats.total_subscribers.toLocaleString()}</div>
            </div>
            <div className="admin-email-auto__stat-icon admin-email-auto__subscribers-icon">
              <img src={group} alt="subscribers" className='admin-email-card-img' loading="lazy" decoding="async" />
            </div>
          </div>

        </div>
      </div>

      <div className="admin-email-auto__controls">
        <div className="admin-email-auto__filter-section">
          <span className="admin-email-auto__filter-label">Filter By Type</span>
          <div className="admin-email-auto__filter-dropdown">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-email-auto__dropdown"
            >
              <option value="All Type">All Type</option>
              <option value="Transactional">Transactional</option>
              <option value="Promotional">Promotional</option>
              <option value="Abandoned Cart">Abandoned Cart</option>
              <option value="Welcome Series">Welcome Series</option>
              <option value="Order Confirmation">Order Confirmation</option>
              <option value="Product Launch">Product Launch</option>
            </select>
            <ChevronDown className="admin-email-auto__dropdown-icon" size={16} />
          </div>
        </div>
        <div className="admin-email-auto__filter-section">
          <span className="admin-email-auto__filter-label">Filter By Status</span>
          <div className="admin-email-auto__filter-dropdown">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-email-auto__dropdown"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Draft">Draft</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown className="admin-email-auto__dropdown-icon" size={16} />
          </div>
        </div>
        <div className="admin-email-auto__filter-section">
          <span className="admin-email-auto__filter-label">Filter By Audience</span>
          <div className="admin-email-auto__filter-dropdown">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="admin-email-auto__dropdown"
            >
              <option value="All Audience">All Audience</option>
              <option value="All Users">All Users</option>
              <option value="New Signups">New Signups</option>
              <option value="Active Users">Active Users</option>
              <option value="Cart Abandoners">Cart Abandoners</option>
              <option value="Recent Purchasers">Recent Purchasers</option>
              <option value="Specific Segment">Specific Segment</option>
            </select>
            <ChevronDown className="admin-email-auto__dropdown-icon" size={16} />
          </div>
        </div>
      </div>

      <div className="admin-email-auto__table-container">
        <table className="admin-email-auto__campaign-table">
          <thead>
            <tr>
              <th>
                <div className="admin-email-auto__header-cell">
                  <ArrowUpDown className="admin-table-arrow-icon" />
                  <span>CAMPAIGN NAME</span>
                </div>
              </th>
              <th>
                <div className="admin-email-auto__header-cell">
                  <ArrowUpDown size={12} className="admin-table-arrow-icon" />
                  <span>TYPE</span>
                </div>
              </th>
              <th>
                <div className="admin-email-auto__header-cell">
                  <ArrowUpDown size={12} className="admin-table-arrow-icon" />
                  <span>AUDIENCE</span>
                </div>
              </th>
              <th>
                <div className="admin-email-auto__header-cell">
                  <ArrowUpDown className="admin-table-arrow-icon" />
                  <span>SENT</span>
                </div>
              </th>
              <th>
                <div className="admin-email-auto__header-cell">
                  <ArrowUpDown size={12} className="admin-table-arrow-icon" />
                  <span>STATUS</span>
                </div>
              </th>
              <th>
                <div className="admin-email-auto__header-cell">
                  <ArrowUpDown size={12} className="admin-table-arrow-icon" />
                  <span>ACTIONS</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>
                  <span className="admin-email-auto__campaign-name">{campaign.name}</span>
                </td>
                <td>
                  <span className={`admin-email-auto__type-badge ${getTypeClass(campaign.type)}`}>
                    {campaign.type}
                  </span>
                </td>
                <td>
                  <span className="admin-email-auto__audience">{campaign.audience_type}</span>
                </td>
                <td>
                  <span className="admin-email-auto__sent">{campaign.total_sent || 0}</span>
                </td>
                <td>
                  <span className={`admin-email-auto__status ${getStatusClass(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td>
                  <div className="admin-email-auto__actions">
                    {campaign.status === 'Active' ? (
                      <button
                        className="admin-email-auto__action-btn admin-email-auto__pause-btn"
                        onClick={() => handleStatusChange(campaign.id, 'Paused')}
                        title="Pause Campaign"
                      >
                        <Pause size={16} />
                      </button>
                    ) : (
                      <button
                        className="admin-email-auto__action-btn admin-email-auto__play-btn"
                        onClick={() => handleStatusChange(campaign.id, 'Active')}
                        title="Activate Campaign"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    <button
                      className="admin-email-auto__action-btn admin-email-auto__delete-btn"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      title="Delete Campaign"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="admin-email-auto__modal-overlay">
          <div className="admin-email-auto__modal">
            <div className="admin-email-auto__modal-header">
              <h3>Create New Campaign</h3>
              <button
                className="admin-email-auto__modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="admin-email-auto__modal-form">
              <div className="admin-email-auto__form-group">
                <label>Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="admin-email-auto__form-group">
                <label>Type</label>
                <select
                  value={campaignForm.type}
                  onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
                  required
                >
                  <option value="Transactional">Transactional</option>
                  <option value="Promotional">Promotional</option>
                  <option value="Abandoned Cart">Abandoned Cart</option>
                  <option value="Welcome Series">Welcome Series</option>
                  <option value="Order Confirmation">Order Confirmation</option>
                  <option value="Product Launch">Product Launch</option>
                </select>
              </div>
              <div className="admin-email-auto__form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  required
                />
              </div>
              <div className="admin-email-auto__form-group">
                <label>Template</label>
                <select
                  value={campaignForm.template_id}
                  onChange={(e) => setCampaignForm({ ...campaignForm, template_id: e.target.value })}
                  required
                >
                  <option value="">Select Template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-email-auto__form-group">
                <label>Audience Type</label>
                <select
                  value={campaignForm.audience_type}
                  onChange={(e) => setCampaignForm({ ...campaignForm, audience_type: e.target.value })}
                  required
                >
                  <option value="All Users">All Users</option>
                  <option value="New Signups">New Signups</option>
                  <option value="Active Users">Active Users</option>
                  <option value="Cart Abandoners">Cart Abandoners</option>
                  <option value="Recent Purchasers">Recent Purchasers</option>
                  <option value="Specific Segment">Specific Segment</option>
                </select>
              </div>
              <div className="admin-email-auto__form-group">
                <label>Trigger Type</label>
                <select
                  value={campaignForm.trigger_type}
                  onChange={(e) => setCampaignForm({ ...campaignForm, trigger_type: e.target.value })}
                  required
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Event-based">Event-based</option>
                </select>
              </div>
              <div className="admin-email-auto__form-group">
                <label>Delay (minutes)</label>
                <input
                  type="number"
                  value={campaignForm.delay_minutes}
                  onChange={(e) => setCampaignForm({ ...campaignForm, delay_minutes: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="admin-email-auto__modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit">
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showTemplateModal && (
        <div className="admin-email-auto__modal-overlay">
          <div className="admin-email-auto__modal admin-email-auto__modal-large">
            <div className="admin-email-auto__modal-header">
              <h3>Create New Template</h3>
              <button
                className="admin-email-auto__modal-close"
                onClick={() => setShowTemplateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="admin-email-auto__modal-form">
              <div className="admin-email-auto__form-group">
                <label>Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="admin-email-auto__form-group">
                <label>Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  required
                >
                  <option value="Welcome">Welcome</option>
                  <option value="Abandoned Cart">Abandoned Cart</option>
                  <option value="Order Confirmation">Order Confirmation</option>
                  <option value="Promotional">Promotional</option>
                  <option value="Product Launch">Product Launch</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="admin-email-auto__form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  required
                />
              </div>
              <div className="admin-email-auto__form-group">
                <label>HTML Content</label>
                <textarea
                  value={templateForm.html_content}
                  onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })}
                  rows="10"
                  required
                  placeholder="Enter HTML content with variables like {{user_name}}, {{order_number}}, etc."
                />
              </div>
              <div className="admin-email-auto__form-group">
                <label>Text Content (Plain Text Version)</label>
                <textarea
                  value={templateForm.text_content}
                  onChange={(e) => setTemplateForm({ ...templateForm, text_content: e.target.value })}
                  rows="5"
                  placeholder="Enter plain text version of the email"
                />
              </div>
              <div className="admin-email-auto__modal-actions">
                <button type="button" onClick={() => setShowTemplateModal(false)}>
                  Cancel
                </button>
                <button type="submit">
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Email Modal */}
      {showManualEmailModal && (
        <div className="admin-email-auto__modal-overlay">
          <div className="admin-email-auto__modal admin-email-auto__modal-large">
            <div className="admin-email-auto__modal-header">
              <h3>Send Manual Email</h3>
              <button
                className="admin-email-auto__modal-close"
                onClick={() => setShowManualEmailModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSendManualEmail} className="admin-email-auto__modal-form">
              <div className="admin-email-auto__form-row">
                <div className="admin-email-auto__form-group">
                  <label>Campaign Type</label>
                  <select
                    value={manualEmailForm.campaign_type}
                    onChange={(e) => handleManualEmailFormChange('campaign_type', e.target.value)}
                    required
                  >
                    <option value="Welcome Series">Welcome Series</option>
                    <option value="Promotional">Promotional</option>
                    <option value="Abandoned Cart">Abandoned Cart</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Order Confirmation">Order Confirmation</option>
                    <option value="Transactional">Transactional</option>
                  </select>
                </div>
                <div className="admin-email-auto__form-group">
                  <label>Email Template</label>
                  <select
                    value={manualEmailForm.template_id}
                    onChange={(e) => handleManualEmailFormChange('template_id', e.target.value)}
                    required
                  >
                    <option value="">Select Template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {manualEmailForm.campaign_type !== 'Abandoned Cart' && (
                <div className="admin-email-auto__form-group">
                  <label>User Filter</label>
                  <select
                    value={manualEmailForm.user_filter}
                    onChange={(e) => handleManualEmailFormChange('user_filter', e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="new_signups">New Signups (Last 30 days)</option>
                    <option value="active_users">Active Users (Last 30 days)</option>
                    <option value="cart_abandoners">Cart Abandoners</option>
                    <option value="recent_purchasers">Recent Purchasers (Last 30 days)</option>
                  </select>
                </div>
              )}

              {/* Product Selection */}
              {(manualEmailForm.campaign_type === 'Product Launch' || manualEmailForm.campaign_type === 'Promotional') && (
                <div className="admin-email-auto__form-group">
                  <label>Select Product (Optional)</label>
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = availableProducts.find(p => p.id == e.target.value);
                      setSelectedProduct(product || null);
                    }}
                  >
                    <option value="">No Product</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.item_name} - ₹{product.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Offer Selection */}
              {manualEmailForm.campaign_type === 'Promotional' && (
                <div className="admin-email-auto__form-group">
                  <label>Select Offer/Coupon (Optional)</label>
                  <select
                    value={selectedOffer?.id || ''}
                    onChange={(e) => {
                      const offer = availableOffers.find(o => o.id == e.target.value);
                      setSelectedOffer(offer || null);
                    }}
                  >
                    <option value="">No Offer</option>
                    {availableOffers.map(offer => (
                      <option key={offer.id} value={offer.id}>
                        {offer.code} - {offer.discount_percentage ? `${offer.discount_percentage}%` : `₹${offer.discount_amount}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="admin-email-auto__form-row">
                <div className="admin-email-auto__form-group">
                  <label>Custom Subject (Optional)</label>
                  <input
                    type="text"
                    value={manualEmailForm.custom_subject}
                    onChange={(e) => handleManualEmailFormChange('custom_subject', e.target.value)}
                    placeholder="Leave empty to use template subject"
                  />
                </div>
                <div className="admin-email-auto__form-group">
                  <label>Custom Message (Optional)</label>
                  <textarea
                    value={manualEmailForm.custom_message}
                    onChange={(e) => handleManualEmailFormChange('custom_message', e.target.value)}
                    placeholder="Additional message to include in email"
                    rows="3"
                  />
                </div>
              </div>

              {/* Template Content Display and Edit */}
              {manualEmailForm.template_id && (
                <div className="admin-email-auto__form-group">
                  <label>Email Template Content (Editable)</label>
                  <div className="admin-email-auto__template-preview">
                    <div className="admin-email-auto__template-tabs">
                      <button
                        type="button"
                        className="admin-email-auto__tab-btn active"
                        onClick={() => setActiveTab('preview')}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="admin-email-auto__tab-btn"
                        onClick={() => setActiveTab('edit')}
                      >
                        Edit HTML
                      </button>
                    </div>
                    {activeTab === 'preview' ? (
                      <div
                        className="admin-email-auto__template-preview-content"
                        dangerouslySetInnerHTML={{ __html: manualEmailForm.template_content }}
                      />
                    ) : (
                      <textarea
                        value={manualEmailForm.template_content}
                        onChange={(e) => handleManualEmailFormChange('template_content', e.target.value)}
                        placeholder="Edit HTML content here..."
                        rows="15"
                        className="admin-email-auto__template-edit"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* User Selection */}
              <div className="admin-email-auto__form-group">
                <label>Select Users to Send Email To</label>
                {loadingManualData ? (
                  <div className="admin-email-auto__loading">Loading users...</div>
                ) : (
                  <div className="admin-email-auto__user-selection">
                    <div className="admin-email-auto__user-selection-header">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === (manualEmailForm.campaign_type === 'Abandoned Cart' ? abandonedCartUsers.length : availableUsers.length)}
                          onChange={(e) => handleSelectAllUsers(e.target.checked)}
                        />
                        Select All ({manualEmailForm.campaign_type === 'Abandoned Cart' ? abandonedCartUsers.length : availableUsers.length} users)
                      </label>
                    </div>
                    <div className="admin-email-auto__user-list">
                      {(manualEmailForm.campaign_type === 'Abandoned Cart' ? abandonedCartUsers : availableUsers).map(user => (
                        <div key={user.id} className="admin-email-auto__user-item">
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                            />
                            <span className="admin-email-auto__user-name">{user.name || 'Unknown User'}</span>
                            <span className="admin-email-auto__user-email">{user.email}</span>
                            {user.total_orders && (
                              <span className="admin-email-auto__user-orders">({user.total_orders} orders)</span>
                            )}
                            {manualEmailForm.campaign_type === 'Abandoned Cart' && (
                              <span className="admin-email-auto__cart-info">
                                Cart: ₹{user.cart_total} ({user.cart_items_count} items)
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-email-auto__modal-actions">
                <button type="button" onClick={() => setShowManualEmailModal(false)} disabled={sendingEmail}>
                  Cancel
                </button>
                <button type="submit" disabled={selectedUsers.length === 0 || sendingEmail}>
                  {sendingEmail ? 'Sending Emails...' : `Send Email to ${selectedUsers.length} Users`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Component */}
      {notification.show && (
        <div className={`admin-email-auto__notification admin-email-auto__notification--${notification.type}`}>
          <div className="admin-email-auto__notification-content">
            <div className="admin-email-auto__notification-icon">
              {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <div className="admin-email-auto__notification-message">
              {notification.message}
            </div>
            <button
              className="admin-email-auto__notification-close"
              onClick={hideNotification}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAutomation;