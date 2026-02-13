import React, { useState, useEffect, useContext } from "react";
import { Search, Plus, Edit3, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import "./BlogGuide.css";

import blogImg from "../../../assets/img/blog-guide.png";
import editIcon from "../../../assets/img/icons/editing 1.png";
import deleteIcon from "../../../assets/img/icons/delete.png";

// Import CreateBlog component
import CreateBlog from "./CreateBlog";
import axios from "axios"; // Added for API calls
import { AdminContext } from "../../../context/AdminContext";
import EditBlog from "./EditBlog";

const BlogGuide = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All Status");
  const [openCreateBlog, setOpenCreateBlog] = useState(false);
  const [blogs, setBlogs] = useState([]); // State for blogs from DB
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error state
  const { token } = useContext(AdminContext);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  // State for edit blog popup
  const [openEditBlog, setOpenEditBlog] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  // Handler to open confirmation dialog
  const handleOpenDeleteDialog = (blogId) => {
    setBlogToDelete(blogId);
    setDeleteDialogOpen(true);
  };

  // Handler to close confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBlogToDelete(null);
  };

  // Handler to actually delete the blog
  const handleConfirmDelete = async () => {
    if (!blogToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/blogs/${blogToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBlogs((prev) => prev.filter((blog) => blog._id !== blogToDelete && blog.id !== blogToDelete));
    } catch (err) {
      alert("Failed to delete blog post.");
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // Handler to open edit blog popup
  const handleOpenEditBlog = (blog) => {
    setSelectedBlog(blog);
    setOpenEditBlog(true);
  };
  const handleCloseEditBlog = () => {
    setOpenEditBlog(false);
    setSelectedBlog(null);
  };
  const handleBlogUpdated = () => {
    // Refetch blogs after update
    setTimeout(() => {
      setOpenEditBlog(false);
      setSelectedBlog(null);
      // Refetch blogs by triggering the useEffect
      setOpenCreateBlog(false); // This will trigger the useEffect
    }, 100);
  };

  // Fetch blogs from backend
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/api/blogs`);
        setBlogs(res.data || []); // Fix: use res.data since backend returns array
      } catch (err) {
        setError("Failed to fetch blogs");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [openCreateBlog, deleteDialogOpen]); // Refetch when blog popup closes (after new blog)

  const handleOpenCreateBlog = () => {
    setOpenCreateBlog(true);
  };

  const handleCloseCreateBlog = () => {
    setOpenCreateBlog(false);
  };

  // Filter blogs based on search, category, and status
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      (blog.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.author || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handler to delete a blog
  const handleDeleteBlog = async (blogId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/blogs/${blogId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBlogs((prev) => prev.filter((blog) => blog._id !== blogId && blog.id !== blogId));
    } catch (err) {
      alert("Failed to delete blog post.");
    }
  };




  return (
    <div className="admin-blog-guide-container">
      <div className="admin-blog-guide-header">
        <h1 className="admin-blog-guide-title">Blog & Guides</h1>
      </div>



      <div className="admin-blog-guide-controls">
        <div className="admin-blog-guide-search-container">
          <Search className="admin-blog-guide-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search blog post..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-blog-guide-search-input"
          />
        </div>

        <div className="admin-blog-guide-filters">
          <div className="admin-blog-guide-filter-dropdown">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-blog-guide-dropdown"
            >
              <option value="All Status">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown className="admin-blog-guide-dropdown-icon" size={16} />
          </div>
        </div>

        <button
          className="admin-blog-guide-new-post-btn"
          onClick={handleOpenCreateBlog}
        >
          <Plus size={16} />
          New Blog post
        </button>
      </div>

      <div className="admin-blog-guide-blog-grid">
        {/* Show loading, error, or blogs */}
        {loading ? (
          <div>Loading blogs...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : filteredBlogs.length === 0 ? (
          <div>No blogs found.</div>
        ) : (
          filteredBlogs.map((blog) => (
            <div
              key={blog._id || blog.id}
              className={`admin-blog-guide-blog-card${blog.highlighted ? " highlighted" : ""
                }`}
            >
              <div className="admin-blog-guide-blog-image">
                <img
                  src={
                    blog.thumbnail_url
                      ? `${API_BASE_URL}${blog.thumbnail_url}`
                      : blogImg
                  }
                  alt={blog.title}
                />
                {/* Edit Icon (top-right) */}
                <button
                  className="admin-blog-guide-edit-btn-card"
                  title="Edit"
                  onClick={() => handleOpenEditBlog(blog)}
                >
                  <img src={editIcon} height="14px" width="14px" alt="Edit" loading="lazy" decoding="async" />
                </button>
                {/* Delete Icon (bottom-right) */}
                <button
                  className="admin-blog-guide-delete-btn-card"
                  title="Delete"
                  onClick={() => handleOpenDeleteDialog(blog._id || blog.id)}
                >
                  <img
                    src={deleteIcon}
                    style={{ height: "12px", width: "12px" }}
                    alt="Delete"
                  />
                </button>
              </div>

              {/* Blog Content Section */}
              <div className="admin-blog-guide-blog-content">
                <h3 className="admin-blog-guide-blog-title">
                  {blog.title}
                </h3>
                <p className="admin-blog-guide-blog-description">
                  {blog.content ? blog.content.replace(/<[^>]*>/g, '').substring(0, 80) + '...' : 'No description available'}
                </p>
              </div>

              {/* Bottom info section */}
              <div className="admin-blog-guide-blog-bottom">
                <div className="admin-blog-guide-blog-meta">
                  <span className="admin-blog-guide-author-name">{blog.author}</span>
                  <span className="admin-blog-guide-blog-date">
                    {blog.date || (blog.created_at ? new Date(blog.created_at).toLocaleDateString() : "")}
                  </span>
                </div>
                <div className="admin-blog-guide-blog-status">
                  <span className="admin-blog-guide-status-badge">{blog.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={openCreateBlog}
        onClose={handleCloseCreateBlog}
        maxWidth="lg"
        fullWidth
        className="admin-blog-guide-popup"
        slotProps={{
          paper: {
            sx: {
              maxHeight: "90vh",
              overflow: "auto",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e0e0e0",
            padding: "16px 24px",
          }}
        >
          Create New Blog Post
          <IconButton
            onClick={handleCloseCreateBlog}
            sx={{
              color: "white",
              "&:hover": {
                color: "white",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: "24px" }}>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <CreateBlog isPopup={true} onClose={handleCloseCreateBlog} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Blog Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: '18px',
              padding: 0,
              minWidth: '340px',
              textAlign: 'center',
            },
          },
        }}
      >
        <DialogContent sx={{ padding: '32px 24px 28px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 24 }}>
            Are you sure you want to delete this blog?
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button
              onClick={handleConfirmDelete}
              style={{
                background: '#bfa16a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 28px',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
                marginRight: 8,
                boxShadow: 'none',
                outline: 'none',
                transition: 'background 0.2s',
              }}
            >
              Yes
            </button>
            <button
              onClick={handleCloseDeleteDialog}
              style={{
                background: '#f3f3f3',
                color: '#444',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 28px',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: 'none',
                outline: 'none',
                transition: 'background 0.2s',
              }}
            >
              No
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Blog Popup */}
      <EditBlog
        open={openEditBlog}
        onClose={handleCloseEditBlog}
        blog={selectedBlog}
        onUpdated={handleBlogUpdated}
      />
    </div>
  );
};

export default BlogGuide;
