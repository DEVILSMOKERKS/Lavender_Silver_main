import React, { useState, useRef, useEffect } from "react";
import "./MegaMenu.css";
import menuImg from '../../assets/img/banner/megamenu.png'
import megaImg from '../../assets/img/banner/megaImg.png'
import { Link } from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import axios from 'axios';
import productImage from '../../assets/img/product_image.png';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ItemNameMegaMenu = ({ itemName }) => {
    // Default tab is Categories (hovering GOLD shows categories first)
    const [activeFilter, setActiveFilter] = useState("Categories");
    const [fade, setFade] = useState("fade-in");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add refs for scroll sync
    const mainRef = useRef();
    const featuredRef = useRef();

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch products
                const productsResponse = await axios.get(`${API_BASE_URL}/api/products`);
                const productsData = Array.isArray(productsResponse.data) ? productsResponse.data :
                    (productsResponse.data.data && Array.isArray(productsResponse.data.data) ? productsResponse.data.data : []);

                // Filter products by item_name
                const filteredProducts = productsData.filter(product => {
                    const productItemName = (product.item_name || '').toLowerCase();
                    return productItemName.includes(itemName.toLowerCase());
                });

                // Fetch categories
                const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories`);
                const categoriesData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data :
                    (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data : []);

                // Fetch subcategories
                const subcategoriesResponse = await axios.get(`${API_BASE_URL}/api/subcategories`);
                const subcategoriesData = Array.isArray(subcategoriesResponse.data) ? subcategoriesResponse.data :
                    (subcategoriesResponse.data.data && Array.isArray(subcategoriesResponse.data.data) ? subcategoriesResponse.data.data : []);

                // Calculate categories with item_name products
                const categoriesWithProducts = categoriesData.map(category => {
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

                // Calculate subcategories with item_name products
                const subcategoriesWithProducts = subcategoriesData.map(subcategory => {
                    const subcategoryProducts = filteredProducts.filter(product =>
                        product.subcategory_id === subcategory.id
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
                        priceRange: priceRange,
                        productCount: productCount,
                        description: subcategory.description || ''
                    };
                }).filter(subcat => subcat.productCount > 0);

                setProducts(filteredProducts);
                setCategories(categoriesWithProducts);
                setSubcategories(subcategoriesWithProducts);
                // Default tab is Categories when we have categories
                if (categoriesWithProducts.length > 0) {
                    setActiveFilter("Categories");
                } else if (subcategoriesWithProducts.length > 0) {
                    setActiveFilter("Subcategories");
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setProducts([]);
                setCategories([]);
                setSubcategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [itemName]);

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
                {subcategories.length > 0 && (
                    <div className="mega-menu-filter-group">
                        <div
                            className={`mega-menu-filter-label${activeFilter === "Subcategories" ? " mega-menu-filter-active" : ""}`}
                            onMouseEnter={() => handleFilterChange("Subcategories")}
                            onClick={() => handleFilterChange("Subcategories")}
                        >
                            Subcategories
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
                    {activeFilter === "Subcategories" && subcategories.map((item) => {
                        const hasImage = item.img && item.img.trim() !== '';
                        const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
                        const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

                        return (
                            <Link
                                to={`/shop?subcategory=${item.slug}&itemName=${itemName}`}
                                className="mega-menu-product-card"
                                key={item.id}
                                onClick={() => {
                                    localStorage.setItem('selectedSubcategory', item.slug);
                                    localStorage.setItem('selectedItemName', itemName);
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
                    {activeFilter === "Categories" && categories.map((item) => {
                        const hasImage = item.img && item.img.trim() !== '';
                        const firstLetter = item.label ? item.label.charAt(0).toUpperCase() : '?';
                        const imageUrl = hasImage ? `${API_BASE_URL}${item.img}` : '';

                        return (
                            <Link
                                to={`/shop?category=${item.slug}&itemName=${itemName}`}
                                className="mega-menu-product-card"
                                key={item.id}
                                onClick={() => {
                                    localStorage.setItem('selectedCategory', item.slug);
                                    localStorage.setItem('selectedItemName', itemName);
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
                        <Link to={`/shop?itemName=${itemName}`} className="mega-menu-banner-btn">
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
                <Link to={`/shop?itemName=${itemName}`} className="mega-menu-featured-btn">Shop Now</Link>
            </aside>
        </div>
    );
};

export default ItemNameMegaMenu;

