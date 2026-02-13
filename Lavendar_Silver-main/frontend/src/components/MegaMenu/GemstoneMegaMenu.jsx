import React, { useState, useRef, useEffect, useMemo } from "react";
import "./MegaMenu.css";
import menuImg from '../../assets/img/banner/megamenu.png'
import megaImg from '../../assets/img/banner/megaImg.png'
import { Link } from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import axios from 'axios';
import productImage from '../../assets/img/product_image.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const GemstoneMegaMenu = ({ gemstoneType }) => {
    const [activeFilter, setActiveFilter] = useState("Gemstones");
    const [fade, setFade] = useState("fade-in");
    const [products, setProducts] = useState([]);
    const [gemstoneCatalog, setGemstoneCatalog] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add refs for scroll sync
    const mainRef = useRef();
    const featuredRef = useRef();

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch gemstone catalog
                const gemstoneResponse = await axios.get(`${API_BASE_URL}/api/gemstone-catalog`);
                const gemstoneData = Array.isArray(gemstoneResponse.data) ? gemstoneResponse.data :
                    (gemstoneResponse.data.data && Array.isArray(gemstoneResponse.data.data) ? gemstoneResponse.data.data : []);

                // Filter gemstones by type
                const filteredGemstones = gemstoneData.filter(gem =>
                    gem.type?.toLowerCase() === gemstoneType?.toLowerCase()
                );

                // Fetch categories that have products with this gemstone type
                const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories`);
                const categoriesData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data :
                    (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data : []);

                // Fetch products
                const productsResponse = await axios.get(`${API_BASE_URL}/api/products`);
                const productsData = Array.isArray(productsResponse.data) ? productsResponse.data :
                    (productsResponse.data.data && Array.isArray(productsResponse.data.data) ? productsResponse.data.data : []);

                // Filter products by gemstone type
                const filteredProducts = productsData.filter(product => {
                    // Check if product has gemstone information
                    if (product.gemstone_type) {
                        return product.gemstone_type.toLowerCase() === gemstoneType.toLowerCase();
                    }
                    // Check if product name or description contains gemstone names from catalog
                    const productName = (product.item_name || product.name || '').toLowerCase();
                    const productDesc = (product.description || '').toLowerCase();
                    return filteredGemstones.some(gem =>
                        productName.includes(gem.name.toLowerCase()) ||
                        productDesc.includes(gem.name.toLowerCase())
                    );
                });

                // Calculate categories with gemstone products
                const categoriesWithGemstones = categoriesData.map(category => {
                    const categoryProducts = filteredProducts.filter(product =>
                        product.category_id === category.id
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
                }).filter(cat => cat.productCount > 0);

                setGemstoneCatalog(filteredGemstones);
                setProducts(filteredProducts);
                setCategories(categoriesWithGemstones);
            } catch (error) {
                console.error('Error fetching data:', error);
                setGemstoneCatalog([]);
                setProducts([]);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [gemstoneType]);

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

    // Group products by gemstone
    const productsByGemstone = useMemo(() => {
        const grouped = {};
        products.forEach(product => {
            const productName = (product.item_name || product.name || '').toLowerCase();
            const productDesc = (product.description || '').toLowerCase();

            gemstoneCatalog.forEach(gem => {
                if (productName.includes(gem.name.toLowerCase()) || productDesc.includes(gem.name.toLowerCase())) {
                    if (!grouped[gem.id]) {
                        grouped[gem.id] = {
                            gemstone: gem,
                            products: []
                        };
                    }
                    grouped[gem.id].products.push(product);
                }
            });
        });
        return Object.values(grouped);
    }, [products, gemstoneCatalog]);

    return (
        <div className="mega-menu-container">
            <aside className="mega-menu-sidebar">
                <div className="mega-menu-filter-group">
                    <div
                        className={`mega-menu-filter-label${activeFilter === "Gemstones" ? " mega-menu-filter-active" : ""}`}
                        onMouseEnter={() => handleFilterChange("Gemstones")}
                        onClick={() => handleFilterChange("Gemstones")}
                    >
                        Gemstones
                    </div>
                </div>
                {categories.length > 0 && (
                    <div className="mega-menu-filter-group">
                        <div
                            className={`mega-menu-filter-label${activeFilter === "Categories" ? " mega-menu-filter-active" : ""}`}
                            onMouseEnter={() => handleFilterChange("Categories")}
                            onClick={() => handleFilterChange("Categories")}
                        >
                            Categories
                        </div>
                    </div>
                )}
            </aside>
            <main
                className="mega-menu-main"
                ref={mainRef}
                onScroll={handleMainScroll}
            >
                <div className={`mega-menu-products-row ${fade}`}>
                    {activeFilter === "Gemstones" && productsByGemstone.map((group, idx) => {
                        const gemstone = group.gemstone;
                        const productCount = group.products.length;

                        // Calculate price range
                        let priceRange = 'Starting from ₹10,000';
                        if (group.products.length > 0) {
                            const prices = group.products.map(p => {
                                const price = p.product_options?.[0]?.sell_price ? parseFloat(p.product_options[0].sell_price) : parseFloat(p.price || 0);
                                return price;
                            }).filter(p => !isNaN(p) && p > 0);

                            if (prices.length > 0) {
                                const minPrice = Math.min(...prices);
                                const maxPrice = Math.max(...prices);
                                priceRange = `₹${(minPrice / 1000).toFixed(1)}K - ₹${(maxPrice / 1000).toFixed(1)}K`;
                            }
                        }

                        const hasImage = gemstone.image_url && gemstone.image_url.trim() !== '';
                        const firstLetter = gemstone.name ? gemstone.name.charAt(0).toUpperCase() : '?';
                        const imageUrl = hasImage ? `${API_BASE_URL}${gemstone.image_url}` : '';

                        return (
                            <Link
                                to={`/shop?gemstoneType=${gemstoneType}`}
                                className="mega-menu-product-card"
                                key={gemstone.id || idx}
                                onClick={() => {
                                    localStorage.setItem('selectedGemstoneType', gemstoneType);
                                }}
                            >
                                {hasImage ? (
                                    <img
                                        src={imageUrl}
                                        alt={gemstone.name}
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
                                    <div className="mega-menu-product-title">{gemstone.name}</div>
                                    <div className="mega-menu-product-desc">{priceRange}</div>
                                    <div className="mega-menu-product-count">({productCount} products)</div>
                                </div>
                            </Link>
                        );
                    })}

                    {activeFilter === "Categories" && categories.map((item) => {
                        const hasImage = item.img && item.img.trim() !== '';
                        const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
                        const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

                        return (
                            <Link
                                to={`/shop?category=${item.slug}&gemstoneType=${gemstoneType}`}
                                className="mega-menu-product-card"
                                key={item.id}
                                onClick={() => {
                                    localStorage.setItem('selectedCategory', item.slug);
                                    localStorage.setItem('selectedGemstoneType', gemstoneType);
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
                                    <div className="mega-menu-product-desc">{item.priceRange}</div>
                                    <div className="mega-menu-product-count">({item.productCount} products)</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                <div className="mega-menu-banner-row">
                    <div className="mega-menu-banner">
                        <img src={megaImg} alt="banner" className="mega-menu-banner-img" loading="lazy" decoding="async" />
                        <div className="mega-menu-banner-content">
                            <div className="mega-menu-banner-title">THE LATEST IN LUXURY BY PVJ</div>
                            <div className="mega-menu-banner-desc">The Latest In Luxury By PVJ</div>
                        </div>
                        <Link to={`/shop?gemstoneType=${gemstoneType}`} className="mega-menu-banner-btn">
                            View More
                        </Link>
                    </div>
                </div>
            </main>
            <aside
                className="mega-menu-featured"
                ref={featuredRef}
            >
                <img src={menuImg} alt="featured" className="mega-menu-featured-img" loading="lazy" decoding="async" />
                <div className="mega-menu-featured-title">THE LATEST IN LUXURY BY PVJ</div>
                <Link to={`/shop?gemstoneType=${gemstoneType}`} className="mega-menu-featured-btn">Shop Now</Link>
            </aside>
        </div>
    );
};

export default GemstoneMegaMenu;

