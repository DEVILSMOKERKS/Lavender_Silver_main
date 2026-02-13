import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Filter, RefreshCw, Save, X, Loader2 } from 'lucide-react';
import { useNotification } from '../../../../context/NotificationContext';
import { AdminContext } from '../../../../context/AdminContext';
import './GemstoneCatalog.css';

const GemstoneCatalog = () => {
    const { showNotification } = useNotification();
    const { admin, token: adminToken } = useContext(AdminContext);
    const [gemstones, setGemstones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [gemstoneToDelete, setGemstoneToDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'diamond'
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchGemstones();
    }, []);

    const fetchGemstones = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/gemstone-catalog`);
            if (response.data.success) {
                setGemstones(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching gemstones:', error);
            showNotification('Error fetching gemstones', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'diamond'
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification('Name is required', 'error');
            return;
        }

        try {
            if (editingId) {
                // Update existing gemstone
                await axios.put(`${API_BASE_URL}/api/gemstone-catalog/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                showNotification('Gemstone updated successfully', 'success');
            } else {
                // Create new gemstone
                await axios.post(`${API_BASE_URL}/api/gemstone-catalog`, formData, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                showNotification('Gemstone created successfully', 'success');
            }

            setShowModal(false);
            resetForm();
            fetchGemstones();
        } catch (error) {
            console.error('Error saving gemstone:', error);
            const message = error.response?.data?.message || 'Error saving gemstone';
            showNotification(message, 'error');
        }
    };

    const handleEdit = (gemstone) => {
        setFormData({
            name: gemstone.name,
            type: gemstone.type
        });
        setEditingId(gemstone.id);
        setShowModal(true);
    };

    const openDeleteModal = (gemstone) => {
        setGemstoneToDelete(gemstone);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setGemstoneToDelete(null);
        setShowDeleteModal(false);
    };

    const confirmDelete = async () => {
        if (!gemstoneToDelete) return;
        setLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/api/gemstone-catalog/${gemstoneToDelete.id}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            showNotification('Gemstone deleted successfully', 'success');
            fetchGemstones();
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting gemstone:', error);
            showNotification('Error deleting gemstone', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredGemstones = gemstones.filter(gemstone => {
        const matchesSearch = gemstone.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || gemstone.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="admin-gemstone-catalog-container">
            <div className="admin-gemstone-catalog-header">
                <h1>Gemstone Catalog</h1>
                <button
                    className="admin-add-gemstone-btn"
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <Plus size={20} />
                    Add Gemstone
                </button>
            </div>

            <div className="admin-search-filter-section">
                <div className="admin-search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search gemstones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="admin-filter-box">
                    <Filter size={20} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="diamond">Diamonds</option>
                        <option value="stone">Stones</option>
                    </select>
                </div>

                <button
                    className="admin-refresh-btn"
                    onClick={fetchGemstones}
                    disabled={loading}
                >
                    <RefreshCw size={20} className={loading ? 'admin-spinning' : ''} />
                    Refresh
                </button>
            </div>

            <div className="admin-admin-gemstone-table-container">
                <table className="admin-gemstone-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="admin-admin-loading-cell">
                                    <div className="admin-loading">Loading gemstones...</div>
                                </td>
                            </tr>
                        ) : filteredGemstones.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="admin-admin-no-data-cell">
                                    <div className="admin-no-data">
                                        {searchTerm || filterType !== 'all'
                                            ? 'No gemstones found matching your criteria'
                                            : 'No gemstones available. Add your first gemstone!'}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredGemstones.map((gemstone) => (
                                <tr key={gemstone.id} className="admin-gemstone-row">
                                    <td className="admin-id-cell">{gemstone.id}</td>
                                    <td className="admin-name-cell">
                                        <div className="admin-name-content">
                                            <span className="admin-gemstone-name">{gemstone.name}</span>
                                        </div>
                                    </td>
                                    <td className="admin-type-cell">
                                        <span className={`admin-gemstone-type ${gemstone.type}`}>
                                            {gemstone.type}
                                        </span>
                                    </td>
                                    <td className="admin-created-cell">
                                        <span className="admin-created-date">
                                            {formatDate(gemstone.created_at)}
                                        </span>
                                    </td>
                                    <td className="admin-updated-cell">
                                        <span className="admin-updated-date">
                                            {gemstone.updated_at ? formatDate(gemstone.updated_at) : '-'}
                                        </span>
                                    </td>
                                    <td className="admin-actions-cell">
                                        <div className="admin-gemstone-actions">
                                            <button
                                                className="admin-edit-btn"
                                                onClick={() => handleEdit(gemstone)}
                                                title="Edit gemstone"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="admin-delete-btn"
                                                onClick={() => openDeleteModal(gemstone)}
                                                title="Delete gemstone"
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

            {/* Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editingId ? 'Edit Gemstone' : 'Add New Gemstone'}</h2>
                            <button
                                className="admin-close-btn"
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="admin-gemstone-form">
                            <div className="admin-form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter gemstone name"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="type">Type *</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="diamond">Diamond</option>
                                    <option value="stone">Stone</option>
                                </select>
                            </div>

                            <div className="admin-form-actions">
                                <button
                                    type="button"
                                    className="admin-cancel-btn"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="admin-save-btn">
                                    <Save size={16} />
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && gemstoneToDelete && (
                <div className="admin-gemstone-delete-modal-overlay" onClick={closeDeleteModal}>
                    <div className="admin-gemstone-delete-modal admin-gemstone-delete-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="admin-gemstone-delete-modal-close" onClick={closeDeleteModal}>
                            <X size={20} />
                        </button>
                        <div className="admin-gemstone-delete-icon-unique">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </div>
                        <h2 className="admin-gemstone-delete-modal-title admin-gemstone-delete-title">Delete Gemstone</h2>
                        <div className="admin-gemstone-delete-warning">This action cannot be undone.</div>
                        <p style={{ textAlign: 'center', margin: '12px 0 24px 0', color: '#444', fontWeight: 500 }}>
                            Are you sure you want to delete <b>{gemstoneToDelete.name}</b>?
                        </p>
                        <div className="admin-gemstone-delete-modal-actions">
                            <button className="admin-gemstone-delete-cancel-btn" onClick={closeDeleteModal} disabled={loading}>
                                Cancel
                            </button>
                            <button className="admin-gemstone-delete-save-btn" style={{ background: '#dc2626' }} onClick={confirmDelete} disabled={loading}>
                                {loading ? <Loader2 className="admin-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GemstoneCatalog;
