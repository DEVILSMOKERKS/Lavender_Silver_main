import React, { useState, useRef, useEffect, useMemo } from "react";
import "./MegaMenu.css";
import menuImg from '../../assets/img/banner/megamenu.png'
import megaImg from '../../assets/img/banner/megaImg.png'
import { Link } from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import axios from 'axios';
import {
  User, UserRound, Baby, Diamond, Crown, Gem, Star, DollarSign,
  CircleDot, GlassWater, Briefcase, Shirt, Sparkles, Heart, Gift, Calendar, Users, Trophy
} from 'lucide-react';
import productImage from '../../assets/img/product_image.png';

const FILTERS = [
  { key: "Category", label: "Category" },
  { key: "Price", label: "Price" },
  { key: "Occasion", label: "Occasion" },
  { key: "Gender", label: "Gender" },
];

const API_BASE_URL = import.meta.env.VITE_API_URL;

// All possible gender and occasion options
const ALL_GENDER_OPTIONS = [
  { value: 'men', label: 'Men', icon: User, iconColor: "#0e593c", description: "Classic & Modern Collection" },
  { value: 'women', label: 'Women', icon: UserRound, iconColor: "#bf9b30", description: "Elegant & Trendy Designs" },
  { value: 'unisex', label: 'Unisex', icon: Users, iconColor: "#4a90e2", description: "Versatile & Universal Styles" },
  { value: 'kids', label: 'Kids', icon: Baby, iconColor: "#e91e63", description: "Cute & Comfortable Jewelry" },
  { value: 'teen', label: 'Teen', icon: Baby, iconColor: "#9c27b0", description: "Trendy & Youthful Designs" }
];

const ALL_OCCASION_OPTIONS = [
  { value: 'wedding', label: 'Wedding', icon: Heart, iconColor: "#ec4899", description: "Perfect for your special day" },
  { value: 'engagement', label: 'Engagement', icon: Diamond, iconColor: "#a855f7", description: "Symbol of eternal love" },
  { value: 'anniversary', label: 'Anniversary', icon: Gift, iconColor: "#f97316", description: "Celebrate your journey" },
  { value: 'birthday', label: 'Birthday', icon: Star, iconColor: "#eab308", description: "Make it memorable" },
  { value: 'valentine', label: 'Valentine\'s Day', icon: Sparkles, iconColor: "#ec4899", description: "Express your love" },
  { value: 'mothers_day', label: 'Mother\'s Day', icon: UserRound, iconColor: "#ec4899", description: "Honor her with love" },
  { value: 'fathers_day', label: 'Father\'s Day', icon: Crown, iconColor: "#2196f3", description: "Celebrate fatherhood" },
  { value: 'christmas', label: 'Christmas', icon: Star, iconColor: "#4caf50", description: "Festive celebrations" },
  { value: 'diwali', label: 'Diwali', icon: Sparkles, iconColor: "#ff9800", description: "Festival of lights" },
  { value: 'rakhi', label: 'Rakhi', icon: Heart, iconColor: "#e91e63", description: "Brother-sister bond" },
  { value: 'karva_chauth', label: 'Karva Chauth', icon: Heart, iconColor: "#f44336", description: "Sacred tradition" },
  { value: 'office_wear', label: 'Office Wear', icon: Briefcase, iconColor: "#607d8b", description: "Professional elegance" },
  { value: 'party_wear', label: 'Party Wear', icon: GlassWater, iconColor: "#9c27b0", description: "Dazzling party looks" },
  { value: 'casual_wear', label: 'Casual Wear', icon: Shirt, iconColor: "#4caf50", description: "Everyday comfort" },
  { value: 'formal_wear', label: 'Formal Wear', icon: Crown, iconColor: "#2196f3", description: "Sophisticated style" },
  { value: 'daily_wear', label: 'Daily Wear', icon: Star, iconColor: "#ffc107", description: "Daily elegance" },
  { value: 'festival', label: 'Festival', icon: Sparkles, iconColor: "#ff9800", description: "Festive celebrations" },
  { value: 'ceremony', label: 'Ceremony', icon: Crown, iconColor: "#9c27b0", description: "Special ceremonies" },
  { value: 'graduation', label: 'Graduation', icon: Star, iconColor: "#4caf50", description: "Academic achievement" },
  { value: 'promotion', label: 'Promotion', icon: Crown, iconColor: "#2196f3", description: "Career milestone" },
  { value: 'achievement', label: 'Achievement', icon: Trophy, iconColor: "#ffc107", description: "Celebrate success" },
  { value: 'self_gift', label: 'Self Gift', icon: Gift, iconColor: "#e91e63", description: "Treat yourself" },
  { value: 'other', label: 'Other', icon: Calendar, iconColor: "#607d8b", description: "Special occasions" }
];

