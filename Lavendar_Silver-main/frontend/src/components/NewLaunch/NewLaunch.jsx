import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './NewLaunch.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const NewLaunch = () => {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/home-banners/feature-category`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCategories(data.data.slice(0, 8)); // Limit to 8 categories
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return <div style={{ minHeight: '200px' }} />;
  }

  return (
    <div className="new-launch-section">
      <div className="new-launch-header">
        <div className="new-launch-promo">
          <button className="new-launch-badge">NEW LAUNCH</button>
          <span className="new-launch-offer">Upto 15% Off</span>
          <Link to="/shop" className="new-launch-explore">
            Explore <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="new-launch-categories-wrapper">
        <button 
          className="scroll-btn scroll-btn-left" 
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <ChevronRight size={20} />
        </button>
        
        <div className="new-launch-categories" ref={scrollRef}>
          {categories.map((category) => {
            const imageUrl = category.image_url 
              ? `${API_BASE_URL}${category.image_url}` 
              : null;
            const categorySlug = category.category_slug || category.category_name?.toLowerCase().replace(/\s+/g, '-');

            return (
              <Link
                key={category.id}
                to={`/shop?category=${categorySlug}`}
                className="new-launch-category-card"
              >
                <div className="new-launch-category-image-wrapper">
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt={category.category_name || 'Category'} 
                      className="new-launch-category-image"
                      loading="lazy"
                    />
                  )}
                  <span className="new-badge">✨ New</span>
                </div>
                <div className="new-launch-category-name">
                  {category.category_name || 'Category'}
                </div>
              </Link>
            );
          })}
        </div>

        <button 
          className="scroll-btn scroll-btn-right" 
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="shop-by-bond">
        <h2>Shop by Bond</h2>
      </div>
    </div>
  );
};

export default NewLaunch;
