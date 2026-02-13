import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUser } from '../../context/UserContext';
import { useDynamicLinks } from '../../hooks/useDynamicLinks';
import receiptIcon from '../../assets/img/icons/receipt1.png';
import downloadIcon from '../../assets/img/icons/downloads1.png';
import verifiedIcon from '../../assets/img/icons/Group 809.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SectionHeading = ({ children }) => (
  <div className="iac-section-heading">
    {children}
  </div>
);

const InvoicesAndCertifications = () => {
  const { user, token } = useUser();
  const { links } = useDynamicLinks();
  const [orders, setOrders] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [downloadingCertificate, setDownloadingCertificate] = useState(null);

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/user`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 } // Get more orders
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    }
  };

  // Fetch product certificates for user's ordered products
  const fetchProductCertificates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCertificates(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (token && user) {
      setLoading(true);
      Promise.all([fetchUserOrders(), fetchProductCertificates()])
        .finally(() => setLoading(false));
    }
  }, [token, user]);

  // Format currency
  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Format date for invoice
  const formatInvoiceDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time for invoice
  const formatInvoiceTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Resolve image URL
  const resolveImage = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = API_BASE_URL.replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  };

  // Download invoice function - client-side PDF generation
  const downloadInvoice = async (order) => {
    if (downloadingInvoice) return;

    try {
      setDownloadingInvoice(order.id);

      // Fetch full order details with items
      const response = await axios.get(`${API_BASE_URL}/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch order details');
      }

      const fullOrder = response.data.data;
      const items = Array.isArray(fullOrder.items) ? fullOrder.items : [];

      const companyPhone = links?.whatsapp || '+919829034926';
      const companyEmail = links?.email || 'p.v.jewellersnsons.sks@gmail.com';
      const companyWebsite = links?.website || 'https://pvjjewellers.com';

      // Calculate totals
      const grandTotal = items.reduce((sum, item) => {
        const price = Number(item?.custom_price ?? item?.price ?? item?.product_rate ?? 0);
        const quantity = Number(item?.quantity ?? 1);
        return sum + price * quantity;
      }, 0);

      // Create invoice HTML with scoped styles
      const uniqueId = `invoice-pdf-${Date.now()}`;
      const invoiceHTML = `
        <style>
          .${uniqueId} * { margin: 0; padding: 0; box-sizing: border-box; }
          .${uniqueId} { 
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: white;
            color: #333;
          }
          .${uniqueId} .invoice-header-section { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #7c2d4a; }
          .${uniqueId} .header { text-align: center; margin-bottom: 15px; }
          .${uniqueId} .logo { font-size: 24px; font-weight: bold; color: #7c2d4a; margin-bottom: 5px; }
          .${uniqueId} .invoice-title { font-size: 28px; color: #333; margin-bottom: 3px; font-weight: bold; }
          .${uniqueId} .invoice-subtitle { color: #666; font-size: 14px; }
          .${uniqueId} .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 30px; }
          .${uniqueId} .customer-info, .${uniqueId} .invoice-info { flex: 1; }
          .${uniqueId} .info-section { margin-bottom: 15px; }
          .${uniqueId} .info-title { font-weight: bold; color: #7c2d4a; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid #7c2d4a; padding-bottom: 3px; }
          .${uniqueId} .info-content { color: #333; line-height: 1.6; font-size: 12px; }
          .${uniqueId} .info-content div { margin-bottom: 4px; }
          .${uniqueId} .company-address-section { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #7c2d4a; }
          .${uniqueId} .items-section { margin-bottom: 20px; }
          .${uniqueId} .items-section h3 { color: #7c2d4a; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #7c2d4a; padding-bottom: 3px; }
          .${uniqueId} .invoice-items-table { width: 100%; border-collapse: collapse; background: white; font-size: 11px; }
          .${uniqueId} .invoice-items-table th { background: linear-gradient(135deg, #7c2d4a 0%, #9a3d5f 100%); color: white; padding: 10px 8px; text-align: left; font-weight: 600; font-size: 11px; }
          .${uniqueId} .invoice-items-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; }
          .${uniqueId} .invoice-items-table tr:nth-child(even) { background-color: #f8f9fa; }
          .${uniqueId} .invoice-item-image { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e0e0e0; }
          .${uniqueId} .invoice-product-name { font-weight: 600; color: #333; font-size: 12px; }
          .${uniqueId} .invoice-product-meta { font-size: 10px; color: #777; margin-top: 3px; }
          .${uniqueId} .total-section { text-align: right; margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #7c2d4a; }
          .${uniqueId} .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px 0; }
          .${uniqueId} .total-label { font-weight: 600; color: #333; font-size: 13px; }
          .${uniqueId} .total-value { font-weight: bold; color: #7c2d4a; font-size: 13px; }
          .${uniqueId} .grand-total { border-top: 2px solid #7c2d4a; padding-top: 10px; margin-top: 10px; font-size: 18px; }
          .${uniqueId} .grand-total .total-label, .${uniqueId} .grand-total .total-value { font-size: 20px; }
          .${uniqueId} .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
          .${uniqueId} .footer p:first-child { font-weight: bold; color: #7c2d4a; font-size: 14px; }
        </style>
        <div class="${uniqueId}">
          <div class="invoice-header-section">
            <div class="header">
              <div class="logo">PVJ JEWELRY</div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-subtitle">Professional Jewelry & Accessories</div>
            </div>
          </div>

          <div class="invoice-details">
            <div class="customer-info">
              <div class="info-section">
                <div class="info-title">Bill To</div>
                <div class="info-content">
                  <strong>${fullOrder.customer_name || user?.name || 'Customer'}</strong>
                  <div>Email: ${fullOrder.customer_email || user?.email || '-'}</div>
                  <div>Phone: ${fullOrder.customer_phone || user?.phone || '-'}</div>
                  <div>Address: ${[fullOrder.shipping_address, fullOrder.shipping_city, fullOrder.shipping_state, fullOrder.shipping_postal_code].filter(Boolean).join(', ') || '-'}</div>
                </div>
              </div>
            </div>
            <div class="invoice-info">
              <div class="info-section">
                <div class="info-title">Order Details</div>
                <div class="info-content">
                  <div>Invoice No: ${fullOrder.order_number || fullOrder.id}</div>
                  <div>Date: ${formatInvoiceDate(fullOrder.created_at)}</div>
                  <div>Time: ${formatInvoiceTime(fullOrder.created_at)}</div>
                  <div>Status: ${fullOrder.order_status || '-'}</div>
                  <div>Payment: ${(fullOrder.payment_method || '').toString().toUpperCase() || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="company-address-section">
            <div class="info-section">
              <div class="info-title">Company</div>
              <div class="info-content">
                <strong>PVJ Jewelry</strong>
                <div>123 Jewelry Street, Diamond Plaza</div>
                <div>Jaipur, Rajasthan - 302001, India</div>
                <div>Phone: ${companyPhone}</div>
                <div>Email: ${companyEmail}</div>
                <div>Website: ${companyWebsite}</div>
              </div>
            </div>
          </div>

          <div class="items-section">
            <h3>Order Items</h3>
            <table class="invoice-items-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Weight</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, index) => {
        const price = Number(item?.custom_price ?? item?.price ?? item?.product_rate ?? 0);
        const quantity = Number(item?.quantity ?? 1);
        const total = price * quantity;
        const imageUrl = resolveImage(item?.product_image);

        return `
                    <tr key="${index}">
                      <td>
                        ${imageUrl ? `<img src="${imageUrl}" alt="Product" class="invoice-item-image" crossOrigin="anonymous" />` : '<div style="width:40px;height:40px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;">No Image</div>'}
                      </td>
                      <td>
                        <div class="invoice-product-name">${item.product_name || '-'}</div>
                        ${item.product_sku ? `<div class="invoice-product-meta">SKU: ${item.product_sku}</div>` : ''}
                      </td>
                      <td>${item.size || '-'}</td>
                      <td>${item.weight || '-'}</td>
                      <td>${quantity}</td>
                      <td>${formatCurrency(price)}</td>
                      <td>${formatCurrency(total)}</td>
                    </tr>
                  `;
      }).join('')}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-row">
              <div class="total-label">Subtotal:</div>
              <div class="total-value">${formatCurrency(grandTotal)}</div>
            </div>
            ${fullOrder.discount_amount && fullOrder.discount_amount > 0 ? `
            <div class="total-row" style="color: #10b981;">
              <div class="total-label">Discount${fullOrder.discount_code ? ` (${fullOrder.discount_code})` : ''}:</div>
              <div class="total-value">- ${formatCurrency(fullOrder.discount_amount)}</div>
            </div>
            ` : ''}
            <div class="total-row">
              <div class="total-label">Tax:</div>
              <div class="total-value">${formatCurrency(fullOrder.tax_amount || 0)}</div>
            </div>
            ${fullOrder.cod_charge ? `
            <div class="total-row">
              <div class="total-label">COD Charge:</div>
              <div class="total-value">${formatCurrency(fullOrder.cod_charge)}</div>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <div class="total-label">Grand Total:</div>
              <div class="total-value">${formatCurrency(grandTotal - (fullOrder.discount_amount || 0) + (fullOrder.tax_amount || 0) + (fullOrder.cod_charge || 0))}</div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>This is a computer generated invoice.</p>
          </div>
        </div>
      `;

      // Create temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.innerHTML = invoiceHTML;

      document.body.appendChild(tempContainer);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Invoice_${fullOrder.order_number || fullOrder.id || 'PVJ'}.pdf`);

    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert(`Failed to download invoice: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Download certificate function with professional error handling and timeout management
  const downloadCertificate = async (certificate) => {
    // Prevent multiple simultaneous downloads
    if (downloadingCertificate === certificate.id) {
      return;
    }

    try {
      setDownloadingCertificate(certificate.id);

      // Check for certificate_url directly on certificate object or in files array
      let fileUrl = null;

      if (certificate.certificate_url) {
        fileUrl = certificate.certificate_url;
      } else if (certificate.files && certificate.files.length > 0) {
        fileUrl = certificate.files[0].file_url || certificate.files[0].certificate_url;
      }

      if (!fileUrl) {
        alert('No certificate file available for download');
        setDownloadingCertificate(null);
        return;
      }

      // Construct the correct URL for certificate files
      let certificateUrl;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        certificateUrl = fileUrl;
      } else if (fileUrl.startsWith('/')) {
        const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');
        certificateUrl = `${baseUrl}${fileUrl}`;
      } else {
        const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');
        certificateUrl = `${baseUrl}/${fileUrl}`;
      }

      // Get file extension to determine file type
      let fileExtension = 'pdf';
      if (certificate.original_name) {
        const nameParts = certificate.original_name.split('.');
        if (nameParts.length > 1) {
          fileExtension = nameParts.pop().toLowerCase();
        }
      } else if (fileUrl) {
        const urlParts = fileUrl.split('.');
        if (urlParts.length > 1) {
          fileExtension = urlParts.pop().toLowerCase();
        }
      } else if (certificate.mime_type) {
        if (certificate.mime_type.includes('jpeg') || certificate.mime_type.includes('jpg')) {
          fileExtension = 'jpg';
        } else if (certificate.mime_type.includes('png')) {
          fileExtension = 'png';
        } else if (certificate.mime_type.includes('pdf')) {
          fileExtension = 'pdf';
        }
      }

      const isPdf = fileExtension === 'pdf';
      const fileSize = certificate.file_size || 0;
      const isLargeFile = fileSize > 10 * 1024 * 1024; // 10MB

      // For large files or non-PDF files, use direct URL opening (faster, no timeout issues)
      if (!isPdf || isLargeFile) {
        // Open directly in new tab - browser handles download/view
        window.open(certificateUrl, '_blank');
        setDownloadingCertificate(null);
        return;
      }

      // For PDF files (smaller), download via blob
      // Create axios instance with increased timeout for large files
      const axiosConfig = {
        responseType: 'blob',
        timeout: 120000, // 2 minutes timeout for large files
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        }
      };

      const response = await axios.get(certificateUrl, axiosConfig);

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }

      // Generate filename
      let fileName;
      if (certificate.original_name) {
        fileName = certificate.original_name;
      } else {
        fileName = `${certificate.certificate_name || 'certificate'}.${fileExtension}`;
      }

      // Create blob and download
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: certificate.mime_type || 'application/pdf' })
      );

      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

    } catch (err) {
      console.error('Error downloading certificate:', err);

      let errorMessage = 'Failed to download certificate. ';

      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage += 'The file is too large or the connection timed out. ';
        errorMessage += 'Please try opening it directly or check your internet connection.';

        // Try to open directly as fallback
        try {
          const fileUrl = certificate.certificate_url || (certificate.files?.[0]?.file_url || certificate.files?.[0]?.certificate_url);
          if (fileUrl) {
            let fallbackUrl;
            if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
              fallbackUrl = fileUrl;
            } else if (fileUrl.startsWith('/')) {
              const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');
              fallbackUrl = `${baseUrl}${fileUrl}`;
            } else {
              const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');
              fallbackUrl = `${baseUrl}/${fileUrl}`;
            }
            window.open(fallbackUrl, '_blank');
            errorMessage += ' Opening in new tab as fallback...';
          }
        } catch (fallbackErr) {
          console.error('Fallback open failed:', fallbackErr);
        }
      } else if (err.response) {
        errorMessage += `Server error: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }

      alert(errorMessage);
    } finally {
      setDownloadingCertificate(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate order total
  const calculateOrderTotal = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="iac-wrapper">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="iac-wrapper">
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="iac-wrapper">
      {/* Invoices Section */}
      <div className="iac-section">
        <div className="orders_card_list">
          {orders.length > 0 ? (
            orders.map((order, idx) => (
              <div className="orders_card" key={order.id || idx}>
                {/* Left Section */}
                <div className="orders_card_left">
                  <div className="orders_card_iconwrap">
                    <img src={receiptIcon} alt="invoice" className="orders_card_icon" loading="lazy" decoding="async" />
                  </div>
                  <div className="orders_card_info">
                    <div className="orders_card_id_status">
                      <span className="orders_card_id">{order.order_number || `#${order.id}`}</span>
                      <span className="orders_card_status">
                        <span className="orders_card_status_tick">✔</span> {order.order_status || 'Processing'}
                      </span>
                    </div>
                    <div className="orders_card_item">
                      {order.product_names || `${order.item_count || 0} items`}
                    </div>
                    <div className="orders_card_date">{formatDate(order.created_at)}</div>
                  </div>
                </div>
                {/* Right Section */}
                <div className="orders_card_right">
                  <div className="orders_card_amount">₹{calculateOrderTotal(order).toLocaleString()}</div>
                  <button
                    className="orders_card_btn"
                    onClick={() => downloadInvoice(order)}
                    disabled={downloadingInvoice === order.id}
                  >
                    {downloadingInvoice === order.id ? 'Generating...' : 'Download Invoice'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              No orders found
            </div>
          )}
        </div>
      </div>

      {/* Certification Section */}
      <div className="iac-section-heading">CERTIFICATION</div>
      <div className="iac-section">
        <div className="iac-cards-row cert">
          {certificates.length > 0 ? (
            certificates.map((cert, idx) => (
              <div className="cert-card-ui" key={cert.id || idx}>
                <div className="cert-card-top">
                  <div className="cert-card-icon-bg">
                    <img src={receiptIcon} alt="cert" className="cert-card-icon" loading="lazy" decoding="async" />
                  </div>
                  <span className="cert-card-verified">
                    <img src={verifiedIcon} alt="verified" className="cert-card-verified-icon" loading="lazy" decoding="async" />
                    Verified
                  </span>
                </div>
                <div className="cert-card-title">{cert.certificate_name || 'Product Certificate'}</div>
                <div className="cert-card-subtitle">{cert.certificate_type || 'Purity Certification'}</div>
                <div className="cert-card-date">
                  Issued On {formatDate(cert.issue_date || cert.created_at)}
                </div>
                <button
                  className="cert-card-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadCertificate(cert);
                  }}
                  disabled={
                    downloadingCertificate === cert.id ||
                    (!cert.certificate_url && (!cert.files || cert.files.length === 0))
                  }
                  type="button"
                >
                  <img
                    src={downloadIcon}
                    alt="download"
                    className="cert-card-btn-icon"
                    loading="lazy"
                    decoding="async"
                    style={{ display: downloadingCertificate === cert.id ? 'none' : 'inline-block' }}
                  />
                  {downloadingCertificate === cert.id ? 'Loading...' : 'Download Certificate'}
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              No certificates found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesAndCertifications; 