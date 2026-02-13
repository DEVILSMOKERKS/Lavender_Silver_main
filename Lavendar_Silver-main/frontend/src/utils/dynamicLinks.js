import axios from 'axios';

let linksCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getDynamicLinks = async () => {
    const now = Date.now();

    if (linksCache && (now - lastFetchTime) < CACHE_DURATION) {
        return linksCache;
    }

    try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${API_BASE_URL}/api/home-banners/social-links`);
        const socialLinks = response.data.success ? response.data.data : [];

        const instagramLink = socialLinks.find(link => link.platform === 'Instagram' && link.is_active)?.link;
        const facebookLink = socialLinks.find(link => link.platform === 'Facebook' && link.is_active)?.link;
        const youtubeLink = socialLinks.find(link => link.platform === 'YouTube' && link.is_active)?.link;
        const twitterLink = socialLinks.find(link => (link.platform === 'Twitter' || link.platform === 'YouTube') && link.is_active)?.link;
        const whatsappLink = socialLinks.find(link => link.platform === 'Phone Number' && link.is_active)?.link;
        const emailLink = socialLinks.find(link => link.platform === 'Email' && link.is_active)?.link;
        const websiteLink = socialLinks.find(link => link.platform === 'Website' && link.is_active)?.link;
        const addressLink = socialLinks.find(link => link.platform === 'Address' && link.is_active)?.link;

        linksCache = {
            instagram: instagramLink || 'https://www.instagram.com/pvjewellersandsons/?hl=en',
            facebook: facebookLink || 'https://facebook.com/pvjjewellers',
            youtube: youtubeLink || 'https://youtube.com/@pvjjewellers',
            twitter: twitterLink || 'https://twitter.com/pvjjewellers',
            whatsapp: whatsappLink || '+919829034926',
            email: emailLink || 'p.v.jewellersnsons.sks@gmail.com',
            website: websiteLink || 'https://pvjjewellers.com',
            address: addressLink || 'Amrapali Circle, Vaishali Nagar, Jaipur, India, Rajasthan'
        };

        lastFetchTime = now;
        return linksCache;
    } catch (error) {
        console.error('Failed to fetch dynamic links:', error);

        return {
            instagram: 'https://www.instagram.com/pvjewellersandsons/?hl=en',
            facebook: 'https://facebook.com/pvjjewellers',
            youtube: 'https://youtube.com/@pvjjewellers',
            twitter: 'https://twitter.com/pvjjewellers',
            whatsapp: '+919829034926',
            email: 'p.v.jewellersnsons.sks@gmail.com',
            website: 'https://pvjjewellers.com',
            address: 'Amrapali Circle, Vaishali Nagar, Jaipur, India, Rajasthan'
        };
    }
};

export const getWhatsAppURL = (phoneNumber, message = "Hello! I'm interested in PVJ Jewellery collection. Can you help me?") => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};

export const getTelURL = (phoneNumber) => {
    return `tel:${phoneNumber}`;
};

export const getMailtoURL = (email) => {
    return `mailto:${email}`;
};


export const getGoogleMapsURL = () => {
    // Returns a static clickable Google Maps link for PVJ Jewellers & Sons
    return "https://www.google.com/maps/place/P+V+Jewellers+%26+Sons/@26.910673,75.6722642,17z/data=!3m1!4b1!4m6!3m5!1s0x396db49dcab22e65:0xc92c680188db4f38!8m2!3d26.910673!4d75.674453!16s%2Fg%2F11b7y2rbg0?entry=ttu";
};
