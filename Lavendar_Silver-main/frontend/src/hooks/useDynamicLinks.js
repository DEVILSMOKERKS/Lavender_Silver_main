import { useState, useEffect } from 'react';
import { getDynamicLinks } from '../utils/dynamicLinks';

export const useDynamicLinks = () => {
    const [links, setLinks] = useState({
        instagram: 'https://www.instagram.com/pvjewellersandsons/?hl=en',
        facebook: 'https://facebook.com/pvjjewellers',
        youtube: 'https://youtube.com/@pvjjewellers',
        whatsapp: '+919829034926',
        email: 'p.v.jewellersnsons.sks@gmail.com',
        website: 'https://pvjjewellers.com',
        address: 'Amrapali Circle, Vaishali Nagar, , Jaipur, India, Rajasthan'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLinks = async () => {
            try {
                const dynamicLinks = await getDynamicLinks();
                setLinks(dynamicLinks);
            } catch (error) {
                console.error('Error loading dynamic links:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLinks();
    }, []);

    return { links, loading };
};
