import React, { useEffect, useState, useContext } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Plus,
  Download,
  Trash2,
  ArrowUpDown,
  Edit,
  Eye,
  X,
} from "lucide-react";
import "./CertificateManagement.css";
import googleDocs from "../../../assets/img/icons/google-docs.png";
import axios from "axios";
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const statusClass = (status) => {
  if (status === "Valid") return "admin-certi-manage-status-badge valid";
  if (status === "Expiring") return "admin-certi-manage-status-badge expiring";
  if (status === "Expired") return "admin-certi-manage-status-badge expired";
  return "admin-certi-manage-status-badge";
};

const getStatus = (cert) => {
  const today = new Date();
  const exp = cert.expiry_date ? new Date(cert.expiry_date) : null;
  if (!exp) return "Valid";
  const diff = (exp - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "Expired";
  if (diff <= 30) return "Expiring";
  return "Valid";
};

const getRemainingDays = (cert) => {
  const today = new Date();
  const exp = cert.expiry_date ? new Date(cert.expiry_date) : null;
  if (!exp) return null;
  const diff = (exp - today) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format date for input field (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const CertificateManagement = () => {
  const { token } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [form, setForm] = useState({
    product_id: '',
    certificate_name: '',
    certificate_type: '',
    issue_date: '',
    expiry_date: '',
    certificate_files: [] // array of File
  });
  const [editId, setEditId] = useState(null);
  const [products, setProducts] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [statusTooltip, setStatusTooltip] = useState(null);
  const [viewCertificate, setViewCertificate] = useState(null);
  const [currentCertificate, setCurrentCertificate] = useState(null);
  // 1. Add state for selected file in view modal
  const [selectedFile, setSelectedFile] = useState(null);

  // PDF Viewer Plugin
  // Remove PDF viewer imports

  // Fetch all products for dropdown
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.data || []);
    } catch { setProducts([]); }
  };

  // Fetch all certificates
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/certificates`);
      setCertificates(res.data.data || []);
    } catch { setCertificates([]); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); fetchCertificates(); }, []);

  // Stats
  const total = certificates.length;
  const valid = certificates.filter(c => getStatus(c) === 'Valid').length;
  const expiring = certificates.filter(c => getStatus(c) === 'Expiring').length;
  const expired = certificates.filter(c => getStatus(c) === 'Expired').length;

  // Filtered certificates
  const filteredCertificates = certificates.filter(c => {
    const prod = products.find(p => p.id === c.product_id) || {};
    const s = search.toLowerCase();
    const matchesSearch =
      (prod.item_name && prod.item_name.toLowerCase().includes(s)) ||
      (c.certificate_name && c.certificate_name.toLowerCase().includes(s));
    const matchesType = typeFilter === 'All Types' || c.certificate_type === typeFilter;
    return matchesSearch && matchesType;
  });
  const allTypes = Array.from(new Set(certificates.map(c => c.certificate_type).filter(Boolean)));

  // Modal open/close
  const openCreateModal = () => {
    setModalType('create');
    setForm({
      product_id: '',
      certificate_name: '',
      certificate_type: '',
      issue_date: '',
      expiry_date: '',
      certificate_files: []
    });
    setShowModal(true);
    setEditId(null);
    setFormError('');
    setFormSuccess('');
    setPdfPreview(null);
    setCurrentCertificate(null);
  };

  const openEditModal = (c) => {
    setModalType('edit');
    setEditId(c.id);
    setCurrentCertificate(c);
    setForm({
      product_id: c.product_id,
      certificate_name: c.certificate_name,
      certificate_type: c.certificate_type,
      issue_date: formatDateForInput(c.issue_date),
      expiry_date: formatDateForInput(c.expiry_date),
      certificate_files: c.files || [], // Initialize with existing files
      delete_file_ids: [] // Initialize for deletion
    });
    setShowModal(true);
    setFormError('');
    setFormSuccess('');
    setPdfPreview(null);
  };

  const openViewModal = (c) => {
    setViewCertificate(c);
    setShowPdfPreview(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormError('');
    setFormSuccess('');
    setPdfPreview(null);
    setCurrentCertificate(null);
  };

  const closeViewModal = () => {
    setShowPdfPreview(false);
    setViewCertificate(null);
  };

  // Handle file input change - Only PDF files allowed
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate that all files are PDF
    const invalidFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return !fileName.endsWith('.pdf') && fileType !== 'application/pdf';
    });

    if (invalidFiles.length > 0) {
      setFormError('Only PDF files are allowed for certificates.');
      e.target.value = ''; // Clear the input
      return;
    }

    setFormError('');
    setForm(f => ({ ...f, certificate_files: files }));
  };

  // Create or update certificate
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.product_id || !form.certificate_name) {
      setFormError('Product and Certificate Name are required.');
      return;
    }

    // Validate files are PDF
    if (form.certificate_files && form.certificate_files.length > 0) {
      const invalidFiles = form.certificate_files.filter(file => {
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        return !fileName.endsWith('.pdf') && fileType !== 'application/pdf';
      });

      if (invalidFiles.length > 0) {
        setFormError('Only PDF files are allowed for certificates.');
        return;
      }
    }

    // Validate dates
    if (form.issue_date && form.expiry_date) {
      const issueDate = new Date(form.issue_date);
      const expiryDate = new Date(form.expiry_date);
      if (expiryDate <= issueDate) {
        setFormError('Expiry date must be after issue date.');
        return;
      }
    }

    try {
      const data = new FormData();
      data.append('certificate_name', form.certificate_name);
      data.append('certificate_type', form.certificate_type);
      data.append('issue_date', form.issue_date);
      data.append('expiry_date', form.expiry_date);
      // Only append files, not the array itself
      if (form.certificate_files && form.certificate_files.length > 0) {
        for (const file of form.certificate_files) {
          data.append('certificate_files', file);
        }
      }
      if (modalType === 'create') {
        await axios.post(`${API_BASE_URL}/api/products/${form.product_id}/certificates`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setFormSuccess('Certificate created!');
      } else {
        // For update, also send delete_file_ids if any
        if (form.delete_file_ids && form.delete_file_ids.length > 0) {
          for (const id of form.delete_file_ids) {
            data.append('delete_file_ids[]', id);
          }
        }
        await axios.put(`${API_BASE_URL}/api/certificates/${editId}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setFormSuccess('Certificate updated!');
      }
      setTimeout(() => { closeModal(); fetchCertificates(); setFormSuccess(''); }, 1000);
    } catch (err) {
      console.error('Error:', err);
      setFormError(err.response?.data?.message || 'Failed to save certificate.');
    }
  };

  // Delete certificate
  const handleDelete = (id) => { setDeleteId(id); setShowDeleteConfirm(true); };
  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/certificates/${deleteId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCertificates();
      showNotification('Certificate deleted!', 'success');
    } catch {
      showNotification('Failed to delete certificate.', 'error');
    }
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };
  const cancelDelete = () => { setShowDeleteConfirm(false); setDeleteId(null); };

  // Handle status click to show remaining days
  const handleStatusClick = (cert) => {
    const remainingDays = getRemainingDays(cert);
    if (remainingDays !== null) {
      setStatusTooltip({
        certId: cert.id,
        remainingDays: remainingDays,
        status: getStatus(cert)
      });
      setTimeout(() => setStatusTooltip(null), 3000);
    }
  };

  // Handle download
  const handleDownload = (cert) => {
    if (cert.certificate_file) {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}${cert.certificate_file}`;
      link.target = '_blank';
      link.download = cert.certificate_name || 'certificate';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // New function to handle file download for individual files
  const handleDownloadFile = (file) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}${file.file_url}`;
    link.target = '_blank';
    link.download = file.file_url.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-certi-manage-container">
      <h2 className="admin-certi-manage-title">Certificate Management</h2>
      <div className="admin-certi-manage-stats-row">
        <div className="admin-certi-manage-stats-card">
          <div className="admin-certi-manage-stats-card-header">
            <p className="admin-certi-manage-stats-card-heading">Total Certificate</p>
            <span className="admin-certi-manage-stats-icon admin-certi-manage-stats-icon-green"><FileText size={23} /></span>
          </div>
          <div className="admin-certi-manage-stats-value admin-certi-manage-stats-value-green">{total}</div>
        </div>
        <div className="admin-certi-manage-stats-card">
          <div className="admin-certi-manage-stats-card-header">
            <p className="admin-certi-manage-stats-card-heading">Valid</p>
            <span className="admin-certi-manage-stats-icon admin-certi-manage-stats-icon-blue"><CheckCircle size={23} /></span>
          </div>
          <div className="admin-certi-manage-stats-value admin-certi-manage-stats-value-blue">{valid}</div>
        </div>
        <div className="admin-certi-manage-stats-card">
          <div className="admin-certi-manage-stats-card-header">
            <p className="admin-certi-manage-stats-card-heading">Expiring Soon</p>
            <span className="admin-certi-manage-stats-icon admin-certi-manage-stats-icon-yellow"><Clock size={23} /></span>
          </div>
          <div className="admin-certi-manage-stats-value admin-certi-manage-stats-value-yellow">{expiring}</div>
        </div>
        <div className="admin-certi-manage-stats-card">
          <div className="admin-certi-manage-stats-card-header">
            <p className="admin-certi-manage-stats-card-heading">Expired</p>
            <span className="admin-certi-manage-stats-icon admin-certi-manage-stats-icon-red"><AlertCircle size={23} /></span>
          </div>
          <div className="admin-certi-manage-stats-value admin-certi-manage-stats-value-red">{expired}</div>
        </div>
      </div>

      {/* search */}
      <div className="admin-certi-manage-search-section">
        <div className="admin-certi-manage-search-box">
          <div className="admin-certi-manage-search-filters">
            <div className="admin-certi-manage-search-wrapper">
              <Search className="admin-certi-manage-search-icon" />
              <input className="admin-certi-manage-search-input" placeholder="Search Product by name and Id.." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="admin-certi-manage-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option>All Types</option>
              {allTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="admin-certi-manage-upload-btn-wrapper">
            <button className="admin-certi-manage-upload-btn certificationBTN" onClick={openCreateModal}>
              <Plus size={20} /> Upload Certificate
            </button>
          </div>
        </div>
      </div>

      {/* search */}
      <div className="admin-certi-manage-table-wrapper">
        <table className="admin-certi-manage-table">
          <thead>
            <tr>
              <th><span className="admin-certi-manage-table-header-flex"><ArrowUpDown className="admin-certi-manage-table-arrow-icon" /> PRODUCT NAME</span></th>
              <th><span className="admin-certi-manage-table-header-flex"><ArrowUpDown className="admin-certi-manage-table-arrow-icon" /> CERTIFICATE NAME</span></th>
              <th><span className="admin-certi-manage-table-header-flex"><ArrowUpDown className="admin-certi-manage-table-arrow-icon" /> CERTIFICATE TYPE</span></th>
              <th><span className="admin-certi-manage-table-header-flex"><ArrowUpDown className="admin-certi-manage-table-arrow-icon" /> ISSUE DATE</span></th>
              <th><span className="admin-certi-manage-table-header-flex"><ArrowUpDown className="admin-certi-manage-table-arrow-icon" /> EXPIRE DATE</span></th>
              <th><span className="admin-certi-manage-table-header-flex"><ArrowUpDown className="admin-certi-manage-table-arrow-icon" /> STATUS</span></th>
              <th><span className="admin-certi-manage-table-header-flex"><ArrowUpDown className="admin-certi-manage-table-arrow-icon" /> ACTIONS</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading...</td></tr> :
              filteredCertificates.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>No certificates found.</td></tr> :
                filteredCertificates.map((row, idx) => {
                  const prod = products.find(p => p.id === row.product_id) || {};
                  // Normalize files array whether backend returns `files` or single `certificate_url`
                  const getFilesFromRow = (r) => {
                    if (!r) return [];
                    if (Array.isArray(r.files) && r.files.length > 0) return r.files;
                    if (r.certificate_url) return [{ id: r.id, file_url: r.certificate_url, uploaded_at: r.created_at }];
                    return [];
                  };
                  const files = getFilesFromRow(row);
                  const firstPdf = files.find(f => f.file_url && f.file_url.toLowerCase().endsWith('.pdf'));
                  const firstFile = files.length > 0 ? files[0] : null;
                  return (
                    <tr key={row.id}>
                      <td>{prod.item_name || '-'}</td>
                      <td>
                        <div className="admin-certi-google-docs-div">
                          <img src={googleDocs} height="16px" width="16px" alt="google docs" loading="lazy" decoding="async" />
                          {row.certificate_name}
                        </div>
                      </td>
                      <td>{row.certificate_type || '-'}</td>
                      <td>{formatDate(row.issue_date)}</td>
                      <td>{formatDate(row.expiry_date)}</td>
                      <td>
                        <span
                          className={statusClass(getStatus(row))}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleStatusClick(row)}
                          title="Click to see remaining days"
                        >
                          {getStatus(row)}
                        </span>
                        {statusTooltip && statusTooltip.certId === row.id && (
                          <div style={{
                            position: 'absolute',
                            background: '#333',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            zIndex: 1000,
                            marginTop: '5px'
                          }}>
                            {statusTooltip.remainingDays > 0
                              ? `${statusTooltip.remainingDays} days remaining`
                              : statusTooltip.remainingDays < 0
                                ? `${Math.abs(statusTooltip.remainingDays)} days expired`
                                : 'Expires today'
                            }
                          </div>
                        )}
                      </td>
                      <td className="admin-certi-manage-action-cell">
                        <button className="admin-certi-manage-edit-btn" title="Edit" onClick={() => openEditModal(row)}><Edit size={18} /></button>
                        {files.length > 0 && (
                          <button
                            className="admin-certi-manage-action-btn"
                            title="Download"
                            onClick={() => {
                              if (firstPdf) return handleDownloadFile(firstPdf);
                              if (firstFile) return handleDownloadFile(firstFile);
                              return handleDownload(row);
                            }}
                          >
                            <Download size={18} />
                          </button>
                        )}
                        <button className="admin-certi-manage-delete-btn" title="Delete" onClick={() => handleDelete(row.id)}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Modal for create/edit */}
      {showModal && (
        <div className="admin-certi-manage-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}>
          <div className="admin-certi-manage-modal-content">
            <div className="admin-certi-manage-modal-header">
              <h3 className="admin-certi-manage-modal-title">{modalType === 'create' ? 'Upload Certificate' : 'Edit Certificate'}</h3>
              <button className="admin-certi-manage-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            {formError && <div className="admin-certi-manage-modal-error">{formError}</div>}
            {formSuccess && <div className="admin-certi-manage-modal-success">{formSuccess}</div>}
            <form onSubmit={handleSubmit} className="admin-certi-manage-modal-form">
              <select
                name="product_id"
                value={form.product_id}
                onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                required
                className="admin-certi-manage-modal-input"
                disabled={modalType === 'edit'}
              >
                <option value="">Select Product</option>
                {products.map(p => <option value={p.id} key={p.id}>{p.item_name}</option>)}
              </select>
              <input
                name="certificate_name"
                value={form.certificate_name}
                onChange={e => setForm(f => ({ ...f, certificate_name: e.target.value }))}
                placeholder="Certificate Name"
                required
                className="admin-certi-manage-modal-input"
                type="text"
              />
              <input
                name="certificate_type"
                value={form.certificate_type}
                onChange={e => setForm(f => ({ ...f, certificate_type: e.target.value }))}
                placeholder="Certificate Type"
                className="admin-certi-manage-modal-input"
                type="text"
              />
              <input
                name="issue_date"
                value={form.issue_date}
                onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                placeholder="Issue Date"
                className="admin-certi-manage-modal-input"
                type="date"
              />
              <input
                name="expiry_date"
                value={form.expiry_date}
                onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                placeholder="Expiry Date"
                className="admin-certi-manage-modal-input"
                type="date"
                min={form.issue_date}
              />
              <div className="admin-certi-manage-file-upload-wrapper">
                <label className="admin-certi-manage-file-upload-label">
                  <input
                    name="certificate_files"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="admin-certi-manage-file-input"
                    multiple
                  />
                  <span className="admin-certi-manage-file-upload-text">Choose PDF Files Only (.pdf)</span>
                </label>
              </div>
              {modalType === 'edit' && currentCertificate && currentCertificate.files && currentCertificate.files.length > 0 && (
                <div className="admin-certi-manage-existing-files">
                  <div className="admin-certi-manage-existing-files-title">Existing Files:</div>
                  <ul className="admin-certi-manage-existing-files-list">
                    {currentCertificate.files.map(f => (
                      <li key={f.id} className="admin-certi-manage-existing-file-item">
                        <a href={`${API_BASE_URL}${f.file_url}`} target="_blank" rel="noopener noreferrer" className="admin-certi-manage-file-link">{f.file_url.split('/').pop()}</a>
                        <button type="button" className="admin-certi-manage-file-remove-btn" onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            delete_file_ids: [...(prev.delete_file_ids || []), f.id]
                          }));
                          setCurrentCertificate(prev => ({
                            ...prev,
                            files: prev.files.filter(file => file.id !== f.id)
                          }));
                        }}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="admin-certi-manage-modal-btn-row">
                <button
                  type="submit"
                  className="admin-certi-manage-modal-submit-btn"
                >
                  {modalType === 'create' ? 'Upload' : 'Update'}
                </button>
                <button
                  type="button"
                  className="admin-certi-manage-modal-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Certificate Modal */}
      {showPdfPreview && viewCertificate && viewCertificate.files && viewCertificate.files.filter(f => f.file_url.toLowerCase().endsWith('.pdf')).length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 20,
            maxWidth: '90vw',
            maxHeight: '90vh',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 400
          }}>
            <button
              onClick={() => { setShowPdfPreview(false); setSelectedFile(null); setViewCertificate(null); }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#333',
                zIndex: 1002
              }}
            >
              <X size={24} />
            </button>
            {/* Certificate details at the top */}
            <div style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, marginBottom: 6 }}>Certificate Details</h3>
              <div><strong>Product:</strong> {products.find(p => p.id === viewCertificate.product_id)?.name || '-'}</div>
              <div><strong>Name:</strong> {viewCertificate.certificate_name}</div>
              <div><strong>Type:</strong> {viewCertificate.certificate_type || '-'}</div>
              <div><strong>Issue Date:</strong> {formatDate(viewCertificate.issue_date)}</div>
              <div><strong>Expiry Date:</strong> {formatDate(viewCertificate.expiry_date)}</div>
              <div><strong>Status:</strong> <span className={statusClass(getStatus(viewCertificate))}>{getStatus(viewCertificate)}</span></div>
            </div>
            <h3 style={{ marginBottom: 15 }}>PDF Certificates</h3>
            <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
              {viewCertificate.files.filter(f => f.file_url.toLowerCase().endsWith('.pdf')).map(f => (
                <li key={f.id} style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  <div><strong>File Name:</strong> {f.file_url.split('/').pop()}</div>
                  {f.uploaded_at && <div><strong>Uploaded:</strong> {new Date(f.uploaded_at).toLocaleString()}</div>}
                  <a
                    href={`${API_BASE_URL}${f.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#16784f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 18px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-block',
                      fontSize: '15px',
                      marginTop: 6
                    }}
                    download
                  >
                    Download PDF
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="admin-certi-manage-delete-confirm-overlay">
          <div className="admin-certi-manage-delete-confirm">
            <div className="admin-certi-manage-delete-title">Delete Certificate?</div>
            <div className="admin-certi-manage-delete-desc">Are you sure you want to delete this certificate?</div>
            <div className="admin-certi-manage-delete-btn-row">
              <button className="admin-certi-manage-delete-confirm-btn" onClick={confirmDelete}>Yes, Delete</button>
              <button className="admin-certi-manage-delete-cancel-btn" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManagement;
