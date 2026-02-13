import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axiosConfig';
import './CustomJewelryManagement.css';

const CustomJewelryManagement = () => {
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [formData, setFormData] = useState({
        status: 'pending',
        estimatedPrice: '',
        estimatedDelivery: '',
        adminNotes: ''
    });
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchRequests();
        fetchStats();
    }, [currentPage]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: 1,
                limit: 1000 // Fetch all requests for client-side filtering
            });

            const response = await axios.get(`/api/custom-jewelry/admin/all?${params}`);
            if (response.data.success) {
                setAllRequests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/custom-jewelry/admin/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleStatusUpdate = async (requestId, newStatus, notes = '', estimatedPrice = '', estimatedDelivery = '') => {
        try {
            setUpdatingStatus(true);
            const response = await axios.put(`/api/custom-jewelry/admin/request/${requestId}/status`, {
                status: newStatus,
                adminNotes: notes,
                estimatedPrice: estimatedPrice || null,
                estimatedDeliveryDate: estimatedDelivery || null
            });

            if (response.data.success) {
                // Update the request in allRequests
                setAllRequests(prev => prev.map(req => 
                    req.id === requestId 
                        ? { ...req, status: newStatus, admin_notes: notes, estimated_price: estimatedPrice, estimated_delivery_date: estimatedDelivery }
                        : req
                ));
                fetchStats();
                setShowModal(false);
                setSelectedRequest(null);
                setFormData({
                    status: 'pending',
                    estimatedPrice: '',
                    estimatedDelivery: '',
                    adminNotes: ''
                });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteClick = (request) => {
        setRequestToDelete(request);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!requestToDelete) return;

        try {
            setDeleting(true);
            const response = await axios.delete(`/api/custom-jewelry/admin/request/${requestToDelete.id}`);
            
            if (response.data.success) {
                // Remove from allRequests
                setAllRequests(prev => prev.filter(req => req.id !== requestToDelete.id));
                fetchStats();
                setShowDeleteModal(false);
                setRequestToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting request:', error);
            alert(error.response?.data?.message || 'Failed to delete request');
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = (e) => {
        setFilters(prev => ({
            ...prev,
            status: e.target.value
        }));
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setFilters(prev => ({
            ...prev,
            search: e.target.value
        }));
        setCurrentPage(1);
    };

    // Client-side filtering
    const filteredItems = allRequests.filter(item => {
        const matchesStatus = !filters.status || item.status === filters.status;
        const matchesSearch = !filters.search || 
            item.jewelry_type?.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.metal_type?.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.design_description?.toLowerCase().includes(filters.search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Pagination for filtered items
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRequests = filteredItems.slice(startIndex, endIndex);

    const isFilterActive = filters.status || filters.search;

    const openRequestModal = (request) => {
        setSelectedRequest(request);
        // Set default values from database
        setFormData({
            status: request.status || 'pending',
            estimatedPrice: request.estimated_price || '',
            estimatedDelivery: request.estimated_delivery_date ? request.estimated_delivery_date.split('T')[0] : '',
            adminNotes: request.admin_notes || ''
        });
        setShowModal(true);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: '#ffc107', text: 'Pending' },
            approved: { color: '#28a745', text: 'Approved' },
            in_progress: { color: '#007bff', text: 'In Progress' },
            completed: { color: '#6f42c1', text: 'Completed' },
            rejected: { color: '#dc3545', text: 'Rejected' }
        };

        const config = statusConfig[status] || { color: '#6c757d', text: status };

        return (
            <span
                className="status-badge"
                style={{ backgroundColor: config.color }}
            >
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    };

    return (
        <div className="custom-jewelry-management">
            <div className="management-header">
                <div>
                    <h1>Custom Jewelry Management</h1>
                    <p>Manage and track custom jewelry requests</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>{stats.totalRequests || 0}</h3>
                    <p>Total Requests</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.statusBreakdown?.find(s => s.status === 'pending')?.count || 0}</h3>
                    <p>Pending</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.statusBreakdown?.find(s => s.status === 'approved')?.count || 0}</h3>
                    <p>Approved</p>
                </div>
                <div className="stat-card">
                    <h3>{formatPrice(stats.averageBudget || 0)}</h3>
                    <p>Avg. Budget</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <h3>Filters</h3>
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Status:</label>
                        <select
                            value={filters.status}
                            onChange={handleStatusChange}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Search:</label>
                        <input
                            type="text"
                            placeholder="Search by jewelry type, metal, or description..."
                            value={filters.search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    {isFilterActive && (
                        <button
                            className="btn-filter"
                            onClick={() => {
                                setFilters({ status: '', search: '' });
                                setCurrentPage(1);
                            }}
                            style={{ marginLeft: '8px', background: '#6c757d' }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Requests Table */}
            <div className="requests-section">
                <div className="requests-header">
                    <h3>Custom Jewelry Requests</h3>
                </div>

                {loading ? (
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading requests...</p>
                    </div>
                ) : (
                    <div className="requests-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Jewelry Type</th>
                                    <th>Metal & Weight</th>
                                    <th>Budget</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRequests.length > 0 ? (
                                    paginatedRequests.map(request => (
                                    <tr key={request.id}>
                                        <td>#{request.id}</td>
                                        <td>
                                            <div className="customer-info">
                                                <div className="customer-name">
                                                    {request.user_name || 'Guest User'}
                                                </div>
                                                <div className="customer-email">
                                                    {request.user_email || request.email || 'N/A'}
                                                </div>
                                                <div className="customer-phone">
                                                    {request.contact_number || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="jewelry-info">
                                                <strong>{request.jewelry_type}</strong>
                                                <div className="description-preview">
                                                    {request.design_description.substring(0, 50)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="metal-weight">
                                                <div>{request.metal_type}</div>
                                                <div className="weight">{request.weight}g</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="budget">
                                                {formatPrice(request.budget)}
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td>
                                            {formatDate(request.created_at)}
                                        </td>
                                        <td>
                                            <button
                                                className="btn-view"
                                                onClick={() => openRequestModal(request)}
                                            >
                                                <i className="fas fa-eye"></i>
                                                View
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDeleteClick(request)}
                                            >
                                                <i className="fas fa-trash"></i>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                                            No requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        disabled={currentPage <= 1}
                        className="pagination-btn"
                    >
                        <i className="fas fa-chevron-left"></i>
                        Previous
                    </button>

                    <span className="pagination-info">
                        Page {currentPage} of {totalPages} ({filteredItems.length} items)
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= totalPages}
                        className="pagination-btn"
                    >
                        Next
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            {/* Request Detail Modal */}
            {showModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Custom Jewelry Request #{selectedRequest.id}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="request-details">
                                <div className="detail-section">
                                    <h3>Customer Information</h3>
                                    <div className="specs-grid">
                                        <div className="spec-item">
                                            <span className="spec-label">Name:</span>
                                            <span className="spec-value">{selectedRequest.user_name || 'Guest User'}</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Email:</span>
                                            <span className="spec-value">{selectedRequest.user_email || selectedRequest.email || 'N/A'}</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Phone:</span>
                                            <span className="spec-value">{selectedRequest.contact_number || 'N/A'}</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Address:</span>
                                            <span className="spec-value">{selectedRequest.address || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Jewelry Specifications</h3>
                                    <div className="specs-grid">
                                        <div className="spec-item">
                                            <span className="spec-label">Type:</span>
                                            <span className="spec-value">{selectedRequest.jewelry_type}</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Metal:</span>
                                            <span className="spec-value">{selectedRequest.metal_type}</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Weight:</span>
                                            <span className="spec-value">{selectedRequest.weight}g</span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">Budget:</span>
                                            <span className="spec-value">{formatPrice(selectedRequest.budget)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Design Description</h3>
                                    <div className="design-description">
                                        {selectedRequest.design_description}
                                    </div>
                                </div>

                                {selectedRequest.special_requirements && (
                                    <div className="detail-section">
                                        <h3>Special Requirements</h3>
                                        <div className="design-description">
                                            {selectedRequest.special_requirements}
                                        </div>
                                    </div>
                                )}

                                {(() => {
                                    try {
                                        const referenceImages = selectedRequest.reference_images 
                                            ? (typeof selectedRequest.reference_images === 'string' 
                                                ? JSON.parse(selectedRequest.reference_images) 
                                                : selectedRequest.reference_images)
                                            : null;
                                        
                                        if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
                                            return (
                                                <div className="detail-section">
                                                    <h3>Reference Images</h3>
                                                    <div className="reference-images">
                                                        {referenceImages.map((image, index) => (
                                                            <img
                                                                key={index}
                                                                src={`${import.meta.env.VITE_API_URL}${image.url || image}`}
                                                                alt={`Reference ${index + 1}`}
                                                                className="reference-image"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    console.error('Failed to load image:', image.url || image);
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    } catch (error) {
                                        console.error('Error parsing reference images:', error);
                                        return null;
                                    }
                                })()}

                                <div className="detail-section">
                                    <h3>Status Management</h3>
                                    <div className="status-update-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Update Status:</label>
                                                <select
                                                    value={formData.status}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                                    className="status-select"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Estimated Price (₹):</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter estimated price"
                                                    value={formData.estimatedPrice}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                                                    className="price-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Estimated Delivery Date:</label>
                                                <input
                                                    type="date"
                                                    value={formData.estimatedDelivery}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                                                    className="date-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Admin Notes:</label>
                                            <textarea
                                                placeholder="Add notes for the customer..."
                                                value={formData.adminNotes}
                                                onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                                                className="notes-textarea"
                                                rows="3"
                                            ></textarea>
                                        </div>
                                        <button
                                            className="btn-update-status"
                                            onClick={() => {
                                                handleStatusUpdate(
                                                    selectedRequest.id, 
                                                    formData.status, 
                                                    formData.adminNotes, 
                                                    formData.estimatedPrice, 
                                                    formData.estimatedDelivery
                                                );
                                            }}
                                            disabled={updatingStatus}
                                        >
                                            {updatingStatus ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save"></i>
                                                    Update Status
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && requestToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Confirm Delete</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete custom jewelry request #{requestToDelete.id}?</p>
                            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '20px' }}>
                            <button
                                className="btn-filter"
                                onClick={() => setShowDeleteModal(false)}
                                style={{ background: '#6c757d' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-delete"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-trash"></i>
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomJewelryManagement; 