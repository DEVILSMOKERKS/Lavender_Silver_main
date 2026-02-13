const axios = require('axios');

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || 'your-email@example.com';
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || 'your-password';

let shiprocketToken = null;
let tokenExpiry = null;

// Get Shiprocket authentication token
const getShiprocketToken = async () => {
    try {
        // Check if token is still valid
        if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
            return shiprocketToken;
        }

        const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
            email: SHIPROCKET_EMAIL,
            password: SHIPROCKET_PASSWORD
        });

        if (response.data && response.data.token) {
            shiprocketToken = response.data.token;
            // Set token expiry to 24 hours from now
            tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
            return shiprocketToken;
        }

        throw new Error('Failed to get Shiprocket token');
    } catch (error) {
        console.error('Shiprocket authentication error:', error.response?.data || error.message);
        throw error;
    }
};

// Create shipment in Shiprocket
const createShiprocketShipment = async (orderData) => {
    try {
        const token = await getShiprocketToken();

        // Prepare shipment data
        const shipmentData = {
            order_id: orderData.order_number,
            order_date: new Date().toISOString(),
            pickup_location: 'Primary', // You can configure this
            billing_customer_name: orderData.customer_name,
            billing_last_name: '',
            billing_address: orderData.shipping_address,
            billing_address_2: '',
            billing_city: orderData.shipping_city,
            billing_pincode: orderData.shipping_pincode,
            billing_state: orderData.shipping_state,
            billing_country: 'India',
            billing_email: orderData.customer_email,
            billing_phone: orderData.customer_phone,
            shipping_is_billing: true,
            order_items: orderData.items.map(item => ({
                name: `Product ${item.product_id}`,
                sku: `SKU-${item.product_id}`,
                units: item.quantity,
                selling_price: item.price
            })),
            payment_method: 'Prepaid',
            sub_total: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
        };

        const response = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, shipmentData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.shipment_id) {
            return response.data;
        }

        throw new Error('Failed to create Shiprocket shipment');
    } catch (error) {
        console.error('Shiprocket shipment creation error:', error.response?.data || error.message);
        throw error;
    }
};

// Get shipment tracking details
const getShipmentTracking = async (shipmentId) => {
    try {
        const token = await getShiprocketToken();

        const response = await axios.get(`${SHIPROCKET_BASE_URL}/courier/track/shipment/${shipmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Shiprocket tracking error:', error.response?.data || error.message);
        throw error;
    }
};

// Generate shipping label
const generateShippingLabel = async (shipmentId) => {
    try {
        const token = await getShiprocketToken();

        const response = await axios.get(`${SHIPROCKET_BASE_URL}/orders/print/invoice/${shipmentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Shiprocket label generation error:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = {
    createShiprocketShipment,
    getShipmentTracking,
    generateShippingLabel,
    getShiprocketToken
};
