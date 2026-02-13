import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Box,
  AlertCircle,
  ArrowUpDown,
  Minus,
  MoveUp,
  Download,
  Eye,
  X,
  ShoppingCart
} from "lucide-react";
import axios from "axios";
import { useNotification } from "../../../context/NotificationContext";
import "./WishlistMonitoring.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const WishlistMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [wishlistData, setWishlistData] = useState({
    summary: {
      totalWishlist: 0,
      highDemands: 0,
      outOfStock: 0
    },
    products: []
  });
  const [filters, setFilters] = useState({
    timePeriod: 'last_12_weeks',
    category: 'all'
  });
  const [categories, setCategories] = useState([]);
  const [apiError, setApiError] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchCategories();
  }, []); // Fetch categories only once on mount

  useEffect(() => {
    fetchWishlistData();
  }, [filters.timePeriod]); // Refetch only when timePeriod changes (category filtering is done on frontend)
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/wishlist-monitoring/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWishlistData = async () => {
    try {
      setLoading(true);
      setApiError('');

      // Only send timePeriod to backend - category filtering will be done on frontend
      const response = await axios.get(`${API_BASE_URL}/api/admin/wishlist-monitoring`, {
        params: {
          timePeriod: filters.timePeriod
        }
      });

      if (response.data.success) {
        setWishlistData(response.data.data);
      } else {
        setApiError('Failed to fetch wishlist data');
        showNotification('Failed to fetch wishlist data', 'error');
      }
    } catch (error) {
      console.error('Error fetching wishlist data:', error);
      setApiError('Failed to fetch wishlist data');
      showNotification('Failed to fetch wishlist data', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleExportData = async () => {
    try {
      // Export filtered data - use frontend filtered data for export
      if (tableData.length === 0) {
        showNotification('No data to export', 'info');
        return;
      }

      const exportData = tableData.map(row => ({
        'Product Name': row.productName,
        'Category': row.category,
        'Wishlist Count': row.wishlist,
        'Trend': row.trend.label,
        'Status': row.status.inStock ? 'In Stock' : 'Out of Stock',
        'Quantity': row.status.quantity
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `wishlist-monitoring-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification('Failed to export data', 'error');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleViewProduct = async (productId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${productId}?include_options=true`);
      if (response.data.success) {
        const productData = response.data.data;
        // Ensure wishlist_users is an array (handle undefined or null)
        if (!productData.wishlist_users) {
          productData.wishlist_users = [];
        } else if (!Array.isArray(productData.wishlist_users)) {
          productData.wishlist_users = [];
        }
        setSelectedProduct(productData);
        setShowProductModal(true);
      } else {
        showNotification('Failed to fetch product details', 'error');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      showNotification('Failed to fetch product details', 'error');
    }
  };

  const handleProductNameClick = (productId) => {
    handleViewProduct(productId);
  };

  const handleRestock = async (productId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/products/${productId}/restock`);

      if (response.data.success) {
        showNotification('Product restocked successfully', 'success');
        // Refresh data after restock
        fetchWishlistData();
      } else {
        showNotification('Failed to restock product', 'error');
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      showNotification('Failed to restock product', 'error');
    }
  };

  // Filter products by category on frontend for faster performance
  const filteredProducts = useMemo(() => {
    if (filters.category === 'all') {
      return wishlistData.products;
    }
    return wishlistData.products.filter(product => {
      const productCategory = (product.category_name || 'Uncategorized').trim().toLowerCase();
      const selectedCategory = filters.category.trim().toLowerCase();
      return productCategory === selectedCategory;
    });
  }, [wishlistData.products, filters.category]);

  // Calculate summary stats from filtered products
  const filteredSummary = useMemo(() => {
    const totalWishlist = filteredProducts.reduce((sum, product) => sum + (product.wishlist_count || 0), 0);
    const highDemands = filteredProducts.filter(product => (product.wishlist_count || 0) >= 30).length;
    const outOfStock = filteredProducts.filter(product => product.stock_status === 'out_of_stock').length;

    return {
      totalWishlist,
      highDemands,
      outOfStock,
      totalChangePercent: wishlistData.summary.totalChangePercent,
      outOfStockChangePercent: wishlistData.summary.outOfStockChangePercent
    };
  }, [filteredProducts, wishlistData.summary.totalChangePercent, wishlistData.summary.outOfStockChangePercent]);

  const tableData = filteredProducts.map(product => ({
    productName: product.item_name,
    category: product.category_name || 'Uncategorized',
    wishlist: product.wishlist_count || 0,
    trend: {
      type: product.trend_direction || 'stable', // 'up', 'down', 'stable'
      label: product.trend_direction === 'up' ? 'UP' :
        product.trend_direction === 'down' ? 'Down' : 'Stable'
    },
    status: {
      inStock: product.stock_status === 'in_stock',
      quantity: product.total_quantity || 0,
      stock_status: product.stock_status
    },
    actions: product.stock_status === 'out_of_stock' ? ['view', 'restock'] : ['view'],
    productId: product.id
  }));

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return { text: 'Out of Stock', className: 'out-stock' };
    } else if (quantity < 5) {
      return { text: `${quantity} in stock`, className: 'low-stock' };
    } else {
      return { text: 'In Stock', className: 'in-stock' };
    }
  };

  if (loading) {
    return (
      <div className="admin-wishlist-moni-container">
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
          Loading wishlist monitoring data...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wishlist-moni-container">
      <h2 className="admin-wishlist-moni-title">Wishlist monitoring</h2>
      <div className="admin-wishlist-moni-cards-row">
        <div className="admin-wishlist-moni-card">
          <div className="admin-wishlist-moni-card-content">
            <div className="admin-wishlist-moni-card-label">Total Wishlist</div>
            <div className="admin-wishlist-moni-card-value">₹{filteredSummary.totalWishlist.toLocaleString()}</div>
            {filteredSummary.totalChangePercent !== undefined && filteredSummary.totalChangePercent !== 0 && (
              <div className={`admin-wishlist-moni-card-change ${filteredSummary.totalChangePercent >= 0 ? 'up' : 'down'}`}>
                <MoveUp size={16} /> {Math.abs(filteredSummary.totalChangePercent)}% <span>from last period</span>
              </div>
            )}
          </div>
          <div className="admin-wishlist-moni-card-icon admin-wishlist-moni-card-heart">
            <Heart size={25} />
          </div>
        </div>
        <div className="admin-wishlist-moni-card">
          <div className="admin-wishlist-moni-card-content">
            <div className="admin-wishlist-moni-card-label">High Demands</div>
            <div className="admin-wishlist-moni-card-value">{filteredSummary.highDemands}</div>
            <div className="admin-wishlist-moni-card-desc">
              product with 30+wishlist
            </div>
          </div>
          <div className="admin-wishlist-moni-card-icon admin-wishlist-moni-card-box">
            <Box size={25} />
          </div>
        </div>
        <div className="admin-wishlist-moni-card">
          <div className="admin-wishlist-moni-card-content">
            <div className="admin-wishlist-moni-card-label">Out Of Stock</div>
            <div className="admin-wishlist-moni-card-value">{filteredSummary.outOfStock.toLocaleString()}</div>
            {filteredSummary.outOfStockChangePercent !== undefined && filteredSummary.outOfStockChangePercent !== 0 && (
              <div className={`admin-wishlist-moni-card-change ${filteredSummary.outOfStockChangePercent >= 0 ? 'up' : 'down'}`}>
                <MoveUp size={16} /> {Math.abs(filteredSummary.outOfStockChangePercent)}% <span>vs last period</span>
              </div>
            )}
          </div>
          <div className="admin-wishlist-moni-card-icon admin-wishlist-moni-card-alert">
            <AlertCircle size={28} />
          </div>
        </div>
      </div>

      <div className="admin-wishlist-moni-filters-row">
        <div className="admin-wishlist-moni-filter-group">
          <label>Time Period</label>
          <select
            className="admin-wishlist-moni-select"
            value={filters.timePeriod}
            onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
          >
            <option value="last_12_weeks">Last 12 weeks</option>
            <option value="last_month">Last month</option>
            <option value="last_3_months">Last 3 months</option>
            <option value="last_6_months">Last 6 months</option>
          </select>
        </div>
        <div className="admin-wishlist-moni-filter-group">
          <label>Categories</label>
          <select
            className="admin-wishlist-moni-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <option key={category.id || category.name} value={category.name}>
                  {category.name || 'Unnamed Category'}
                </option>
              ))
            ) : (
              <option value="" disabled>No categories available</option>
            )}
          </select>
        </div>
        <button
          className="admin-wishlist-moni-export-btn"
          onClick={handleExportData}
        >
          <Download size={18} /> Export data
        </button>
      </div>

      <div className="admin-wishlist-moni-table-wrapper">
        <div className="admin-wishlist-moni-table-title">
          Top Wishlisted Products
        </div>
        {apiError && (
          <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
            {apiError}
          </div>
        )}
        <table className="admin-wishlist-moni-table">
          <thead>
            <tr>
              <th>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowUpDown size={12} /> Product Name
                </span>
              </th>
              <th>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowUpDown size={12} /> Category
                </span>
              </th>
              <th>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowUpDown size={12} /> Wishlist
                </span>
              </th>
              <th>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowUpDown size={12} /> Trend
                </span>
              </th>
              <th>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowUpDown size={12} /> Status
                </span>
              </th>
              <th>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowUpDown size={12} /> Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => {
              const stockStatus = getStockStatus(row.status.quantity);
              return (
                <tr key={idx}>
                  <td>
                    <span
                      style={{
                        cursor: 'pointer',
                        color: '#3b82f6',
                        textDecoration: 'underline',
                        fontWeight: '500'
                      }}
                      onClick={() => handleProductNameClick(row.productId)}
                    >
                      {row.productName}
                    </span>
                  </td>
                  <td>{row.category}</td>
                  <td>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Heart size={18} className="admin-wishlist-moni-heart" />{" "}
                      {row.wishlist}
                    </span>
                  </td>
                  <td
                    className={
                      row.trend.type === "up"
                        ? "admin-wishlist-moni-trend-up"
                        : row.trend.type === "down"
                          ? "admin-wishlist-moni-trend-down"
                          : "admin-wishlist-moni-trend-stable"
                    }
                  >
                    {row.trend.type === "up" && (
                      <TrendingUp size={16} color="#dc2626" />
                    )}
                    {row.trend.type === "down" && (
                      <TrendingDown size={16} color="#dc2626" />
                    )}
                    {row.trend.type === "stable" && <Minus size={16} />}
                    {row.trend.label}
                  </td>
                  <td>
                    <span
                      className={`admin-wishlist-moni-status ${stockStatus.className}`}
                    >
                      {stockStatus.text}
                    </span>
                  </td>
                  <td>
                    {row.actions.includes("view") && (
                      <button
                        className="admin-wishlist-moni-action-btn"
                        onClick={() => handleViewProduct(row.productId)}
                      >
                        <Eye size={16} style={{ marginRight: '4px' }} />
                        View product
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Product Details Modal - Invoice Style */}
      {showProductModal && selectedProduct && createPortal(
        <div className="wishlist-moni-modal" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowProductModal(false);
          }
        }}>
          <div className="wishlist-moni-modal-content wishlist-moni-invoice-modal" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="wishlist-moni-invoice-header-fixed">
              <h3 className="wishlist-moni-invoice-order-items-title">Product Details</h3>
            </div>

            {/* Scrollable Content Section */}
            <div className="wishlist-moni-invoice-order-items-section">

              {/* Main Items Table */}
              <div className="wishlist-moni-invoice-table-container">
                <table className="wishlist-moni-invoice-order-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Sub-subcategory</th>
                      <th>Size</th>
                      <th>Weight</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.product_options && selectedProduct.product_options.length > 0 ? (
                      selectedProduct.product_options.map((option, index) => {
                        const productImage = selectedProduct.product_images && selectedProduct.product_images.length > 0
                          ? selectedProduct.product_images[0].image_url
                          : null;
                        const imageUrl = productImage
                          ? (productImage.startsWith('http') || productImage.startsWith('data:')
                            ? productImage
                            : (productImage.startsWith('/') ? `${API_BASE_URL}${productImage}` : `${API_BASE_URL}/${productImage}`))
                          : null;

                        return (
                          <tr key={index}>
                            {/* Image Column */}
                            <td className="wishlist-moni-invoice-image-cell">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={selectedProduct.item_name}
                                  className="wishlist-moni-invoice-item-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="wishlist-moni-invoice-item-image-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
                                <ShoppingCart size={24} color="#999" />
                              </div>
                            </td>

                            {/* Product Column */}
                            <td className="wishlist-moni-invoice-product-cell">
                              <div className="wishlist-moni-invoice-product-name">
                                {selectedProduct.item_name}
                              </div>
                              {selectedProduct.tunch && parseFloat(selectedProduct.tunch) > 0 && (
                                <div className="wishlist-moni-invoice-product-tunch">
                                  Purity: {selectedProduct.tunch}%
                                </div>
                              )}
                            </td>

                            {/* SKU Column */}
                            <td>{selectedProduct.sku || 'N/A'}</td>

                            {/* Category Column */}
                            <td>{selectedProduct.categories?.name || selectedProduct.category_name || 'N/A'}</td>

                            {/* Subcategory Column */}
                            <td>{selectedProduct.subcategories?.name || selectedProduct.subcategory_name || 'N/A'}</td>

                            {/* Sub-subcategory Column */}
                            <td>{selectedProduct.sub_subcategories?.name || selectedProduct.sub_subcategory_name || 'N/A'}</td>

                            {/* Size Column */}
                            <td>{option.size || 'N/A'}</td>

                            {/* Weight Column */}
                            <td>{option.weight ? `${option.weight} g` : 'N/A'}</td>

                            {/* Quantity Column */}
                            <td>{selectedProduct.pieces || option.quantity || 1}</td>

                            {/* Rate Column */}
                            <td className="wishlist-moni-invoice-rate-cell">
                              ₹{parseFloat(option.sell_price || option.value || selectedProduct.total_rs || selectedProduct.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>

                            {/* Total Column */}
                            <td className="wishlist-moni-invoice-total-cell">
                              ₹{parseFloat((option.sell_price || option.value || selectedProduct.total_rs || selectedProduct.rate || 0) * (selectedProduct.pieces || option.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          No product options available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Price Breakdown Section */}
              {selectedProduct.product_options && selectedProduct.product_options.length > 0 && selectedProduct.product_options[0] && (() => {
                const option = selectedProduct.product_options[0];
                const basePrice = parseFloat(option.sell_price || option.value || selectedProduct.total_rs || selectedProduct.rate || 0);
                const discount = parseFloat(selectedProduct.discount || 0);
                const finalPrice = discount > 0 ? basePrice - (basePrice * discount / 100) : basePrice;
                const quantity = selectedProduct.pieces || option.quantity || 1;

                return (
                  <div className="wishlist-moni-invoice-price-breakdown">
                    <div className="wishlist-moni-invoice-breakdown-row">
                      <span className="wishlist-moni-invoice-breakdown-label">Base Price:</span>
                      <span className="wishlist-moni-invoice-breakdown-value">
                        ₹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="wishlist-moni-invoice-breakdown-row">
                        <span className="wishlist-moni-invoice-breakdown-label">Discount ({discount}%):</span>
                        <span className="wishlist-moni-invoice-breakdown-value wishlist-moni-invoice-discount-breakdown">
                          -₹{(basePrice * discount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="wishlist-moni-invoice-breakdown-row wishlist-moni-invoice-breakdown-final">
                      <span className="wishlist-moni-invoice-breakdown-label">Final Price (per item):</span>
                      <span className="wishlist-moni-invoice-breakdown-value wishlist-moni-invoice-final-breakdown">
                        ₹{finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Additional Product Information */}
              <div className="wishlist-moni-invoice-additional-info">
                <h4 className="wishlist-moni-invoice-section-title">Product Specifications</h4>
                <div className="wishlist-moni-invoice-info-grid">
                  <div className="wishlist-moni-invoice-info-group">
                    <h5>Weight Details</h5>
                    {selectedProduct.gross_weight && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Gross Weight:</span>
                        <span className="info-value">{selectedProduct.gross_weight} g</span>
                      </div>
                    )}
                    {selectedProduct.net_weight && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Net Weight:</span>
                        <span className="info-value">{selectedProduct.net_weight} g</span>
                      </div>
                    )}
                    {selectedProduct.less_weight && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Less Weight:</span>
                        <span className="info-value">{selectedProduct.less_weight} g</span>
                      </div>
                    )}
                    {selectedProduct.total_fine_weight && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Total Fine Weight:</span>
                        <span className="info-value">{selectedProduct.total_fine_weight} g</span>
                      </div>
                    )}
                    {selectedProduct.additional_weight && parseFloat(selectedProduct.additional_weight) > 0 && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Additional Weight:</span>
                        <span className="info-value">{selectedProduct.additional_weight} g</span>
                      </div>
                    )}
                  </div>

                  <div className="wishlist-moni-invoice-info-group">
                    <h5>Gemstone Details</h5>
                    {selectedProduct.diamond_weight && parseFloat(selectedProduct.diamond_weight) > 0 && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Diamond Weight:</span>
                        <span className="info-value">{selectedProduct.diamond_weight} carat</span>
                      </div>
                    )}
                    {selectedProduct.stone_weight && parseFloat(selectedProduct.stone_weight) > 0 && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Stone Weight:</span>
                        <span className="info-value">{selectedProduct.stone_weight} carat</span>
                      </div>
                    )}
                  </div>

                  <div className="wishlist-moni-invoice-info-group">
                    <h5>Pricing Details</h5>
                    {selectedProduct.rate && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Rate:</span>
                        <span className="info-value">₹{parseFloat(selectedProduct.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {selectedProduct.labour && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Labour ({selectedProduct.labour_on || 'N/A'}):</span>
                        <span className="info-value">₹{parseFloat(selectedProduct.labour).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {selectedProduct.other && parseFloat(selectedProduct.other) > 0 && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Other:</span>
                        <span className="info-value">₹{parseFloat(selectedProduct.other).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {selectedProduct.wastage_percentage && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Wastage:</span>
                        <span className="info-value">{selectedProduct.wastage_percentage}%</span>
                      </div>
                    )}
                  </div>

                  <div className="wishlist-moni-invoice-info-group">
                    <h5>Product Information</h5>
                    {selectedProduct.tag_number && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Tag Number:</span>
                        <span className="info-value">{selectedProduct.tag_number}</span>
                      </div>
                    )}
                    {selectedProduct.stamp && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Stamp:</span>
                        <span className="info-value">{selectedProduct.stamp}</span>
                      </div>
                    )}
                    {selectedProduct.batch && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Batch:</span>
                        <span className="info-value">{selectedProduct.batch}</span>
                      </div>
                    )}
                    {selectedProduct.manufacturing && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Manufacturing:</span>
                        <span className="info-value">{selectedProduct.manufacturing}</span>
                      </div>
                    )}
                    {selectedProduct.design_type && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Design Type:</span>
                        <span className="info-value">{selectedProduct.design_type}</span>
                      </div>
                    )}
                    {selectedProduct.unit && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Unit:</span>
                        <span className="info-value">{selectedProduct.unit}</span>
                      </div>
                    )}
                    {selectedProduct.pieces && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Pieces:</span>
                        <span className="info-value">{selectedProduct.pieces}</span>
                      </div>
                    )}
                  </div>

                  <div className="wishlist-moni-invoice-info-group">
                    <h5>Features</h5>
                    <div className="wishlist-moni-invoice-info-row">
                      <span className="info-label">Hallmark:</span>
                      <span className="info-value">{selectedProduct.hallmark === 1 ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="wishlist-moni-invoice-info-row">
                      <span className="info-label">Engraving:</span>
                      <span className="info-value">{selectedProduct.engraving === 1 ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="wishlist-moni-invoice-info-row">
                      <span className="info-label">Customizable:</span>
                      <span className="info-value">{selectedProduct.customizable === 1 ? 'Yes' : 'No'}</span>
                    </div>
                    {selectedProduct.status && (
                      <div className="wishlist-moni-invoice-info-row">
                        <span className="info-label">Status:</span>
                        <span className="info-value" style={{
                          color: selectedProduct.status === 'active' ? '#28a745' : '#dc3545',
                          fontWeight: '600'
                        }}>
                          {selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedProduct.description && (
                    <div className="wishlist-moni-invoice-info-group full-width">
                      <h5>Description</h5>
                      <div className="wishlist-moni-invoice-description">
                        {selectedProduct.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Wishlist Users Section */}
              {selectedProduct.wishlist_users && Array.isArray(selectedProduct.wishlist_users) && selectedProduct.wishlist_users.length > 0 && (
                <div className="wishlist-moni-invoice-users-section">
                  <h4 className="wishlist-moni-invoice-users-title">Users who wishlisted this product</h4>
                  <div className="wishlist-moni-invoice-users-list">
                    {selectedProduct.wishlist_users.map((user, index) => (
                      <div key={user.id || index} className="wishlist-moni-invoice-user-item">
                        <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                        <p><strong>Added:</strong> {user.added_at ? new Date(user.added_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Close Button */}
            <div className="wishlist-moni-modal-btn-row">
              <button className="wishlist-moni-modal-btn" onClick={() => setShowProductModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default WishlistMonitoring;
