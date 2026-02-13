const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Helper to compress image using Sharp (max 1MB)
async function compressImage(inputPath, outputPath) {
    try {
        const maxSizeBytes = 1000 * 1024; // 1MB
        const originalStats = fs.statSync(inputPath);

        // If already under limit, just copy the file
        if (originalStats.size <= maxSizeBytes) {
            fs.copyFileSync(inputPath, outputPath);
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
            }
            return true;
        }

        let quality = 85;
        let compressedPath = outputPath;

        // Compress with decreasing quality until under 1MB
        while (quality > 30) {
            await sharp(inputPath)
                .rotate() // Auto-rotate based on EXIF data
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: quality,
                    progressive: true,
                    mozjpeg: true
                })
                .toFile(compressedPath);

            const stats = fs.statSync(compressedPath);
            if (stats.size <= maxSizeBytes) {
                break;
            }
            quality -= 10;
        }

        // If still too large, resize further
        const stats = fs.statSync(compressedPath);
        if (stats.size > maxSizeBytes) {
            const metadata = await sharp(compressedPath).metadata();
            const newWidth = Math.floor(metadata.width * 0.8);
            const newHeight = Math.floor(metadata.height * 0.8);

            await sharp(inputPath)
                .rotate()
                .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 75, progressive: true, mozjpeg: true })
                .toFile(compressedPath);
        }

        // Delete original file
        if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }

        return true;
    } catch (error) {
        console.error('Image compression failed:', error);
        return false;
    }
}

// Helper to get file path for DB
function getFilePath(file, compressedFilename = null) {
    if (!file) return undefined;
    // Return path relative to /public
    const filename = compressedFilename || file.filename;
    return `/aboutus/${filename}`;
}

// Helper to delete old image file
function deleteOldImage(imagePath) {
    if (!imagePath) return;

    try {
        const fullPath = path.join('public', imagePath.replace('/', ''));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        console.error(`Error deleting old image ${imagePath}:`, error);
    }
}

// =======================================
// ABOUT US SECTION CONTROLLER
// =======================================

// GET /api/about-us/section
exports.getAboutUsSection = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM about_us_section WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
        return res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/about-us/section
