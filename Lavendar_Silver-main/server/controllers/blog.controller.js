const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ✅ CREATE BLOG
exports.createBlog = async (req, res) => {
    try {
        const { title, slug, content, author, tags, status, published_at } = req.body;

        // Validate required fields
        if (!title || !slug || !content) {
            return res.status(400).json({
                error: 'Title, slug, and content are required fields'
            });
        }

        // Check if slug already exists
        const [existing] = await db.execute('SELECT id FROM blogs WHERE slug = ?', [slug]);
        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Slug already exists. Please use a different title.'
            });
        }

        let thumbnail_url = null;

        // Handle image upload and compression (max 1MB)
        if (req.file) {
            try {
                // Ensure blogs directory exists
                const blogsDir = path.join(__dirname, '..', 'public', 'blogs');
                if (!fs.existsSync(blogsDir)) {
                    fs.mkdirSync(blogsDir, { recursive: true });
                }

                const inputPath = req.file.path;
                const compressedFilename = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}_compressed.jpg`;
                const outputPath = path.join(blogsDir, compressedFilename);

                // Helper function to compress to 1MB
                const maxSizeBytes = 1000 * 1024; // 1MB
                let quality = 85;
                let finalPath = outputPath;

                // Check original size
                const originalStats = fs.statSync(inputPath);
                if (originalStats.size <= maxSizeBytes) {
                    fs.copyFileSync(inputPath, outputPath);
                } else {
                    // Compress with decreasing quality until under 1MB
                    while (quality > 30) {
                        await sharp(inputPath)
                            .resize(800, 600, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .jpeg({
                                quality: quality,
                                progressive: true
                            })
                            .toFile(finalPath);

                        const stats = fs.statSync(finalPath);
                        if (stats.size <= maxSizeBytes) {
                            break;
                        }
                        quality -= 10;
                    }

                    // If still too large, resize further
                    const stats = fs.statSync(finalPath);
                    if (stats.size > maxSizeBytes) {
                        const metadata = await sharp(finalPath).metadata();
                        const newWidth = Math.floor(metadata.width * 0.8);
                        const newHeight = Math.floor(metadata.height * 0.8);

                        await sharp(inputPath)
                            .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
                            .jpeg({ quality: 75, progressive: true })
                            .toFile(finalPath);
                    }
                }

                // Delete the original uploaded file
                if (fs.existsSync(inputPath)) {
                    fs.unlinkSync(inputPath);
                }

                thumbnail_url = `/blogs/${compressedFilename}`;
            } catch (imageError) {
                console.error('Image processing error:', imageError);
                // Clean up the uploaded file if processing fails
                if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({
                    error: 'Failed to process image. Please try again.'
                });
            }
        }

        // Convert status to lowercase to match database enum
        const normalizedStatus = status ? status.toLowerCase() : 'draft';

        // Handle optional fields - convert empty strings to null
        const authorValue = author && author.trim() ? author.trim() : null;
        const tagsValue = tags && tags.trim() ? tags.trim() : null;
        const publishedAtValue = published_at || null;

        const [result] = await db.execute(
            'INSERT INTO blogs (title, slug, content, thumbnail_url, author, tags, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title.trim(), slug.trim(), content.trim(), thumbnail_url, authorValue, tagsValue, normalizedStatus, publishedAtValue]
        );

        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            data: {
                id: result.insertId,
                title: title.trim(),
                slug: slug.trim(),
                content: content.trim(),
                thumbnail_url,
                author: authorValue,
                tags: tagsValue,
                status: normalizedStatus,
                published_at: publishedAtValue
            }
        });

    } catch (err) {
        console.error('Blog creation error:', err);
        res.status(500).json({
            error: 'Failed to create blog. Please try again.'
        });
    }
};

// ✅ GET ALL BLOGS
exports.getAllBlogs = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM blogs ORDER BY created_at DESC');

        // Transform the data to match frontend expectations
        const blogs = rows.map(blog => ({
            id: blog.id,
            _id: blog.id, // For compatibility with frontend
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            thumbnail_url: blog.thumbnail_url,
            author: blog.author,
            tags: blog.tags,
            status: blog.status,
            published_at: blog.published_at,
            created_at: blog.created_at,
            date: blog.created_at ? new Date(blog.created_at).toLocaleDateString() : null
        }));

        res.status(200).json(blogs);
    } catch (err) {
        console.error('Get all blogs error:', err);
        res.status(500).json({
            error: 'Failed to fetch blogs'
        });
    }
};

// ✅ GET BLOG BY ID
exports.getBlogById = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM blogs WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Blog not found'
            });
        }

        const blog = rows[0];
        res.status(200).json({
            id: blog.id,
            _id: blog.id, // For compatibility
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            thumbnail_url: blog.thumbnail_url,
            author: blog.author,
            tags: blog.tags,
            status: blog.status,
            published_at: blog.published_at,
            created_at: blog.created_at,
            date: blog.created_at ? new Date(blog.created_at).toLocaleDateString() : null
        });
    } catch (err) {
        console.error('Get blog by ID error:', err);
        res.status(500).json({
            error: 'Failed to fetch blog'
        });
    }
};

// ✅ UPDATE BLOG
exports.updateBlog = async (req, res) => {
    try {
        const { title, slug, content, author, tags, status, published_at } = req.body;

        // Validate required fields
        if (!title || !slug || !content) {
            return res.status(400).json({
                error: 'Title, slug, and content are required fields'
            });
        }

        // Check if blog exists
        const [existingBlog] = await db.execute('SELECT * FROM blogs WHERE id = ?', [req.params.id]);
        if (existingBlog.length === 0) {
            return res.status(404).json({
                error: 'Blog not found'
            });
        }

        // Check if slug already exists for different blog
        const [slugCheck] = await db.execute('SELECT id FROM blogs WHERE slug = ? AND id != ?', [slug, req.params.id]);
        if (slugCheck.length > 0) {
            return res.status(409).json({
                error: 'Slug already exists. Please use a different title.'
            });
        }

        let thumbnail_url = existingBlog[0].thumbnail_url;

        // Handle new image upload
        if (req.file) {
            try {
                // Delete old thumbnail if exists
                if (existingBlog[0].thumbnail_url &&
                    existingBlog[0].thumbnail_url !== '/blogs/' &&
                    existingBlog[0].thumbnail_url.trim() !== '') {
                    const oldImagePath = path.join(__dirname, '..', 'public', existingBlog[0].thumbnail_url);
                    if (fs.existsSync(oldImagePath)) {
                        try {
                            fs.unlinkSync(oldImagePath);
                        } catch (deleteErr) {
                            console.error(`Error deleting old blog image: ${deleteErr.message}`);
                        }
                    }
                }

                // Ensure blogs directory exists
                const blogsDir = path.join(__dirname, '..', 'public', 'blogs');
                if (!fs.existsSync(blogsDir)) {
                    fs.mkdirSync(blogsDir, { recursive: true });
                }

                // Process new image (max 1MB)
                const compressedFilename = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}_compressed.jpg`;
                const outputPath = path.join(blogsDir, compressedFilename);
                const inputPath = req.file.path;

                // Helper function to compress to 1MB
                const maxSizeBytes = 1000 * 1024; // 1MB
                let quality = 85;
                let finalPath = outputPath;

                // Check original size
                const originalStats = fs.statSync(inputPath);
                if (originalStats.size <= maxSizeBytes) {
                    fs.copyFileSync(inputPath, outputPath);
                } else {
                    // Compress with decreasing quality until under 1MB
                    while (quality > 30) {
                        await sharp(inputPath)
                            .resize(800, 600, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .jpeg({
                                quality: quality,
                                progressive: true
                            })
                            .toFile(finalPath);

                        const stats = fs.statSync(finalPath);
                        if (stats.size <= maxSizeBytes) {
                            break;
                        }
                        quality -= 10;
                    }

                    // If still too large, resize further
                    const stats = fs.statSync(finalPath);
                    if (stats.size > maxSizeBytes) {
                        const metadata = await sharp(finalPath).metadata();
                        const newWidth = Math.floor(metadata.width * 0.8);
                        const newHeight = Math.floor(metadata.height * 0.8);

                        await sharp(inputPath)
                            .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
                            .jpeg({ quality: 75, progressive: true })
                            .toFile(finalPath);
                    }
                }

                // Delete the original uploaded file
                if (fs.existsSync(inputPath)) {
                    fs.unlinkSync(inputPath);
                }

                thumbnail_url = `/blogs/${compressedFilename}`;
            } catch (imageError) {
                console.error('Image processing error:', imageError);
                // Clean up the uploaded file if processing fails
                if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(500).json({
                    error: 'Failed to process image. Please try again.'
                });
            }
        }

        // Convert status to lowercase to match database enum
        const normalizedStatus = status ? status.toLowerCase() : 'draft';

        // Handle optional fields - convert empty strings to null
        const authorValue = author && author.trim() ? author.trim() : null;
        const tagsValue = tags && tags.trim() ? tags.trim() : null;
        const publishedAtValue = published_at || null;

        const [result] = await db.execute(
            'UPDATE blogs SET title=?, slug=?, content=?, thumbnail_url=?, author=?, tags=?, status=?, published_at=? WHERE id=?',
            [title.trim(), slug.trim(), content.trim(), thumbnail_url, authorValue, tagsValue, normalizedStatus, publishedAtValue, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Blog not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            data: {
                id: parseInt(req.params.id),
                title: title.trim(),
                slug: slug.trim(),
                content: content.trim(),
                thumbnail_url,
                author: authorValue,
                tags: tagsValue,
                status: normalizedStatus,
                published_at: publishedAtValue
            }
        });

    } catch (err) {
        console.error('Blog update error:', err);
        console.error('Request body:', req.body);
        console.error('Request params:', req.params);
        res.status(500).json({
            error: 'Failed to update blog. Please try again.'
        });
    }
};

// ✅ DELETE BLOG
exports.deleteBlog = async (req, res) => {
    try {
        // First get the blog to find the thumbnail path
        const [blogRows] = await db.execute('SELECT thumbnail_url FROM blogs WHERE id = ?', [req.params.id]);

        if (blogRows.length === 0) {
            return res.status(404).json({
                error: 'Blog not found'
            });
        }

        // Delete thumbnail file if it exists
        if (blogRows[0].thumbnail_url && blogRows[0].thumbnail_url !== '/blogs/' && blogRows[0].thumbnail_url.trim() !== '') {
            const imagePath = path.join(__dirname, '..', 'public', blogRows[0].thumbnail_url);
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (deleteErr) {
                    console.error(`Error deleting blog image: ${deleteErr.message}`);
                }
            }
        }

        // Delete the blog record
        const [result] = await db.execute('DELETE FROM blogs WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Blog not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Blog deleted successfully',
            data: {
                id: parseInt(req.params.id)
            }
        });

    } catch (err) {
        console.error('Blog deletion error:', err);
        res.status(500).json({
            error: 'Failed to delete blog. Please try again.'
        });
    }
};

// ✅ GET BLOG BY SLUG (for public access)
exports.getBlogBySlug = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM blogs WHERE slug = ? AND status = "published"', [req.params.slug]);

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Blog not found or not published'
            });
        }

        const blog = rows[0];
        res.status(200).json({
            id: blog.id,
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            thumbnail_url: blog.thumbnail_url,
            author: blog.author,
            tags: blog.tags,
            status: blog.status,
            published_at: blog.published_at,
            created_at: blog.created_at
        });
    } catch (err) {
        console.error('Get blog by slug error:', err);
        res.status(500).json({
            error: 'Failed to fetch blog'
        });
    }
};

// ✅ GET PUBLISHED BLOGS (for public access)
exports.getPublishedBlogs = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM blogs WHERE status = "published" ORDER BY published_at DESC, created_at DESC');

        const blogs = rows.map(blog => ({
            id: blog.id,
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            thumbnail_url: blog.thumbnail_url,
            author: blog.author,
            tags: blog.tags,
            status: blog.status,
            published_at: blog.published_at,
            created_at: blog.created_at
        }));

        res.status(200).json(blogs);
    } catch (err) {
        console.error('Get published blogs error:', err);
        res.status(500).json({
            error: 'Failed to fetch published blogs'
        });
    }
};