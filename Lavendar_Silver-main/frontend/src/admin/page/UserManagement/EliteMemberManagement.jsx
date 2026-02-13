import React, { useState, useEffect, useContext } from 'react';
import { Search, Download, Mail, User, Calendar, Crown, Eye, Trash2 } from 'lucide-react';
import './EliteMemberManagement.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const EliteMemberManagement = () => {
    const { token: adminToken } = useContext(AdminContext);
    const { showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch elite members from backend
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/elite-members`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (res.data.success) {
                setMembers(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching elite members:', err);
            showNotification('Failed to load elite members.', 'error');
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminToken) {
            fetchMembers();
        }
    }, [adminToken]);

    // Filter members based on search term and gender
    const filteredMembers = members.filter(member => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = member.email?.toLowerCase().includes(searchLower);
        const matchesGender = genderFilter === 'All' || member.gender === genderFilter;
        return matchesSearch && matchesGender;
    });

    // View member details
    const handleViewMember = (member) => {
        setSelectedMember(member);
        setViewModalOpen(true);
    };

    // Delete member
    const handleDeleteMember = async () => {
        if (!selectedMember) return;

        setDeleteLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/api/elite-members/${selectedMember.id}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            showNotification('Elite member deleted successfully.', 'success');
            setDeleteModalOpen(false);
            setSelectedMember(null);
            fetchMembers();
        } catch (err) {
            console.error('Error deleting elite member:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete elite member.';
            showNotification(errorMessage, 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Export to Excel
    const handleExport = () => {
        const dataToExport = filteredMembers.map(member => ({
            'ID': member.id,
            'Email': member.email,
            'Gender': member.gender || 'N/A',
            'Subscribed Date': member.subscribed_at ? new Date(member.subscribed_at).toLocaleDateString() : '',
            'Subscribed Time': member.subscribed_at ? new Date(member.subscribed_at).toLocaleTimeString() : '',
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Elite Members');
        XLSX.writeFile(wb, `elite-members-${new Date().toISOString().split('T')[0]}.xlsx`);
        showNotification('Elite members exported successfully.', 'success');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('en-IN', { month: 'short' });
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${day} ${month} ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    };

    // Get gender badge class
    const getGenderBadgeClass = (gender) => {
        switch (gender) {
            case 'Male':
                return 'eliteMemberGenderBadgeMale';
            case 'Female':
                return 'eliteMemberGenderBadgeFemale';
            case 'Other':
                return 'eliteMemberGenderBadgeOther';
            default:
                return 'eliteMemberGenderBadgeDefault';
        }
    };

    return (
        <div className="adminEliteMemberManagementContainer">
            <div className="adminEliteMemberManagementHeader">
                <h1 className="adminEliteMemberManagementTitle">Elite Member Management</h1>
                <div className="adminEliteMemberManagementControls">
                    <div className="adminEliteMemberManagementSearchContainer">
                        <div className="adminEliteMemberManagementSearchBox">
                            <Search className="adminEliteMemberManagementSearchIcon" size={20} />
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="adminEliteMemberManagementSearchInput"
                            />
                        </div>
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="adminEliteMemberManagementGenderFilter"
                        >
                            <option value="All">All Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <button
                        onClick={handleExport}
                        className="adminEliteMemberManagementExportBtn"
                        disabled={filteredMembers.length === 0}
                    >
                        <Download size={18} />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="adminEliteMemberManagementStats">
                <div className="adminEliteMemberManagementStatCard">
                    <Crown size={24} className="adminEliteMemberManagementStatIcon" />
                    <div>
                        <div className="adminEliteMemberManagementStatValue">{members.length}</div>
                        <div className="adminEliteMemberManagementStatLabel">Total Members</div>
                    </div>
                </div>
                <div className="adminEliteMemberManagementStatCard">
                    <User size={24} className="adminEliteMemberManagementStatIcon" />
                    <div>
                        <div className="adminEliteMemberManagementStatValue">
                            {members.filter(m => m.gender === 'Male').length}
                        </div>
                        <div className="adminEliteMemberManagementStatLabel">Male</div>
                    </div>
                </div>
                <div className="adminEliteMemberManagementStatCard">
                    <User size={24} className="adminEliteMemberManagementStatIcon" />
                    <div>
                        <div className="adminEliteMemberManagementStatValue">
                            {members.filter(m => m.gender === 'Female').length}
                        </div>
                        <div className="adminEliteMemberManagementStatLabel">Female</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="adminEliteMemberManagementLoading">
                    <p>Loading elite members...</p>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="adminEliteMemberManagementEmpty">
                    <Crown size={48} />
                    <p>{searchTerm || genderFilter !== 'All' ? 'No members found matching your filters.' : 'No elite members yet.'}</p>
                </div>
            ) : (
                <div className="adminEliteMemberManagementTableContainer">
                    <table className="adminEliteMemberManagementTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Gender</th>
                                <th>Subscribed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member) => (
                                <tr key={member.id}>
                                    <td>{member.id}</td>
                                    <td>
                                        <div className="adminEliteMemberManagementEmailCell">
                                            <Mail size={16} />
                                            <a href={`mailto:${member.email}`}>{member.email}</a>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`adminEliteMemberManagementGenderBadge ${getGenderBadgeClass(member.gender)}`}>
                                            {member.gender || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="adminEliteMemberManagementDateCell">
                                            <Calendar size={16} />
                                            <span>{formatDate(member.subscribed_at)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="adminEliteMemberManagementActions">
                                            <button
                                                onClick={() => handleViewMember(member)}
                                                className="adminEliteMemberManagementViewBtn"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="adminEliteMemberManagementDeleteBtn"
                                                title="Delete"
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
            )}

            {/* View Member Modal */}
            {viewModalOpen && selectedMember && (
                <div className="adminEliteMemberManagementModalOverlay" onClick={() => setViewModalOpen(false)}>
                    <div className="adminEliteMemberManagementModalContent" onClick={(e) => e.stopPropagation()}>
                        <div className="adminEliteMemberManagementModalHeader">
                            <h2>Elite Member Details</h2>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="adminEliteMemberManagementModalClose"
                            >
                                ×
                            </button>
                        </div>
                        <div className="adminEliteMemberManagementModalBody">
                            <div className="adminEliteMemberManagementDetailRow">
                                <span className="adminEliteMemberManagementDetailLabel">ID:</span>
                                <span className="adminEliteMemberManagementDetailValue">{selectedMember.id}</span>
                            </div>
                            <div className="adminEliteMemberManagementDetailRow">
                                <span className="adminEliteMemberManagementDetailLabel">EMAIL:</span>
                                <span className="adminEliteMemberManagementDetailValue adminEliteMemberManagementEmailValue">
                                    {selectedMember.email}
                                </span>
                            </div>
                            <div className="adminEliteMemberManagementDetailRow">
                                <span className="adminEliteMemberManagementDetailLabel">GENDER:</span>
                                <span className="adminEliteMemberManagementDetailValue">
                                    <span className={`adminEliteMemberManagementGenderBadge ${getGenderBadgeClass(selectedMember.gender)}`}>
                                        {selectedMember.gender || 'N/A'}
                                    </span>
                                </span>
                            </div>
                            <div className="adminEliteMemberManagementDetailRow">
                                <span className="adminEliteMemberManagementDetailLabel">SUBSCRIBED:</span>
                                <span className="adminEliteMemberManagementDetailValue">
                                    {formatDate(selectedMember.subscribed_at)}
                                </span>
                            </div>
                        </div>
                        <div className="adminEliteMemberManagementModalFooter">
                            <button
                                onClick={() => {
                                    setSelectedMember(selectedMember);
                                    setViewModalOpen(false);
                                    setDeleteModalOpen(true);
                                }}
                                className="adminEliteMemberManagementModalDeleteBtn"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="adminEliteMemberManagementModalCloseBtn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && selectedMember && (
                <div className="adminEliteMemberManagementModalOverlay" onClick={() => setDeleteModalOpen(false)}>
                    <div className="adminEliteMemberManagementDeleteModal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Elite Member</h3>
                        <p>Are you sure you want to remove <strong>{selectedMember.email}</strong> from elite members?</p>
                        <p style={{ fontSize: '14px', color: '#666' }}>This action cannot be undone.</p>
                        <div className="adminEliteMemberManagementDeleteModalActions">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setSelectedMember(null);
                                }}
                                className="adminEliteMemberManagementCancelBtn"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMember}
                                className="adminEliteMemberManagementConfirmDeleteBtn"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EliteMemberManagement;

