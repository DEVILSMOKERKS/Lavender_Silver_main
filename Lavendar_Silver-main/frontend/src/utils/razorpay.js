// Razorpay utility functions

export const initializeRazorpay = (options) => {
    return new Promise((resolve, reject) => {
        if (typeof window.Razorpay === 'undefined') {
            reject(new Error('Razorpay SDK not loaded'));
            return;
        }

        try {
            const rzp = new window.Razorpay(options);
            rzp.open();
            resolve(rzp);
        } catch (error) {
            reject(error);
        }
    });
};

export const createRazorpayOptions = (orderData) => {
    return {
        key: 'rzp_live_RepxCmn4eqow4z', // Live Razorpay key
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency || 'INR',
        name: 'Lavender Silver',
        description: orderData.description,
        order_id: orderData.transaction_id,
        handler: function (response) {
            // Payment successful
            return response;
        },
        prefill: {
            name: orderData.customer_name,
            contact: orderData.customer_phone,
            email: orderData.customer_email
        },
        theme: {
            color: '#0E593C'
        },
        modal: {
            ondismiss: function () {
            }
        }
    };
}; 