import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import './EditBlog.css';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
const TipTapEditor = lazy(() => import('../../components/TipTapEditor/TipTapEditor'));

const EditBlog = ({ open, onClose, blog, onUpdated }) => {
  const { token } = useContext(AdminContext);
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    author: '',
    tags: '',
    status: 'draft',
    thumbnail: null,
    published_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        content: blog.content || '',
        author: blog.author || '',
        tags: blog.tags || '',
        status: blog.status || 'draft',
        thumbnail: null,
        published_at: blog.published_at || '',
      });
    }
  }, [blog]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, thumbnail: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields (only title and slug are required based on DB schema)
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

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('slug', formData.slug.trim());
      submitData.append('content', formData.content || '');
      submitData.append('author', formData.author ? formData.author.trim() : '');
      submitData.append('tags', formData.tags || '');
      submitData.append('status', formData.status || 'draft');
      submitData.append('published_at', formData.published_at || '');

      // Only append image if a new file is selected
      if (formData.thumbnail) {
        submitData.append('image', formData.thumbnail);
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/blogs/${blog.id || blog._id}`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.status === 200 || response.status === 201) {
        setSuccess('Blog post updated successfully!');
        if (onUpdated) onUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Blog update error:', err);
      console.error('Error response:', err.response?.data);

      let errorMessage = 'Failed to update blog post. Please try again.';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check all fields.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Blog post not found.';
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
      setFormData((prev) => ({ ...prev, slug }));
    }
    // eslint-disable-next-line
  }, [formData.title]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      className="admin-edit-blog"
      slotProps={{
        paper: {
          className: 'admin-edit-blog-paper',
        },
      }}
    >
      <DialogTitle className="admin-edit-blog-title-row">
        Edit Blog Post
        <IconButton onClick={onClose} className="admin-edit-blog-close-btn">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent className="admin-edit-blog-content">
        <div className="admin-edit-blog-form-wrapper">
          {success && <div className="admin-edit-blog-success">{success}</div>}
          {error && <div className="admin-edit-blog-error">{error}</div>}

          {/* Blog Status Indicator */}
          {blog && (
            <div className="admin-edit-blog-status-indicator">
              <span className="admin-edit-blog-status-label">Current Status:</span>
              <span className={`admin-edit-blog-status-badge admin-edit-blog-status-${blog.status || 'draft'}`}>
                {blog.status || 'draft'}
              </span>
            </div>
          )}
          <form className="admin-edit-blog-form" onSubmit={handleSubmit}>
            <div className="admin-edit-blog-row">
              <div className="admin-edit-blog-field">
                <label className="admin-edit-blog-label">Blog Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="admin-edit-blog-input"
                  placeholder="Enter blog title"
                  required
                />
              </div>
              <div className="admin-edit-blog-field">
                <label className="admin-edit-blog-label">Blog Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="admin-edit-blog-input"
                  placeholder="Enter blog slug"
                  required
                />
              </div>
            </div>
            <div className="admin-edit-blog-content-section">
              <label className="admin-edit-blog-label">Blog Content</label>
              <div className="admin-edit-blog-editor">
                <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading editor...</div>}>
                  <TipTapEditor
                    value={formData.content}
                    onChange={value => setFormData(prev => ({ ...prev, content: value }))}
                    placeholder="Write your blog content here..."
                    className="admin-edit-blog-textarea"
                  />
                </Suspense>
              </div>
            </div>
            <div className="admin-edit-blog-row">
              <div className="admin-edit-blog-field">
                <label className="admin-edit-blog-label">Author Name</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="admin-edit-blog-input"
                  placeholder="Enter author name"
                />
              </div>
              <div className="admin-edit-blog-field">
                <label className="admin-edit-blog-label">Publish Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="admin-edit-blog-select"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="admin-edit-blog-row">
              <div className="admin-edit-blog-field">
                <label className="admin-edit-blog-label">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="admin-edit-blog-input"
                  placeholder="Enter tags separated by commas"
                />
              </div>
              <div className="admin-edit-blog-field">
                <label className="admin-edit-blog-label">Published Date</label>
                <input
                  type="datetime-local"
                  name="published_at"
                  value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                  onChange={handleInputChange}
                  className="admin-edit-blog-input"
                />
              </div>
            </div>
            <div className="admin-edit-blog-row">
              <div className="admin-edit-blog-field">
                <label className="admin-edit-blog-label">Thumbnail Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="admin-edit-blog-file-input"
                />
                {blog && blog.thumbnail_url && !formData.thumbnail && (
                  <div className="admin-edit-blog-current-image">
                    <p className="admin-edit-blog-file-name">
                      Current: {blog.thumbnail_url.split('/').pop()}
                    </p>
                    {blog.thumbnail_url && blog.thumbnail_url !== '/blogs/' && (
                      <img
                        src={`${API_BASE_URL}${blog.thumbnail_url}`}
                        alt="Current thumbnail"
                        className="admin-edit-blog-image-preview"
                      />
                    )}
                  </div>
                )}
                {formData.thumbnail && (
                  <div className="admin-edit-blog-new-image">
                    <p className="admin-edit-blog-file-name">
                      Selected: {formData.thumbnail.name}
                    </p>
                    <img
                      src={URL.createObjectURL(formData.thumbnail)}
                      alt="New thumbnail preview"
                      className="admin-edit-blog-image-preview"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="admin-edit-blog-submit">
              <button
                type="submit"
                className="admin-edit-blog-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="admin-edit-blog-spinner"></div>
                    Updating Blog Post...
                  </>
                ) : (
                  'Update Blog Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBlog;
