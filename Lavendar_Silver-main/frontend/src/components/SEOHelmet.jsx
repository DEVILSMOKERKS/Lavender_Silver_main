import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export const SEO_META = {
    "/": { title: "Lavender Silver - Premium Jewelry Store", description: "Explore premium gold and diamond jewelry at Lavender Silver. Book consultations, shop online, and get expert support." },
    "/shop": { title: "Shop Jewelry Online - Lavender Silver", description: "Browse and shop gold, diamond, and designer jewelry at Lavender Silver. Find rings, necklaces, earrings, and more." },
    "/About-us": { title: "About Lavender Silver", description: "Learn about Lavender Silver, our story, values, and commitment to quality jewelry and customer service." },
    "/signup": { title: "Sign Up - Lavender Silver", description: "Create your Lavender Silver account to shop, book consultations, and access exclusive offers." },
    "/contact": { title: "Contact Us - Lavender Silver", description: "Contact Lavender Silver for support, questions, or to book a jewelry consultation." },
    "/blogs": { title: "Jewelry Blog - Lavender Silver", description: "Read the latest jewelry trends, tips, and stories on the Lavender Silver blog." },
    "/blog/:blogslug": { title: "Jewelry Blog - Lavender Silver", description: "Read the latest jewelry trends, tips, and stories on the Lavender Silver blog." },
    "/carts": { title: "Your Cart - Lavender Silver", description: "View and manage your shopping cart at Lavender Silver. Checkout securely online." },
    "/checkout": { title: "Checkout - Lavender Silver", description: "Complete your jewelry purchase securely at Lavender Silver. Enter your details and proceed to payment." },
    "/product/:productName": { title: "Product Details - Lavender Silver", description: "View details, specifications, and reviews for this jewelry product at Lavender Silver." },
    "/myaccount": { title: "My Account - Lavender Silver", description: "Manage your Lavender Silver account, orders, and personal information." },
    "/privacy-policy": { title: "Privacy Policy - Lavender Silver", description: "Read Lavender Silver's privacy policy and learn how we protect your data." },
    "/terms-and-conditions": { title: "Terms & Conditions - Lavender Silver", description: "Read the terms and conditions for using the Lavender Silver website and services." },
    "/return-and-cancellation": { title: "Return & Cancellation - Lavender Silver", description: "Learn about Lavender Silver's return and cancellation policy for jewelry orders." },
    "/faq": { title: "FAQ - Lavender Silver", description: "Frequently asked questions about Lavender Silver jewelry, orders, and services." },
    "/video-cart": { title: "Video Cart - Lavender Silver", description: "Schedule a personalized video consultation for your jewelry selection at Lavender Silver." },
    "/video-cart/booking": { title: "Book Video Consultation - Lavender Silver", description: "Book your personalized video consultation with a Lavender Silver jewelry expert." },
    "/video-cart/thankyou": { title: "Thank You - Lavender Silver", description: "Thank you for booking your video consultation with Lavender Silver." },
    "/thankyou": { title: "Thank You - Lavender Silver", description: "Thank you for your order or action at Lavender Silver." },
    "/wishlist": { title: "Wishlist - Lavender Silver", description: "View and manage your jewelry wishlist at Lavender Silver." },
    "/old-gold": { title: "Old Gold Exchange - Lavender Silver", description: "Exchange your old gold for new jewelry at Lavender Silver. Get the best value and service." },
    "/goldmine": { title: "GoldMine - Lavender Silver", description: "Explore Lavender Silver's GoldMine savings and investment plans for jewelry lovers." },
    "/digital-gold": { title: "Digital Gold - Lavender Silver", description: "Buy, sell, and manage digital gold securely with Lavender Silver." },
    "*": { title: "Page Not Found - Lavender Silver", description: "Sorry, the page you are looking for does not exist at Lavender Silver." }
};

/**
 * SEOHelmet - Reusable SEO/meta component for all pages
 * @param {string} title
 * @param {string} description
 * @param {string} image (optional)
 * @param {string} keywords (optional)
 */
export default function SEOHelmet({ title, description, image, keywords }) {
    const location = useLocation();
    const canonical = `${window.location.origin}${location.pathname}`;
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="icon" type="image/png" href="/favicon.png" />
            <link rel="canonical" href={canonical} />
            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {image && <meta property="og:image" content={image} />}
            <meta property="og:url" content={canonical} />
            <meta property="og:type" content="website" />
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {image && <meta name="twitter:image" content={image} />}
        </Helmet>
    );
} 