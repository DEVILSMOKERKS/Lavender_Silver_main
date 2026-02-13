import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './clientCarousel.css';
import clientImage1 from '../../assets/img/client-diary/young-model-demonstrating-expensive-jewelry_compressed.jpg';
import clientImage2 from '../../assets/img/client-diary/model-demonstrating-bracelet-isolated-gray_compressed.jpg';
import clientImage3 from '../../assets/img/client-diary/green-gemstone-pendant-woman-s-neck_compressed.jpg';
import clientImage4 from '../../assets/img/client-diary/fashion-portrait-woman-tropical-luxury-villa-wearing-white-stylish-blazer-jewellery-tropical-leaves_compressed.jpg';
import clientImage5 from '../../assets/img/client-diary/closeup-shot-female-wearing-beautiful-silver-necklace-with-diamond-pendant_compressed.jpg';
import { getResponsiveImage } from '../../utils/responsiveImage';

const ClientCarousel = () => {
  const scrollRef = useRef(null);
  const [clientImages, setClientImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch client diary images from API
  useEffect(() => {
    const fetchClientImages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/client-diary`);

        if (response.data.success && response.data.data && response.data.data.length > 0) {
          setClientImages(response.data.data);
        } else {
          setClientImages(getFallbackImages());
        }
      } catch (error) {
        console.error('Error fetching client diary images:', error);
        setClientImages(getFallbackImages());
      } finally {
        setLoading(false);
      }
    };

    fetchClientImages();
  }, [API_BASE_URL]);

  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || clientImages.length === 0) return;

    let scrollPosition = 0;
    let direction = 1; // 1 for down (bottom to top), -1 for up (top to bottom)
    const scrollSpeed = 1;

    const scroll = () => {
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      const maxScrollTop = scrollHeight - clientHeight;

      scrollPosition += direction * scrollSpeed;

      // Change direction when reaching boundaries
      if (scrollPosition >= maxScrollTop) {
        direction = -1; // Start scrolling up (top to bottom)
      } else if (scrollPosition <= 0) {
        direction = 1; // Start scrolling down (bottom to top)
      }

      scrollContainer.scrollTop = scrollPosition;
    };

    const intervalId = setInterval(scroll, 120);

    return () => clearInterval(intervalId);
  }, [clientImages]);

  // Fallback images when no database images are available
  const getFallbackImages = () => [
    {
      id: 1,
      image_url: clientImage1,
      alt_text: "Young model demonstrating expensive jewelry",
      size: "large"
    },
    {
      id: 2,
      image_url: clientImage2,
      alt_text: "Model demonstrating bracelet",
      size: "medium"
    },
    {
      id: 3,
      image_url: clientImage3,
      alt_text: "Green gemstone pendant on woman's neck",
      size: "small"
    },
    {
      id: 4,
      image_url: clientImage4,
      alt_text: "Fashion portrait woman with jewelry",
      size: "medium"
    },
    {
      id: 5,
      image_url: clientImage5,
      alt_text: "Closeup shot female wearing beautiful silver necklace",
      size: "large"
    },
    {
      id: 6,
      image_url: clientImage1,
      alt_text: "Young model demonstrating expensive jewelry",
      size: "small"
    },
    {
      id: 7,
      image_url: clientImage2,
      alt_text: "Model demonstrating bracelet",
      size: "medium"
    },
    {
      id: 8,
      image_url: clientImage3,
      alt_text: "Green gemstone pendant on woman's neck",
      size: "large"
    },
    {
      id: 9,
      image_url: clientImage4,
      alt_text: "Fashion portrait woman with jewelry",
      size: "small"
    },
    {
      id: 10,
      image_url: clientImage5,
      alt_text: "Closeup shot female wearing beautiful silver necklace",
      size: "medium"
    },
    {
      id: 11,
      image_url: clientImage1,
      alt_text: "Young model demonstrating expensive jewelry",
      size: "large"
    },
    {
      id: 12,
      image_url: clientImage2,
      alt_text: "Model demonstrating bracelet",
      size: "small"
    }
  ];

  // Helper function to get image URL with optimization
  const getImageUrl = (imageUrl) => {
    // If it's already a full URL (http/https), return as is
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    // If it's an imported image (string path), return as is
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('/')) {
      return imageUrl;
    }
    // Otherwise, prepend API base URL and add optimization
    const baseUrl = `${API_BASE_URL}${imageUrl}`;
    const isBackendImage = imageUrl?.includes('backend.pvjewellers.in') || (imageUrl?.startsWith('/') && !imageUrl?.startsWith('/assets'));
    if (isBackendImage) {
      return getResponsiveImage(baseUrl, { thumbnail: 400, card: 400, full: 400, quality: 55 }).src;
    }
    return baseUrl;
  };

  // Helper function to get image size class
  const getImageSize = (index) => {
    const sizes = ['large', 'medium', 'small'];
    return sizes[index % sizes.length];
  };

  if (loading) {
    return (
      <div className="client-carousel-container">
        <div className="carousel-loading">
          <p>Loading client images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-carousel-container">
      <div className="carousel-content" ref={scrollRef}>
        <div className="client-grid">
          {clientImages.map((image, index) => (
            <div key={image.id} className={`client-image-card ${image.size || getImageSize(index)}`}>
              <img
                src={getImageUrl(image.image_url)}
                srcSet={image.image_url?.includes('backend.pvjewellers.in') || (image.image_url?.startsWith('/') && !image.image_url?.startsWith('/assets'))
                  ? getResponsiveImage(`${API_BASE_URL}${image.image_url}`, { thumbnail: 300, card: 400, full: 600, quality: 55 }).srcSet
                  : undefined}
                sizes="(max-width: 768px) 300px, 400px"
                alt={image.alt_text || 'Client diary image'}
                className="client-image"
                loading="lazy"
                decoding="async"
                width="400"
                height="600"
              />
              <div className="image-overlay"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-header">
        <div className="carousel-title-wrapper">
          <span className="carousel-title-line"></span>
          <h2 className="carousel-title">PVJ CLIENT DIARIES</h2>
          <span className="carousel-title-line"></span>
        </div>
        <p className="carousel-subtitle">
          Share Your #PvjJewellersExperience And Inspire Others With Your Story!
        </p>
        <a href="/contact" className="share-story-btn">
          Join PVJ Jewellers
        </a>
      </div>
    </div>
  );
};

export default ClientCarousel;