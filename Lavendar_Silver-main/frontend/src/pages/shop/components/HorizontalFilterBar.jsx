import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './HorizontalFilterBar.css';

const HorizontalFilterBar = ({
  filters,
  categories,
  subcategories,
  priceRanges,
  genderOptions,
  occasionOptions,
  gemstoneCatalog,
  onFilterChange
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const filterOptions = [
    {
      label: 'Product type',
      key: 'productType',
      options: categories.map(cat => ({ value: cat.name, label: cat.name }))
    },
    {
      label: 'Price',
      key: 'price',
      options: priceRanges.map(range => ({ 
        value: range,
        label: range.label 
      }))
    },
    {
      label: 'Shop For',
      key: 'shopFor',
      options: genderOptions.map(opt => ({ value: opt.value, label: opt.label }))
    },
    {
      label: 'Color',
      key: 'color',
      options: [
        { value: 'gold', label: 'Gold' },
        { value: 'silver', label: 'Silver' },
        { value: 'rose-gold', label: 'Rose Gold' },
        { value: 'white-gold', label: 'White Gold' },
        { value: 'platinum', label: 'Platinum' }
      ]
    },
    {
      label: 'Metal',
      key: 'metal',
      options: [
        { value: 'gold', label: 'Gold' },
        { value: 'silver', label: 'Silver' },
        { value: 'platinum', label: 'Platinum' }
      ]
    },
    {
      label: 'Stone',
      key: 'stone',
      options: gemstoneCatalog.slice(0, 10).map(stone => ({ 
        value: stone.name, 
        label: stone.name 
      }))
    },
    {
      label: 'Style',
      key: 'style',
      options: [
        { value: 'traditional', label: 'Traditional' },
        { value: 'modern', label: 'Modern' },
        { value: 'contemporary', label: 'Contemporary' },
        { value: 'vintage', label: 'Vintage' }
      ]
    },
    {
      label: 'Sub Category',
      key: 'subCategory',
      options: subcategories.map(sub => ({ value: sub.name, label: sub.name }))
    }
  ];

  const handleFilterSelect = (filterKey, option) => {
    onFilterChange(filterKey, option.value || option.label);
    setOpenDropdown(null);
  };

  const getSelectedValue = (filterKey) => {
    switch(filterKey) {
      case 'productType':
        return filters.selectedCategories[0] || '';
      case 'price':
        if (filters.selectedPriceRanges.length > 0 && priceRanges.length > 0) {
          const selectedRange = filters.selectedPriceRanges[0];
          const range = priceRanges.find(r => 
            r.min === selectedRange.min && r.max === selectedRange.max
          );
          return range ? range : null;
        }
        return null;
      case 'shopFor':
        return filters.selectedGenders[0] || '';
      case 'subCategory':
        return filters.selectedSubcategories[0] || '';
      default:
        return '';
    }
  };

  return (
    <div className="horizontal-filter-bar">
      <div className="filter-bar-left">
        {filterOptions.map((filter) => (
          <div 
            key={filter.key} 
            className="filter-dropdown-wrapper"
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className="filter-dropdown-btn"
              onMouseEnter={() => setOpenDropdown(filter.key)}
              onClick={() => setOpenDropdown(openDropdown === filter.key ? null : filter.key)}
            >
              <span>{filter.label}</span>
              <ChevronDown size={14} />
            </button>
            {openDropdown === filter.key && (
              <div className="filter-dropdown-menu">
                {filter.options.map((option, idx) => {
                  const selectedValue = getSelectedValue(filter.key);
                  const isActive = filter.key === 'price' 
                    ? (selectedValue && option.value && selectedValue.min === option.value.min && selectedValue.max === option.value.max)
                    : (selectedValue === (option.value || option.label));
                  
                  return (
                    <button
                      key={option.value?.label || option.value || idx}
                      className={`filter-dropdown-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleFilterSelect(filter.key, option)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalFilterBar;
