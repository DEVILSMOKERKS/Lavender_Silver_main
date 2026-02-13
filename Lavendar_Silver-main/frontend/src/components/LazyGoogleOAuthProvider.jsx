import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

/**
 * LazyGoogleOAuthProvider
 * Wraps the app with GoogleOAuthProvider
 * The provider is needed for GoogleLogin component to work in Signup
 */
const LazyGoogleOAuthProvider = ({ clientId, children }) => {
  // If no clientId, render children without provider
  if (!clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default LazyGoogleOAuthProvider;

