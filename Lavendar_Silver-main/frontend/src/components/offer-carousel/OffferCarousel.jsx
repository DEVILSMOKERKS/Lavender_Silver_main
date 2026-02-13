import React, { useRef, useState, useEffect } from 'react';
import './offerCarousel.css';
import banner1 from '../../assets/img/banner/offer1.jpg';
import banner2 from '../../assets/img/banner/offer2.jpg';
import banner3 from '../../assets/img/banner/offer3.jpg';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from 'react-router-dom';
import axios from 'axios';
import productImage from '../../assets/img/product_image.png';
import { getResponsiveImage } from '../../utils/responsiveImage';

const OffferCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const slideRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch carousel items from API
  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/offer-carousel`);
        // Handle the new API response structure
        const carouselData = response.data.success ? response.data.data : response.data;

        if (carouselData && carouselData.length > 0) {
          // Transform the response to match the expected format
          const formattedSlides = carouselData.map(item => ({
            id: item.id,
            title: item.title,
            image: item.imageUrl || item.image_url ? `${API_BASE_URL}${item.imageUrl || item.image_url}` : '',
            alt: item.title || 'Offer Image'
          }));
          setSlides(formattedSlides);
        } else {
          // Use static banners when no data is available
          setSlides([
            { id: 1, image: banner1, alt: 'Special Offer 1' },
            { id: 2, image: banner2, alt: 'Special Offer 2' },
            { id: 3, image: banner3, alt: 'Special Offer 3' }
          ]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching carousel items:', err);
        // Use static banners when API fails
        setSlides([
          { id: 1, image: banner1, alt: 'Special Offer 1' },
          { id: 2, image: banner2, alt: 'Special Offer 2' },
          { id: 3, image: banner3, alt: 'Special Offer 3' }
        ]);
        setLoading(false);
      }
    };

    fetchCarouselItems();
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const offerSettings = {
    dots: false,
    arrows: false,
    speed: 500,
    slidesToShow: isMobile ? 1 : 2,
    slidesToScroll: 1,
    autoplay: false,
    infinite: true,
    beforeChange: (currentIndex, nextIndex) => setCurrentSlide(nextIndex),
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  const totalSlides = slides.length;

  // Fix accessibility: Remove focusability from links in hidden slides
  useEffect(() => {
    const fixHiddenSlideLinks = () => {
      const hiddenSlides = document.querySelectorAll('.slick-slide[aria-hidden="true"]');
      hiddenSlides.forEach((slide) => {
        const links = slide.querySelectorAll('a');
        links.forEach((link) => {
          link.setAttribute('tabindex', '-1');
        });
      });

      // Re-enable focusability for visible slides
      const visibleSlides = document.querySelectorAll('.slick-slide:not([aria-hidden="true"])');
      visibleSlides.forEach((slide) => {
        const links = slide.querySelectorAll('a');
        links.forEach((link) => {
          link.removeAttribute('tabindex');
        });
      });
    };

    // Run on mount and when slides change
    if (slideRef.current) {
      fixHiddenSlideLinks();

      // Also run after slider updates (using MutationObserver or timeout)
      const observer = new MutationObserver(fixHiddenSlideLinks);
      const sliderContainer = slideRef.current?.innerSlider?.list;
      if (sliderContainer) {
        observer.observe(sliderContainer, {
          attributes: true,
          attributeFilter: ['aria-hidden'],
          subtree: true
        });
      }

      // Fallback: Run on slide change
      const interval = setInterval(fixHiddenSlideLinks, 100);

      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }
  }, [slides, currentSlide]);

  return (
    <div className="offcaro">
      {loading ? (
        <div className="offcaro-loading">
          <div className="offcaro-skeleton">
            <div className="offcaro-skeleton-img"></div>
            <div className="offcaro-skeleton-content"></div>
          </div>
        </div>
      ) : error ? (
        <div className="offcaro-error">
          <p>{error}</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="offcaro-empty">
          <p>No offers available at the moment</p>
        </div>
      ) : (
        <>
          <div className="offcaro-cards">
            <Slider ref={slideRef} {...offerSettings}>
              {slides.map((slide) => (
                <div key={slide.id} className="offcaro-card">
                  <Link
                    to="/shop"
                    style={{ display: 'block', height: '100%' }}
                    data-discover="true"
                  >
                    <div className="offcaro-img-container">
                      <img
                        src={slide.image?.includes('backend.pvjewellers.in') || (slide.image?.startsWith('/') && !slide.image?.startsWith('/assets'))
                          ? getResponsiveImage(slide.image, { thumbnail: isMobile ? 600 : 800, card: 600, full: 800, quality: 75 }).src
                          : slide.image}
                        srcSet={slide.image?.includes('backend.pvjewellers.in') || (slide.image?.startsWith('/') && !slide.image?.startsWith('/assets'))
                          ? getResponsiveImage(slide.image, { thumbnail: 400, card: 600, full: 800, quality: 75 }).srcSet
                          : undefined}
                        sizes={isMobile ? "100vw" : "50vw"}
                        alt={slide.alt}
                        className="offcaro-img"
                        loading="lazy"
                        decoding="async"
                        width={isMobile ? 600 : 800}
                        height={isMobile ? 300 : 400}
                        onError={(e) => {
                          e.target.src = productImage;
                        }}
                      />
                    </div>
                  </Link>
                </div>
              ))}
            </Slider>
          </div>

          {/* Custom Dots */}
          <div className="offcaro-dots">
            {/* Previous slide */}
            <span
              className="offcaro-dot"
              onClick={() => slideRef.current?.slickPrev()}
            />

            {/* Slide counter */}
            <span className="offcaro-dot-label">
              {isMobile ? `${currentSlide + 1}/${totalSlides}` : `${Math.floor(currentSlide / 2) + 1}/${Math.ceil(totalSlides / 2)}`}
            </span>

            {/* Next slide */}
            <span
              className="offcaro-dot"
              onClick={() => slideRef.current?.slickNext()}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default OffferCarousel;