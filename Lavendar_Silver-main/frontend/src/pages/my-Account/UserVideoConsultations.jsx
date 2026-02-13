import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { Video, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import './myAccount.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserVideoConsultations = () => {
    const { user, token } = useContext(UserContext);
    const { showNotification } = useNotification();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        if (user && token) {
            fetchConsultations();
        }
    }, [user, token, filterStatus]);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = filterStatus !== 'all' ? { status: filterStatus } : {};
            const response = await axios.get(`${API_BASE_URL}/api/video-consultation/user-requests`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setConsultations(response.data.data || []);
            } else {
                setError('Failed to load consultations');
            }
        } catch (err) {
            console.error('Error fetching consultations:', err);
            setError('Failed to load consultations');
            showNotification('Failed to load video consultations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'completed':
                return <CheckCircle size={18} style={{ color: '#28a745' }} />;
            case 'cancelled':
                return <XCircle size={18} style={{ color: '#dc3545' }} />;
            case 'otp_verified':
                return <AlertCircle size={18} style={{ color: '#ffc107' }} />;
            default:
                return <AlertCircle size={18} style={{ color: '#6c757d' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'completed':
                return '#28a745';
            case 'cancelled':
                return '#dc3545';
            case 'otp_verified':
                return '#ffc107';
            case 'requested':
                return '#6c757d';
            default:
                return '#6c757d';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not scheduled';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'Not scheduled';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const handleCancelConsultation = async (consultation) => {
        if (!window.confirm(`Are you sure you want to cancel consultation #${consultation.id}?`)) {
            return;
        }

        try {
            setCancellingId(consultation.id);

            const response = await axios.put(
                `${API_BASE_URL}/api/video-consultation/user-requests/${consultation.id}/cancel`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                showNotification('Consultation cancelled successfully', 'success');
                // Refresh consultations list
                fetchConsultations();
            } else {
                showNotification(response.data.message || 'Failed to cancel consultation', 'error');
            }
        } catch (err) {
            console.error('Error cancelling consultation:', err);
            showNotification(err.response?.data?.message || 'Failed to cancel consultation. Please try again.', 'error');
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="myaccount_right_bottom">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <Loader size={32} style={{
                        animation: 'spin 1s linear infinite',
                        color: '#0E593C'
                    }} />
                    <div style={{ color: '#666', fontSize: '14px' }}>Loading your video consultations...</div>
                </div>
            </div>
        );
    }

    if (error && consultations.length === 0) {
        return (
            <div className="myaccount_right_bottom">
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#666'
                }}>
                    <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>{error}</div>
                    <button
                        onClick={fetchConsultations}
                        style={{
                            marginTop: '16px',
                            padding: '8px 16px',
                            background: '#0E593C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="myaccount_right_bottom video-consultations-container">
            <div className="video-consultations-header">
                <div className="video-consultations-header-content">
                    <h3 className="video-consultations-title">
                        My Video Consultations
                    </h3>

                    <div className="video-consultations-filters">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`video-consultation-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('confirmed')}
                            className={`video-consultation-filter-btn ${filterStatus === 'confirmed' ? 'active' : ''}`}
                        >
                            Confirmed
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={`video-consultation-filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                        >
                            Completed
                        </button>
                        <button
                            onClick={() => setFilterStatus('cancelled')}
                            className={`video-consultation-filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
                        >
                            Cancelled
                        </button>
                    </div>
                </div>
            </div>

            {consultations.length === 0 ? (
                <div className="video-consultations-empty">
                    <Video size={48} className="video-consultations-empty-icon" />
                    <div className="video-consultations-empty-title">
                        No Video Consultations Found
                    </div>
                    <div className="video-consultations-empty-desc">
                        {filterStatus === 'all'
                            ? "You haven't booked any video consultations yet."
                            : `No ${filterStatus} consultations found.`}
                    </div>
                    <a
                        href="/video-cart/booking"
                        className="video-consultations-book-btn"
                    >
                        <Video size={16} />
                        <span>Book Video Consultation</span>
                    </a>
                </div>
            ) : (
                <div className="video-consultations-list">
                    {consultations.map((consultation) => (
                        <div
                            key={consultation.id}
                            className="video-consultation-card"
                        >
                            <div className="video-consultation-card-header">
                                <div className="video-consultation-card-info">
                                    <div className="video-consultation-card-title-row">
                                        <Video size={20} className="video-consultation-icon" />
                                        <span className="video-consultation-card-title">
                                            Consultation #{consultation.id}
                                        </span>
                                    </div>
                                    <div className="video-consultation-card-date">
                                        Booked on {new Date(consultation.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div
                                className="video-consultation-status-banner"
                                style={{
                                    background: `${getStatusColor(consultation.status)}15`,
                                }}
                            >
                                {getStatusIcon(consultation.status)}
                                <span style={{ color: getStatusColor(consultation.status) }}>
                                    {consultation.status?.replace('_', ' ') || 'Requested'}
                                </span>
                            </div>

                            <div className="video-consultation-card-details">
                                <div className="video-consultation-detail-item">
                                    <Calendar size={16} className="video-consultation-detail-icon" />
                                    <div className="video-consultation-detail-content">
                                        <span className="video-consultation-detail-label">Date: </span>
                                        <span className="video-consultation-detail-value">
                                            {formatDate(consultation.consultation_date)}
                                        </span>
                                    </div>
                                </div>

                                <div className="video-consultation-detail-item">
                                    <Clock size={16} className="video-consultation-detail-icon" />
                                    <div className="video-consultation-detail-content">
                                        <span className="video-consultation-detail-label">Time: </span>
                                        <span className="video-consultation-detail-value">
                                            {formatTime(consultation.consultation_time)}
                                        </span>
                                    </div>
                                </div>

                                <div className="video-consultation-detail-item">
                                    <Clock size={16} className="video-consultation-detail-icon" />
                                    <div className="video-consultation-detail-content">
                                        <span className="video-consultation-detail-label">Duration: </span>
                                        <span className="video-consultation-detail-value">
                                            {consultation.consultation_duration || 15} minutes
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cancel Button - Only show if consultation can be cancelled */}
                            {consultation.status?.toLowerCase() !== 'cancelled' && 
                             consultation.status?.toLowerCase() !== 'completed' && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                                    <button
                                        onClick={() => handleCancelConsultation(consultation)}
                                        disabled={cancellingId === consultation.id}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            background: cancellingId === consultation.id ? '#e0e0e0' : '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: cancellingId === consultation.id ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease',
                                            opacity: cancellingId === consultation.id ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (cancellingId !== consultation.id) {
                                                e.target.style.background = '#c82333';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (cancellingId !== consultation.id) {
                                                e.target.style.background = '#dc3545';
                                            }
                                        }}
                                    >
                                        {cancellingId === consultation.id ? (
                                            <>
                                                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                                <span>Cancelling...</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={16} />
                                                <span>Cancel Consultation</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserVideoConsultations;

