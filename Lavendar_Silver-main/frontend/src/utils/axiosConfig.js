import axios from 'axios';

// Set up global axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.timeout = 30000; // Increased to 30 seconds for file uploads

// Global request interceptor to automatically attach authentication tokens
axios.interceptors.request.use(
  (config) => {
    // Check for admin token first, then user token
    const adminToken = localStorage.getItem("admin_token");
    const userToken = localStorage.getItem("token");

    // Use admin token if available, otherwise use user token
    const token = adminToken || userToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor to handle blocked/inactive users
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorData = error.response?.data;

    // Check if user is blocked, inactive, or token expired
    if (errorData?.blocked || errorData?.inactive || errorData?.autoLogout || errorData?.tokenExpired) {

      // Clear user data from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      localStorage.removeItem("admin_token");

      // Redirect to home page directly without alert
      window.location.href = '/';

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance for backward compatibility
export default axios; 