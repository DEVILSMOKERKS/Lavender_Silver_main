import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import './DescriptionPopup.css';

const DescriptionPopup = ({
    isOpen,
    onClose,
    description,
    onSave,
    productId
}) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setText(description || '');
        }
    }, [isOpen, description]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(text);
            onClose();
        } catch (error) {
            console.error('Error saving description:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="description-popup-overlay">
            <div className="description-popup">
                <div className="description-popup-header">
                    <h3>Edit Description</h3>
                    <button onClick={onClose} className="description-popup-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="description-popup-content">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter product description..."
                        className="description-textarea"
                        rows={10}
                    />
                </div>

                <div className="description-popup-footer">
                    <button onClick={onClose} className="description-cancel-btn">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="description-save-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="loading-spinner"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Description
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DescriptionPopup;
