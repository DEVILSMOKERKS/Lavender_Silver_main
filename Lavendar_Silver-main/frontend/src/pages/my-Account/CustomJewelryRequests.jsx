import React, { useState, useEffect, useContext, useCallback } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import axios from "../../utils/axiosConfig";
import { UserContext } from "../../context/UserContext";
import { useNotification } from "../../context/NotificationContext";
import "./CustomJewelryRequests.css";

const CustomJewelryRequests = () => {
  const { user, token } = useContext(UserContext);
  const { showNotification } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUserRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/custom-jewelry/user-requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        console.error("Failed to fetch requests:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // User not authenticated or unauthorized
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchUserRequests();
    } else {
      setLoading(false);
    }
  }, [user, token, fetchUserRequests]);

  const refreshRequests = () => {
    fetchUserRequests();
  };

  const openRequestModal = async (requestId) => {
    try {
      const response = await axios.get(
        `/api/custom-jewelry/request/${requestId}`
      );
      if (response.data.success) {
        setSelectedRequest(response.data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "in_progress":
        return "status-progress";
      case "completed":
        return "status-completed";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending Review";
      case "approved":
        return "Approved";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const handleAddMoreCustom = () => {
    window.location.href = "/custom-jewelry";
  };

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;

    try {
      setDeleting(true);
      const response = await axios.delete(
        `/api/custom-jewelry/request/${requestToDelete.id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.data.success) {
        showNotification(
          "Custom jewelry request deleted successfully",
          "success"
        );
        // Remove the deleted request from the list
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.id !== requestToDelete.id)
        );
        // Close the delete modal
        setShowDeleteModal(false);
        setRequestToDelete(null);

        // Also close the details modal if it's open for the same request
        if (selectedRequest && selectedRequest.id === requestToDelete.id) {
          setShowModal(false);
          setSelectedRequest(null);
        }
      } else {
        showNotification(
          response.data.message || "Failed to delete request",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error deleting request. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

  if (loading) {
    return (
      <div className="custom-jewelry-requests-page">
        <div className="custom-requests-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your custom jewelry requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="custom-jewelry-requests-page">
        <div className="custom-requests-container">
          <div className="empty-state">
            <h3>Please Log In</h3>
            <p>
              You need to be logged in to view your custom jewelry requests.
            </p>
            <button
              className="custom-jewelry-create-btn"
              onClick={() => (window.location.href = "/login")}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-jewelry-requests-page">
      <div className="custom-requests-container">
        <div className="requests-header">
          <div className="header-content">
            <div>
              <h2>My Custom Jewelry Requests</h2>
              <p>Track the status of your custom jewelry orders</p>
            </div>
            <button
              className="refresh-btn"
              onClick={refreshRequests}
              title="Refresh requests"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="no-requests">
            <div className="no-requests-icon">
              <i className="fas fa-gem"></i>
            </div>
            <h3>No Custom Requests Yet</h3>
            <p>You haven't submitted any custom jewelry requests yet.</p>
            <button
              className="custom-jewelry-create-btn"
              onClick={handleAddMoreCustom}
            >
              <i className="fas fa-plus"></i>
              Create Custom Request
            </button>
          </div>
        ) : (
          <>
            <div className="requests-grid">
              {requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h3>{request.jewelry_type}</h3>
                    <span
                      className={`status-badge ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusText(request.status)}
                    </span>
                  </div>

                  <div className="request-details">
                    <div className="detail-row">
                      <span className="detail-label">Metal Type:</span>
                      <span className="detail-value">{request.metal_type}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Weight:</span>
                      <span className="detail-value">{request.weight}g</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Budget:</span>
                      <span className="detail-value">₹{request.budget}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Submitted:</span>
                      <span className="detail-value">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="request-actions">
                    <button
                      className="custom-jewelry-view-btn"
                      onClick={() => openRequestModal(request.id)}
                    >
                      <i className="fas fa-eye"></i>
                      View Details
                    </button>
                    <button
                      className="custom-jewelry-delete-btn"
                      onClick={() => handleDeleteClick(request)}
                      title="Delete request"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Custom Button */}
            <div className="add-more-custom-section">
              <button
                className="custom-jewelry-add-more-btn"
                onClick={handleAddMoreCustom}
              >
                <i className="fas fa-plus"></i>
                Add More Custom Request
              </button>
            </div>
          </>
        )}

        {/* Request Details Modal */}
        {showModal && selectedRequest && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Request Details</h3>
                <button className="modal-close" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Jewelry Type:</span>
                      <span className="value">
                        {selectedRequest.jewelry_type}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Metal Type:</span>
                      <span className="value">
                        {selectedRequest.metal_type}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Weight:</span>
                      <span className="value">{selectedRequest.weight}g</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Budget:</span>
                      <span className="value">₹{selectedRequest.budget}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span
                        className={`value status ${getStatusColor(
                          selectedRequest.status
                        )}`}
                      >
                        {getStatusText(selectedRequest.status)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Submitted:</span>
                      <span className="value">
                        {new Date(
                          selectedRequest.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Design Description</h4>
                  <p className="description">
                    {selectedRequest.design_description}
                  </p>
                </div>

                {selectedRequest.special_requirements && (
                  <div className="detail-section">
                    <h4>Special Requirements</h4>
                    <p className="description">
                      {selectedRequest.special_requirements}
                    </p>
                  </div>
                )}

                {selectedRequest.admin_notes && (
                  <div className="detail-section">
                    <h4>Admin Notes</h4>
                    <p className="description">{selectedRequest.admin_notes}</p>
                  </div>
                )}

                {selectedRequest.estimated_price && (
                  <div className="detail-section">
                    <h4>Estimated Price</h4>
                    <p className="estimated-price">
                      ₹{selectedRequest.estimated_price}
                    </p>
                  </div>
                )}

                {selectedRequest.estimated_delivery_date && (
                  <div className="detail-section">
                    <h4>Estimated Delivery</h4>
                    <p className="delivery-date">
                      {new Date(
                        selectedRequest.estimated_delivery_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {(() => {
                  try {
                    const referenceImages = selectedRequest.reference_images
                      ? typeof selectedRequest.reference_images === "string"
                        ? JSON.parse(selectedRequest.reference_images)
                        : selectedRequest.reference_images
                      : null;

                    if (
                      referenceImages &&
                      Array.isArray(referenceImages) &&
                      referenceImages.length > 0
                    ) {
                      return (
                        <div className="detail-section">
                          <h4>Reference Images</h4>
                          <div className="reference-images">
                            {referenceImages.map((image, index) => (
                              <div key={index} className="reference-image">
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${
                                    image.url || image
                                  }`}
                                  alt={`Reference ${index + 1}`}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    console.error(
                                      "Failed to load image:",
                                      image.url || image
                                    );
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch (error) {
                    console.error("Error parsing reference images:", error);
                    return null;
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && requestToDelete && (
          <div className="modal-overlay" onClick={handleDeleteCancel}>
            <div
              className="modal-content delete-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Delete Request</h3>
                <button className="modal-close" onClick={handleDeleteCancel}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete this custom jewelry request?
                </p>
                <div className="delete-request-info">
                  <p>
                    <strong>Jewelry Type:</strong>{" "}
                    {requestToDelete.jewelry_type}
                  </p>
                  <p>
                    <strong>Metal Type:</strong> {requestToDelete.metal_type}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {getStatusText(requestToDelete.status)}
                  </p>
                </div>
                <p className="delete-warning">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="delete-confirm-btn"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomJewelryRequests;
