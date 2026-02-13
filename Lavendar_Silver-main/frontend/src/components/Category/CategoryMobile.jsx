import React from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import './CategoryMobile.css';
import diamond from '../../assets/img/icons/diamond.png';
import categoryImage from '../../assets/img/product_image.png';
import { getResponsiveImage } from '../../utils/responsiveImage';

const API_BASE_URL = import.meta.env.VITE_API_URL;


const CategoryMobile = () => {
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/api/home-banners/feature-category`);
        if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Use category_slug from API, or generate from category_name if not available
          const transformedCategories = response.data.data.map(item => {
            const generateCategorySlug = (categoryName) => {
              if (!categoryName) return 'all';
              return categoryName
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            };

            return {
              ...item,
              category_slug: item.category_slug || generateCategorySlug(item.category_name)
            };
          });
          setCategories(transformedCategories);
        } else {
          setCategories([]);
          setError("No featured categories available at the moment.");
        }
      } catch (err) {
        setCategories([]);
        setError(`${err.message}`);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  // Calculate the midpoint to ensure equal distribution
  const midPoint = Math.ceil(categories.length / 2);
  const firstRowProducts = categories.slice(0, midPoint);
  const secondRowProducts = categories.slice(midPoint);

  if (loading) {
    return (
      <div className="CategoryMobile">
        <div className="CategoryHeader">
          <div className="CategoryDecorativeElement">
            <img src={diamond} alt='diamond' height="34px" width="144px" loading="lazy" decoding="async" />
          </div>
          <div className="CategoryTitleWrapper">
            <span className="CategoryTitleLine"></span>
            <h2 className="CategoryTitle"><span>FEATURED </span>CATEGORIES </h2>
            <span className="CategoryTitleLine"></span>
          </div>
          <p className="CategorySubtitle">Explore Our Wide Range Of Premium Gold Products</p>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading featured categories...</div>
          <div style={{ fontSize: '14px' }}>Please wait while we fetch the latest categories</div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="CategoryMobile">
        <div className="CategoryHeader">
          <div className="CategoryDecorativeElement">
            <img src={diamond} alt='diamond' height="34px" width="144px" loading="lazy" decoding="async" />
          </div>
          <div className="CategoryTitleWrapper">
            <span className="CategoryTitleLine"></span>
            <h2 className="CategoryTitle"><span>FEATURED </span>CATEGORIES </h2>
            <span className="CategoryTitleLine"></span>
          </div>
          <p className="CategorySubtitle">Explore Our Wide Range Of Premium Gold Products</p>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
          background: '#f9f9f9',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '15px',
            color: '#333',
            fontWeight: '500'
          }}>
            📦 No Categories Available
          </div>
          <div style={{
            fontSize: '16px',
            marginBottom: '10px',
            color: '#666'
          }}>
            {error || "No featured categories are currently available."}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#999'
          }}>
            Please check back later or contact support if this issue persists.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="CategoryMobile">
      <div className="CategoryHeader">
        <div className="CategoryDecorativeElement">
          <img src={diamond} alt='diamond' height="34px" width="144px" loading="lazy" decoding="async" />
        </div>
        <div className="CategoryTitleWrapper">
          <span className="CategoryTitleLine"></span>
          <h2 className="CategoryTitle"><span>FEATURED </span>CATEGORIES </h2>
          <span className="CategoryTitleLine"></span>
        </div>
        <p className="CategorySubtitle">Explore Our Wide Range Of Premium Gold Products</p>
      </div>

      <div className="CategoryCarouselContainer">
        <div className="CategoryCarouselTrack">
          {/* First Row */}
          <div className="CategoryCarouselRow CategoryCarouselRow-top">
            {firstRowProducts.map((product, index) => (
              <Link
                key={`row1-${product.id}-${index}`}
                to={`/shop?category=${product.category_slug || 'all'}`}
                className="CategoryProductCard"
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                <div className="CategoryProductImageContainer">
                  <img
                    src={typeof product.image_url === 'string' && product.image_url.startsWith('/')
                      ? getResponsiveImage(`${API_BASE_URL}${product.image_url}`, { thumbnail: 280, card: 400, full: 500, quality: 55 }).src
                      : product.image_url}
                    srcSet={typeof product.image_url === 'string' && product.image_url.startsWith('/')
                      ? getResponsiveImage(`${API_BASE_URL}${product.image_url}`, { thumbnail: 280, card: 400, full: 500, quality: 55 }).srcSet
                      : undefined}
                    sizes="(max-width: 480px) 280px, 400px"
                    alt={product.category_name || product.title || 'Category'}
                    className="CategoryProductImage"
                    width="400"
                    height="225"
                    onError={(e) => {
                      e.target.src = categoryImage;
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="CategoryProductNameBanner">
                  <h3 className="CategoryProductName">{product.category_name || product.title || 'Category'}</h3>
                </div>
              </Link>
            ))}
          </div>

          {/* Second Row - Offset */}
          <div className="CategoryCarouselRow CategoryCarouselRow-bottom">
            {secondRowProducts.map((product, index) => (
              <Link
                key={`row2-${product.id}-${index}`}
                to={`/shop?category=${product.category_slug || 'all'}`}
                className="CategoryProductCard"
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                <div className="CategoryProductImageContainer">
                  <img
                    src={typeof product.image_url === 'string' && product.image_url.startsWith('/')
                      ? getResponsiveImage(`${API_BASE_URL}${product.image_url}`, { thumbnail: 280, card: 400, full: 500, quality: 55 }).src
                      : product.image_url}
                    srcSet={typeof product.image_url === 'string' && product.image_url.startsWith('/')
                      ? getResponsiveImage(`${API_BASE_URL}${product.image_url}`, { thumbnail: 280, card: 400, full: 500, quality: 55 }).srcSet
                      : undefined}
                    sizes="(max-width: 480px) 280px, 400px"
                    alt={product.category_name || product.title || 'Category'}
                    className="CategoryProductImage"
                    width="400"
                    height="225"
                    onError={(e) => {
                      e.target.src = categoryImage;
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="CategoryProductNameBanner">
                  <h3 className="CategoryProductName">{product.category_name || product.title || 'Category'}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryMobile;