import React, { useState, useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';
import './FacebookLogin.css';
import { loadFacebookSDK } from '../../utils/loadFacebookSDK';

const FacebookLogin = ({ onSuccess, onError, text = "continue_with", disabled = false }) => {
  const [sdkLoading, setSdkLoading] = useState(false);

  // Preload Facebook SDK when component mounts (user might click the button)
  useEffect(() => {
    // Only preload if we're on a signup/login page
    const path = window.location.pathname;
    if (path.includes('/signup') || path.includes('/login')) {
      // Preload in background (low priority)
      loadFacebookSDK().catch(() => {
        // Silently fail - will load on button click if needed
      });
    }
  }, []);

  const handleFacebookLogin = async () => {
    if (disabled) return;

    // Lazy load Facebook SDK if not already loaded
    if (!window.FB) {
      setSdkLoading(true);
      try {
        await loadFacebookSDK();
      } catch (error) {
        setSdkLoading(false);
        onError('Failed to load Facebook SDK. Please try again.');
        return;
      }
      setSdkLoading(false);
    }

    // Login with Facebook
    window.FB.login((response) => {
      if (response.authResponse) {
        // Get user info
        window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
          if (userInfo && !userInfo.error) {
            onSuccess({
              accessToken: response.authResponse.accessToken,
              userID: response.authResponse.userID,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture?.data?.url
            });
          } else {
            onError('Failed to get user information');
          }
        });
      } else {
        onError('Facebook login was cancelled or failed');
      }
    }, { scope: 'email,public_profile' });
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={disabled || sdkLoading}
      className="facebook-login-button"
    >
      <FaFacebook className="facebook-icon" />
      <span className="facebook-text">
        {sdkLoading 
          ? "Loading..." 
          : (text === "continue_with" ? "Continue with Facebook" : "Sign up with Facebook")
        }
      </span>
    </button>
  );
};

export default FacebookLogin; 