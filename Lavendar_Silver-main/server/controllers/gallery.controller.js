const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Get all gallery items (max 3 per device type, or filter by device_type)
exports.getAllGalleryItems = async (req, res) => {
    try {
        const device_type = req.query.device_type; // Optional filter

        let query = `
            SELECT g.*, c.name as category_name 
            FROM gallery g 
            LEFT JOIN categories c ON g.category_id = c.id 
        `;

        const params = [];
        if (device_type && ['desktop', 'mobile'].includes(device_type)) {
            query += ` WHERE g.device_type = ?`;
            params.push(device_type);
            query += ` ORDER BY g.position ASC LIMIT 3`;
        } else {
            query += ` ORDER BY g.device_type ASC, g.position ASC`;
        }

        const [rows] = await db.execute(query, params);

        // Add full image URLs
        const galleryItems = rows.map(item => ({
            ...item,
            imageUrl: item.image_url || null
        }));

        res.status(200).json({
            success: true,
            data: galleryItems
        });
    } catch (error) {
        console.error('Error fetching gallery items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gallery items',
            error: error.message
        });
    }
};

// Get gallery item by ID
exports.getGalleryItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(
            'SELECT * FROM gallery WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        const item = rows[0];
        item.imageUrl = item.image_url || null;

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error fetching gallery item:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gallery item',
            error: error.message
        });
    }
};

// Helper function to compress image to under 1MB
const compressImageTo1MB = async (inputPath, outputPath, maxSizeBytes = 1000 * 1024) => {
    try {
        const originalStats = fs.statSync(inputPath);

        // If already under limit, just copy
        if (originalStats.size <= maxSizeBytes) {
            fs.copyFileSync(inputPath, outputPath);
            return outputPath;
        }

        let quality = 85;
        let compressedPath = outputPath;

        // Compress with decreasing quality until under size limit
        while (quality > 30) {
            await sharp(inputPath)
                .jpeg({ quality: quality, progressive: true })
                .png({ quality: quality, progressive: true })
                .toFile(compressedPath);

            const stats = fs.statSync(compressedPath);
            if (stats.size <= maxSizeBytes) {
                break;
            }
            quality -= 5;
        }

        // If still too large, resize
        const stats = fs.statSync(compressedPath);
        if (stats.size > maxSizeBytes) {
            const metadata = await sharp(compressedPath).metadata();
            const newWidth = Math.floor(metadata.width * 0.85);
            const newHeight = Math.floor(metadata.height * 0.85);

            await sharp(inputPath)
                .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 75, progressive: true })
                .png({ quality: 75, progressive: true })
                .toFile(compressedPath);
        }

        return compressedPath;
    } catch (error) {
        console.error('Error compressing image:', error);
        return inputPath;
    }
};

