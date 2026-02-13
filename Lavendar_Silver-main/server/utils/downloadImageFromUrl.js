const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

/**
 * Validate if an image URL is accessible
 * @param {string} imageUrl - The image URL to validate
 * @returns {Promise<{valid: boolean, status?: number, error?: string}>}
 */
const validateImageUrl = async (imageUrl) => {
    try {
        const response = await axios.head(imageUrl, {
            timeout: 10000, // 10 seconds timeout
            validateStatus: (status) => status < 500, // Don't throw on 4xx errors
            maxRedirects: 5
        });

        // Check if response is an image
        const contentType = response.headers['content-type'] || '';
        const isImage = contentType.startsWith('image/');

        if (response.status === 200 && isImage) {
            return { valid: true, status: response.status, contentType };
        } else if (response.status === 200 && !isImage) {
            return { valid: false, status: response.status, error: 'URL does not point to an image' };
        } else {
            return { valid: false, status: response.status, error: `HTTP ${response.status}` };
        }
    } catch (error) {
        if (error.response) {
            return { valid: false, status: error.response.status, error: error.response.statusText };
        } else if (error.request) {
            return { valid: false, error: 'Network error - no response received' };
        } else {
            return { valid: false, error: error.message };
        }
    }
};

/**
 * Download image from URL and save it with a unique name
 * @param {string} imageUrl - The image URL to download
 * @param {string} saveDirectory - Directory to save the image (default: 'public/products')
 * @param {Object} options - Options for image processing
 * @returns {Promise<{success: boolean, filename?: string, filepath?: string, url?: string, error?: string, size?: number}>}
 */
const downloadImageFromUrl = async (imageUrl, saveDirectory = 'public/products', options = {}) => {
    try {
        // Validate URL first
        const validation = await validateImageUrl(imageUrl);
        if (!validation.valid) {
            return {
                success: false,
                error: `Invalid image URL: ${validation.error || 'URL validation failed'}`
            };
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(saveDirectory)) {
            fs.mkdirSync(saveDirectory, { recursive: true });
        }

        // Download the image
        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'stream',
            timeout: 30000, // 30 seconds timeout
            maxRedirects: 5
        });

        // Generate unique filename
        const urlExtension = path.extname(new URL(imageUrl).pathname.split('?')[0]) || '.jpg';
        const uniqueId = uuidv4().substring(0, 8);
        const timestamp = Date.now();
        const filename = `img_${timestamp}_${uniqueId}${urlExtension}`;
        const filepath = path.join(saveDirectory, filename);

        // Save image to temporary file first
        const tempFilePath = path.join(saveDirectory, `temp_${filename}`);
        const writer = fs.createWriteStream(tempFilePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Process image with Sharp (compress, resize if needed)
        const processedFilePath = filepath;
        try {
            const image = sharp(tempFilePath);
            const metadata = await image.metadata();

            // Resize if options provided
            if (options.maxWidth || options.maxHeight) {
                await image
                    .resize(options.maxWidth || null, options.maxHeight || null, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: options.quality || 85, progressive: true })
                    .toFile(processedFilePath);

                // Delete temp file
                fs.unlinkSync(tempFilePath);
            } else {
                // Just compress without resizing
                await image
                    .jpeg({ quality: options.quality || 85, progressive: true })
                    .toFile(processedFilePath);

                // Delete temp file
                fs.unlinkSync(tempFilePath);
            }

            // Get file size
            const stats = fs.statSync(processedFilePath);
            const fileSize = stats.size;

            // Generate URL path
            const urlPath = `/products/${filename}`;

            return {
                success: true,
                filename,
                filepath: processedFilePath,
                url: urlPath,
                size: fileSize,
                width: metadata.width,
                height: metadata.height,
                contentType: validation.contentType
            };
        } catch (processingError) {
            // If processing fails, use original file
            console.error('Image processing error:', processingError);
            fs.renameSync(tempFilePath, processedFilePath);
            const stats = fs.statSync(processedFilePath);
            const fileSize = stats.size;

            const urlPath = `/products/${filename}`;
            return {
                success: true,
                filename,
                filepath: processedFilePath,
                url: urlPath,
                size: fileSize,
                warning: 'Image saved without processing'
            };
        }
    } catch (error) {
        console.error('Error downloading image:', error.message);
        return {
            success: false,
            error: error.message || 'Failed to download image'
        };
    }
};

/**
 * Download multiple images from URLs
 * @param {Array<string>} imageUrls - Array of image URLs
 * @param {string} saveDirectory - Directory to save images
 * @param {Object} options - Options for image processing
 * @returns {Promise<Array>} Array of download results
 */
const downloadMultipleImages = async (imageUrls, saveDirectory = 'public/products', options = {}) => {
    const results = [];

    for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        const result = await downloadImageFromUrl(imageUrl, saveDirectory, options);
        results.push({
            index: i,
            url: imageUrl,
            ...result
        });

        // Add small delay to avoid overwhelming the server
        if (i < imageUrls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
};

module.exports = {
    validateImageUrl,
    downloadImageFromUrl,
    downloadMultipleImages
};

