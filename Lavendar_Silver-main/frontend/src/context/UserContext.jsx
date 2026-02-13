import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { setupStatusChecker, clearStatusChecker } from "../utils/userStatusChecker";

export const UserContext = createContext();

// Custom hook to use UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const statusCheckerRef = useRef(null);

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  useEffect(() => {
    if (user && token) {
      // Check if admin session exists - if yes, clear it (mutual exclusivity)
      if (localStorage.getItem("admin_token") || localStorage.getItem("admin")) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin");
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Set up status checker if not already set up
      if (!statusCheckerRef.current) {
        statusCheckerRef.current = setupStatusChecker(token, logout, 5); // Check every 5 minutes
      }
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Clear status checker when no user/token
      if (statusCheckerRef.current) {
        clearStatusChecker(statusCheckerRef.current);
        statusCheckerRef.current = null;
      }
    }
  }, [user, token]);

  // Check on mount if admin session exists - if yes, clear user session (mutual exclusivity)
  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    const admin = localStorage.getItem("admin");
    if (adminToken || admin) {
      // Admin session exists, clear user session
      if (user || token) {
        logout();
      }
    }
  }, []); // Run only on mount

  // Cleanup effect to clear status checker on unmount
  useEffect(() => {
    return () => {
      if (statusCheckerRef.current) {
        clearStatusChecker(statusCheckerRef.current);
      }
    };
  }, []);

  const login = (userData, token) => {
    // Clear admin session if exists (mutual exclusivity)
    if (localStorage.getItem("admin_token") || localStorage.getItem("admin")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin");
    }

    // Remove password if present before saving to state/localStorage
    if (userData && userData.password) delete userData.password;
    setUser(userData);
    setToken(token);

    // Set up status checker for the logged-in user
    if (statusCheckerRef.current) {
      clearStatusChecker(statusCheckerRef.current);
    }
    statusCheckerRef.current = setupStatusChecker(token, logout, 5); // Check every 5 minutes
  };

  const logout = () => {
    // Clear status checker when logging out
    if (statusCheckerRef.current) {
      clearStatusChecker(statusCheckerRef.current);
      statusCheckerRef.current = null;
    }
    setUser(null);
    setToken(null);
  };

  const checkUserAuth = async () => {
    if (!token) {
      logout();
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/whoami`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      if (!data.success || !data.data) {
        logout();
      }
    } catch (error) {
      // Check if token is expired
      if (error.response?.data?.tokenExpired || error.response?.data?.autoLogout) {
        logout();
      } else {
        logout();
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, token, login, logout, checkUserAuth, setUser }}>
      {children}
    </UserContext.Provider>
  );
};