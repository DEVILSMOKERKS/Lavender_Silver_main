import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const checkUserStatus = async (token, logout) => {
  if (!token) return;

  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/status/check`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // If successful, user is still active
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;

    // Check if user is blocked or inactive
    if (errorData?.blocked || errorData?.inactive || errorData?.autoLogout) {
      // Force logout without alert
      if (logout) {
        logout();
        window.location.href = '/'; // Redirect to home page
      }
      return false;
    }

    // For other errors, don't logout (could be network issues, etc.)
    return null;
  }
};

// Set up periodic status checking
export const setupStatusChecker = (token, logout, intervalMinutes = 5) => {
  if (!token || !logout) return null;

  const interval = setInterval(async () => {
    const result = await checkUserStatus(token, logout);
    if (result === false) {
      // User was logged out, clear the interval
      clearInterval(interval);
    }
  }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

  return interval;
};

// Clear status checker interval
export const clearStatusChecker = (interval) => {
  if (interval) {
    clearInterval(interval);
  }
}; 