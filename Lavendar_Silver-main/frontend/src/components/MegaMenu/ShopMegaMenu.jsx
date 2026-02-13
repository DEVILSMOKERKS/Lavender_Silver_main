import React, { useState, useRef, useEffect, useMemo } from "react";
import "./MegaMenu.css";
import menuImg from '../../assets/img/banner/megamenu.png'
import megaImg from '../../assets/img/banner/megaImg.png'
import { Link } from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import axios from 'axios';
import {
    User, UserRound, Baby, Diamond, Crown, Gem, Star, DollarSign,
    CircleDot, GlassWater, Briefcase, Shirt, Sparkles, Heart, Gift, Calendar, Users, Trophy, TrendingUp, Clock
} from 'lucide-react';
import productImage from '../../assets/img/product_image.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ShopMegaMenu = () => {
    const [activeFilter, setActiveFilter] = useState("Category");
    const [fade, setFade] = useState("fade-in");
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newArrivals, setNewArrivals] = useState([]);
    const [bestsellers, setBestsellers] = useState([]);

    // Add refs for scroll sync
    const mainRef = useRef();
    const featuredRef = useRef();

    const FILTERS = [
        { key: "Category", label: "Category" },
        { key: "Price", label: "Price" },
        { key: "New Arrivals", label: "New Arrivals" },
        { key: "Bestsellers", label: "Bestsellers" },
        { key: "Occasion", label: "Occasion" },
        { key: "Gender", label: "Gender" },
    ];

    // All possible gender and occasion options
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
        { value: 'diwali', label: 'Diwali', icon: Sparkles, iconColor: "#ff9800", description: "Festival of lights" },
        { value: 'rakhi', label: 'Rakhi', icon: Heart, iconColor: "#e91e63", description: "Brother-sister bond" },
        { value: 'office_wear', label: 'Office Wear', icon: Briefcase, iconColor: "#607d8b", description: "Professional elegance" },
        { value: 'party_wear', label: 'Party Wear', icon: GlassWater, iconColor: "#9c27b0", description: "Dazzling party looks" },
        { value: 'casual_wear', label: 'Casual Wear', icon: Shirt, iconColor: "#4caf50", description: "Everyday comfort" },
        { value: 'formal_wear', label: 'Formal Wear', icon: Crown, iconColor: "#2196f3", description: "Sophisticated style" },
        { value: 'daily_wear', label: 'Daily Wear', icon: Star, iconColor: "#ffc107", description: "Daily elegance" },
    ];

    // Fetch data
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

                // Calculate product counts and price ranges for categories
                const categoriesWithData = categoriesData.map(category => {
                    const categoryProducts = productsData.filter(product =>
                        product.category_id === category.id && product.product_options?.[0]?.sell_price
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
                        img: category.image_url || productImage,
                        label: category.name || '',
                        id: category.id || '',
                        slug: category.slug || '',
                        priceRange: priceRange,
                        productCount: productCount,
                        description: category.description || ''
                    };
                });

                // Get new arrivals (products created in last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const newArrivalsData = productsData.filter(product => {
                    if (product.created_at) {
                        return new Date(product.created_at) >= thirtyDaysAgo;
                    }
                    return false;
                }).slice(0, 12);

                // Get bestsellers (products with highest sales or ratings)
                const bestsellersData = productsData
                    .filter(product => product.product_options?.[0]?.sell_price)
                    .sort((a, b) => {
                        // Sort by rating or sales count if available
                        const ratingA = parseFloat(a.rating || 0);
                        const ratingB = parseFloat(b.rating || 0);
                        return ratingB - ratingA;
                    })
                    .slice(0, 12);

                setCategories(categoriesWithData);
                setProducts(productsData);
                setNewArrivals(newArrivalsData);
                setBestsellers(bestsellersData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setCategories([]);
                setProducts([]);
                setNewArrivals([]);
                setBestsellers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Generate dynamic price ranges
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
        }, 300);
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
                        return (
                            <div
                                className="mega-menu-product-card"
                                key={item.id}
                                onClick={() => {
                                    localStorage.setItem('selectedCategory', item.slug);
                                    window.location.href = `/shop?category=${item.slug}`;
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {(() => {
                                    const hasImage = item.img && item.img.trim() !== '';
                                    const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
                                    const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

                                    return (
                                        <>
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
                                        </>
                                    );
                                })()}
                                <div className="mega-menu-product-info">
                                    <div className="mega-menu-product-title">{item.label}</div>
                                    <div className="mega-menu-product-desc">{item.priceRange}</div>
                                    <div className="mega-menu-product-count">({item.productCount} products)</div>
                                </div>
                            </div>
                        );
                    })}

                    {activeFilter === "Price" && (() => {
                        const filteredRanges = priceRanges.filter(({ label }) => {
                            return priceRangeCounts[label] > 0;
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
                                <div
                                    className="mega-menu-price-card"
                                    key={idx}
                                    onClick={() => {
                                        localStorage.setItem('selectedPriceRange', JSON.stringify({ min: item.min, max: item.max }));
                                        window.location.href = `/shop?minPrice=${item.min}&maxPrice=${item.max}`;
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="mega-menu-price-content">
                                        <div className="mega-menu-price-label">{item.label}</div>
                                        <div className="mega-menu-price-count">({productCount} products)</div>
                                    </div>
                                </div>
                            );
                        });
                    })()}

                    {activeFilter === "New Arrivals" && (() => {
                        if (newArrivals.length === 0) {
                            return (
                                <div className="mega-menu-no-products">
                                    <div className="mega-menu-no-products-text">No new arrivals available</div>
                                </div>
                            );
                        }

                        return newArrivals.map((product) => {
                            const productPrice = product.product_options?.[0]?.sell_price
                                ? parseFloat(product.product_options[0].sell_price)
                                : parseFloat(product.price || 0);
                            const productImage = product.images?.[0]?.image_url || product.image || '';
                            const hasImage = productImage && productImage.trim() !== '';
                            const firstLetter = (product.item_name || product.name || '?').charAt(0).toUpperCase();
                            const imageUrl = hasImage ? `${API_BASE_URL}${productImage}` : '';

                            return (
                                <Link
                                    to={`/product/${product.slug || product.id}`}
                                    className="mega-menu-product-card"
                                    key={product.id}
                                >
                                    {hasImage ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.item_name || product.name}
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
                                        <div className="mega-menu-product-title">
                                            {(product.item_name || product.name || '').substring(0, 20)}
                                            {(product.item_name || product.name || '').length > 20 ? '...' : ''}
                                        </div>
                                        <div className="mega-menu-product-desc">₹{productPrice.toLocaleString()}</div>
                                    </div>
                                </Link>
                            );
                        });
                    })()}

                    {activeFilter === "Bestsellers" && (() => {
                        if (bestsellers.length === 0) {
                            return (
                                <div className="mega-menu-no-products">
                                    <div className="mega-menu-no-products-text">No bestsellers available</div>
                                </div>
                            );
                        }

                        return bestsellers.map((product) => {
                            const productPrice = product.product_options?.[0]?.sell_price
                                ? parseFloat(product.product_options[0].sell_price)
                                : parseFloat(product.price || 0);
                            const productImage = product.images?.[0]?.image_url || product.image || '';
                            const hasImage = productImage && productImage.trim() !== '';
                            const firstLetter = (product.item_name || product.name || '?').charAt(0).toUpperCase();
                            const imageUrl = hasImage ? `${API_BASE_URL}${productImage}` : '';

                            return (
                                <Link
                                    to={`/product/${product.slug || product.id}`}
                                    className="mega-menu-product-card"
                                    key={product.id}
                                >
                                    {hasImage ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.item_name || product.name}
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
                                        <div className="mega-menu-product-title">
                                            {(product.item_name || product.name || '').substring(0, 20)}
                                            {(product.item_name || product.name || '').length > 20 ? '...' : ''}
                                        </div>
                                        <div className="mega-menu-product-desc">₹{productPrice.toLocaleString()}</div>
                                    </div>
                                </Link>
                            );
                        });
                    })()}

                    {activeFilter === "Occasion" && (() => {
                        return occasionOptions.map((item, idx) => {
                            const IconComponent = item.icon;
                            const cardContent = (
                                <div className="mega-menu-product-card" style={{
                                    opacity: item.hasProducts ? 1 : 0.6,
                                    cursor: item.hasProducts ? 'pointer' : 'default'
                                }}>
                                    <div className="icon-wrapper" style={{ backgroundColor: `${item.iconColor}20` }}>
                                        <IconComponent size={32} color={item.iconColor} strokeWidth={1.5} />
                                    </div>
                                    <div className="mega-menu-product-info">
                                        <div className="mega-menu-product-title">{item.label}</div>
                                        <div className="mega-menu-product-desc">{item.description}</div>
                                        <div className="mega-menu-product-count">
                                            {item.hasProducts ? `(${item.productCount} products)` : '(Coming Soon)'}
                                        </div>
                                    </div>
                                </div>
                            );

                            return item.hasProducts ? (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        localStorage.setItem('selectedOccasion', item.value);
                                        window.location.href = `/shop?occasion=${item.value}`;
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {cardContent}
                                </div>
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
                                <div className="mega-menu-product-card" style={{
                                    opacity: item.hasProducts ? 1 : 0.6,
                                    cursor: item.hasProducts ? 'pointer' : 'default'
                                }}>
                                    <div className="icon-wrapper" style={{ backgroundColor: `${item.iconColor}20` }}>
                                        <IconComponent size={32} color={item.iconColor} strokeWidth={1.5} />
                                    </div>
                                    <div className="mega-menu-product-info">
                                        <div className="mega-menu-product-title">{item.label}</div>
                                        <div className="mega-menu-product-desc">{item.description}</div>
                                        <div className="mega-menu-product-count">
                                            {item.hasProducts ? `(${item.productCount} products)` : '(Coming Soon)'}
                                        </div>
                                    </div>
                                </div>
                            );

                            return item.hasProducts ? (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        localStorage.setItem('selectedGender', item.value);
                                        window.location.href = `/shop?gender=${item.value}`;
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {cardContent}
                                </div>
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
                <div
                    className="mega-menu-featured-btn"
                    onClick={() => {
                        window.location.href = '/shop';
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    Shop Now
                </div>
            </aside>
        </div>
    );
};

export default ShopMegaMenu;

