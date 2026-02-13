import React, { useState, useEffect } from 'react';
import './blog.css';
import { Link, useNavigate } from 'react-router-dom';
import diamondIcon from '../../assets/img/icons/diamond.png';
import { FaArrowRightLong } from "react-icons/fa6";
import { FaRegNewspaper } from "react-icons/fa";


import axios from 'axios';
import defaultBlogImage from '../../assets/img/blog-guide.png';

const Blog = () => {

  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // date formate function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })

  };

  // fetch blogs
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/blogs`)
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setArticles(response.data);
        } else {
          console.error("API response for blogs is not in the expected format:", response.data);
          setArticles([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching in blogs", error);
        setArticles([]);
      })

  }, []);

  // Handle Read More click: increment views then navigate
  const handleReadMore = async (slug) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/blogs/slug/${slug}/views`);
      navigate(`/blog/${slug}`);
    } catch (err) {
      navigate(`/blog/${slug}`);
    }
  };

  return (
    <div className="blog-page-card-section">
      {articles.length === 0 ? (
        <div className="home-blogs-page-no-blogs-message">
          <FaRegNewspaper className="no-blogs-icon" />
          <p className="home-blogs-page-no-blogs-message-content">
            No blogs found at the moment.
          </p>
          <p className="home-blogs-page-no-blogs-subtext">
            Explore more soon – valuable stories are being written for you.
          </p>
        </div>
      ) : (
        <div className="blog-section">
          <div className="blog-header">
            <img src={diamondIcon} alt="diamond" className="blog_diamond-icon" loading="lazy" decoding="async" />
            <div className="blog-title-row">
              <span className="blog_line1" />
              <h2 className="blog-title">LATEST ARTICLES & GUIDES</h2>
              <span className="blog_line2" />
            </div>
            <p className="blog-subtitle">Stay Informed With Our Expert Knowledge And Insights About Gold</p>
          </div>
          <div className="blog-cards">
            {articles.slice(0, 3).map((article, idx) => (
              <div className="blog-card" key={idx}>
                <div className="blog-card-img-wrapper">
                  <div className="blog-card-img">
                    {article.thumbnail_url ? (
                      <img src={`${API_BASE_URL}${article.thumbnail_url}`} alt="blog" loading="lazy" decoding="async" />
                    ) : (
                      <img src={defaultBlogImage} alt="blog" loading="lazy" decoding="async" />
                    )}
                  </div>
                </div>
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span className="blog-card-date">{formatDate(article.created_at)}</span>
                    <span className="blog-card-dot">• {article.status}</span>
                  </div>
                  <div className="blog-card-title">{article.title}</div>
                  <div
                    className="blog-card-desc"
                    dangerouslySetInnerHTML={{ __html: article.content || '' }}
                  />
                  <div className="blog-card-link">
                    <button
                      className="blog-read-more-btn"
                      onClick={() => handleReadMore(article.slug)}
                      style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      Read More <FaArrowRightLong className="arrow" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="blog-footer">
            <Link to='/blogs'><button className="view-all-btn">View All Articles</button></Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;
