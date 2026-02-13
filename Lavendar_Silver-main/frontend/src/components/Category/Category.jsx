import React, { useRef } from "react";
import { MoveLeft, MoveRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./category.css";
import CategoryMobile from "./CategoryMobile";
import DimondIcon from "../../assets/img/icons/jewelry-diamond.png";
import DimondIcon2 from "../../assets/img/icons/jewelry-diamond2.png";
import diamond from "../../assets/img/icons/diamond.png";
import categoryImage from "../../assets/img/product_image.png";

const API_BASE_URL = import.meta.env.VITE_API_URL;


const Category = () => {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Remove testImage

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/home-banners/feature-category`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Use category_slug from API, or generate from category_name if not available
          const transformedCategories = data.data.map(item => {
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
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
        setError(`${error.message}`);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const itemsPerPage = 9;
  const pages = [];
  for (let i = 0; i < categories.length; i += itemsPerPage) {
    pages.push(categories.slice(i, i + itemsPerPage));
  }

  // Cache container width to avoid forced reflows
  const containerWidthRef = React.useRef(0);

  // Calculate and cache container width
  React.useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerWidthRef.current = containerRef.current.offsetWidth || 0;
          }
        });
      };
      
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, [categories.length]);

  const scroll = (direction) => {
    if (containerRef.current) {
      // Use cached width or calculate in RAF
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const width = containerWidthRef.current || containerRef.current.offsetWidth || 0;
          // Calculate the width of one column (assuming 4 columns in the grid)
          const scrollAmount = (width / 4) * direction;
          containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      });
    }
  };

  if (isMobile) {
    return <CategoryMobile categories={categories} loading={loading} error={error} />;
  }

  return (
    <div className="category-section" id="main-category-section">
      {/* Removed testImage */}
      <div className="category-container">
        <img
          src={DimondIcon}
          alt="dimond icon"
          className="category-icon-left"
          height="34px"
          width="44px"
        />
        <img
          src={DimondIcon2}
          alt="dimond icon"
          className="category-icon-right"
          height="34px"
          width="44px"
        />
        {/* Navigation Arrow Left */}
        <div className="nav-arrow nav-arrow-left" onClick={() => scroll(-1)}>
          <MoveLeft size={24} />
        </div>

        {/* Header */}
        <div className="category-header">
          <div className="category-diamond-icon">
            <img src={diamond} alt="diamond" height="34px" width="144px" loading="lazy" decoding="async" />
          </div>
          <div className="category-title-wrapper">
            <span className="category-title-line"></span>
            <h2 className="category-title">
              FEATURED <span>CATEGORIES</span>{" "}
            </h2>
            <span className="category-title-line"></span>
          </div>
          <p className="category-subtitle">
            Explore Our Wide Range Of Premium Gold Products
          </p>
        </div>

        {/* Masonry Grid Layout */}
        <div className="masonry-container" ref={containerRef}>
          {loading ? (
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
                ⏳ Loading Categories
              </div>
              <div style={{
                fontSize: '16px',
                marginBottom: '10px',
                color: '#666'
              }}>
                Please wait while we fetch the latest categories
              </div>
              <div style={{
                fontSize: '14px',
                color: '#999'
              }}>
                This may take a few moments...
              </div>
            </div>
          ) : categories.length === 0 ? (
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
          ) : (
            pages.map((page, pageIndex) => (
              <div
                className={`masonry-page masonry-page-container-${pageIndex + 1}`}
                key={pageIndex}
              >
                <div className="masonry-grid">
                  {page.map((category, index) => {
                    // Determine the correct image URL
                    let imageUrl = categoryImage; // Default
                    if (category.image_url) {
                      if (typeof category.image_url === 'string') {
                        // Frontend static assets (dev) or backend paths
                        if (category.image_url.startsWith('/src') || category.image_url.startsWith('/assets')) {
                          // Use path directly for Vite assets
                          imageUrl = category.image_url;
                        } else {
                          // Prepend API_BASE for backend paths
                          imageUrl = `${API_BASE_URL}${category.image_url}`;
                        }
                      } else {
                        // Fallback for imported modules that aren't strings
                        imageUrl = category.image_url;
                      }
                    }

                    return (
                      <Link
                        key={category.id}
                        to={`/shop?category=${category.category_slug || 'all'}`}
                        className={`category-card position-${index + 1}`}
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                      >
                        <div className="category-image">
                          <img
                            src={imageUrl}
                            alt={category.category_name || category.title || 'Category'}
                            loading="lazy"
                            decoding="async"
                            width="400"
                            height="300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="category-overlay">
                            <span className="category-name">{category.category_name || category.title || 'Category'}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Navigation Arrow Right */}
        <div className="nav-arrow nav-arrow-right" onClick={() => scroll(1)}>
          <MoveRight size={24} />
        </div>
      </div>
    </div>
  );
};

export default Category;