const MegaMenu = () => {
  const [activeFilter, setActiveFilter] = useState("Category");
  const [fade, setFade] = useState("fade-in");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  // Add refs for scroll sync
  const mainRef = useRef();
  const featuredRef = useRef();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        // Check if response.data is an array, if not, check for data property
        const categoriesData = Array.isArray(response.data) ? response.data :
          (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);

        // Wait for products to be fetched first
        const productsResponse = await axios.get(`${API_BASE_URL}/api/products`);
        const productsData = Array.isArray(productsResponse.data) ? productsResponse.data :
          (productsResponse.data.data && Array.isArray(productsResponse.data.data) ? productsResponse.data.data : []);

        // Calculate price range for each category
        const categoriesWithPrices = categoriesData.map(category => {
          // Filter products for this category
          const categoryProducts = productsData.filter(product =>
            product.category_id === category.id && product.price
          );

          let priceRange = 'Starting from ₹10,000';

          if (categoryProducts.length > 0) {
            const prices = categoryProducts.map(p => parseFloat(p.price)).filter(p => !isNaN(p) && p > 0);
            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              priceRange = `₹${(minPrice / 1000).toFixed(1)}K - ₹${(maxPrice / 1000).toFixed(1)}K`;
            }
          }

          return {
            img: category.image_url || productImage, // Use category image or placeholder
            label: category.name || '',
            id: category.id || '',
            priceRange: priceRange,
            description: category.description || '',
            slug: category.slug || ''
          };
        });

        setCategories(categoriesWithPrices);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]); // Set empty array on error
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products`);
        // Check if response.data is an array, if not, check for data property
        const productsData = Array.isArray(response.data) ? response.data :
          (response.data.data && Array.isArray(response.data.data) ? response.data.data : []);

        setProducts(productsData);     
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Set empty array on error
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  // Generate dynamic price ranges based on products (similar to shop page)
  const priceRanges = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      // Fallback ranges if no products - same as shop page
      return [
        { label: "₹0 - 10,000", min: 0, max: 10000 },
        { label: "₹10,000 - 20,000", min: 10000, max: 20000 },
        { label: "₹20,000 - 30,000", min: 20000, max: 30000 },
        { label: "₹30,000 - 40,000", min: 30000, max: 40000 },
        { label: "₹40,000 - 50,000", min: 40000, max: 50000 },
        { label: "₹50,000+", min: 50000, max: Infinity },
      ];
    }

    // Extract all product prices using sell_price from product_options
    const prices = products.map(product => {
      return product.product_options?.[0]?.sell_price
        ? parseFloat(product.product_options[0].sell_price)
        : parseFloat(product.price || 0);
    }).filter(price => price > 0); // Filter out zero or invalid prices

    if (prices.length === 0) {
      return [
        { label: "₹0 - 10,000", min: 0, max: 10000 },
        { label: "₹10,000 - 20,000", min: 10000, max: 20000 },
        { label: "₹20,000 - 30,000", min: 20000, max: 30000 },
        { label: "₹30,000 - 40,000", min: 30000, max: 40000 },
        { label: "₹40,000 - 50,000", min: 40000, max: 50000 },
        { label: "₹50,000+", min: 50000, max: Infinity },
      ];
    }

    const minPrice = Math.floor(Math.min(...prices) / 10000) * 10000; // Round down to nearest 10k
    const maxPrice = Math.ceil(Math.max(...prices) / 10000) * 10000; // Round up to nearest 10k

    const ranges = [];
    const gap = 10000; // ₹10,000 gap

    // Generate ranges from min to max with 10k gaps
    for (let i = minPrice; i < maxPrice; i += gap) {
      const rangeMin = i;
      const rangeMax = i + gap;

      // Format the label
      let label;
      if (rangeMin === 0) {
        label = `₹0 - ${rangeMax.toLocaleString()}`;
      } else {
        label = `₹${rangeMin.toLocaleString()} - ${rangeMax.toLocaleString()}`;
      }

      ranges.push({
        label,
        min: rangeMin,
        max: rangeMax
      });
    }

    // Add the final range for max price and above
    if (ranges.length > 0) {
      const lastRange = ranges[ranges.length - 1];
      if (lastRange.max < maxPrice) {
        ranges.push({
          label: `₹${maxPrice.toLocaleString()}+`,
          min: maxPrice,
          max: Infinity
        });
      }
    }

    return ranges;
  }, [products]);

  // Calculate product counts for each price range
  const priceRangeCounts = useMemo(() => {
    const counts = {};
    priceRanges.forEach(({ label, min, max }) => {
      counts[label] = products.filter((p) => {
        const productPrice = p.product_options?.[0]?.sell_price
          ? parseFloat(p.product_options[0].sell_price)
          : parseFloat(p.price || 0);
        return productPrice >= min && productPrice <= max;
      }).length;
    });
    return counts;
  }, [products, priceRanges]);

  // Generate gender options with product counts
  const genderOptions = useMemo(() => {
    const genderCounts = {};

    // Count products for each gender
    products.forEach(product => {
      if (product.product_options && Array.isArray(product.product_options)) {
        product.product_options.forEach(option => {
          if (option.gender) {
            const genders = option.gender.split(',').map(g => g.trim().toLowerCase());
            genders.forEach(gender => {
              genderCounts[gender] = (genderCounts[gender] || 0) + 1;
            });
          }
        });
      }
    });

    // Map to ALL_GENDER_OPTIONS with counts
    return ALL_GENDER_OPTIONS.map(option => ({
      ...option,
      productCount: genderCounts[option.value] || 0,
      hasProducts: (genderCounts[option.value] || 0) > 0
    }));
  }, [products]);

  // Generate occasion options with product counts
  const occasionOptions = useMemo(() => {
    const occasionCounts = {};

    // Count products for each occasion
    products.forEach(product => {
      if (product.product_options && Array.isArray(product.product_options)) {
        product.product_options.forEach(option => {
          if (option.occasion) {
            const occasions = option.occasion.split(',').map(o => o.trim().toLowerCase());
            occasions.forEach(occasion => {
              occasionCounts[occasion] = (occasionCounts[occasion] || 0) + 1;
            });
          }
        });
      }
    });

    // Map to ALL_OCCASION_OPTIONS with counts
    return ALL_OCCASION_OPTIONS.map(option => ({
      ...option,
      productCount: occasionCounts[option.value] || 0,
      hasProducts: (occasionCounts[option.value] || 0) > 0
    }));
  }, [products]);

  // Sync scroll from main to featured
  const handleMainScroll = (e) => {
    if (featuredRef.current) {
      featuredRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleFilterChange = (filter) => {
    if (filter === activeFilter) return;
    setFade("fade-out");
    setTimeout(() => {
      setActiveFilter(filter);
      setFade("fade-in");
    }, 300); // 300ms fade-out, then change
  };

  return (
    <div className="mega-menu-container">
      <aside className="mega-menu-sidebar">
        {FILTERS.map((filter) => (
          <div className="mega-menu-filter-group" key={filter.key}>
            <div
              className={`mega-menu-filter-label${activeFilter === filter.key ? " mega-menu-filter-active" : ""}`}
              onMouseEnter={() => handleFilterChange(filter.key)}
              onClick={() => handleFilterChange(filter.key)}
            >
              {filter.label}
            </div>
          </div>
        ))}
      </aside>
      <main
        className="mega-menu-main"
        ref={mainRef}
        onScroll={handleMainScroll}
      >
        <div className={`mega-menu-products-row ${fade}`}>
          {activeFilter === "Category" && categories.map((item) => {
            const hasImage = item.img && item.img.trim() !== '';
            const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
            const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

            return (
              <Link
                to={`/shop?category=${item.slug}`}
                className="mega-menu-product-card"
                key={item.id}
                onClick={() => {
                  // Update the filter in shop page
                  localStorage.setItem('selectedCategory', item.slug);
                }}
              >
                {hasImage ? (
                  <img
                    src={imageUrl}
                    alt={item.label}
                    className="mega-menu-product-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="mega-menu-product-initial" style={{ display: hasImage ? 'none' : 'flex' }}>
                  {firstLetter}
                </div>
                <div className="mega-menu-product-info">
                  <div className="mega-menu-product-title">{item.label}</div>
                </div>
              </Link>
            );
          })}

          {activeFilter === "Price" && (() => {
            const filteredRanges = priceRanges.filter(({ label }) => {
              return priceRangeCounts[label] > 0; // Only show ranges with products
            });

            if (filteredRanges.length === 0) {
              return (
                <div className="mega-menu-no-products">
                  <div className="mega-menu-no-products-text">No products available in this price range</div>
                </div>
              );
            }

            return filteredRanges.map((item, idx) => {
              const productCount = priceRangeCounts[item.label] || 0;

              return (
                <Link
                  to={`/shop?minPrice=${item.min}&maxPrice=${item.max}`}
                  className="mega-menu-price-card"
                  key={idx}
                  onClick={() => {
                    // Update the filter in shop page
                    localStorage.setItem('selectedPriceRange', JSON.stringify({ min: item.min, max: item.max }));
                  }}
                >
                  <div className="mega-menu-price-content">
                    <div className="mega-menu-price-label">{item.label}</div>
                    <div className="mega-menu-price-count">({productCount} products)</div>
                  </div>
                </Link>
              );
            });
          })()}

          {activeFilter === "Occasion" && (() => {
            return occasionOptions.map((item, idx) => {
              const IconComponent = item.icon;
              const cardContent = (
                <div className="mega-menu-occasion-card" style={{
                  opacity: item.hasProducts ? 1 : 0.6,
                  cursor: item.hasProducts ? 'pointer' : 'default'
                }}>
                  <div className="mega-menu-occasion-icon-wrapper" style={{ backgroundColor: `${item.iconColor}20`, borderColor: item.iconColor }}>
                    <IconComponent size={32} color={item.iconColor} strokeWidth={1.5} />
                  </div>
                  <div className="mega-menu-occasion-info">
                    <div className="mega-menu-occasion-title">{item.label.toUpperCase()}</div>
                    <div className="mega-menu-occasion-desc">{item.description}</div>
                    <div className="mega-menu-occasion-count">
                      {item.hasProducts ? `(${item.productCount} ${item.productCount === 1 ? 'product' : 'products'})` : '(Coming Soon)'}
                    </div>
                  </div>
                </div>
              );

              return item.hasProducts ? (
                <Link
                  to={`/shop?occasion=${item.value}`}
                  key={idx}
                  onClick={() => {
                    localStorage.setItem('selectedOccasion', item.value);
                  }}
                >
                  {cardContent}
                </Link>
              ) : (
                <div key={idx}>
                  {cardContent}
                </div>
              );
            });
          })()}

          {activeFilter === "Gender" && (() => {
            return genderOptions.map((item, idx) => {
              const IconComponent = item.icon;
              const cardContent = (
                <div className="mega-menu-gender-card" style={{
                  opacity: item.hasProducts ? 1 : 0.6,
                  cursor: item.hasProducts ? 'pointer' : 'default'
                }}>
                  <div className="mega-menu-gender-icon-wrapper" style={{ backgroundColor: `${item.iconColor}20`, borderColor: item.iconColor }}>
                    <IconComponent size={32} color={item.iconColor} strokeWidth={1.5} />
                  </div>
                  <div className="mega-menu-gender-info">
                    <div className="mega-menu-gender-title">{item.label.toUpperCase()}</div>
                    <div className="mega-menu-gender-desc">{item.description}</div>
                    <div className="mega-menu-gender-count">
                      {item.hasProducts ? `(${item.productCount} ${item.productCount === 1 ? 'product' : 'products'})` : '(Coming Soon)'}
                    </div>
                  </div>
                </div>
              );

              return item.hasProducts ? (
                <Link
                  to={`/shop?gender=${item.value}`}
                  key={idx}
                  onClick={() => {
                    localStorage.setItem('selectedGender', item.value);
                  }}
                >
                  {cardContent}
                </Link>
              ) : (
                <div key={idx}>
                  {cardContent}
                </div>
              );
            });
          })()}
        </div>
        <div className="mega-menu-banner-row">
          <div className="mega-menu-banner">
            <img src={megaImg} alt="banner" className="mega-menu-banner-img" loading="lazy" decoding="async" />
            <div className="mega-menu-banner-content">
              <div className="mega-menu-banner-title">THE LATEST IN LUXURY BY PVJ</div>
              <div className="mega-menu-banner-desc">The Latest In Luxury By PVJ</div>
            </div>
            <HashLink smooth to="/#latest-luxury-section-id" className="mega-menu-banner-btn">
              View More
            </HashLink>
          </div>
        </div>
      </main>
      <aside
        className="mega-menu-featured"
        ref={featuredRef}
      >
        <img src={menuImg} alt="featured" className="mega-menu-featured-img" loading="lazy" decoding="async" />
        <div className="mega-menu-featured-title">THE LATEST IN LUXURY BY PVJ</div>
        <Link to="/shop" className="mega-menu-featured-btn">Shop Now</Link>
      </aside>
    </div>
  );
};

export default MegaMenu;
