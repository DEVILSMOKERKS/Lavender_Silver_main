import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import './CollectionBanner.css';

const CollectionBanner = () => {
  const collectionCategories = [
    {
      id: 1,
      name: 'Infinity',
      icon: '∞',
      iconColor: '#3B82F6',
      image: '/api/placeholder/200/200',
      slug: 'infinity'
    },
    {
      id: 2,
      name: 'Knots',
      icon: '🔗',
      iconColor: '#F59E0B',
      image: '/api/placeholder/200/200',
      slug: 'knots'
    },
    {
      id: 3,
      name: 'Water Drops',
      icon: '💧',
      iconColor: '#60A5FA',
      image: '/api/placeholder/200/200',
      slug: 'water-drops'
    },
    {
      id: 4,
      name: 'Sets',
      icon: '💎',
      iconColor: '#10B981',
      image: '/api/placeholder/200/200',
      slug: 'sets'
    },
    {
      id: 5,
      name: 'Bubbles',
      icon: '🫧',
      iconColor: '#60A5FA',
      image: '/api/placeholder/200/200',
      slug: 'bubbles'
    },
    {
      id: 6,
      name: 'Moon & Stars',
      icon: '🌙',
      iconColor: '#FBBF24',
      image: '/api/placeholder/200/200',
      slug: 'moon-stars'
    }
  ];

  return (
    <div className="collection-banner-section">
      {/* Header Banner */}
      <div className="collection-header-banner">
        <div className="collection-banner-content">
          <div className="collection-banner-text">
            <div className="collection-script-text">All yours</div>
            <div className="collection-title">
              <span className="collection-title-line"></span>
              Collection
              <span className="collection-title-line"></span>
            </div>
            <div className="collection-tagline">Em❤️tion, made real,</div>
            <div className="collection-offer">
              FLAT 20% OFF
              <span className="collection-heart">❤️</span>
            </div>
            <div className="collection-offer-subtext">On silver jewellery.</div>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="collection-categories-grid">
        {collectionCategories.map((category) => (
          <Link
            key={category.id}
            to={`/shop?collection=${category.slug}`}
            className="collection-category-card"
          >
            <div className="collection-card-icon">
              <Heart size={20} fill="#fff" />
              <span className="collection-icon-symbol" style={{ color: category.iconColor }}>
                {category.icon}
              </span>
            </div>
            <div className="collection-card-image">
              <img 
                src={category.image} 
                alt={category.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="collection-card-name">{category.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CollectionBanner;