// Create new gallery item (max 3 items per device type)
exports.createGalleryItem = async (req, res) => {
    try {
        const { title, category_id, isActive, position, device_type = 'desktop' } = req.body;
        let imageUrl = null;

        // Validate device_type
        if (!['desktop', 'mobile'].includes(device_type)) {
            return res.status(400).json({
                success: false,
                message: 'Device type must be either "desktop" or "mobile"'
            });
        }

        // Check if we already have 3 items for this device type
        const [countRows] = await db.execute(
            'SELECT COUNT(*) as count FROM gallery WHERE device_type = ?',
            [device_type]
        );
        if (countRows[0].count >= 3) {
            return res.status(400).json({
                success: false,
                message: `Maximum 3 gallery items allowed for ${device_type}`
            });
        }

        // Check for duplicate position within same device type
        const [existingPosition] = await db.execute(
            'SELECT id FROM gallery WHERE position = ? AND device_type = ?',
            [position, device_type]
        );
        if (existingPosition.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Position ${position} already exists for ${device_type} device type`
            });
        }

        // Handle file upload with Sharp compression
        if (req.file) {
            const originalPath = req.file.path;
            const fileExt = path.extname(req.file.originalname);
            const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');

            let finalFilename;
            let finalPath;

            // For mobile images, convert to WebP with 360-480px width
            if (device_type === 'mobile') {
                finalFilename = `${baseName}-${Date.now()}.webp`;
                finalPath = path.join(path.dirname(originalPath), finalFilename);

                try {
                    const maxSizeBytes = 1000 * 1024; // 1MB
                    let quality = 85;
                    let webpPath = finalPath;

                    // Get image metadata to calculate dimensions
                    const metadata = await sharp(originalPath).metadata();
                    const aspectRatio = metadata.height / metadata.width;
                    const targetWidth = 420; // Midpoint of 360-480px
                    const targetHeight = Math.round(targetWidth * aspectRatio);

                    // Compress with decreasing quality until under 1MB
                    while (quality > 30) {
                        await sharp(originalPath)
                            .resize(targetWidth, targetHeight, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .webp({ quality: quality, effort: 6 })
                            .toFile(webpPath);

                        const stats = fs.statSync(webpPath);
                        if (stats.size <= maxSizeBytes) {
                            break;
                        }
                        quality -= 5;
                    }

                    // If still too large, reduce dimensions further
                    const stats = fs.statSync(webpPath);
                    if (stats.size > maxSizeBytes) {
                        const smallerWidth = 360;
                        const smallerHeight = Math.round(smallerWidth * aspectRatio);

                        await sharp(originalPath)
                            .resize(smallerWidth, smallerHeight, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .webp({ quality: 70, effort: 6 })
                            .toFile(webpPath);
                    }

                    // Delete original file
                    if (fs.existsSync(originalPath)) {
                        fs.unlinkSync(originalPath);
                    }

                    imageUrl = `/gallery/${finalFilename}`;
                } catch (webpError) {
                    console.error('Error converting to WebP:', webpError);
                    // Fallback to JPEG compression
                    const compressedPath = originalPath.replace(/\.[^/.]+$/, '_compressed.jpg');
                    await compressImageTo1MB(originalPath, compressedPath);
                    if (fs.existsSync(originalPath)) {
                        fs.unlinkSync(originalPath);
                    }
                    imageUrl = `/gallery/${path.basename(compressedPath)}`;
                }
            } else {
                // For desktop, use JPEG compression (max 1MB)
                finalFilename = `${baseName}-${Date.now()}${fileExt}`;
                finalPath = path.join(path.dirname(originalPath), finalFilename.replace(fileExt, '_compressed.jpg'));

                const compressedPath = await compressImageTo1MB(originalPath, finalPath);
                if (fs.existsSync(originalPath) && compressedPath !== originalPath) {
                    fs.unlinkSync(originalPath);
                }

                imageUrl = `/gallery/${path.basename(compressedPath)}`;
            }
        }

        if (!title || !imageUrl || !category_id) {
            return res.status(400).json({
                success: false,
                message: 'Title, image, and category are required'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO gallery (title, category_id, image_url, is_active, position, device_type) VALUES (?, ?, ?, ?, ?, ?)',
            [title, category_id, imageUrl, isActive === 'true' || isActive === true, position || 1, device_type]
        );

        res.status(201).json({
            success: true,
            message: 'Gallery item created successfully',
            data: {
                id: result.insertId,
                title,
                category_id,
                imageUrl: imageUrl,
                isActive: isActive === 'true' || isActive === true,
                position: position || 1,
                device_type: device_type
            }
        });
    } catch (error) {
        console.error('Error creating gallery item:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating gallery item',
            error: error.message
        });
    }
};

// Update gallery item
exports.updateGalleryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category_id, isActive, position, device_type } = req.body;
        let imageUrl = null;

        // Check if item exists
        const [existingRows] = await db.execute(
            'SELECT * FROM gallery WHERE id = ?',
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        const existingItem = existingRows[0];
        const finalDeviceType = device_type || existingItem.device_type || 'desktop';

        // Validate device_type if provided
        if (device_type && !['desktop', 'mobile'].includes(device_type)) {
            return res.status(400).json({
                success: false,
                message: 'Device type must be either "desktop" or "mobile"'
            });
        }

        // Check for duplicate position within same device type (excluding current item)
        if (position && position !== existingItem.position) {
            const [existingPosition] = await db.execute(
                'SELECT id FROM gallery WHERE position = ? AND device_type = ? AND id != ?',
                [position, finalDeviceType, id]
            );
            if (existingPosition.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} already exists for ${finalDeviceType} device type`
                });
            }
        }

        // Handle file upload
        if (req.file) {
            // Delete old image if it exists
            if (existingItem.image_url) {
                const oldImagePath = path.join(__dirname, '..', 'public', existingItem.image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            const originalPath = req.file.path;
            const fileExt = path.extname(req.file.originalname);
            const baseName = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');

            let finalFilename;
            let finalPath;

            // For mobile images, convert to WebP with 360-480px width
            if (finalDeviceType === 'mobile') {
                finalFilename = `${baseName}-${Date.now()}.webp`;
                finalPath = path.join(path.dirname(originalPath), finalFilename);

                try {
                    const maxSizeBytes = 1000 * 1024; // 1MB
                    let quality = 85;

                    // Get image metadata to calculate dimensions
                    const metadata = await sharp(originalPath).metadata();
                    const aspectRatio = metadata.height / metadata.width;
                    const targetWidth = 420; // Midpoint of 360-480px
                    const targetHeight = Math.round(targetWidth * aspectRatio);

                    // Compress with decreasing quality until under 1MB
                    while (quality > 30) {
                        await sharp(originalPath)
                            .resize(targetWidth, targetHeight, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .webp({ quality: quality, effort: 6 })
                            .toFile(finalPath);

                        const stats = fs.statSync(finalPath);
                        if (stats.size <= maxSizeBytes) {
                            break;
                        }
                        quality -= 5;
                    }

                    // If still too large, reduce dimensions further
                    const stats = fs.statSync(finalPath);
                    if (stats.size > maxSizeBytes) {
                        const smallerWidth = 360;
                        const smallerHeight = Math.round(smallerWidth * aspectRatio);

                        await sharp(originalPath)
                            .resize(smallerWidth, smallerHeight, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .webp({ quality: 70, effort: 6 })
                            .toFile(finalPath);
                    }

                    // Delete original file
                    if (fs.existsSync(originalPath)) {
                        fs.unlinkSync(originalPath);
                    }

                    imageUrl = `/gallery/${finalFilename}`;
                } catch (webpError) {
                    console.error('Error converting to WebP:', webpError);
                    // Fallback to JPEG compression
                    const compressedPath = originalPath.replace(/\.[^/.]+$/, '_compressed.jpg');
                    await compressImageTo1MB(originalPath, compressedPath);
                    if (fs.existsSync(originalPath)) {
                        fs.unlinkSync(originalPath);
                    }
                    imageUrl = `/gallery/${path.basename(compressedPath)}`;
                }
            } else {
                // For desktop, use JPEG compression (max 1MB)
                finalFilename = `${baseName}-${Date.now()}${fileExt}`;
                finalPath = path.join(path.dirname(originalPath), finalFilename.replace(fileExt, '_compressed.jpg'));

                const compressedPath = await compressImageTo1MB(originalPath, finalPath);
                if (fs.existsSync(originalPath) && compressedPath !== originalPath) {
                    fs.unlinkSync(originalPath);
                }

                imageUrl = `/gallery/${path.basename(compressedPath)}`;
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
            'UPDATE gallery SET title = ?, category_id = ?, image_url = ?, is_active = ?, position = ?, device_type = ? WHERE id = ?',
            [title, category_id, imageUrl, isActive === 'true' || isActive === true, position || 1, finalDeviceType, id]
        );

        res.status(200).json({
            success: true,
            message: 'Gallery item updated successfully',
            data: {
                id: parseInt(id),
                title,
                category_id,
                imageUrl: imageUrl,
                isActive: isActive === 'true' || isActive === true,
                position: position || 1,
                device_type: finalDeviceType
            }
        });
    } catch (error) {
        console.error('Error updating gallery item:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating gallery item',
            error: error.message
        });
    }
};

// UPDATE: Bulk update gallery positions
exports.updateGalleryPositions = async (req, res) => {
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

        // Get device_type for each gallery item to group by device type
        const galleryIds = positions.map(p => p.id);
        const placeholders = galleryIds.map(() => '?').join(',');
        const [galleryRows] = await db.execute(
            `SELECT id, device_type FROM gallery WHERE id IN (${placeholders})`,
            galleryIds
        );

        // Create a map of id -> device_type
        const deviceTypeMap = {};
        galleryRows.forEach(row => {
            deviceTypeMap[row.id] = row.device_type;
        });

        // Group positions by device_type
        const positionsByDevice = {};
        positions.forEach(item => {
            const deviceType = deviceTypeMap[item.id];
            if (!deviceType) {
                throw new Error(`Gallery item with id ${item.id} not found`);
            }
            if (!positionsByDevice[deviceType]) {
                positionsByDevice[deviceType] = [];
            }
            positionsByDevice[deviceType].push(item);
        });

        // Update positions in a transaction
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

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
                        'UPDATE gallery SET position = ?, updated_at = NOW() WHERE id = ?',
                        [tempPosition, item.id]
                    );
                }

                // Step 2: Set to final positions
                for (const item of devicePositions) {
                    await connection.execute(
                        'UPDATE gallery SET position = ?, updated_at = NOW() WHERE id = ?',
                        [item.position, item.id]
                    );
                }
            }

            await connection.commit();
            res.status(200).json({
                success: true,
                message: 'Gallery positions updated successfully.',
                data: positions
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("Failed to update gallery positions:", err);
        res.status(500).json({
            success: false,
            message: 'Failed to update gallery positions.',
            error: err.message
        });
    }
};

// Delete gallery item
exports.deleteGalleryItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if item exists and get image path
        const [rows] = await db.execute(
            'SELECT image_url FROM gallery WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        // Delete image file if it exists
        const imageUrl = rows[0].image_url;
        if (imageUrl) {
            const imagePath = path.join(__dirname, '..', 'public', imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete from database
        await db.execute('DELETE FROM gallery WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Gallery item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting gallery item',
            error: error.message
        });
    }
};
