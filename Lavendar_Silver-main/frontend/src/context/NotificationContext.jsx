import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomActionNotification from '../components/CustomActionNotification';

const NotificationContext = createContext();

const toastStyles = {
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  borderRadius: '8px',
  color: 'var(--text-dark)',
  background: 'var(--white)',
  boxShadow: 'var(--card-shadow)',
  padding: '12px 18px',
  '@media (maxWidth: 600px)': {
    fontSize: '0.85rem',
    padding: '8px 20px 8px 8px',
  }
};

const typeStyles = {
  success: { ...toastStyles, background: 'var(--green-light)', color: 'var(--green-primary)' },
  error: { ...toastStyles, background: '#f5e6ed', color: '#E74C3C' },
  warning: { ...toastStyles, background: '#fffbe6', color: '#F1C40F' },
  info: { ...toastStyles, background: '#eaf6fb', color: '#3498DB' },
  notfound: { ...toastStyles, background: '#f5e6ed', color: '#A569BD' },
};

export const NotificationProvider = ({ children }) => {
  const [customNotification, setCustomNotification] = useState(null); // { type, action, products: [] }
  const customNotifTimeout = useRef();

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    toast(message, {
      type,
      style: {
        ...typeStyles[type],
        maxWidth: '260px',
        width: '90vw',
        fontSize: '1rem',
        padding: '12px 18px',
      },
      autoClose: duration,
      transition: Slide,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Show custom notification for cart/wishlist/video actions
  const showCustomNotification = useCallback(({ type, product, action }) => {
    setCustomNotification(prev => {
      if (prev && prev.type === type && prev.action === action) {
        // Add to existing list, avoid duplicates by id
        const exists = prev.products.some(p => p.id === product.id);
        const products = exists ? prev.products : [product, ...prev.products];
        return { type, action, products };
      } else {
        return { type, action, products: [product] };
      }
    });
    if (customNotifTimeout.current) clearTimeout(customNotifTimeout.current);
    customNotifTimeout.current = setTimeout(() => setCustomNotification(null), 3000);
  }, []);

  const hideNotification = useCallback(() => {
    toast.dismiss();
    setCustomNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, showCustomNotification }}>
      {/* Responsive toast style for mobile */}
      <style>{`
        @media (max-width: 600px) {
          .Toastify__toast-container--bottom-right {
            right: 0.5rem !important;
            left: auto !important;
            width: auto !important;
            max-width: 60vw !important;
          }
          .Toastify__toast {
            max-width: 60vw !important;
            min-width: 0 !important;
            width: 90vw !important;
            font-size: 0.8rem !important;
            padding: 0px 12px !important;
            margin-bottom: 8px !important;
            border-radius: 7px !important;
          }
        }
      `}</style>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        draggable
        transition={Slide}
        toastClassName="pvj-toast"
      />
      {customNotification && (
        <CustomActionNotification {...customNotification} onClose={() => setCustomNotification(null)} />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}; 