import React, { useRef, useState, useEffect } from 'react';
import './FeaturedCategories.css';
import { Link } from 'react-router-dom';
import { MoveLeft, MoveRight } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import diamondIcon from '../../assets/img/icons/diamond.png';
import christmasStars from '../../assets/img/icons/christmas-stars.png';
import jewelryDimondIcon from "../../assets/img/icons/jewelry-diamond.png";
import { getResponsiveImage } from '../../utils/responsiveImage';

import necklace from '../../assets/img/necklace4.jpg';
import jhumka from '../../assets/img/jhumka.jpg';
import bracelet from '../../assets/img/bracelet2.jpg';
import ring from '../../assets/img/ring.jpg';
import necklace2 from '../../assets/img/necklace5.jpg';
import mangalsutra from '../../assets/img/mangalsutra2.jpg';
import pendant from '../../assets/img/kundan-pendant.jpg';
import productImage from '../../assets/img/product_image.png';

const FeaturedCategories = () => {
  const scrollContainerRef = useRef(null);
  const { token } = useUser();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // State for products data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Static fallback products - Always show 7 products
  const staticProducts = [
    {
      id: 1,
      name: "Kundan Choker Necklace with Pearl Drops",
      image: necklace,
      category_id: 1,
      subcategory_id: 1,
      category_name: 'necklaces',
      category_slug: 'necklaces',
      subcategory_name: 'traditional',
      subcategory_slug: 'traditional',
    },
    {
      id: 2,
      name: "Kundan Jhumkas",
      image: jhumka,
      category_id: 2,
      subcategory_id: 2,
      category_name: 'earrings',
      category_slug: 'earrings',
      subcategory_name: 'modern',
      subcategory_slug: 'modern',
    },
    {
      id: 3,
      name: "Floral Loop Bracelet",
      image: bracelet,
      category_id: 3,
      subcategory_id: 3,
      category_name: 'bracelets',
      category_slug: 'bracelets',
      subcategory_name: 'designer',
      subcategory_slug: 'designer',
    },
    {
      id: 4,
      name: "Polki Dome Ring",
      image: ring,
      category_id: 4,
      subcategory_id: 4,
      category_name: 'rings',
      category_slug: 'rings',
      subcategory_name: 'classic',
      subcategory_slug: 'classic',
    },
    {
      id: 5,
      name: "Vintage Gold Chain Necklace",
      image: necklace2,
      category_id: 1,
      subcategory_id: 1,
      category_name: 'necklaces',
      category_slug: 'necklaces',
      subcategory_name: 'traditional',
      subcategory_slug: 'traditional',
    },
    {
      id: 6,
      name: "Mangalsutra with Kundan Side Pendants",
      image: mangalsutra,
      category_id: 5,
      subcategory_id: 5,
      category_name: 'mangalsutra',
      category_slug: 'mangalsutra',
      subcategory_name: 'contemporary',
      subcategory_slug: 'contemporary',
    },
    {
      id: 7,
      name: "Pearl Kundan Pendant Necklace",
      image: pendant,
      category_id: 1,
      subcategory_id: 6,
      category_name: 'necklaces',
      category_slug: 'necklaces',
      subcategory_name: 'vintage',
      subcategory_slug: 'vintage',
    },
    {
      id: 8,
      name: "Gold Infinity Chain Necklace",
      image: productImage,
      category_id: 1,
      subcategory_id: 1,
      category_name: 'necklaces',
      category_slug: 'necklaces',
      subcategory_name: 'traditional',
      subcategory_slug: 'traditional',
    }
  ].slice(0, 7);

  // Fetch products from API with fallback to static data
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/home-banners/second-feature-category`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Transform API data to match component structure
        const generateSlug = (name) => {
          if (!name) return 'all';
          return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        };

        const apiProducts = response.data.data
          .filter(item => item.is_active) // Only show active items
          .slice(0, 7) // Limit to 7 items
          .map(item => ({
            id: item.id,
            name: item.title || 'Featured Product',
            image: item.image_url ? `${API_BASE_URL}${item.image_url}` : staticProducts[0].image,
            alt_text: item.alt_text || item.title || 'Product Image',
            category_id: item.category_id || 1,
            subcategory_id: item.subcategory_id || 1,
            category_name: item.category_name || 'all',
            category_slug: item.category_slug || generateSlug(item.category_name),
            subcategory_name: item.subcategory_name || 'all',
            subcategory_slug: item.subcategory_slug || generateSlug(item.subcategory_name)
          }));

        // If we have API data, use it; otherwise fallback to static
        setProducts(apiProducts.length > 0 ? apiProducts : staticProducts);
      } else {
        // No data from API, use static products
        setProducts(staticProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products from API, using static data:', error.message);
      // API failed, use static products as fallback
      setProducts(staticProducts);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [token]); 

  // Center the middle product by default
  const [centerCardIndex, setCenterCardIndex] = useState(0);

  // Detect center card on scroll and rotate container
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    const cards = container.querySelectorAll('.product-card');
    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(containerCenter - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setCenterCardIndex(closestIndex);

    // Calculate rotation based on scrollLeft
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const scrollFraction = container.scrollLeft / maxScrollLeft;
    // Rotate from -15deg to 15deg for smooth effect
    const rotationAngle = (scrollFraction - 0.5) * 30;

    // Apply rotation to slider-track
    const sliderTrack = container.querySelector('.slider-track');
    if (sliderTrack) {
      sliderTrack.style.transform = `rotateY(${rotationAngle}deg)`;
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial call

      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Center the middle product on mount
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setTimeout(() => {
        const cards = container.querySelectorAll('.product-card');
        if (cards.length > 0) {
          // Center the middle card
          const middleIndex = Math.floor(cards.length / 2);
          const cardToCenter = cards[middleIndex];
          const cardRect = cardToCenter.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const containerCenter = containerRect.left + containerRect.width / 2;
          const cardCenter = cardRect.left + cardRect.width / 2;
          const scrollLeft = container.scrollLeft + (cardCenter - containerCenter);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          setCenterCardIndex(middleIndex);
        }
      }, 100); // Delay to ensure DOM is ready
    }
  }, [products]); // Add products as dependency

  // Add scroll-to-center logic on scroll end
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isScrolling;
    const handleScrollEnd = () => {
      const cards = container.querySelectorAll('.product-card');
      if (!cards.length) return;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      // Scroll so that the closest card is centered
      const cardToCenter = cards[closestIndex];
      const cardRect = cardToCenter.getBoundingClientRect();
      // For mobile, use window.innerWidth for center
      const isMobile = window.innerWidth <= 480;
      const center = isMobile ? window.innerWidth / 2 : containerCenter;
      const scrollLeft = container.scrollLeft + (cardRect.left + cardRect.width / 2) - center;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    };
    const onScroll = () => {
      clearTimeout(isScrolling);
      isScrolling = setTimeout(handleScrollEnd, 120);
    };
    container.addEventListener('scroll', onScroll);
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(isScrolling);
    };
  }, []);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 320;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Determine products to show and center dot for mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;
  const mobileProducts = isMobile ? products.slice(0, 7) : products;
  // For mobile, center dot should be middle of the array
  const mobileCenterIndex = Math.floor(mobileProducts.length / 2);
  // For desktop, keep previous logic
  const dotActiveIndex = isMobile ? mobileCenterIndex : centerCardIndex % (products.length || 1);

  return (
    <section className="featured-section">
      {/* Background Decorative Elements */}
      <div className="background-decorations">
        {/* Christmas Stars - Top Left */}
        <img src={christmasStars} alt="Christmas Stars" className="featured-christmas-stars-top-left" loading="lazy" decoding="async" width="150" height="150" />
        {/* Christmas Stars - Bottom Right */}
        <img src={christmasStars} alt="Christmas Stars" className="featured-christmas-stars-bottom-right" loading="lazy" decoding="async" width="150" height="150" />
        {/* Jewelry Diamond Icon - Top Right */}
        <img src={jewelryDimondIcon} alt="Jewelry Diamond" className="featured-jewelry-diamond-top-right" loading="lazy" decoding="async" width="100" height="100" />
        <div className="decoration-star star-1">✦</div>
        <div className="decoration-star star-2">✦</div>
        <div className="decoration-plus plus-1">+</div>
        <div className="decoration-plus plus-2">+</div>
      </div>

      <div className="featured-content">
        {/* Title Section */}
        <div className="featured-header">
          <div className="featured-logo-container">
            <img src={diamondIcon} alt="Diamond Logo" className="diamond-img" loading="lazy" decoding="async" width="100" height="100" />
          </div>
          <div className="featured-header-title-wrapper">
            <span className="featured-header-line"></span>
            <h1>
              <span className="title-featured">FEATURED</span>
              <span className="title-categories">CATEGORIES</span>
            </h1>
            <span className="featured-header-line"></span>
          </div>
          <p className="featured-header-desc">
            Explore Our Wide Range Of Premium Gold Products
          </p>
        </div>

        {/* Product Slider Section */}
        <div className="slider-section">
          {/* Left Arrow */}
          <button
            className="scroll-arrow scroll-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <MoveLeft size={24} />
          </button>

          {/* Product Slider */}
          <div className="product-slider" ref={scrollContainerRef}>
            <div className="slider-track">
              {loading ? (
                <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', width: '100%' }}>
                  <div className="loading-spinner" style={{ fontSize: '18px', color: '#0e593c' }}>Loading products...</div>
                </div>
              ) : (
                products.map((product, index) => {
                  const distanceFromCenter = Math.abs(index - centerCardIndex);
                  const rotation = (index - centerCardIndex) * 10;

                  // Get category and subcategory slugs from product data
                  const categorySlug = product?.category_slug || 'all';
                  const subcategorySlug = product?.subcategory_slug || 'all';
                  const categoryName = product?.category_name || 'all';

                  return (
                    <div
                      key={`${product.id}-${index}`}
                      className={`product-card ${index === centerCardIndex ? 'center-card' : ''} ${index === centerCardIndex - 1 ? 'left-1' : ''} ${index === centerCardIndex + 1 ? 'right-1' : ''}`}
                      style={{
                        '--rotation': `${rotation}deg`,
                        '--z-index': index === centerCardIndex ? '10' : `${10 - distanceFromCenter}`,
                      }}
                    >
                      <div className="card-image-container">
                        <Link
                          to={`/shop?category=${categorySlug}&subcategory=${subcategorySlug}`}
                          tabIndex={0}
                          aria-label={`View ${categoryName} products`}
                          style={{ display: 'block', height: "100%" }}
                        >
                          <img
                            src={product.image?.includes('backend.pvjewellers.in') || (product.image?.startsWith('/') && !product.image?.startsWith('/assets'))
                              ? getResponsiveImage(product.image, { thumbnail: 300, card: 400, full: 500, quality: 55 }).src
                              : product.image}
                            srcSet={product.image?.includes('backend.pvjewellers.in') || (product.image?.startsWith('/') && !product.image?.startsWith('/assets'))
                              ? getResponsiveImage(product.image, { thumbnail: 300, card: 400, full: 500, quality: 55 }).srcSet
                              : undefined}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            alt={product.name}
                            className="card-image"
                            width="400"
                            height="400"
                            onError={(e) => {
                              e.target.src = productImage;
                            }}
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>
                        <div className="card-content">
                          <h3 className="product-name">
                            {product?.name
                              ? product.name.length > 30
                                ? product.name.substring(0, 30) + '...'
                                : product.name
                              : 'Untitled Product'
                            }
                          </h3>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            className="scroll-arrow scroll-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <MoveRight size={24} />
          </button>
          {/* Dots below product slider, above View All button */}
          <div className="featured-slider-dots">
            {(isMobile ? mobileProducts : products).map((_, idx) => (
              <span
                key={idx}
                className={`featured-slider-dot${dotActiveIndex === idx ? ' active' : ''}`}
              />
            ))}
          </div>
        </div>


        {/* View All Button */}
        <div className="view-all-section">
          <Link to="/shop" className="view-all-button">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;