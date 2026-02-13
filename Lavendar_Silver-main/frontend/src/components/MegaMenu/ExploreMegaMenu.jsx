import React, { useState, useRef, useEffect, useMemo } from "react";
import "./MegaMenu.css";
import menuImg from '../../assets/img/banner/megamenu.png'
import megaImg from '../../assets/img/banner/megaImg.png'
import { Link } from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import axios from 'axios';
import productImage from '../../assets/img/product_image.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ExploreMegaMenu = () => {
    const [activeFilter, setActiveFilter] = useState("Category");
    const [fade, setFade] = useState("fade-in");
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [subSubcategories, setSubSubcategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add refs for scroll sync
    const mainRef = useRef();
    const featuredRef = useRef();

    // Fetch categories, subcategories, sub-subcategories and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch categories
                const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories`);
                const categoriesData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data :
                    (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data : []);

                // Fetch subcategories
                const subcategoriesResponse = await axios.get(`${API_BASE_URL}/api/subcategories`);
                const subcategoriesData = Array.isArray(subcategoriesResponse.data) ? subcategoriesResponse.data :
                    (subcategoriesResponse.data.data && Array.isArray(subcategoriesResponse.data.data) ? subcategoriesResponse.data.data : []);

                // Fetch sub-subcategories
                const subSubcategoriesResponse = await axios.get(`${API_BASE_URL}/api/sub-subcategories`);
                const subSubcategoriesData = Array.isArray(subSubcategoriesResponse.data) ? subSubcategoriesResponse.data :
                    (subSubcategoriesResponse.data.data && Array.isArray(subSubcategoriesResponse.data.data) ? subSubcategoriesResponse.data.data : []);

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

                // Calculate product counts and price ranges for subcategories
                const subcategoriesWithData = subcategoriesData.map(subcategory => {
                    const subcategoryProducts = productsData.filter(product =>
                        product.subcategory_id === subcategory.id && product.product_options?.[0]?.sell_price
                    );

                    let priceRange = 'Starting from ₹10,000';
                    let productCount = 0;

                    if (subcategoryProducts.length > 0) {
                        const prices = subcategoryProducts.map(p => {
                            const price = p.product_options?.[0]?.sell_price ? parseFloat(p.product_options[0].sell_price) : parseFloat(p.price || 0);
                            return price;
                        }).filter(p => !isNaN(p) && p > 0);

                        if (prices.length > 0) {
                            const minPrice = Math.min(...prices);
                            const maxPrice = Math.max(...prices);
                            priceRange = `₹${(minPrice / 1000).toFixed(1)}K - ₹${(maxPrice / 1000).toFixed(1)}K`;
                        }
                        productCount = subcategoryProducts.length;
                    }

                    return {
                        img: subcategory.image_url || productImage,
                        label: subcategory.name || '',
                        id: subcategory.id || '',
                        slug: subcategory.slug || '',
                        category_id: subcategory.category_id || '',
                        priceRange: priceRange,
                        productCount: productCount,
                        description: subcategory.description || ''
                    };
                });

                // Calculate product counts and price ranges for sub-subcategories
                const subSubcategoriesWithData = subSubcategoriesData.map(subSubcategory => {
                    const subSubcategoryProducts = productsData.filter(product =>
                        product.sub_subcategory_id === subSubcategory.id && product.product_options?.[0]?.sell_price
                    );

                    let priceRange = 'Starting from ₹10,000';
                    let productCount = 0;

                    if (subSubcategoryProducts.length > 0) {
                        const prices = subSubcategoryProducts.map(p => {
                            const price = p.product_options?.[0]?.sell_price ? parseFloat(p.product_options[0].sell_price) : parseFloat(p.price || 0);
                            return price;
                        }).filter(p => !isNaN(p) && p > 0);

                        if (prices.length > 0) {
                            const minPrice = Math.min(...prices);
                            const maxPrice = Math.max(...prices);
                            priceRange = `₹${(minPrice / 1000).toFixed(1)}K - ₹${(maxPrice / 1000).toFixed(1)}K`;
                        }
                        productCount = subSubcategoryProducts.length;
                    }

                    return {
                        img: subSubcategory.image_url || productImage,
                        label: subSubcategory.name || '',
                        id: subSubcategory.id || '',
                        slug: subSubcategory.slug || '',
                        subcategory_id: subSubcategory.subcategory_id || '',
                        priceRange: priceRange,
                        productCount: productCount,
                        description: subSubcategory.description || ''
                    };
                });

                setCategories(categoriesWithData);
                setSubcategories(subcategoriesWithData);
                setSubSubcategories(subSubcategoriesWithData);
                setProducts(productsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setCategories([]);
                setSubcategories([]);
                setSubSubcategories([]);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

    // Group subcategories by category
    const subcategoriesByCategory = useMemo(() => {
        const grouped = {};
        subcategories.forEach(subcat => {
            if (!grouped[subcat.category_id]) {
                grouped[subcat.category_id] = [];
            }
            grouped[subcat.category_id].push(subcat);
        });
        return grouped;
    }, [subcategories]);

    // Group sub-subcategories by subcategory
    const subSubcategoriesBySubcategory = useMemo(() => {
        const grouped = {};
        subSubcategories.forEach(subSubcat => {
            if (!grouped[subSubcat.subcategory_id]) {
                grouped[subSubcat.subcategory_id] = [];
            }
            grouped[subSubcat.subcategory_id].push(subSubcat);
        });
        return grouped;
    }, [subSubcategories]);

    return (
        <div className="mega-menu-container">
            <aside className="mega-menu-sidebar">
                <div className="mega-menu-filter-group">
                    <div
                        className={`mega-menu-filter-label${activeFilter === "Category" ? " mega-menu-filter-active" : ""}`}
                        onMouseEnter={() => handleFilterChange("Category")}
                        onClick={() => handleFilterChange("Category")}
                    >
                        Category
                    </div>
                </div>
                <div className="mega-menu-filter-group">
                    <div
                        className={`mega-menu-filter-label${activeFilter === "Subcategory" ? " mega-menu-filter-active" : ""}`}
                        onMouseEnter={() => handleFilterChange("Subcategory")}
                        onClick={() => handleFilterChange("Subcategory")}
                    >
                        Subcategory
                    </div>
                </div>
                <div className="mega-menu-filter-group">
                    <div
                        className={`mega-menu-filter-label${activeFilter === "Sub-Subcategory" ? " mega-menu-filter-active" : ""}`}
                        onMouseEnter={() => handleFilterChange("Sub-Subcategory")}
                        onClick={() => handleFilterChange("Sub-Subcategory")}
                    >
                        Sub-Subcategory
                    </div>
                </div>
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
                                    <div className="mega-menu-product-desc">{item.priceRange}</div>
                                    <div className="mega-menu-product-count">({item.productCount} products)</div>
                                </div>
                            </Link>
                        );
                    })}

                    {activeFilter === "Subcategory" && subcategories.map((item) => {
                        const hasImage = item.img && item.img.trim() !== '';
                        const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
                        const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

                        return (
                            <Link
                                to={`/shop?subcategory=${item.slug}`}
                                className="mega-menu-product-card"
                                key={item.id}
                                onClick={() => {
                                    localStorage.setItem('selectedSubcategory', item.slug);
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

                    {activeFilter === "Sub-Subcategory" && subSubcategories.map((item) => {
                        const hasImage = item.img && item.img.trim() !== '';
                        const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
                        const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

                        return (
                            <Link
                                to={`/shop?subSubcategory=${item.slug}`}
                                className="mega-menu-product-card"
                                key={item.id}
                                onClick={() => {
                                    localStorage.setItem('selectedSubSubcategory', item.slug);
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

export default ExploreMegaMenu;

