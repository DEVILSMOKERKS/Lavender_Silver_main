import React, { useState } from 'react';
import './MSME.css';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import AdminAuthPopup from './auth-popup/AdminAuthPopup';
import { AdminContext } from '../context/AdminContext';
import { useEffect, useContext, useState as useReactState } from 'react';

const MSME = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { token, checkAdminAuth } = useContext(AdminContext);
    const [authChecked, setAuthChecked] = useReactState(false);
    const isAuthenticated = Boolean(token);
    const [showAuthPopup, setShowAuthPopup] = useReactState(!isAuthenticated);
    const navigate = useNavigate();
    const location = useLocation();

    // Check auth on mount and on route change
    useEffect(() => {
        const verify = async () => {
            await checkAdminAuth();
            setAuthChecked(true);
        };
        verify();
    }, [location.pathname]);

    // Update showAuthPopup when token changes
    useEffect(() => {
        setShowAuthPopup(!Boolean(token));
    }, [token]);

    useEffect(() => {
        // If authenticated, redirect to current path or /admin/dashboard
        if (token && location.pathname.startsWith('/admin')) {
            if (location.pathname === '/admin' || location.pathname === '/admin/') {
                navigate('/admin/dashboard', { replace: true });
            }
        }
    }, [token, location.pathname, navigate]);

    // Sidebar always open on desktop, toggled on mobile
    const handleMenuClick = () => setSidebarOpen(true);
    const handleSidebarClose = () => setSidebarOpen(false);

    const handleLoginSuccess = () => {
        if (token) {
            setShowAuthPopup(false);
            // Redirect to current path or dashboard
            if (location.pathname === '/admin' || location.pathname === '/admin/') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate(location.pathname, { replace: true });
            }
        }
    };

    return (
        <>
            <AdminAuthPopup open={showAuthPopup} onLoginSuccess={handleLoginSuccess} />
            <div className="admin-dashboard-container">
                <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
                <div className="admin-dashboard-main">
                    <Header onMenuClick={handleMenuClick} />
                    <div className="admin-dashboard-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </>
    );
};

export default MSME; 