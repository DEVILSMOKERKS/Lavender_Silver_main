import React from 'react';
import './SearchDropdown.css';
import { Link } from 'react-router-dom';

const SearchDropdown = ({ results = [], loading, onProductClick, onClose }) => {
    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClick = (e) => {
            if (!e.target.closest('.search-dropdown-container')) {
                onClose && onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    return (
        <div className="search-dropdown-container">
            <div className="search-dropdown-list">
                {loading ? (
                    <div className="search-dropdown-loading">Loading...</div>
                ) : results.length === 0 ? (
                    <>
                        <div className="search-dropdown-no-results">No products found</div>
                        <div className="search-dropdown-viewall-wrapper">
                            <Link to="/shop" className="search-dropdown-viewall-btn">
                                View All
                            </Link>
                        </div>
                    </>

                ) : (
                    results.map(product => (
                        <div
                            key={product.id}
                            className="search-dropdown-item"
                            onClick={() => onProductClick(product.slug || product.id)}
                        >
                            <img
                                src={product.image ? `${import.meta.env.VITE_API_URL}${product.image}` : '/placeholder.jpg'}
                                alt={product.item_name}
                                className="search-dropdown-img"
                                onError={(e) => {
                                    e.target.src = '/placeholder.jpg'; // Add a placeholder image in your public folder
                                }}
                            />
                            <div className="search-dropdown-info">
                                <span className="search-dropdown-name">{product.name}
                                </span>
                                <span className="search-dropdown-price">₹{product.price.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* View All Button */}
            {(!loading && results.length > 0) && (
                <div className="search-dropdown-viewall-wrapper">
                    <Link to="/shop" className="search-dropdown-viewall-btn">
                        View All
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SearchDropdown; 