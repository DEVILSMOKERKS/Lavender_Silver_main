const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { realignTableIds } = require('../utils/realignTableIds');

// Helper function to compress image to under 500KB
const compressImage = async (inputPath, outputPath, maxSizeKB = 500) => {
  try {
    const maxSizeBytes = maxSizeKB * 1024;
    let quality = 90;
    let compressedPath = outputPath;

    // Get original file size
    const originalStats = fs.statSync(inputPath);

    // If already under limit, just copy the file
    if (originalStats.size <= maxSizeBytes) {
      fs.copyFileSync(inputPath, outputPath);
      return outputPath;
    }

    // Compress with decreasing quality until under size limit
    while (quality > 10) {
      await sharp(inputPath)
        .jpeg({ quality: quality, progressive: true })
        .png({ quality: quality, progressive: true })
        .toFile(compressedPath);

      const compressedStats = fs.statSync(compressedPath);
      const compressedSizeKB = compressedStats.size / 1024;

      if (compressedStats.size <= maxSizeBytes) {
        break;
      }

      quality -= 10;
    }

    // If still too large, try reducing dimensions
    if (fs.statSync(compressedPath).size > maxSizeBytes) {
      const metadata = await sharp(compressedPath).metadata();
      const newWidth = Math.floor(metadata.width * 0.8);
      const newHeight = Math.floor(metadata.height * 0.8);

      await sharp(compressedPath)
        .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .png({ quality: 80, progressive: true })
        .toFile(compressedPath);
    }

    return compressedPath;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return original path
    return inputPath;
  }
};

