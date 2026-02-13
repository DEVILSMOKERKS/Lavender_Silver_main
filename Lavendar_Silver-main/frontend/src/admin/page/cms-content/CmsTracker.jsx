import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileText,
  Eye,
  BarChart3,
  Calendar,
  ChevronDown,
  Eye as ViewIcon,
  Edit,
  Trash2,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CmsTracker.css';
import contentMarketing from '../../../assets/img/icons/content-marketing.png';
import webBar from '../../../assets/img/icons/web-bar.png';

const CmsTracker = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const statsData = [
    {
      title: 'Active Content',
      value: '15',
      icon: (
        <div className="cms-tracker-stat-icon-green">
          <img src={contentMarketing} alt="Content Marketing" className="cms-tracker-stat-img" loading="lazy" decoding="async" />
        </div>
      ),
      color: 'green'
    },
    {
      title: 'Total Pages',
      value: '15',
      icon: (
        <div className="cms-tracker-stat-icon-blue">
          <Eye className="w-5 h-5" />
        </div>
      ),
      color: 'blue'
    },
    {
      title: 'Last Updated',
      value: '2 days ago',
      icon: (
        <div className="cms-tracker-stat-icon-purple">
          <img src={webBar} alt="Web Bar" className="cms-tracker-stat-img" loading="lazy" decoding="async" />
        </div>
      ),
      color: 'purple'
    }
  ];

  // CMS Content items from sidebar (excluding CMS Tracker)
  const cmsContentData = [
    {
      name: 'Blog Guide',
      type: 'BLOG',
      path: '/admin/cms/blog-guide',
      status: 'Active',
      lastUpdated: '1 day ago',
      views: 'Public',
      description: 'Blog and guides management system with create/edit popups'
    },
    {
      name: 'Social Links',
      type: 'SOCIAL',
      path: '/admin/cms/social-links',
      status: 'Active',
      lastUpdated: '1 day ago',
      views: 'Public',
      description: 'Manage social media links and connections'
    },
    {
      name: 'Hero Banner',
      type: 'BANNER',
      path: '/admin/cms/hero-banner',
      status: 'Active',
      lastUpdated: '3 days ago',
      views: 'Homepage',
      description: 'Main homepage banner management'
    },
    {
      name: 'Featured Category',
      type: 'CATEGORY',
      path: '/admin/cms/featured-images',
      status: 'Active',
      lastUpdated: '1 week ago',
      views: 'Homepage',
      description: 'Featured category images and content'
    },
    {
      name: 'PVJ Prediction',
      type: 'PREDICTION',
      path: '/admin/cms/pvj-prediction',
      status: 'Active',
      lastUpdated: '2 days ago',
      views: 'Public',
      description: 'PVJ prediction content management'
    },
    {
      name: 'Second Category',
      type: 'CATEGORY',
      path: '/admin/cms/second-category',
      status: 'Active',
      lastUpdated: '5 days ago',
      views: 'Homepage',
      description: 'Secondary category management'
    },
    {
      name: 'Instagram',
      type: 'SOCIAL',
      path: '/admin/cms/insta-images',
      status: 'Active',
      lastUpdated: '1 day ago',
      views: 'Public',
      description: 'Instagram feed integration'
    },
    {
      name: 'About Us',
      type: 'PAGE',
      path: '/admin/cms/about-us',
      status: 'Active',
      lastUpdated: '1 week ago',
      views: 'Public',
      description: 'About us page content management'
    },
    {
      name: 'FAQ Management',
      type: 'FAQ',
      path: '/admin/cms/faq-management',
      status: 'Active',
      lastUpdated: '3 days ago',
      views: 'Public',
      description: 'Frequently asked questions management'
    },
    {
      name: 'Return Policy',
      type: 'POLICY',
      path: '/admin/cms/return-policy',
      status: 'Active',
      lastUpdated: '2 weeks ago',
      views: 'Public',
      description: 'Return policy page content'
    },
    {
      name: 'Privacy Policy',
      type: 'POLICY',
      path: '/admin/cms/privacy-policy',
      status: 'Active',
      lastUpdated: '1 month ago',
      views: 'Public',
      description: 'Privacy policy page content'
    },
    {
      name: 'Terms & Conditions',
      type: 'POLICY',
      path: '/admin/cms/terms-conditions',
      status: 'Active',
      lastUpdated: '1 month ago',
      views: 'Public',
      description: 'Terms and conditions page content'
    },
    {
      name: 'Shipping Policy',
      type: 'POLICY',
      path: '/admin/cms/shipping-policy',
      status: 'Active',
      lastUpdated: '2 weeks ago',
      views: 'Public',
      description: 'Shipping policy page content'
    },
    {
      name: 'Shop Banner',
      type: 'BANNER',
      path: '/admin/cms/shop-banner',
      status: 'Active',
      lastUpdated: '1 week ago',
      views: 'Shop page',
      description: 'Shop page banner management'
    },
    {
      name: 'Product Banner',
      type: 'BANNER',
      path: '/admin/cms/product-banner',
      status: 'Active',
      lastUpdated: '4 days ago',
      views: 'Product pages',
      description: 'Product page banner management'
    },
    {
      name: 'Gallery Management',
      type: 'GALLERY',
      path: '/admin/cms/gallery-management',
      status: 'Active',
      lastUpdated: 'Just now',
      views: 'Public',
      description: 'Manage image gallery and media content'
    }
  ];

  const getTypeStyle = (type) => {
    switch (type) {
      case 'TRACKER':
        return 'type-tracker';
      case 'SOCIAL':
        return 'type-social';
      case 'BANNER':
        return 'type-banner';
      case 'CATEGORY':
        return 'type-category';
      case 'PREDICTION':
        return 'type-prediction';
      case 'PAGE':
        return 'type-page';
      case 'FAQ':
        return 'type-faq';
      case 'POLICY':
        return 'type-policy';
      case 'BLOG':
        return 'type-blog';
      default:
        return 'type-default';
    }
  };

  const getStatusStyle = (status) => {
    return status === 'Active' ? 'status-active' : 'status-draft';
  };

  // Filter content based on search and filters
  const filteredContent = cmsContentData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleViewContent = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-ams-tracker-cms-tracker">
      <div className="admin-ams-tracker-cms-header">
        <h1 className="admin-ams-tracker-cms-title">CMS CONTENT TRACKER</h1>

        <div className="admin-ams-tracker-cms-controls">
          <div className="admin-ams-tracker-search-container">
            <Search className="admin-ams-tracker-search-icon" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-ams-tracker-search-input"
            />
          </div>

          <div className="admin-ams-tracker-filters">
            <div className="admin-ams-tracker-filter-dropdown">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="admin-ams-tracker-filter-select"
              >
                <option>All Types</option>
                <option>SOCIAL</option>
                <option>BANNER</option>
                <option>CATEGORY</option>
                <option>PREDICTION</option>
                <option>PAGE</option>
                <option>FAQ</option>
                <option>POLICY</option>
                <option>BLOG</option>
              </select>
              <ChevronDown className="admin-ams-tracker-dropdown-icon" />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-ams-tracker-stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className={`admin-ams-tracker-stat-card stat-${stat.color}`}>
            <div className="admin-ams-tracker-stat-content">
              <div className="admin-ams-tracker-stat-text">
                <h3 className="admin-ams-tracker-stat-title">{stat.title}</h3>
                <p className="admin-ams-tracker-stat-value">{stat.value}</p>
              </div>
              <div className={`admin-ams-tracker-stat-icon stat-icon-${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-ams-tracker-content-table-container">
        <table className="admin-ams-tracker-content-table">
          <thead>
            <tr>
              <th>CONTENT NAME</th>
              <th>TYPE</th>
              <th>STATUS</th>
              <th>LAST UPDATED</th>
              <th>VIEWS</th>
              <th>DESCRIPTION</th>
              <th>VIEW</th>
            </tr>
          </thead>
          <tbody>
            {filteredContent.map((item, index) => (
              <tr key={index}>
                <td className="admin-ams-tracker-name-cell">
                  <div className="content-name-wrapper">
                    <span className="content-name">{item.name}</span>
                    <span className="content-path">{item.path}</span>
                  </div>
                </td>
                <td>
                  <span className={`admin-ams-tracker-type-badge ${getTypeStyle(item.type)}`}>
                    {item.type}
                  </span>
                </td>
                <td>
                  <span className={`admin-ams-tracker-status-badge ${getStatusStyle(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="admin-ams-tracker-date-cell">
                  <div className="admin-ams-tracker-date-time">
                    <div>{item.lastUpdated}</div>
                  </div>
                </td>
                <td className="admin-ams-tracker-device-cell">{item.views}</td>
                <td className="admin-ams-tracker-description-cell">{item.description}</td>
                <td className="admin-ams-tracker-actions-cell">
                  <button
                    className="admin-ams-tracker-action-btn admin-ams-tracker-view-btn"
                    onClick={() => handleViewContent(item.path)}
                    title="View Content"
                  >
                    <ViewIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CmsTracker;