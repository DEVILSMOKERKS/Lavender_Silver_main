const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.createSubcategory = async (req, res) => {
    try {
        const { category_id, name, slug, description, status } = req.body;
        let image_url = null;
        if (req.file) {
            image_url = `/subcategories/${req.file.filename}`;
        }
        const [result] = await db.execute(
            'INSERT INTO subcategories (category_id, name, slug, description, image_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [category_id, name, slug, description, image_url, status]
        );
        const [rows] = await db.execute('SELECT * FROM subcategories WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAllSubcategories = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM subcategories ORDER BY created_at DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getSubcategoryById = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM subcategories WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Subcategory not found' });
        res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubcategoriesByCategoryId = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM subcategories WHERE category_id = ?', [req.params.categoryId]);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateSubcategory = async (req, res) => {
    try {
        const { category_id, name, slug, description, status } = req.body;
        const [oldRows] = await db.execute('SELECT image_url FROM subcategories WHERE id = ?', [req.params.id]);
        if (oldRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Subcategory not found' });
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
            image_url = `/subcategories/${req.file.filename}`;
        }

        const [result] = await db.execute(
            'UPDATE subcategories SET category_id=?, name=?, slug=?, description=?, image_url=?, status=? WHERE id=?',
            [category_id, name, slug, description, image_url, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Subcategory not found' });
        }

        const [rows] = await db.execute('SELECT * FROM subcategories WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSubcategory = async (req, res) => {
    try {
        const [subcategoryRows] = await db.execute('SELECT image_url FROM subcategories WHERE id = ?', [req.params.id]);
        if (subcategoryRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Subcategory not found' });
        }

        const imageUrl = subcategoryRows[0].image_url;
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

        const [result] = await db.execute('DELETE FROM subcategories WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'Subcategory deleted' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
}; 