// CREATE: Multiple banners (images) with SEO fields
exports.createBanners = async (req, res) => {
  try {
    const banners = [];
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }
    const { title = 'banner', alt_text = '', description = '', position = 1, device_type, is_active = true } = req.body;

    // Validate device_type is provided and valid
    if (!device_type || !['desktop', 'mobile'].includes(device_type)) {
      return res.status(400).json({
        success: false,
        message: 'Device type is required and must be either "desktop" or "mobile".'
      });
    }

    // Check for duplicate position within the same device type
    const [existingBanners] = await db.execute(
      'SELECT id FROM home_banners WHERE position = ? AND device_type = ?',
      [position, device_type]
    );

    if (existingBanners.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A ${device_type} banner with position ${position} already exists. Please choose a different position.`
      });
    }

    for (const file of req.files) {
      // Create a URL-friendly and filesystem-friendly name from the title
      const fileExt = path.extname(file.originalname);
      const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');

      let finalFilename;
      let finalPath;
      let finalImageUrl;

      // For mobile images, convert to WebP
      if (device_type === 'mobile') {
        finalFilename = `${baseName}-${Date.now()}.webp`;
        finalPath = path.join(path.dirname(file.path), finalFilename);

        try {
          // Convert to WebP using Sharp with compression (max 1MB)
          const maxSizeBytes = 1000 * 1024; // 1MB
          let quality = 85;
          let webpPath = finalPath;

          // Compress with decreasing quality until under 1MB
          while (quality > 30) {
            await sharp(file.path)
              .webp({ quality: quality, effort: 6 })
              .toFile(webpPath);

            const stats = fs.statSync(webpPath);
            if (stats.size <= maxSizeBytes) {
              break;
            }
            quality -= 5;
          }

          // If still too large, resize the image
          const stats = fs.statSync(webpPath);
          if (stats.size > maxSizeBytes) {
            const metadata = await sharp(webpPath).metadata();
            const newWidth = Math.floor(metadata.width * 0.85);
            const newHeight = Math.floor(metadata.height * 0.85);

            await sharp(file.path)
              .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 75, effort: 6 })
              .toFile(webpPath);
          }

          // Remove original file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          finalImageUrl = `/home_banners/${finalFilename}`;
        } catch (webpError) {
          console.error('Error converting to WebP:', webpError);
          // Fallback to original compression if WebP conversion fails
          const compressedPath = await compressImage(file.path, finalPath.replace('.webp', fileExt), 1000);
          if (compressedPath !== file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          finalImageUrl = `/home_banners/${path.basename(compressedPath)}`;
        }
      } else {
        // For desktop, use compression (max 1MB)
        finalFilename = `${baseName}-${Date.now()}${fileExt}`;
        finalPath = path.join(path.dirname(file.path), finalFilename);
        const compressedPath = await compressImage(file.path, finalPath, 1000);

        // If compression created a new file, remove the original
        if (compressedPath !== file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        finalImageUrl = `/home_banners/${path.basename(compressedPath)}`;
      }

      const [result] = await db.execute(
        'INSERT INTO home_banners (title, alt_text, description, image_url, position, device_type, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, alt_text, description, finalImageUrl, position, device_type, is_active]
      );
      banners.push({
        id: result.insertId,
        title,
        alt_text,
        description,
        image_url: finalImageUrl,
        position,
        device_type,
        is_active
      });
    }
    res.status(201).json({ success: true, message: 'Banners created successfully.', data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create banners.', error: err.message });
  }
};

// GET: All banners with optional device_type filter
exports.getAllBanners = async (req, res) => {
  try {
    // Check both query params and route params for device_type
    const device_type = req.query.device_type || req.params.device_type;
    let query = 'SELECT * FROM home_banners';
    let params = [];

    if (device_type && ['desktop', 'mobile'].includes(device_type)) {
      query += ' WHERE device_type = ?';
      params = [device_type];
    }

    query += ' ORDER BY position ASC, created_at DESC';

    const [rows] = await db.execute(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.', error: err.message });
  }
};

// GET: Single banner by id
exports.getBannerById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM home_banners WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch banner.', error: err.message });
  }
};

// UPDATE: Banner (with optional new image)
exports.updateBanner = async (req, res) => {
  try {
    const { title, alt_text, description, position, device_type, is_active } = req.body;

    // Validate device_type is provided and valid
    if (!device_type || !['desktop', 'mobile'].includes(device_type)) {
      return res.status(400).json({
        success: false,
        message: 'Device type is required and must be either "desktop" or "mobile".'
      });
    }

    const [oldRows] = await db.execute('SELECT * FROM home_banners WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });

    // Check for duplicate position within the same device type (excluding current banner)
    const [existingBanners] = await db.execute(
      'SELECT id FROM home_banners WHERE position = ? AND device_type = ? AND id != ?',
      [position, device_type, req.params.id]
    );

    if (existingBanners.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A ${device_type} banner with position ${position} already exists. Please choose a different position.`
      });
    }

    let image_url = oldRows[0].image_url;

    const newImageFile = req.files && req.files.length > 0 ? req.files[0] : null;

    if (newImageFile) {
      if (image_url) {
        const oldImagePath = path.join(__dirname, '..', 'public', image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Create a new filename from the title
      const fileExt = path.extname(newImageFile.originalname);
      const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');

      let finalFilename;
      let finalPath;

      // For mobile images, convert to WebP
      if (device_type === 'mobile') {
        finalFilename = `${baseName}-${Date.now()}.webp`;
        finalPath = path.join(path.dirname(newImageFile.path), finalFilename);

        try {
          // Convert to WebP using Sharp with compression (max 1MB)
          const maxSizeBytes = 1000 * 1024; // 1MB
          let quality = 85;
          let webpPath = finalPath;

          // Compress with decreasing quality until under 1MB
          while (quality > 30) {
            await sharp(newImageFile.path)
              .webp({ quality: quality, effort: 6 })
              .toFile(webpPath);

            const stats = fs.statSync(webpPath);
            if (stats.size <= maxSizeBytes) {
              break;
            }
            quality -= 5;
          }

          // If still too large, resize the image
          const stats = fs.statSync(webpPath);
          if (stats.size > maxSizeBytes) {
            const metadata = await sharp(webpPath).metadata();
            const newWidth = Math.floor(metadata.width * 0.85);
            const newHeight = Math.floor(metadata.height * 0.85);

            await sharp(newImageFile.path)
              .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 75, effort: 6 })
              .toFile(webpPath);
          }

          // Remove original file
          if (fs.existsSync(newImageFile.path)) {
            fs.unlinkSync(newImageFile.path);
          }

          image_url = `/home_banners/${finalFilename}`;
        } catch (webpError) {
          console.error('Error converting to WebP:', webpError);
          // Fallback to original compression if WebP conversion fails
          const compressedPath = await compressImage(newImageFile.path, finalPath.replace('.webp', fileExt), 1000);
          if (compressedPath !== newImageFile.path && fs.existsSync(newImageFile.path)) {
            fs.unlinkSync(newImageFile.path);
          }
          image_url = `/home_banners/${path.basename(compressedPath)}`;
        }
      } else {
        // For desktop, use compression (max 1MB)
        finalFilename = `${baseName}-${Date.now()}${fileExt}`;
        finalPath = path.join(path.dirname(newImageFile.path), finalFilename);
        const compressedPath = await compressImage(newImageFile.path, finalPath, 1000);

        // If compression created a new file, remove the original
        if (compressedPath !== newImageFile.path && fs.existsSync(newImageFile.path)) {
          fs.unlinkSync(newImageFile.path);
        }

        image_url = `/home_banners/${path.basename(compressedPath)}`;
      }
    }

    await db.execute(
      'UPDATE home_banners SET title=?, alt_text=?, description=?, image_url=?, position=?, device_type=?, is_active=?, updated_at=NOW() WHERE id=?',
      [title, alt_text, description, image_url, Number(position), device_type, is_active, req.params.id]
    );
    res.status(200).json({ success: true, message: 'Banner updated successfully.' });
  } catch (err) {
    // Provide more specific error logging for debugging
    console.error("Failed to update banner:", err);
    res.status(500).json({ success: false, message: 'Failed to update banner.', error: err.message });
  }
};

