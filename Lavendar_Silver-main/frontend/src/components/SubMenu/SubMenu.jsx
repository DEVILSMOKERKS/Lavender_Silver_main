import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './SubMenu.css';
import subMenuBanner from '../../assets/img/banner/shop-banner.png';
import axios from 'axios';
import {
  User, UserRound, Baby, Diamond, Crown, Gem, Star, DollarSign,
  CircleDot, GlassWater, Briefcase, Shirt, Sparkles, Heart, Gift, Calendar, Users, Trophy
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// All possible gender and occasion options (same as MegaMenu)
const ALL_GENDER_OPTIONS = [
  { value: 'men', label: 'Men', icon: User, iconColor: "#0e593c", description: "Classic & Modern Collection" },
  { value: 'women', label: 'Women', icon: UserRound, iconColor: "#bf9b30", description: "Elegant & Trendy Designs" },
  { value: 'unisex', label: 'Unisex', icon: Users, iconColor: "#4a90e2", description: "Versatile & Universal Styles" },
  { value: 'kids', label: 'Kids', icon: Baby, iconColor: "#e91e63", description: "Cute & Comfortable Jewelry" },
  { value: 'teen', label: 'Teen', icon: Baby, iconColor: "#9c27b0", description: "Trendy & Youthful Designs" }
];

const ALL_OCCASION_OPTIONS = [
  { value: 'wedding', label: 'Wedding', icon: Heart, iconColor: "#e91e63", description: "Perfect for your special day" },
  { value: 'engagement', label: 'Engagement', icon: Diamond, iconColor: "#9c27b0", description: "Symbol of eternal love" },
  { value: 'anniversary', label: 'Anniversary', icon: Gift, iconColor: "#ff9800", description: "Celebrate your journey" },
  { value: 'birthday', label: 'Birthday', icon: Star, iconColor: "#ffc107", description: "Make it memorable" },
  { value: 'valentine', label: 'Valentine\'s Day', icon: Heart, iconColor: "#f44336", description: "Express your love" },
  { value: 'mothers_day', label: 'Mother\'s Day', icon: Gift, iconColor: "#e91e63", description: "Honor the special woman" },
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

const SubMenu = ({ category, onBack, onClose, isOpen }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Category');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories`);
        const categoriesData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data :
          (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data : []);

        // Fetch products
        const productsResponse = await axios.get(`${API_BASE_URL}/api/products`);
        const productsData = Array.isArray(productsResponse.data) ? productsResponse.data :
          (productsResponse.data.data && Array.isArray(productsResponse.data.data) ? productsResponse.data.data : []);

        // Filter products based on category label
        let filteredProducts = productsData;
        if (category.label === 'DIAMOND') {
          filteredProducts = productsData.filter(product =>
            product.gemstone_type?.toLowerCase() === 'diamond' ||
            (product.item_name || '').toLowerCase().includes('diamond')
          );
        } else if (category.label === 'STONE') {
          filteredProducts = productsData.filter(product =>
            product.gemstone_type?.toLowerCase() === 'stone' ||
            (product.item_name || '').toLowerCase().includes('stone')
          );
        } else if (category.label === 'GOLD') {
          filteredProducts = productsData.filter(product =>
            (product.item_name || '').toLowerCase().includes('gold')
          );
        } else if (category.label === 'RINGS') {
          filteredProducts = productsData.filter(product =>
            product.category_id && categoriesData.find(cat =>
              cat.id === product.category_id && (cat.slug === 'rings' || cat.name?.toLowerCase() === 'rings')
            )
          );
        } else if (category.label === 'BANGLE') {
          filteredProducts = productsData.filter(product =>
            product.category_id && categoriesData.find(cat =>
              cat.id === product.category_id && (cat.slug === 'bangle' || cat.name?.toLowerCase() === 'bangle')
            )
          );
        } else if (category.label === 'BRACELETS') {
          filteredProducts = productsData.filter(product =>
            product.category_id && categoriesData.find(cat =>
              cat.id === product.category_id && (cat.slug === 'bracelets' || cat.name?.toLowerCase() === 'bracelets')
            )
          );
        }

        // Calculate categories with prices and product counts
        const categoriesWithPrices = categoriesData.map(categoryItem => {
          const categoryProducts = filteredProducts.filter(product =>
            product.category_id === categoryItem.id && product.product_options?.[0]?.sell_price
          );

          let priceRange = 'Starting from ₹10,000';
          let productCount = 0;

          if (categoryProducts.length > 0) {
            const prices = categoryProducts.map(p => {
              const price = p.product_options?.[0]?.sell_price ? parseFloat(p.product_options[0].sell_price) : parseFloat(p.price || 0);
              return price;
            }).filter(p => !isNaN(p) && p > 0);

            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              priceRange = `₹${(minPrice / 1000).toFixed(1)}K - ₹${(maxPrice / 1000).toFixed(1)}K`;
            }
            productCount = categoryProducts.length;
          }

          return {
            img: categoryItem.image_url || '',
            label: categoryItem.name || '',
            id: categoryItem.id || '',
            slug: categoryItem.slug || '',
            priceRange: priceRange,
            productCount: productCount,
            description: categoryItem.description || ''
          };
        }).filter(cat => category.label === 'ALL JEWELLERY' || cat.productCount > 0);

        setCategories(categoriesWithPrices);
        setProducts(filteredProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [category, isOpen]);

  // Generate dynamic price ranges based on products
  const priceRanges = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return [
        { label: "₹0 - 10,000", min: 0, max: 10000 },
        { label: "₹10,000 - 20,000", min: 10000, max: 20000 },
        { label: "₹20,000 - 30,000", min: 20000, max: 30000 },
        { label: "₹30,000 - 40,000", min: 30000, max: 40000 },
        { label: "₹40,000 - 50,000", min: 40000, max: 50000 },
        { label: "₹50,000+", min: 50000, max: Infinity },
      ];
    }

    const prices = products.map(product => {
      return product.product_options?.[0]?.sell_price
        ? parseFloat(product.product_options[0].sell_price)
        : parseFloat(product.price || 0);
    }).filter(price => price > 0);

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

    const minPrice = Math.floor(Math.min(...prices) / 10000) * 10000;
    const maxPrice = Math.ceil(Math.max(...prices) / 10000) * 10000;

    const ranges = [];
    const gap = 10000;

    for (let i = minPrice; i < maxPrice; i += gap) {
      const rangeMin = i;
      const rangeMax = i + gap;

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

    return ALL_GENDER_OPTIONS.map(option => ({
      ...option,
      productCount: genderCounts[option.value] || 0,
      hasProducts: (genderCounts[option.value] || 0) > 0
    }));
  }, [products]);

  // Generate occasion options with product counts
  const occasionOptions = useMemo(() => {
    const occasionCounts = {};

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

    return ALL_OCCASION_OPTIONS.map(option => ({
      ...option,
      productCount: occasionCounts[option.value] || 0,
      hasProducts: (occasionCounts[option.value] || 0) > 0
    }));
  }, [products]);

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  const handleCategoryClick = (categorySlug) => {
    let url = '';
    if (category.label === 'ALL JEWELLERY') {
      url = `/shop?category=${categorySlug}`;
    } else if (category.label === 'DIAMOND') {
      url = `/shop?category=${categorySlug}&gemstoneType=diamond`;
    } else if (category.label === 'STONE') {
      url = `/shop?category=${categorySlug}&gemstoneType=stone`;
    } else if (category.label === 'GOLD') {
      url = `/shop?category=${categorySlug}&itemName=gold`;
    } else {
      url = `/shop?category=${categorySlug}`;
    }
    localStorage.setItem('selectedCategory', categorySlug);
    onClose();
    window.location.href = url;
  };

  const handlePriceClick = (min, max) => {
    let url = '';
    if (category.label === 'ALL JEWELLERY') {
      url = `/shop?minPrice=${min}&maxPrice=${max}`;
    } else if (category.label === 'DIAMOND') {
      url = `/shop?minPrice=${min}&maxPrice=${max}&gemstoneType=diamond`;
    } else if (category.label === 'STONE') {
      url = `/shop?minPrice=${min}&maxPrice=${max}&gemstoneType=stone`;
    } else if (category.label === 'GOLD') {
      url = `/shop?minPrice=${min}&maxPrice=${max}&itemName=gold`;
    } else {
      url = `/shop?minPrice=${min}&maxPrice=${max}`;
    }
    localStorage.setItem('selectedPriceRange', JSON.stringify({ min, max }));
    onClose();
    window.location.href = url;
  };

  const handleGenderClick = (genderValue) => {
    let url = '';
    if (category.label === 'ALL JEWELLERY') {
      url = `/shop?gender=${genderValue}`;
    } else if (category.label === 'DIAMOND') {
      url = `/shop?gender=${genderValue}&gemstoneType=diamond`;
    } else if (category.label === 'STONE') {
      url = `/shop?gender=${genderValue}&gemstoneType=stone`;
    } else if (category.label === 'GOLD') {
      url = `/shop?gender=${genderValue}&itemName=gold`;
    } else {
      url = `/shop?gender=${genderValue}`;
    }
    localStorage.setItem('selectedGender', genderValue);
    onClose();
    window.location.href = url;
  };

  const handleOccasionClick = (occasionValue) => {
    let url = '';
    if (category.label === 'ALL JEWELLERY') {
      url = `/shop?occasion=${occasionValue}`;
    } else if (category.label === 'DIAMOND') {
      url = `/shop?occasion=${occasionValue}&gemstoneType=diamond`;
    } else if (category.label === 'STONE') {
      url = `/shop?occasion=${occasionValue}&gemstoneType=stone`;
    } else if (category.label === 'GOLD') {
      url = `/shop?occasion=${occasionValue}&itemName=gold`;
    } else {
      url = `/shop?occasion=${occasionValue}`;
    }
    localStorage.setItem('selectedOccasion', occasionValue);
    onClose();
    window.location.href = url;
  };

  const filteredPriceRanges = priceRanges.filter(({ label }) => {
    return priceRangeCounts[label] > 0;
  });

  return (
    <div className={`sub-menu-container ${isOpen ? 'open' : ''}`}>
      <div className="sub-menu-header">
        <button onClick={onBack} className="sub-menu-back-btn">
          <ArrowLeft size={24} />
        </button>
        <div className="sub-menu-title">
          <span className="sub-menu-icon">{category.icon}</span>
          <h2>{category.label}</h2>
        </div>
        <button onClick={onClose} className="sub-menu-close-btn">
          <X size={24} />
        </button>
      </div>

      <div className="sub-menu-content">
        {/* Filter Tabs */}
        {category.label === 'ALL JEWELLERY' && (
          <div className="sub-menu-filters">
            <button
              className={`sub-menu-filter-tab ${activeFilter === 'Category' ? 'active' : ''}`}
              onClick={() => handleFilterClick('Category')}
            >
              Category
            </button>
            <button
              className={`sub-menu-filter-tab ${activeFilter === 'Price' ? 'active' : ''}`}
              onClick={() => handleFilterClick('Price')}
            >
              Price
            </button>
            <button
              className={`sub-menu-filter-tab ${activeFilter === 'Gender' ? 'active' : ''}`}
              onClick={() => handleFilterClick('Gender')}
            >
              Gender
            </button>
            <button
              className={`sub-menu-filter-tab ${activeFilter === 'Occasion' ? 'active' : ''}`}
              onClick={() => handleFilterClick('Occasion')}
            >
              Occasion
            </button>
          </div>
        )}

        {/* Category Filter */}
        {activeFilter === 'Category' && (
          <div className="filter-section">
            <h3 className="filter-title">Category</h3>
            <div className="filter-options">
              {loading ? (
                <div className="sub-menu-loading">Loading...</div>
              ) : categories.length > 0 ? (
                categories.map((item) => {
                  const hasImage = item.img && item.img.trim() !== '';
                  const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
                  const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

                  return (
                    <div
                      key={item.id}
                      className="filter-btn filter-btn-category"
                      onClick={() => handleCategoryClick(item.slug)}
                      style={{ cursor: 'pointer' }}
                    >
                      {hasImage && (
                        <img
                          src={imageUrl}
                          alt={item.label}
                          className="filter-category-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      {!hasImage && (
                        <div className="filter-category-initial">{firstLetter}</div>
                      )}
                      <div className="filter-category-info">
                        <div className="filter-category-name">{item.label}</div>
                        {item.productCount > 0 && (
                          <div className="filter-category-count">({item.productCount} products)</div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="sub-menu-no-data">No categories available</div>
              )}
            </div>
          </div>
        )}

        {/* Price Filter */}
        {activeFilter === 'Price' && (
          <div className="filter-section">
            <h3 className="filter-title">Price</h3>
            <div className="filter-options">
              {loading ? (
                <div className="sub-menu-loading">Loading...</div>
              ) : filteredPriceRanges.length > 0 ? (
                filteredPriceRanges.map((item, idx) => {
                  const productCount = priceRangeCounts[item.label] || 0;
                  return (
                    <button
                      key={idx}
                      className="filter-btn"
                      onClick={() => handlePriceClick(item.min, item.max)}
                    >
                      {item.label} ({productCount} products)
                    </button>
                  );
                })
              ) : (
                <div className="sub-menu-no-data">No products available in this price range</div>
              )}
            </div>
          </div>
        )}

        {/* Gender Filter */}
        {activeFilter === 'Gender' && (
          <div className="filter-section">
            <h3 className="filter-title">Gender</h3>
            <div className="filter-options filter-options-gender">
              {loading ? (
                <div className="sub-menu-loading">Loading...</div>
              ) : (
                genderOptions.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={idx}
                      className={`filter-btn filter-btn-gender ${!item.hasProducts ? 'disabled' : ''}`}
                      onClick={() => item.hasProducts && handleGenderClick(item.value)}
                      disabled={!item.hasProducts}
                    >
                      <div className="filter-gender-icon" style={{ backgroundColor: `${item.iconColor}20` }}>
                        <IconComponent size={24} color={item.iconColor} strokeWidth={1.5} />
                      </div>
                      <div className="filter-gender-info">
                        <div className="filter-gender-name">{item.label}</div>
                        <div className="filter-gender-desc">{item.description}</div>
                        <div className="filter-gender-count">
                          {item.hasProducts ? `(${item.productCount} products)` : '(Coming Soon)'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Occasion Filter */}
        {activeFilter === 'Occasion' && (
          <div className="filter-section">
            <h3 className="filter-title">Occasion</h3>
            <div className="filter-options filter-options-occasion">
              {loading ? (
                <div className="sub-menu-loading">Loading...</div>
              ) : (
                occasionOptions.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={idx}
                      className={`filter-btn filter-btn-occasion ${!item.hasProducts ? 'disabled' : ''}`}
                      onClick={() => item.hasProducts && handleOccasionClick(item.value)}
                      disabled={!item.hasProducts}
                    >
                      <div className="filter-occasion-icon" style={{ backgroundColor: `${item.iconColor}20` }}>
                        <IconComponent size={24} color={item.iconColor} strokeWidth={1.5} />
                      </div>
                      <div className="filter-occasion-info">
                        <div className="filter-occasion-name">{item.label}</div>
                        <div className="filter-occasion-desc">{item.description}</div>
                        <div className="filter-occasion-count">
                          {item.hasProducts ? `(${item.productCount} products)` : '(Coming Soon)'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Banner Section */}
        <div className="sub-menu-banner">
          <img src={subMenuBanner} alt="Explore More" loading="lazy" decoding="async" />
          <div
            className="explore-now-btn"
            onClick={() => {
              onClose();
              window.location.href = '/shop';
            }}
            style={{ cursor: 'pointer' }}
          >
            Explore Now
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubMenu;
