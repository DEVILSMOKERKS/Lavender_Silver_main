const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Helper function to compress image to under 1MB
const compressImageTo1MB = async (inputPath, outputPath, maxSizeBytes = 1000 * 1024) => {
  try {
    const originalStats = fs.statSync(inputPath);

    // If already under limit, just copy the file
    if (originalStats.size <= maxSizeBytes) {
      fs.copyFileSync(inputPath, outputPath);
      return outputPath;
    }

    let quality = 85;
    let compressedPath = outputPath;

    // Compress with decreasing quality until under 1MB
    while (quality > 30) {
      await sharp(inputPath)
        .resize(1200, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: quality, progressive: true })
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
        .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75, progressive: true })
        .toFile(compressedPath);
    }

    return compressedPath;
  } catch (error) {
    console.error('Error compressing image:', error);
    return inputPath;
  }
};

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/offerCarousel');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Get all carousel items
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM offer_carousel ORDER BY created_at DESC'
    );

    // Return items as they are from database
    const items = rows;

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching carousel items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching carousel items',
      error: error.message
    });
  }
};

// Create new carousel item
exports.create = async (req, res) => {
  try {
    const { title } = req.body;
    let imageUrl = null;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Handle file upload with Sharp compression (max 1MB)
    const originalPath = req.file.path;
    const compressedPath = originalPath.replace(/\.[^/.]+$/, '_compressed.jpg');

    try {
      const finalPath = await compressImageTo1MB(originalPath, compressedPath);

      // Delete original file if compression created a new file
      if (finalPath !== originalPath && fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      // Use compressed file
      imageUrl = `/offerCarousel/${path.basename(finalPath)}`;
    } catch (error) {
      console.error('Sharp compression error:', error);
      imageUrl = `/offerCarousel/${req.file.filename}`;
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO offer_carousel (title, image_url) VALUES (?, ?)',
      [title, imageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Carousel item created successfully',
      data: {
        id: result.insertId,
        title,
        image_url: imageUrl
      }
    });
  } catch (error) {
    console.error('Error creating carousel item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating carousel item',
      error: error.message
    });
  }
};

// Update carousel item
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    let imageUrl = null;

    // Check if item exists
    const [existingRows] = await db.execute(
      'SELECT * FROM offer_carousel WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Carousel item not found'
      });
    }

    const existingItem = existingRows[0];

    // Handle file upload with Sharp compression
    if (req.file) {
      // Delete old image if it exists
      if (existingItem.image_url) {
        const oldImagePath = path.join(__dirname, '../public', existingItem.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const originalPath = req.file.path;
      const compressedPath = originalPath.replace(/\.[^/.]+$/, '_compressed.jpg');

      try {
        const finalPath = await compressImageTo1MB(originalPath, compressedPath);

        // Delete original file if compression created a new file
        if (finalPath !== originalPath && fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        // Use compressed file
        imageUrl = `/offerCarousel/${path.basename(finalPath)}`;
      } catch (error) {
        console.error('Sharp compression error:', error);
        imageUrl = `/offerCarousel/${req.file.filename}`;
      }
    } else {
      imageUrl = existingItem.image_url;
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    await db.execute(
      'UPDATE offer_carousel SET title = ?, image_url = ? WHERE id = ?',
      [title, imageUrl, id]
    );

    res.status(200).json({
      success: true,
      message: 'Carousel item updated successfully',
      data: {
        id: parseInt(id),
        title,
        image_url: imageUrl
      }
    });
  } catch (error) {
    console.error('Error updating carousel item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating carousel item',
      error: error.message
    });
  }
};

// Delete carousel item
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists and get image path
    const [rows] = await db.execute(
      'SELECT image_url FROM offer_carousel WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Carousel item not found'
      });
    }

    // Delete image file if it exists
    const imageUrl = rows[0].image_url;
    if (imageUrl) {
      const imagePath = path.join(__dirname, '../public', imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete from database
    await db.execute('DELETE FROM offer_carousel WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Carousel item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting carousel item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting carousel item',
      error: error.message
    });
  }
};