// UPDATE: Bulk update banner positions
exports.updateBannerPositions = async (req, res) => {
  try {
    const { positions } = req.body; // Array of { id, position } objects

    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Positions array is required and must not be empty.'
      });
    }

    // Validate each position entry
    for (const item of positions) {
      if (!item.id || !item.position) {
        return res.status(400).json({
          success: false,
          message: 'Each position entry must have both id and position.'
        });
      }
      if (typeof item.position !== 'number' || item.position < 1) {
        return res.status(400).json({
          success: false,
          message: 'Position must be a positive number.'
        });
      }
    }

    // Update positions in a transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // First, get device_type for each banner to group by device type
      const bannerIds = positions.map(p => p.id);
      const placeholders = bannerIds.map(() => '?').join(',');
      const [bannerRows] = await connection.execute(
        `SELECT id, device_type FROM home_banners WHERE id IN (${placeholders})`,
        bannerIds
      );

      // Create a map of id -> device_type
      const deviceTypeMap = {};
      bannerRows.forEach(row => {
        deviceTypeMap[row.id] = row.device_type;
      });

      // Group positions by device_type
      const positionsByDevice = {};
      positions.forEach(item => {
        const deviceType = deviceTypeMap[item.id];
        if (!deviceType) {
          throw new Error(`Banner with id ${item.id} not found`);
        }
        if (!positionsByDevice[deviceType]) {
          positionsByDevice[deviceType] = [];
        }
        positionsByDevice[deviceType].push(item);
      });

      // For each device type, update positions in two steps:
      // Step 1: Set all to temporary negative positions to avoid unique constraint conflicts
      // Step 2: Set to final positions
      for (const deviceType in positionsByDevice) {
        const devicePositions = positionsByDevice[deviceType];
        
        // Step 1: Set to temporary negative positions
        for (let i = 0; i < devicePositions.length; i++) {
          const item = devicePositions[i];
          const tempPosition = -(i + 1); // Use negative values as temporary positions
          await connection.execute(
            'UPDATE home_banners SET position = ?, updated_at = NOW() WHERE id = ?',
            [tempPosition, item.id]
          );
        }

        // Step 2: Set to final positions
        for (const item of devicePositions) {
          await connection.execute(
            'UPDATE home_banners SET position = ?, updated_at = NOW() WHERE id = ?',
            [item.position, item.id]
          );
        }
      }

      await connection.commit();
      res.status(200).json({
        success: true,
        message: 'Banner positions updated successfully.',
        data: positions
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Failed to update banner positions:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner positions.',
      error: err.message
    });
  }
};

// DELETE: Banner (and its image)
exports.deleteBanner = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM home_banners WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    const image_url = rows[0].image_url;
    if (image_url) {
      const imagePath = path.join(__dirname, '..', 'public', image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await db.execute('DELETE FROM home_banners WHERE id = ?', [req.params.id]);

    // Re-align IDs after deletion
    await realignTableIds('home_banners');

    res.status(200).json({ success: true, message: 'Banner deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete banner.', error: err.message });
  }
};

// ----------------- Feature Category Images (featured_categories table) ---------------------------

// GET: All categories for dropdown selection
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, slug FROM categories WHERE status = "active" ORDER BY name ASC');
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.', error: err.message });
  }
};

// CREATE: Multiple feature category images
exports.createFeatureImages = async (req, res) => {
  try {
    const features = [];
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }
    const { title = 'featured_category', alt_text = '', category_id, position = 1, is_active = true } = req.body;

    // Validate category_id is required
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category selection is required.' });
    }

    // Validate category_id exists and is active
    const [categoryExists] = await db.execute('SELECT id FROM categories WHERE id = ? AND status = "active"', [category_id]);
    if (categoryExists.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid category selected.' });
    }

    for (const file of req.files) {
      const fileExt = path.extname(file.originalname);
      const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
      const newFilename = `${baseName}-${Date.now()}${fileExt}`;
      const newPath = path.join(path.dirname(file.path), newFilename);
      fs.renameSync(file.path, newPath);
      const image_url = `/featured-category/${newFilename}`;
      const [result] = await db.execute(
        'INSERT INTO featured_categories (title, alt_text, image_url, category_id, position, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [title, alt_text, image_url, category_id, position, is_active]
      );
      features.push({
        id: result.insertId,
        title,
        alt_text,
        image_url,
        category_id: category_id,
        position,
        is_active
      });
    }
    res.status(201).json({ success: true, message: 'Feature category images created successfully.', data: features });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create feature category images.', error: err.message });
  }
};

// GET: All feature category images
exports.getAllFeatureImages = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT fc.*, c.name as category_name, c.slug as category_slug 
      FROM featured_categories fc 
      LEFT JOIN categories c ON fc.category_id = c.id 
      ORDER BY fc.position ASC, fc.created_at DESC
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch feature category images.', error: err.message });
  }
};

// GET: Single feature category image by id
exports.getFeatureImagesById = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT fc.*, c.name as category_name, c.slug as category_slug 
      FROM featured_categories fc 
      LEFT JOIN categories c ON fc.category_id = c.id 
      WHERE fc.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Feature category image not found.' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch feature category image.', error: err.message });
  }
};