exports.createAboutUsSection = async (req, res) => {
    const { section_title, subheading, description, button_text, badge_text } = req.body;
    const file = req.file;
    let image_url = null;

    try {
        // Handle image compression if file exists
        if (file) {
            const fileExt = path.extname(file.filename);
            const baseName = path.basename(file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(file.path), compressedFilename);

            const compressionSuccess = await compressImage(file.path, compressedPath);
            if (compressionSuccess) {
                image_url = getFilePath(file, compressedFilename);
            } else {
                image_url = getFilePath(file);
            }
        }

        const [result] = await pool.query(
            'INSERT INTO about_us_section (section_title, subheading, description, button_text, image_url, badge_text) VALUES (?, ?, ?, ?, ?, ?)',
            [section_title, subheading, description, button_text, image_url, badge_text]
        );
        const [newRecord] = await pool.query('SELECT * FROM about_us_section WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/about-us/section/:id
exports.updateAboutUsSection = async (req, res) => {
    const { id } = req.params;
    const { section_title, subheading, description, button_text, badge_text, is_active } = req.body;
    const file = req.file;
    try {
        // Get old record for fallback
        const [oldRows] = await pool.query('SELECT * FROM about_us_section WHERE id = ?', [id]);
        const old = oldRows[0] || {};

        let image_url = old.image_url;

        // Handle new image upload with compression
        if (file) {
            // Delete old image if exists
            if (old.image_url) {
                deleteOldImage(old.image_url);
            }

            const fileExt = path.extname(file.filename);
            const baseName = path.basename(file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(file.path), compressedFilename);

            const compressionSuccess = await compressImage(file.path, compressedPath);
            if (compressionSuccess) {
                image_url = getFilePath(file, compressedFilename);
            } else {
                image_url = getFilePath(file);
            }
        }

        await pool.query(
            'UPDATE about_us_section SET section_title = ?, subheading = ?, description = ?, button_text = ?, image_url = ?, badge_text = ?, is_active = ? WHERE id = ?',
            [section_title, subheading, description, button_text, image_url, badge_text, is_active, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM about_us_section WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// MISSION VISION SECTION CONTROLLER
// =======================================

// GET /api/about-us/mission-vision
exports.getMissionVision = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM mission_vision_section WHERE is_active = TRUE ORDER BY type, id');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/about-us/mission-vision
exports.createMissionVision = async (req, res) => {
    const { type, title, description } = req.body;
    const icon_file = req.file;
    let icon_url = null;

    try {
        // Handle image compression if file exists
        if (icon_file) {
            const fileExt = path.extname(icon_file.filename);
            const baseName = path.basename(icon_file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(icon_file.path), compressedFilename);

            const compressionSuccess = await compressImage(icon_file.path, compressedPath);
            if (compressionSuccess) {
                icon_url = getFilePath(icon_file, compressedFilename);
            } else {
                icon_url = getFilePath(icon_file);
            }
        }

        const [result] = await pool.query(
            'INSERT INTO mission_vision_section (type, title, description, icon_url) VALUES (?, ?, ?, ?)',
            [type, title, description, icon_url]
        );
        const [newRecord] = await pool.query('SELECT * FROM mission_vision_section WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/about-us/mission-vision/:id
exports.updateMissionVision = async (req, res) => {
    const { id } = req.params;
    const { type, title, description, is_active } = req.body;
    const icon_file = req.file;
    try {
        const [oldRows] = await pool.query('SELECT * FROM mission_vision_section WHERE id = ?', [id]);
        const old = oldRows[0] || {};

        let icon_url = old.icon_url;

        // Handle new image upload with compression
        if (icon_file) {
            // Delete old image if exists
            if (old.icon_url) {
                deleteOldImage(old.icon_url);
            }

            const fileExt = path.extname(icon_file.filename);
            const baseName = path.basename(icon_file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(icon_file.path), compressedFilename);

            const compressionSuccess = await compressImage(icon_file.path, compressedPath);
            if (compressionSuccess) {
                icon_url = getFilePath(icon_file, compressedFilename);
            } else {
                icon_url = getFilePath(icon_file);
            }
        }

        await pool.query(
            'UPDATE mission_vision_section SET type = ?, title = ?, description = ?, icon_url = ?, is_active = ? WHERE id = ?',
            [type, title, description, icon_url, is_active, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM mission_vision_section WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// JOURNEY TIMELINE CONTROLLER
// =======================================

// GET /api/about-us/journey
exports.getJourneyTimeline = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM journey_timeline WHERE is_active = TRUE ORDER BY sort_order, year');
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/about-us/journey
exports.createJourneyTimeline = async (req, res) => {
    const { heading_title, year, description, sort_order } = req.body;
    const image_file = req.file;
    let image_url = null;

    try {
        // Handle image compression if file exists
        if (image_file) {
            const fileExt = path.extname(image_file.filename);
            const baseName = path.basename(image_file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(image_file.path), compressedFilename);

            const compressionSuccess = await compressImage(image_file.path, compressedPath);
            if (compressionSuccess) {
                image_url = getFilePath(image_file, compressedFilename);

            } else {
                image_url = getFilePath(image_file);

            }
        }

        const [result] = await pool.query(
            'INSERT INTO journey_timeline (heading_title, year, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?)',
            [heading_title, year, description, image_url, sort_order]
        );
        const [newRecord] = await pool.query('SELECT * FROM journey_timeline WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/about-us/journey/:id
exports.updateJourneyTimeline = async (req, res) => {
    const { id } = req.params;
    const { heading_title, year, description, sort_order, is_active } = req.body;
    const image_file = req.file;
    try {
        const [oldRows] = await pool.query('SELECT * FROM journey_timeline WHERE id = ?', [id]);
        const old = oldRows[0] || {};

        let image_url = old.image_url;

        // Handle new image upload with compression
        if (image_file) {
            // Delete old image if exists
            if (old.image_url) {
                deleteOldImage(old.image_url);
            }

            const fileExt = path.extname(image_file.filename);
            const baseName = path.basename(image_file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(image_file.path), compressedFilename);

            const compressionSuccess = await compressImage(image_file.path, compressedPath);
            if (compressionSuccess) {
                image_url = getFilePath(image_file, compressedFilename);
            } else {
                image_url = getFilePath(image_file);
            }
        }

        await pool.query(
            'UPDATE journey_timeline SET heading_title = ?, year = ?, description = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [heading_title, year, description, image_url, sort_order, is_active, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM journey_timeline WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// CRAFTSMANSHIP QUALITY CONTROLLER
// =======================================

// GET /api/about-us/craftsmanship
exports.getCraftsmanshipQuality = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM craftsmanship_quality WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
        return res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/about-us/craftsmanship
exports.createCraftsmanshipQuality = async (req, res) => {
    const {
        heading_title, subheading,
        card1_title, card1_description,
        card2_title, card2_description,
        card3_title, card3_description
    } = req.body;
    const files = req.files || [];

    let card1_icon_url = null;
    let card2_icon_url = null;
    let card3_icon_url = null;

    try {
        // Handle image compression for each card icon
        if (files[0]) {
            const fileExt = path.extname(files[0].filename);
            const baseName = path.basename(files[0].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[0].path), compressedFilename);

            const compressionSuccess = await compressImage(files[0].path, compressedPath);
            if (compressionSuccess) {
                card1_icon_url = getFilePath(files[0], compressedFilename);
            } else {
                card1_icon_url = getFilePath(files[0]);
            }
        }

        if (files[1]) {
            const fileExt = path.extname(files[1].filename);
            const baseName = path.basename(files[1].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[1].path), compressedFilename);

            const compressionSuccess = await compressImage(files[1].path, compressedPath);
            if (compressionSuccess) {
                card2_icon_url = getFilePath(files[1], compressedFilename);
            } else {
                card2_icon_url = getFilePath(files[1]);
            }
        }

        if (files[2]) {
            const fileExt = path.extname(files[2].filename);
            const baseName = path.basename(files[2].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[2].path), compressedFilename);

            const compressionSuccess = await compressImage(files[2].path, compressedPath);
            if (compressionSuccess) {
                card3_icon_url = getFilePath(files[2], compressedFilename);
            } else {
                card3_icon_url = getFilePath(files[2]);
            }
        }

        const [result] = await pool.query(
            `INSERT INTO craftsmanship_quality (
                heading_title, subheading, 
                card1_icon_url, card1_title, card1_description,
                card2_icon_url, card2_title, card2_description,
                card3_icon_url, card3_title, card3_description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [heading_title, subheading, card1_icon_url, card1_title, card1_description, card2_icon_url, card2_title, card2_description, card3_icon_url, card3_title, card3_description]
        );
        const [newRecord] = await pool.query('SELECT * FROM craftsmanship_quality WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/about-us/craftsmanship/:id
exports.updateCraftsmanshipQuality = async (req, res) => {
    const { id } = req.params;
    const {
        heading_title, subheading,
        card1_title, card1_description,
        card2_title, card2_description,
        card3_title, card3_description,
        is_active
    } = req.body;
    const files = req.files || [];
    try {
        const [oldRows] = await pool.query('SELECT * FROM craftsmanship_quality WHERE id = ?', [id]);
        const old = oldRows[0] || {};

        let card1_icon_url = old.card1_icon_url;
        let card2_icon_url = old.card2_icon_url;
        let card3_icon_url = old.card3_icon_url;

        // Handle image compression for each card icon
        if (files[0]) {
            // Delete old image if exists
            if (old.card1_icon_url) {
                deleteOldImage(old.card1_icon_url);
            }

            const fileExt = path.extname(files[0].filename);
            const baseName = path.basename(files[0].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[0].path), compressedFilename);

            const compressionSuccess = await compressImage(files[0].path, compressedPath);
            if (compressionSuccess) {
                card1_icon_url = getFilePath(files[0], compressedFilename);
            } else {
                card1_icon_url = getFilePath(files[0]);
            }
        }

        if (files[1]) {
            // Delete old image if exists
            if (old.card2_icon_url) {
                deleteOldImage(old.card2_icon_url);
            }

            const fileExt = path.extname(files[1].filename);
            const baseName = path.basename(files[1].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[1].path), compressedFilename);

            const compressionSuccess = await compressImage(files[1].path, compressedPath);
            if (compressionSuccess) {
                card2_icon_url = getFilePath(files[1], compressedFilename);
            } else {
                card2_icon_url = getFilePath(files[1]);
            }
        }

        if (files[2]) {
            // Delete old image if exists
            if (old.card3_icon_url) {
                deleteOldImage(old.card3_icon_url);
            }

            const fileExt = path.extname(files[2].filename);
            const baseName = path.basename(files[2].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[2].path), compressedFilename);

            const compressionSuccess = await compressImage(files[2].path, compressedPath);
            if (compressionSuccess) {
                card3_icon_url = getFilePath(files[2], compressedFilename);
            } else {
                card3_icon_url = getFilePath(files[2]);
            }
        }

        await pool.query(
            `UPDATE craftsmanship_quality SET 
                heading_title = ?, subheading = ?, 
                card1_icon_url = ?, card1_title = ?, card1_description = ?,
                card2_icon_url = ?, card2_title = ?, card2_description = ?,
                card3_icon_url = ?, card3_title = ?, card3_description = ?,
                is_active = ? WHERE id = ?`,
            [heading_title, subheading, card1_icon_url, card1_title, card1_description, card2_icon_url, card2_title, card2_description, card3_icon_url, card3_title, card3_description, is_active, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM craftsmanship_quality WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// WHAT MAKES US CONTROLLER
// =======================================

// GET /api/about-us/what-makes-us
exports.getWhatMakesUs = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM what_makes_us WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
        return res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/about-us/what-makes-us
exports.createWhatMakesUs = async (req, res) => {
    const {
        section_heading,
        point1_title, point1_subtitle,
        point2_title, point2_subtitle,
        point3_title, point3_subtitle,
        point4_title, point4_subtitle
    } = req.body;
    const files = req.files || [];

    let background_image = null;
    let side_image = null;

    try {
        // Handle image compression for background image
        if (files[0]) {
            const fileExt = path.extname(files[0].filename);
            const baseName = path.basename(files[0].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[0].path), compressedFilename);

            const compressionSuccess = await compressImage(files[0].path, compressedPath);
            if (compressionSuccess) {
                background_image = getFilePath(files[0], compressedFilename);
            } else {
                background_image = getFilePath(files[0]);
            }
        }

        // Handle image compression for side image
        if (files[1]) {
            const fileExt = path.extname(files[1].filename);
            const baseName = path.basename(files[1].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[1].path), compressedFilename);

            const compressionSuccess = await compressImage(files[1].path, compressedPath);
            if (compressionSuccess) {
                side_image = getFilePath(files[1], compressedFilename);
            } else {
                side_image = getFilePath(files[1]);
            }
        }

        const [result] = await pool.query(
            `INSERT INTO what_makes_us (
                section_heading, background_image, side_image,
                point1_title, point1_subtitle,
                point2_title, point2_subtitle,
                point3_title, point3_subtitle,
                point4_title, point4_subtitle
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [section_heading, background_image, side_image, point1_title, point1_subtitle, point2_title, point2_subtitle, point3_title, point3_subtitle, point4_title, point4_subtitle]
        );
        const [newRecord] = await pool.query('SELECT * FROM what_makes_us WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/about-us/what-makes-us/:id
exports.updateWhatMakesUs = async (req, res) => {
    const { id } = req.params;
    const {
        section_heading,
        point1_title, point1_subtitle,
        point2_title, point2_subtitle,
        point3_title, point3_subtitle,
        point4_title, point4_subtitle,
        is_active
    } = req.body;
    const files = req.files || [];
    try {
        const [oldRows] = await pool.query('SELECT * FROM what_makes_us WHERE id = ?', [id]);
        const old = oldRows[0] || {};

        let background_image = old.background_image;
        let side_image = old.side_image;

        // Handle image compression for background image
        if (files[0]) {
            // Delete old image if exists
            if (old.background_image) {
                deleteOldImage(old.background_image);
            }

            const fileExt = path.extname(files[0].filename);
            const baseName = path.basename(files[0].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[0].path), compressedFilename);

            const compressionSuccess = await compressImage(files[0].path, compressedPath);
            if (compressionSuccess) {
                background_image = getFilePath(files[0], compressedFilename);
            } else {
                background_image = getFilePath(files[0]);
            }
        }

        // Handle image compression for side image
        if (files[1]) {
            // Delete old image if exists
            if (old.side_image) {
                deleteOldImage(old.side_image);
            }

            const fileExt = path.extname(files[1].filename);
            const baseName = path.basename(files[1].filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(files[1].path), compressedFilename);

            const compressionSuccess = await compressImage(files[1].path, compressedPath);
            if (compressionSuccess) {
                side_image = getFilePath(files[1], compressedFilename);
            } else {
                side_image = getFilePath(files[1]);
            }
        }

        await pool.query(
            `UPDATE what_makes_us SET 
                section_heading = ?, background_image = ?, side_image = ?,
                point1_title = ?, point1_subtitle = ?,
                point2_title = ?, point2_subtitle = ?,
                point3_title = ?, point3_subtitle = ?,
                point4_title = ?, point4_subtitle = ?,
                is_active = ? WHERE id = ?`,
            [section_heading, background_image, side_image, point1_title, point1_subtitle, point2_title, point2_subtitle, point3_title, point3_subtitle, point4_title, point4_subtitle, is_active, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM what_makes_us WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// WHO WE ARE CONTROLLER
// =======================================

// GET /api/about-us/who-we-are
exports.getWhoWeAre = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM who_we_are WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
        return res.json({ success: true, data: rows[0] || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/about-us/who-we-are
exports.createWhoWeAre = async (req, res) => {
    const { heading_title, subheading_title, content_paragraph, bold_text } = req.body;
    const image_file = req.file;
    let image_url = null;

    try {
        // Handle image compression if file exists
        if (image_file) {
            const fileExt = path.extname(image_file.filename);
            const baseName = path.basename(image_file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(image_file.path), compressedFilename);

            const compressionSuccess = await compressImage(image_file.path, compressedPath);
            if (compressionSuccess) {
                image_url = getFilePath(image_file, compressedFilename);
            } else {
                image_url = getFilePath(image_file);
            }
        }

        const [result] = await pool.query(
            'INSERT INTO who_we_are (heading_title, subheading_title, content_paragraph, bold_text, image_url) VALUES (?, ?, ?, ?, ?)',
            [heading_title, subheading_title, content_paragraph, bold_text, image_url]
        );
        const [newRecord] = await pool.query('SELECT * FROM who_we_are WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, data: newRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/about-us/who-we-are/:id
exports.updateWhoWeAre = async (req, res) => {
    const { id } = req.params;
    const { heading_title, subheading_title, content_paragraph, bold_text, is_active } = req.body;
    const image_file = req.file;
    try {
        const [oldRows] = await pool.query('SELECT * FROM who_we_are WHERE id = ?', [id]);
        const old = oldRows[0] || {};

        let image_url = old.image_url;

        // Handle new image upload with compression
        if (image_file) {
            // Delete old image if exists
            if (old.image_url) {
                deleteOldImage(old.image_url);
            }

            const fileExt = path.extname(image_file.filename);
            const baseName = path.basename(image_file.filename, fileExt);
            const compressedFilename = `${baseName}_compressed.jpg`;
            const compressedPath = path.join(path.dirname(image_file.path), compressedFilename);

            const compressionSuccess = await compressImage(image_file.path, compressedPath);
            if (compressionSuccess) {
                image_url = getFilePath(image_file, compressedFilename);
            } else {
                image_url = getFilePath(image_file);
            }
        }

        await pool.query(
            'UPDATE who_we_are SET heading_title = ?, subheading_title = ?, content_paragraph = ?, bold_text = ?, image_url = ?, is_active = ? WHERE id = ?',
            [heading_title, subheading_title, content_paragraph, bold_text, image_url, is_active, id]
        );
        const [updatedRecord] = await pool.query('SELECT * FROM who_we_are WHERE id = ?', [id]);
        return res.json({ success: true, data: updatedRecord[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =======================================
// GET ALL ABOUT US DATA (for frontend)
// =======================================

// GET /api/about-us/all
exports.getAllAboutUsData = async (req, res) => {
    try {
        // Get all active data from all tables
        const [aboutSection] = await pool.query('SELECT * FROM about_us_section WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
        const [missionVision] = await pool.query('SELECT * FROM mission_vision_section WHERE is_active = TRUE ORDER BY type, id');
        const [journeyTimeline] = await pool.query('SELECT * FROM journey_timeline WHERE is_active = TRUE ORDER BY sort_order, year');
        const [craftsmanship] = await pool.query('SELECT * FROM craftsmanship_quality WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
        const [whatMakesUs] = await pool.query('SELECT * FROM what_makes_us WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
        const [whoWeAre] = await pool.query('SELECT * FROM who_we_are WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');

        return res.json({
            success: true,
            data: {
                aboutSection: aboutSection[0] || null,
                missionVision: missionVision,
                journeyTimeline: journeyTimeline,
                craftsmanship: craftsmanship[0] || null,
                whatMakesUs: whatMakesUs[0] || null,
                whoWeAre: whoWeAre[0] || null
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}; 