import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './SingleBlog.css';
import axios from 'axios';
import { FaCalendarAlt, FaTag } from 'react-icons/fa';

export default function SingleBlog() {
    const { blogslug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        window.scrollTo(0, 0);

        axios.get(`${API_BASE_URL}/api/blogs/slug/${blogslug}`)
            .then(response => {
                setArticle(response.data);
                setLoading(false);

                // Fetch related articles
                axios.get(`${API_BASE_URL}/api/blogs?limit=3`)
                    .then(relatedRes => {
                        const filtered = relatedRes.data.filter(blog =>
                            blog.id !== response.data.id
                        ).slice(0, 3);
                        setRelatedArticles(filtered);
                    })
                    .catch(err => console.error('Error fetching related blogs:', err));
            })
            .catch(error => {
                console.error('Error fetching blog:', error);
                setArticle(null);
                setLoading(false);
            });
    }, [blogslug]);

    if (loading) return (
        <div className="single-blog-container">
            <div className="single-blog-section loading-state">
                <div className="loading-animation">Loading...</div>
            </div>
        </div>
    );

    if (!article) return (
        <div className="single-blog-container">
            <div className="single-blog-section error-state">
                <h2>Blog not found</h2>
                <p>The article you're looking for doesn't exist or has been removed.</p>
            </div>
        </div>
    );

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="single-blog-container">
            <div className="single-blog-hero"
                style={{
                    backgroundImage: article.thumbnail_url ?
                        `linear-gradient(rgba(14, 89, 60, 0.7), rgba(14, 89, 60, 0.4)), url("${API_BASE_URL}${article.thumbnail_url}")` :
                        'var(--pvj-featured-bg)'
                }}>
                <div className="single-blog-hero-content">
                    <h1>{article.title}</h1>
                    <div className="single-blog-meta">
                        <div className="meta-item">
                            <FaCalendarAlt />
                            <span>{formatDate(article.created_at)}</span>
                        </div>
                        {article.tags && (
                            <div className="meta-item tags-container">
                                <FaTag style={{ marginRight: '5px' }} />
                                <span>
                                    {article.tags.split(',').map((tag, index) => (
                                        <span key={index} className="blog-tag">{tag.trim()}</span>
                                    ))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="single-blog-section">
                <div className="single-blog-content">
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                </div>

                {relatedArticles.length > 0 && (
                    <div className="related-articles">
                        <h3 className="related-title">Related Articles</h3>
                        <div className="related-grid">
                            {relatedArticles.map(blog => (
                                <a key={blog.id} href={`/blog/${blog.slug}`} className="related-card">
                                    <div className="related-image"
                                        style={{
                                            backgroundImage: blog.thumbnail_url ?
                                                `url("${API_BASE_URL}${blog.thumbnail_url}")` :
                                                'var(--pvj-featured-bg)'
                                        }}>
                                    </div>
                                    <div className="related-content">
                                        <h4>{blog.title}</h4>
                                        <span className="related-date">{formatDate(blog.created_at)}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}