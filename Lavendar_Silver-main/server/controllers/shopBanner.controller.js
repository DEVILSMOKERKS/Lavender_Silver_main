const db = require('../config/db');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Get all banners (single row)
exports.getBanners = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM shop_banners LIMIT 1');

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No banners found'
      });
    }

    res.status(200).json({
      success: true,
      data: results[0],
      message: 'Banners fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create banners (only if not exists)
exports.createBanners = async (req, res) => {
  try {
    const {
      first_banner_image,
      first_banner_alt,
      second_banner_image,
      second_banner_alt,
      third_banner_image,
      third_banner_alt
    } = req.body;

    // Check if banners already exist
    const [existingBanners] = await db.query('SELECT COUNT(*) as count FROM shop_banners');

    if (existingBanners[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Banners already exist. Use update instead.'
      });
    }

    // Create new banners
    const [result] = await db.query(
      `INSERT INTO shop_banners 
       (first_banner_image, first_banner_alt, second_banner_image, second_banner_alt, third_banner_image, third_banner_alt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        first_banner_image,
        first_banner_alt,
        second_banner_image,
        second_banner_alt,
        third_banner_image,
        third_banner_alt
      ]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Banners created successfully'
    });
  } catch (error) {
    console.error('Error creating banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update banners (single row)
exports.updateBanners = async (req, res) => {
  try {
    const {
      first_banner_image,
      first_banner_alt,
      second_banner_image,
      second_banner_alt,
      third_banner_image,
      third_banner_alt
    } = req.body;

    // Get existing banners to check for old images
    const [existingBanners] = await db.query('SELECT * FROM shop_banners LIMIT 1');

    if (existingBanners.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No banners found to update. Create banners first.'
      });
    }

    const existingBanner = existingBanners[0];
    const oldImages = [];

    // Collect old image paths that need to be deleted
    if (existingBanner.first_banner_image && existingBanner.first_banner_image !== first_banner_image) {
      oldImages.push(existingBanner.first_banner_image);
    }
    if (existingBanner.second_banner_image && existingBanner.second_banner_image !== second_banner_image) {
      oldImages.push(existingBanner.second_banner_image);
    }
    if (existingBanner.third_banner_image && existingBanner.third_banner_image !== third_banner_image) {
      oldImages.push(existingBanner.third_banner_image);
    }

    // Update banners
    await db.query(
      `UPDATE shop_banners SET
       first_banner_image = ?, first_banner_alt = ?,
       second_banner_image = ?, second_banner_alt = ?,
       third_banner_image = ?, third_banner_alt = ?,
       updated_at = NOW()
       WHERE id = 1`,
      [
        first_banner_image,
        first_banner_alt,
        second_banner_image,
        second_banner_alt,
        third_banner_image,
        third_banner_alt
      ]
    );

    // Delete old images from filesystem
    oldImages.forEach(imagePath => {
      try {
        if (imagePath && !imagePath.startsWith('http')) {
          const fullPath = path.join(__dirname, '../public', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      } catch (deleteError) {
        console.error(`❌ Error deleting old image ${imagePath}:`, deleteError);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Banners updated successfully',
      deletedImages: oldImages.length
    });
  } catch (error) {
    console.error('Error updating banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Upload banner image
exports.uploadBannerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const originalPath = req.file.path;
    const fileExt = path.extname(req.file.filename);
    const baseName = path.basename(req.file.filename, fileExt);
    const compressedPath = path.join(path.dirname(originalPath), `${baseName}_compressed.jpg`);

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

    // Compress image using Sharp (max 1MB)
    try {
      const finalPath = await compressImageTo1MB(originalPath, compressedPath);

      // Delete original file if compression created a new file
      if (finalPath !== originalPath && fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      const imageUrl = `/shop_banner/${path.basename(finalPath)}`;

      res.status(200).json({
        success: true,
        data: { image_url: imageUrl },
        message: 'Image uploaded and compressed successfully'
      });
    } catch (compressionError) {
      console.error('Image compression failed:', compressionError);
      // Continue with original file if compression fails
      const imageUrl = `/shop_banner/${req.file.filename}`;

      res.status(200).json({
        success: true,
        data: { image_url: imageUrl },
        message: 'Image uploaded successfully (compression failed)'
      });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete banners (optional - if you want to reset)
exports.deleteBanners = async (req, res) => {
  try {
    // Get existing banners to delete their images
    const [existingBanners] = await db.query('SELECT * FROM shop_banners LIMIT 1');

    if (existingBanners.length > 0) {
      const existingBanner = existingBanners[0];
      const imagesToDelete = [
        existingBanner.first_banner_image,
        existingBanner.second_banner_image,
        existingBanner.third_banner_image
      ].filter(img => img && !img.startsWith('http'));

      // Delete images from filesystem
      imagesToDelete.forEach(imagePath => {
        try {
          const fullPath = path.join(__dirname, '../public', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (deleteError) {
          console.error(`❌ Error deleting image ${imagePath}:`, deleteError);
        }
      });
    }

    // Delete from database
    await db.query('DELETE FROM shop_banners');

    res.status(200).json({
      success: true,
      message: 'Banners deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 