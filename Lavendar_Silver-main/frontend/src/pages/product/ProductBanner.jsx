import React, { useEffect, useState } from "react";
import "./productBanner.css";
import bannerImg from "../../assets/img/golden-rate.png";
import axios from "axios";

const ProductBanner = () => {
  const [bannerData, setBannerData] = useState(null);
  const [deviceType, setDeviceType] = useState('desktop');

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Detect device type
    const detectDeviceType = () => {
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    };

    setDeviceType(detectDeviceType());

    // Listen for resize events
    const handleResize = () => {
      setDeviceType(detectDeviceType());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/product-banner?device_type=${deviceType}`);
        setBannerData(response.data);
      } catch (error) {
        // Only log actual errors, not 404s for missing banners (which is expected)
        if (error.response?.status !== 404) {
          console.error('Error fetching banner data:', error);
        }
        // fallback will be used
      }
    };

    fetchBannerData();
  }, [deviceType]);

  // ✅ Fallback values
  const title = bannerData?.data?.title || "Timeless Treasures, Perfectly Crafted";
  const subtitle = bannerData?.data?.subtitle || "Explore our curated collection of fine jewellery, designed to celebrate every moment and memory.";
  const backgroundImage = bannerData?.data?.background_image ? API_BASE_URL + bannerData.data.background_image : bannerImg;

  return (
    <div
      className="product-banner"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="product-banner-overlay">
        <div className="product-banner-content">
          <h1 className="product-banner-title">{title}</h1>
          <p className="product-banner-subtitle">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductBanner;
