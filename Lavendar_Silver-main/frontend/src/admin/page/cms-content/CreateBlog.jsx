import React, { useState, useEffect, useContext, useRef, lazy, Suspense } from 'react';

import './CreateBlog.css';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ErrorBoundary from '../../../components/ErrorBoundary';
const TipTapEditor = lazy(() => import('../../components/TipTapEditor/TipTapEditor'));

const CreateBlog = ({ isPopup = false, onClose }) => {
    const { token } = useContext(AdminContext)
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        author: '',
        tags: '',
        status: 'draft',
        thumbnail: null,
        published_at: ''
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user edits any field
        setSuccess(''); // Clear success message when user edits
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            thumbnail: file
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate required fields
        if (!formData.title.trim()) {
            setError('Title is required');
            setLoading(false);
            return;
        }
        if (!formData.slug.trim()) {
            setError('Slug is required');
            setLoading(false);
            return;
        }
        if (!formData.content.trim()) {
            setError('Content is required');
            setLoading(false);
            return;
        }

        try {
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('title', formData.title.trim());
            submitData.append('slug', formData.slug.trim());
            submitData.append('content', formData.content.trim());
            submitData.append('author', formData.author ? formData.author.trim() : '');
            submitData.append('tags', formData.tags || '');
            submitData.append('status', formData.status);
            submitData.append('published_at', formData.published_at || '');

            if (formData.thumbnail) {
                submitData.append('image', formData.thumbnail);
            }

            const response = await axios.post(`${API_BASE_URL}/api/blogs`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
                timeout: 30000, // 30 second timeout
            });

            if (response.status === 201 || response.status === 200) {
                setSuccess('Blog post created successfully!');
                // Reset form
                setFormData({
                    title: '',
                    slug: '',
                    content: '',
                    author: '',
                    tags: '',
                    status: 'draft',
                    thumbnail: null,
                    published_at: ''
                });

                // Close popup if in popup mode
                if (isPopup && onClose) {
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                }
            }
        } catch (err) {
            console.error('Error creating blog:', err);
            console.error('Error response:', err.response?.data);

            let errorMessage = 'Failed to create blog post. Please try again.';

            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please try again.';
            } else if (err.response?.status === 409) {
                errorMessage = 'A blog with this slug already exists. Please change the title or slug.';
                // Generate a new random slug
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                setFormData(prev => ({
                    ...prev,
                    slug: prev.slug.replace(/(-[a-z0-9]{6})?$/, '') + '-' + randomSuffix
                }));
            } else if (err.response?.status === 400) {
                errorMessage = 'Invalid data provided. Please check all fields.';
            } else if (err.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate slug from title
    useEffect(() => {
        if (formData.title) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setFormData(prev => ({
                ...prev,
                slug: slug
            }));
        }
    }, [formData.title]);

    return (
        <div className={isPopup ? "" : "admin-create-blog"}>
            <div className={isPopup ? "" : "admin-create-blog-container"}>
                {!isPopup && <h1 className="admin-create-blog-title">Create New Blog Post</h1>}

                {/* Success and Error Messages */}
                {success && (
                    <div className="admin-create-blog-success">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="admin-create-blog-error">
                        {error}
                    </div>
                )}

                <form className="admin-create-blog-form" onSubmit={handleSubmit}>
                    {/* Top Section - Title and Slug */}
                    <div className="admin-create-blog-row">
                        <div className="admin-create-blog-field">
                            <label className="admin-create-blog-label">Blog Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="admin-create-blog-input"
                                placeholder="Enter blog title"
                                required
                            />
                        </div>
                        <div className="admin-create-blog-field">
                            <label className="admin-create-blog-label">Blog Slug</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                className="admin-create-blog-input"
                                placeholder="Enter blog slug"
                                required
                            />
                        </div>
                    </div>

                    {/* Blog Content Section */}
                    <div className="admin-create-blog-content-section">
                        <label className="admin-create-blog-label">Blog Content</label>
                        <div className="admin-create-blog-editor">

                            <ErrorBoundary>
                                <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading editor...</div>}>
                                    <TipTapEditor
                                        value={formData.content}
                                        onChange={value => setFormData(prev => ({ ...prev, content: value }))}
                                        placeholder="Write your blog content here..."
                                        className="admin-create-blog-textarea"
                                    />
                                </Suspense>
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* Middle Section - Author and Status */}
                    <div className="admin-create-blog-row">
                        <div className="admin-create-blog-field">
                            <label className="admin-create-blog-label">Author Name</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleInputChange}
                                className="admin-create-blog-input"
                                placeholder="Enter author name"
                            />
                        </div>
                        <div className="admin-create-blog-field">
                            <label className="admin-create-blog-label">Publish Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="admin-create-blog-select"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags and Published Date Section */}
                    <div className="admin-create-blog-row">
                        <div className="admin-create-blog-field">
                            <label className="admin-create-blog-label">Tags (comma separated)</label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleInputChange}
                                className="admin-create-blog-input"
                                placeholder="Enter tags separated by commas"
                            />
                        </div>
                        <div className="admin-create-blog-field">
                            <label className="admin-create-blog-label">Published Date</label>
                            <input
                                type="datetime-local"
                                name="published_at"
                                value={formData.published_at}
                                onChange={handleInputChange}
                                className="admin-create-blog-input"
                            />
                        </div>
                    </div>

                    {/* Thumbnail Section */}
                    <div className="admin-create-blog-field">
                        <label className="admin-create-blog-label">Thumbnail Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="admin-create-blog-file-input"
                        />
                        {formData.thumbnail && (
                            <div className="admin-create-blog-new-image">
                                <p className="admin-create-blog-file-name">
                                    Selected: {formData.thumbnail.name}
                                </p>
                                <img
                                    src={URL.createObjectURL(formData.thumbnail)}
                                    alt="New thumbnail preview"
                                    className="admin-create-blog-image-preview"
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="admin-create-blog-submit">
                        <button
                            type="submit"
                            className="admin-create-blog-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="admin-create-blog-spinner"></div>
                                    Creating Blog Post...
                                </>
                            ) : (
                                'Create Blog Post'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBlog;
