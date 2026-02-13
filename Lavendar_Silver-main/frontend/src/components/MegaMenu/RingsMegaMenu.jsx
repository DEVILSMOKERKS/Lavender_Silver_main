import React, { useState, useEffect } from "react";
import "./RingsMegaMenu.css";
import { Link } from "react-router-dom";
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const RingsMegaMenu = ({ categorySlug = 'rings', categoryName = 'Rings' }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Popular ring types - split into two columns
    const popularRingTypes = {
        left: [
            { label: 'Engagement', slug: 'engagement' },
            { label: 'Couple Bands', slug: 'couple-bands' },
            { label: 'Office Wear', slug: 'office-wear' },
            { label: 'Stackable', slug: 'stackable' },
            { label: 'Slider', slug: 'slider' },
            { label: 'Religious', slug: 'religious' },
            { label: 'Platinum Bands', slug: 'platinum-bands' },
            { label: 'For Men', slug: 'for-men' },
            { label: 'For Gift', slug: 'for-gift' },
        ],
        right: [
            { label: 'Diamond', slug: 'diamond' },
            { label: 'Plain Gold', slug: 'plain-gold' },
            { label: 'Gemstone', slug: 'gemstone' },
            { label: 'Solitaire', slug: 'solitaire' },
            { label: 'Cocktail', slug: 'cocktail' },
            { label: 'Multi-finger', slug: 'multi-finger' },
            { label: 'Navaratna', slug: 'navaratna' },
            { label: 'Pearl', slug: 'pearl' },
        ]
    };

    // Price ranges
    const priceRanges = [
        { label: 'Below 10,000', min: 0, max: 10000 },
        { label: 'Between 10k-20k', min: 10000, max: 20000 },
        { label: 'Between 20k-30k', min: 20000, max: 30000 },
        { label: 'Between 30k-40k', min: 30000, max: 40000 },
        { label: 'Between 40k-50k', min: 40000, max: 50000 },
        { label: '50,000 and above', min: 50000, max: Infinity },
    ];

    // Metals & Stones with starting prices
    const [metalsAndStones, setMetalsAndStones] = useState([
        { label: 'Diamond Rings', startingPrice: 7400 },
        { label: 'Gold Rings', startingPrice: 6300 },
        { label: 'White Gold Rings', startingPrice: 8900 },
        { label: 'Rose Gold Rings', startingPrice: 10000 },
        { label: 'Platinum Rings', startingPrice: 23200 },
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch products for this category
                const productsResponse = await axios.get(`${API_BASE_URL}/api/products`);
                const productsData = Array.isArray(productsResponse.data) 
                    ? productsResponse.data 
                    : (productsResponse.data?.data || []);
                
                // Filter products for rings category
                const ringsProducts = productsData.filter(product => {
                    const categoryMatch = product.category?.toLowerCase().includes('ring') ||
                                        product.category_name?.toLowerCase().includes('ring') ||
                                        product.item_name?.toLowerCase().includes('ring');
                    return categoryMatch;
                });

                setProducts(ringsProducts);

                // Calculate actual starting prices from products
                const calculateStartingPrice = (filterFn) => {
                    const filtered = ringsProducts.filter(filterFn);
                    if (filtered.length === 0) return null;
                    const prices = filtered.map(p => {
                        return p.product_options?.[0]?.sell_price 
                            ? parseFloat(p.product_options[0].sell_price)
                            : parseFloat(p.price || 0);
                    }).filter(p => !isNaN(p) && p > 0);
                    return prices.length > 0 ? Math.min(...prices) : null;
                };

                // Update metals and stones with actual prices
                setMetalsAndStones(prevMetals => {
                    return prevMetals.map(metal => {
                        const price = calculateStartingPrice(p => {
                            const name = (p.item_name || '').toLowerCase();
                            const label = metal.label.toLowerCase();
                            return name.includes(label.split(' ')[0]) || 
                                   name.includes(label.split(' ')[1] || '');
                        });
                        return price ? { ...metal, startingPrice: price } : metal;
                    });
                });

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categorySlug]);

    // Calculate total product count
    const totalProductCount = products.length;

    return (
        <div className="rings-mega-menu">
            <div className="rings-mega-menu-content">
                {/* Column 1: Popular Ring Types */}
                <div className="rings-mega-column">
                    <h3 className="rings-mega-heading">Popular Ring Types</h3>
                    <div className="rings-mega-popular-types">
                        <div className="rings-mega-popular-column">
                            {popularRingTypes.left.map((type, idx) => (
                                <Link
                                    key={idx}
                                    to={`/shop?subcategory=${type.slug}`}
                                    className="rings-mega-link"
                                >
                                    {type.label}
                                </Link>
                            ))}
                        </div>
                        <div className="rings-mega-popular-column">
                            {popularRingTypes.right.map((type, idx) => (
                                <Link
                                    key={idx}
                                    to={`/shop?subcategory=${type.slug}`}
                                    className="rings-mega-link"
                                >
                                    {type.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <Link 
                        to={`/shop?category=${categorySlug}`}
                        className="rings-mega-view-all-btn"
                    >
                        VIEW ALL {totalProductCount} RING DESIGNS
                    </Link>
                </div>

                {/* Column 2: By Price Range */}
                <div className="rings-mega-column">
                    <h3 className="rings-mega-heading">By Price Range</h3>
                    <div className="rings-mega-price-list">
                        {priceRanges.map((range, idx) => (
                            <Link
                                key={idx}
                                to={`/shop?category=${categorySlug}&minPrice=${range.min}&maxPrice=${range.max === Infinity ? '' : range.max}`}
                                className="rings-mega-link"
                            >
                                {range.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Column 3: By Metals & Stones */}
                <div className="rings-mega-column">
                    <h3 className="rings-mega-heading">By Metals & Stones</h3>
                    <div className="rings-mega-metals-list">
                        {metalsAndStones.map((metal, idx) => (
                            <Link
                                key={idx}
                                to={`/shop?category=${categorySlug}&itemName=${metal.label.toLowerCase().split(' ')[0]}`}
                                className="rings-mega-metal-link"
                            >
                                {metal.label} Starting at Rs. {metal.startingPrice.toLocaleString()}/-
                            </Link>
                        ))}
                    </div>
                    <div className="rings-mega-solitaire">
                        <Link
                            to={`/shop?category=${categorySlug}&itemName=solitaire`}
                            className="rings-mega-metal-link"
                        >
                            Buy Solitaire Rings Starting at Rs. 30,000/-
                        </Link>
                        <div className="rings-mega-solitaire-image">
                            {/* Placeholder for solitaire ring image */}
                            <div className="rings-mega-image-placeholder"></div>
                        </div>
                    </div>
                </div>

                {/* Column 4: Browse by Collections */}
                <div className="rings-mega-column rings-mega-collections">
                    <div className="rings-mega-collections-header">
                        <h3 className="rings-mega-heading">Browse by Collections</h3>
                        <Link 
                            to={`/shop?category=${categorySlug}`}
                            className="rings-mega-view-all-link"
                        >
                            View All &gt;&gt;
                        </Link>
                    </div>
                    <div className="rings-mega-collection-banner">
                        <div className="rings-mega-collection-image">
                            {/* Placeholder for collection image */}
                            <div className="rings-mega-collection-image-placeholder"></div>
                        </div>
                        <div className="rings-mega-collection-text">
                            <div className="rings-mega-collection-title">Liviana</div>
                            <div className="rings-mega-collection-subtitle">Stacks of Love</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RingsMegaMenu;