// UPDATE: Feature category image (with optional new image)
exports.updateFeatureImages = async (req, res) => {
  try {
    const { title, alt_text, category_id, position, is_active } = req.body;

    // Validate category_id is required
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category selection is required.' });
    }

    // Validate category_id exists and is active
    const [categoryExists] = await db.execute('SELECT id FROM categories WHERE id = ? AND status = "active"', [category_id]);
    if (categoryExists.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid category selected.' });
    }

    const [oldRows] = await db.execute('SELECT * FROM featured_categories WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ success: false, message: 'Feature category image not found.' });
    let image_url = oldRows[0].image_url;
    const newImageFile = req.files && req.files.length > 0 ? req.files[0] : null;
    if (newImageFile) {
      if (image_url) {
        const oldImagePath = path.join(__dirname, '..', 'public', image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      const fileExt = path.extname(newImageFile.originalname);
      const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
      const newFilename = `${baseName}-${Date.now()}${fileExt}`;
      const newPath = path.join(path.dirname(newImageFile.path), newFilename);
      fs.renameSync(newImageFile.path, newPath);
      image_url = `/featured-category/${newFilename}`;
    }
    await db.execute(
      'UPDATE featured_categories SET title=?, alt_text=?, image_url=?, category_id=?, position=?, is_active=?, updated_at=NOW() WHERE id=?',
      [title, alt_text, image_url, category_id, Number(position), is_active, req.params.id]
    );

    // Get the updated row to send back with category information
    const [updatedRows] = await db.execute(`
      SELECT fc.*, c.name as category_name, c.slug as category_slug 
      FROM featured_categories fc 
      LEFT JOIN categories c ON fc.category_id = c.id 
      WHERE fc.id = ?
    `, [req.params.id]);

    res.status(200).json({ success: true, message: 'Feature category image updated successfully.', data: updatedRows[0] });
  } catch (err) {
    console.error("Failed to update feature category image:", err);
    res.status(500).json({ success: false, message: 'Failed to update feature category image.', error: err.message });
  }
};

// UPDATE: Bulk update featured category positions
exports.updateFeatureCategoryPositions = async (req, res) => {
  try {
    const { positions } = req.body; // Array of { id, position } objects

    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Positions array is required and must not be empty.'
      });
    }

    // Validate each position entry
    for (const item of positions) {
      if (!item.id || !item.position) {
        return res.status(400).json({
          success: false,
          message: 'Each position entry must have both id and position.'
        });
      }
      if (typeof item.position !== 'number' || item.position < 1) {
        return res.status(400).json({
          success: false,
          message: 'Position must be a positive number.'
        });
      }
    }

    // Update positions in a transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Step 1: Set all to temporary negative positions to avoid unique constraint conflicts
      for (let i = 0; i < positions.length; i++) {
        const item = positions[i];
        const tempPosition = -(i + 1); // Use negative values as temporary positions
        await connection.execute(
          'UPDATE featured_categories SET position = ?, updated_at = NOW() WHERE id = ?',
          [tempPosition, item.id]
        );
      }

      // Step 2: Set to final positions
      for (const item of positions) {
        await connection.execute(
          'UPDATE featured_categories SET position = ?, updated_at = NOW() WHERE id = ?',
          [item.position, item.id]
        );
      }

      await connection.commit();
      res.status(200).json({
        success: true,
        message: 'Featured category positions updated successfully.',
        data: positions
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Failed to update featured category positions:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured category positions.',
      error: err.message
    });
  }
};

// DELETE: Feature category image (and its image file)
exports.deleteFeatureImages = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM featured_categories WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Feature category image not found.' });
    const image_url = rows[0].image_url;
    if (image_url) {
      const imagePath = path.join(__dirname, '..', 'public', image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await db.execute('DELETE FROM featured_categories WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Feature category image deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete feature category image.', error: err.message });
  }
};

// ------------------- wrapped with love ------------------------

// CREATE: Multiple wrapped_with_love banners with SEO fields
exports.createWrappedWithLove = async (req, res) => {
  try {
    const banners = [];
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }
    const { title = 'wrapped_with_love', alt_text = '', description = '', category_id, position = 1, is_active = true } = req.body;

    // Validate category_id is required
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category selection is required.' });
    }

    // Validate category_id exists and is active
    const [categoryExists] = await db.execute('SELECT id FROM categories WHERE id = ? AND status = "active"', [category_id]);
    if (categoryExists.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid category selected.' });
    }

    for (const file of req.files) {
      const fileExt = path.extname(file.originalname);
      const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
      let image_url;

      // Handle file upload with Sharp compression (max 1MB)
      const originalPath = file.path;
      const compressedPath = originalPath.replace(/\.[^/.]+$/, '_compressed.jpg');

      try {
        const maxSizeBytes = 1000 * 1024; // 1MB
        const originalStats = fs.statSync(originalPath);
        let quality = 85;
        let finalPath = compressedPath;

        if (originalStats.size <= maxSizeBytes) {
          fs.copyFileSync(originalPath, compressedPath);
        } else {
          // Compress with decreasing quality until under 1MB
          while (quality > 30) {
            await sharp(originalPath)
              .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: quality, progressive: true })
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

            await sharp(originalPath)
              .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 75, progressive: true })
              .toFile(finalPath);
          }
        }

        // Delete original file if compression created a new file
        if (finalPath !== originalPath && fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        image_url = `/wrapped_with_love/${path.basename(finalPath)}`;
      } catch (compressionError) {
        console.error('Error compressing image:', compressionError);
        // Fallback to original file
        const newFilename = `${baseName}-${Date.now()}${fileExt}`;
        const newPath = path.join(path.dirname(file.path), newFilename);
        fs.renameSync(file.path, newPath);
        image_url = `/wrapped_with_love/${newFilename}`;
      }

      const [result] = await db.execute(
        'INSERT INTO wrapped_with_love (title, alt_text, description, image_url, category_id, position, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, alt_text, description, image_url, category_id, position, is_active]
      );
      banners.push({
        id: result.insertId,
        title,
        alt_text,
        description,
        image_url,
        category_id: category_id,
        position,
        is_active
      });
    }
    res.status(201).json({ success: true, message: 'Wrapped With Love banners created successfully.', data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create banners.', error: err.message });
  }
};

// GET: All banners
exports.getAllWrappedWithLove = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT wwl.*, c.name as category_name, c.slug as category_slug 
      FROM wrapped_with_love wwl 
      LEFT JOIN categories c ON wwl.category_id = c.id 
      ORDER BY wwl.position ASC, wwl.created_at DESC
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.', error: err.message });
  }
};

// GET: Single banner by ID
exports.getWrappedWithLoveById = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT wwl.*, c.name as category_name, c.slug as category_slug 
      FROM wrapped_with_love wwl 
      LEFT JOIN categories c ON wwl.category_id = c.id 
      WHERE wwl.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch banner.', error: err.message });
  }
};

