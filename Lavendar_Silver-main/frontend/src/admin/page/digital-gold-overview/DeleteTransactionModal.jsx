import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import './DeleteTransactionModal.css';

const DeleteTransactionModal = ({ isOpen, onClose, onConfirm, transactionData }) => {
    if (!isOpen) return null;

    return (
        <div className="delete-transaction-modal-overlay">
            <div className="delete-transaction-modal">
                <div className="delete-transaction-modal-header">
                    <div className="delete-transaction-modal-title">
                        <Trash2 className="delete-transaction-modal-icon" />
                        <h3>Delete Transaction</h3>
                    </div>
                    <button
                        className="delete-transaction-modal-close"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="delete-transaction-modal-content">
                    <div className="delete-transaction-modal-warning">
                        <AlertTriangle className="delete-transaction-modal-warning-icon" />
                        <p>Are you sure you want to delete this transaction?</p>
                    </div>

                    {transactionData && (
                        <div className="delete-transaction-modal-details">
                            <div className="delete-transaction-modal-detail-row">
                                <span className="delete-transaction-modal-label">User:</span>
                                <span className="delete-transaction-modal-value">{transactionData.userName}</span>
                            </div>
                            <div className="delete-transaction-modal-detail-row">
                                <span className="delete-transaction-modal-label">Type:</span>
                                <span className="delete-transaction-modal-value">{transactionData.type}</span>
                            </div>
                            <div className="delete-transaction-modal-detail-row">
                                <span className="delete-transaction-modal-label">Amount:</span>
                                <span className="delete-transaction-modal-value">₹{transactionData.amount}</span>
                            </div>
                            <div className="delete-transaction-modal-detail-row">
                                <span className="delete-transaction-modal-label">Gold:</span>
                                <span className="delete-transaction-modal-value">{transactionData.gold}g</span>
                            </div>
                            <div className="delete-transaction-modal-detail-row">
                                <span className="delete-transaction-modal-label">Date:</span>
                                <span className="delete-transaction-modal-value">{transactionData.date}</span>
                            </div>
                        </div>
                    )}

                    <div className="delete-transaction-modal-note">
                        <p>This action cannot be undone. The transaction will be permanently removed from the system.</p>
                    </div>
                </div>

                <div className="delete-transaction-modal-actions">
                    <button
                        className="delete-transaction-modal-btn delete-transaction-modal-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="delete-transaction-modal-btn delete-transaction-modal-confirm"
                        onClick={onConfirm}
                    >
                        <Trash2 size={16} />
                        Delete Transaction
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTransactionModal; 