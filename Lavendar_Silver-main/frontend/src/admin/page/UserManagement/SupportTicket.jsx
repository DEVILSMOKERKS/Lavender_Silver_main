import React, { useState, useEffect, useContext } from 'react';
import { Search, Download, AlertCircle, Clock, CheckCircle, MessageCircle, ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react';
import './SupportTicket.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { AdminContext } from '../../../context/AdminContext';
import { useNotification } from '../../../context/NotificationContext';
import personImage from '../../../assets/img/person.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SupportTicket = () => {
  const { token: adminToken } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Type');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTicket, setChatTicket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // States for modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [viewTicketDetails, setViewTicketDetails] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editForm, setEditForm] = useState({
    priority: 'Low',
    status: 'Open',
  });
  const [editAdminMessage, setEditAdminMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/support/admin/tickets`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.data.success) setTickets(res.data.data);
    } catch (err) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (adminToken) fetchTickets(); }, [adminToken]);

  // Open chat modal for a ticket
  const handleOpenChat = async (ticket) => {
    setChatTicket(ticket);
    setChatOpen(true);
    setChatLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/support/admin/tickets/${ticket.ticket_id}/messages`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.data.success) setChatMessages(res.data.data);
    } catch (err) {
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  // Send admin reply
  const handleSendReply = async () => {
    if (!chatInput.trim() || !chatTicket) return;
    
    // Validate ticket_id exists
    if (!chatTicket.ticket_id) {
      showNotification('Invalid ticket. Please refresh and try again.', 'error');
      return;
    }
    
    setReplyLoading(true);
    try {
      // Use the REPLY endpoint, not create endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/support/admin/tickets/${chatTicket.ticket_id}/reply`,
        {
          message: chatInput
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      if (response.data.success) {
        setChatInput('');
        showNotification('Reply sent successfully!', 'success');
        
        // Refresh messages to show the new reply
        const res = await axios.get(`${API_BASE_URL}/api/support/admin/tickets/${chatTicket.ticket_id}/messages`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.data.success) {
          setChatMessages(res.data.data);
          // Also refresh ticket list to update last message timestamp
          fetchTickets();
        }
      } else {
        showNotification(response.data.message || 'Failed to send reply.', 'error');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send reply. Please try again.';
      showNotification(errorMessage, 'error');
      
      // If it's a 404, the ticket might not exist
      if (err.response?.status === 404) {
        showNotification('Ticket not found. Please refresh the ticket list.', 'error');
      }
    } finally {
      setReplyLoading(false);
    }
  };

  // View ticket details
  const handleViewTicket = async (ticket) => {
    setViewModalOpen(true);
    setViewModalLoading(true);
    try {
      // Find the original ticket data from the tickets array
      const originalTicket = tickets.find(t => t.ticket_id === ticket.id);
      if (originalTicket) {
        // Fetch messages for this ticket
        const messagesRes = await axios.get(`${API_BASE_URL}/api/support/admin/tickets/${ticket.id}/messages`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Map the ticket data to match the view modal structure
        const ticketDetails = {
          ticket_id: originalTicket.ticket_id,
          subject: originalTicket.subject,
          tag: originalTicket.tag,
          priority: originalTicket.priority,
          status: originalTicket.status,
          ticket_created_at: originalTicket.created_at,
          name: originalTicket.user_name,
          email: originalTicket.user_email,
          phone: originalTicket.user_phone || null,
          dob: originalTicket.user_dob || null,
          address: originalTicket.user_address || null
        };

        setViewTicketDetails({
          details: ticketDetails,
          messages: messagesRes.data.success ? messagesRes.data.data : []
        });
      }
    } catch (err) {
      showNotification('Failed to load ticket details.', 'error');
      setViewTicketDetails(null);
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredTickets.map(ticket => ({
      'Ticket ID': ticket.id,
      'Subject': ticket.subject,
      'Tag': ticket.tag,
      'Customer Name': ticket.customer.name,
      'Customer Email': ticket.customer.email,
      'Created Date': ticket.created,
      'Created Time': ticket.time,
      'Assigned To': ticket.assignedTo,
      'Priority': ticket.priority,
      'Status': ticket.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SupportTickets");
    XLSX.writeFile(wb, "Support_Tickets.xlsx");
  };

  // Map backend ticket data to UI columns
  const mappedTickets = tickets.map(ticket => {
    // Icon logic based on tag/priority/status
    let icon = AlertCircle, iconClass = 'red';
    if (ticket.status === 'In progress') { icon = Clock; iconClass = 'yellow'; }
    if (ticket.status === 'Closed') { icon = CheckCircle; iconClass = 'gray'; }
    if (ticket.status === 'Resolved') { icon = CheckCircle; iconClass = 'green'; }
    let priorityClass = (ticket.priority || '').toLowerCase();
    let statusClass = (ticket.status || '').replace(/\s/g, '').toLowerCase();
    return {
      id: ticket.ticket_id,
      subject: ticket.subject,
      tag: ticket.tag,
      icon,
      iconClass,
      customer: {
        name: ticket.user_name,
        email: ticket.user_email,
        avatar: ticket.user_photo ? (ticket.user_photo.startsWith('http') ? ticket.user_photo : `${API_BASE_URL}${ticket.user_photo}`) : personImage,
      },
      created: ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '',
      time: ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      assignedTo: ticket.assigned_to,
      priority: ticket.priority,
      priorityClass,
      status: ticket.status,
      statusClass,
    };
  });

  // Filtering (optional: can be made dynamic)
  const [priorityFilter, setPriorityFilter] = useState('All');
  const filteredTickets = mappedTickets.filter(ticket => {
    const matchesSearch =
      ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Stats (can be made dynamic if backend provides)
  const inProgressCount = tickets.filter(t => t.status === 'In progress').length;
  const resolveTodayCount = tickets.filter(t => {
    if (!t.updated_at) return false;
    const updated = new Date(t.updated_at);
    const today = new Date();
    return updated.getDate() === today.getDate() && updated.getMonth() === today.getMonth() && updated.getFullYear() === today.getFullYear() && t.status === 'Resolved';
  }).length;
  const stats = [
    {
      title: 'Open Ticket',
      value: tickets.length.toString(),
      status: 'Needs Attention',
      statusClass: 'danger',
      icon: AlertCircle,
      iconClass: 'red',
    },
    {
      title: 'In Progress',
      value: inProgressCount.toString(),
      status: 'Being resolved',
      statusClass: 'purple',
      icon: Clock,
      iconClass: 'purple',
    },
    {
      title: 'Resolve Today',
      value: resolveTodayCount.toString(),
      status: 'Great progress',
      statusClass: 'success',
      icon: CheckCircle,
      iconClass: 'green',
    },
    {
      title: 'Avg. Responsive Time',
      value: '2.4h',
      status: 'Within SLA',
      statusClass: 'info',
      icon: MessageCircle,
      iconClass: 'blue',
    },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'adminSupportTicketStatusActive';
      case 'inactive': return 'adminSupportTicketStatusInactive';
      case 'blocked': return 'adminSupportTicketStatusBlocked';
      default: return 'adminSupportTicketStatusDefault';
    }
  };

  const getAccountTypeBadge = (type) => {
    return type === 'Premium' ? 'adminSupportTicketTypePremium' : 'adminSupportTicketTypeRegular';
  };

  return (
    <div className="adminSupportTicketContainer">
      {/* Header */}
      <div className="adminSupportTicketHeader">
        <h1 className="adminSupportTicketTitle">USER ACCOUNT</h1>

        <div className="adminSupportTicketControls">
          <div className="adminSupportTicketSearchContainer">
            <div className="adminSupportTicketSearchBox">
              <Search className="adminSupportTicketSearchIcon" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, phone or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="adminSupportTicketSearchInput"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adminSupportTicketSelect"
            >
              <option>All Status</option>
              <option>Open</option>
              <option>In progress</option>
              <option>Closed</option>
              <option>Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="adminSupportTicketSelect"
            >
              <option>All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="adminSupportTicketActions">
            <button className="adminSupportTicketExportBtn" onClick={handleExport}>
              <Download size={16} />
              Export data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="adminSupportTicketStats">
        {stats.map((stat, index) => (
          <div key={index} className={`adminSupportTicketStatCard adminSupportTicketStatCard${stat.iconClass}`}>
            <div className="adminSupportTicketStatHeader">
              <div className="adminSupportTicketStatInfo">
                <h3 className="adminSupportTicketStatTitle">{stat.title}</h3>
                <p className="adminSupportTicketStatValue">{stat.value}</p>
              </div>
              <div className={`adminSupportTicketStatIcon adminSupportTicketStatIcon${stat.iconClass}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className={`adminSupportTicketStatChange adminSupportTicketStatChange${stat.statusClass}`}>
              <span>{stat.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User Directory */}
      <div className="adminSupportTicketDirectory">
        <div className="adminSupportTicketDirectoryHeader">
          <h2 className="adminSupportTicketDirectoryTitle">SUPPORT TICKETS</h2>
        </div>
        <div className="adminSupportTicketTable">
          <div className="adminSupportTicketTableHeader">
            <div className="adminSupportTicketTableHeaderCell"><ArrowUpDown size={16} style={{ marginRight: 6 }} />TICKET</div>
            <div className="adminSupportTicketTableHeaderCell"><ArrowUpDown size={16} style={{ marginRight: 6 }} />CUSTOMER</div>
            <div className="adminSupportTicketTableHeaderCell"><ArrowUpDown size={16} style={{ marginRight: 6 }} />CREATED</div>
            <div className="adminSupportTicketTableHeaderCell"><ArrowUpDown size={16} style={{ marginRight: 6 }} />ASSIGNED TO</div>
            <div className="adminSupportTicketTableHeaderCell"><ArrowUpDown size={16} style={{ marginRight: 6 }} />PRIORITY</div>
            <div className="adminSupportTicketTableHeaderCell"><ArrowUpDown size={16} style={{ marginRight: 6 }} />STATUS</div>
            <div className="adminSupportTicketTableHeaderCell">ACTIONS</div>
          </div>
          <div className="adminSupportTicketTableBody">
            {filteredTickets.map((ticket, idx) => (
              <div
                key={idx}
                className="adminSupportTicketTableRow"
                onClick={() => handleViewTicket(ticket)}
                style={{ cursor: 'pointer' }}
              >
                <div className="adminSupportTicketTableCell">
                  <div className="adminSupportTicketTicketInfo">
                    <span className={`adminSupportTicketTicketIcon adminSupportTicketTicketIcon${ticket.iconClass}`}><ticket.icon size={18} /></span>
                    <div>
                      <div className="adminSupportTicketTicketId">{ticket.id}</div>
                      <div className="adminSupportTicketTicketSubject">{ticket.subject}</div>
                      <span className="adminSupportTicketTicketTag">{ticket.tag}</span>
                    </div>
                  </div>
                </div>
                <div className="adminSupportTicketTableCell">
                  <div className="adminSupportTicketCustomerInfo">
                    <img src={ticket.customer.avatar} alt={ticket.customer.name} className="adminSupportTicketCustomerAvatar" loading="lazy" decoding="async" />
                    <div>
                      <div className="adminSupportTicketCustomerName">{ticket.customer.name}</div>
                      <div className="adminSupportTicketCustomerEmail">{ticket.customer.email}</div>
                    </div>

                  </div>
                </div>
                <div className="adminSupportTicketTableCell">
                  <div className="adminSupportTicketCreated">{ticket.created}<br />{ticket.time}</div>
                </div>
                <div className="adminSupportTicketTableCell">
                  <div className="adminSupportTicketAssignedTo">{ticket.assignedTo}</div>
                </div>
                <div className="adminSupportTicketTableCell">
                  <span className={`adminSupportTicketPriority adminSupportTicketPriority${ticket.priorityClass}`}>{ticket.priority}</span>
                </div>
                <div className="adminSupportTicketTableCell">
                  <span className={`adminSupportTicketStatusBadge adminSupportTicketStatus${ticket.statusClass}`}>{ticket.status}</span>
                </div>
                <div className="adminSupportTicketTableCell">
                  <div className="adminSupportTicketTableActions" onClick={(e) => e.stopPropagation()}>
                    <button className="adminSupportTicketActionBtn adminSupportTicketActionBtnView" onClick={() => handleViewTicket(ticket)} title="View Details"><Eye size={16} /></button>
                    <button className="adminSupportTicketActionBtn adminSupportTicketActionBtnEdit" onClick={() => { setSelectedTicket(ticket); setEditForm({ priority: ticket.priority, status: ticket.status }); setEditModalOpen(true); }} title="Edit"><Edit size={16} /></button>
                    <button className="adminSupportTicketActionBtn adminSupportTicketActionBtnDelete" onClick={() => { setSelectedTicket(ticket); setDeleteModalOpen(true); }} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Chat Modal */}
      {chatOpen && chatTicket && (
        <div className="adminSupportTicketModalOverlay">
          <div className="adminSupportTicketModal adminSupportTicketChatModal" style={{ maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
              <h2>Ticket: {chatTicket.ticket_id}</h2>
              <button type="button" onClick={() => { setChatOpen(false); setChatTicket(null); setChatMessages([]); setChatInput(''); }} className="adminSupportTicketModalClose">×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
              {chatLoading ? (
                <p>Loading messages...</p>
              ) : chatMessages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>No messages yet</p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={msg.id || idx} style={{ 
                    marginBottom: '15px', 
                    padding: '12px', 
                    background: msg.sender === 'admin' ? '#e3f2fd' : '#fff', 
                    borderRadius: '8px',
                    marginLeft: msg.sender === 'admin' ? '20%' : '0',
                    marginRight: msg.sender === 'user' ? '20%' : '0'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: msg.sender === 'admin' ? '#1976d2' : '#333' }}>
                      {msg.sender === 'admin' ? 'Admin' : 'User'}
                    </div>
                    <div style={{ marginBottom: '5px' }}>{msg.message}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(msg.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !replyLoading && handleSendReply()}
                placeholder="Type your reply..."
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                disabled={replyLoading}
              />
              <button
                onClick={handleSendReply}
                disabled={replyLoading || !chatInput.trim()}
                style={{ padding: '10px 20px', background: '#16784f', color: 'white', border: 'none', borderRadius: '4px', cursor: replyLoading || !chatInput.trim() ? 'not-allowed' : 'pointer', opacity: replyLoading || !chatInput.trim() ? 0.6 : 1 }}
              >
                {replyLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {viewModalOpen && (
        <div className="adminSupportTicketModalOverlay">
          <div className="adminSupportTicketModal adminSupportTicketViewModal">
            <h2>Ticket Details</h2>
            {viewModalLoading && <p>Loading...</p>}
            {viewTicketDetails && (
              <>
                <div className="adminSupportTicketViewGrid">
                  <div className="adminSupportTicketViewSection">
                    <h3>User Information</h3>
                    <p><strong>Name:</strong> {viewTicketDetails.details.name}</p>
                    <p><strong>Email:</strong> {viewTicketDetails.details.email}</p>
                    <p><strong>Phone:</strong> {viewTicketDetails.details.phone || 'N/A'}</p>
                    <p><strong>DOB:</strong> {viewTicketDetails.details.dob ? new Date(viewTicketDetails.details.dob).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Address:</strong> {viewTicketDetails.details.address ? JSON.stringify(viewTicketDetails.details.address) : 'N/A'}</p>
                  </div>
                  <div className="adminSupportTicketViewSection">
                    <h3>Ticket Information</h3>
                    <p><strong>ID:</strong> {viewTicketDetails.details.ticket_id}</p>
                    <p><strong>Subject:</strong> {viewTicketDetails.details.subject}</p>
                    <p><strong>Tag:</strong> {viewTicketDetails.details.tag}</p>
                    <p><strong>Priority:</strong> {viewTicketDetails.details.priority}</p>
                    <p><strong>Status:</strong> {viewTicketDetails.details.status}</p>
                    <p><strong>Created:</strong> {new Date(viewTicketDetails.details.ticket_created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="adminSupportTicketViewMessages">
                  <h3>Message History</h3>
                  {viewTicketDetails.messages.map(msg => (
                    <div key={msg.id} className={`adminSupportTicketViewMessage adminSupportTicketViewMessage${msg.sender}`}>
                      <p className="adminSupportTicketViewMessageSender">{msg.sender}</p>
                      <p>{msg.message}</p>
                      <p className="adminSupportTicketViewMessageTime">{new Date(msg.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                
                {/* Reply Section in View Modal */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                  <h3>Reply to Ticket</h3>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                    style={{ width: '100%', padding: '10px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'inherit' }}
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={async () => {
                        if (!chatInput.trim() || !viewTicketDetails?.details?.ticket_id) return;
                        setReplyLoading(true);
                        try {
                          await axios.post(`${API_BASE_URL}/api/support/admin/tickets/${viewTicketDetails.details.ticket_id}/reply`, {
                            message: chatInput
                          }, {
                            headers: { Authorization: `Bearer ${adminToken}` }
                          });
                          setChatInput('');
                          showNotification('Reply sent successfully!', 'success');
                          // Refresh messages
                          const messagesRes = await axios.get(`${API_BASE_URL}/api/support/admin/tickets/${viewTicketDetails.details.ticket_id}/messages`, {
                            headers: { Authorization: `Bearer ${adminToken}` }
                          });
                          if (messagesRes.data.success) {
                            setViewTicketDetails({
                              ...viewTicketDetails,
                              messages: messagesRes.data.data
                            });
                          }
                        } catch (err) {
                          showNotification(err.response?.data?.message || 'Failed to send reply.', 'error');
                        }
                        setReplyLoading(false);
                      }}
                      disabled={replyLoading || !chatInput.trim()}
                      style={{ padding: '10px 20px', background: '#16784f', color: 'white', border: 'none', borderRadius: '4px', cursor: replyLoading || !chatInput.trim() ? 'not-allowed' : 'pointer', opacity: replyLoading || !chatInput.trim() ? 0.6 : 1 }}
                    >
                      {replyLoading ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="adminSupportTicketModalActions">
              <button type="button" onClick={() => { setViewModalOpen(false); setChatInput(''); }} className="adminSupportTicketModalClose">Close</button>
            </div>
          </div>
        </div>
      )}
      {editModalOpen && selectedTicket && (
        <div className="adminSupportTicketModalOverlay">
          <div className="adminSupportTicketModal">
            <h2>Edit Ticket</h2>
            <label>Priority
              <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>Status
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                <option>Open</option>
                <option>In progress</option>
                <option>Closed</option>
                <option>Resolved</option>
              </select>
            </label>
            <label>Assigned To
              <input value="pvj" disabled />
            </label>
            <label>Send Message to User (optional)
              <textarea value={editAdminMessage} onChange={e => setEditAdminMessage(e.target.value)} rows={3} style={{ width: '100%', marginTop: 4 }} placeholder="Type a message to send to the user..." />
            </label>
            <div className="adminSupportTicketModalActions">
              <button type="button" onClick={async () => {
                setEditLoading(true);
                try {
                  // Update ticket fields
                  await axios.put(`${API_BASE_URL}/api/support/admin/tickets/${selectedTicket.id}`,
                    { priority: editForm.priority, status: editForm.status, assigned_to: 'pvj' },
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                  );
                  // Send message if provided
                  if (editAdminMessage.trim()) {
                    await axios.post(`${API_BASE_URL}/api/support/admin/tickets/${selectedTicket.id}/reply`,
                      { message: editAdminMessage, priority: editForm.priority, status: editForm.status, assigned_to: 'pvj' },
                      { headers: { Authorization: `Bearer ${adminToken}` } }
                    );
                  }
                  setEditModalOpen(false);
                  setEditAdminMessage('');
                  fetchTickets();
                  showNotification('Ticket updated successfully!', 'success');
                } catch (err) {
                  showNotification(err.response?.data?.message || 'Failed to update ticket.', 'error');
                }
                setEditLoading(false);
              }} disabled={editLoading}> {editLoading ? 'Saving...' : 'Save'} </button>
              <button type="button" onClick={() => { setEditModalOpen(false); setEditAdminMessage(''); }} className="adminSupportTicketModalClose">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {deleteModalOpen && selectedTicket && (
        <div className="adminSupportTicketModalOverlay">
          <div className="adminSupportTicketModal">
            <h2>Delete Ticket</h2>
            <p>Are you sure you want to delete ticket <b>{selectedTicket.id}</b>?</p>
            <div className="adminSupportTicketModalActions">
              <button type="button" className="adminSupportTicketModalDelete" onClick={async () => {
                setDeleteLoading(true);
                try {
                  await axios.delete(`${API_BASE_URL}/api/support/admin/tickets/${selectedTicket.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
                  setDeleteModalOpen(false);
                  fetchTickets();
                  showNotification('Ticket deleted successfully!', 'success');
                } catch (err) {
                  showNotification(err.response?.data?.message || 'Failed to delete ticket.', 'error');
                }
                setDeleteLoading(false);
              }} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
              <button type="button" onClick={() => setDeleteModalOpen(false)} className="adminSupportTicketModalClose">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicket;