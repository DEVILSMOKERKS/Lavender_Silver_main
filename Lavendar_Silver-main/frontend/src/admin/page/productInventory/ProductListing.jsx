import React, { useState, useEffect, useContext } from "react";
import { Link } from 'react-router-dom';
import axios from 'axios';
import "./ProductListing.css";
import productImg from "../../../assets/img/ring.jpg";
import { Pencil, Trash2, Search, ChevronDown, Plus, Box, ArrowUpDown, FilePlus, Eye, Edit, MoreHorizontal, Download, Filter, SortAsc, SortDesc } from 'lucide-react';
import folderPlus from '../../../assets/img/icons/folder-plus.png';
import { useNotification } from '../../../context/NotificationContext';
import BulkAddProducts from './BulkAddProducts';
import AddProductPopup from './AddProductPopup';
import EditProductPopup from './EditProductPopup';
import ViewProductPopup from './ViewProductPopup';
import { AdminContext } from '../../../context/AdminContext';
import * as XLSX from 'xlsx';

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState('');
  const [selectedMetalType, setSelectedMetalType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [selectedManufacturing, setSelectedManufacturing] = useState('');
  const [selectedCustomizable, setSelectedCustomizable] = useState('');
  const [selectedEngraving, setSelectedEngraving] = useState('');
  const [selectedHallmark, setSelectedHallmark] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [weightRange, setWeightRange] = useState({ min: '', max: '' });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showBulkAddPopup, setShowBulkAddPopup] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewingProductId, setViewingProductId] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const { showNotification } = useNotification();
  const { token: adminToken } = useContext(AdminContext);

  const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedMetalType, selectedStatus, selectedManufacturing, selectedCustomizable, selectedEngraving, selectedHallmark, priceRange, weightRange, sortBy, sortOrder]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
    fetchMetalTypes();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  // Fetch sub-subcategories when subcategory changes
  useEffect(() => {
    if (selectedSubcategory) {
      fetchSubSubcategories(selectedSubcategory);
    } else {
      setSubSubcategories([]);
      setSelectedSubSubcategory('');
    }
  }, [selectedSubcategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: selectedStatus,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (selectedCategory) {
        params.append('category_id', selectedCategory);
      }
      if (selectedSubcategory) {
        params.append('subcategory_id', selectedSubcategory);
      }
      if (selectedSubSubcategory) {
        params.append('sub_subcategory_id', selectedSubSubcategory);
      }
      if (selectedMetalType) {
        params.append('metal_type_id', selectedMetalType);
      }

      if (selectedManufacturing) {
        params.append('manufacturing', selectedManufacturing);
      }
      if (selectedCustomizable) {
        params.append('customizable', selectedCustomizable);
      }
      if (selectedEngraving) {
        params.append('engraving', selectedEngraving);
      }
      if (selectedHallmark) {
        params.append('hallmark', selectedHallmark);
      }
      if (priceRange.min) {
        params.append('min_price', priceRange.min);
      }
      if (priceRange.max) {
        params.append('max_price', priceRange.max);
      }
      if (weightRange.min) {
        params.append('min_weight', weightRange.min);
      }
      if (weightRange.max) {
        params.append('max_weight', weightRange.max);
      }

      const response = await axios.get(`${API_BASE_URL}/products?${params}`);
      const data = response.data;

      if (data.success) {
        setProducts(data.data || data);
      } else {
        showNotification('Error loading products', 'error');
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      const data = response.data;

      if (data.success) {
        setCategories(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subcategories/category/${categoryId}`);
      const data = response.data;

      if (data.success) {
        setSubcategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchSubSubcategories = async (subcategoryId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sub-subcategories?subcategory_id=${subcategoryId}`);
      const data = response.data;

      if (data.success) {
        setSubSubcategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching sub-subcategories:', error);
    }
  };

  const fetchMetalTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/metal-rates/metal-types`);
      const data = response.data;

      if (data.success) {
        setMetalTypes(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching metal types:', error);
    }
  };

  const handleBulkAdd = async () => {
    try {
      // BulkAddProducts handles the upload internally
      // This function just refreshes the product list
      await fetchProducts();
      showNotification('Product list refreshed after bulk operation', 'success');
    } catch (error) {
      console.error('Error refreshing products after bulk operation:', error);
      showNotification('Error refreshing product list', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      showNotification('Product deleted successfully', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Error deleting product', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      showNotification('Please select products to delete', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedProducts.length} product(s)? This action cannot be undone and will also delete all associated images from the server.`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/products/bulk/delete`, {
        data: {
          product_ids: selectedProducts
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = response.data;

      if (data.success) {
        showNotification(
          data.message || `Successfully deleted ${data.data?.deleted_count || selectedProducts.length} product(s) and ${data.data?.images_deleted || 0} image(s)`,
          'success'
        );
        setSelectedProducts([]);
        fetchProducts();
      } else {
        showNotification(data.message || 'Error deleting products', 'error');
      }
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      const errorMessage = error.response?.data?.message || 'Error deleting products';
      showNotification(errorMessage, 'error');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleAddProduct = () => {
    setShowAddPopup(true);
  };

  const handleEditProduct = (productId) => {
    setEditingProductId(productId);
    setShowEditPopup(true);
  };

  const handleViewProduct = (productId) => {
    setViewingProductId(productId);
    setShowViewPopup(true);
  };

  const handleProductAdded = () => {
    // Force refresh products list and ensure status filter shows active products
    // New products are created with 'active' status by default
    if (selectedStatus !== 'active') {
      setSelectedStatus('active');
    }
    // Small delay to ensure backend has processed the new product
    setTimeout(() => {
      fetchProducts();
    }, 500);
  };

  const handleProductUpdated = () => {
    fetchProducts();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedSubSubcategory('');
    setSelectedMetalType('');
    setSelectedStatus('active');

    setSelectedManufacturing('');
    setSelectedCustomizable('');
    setSelectedEngraving('');
    setSelectedHallmark('');
    setPriceRange({ min: '', max: '' });
    setWeightRange({ min: '', max: '' });
    setSortBy('created_at');
    setSortOrder('DESC');
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const formatWeight = (value, unit = 'g') => {
    if (!value) return `0${unit}`;
    return `${parseFloat(value).toFixed(3)}${unit}`;
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown size={16} />;
    return sortOrder === 'ASC' ? <SortAsc size={16} /> : <SortDesc size={16} />;
  };

  const exportAllProducts = async () => {
    try {
      setLoading(true);
      // Fetch all products without pagination
      const response = await axios.get(`${API_BASE_URL}/products?limit=1000`);
      const allProducts = response.data.data;

      if (!allProducts || allProducts.length === 0) {
        showNotification('No products to export', 'warning');
        return;
      }

      const workbook = XLSX.utils.book_new();

      // Prepare data for export - include all fields from AddProductPopup and ViewProductPopup
      const allKeys = [
        // Basic Information
        'id', 'sku', 'tag_number', 'item_name', 'description', 'status', 'slug',

        // Product Data Entry fields
        'batch', 'stamp', 'remark', 'unit', 'pieces', 'additional_weight',
        'tunch', 'wastage_percentage', 'rate', 'diamond_weight', 'stone_weight',
        'labour', 'labour_on', 'other', 'total_fine_weight', 'total_rs',

        // Weight Details
        'gross_weight', 'less_weight', 'net_weight',

        // Design & Manufacturing fields
        'design_type', 'manufacturing', 'customizable', 'engraving', 'hallmark',
        'certificate_number',

        // Metal Information
        'metal_id', 'metal_purity_id',

        // Category Information
        'category_id', 'subcategory_id', 'sub_subcategory_id', 'category_name',
        'subcategory_name', 'sub_subcategory_name',

        // Product Features (comma-separated)
        'product_features',

        // Product Options
        'product_options',

        // Less Weight Items
        'product_less_weight',

        // Images and Media
        'images', 'videos', 'certificates',

        // Timestamps
        'created_at', 'updated_at',

        // Additional fields
        'discount', 'average_rating', 'review_count', 'total_quantity'
      ];

      const exportData = [allKeys.map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))];

      // Add product data
      allProducts.forEach(product => {
        const rowData = allKeys.map(key => {
          let value = product[key];

          // Handle special cases
          if (key === 'product_features' && product.product_features) {
            // Convert product features array to comma-separated string
            if (Array.isArray(product.product_features)) {
              value = product.product_features.map(f => f.feature_points).join(', ');
            }
          } else if (key === 'product_options' && product.product_options) {
            // Show product options count and details
            if (Array.isArray(product.product_options)) {
              value = product.product_options.length > 0 ?
                `${product.product_options.length} options` : 'No options';
            }
          } else if (key === 'product_less_weight' && product.product_less_weight) {
            // Show less weight items count
            if (Array.isArray(product.product_less_weight)) {
              value = product.product_less_weight.length > 0 ?
                `${product.product_less_weight.length} items` : 'No items';
            }
          } else if (key === 'images' && product.images) {
            value = Array.isArray(product.images) ? product.images.join(', ') : '';
          } else if (key === 'videos' && product.videos) {
            value = Array.isArray(product.videos) ? product.videos.length : 0;
          } else if (key === 'certificates' && product.certificates) {
            value = Array.isArray(product.certificates) ? product.certificates.length : 0;
          } else if (key === 'created_at' || key === 'updated_at') {
            value = value ? new Date(value).toLocaleDateString() : '';
          } else if (key === 'customizable' || key === 'engraving' || key === 'hallmark') {
            // Convert boolean to Yes/No
            if (value === true || value === 1) {
              value = 'Yes';
            } else if (value === false || value === 0) {
              value = 'No';
            } else {
              value = '';
            }
          } else if (key === 'category_name' || key === 'subcategory_name' || key === 'sub_subcategory_name') {
            // Handle category names from joins
            value = value || '';
          }

          // Return value or empty string (not 'N/A' for better Excel compatibility)
          return value !== null && value !== undefined ? value : '';
        });

        exportData.push(rowData);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Products');

      // Save the file
      const fileName = `all_products_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      showNotification(`Successfully exported ${allProducts.length} products`, 'success');
    } catch (error) {
      console.error('Error exporting products:', error);
      showNotification('Error exporting products', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-product-listing-container">
      <h2 className="admin-product-listing-title">Product Listing</h2>

      {/* Enhanced Filters Section */}
      <div className="admin-product-listing-controls-card">
        <div className="admin-product-listing-controls">
          <div className="admin-search-filter-group">
            <div className="admin-input-icon-group">
              <Search className="admin-input-icon" size={18} />
              <input
                type="text"
                className="admin-product-search-input"
                placeholder="Search Product by name, SKU, tag number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Basic Filters */}
            <div className="admin-select-icon-group">
              <select
                className="admin-category-dropdown"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <ChevronDown className="admin-select-icon" size={18} />
            </div>

            <div className="admin-select-icon-group">
              <select
                className="admin-category-dropdown"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">All Subcategories</option>
                {subcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
              <ChevronDown className="admin-select-icon" size={18} />
            </div>

            <div className="admin-select-icon-group">
              <select
                className="admin-category-dropdown"
                value={selectedSubSubcategory}
                onChange={(e) => setSelectedSubSubcategory(e.target.value)}
                disabled={!selectedSubcategory}
              >
                <option value="">All Sub-Subcategories</option>
                {subSubcategories.map(subSubcategory => (
                  <option key={subSubcategory.id} value={subSubcategory.id}>{subSubcategory.name}</option>
                ))}
              </select>
              <ChevronDown className="admin-select-icon" size={18} />
            </div>

            <div className="admin-select-icon-group">
              <select
                className="admin-category-dropdown"
                value={selectedMetalType}
                onChange={(e) => setSelectedMetalType(e.target.value)}
              >
                <option value="">All Metal Types</option>
                {metalTypes.map(metalType => (
                  <option key={metalType.id} value={metalType.id}>{metalType.name}</option>
                ))}
              </select>
              <ChevronDown className="admin-select-icon" size={18} />
            </div>

            <div className="admin-select-icon-group">
              <select
                className="admin-category-dropdown"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="admin-select-icon" size={18} />
            </div>

            {/* Advanced Filters Toggle */}
            <button
              className="admin-filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          <div className="admin-action-buttons">
            {selectedProducts.length > 0 && (
              <button className="admin-bulk-add-btn" onClick={handleBulkDelete}>
                <Trash2 size={18} style={{ marginRight: 6 }} /> Delete Selected ({selectedProducts.length})
              </button>
            )}
            <button
              className="admin-bulk-add-btn"
              onClick={exportAllProducts}
              disabled={loading}
              style={{
                background: 'var(--pvj-green)',
                color: 'var(--white)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}
            >
              <Download size={18} />
              {loading ? 'Exporting...' : 'Export All'}
            </button>
            <button className="admin-bulk-add-btn" onClick={() => setShowBulkAddPopup(true)}>
              <FilePlus size={18} style={{ marginRight: 6 }} /> Bulk Add
            </button>
            <button className="admin-add-product-btn" onClick={handleAddProduct}>
              <img src={folderPlus} alt="add product" height="16px" width="16px" loading="lazy" decoding="async" /> Add Product
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="admin-advanced-filters">
            <div className="admin-filter-row">


              <div className="admin-filter-group">
                <label>Manufacturing</label>
                <select
                  value={selectedManufacturing}
                  onChange={(e) => setSelectedManufacturing(e.target.value)}
                >
                  <option value="">All Manufacturing</option>
                  <option value="Handcrafted">Handcrafted</option>
                  <option value="Machine Made">Machine Made</option>
                  <option value="Semi-Handcrafted">Semi-Handcrafted</option>
                </select>
              </div>

              <div className="admin-filter-group">
                <label>Customizable</label>
                <select
                  value={selectedCustomizable}
                  onChange={(e) => setSelectedCustomizable(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="admin-filter-group">
                <label>Engraving</label>
                <select
                  value={selectedEngraving}
                  onChange={(e) => setSelectedEngraving(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="admin-filter-group">
                <label>Hallmark</label>
                <select
                  value={selectedHallmark}
                  onChange={(e) => setSelectedHallmark(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="admin-filter-group">
                <label>Price Range (₹)</label>
                <div className="admin-range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-filter-group">
                <label>Weight Range (g)</label>
                <div className="admin-range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={weightRange.min}
                    onChange={(e) => setWeightRange({ ...weightRange, min: e.target.value })}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={weightRange.max}
                    onChange={(e) => setWeightRange({ ...weightRange, max: e.target.value })}
                  />
                </div>
              </div>

              <button className="admin-clear-filters-btn" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Product Table */}
      <div className="admin-product-table-wrapper">
        <table className="admin-product-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  className="admin-proList-chckbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th onClick={() => handleSort('name')}>
                <span className="admin-table-header-flex">
                  {getSortIcon('name')} PRODUCT
                </span>
              </th>
              <th onClick={() => handleSort('category_id')}>
                <span className="admin-table-header-flex">
                  {getSortIcon('category_id')} CATEGORY
                </span>
              </th>
              <th onClick={() => handleSort('subcategory_id')}>
                <span className="admin-table-header-flex">
                  {getSortIcon('subcategory_id')} SUB CATEGORY
                </span>
              </th>
              <th onClick={() => handleSort('gross_weight')}>
                <span className="admin-table-header-flex">
                  {getSortIcon('gross_weight')} WEIGHT
                </span>
              </th>
              <th onClick={() => handleSort('total_rs')}>
                <span className="admin-table-header-flex">
                  {getSortIcon('total_rs')} PRICE
                </span>
              </th>

              <th onClick={() => handleSort('status')}>
                <span className="admin-table-header-flex">
                  {getSortIcon('status')} STATUS
                </span>
              </th>
              <th>
                <span className="admin-table-header-flex">
                  <ArrowUpDown className="admin-table-arrow-icon" /> ACTIONS
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="checkbox"
                      className="admin-proList-chckbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <div className="admin-product-info">
                      <Link to={`/product/${product.slug || product.id}`} target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <img
                          src={import.meta.env.VITE_API_URL + product.images?.[0] || productImg}
                          alt={product.item_name}
                          className="admin-product-img"
                        />
                      </Link>
                      <div>
                        <Link
                          to={`/product/${product.slug || product.id}`}
                          target="_blank"
                          className="admin-product-name"
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#7c2d4a'}
                          onMouseLeave={(e) => e.target.style.color = 'inherit'}
                        >
                          {product.item_name}
                        </Link>
                        <div className="admin-product-details">
                          <span className="admin-product-sku">SKU: {product.sku}</span>
                          {product.tag_number && (
                            <span className="admin-product-tag">Tag: {product.tag_number}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-category-info">
                      <span className="admin-category-name">{product.categories?.[0] || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-subcategory-info">
                      <span className="admin-subcategory-name">{product.subcategories?.[0] || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-weight-info">
                      <div className="admin-weight-fine">
                        <strong>Fine:</strong> {formatWeight(product.total_fine_weight)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-price-info">
                      <div className="admin-price-total">
                        <strong>{formatCurrency(product.total_rs)}</strong>
                      </div>
                      {product.rate > 0 && (
                        <div className="admin-price-rate">
                          Rate: {formatCurrency(product.rate)}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className={`admin-status-badge ${product.status === "active" ? "active" : "inactive"}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-btn-group">
                      <button className="admin-action-icon-btn" title="View" onClick={() => handleViewProduct(product.id)}>
                        <Eye size={16} />
                      </button>
                      <span className="admin-action-divider"></span>
                      <button
                        className="admin-action-icon-btn"
                        title="Edit"
                        onClick={() => handleEditProduct(product.id)}
                      >
                        <Edit size={16} />
                      </button>
                      <span className="admin-action-divider"></span>
                      <button
                        className="admin-action-icon-btn"
                        title="Delete"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}

      {/* Add Product Popup */}
      <AddProductPopup
        isOpen={showAddPopup}
        onClose={() => setShowAddPopup(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Edit Product Popup */}
      <EditProductPopup
        isOpen={showEditPopup}
        onClose={() => {
          setShowEditPopup(false);
          setEditingProductId(null);
        }}
        onProductUpdated={handleProductUpdated}
        productId={editingProductId}
      />

      {/* Bulk Add Products Popup */}
      <BulkAddProducts
        isOpen={showBulkAddPopup}
        onClose={() => setShowBulkAddPopup(false)}
        onBulkAdd={handleBulkAdd}
      />

      {/* View Product Popup */}
      <ViewProductPopup
        isOpen={showViewPopup}
        onClose={() => setShowViewPopup(false)}
        productId={viewingProductId}
      />
    </div>
  );
};

export default ProductListing;
