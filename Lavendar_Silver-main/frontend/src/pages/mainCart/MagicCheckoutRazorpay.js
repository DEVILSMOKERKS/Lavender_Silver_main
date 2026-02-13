// utils/razorpayCheckout.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function launchRazorpayCheckout(orderData, onSuccess, onError) {
  try {
    // 1. Create Razorpay order (no DB save)
    const createRes = await axios.post(`${API_BASE_URL}/api/orders/razorpay/create-order`, {
      amount: orderData.total_amount,
      currency: 'INR',
      receipt: `pvj_${Date.now()}`,
    }).catch(err => {
      // Handle axios errors properly
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create payment order';
      throw new Error(errorMessage);
    });

    if (!createRes.data.success) {
      throw new Error(createRes.data.message || 'Razorpay order creation failed');
    }
    const { razorpay_order_id } = createRes.data;

    // 2. Discount logic
    let finalAmount = orderData.total_amount;
    let discount = 0;
    if (finalAmount > 50000) {
      discount = 2000;
      finalAmount -= discount;
    }

    // 3. Load Razorpay script if not already loaded
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error('Razorpay SDK failed to load');

    // 4. Setup Razorpay options
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      name: 'PVJ Jewels',
      description: `Order`,
      order_id: razorpay_order_id, // Enables Magic Checkout
      handler: async function (response) {
        try {
          // 5. Sanitize orderData and items before saving order
          const safe = v => v === undefined ? null : v;
          const sanitizedOrderData = {
            ...orderData,
            payment_id: response.razorpay_payment_id,
            payment_status: 'paid',
            razorpay_order_id,
            items: Array.isArray(orderData.items)
              ? orderData.items.map(item => ({
                product_id: safe(item.product_id),
                product_option_id: safe(item.product_option_id),
                quantity: safe(item.quantity),
                price: safe(item.price),
                size: safe(item.size),
                weight: safe(item.weight),
                metal_type: safe(item.metal_type),
                diamond_quality: safe(item.diamond_quality),
                custom_price: safe(item.custom_price),
              }))
              : [],
          };
          // Professional token handling - check if user is logged in
          const headers = {};
          const token = localStorage.getItem('token');
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const saveOrderRes = await axios.post(`${API_BASE_URL}/api/orders`, sanitizedOrderData, {
            headers: headers,
          });
          if (!saveOrderRes.data.success) throw new Error('Order save failed after payment');

          // Pass order details including order_number and order_id to success callback
          const orderDetails = {
            ...response, // Razorpay payment response (razorpay_payment_id, etc.)
            id: saveOrderRes.data.order_id, // For backward compatibility
            order_id: saveOrderRes.data.order_id,
            order_number: saveOrderRes.data.order_number,
            total_amount: saveOrderRes.data.total_amount || orderData.total_amount,
            payment_status: saveOrderRes.data.payment_status || 'paid'
          };
          onSuccess && onSuccess(orderDetails);
        } catch (err) {
          onError && onError(err);
        }
      },
      prefill: {
        name: orderData.user_name,
        email: orderData.user_email,
        contact: orderData.user_phone,
      },
      notes: {
        // You can add more notes if needed
      },
      theme: {
        color: '#F5C242',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error('Razorpay Checkout Error:', err);
    // Extract proper error message
    const errorMessage = err.response?.data?.message || err.message || 'Payment initialization failed. Please try again.';
    const error = new Error(errorMessage);
    error.originalError = err;
    onError && onError(error);
  }
}

// Optional fallback for future use
export function launchMagicCheckout(orderData, onSuccess, onError) {
  return launchRazorpayCheckout(orderData, onSuccess, onError);
}