// UPDATE: Banner (with optional new image)
exports.updateWrappedWithLove = async (req, res) => {
  try {
    const { title, alt_text, description, category_id, position, is_active } = req.body;

    // Validate category_id is required
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category selection is required.' });
    }

    // Validate category_id exists and is active
    const [categoryExists] = await db.execute('SELECT id FROM categories WHERE id = ? AND status = "active"', [category_id]);
    if (categoryExists.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid category selected.' });
    }

    const [oldRows] = await db.execute('SELECT * FROM wrapped_with_love WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });

    let image_url = oldRows[0].image_url;

    const newImageFile = req.files && req.files.length > 0 ? req.files[0] : null;

    if (newImageFile) {
      if (image_url) {
        const oldImagePath = path.join(__dirname, '..', 'public', image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Handle file upload with Sharp compression (max 1MB)
      const originalPath = newImageFile.path;
      const compressedPath = originalPath.replace(/\.[^/.]+$/, '_compressed.jpg');

      try {
        const maxSizeBytes = 1000 * 1024; // 1MB
        const originalStats = fs.statSync(originalPath);
        let quality = 85;
        let finalPath = compressedPath;

        if (originalStats.size <= maxSizeBytes) {
          fs.copyFileSync(originalPath, compressedPath);
        } else {
          // Compress with decreasing quality until under 1MB
          while (quality > 30) {
            await sharp(originalPath)
              .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: quality, progressive: true })
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

            await sharp(originalPath)
              .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 75, progressive: true })
              .toFile(finalPath);
          }
        }

        // Delete original file if compression created a new file
        if (finalPath !== originalPath && fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        image_url = `/wrapped_with_love/${path.basename(finalPath)}`;
      } catch (compressionError) {
        console.error('Error compressing image:', compressionError);
        // Fallback to original file
        const fileExt = path.extname(newImageFile.originalname);
        const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
        const newFilename = `${baseName}-${Date.now()}${fileExt}`;
        const newPath = path.join(path.dirname(newImageFile.path), newFilename);
        fs.renameSync(newImageFile.path, newPath);
        image_url = `/wrapped_with_love/${newFilename}`;
      }
    }

    await db.execute(
      'UPDATE wrapped_with_love SET title=?, alt_text=?, description=?, image_url=?, category_id=?, position=?, is_active=?, updated_at=NOW() WHERE id=?',
      [title, alt_text, description, image_url, category_id, Number(position), is_active, req.params.id]
    );

    // Get the updated row to send back with category information
    const [updatedRows] = await db.execute(`
      SELECT wwl.*, c.name as category_name, c.slug as category_slug 
      FROM wrapped_with_love wwl 
      LEFT JOIN categories c ON wwl.category_id = c.id 
      WHERE wwl.id = ?
    `, [req.params.id]);

    res.status(200).json({ success: true, message: 'Wrapped With Love banner updated successfully.', data: updatedRows[0] });
  } catch (err) {
    console.error("Failed to update banner:", err);
    res.status(500).json({ success: false, message: 'Failed to update banner.', error: err.message });
  }
};

// UPDATE: Bulk update wrapped with love positions
exports.updateWrappedWithLovePositions = async (req, res) => {
  try {
    const { positions } = req.body; // Array of { id, position } objects

    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Positions array is required and must not be empty.'
      });
    }

    // Validate each position entry
    for (const item of positions) {
      if (!item.id || !item.position) {
        return res.status(400).json({
          success: false,
          message: 'Each position entry must have both id and position.'
        });
      }
      if (typeof item.position !== 'number' || item.position < 1) {
        return res.status(400).json({
          success: false,
          message: 'Position must be a positive number.'
        });
      }
    }

    // Update positions in a transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Step 1: Set all to temporary negative positions to avoid unique constraint conflicts
      for (let i = 0; i < positions.length; i++) {
        const item = positions[i];
        const tempPosition = -(i + 1); // Use negative values as temporary positions
        await connection.execute(
          'UPDATE wrapped_with_love SET position = ?, updated_at = NOW() WHERE id = ?',
          [tempPosition, item.id]
        );
      }

      // Step 2: Set to final positions
      for (const item of positions) {
        await connection.execute(
          'UPDATE wrapped_with_love SET position = ?, updated_at = NOW() WHERE id = ?',
          [item.position, item.id]
        );
      }

      await connection.commit();
      res.status(200).json({
        success: true,
        message: 'Wrapped With Love positions updated successfully.',
        data: positions
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Failed to update wrapped with love positions:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to update wrapped with love positions.',
      error: err.message
    });
  }
};

// DELETE: Banner
exports.deleteWrappedWithLove = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM wrapped_with_love WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    const image_url = rows[0].image_url;
    if (image_url) {
      const imagePath = path.join(__dirname, '..', 'public', image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    await db.execute('DELETE FROM wrapped_with_love WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Wrapped With Love banner deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete banner.', error: err.message });
  }
};

// ------------------------- Second featured category --------------------------

