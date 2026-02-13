import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Search,
  Download,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  Eye,
  Trash2,
} from "lucide-react";
import "./ContactManagement.css";
import axios from "axios";
import * as XLSX from "xlsx";
import { AdminContext } from "../../../context/AdminContext";
import { useNotification } from "../../../context/NotificationContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ContactManagement = () => {
  const { token: adminToken } = useContext(AdminContext);
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch contacts from backend
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/contact-us`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.data.success) {
        setContacts(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      showNotification("Failed to load contact messages.", "error");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken, showNotification]);

  useEffect(() => {
    if (adminToken) {
      fetchContacts();
    }
  }, [adminToken, fetchContacts]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(searchTerm) ||
      contact.subject?.toLowerCase().includes(searchLower) ||
      contact.message?.toLowerCase().includes(searchLower)
    );
  });

  // View contact details
  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setViewModalOpen(true);
  };

  // Delete contact
  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    setDeleteLoading(true);
    try {
      await axios.delete(
        `${API_BASE_URL}/api/contact-us/${selectedContact.id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      showNotification("Contact message deleted successfully.", "success");
      setDeleteModalOpen(false);
      setSelectedContact(null);
      fetchContacts();
    } catch (err) {
      console.error("Error deleting contact message:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to delete contact message.";
      showNotification(errorMessage, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export to Excel
  const handleExport = () => {
    const dataToExport = filteredContacts.map((contact) => ({
      ID: contact.id,
      Name: contact.name,
      Email: contact.email,
      Phone: contact.phone,
      Subject: contact.subject || "N/A",
      Message: contact.message,
      "Created Date": contact.created_at
        ? new Date(contact.created_at).toLocaleDateString()
        : "",
      "Created Time": contact.created_at
        ? new Date(contact.created_at).toLocaleTimeString()
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contact Messages");
    XLSX.writeFile(
      wb,
      `contact-messages-${new Date().toISOString().split("T")[0]}.xlsx`
    );
    showNotification("Contact messages exported successfully.", "success");
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-IN", { month: "short" });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${day} ${month} ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
  };

  return (
    <div className="adminContactManagementContainer">
      <div className="adminContactManagementHeader">
        <h1 className="adminContactManagementTitle">Contact Management</h1>
        <div className="adminContactManagementControls">
          <div className="adminContactManagementSearchContainer">
            <div className="adminContactManagementSearchBox">
              <Search className="adminContactManagementSearchIcon" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, subject, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="adminContactManagementSearchInput"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            className="adminContactManagementExportBtn"
            disabled={filteredContacts.length === 0}
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="adminContactManagementLoading">
          <p>Loading contact messages...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="adminContactManagementEmpty">
          <MessageSquare size={48} />
          <p>
            {searchTerm
              ? "No contacts found matching your search."
              : "No contact messages yet."}
          </p>
        </div>
      ) : (
        <div className="adminContactManagementTableContainer">
          <table className="adminContactManagementTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.id}</td>
                  <td>
                    <div className="adminContactManagementNameCell">
                      <User size={16} />
                      <span>{contact.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="adminContactManagementEmailCell">
                      <Mail size={16} />
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </div>
                  </td>
                  <td>
                    <div className="adminContactManagementPhoneCell">
                      <Phone size={16} />
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                    </div>
                  </td>
                  <td>
                    <div className="adminContactManagementSubjectCell">
                      {contact.subject && contact.subject.length > 30
                        ? `${contact.subject.substring(0, 30)}...`
                        : contact.subject || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div className="adminContactManagementMessageCell">
                      {contact.message && contact.message.length > 50
                        ? `${contact.message.substring(0, 50)}...`
                        : contact.message || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div className="adminContactManagementDateCell">
                      <Calendar size={16} />
                      <span>{formatDate(contact.created_at)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="adminContactManagementActions">
                      <button
                        onClick={() => handleViewContact(contact)}
                        className="adminContactManagementViewBtn"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setDeleteModalOpen(true);
                        }}
                        className="adminContactManagementDeleteBtn"
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

      {/* View Contact Modal */}
      {viewModalOpen && selectedContact && (
        <div
          className="adminContactManagementModalOverlay"
          onClick={() => setViewModalOpen(false)}
        >
          <div
            className="adminContactManagementModalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adminContactManagementModalHeader">
              <h2>Contact Message Details</h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="adminContactManagementModalClose"
              >
                ×
              </button>
            </div>
            <div className="adminContactManagementModalBody">
              <div className="adminContactManagementDetailRow">
                <span className="adminContactManagementDetailLabel">ID:</span>
                <span className="adminContactManagementDetailValue">
                  {selectedContact.id}
                </span>
              </div>
              <div className="adminContactManagementDetailRow">
                <span className="adminContactManagementDetailLabel">NAME:</span>
                <span className="adminContactManagementDetailValue">
                  {selectedContact.name}
                </span>
              </div>
              <div className="adminContactManagementDetailRow">
                <span className="adminContactManagementDetailLabel">
                  EMAIL:
                </span>
                <span className="adminContactManagementDetailValue adminContactManagementEmailValue">
                  {selectedContact.email}
                </span>
              </div>
              <div className="adminContactManagementDetailRow">
                <span className="adminContactManagementDetailLabel">
                  PHONE:
                </span>
                <span className="adminContactManagementDetailValue adminContactManagementPhoneValue">
                  {selectedContact.phone}
                </span>
              </div>
              <div className="adminContactManagementDetailRow">
                <span className="adminContactManagementDetailLabel">
                  SUBJECT:
                </span>
                <span className="adminContactManagementDetailValue adminContactManagementSubjectValue">
                  {selectedContact.subject || "No subject provided."}
                </span>
              </div>
              <div className="adminContactManagementDetailRow">
                <span className="adminContactManagementDetailLabel">
                  MESSAGE:
                </span>
                <div className="adminContactManagementMessageDetail">
                  {selectedContact.message || "No message provided."}
                </div>
              </div>
              <div className="adminContactManagementDetailRow">
                <span className="adminContactManagementDetailLabel">
                  SUBMITTED:
                </span>
                <span className="adminContactManagementDetailValue">
                  {formatDate(selectedContact.created_at)}
                </span>
              </div>
            </div>
            <div className="adminContactManagementModalFooter">
              <button
                onClick={() => {
                  setSelectedContact(selectedContact);
                  setViewModalOpen(false);
                  setDeleteModalOpen(true);
                }}
                className="adminContactManagementModalDeleteBtn"
              >
                Delete
              </button>
              <button
                onClick={() => setViewModalOpen(false)}
                className="adminContactManagementModalCloseBtn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedContact && (
        <div
          className="adminContactManagementModalOverlay"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="adminContactManagementDeleteModal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Contact Message</h3>
            <p>
              Are you sure you want to delete this contact message from{" "}
              <strong>{selectedContact.name}</strong>?
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>
              This action cannot be undone.
            </p>
            <div className="adminContactManagementDeleteModalActions">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedContact(null);
                }}
                className="adminContactManagementCancelBtn"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContact}
                className="adminContactManagementConfirmDeleteBtn"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;
