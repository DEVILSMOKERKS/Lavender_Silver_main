import React, { createContext, useReducer, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { useUser } from "./UserContext";
import { useNotification } from "./NotificationContext";

// Initial state
const initialState = {
  cart: [],
  wishlist: [],
  videoCart: [],
  notification: null,
  loading: false,
  error: null,
};

// Actions
const ADD_TO_CART = "ADD_TO_CART";
const REMOVE_FROM_CART = "REMOVE_FROM_CART";
const UPDATE_CART_QUANTITY = "UPDATE_CART_QUANTITY";
const ADD_TO_WISHLIST = "ADD_TO_WISHLIST";
const REMOVE_FROM_WISHLIST = "REMOVE_FROM_WISHLIST";
const ADD_TO_VIDEO_CART = "ADD_TO_VIDEO_CART";
const REMOVE_FROM_VIDEO_CART = "REMOVE_FROM_VIDEO_CART";
const UPDATE_VIDEO_CART_QUANTITY = "UPDATE_VIDEO_CART_QUANTITY";
const SHOW_NOTIFICATION = "SHOW_NOTIFICATION";
const HIDE_NOTIFICATION = "HIDE_NOTIFICATION";
const SET_LOADING = "SET_LOADING";
const SET_ERROR = "SET_ERROR";
const CLEAR_DATA = "CLEAR_DATA";

// Reducer
function wishlistCartReducer(state, action) {
  switch (action.type) {
    case ADD_TO_CART: {
      if (action.override) {
        // Defensive: ensure override is always an array
        // Remove duplicates based on cart_item_id or product_id + product_option_id combination
        const uniqueCart = [];
        const seenIds = new Set();
        const seenProductOptions = new Set();

        (Array.isArray(action.override) ? action.override : []).forEach(item => {
          // For logged-in users, use cart_item_id as unique identifier
          if (item.cart_item_id || item.id) {
            const uniqueId = item.cart_item_id || item.id;
            if (!seenIds.has(uniqueId)) {
              seenIds.add(uniqueId);
              uniqueCart.push(item);
            }
          }
          // For guest users or items without cart_item_id, use product_id + product_option_id
          else if (item.product_id) {
            const comboKey = `${item.product_id}_${item.product_option_id || 'null'}`;
            if (!seenProductOptions.has(comboKey)) {
              seenProductOptions.add(comboKey);
              uniqueCart.push(item);
            }
          }
        });

        return { ...state, cart: uniqueCart };
      }
      // For guest users adding items
      const exists = state.cart.find(item => {
        // Check by cart_item_id if available
        if (item.cart_item_id && action.payload.cart_item_id) {
          return item.cart_item_id === action.payload.cart_item_id;
        }
        // Otherwise check by product_id + product_option_id combination
        return item.id === action.payload.id ||
          (item.product_id === action.payload.product_id &&
            item.product_option_id === action.payload.product_option_id);
      });
      if (exists) {
        return {
          ...state,
          cart: state.cart.map(item =>
            (item.id === action.payload.id ||
              (item.product_id === action.payload.product_id &&
                item.product_option_id === action.payload.product_option_id))
              ? {
                ...item,
                quantity: item.quantity + (action.payload.quantity || 1),
                product_option_id: action.payload.product_option_id || item.product_option_id
              }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };
    }
    case REMOVE_FROM_CART:
      // Support removal by id, product_id, or cart_item_id
      return {
        ...state,
        cart: state.cart.filter(item =>
          item.id !== action.payload &&
          item.product_id !== action.payload &&
          item.cart_item_id !== action.payload
        ),
      };
    case UPDATE_CART_QUANTITY:
      // Support update by id, product_id, or cart_item_id
      return {
        ...state,
        cart: state.cart.map(item =>
          (item.id === action.payload.id ||
            item.product_id === action.payload.id ||
            item.cart_item_id === action.payload.id)
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case ADD_TO_WISHLIST:
      if (action.override) {
        const uniqueWishlist = [];
        const seenIds = new Set();
        const seenProductOptions = new Set();
        (Array.isArray(action.override) ? action.override : []).forEach(item => {
          if (item.id) {
            const uniqueId = item.id;
            if (!seenIds.has(uniqueId)) {
              seenIds.add(uniqueId);
              uniqueWishlist.push(item);
            }
          } else if (item.product_id) {
            const comboKey = `${item.product_id}_${item.product_option_id || 'null'}`;
            if (!seenProductOptions.has(comboKey)) {
              seenProductOptions.add(comboKey);
              uniqueWishlist.push(item);
            }
          }
        });
        return { ...state, wishlist: uniqueWishlist };
      }
      const payloadId = action.payload.id || action.payload.product_id;
      const payloadProductId = action.payload.product_id || action.payload.id;
      const payloadOptionId = action.payload.product_option_id || null;
      
      const existsWishlist = Array.isArray(state.wishlist) && state.wishlist.find(item => 
        item.id === payloadId ||
        (item.product_id === payloadProductId && (item.product_option_id || null) === payloadOptionId) ||
        (item.product_id && item.product_id === payloadProductId && !item.product_option_id && !payloadOptionId)
      );
      
      if (existsWishlist) {
        return state;
      }
      return {
        ...state,
        wishlist: [...(Array.isArray(state.wishlist) ? state.wishlist : []), action.payload],
      };
    case REMOVE_FROM_WISHLIST:
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.id !== action.payload),
      };
    case ADD_TO_VIDEO_CART: {
      if (action.override) {
        // Defensive: ensure override is always an array
        return { ...state, videoCart: Array.isArray(action.override) ? action.override : [] };
      }
      if (!action.payload) return state; // Defensive: ignore null payload

      // Normalize identifiers so we can match existing items reliably
      const payloadId = action.payload.id ?? action.payload.product_id;
      const payloadProductId = action.payload.product_id ?? action.payload.id;
      const payloadOptionId = action.payload.product_option_id ?? action.payload.product_optionId ?? null;
      const payloadVideoCartItemId = action.payload.videoCartItemId ?? action.payload.video_cart_item_id ?? null;
      const payloadQty = Number(action.payload.quantity) || 1;

      const existingItem = state.videoCart.find(item =>
        // Match by unique DB id if present
        (item.videoCartItemId && payloadVideoCartItemId && item.videoCartItemId === payloadVideoCartItemId) ||
        // Match by product + option combo
        ((item.product_id || item.id) === payloadProductId && (item.product_option_id || null) === payloadOptionId) ||
        // Fallback match by id
        (item.id === payloadId)
      );

      if (existingItem) {
        return {
          ...state,
          videoCart: state.videoCart.map(item => {
            if (
              (item.videoCartItemId && payloadVideoCartItemId && item.videoCartItemId === payloadVideoCartItemId) ||
              ((item.product_id || item.id) === payloadProductId && (item.product_option_id || null) === payloadOptionId) ||
              (item.id === payloadId)
            ) {
              return {
                ...item,
                quantity: (Number(item.quantity) || 1) + payloadQty,
                // Keep latest option id & video cart item id if provided
                product_option_id: payloadOptionId ?? item.product_option_id,
                videoCartItemId: payloadVideoCartItemId ?? item.videoCartItemId,
                product_id: payloadProductId ?? item.product_id ?? item.id,
              };
            }
            return item;
          }),
        };
      }

      // New item - ensure ids are set correctly
      return {
        ...state,
        videoCart: [
          ...state.videoCart,
          {
            ...action.payload,
            id: payloadProductId ?? payloadId,
            product_id: payloadProductId ?? payloadId,
            videoCartItemId: payloadVideoCartItemId ?? action.payload.id ?? null,
            quantity: payloadQty,
          }
        ],
      };
    }
    case REMOVE_FROM_VIDEO_CART:
      // Support removal by id, product_id, or videoCartItemId
      return {
        ...state,
        videoCart: state.videoCart.filter(item =>
          item.id !== action.payload &&
          item.product_id !== action.payload &&
          item.videoCartItemId !== action.payload
        ),
      };
    case UPDATE_VIDEO_CART_QUANTITY:
      // Support update by id, product_id, or videoCartItemId
      return {
        ...state,
        videoCart: state.videoCart.map(item =>
          (item.id === action.payload.id ||
            item.product_id === action.payload.id ||
            item.videoCartItemId === action.payload.id)
            ? { ...item, quantity: Number(action.payload.quantity) || 1 }
            : item
        ),
      };
    case SHOW_NOTIFICATION:
      return { ...state, notification: action.payload };
    case HIDE_NOTIFICATION:
      return { ...state, notification: null };
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload };
    case CLEAR_DATA:
      return { ...initialState };
    default:
      return state;
  }
}

// Context
const WishlistCartContext = createContext();

// Provider
export function WishlistCartProvider({ children }) {
  const { user, token } = useUser();
  const { showNotification, showCustomNotification } = useNotification();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Load initial state from localStorage (for guests only)
  const getInitialState = () => {
    if (user && token) {
      // For logged-in users, start empty, will fetch from API
      return { ...initialState };
    }
    try {
      const cart = JSON.parse(localStorage.getItem("pvj_cart")) || [];
      const wishlist = JSON.parse(localStorage.getItem("pvj_wishlist")) || [];
      const videoCart = JSON.parse(localStorage.getItem("pvj_video_cart")) || [];
      return { ...initialState, cart, wishlist, videoCart };
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return initialState;
    }
  };

  const [state, dispatch] = useReducer(wishlistCartReducer, initialState, getInitialState);

  const prevUserRef = useRef(user);
  const prevTokenRef = useRef(token);
  // Track ongoing quantity updates to prevent duplicate calls
  const quantityUpdateInProgress = useRef(new Set());

  // Helper: merge duplicate video cart items by product_id + product_option_id
  const mergeVideoCartItems = (items) => {
    const merged = new Map();
    (Array.isArray(items) ? items : []).forEach(item => {
      const productId = item.product_id || item.id;
      const optionId = item.product_option_id || 'null';
      const key = `${productId}_${optionId}`;
      if (merged.has(key)) {
        const existing = merged.get(key);
        merged.set(key, {
          ...existing,
          quantity: (Number(existing.quantity) || 1) + (Number(item.quantity) || 1),
          videoCartItemId: existing.videoCartItemId || item.videoCartItemId,
          product_id: productId
        });
      } else {
        merged.set(key, {
          ...item,
          product_id: productId,
          product_option_id: item.product_option_id || null,
          quantity: Number(item.quantity) || 1
        });
      }
    });
    return Array.from(merged.values());
  };

  // Only clear data when user logs out (was logged in, now not)
  useEffect(() => {
    if (prevUserRef.current && prevTokenRef.current && (!user || !token)) {
      // User just logged out
      dispatch({ type: CLEAR_DATA });
      // Restore guest data from localStorage
      try {
        const cart = JSON.parse(localStorage.getItem("pvj_cart")) || [];
        const wishlist = JSON.parse(localStorage.getItem("pvj_wishlist")) || [];
        const videoCart = JSON.parse(localStorage.getItem("pvj_video_cart")) || [];
        dispatch({ type: ADD_TO_CART, payload: null, override: cart });
        dispatch({ type: ADD_TO_WISHLIST, payload: null, override: wishlist });
        dispatch({ type: ADD_TO_VIDEO_CART, payload: null, override: videoCart });
      } catch (error) {
        console.error("Error restoring guest data:", error);
      }
    }
    prevUserRef.current = user;
    prevTokenRef.current = token;
  }, [user, token]);

  // Handle user login - clear state and fetch server data
  useEffect(() => {
    if (user && token && (!prevUserRef.current || !prevTokenRef.current)) {
      // User just logged in (was not logged in before)

      // Clear current state immediately
      dispatch({ type: CLEAR_DATA });

      // Clear localStorage to prevent any guest data interference
      try {
        localStorage.removeItem("pvj_cart");
        localStorage.removeItem("pvj_wishlist");
        localStorage.removeItem("pvj_video_cart");
      } catch (error) {
        console.error("Error clearing localStorage on login:", error);
      }
    }
  }, [user, token]);

  // Persist to localStorage only for guests
  // This ensures that:
  // - Guest users: Cart/wishlist data is saved to localStorage
  // - Logged-in users: Cart/wishlist data is only saved to server, localStorage is cleared
  useEffect(() => {
    // Only save to localStorage for guest users
    if (!user || !token) {
      try {
        localStorage.setItem("pvj_cart", JSON.stringify(state.cart));
        localStorage.setItem("pvj_wishlist", JSON.stringify(state.wishlist));
        localStorage.setItem("pvj_video_cart", JSON.stringify(state.videoCart));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
    // For logged-in users, DO NOT save to localStorage at all
    // localStorage is cleared when user logs in, and should remain empty
  }, [state.cart, state.wishlist, state.videoCart, user, token]);

  // Fetch cart/wishlist from backend if logged in
  useEffect(() => {
    if (user && token) {
      const fetchData = async () => {
        dispatch({ type: SET_LOADING, payload: true });
        dispatch({ type: SET_ERROR, payload: null });

        try {
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };

          const [cartRes, wishlistRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/cart`, { headers }),
            axios.get(`${API_BASE_URL}/api/wishlist`, { headers })
          ]);

          // Handle different response structures
          const rawCartData = cartRes.data?.data || cartRes.data?.cart || cartRes.data || {};
          const rawWishlistData = wishlistRes.data?.data || wishlistRes.data?.wishlist || wishlistRes.data || {};

          // Extract items array from the response
          const cartData = rawCartData.items || [];
          const wishlistData = rawWishlistData.items || [];

          // Transform backend cart data to match frontend structure
          // Keep id as product_id for frontend compatibility, add cart_item_id separately for backend operations
          const transformedCartData = cartData.map(item => ({
            ...item,
            id: item.product_id || item.id, // Keep product_id as id for frontend compatibility (isInCart checks by product.id)
            cart_item_id: item.id, // Preserve cart_item id (unique) for backend operations and duplicate prevention
            product_id: item.product_id, // Preserve product_id for reference
            price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.product_image ? item.product_image : (item.image_url ? item.image_url : (item.image ? item.image : '')),
            sku: item.sku,
            stamp: item.stamp,
            quantity: item.quantity || 1, // Ensure quantity is always present
            // Include dynamic product option details - proper checking without OR operations
            option_details: item.option_details ? item.option_details : {
              size: item.size ? item.size : '',
              weight: item.weight ? item.weight : '',
              dimensions: item.dimensions ? item.dimensions : '',
              metal_color: item.metal_color ? item.metal_color : '',
              gender: item.gender ? item.gender : '',
              occasion: item.occasion ? item.occasion : ''
            },
            product_option_id: item.product_option_id
          }));

          // Transform backend wishlist data to match frontend structure
          const transformedWishlistData = wishlistData.map(item => {
            // Format image URL properly - ensure it includes API_BASE_URL if it's a relative path
            let imageUrl = item.product_image || item.image_url || item.image || '';
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
              // Prepend API_BASE_URL if it's a relative path
              imageUrl = imageUrl.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`;
            }

            return {
              ...item,
              id: item.product_id || item.id, // Use product_id as id for consistency
              price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
              name: item.product_name ? item.product_name : (item.name ? item.name : ''),
              item_name: item.product_name || item.item_name || item.name || '',
              slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
              image: imageUrl,
              sku: item.sku,
              stamp: item.stamp,
              // Include dynamic product option details - proper checking without OR operations
              option_details: item.option_details ? item.option_details : {
                size: item.size ? item.size : '',
                weight: item.weight ? item.weight : '',
                dimensions: item.dimensions ? item.dimensions : '',
                metal_color: item.metal_color ? item.metal_color : '',
                gender: item.gender ? item.gender : '',
                occasion: item.occasion ? item.occasion : ''
              },
              product_option_id: item.product_option_id
            };
          });

          dispatch({ type: ADD_TO_CART, payload: null, override: transformedCartData });
          dispatch({ type: ADD_TO_WISHLIST, payload: null, override: transformedWishlistData });

        } catch (error) {
          console.error("Error fetching cart/wishlist:", error);
          const errorMessage = error.response?.data?.message || error.message || "Failed to load data from server";
          dispatch({ type: SET_ERROR, payload: errorMessage });
          showNotification(errorMessage, "error");

          // If token is invalid, you might want to logout user
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn("Invalid token, user might need to re-login");
          }
        } finally {
          dispatch({ type: SET_LOADING, payload: false });
        }
      };

      fetchData();
    }
  }, [user, token, API_BASE_URL, showNotification]);

  // Fetch video cart from backend if logged in
  useEffect(() => {
    if (user && token) {
      const fetchVideoCart = async () => {
        try {
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          const res = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, { headers });
          const videoCartData = res.data?.data || [];
          const transformedVideoCartData = videoCartData.map(item => ({
            ...item,
            // Keep video cart item ID for backend operations
            id: item.product_id || item.id, // Use product_id as the primary id for frontend
            videoCartItemId: item.id,       // Preserve the video cart item's database ID
            product_id: item.product_id,    // Explicitly store product_id
            price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.image_url ? item.image_url : (item.image ? item.image : ''),
            sku: item.sku,
            stamp: item.stamp,
            quantity: Number(item.quantity) || 1,
            // Include dynamic product option details - proper checking without OR operations
            option_details: item.option_details ? item.option_details : {
              size: item.size ? item.size : '',
              weight: item.weight ? item.weight : '',
              dimensions: item.dimensions ? item.dimensions : '',
              metal_color: item.metal_color ? item.metal_color : '',
              gender: item.gender ? item.gender : '',
              occasion: item.occasion ? item.occasion : ''
            },
            product_option_id: item.product_option_id
          }));
          dispatch({
            type: ADD_TO_VIDEO_CART, payload: null, override: mergeVideoCartItems(transformedVideoCartData)
          });
        } catch (error) {
          console.error('Error fetching video cart:', error);
        }
      };
      fetchVideoCart();
    }
  }, [user, token, API_BASE_URL]);

  // Helper: API sync for logged-in users
  const apiSync = async (type, method, url, data, successMsg, errorMsg, showSimpleNotif = true) => {
    if (!user || !token) return false;

    try {
      const config = {
        method,
        url: `${API_BASE_URL}${url}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put' || method.toLowerCase() === 'patch')) {
        config.data = data;
      }

      const response = await axios(config);

      if (successMsg && showSimpleNotif) {
        showNotification(successMsg, "success");
      }

      return response.data;
    } catch (error) {
      console.error('API Error:', { type, method, url, data, error: error.response?.data || error.message });
      const message = errorMsg || error.response?.data?.message || error.message || "Server error";
      if (showSimpleNotif) {
        showNotification(message, "error");
      }
      return false;
    }
  };

  // Actions
  const addToCart = async (product, showNotif = true) => {
    if (user && token) {
      // Prepare request body for backend
      const body = {
        product_id: product.id,
        quantity: product.quantity || 1,
        product_option_id: product.product_option_id || null
      };

      const result = await apiSync(ADD_TO_CART, "post", "/api/cart", body, "Added to cart!", "Failed to add to cart.", false);
      if (result !== false) {
        // For logged-in users, refetch cart data from server to ensure consistency
        try {
          const headers = { 'Authorization': `Bearer ${token}` };
          const res = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
          const cartData = res.data?.data?.items || [];
          // Keep id as product_id for frontend compatibility, add cart_item_id separately
          const transformedCartData = cartData.map(item => ({
            ...item,
            id: item.product_id || item.id, // Keep product_id as id for frontend compatibility
            cart_item_id: item.id, // Preserve cart_item id (unique) for backend operations and duplicate prevention
            product_id: item.product_id, // Preserve product_id for reference
            price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.product_image ? item.product_image : (item.image_url ? item.image_url : (item.image ? item.image : '')),
            sku: item.sku,
            stamp: item.stamp,
            quantity: item.quantity || 1, // Ensure quantity is always present
            product_option_id: item.product_option_id
          }));
          dispatch({ type: ADD_TO_CART, payload: null, override: transformedCartData });
        } catch (error) {
          console.error("Error adding to cart:", error);
        }
        // Format product image URL for notification
        let productImage = product.image || product.img || product.images?.[0]?.image_url || product.images?.[0] || '';
        if (productImage && !productImage.startsWith('http') && !productImage.startsWith('data:') && productImage.trim() !== '') {
          productImage = productImage.startsWith('/') ? `${API_BASE_URL}${productImage}` : `${API_BASE_URL}/${productImage}`;
        }
        const productForNotification = {
          ...product,
          image: productImage
        };
        if (showNotif) showCustomNotification({ type: 'cart', product: productForNotification, action: 'add' });
      }
    } else {
      // For guest users, always increment quantity by 1 and set required fields
      const firstOption = Array.isArray(product.product_options) && product.product_options.length > 0
        ? product.product_options[0]
        : {};
      // Format product image URL for notification
      let productImage = product.image || product.img || product.images?.[0]?.image_url || product.images?.[0] || '';
      if (productImage && !productImage.startsWith('http') && !productImage.startsWith('data:') && productImage.trim() !== '') {
        productImage = productImage.startsWith('/') ? `${API_BASE_URL}${productImage}` : `${API_BASE_URL}/${productImage}`;
      }
      const productWithRequiredFields = {
        ...product,
        product_id: product.product_id || product.id,
        quantity: product.quantity || 1,
        product_option_id: firstOption.id || product.product_option_id || null,
        image: productImage
      };
      // Validate required fields
      if (!productWithRequiredFields.product_id || !productWithRequiredFields.quantity) return;
      dispatch({ type: ADD_TO_CART, payload: productWithRequiredFields });
      if (showNotif) showCustomNotification({ type: 'cart', product: productWithRequiredFields, action: 'add' });
    }
  };

  const removeFromCart = async (id, showNotif = true) => {
    // Find the product to remove from current cart state (supports multiple ID formats)
    let removedProduct = state.cart.find(item =>
      item.id === id ||
      item.product_id === id ||
      item.cart_item_id === id
    );

    if (user && token) {
      // Optimistic update: remove from UI immediately
      if (removedProduct) {
        dispatch({ type: REMOVE_FROM_CART, payload: removedProduct.id });
      }

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
        const cartData = res.data?.data?.items || [];

        // Find cart item by matching id, product_id, or cart_item_id
        const cartItem = cartData.find(item =>
          item.id === id ||
          item.product_id === id ||
          (removedProduct && (item.id === removedProduct.cart_item_id || item.product_id === removedProduct.product_id))
        );

        if (cartItem) {
          // Get complete product data for notification before removing
          let imageUrl = cartItem.product_image || cartItem.image_url || cartItem.image || '';
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && imageUrl.trim() !== '') {
            imageUrl = imageUrl.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`;
          }
          const productForNotification = {
            ...cartItem,
            id: cartItem.product_id || cartItem.id,
            name: cartItem.product_name || cartItem.name,
            image: imageUrl,
            price: cartItem.final_price ? cartItem.final_price : (cartItem.value ? cartItem.value : (cartItem.price ? cartItem.price : 0))
          };

          const result = await apiSync(REMOVE_FROM_CART, "delete", `/api/cart/${cartItem.id}`, null, null, "Failed to remove from cart.", false);
          if (result !== false) {
            // Refetch cart data from server to ensure sync
            const res2 = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
            const updatedCartData = res2.data?.data?.items || [];
            const transformedCartData = updatedCartData.map(item => ({
              ...item,
              id: item.product_id || item.id, // Use product_id as id for frontend compatibility
              cart_item_id: item.id, // Preserve cart_item id (unique) for backend operations
              product_id: item.product_id, // Preserve product_id for reference
              price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
              name: item.product_name ? item.product_name : (item.name ? item.name : ''),
              slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
              image: item.product_image ? item.product_image : (item.image_url ? item.image_url : (item.image ? item.image : '')),
              sku: item.sku,
              stamp: item.stamp,
              product_option_id: item.product_option_id,
              quantity: item.quantity || 1
            }));
            dispatch({ type: ADD_TO_CART, payload: null, override: transformedCartData });
            if (showNotif) showCustomNotification({ type: 'cart', product: productForNotification, action: 'remove' });
          } else {
            // API call failed, revert optimistic update by refetching
            const res2 = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
            const updatedCartData = res2.data?.data?.items || [];
            const transformedCartData = updatedCartData.map(item => ({
              ...item,
              id: item.product_id || item.id,
              cart_item_id: item.id,
              product_id: item.product_id,
              price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
              name: item.product_name ? item.product_name : (item.name ? item.name : ''),
              slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
              image: item.product_image ? item.product_image : (item.image_url ? item.image_url : (item.image ? item.image : '')),
              sku: item.sku,
              stamp: item.stamp,
              product_option_id: item.product_option_id,
              quantity: item.quantity || 1
            }));
            dispatch({ type: ADD_TO_CART, payload: null, override: transformedCartData });
          }
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        // Revert optimistic update on error by refetching
        try {
          const headers = { 'Authorization': `Bearer ${token}` };
          const res = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
          const cartData = res.data?.data?.items || [];
          const transformedCartData = cartData.map(item => ({
            ...item,
            id: item.product_id || item.id,
            cart_item_id: item.id,
            product_id: item.product_id,
            price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.product_image ? item.product_image : (item.image_url ? item.image_url : (item.image ? item.image : '')),
            sku: item.sku,
            stamp: item.stamp,
            product_option_id: item.product_option_id,
            quantity: item.quantity || 1
          }));
          dispatch({ type: ADD_TO_CART, payload: null, override: transformedCartData });
        } catch (refetchErr) {
          console.error("Error refetching cart after remove failure:", refetchErr);
        }
      }
    } else {
      // Guest user: immediate local update
      dispatch({ type: REMOVE_FROM_CART, payload: id });
      if (removedProduct && showNotif) {
        // Format product image URL for notification
        let productImage = removedProduct.image || removedProduct.img || removedProduct.images?.[0]?.image_url || removedProduct.images?.[0] || '';
        if (productImage && !productImage.startsWith('http') && !productImage.startsWith('data:') && productImage.trim() !== '') {
          productImage = productImage.startsWith('/') ? `${API_BASE_URL}${productImage}` : `${API_BASE_URL}/${productImage}`;
        }
        const productForNotification = {
          ...removedProduct,
          image: productImage
        };
        showCustomNotification({ type: 'cart', product: productForNotification, action: 'remove' });
      }
    }
  };

  const updateCartQuantity = async (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, false);
      return;
    }
    if (user && token) {
      // Optimistic update: update UI immediately before API call
      const currentCart = state.cart;
      const itemToUpdate = currentCart.find(item =>
        item.id === id ||
        item.product_id === id ||
        item.cart_item_id === id
      );

      if (itemToUpdate) {
        // Optimistically update the cart state
        dispatch({
          type: UPDATE_CART_QUANTITY,
          payload: {
            id: itemToUpdate.id, // Use the actual id from cart state
            quantity
          }
        });
      }

      try {
        // Find cart item by matching id, product_id, or cart_item_id
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
        const cartData = res.data?.data?.items || [];

        // Try to find item by multiple ID fields
        const item = cartData.find(i =>
          i.id === id ||
          i.product_id === id ||
          (itemToUpdate && (i.id === itemToUpdate.cart_item_id || i.product_id === itemToUpdate.product_id))
        );

        if (item) {
          await axios.put(`${API_BASE_URL}/api/cart/${item.id}`, { quantity }, { headers });
        }

        // Refetch cart to sync with server
        const res2 = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
        const updated = res2.data?.data?.items || [];
        const transformedCartData = updated.map(item => ({
          ...item,
          id: item.product_id || item.id, // Use product_id as id for frontend compatibility
          cart_item_id: item.id, // Preserve cart_item id (unique) for backend operations
          product_id: item.product_id, // Preserve product_id for reference
          price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
          name: item.product_name ? item.product_name : (item.name ? item.name : ''),
          slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
          image: item.product_image ? item.product_image : (item.image_url ? item.image_url : (item.image ? item.image : '')),
          sku: item.sku,
          stamp: item.stamp,
          product_option_id: item.product_option_id,
          quantity: item.quantity || 1
        }));
        dispatch({ type: ADD_TO_CART, payload: null, override: transformedCartData });
      } catch (err) {
        console.error("Error updating cart quantity:", err);
        // Revert optimistic update on error by refetching
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
          const cartData = res.data?.data?.items || [];
          const transformedCartData = cartData.map(item => ({
            ...item,
            id: item.product_id || item.id,
            cart_item_id: item.id,
            product_id: item.product_id,
            price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.product_image ? item.product_image : (item.image_url ? item.image_url : (item.image ? item.image : '')),
            sku: item.sku,
            stamp: item.stamp,
            product_option_id: item.product_option_id,
            quantity: item.quantity || 1
          }));
          dispatch({ type: ADD_TO_CART, payload: null, override: transformedCartData });
        } catch (refetchErr) {
          console.error("Error refetching cart after update failure:", refetchErr);
        }
      }
    } else {
      // Guest user: immediate local update
      dispatch({ type: UPDATE_CART_QUANTITY, payload: { id, quantity } });
    }
  };

  const addToWishlist = async (product) => {
    const productId = product.product_id || product.id;
    const productOptionId = product.product_option_id || null;
    
    const existingItem = state.wishlist.find(item => 
      item.id === productId ||
      item.product_id === productId ||
      ((item.product_id || item.id) === productId && (item.product_option_id || null) === productOptionId)
    );
    
    if (existingItem) {
      return;
    }
    
    if (user && token) {
      const body = {
        product_id: productId,
        product_option_id: productOptionId
      };

      const result = await apiSync(ADD_TO_WISHLIST, "post", "/api/wishlist", body, "Added to wishlist!", "Failed to add to wishlist.", false);
      if (result !== false) {
        try {
          const headers = { 'Authorization': `Bearer ${token}` };
          const res = await axios.get(`${API_BASE_URL}/api/wishlist`, { headers });
          const wishlistData = res.data?.data?.items || [];
          const transformedWishlistData = wishlistData.map(item => ({
            ...item,
            id: item.product_id || item.id,
            price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.image_url || item.image
          }));
          dispatch({ type: ADD_TO_WISHLIST, payload: null, override: transformedWishlistData });
        } catch (error) {
          console.error("Error refetching wishlist:", error);
        }
        let productImage = product.image || product.img || product.images?.[0]?.image_url || product.images?.[0] || '';
        if (productImage && !productImage.startsWith('http') && !productImage.startsWith('data:') && productImage.trim() !== '') {
          productImage = productImage.startsWith('/') ? `${API_BASE_URL}${productImage}` : `${API_BASE_URL}/${productImage}`;
        }
        const productForNotification = {
          ...product,
          image: productImage
        };
        showCustomNotification({ type: 'wishlist', product: productForNotification, action: 'add' });
      }
    } else {
      const firstOption = Array.isArray(product.product_options) && product.product_options.length > 0
        ? product.product_options[0]
        : {};
      let productImage = product.image || product.img || product.images?.[0]?.image_url || product.images?.[0] || '';
      if (productImage && !productImage.startsWith('http') && !productImage.startsWith('data:') && productImage.trim() !== '') {
        productImage = productImage.startsWith('/') ? `${API_BASE_URL}${productImage}` : `${API_BASE_URL}/${productImage}`;
      }
      const productWithRequiredFields = {
        ...product,
        product_id: productId,
        product_option_id: firstOption.id || productOptionId,
        image: productImage
      };
      if (!productWithRequiredFields.product_id) return;
      dispatch({ type: ADD_TO_WISHLIST, payload: productWithRequiredFields });
      showCustomNotification({ type: 'wishlist', product: productWithRequiredFields, action: 'add' });
    }
  };

  const removeFromWishlist = async (id) => {
    let removedProduct = state.wishlist.find(item => item.id === id);
    if (user && token) {
      try {
        // Find wishlist item by product_id
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await axios.get(`${API_BASE_URL}/api/wishlist`, { headers });
        const wishlistData = res.data?.data?.items || [];
        const item = wishlistData.find(i => (i.product_id || i.id) === id);

        if (item) {
          // Get complete product data for notification before removing
          // Format image URL properly - ensure it includes API_BASE_URL if it's a relative path
          let imageUrl = item.product_image || item.image_url || item.image || '';
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && imageUrl.trim() !== '') {
            // Prepend API_BASE_URL if it's a relative path
            imageUrl = imageUrl.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`;
          }
          const productForNotification = {
            ...item,
            id: item.product_id || item.id,
            name: item.product_name || item.name,
            image: imageUrl,
            price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0))
          };

          const result = await apiSync(REMOVE_FROM_WISHLIST, "delete", `/api/wishlist/${item.id}`, null, null, "Failed to remove from wishlist.", false);
          if (result !== false) {
            // Refetch wishlist data from server
            const res2 = await axios.get(`${API_BASE_URL}/api/wishlist`, { headers });
            const updatedWishlistData = res2.data?.data?.items || [];
            const transformedWishlistData = updatedWishlistData.map(item => ({
              ...item,
              id: item.product_id || item.id,
              price: item.final_price ? item.final_price : (item.value ? item.value : (item.price ? item.price : 0)),
              name: item.product_name || item.name,
              slug: item.product_slug || item.slug,
              image: item.product_image || item.image_url || item.image
            }));
            dispatch({ type: ADD_TO_WISHLIST, payload: null, override: transformedWishlistData });
            showCustomNotification({ type: 'wishlist', product: productForNotification, action: 'remove' });
          }
        }
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        // Removed simple notification - custom notification will handle this
      }
    } else {
      dispatch({ type: REMOVE_FROM_WISHLIST, payload: id });
      if (removedProduct) showCustomNotification({ type: 'wishlist', product: removedProduct, action: 'remove' });
    }
  };

  // Video cart actions
  const addToVideoCart = async (product, showNotif = true) => {
    if (user && token) {
      // Normalize identifiers for duplicate checking
      const productId = product.id || product.product_id;
      const productOptionId = product.product_option_id || null;

      // Validate required fields
      if (!productId) {
        console.error('Cannot add to video cart: missing product_id');
        return;
      }

      // Check if item already exists in frontend state to prevent duplicate API calls
      const existingItem = state.videoCart.find(item => {
        const itemProductId = item.product_id || item.id;
        const itemOptionId = item.product_option_id || null;
        return itemProductId === productId && itemOptionId === productOptionId;
      });

      if (existingItem) {
        // Item already exists, don't add again
        if (showNotif) {
          showNotification('Item already in video cart', 'info');
        }
        return;
      }

      // Backend sync
      const body = {
        product_id: productId,
        quantity: 1
      };
      
      if (productOptionId) {
        body.product_option_id = productOptionId;
      }

      try {
        await axios.post(`${API_BASE_URL}/api/video-consultation/video-cart`, body, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Refetch video cart to get updated state from backend
        const res = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const videoCartData = res.data?.data || [];

        const transformedVideoCartData = videoCartData.map(item => ({
          ...item,
          // Keep video cart item ID for backend operations, but also store product_id for frontend matching
          id: item.product_id || item.id, // Use product_id as the primary id for frontend
          videoCartItemId: item.id, // Preserve the video cart item's database ID for backend operations
          product_id: item.product_id, // Explicitly store product_id
          price: item.final_price ? item.final_price : (item.sell_price ? item.sell_price : (item.value ? item.value : (item.price ? item.price : 0))),
          name: item.product_name ? item.product_name : (item.name ? item.name : ''),
          slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
          image: item.image_url ? item.image_url : (item.image ? item.image : ''),
          sku: item.sku,
          stamp: item.stamp,
          quantity: Number(item.quantity) || 1, // Ensure quantity is a number
          // Include dynamic product option details
          option_details: item.option_details ? item.option_details : {
            size: item.size ? item.size : '',
            weight: item.weight ? item.weight : '',
            dimensions: item.dimensions ? item.dimensions : '',
            metal_color: item.metal_color ? item.metal_color : '',
            gender: item.gender ? item.gender : '',
            occasion: item.occasion ? item.occasion : ''
          },
          product_option_id: item.product_option_id
        }));

        dispatch({
          type: ADD_TO_VIDEO_CART, payload: null, override: transformedVideoCartData
        });

        if (showNotif) {
          showCustomNotification({ type: 'video', product, action: 'add' });
        }
      } catch (err) {
        console.error('Error adding to video cart:', err);
        showNotification('Failed to save video cart to server', 'error');
      }
    } else {
      // Guest: localStorage, set required fields
      const firstOption = Array.isArray(product.product_options) && product.product_options.length > 0
        ? product.product_options[0]
        : {};
      const productWithRequiredFields = {
        ...product,
        product_id: product.product_id || product.id,
        quantity: 1, // Always start with quantity 1 for new items
        product_option_id: firstOption.id || product.product_option_id || null
      };

      // Validate required fields
      if (!productWithRequiredFields.product_id || !productWithRequiredFields.quantity) {
        console.error('Cannot add to video cart: missing required fields');
        return;
      }

      dispatch({ type: ADD_TO_VIDEO_CART, payload: productWithRequiredFields });
      if (showNotif) {
        showCustomNotification({ type: 'video', product: productWithRequiredFields, action: 'add' });
      }
    }
  };

  const removeFromVideoCart = async (id) => {
    // Find the item to remove for notification
    const removedProduct = state.videoCart.find(item =>
      item.id === id || item.product_id === id
    );

    // Optimistic update - remove immediately from UI
    dispatch({ type: REMOVE_FROM_VIDEO_CART, payload: id });

    if (user && token) {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Find video cart item by product_id or id
        const res = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, { headers });
        const videoCartData = res.data?.data || [];

        // Find the video cart item - use videoCartItemId if available, otherwise find by product_id
        let videoCartItemId = null;

        // First, try to find by videoCartItemId (the database ID)
        if (removedProduct && removedProduct.videoCartItemId) {
          const foundById = videoCartData.find(i => i.id === removedProduct.videoCartItemId);
          if (foundById) {
            videoCartItemId = foundById.id;
          }
        }

        // If not found, try to find by product_id
        if (!videoCartItemId) {
          const foundByProductId = videoCartData.find(i =>
            (i.product_id && i.product_id === id) ||
            (i.product_id && i.product_id === removedProduct?.product_id) ||
            (i.product_id && i.product_id === removedProduct?.id)
          );
          if (foundByProductId) {
            videoCartItemId = foundByProductId.id; // This is the video cart item's database ID
          }
        }

        // If still not found, try to find by the id passed
        if (!videoCartItemId) {
          const foundById = videoCartData.find(i =>
            (i.id && i.id === id) ||
            (i.id && i.id === removedProduct?.id)
          );
          if (foundById) {
            videoCartItemId = foundById.id;
          }
        }

        let productForNotification = null;
        if (videoCartItemId) {
          // Get the item for notification
          const item = videoCartData.find(i => i.id === videoCartItemId);
          if (item) {
            productForNotification = {
              ...item,
              id: item.product_id || item.id,
              name: item.product_name || item.name,
              image: item.product_image || item.image_url || item.image,
              price: item.final_price ? item.final_price : (item.sell_price ? item.sell_price : (item.value ? item.value : (item.price ? item.price : 0)))
            };
          }

          // Delete from backend using the video cart item's database ID
          await axios.delete(`${API_BASE_URL}/api/video-consultation/video-cart/${videoCartItemId}`, { headers });
        }

        // Refetch video cart to ensure sync
        const res2 = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, { headers });
        const updated = res2.data?.data || [];

        const transformedVideoCartData = updated.map(item => ({
          ...item,
          // Keep video cart item ID for backend operations
          id: item.product_id || item.id, // Use product_id as the primary id for frontend
          videoCartItemId: item.id, // Preserve the video cart item's database ID
          product_id: item.product_id, // Explicitly store product_id
          price: item.final_price ? item.final_price : (item.sell_price ? item.sell_price : (item.value ? item.value : (item.price ? item.price : 0))),
          name: item.product_name ? item.product_name : (item.name ? item.name : ''),
          slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
          image: item.image_url ? item.image_url : (item.image ? item.image : ''),
          sku: item.sku,
          stamp: item.stamp,
          quantity: Number(item.quantity) || 1, // Ensure quantity is a number
          // Include dynamic product option details
          option_details: item.option_details ? item.option_details : {
            size: item.size ? item.size : '',
            weight: item.weight ? item.weight : '',
            dimensions: item.dimensions ? item.dimensions : '',
            metal_color: item.metal_color ? item.metal_color : '',
            gender: item.gender ? item.gender : '',
            occasion: item.occasion ? item.occasion : ''
          },
          product_option_id: item.product_option_id
        }));

        // Update state with backend data (this will correct any optimistic update issues)
        dispatch({ type: ADD_TO_VIDEO_CART, payload: null, override: mergeVideoCartItems(transformedVideoCartData) });

        if (productForNotification) {
          showCustomNotification({ type: 'video', product: productForNotification, action: 'remove' });
        }
      } catch (err) {
        console.error('Error removing from video cart:', err);
        // Revert optimistic update on error by refetching
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, { headers });
          const updated = res.data?.data || [];
          const transformedVideoCartData = updated.map(item => ({
            ...item,
            // Keep video cart item ID for backend operations
            id: item.product_id || item.id, // Use product_id as the primary id for frontend
            videoCartItemId: item.id, // Preserve the video cart item's database ID
            product_id: item.product_id, // Explicitly store product_id
            price: item.final_price ? item.final_price : (item.sell_price ? item.sell_price : (item.value ? item.value : (item.price ? item.price : 0))),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.image_url ? item.image_url : (item.image ? item.image : ''),
            sku: item.sku,
            stamp: item.stamp,
            quantity: Number(item.quantity) || 1,
            option_details: item.option_details ? item.option_details : {
              size: item.size ? item.size : '',
              weight: item.weight ? item.weight : '',
              dimensions: item.dimensions ? item.dimensions : '',
              metal_color: item.metal_color ? item.metal_color : '',
              gender: item.gender ? item.gender : '',
              occasion: item.occasion ? item.occasion : ''
            },
            product_option_id: item.product_option_id
          }));
          dispatch({ type: ADD_TO_VIDEO_CART, payload: null, override: mergeVideoCartItems(transformedVideoCartData) });
        } catch (refetchErr) {
          console.error('Error refetching video cart after remove error:', refetchErr);
        }
        showNotification('Failed to remove video cart item', 'error');
      }
    } else {
      // Guest user - optimistic update already applied above
      if (removedProduct) {
        showCustomNotification({ type: 'video', product: removedProduct, action: 'remove' });
      }
    }
  };

  const updateVideoCartQuantity = async (id, quantity) => {
    // Validate quantity
    const newQuantity = Number(quantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      removeFromVideoCart(id);
      return;
    }

    // Prevent duplicate updates for the same item
    if (quantityUpdateInProgress.current.has(id)) {
      console.log('Quantity update already in progress for item:', id);
      return;
    }

    // Optimistic update for immediate UI feedback
    const currentItem = state.videoCart.find(item =>
      item.id === id || item.product_id === id || item.videoCartItemId === id
    );

    if (!currentItem) {
      console.error('[VideoCart] Item not found in video cart:', id, 'Available items:', state.videoCart.map(i => ({ id: i.id, product_id: i.product_id, videoCartItemId: i.videoCartItemId })));
      return;
    }

    console.log('[VideoCart] Updating quantity:', {
      id,
      currentItem: { id: currentItem.id, product_id: currentItem.product_id, videoCartItemId: currentItem.videoCartItemId, quantity: currentItem.quantity },
      newQuantity
    });

    // Prevent updating if quantity hasn't actually changed
    if (Number(currentItem.quantity) === newQuantity) {
      console.log('[VideoCart] Quantity unchanged, skipping update');
      return;
    }

    // Mark update as in progress
    quantityUpdateInProgress.current.add(id);

    // Optimistic update - update UI immediately
    dispatch({
      type: UPDATE_VIDEO_CART_QUANTITY,
      payload: { id, quantity: newQuantity }
    });

    if (user && token) {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Find video cart item by product_id or id
        const res = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, { headers });
        const videoCartData = res.data?.data || [];

        console.log('[VideoCart] Fetched video cart data:', videoCartData.map(i => ({ id: i.id, product_id: i.product_id, quantity: i.quantity })));

        // Find the video cart item - use videoCartItemId if available, otherwise find by product_id
        let videoCartItemId = null;

        // First, try to find by videoCartItemId (the database ID) - this is the most reliable
        if (currentItem.videoCartItemId) {
          const foundById = videoCartData.find(i => i.id === currentItem.videoCartItemId);
          if (foundById) {
            videoCartItemId = foundById.id;
            console.log('[VideoCart] Found by videoCartItemId:', videoCartItemId);
          }
        }

        // If not found, try to find by product_id (the id passed might be product_id)
        if (!videoCartItemId) {
          const productIdToFind = currentItem.product_id || currentItem.id || id;
          const foundByProductId = videoCartData.find(i =>
            i.product_id === productIdToFind
          );
          if (foundByProductId) {
            videoCartItemId = foundByProductId.id; // This is the video cart item's database ID
            console.log('[VideoCart] Found by product_id:', productIdToFind, 'videoCartItemId:', videoCartItemId);
          }
        }

        // If still not found, try to find by matching the id passed directly
        if (!videoCartItemId) {
          const foundById = videoCartData.find(i => i.id === id);
          if (foundById) {
            videoCartItemId = foundById.id;
            console.log('[VideoCart] Found by id:', videoCartItemId);
          }
        }

        if (videoCartItemId) {
          console.log(`[VideoCart] Updating quantity for videoCartItemId: ${videoCartItemId}, newQuantity: ${newQuantity}`);

          // Prepare update payload - only include product_option_id if it exists
          const updatePayload = {
            quantity: newQuantity
          };

          // Include product_option_id if available
          if (currentItem.product_option_id) {
            updatePayload.product_option_id = currentItem.product_option_id;
          }

          console.log(`[VideoCart] Update payload:`, updatePayload);

          // Update quantity on backend - use the video cart item's database ID
          await axios.put(
            `${API_BASE_URL}/api/video-consultation/video-cart/${videoCartItemId}`,
            updatePayload,
            { headers }
          );

          // Refetch video cart to ensure sync
          const res2 = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, { headers });
          const updated = res2.data?.data || [];

          const transformedVideoCartData = updated.map(item => ({
            ...item,
            // Keep video cart item ID for backend operations
            id: item.product_id || item.id, // Use product_id as the primary id for frontend
            videoCartItemId: item.id, // Preserve the video cart item's database ID
            product_id: item.product_id, // Explicitly store product_id
            price: item.final_price ? item.final_price : (item.sell_price ? item.sell_price : (item.value ? item.value : (item.price ? item.price : 0))),
            name: item.product_name ? item.product_name : (item.name ? item.name : ''),
            slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
            image: item.image_url ? item.image_url : (item.image ? item.image : ''),
            sku: item.sku,
            stamp: item.stamp,
            quantity: Number(item.quantity) || 1, // Ensure quantity is a number
            // Include dynamic product option details
            option_details: item.option_details ? item.option_details : {
              size: item.size ? item.size : '',
              weight: item.weight ? item.weight : '',
              dimensions: item.dimensions ? item.dimensions : '',
              metal_color: item.metal_color ? item.metal_color : '',
              gender: item.gender ? item.gender : '',
              occasion: item.occasion ? item.occasion : ''
            },
            product_option_id: item.product_option_id
          }));

          console.log(`[VideoCart] Updated video cart, items count: ${transformedVideoCartData.length}`);

          // Update state with backend data
          dispatch({ type: ADD_TO_VIDEO_CART, payload: null, override: mergeVideoCartItems(transformedVideoCartData) });
        } else {
          // Item not found on backend, revert optimistic update
          console.error('[VideoCart] Item not found on backend, reverting optimistic update', {
            id,
            currentItem: {
              id: currentItem.id,
              product_id: currentItem.product_id,
              videoCartItemId: currentItem.videoCartItemId,
              quantity: currentItem.quantity
            },
            videoCartData: videoCartData.map(i => ({ id: i.id, product_id: i.product_id, quantity: i.quantity }))
          });

          // Revert optimistic update
          dispatch({
            type: UPDATE_VIDEO_CART_QUANTITY,
            payload: { id, quantity: currentItem.quantity }
          });

          showNotification('Item not found in cart. Please refresh the page.', 'error');

          // Try to refetch the entire cart to sync
          try {
            const res = await axios.get(`${API_BASE_URL}/api/video-consultation/video-cart`, { headers });
            const updated = res.data?.data || [];
            const transformedVideoCartData = updated.map(item => ({
              ...item,
              id: item.product_id || item.id,
              videoCartItemId: item.id,
              product_id: item.product_id,
              price: item.final_price ? item.final_price : (item.sell_price ? item.sell_price : (item.value ? item.value : (item.price ? item.price : 0))),
              name: item.product_name ? item.product_name : (item.name ? item.name : ''),
              slug: item.product_slug ? item.product_slug : (item.slug ? item.slug : ''),
              image: item.image_url ? item.image_url : (item.image ? item.image : ''),
              sku: item.sku,
              stamp: item.stamp,
              quantity: Number(item.quantity) || 1,
              option_details: item.option_details ? item.option_details : {
                size: item.size ? item.size : '',
                weight: item.weight ? item.weight : '',
                dimensions: item.dimensions ? item.dimensions : '',
                metal_color: item.metal_color ? item.metal_color : '',
                gender: item.gender ? item.gender : '',
                occasion: item.occasion ? item.occasion : ''
              },
              product_option_id: item.product_option_id
            }));
            dispatch({ type: ADD_TO_VIDEO_CART, payload: null, override: mergeVideoCartItems(transformedVideoCartData) });
          } catch (refetchErr) {
            console.error('[VideoCart] Error refetching after update error:', refetchErr);
          }
        }
      } catch (err) {
        console.error('Error updating video cart quantity:', err);
        // Revert optimistic update on error
        dispatch({
          type: UPDATE_VIDEO_CART_QUANTITY,
          payload: { id, quantity: currentItem.quantity }
        });
        showNotification('Failed to update video cart item', 'error');
      } finally {
        // Remove from in-progress set
        quantityUpdateInProgress.current.delete(id);
      }
    } else {
      // Guest user - optimistic update already applied above
      // Remove from in-progress set
      quantityUpdateInProgress.current.delete(id);
    }
  };

  const showNotif = (payload) => dispatch({ type: SHOW_NOTIFICATION, payload });
  const hideNotif = () => dispatch({ type: HIDE_NOTIFICATION });

  // Calculate totals
  const cartTotal = Array.isArray(state.cart)
    ? state.cart.reduce((total, item) => {
      const price = item.final_price || item.value || item.price || 0;
      return total + (price * (item.quantity || 1));
    }, 0)
    : 0;

  const cartItemCount = Array.isArray(state.cart) ? state.cart.length : 0;
  const cartTotalQuantity = Array.isArray(state.cart)
    ? state.cart.reduce((count, item) => count + (item.quantity || 1), 0)
    : 0;
  const wishlistItemCount = Array.isArray(state.wishlist) ? state.wishlist.length : 0;

  return (
    <WishlistCartContext.Provider
      value={{
        // State
        cart: state.cart,
        wishlist: state.wishlist,
        videoCart: state.videoCart,
        loading: state.loading,
        error: state.error,
        notification: state.notification,

        // Calculated values
        cartTotal,
        cartItemCount, // Number of unique products in cart
        cartTotalQuantity, // Total quantity of all items in cart
        wishlistItemCount,

        // Actions
        addToCart,
        removeFromCart,
        updateCartQuantity,
        addToWishlist,
        removeFromWishlist,
        addToVideoCart,
        removeFromVideoCart,
        updateVideoCartQuantity,
        showNotification: showNotif,
        hideNotification: hideNotif,

        // Helper functions
        isInCart: (id) => state.cart.some(item => item.id === id),
        isInWishlist: (id) => Array.isArray(state.wishlist) && state.wishlist.some(item => item.id === id),
      }}
    >
      {children}
    </WishlistCartContext.Provider>
  );
}

// Custom hook for easy usage
export function useWishlistCart() {
  const context = useContext(WishlistCartContext);
  if (!context) {
    throw new Error('useWishlistCart must be used within a WishlistCartProvider');
  }
  return context;
}