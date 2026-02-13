/**
 * Performance optimization utilities
 */

/**
 * Throttle function calls to reduce main-thread work
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, delay = 100) {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Use requestAnimationFrame for smooth animations
 * @param {Function} callback - Callback function
 * @returns {number} Animation frame ID
 */
export function raf(callback) {
  return requestAnimationFrame(callback);
}

/**
 * Cancel animation frame
 * @param {number} id - Animation frame ID
 */
export function cancelRaf(id) {
  cancelAnimationFrame(id);
}

/**
 * Batch DOM reads/writes to prevent layout thrashing
 * @param {Function} readCallback - Function that reads from DOM
 * @param {Function} writeCallback - Function that writes to DOM
 */
export function batchDOM(readCallback, writeCallback) {
  // Read phase
  const readResult = readCallback();
  
  // Use requestAnimationFrame to batch writes
  requestAnimationFrame(() => {
    writeCallback(readResult);
  });
}

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images
 * @param {object} options - Intersection Observer options
 */
export function lazyLoadImages(selector = 'img[data-src]', options = {}) {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px',
    ...options
  });

  const images = document.querySelectorAll(selector);
  images.forEach(img => imageObserver.observe(img));
}

/**
 * Defer non-critical JavaScript execution
 * @param {Function} callback - Function to defer
 * @param {number} delay - Delay in milliseconds (default: 0, uses setTimeout)
 */
export function defer(callback, delay = 0) {
  if (delay === 0) {
    // Use setTimeout with 0 to defer to next event loop
    setTimeout(callback, 0);
  } else {
    setTimeout(callback, delay);
  }
}

/**
 * Use idle callback for non-critical work
 * @param {Function} callback - Function to execute during idle time
 * @param {number} timeout - Maximum time to wait in milliseconds
 */
export function idle(callback, timeout = 5000) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 0);
  }
}
