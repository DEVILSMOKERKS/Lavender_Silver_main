import React, { useState, useEffect } from "react";
import { IoLogoInstagram } from "react-icons/io5";
import axios from 'axios';
import diamondImg from "../../assets/img/icons/diamond.png";
import necklace from "../../assets/img/necklace.jpg";
import floralRing from "../../assets/img/floral-ring.jpg";
import silverBangle from "../../assets/img/silver-bangle.jpg";
import tops from "../../assets/img/tops.jpg";
import earRing from "../../assets/img/ear-ring2.jpg";
import bracelet from "../../assets/img/bracelet.jpg";
import meenakariBangle from "../../assets/img/meenakari-bangle.jpg";
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './Instagram.css';

const InstagramSection = () => {
  const staticImages = [
    {
      img: necklace,
      alt: "Stylish Necklace",
      link: "https://www.instagram.com/p/Cnecklace"
    },
    {
      img: floralRing,
      alt: "Floral Ring Design",
      link: "https://www.instagram.com/p/Cfloralring"
    },
    {
      img: silverBangle,
      alt: "Elegant Silver Bangle",
      link: "https://www.instagram.com/p/Csilverbangle"
    },
    {
      img: tops,
      alt: "Trendy Tops",
      link: "https://www.instagram.com/p/Ctops"
    },
    {
      img: earRing,
      alt: "Beautiful Earrings",
      link: "https://www.instagram.com/p/Cearrings"
    },
    {
      img: bracelet,
      alt: "Designer Bracelet",
      link: "https://www.instagram.com/p/Cbracelet"
    },
    {
      img: meenakariBangle,
      alt: "Meenakari Bangle",
      link: "https://www.instagram.com/p/Cmeenakari"
    }
  ];

  const [instagramImages, setInstagramImages] = useState(staticImages);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstagramImages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/home-banners/instagram-images`);

        if (response.data && response.data.data && response.data.data.length > 0) {
          const apiImages = response.data.data
            .filter(item => {
              const isActive = item.is_active === true || item.is_active === 1 || item.is_active === '1';
              return isActive && (item.image_url || item.image);
            })
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(item => {
              const imageUrl = item.image_url || item.image;
              let fullImageUrl = imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')
                ? `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
                : imageUrl;

              if (fullImageUrl && typeof fullImageUrl === 'string') {
                fullImageUrl = fullImageUrl.split('?')[0];
              }

              return {
                url: fullImageUrl,
                alt: item.alt_text || 'Instagram post',
                link: item.link || 'https://www.instagram.com'
              };
            });

          setInstagramImages(apiImages.length > 0 ? apiImages : staticImages);
        } else {
          setInstagramImages(staticImages);
        }
      } catch (error) {
        console.error('Error fetching Instagram images:', error);
        setInstagramImages(staticImages);
      } finally {
        setLoading(false);
      }
    };

    fetchInstagramImages();
  }, []);

  if (loading) {
    return (
      <div className="instagram-follow-section-wrapper" style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>Loading Instagram feed...</div>
      </div>
    );
  }

  const getFullImageUrl = (img) => {
    if (img && typeof img === 'object' && img.img) {
      return img.img;
    }

    let url = typeof img === 'string' ? img : img?.url || img?.image_url || img?.image;

    if (!url) return null;

    if (typeof url === 'string') {
      if (!url.startsWith('http') && !url.startsWith('data:')) {
        url = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }

      return url.split('?')[0];
    }

    return null;
  };

  return (
    <div className="instagram-follow-section-wrapper">
      <div className="instagram-follow-container">
        <div className="instagram-header">
          <div className="instagram-logo-container">
            <img
              src={diamondImg}
              alt="Diamond Logo"
              className="instagram-diamond-img"
              width="100"
              height="100"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="instagram-header-title-wrapper">
            <span className="instagram-header-line"></span>
            <h2>
              Follow Us On
              <span className="instagram-heading-instagram-word" style={{ fontWeight: 400, fontFamily: "var(--font-primary)", marginLeft: '4px' }}>
                Instagram
              </span>
            </h2>
            <span className="instagram-header-line"></span>
          </div>
          <p className="instagram-get-inspired">
            Get Inspired By Our Latest Collections And Customer Stories
          </p>
        </div>

        <div className="instagram-handle">
          <a href="https://www.instagram.com/pvjewellersandsons/?hl=en" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
            <IoLogoInstagram size={20} />
            @PVJ Instagram
          </a>
        </div>

        <div className="instagram-swiper-carousel" style={{ width: '100%', margin: '0 auto' }}>
          <Swiper
            spaceBetween={16}
            slidesPerView={6}
            breakpoints={{
              1400: { slidesPerView: 6 },
              1200: { slidesPerView: 6 },
              1024: { slidesPerView: 6 },
              900: { slidesPerView: 4 },
              768: { slidesPerView: 3 },
              600: { slidesPerView: 2 },
              0: { slidesPerView: 1 }
            }}
          >
            {instagramImages.slice(0, 6).map((image, index) => {
              const imageUrl = getFullImageUrl(image);
              const altText = typeof image === 'object' ? (image.alt || `Instagram post ${index + 1}`) : `Instagram post ${index + 1}`;

              if (!imageUrl) {
                console.error(`Invalid image URL at index ${index}:`, image);
                return null;
              }


              const cleanImageUrl = imageUrl?.split('?')[0] || imageUrl;

              const imageContent = (
                <div className="instagram-image-container">
                  <img
                    src={cleanImageUrl}
                    alt={altText}
                    className="instagram-image"
                    loading="lazy"
                    decoding="async"
                    width="200"
                    height="200"
                    onError={(e) => {
                      console.error('Failed to load image:', cleanImageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="instagram-overlay">
                    <IoLogoInstagram size={24} className="instagram-overlay-icon" />
                  </div>
                </div>
              );

              return (
                <SwiperSlide key={index}>
                  {image.link ? (
                    <a href={image.link} target="_blank" rel="noopener noreferrer nofollow" style={{ textDecoration: 'none' }}>
                      {imageContent}
                    </a>
                  ) : (
                    imageContent
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
        <div className="instagram-gallery-grid">
          {instagramImages.slice(0, 8).map((image, index) => {
            const imageUrl = getFullImageUrl(image);
            const altText = typeof image === 'object' ? (image.alt || `Instagram post ${index + 1}`) : `Instagram post ${index + 1}`;

            if (!imageUrl) {
              console.error(`Invalid grid image URL at index ${index}:`, image);
              return null;
            }


            const cleanImageUrl = imageUrl?.split('?')[0] || imageUrl;

            if (image.link) {
              return (
                <a key={index} href={image.link} target="_blank" rel="noopener noreferrer nofollow" style={{ textDecoration: 'none' }}>
                  <div className="instagram-image-container">
                    <img
                      src={cleanImageUrl}
                      alt={altText}
                      className="instagram-image"
                      loading="lazy"
                      decoding="async"
                      width="200"
                      height="200"
                      onError={(e) => {
                        console.error('Failed to load image:', cleanImageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="instagram-overlay">
                      <IoLogoInstagram size={24} className="instagram-overlay-icon" />
                    </div>
                  </div>
                </a>
              );
            }

            return (
              <div key={index} className="instagram-image-container">
                <img
                  src={cleanImageUrl}
                  alt={altText}
                  className="instagram-image"
                  loading="lazy"
                  decoding="async"
                  width="200"
                  height="200"
                  onError={(e) => {
                    console.error('Failed to load image:', cleanImageUrl);
                    e.target.style.display = 'none';
                  }}
                />
                <div className="instagram-overlay">
                  <IoLogoInstagram size={24} className="instagram-overlay-icon" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InstagramSection;
