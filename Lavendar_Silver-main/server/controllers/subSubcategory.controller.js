const db = require('../config/db');

// Generate slug from name
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Generate unique slug
const generateUniqueSlug = async (name, excludeId = null) => {
    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        let query = 'SELECT id FROM sub_subcategories WHERE slug = ?';
        let params = [slug];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [existing] = await db.execute(query, params);

        if (existing.length === 0) {
            return slug;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
    }
};

// Get all sub-subcategories
const getAllSubSubcategories = async (req, res) => {
    try {
        const { subcategory_id } = req.query;
        let query = `
            SELECT ssc.*, sc.name as subcategory_name, c.name as category_name
            FROM sub_subcategories ssc
            LEFT JOIN subcategories sc ON ssc.subcategory_id = sc.id
            LEFT JOIN categories c ON sc.category_id = c.id
        `;
        let params = [];

        if (subcategory_id) {
            query += ' WHERE ssc.subcategory_id = ?';
            params.push(subcategory_id);
        }

        query += ' ORDER BY ssc.sort_order ASC, ssc.name ASC';

        const [subSubcategories] = await db.execute(query, params);

        res.json({
            success: true,
            data: subSubcategories
        });
    } catch (error) {
        console.error('Error fetching sub-subcategories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sub-subcategories'
        });
    }
};

// Get sub-subcategory by ID
const getSubSubcategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [subSubcategories] = await db.execute(`
            SELECT ssc.*, sc.name as subcategory_name, c.name as category_name
            FROM sub_subcategories ssc
            LEFT JOIN subcategories sc ON ssc.subcategory_id = sc.id
            LEFT JOIN categories c ON sc.category_id = c.id
            WHERE ssc.id = ?
        `, [id]);

        if (subSubcategories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sub-subcategory not found'
            });
        }

        res.json({
            success: true,
            data: subSubcategories[0]
        });
    } catch (error) {
        console.error('Error fetching sub-subcategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sub-subcategory'
        });
    }
};

// Create new sub-subcategory
const createSubSubcategory = async (req, res) => {
    try {
        const { name, subcategory_id, description, sort_order } = req.body;

        if (!name || !subcategory_id) {
            return res.status(400).json({
                success: false,
                message: 'Name and subcategory_id are required'
            });
        }

        // Check if subcategory exists
        const [subcategory] = await db.execute(
            'SELECT * FROM subcategories WHERE id = ?',
            [subcategory_id]
        );

        if (subcategory.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        const slug = await generateUniqueSlug(name);

        const [result] = await db.execute(
            'INSERT INTO sub_subcategories (name, slug, subcategory_id, description, sort_order) VALUES (?, ?, ?, ?, ?)',
            [name, slug, subcategory_id, description || null, sort_order || 0]
        );

        const [newSubSubcategory] = await db.execute(`
            SELECT ssc.*, sc.name as subcategory_name, c.name as category_name
            FROM sub_subcategories ssc
            LEFT JOIN subcategories sc ON ssc.subcategory_id = sc.id
            LEFT JOIN categories c ON sc.category_id = c.id
            WHERE ssc.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Sub-subcategory created successfully',
            data: newSubSubcategory[0]
        });
    } catch (error) {
        console.error('Error creating sub-subcategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating sub-subcategory'
        });
    }
};

// Update sub-subcategory
const updateSubSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subcategory_id, description, sort_order, status } = req.body;

        const [existing] = await db.execute(
            'SELECT * FROM sub_subcategories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sub-subcategory not found'
            });
        }

        let slug = existing[0].slug;
        if (name && name !== existing[0].name) {
            slug = await generateUniqueSlug(name, id);
        }

        await db.execute(
            'UPDATE sub_subcategories SET name = ?, slug = ?, subcategory_id = ?, description = ?, sort_order = ?, status = ? WHERE id = ?',
            [name, slug, subcategory_id, description, sort_order, status, id]
        );

        const [updated] = await db.execute(`
            SELECT ssc.*, sc.name as subcategory_name, c.name as category_name
            FROM sub_subcategories ssc
            LEFT JOIN subcategories sc ON ssc.subcategory_id = sc.id
            LEFT JOIN categories c ON sc.category_id = c.id
            WHERE ssc.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Sub-subcategory updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating sub-subcategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating sub-subcategory'
        });
    }
};

// Delete sub-subcategory
const deleteSubSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute(
            'SELECT * FROM sub_subcategories WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sub-subcategory not found'
            });
        }

        // Check if sub-subcategory is being used in products
        const [usedInProducts] = await db.execute(
            'SELECT COUNT(*) as count FROM product_category_map WHERE sub_subcategory_id = ?',
            [id]
        );

        if (usedInProducts[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete sub-subcategory as it is being used in products'
            });
        }

        await db.execute('DELETE FROM sub_subcategories WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Sub-subcategory deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting sub-subcategory:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting sub-subcategory'
        });
    }
};

module.exports = {
    getAllSubSubcategories,
    getSubSubcategoryById,
    createSubSubcategory,
    updateSubSubcategory,
    deleteSubSubcategory
}; 