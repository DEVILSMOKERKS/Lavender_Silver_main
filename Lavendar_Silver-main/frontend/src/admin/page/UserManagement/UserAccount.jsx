import React, { useState, useEffect, useContext } from 'react';
import { Search, Download, Plus, User, Phone, Mail, Edit, Trash2, TrendingUp, TrendingDown, ArrowUpDown, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import './UserAccount.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNotification } from '../../../context/NotificationContext';
import { AdminContext } from '../../../context/AdminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserAccount = () => {
  const { token } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '' });
  const [editUser, setEditUser] = useState({ id: '', name: '', email: '', phone: '', status: 'Active' });
  const [deleteUser, setDeleteUser] = useState({ id: '', name: '' });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchTerm, status: statusFilter }
      });
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      showNotification('Failed to fetch users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, searchTerm, statusFilter]);

  // Inline status change
  const handleStatusChange = async (userId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/users/${userId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('User status updated!', 'success');
      setOpenDropdown(null);
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update status.', 'error');
    }
  };

  // Toggle dropdown
  const toggleDropdown = (userId) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.adminUserAccountStatusDropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/users/register`, { ...newUser, confirmPassword: newUser.password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('User added successfully!', 'success');
      setAddUserModalOpen(false);
      setNewUser({ name: '', email: '', phone: '', password: '' });
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add user.', 'error');
    }
  };

  // Edit user
  const openEditModal = (user) => {
    setEditUser({ id: user.id, name: user.name, email: user.email, phone: user.phone || '', status: user.status });
    setEditModalOpen(true);
  };
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/users/${editUser.id}`, {
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone,
        status: editUser.status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('User updated successfully!', 'success');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update user.', 'error');
    }
  };

  // Delete user
  const openDeleteModal = (user) => {
    setDeleteUser({ id: user.id, name: user.name });
    setDeleteModalOpen(true);
  };
  const handleDeleteUser = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${deleteUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('User deleted successfully!', 'success');
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  // Export data
  const handleExport = () => {
    const dataToExport = users.map(user => ({
      'Name': user.name,
      'Email': user.email,
      'Phone': user.phone,
      'Status': user.status,
      'Created At': user.created_at,
      'Updated At': user.updated_at
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'Users.xlsx');
  };

  // Stats
  const stats = [
    { title: 'Total Users', value: users.length, icon: User, color: 'blue' },
    { title: 'Active Users', value: users.filter(u => u.status === 'Active').length, icon: TrendingUp, color: 'green' },
    { title: 'Inactive Users', value: users.filter(u => u.status === 'Inactive').length, icon: TrendingDown, color: 'purple' },
    { title: 'Blocked Users', value: users.filter(u => u.status === 'Blocked').length, icon: User, color: 'orange' }
  ];

  // Status options
  const statusOptions = ['Active', 'Inactive', 'Blocked'];

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0;

    let aValue, bValue;

    switch (sortField) {
      case 'name':
        aValue = (a.name || '').toLowerCase();
        bValue = (b.name || '').toLowerCase();
        break;
      case 'email':
        aValue = (a.email || '').toLowerCase();
        bValue = (b.email || '').toLowerCase();
        break;
      case 'phone':
        aValue = (a.phone || '').toLowerCase();
        bValue = (b.phone || '').toLowerCase();
        break;
      case 'lastLogin':
        aValue = a.lastLogin || a.updated_at || '';
        bValue = b.lastLogin || b.updated_at || '';
        break;
      case 'status':
        aValue = (a.status || '').toLowerCase();
        bValue = (b.status || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={16} style={{ marginRight: 6 }} />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={16} style={{ marginRight: 6 }} />
      : <ArrowDown size={16} style={{ marginRight: 6 }} />;
  };

  return (
    <div className="adminUserAccountContainer">
      {/* Header */}
      <div className="adminUserAccountHeader">
        <h1 className="adminUserAccountTitle">USER ACCOUNT</h1>
        <div className="adminUserAccountControls">
          <div className="adminUserAccountSearchContainer">
            <div className="adminUserAccountSearchBox">
              <Search className="adminUserAccountSearchIcon" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, phone or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="adminUserAccountSearchInput"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adminUserAccountSelect"
            >
              <option>All Status</option>
              {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="adminUserAccountActions">
            <button className="adminUserAccountExportBtn" onClick={handleExport}>
              <Download size={16} />
              Export data
            </button>
            <button className="adminUserAccountAddBtn" onClick={() => setAddUserModalOpen(true)}>
              <Plus size={16} />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="adminUserAccountStats">
        {stats.map((stat, index) => (
          <div key={index} className={`adminUserAccountStatCard adminUserAccountStatCard${stat.color}`}>
            <div className="adminUserAccountStatHeader">
              <div className="adminUserAccountStatInfo">
                <h3 className="adminUserAccountStatTitle">{stat.title}</h3>
                <p className="adminUserAccountStatValue">{stat.value}</p>
              </div>
              <div className={`adminUserAccountStatIcon adminUserAccountStatIcon${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Directory */}
      <div className="adminUserAccountDirectory">
        <div className="adminUserAccountDirectoryHeader">
          <h2 className="adminUserAccountDirectoryTitle">USER DIRECTORY</h2>
          <p className="adminUserAccountDirectorySubtitle">Complete list of registered user with account details</p>
        </div>

        <div className="adminUserAccountTable">
          <div className="adminUserAccountTableHeader">
            <div 
              className="adminUserAccountTableHeaderCell" 
              onClick={() => handleSort('name')}
              style={{ cursor: 'pointer' }}
            >
              {getSortIcon('name')}
              USER
            </div>
            <div 
              className="adminUserAccountTableHeaderCell"
              onClick={() => handleSort('email')}
              style={{ cursor: 'pointer' }}
            >
              {getSortIcon('email')}
              CONTACT
            </div>
            <div 
              className="adminUserAccountTableHeaderCell"
              onClick={() => handleSort('lastLogin')}
              style={{ cursor: 'pointer' }}
            >
              {getSortIcon('lastLogin')}
              LAST LOGIN
            </div>
            <div 
              className="adminUserAccountTableHeaderCell"
              onClick={() => handleSort('status')}
              style={{ cursor: 'pointer' }}
            >
              {getSortIcon('status')}
              STATUS
            </div>
            <div className="adminUserAccountTableHeaderCell">
              ACTIONS
            </div>
          </div>

          <div className="adminUserAccountTableBody">
            {sortedUsers.map((user) => (
              <div key={user.id} className="adminUserAccountTableRow">
                <div className="adminUserAccountTableCell">
                  <div className="adminUserAccountUserInfo">
                    <div className="adminUserAccountUserDetails">
                      <div className="adminUserAccountUserName">{user.name}</div>
                    </div>
                  </div>
                </div>

                <div className="adminUserAccountTableCell">
                  <div className="adminUserAccountContact">
                    <div className="adminUserAccountEmail">
                      <Mail size={14} />
                      {user.email}
                    </div>
                    <div className="adminUserAccountPhone">
                      <Phone size={14} />
                      {user.phone}
                    </div>
                  </div>
                </div>

                <div className="adminUserAccountTableCell">
                  <span className="adminUserAccountLastLogin">{user.lastLogin || user.updated_at?.split('T')[0]}</span>
                </div>

                <div className="adminUserAccountTableCell">
                  <div className="adminUserAccountStatusDropdown">
                    <button 
                      className={`adminUserAccountStatusBadge adminUserAccountStatusBadge${user.status.toLowerCase()}`}
                      onClick={() => toggleDropdown(user.id)}
                    >
                      {user.status}
                      <ChevronDown size={12} className="adminUserAccountStatusBadgeIcon" />
                    </button>
                    
                    {openDropdown === user.id && (
                      <div className="adminUserAccountStatusDropdownMenu">
                        {statusOptions.map((status) => (
                          <button
                            key={status}
                            className={`adminUserAccountStatusDropdownItem ${user.status === status ? 'adminUserAccountStatusDropdownItemActive' : ''}`}
                            onClick={() => handleStatusChange(user.id, status)}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="adminUserAccountTableCell">
                  <div className="adminUserAccountTableActions">
                    <button className="adminUserAccountActionBtn adminUserAccountActionBtnEdit" onClick={() => openEditModal(user)}>
                      <Edit size={16} />
                    </button>
                    <button className="adminUserAccountActionBtn adminUserAccountActionBtnDelete" onClick={() => openDeleteModal(user)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addUserModalOpen && (
        <div className="adminUserAccountModalOverlay">
          <div className="adminUserAccountModal">
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <label>Name</label>
              <input type="text" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required />
              <label>Email</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required />
              <label>Phone</label>
              <input type="text" value={newUser.phone} onChange={e => setNewUser(u => ({ ...u, phone: e.target.value }))} />
              <label>Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required />
              <div className="adminUserAccountModalActions">
                <button type="submit">Add User</button>
                <button type="button" onClick={() => setAddUserModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && (
        <div className="adminUserAccountModalOverlay">
          <div className="adminUserAccountModal">
            <h2>Edit User</h2>
            <form onSubmit={handleEditUser}>
              <label>Name</label>
              <input type="text" value={editUser.name} onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))} required />
              <label>Email</label>
              <input type="email" value={editUser.email} onChange={e => setEditUser(u => ({ ...u, email: e.target.value }))} required />
              <label>Phone</label>
              <input type="text" value={editUser.phone} onChange={e => setEditUser(u => ({ ...u, phone: e.target.value }))} />
              <label>Status</label>
              <select value={editUser.status} onChange={e => setEditUser(u => ({ ...u, status: e.target.value }))}>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="adminUserAccountModalActions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModalOpen && (
        <div className="adminUserAccountModalOverlay">
          <div className="adminUserAccountModal">
            <h2>Delete User</h2>
            <p>Are you sure you want to delete user <b>{deleteUser.name}</b>?</p>
            <div className="adminUserAccountModalActions">
              <button onClick={handleDeleteUser}>Delete</button>
              <button onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccount;