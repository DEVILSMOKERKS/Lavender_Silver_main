const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper: send error response with logging
function handleError(res, err, defaultMsg = 'Internal server error', status = 500) {
    console.error('CategoryController Error:', err && err.stack ? err.stack : err);
    let message = defaultMsg;
    if (err && err.code === 'ER_DUP_ENTRY') {
        message = 'A category with this slug already exists.';
        status = 409;
    } else if (err && err.message) {
        message = err.message;
    }
    res.status(status).json({ success: false, error: message });
}

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, status } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ success: false, error: 'Name and slug are required.' });
        }
        let image_url = null;
        if (req.file) {
            image_url = `/categories/${req.file.filename}`;
        }
        try {
            const [result] = await db.execute(
                'INSERT INTO categories (name, slug, description, image_url, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                [name, slug, description, image_url, status]
            );
            const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
            res.status(201).json({ success: true, data: rows[0] });
        } catch (err) {
            handleError(res, err, 'Failed to create category');
        }
    } catch (err) {
        handleError(res, err);
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        handleError(res, err, 'Failed to fetch categories');
    }
};

exports.getCategoryHierarchy = async (req, res) => {
    try {
        // Fetch all categories
        const [categories] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
        
        // Fetch all subcategories
        const [subcategories] = await db.execute('SELECT * FROM subcategories ORDER BY name ASC');
        
        // Fetch all sub-subcategories
        const [subSubcategories] = await db.execute('SELECT * FROM sub_subcategories ORDER BY sort_order ASC, name ASC');

        // Build hierarchy
        const hierarchy = categories.map(cat => {
            const catSubs = subcategories.filter(sub => sub.category_id === cat.id).map(sub => {
                const subSubSubs = subSubcategories.filter(ssc => ssc.subcategory_id === sub.id);
                return {
                    ...sub,
                    subSubcategories: subSubSubs
                };
            });
            return {
                ...cat,
                subcategories: catSubs
            };
        });

        res.status(200).json({ success: true, data: hierarchy });
    } catch (err) {
        handleError(res, err, 'Failed to fetch category hierarchy');
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Category not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        handleError(res, err, 'Failed to fetch category');
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, slug, description, status } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ success: false, error: 'Name and slug are required.' });
        }
        const [oldRows] = await db.execute('SELECT image_url FROM categories WHERE id = ?', [req.params.id]);
        if (oldRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        let image_url = oldRows[0].image_url;
        if (req.file) {
            const oldImageUrl = oldRows[0].image_url;
            if (oldImageUrl) {
                const oldImagePath = path.join(__dirname, '..', 'public', oldImageUrl);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                    } catch (unlinkErr) {
                        console.error('Error deleting old image:', unlinkErr);
                    }
                }
            }
            image_url = `/categories/${req.file.filename}`;
        }

        try {
            const [result] = await db.execute(
                'UPDATE categories SET name=?, slug=?, description=?, image_url=?, status=?, updated_at=NOW() WHERE id=?',
                [name, slug, description, image_url, status, req.params.id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Category not found' });
            }
            const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
            res.status(200).json({ success: true, data: rows[0] });
        } catch (err) {
            handleError(res, err, 'Failed to update category');
        }
    } catch (err) {
        handleError(res, err);
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const [categoryRows] = await db.execute('SELECT image_url FROM categories WHERE id = ?', [req.params.id]);
        if (categoryRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        const imageUrl = categoryRows[0].image_url;
        if (imageUrl) {
            const imagePath = path.join(__dirname, '..', 'public', imageUrl);
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (unlinkErr) {
                    console.error('Error deleting image file:', unlinkErr);
                }
            }
        }

        try {
            const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
            res.status(200).json({ success: true, message: 'Category deleted' });
        } catch (err) {
            handleError(res, err, 'Failed to delete category');
        }
    } catch (err) {
        handleError(res, err);
    }
}; 