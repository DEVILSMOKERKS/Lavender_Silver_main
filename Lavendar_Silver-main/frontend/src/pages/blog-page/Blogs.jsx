import React, { useState, useEffect } from "react";
import "./blogs.css";
import { FaArrowRight, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import diamondIcon from "../../assets/img/icons/diamond.png";
import img1 from "../../assets/img/about2.jpg";
import about1 from "../../assets/img/Rectangle 106.png";
import PvjMember from "../../components/pvj-member/PvjMember";
import arrowRi from "../../assets/img/icons/Arrow 1.png";
import axios from 'axios';

const Blogs = () => {
  const [articles, setArticles] = useState([]);
  const [visibleCards, setVisibleCards] = useState(3);
  const [loadingMore, setLoadingMore] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCards((prev) => prev + 3);
      setLoadingMore(false);
    }, 1000);
  };

  // date formate function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  };

  // Function to truncate content for description
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // fetch blogs
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/blogs`)
      .then((response) => {
        setArticles(response.data);
      })
      .catch((error) => {
        console.error("Error fetching in blogs", error);
      })
  }, []);

  return (
    <div className="blog-page-root">
      {/* Banner Section */}
      <div className="blog-page-banner">
        <div className="blog-page-banner-overlay">
          <h1 className="blog-page-banner-title">BLOG</h1>
        </div>
      </div>

      {/* First Card Section */}
      <div className="blog-page-card-section">
        {articles.length === 0 ? (
          <div className="blogs-page-no-blogs-container">
            <div className="blogs-page-no-blogs-icon">
              <div className="blogs-page-icon-circle">
                <span className="blogs-page-icon">📝</span>
              </div>
            </div>
            <div className="blogs-page-no-blogs-content">
              <h3 className="blogs-page-no-blogs-title">Coming Soon</h3>
              <p className="blogs-page-no-blogs-subtitle">Latest blogs are coming soon...</p>
              <p className="blogs-page-no-blogs-description">
                We're working on bringing you amazing content about jewelry, craftsmanship, and the latest trends in the world of fine jewelry.
              </p>
              <div className="blogs-page-no-blogs-features">
                <div className="blogs-page-feature-item">
                  <span className="blogs-page-feature-icon">💎</span>
                  <span className="blogs-page-feature-text">Jewelry Trends</span>
                </div>
                <div className="blogs-page-feature-item">
                  <span className="blogs-page-feature-icon">🔨</span>
                  <span className="blogs-page-feature-text">Craftsmanship</span>
                </div>
                <div className="blogs-page-feature-item">
                  <span className="blogs-page-feature-icon">✨</span>
                  <span className="blogs-page-feature-text">Expert Tips</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          articles.slice(0, visibleCards).map((card, idx) => (
            <Link to={`/blog/${card.slug}`} style={{ textDecoration: 'none', color: 'inherit' }} key={idx}>
              <div className="blog-page-card">
                <img
                  src={card.thumbnail_url ? `${API_BASE_URL}${card.thumbnail_url}` : img1}
                  alt="blog"
                  className="blog-page-card-img"
                />
                <div className="blog-page-card-content">
                  <div>
                    <div className="blog-page-card-meta">
                      <span className="blog-page-card-date">{formatDate(card.created_at)}</span>
                      <span className="blog-card-dot">•</span>
                      <span className="blog-page-card-category">PVJ Jwellery</span>
                    </div>
                    <div className="blog-page-card-title">{card.title}</div>
                    <div className="blog-page-card-desc">{truncateContent(card.content)}</div>
                  </div>
                  <div>
                    <div className="blog-page-card-btn">
                      Read More
                      <img src={arrowRi} alt="arrow" className="blog-page-card-arrow" loading="lazy" decoding="async" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Latest Stories Section */}
      <div className="blog-page-latest-stories">
        <h2 className="blog-page-latest-title">LATEST STORIES</h2>
        <p className="blogpage-line"></p>
        {articles.length > 0 ? (
          <div className="blog-page-latest-content">
            <Link
              to={`/blog/${articles[0].slug}`}
              className="blog-page-latest-img-wrap"
              style={{ display: "block" }}
            >
              <img
                src={articles[0].thumbnail_url ? `${API_BASE_URL}${articles[0].thumbnail_url}` : about1}
                alt="latest story"
                className="blog-page-latest-img"
                loading="lazy"
              />
            </Link>
            <div className="blog-page-latest-text">
              <div className="blog-page-latest-heading">
                {articles[0].title}
              </div>
              <div className="blog-page-latest-desc">
                {truncateContent(articles[0].content, 300)}
              </div>
              <div className="blog-page-latest-author-row">
                <div className="blog-page-latest-author-img">
                  <FaUser style={{ fontSize: 22, color: "#888" }} />
                </div>
                <div>
                  <div className="blog-page-latest-author-name">PVJ Jwellery</div>
                  <div className="blog-page-latest-date">
                    {formatDate(articles[0].created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="blog-page-latest-no-content">
            <div className="blog-page-latest-no-content-icon">
              <span className="blog-page-latest-no-icon">📰</span>
            </div>
            <div className="blog-page-latest-no-content-text">
              <h4 className="blog-page-latest-no-title">Stay Tuned</h4>
              <p className="blog-page-latest-no-desc">
                We're preparing amazing stories about jewelry craftsmanship, trends, and expert insights. Check back soon for our latest articles!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Second Card Section */}
      <div className="blogs-page-card-section">
        {articles.slice(0, visibleCards).map((card, idx) => (
          <Link to={`/blog/${card.slug}`} style={{ textDecoration: 'none', color: 'inherit' }} key={idx + "second"}>
            <div className="blog-page-card">
              <img
                src={card.thumbnail_url ? `${API_BASE_URL}${card.thumbnail_url}` : img1}
                alt="blog"
                className="blog-page-card-img"
                loading="lazy"
              />
              <div className="blog-page-card-content">
                <div>
                  <div className="blog-page-card-meta">
                    <span className="blog-page-card-date">{formatDate(card.created_at)}</span>
                    <span className="blog-card-dot">•</span>
                    <span className="blog-page-card-category">PVJ Jwellery</span>
                  </div>
                  <div className="blog-page-card-title">{card.title}</div>
                  <div className="blog-page-card-desc">{truncateContent(card.content)}</div>
                </div>
                <div>
                  <div className="blog-page-card-btn">
                    Read More
                    <img src={arrowRi} alt="arrow" className="blog-page-card-arrow" loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Load More Button */}
      <div className="blog-page-loadmore-wrap">
        {loadingMore ? (
          <button className="blog-page-loadmore-btn" disabled>
            <span className="blog-page-loader"></span> Loading...
          </button>
        ) : (
          <button
            className="blog-page-loadmore-btn"
            onClick={handleLoadMore}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default Blogs;
