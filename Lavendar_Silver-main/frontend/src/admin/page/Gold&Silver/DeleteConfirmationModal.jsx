import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="delete-confirmation-modal-overlay">
            <div className="delete-confirmation-modal">
                <div className="delete-confirmation-modal-header">
                    <div className="delete-confirmation-modal-title">
                        <AlertTriangle className="delete-confirmation-icon" />
                        <h2>{title || 'Confirm Delete'}</h2>
                    </div>
                    <button className="delete-confirmation-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="delete-confirmation-content">
                    <div className="delete-confirmation-message">
                        <AlertTriangle className="warning-icon" />
                        <p>{message || `Are you sure you want to delete this ${itemName || 'item'}?`}</p>
                        <p className="warning-text">This action cannot be undone.</p>
                    </div>
                </div>

                <div className="delete-confirmation-modal-actions">
                    <button
                        type="button"
                        className="delete-confirmation-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="delete-confirmation-delete"
                        onClick={onConfirm}
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal; 