// CREATE: Single second_feature_cat entry with optional image upload
exports.createSecondFeatureCat = async (req, res) => {
  try {
    const {
      title = 'second_feature_cat',
      alt_text = '',
      category_id = null,
      subcategory_id = null,
      is_active = true,
    } = req.body;

    // Check if title already exists
    const [existingTitle] = await db.execute('SELECT id FROM second_feature_cat WHERE title = ?', [title]);
    if (existingTitle.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Title already exists. Please choose a different title.'
      });
    }

    let image_url = null;

    // Handle optional image upload with Sharp compression
    if (req.files && req.files.length > 0) {
      const file = req.files[0]; // Take the first file
      const originalPath = file.path;
      const fileExt = path.extname(file.originalname);
      const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
      const compressedPath = path.join(path.dirname(originalPath), `${baseName}_compressed.jpg`);

      try {
        // Compress image using Sharp with proper orientation handling
        await sharp(originalPath)
          .rotate() // This automatically rotates based on EXIF orientation
          .resize(400, 400, {
            fit: 'cover',
            withoutEnlargement: false
          })
          .jpeg({
            quality: 85,
            progressive: true,
            mozjpeg: true // Better compression
          })
          .toFile(compressedPath);

        // Delete original file and use compressed version
        fs.unlinkSync(originalPath);
        image_url = `/second_feature_cat/${path.basename(compressedPath)}`;

      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        // Continue with original file if compression fails
        image_url = `/second_feature_cat/${file.filename}`;
      }
    }

    const [result] = await db.execute(
      'INSERT INTO second_feature_cat (title, alt_text, image_url, category_id, subcategory_id, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [title, alt_text, image_url, category_id, subcategory_id, is_active]
    );

    const banner = {
      id: result.insertId,
      title,
      alt_text,
      image_url,
      category_id,
      subcategory_id,
      is_active,
    };

    res.status(201).json({
      success: true,
      message: 'Second Feature Category banner created successfully.',
      data: banner,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create banner.', error: err.message });
  }
};

// GET: All banners
exports.getAllSecondFeatureCats = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        sfc.*,
        c.name as category_name,
        c.slug as category_slug,
        sc.name as subcategory_name,
        sc.slug as subcategory_slug
      FROM second_feature_cat sfc
      LEFT JOIN categories c ON sfc.category_id = c.id
      LEFT JOIN subcategories sc ON sfc.subcategory_id = sc.id
      ORDER BY sfc.created_at DESC
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.', error: err.message });
  }
};

// GET: Single banner by ID
exports.getSecondFeatureCatById = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        sfc.*,
        c.name as category_name,
        c.slug as category_slug,
        sc.name as subcategory_name,
        sc.slug as subcategory_slug
      FROM second_feature_cat sfc
      LEFT JOIN categories c ON sfc.category_id = c.id
      LEFT JOIN subcategories sc ON sfc.subcategory_id = sc.id
      WHERE sfc.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch banner.', error: err.message });
  }
};

// UPDATE: Banner (with optional new image)
exports.updateSecondFeatureCat = async (req, res) => {
  try {
    const { title, alt_text, category_id, subcategory_id, is_active } = req.body;

    const [oldRows] = await db.execute('SELECT * FROM second_feature_cat WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });

    // Check if title already exists (excluding current record)
    if (title && title !== oldRows[0].title) {
      const [existingTitle] = await db.execute('SELECT id FROM second_feature_cat WHERE title = ? AND id != ?', [title, req.params.id]);
      if (existingTitle.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Title already exists. Please choose a different title.'
        });
      }
    }

    let image_url = oldRows[0].image_url;
    const newImageFile = req.files && req.files.length > 0 ? req.files[0] : null;

    if (newImageFile) {
      // Delete old image
      if (image_url) {
        const oldImagePath = path.join(__dirname, '..', 'public', image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const originalPath = newImageFile.path;
      const fileExt = path.extname(newImageFile.originalname);
      const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
      const compressedPath = path.join(path.dirname(originalPath), `${baseName}_compressed.jpg`);

      try {
        // Compress image using Sharp with proper orientation handling
        await sharp(originalPath)
          .rotate() // This automatically rotates based on EXIF orientation
          .resize(400, 400, {
            fit: 'cover',
            withoutEnlargement: false
          })
          .jpeg({
            quality: 85,
            progressive: true,
            mozjpeg: true // Better compression
          })
          .toFile(compressedPath);

        // Delete original file and use compressed version
        fs.unlinkSync(originalPath);
        image_url = `/second_feature_cat/${path.basename(compressedPath)}`;

      } catch (compressionError) {
        console.error('Image compression failed during update:', compressionError);
        // Continue with original file if compression fails
        image_url = `/second_feature_cat/${newImageFile.filename}`;
      }
    }

    await db.execute(
      'UPDATE second_feature_cat SET title=?, alt_text=?, image_url=?, category_id=?, subcategory_id=?, is_active=?, updated_at=NOW() WHERE id=?',
      [title, alt_text, image_url, category_id, subcategory_id, is_active, req.params.id]
    );

    res.status(200).json({ success: true, message: 'Second Feature Category banner updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update banner.', error: err.message });
  }
};

// DELETE: Banner
exports.deleteSecondFeatureCat = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM second_feature_cat WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });

    const image_url = rows[0].image_url;
    if (image_url) {
      const imagePath = path.join(__dirname, '..', 'public', image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.execute('DELETE FROM second_feature_cat WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Second Feature Category banner deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete banner.', error: err.message });
  }
};

// ------------------------- Instagram Images --------------------------

