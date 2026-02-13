import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './hero.css';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // For loading spinner
import banner1 from '../../assets/img/banner/hero-banner1.jpg';
import banner2 from '../../assets/img/banner/hero-banner2.jpg';
import banner3 from '../../assets/img/banner/hero-banner3.jpg';
import { getResponsiveImage } from '../../utils/responsiveImage';


const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const Hero = () => {
  const [desktopSlides, setDesktopSlides] = useState([]);
  const [mobileSlides, setMobileSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const staticBanners = [
    { id: 'static-1', image: banner1, alt: 'Banner 1' },
    { id: 'static-2', image: banner2, alt: 'Banner 2' },
    { id: 'static-3', image: banner3, alt: 'Banner 3' },
  ];

  // Check screen size and update mobile state
  useEffect(() => {
    let resizeTimeout;
    const checkScreenSize = () => {
      // Throttle resize handler to reduce forced reflows
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }

      resizeTimeout = requestAnimationFrame(() => {
        const newIsMobile = window.innerWidth < 768;
        setIsMobile(newIsMobile);
      });
    };

    // Initial check
    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        // Fetch desktop banners
        const desktopRes = await axios.get(`${API_BASE_URL}/api/home-banners/device/desktop`);
        // Fetch mobile banners
        const mobileRes = await axios.get(`${API_BASE_URL}/api/home-banners/device/mobile`);

        // Process desktop banners
        if (desktopRes.data.success && Array.isArray(desktopRes.data.data)) {
          const activeDesktopBanners = desktopRes.data.data.filter(banner => banner.is_active);
          if (activeDesktopBanners.length > 0) {
            const formattedDesktopSlides = activeDesktopBanners.map(banner => ({
              id: banner.id,
              image: `${API_BASE_URL}${banner.image_url}`,
              alt: banner.alt_text || 'Desktop Banner',
              device_type: 'desktop'
            }));
            setDesktopSlides(formattedDesktopSlides);
          } else {
            setDesktopSlides(staticBanners);
          }
        } else {
          setDesktopSlides(staticBanners);
        }

        // Process mobile banners
        if (mobileRes.data.success && Array.isArray(mobileRes.data.data)) {
          const activeMobileBanners = mobileRes.data.data.filter(banner => banner.is_active);
          if (activeMobileBanners.length > 0) {
            const formattedMobileSlides = activeMobileBanners.map(banner => ({
              id: banner.id,
              image: `${API_BASE_URL}${banner.image_url}`, // Optimization will be added in render
              alt: banner.alt_text || 'Mobile Banner',
              device_type: 'mobile'
            }));
            setMobileSlides(formattedMobileSlides);
          } else {
            setMobileSlides(staticBanners);
          }
        } else {
          setMobileSlides(staticBanners);
        }
      } catch (error) {
        // Only log actual errors, not 404s for missing banners (which is expected)
        if (error.response?.status !== 404) {
          console.error("Failed to fetch banners:", error);
        }
        setDesktopSlides(staticBanners);
        setMobileSlides(staticBanners);
      }
      setLoading(false);
    };

    fetchBanners();
  }, []);

  // Get current slides based on device type
  const currentSlides = isMobile ? mobileSlides : desktopSlides;

  useEffect(() => {
    if (!isPaused && currentSlides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % currentSlides.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isPaused, currentSlides.length]);

  // Reset current slide when switching between desktop/mobile
  useEffect(() => {
    setCurrentSlide(0);
  }, [isMobile]);

  const goToSlide = (index) => {
    if (currentSlides.length > 0) {
      setCurrentSlide(index);
    }
  };

  const getPrevSlide = () => {
    if (currentSlides.length === 0) return 0;
    return currentSlide === 0 ? currentSlides.length - 1 : currentSlide - 1;
  };

  const getNextSlide = () => {
    if (currentSlides.length === 0) return 0;
    return currentSlide === currentSlides.length - 1 ? 0 : currentSlide + 1;
  };

  if (loading) {
    return (
      <div className="hero-wrapper hero-loading">
        <Loader2 className="spin" size={48} />
      </div>
    );
  }

  return (
    <div className={`hero-wrapper ${isMobile ? 'mobile-view' : 'desktop-view'}`}>
      <Link to="/shop" className="hero-banner-link">
        <div
          className="hero-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="carousel-container">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {/* Desktop Banners - Only show on desktop */}
              {!isMobile && desktopSlides.map((slide) => {
                const isBackendImage = slide.image?.includes('backend.pvjewellers.in') || (slide.image?.startsWith('/') && !slide.image?.startsWith('/assets'));
                const imageConfig = isBackendImage ? getResponsiveImage(slide.image, { thumbnail: 600, card: 900, full: 1000, quality: 50 }) : { src: slide.image, srcSet: undefined };
                return (
                  <div key={slide.id} className="carousel-slide desktop">
                    <img
                      src={imageConfig.src}
                      srcSet={imageConfig.srcSet}
                      sizes="100vw"
                      alt={slide.alt}
                      className="banner-image"
                      loading={currentSlide === 0 ? "eager" : "lazy"}
                      decoding="async"
                      width="1920"
                      height="600"
                    />
                  </div>
                );
              })}

              {/* Mobile Banners - Only show on mobile */}
              {isMobile && mobileSlides.map((slide) => {
                const isBackendImage = slide.image?.includes('backend.pvjewellers.in') || (slide.image?.startsWith('/') && !slide.image?.startsWith('/assets'));
                const imageConfig = isBackendImage ? getResponsiveImage(slide.image, { thumbnail: 400, card: 600, full: 700, quality: 50 }) : { src: slide.image, srcSet: undefined };
                return (
                  <div key={slide.id} className="carousel-slide mobile">
                    <img
                      src={imageConfig.src}
                      srcSet={imageConfig.srcSet}
                      sizes="100vw"
                      alt={slide.alt}
                      className="banner-image"
                      loading={currentSlide === 0 ? "eager" : "lazy"}
                      decoding="async"
                      width="768"
                      height="400"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Link>

      {/* Side Dots Navigation */}
      <div className="side-dots-navigation">
        <button
          className="dot-left"
          onClick={() => goToSlide(getPrevSlide())}
          aria-label="Go to previous banner"
        ></button>
        <button className="dot dot-center active" aria-label={`Current banner ${currentSlide + 1} of ${currentSlides.length}`}>
          <span className="dot-number">{currentSlide + 1}/{currentSlides.length}</span>
        </button>
        <button
          className="dot-right"
          onClick={() => goToSlide(getNextSlide())}
          aria-label="Go to next banner"
        ></button>
      </div>
    </div>
  );
};

export default Hero;