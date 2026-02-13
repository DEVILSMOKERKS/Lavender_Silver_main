import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import './MultipleSelectionPopup.css';

const MultipleSelectionPopup = ({ isOpen, onClose, onSave, title, options, selectedValues = [], type }) => {
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelected(selectedValues || []);
        }
    }, [isOpen, selectedValues]);

    if (!isOpen) return null;

    const handleToggle = (value) => {
        setSelected(prev => {
            if (prev.includes(value)) {
                return prev.filter(item => item !== value);
            } else {
                return [...prev, value];
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(selected);
        setSaving(false);
        onClose();
    };

    const handleSelectAll = () => {
        setSelected(options.map(option => option.value));
    };

    const handleSelectNone = () => {
        setSelected([]);
    };

    return (
        <div className="multiple-selection-popup-overlay">
            <div className="multiple-selection-popup">
                <div className="multiple-selection-popup-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="multiple-selection-popup-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="multiple-selection-popup-content">
                    <div className="multiple-selection-popup-controls">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="multiple-selection-control-btn"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={handleSelectNone}
                            className="multiple-selection-control-btn"
                        >
                            Select None
                        </button>
                        <div className="multiple-selection-count">
                            Selected: {selected.length}
                        </div>
                    </div>

                    <div className="multiple-selection-popup-options">
                        {options.map((option) => (
                            <label key={option.value} className="multiple-selection-option">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option.value)}
                                    onChange={() => handleToggle(option.value)}
                                    className="multiple-selection-checkbox"
                                />
                                <span className="multiple-selection-label">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="multiple-selection-popup-footer">
                    <button
                        onClick={onClose}
                        className="multiple-selection-cancel-btn"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="multiple-selection-save-btn"
                        disabled={saving}
                    >
                        {saving ? <Loader2 size={16} className="loading-spinner" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save Selection'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultipleSelectionPopup;
