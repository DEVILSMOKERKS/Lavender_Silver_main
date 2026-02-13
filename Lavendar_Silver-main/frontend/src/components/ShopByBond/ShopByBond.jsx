import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ShopByBond.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ShopByBond = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        if (response.data && response.data.success) {
          setCategories(response.data.data || []);
        } else if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Default filter options
  const filterOptions = [
    { label: 'All', value: 'All', slug: '', itemName: '' },
    { label: 'Silver', value: 'Silver', slug: '', itemName: 'silver' },
    { label: 'Gold', value: 'Gold', slug: '', itemName: 'gold' },
    ...categories.slice(0, 5).map(cat => ({
      label: cat.name || cat.category_name,
      value: cat.name || cat.category_name,
      slug: cat.slug || (cat.name || cat.category_name)?.toLowerCase().replace(/\s+/g, '-'),
      itemName: ''
    }))
  ];

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.value);
  };

  return (
    <div className="shop-by-bond-section">
      <div className="shop-by-bond-container">
        <h2 className="shop-by-bond-title">Shop by Bond</h2>
        <div className="shop-by-bond-chips">
          {filterOptions.map((category, index) => {
            const isActive = selectedCategory === category.value;
            const shopLink = category.itemName 
              ? `/shop?itemName=${category.itemName}` 
              : category.slug 
                ? `/shop?category=${category.slug}` 
                : '/shop';

            return (
              <Link
                key={index}
                to={shopLink}
                className={`shop-by-bond-chip ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShopByBond;