// CREATE: Multiple Instagram images
exports.createInstaImages = async (req, res) => {
  try {
    const images = [];
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }

    const { alt_text = '', position = 1, is_active = true, link = '' } = req.body;

    // Convert is_active to proper boolean
    const isActiveBoolean = is_active === 'true' || is_active === true || is_active === '1' || is_active === 1;

    for (const file of req.files) {
      // Create a URL-friendly filename
      const fileExt = path.extname(file.originalname);
      const baseName = `instagram_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFilename = `${baseName}${fileExt}`;
      const newPath = path.join(path.dirname(file.path), newFilename);

      // Rename the file
      fs.renameSync(file.path, newPath);

      let finalImagePath = newPath;
      let finalImageUrl = `/instagram_images/${newFilename}`;

      // Compress image using Sharp
      try {
        const compressedPath = newPath.replace(fileExt, '_compressed.jpg');

        await sharp(newPath)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 85,
            progressive: true
          })
          .toFile(compressedPath);

        // Delete original file and use compressed version
        fs.unlinkSync(newPath);
        finalImagePath = compressedPath;
        finalImageUrl = `/instagram_images/${path.basename(compressedPath)}`;

      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        // Continue with original file if compression fails
      }

      const [result] = await db.execute(
        'INSERT INTO insta_images (alt_text, image_url, position, is_active, link) VALUES (?, ?, ?, ?, ?)',
        [alt_text, finalImageUrl, position, isActiveBoolean, link]
      );

      images.push({
        id: result.insertId,
        alt_text,
        image_url: finalImageUrl,
        position,
        is_active: isActiveBoolean,
        link
      });
    }

    res.status(201).json({
      success: true,
      message: 'Instagram images created successfully.',
      data: images
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to create Instagram images.',
      error: err.message
    });
  }
};

// GET: All Instagram images
exports.getAllInstaImages = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM insta_images ORDER BY position ASC, created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram images.',
      error: err.message
    });
  }
};

// GET: Single Instagram image by ID
exports.getInstaImageById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM insta_images WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Instagram image not found.' });
    }
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram image.',
      error: err.message
    });
  }
};

// UPDATE: Instagram image (with optional new image)
exports.updateInstaImage = async (req, res) => {
  try {
    const { alt_text, position, is_active, link } = req.body;

    // Convert is_active to proper boolean
    const isActiveBoolean = is_active === 'true' || is_active === true || is_active === '1' || is_active === 1;

    const [oldRows] = await db.execute('SELECT * FROM insta_images WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Instagram image not found.' });
    }

    let image_url = oldRows[0].image_url;
    const newImageFile = req.files && req.files.length > 0 ? req.files[0] : null;

    if (newImageFile) {
      // Delete old image
      if (image_url) {
        const oldImagePath = path.join(__dirname, '..', 'public', image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const fileExt = path.extname(newImageFile.originalname);
      const baseName = `instagram_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFilename = `${baseName}${fileExt}`;
      const newPath = path.join(path.dirname(newImageFile.path), newFilename);

      fs.renameSync(newImageFile.path, newPath);

      // Compress image using Sharp
      try {
        const compressedPath = newPath.replace(fileExt, '_compressed.jpg');

        await sharp(newPath)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 85,
            progressive: true
          })
          .toFile(compressedPath);

        // Delete original file and use compressed version
        fs.unlinkSync(newPath);
        image_url = `/instagram_images/${path.basename(compressedPath)}`;

      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        // Continue with original file if compression fails
        image_url = `/instagram_images/${newFilename}`;
      }
    }

    await db.execute(
      'UPDATE insta_images SET alt_text=?, image_url=?, position=?, is_active=?, link=?, updated_at=NOW() WHERE id=?',
      [alt_text, image_url, Number(position), isActiveBoolean, link || null, req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'Instagram image updated successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update Instagram image.',
      error: err.message
    });
  }
};

// DELETE: Instagram image
exports.deleteInstaImage = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM insta_images WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Instagram image not found.' });
    }

    const image_url = rows[0].image_url;
    if (image_url) {
      const imagePath = path.join(__dirname, '..', 'public', image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.execute('DELETE FROM insta_images WHERE id = ?', [req.params.id]);

    // Realign IDs after deletion
    await realignTableIds('insta_images');

    res.status(200).json({
      success: true,
      message: 'Instagram image deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete Instagram image.',
      error: err.message
    });
  }
};

// ------------------------ Social Links ----------------------

// CREATE: Multiple Social Links
exports.createSocialLinks = async (req, res) => {
  try {
    const links = [];

    // You can send an array of social links in req.body.links
    if (!req.body.links || !Array.isArray(req.body.links) || req.body.links.length === 0) {
      return res.status(400).json({ success: false, message: 'No social links provided.' });
    }

    for (const item of req.body.links) {
      const { platform = '', link = '', is_active = true, click = 0 } = item;

      const [result] = await db.execute(
        'INSERT INTO social_links (platform, link, is_active, click) VALUES (?, ?, ?, ?)',
        [platform, link, is_active, click]
      );

      links.push({
        id: result.insertId,
        platform,
        link,
        is_active,
        click
      });
    }

    res.status(201).json({
      success: true,
      message: 'Social links created successfully.',
      data: links
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to create social links.',
      error: err.message
    });
  }
};

// GET: All Social Links
exports.getAllSocialLinks = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM social_links ORDER BY created_at DESC');

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social links.',
      error: err.message
    });
  }
};

// GET: Single Social Link by ID
exports.getSocialLinkById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM social_links WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found.' });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social link.',
      error: err.message
    });
  }
};

