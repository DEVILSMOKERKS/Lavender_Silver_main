import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [admin, setAdmin] = useState(() => {
        const storedAdmin = localStorage.getItem("admin");
        return storedAdmin ? JSON.parse(storedAdmin) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem("admin_token") || null);

    useEffect(() => {
        if (admin && token) {
            // Check if user session exists - if yes, clear it (mutual exclusivity)
            if (localStorage.getItem("token") || localStorage.getItem("user")) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }

            localStorage.setItem("admin", JSON.stringify(admin));
            localStorage.setItem("admin_token", token);
        } else {
            localStorage.removeItem("admin");
            localStorage.removeItem("admin_token");
        }
    }, [admin, token]);

    // Check on mount if user session exists - if yes, clear admin session (mutual exclusivity)
    useEffect(() => {
        const userToken = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (userToken || user) {
            // User session exists, clear admin session
            if (admin || token) {
                logoutAdmin();
            }
        }
    }, []);

    const loginAdmin = (adminData, token) => {
        // Clear user session if exists (mutual exclusivity)
        if (localStorage.getItem("token") || localStorage.getItem("user")) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }

        // Remove password if present before saving to state/localStorage
        if (adminData && adminData.password) delete adminData.password;
        setAdmin(adminData);
        setToken(token);
    };

    const logoutAdmin = () => {
        setAdmin(null);
        setToken(null);
        localStorage.removeItem("admin");
        localStorage.removeItem("admin_token");
    };

    const checkAdminAuth = async () => {
        if (!token) {
            logoutAdmin();
            return;
        }
        try {
            const res = await axios.get(`${API_BASE_URL}/api/auth/whoami`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            if (!data.success || !data.data) {
                logoutAdmin();
            }
        } catch {
            logoutAdmin();
        }
    };

    return (
        <AdminContext.Provider value={{ admin, token, loginAdmin, logoutAdmin, checkAdminAuth, setAdmin }}>
            {children}
        </AdminContext.Provider>
    );
};
