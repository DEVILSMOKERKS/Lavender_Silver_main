/**
 * Lazy load Facebook SDK only when needed
 * This prevents loading 75.7 KiB of unused JavaScript on pages that don't need it
 */

let fbSDKLoading = false;
let fbSDKLoaded = false;
let fbSDKLoadPromise = null;

export const loadFacebookSDK = () => {
  // If already loaded, return resolved promise
  if (window.FB && fbSDKLoaded) {
    return Promise.resolve(window.FB);
  }

  // If already loading, return the existing promise
  if (fbSDKLoadPromise) {
    return fbSDKLoadPromise;
  }

  // If already started loading, wait a bit and check again
  if (fbSDKLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.FB && fbSDKLoaded) {
          clearInterval(checkInterval);
          resolve(window.FB);
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 5000); // Timeout after 5s
    });
  }

  // Start loading Facebook SDK
  fbSDKLoading = true;
  fbSDKLoadPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector('script[src*="connect.facebook.net"]')) {
      // Script tag exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.FB) {
          clearInterval(checkInterval);
          fbSDKLoaded = true;
          fbSDKLoading = false;
          resolve(window.FB);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.FB) {
          reject(new Error('Facebook SDK failed to load'));
        }
      }, 10000);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    
    script.onload = () => {
      // Initialize Facebook SDK
      if (window.fbAsyncInit) {
        window.fbAsyncInit();
      } else {
        window.fbAsyncInit = function () {
          if (window.FB) {
            window.FB.init({
              appId: '795527116601960',
              cookie: true,
              xfbml: true,
              version: 'v18.0'
            });
            fbSDKLoaded = true;
            fbSDKLoading = false;
            resolve(window.FB);
          }
        };
        // Call immediately if FB is already available
        if (window.FB) {
          window.fbAsyncInit();
        }
      }
      
      // If FB is available, resolve
      if (window.FB) {
        fbSDKLoaded = true;
        fbSDKLoading = false;
        resolve(window.FB);
      }
    };

    script.onerror = () => {
      fbSDKLoading = false;
      fbSDKLoadPromise = null;
      reject(new Error('Failed to load Facebook SDK'));
    };

    document.head.appendChild(script);
  });

  return fbSDKLoadPromise;
};

