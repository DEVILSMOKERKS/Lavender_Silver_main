import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileSpreadsheet, RefreshCw } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNotification } from '../../../../context/NotificationContext';
import './CertificationSection.css';

const CertificationSection = ({
    productId,
    certificates,
    setCertificates,
    setCertificateFiles,
    onDataUpdate
}) => {
    const { showNotification } = useNotification();
    const [uploading, setUploading] = useState(false);
    const [deletingCertificate, setDeletingCertificate] = useState(null);
    const [loading, setLoading] = useState(false);

    
    // Function to fetch certificates from backend
    const fetchCertificates = async () => {
        if (!productId) return;
        
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/certificates`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                setCertificates(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch certificates when component mounts or productId changes
    useEffect(() => {
        if (productId) {
            fetchCertificates();
        }
    }, [productId]);

    
    // Function to refresh certificates data
    const refreshCertificates = async () => {
        await fetchCertificates();
    };

    const handleCertificateUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types - only PDF allowed
        const validFiles = [];
        const invalidFiles = [];
        
        files.forEach(file => {
            if (file.type === 'application/pdf') {
                if (file.size > 1000 * 1024 * 1024) { // 1000MB (1GB) limit
                    invalidFiles.push(`${file.name} (File size exceeds 1GB limit)`);
                } else {
                    validFiles.push(file);
                }
            } else {
                invalidFiles.push(file.name);
            }
        });

        // Show error notification if invalid files found
        if (invalidFiles.length > 0) {
            showNotification(
                `Invalid file format. Only PDF files are allowed. Invalid files: ${invalidFiles.join(', ')}`,
                'error'
            );
            // Clear the input
            e.target.value = '';
            return;
        }

        if (validFiles.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            validFiles.forEach(file => {
                formData.append('certificates', file);
            });
            formData.append('product_id', productId);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/certificates`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                const newCertificates = response.data.data;
                setCertificates(prev => [...prev, ...newCertificates]);
                setCertificateFiles(prev => [...prev, ...validFiles]);

                // Show success notification
                showNotification(
                    `${validFiles.length} certificate(s) uploaded successfully!`,
                    'success'
                );

                // Refresh certificates data to ensure consistency
                setTimeout(() => {
                    fetchCertificates();
                }, 1000);

                if (onDataUpdate) {
                    onDataUpdate();
                }
            }
        } catch (error) {
            console.error('Error uploading certificates:', error);
            showNotification(
                error.response?.data?.message || 'Error uploading certificates. Please try again.',
                'error'
            );
        } finally {
            setUploading(false);
            // Clear the input after processing
            e.target.value = '';
        }
    };

    const handleCertificateDelete = async (certificateId, index) => {
        if (!confirm('Are you sure you want to delete this certificate?')) return;

        setDeletingCertificate(certificateId);
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/certificates/${certificateId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                setCertificates(prev => prev.filter((_, i) => i !== index));
                setCertificateFiles(prev => prev.filter((_, i) => i !== index));

                // Refresh certificates data to ensure consistency
                setTimeout(() => {
                    fetchCertificates();
                }, 500);

                if (onDataUpdate) {
                    onDataUpdate();
                }
            }
        } catch (error) {
            console.error('Error deleting certificate:', error);
        } finally {
            setDeletingCertificate(null);
        }
    };

    // Always render the certification section

    return (
        <div className="certification-section-container">
            <div className="certification-section-header">
                <h3 className="certification-section-title">Product Certification</h3>
                <button
                    onClick={refreshCertificates}
                    disabled={loading}
                    className="certification-refresh-btn"
                    title="Refresh certificates"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Certificate Upload */}
            <div className="certificate-upload-section">
                <label className="certificate-upload-label">
                    <Upload size={20} />
                    <span>Upload Certificates (PDF Only)</span>
                    <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleCertificateUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
                {uploading ? <span className="certificate-uploading-text">Uploading...</span> : null}
            </div>

            {/* Certificate Files Grid */}
            {loading ? (
                <div className="certificate-loading">
                    <span>Loading certificates...</span>
                </div>
            ) : certificates.length === 0 ? (
                <div className="certificate-empty-state">
                    <p>No certificates found for this product. Upload certificates using the button above.</p>
                </div>
            ) : (
                <div className="certificate-grid">
                    {certificates.map((certificate, index) => (
                        <div key={certificate.id || index} className="certificate-item">
                            <div className="certificate-preview">
                                {certificate.certificate_url && certificate.certificate_url.endsWith('.pdf') ? (
                                    <div className="certificate-pdf-preview">
                                        <span>PDF</span>
                                        <p>{certificate.certificate_url.split('/').pop()}</p>
                                    </div>
                                ) : (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}${certificate.certificate_url}`}
                                        alt={`Certificate ${index + 1}`}
                                        className="certificate-image"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                )}
                            </div>
                            <div className="certificate-overlay">
                                <button
                                    className="certificate-delete-btn"
                                    onClick={() => handleCertificateDelete(certificate.id, index)}
                                    disabled={deletingCertificate === certificate.id}
                                >
                                    {deletingCertificate === certificate.id ? (
                                        <span>Deleting...</span>
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                                <span className="certificate-order">{index + 1}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CertificationSection;
