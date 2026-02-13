import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async'; // ✅ import HelmetProvider

import { UserProvider } from './context/UserContext';
import { WishlistCartProvider } from "./context/wishlistCartContext";
import { NotificationProvider } from './context/NotificationContext';
import PVJUserRoutes from "./routes/PVJUserRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import { AdminProvider } from './context/AdminContext';

const App = React.memo(() => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdmin) {
      setLoading(true);
      // Use requestAnimationFrame for smoother scroll
      const timeout = setTimeout(() => {
        requestAnimationFrame(() => {
          setLoading(false);
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        });
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, isAdmin]);

  // Update canonical link when pathname changes
  useEffect(() => {
    const link = document.querySelector("link[rel='canonical']");
    if (link) link.href = window.location.origin + location.pathname;
  }, [location.pathname]);

  return (
    <HelmetProvider> {/* ✅ Wrap everything with HelmetProvider */}
      {isAdmin ? (
        <NotificationProvider>
          <AdminProvider>
            <AdminRoutes />
          </AdminProvider>
        </NotificationProvider>
      ) : (
        <NotificationProvider>
          <UserProvider>
            <WishlistCartProvider>
              <PVJUserRoutes
                onAccountClick={() => setIsSignupOpen(true)}
                loading={loading}
                isSignupOpen={isSignupOpen}
                setIsSignupOpen={setIsSignupOpen}
              />
            </WishlistCartProvider>
          </UserProvider>
        </NotificationProvider>
      )}
    </HelmetProvider>
  );
});

App.displayName = 'App';

export default App;
