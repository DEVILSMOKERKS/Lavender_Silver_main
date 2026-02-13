const db = require('../config/db');

// Facebook Pixel Event Tracker
class FacebookPixelTracker {
    constructor() {
        this.pixelConfig = null;
        this.loadPixelConfig();
    }

    // Load active Facebook Pixel configuration
    async loadPixelConfig() {
        try {
            const [configs] = await db.query(
                `SELECT * FROM facebook_pixel_config 
                 WHERE is_active = 1 AND tracking_status = 'active' 
                 LIMIT 1`
            );
            if (configs.length > 0 && configs[0].pixel_id && configs[0].access_token) {
                this.pixelConfig = configs[0];
            } else {
                this.pixelConfig = null; // Set to null if credentials are incomplete
            }
        } catch (error) {
            // Silently handle database errors - don't crash the application
            console.error('Error loading Facebook Pixel config:', error.message);
            this.pixelConfig = null;
        }
    }

    // Check if event tracking is enabled
    isEventEnabled(eventName) {
        if (!this.pixelConfig || !this.pixelConfig.event_tracking) {
            return false;
        }

        try {
            const eventTracking = JSON.parse(this.pixelConfig.event_tracking);
            return eventTracking[eventName] === true;
        } catch (error) {
            console.error('Error parsing event tracking config:', error);
            return false;
        }
    }

    // Track Add to Cart event
    async trackAddToCart(userId, productId, productName, price, quantity = 1) {
        // Check if pixel config exists and is valid
        if (!this.pixelConfig || !this.pixelConfig.pixel_id || !this.pixelConfig.access_token) {
            return; // Silently return if credentials are not configured
        }

        if (!this.isEventEnabled('addToCart')) {
            return;
        }

        try {
            const eventData = {
                event: 'AddToCart',
                pixel_id: this.pixelConfig.pixel_id,
                user_id: userId,
                product_id: productId,
                product_name: productName,
                price: price,
                quantity: quantity,
                timestamp: new Date().toISOString()
            };

            // Log the event (you can extend this to send to Facebook API)

            // Here you would typically send this data to Facebook's Conversion API
            // await this.sendToFacebookAPI(eventData);

        } catch (error) {
            // Silently handle errors - don't crash the application
            console.error('Error tracking AddToCart event:', error.message);
        }
    }

    // Track Add to Wishlist event
    async trackAddToWishlist(userId, productId, productName, price) {
        // Check if pixel config exists and is valid
        if (!this.pixelConfig || !this.pixelConfig.pixel_id || !this.pixelConfig.access_token) {
            return; // Silently return if credentials are not configured
        }

        if (!this.isEventEnabled('addToWishlist')) {
            return;
        }

        try {
            const eventData = {
                event: 'AddToWishlist',
                pixel_id: this.pixelConfig.pixel_id,
                user_id: userId,
                product_id: productId,
                product_name: productName,
                price: price,
                timestamp: new Date().toISOString()
            };


        } catch (error) {
            // Silently handle errors - don't crash the application
            console.error('Error tracking AddToWishlist event:', error.message);
        }
    }

    // Track Purchase event
    async trackPurchase(userId, orderId, orderNumber, totalAmount, currency = 'INR') {
        // Check if pixel config exists and is valid
        if (!this.pixelConfig || !this.pixelConfig.pixel_id || !this.pixelConfig.access_token) {
            return; // Silently return if credentials are not configured
        }

        if (!this.isEventEnabled('purchase')) {
            return;
        }

        try {
            const eventData = {
                event: 'Purchase',
                pixel_id: this.pixelConfig.pixel_id,
                user_id: userId,
                order_id: orderId,
                order_number: orderNumber,
                value: totalAmount,
                currency: currency,
                timestamp: new Date().toISOString()
            };


        } catch (error) {
            // Silently handle errors - don't crash the application
            console.error('Error tracking Purchase event:', error.message);
        }
    }

    // Track Video Consultation event
    async trackVideoConsultation(userId, consultationId, consultationType = 'video_call') {
        // Check if pixel config exists and is valid
        if (!this.pixelConfig || !this.pixelConfig.pixel_id || !this.pixelConfig.access_token) {
            return; // Silently return if credentials are not configured
        }

        if (!this.isEventEnabled('videoConsultation')) {
            return;
        }

        try {
            const eventData = {
                event: 'VideoConsultation',
                pixel_id: this.pixelConfig.pixel_id,
                user_id: userId,
                consultation_id: consultationId,
                consultation_type: consultationType,
                timestamp: new Date().toISOString()
            };


        } catch (error) {
            // Silently handle errors - don't crash the application
            console.error('Error tracking VideoConsultation event:', error.message);
        }
    }

    // Send data to Facebook Conversion API (placeholder for future implementation)
    async sendToFacebookAPI(eventData) {
        // Check if pixel config exists and is valid before sending
        if (!this.pixelConfig || !this.pixelConfig.pixel_id || !this.pixelConfig.access_token) {
            return; // Silently return if credentials are not configured
        }

        // This is a placeholder for sending data to Facebook's Conversion API
        // You would implement this using Facebook's official SDK or API

        // Example implementation:
        // try {
        //     const response = await fetch(`https://graph.facebook.com/v17.0/${this.pixelConfig.pixel_id}/events`, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': `Bearer ${this.pixelConfig.access_token}`
        //         },
        //         body: JSON.stringify({
        //             data: [eventData],
        //             test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE // for testing
        //         })
        //     });
        //     return await response.json();
        // } catch (error) {
        //     console.error('Error sending to Facebook API:', error.message);
        //     return null;
        // }
    }

    // Reload pixel configuration (useful after updates)
    async reloadConfig() {
        await this.loadPixelConfig();
    }
}

// Create singleton instance
const facebookPixelTracker = new FacebookPixelTracker();

module.exports = facebookPixelTracker;
