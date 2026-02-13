import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, AlertTriangle, Search } from 'lucide-react';
import './Admin404.css';

const Admin404 = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        navigate('/admin/dashboard');
    };



    return (
        <div className="admin-404-container">
            <div className="admin-404-content">
                {/* Error Icon */}
                <div className="admin-404-icon-wrapper">
                    <AlertTriangle className="admin-404-icon" />
                    <div className="admin-404-icon-bg"></div>
                </div>

                {/* Error Text */}
                <div className="admin-404-text">
                    <h1 className="admin-404-title">Admin Page Not Found</h1>
                    <h2 className="admin-404-subtitle">404 Error</h2>
                    <p className="admin-404-description">
                        The admin page you're looking for doesn't exist or has been moved.
                    </p>
                    <div className="admin-404-path">
                        <Search className="admin-404-path-icon" />
                        <span>Requested Path: <code>{location.pathname}</code></span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="admin-404-actions">
                    <button
                        onClick={handleGoBack}
                        className="admin-404-btn admin-404-btn-back"
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="admin-404-btn admin-404-btn-home"
                    >
                        <Home size={16} />
                        Admin Dashboard
                    </button>
                </div>




            </div>

            {/* Decorative Elements */}
            <div className="admin-404-decoration">
                <div className="admin-404-circle admin-404-circle-1"></div>
                <div className="admin-404-circle admin-404-circle-2"></div>
                <div className="admin-404-circle admin-404-circle-3"></div>
            </div>
        </div>
    );
};

export default Admin404;