const db = require('../config/db');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
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

// Get all client diary images
exports.getClientDiaryImages = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM client_diary_images ORDER BY created_at DESC');

        res.status(200).json({
            success: true,
            data: results,
            message: 'Client diary images fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching client diary images:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get single client diary image
exports.getClientDiaryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await db.query('SELECT * FROM client_diary_images WHERE id = ?', [id]);

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Client diary image not found'
            });
        }

        res.status(200).json({
            success: true,
            data: results[0],
            message: 'Client diary image fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching client diary image:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create client diary image
exports.createClientDiaryImage = async (req, res) => {
    try {
        const { image_url, alt_text } = req.body;

        if (!image_url) {
            return res.status(400).json({
                success: false,
                message: 'Image URL is required'
            });
        }

        const [result] = await db.query(
            'INSERT INTO client_diary_images (image_url, alt_text) VALUES (?, ?)',
            [image_url, alt_text || null]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId },
            message: 'Client diary image created successfully'
        });
    } catch (error) {
        console.error('Error creating client diary image:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update client diary image
exports.updateClientDiaryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { image_url, alt_text } = req.body;

        // Check if image exists
        const [existingImage] = await db.query('SELECT * FROM client_diary_images WHERE id = ?', [id]);

        if (existingImage.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Client diary image not found'
            });
        }

        const oldImageUrl = existingImage[0].image_url;
        let newImageUrl = image_url;

        // If a new file is uploaded, compress it (max 1MB)
        if (req.file) {
            const originalPath = req.file.path;
            const fileExt = path.extname(req.file.filename);
            const baseName = path.basename(req.file.filename, fileExt);
            const compressedPath = path.join(path.dirname(originalPath), `${baseName}_compressed.jpg`);

            try {
                const finalPath = await compressImageTo1MB(originalPath, compressedPath);

                // Delete original file if compression created a new file
                if (finalPath !== originalPath && fs.existsSync(originalPath)) {
                    fs.unlinkSync(originalPath);
                }

                newImageUrl = `/client_diary/${path.basename(finalPath)}`;

            } catch (compressionError) {
                console.error('Image compression failed during update:', compressionError);
                // Continue with original file if compression fails
                newImageUrl = `/client_diary/${req.file.filename}`;
            }
        }

        // Update the image
        await db.query(
            'UPDATE client_diary_images SET image_url = ?, alt_text = ?, updated_at = NOW() WHERE id = ?',
            [newImageUrl, alt_text || null, id]
        );

        // Delete old image if it's different and not an external URL
        if (oldImageUrl && oldImageUrl !== newImageUrl && !oldImageUrl.startsWith('http')) {
            try {
                const fullPath = path.join(__dirname, '../public', oldImageUrl);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (deleteError) {
                console.error(`❌ Error deleting old image ${oldImageUrl}:`, deleteError);
            }
        }

        res.status(200).json({
            success: true,
            data: { image_url: newImageUrl },
            message: 'Client diary image updated successfully'
        });
    } catch (error) {
        console.error('Error updating client diary image:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete client diary image
exports.deleteClientDiaryImage = async (req, res) => {
    try {
        const { id } = req.params;

        // Get image details before deletion
        const [existingImage] = await db.query('SELECT * FROM client_diary_images WHERE id = ?', [id]);

        if (existingImage.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Client diary image not found'
            });
        }

        const imageUrl = existingImage[0].image_url;

        // Delete from database
        await db.query('DELETE FROM client_diary_images WHERE id = ?', [id]);

        // Delete image file if it's not an external URL
        if (imageUrl && !imageUrl.startsWith('http')) {
            try {
                const fullPath = path.join(__dirname, '../public', imageUrl);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (deleteError) {
                console.error(`❌ Error deleting image ${imageUrl}:`, deleteError);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Client diary image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting client diary image:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Upload client diary image
exports.uploadClientDiaryImage = async (req, res) => {
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

        // Compress image using Sharp (max 1MB)
        try {
            const finalPath = await compressImageTo1MB(originalPath, compressedPath);

            // Delete original file if compression created a new file
            if (finalPath !== originalPath && fs.existsSync(originalPath)) {
                fs.unlinkSync(originalPath);
            }

            const imageUrl = `/client_diary/${path.basename(finalPath)}`;

            res.status(200).json({
                success: true,
                data: { image_url: imageUrl },
                message: 'Image uploaded and compressed successfully'
            });
        } catch (compressionError) {
            console.error('Image compression failed:', compressionError);
            // Continue with original file if compression fails
            const imageUrl = `/client_diary/${req.file.filename}`;

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