// UPDATE: Social Link by ID
exports.updateSocialLink = async (req, res) => {
  try {
    const { platform, link, is_active, click } = req.body;

    // Check if the record exists
    const [existing] = await db.execute('SELECT * FROM social_links WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found.' });
    }

    await db.execute(
      'UPDATE social_links SET platform = ?, link = ?, is_active = ?, click = ?, updated_at = NOW() WHERE id = ?',
      [platform, link, is_active, click, req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'Social link updated successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update social link.',
      error: err.message
    });
  }
};

// DELETE: Social Link by ID
exports.deleteSocialLink = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM social_links WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found.' });
    }

    await db.execute('DELETE FROM social_links WHERE id = ?', [req.params.id]);

    // Optional: realignTableIds('social_links'); // Uncomment if needed

    res.status(200).json({
      success: true,
      message: 'Social link deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete social link.',
      error: err.message
    });
  }
};

// INCREMENT: Click count for a Social Link
exports.incrementClickCount = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM social_links WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Social link not found.' });
    }

    await db.execute('UPDATE social_links SET click = click + 1, updated_at = NOW() WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: 'Click count incremented.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to increment click count.',
      error: err.message
    });
  }
};

// ----------------------- Promo banner section -------------------------------

// CREATE: Promo banner with image
// POST /api/home-banners/promo-banners
exports.createPromoBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }

    const { alt_text = '', description = '', position = 1, is_active = true } = req.body;

    // Create a URL-friendly filename
    const fileExt = path.extname(req.file.originalname);
    const newFilename = `promo-banner-${Date.now()}${fileExt}`;
    const newPath = path.join(path.dirname(req.file.path), newFilename);

    // Rename the file
    fs.renameSync(req.file.path, newPath);

    const image_url = `/promo_banners/${newFilename}`;

    const [result] = await db.execute(
      'INSERT INTO promo_banner (alt_text, description, image_url, position, is_active) VALUES (?, ?, ?, ?, ?)',
      [alt_text, description, image_url, position, is_active]
    );

    const banner = {
      id: result.insertId,
      alt_text,
      description,
      image_url,
      position,
      is_active
    };

    res.status(201).json({ success: true, message: 'Promo banner created successfully.', data: banner });
  } catch (err) {
    console.error('Error creating promo banner:', err);
    res.status(500).json({ success: false, message: 'Failed to create promo banner.', error: err.message });
  }
};

// GET: All promo banners
// GET /api/home-banners/promo-banners
exports.getAllPromoBanners = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM promo_banner ORDER BY position ASC, created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching promo banners:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch promo banners.', error: err.message });
  }
};

// GET: Single promo banner by id
// GET /api/home-banners/promo-banners/:id
exports.getPromoBannerById = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM promo_banner WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Promo banner not found' });
    }
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching promo banner:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch promo banner.', error: err.message });
  }
};

// UPDATE: Promo banner (with optional new image)
// PUT /api/home-banners/promo-banners/:id
exports.updatePromoBanner = async (req, res) => {
  try {
    const { alt_text, description, position, is_active } = req.body;

    // Get the existing banner
    const [oldRows] = await db.execute('SELECT * FROM promo_banner WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Promo banner not found' });
    }

    const banner = oldRows[0];
    let image_url = banner.image_url;

    // Handle new image upload if provided
    if (req.file) {
      // Delete old image if it exists
      if (banner.image_url) {
        const oldImagePath = path.join(__dirname, '..', 'public', banner.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Process new image
      const fileExt = path.extname(req.file.originalname);
      const newFilename = `promo-banner-${Date.now()}${fileExt}`;
      const newPath = path.join(path.dirname(req.file.path), newFilename);

      fs.renameSync(req.file.path, newPath);
      image_url = `/promo_banners/${newFilename}`;
    }

    // Update the banner in database
    await db.execute(
      'UPDATE promo_banner SET alt_text=?, description=?, image_url=?, position=?, is_active=?, updated_at=NOW() WHERE id=?',
      [
        alt_text || banner.alt_text,
        description || banner.description,
        image_url,
        position !== undefined ? position : banner.position,
        is_active !== undefined ? is_active : banner.is_active,
        req.params.id
      ]
    );

    // Get the updated banner
    const [updatedRows] = await db.execute('SELECT * FROM promo_banner WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: 'Promo banner updated successfully.',
      data: updatedRows[0]
    });
  } catch (err) {
    console.error('Error updating promo banner:', err);
    res.status(500).json({ success: false, message: 'Failed to update promo banner.', error: err.message });
  }
};

// DELETE: Promo banner
// DELETE /api/home-banners/promo-banners/:id
exports.deletePromoBanner = async (req, res) => {
  try {
    // Get the banner first to delete its image file
    const [banners] = await db.execute('SELECT * FROM promo_banner WHERE id = ?', [req.params.id]);

    if (banners.length === 0) {
      return res.status(404).json({ success: false, message: 'Promo banner not found' });
    }

    const banner = banners[0];

    // Delete the image file if it exists
    if (banner.image_url) {
      const imagePath = path.join(__dirname, '..', 'public', banner.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the banner from database
    await db.execute('DELETE FROM promo_banner WHERE id = ?', [req.params.id]);

    // Realign IDs if needed (assuming you have a utility function for this)
    await realignTableIds('promo_banner');

    res.status(200).json({ success: true, message: 'Promo banner deleted successfully.' });
  } catch (err) {
    console.error('Error deleting promo banner:', err);
    res.status(500).json({ success: false, message: 'Failed to delete promo banner.', error: err.message });
  }
};