const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { triggerProductLaunchEmail } = require('./emailAutomation.controller');
const { downloadImageFromUrl } = require('../utils/downloadImageFromUrl');

const deleteFileFromServer = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);

            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error deleting file ${filePath}:`, error);
        return false;
    }
};

const compressImage = async (imagePath, quality = 85) => {
    try {
        if (!fs.existsSync(imagePath)) {
            console.warn(`⚠️ Image file not found: ${imagePath}`);
            return { compressed: false, originalSize: 0, finalSize: 0, error: 'File not found' };
        }

        const fileStats = fs.statSync(imagePath);
        const originalSize = fileStats.size;

        const image = sharp(imagePath);
        const metadata = await image.metadata();
        const { width, height } = metadata;

        const needsResize = width > 1080 || height > 1080;

        let processedImage = image;

        if (needsResize) {
            processedImage = processedImage.resize(1080, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        const compressedImage = await processedImage
            .webp({ quality, effort: 6 })
            .toBuffer();

        const compressedMetadata = await sharp(compressedImage).metadata();
        const newWidth = compressedMetadata.width;
        const newHeight = compressedMetadata.height;

        const dir = path.dirname(imagePath);
        const baseName = path.basename(imagePath, path.extname(imagePath));
        const newImagePath = path.join(dir, `${baseName}.webp`);

        const tempPath = newImagePath + '.temp';

        try {
            fs.writeFileSync(tempPath, compressedImage);

            if (imagePath !== newImagePath && fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            if (fs.existsSync(tempPath)) {
                if (fs.existsSync(newImagePath)) {
                    fs.unlinkSync(newImagePath);
                }
                fs.renameSync(tempPath, newImagePath);
            }

            const compressionRatio = ((originalSize - compressedImage.length) / originalSize * 100).toFixed(1);

            return {
                compressed: true,
                originalSize,
                finalSize: compressedImage.length,
                compressionRatio: parseFloat(compressionRatio),
                resized: needsResize,
                originalDimensions: { width, height },
                newDimensions: { width: newWidth, height: newHeight },
                newPath: newImagePath
            };
        } catch (fileError) {
            if (fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                } catch (cleanupError) {
                    console.warn(`⚠️ Could not clean up temp file: ${tempPath}`);
                }
            }
            throw fileError;
        }
    } catch (error) {
        console.error(`❌ Error compressing image ${imagePath}:`, error);
        return { compressed: false, originalSize: 0, finalSize: 0, error: error.message };
    }
};

// Helper function to delete product images
const deleteProductImages = async (productId, connection = null) => {
    try {
        // Use provided connection or default db connection
        let images;
        if (connection) {
            [images] = await connection.execute(
                'SELECT image_url, image_name FROM product_images WHERE product_id = ?',
                [productId]
            );
        } else {
            [images] = await db.execute(
                'SELECT image_url, image_name FROM product_images WHERE product_id = ?',
                [productId]
            );
        }

        for (const image of images) {
            if (image.image_url) {
                // Handle both absolute paths (/products/img.jpg) and relative paths
                let imagePath;
                if (image.image_url.startsWith('/')) {
                    // Remove leading slash and join with public directory
                    imagePath = path.join(process.cwd(), 'public', image.image_url.substring(1));
                } else {
                    // If image_name exists, use it, otherwise use image_url
                    const fileName = image.image_name || image.image_url.split('/').pop();
                    imagePath = path.join(process.cwd(), 'public', 'products', fileName);
                }

                // Also try with image_name if available
                if (image.image_name) {
                    const imageNamePath = path.join(process.cwd(), 'public', 'products', image.image_name);
                    if (fs.existsSync(imageNamePath)) {
                        const deleted = deleteFileFromServer(imageNamePath);
                        if (deleted) {
                            console.log(`✓ Deleted image file: ${image.image_name}`);
                        }
                    }
                }

                // Delete using image_url path
                if (fs.existsSync(imagePath)) {
                    const deleted = deleteFileFromServer(imagePath);
                    if (deleted) {
                        console.log(`✓ Deleted image file: ${path.basename(imagePath)}`);
                    }
                } else {
                    console.log(`⚠ Image file not found: ${imagePath}`);
                }
            }
        }

        // Only delete from database if connection is not provided (single delete)
        // If connection is provided, database deletion is handled by caller (bulk delete)
        if (!connection) {
            await db.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
        }

    } catch (error) {
        console.error(`❌ Error deleting images for product ${productId}:`, error);
    }
};

// Helper function to delete product certificates
const deleteProductCertificates = async (productId) => {
    try {
        const [certificates] = await db.execute(
            'SELECT certificate_url FROM product_certificates WHERE product_id = ?',
            [productId]
        );

        for (const certificate of certificates) {
            if (certificate.certificate_url) {
                const certPath = path.join(__dirname, '..', 'public', certificate.certificate_url.replace('/uploads/', ''));
                deleteFileFromServer(certPath);
            }
        }

        await db.execute('DELETE FROM product_certificates WHERE product_id = ?', [productId]);

    } catch (error) {
        console.error(`❌ Error deleting certificates for product ${productId}:`, error);
    }
};

// Helper function to delete product videos
const deleteProductVideos = async (productId) => {
    try {
        const [videos] = await db.execute(
            'SELECT video_url FROM product_videos WHERE product_id = ?',
            [productId]
        );

        for (const video of videos) {
            if (video.video_url) {
                const videoPath = path.join(__dirname, '..', 'public', video.video_url.replace('/uploads/', ''));
                deleteFileFromServer(videoPath);
            }
        }

        await db.execute('DELETE FROM product_videos WHERE product_id = ?', [productId]);

    } catch (error) {
        console.error(`❌ Error deleting videos for product ${productId}:`, error);
    }
};

// Helper function to process video with Sharp (thumbnail + metadata)
const processVideo = async (videoPath) => {
    try {
        const fileStats = fs.statSync(videoPath);
        const originalSize = fileStats.size;

        // Check if video needs processing (file size > 50MB)
        if (originalSize <= 50 * 1024 * 1024) {
            return {
                processed: false,
                originalSize,
                finalSize: originalSize,
                thumbnailCreated: false
            };
        }


        // Create compressed thumbnail from video
        const thumbnailPath = videoPath.replace(path.extname(videoPath), '_thumb.jpg');
        let thumbnailCreated = false;

        try {
            // Extract first frame as thumbnail
            await sharp(videoPath, { pages: -1 })
                .jpeg({ quality: 80, progressive: true })
                .toBuffer();

            thumbnailCreated = true;
        } catch (thumbError) {
        }

        // For full video compression, ffmpeg would be needed
        // For now, we'll just log the info

        return {
            processed: true,
            originalSize,
            finalSize: originalSize,
            thumbnailCreated,
            thumbnailPath: thumbnailCreated ? thumbnailPath : null
        };
    } catch (error) {
        console.error(`❌ Error processing video ${videoPath}:`, error);
        return {
            processed: false,
            originalSize: 0,
            finalSize: 0,
            error: error.message,
            thumbnailCreated: false
        };
    }
};

// =======================================
// UTILITY FUNCTIONS
// =======================================

// Generate unique tag number (accepts connection parameter for transaction support)
const generateUniqueTagNumber = async (connection = null) => {
    try {
        // Get the current year
        const currentYear = new Date().getFullYear().toString().slice(-2); // Last 2 digits

        // Use provided connection or db connection
        const dbConnection = connection || db;

        // Get the latest tag number for this year
        const [latestTags] = await dbConnection.execute(
            'SELECT tag_number FROM products WHERE tag_number LIKE ? ORDER BY tag_number DESC LIMIT 1',
            [`TAG${currentYear}%`]
        );

        let nextNumber = 1;

        if (latestTags.length > 0) {
            const latestTag = latestTags[0].tag_number;
            // Extract the number part from the latest tag (e.g., "TAG241234" -> "1234")
            const numberPart = latestTag.replace(`TAG${currentYear}`, '');
            nextNumber = parseInt(numberPart) + 1;
        }

        // Format: TAG + Year + 4-digit sequential number
        const tagNumber = `TAG${currentYear}${nextNumber.toString().padStart(4, '0')}`;

        return tagNumber;
    } catch (error) {
        console.error('Error generating unique tag number:', error);
        // Fallback: generate based on timestamp
        const timestamp = Date.now().toString().slice(-6);
        const currentYear = new Date().getFullYear().toString().slice(-2);
        return `TAG${currentYear}${timestamp}`;
    }
};

// Generate slug from title/name
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Generate unique slug by checking database
const generateUniqueSlug = async (title, excludeId = null) => {
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        let query = 'SELECT id FROM products WHERE slug = ?';
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

// Update existing products without slugs
const updateExistingProductSlugs = async (req, res) => {
    try {
        // Get all products without slugs
        const [productsWithoutSlugs] = await db.execute(
            'SELECT id, name FROM products WHERE slug IS NULL OR slug = ""'
        );

        if (productsWithoutSlugs.length === 0) {
            return res.json({
                success: true,
                message: 'All products already have slugs',
                updated_count: 0
            });
        }

        let updatedCount = 0;
        const errors = [];

        for (const product of productsWithoutSlugs) {
            try {
                const slug = await generateUniqueSlug(product.name, product.id);

                await db.execute(
                    'UPDATE products SET slug = ? WHERE id = ?',
                    [slug, product.id]
                );

                updatedCount++;

            } catch (error) {
                errors.push({
                    product_id: product.id,
                    product_name: product.name,
                    error: error.message
                });
                console.error(`Error updating product ${product.id}:`, error);
            }
        }

        res.json({
            success: true,
            message: `Updated ${updatedCount} products with slugs`,
            updated_count: updatedCount,
            total_products: productsWithoutSlugs.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error updating existing product slugs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'public/products/';

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with product ID if available
        const productId = req.params.product_id || 'temp';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const extension = path.extname(file.originalname);
        const uniqueName = `product_${productId}_${timestamp}_${random}${extension}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000 * 1024 * 1024 // 1000MB (1GB) limit for images
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Multer configuration for video uploads
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'public/products/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with product ID if available
        const productId = req.params.product_id || 'temp';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const extension = path.extname(file.originalname);
        const uniqueName = `video_${productId}_${timestamp}_${random}${extension}`;
        cb(null, uniqueName);
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: {
        fileSize: 1000 * 1024 * 1024 // 1000MB (1GB) limit for videos
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.startsWith('video/');
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'));
        }
    }
});

// Multer configuration for review image uploads
const reviewStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'public/reviews/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const extension = path.extname(file.originalname);
        const uniqueName = `review_${timestamp}_${random}${extension}`;
        cb(null, uniqueName);
    }
});

const reviewUpload = multer({
    storage: reviewStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for reviews!'));
        }
    }
});

// =======================================
// PRODUCT CRUD OPERATIONS
// =======================================

// Get all products with pagination and filters
const getAllProducts = async (req, res) => {
    try {
        const {
            search = '',
            category_id,
            subcategory_id,
            sub_subcategory_id,
            metal_id,
            status = 'active',
            design_type,
            manufacturing,
            customizable,
            engraving,
            hallmark,
            min_price,
            max_price,
            min_weight,
            max_weight,
            sort_by = 'created_at',
            sort_order = 'DESC',
            limit
        } = req.query;
        let whereClause = 'WHERE p.status = ?';
        let params = [status];

        if (search) {
            whereClause += ' AND (p.item_name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.tag_number LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (category_id) {
            whereClause += ' AND p.category_id = ?';
            params.push(category_id);
        }

        if (subcategory_id) {
            whereClause += ' AND p.subcategory_id = ?';
            params.push(subcategory_id);
        }

        if (sub_subcategory_id) {
            whereClause += ' AND p.sub_subcategory_id = ?';
            params.push(sub_subcategory_id);
        }

        // Metal type filtering is now handled through products.metal_id
        if (metal_id) {
            whereClause += ' AND p.metal_id = ?';
            params.push(metal_id);
        }

        // Add new filter conditions
        if (design_type) {
            whereClause += ' AND p.design_type = ?';
            params.push(design_type);
        }

        if (manufacturing) {
            whereClause += ' AND p.manufacturing = ?';
            params.push(manufacturing);
        }

        if (customizable !== undefined && customizable !== '') {
            whereClause += ' AND p.customizable = ?';
            params.push(customizable === 'true');
        }

        if (engraving !== undefined && engraving !== '') {
            whereClause += ' AND p.engraving = ?';
            params.push(engraving === 'true');
        }

        if (hallmark !== undefined && hallmark !== '') {
            whereClause += ' AND p.hallmark = ?';
            params.push(hallmark === 'true');
        }

        if (min_price) {
            whereClause += ' AND p.total_rs >= ?';
            params.push(parseFloat(min_price));
        }

        if (max_price) {
            whereClause += ' AND p.total_rs <= ?';
            params.push(parseFloat(max_price));
        }

        if (min_weight) {
            whereClause += ' AND p.gross_weight >= ?';
            params.push(parseFloat(min_weight));
        }

        if (max_weight) {
            whereClause += ' AND p.gross_weight <= ?';
            params.push(parseFloat(max_weight));
        }

        // Add limit if specified
        const limitClause = limit ? `LIMIT ${parseInt(limit)}` : '';

        // Map sort_by to correct column names (products table uses item_name not name)
        const sortByMapping = {
            'name': 'item_name',
            'item_name': 'item_name',
            'created_at': 'created_at',
            'updated_at': 'updated_at',
            'total_rs': 'total_rs',
            'gross_weight': 'gross_weight'
        };
        const mappedSortBy = sortByMapping[sort_by] || sort_by;

        const query = `
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT pi.image_url) as images,
        c.name as category_name,
        sc.name as subcategory_name,
        ssc.name as sub_subcategory_name,
        COUNT(DISTINCT pr.id) as review_count,
        AVG(pr.rating) as average_rating
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN sub_subcategories ssc ON p.sub_subcategory_id = ssc.id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id
      LEFT JOIN product_options po ON p.id = po.product_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${db.escapeId(mappedSortBy)} ${sort_order === 'DESC' ? 'DESC' : 'ASC'}
      ${limitClause}
    `;

        const [products] = await db.execute(query, params);

        // Fetch all related data for the listed products
        const productIds = products.map(p => p.id);
        let allOptions = [];
        let allFeatures = [];
        let allLessWeight = [];
        let allSpecs = [];
        let allPriceBreakups = [];

        if (productIds.length > 0) {
            // Product options
            const [options] = await db.execute(
                `SELECT * FROM product_options WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
                productIds
            );
            allOptions = options;

            // Product features
            const [features] = await db.execute(
                `SELECT * FROM product_features WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
                productIds
            );
            allFeatures = features;

            // Product less weight items
            const [lessWeight] = await db.execute(
                `SELECT * FROM product_less_weight WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
                productIds
            );
            allLessWeight = lessWeight;

            // Specifications are now part of the products table
            allSpecs = [];
            // Price breakup functionality removed
            allPriceBreakups = [];
        }

        // Map data to their products
        const optionsByProduct = {};
        allOptions.forEach(opt => {
            if (!optionsByProduct[opt.product_id]) optionsByProduct[opt.product_id] = [];
            optionsByProduct[opt.product_id].push(opt);
        });

        const featuresByProduct = {};
        allFeatures.forEach(feature => {
            if (!featuresByProduct[feature.product_id]) featuresByProduct[feature.product_id] = [];
            featuresByProduct[feature.product_id].push(feature);
        });

        const lessWeightByProduct = {};
        allLessWeight.forEach(item => {
            if (!lessWeightByProduct[item.product_id]) lessWeightByProduct[item.product_id] = [];
            lessWeightByProduct[item.product_id].push(item);
        });
        // Specifications are now part of the products table

        // Process products to format images and categories, and attach related data
        const formattedProducts = products.map(product => {
            const options = optionsByProduct[product.id] || [];
            const features = featuresByProduct[product.id] || [];
            const lessWeightItems = lessWeightByProduct[product.id] || [];
            const total_quantity = options.reduce((sum, opt) => sum + (parseInt(opt.quantity) || 0), 0);

            return {
                ...product,
                images: product.images ? product.images.split(',') : [],
                categories: product.category_name ? [product.category_name] : [],
                subcategories: product.subcategory_name ? [product.subcategory_name] : [],
                sub_subcategories: product.sub_subcategory_name ? [product.sub_subcategory_name] : [],
                average_rating: parseFloat(product.average_rating || 0).toFixed(1),
                total_quantity,
                product_options: options,
                product_features: features,
                product_less_weight: lessWeightItems
                // Specifications are now part of the products table
            };
        });

        res.json({
            success: true,
            data: formattedProducts
        });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single product with all details
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get product details
        const [products] = await db.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = products[0];

        // Get product options
        const [productOptions] = await db.execute(
            'SELECT * FROM product_options WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Get product images
        const [productImages] = await db.execute(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, is_thumbnail DESC',
            [id]
        );

        // Get product categories (direct from products table)
        const [productCategories] = await db.execute(`
            SELECT c.id, c.name, c.slug, c.description, c.image_url
            FROM categories c
            WHERE c.id = ?
        `, [product.category_id]);

        // Get product subcategories (direct from products table)
        const [productSubcategories] = await db.execute(`
            SELECT sc.id, sc.name, sc.slug, sc.description, sc.image_url
            FROM subcategories sc
            WHERE sc.id = ?
        `, [product.subcategory_id]);

        // Get product sub-subcategories (direct from products table)
        const [productSubSubcategories] = await db.execute(`
            SELECT ssc.id, ssc.name, ssc.slug, ssc.description
            FROM sub_subcategories ssc
            WHERE ssc.id = ?
        `, [product.sub_subcategory_id]);

        // Get product less weight items
        const [productLessWeight] = await db.execute(
            'SELECT * FROM product_less_weight WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Get product certificates
        const [productCertificates] = await db.execute(
            'SELECT * FROM product_certificates WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Get product videos
        const [productVideos] = await db.execute(
            'SELECT * FROM product_videos WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        const [productFeatures] = await db.execute(
            'SELECT id, product_id, feature_points, created_at, updated_at FROM product_features WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Get wishlist users
        const [wishlistUsers] = await db.execute(`
            SELECT u.id, u.name, u.email, wi.added_at
            FROM wishlist_items wi
            JOIN user u ON wi.user_id = u.id
            WHERE wi.product_id = ?
            ORDER BY wi.added_at DESC
        `, [id]);

        // Helper function to remove null/undefined values from objects
        const removeNullValues = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            const cleaned = {};
            Object.keys(obj).forEach(key => {
                if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                    cleaned[key] = obj[key];
                }
            });
            return cleaned;
        };

        // Transform product features to match frontend format
        // feature_points is stored as text in the database, map it to feature_title for frontend
        const transformedFeatures = productFeatures.map(feature => {
            return {
                feature_title: feature.feature_points || '',
                feature_description: '' // feature_description column doesn't exist in product_features table
            };
        });

        // Format the response with all details
        const formattedProduct = {
            ...removeNullValues(product),
            product_options: productOptions.length > 0 ? productOptions : undefined,
            product_images: productImages.length > 0 ? productImages : undefined,
            product_certificates: productCertificates.length > 0 ? productCertificates : undefined,
            product_videos: productVideos.length > 0 ? productVideos : undefined,
            product_less_weight: productLessWeight.length > 0 ? productLessWeight : undefined,
            features: transformedFeatures.length > 0 ? transformedFeatures : undefined,
            categories: productCategories.length > 0 ? productCategories[0] : undefined,
            subcategories: productSubcategories.length > 0 ? productSubcategories[0] : undefined,
            sub_subcategories: productSubSubcategories.length > 0 ? productSubSubcategories[0] : undefined,
            wishlist_users: wishlistUsers.length > 0 ? wishlistUsers : undefined
        };

        res.json({
            success: true,
            data: formattedProduct
        });
    } catch (error) {
        console.error('Error getting product by ID:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single product by slug with all details
const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        // Get product basic info
        const [products] = await db.execute(
            'SELECT * FROM products WHERE slug = ? AND status = "active"',
            [slug]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = products[0];
        const id = product.id;

        // Get product images
        const [images] = await db.execute(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
            [id]
        );

        // Specifications are now part of the products table

        // Get product options (new unified table)
        const [productOptions] = await db.execute(
            'SELECT * FROM product_options WHERE product_id = ? ORDER BY id',
            [id]
        );

        // Price breakup functionality removed

        // Get categories, subcategories, and sub-subcategories (direct from products table)
        const [productCategories] = await db.execute(`
            SELECT c.id, c.name, c.slug, c.description, c.image_url, c.status
            FROM categories c
            WHERE c.id = ?
        `, [product.category_id]);

        const [productSubcategories] = await db.execute(`
            SELECT sc.id, sc.name, sc.slug, sc.description, sc.image_url, sc.status
            FROM subcategories sc
            WHERE sc.id = ?
        `, [product.subcategory_id]);

        const [productSubSubcategories] = await db.execute(`
            SELECT ssc.id, ssc.name, ssc.slug, ssc.description, ssc.status
            FROM sub_subcategories ssc
            WHERE ssc.id = ?
        `, [product.sub_subcategory_id]);

        // Get reviews
        const [reviews] = await db.execute(`
      SELECT pr.*, u.name as user_name, u.photo as user_photo
      FROM product_reviews pr
      LEFT JOIN user u ON pr.user_id = u.id
      WHERE pr.product_id = ?
      ORDER BY pr.created_at DESC
    `, [id]);

        // Get product certificates
        const [productCertificates] = await db.execute(
            'SELECT * FROM product_certificates WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Get product videos
        const [productVideos] = await db.execute(
            'SELECT * FROM product_videos WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Get product less weight items
        const [productLessWeight] = await db.execute(
            'SELECT * FROM product_less_weight WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Get product features
        // According to product_features table: id, product_id, feature_points (text), created_at, updated_at
        const [productFeatures] = await db.execute(
            'SELECT id, product_id, feature_points, created_at, updated_at FROM product_features WHERE product_id = ? ORDER BY id ASC',
            [id]
        );

        // Helper function to remove null/undefined values from objects
        const removeNullValues = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            const cleaned = {};
            Object.keys(obj).forEach(key => {
                if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                    cleaned[key] = obj[key];
                }
            });
            return cleaned;
        };

        // Transform product features to match frontend format
        // feature_points is stored as text in the database, map it to feature_title for frontend
        const transformedFeatures = productFeatures.map(feature => {
            return {
                feature_title: feature.feature_points || '',
                feature_description: '' // feature_description column doesn't exist in product_features table
            };
        });

        const productData = {
            ...removeNullValues(product),
            images: images.length > 0 ? images : undefined,
            product_options: productOptions.length > 0 ? productOptions : undefined,
            product_certificates: productCertificates.length > 0 ? productCertificates : undefined,
            product_videos: productVideos.length > 0 ? productVideos : undefined,
            product_less_weight: productLessWeight.length > 0 ? productLessWeight : undefined,
            features: transformedFeatures.length > 0 ? transformedFeatures : undefined,
            categories: productCategories.length > 0 ? productCategories[0] : undefined,
            subcategories: productSubcategories.length > 0 ? productSubcategories[0] : undefined,
            sub_subcategories: productSubSubcategories.length > 0 ? productSubSubcategories[0] : undefined,
            reviews: reviews.length > 0 ? reviews : undefined
        };

        res.json({ success: true, data: productData });
    } catch (error) {
        console.error('Error getting product by slug:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new product
// Generate unique SKU function with retry mechanism
const generateUniqueSKU = async (name) => {
    const maxRetries = 10;
    let attempts = 0;

    while (attempts < maxRetries) {
        const prefix = name ? name.substring(0, 3).toUpperCase() : 'PRD';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const sku = `${prefix}-${timestamp}-${random}`;

        // Check if this SKU already exists
        const [existingSku] = await db.execute(
            'SELECT id FROM products WHERE sku = ?',
            [sku]
        );

        if (existingSku.length === 0) {
            return sku; // SKU is unique, return it
        }

        attempts++;
        // Wait a bit before retrying to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    // If we've exhausted all retries, throw an error
    throw new Error('Unable to generate unique SKU after maximum retries');
};

// Legacy SKU generation function (for backward compatibility)
const generateSKU = (name) => {
    const prefix = name ? name.substring(0, 3).toUpperCase() : 'PRD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
};

const toNull = v => v === undefined ? null : v;

// Utility to clean/sanitize values before DB insert
function sanitize(value, type = 'string') {
    if (value === undefined || value === null) {
        return type === 'number' ? 0 : '';
    }
    return value;
}

const createProduct = async (req, res) => {

    let transactionStarted = false;
    try {
        // Extract fields
        const {
            name, sku, tag_number, description, status,
            batch, item_name, stamp, remark, unit, pieces,
            gross_weight, less_weight, net_weight, additional_weight,
            tunch, wastage_percentage, rate, diamond_weight, stone_weight,
            diamond_value, labour, labour_on, other, total_fine_weight, total_rs,
            design_type, customizable, engraving, hallmark, certificate_number,
            category_id, subcategory_id, sub_subcategory_id,
            product_options, product_less_weight
        } = req.body;

        // Utility sanitize
        function sanitize(val) {
            if (val === undefined || val === null) return (typeof val === 'number') ? 0 : '';
            return val;
        }

        // Validation
        const errors = [];
        if (!sanitize(item_name)) errors.push('Product name is required');
        if (!sanitize(sku)) errors.push('SKU is required');
        if (!sanitize(tag_number)) errors.push('Tag number is required');
        if (!category_id) errors.push('Category is required');
        if (gross_weight === undefined || gross_weight === null) errors.push('Gross weight is required');
        if (rate === undefined || rate === null) errors.push('Rate is required');

        // Check for duplicate SKU
        if (sanitize(sku)) {
            const [existingSku] = await db.execute(
                'SELECT id FROM products WHERE sku = ?',
                [sanitize(sku)]
            );
            if (existingSku.length > 0) {
                errors.push(`SKU '${sanitize(sku)}' already exists. Please use a different SKU.`);
            }
        }

        // Check for duplicate tag number
        if (sanitize(tag_number)) {
            const [existingTag] = await db.execute(
                'SELECT id FROM products WHERE tag_number = ?',
                [sanitize(tag_number)]
            );
            if (existingTag.length > 0) {
                errors.push(`Tag number '${sanitize(tag_number)}' already exists. Please use a different tag number.`);
            }
        }

        // Validate diamond and stone weight calculations from less weight data
        if (product_less_weight && Array.isArray(product_less_weight)) {
            // Calculate diamond weight from less weight items
            const calculatedDiamondWeight = product_less_weight.reduce((total, item) => {
                const itemName = (item.item || '').toLowerCase();
                const diamondKeywords = [
                    // Diamond types and cuts - using exact matches to avoid conflicts
                    'diamond', 'solitaire', 'brilliant', 'princess', 'round diamond', 'pear diamond', 'marquise diamond', 'asscher diamond', 'radiant diamond', 'cushion diamond',
                    'baguette diamond', 'emerald cut diamond', 'oval cut diamond', 'heart diamond', 'trillion diamond', 'briolette diamond', 'rose cut diamond', 'old mine cut diamond', 'old european cut diamond',
                    'single cut diamond', 'full cut diamond', 'step cut diamond', 'mixed cut diamond', 'fancy cut diamond', 'modified brilliant diamond', 'modified step diamond',
                    // Diamond clarity and color terms
                    'vvs', 'vs', 'si', 'i', 'fl', 'if', 'vvs1', 'vvs2', 'vs1', 'vs2', 'si1', 'si2', 'i1', 'i2', 'i3',
                    'd color', 'e color', 'f color', 'g color', 'h color', 'i color', 'j color', 'k color', 'l color', 'm color',
                    'fancy yellow', 'fancy pink', 'fancy blue', 'fancy green', 'fancy brown', 'fancy orange', 'fancy purple', 'fancy red',
                    // Diamond trade names
                    'kohinoor', 'hope diamond', 'cullinan', 'regent diamond', 'orlov', 'shah diamond', 'great mogul',
                    // Synthetic and treated diamonds
                    'lab grown diamond', 'synthetic diamond', 'hpht diamond', 'cvd diamond', 'treated diamond'
                ];

                // Check for exact matches first, then partial matches for specific terms
                const exactMatch = diamondKeywords.some(keyword => itemName === keyword);
                const partialMatch = diamondKeywords.some(keyword =>
                    keyword.includes('diamond') && itemName.includes(keyword.replace(' diamond', ''))
                );

                const isDiamond = exactMatch || partialMatch;

                if (!isDiamond) return total;

                const weight = parseFloat(item.weight) || 0;
                const units = item.units || 'carat';

                // Convert to carats
                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5;
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05;
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5;
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000;
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91; // Updated to match frontend
                        break;
                    default:
                        weightInCarats = weight;
                }

                return total + weightInCarats;
            }, 0);

            // Calculate stone weight from less weight items
            const calculatedStoneWeight = product_less_weight.reduce((total, item) => {
                const itemName = (item.item || '').toLowerCase();
                const stoneKeywords = ['ruby', 'emerald', 'sapphire', 'pearl', 'opal', 'garnet', 'amethyst', 'topaz', 'aquamarine', 'citrine', 'peridot', 'tanzanite', 'tourmaline', 'zircon', 'spinel', 'alexandrite', 'moonstone', 'labradorite', 'onyx', 'jade', 'coral', 'turquoise', 'lapis', 'malachite', 'agate', 'jasper', 'carnelian', 'tiger eye', 'obsidian', 'hematite', 'pyrite', 'quartz', 'crystal'];
                const isStone = stoneKeywords.some(keyword => itemName.includes(keyword));

                if (!isStone) return total;

                const weight = parseFloat(item.weight) || 0;
                const units = item.units || 'carat';

                // Convert to carats
                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5;
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05;
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5;
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000;
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91; // Updated to match frontend
                        break;
                    default:
                        weightInCarats = weight;
                }

                return total + weightInCarats;
            }, 0);

            // Validate diamond weight with more tolerance
            const formDiamondWeight = parseFloat(diamond_weight) || 0;
            if (Math.abs(calculatedDiamondWeight - formDiamondWeight) > 0.1) { // Increased tolerance
                errors.push(`Diamond weight calculation mismatch. Calculated: ${calculatedDiamondWeight.toFixed(3)} carats, Form: ${formDiamondWeight.toFixed(3)} carats`);
            }

            // Validate stone weight with more tolerance
            const formStoneWeight = parseFloat(stone_weight) || 0;
            if (Math.abs(calculatedStoneWeight - formStoneWeight) > 0.1) { // Increased tolerance
                errors.push(`Stone weight calculation mismatch. Calculated: ${calculatedStoneWeight.toFixed(3)} carats, Form: ${formStoneWeight.toFixed(3)} carats`);
            }

            // Validate diamond value with more tolerance
            const calculatedDiamondValue = product_less_weight.reduce((sum, item) => {
                const itemName = (item.item || '').toLowerCase();
                const diamondKeywords = [
                    // Diamond types and cuts - using exact matches to avoid conflicts
                    'diamond', 'solitaire', 'brilliant', 'princess', 'round diamond', 'pear diamond', 'marquise diamond', 'asscher diamond', 'radiant diamond', 'cushion diamond',
                    'baguette diamond', 'emerald cut diamond', 'oval cut diamond', 'heart diamond', 'trillion diamond', 'briolette diamond', 'rose cut diamond', 'old mine cut diamond', 'old european cut diamond',
                    'single cut diamond', 'full cut diamond', 'step cut diamond', 'mixed cut diamond', 'fancy cut diamond', 'modified brilliant diamond', 'modified step diamond',
                    // Diamond clarity and color terms
                    'vvs', 'vs', 'si', 'i', 'fl', 'if', 'vvs1', 'vvs2', 'vs1', 'vs2', 'si1', 'si2', 'i1', 'i2', 'i3',
                    'd color', 'e color', 'f color', 'g color', 'h color', 'i color', 'j color', 'k color', 'l color', 'm color',
                    'fancy yellow', 'fancy pink', 'fancy blue', 'fancy green', 'fancy brown', 'fancy orange', 'fancy purple', 'fancy red',
                    // Diamond trade names
                    'kohinoor', 'hope diamond', 'cullinan', 'regent diamond', 'orlov', 'shah diamond', 'great mogul',
                    // Synthetic and treated diamonds
                    'lab grown diamond', 'synthetic diamond', 'hpht diamond', 'cvd diamond', 'treated diamond'
                ];

                // Check for exact matches first, then partial matches for specific terms
                const exactMatch = diamondKeywords.some(keyword => itemName === keyword);
                const partialMatch = diamondKeywords.some(keyword =>
                    keyword.includes('diamond') && itemName.includes(keyword.replace(' diamond', ''))
                );

                const isDiamond = exactMatch || partialMatch;

                if (!isDiamond) return sum;
                // Use sale_value which is the total for all pieces (total_sale_rate)
                return sum + (parseFloat(item.sale_value) || 0);
            }, 0);

            const formDiamondValue = parseFloat(diamond_value) || 0;
            if (Math.abs(calculatedDiamondValue - formDiamondValue) > 50) { // Increased tolerance
                errors.push(`Diamond value calculation mismatch. Calculated: ₹${calculatedDiamondValue.toFixed(2)}, Form: ₹${formDiamondValue.toFixed(2)}`);
            }
        }

        // If errors, do not start transaction—return error
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Start transaction
        await db.query('START TRANSACTION');
        transactionStarted = true;

        // Generate unique slug from product name
        const slug = await generateUniqueSlug(sanitize(item_name), null);

        // Prepare productData
        const productData = {
            sku: sanitize(sku), tag_number: sanitize(tag_number), slug: slug,
            description: sanitize(description), status: sanitize(status) || 'active',
            batch: sanitize(batch), item_name: sanitize(item_name),
            stamp: sanitize(stamp), remark: sanitize(remark), unit: sanitize(unit),
            pieces: pieces !== undefined && pieces !== null ? parseInt(pieces) : 1,
            gross_weight: gross_weight !== undefined && gross_weight !== null ? parseFloat(gross_weight) : 0,
            less_weight: less_weight !== undefined && less_weight !== null ? parseFloat(less_weight) : 0,
            net_weight: net_weight !== undefined && net_weight !== null ? parseFloat(net_weight) : 0,
            additional_weight: additional_weight !== undefined && additional_weight !== null ? parseFloat(additional_weight) : 0,
            tunch: tunch !== undefined && tunch !== null ? parseFloat(tunch) : 0,
            wastage_percentage: wastage_percentage !== undefined && wastage_percentage !== null ? parseFloat(wastage_percentage) : 0,
            rate: rate !== undefined && rate !== null ? parseFloat(rate) : 0,
            diamond_weight: diamond_weight !== undefined && diamond_weight !== null ? parseFloat(diamond_weight) : 0,
            stone_weight: stone_weight !== undefined && stone_weight !== null ? parseFloat(stone_weight) : 0,
            diamond_value: diamond_value !== undefined && diamond_value !== null ? parseFloat(diamond_value) : 0,
            labour: labour !== undefined && labour !== null ? parseFloat(labour) : 0,
            labour_on: sanitize(labour_on),
            other: other !== undefined && other !== null ? parseFloat(other) : 0,
            total_fine_weight: total_fine_weight !== undefined && total_fine_weight !== null ? parseFloat(total_fine_weight) : 0,
            total_rs: total_rs !== undefined && total_rs !== null ? parseFloat(total_rs) : 0,
            design_type: sanitize(design_type),
            customizable: !!customizable,
            engraving: !!engraving,
            hallmark: !!hallmark,
            certificate_number: sanitize(certificate_number) || null,
            category_id: category_id ? parseInt(category_id) : null,
            subcategory_id: subcategory_id ? parseInt(subcategory_id) : null,
            sub_subcategory_id: sub_subcategory_id ? parseInt(sub_subcategory_id) : null,
            metal_id: req.body.metal_id ? parseInt(req.body.metal_id) : null,
            metal_purity_id: req.body.metal_purity_id ? parseInt(req.body.metal_purity_id) : null
        };

        // Insert product
        const columns = [
            'sku', 'tag_number', 'slug', 'description', 'status', 'batch', 'item_name', 'stamp', 'remark', 'unit', 'pieces', 'gross_weight', 'less_weight', 'net_weight',
            'additional_weight', 'tunch', 'wastage_percentage', 'rate', 'diamond_weight', 'stone_weight', 'labour', 'labour_on', 'other', 'total_fine_weight', 'total_rs',
            'design_type', 'customizable', 'engraving', 'hallmark', 'certificate_number', 'category_id', 'subcategory_id', 'sub_subcategory_id', 'metal_id', 'metal_purity_id'
        ];
        const values = columns.map(col => {
            if (productData[col] !== undefined) {
                // For certificate_number, convert empty string to null
                if (col === 'certificate_number' && productData[col] === '') {
                    return null;
                }
                return productData[col];
            }
            // For number types, return 0; for string types, return empty string; for nullable fields like certificate_number, return null
            if (typeof productData[col] === 'number') {
                return 0;
            }
            if (col === 'certificate_number') {
                return null;
            }
            return '';
        });

        const [productResult] = await db.execute(
            `INSERT INTO products (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values
        );
        const productId = productResult.insertId;

        // Insert product_options
        if (product_options && Array.isArray(product_options)) {
            for (const option of product_options) {
                await db.execute(
                    `INSERT INTO product_options (product_id, size, weight, dimensions, metal_color, gender, occasion, value, sell_price)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        productId,
                        sanitize(option.size),
                        option.weight !== undefined && option.weight !== null ? option.weight : 0,
                        sanitize(option.dimensions),
                        sanitize(option.metal_color),
                        sanitize(option.gender),
                        sanitize(option.occasion),
                        option.value !== undefined && option.value !== null ? option.value : 0,
                        option.sell_price !== undefined && option.sell_price !== null ? option.sell_price : 0
                    ]
                );
            }
        }

        // Insert product_less_weight
        if (product_less_weight && Array.isArray(product_less_weight)) {
            for (const item of product_less_weight) {
                await db.execute(
                    `INSERT INTO product_less_weight (product_id, item, stamp, clarity, color, cuts, shapes, remarks, pieces, weight, units, tunch, purchase_rate, sale_rate, total_profit, purchase_value, sale_value)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        productId,
                        sanitize(item.item),
                        sanitize(item.stamp),
                        sanitize(item.clarity),
                        sanitize(item.color),
                        sanitize(item.cuts),
                        sanitize(item.shapes),
                        sanitize(item.remarks),
                        item.pieces !== undefined && item.pieces !== null ? item.pieces : 1,
                        item.weight !== undefined && item.weight !== null ? item.weight : 0,
                        sanitize(item.units),
                        item.tunch !== undefined && item.tunch !== null ? item.tunch : 0,
                        item.purchase_rate !== undefined && item.purchase_rate !== null ? item.purchase_rate : 0,
                        item.sale_rate !== undefined && item.sale_rate !== null ? item.sale_rate : 0,
                        item.total_profit !== undefined && item.total_profit !== null ? item.total_profit : 0,
                        item.purchase_value !== undefined && item.purchase_value !== null ? item.purchase_value : 0,
                        item.sale_value !== undefined && item.sale_value !== null ? item.sale_value : 0
                    ]
                );
            }
        }

        // Commit (only if everything succeeded)
        await db.query('COMMIT');
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                id: productId,
                slug: slug
            }
        });

    } catch (error) {
        // If transaction started, rollback to prevent any DB insertions
        if (transactionStarted) {
            try { await db.query('ROLLBACK'); } catch { }
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};


// Update product - Professional implementation matching createProduct structure
const updateProduct = async (req, res) => {
    let transactionStarted = false;
    try {
        const { id } = req.params;

        // Extract fields - EXACTLY same as createProduct
        const {
            name, sku, tag_number, description, status,
            batch, item_name, stamp, remark, unit, pieces,
            gross_weight, less_weight, net_weight, additional_weight,
            tunch, wastage_percentage, rate, diamond_weight, stone_weight,
            labour, labour_on, other, total_fine_weight, total_rs,
            design_type, customizable, engraving, hallmark, certificate_number,
            category_id, subcategory_id, sub_subcategory_id,
            product_options, product_less_weight
        } = req.body;

        // Utility sanitize - EXACTLY same as createProduct
        function sanitize(val) {
            if (val === undefined || val === null) return (typeof val === 'number') ? 0 : '';
            return val;
        }

        // Validation - EXACTLY same as createProduct
        const errors = [];
        if (!sanitize(name)) errors.push('Product name is required');
        if (!sanitize(sku)) errors.push('SKU is required');
        if (!sanitize(tag_number)) errors.push('Tag number is required');
        if (!category_id) errors.push('Category is required');
        if (gross_weight === undefined || gross_weight === null) errors.push('Gross weight is required');
        if (rate === undefined || rate === null) errors.push('Rate is required');

        // Check for duplicate SKU (excluding current product)
        if (sanitize(sku)) {
            const [existingSku] = await db.execute(
                'SELECT id FROM products WHERE sku = ? AND id != ?',
                [sanitize(sku), id]
            );
            if (existingSku.length > 0) {
                errors.push(`SKU '${sanitize(sku)}' already exists. Please use a different SKU.`);
            }
        }

        // Check for duplicate tag number (excluding current product)
        if (sanitize(tag_number)) {
            const [existingTag] = await db.execute(
                'SELECT id FROM products WHERE tag_number = ? AND id != ?',
                [sanitize(tag_number), id]
            );
            if (existingTag.length > 0) {
                errors.push(`Tag number '${sanitize(tag_number)}' already exists. Please use a different tag number.`);
            }
        }

        // Validate diamond and stone weight calculations from less weight data (same as createProduct)
        if (product_less_weight && Array.isArray(product_less_weight)) {
            // Calculate diamond weight from less weight items
            const calculatedDiamondWeight = product_less_weight.reduce((total, item) => {
                const itemName = (item.item || '').toLowerCase();
                const diamondKeywords = [
                    // Diamond types and cuts - using exact matches to avoid conflicts
                    'diamond', 'solitaire', 'brilliant', 'princess', 'round diamond', 'pear diamond', 'marquise diamond', 'asscher diamond', 'radiant diamond', 'cushion diamond',
                    'baguette diamond', 'emerald cut diamond', 'oval cut diamond', 'heart diamond', 'trillion diamond', 'briolette diamond', 'rose cut diamond', 'old mine cut diamond', 'old european cut diamond',
                    'single cut diamond', 'full cut diamond', 'step cut diamond', 'mixed cut diamond', 'fancy cut diamond', 'modified brilliant diamond', 'modified step diamond',
                    // Diamond clarity and color terms
                    'vvs', 'vs', 'si', 'i', 'fl', 'if', 'vvs1', 'vvs2', 'vs1', 'vs2', 'si1', 'si2', 'i1', 'i2', 'i3',
                    'd color', 'e color', 'f color', 'g color', 'h color', 'i color', 'j color', 'k color', 'l color', 'm color',
                    'fancy yellow', 'fancy pink', 'fancy blue', 'fancy green', 'fancy brown', 'fancy orange', 'fancy purple', 'fancy red',
                    // Diamond trade names
                    'kohinoor', 'hope diamond', 'cullinan', 'regent diamond', 'orlov', 'shah diamond', 'great mogul',
                    // Synthetic and treated diamonds
                    'lab grown diamond', 'synthetic diamond', 'hpht diamond', 'cvd diamond', 'treated diamond'
                ];

                // Check for exact matches first, then partial matches for specific terms
                const exactMatch = diamondKeywords.some(keyword => itemName === keyword);
                const partialMatch = diamondKeywords.some(keyword =>
                    keyword.includes('diamond') && itemName.includes(keyword.replace(' diamond', ''))
                );

                const isDiamond = exactMatch || partialMatch;

                if (!isDiamond) return total;

                const weight = parseFloat(item.weight) || 0;
                const units = item.units || 'carat';

                // Convert to carats
                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5;
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05;
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5;
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000;
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91; // Updated to match frontend
                        break;
                    default:
                        weightInCarats = weight;
                }

                return total + weightInCarats;
            }, 0);

            // Calculate stone weight from less weight items
            const calculatedStoneWeight = product_less_weight.reduce((total, item) => {
                const itemName = (item.item || '').toLowerCase();
                const stoneKeywords = ['ruby', 'emerald', 'sapphire', 'pearl', 'opal', 'garnet', 'amethyst', 'topaz', 'aquamarine', 'citrine', 'peridot', 'tanzanite', 'tourmaline', 'zircon', 'spinel', 'alexandrite', 'moonstone', 'labradorite', 'onyx', 'jade', 'coral', 'turquoise', 'lapis', 'malachite', 'agate', 'jasper', 'carnelian', 'tiger eye', 'obsidian', 'hematite', 'pyrite', 'quartz', 'crystal'];
                const isStone = stoneKeywords.some(keyword => itemName.includes(keyword));

                if (!isStone) return total;

                const weight = parseFloat(item.weight) || 0;
                const units = item.units || 'carat';

                // Convert to carats
                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5;
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05;
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5;
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000;
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91; // Updated to match frontend
                        break;
                    default:
                        weightInCarats = weight;
                }

                return total + weightInCarats;
            }, 0);

            // Validate diamond weight with more tolerance
            const formDiamondWeight = parseFloat(diamond_weight) || 0;
            if (Math.abs(calculatedDiamondWeight - formDiamondWeight) > 0.1) { // Increased tolerance
                errors.push(`Diamond weight calculation mismatch. Calculated: ${calculatedDiamondWeight.toFixed(3)} carats, Form: ${formDiamondWeight.toFixed(3)} carats`);
            }

            // Validate stone weight with more tolerance
            const formStoneWeight = parseFloat(stone_weight) || 0;
            if (Math.abs(calculatedStoneWeight - formStoneWeight) > 0.1) { // Increased tolerance
                errors.push(`Stone weight calculation mismatch. Calculated: ${calculatedStoneWeight.toFixed(3)} carats, Form: ${formStoneWeight.toFixed(3)} carats`);
            }

            // Validate diamond value with more tolerance
            const calculatedDiamondValue = product_less_weight.reduce((sum, item) => {
                const itemName = (item.item || '').toLowerCase();
                const diamondKeywords = [
                    // Diamond types and cuts - using exact matches to avoid conflicts
                    'diamond', 'solitaire', 'brilliant', 'princess', 'round diamond', 'pear diamond', 'marquise diamond', 'asscher diamond', 'radiant diamond', 'cushion diamond',
                    'baguette diamond', 'emerald cut diamond', 'oval cut diamond', 'heart diamond', 'trillion diamond', 'briolette diamond', 'rose cut diamond', 'old mine cut diamond', 'old european cut diamond',
                    'single cut diamond', 'full cut diamond', 'step cut diamond', 'mixed cut diamond', 'fancy cut diamond', 'modified brilliant diamond', 'modified step diamond',
                    // Diamond clarity and color terms
                    'vvs', 'vs', 'si', 'i', 'fl', 'if', 'vvs1', 'vvs2', 'vs1', 'vs2', 'si1', 'si2', 'i1', 'i2', 'i3',
                    'd color', 'e color', 'f color', 'g color', 'h color', 'i color', 'j color', 'k color', 'l color', 'm color',
                    'fancy yellow', 'fancy pink', 'fancy blue', 'fancy green', 'fancy brown', 'fancy orange', 'fancy purple', 'fancy red',
                    // Diamond trade names
                    'kohinoor', 'hope diamond', 'cullinan', 'regent diamond', 'orlov', 'shah diamond', 'great mogul',
                    // Synthetic and treated diamonds
                    'lab grown diamond', 'synthetic diamond', 'hpht diamond', 'cvd diamond', 'treated diamond'
                ];

                // Check for exact matches first, then partial matches for specific terms
                const exactMatch = diamondKeywords.some(keyword => itemName === keyword);
                const partialMatch = diamondKeywords.some(keyword =>
                    keyword.includes('diamond') && itemName.includes(keyword.replace(' diamond', ''))
                );

                const isDiamond = exactMatch || partialMatch;

                if (!isDiamond) return sum;
                // Use sale_value which is the total for all pieces (total_sale_rate)
                return sum + (parseFloat(item.sale_value) || 0);
            }, 0);

            const formDiamondValue = parseFloat(diamond_value) || 0;
            if (Math.abs(calculatedDiamondValue - formDiamondValue) > 50) { // Increased tolerance
                errors.push(`Diamond value calculation mismatch. Calculated: ₹${calculatedDiamondValue.toFixed(2)}, Form: ₹${formDiamondValue.toFixed(2)}`);
            }
        }

        // If errors, do not start transaction—return error
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Start transaction
        await db.query('START TRANSACTION');
        transactionStarted = true;

        // Generate unique slug from product name (excluding current product ID)
        const slug = await generateUniqueSlug(sanitize(name), id);

        // Prepare productData - EXACTLY same as createProduct
        const productData = {
            name: sanitize(name), sku: sanitize(sku), tag_number: sanitize(tag_number), slug: slug,
            description: sanitize(description), status: sanitize(status) || 'active',
            batch: sanitize(batch), item_name: sanitize(item_name) || sanitize(name),
            stamp: sanitize(stamp), remark: sanitize(remark), unit: sanitize(unit),
            pieces: pieces !== undefined && pieces !== null ? parseInt(pieces) : 1,
            gross_weight: gross_weight !== undefined && gross_weight !== null ? parseFloat(gross_weight) : 0,
            less_weight: less_weight !== undefined && less_weight !== null ? parseFloat(less_weight) : 0,
            net_weight: net_weight !== undefined && net_weight !== null ? parseFloat(net_weight) : 0,
            additional_weight: additional_weight !== undefined && additional_weight !== null ? parseFloat(additional_weight) : 0,
            tunch: tunch !== undefined && tunch !== null ? parseFloat(tunch) : 0,
            wastage_percentage: wastage_percentage !== undefined && wastage_percentage !== null ? parseFloat(wastage_percentage) : 0,
            rate: rate !== undefined && rate !== null ? parseFloat(rate) : 0,
            diamond_weight: diamond_weight !== undefined && diamond_weight !== null ? parseFloat(diamond_weight) : 0,
            stone_weight: stone_weight !== undefined && stone_weight !== null ? parseFloat(stone_weight) : 0,
            diamond_value: diamond_value !== undefined && diamond_value !== null ? parseFloat(diamond_value) : 0,
            labour: labour !== undefined && labour !== null ? parseFloat(labour) : 0,
            labour_on: sanitize(labour_on),
            other: other !== undefined && other !== null ? parseFloat(other) : 0,
            total_fine_weight: total_fine_weight !== undefined && total_fine_weight !== null ? parseFloat(total_fine_weight) : 0,
            total_rs: total_rs !== undefined && total_rs !== null ? parseFloat(total_rs) : 0,
            design_type: sanitize(design_type),
            customizable: !!customizable,
            engraving: !!engraving,
            hallmark: !!hallmark,
            certificate_number: sanitize(certificate_number) || null,
            category_id: category_id ? parseInt(category_id) : null,
            subcategory_id: subcategory_id ? parseInt(subcategory_id) : null,
            sub_subcategory_id: sub_subcategory_id ? parseInt(sub_subcategory_id) : null,
            metal_id: req.body.metal_id ? parseInt(req.body.metal_id) : null,
            metal_purity_id: req.body.metal_purity_id ? parseInt(req.body.metal_purity_id) : null
        };

        // Update product - EXACTLY same columns as createProduct
        const columns = [
            'sku', 'tag_number', 'slug', 'description', 'status', 'batch', 'item_name', 'stamp', 'remark', 'unit', 'pieces', 'gross_weight', 'less_weight', 'net_weight',
            'additional_weight', 'tunch', 'wastage_percentage', 'rate', 'diamond_weight', 'stone_weight', 'labour', 'labour_on', 'other', 'total_fine_weight', 'total_rs',
            'design_type', 'customizable', 'engraving', 'hallmark', 'certificate_number', 'category_id', 'subcategory_id', 'sub_subcategory_id', 'metal_id', 'metal_purity_id'
        ];
        const values = columns.map(col => {
            if (productData[col] !== undefined) {
                // For certificate_number, convert empty string to null
                if (col === 'certificate_number' && productData[col] === '') {
                    return null;
                }
                return productData[col];
            }
            // For number types, return 0; for string types, return empty string; for nullable fields like certificate_number, return null
            if (typeof productData[col] === 'number') {
                return 0;
            }
            if (col === 'certificate_number') {
                return null;
            }
            return '';
        });

        await db.execute(
            `UPDATE products SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE id = ?`,
            [...values, id]
        );

        // Update product_options - EXACTLY same as createProduct
        if (product_options && Array.isArray(product_options)) {
            // Delete existing options
            await db.execute('DELETE FROM product_options WHERE product_id = ?', [id]);

            // Insert new options
            for (const option of product_options) {
                await db.execute(
                    `INSERT INTO product_options (product_id, size, weight, dimensions, metal_color, gender, occasion, value, sell_price)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        sanitize(option.size),
                        option.weight !== undefined && option.weight !== null ? option.weight : 0,
                        sanitize(option.dimensions),
                        sanitize(option.metal_color),
                        sanitize(option.gender),
                        sanitize(option.occasion),
                        option.value !== undefined && option.value !== null ? option.value : 0,
                        option.sell_price !== undefined && option.sell_price !== null ? option.sell_price : 0
                    ]
                );
            }
        }

        // Update product_less_weight - EXACTLY same as createProduct
        if (product_less_weight && Array.isArray(product_less_weight)) {
            // Delete existing less weight items
            await db.execute('DELETE FROM product_less_weight WHERE product_id = ?', [id]);

            // Insert new less weight items
            for (const item of product_less_weight) {
                await db.execute(
                    `INSERT INTO product_less_weight (product_id, item, stamp, clarity, color, cuts, shapes, remarks, pieces, weight, units, tunch, purchase_rate, sale_rate, total_profit, purchase_value, sale_value)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        sanitize(item.item),
                        sanitize(item.stamp),
                        sanitize(item.clarity),
                        sanitize(item.color),
                        sanitize(item.cuts),
                        sanitize(item.shapes),
                        sanitize(item.remarks),
                        item.pieces !== undefined && item.pieces !== null ? item.pieces : 1,
                        item.weight !== undefined && item.weight !== null ? item.weight : 0,
                        sanitize(item.units),
                        item.tunch !== undefined && item.tunch !== null ? item.tunch : 0,
                        item.purchase_rate !== undefined && item.purchase_rate !== null ? item.purchase_rate : 0,
                        item.sale_rate !== undefined && item.sale_rate !== null ? item.sale_rate : 0,
                        item.total_profit !== undefined && item.total_profit !== null ? item.total_profit : 0,
                        item.purchase_value !== undefined && item.purchase_value !== null ? item.purchase_value : 0,
                        item.sale_value !== undefined && item.sale_value !== null ? item.sale_value : 0
                    ]
                );
            }
        }

        // Commit (only if everything succeeded)
        await db.query('COMMIT');
        transactionStarted = false;

        return res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                id: id,
                slug: slug
            }
        });

    } catch (error) {
        // If transaction started, rollback to prevent any DB updates
        if (transactionStarted) {
            try { await db.query('ROLLBACK'); } catch { }
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    let transactionStarted = false;
    try {
        const { id } = req.params;



        // Start transaction
        await db.query('START TRANSACTION');
        transactionStarted = true;

        // Delete files from server first

        await deleteProductImages(id);
        await deleteProductCertificates(id);
        await deleteProductVideos(id);

        // Delete all related data from database

        await db.execute('DELETE FROM product_less_weight WHERE product_id = ?', [id]);
        await db.execute('DELETE FROM product_options WHERE product_id = ?', [id]);
        await db.execute('DELETE FROM cart_items WHERE product_id = ?', [id]);
        await db.execute('DELETE FROM wishlist_items WHERE product_id = ?', [id]);
        await db.execute('DELETE FROM products WHERE id = ?', [id]);

        await db.query('COMMIT');
        transactionStarted = false;



        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        if (transactionStarted) {
            try {

                await db.query('ROLLBACK');

            } catch (rollbackErr) {
                console.error('❌ Error during ROLLBACK:', rollbackErr);
            }
        }
        console.error('❌ Error deleting product:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// Upload product images
const uploadProductImages = async (req, res) => {
    try {
        const { product_id } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }

        // Check if product exists
        const [productCheck] = await db.execute(
            'SELECT id FROM products WHERE id = ?',
            [product_id]
        );

        if (productCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Process all images in parallel for better performance
        const processImage = async (file, index) => {
            try {
                // Use the filename generated by multer
                const uniqueImageName = file.filename;

                // Create image URL - images go directly to products folder
                let imageUrl = `/products/${uniqueImageName}`;

                // Compress image (resize to 1080px and convert to WebP)
                let dimensions = { width: null, height: null };
                let compressionInfo = null;
                let finalImageName = uniqueImageName;
                let finalMimeType = file.mimetype || 'image/webp';

                const sourcePath = path.join(process.cwd(), 'public', 'products', uniqueImageName);

                // Wait a bit for file to be fully written by multer
                await new Promise(resolve => setTimeout(resolve, 100));

                // Compress image using helper function (resizes to 1080px and converts to WebP)
                compressionInfo = await compressImage(sourcePath, 85);

                // If compression was successful and file was converted to WebP
                if (compressionInfo.compressed && compressionInfo.newPath) {
                    // Update image name and URL to use .webp extension
                    const newFileName = path.basename(compressionInfo.newPath);
                    finalImageName = newFileName;
                    imageUrl = `/products/${newFileName}`;
                    finalMimeType = 'image/webp';

                    // Get dimensions from compression info or from the new file
                    if (compressionInfo.newDimensions) {
                        dimensions = compressionInfo.newDimensions;
                    } else {
                        const imageInfo = await sharp(compressionInfo.newPath).metadata();
                        dimensions = { width: imageInfo.width, height: imageInfo.height };
                    }
                } else {
                    // If compression failed, get dimensions from original file
                    const imageInfo = await sharp(sourcePath).metadata();
                    dimensions = { width: imageInfo.width, height: imageInfo.height };
                }

                // Use compressed file size if available, otherwise use original
                const finalFileSize = compressionInfo && compressionInfo.finalSize ? compressionInfo.finalSize : file.size;

                // Insert into database - no thumbnail creation
                const [result] = await db.execute(
                    `INSERT INTO product_images (
                        product_id, image_name, original_name, image_url, 
                        alt_text, file_size, mime_type, dimensions, is_thumbnail, sort_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        product_id,
                        finalImageName,
                        file.originalname,
                        imageUrl,
                        file.originalname,
                        finalFileSize,
                        finalMimeType,
                        JSON.stringify(dimensions),
                        index === 0, // First image is thumbnail
                        index
                    ]
                );

                return {
                    id: result.insertId,
                    image_name: finalImageName,
                    original_name: file.originalname,
                    image_url: imageUrl,
                    file_size: finalFileSize,
                    mime_type: finalMimeType,
                    dimensions: dimensions,
                    compression_info: compressionInfo
                };
            } catch (error) {
                console.error(`Error processing image ${file.filename}:`, error);
                // Return error info but don't throw - we'll handle it in Promise.allSettled
                return {
                    error: error.message,
                    file: file.originalname
                };
            }
        };

        // Process all images in parallel
        const imagePromises = files.map((file, index) => processImage(file, index));
        const results = await Promise.allSettled(imagePromises);

        // Collect successful uploads and log errors
        const uploadedImages = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && !result.value.error) {
                uploadedImages.push(result.value);
            } else {
                const errorMsg = result.status === 'rejected'
                    ? result.reason?.message || 'Unknown error'
                    : result.value?.error || 'Processing failed';
                console.error(`Failed to process image ${files[index].originalname}:`, errorMsg);
            }
        });

        res.json({
            success: true,
            message: 'Images uploaded successfully',
            data: uploadedImages
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete product image
const deleteProductImage = async (req, res) => {
    try {
        const { image_id } = req.params;



        const [images] = await db.execute(
            'SELECT image_name, image_url FROM product_images WHERE id = ?',
            [image_id]
        );

        if (images.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        const image = images[0];

        // Delete image file from products folder
        if (image.image_url) {
            const imagePath = path.join(__dirname, '..', 'public', image.image_url);
            deleteFileFromServer(imagePath);
        }

        // Delete from database
        await db.execute('DELETE FROM product_images WHERE id = ?', [image_id]);



        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product videos
const getProductVideos = async (req, res) => {
    try {
        const { product_id } = req.params;

        // Get all videos for the product
        const [videos] = await db.execute(
            'SELECT id, video_name, original_name, video_url, file_size, mime_type, created_at, sort_order FROM product_videos WHERE product_id = ? ORDER BY sort_order ASC',
            [product_id]
        );

        res.json({
            success: true,
            message: 'Product videos retrieved successfully',
            data: videos
        });
    } catch (error) {
        console.error('Error getting product videos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Upload product videos
const uploadProductVideos = async (req, res) => {
    try {
        const { product_id } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No videos uploaded' });
        }



        // Process all videos in parallel for better performance
        const processVideoFile = async (file, index) => {
            try {
                // Use the filename generated by multer storage
                const videoName = file.filename;

                // Process video with Sharp (thumbnail + metadata)
                let finalFileSize = file.size;
                let videoProcessingInfo = null;

                const sourcePath = path.join(__dirname, '..', 'public', 'products', videoName);

                // Process video using helper function
                videoProcessingInfo = await processVideo(sourcePath);

                // Update final file size if processing was successful
                if (videoProcessingInfo.processed) {
                    finalFileSize = videoProcessingInfo.finalSize;
                }

                // Insert video record into database
                const [result] = await db.execute(
                    'INSERT INTO product_videos (product_id, video_name, original_name, video_url, file_size, mime_type, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [product_id, videoName, file.originalname, `/products/${videoName}`, finalFileSize, file.mimetype]
                );

                return {
                    id: result.insertId,
                    video_name: videoName,
                    original_name: file.originalname,
                    video_url: `/products/${videoName}`,
                    file_size: finalFileSize,
                    mime_type: file.mimetype,
                    sort_order: index,
                    created_at: new Date().toISOString(),
                    processing_info: videoProcessingInfo
                };
            } catch (error) {
                console.error(`Error processing video ${file.filename}:`, error);
                // Return error info but don't throw - we'll handle it in Promise.allSettled
                return {
                    error: error.message,
                    file: file.originalname
                };
            }
        };

        // Process all videos in parallel
        const videoPromises = req.files.map((file, index) => processVideoFile(file, index));
        const results = await Promise.allSettled(videoPromises);

        // Collect successful uploads and log errors
        const uploadedVideos = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && !result.value.error) {
                uploadedVideos.push(result.value);
            } else {
                const errorMsg = result.status === 'rejected'
                    ? result.reason?.message || 'Unknown error'
                    : result.value?.error || 'Processing failed';
                console.error(`Failed to process video ${req.files[index].originalname}:`, errorMsg);
            }
        });



        res.status(201).json({
            success: true,
            message: 'Videos uploaded successfully',
            data: uploadedVideos
        });
    } catch (error) {
        console.error('Error uploading videos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete product video
const deleteProductVideo = async (req, res) => {
    try {
        const { video_id } = req.params;



        const [videos] = await db.execute(
            'SELECT video_name, video_url FROM product_videos WHERE id = ?',
            [video_id]
        );

        if (videos.length === 0) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        const video = videos[0];

        // Delete video file from products folder
        if (video.video_url) {
            const videoPath = path.join(__dirname, '..', 'public', video.video_url);
            deleteFileFromServer(videoPath);
        }

        // Delete from database
        await db.execute('DELETE FROM product_videos WHERE id = ?', [video_id]);



        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting video:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Generate unique tag number
const generateTagNumber = async (req, res) => {
    try {
        const tagNumber = await generateUniqueTagNumber();
        res.json({
            success: true,
            data: { tag_number: tagNumber }
        });
    } catch (error) {
        console.error('Error generating tag number:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate unique SKU endpoint
const generateSKUEndpoint = async (req, res) => {
    try {
        const { name } = req.query;
        const sku = await generateUniqueSKU(name);
        res.json({
            success: true,
            data: { sku: sku }
        });
    } catch (error) {
        console.error('Error generating SKU:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get product statistics
const getProductStats = async (req, res) => {
    try {
        const [totalProducts] = await db.execute('SELECT COUNT(*) as total FROM products');
        const [activeProducts] = await db.execute('SELECT COUNT(*) as total FROM products WHERE status = "active"');
        const [inactiveProducts] = await db.execute('SELECT COUNT(*) as total FROM products WHERE status = "inactive"');
        const [productsWithImages] = await db.execute('SELECT COUNT(DISTINCT p.id) as total FROM products p JOIN product_images pi ON p.id = pi.product_id');
        const [productsWithoutImages] = await db.execute('SELECT COUNT(*) as total FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id WHERE pi.id IS NULL');

        res.json({
            success: true,
            data: {
                total_products: totalProducts[0].total,
                active_products: activeProducts[0].total,
                inactive_products: inactiveProducts[0].total,
                products_with_images: productsWithImages[0].total,
                products_without_images: productsWithoutImages[0].total
            }
        });
    } catch (error) {
        console.error('Error getting product stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to get category names by IDs
const getCategoryNames = async (categoryId, subcategoryId, subSubcategoryId) => {
    try {
        let category = null, subcategory = null, sub_subcategory = null;

        if (categoryId) {
            const [categoryResult] = await db.execute('SELECT name FROM categories WHERE id = ?', [categoryId]);
            category = categoryResult.length > 0 ? categoryResult[0].name : null;
        }

        if (subcategoryId) {
            const [subcategoryResult] = await db.execute('SELECT name FROM subcategories WHERE id = ?', [subcategoryId]);
            subcategory = subcategoryResult.length > 0 ? subcategoryResult[0].name : null;
        }

        if (subSubcategoryId) {
            const [subSubcategoryResult] = await db.execute('SELECT name FROM sub_subcategories WHERE id = ?', [subSubcategoryId]);
            sub_subcategory = subSubcategoryResult.length > 0 ? subSubcategoryResult[0].name : null;
        }

        return { category, subcategory, sub_subcategory };
    } catch (error) {
        console.error('Error getting category names:', error);
        return { category: null, subcategory: null, sub_subcategory: null };
    }
};

// Enhanced Bulk operations for comprehensive product upload/update based on tag number
// ==========================================
// BULK UPLOAD VALIDATION & CALCULATION FUNCTIONS
// ==========================================

/**
 * Validate required fields for product
 * @param {Object} product - Product data object
 * @param {Number} rowNumber - Row number for error reporting
 * @param {Boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
const validateProductData = (product, rowNumber, isUpdate = false) => {
    const errors = [];

    // Tag number will be auto-generated if not provided, so no error needed here

    // For new products, additional fields are required
    if (!isUpdate) {
        if (!product.item_name || product.item_name.toString().trim() === '') {
            errors.push(`Row ${rowNumber}: Item name is required for new products`);
        }
        if (!product.sku || product.sku.toString().trim() === '') {
            errors.push(`Row ${rowNumber}: SKU is required for new products`);
        }
        if (!product.category_name || product.category_name.toString().trim() === '') {
            errors.push(`Row ${rowNumber}: Category name is required for new products`);
        }
        if (!product.stamp || product.stamp.toString().trim() === '') {
            errors.push(`Row ${rowNumber}: Stamp is required for new products`);
        }
    } else {
        // For updates, stamp is also required
        if (!product.stamp || product.stamp.toString().trim() === '') {
            errors.push(`Row ${rowNumber}: Stamp is required for updates`);
        }
    }

    // Validate numeric fields
    const numericFields = [
        { field: 'gross_weight', name: 'Gross Weight' },
        { field: 'less_weight', name: 'Less Weight' },
        { field: 'net_weight', name: 'Net Weight' },
        { field: 'additional_weight', name: 'Additional Weight' },
        { field: 'tunch', name: 'Purity' },
        { field: 'wastage_percentage', name: 'Wastage Percentage' },
        { field: 'rate', name: 'Rate' },
        { field: 'diamond_weight', name: 'Diamond Weight' },
        { field: 'stone_weight', name: 'Stone Weight' },
        { field: 'labour', name: 'Labour' },
        { field: 'other', name: 'Other' }
    ];

    numericFields.forEach(({ field, name }) => {
        if (product[field] !== undefined && product[field] !== null && product[field] !== '') {
            const value = parseFloat(product[field]);
            // For tunch, allow 0, so check differently
            if (field === 'tunch') {
                // Tunch validation is handled separately below
                return;
            }
            if (isNaN(value) || value < 0) {
                errors.push(`Row ${rowNumber}: ${name} must be a valid positive number`);
            }
        }
    });

    // Validate labour_on field
    if (product.labour_on !== undefined && product.labour_on !== null && product.labour_on !== '') {
        const validLabourTypes = ['Wt', 'Pc', 'Fl'];
        if (!validLabourTypes.includes(product.labour_on)) {
            errors.push(`Row ${rowNumber}: Labour On must be one of: Wt, Pc, Fl`);
        }
    }

    // Validate tunch (should be 0-1000 for parts per thousand, e.g., 916 = 91.6%, 750 = 75%)
    // Only validate if a valid numeric value is provided
    // If empty/null/undefined, it will default to 0 without error
    if (product.tunch !== undefined && product.tunch !== null && product.tunch !== '') {
        const tunch = parseFloat(product.tunch);
        // Only validate if it's a valid number (not NaN)
        if (!isNaN(tunch)) {
            if (tunch < 0 || tunch > 1000) {
                errors.push(`Row ${rowNumber}: Purity must be between 0 and 1000 (parts per thousand, e.g., 916 for 91.6%)`);
            }
        }
        // If NaN (invalid value like empty string converted to NaN), don't error - will default to 0
    }

    // Validate wastage_percentage (should be >= 0)
    if (product.wastage_percentage !== undefined && product.wastage_percentage !== null && product.wastage_percentage !== '') {
        const wastage = parseFloat(product.wastage_percentage);
        if (wastage < 0) {
            errors.push(`Row ${rowNumber}: Wastage Percentage must be >= 0`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Calculate net weight from gross weight and less weight
 * @param {Number} grossWeight - Gross weight
 * @param {Number} lessWeight - Less weight
 * @param {Number} additionalWeight - Additional weight
 * @returns {Number} - Net weight
 */
const calculateNetWeight = (grossWeight, lessWeight, additionalWeight = 0) => {
    const gross = parseFloat(grossWeight) || 0;
    const less = parseFloat(lessWeight) || 0;
    const additional = parseFloat(additionalWeight) || 0;
    return (gross - less) + additional;
};

/**
 * Calculate fine value based on net weight, additional weight, tunch, and wastage
 * @param {Number} grossWeight - Gross weight
 * @param {Number} lessWeight - Less weight
 * @param {Number} additionalWeight - Additional weight
 * @param {Number} tunch - Tunch value (0-1000 for parts per thousand, e.g., 916 = 91.6%, or 0-100 for percentage)
 * @param {Number} wastage - Wastage percentage (>=0)
 * @returns {Number} - Fine weight
 */
const calculateFineValue = (grossWeight, lessWeight, additionalWeight, tunch, wastage) => {
    const gross = parseFloat(grossWeight) || 0;
    const less = parseFloat(lessWeight) || 0;
    const additional = parseFloat(additionalWeight) || 0;
    const tunchValue = parseFloat(tunch) || 0;
    const wastageValue = parseFloat(wastage) || 0;

    // Calculate net weight
    const netWeight = gross - less;

    // Step 1: Add additional weight to net weight
    let workingWeight = netWeight + additional;

    // Step 2: Apply tunch percentage
    // Tunch can be in two formats:
    // - Parts per thousand (0-1000): e.g., 916 = 91.6%, 750 = 75%
    // - Percentage (0-100): e.g., 91.6 = 91.6%, 75 = 75%
    // If tunch > 100, treat as parts per thousand (divide by 1000), otherwise treat as percentage (divide by 100)
    if (tunchValue > 0) {
        const tunchMultiplier = tunchValue > 100 ? (tunchValue / 1000) : (tunchValue / 100);
        workingWeight = workingWeight * tunchMultiplier;
    }

    // Step 3: Add wastage percentage to the tunch-adjusted weight
    if (wastageValue > 0) {
        const wastageAmount = workingWeight * (wastageValue / 100);
        workingWeight = workingWeight + wastageAmount;
    }

    return workingWeight > 0 ? parseFloat(workingWeight.toFixed(5)) : 0;
};

/**
 * Calculate labour cost based on labour type and value
 * @param {String} labourType - Labour type (Wt, Pc, Fl)
 * @param {Number} labourValue - Labour value (for Wt: per gram, for Pc: percentage, for Fl: flat amount)
 * @param {Number} netWeight - Net weight (including additional weight)
 * @param {Number} rate - Rate per gram
 * @returns {Number} - Labour cost
 */
const calculateLabourCost = (labourType, labourValue, netWeight, rate) => {
    const type = labourType || 'Wt';
    const value = parseFloat(labourValue) || 0;
    const weight = parseFloat(netWeight) || 0;
    const rateValue = parseFloat(rate) || 0;

    let labourCost = 0;

    switch (type) {
        case 'Wt':
            // Weight Type: labour_value × net_weight (including additional weight)
            if (value > 0 && weight > 0) {
                labourCost = value * weight;
            }
            break;

        case 'Fl':
            // Flat Type: Direct labour_value amount
            labourCost = value;
            break;

        case 'Pc':
            // Percentage Type: (net_weight × labour_percentage_value) × rate (including additional weight)
            if (value > 0 && weight > 0 && rateValue > 0) {
                const labourWeight = weight * (value / 100);
                labourCost = labourWeight * rateValue;
            }
            break;

        default:
            labourCost = 0;
    }

    return parseFloat(labourCost.toFixed(2));
};

/**
 * Calculate total value from all components
 * @param {Object} product - Product data object
 * @returns {Object} - { total: number, fineWeight: number, netWeight: number, labourCost: number }
 */
const calculateTotalValue = (product) => {
    const grossWeight = parseFloat(product.gross_weight) || 0;
    const lessWeight = parseFloat(product.less_weight) || 0;
    const additionalWeight = parseFloat(product.additional_weight) || 0;
    const tunch = parseFloat(product.tunch) || 0;
    const wastage = parseFloat(product.wastage_percentage) || 0;
    const rate = parseFloat(product.rate) || 0;
    const diamondWeight = parseFloat(product.diamond_weight) || 0;
    const stoneWeight = parseFloat(product.stone_weight) || 0;
    const other = parseFloat(product.other) || 0;
    const labourType = product.labour_on || 'Wt';

    // Calculate net weight (including additional weight)
    const netWeight = calculateNetWeight(grossWeight, lessWeight, additionalWeight);

    // Calculate fine weight
    const fineWeight = calculateFineValue(grossWeight, lessWeight, additionalWeight, tunch, wastage);

    // Determine labour cost
    // If labour_flat, labour_percent, or labour_weight is provided, use those for calculation
    // Otherwise, use the provided labour value as the cost (if already calculated in Excel)
    let labourCost = 0;
    if (product.labour_flat !== undefined && product.labour_flat !== null && product.labour_flat !== '') {
        // Flat labour value provided
        labourCost = calculateLabourCost('Fl', parseFloat(product.labour_flat) || 0, netWeight, rate);
    } else if (product.labour_percent !== undefined && product.labour_percent !== null && product.labour_percent !== '') {
        // Percentage labour value provided
        labourCost = calculateLabourCost('Pc', parseFloat(product.labour_percent) || 0, netWeight, rate);
    } else if (product.labour_weight !== undefined && product.labour_weight !== null && product.labour_weight !== '') {
        // Weight-based labour value provided
        labourCost = calculateLabourCost('Wt', parseFloat(product.labour_weight) || 0, netWeight, rate);
    } else {
        // Use labour as input value for calculation based on labour_on type
        // If labour_on is provided, calculate from labour value
        // Otherwise, use labour as pre-calculated cost
        const labourValue = parseFloat(product.labour) || 0;
        if (labourValue > 0 && labourType && ['Wt', 'Pc', 'Fl'].includes(labourType)) {
            labourCost = calculateLabourCost(labourType, labourValue, netWeight, rate);
        } else {
            // Use labour as pre-calculated cost
            labourCost = labourValue;
        }
    }

    // Calculate metal value based on fine weight
    const metalValue = fineWeight > 0 && rate > 0 ? fineWeight * rate : 0;

    // Note: Diamond and stone values from less weight items are not included here
    // as they are typically calculated separately from product_less_weight table
    // If provided in product data, add them here:
    const diamondValue = parseFloat(product.diamond_cost) || 0;
    const stoneValue = parseFloat(product.stone_cost) || 0;

    // Calculate total
    let total = 0;
    total += metalValue;
    total += diamondValue;
    total += stoneValue;
    total += labourCost;
    total += other;

    return {
        total: parseFloat(total.toFixed(2)),
        fineWeight: parseFloat(fineWeight.toFixed(5)),
        netWeight: parseFloat(netWeight.toFixed(3)),
        labourCost: parseFloat(labourCost.toFixed(2))
    };
};

/**
 * Parse stamp and find metal type, metal_id, purity_id, and rate from database
 * @param {String} stamp - Stamp value (e.g., "22K / 916")
 * @param {Object} connection - Database connection
 * @returns {Promise<Object>} - { metal_id, metal_purity_id, rate, metal_type }
 */
const parseStampAndFindMetalType = async (stamp, connection) => {
    if (!stamp || stamp.trim() === '') {
        return { metal_id: null, metal_purity_id: null, rate: null, metal_type: null };
    }

    try {
        const normalizedStamp = stamp.trim().toUpperCase();

        // Extract all numbers from stamp (potential tunch values)
        const numbersInStamp = stamp.match(/\d+/g) || [];
        const numbers = numbersInStamp.map(n => parseInt(n, 10));

        // Extract all text/words from stamp (potential purity names or metal names)
        const wordsInStamp = stamp.match(/[A-Za-z]+/g) || [];
        const words = wordsInStamp.map(w => w.toUpperCase().trim()).filter(w => w.length > 0);

        // Extract karat pattern (e.g., "24K", "22K")
        const karatPattern = stamp.match(/(\d+K)/i);
        const karatValue = karatPattern ? karatPattern[1].toUpperCase() : null;

        let metalRates = [];

        // Strategy 1: Exact match with stamp value (case-insensitive)
        // Try matching by constructing stamp from API data and comparing
        [metalRates] = await connection.execute(`
            SELECT 
                mr.metal_type_id,
                mr.purity_id,
                mr.rate_per_gram,
                mt.name as metal_name,
                mp.purity_name,
                mp.tunch_value
            FROM metal_rates mr
            JOIN metal_types mt ON mr.metal_type_id = mt.id
            JOIN metal_purities mp ON mr.purity_id = mp.id
            WHERE mr.is_live = 1
            AND CONCAT(UPPER(mp.purity_name), ' / ', ROUND(mp.tunch_value)) = ?
            LIMIT 1
        `, [normalizedStamp]);

        // Strategy 2: Match by tunch value and purity_name/karat
        if (metalRates.length === 0 && numbers.length > 0) {
            const tunchValue = numbers[numbers.length - 1]; // Use last number as tunch value

            if (karatValue) {
                // Match by karat and tunch
                [metalRates] = await connection.execute(`
                    SELECT 
                        mr.metal_type_id,
                        mr.purity_id,
                        mr.rate_per_gram,
                        mt.name as metal_name,
                        mp.purity_name,
                        mp.tunch_value
                    FROM metal_rates mr
                    JOIN metal_types mt ON mr.metal_type_id = mt.id
                    JOIN metal_purities mp ON mr.purity_id = mp.id
                    WHERE mr.is_live = 1
                    AND UPPER(mp.purity_name) = ?
                    AND ROUND(mp.tunch_value) = ?
                    LIMIT 1
                `, [karatValue, tunchValue]);
            }

            // If still not found, try matching by tunch value and any word in purity_name
            if (metalRates.length === 0 && words.length > 0) {
                const wordConditions = words.map(() => 'UPPER(mp.purity_name) LIKE ?').join(' OR ');
                const wordParams = words.map(w => `%${w}%`);
                [metalRates] = await connection.execute(`
                    SELECT 
                        mr.metal_type_id,
                        mr.purity_id,
                        mr.rate_per_gram,
                        mt.name as metal_name,
                        mp.purity_name,
                        mp.tunch_value
                    FROM metal_rates mr
                    JOIN metal_types mt ON mr.metal_type_id = mt.id
                    JOIN metal_purities mp ON mr.purity_id = mp.id
                    WHERE mr.is_live = 1
                    AND ROUND(mp.tunch_value) = ?
                    AND (${wordConditions})
                    LIMIT 1
                `, [tunchValue, ...wordParams]);
            }

            // If still not found, try matching by tunch value and metal_name
            if (metalRates.length === 0 && words.length > 0) {
                const wordConditions = words.map(() => 'UPPER(mt.name) LIKE ?').join(' OR ');
                const wordParams = words.map(w => `%${w}%`);
                [metalRates] = await connection.execute(`
                    SELECT 
                        mr.metal_type_id,
                        mr.purity_id,
                        mr.rate_per_gram,
                        mt.name as metal_name,
                        mp.purity_name,
                        mp.tunch_value
                    FROM metal_rates mr
                    JOIN metal_types mt ON mr.metal_type_id = mt.id
                    JOIN metal_purities mp ON mr.purity_id = mp.id
                    WHERE mr.is_live = 1
                    AND ROUND(mp.tunch_value) = ?
                    AND (${wordConditions})
                    LIMIT 1
                `, [tunchValue, ...wordParams]);
            }

            // If still not found, try matching by tunch value only (last resort)
            if (metalRates.length === 0) {
                [metalRates] = await connection.execute(`
                    SELECT 
                        mr.metal_type_id,
                        mr.purity_id,
                        mr.rate_per_gram,
                        mt.name as metal_name,
                        mp.purity_name,
                        mp.tunch_value
                    FROM metal_rates mr
                    JOIN metal_types mt ON mr.metal_type_id = mt.id
                    JOIN metal_purities mp ON mr.purity_id = mp.id
                    WHERE mr.is_live = 1
                    AND ROUND(mp.tunch_value) = ?
                    LIMIT 1
                `, [tunchValue]);
            }
        }

        // Strategy 3: Match by karat only (if no tunch value found)
        if (metalRates.length === 0 && karatValue) {
            [metalRates] = await connection.execute(`
                SELECT 
                    mr.metal_type_id,
                    mr.purity_id,
                    mr.rate_per_gram,
                    mt.name as metal_name,
                    mp.purity_name,
                    mp.tunch_value
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mr.is_live = 1
                AND UPPER(mp.purity_name) = ?
                LIMIT 1
            `, [karatValue]);
        }

        // Strategy 4: Fuzzy match by words in purity_name or metal_name
        if (metalRates.length === 0 && words.length > 0) {
            const wordConditions = words.map(() => '(UPPER(mp.purity_name) LIKE ? OR UPPER(mt.name) LIKE ?)').join(' OR ');
            const wordParams = words.flatMap(w => [`%${w}%`, `%${w}%`]);
            [metalRates] = await connection.execute(`
                SELECT 
                    mr.metal_type_id,
                    mr.purity_id,
                    mr.rate_per_gram,
                    mt.name as metal_name,
                    mp.purity_name,
                    mp.tunch_value
                FROM metal_rates mr
                JOIN metal_types mt ON mr.metal_type_id = mt.id
                JOIN metal_purities mp ON mr.purity_id = mp.id
                WHERE mr.is_live = 1
                AND (${wordConditions})
                LIMIT 1
            `, wordParams);
        }

        if (metalRates.length > 0) {
            const rate = metalRates[0];
            return {
                metal_id: rate.metal_type_id,
                metal_purity_id: rate.purity_id,
                rate: parseFloat(rate.rate_per_gram) || 0,
                metal_type: rate.metal_name
            };
        }
    } catch (error) {
        console.error('Error parsing stamp:', error);
    }

    return { metal_id: null, metal_purity_id: null, rate: null, metal_type: null };
};

/**
 * Check if item is diamond-related
 * @param {String} itemName - Item name
 * @returns {Boolean}
 */
const isDiamondItem = (itemName) => {
    if (!itemName) return false;
    const name = itemName.toLowerCase();
    const diamondKeywords = [
        'diamond', 'solitaire', 'brilliant', 'princess', 'round diamond', 'pear diamond',
        'marquise diamond', 'asscher diamond', 'radiant diamond', 'cushion diamond',
        'baguette diamond', 'emerald cut diamond', 'oval cut diamond', 'heart diamond'
    ];
    return diamondKeywords.some(keyword => name.includes(keyword));
};

/**
 * Check if item is stone-related (non-diamond)
 * @param {String} itemName - Item name
 * @returns {Boolean}
 */
const isStoneItem = (itemName) => {
    if (!itemName) return false;
    const name = itemName.toLowerCase();
    const stoneKeywords = [
        'ruby', 'emerald', 'sapphire', 'pearl', 'opal', 'garnet', 'amethyst', 'topaz',
        'aquamarine', 'citrine', 'peridot', 'tanzanite', 'tourmaline', 'zircon', 'spinel'
    ];
    return stoneKeywords.some(keyword => name.includes(keyword));
};

/**
 * Convert weight to carats based on units
 * @param {Number} weight - Weight value
 * @param {String} units - Unit type (carat, gram, cent, pc, kg, ratti)
 * @returns {Number} - Weight in carats
 */
const convertToCarats = (weight, units) => {
    const weightValue = parseFloat(weight) || 0;
    const unit = (units || 'carat').toLowerCase();

    switch (unit) {
        case 'carat':
            return weightValue;
        case 'gram':
            return weightValue * 5; // 1 gram = 5 carats
        case 'cent':
            return weightValue * 0.05; // 1 cent = 0.05 carats
        case 'pc':
            return weightValue * 0.5; // 1 pc = 0.5 carats
        case 'kg':
            return weightValue * 5000; // 1 kg = 5000 carats
        case 'ratti':
            return weightValue * 0.91; // 1 ratti = 0.91 carats
        default:
            return weightValue;
    }
};

/**
 * Calculate diamond and stone weights from less weight items
 * @param {Array} lessWeightItems - Array of less weight items
 * @returns {Object} - { diamondWeight, stoneWeight, totalLessWeight }
 */
const calculateWeightsFromLessWeight = (lessWeightItems) => {
    if (!Array.isArray(lessWeightItems) || lessWeightItems.length === 0) {
        return { diamondWeight: 0, stoneWeight: 0, totalLessWeight: 0 };
    }

    let diamondWeight = 0;
    let stoneWeight = 0;
    let totalLessWeight = 0;

    lessWeightItems.forEach(item => {
        const itemName = (item.item || '').toString().trim();
        const weight = parseFloat(item.weight) || 0;
        const units = item.units || 'carat';

        // Convert to grams for total less weight calculation
        let weightInGrams = 0;
        if (units === 'carat') {
            weightInGrams = weight * 0.2; // 1 carat = 0.2 grams
        } else if (units === 'gram') {
            weightInGrams = weight;
        } else if (units === 'kg') {
            weightInGrams = weight * 1000;
        } else {
            // For other units, convert to carats first, then to grams
            const carats = convertToCarats(weight, units);
            weightInGrams = carats * 0.2;
        }

        totalLessWeight += weightInGrams;

        // Calculate diamond weight
        if (isDiamondItem(itemName)) {
            const carats = convertToCarats(weight, units);
            diamondWeight += carats;
        }

        // Calculate stone weight
        if (isStoneItem(itemName)) {
            const carats = convertToCarats(weight, units);
            stoneWeight += carats;
        }
    });

    return {
        diamondWeight: parseFloat(diamondWeight.toFixed(3)),
        stoneWeight: parseFloat(stoneWeight.toFixed(3)),
        totalLessWeight: parseFloat(totalLessWeight.toFixed(3))
    };
};

/**
 * Validate and calculate all product fields before saving
 * @param {Object} product - Product data object
 * @param {Number} rowNumber - Row number for error reporting
 * @param {Boolean} isUpdate - Whether this is an update operation
 * @param {Object} connection - Database connection for stamp parsing
 * @returns {Promise<Object>} - { valid: boolean, errors: string[], calculatedProduct: Object }
 */
const validateAndCalculateProduct = async (product, rowNumber, isUpdate = false, connection = null) => {
    // Validate required fields
    const validation = validateProductData(product, rowNumber, isUpdate);
    if (!validation.valid) {
        return {
            valid: false,
            errors: validation.errors,
            calculatedProduct: null
        };
    }

    // Parse stamp and get metal_id, metal_purity_id, and rate if stamp is provided
    let metalId = product.metal_id || null;
    let metalPurityId = product.metal_purity_id || null;
    let rateFromStamp = product.rate || 0;

    if (product.stamp && connection) {
        const stampData = await parseStampAndFindMetalType(product.stamp, connection);
        if (stampData.metal_id) {
            metalId = stampData.metal_id;
            metalPurityId = stampData.metal_purity_id;
            // Always use rate from stamp when stamp is provided (override Excel rate)
            if (stampData.rate && stampData.rate > 0) {
                rateFromStamp = stampData.rate;
            }
        }
    }

    // Calculate weights from less weight items if provided
    // If less weight items are provided, calculate diamond/stone weights from them
    // Otherwise, use provided values or keep as 0
    let calculatedDiamondWeight = parseFloat(product.diamond_weight) || 0;
    let calculatedStoneWeight = parseFloat(product.stone_weight) || 0;
    let calculatedLessWeight = parseFloat(product.less_weight) || 0;

    // Calculate purchase_value, sale_value, and total_profit for less weight items
    if (product.product_less_weight && Array.isArray(product.product_less_weight) && product.product_less_weight.length > 0) {
        // Calculate weights
        const weightCalculations = calculateWeightsFromLessWeight(product.product_less_weight);
        // Always use calculated diamond and stone weights from less weight items if available
        calculatedDiamondWeight = weightCalculations.diamondWeight;
        calculatedStoneWeight = weightCalculations.stoneWeight;
        // Use calculated less weight if less_weight is not provided or 0
        if (!product.less_weight || product.less_weight === 0) {
            calculatedLessWeight = weightCalculations.totalLessWeight;
        }

        // Calculate purchase_value, sale_value, and total_profit for each less weight item
        product.product_less_weight = product.product_less_weight.map(item => {
            const weight = parseFloat(item.weight) || 0;
            const pieces = parseFloat(item.pieces) || 1;
            const purchaseRate = parseFloat(item.purchase_rate) || 0;
            const saleRate = parseFloat(item.sale_rate) || 0;

            // Calculate per_value (weight * purchase_rate per unit)
            const perValue = (weight * purchaseRate).toFixed(2);
            const purchaseValue = parseFloat(perValue);

            // Calculate sale_value (weight * sale_rate per unit)
            const saleValue = (weight * saleRate).toFixed(2);
            const calculatedSaleValue = parseFloat(saleValue);

            // Calculate profit (sale_value - per_value)
            const profit = (calculatedSaleValue - purchaseValue).toFixed(2);

            // Calculate pieces_rate (per_value * pieces) - total purchase value for all pieces
            const piecesRate = (purchaseValue * pieces).toFixed(2);
            const totalPurchaseValue = parseFloat(piecesRate);

            // Calculate total_sale_rate (sale_value * pieces) - total sale value for all pieces
            const totalSaleRate = (calculatedSaleValue * pieces).toFixed(2);
            const totalSaleValue = parseFloat(totalSaleRate);

            // Calculate total_profit (profit * pieces) OR (total_sale_value - total_purchase_value)
            const totalProfit = (parseFloat(profit) * pieces).toFixed(2);

            return {
                ...item,
                purchase_value: totalPurchaseValue,
                sale_value: totalSaleValue,
                total_profit: parseFloat(totalProfit)
            };
        });
    }
    // If no less weight items but diamond/stone weights are provided in Excel, use those
    // If not provided, they remain 0 (which is fine)

    // Update product with calculated less weight for calculations
    const productForCalculation = {
        ...product,
        less_weight: calculatedLessWeight,
        diamond_weight: calculatedDiamondWeight,
        stone_weight: calculatedStoneWeight,
        rate: rateFromStamp || product.rate || 0,
        metal_id: metalId,
        metal_purity_id: metalPurityId
    };

    // Calculate values
    const calculations = calculateTotalValue(productForCalculation);

    // Clamp labour value to DECIMAL(10,2) maximum: 99999999.99
    const MAX_LABOUR_VALUE = 99999999.99;
    let labourValue = calculations.labourCost;
    if (labourValue > MAX_LABOUR_VALUE) {
        labourValue = MAX_LABOUR_VALUE;
    } else if (labourValue < 0) {
        labourValue = 0;
    }
    // Round to 2 decimal places
    labourValue = parseFloat(labourValue.toFixed(2));

    // Clamp total_rs value to DECIMAL(10,2) maximum: 99999999.99
    const MAX_TOTAL_RS_VALUE = 99999999.99;
    let totalRsValue = calculations.total;
    if (totalRsValue > MAX_TOTAL_RS_VALUE) {
        totalRsValue = MAX_TOTAL_RS_VALUE;
    } else if (totalRsValue < 0) {
        totalRsValue = 0;
    }
    // Round to 2 decimal places
    totalRsValue = parseFloat(totalRsValue.toFixed(2));

    // Create calculated product with validated and calculated values
    const calculatedProduct = {
        ...product,
        // Ensure numeric values are properly parsed
        gross_weight: parseFloat(product.gross_weight) || 0,
        less_weight: calculatedLessWeight, // Use calculated less weight
        net_weight: calculations.netWeight, // Use calculated net weight
        additional_weight: parseFloat(product.additional_weight) || 0,
        tunch: parseFloat(product.tunch) || 0,
        wastage_percentage: parseFloat(product.wastage_percentage) || 0,
        rate: rateFromStamp || parseFloat(product.rate) || 0,
        diamond_weight: calculatedDiamondWeight, // Use calculated diamond weight
        stone_weight: calculatedStoneWeight, // Use calculated stone weight
        labour: labourValue, // Use clamped labour cost
        labour_on: product.labour_on || 'Wt',
        other: parseFloat(product.other) || 0,
        total_fine_weight: calculations.fineWeight, // Use calculated fine weight
        total_rs: totalRsValue, // Use clamped total
        pieces: parseInt(product.pieces) || 1,
        metal_id: metalId,
        metal_purity_id: metalPurityId
    };

    // Ensure product_images is preserved from original product (for bulk upload)
    if (product.product_images && Array.isArray(product.product_images)) {
        calculatedProduct.product_images = product.product_images;
    }

    // Create default product option if no product_options provided and product is being created
    // Only for CREATE operations, not UPDATE
    if (!isUpdate && (!product.product_options || !Array.isArray(product.product_options) || product.product_options.length === 0)) {
        const fineWeight = calculations.fineWeight;
        const grossWeight = parseFloat(calculatedProduct.gross_weight) || 0;

        // Use realistic fixed values for fields that don't have calculations
        // Size doesn't have calculation, so use a fixed realistic value
        calculatedProduct.product_options = [{
            size: 'Standard', // Fixed value - no calculation needed
            weight: fineWeight > 0 ? fineWeight.toString() : (grossWeight > 0 ? grossWeight.toString() : '0'),
            dimensions: '', // Empty - no calculation
            metal_color: calculatedProduct.metal_color || '', // Use from product if available
            gender: '', // Empty - no calculation
            occasion: '', // Empty - no calculation
            value: totalRsValue > 0 ? totalRsValue.toString() : '0',
            sell_price: totalRsValue > 0 ? totalRsValue.toString() : '0'
        }];
    }

    return {
        valid: true,
        errors: [],
        calculatedProduct
    };
};

// ==========================================
// END OF VALIDATION & CALCULATION FUNCTIONS
// ==========================================

const bulkUploadProducts = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { products } = req.body;

        // Helper function to parse DD/MM/YYYY date format
        const parseDate = (dateString) => {
            if (!dateString || dateString.trim() === '') return null;

            // Handle DD/MM/YYYY format
            const parts = dateString.toString().trim().split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
                const year = parseInt(parts[2], 10);

                // Validate date
                if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
                    const date = new Date(year, month, day);
                    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format for MySQL
                    }
                }
            }

            // Try parsing as ISO date if DD/MM/YYYY fails
            const isoDate = new Date(dateString);
            if (!isNaN(isoDate.getTime())) {
                return isoDate.toISOString().split('T')[0];
            }

            return null;
        };

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid products data. Expected non-empty array of products.'
            });
        }

        const insertedProducts = [];
        const updatedProducts = [];
        const errors = [];
        const warnings = [];

        // Create category/subcategory lookup cache
        const categoryCache = new Map();
        const subcategoryCache = new Map();
        const subSubcategoryCache = new Map();

        // Helper function to get or create category
        const getCategoryId = async (categoryName) => {
            if (!categoryName) return null;

            if (categoryCache.has(categoryName)) {
                return categoryCache.get(categoryName);
            }

            // First check by name
            const [categories] = await connection.execute(
                'SELECT id FROM categories WHERE name = ? LIMIT 1',
                [categoryName]
            );

            if (categories.length > 0) {
                categoryCache.set(categoryName, categories[0].id);
                return categories[0].id;
            }

            // Generate slug and check if it already exists
            const baseSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let slug = baseSlug;
            let slugCounter = 1;

            // Check if slug already exists - if it does, fetch that record
            while (true) {
                const [existingBySlug] = await connection.execute(
                    'SELECT id FROM categories WHERE slug = ? LIMIT 1',
                    [slug]
                );

                if (existingBySlug.length > 0) {
                    // Slug exists - use the existing record
                    const existingId = existingBySlug[0].id;
                    categoryCache.set(categoryName, existingId);
                    warnings.push(`Using existing category with slug '${slug}': ${categoryName}`);
                    return existingId;
                }

                // Slug doesn't exist, break and use this slug
                break;
            }

            // Auto-create category if it doesn't exist
            try {
                const [result] = await connection.execute(
                    'INSERT INTO categories (name, slug, status) VALUES (?, ?, "active")',
                    [categoryName, slug]
                );

                categoryCache.set(categoryName, result.insertId);
                warnings.push(`Auto-created category: ${categoryName}`);
                return result.insertId;
            } catch (error) {
                // If insert fails due to duplicate slug (race condition), fetch existing
                if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('slug')) {
                    const [existingBySlug] = await connection.execute(
                        'SELECT id FROM categories WHERE slug = ? LIMIT 1',
                        [slug]
                    );
                    if (existingBySlug.length > 0) {
                        const existingId = existingBySlug[0].id;
                        categoryCache.set(categoryName, existingId);
                        warnings.push(`Using existing category with slug '${slug}': ${categoryName}`);
                        return existingId;
                    }
                }
                throw error;
            }
        };

        // Helper function to get or create subcategory
        const getSubcategoryId = async (subcategoryName, categoryId) => {
            if (!subcategoryName || !categoryId) return null;

            const key = `${categoryId}-${subcategoryName}`;
            if (subcategoryCache.has(key)) {
                return subcategoryCache.get(key);
            }

            // First check by name and category_id
            const [subcategories] = await connection.execute(
                'SELECT id FROM subcategories WHERE name = ? AND category_id = ? LIMIT 1',
                [subcategoryName, categoryId]
            );

            if (subcategories.length > 0) {
                subcategoryCache.set(key, subcategories[0].id);
                return subcategories[0].id;
            }

            // Generate slug and check if it already exists
            const baseSlug = subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let slug = baseSlug;
            let slugCounter = 1;

            // Check if slug already exists - if it does, fetch that record
            while (true) {
                const [existingBySlug] = await connection.execute(
                    'SELECT id, category_id FROM subcategories WHERE slug = ? LIMIT 1',
                    [slug]
                );

                if (existingBySlug.length > 0) {
                    // Slug exists - use the existing record
                    const existingId = existingBySlug[0].id;
                    subcategoryCache.set(key, existingId);
                    warnings.push(`Using existing subcategory with slug '${slug}': ${subcategoryName}`);
                    return existingId;
                }

                // Slug doesn't exist, break and use this slug
                break;
            }

            // Auto-create subcategory if it doesn't exist
            try {
                const [result] = await connection.execute(
                    'INSERT INTO subcategories (name, slug, category_id, status) VALUES (?, ?, ?, "active")',
                    [subcategoryName, slug, categoryId]
                );

                subcategoryCache.set(key, result.insertId);
                warnings.push(`Auto-created subcategory: ${subcategoryName}`);
                return result.insertId;
            } catch (error) {
                // If insert fails due to duplicate slug (race condition), fetch existing
                if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('slug')) {
                    const [existingBySlug] = await connection.execute(
                        'SELECT id FROM subcategories WHERE slug = ? LIMIT 1',
                        [slug]
                    );
                    if (existingBySlug.length > 0) {
                        const existingId = existingBySlug[0].id;
                        subcategoryCache.set(key, existingId);
                        warnings.push(`Using existing subcategory with slug '${slug}': ${subcategoryName}`);
                        return existingId;
                    }
                }
                throw error;
            }
        };

        // Helper function to get or create sub-subcategory
        const getSubSubcategoryId = async (subSubcategoryName, subcategoryId) => {
            if (!subSubcategoryName || !subcategoryId) return null;

            const key = `${subcategoryId}-${subSubcategoryName}`;
            if (subSubcategoryCache.has(key)) {
                return subSubcategoryCache.get(key);
            }

            const [subSubcategories] = await connection.execute(
                'SELECT id FROM sub_subcategories WHERE name = ? AND subcategory_id = ? LIMIT 1',
                [subSubcategoryName, subcategoryId]
            );

            if (subSubcategories.length > 0) {
                subSubcategoryCache.set(key, subSubcategories[0].id);
                return subSubcategories[0].id;
            }

            // Auto-create sub-subcategory if it doesn't exist
            // Generate unique slug to avoid duplicate key errors
            const baseSlug = subSubcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let slug = baseSlug;
            let slugCounter = 1;

            // Check if slug already exists and generate unique one
            while (true) {
                const [existingSlug] = await connection.execute(
                    'SELECT id FROM sub_subcategories WHERE slug = ?',
                    [slug]
                );
                if (existingSlug.length === 0) break;
                slug = `${baseSlug}-${slugCounter}`;
                slugCounter++;
            }

            const [result] = await connection.execute(
                'INSERT INTO sub_subcategories (name, slug, subcategory_id, status) VALUES (?, ?, ?, "active")',
                [subSubcategoryName, slug, subcategoryId]
            );

            subSubcategoryCache.set(key, result.insertId);
            warnings.push(`Auto-created sub-subcategory: ${subSubcategoryName}`);
            return result.insertId;
        };

        // Process each product
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const rowNumber = i + 1;
            let validationResult = null; // Declare in outer scope for error handling

            try {
                // Auto-generate tag number if not provided (before checking if it exists)
                if (!product.tag_number || product.tag_number.toString().trim() === '') {
                    product.tag_number = await generateUniqueTagNumber(connection);
                }

                // Check if tag number already exists (to determine if it's update or create)
                const [existingTag] = await connection.execute(
                    'SELECT id, sku, item_name FROM products WHERE tag_number = ?',
                    [product.tag_number]
                );

                const isUpdate = existingTag.length > 0;

                // Validate and calculate product data (pass connection for stamp parsing)
                validationResult = await validateAndCalculateProduct(product, rowNumber, isUpdate, connection);

                if (!validationResult.valid) {
                    errors.push(...validationResult.errors);
                    continue;
                }

                // Use calculated product data
                const calculatedProduct = validationResult.calculatedProduct;

                if (existingTag.length > 0) {
                    // UPDATE EXISTING PRODUCT - TAG NUMBER MATCHES
                    // As per user requirement: "AGAR TAGNO MATCH HOGA TO JO DATA INPUT HIA VO ESA HI SAVE HOGA"
                    // This means if TAG matches, save the input data as-is (update)
                    const existingProduct = existingTag[0];

                    // Prepare update data
                    const updateFields = [];
                    const updateValues = [];

                    // Helper function to add field to update if value is provided and different
                    const addUpdateField = (field, value, currentValue) => {
                        // For certificate_number, allow setting to null if value is empty
                        if (field === 'certificate_number') {
                            const normalizedValue = (value === '' || value === null || value === undefined) ? null : value;
                            const normalizedCurrent = (currentValue === '' || currentValue === null || currentValue === undefined) ? null : currentValue;
                            if (normalizedValue !== normalizedCurrent) {
                                updateFields.push(`${field} = ?`);
                                updateValues.push(normalizedValue);
                            }
                        } else {
                            if (value !== undefined && value !== null && value !== '' && value !== currentValue) {
                                updateFields.push(`${field} = ?`);
                                updateValues.push(value);
                            }
                        }
                    };

                    // Get current product data for comparison
                    const [currentProductData] = await connection.execute(
                        'SELECT * FROM products WHERE id = ?',
                        [existingProduct.id]
                    );
                    const current = currentProductData[0];

                    // Update ALL fields from input data (as per user requirement - save input data as-is)
                    // Update basic fields (use calculated product)
                    addUpdateField('description', calculatedProduct.description, current.description);
                    addUpdateField('status', calculatedProduct.status, current.status);
                    addUpdateField('batch', calculatedProduct.batch, current.batch);

                    // Handle item_name update - check for duplicates if item_name is being changed
                    const newItemName = calculatedProduct.item_name || calculatedProduct.name;
                    if (newItemName && newItemName !== current.item_name) {
                        // Item name is being changed - check if new name already exists
                        const [existingItemName] = await connection.execute(
                            'SELECT id, tag_number FROM products WHERE item_name = ? AND id != ?',
                            [newItemName, existingProduct.id]
                        );

                        if (existingItemName.length > 0) {
                            // New item_name already exists with different product
                            // Make it unique by appending TAG number
                            const uniqueItemName = `${newItemName} (${calculatedProduct.tag_number})`;
                            addUpdateField('item_name', uniqueItemName, current.item_name);
                            warnings.push(`Row ${rowNumber}: Item name '${newItemName}' already exists. Using '${uniqueItemName}' to avoid duplicate.`);
                        } else {
                            // New item_name is unique, safe to update
                            addUpdateField('item_name', newItemName, current.item_name);
                        }
                    } else if (newItemName) {
                        // Item name not changing, but ensure it's in update list
                        addUpdateField('item_name', newItemName, current.item_name);
                    }
                    addUpdateField('stamp', calculatedProduct.stamp, current.stamp);
                    addUpdateField('remark', calculatedProduct.remark, current.remark);
                    addUpdateField('unit', calculatedProduct.unit, current.unit);
                    addUpdateField('pieces', calculatedProduct.pieces, current.pieces);

                    // Update weight fields (use calculated values)
                    addUpdateField('gross_weight', calculatedProduct.gross_weight, current.gross_weight);
                    addUpdateField('less_weight', calculatedProduct.less_weight, current.less_weight);
                    addUpdateField('net_weight', calculatedProduct.net_weight, current.net_weight);
                    addUpdateField('additional_weight', calculatedProduct.additional_weight, current.additional_weight);
                    addUpdateField('tunch', calculatedProduct.tunch, current.tunch);
                    addUpdateField('wastage_percentage', calculatedProduct.wastage_percentage, current.wastage_percentage);

                    // Update pricing fields (use calculated values)
                    addUpdateField('rate', calculatedProduct.rate, current.rate);
                    addUpdateField('diamond_weight', calculatedProduct.diamond_weight, current.diamond_weight);
                    addUpdateField('stone_weight', calculatedProduct.stone_weight, current.stone_weight);
                    addUpdateField('labour', calculatedProduct.labour, current.labour);
                    // Labour On can be empty string, so handle it separately
                    if (calculatedProduct.labour_on !== undefined && calculatedProduct.labour_on !== null && calculatedProduct.labour_on !== current.labour_on) {
                        updateFields.push('labour_on = ?');
                        updateValues.push(calculatedProduct.labour_on);
                    }
                    addUpdateField('other', calculatedProduct.other, current.other);
                    addUpdateField('total_fine_weight', calculatedProduct.total_fine_weight, current.total_fine_weight);
                    addUpdateField('total_rs', calculatedProduct.total_rs, current.total_rs);

                    // Update product features (use calculated product)
                    addUpdateField('design_type', calculatedProduct.design_type, current.design_type);
                    addUpdateField('manufacturing', calculatedProduct.manufacturing, current.manufacturing);
                    addUpdateField('customizable', calculatedProduct.customizable, current.customizable);
                    addUpdateField('engraving', calculatedProduct.engraving, current.engraving);
                    addUpdateField('hallmark', calculatedProduct.hallmark, current.hallmark);
                    addUpdateField('certificate_number', calculatedProduct.certificate_number, current.certificate_number);

                    // Handle category updates (use calculated product)
                    if (calculatedProduct.category_name) {
                        const categoryId = await getCategoryId(calculatedProduct.category_name);
                        addUpdateField('category_id', categoryId, current.category_id);

                        if (calculatedProduct.subcategory_name) {
                            const subcategoryId = await getSubcategoryId(calculatedProduct.subcategory_name, categoryId);
                            addUpdateField('subcategory_id', subcategoryId, current.subcategory_id);

                            if (calculatedProduct.sub_subcategory_name) {
                                const subSubcategoryId = await getSubSubcategoryId(calculatedProduct.sub_subcategory_name, subcategoryId);
                                addUpdateField('sub_subcategory_id', subSubcategoryId, current.sub_subcategory_id);
                            }
                        }
                    }

                    // Only update if there are changes
                    if (updateFields.length > 0) {
                        updateValues.push(existingProduct.id);

                        const updateQuery = `
                            UPDATE products 
                            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        `;

                        await connection.execute(updateQuery, updateValues);

                        // Update product_options if provided (use calculated product)
                        if (calculatedProduct.product_options && Array.isArray(calculatedProduct.product_options)) {
                            // Delete existing options
                            await connection.execute('DELETE FROM product_options WHERE product_id = ?', [existingProduct.id]);

                            // Insert new options
                            for (const option of calculatedProduct.product_options) {
                                await connection.execute(
                                    `INSERT INTO product_options (product_id, size, weight, dimensions, metal_color, gender, occasion, value, sell_price)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        existingProduct.id,
                                        option.size || 'Standard',
                                        option.weight || 'Standard',
                                        option.dimensions || 'Standard',
                                        option.metal_color || 'Standard',
                                        option.gender || null,
                                        option.occasion || null,
                                        option.value || 0,
                                        option.sell_price || 0
                                    ]
                                );
                            }
                        }

                        // Update product_less_weight if provided (use calculated product)
                        if (calculatedProduct.product_less_weight && Array.isArray(calculatedProduct.product_less_weight)) {
                            // Delete existing less weight items
                            await connection.execute('DELETE FROM product_less_weight WHERE product_id = ?', [existingProduct.id]);

                            // Insert new less weight items
                            for (const item of calculatedProduct.product_less_weight) {
                                await connection.execute(
                                    `INSERT INTO product_less_weight (product_id, item, stamp, clarity, color, cuts, shapes, remarks, pieces, weight, units, tunch, purchase_rate, sale_rate, total_profit, purchase_value, sale_value)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        existingProduct.id,
                                        item.item || '',
                                        item.stamp || '',
                                        item.clarity || '',
                                        item.color || '',
                                        item.cuts || '',
                                        item.shapes || '',
                                        item.remarks || '',
                                        item.pieces || 1,
                                        item.weight || item.weight_carat || 0,
                                        item.units || 'carat',
                                        item.tunch || 0,
                                        item.purchase_rate || 0,
                                        item.sale_rate || 0,
                                        item.total_profit || item.profit || 0,
                                        item.purchase_value || 0,
                                        item.sale_value || 0
                                    ]
                                );
                            }
                        }

                        // Update product_features if provided (use calculated product)
                        if (calculatedProduct.product_features && calculatedProduct.product_features.trim() !== '') {
                            // Delete existing features
                            await connection.execute('DELETE FROM product_features WHERE product_id = ?', [existingProduct.id]);

                            // Split comma-separated features and insert each as separate record
                            const featurePoints = calculatedProduct.product_features.split(',').map(f => f.trim()).filter(f => f);
                            for (const featurePoint of featurePoints) {
                                await connection.execute(
                                    'INSERT INTO product_features (product_id, feature_points) VALUES (?, ?)',
                                    [existingProduct.id, featurePoint]
                                );
                            }
                        }

                        // Download and update product_images from URLs if provided (from Excel "First Image" column)
                        if (calculatedProduct.product_images && Array.isArray(calculatedProduct.product_images) && calculatedProduct.product_images.length > 0) {
                            // Delete existing images
                            await connection.execute('DELETE FROM product_images WHERE product_id = ?', [existingProduct.id]);

                            for (let i = 0; i < calculatedProduct.product_images.length; i++) {
                                const imageUrl = calculatedProduct.product_images[i];
                                if (imageUrl && imageUrl.trim() !== '') {
                                    try {
                                        console.log(`Downloading image ${i + 1} for product update ${existingProduct.id}: ${imageUrl.substring(0, 50)}...`);

                                        // Download image from URL
                                        const downloadResult = await downloadImageFromUrl(
                                            imageUrl,
                                            path.join(process.cwd(), 'public', 'products'),
                                            {
                                                maxWidth: 1200,
                                                maxHeight: 1200,
                                                quality: 85
                                            }
                                        );

                                        if (downloadResult.success) {
                                            // Insert downloaded image into database
                                            await connection.execute(
                                                `INSERT INTO product_images (
                                                    product_id, image_name, original_name, image_url, 
                                                    alt_text, file_size, mime_type, dimensions, is_thumbnail, sort_order
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                                [
                                                    existingProduct.id,
                                                    downloadResult.filename,
                                                    downloadResult.filename,
                                                    downloadResult.url,
                                                    calculatedProduct.item_name || 'Product Image',
                                                    downloadResult.size || 0,
                                                    downloadResult.contentType || 'image/jpeg',
                                                    JSON.stringify({
                                                        width: downloadResult.width || 800,
                                                        height: downloadResult.height || 800
                                                    }),
                                                    i === 0, // First image is thumbnail
                                                    i // Sort order
                                                ]
                                            );
                                            console.log(`  ✓ Image updated: ${downloadResult.filename}`);
                                        } else {
                                            console.error(`  ✗ Failed to download image: ${downloadResult.error}`);
                                            // Save URL as fallback
                                            const imageName = imageUrl.split('/').pop().split('?')[0] || `product-${existingProduct.id}-${i + 1}.jpg`;
                                            await connection.execute(
                                                `INSERT INTO product_images (
                                                    product_id, image_name, original_name, image_url, 
                                                    alt_text, file_size, mime_type, dimensions, is_thumbnail, sort_order
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                                [
                                                    existingProduct.id,
                                                    imageName,
                                                    imageName,
                                                    imageUrl,
                                                    calculatedProduct.item_name || 'Product Image',
                                                    0,
                                                    'image/jpeg',
                                                    JSON.stringify({ width: 800, height: 800 }),
                                                    i === 0,
                                                    i
                                                ]
                                            );
                                        }
                                    } catch (error) {
                                        console.error(`Error processing image ${i + 1} for product update ${existingProduct.id}:`, error.message);
                                        // Save URL as fallback
                                        const imageName = imageUrl.split('/').pop().split('?')[0] || `product-${existingProduct.id}-${i + 1}.jpg`;
                                        await connection.execute(
                                            `INSERT INTO product_images (
                                                product_id, image_name, original_name, image_url, 
                                                alt_text, file_size, mime_type, dimensions, is_thumbnail, sort_order
                                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                            [
                                                existingProduct.id,
                                                imageName,
                                                imageName,
                                                imageUrl,
                                                calculatedProduct.item_name || 'Product Image',
                                                0,
                                                'image/jpeg',
                                                JSON.stringify({ width: 800, height: 800 }),
                                                i === 0,
                                                i
                                            ]
                                        );
                                    }
                                }
                            }
                        }

                        updatedProducts.push({
                            row: rowNumber,
                            productId: existingProduct.id,
                            tagNumber: product.tag_number,
                            sku: existingProduct.sku,
                            itemName: existingProduct.item_name,
                            fieldsUpdated: updateFields.length,
                            updatedFields: updateFields.map(field => field.split(' = ')[0])
                        });
                    } else {
                        updatedProducts.push({
                            row: rowNumber,
                            productId: existingProduct.id,
                            tagNumber: product.tag_number,
                            sku: existingProduct.sku,
                            itemName: existingProduct.item_name,
                            fieldsUpdated: 0,
                            message: 'No changes detected'
                        });
                    }

                } else {
                    // CREATE NEW PRODUCT
                    // Validation already done in validateAndCalculateProduct

                    // Check for duplicate SKU (only for new products)
                    // If SKU exists, generate a new unique SKU instead of throwing error
                    let skuToUse = calculatedProduct.sku;
                    const [existingSku] = await connection.execute(
                        'SELECT id FROM products WHERE sku = ?',
                        [calculatedProduct.sku]
                    );
                    if (existingSku.length > 0) {
                        // SKU already exists - generate a new unique SKU
                        const baseSku = calculatedProduct.sku || 'SKU';
                        let skuCounter = 1;
                        let newSku = `${baseSku}-${skuCounter}`;

                        // Keep generating until we find a unique SKU
                        while (true) {
                            const [checkSku] = await connection.execute(
                                'SELECT id FROM products WHERE sku = ?',
                                [newSku]
                            );
                            if (checkSku.length === 0) {
                                skuToUse = newSku;
                                warnings.push(`Row ${rowNumber}: SKU '${calculatedProduct.sku}' already exists. Using '${skuToUse}' instead.`);
                                break;
                            }
                            skuCounter++;
                            newSku = `${baseSku}-${skuCounter}`;

                            // Safety limit to prevent infinite loop
                            if (skuCounter > 1000) {
                                // Fallback: use timestamp-based SKU
                                const timestamp = Date.now().toString().slice(-6);
                                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                                skuToUse = `${baseSku}-${timestamp}-${random}`;
                                warnings.push(`Row ${rowNumber}: SKU '${calculatedProduct.sku}' already exists. Generated unique SKU '${skuToUse}'.`);
                                break;
                            }
                        }
                    }

                    // Check for duplicate item_name and make it unique if needed
                    // If item_name already exists with different TAG, append TAG to make it unique
                    let itemNameToUse = calculatedProduct.item_name;
                    const [existingItemName] = await connection.execute(
                        'SELECT id, tag_number FROM products WHERE item_name = ?',
                        [calculatedProduct.item_name]
                    );

                    if (existingItemName.length > 0) {
                        // Item name exists - check if it's the same product (same TAG)
                        const existingProductWithSameName = existingItemName.find(p => p.tag_number === calculatedProduct.tag_number);

                        if (existingProductWithSameName) {
                            // Same item_name and same TAG - this should have been caught as update
                            // This shouldn't happen as we already checked for TAG, but handle gracefully
                            errors.push(`Row ${rowNumber}: Product with item_name '${calculatedProduct.item_name}' and TAG '${calculatedProduct.tag_number}' already exists. This should be an update operation.`);
                            continue;
                        } else {
                            // Item name exists but different TAG - make item_name unique by appending TAG
                            itemNameToUse = `${calculatedProduct.item_name} (${calculatedProduct.tag_number})`;
                            warnings.push(`Row ${rowNumber}: Item name '${calculatedProduct.item_name}' already exists. Using '${itemNameToUse}' to avoid duplicate.`);
                        }
                    }

                    // Resolve category IDs (use calculated product)
                    const categoryId = await getCategoryId(calculatedProduct.category_name);
                    const subcategoryId = await getSubcategoryId(calculatedProduct.subcategory_name, categoryId);
                    const subSubcategoryId = await getSubSubcategoryId(calculatedProduct.sub_subcategory_name, subcategoryId);

                    // Generate unique slug based on the item_name we'll use
                    const baseSlug = itemNameToUse.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    let slug = baseSlug;
                    let slugCounter = 1;

                    while (true) {
                        const [existingSlug] = await connection.execute(
                            'SELECT id FROM products WHERE slug = ?',
                            [slug]
                        );
                        if (existingSlug.length === 0) break;
                        slug = `${baseSlug}-${slugCounter}`;
                        slugCounter++;
                    }

                    // Prepare product data with all fields (use calculated values)
                    const productData = {
                        sku: skuToUse, // Use the unique SKU (either original or generated)
                        tag_number: calculatedProduct.tag_number,
                        slug: slug,
                        description: calculatedProduct.description || '',
                        status: calculatedProduct.status || 'active',
                        batch: calculatedProduct.batch || '',
                        item_name: itemNameToUse,
                        stamp: calculatedProduct.stamp || '',
                        remark: calculatedProduct.remark || '',
                        unit: calculatedProduct.unit || 'Piece',
                        pieces: calculatedProduct.pieces,
                        gross_weight: calculatedProduct.gross_weight,
                        less_weight: calculatedProduct.less_weight,
                        net_weight: calculatedProduct.net_weight, // Use calculated net weight
                        additional_weight: calculatedProduct.additional_weight,
                        tunch: calculatedProduct.tunch,
                        wastage_percentage: calculatedProduct.wastage_percentage,
                        rate: calculatedProduct.rate,
                        diamond_weight: calculatedProduct.diamond_weight,
                        stone_weight: calculatedProduct.stone_weight,
                        labour: calculatedProduct.labour, // Use calculated labour cost
                        labour_on: calculatedProduct.labour_on || 'Wt',
                        other: calculatedProduct.other,
                        total_fine_weight: calculatedProduct.total_fine_weight, // Use calculated fine weight
                        total_rs: calculatedProduct.total_rs, // Use calculated total
                        certificate_number: calculatedProduct.certificate_number && calculatedProduct.certificate_number.trim() !== '' ? calculatedProduct.certificate_number : null,
                        design_type: calculatedProduct.design_type || '',
                        manufacturing: calculatedProduct.manufacturing || '',
                        customizable: !!calculatedProduct.customizable,
                        engraving: !!calculatedProduct.engraving,
                        hallmark: !!calculatedProduct.hallmark,
                        category_id: categoryId,
                        subcategory_id: subcategoryId,
                        sub_subcategory_id: subSubcategoryId,
                        metal_id: calculatedProduct.metal_id || null,
                        metal_purity_id: calculatedProduct.metal_purity_id || null
                    };

                    // Insert product
                    const columns = Object.keys(productData);
                    const values = Object.values(productData);
                    const placeholders = columns.map(() => '?').join(', ');

                    const [productResult] = await connection.execute(
                        `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );

                    const productId = productResult.insertId;

                    // Insert product_options (use calculated product or default)
                    // Default product option is created in validateAndCalculateProduct if not provided
                    if (calculatedProduct.product_options && Array.isArray(calculatedProduct.product_options) && calculatedProduct.product_options.length > 0) {
                        for (const option of calculatedProduct.product_options) {
                            await connection.execute(
                                `INSERT INTO product_options (product_id, size, weight, dimensions, metal_color, gender, occasion, value, sell_price)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    productId,
                                    option.size || 'Standard',
                                    option.weight || calculatedProduct.total_fine_weight || calculatedProduct.gross_weight || '0',
                                    option.dimensions || '',
                                    option.metal_color || '',
                                    option.gender || null,
                                    option.occasion || null,
                                    option.value || calculatedProduct.total_rs || 0,
                                    option.sell_price || calculatedProduct.total_rs || 0
                                ]
                            );
                        }
                    }

                    // Insert product_less_weight if provided (use calculated product)
                    if (calculatedProduct.product_less_weight && Array.isArray(calculatedProduct.product_less_weight)) {
                        for (const item of calculatedProduct.product_less_weight) {
                            await connection.execute(
                                `INSERT INTO product_less_weight (product_id, item, stamp, clarity, color, cuts, shapes, remarks, pieces, weight, units, tunch, purchase_rate, sale_rate, total_profit, purchase_value, sale_value)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    productId,
                                    item.item || '',
                                    item.stamp || '',
                                    item.clarity || '',
                                    item.color || '',
                                    item.cuts || '',
                                    item.shapes || '',
                                    item.remarks || '',
                                    item.pieces || 1,
                                    item.weight || item.weight_carat || 0,
                                    item.units || 'carat',
                                    item.tunch || 0,
                                    item.purchase_rate || 0,
                                    item.sale_rate || 0,
                                    item.total_profit || item.profit || 0,
                                    item.purchase_value || 0,
                                    item.sale_value || 0
                                ]
                            );
                        }
                    } else {
                    }

                    // Insert product_features if provided (use calculated product)
                    if (calculatedProduct.product_features && calculatedProduct.product_features.trim() !== '') {
                        // Split comma-separated features and insert each as separate record
                        const featurePoints = calculatedProduct.product_features.split(',').map(f => f.trim()).filter(f => f);
                        for (const featurePoint of featurePoints) {
                            await connection.execute(
                                'INSERT INTO product_features (product_id, feature_points) VALUES (?, ?)',
                                [productId, featurePoint]
                            );
                        }
                    }

                    // Download and save product_images from URLs if provided (from Excel "First Image" column)
                    if (calculatedProduct.product_images && Array.isArray(calculatedProduct.product_images) && calculatedProduct.product_images.length > 0) {
                        for (let i = 0; i < calculatedProduct.product_images.length; i++) {
                            const imageUrl = calculatedProduct.product_images[i];
                            if (imageUrl && imageUrl.trim() !== '') {
                                try {
                                    console.log(`Downloading image ${i + 1} for product ${productId}: ${imageUrl.substring(0, 50)}...`);

                                    // Download image from URL
                                    const downloadResult = await downloadImageFromUrl(
                                        imageUrl,
                                        path.join(process.cwd(), 'public', 'products'),
                                        {
                                            maxWidth: 1200,
                                            maxHeight: 1200,
                                            quality: 85
                                        }
                                    );

                                    if (downloadResult.success) {
                                        // Insert downloaded image into database
                                        await connection.execute(
                                            `INSERT INTO product_images (
                                                product_id, image_name, original_name, image_url, 
                                                alt_text, file_size, mime_type, dimensions, is_thumbnail, sort_order
                                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                            [
                                                productId,
                                                downloadResult.filename,
                                                downloadResult.filename,
                                                downloadResult.url,
                                                calculatedProduct.item_name || 'Product Image',
                                                downloadResult.size || 0,
                                                downloadResult.contentType || 'image/jpeg',
                                                JSON.stringify({
                                                    width: downloadResult.width || 800,
                                                    height: downloadResult.height || 800
                                                }),
                                                i === 0, // First image is thumbnail
                                                i // Sort order
                                            ]
                                        );
                                        console.log(`  ✓ Image saved: ${downloadResult.filename}`);
                                    } else {
                                        console.error(`  ✗ Failed to download image: ${downloadResult.error}`);
                                        // Optionally, you can still save the URL if download fails
                                        const imageName = imageUrl.split('/').pop().split('?')[0] || `product-${productId}-${i + 1}.jpg`;
                                        await connection.execute(
                                            `INSERT INTO product_images (
                                                product_id, image_name, original_name, image_url, 
                                                alt_text, file_size, mime_type, dimensions, is_thumbnail, sort_order
                                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                            [
                                                productId,
                                                imageName,
                                                imageName,
                                                imageUrl, // Save original URL as fallback
                                                calculatedProduct.item_name || 'Product Image',
                                                0,
                                                'image/jpeg',
                                                JSON.stringify({ width: 800, height: 800 }),
                                                i === 0,
                                                i
                                            ]
                                        );
                                    }
                                } catch (error) {
                                    console.error(`Error processing image ${i + 1} for product ${productId}:`, error.message);
                                    // Save URL as fallback
                                    const imageName = imageUrl.split('/').pop().split('?')[0] || `product-${productId}-${i + 1}.jpg`;
                                    await connection.execute(
                                        `INSERT INTO product_images (
                                            product_id, image_name, original_name, image_url, 
                                            alt_text, file_size, mime_type, dimensions, is_thumbnail, sort_order
                                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                        [
                                            productId,
                                            imageName,
                                            imageName,
                                            imageUrl,
                                            calculatedProduct.item_name || 'Product Image',
                                            0,
                                            'image/jpeg',
                                            JSON.stringify({ width: 800, height: 800 }),
                                            i === 0,
                                            i
                                        ]
                                    );
                                }
                            }
                        }
                    }

                    insertedProducts.push({
                        id: productId,
                        item_name: calculatedProduct.item_name,
                        sku: calculatedProduct.sku,
                        tag_number: calculatedProduct.tag_number,
                        row: rowNumber
                    });

                } // End of else block for create new product

            } catch (error) {
                console.error(`Error processing product at row ${rowNumber}:`, error);
                let errorMessage = error.message;

                if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
                    errorMessage = 'Duplicate entry detected';
                } else if (error.code === '23503') {
                    errorMessage = 'Referenced data does not exist';
                }

                // Get product identifier - use validationResult if available, otherwise use original product
                let productIdentifier = '';
                if (typeof validationResult !== 'undefined' && validationResult && validationResult.calculatedProduct) {
                    productIdentifier = validationResult.calculatedProduct.item_name || validationResult.calculatedProduct.tag_number || '';
                } else {
                    productIdentifier = product.item_name || product.tag_number || product.name || '';
                }

                errors.push(`Row ${rowNumber}${productIdentifier ? ` (${productIdentifier})` : ''}: ${errorMessage}`);
            }
        }

        // Calculate totals
        const totalProcessed = insertedProducts.length + updatedProducts.length;
        const totalSuccess = insertedProducts.length + updatedProducts.length;
        const totalFailed = errors.length;

        // STRICT TRANSACTION: If ANY error occurs, rollback ALL changes
        if (errors.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Transaction rolled back due to errors. No data was saved.',
                data: {
                    total: products.length,
                    created: 0,
                    updated: 0,
                    failed: totalFailed,
                    errors: errors,
                    warnings: warnings
                }
            });
        }

        // Only commit if ALL products were processed successfully
        await connection.commit();

        // Create success message
        let successMessage = '';
        if (insertedProducts.length > 0 && updatedProducts.length > 0) {
            successMessage = `Successfully created ${insertedProducts.length} new products and updated ${updatedProducts.length} existing products`;
        } else if (insertedProducts.length > 0) {
            successMessage = `Successfully created ${insertedProducts.length} new products`;
        } else if (updatedProducts.length > 0) {
            successMessage = `Successfully updated ${updatedProducts.length} existing products`;
        }

        if (totalFailed > 0) {
            successMessage += `. ${totalFailed} products failed to process.`;
        }

        // Enhance created and updated products with category names
        const enhancedCreatedProducts = insertedProducts.length > 0 ? await Promise.all(
            insertedProducts.map(async (product) => {
                const categoryNames = await getCategoryNames(product.category_id, product.subcategory_id, product.sub_subcategory_id);
                return {
                    ...product,
                    category_name: categoryNames.category,
                    subcategory_name: categoryNames.subcategory,
                    sub_subcategory_name: categoryNames.sub_subcategory
                };
            })
        ) : undefined;

        const enhancedUpdatedProducts = updatedProducts.length > 0 ? await Promise.all(
            updatedProducts.map(async (product) => {
                const categoryNames = await getCategoryNames(product.category_id, product.subcategory_id, product.sub_subcategory_id);
                return {
                    ...product,
                    category_name: categoryNames.category,
                    subcategory_name: categoryNames.subcategory,
                    sub_subcategory_name: categoryNames.sub_subcategory
                };
            })
        ) : undefined;

        const status = errors.length === 0 ? 200 : 207; // 207 Multi-Status for partial success
        res.status(status).json({
            success: true,
            message: successMessage,
            data: {
                total: products.length,
                created: insertedProducts.length,
                updated: updatedProducts.length,
                failed: totalFailed,
                createdProducts: enhancedCreatedProducts,
                updatedProducts: enhancedUpdatedProducts,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error in bulkUploadProducts:', error);

        // Send detailed error message to frontend
        const errorMessage = error.message || 'Internal server error during bulk upload';
        res.status(500).json({
            success: false,
            message: `Transaction rolled back due to error: ${errorMessage}`,
            error: error.message,
            details: error.sql ? `SQL Error: ${error.sql}` : undefined
        });
    } finally {
        connection.release();
    }
};

const bulkUpdateProducts = async (req, res) => {
    try {
        const { product_ids, updates } = req.body;

        if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Product IDs are required' });
        }

        const placeholders = product_ids.map(() => '?').join(',');

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        Object.keys(updates).forEach(key => {
            if (['name', 'description', 'sell_price', 'discount', 'status'].includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`;
        const values = [...updateValues, ...product_ids];

        await db.execute(query, values);

        res.json({
            success: true,
            message: `${product_ids.length} products updated successfully`
        });
    } catch (error) {
        console.error('Error bulk updating products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk delete products
const bulkDeleteProducts = async (req, res) => {
    const connection = await db.getConnection();
    let transactionStarted = false;
    try {
        const { product_ids } = req.body;

        if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs are required'
            });
        }

        // Start transaction
        await connection.beginTransaction();
        transactionStarted = true;

        const deletedProducts = [];
        const failedDeletions = [];
        let totalImagesDeleted = 0;

        // Process each product
        for (const productId of product_ids) {
            try {
                // Get count of images before deletion for logging
                const [imageCount] = await connection.execute(
                    'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
                    [productId]
                );
                totalImagesDeleted += imageCount[0]?.count || 0;

                // Delete files from server first (pass connection so DB deletion is handled here)
                await deleteProductImages(productId, connection);
                await deleteProductCertificates(productId);
                await deleteProductVideos(productId);

                // Delete all related data from database
                await connection.execute('DELETE FROM product_less_weight WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM product_options WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM product_features WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM cart_items WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM wishlist_items WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM product_certificates WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM product_videos WHERE product_id = ?', [productId]);
                await connection.execute('DELETE FROM products WHERE id = ?', [productId]);

                deletedProducts.push(productId);
            } catch (error) {
                console.error(`Error deleting product ${productId}:`, error);
                failedDeletions.push({
                    product_id: productId,
                    error: error.message
                });
            }
        }

        // Commit transaction if all deletions succeeded
        if (failedDeletions.length === 0) {
            await connection.commit();
            transactionStarted = false;

            res.json({
                success: true,
                message: `Successfully deleted ${deletedProducts.length} product(s) and ${totalImagesDeleted} image(s)`,
                data: {
                    deleted_count: deletedProducts.length,
                    images_deleted: totalImagesDeleted,
                    deleted_product_ids: deletedProducts
                }
            });
        } else {
            // Rollback if any deletion failed
            await connection.rollback();
            transactionStarted = false;

            res.status(400).json({
                success: false,
                message: `Failed to delete some products. ${deletedProducts.length} succeeded, ${failedDeletions.length} failed.`,
                data: {
                    deleted_count: deletedProducts.length,
                    failed_count: failedDeletions.length,
                    failed_deletions: failedDeletions
                }
            });
        }
    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error('❌ Error during ROLLBACK:', rollbackErr);
            }
        }
        console.error('❌ Error bulk deleting products:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    } finally {
        connection.release();
    }
};

// =======================================
// PRODUCT CUSTOMIZATION CONTROLLER
// =======================================

// Get product metal types
const getProductMetalTypes = async (req, res) => {
    try {
        // Get all metal types from the metal_types table
        const [metalTypes] = await db.execute(
            'SELECT * FROM metal_types WHERE is_active = 1 ORDER BY name'
        );
        res.json({ success: true, data: metalTypes });
    } catch (error) {
        console.error('Error getting metal types:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product diamond qualities
const getProductDiamondQualities = async (req, res) => {
    try {
        // Get all diamond qualities from the diamond_qualities table
        const [qualities] = await db.execute(
            'SELECT * FROM diamond_qualities WHERE is_active = 1 ORDER BY name'
        );
        res.json({ success: true, data: qualities });
    } catch (error) {
        console.error('Error getting diamond qualities:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product size options
const getProductSizeOptions = async (req, res) => {
    try {
        // Get all size options from the size_options table
        const [sizes] = await db.execute(
            'SELECT * FROM size_options WHERE is_active = 1 ORDER BY name'
        );
        res.json({ success: true, data: sizes });
    } catch (error) {
        console.error('Error getting size options:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product weight options
const getProductWeightOptions = async (req, res) => {
    try {
        // Get all weight options from the weight_options table
        const [weights] = await db.execute(
            'SELECT * FROM weight_options WHERE is_active = 1 ORDER BY name'
        );
        res.json({ success: true, data: weights });
    } catch (error) {
        console.error('Error getting weight options:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// =======================================
// PRODUCT REVIEWS CONTROLLER
// =======================================

// Get all reviews for admin dashboard
const getAllReviews = async (req, res) => {
    try {
        const [reviews] = await db.execute(`
            SELECT pr.*, 
                   p.item_name as product_name, 
                   u.name as user_name,
                   u.email as user_email
            FROM product_reviews pr
            JOIN products p ON pr.product_id = p.id
            JOIN user u ON pr.user_id = u.id
            ORDER BY pr.created_at DESC
        `);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

// Send message to reviewer
const sendMessageToReviewer = async (req, res) => {
    try {
        const { review_id } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        await db.execute(
            'UPDATE product_reviews SET admin_message = ? WHERE id = ?',
            [message, review_id]
        );

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Get product reviews
const getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Validate and convert parameters to integers
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;

        // First, get product details
        const [productDetails] = await db.execute(`
            SELECT p.id, p.item_name, p.description, 
                   p.discount, p.status, p.created_at as product_created_at,
                   GROUP_CONCAT(DISTINCT c.name) as categories,
                   GROUP_CONCAT(DISTINCT pi.image_url) as product_images
            FROM products p
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN product_images pi ON p.id = pi.product_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [product_id]);

        // Then get reviews with user details
        const [reviews] = await db.execute(`
            SELECT 
                pr.id,
                pr.rating,
                pr.review_text,
                pr.created_at,
                pr.admin_message,
                pr.is_flagged,
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.photo as user_photo,
                p.item_name as product_name,
                p.id as product_id
            FROM product_reviews pr
            LEFT JOIN user u ON pr.user_id = u.id
            LEFT JOIN products p ON pr.product_id = p.id
            WHERE pr.product_id = ?
            ORDER BY pr.created_at DESC
            LIMIT ${limitNum} OFFSET ${offset}
        `, [product_id]);

        // Get review images for each review
        for (const review of reviews) {
            const [images] = await db.execute(
                'SELECT * FROM product_reviews_images WHERE review_id = ?',
                [review.id]
            );
            review.images = images;
        }

        const [total] = await db.execute(
            'SELECT COUNT(*) as total FROM product_reviews WHERE product_id = ?',
            [product_id]
        );

        // Calculate average rating
        const [avgRating] = await db.execute(
            'SELECT AVG(rating) as average_rating FROM product_reviews WHERE product_id = ?',
            [product_id]
        );

        // Get rating distribution
        const [ratingDistribution] = await db.execute(`
            SELECT 
                rating,
                COUNT(*) as count
            FROM product_reviews
            WHERE product_id = ?
            GROUP BY rating
            ORDER BY rating DESC
        `, [product_id]);

        res.json({
            success: true,
            product: productDetails[0] ? {
                ...productDetails[0],
                categories: productDetails[0].categories ? productDetails[0].categories.split(',') : [],
                product_images: productDetails[0].product_images ? productDetails[0].product_images.split(',') : []
            } : null,
            data: reviews.map(review => ({
                ...review,
                created_at: review.created_at,
                rating: parseInt(review.rating),
                is_flagged: Boolean(review.is_flagged)
            })),
            averageRating: avgRating[0].average_rating ? parseFloat(avgRating[0].average_rating).toFixed(1) : '0.0',
            ratingDistribution: ratingDistribution,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total[0].total / limit),
                total_items: total[0].total,
                items_per_page: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create product review
const createProductReview = async (req, res) => {
    try {
        if (!req.body || req.body.rating === undefined || req.body.review_text === undefined) {
            return res.status(400).json({ success: false, message: 'Rating and review_text are required.' });
        }
        const { rating, review_text } = req.body;
        const user_id = req.user.id;
        const { product_id } = req.params;

        // Check if user already reviewed this product
        const [existingReview] = await db.execute(
            'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
            [product_id, user_id]
        );

        if (existingReview.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Insert review
        const [result] = await db.execute(
            'INSERT INTO product_reviews (product_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)',
            [product_id, user_id, rating, review_text]
        );

        const reviewId = result.insertId;

        // Handle image upload if present
        if (req.file) {
            const imageUrl = `/reviews/${req.file.filename}`;
            await db.execute(
                'INSERT INTO product_reviews_images (review_id, image_url) VALUES (?, ?)',
                [reviewId, imageUrl]
            );
        }

        await db.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: { id: reviewId }
        });
    } catch (error) {
        // Rollback transaction on error
        try {
            await db.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        console.error('Error creating review:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete product review
const deleteProductReview = async (req, res) => {
    try {
        const { review_id } = req.params;

        // Check if review exists
        const [review] = await db.execute(
            'SELECT * FROM product_reviews WHERE id = ?',
            [review_id]
        );

        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Delete review images first
        const [reviewImages] = await db.execute(
            'SELECT image_url FROM product_reviews_images WHERE review_id = ?',
            [review_id]
        );

        // Delete image files from server
        for (const image of reviewImages) {
            try {
                const imagePath = path.join(__dirname, '..', 'public', image.image_url.replace(/^\//, ''));
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (error) {
                console.error('Error deleting image file:', error);
            }
        }

        // Delete review images from database
        await db.execute('DELETE FROM product_reviews_images WHERE review_id = ?', [review_id]);

        // Delete the review
        await db.execute('DELETE FROM product_reviews WHERE id = ?', [review_id]);

        await db.query('COMMIT');

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        try {
            await db.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =======================================
// PRODUCT PRICE BREAKUP CONTROLLER
// =======================================

// Price breakup functionality removed

// =======================================
// GET LATEST SIGNATURE PRODUCT (for SignaturePieces.jsx)
// =======================================
// GET BEST-SELLING SIGNATURE PRODUCTS (for SignaturePieces.jsx)
// =======================================
const getLatestSignatureProduct = async (req, res) => {
    try {
        // Get the best-selling 10 products (by most ordered quantity)
        const limit = parseInt(req.query.limit) || 10;
        const [products] = await db.execute(
            `SELECT p.*, COALESCE(SUM(oi.quantity), 0) as total_sold
             FROM products p
             LEFT JOIN order_items oi ON p.id = oi.product_id
             WHERE p.status = 'active'
             GROUP BY p.id
             ORDER BY total_sold DESC, p.created_at DESC
             LIMIT ${limit}`,
            []
        );
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }

        // For each product, fetch details (images, options, price_breakup, reviews with images)
        const productDetails = [];
        for (const product of products) {
            const productId = product.id;
            const [images] = await db.execute(
                'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
                [productId]
            );
            const [productOptions] = await db.execute(
                'SELECT * FROM product_options WHERE product_id = ? ORDER BY sort_order, id',
                [productId]
            );
            const [priceBreakup] = await db.execute(
                'SELECT * FROM product_price_breakup WHERE product_id = ?',
                [productId]
            );
            const [reviews] = await db.execute(
                `SELECT pr.*, u.name as user_name, u.photo as user_photo
                 FROM product_reviews pr
                 LEFT JOIN user u ON pr.user_id = u.id
                 WHERE pr.product_id = ?
                 ORDER BY pr.created_at DESC`,
                [productId]
            );
            // Get review images (grouped by review_id)
            let reviewImagesByReview = {};
            if (reviews.length > 0) {
                const reviewIds = reviews.map(r => r.id);
                if (reviewIds.length > 0) {
                    const [reviewImages] = await db.execute(
                        `SELECT * FROM product_reviews_images WHERE review_id IN (${reviewIds.map(() => '?').join(',')})`,
                        reviewIds
                    );
                    reviewImagesByReview = reviewImages.reduce((acc, img) => {
                        if (!acc[img.review_id]) acc[img.review_id] = [];
                        acc[img.review_id].push(img);
                        return acc;
                    }, {});
                }
            }
            // Attach images to reviews
            const reviewsWithImages = reviews.map(r => ({
                ...r,
                images: reviewImagesByReview[r.id] || []
            }));
            // Compose product data
            productDetails.push({
                ...product,
                images,
                product_options: productOptions,
                // Price breakup functionality removed
                reviews: reviewsWithImages
            });
        }
        res.json({ success: true, data: productDetails });
    } catch (error) {
        console.error('Error getting latest signature products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =======================================
// GET MOST EXPENSIVE LUXURY PRODUCTS (for LatestLuxury.jsx)
// =======================================
const getLatestLuxuryProducts = async (req, res) => {
    try {
        // Get the most expensive 10 products (by highest sell_price first)
        const limit = parseInt(req.query.limit) || 10;
        // Get products with highest sell_price from product_options
        const [products] = await db.execute(
            `SELECT p.*
            FROM products p
            LEFT JOIN product_options po ON p.id = po.product_id
            WHERE p.status = 'active'
            GROUP BY p.id
            ORDER BY COALESCE(MAX(po.sell_price), 0) DESC, p.created_at DESC
            LIMIT ${limit}`,
            []
        );
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }
        // For each product, fetch details (images, options, price_breakup, reviews with images)
        const productDetails = [];
        for (const product of products) {
            const productId = product.id;
            const [images] = await db.execute(
                'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
                [productId]
            );
            const [productOptions] = await db.execute(
                'SELECT * FROM product_options WHERE product_id = ? ORDER BY sort_order, id',
                [productId]
            );
            const [priceBreakup] = await db.execute(
                'SELECT * FROM product_price_breakup WHERE product_id = ?',
                [productId]
            );
            const [reviews] = await db.execute(
                `SELECT pr.*, u.name as user_name, u.photo as user_photo
                 FROM product_reviews pr
                 LEFT JOIN user u ON pr.user_id = u.id
                 WHERE pr.product_id = ?
                 ORDER BY pr.created_at DESC`,
                [productId]
            );
            // Get review images (grouped by review_id)
            let reviewImagesByReview = {};
            if (reviews.length > 0) {
                const reviewIds = reviews.map(r => r.id);
                if (reviewIds.length > 0) {
                    const [reviewImages] = await db.execute(
                        `SELECT * FROM product_reviews_images WHERE review_id IN (${reviewIds.map(() => '?').join(',')})`,
                        reviewIds
                    );
                    reviewImagesByReview = reviewImages.reduce((acc, img) => {
                        if (!acc[img.review_id]) acc[img.review_id] = [];
                        acc[img.review_id].push(img);
                        return acc;
                    }, {});
                }
            }
            // Attach images to reviews
            const reviewsWithImages = reviews.map(r => ({
                ...r,
                images: reviewImagesByReview[r.id] || []
            }));
            // Compose product data
            productDetails.push({
                ...product,
                images,
                product_options: productOptions,
                // Price breakup functionality removed
                reviews: reviewsWithImages
            });
        }
        res.json({ success: true, data: productDetails });
    } catch (error) {
        console.error('Error getting latest luxury products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =======================================
// GET NEW IN PRODUCTS (for Shop.jsx "New In" filter)
// =======================================
const getNewInProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const days = parseInt(req.query.days) || 30; // Products added in last 30 days by default



        // Get products created within the specified number of days
        // Using direct foreign key relationships as per actual database schema
        const [products] = await db.execute(
            `SELECT p.*,
                    GROUP_CONCAT(DISTINCT pi.image_url) as images,
                    c.name as category_name,
                    sc.name as subcategory_name
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
            WHERE p.status = 'active'
            AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ${limit}`,
            [days]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No new products found' });
        }

        // Get product IDs for batch fetching
        const productIds = products.map(p => p.id);

        // Batch fetch all related data
        let allOptions = [];

        if (productIds.length > 0) {
            // Product options
            const [options] = await db.execute(
                `SELECT * FROM product_options WHERE product_id IN (${productIds.map(() => '?').join(',')}) ORDER BY id`,
                productIds
            );
            allOptions = options;
        }

        // Map options to their products
        const optionsByProduct = {};
        allOptions.forEach(opt => {
            if (!optionsByProduct[opt.product_id]) optionsByProduct[opt.product_id] = [];
            optionsByProduct[opt.product_id].push(opt);
        });

        // Process products to format data according to actual schema
        const formattedProducts = products.map(product => {
            const options = optionsByProduct[product.id] || [];

            return {
                ...product,
                images: product.images ? product.images.split(',') : [],
                categories: product.category_name ? [product.category_name] : [],
                subcategories: product.subcategory_name ? [product.subcategory_name] : [],
                product_options: options.length > 0 ? options : undefined
            };
        });



        res.json({
            success: true,
            data: formattedProducts,
            pagination: {
                total_items: formattedProducts.length,
                limit: limit,
                days: days
            }
        });
    } catch (error) {
        console.error('Error getting new in products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =======================================
// GET BESTSELLER PRODUCTS (for Shop.jsx "Bestseller" filter)
// =======================================
const getBestsellerProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;



        // Get products with high ratings (4.5+) or high review counts (50+)
        // Order by rating first, then by review count, then by creation date
        const [products] = await db.execute(
            `SELECT p.*,
                    GROUP_CONCAT(DISTINCT pi.image_url) as images,
                    GROUP_CONCAT(DISTINCT c.name) as categories,
                    GROUP_CONCAT(DISTINCT sc.name) as subcategories,
                    COUNT(pr.id) as review_count,
                    AVG(pr.rating) as average_rating
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c ON pcm.category_id = c.id
            LEFT JOIN subcategories sc ON pcm.subcategory_id = sc.id
            LEFT JOIN product_reviews pr ON p.id = pr.product_id
            WHERE p.status = 'active'
            GROUP BY p.id
            HAVING (average_rating >= 4.5 AND review_count >= 10) 
                OR review_count >= 50
            ORDER BY average_rating DESC, review_count DESC, p.created_at DESC
            LIMIT ${limit}`,
            []
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No bestseller products found' });
        }

        // Get product IDs for batch fetching
        const productIds = products.map(p => p.id);

        // Batch fetch all related data
        let allOptions = [];
        let allPriceBreakups = [];
        let allReviews = [];

        if (productIds.length > 0) {
            // Product options
            const [options] = await db.execute(
                `SELECT * FROM product_options WHERE product_id IN (${productIds.map(() => '?').join(',')}) ORDER BY sort_order, id`,
                productIds
            );
            allOptions = options;

            // Product price breakup
            const [priceBreakups] = await db.execute(
                `SELECT * FROM product_price_breakup WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
                productIds
            );
            allPriceBreakups = priceBreakups;

            // Product reviews
            const [reviews] = await db.execute(
                `SELECT pr.*, u.name as user_name, u.photo as user_photo
                 FROM product_reviews pr
                 LEFT JOIN user u ON pr.user_id = u.id
                 WHERE pr.product_id IN (${productIds.map(() => '?').join(',')})
                 ORDER BY pr.created_at DESC`,
                productIds
            );
            allReviews = reviews;
        }

        // Map data to products
        const optionsByProduct = {};
        allOptions.forEach(opt => {
            if (!optionsByProduct[opt.product_id]) optionsByProduct[opt.product_id] = [];
            optionsByProduct[opt.product_id].push(opt);
        });

        const priceBreakupByProduct = {};
        allPriceBreakups.forEach(pb => {
            priceBreakupByProduct[pb.product_id] = pb;
        });

        const reviewsByProduct = {};
        allReviews.forEach(review => {
            if (!reviewsByProduct[review.product_id]) reviewsByProduct[review.product_id] = [];
            reviewsByProduct[review.product_id].push(review);
        });

        // Process products to format images and categories, and attach related data
        const formattedProducts = products.map(product => {
            const options = optionsByProduct[product.id] || [];
            const total_quantity = options.reduce((sum, opt) => sum + (parseInt(opt.quantity) || 0), 0);

            return {
                ...product,
                images: product.images ? product.images.split(',') : [],
                categories: product.categories ? product.categories.split(',') : [],
                subcategories: product.subcategories ? product.subcategories.split(',') : [],
                average_rating: parseFloat(product.average_rating || 0).toFixed(1),
                total_quantity,
                product_options: options,
                price_breakup: priceBreakupByProduct[product.id] || null,
                reviews: reviewsByProduct[product.id] || []
            };
        });

        res.json({ success: true, data: formattedProducts });
    } catch (error) {
        console.error('Error getting bestseller products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =============================
// PRODUCT CERTIFICATES CRUD (MULTI-FILE)
// =============================
const createProductCertificate = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { certificate_name, certificate_type, issue_date, expiry_date } = req.body;

        // Check if product exists
        const [productRows] = await db.execute('SELECT id, item_name FROM products WHERE id = ?', [product_id]);
        if (productRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productName = productRows[0].item_name;

        // Auto-generate certificate name if not provided
        let autoCertificateName = certificate_name;
        if (!autoCertificateName && req.files && req.files.length > 0) {
            // Use the first file's original name as certificate name
            const firstFile = req.files[0];
            const fileNameWithoutExt = path.basename(firstFile.originalname, path.extname(firstFile.originalname));
            autoCertificateName = `${productName} - ${fileNameWithoutExt}`;
        } else if (!autoCertificateName) {
            // Generate a default name
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
            autoCertificateName = `${productName} - Certificate ${timestamp}`;
        }

        // Insert certificate with auto-generated name
        const [result] = await db.execute(
            'INSERT INTO product_certificates (product_id, certificate_name, certificate_type, issue_date, expiry_date, original_name, certificate_url, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [product_id, autoCertificateName, certificate_type || null, issue_date || null, expiry_date || null,
                req.files && req.files.length > 0 ? req.files[0].originalname : null,
                req.files && req.files.length > 0 ? `/certificates/${req.files[0].filename}` : null,
                req.files && req.files.length > 0 ? req.files[0].size : null,
                req.files && req.files.length > 0 ? req.files[0].mimetype : null]
        );

        const certificateId = result.insertId;

        // Compress PDF files after upload
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const filePath = path.join(__dirname, '..', 'public', 'certificates', file.filename);
                    if (fs.existsSync(filePath)) {
                        const compressionResult = await compressPDF(filePath);
                        if (compressionResult.compressed) {
                            console.log(`✅ PDF compressed: ${file.originalname} - ${compressionResult.compressionRatio}% reduction`);
                            // Update file size in database if compression was successful
                            const newFileStats = fs.statSync(filePath);
                            if (file === req.files[0]) {
                                // Update first certificate record
                                await db.execute(
                                    'UPDATE product_certificates SET file_size = ? WHERE id = ?',
                                    [newFileStats.size, certificateId]
                                );
                            }
                        }
                    }
                } catch (compressError) {
                    console.error(`⚠️ Error compressing PDF ${file.originalname}:`, compressError);
                    // Continue even if compression fails
                }
            }
        }

        // If there are multiple files, create additional certificate records
        if (req.files && req.files.length > 1) {
            for (let i = 1; i < req.files.length; i++) {
                const file = req.files[i];
                const fileNameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
                const additionalCertificateName = `${productName} - ${fileNameWithoutExt}`;

                // Get compressed file size if compression was done
                let fileSize = file.size;
                try {
                    const filePath = path.join(__dirname, '..', 'public', 'certificates', file.filename);
                    if (fs.existsSync(filePath)) {
                        const fileStats = fs.statSync(filePath);
                        fileSize = fileStats.size;
                    }
                } catch (err) {
                    // Use original size if can't get compressed size
                }

                await db.execute(
                    'INSERT INTO product_certificates (product_id, certificate_name, certificate_type, issue_date, expiry_date, original_name, certificate_url, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [product_id, additionalCertificateName, certificate_type || null, issue_date || null, expiry_date || null, file.originalname, `/certificates/${file.filename}`, fileSize, file.mimetype]
                );
            }
        }

        res.status(201).json({ success: true, message: 'Certificate created', data: { id: certificateId } });
    } catch (err) {
        console.error('Error creating certificate:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const getProductCertificates = async (req, res) => {
    try {
        // Check both params (from route) and query (for backward compatibility)
        const product_id = req.params.product_id || req.query.product_id;
        let query = 'SELECT * FROM product_certificates';
        let params = [];
        if (product_id) {
            query += ' WHERE product_id = ?';
            params.push(product_id);
        }
        query += ' ORDER BY created_at DESC';
        const [certRows] = await db.execute(query, params);

        // No need to fetch separate files since each certificate record contains the file info
        res.status(200).json({ success: true, data: certRows });
    } catch (err) {
        console.error('Error fetching certificates:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateProductCertificate = async (req, res) => {
    try {
        const id = req.params.id || req.params.certificate_id || req.params.certificateId;
        const { certificate_name, certificate_type, issue_date, expiry_date } = req.body;

        // Get current certificate
        const [currentCert] = await db.execute('SELECT * FROM product_certificates WHERE id = ?', [id]);
        if (currentCert.length === 0) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        // Update certificate fields if provided
        const updateFields = [];
        const updateValues = [];

        if (certificate_name !== undefined) {
            updateFields.push('certificate_name = ?');
            updateValues.push(certificate_name);
        }
        if (certificate_type !== undefined) {
            updateFields.push('certificate_type = ?');
            updateValues.push(certificate_type || null);
        }
        if (issue_date !== undefined) {
            updateFields.push('issue_date = ?');
            updateValues.push(issue_date || null);
        }
        if (expiry_date !== undefined) {
            updateFields.push('expiry_date = ?');
            updateValues.push(expiry_date || null);
        }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await db.execute(
                `UPDATE product_certificates SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        }

        // Handle new files - replace the current file
        if (req.files && req.files.length > 0) {
            const file = req.files[0]; // Take the first file

            // Delete old file from disk if exists
            if (currentCert[0].certificate_url) {
                const oldPath = path.join(__dirname, '..', 'public', currentCert[0].certificate_url.replace(/^\//, ''));
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch { }
                }
            }

            // Compress the new PDF file
            let finalFileSize = file.size;
            try {
                const filePath = path.join(__dirname, '..', 'public', 'certificates', file.filename);
                if (fs.existsSync(filePath)) {
                    const compressionResult = await compressPDF(filePath);
                    if (compressionResult.compressed) {
                        console.log(`✅ PDF compressed: ${file.originalname} - ${compressionResult.compressionRatio}% reduction`);
                        finalFileSize = compressionResult.finalSize;
                    } else {
                        // Get actual file size after any processing
                        const fileStats = fs.statSync(filePath);
                        finalFileSize = fileStats.size;
                    }
                }
            } catch (compressError) {
                console.error(`⚠️ Error compressing PDF ${file.originalname}:`, compressError);
                // Use original size if compression fails
            }

            // Update certificate with new file info (use compressed size if available)
            await db.execute(
                'UPDATE product_certificates SET original_name = ?, certificate_url = ?, file_size = ?, mime_type = ? WHERE id = ?',
                [file.originalname, `/certificates/${file.filename}`, finalFileSize, file.mimetype, id]
            );
        }

        res.status(200).json({ success: true, message: 'Certificate updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteProductCertificate = async (req, res) => {
    try {
        const id = req.params.id || req.params.certificate_id || req.params.certificateId;

        // Get certificate file info
        const [cert] = await db.execute('SELECT certificate_url FROM product_certificates WHERE id = ?', [id]);
        if (cert.length === 0) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        // Delete file from disk if exists
        if (cert[0].certificate_url) {
            const filePath = path.join(__dirname, '..', 'public', cert[0].certificate_url.replace(/^\//, ''));
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch { }
            }
        }

        // Delete certificate record
        await db.execute('DELETE FROM product_certificates WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Certificate deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Helper function to compress PDF using pdf-lib
const compressPDF = async (pdfPath) => {
    try {
        const pdfLib = require('pdf-lib');
        const fileStats = fs.statSync(pdfPath);
        const originalSize = fileStats.size;

        // Only compress if file is larger than 1MB
        if (originalSize <= 1 * 1024 * 1024) {
            return { compressed: false, originalSize, finalSize: originalSize };
        }

        // Read the PDF file
        const pdfBytes = fs.readFileSync(pdfPath);

        // Load PDF document
        const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes);

        // Save the PDF with optimization (removes unnecessary objects)
        const optimizedPdfBytes = await pdfDoc.save({
            useObjectStreams: false, // Disable object streams for better compression
            addDefaultPage: false
        });

        // Only replace if compression actually reduced size (at least 5% reduction)
        const compressionRatio = ((originalSize - optimizedPdfBytes.length) / originalSize) * 100;

        if (compressionRatio > 5) {
            // Create temporary file
            const tempPath = pdfPath + '.temp';
            fs.writeFileSync(tempPath, optimizedPdfBytes);

            // Replace original with compressed version
            fs.unlinkSync(pdfPath);
            fs.renameSync(tempPath, pdfPath);

            return {
                compressed: true,
                originalSize,
                finalSize: optimizedPdfBytes.length,
                compressionRatio: parseFloat(compressionRatio.toFixed(2))
            };
        } else {
            return { compressed: false, originalSize, finalSize: originalSize };
        }
    } catch (error) {
        console.error(`❌ Error compressing PDF ${pdfPath}:`, error);
        // If compression fails, return original file info
        try {
            const fileStats = fs.statSync(pdfPath);
            return { compressed: false, originalSize: fileStats.size, finalSize: fileStats.size, error: error.message };
        } catch {
            return { compressed: false, originalSize: 0, finalSize: 0, error: error.message };
        }
    }
};

// Multer configuration for certificate uploads (PDF only)
const certificateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'public/certificates/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const productId = req.params.product_id || 'temp';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const extension = path.extname(file.originalname);
        const uniqueName = `certificate_${productId}_${timestamp}_${random}${extension}`;
        cb(null, uniqueName);
    }
});
const certificateUpload = multer({
    storage: certificateStorage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for certificates
    },
    fileFilter: function (req, file, cb) {
        // Only allow PDF files
        const extname = path.extname(file.originalname).toLowerCase();
        const mimetype = file.mimetype.toLowerCase();
        const isPdf = extname === '.pdf' && (mimetype === 'application/pdf' || mimetype === 'application/x-pdf');
        if (isPdf) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for certificates!'));
        }
    }
});

// File upload for certificate_files (multiple) - PDF only
const uploadCertificateFiles = (req, res, next) => {
    // Create a custom multer instance that accepts both field names
    const flexibleUpload = multer({
        storage: certificateStorage,
        limits: {
            fileSize: 100 * 1024 * 1024 // 100MB limit for certificates
        },
        fileFilter: function (req, file, cb) {
            // Only allow PDF files
            const extname = path.extname(file.originalname).toLowerCase();
            const mimetype = file.mimetype.toLowerCase();
            const isPdf = extname === '.pdf' && (mimetype === 'application/pdf' || mimetype === 'application/x-pdf');
            if (isPdf) {
                return cb(null, true);
            } else {
                cb(new Error('Only PDF files are allowed for certificates!'));
            }
        }
    });

    // Use fields to accept both field names
    flexibleUpload.fields([
        { name: 'certificates', maxCount: 10 },
        { name: 'certificate_files', maxCount: 10 }
    ])(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error'
            });
        }

        // Combine files from both field names into req.files
        if (req.files) {
            const allFiles = [];
            if (req.files.certificates) {
                allFiles.push(...req.files.certificates);
            }
            if (req.files.certificate_files) {
                allFiles.push(...req.files.certificate_files);
            }
            req.files = allFiles;
        }

        next();
    });
};

// =======================================
// PRODUCT REVIEW FLAG CONTROLLER
// =======================================

// Add this after other review controllers
const flagReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const { is_flagged } = req.body;
        if (typeof is_flagged !== 'boolean') {
            return res.status(400).json({ success: false, message: 'is_flagged must be a boolean.' });
        }
        // Update the review
        const [result] = await db.execute(
            'UPDATE product_reviews SET is_flagged = ? WHERE id = ?',
            [is_flagged, review_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }
        // Return the updated review
        const [rows] = await db.execute('SELECT * FROM product_reviews WHERE id = ?', [review_id]);
        res.json({ success: true, message: 'Review flag updated.', data: rows[0] });
    } catch (error) {
        console.error('Error flagging review:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =======================================
// PRODUCT FEATURES CONTROLLER
// =======================================

// Get product features
const getProductFeatures = async (req, res) => {
    try {
        const { product_id } = req.params;
        const [features] = await db.execute(
            'SELECT * FROM product_features WHERE product_id = ? ORDER BY id',
            [product_id]
        );
        res.json({ success: true, data: features });
    } catch (error) {
        console.error('Error getting product features:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create product features (multiple)
const createProductFeature = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { feature_points } = req.body;

        if (!feature_points) {
            return res.status(400).json({ success: false, message: 'feature_points is required' });
        }

        // Check if product exists
        const [productCheck] = await db.execute('SELECT id FROM products WHERE id = ?', [product_id]);
        if (productCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Split feature points by comma and create separate records
        const featurePointsArray = feature_points.split(',').map(point => point.trim()).filter(point => point !== '');

        if (featurePointsArray.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one feature point is required' });
        }

        const createdFeatures = [];

        for (const point of featurePointsArray) {
            const [result] = await db.execute(
                'INSERT INTO product_features (product_id, feature_points) VALUES (?, ?)',
                [product_id, point]
            );

            const [newFeature] = await db.execute('SELECT * FROM product_features WHERE id = ?', [result.insertId]);
            createdFeatures.push(newFeature[0]);
        }

        res.status(201).json({ success: true, data: createdFeatures });
    } catch (error) {
        console.error('Error creating product features:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update product features (delete old and create new)
const updateProductFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const { feature_points } = req.body;

        if (!feature_points) {
            return res.status(400).json({ success: false, message: 'feature_points is required' });
        }

        // Handle case when id is 'new' (no existing features)
        if (id === 'new') {
            return res.status(400).json({ success: false, message: 'Product ID is required for creating features' });
        }

        // Get the product_id from the existing feature record
        const [existingFeature] = await db.execute('SELECT product_id FROM product_features WHERE id = ?', [id]);
        if (existingFeature.length === 0) {
            return res.status(404).json({ success: false, message: 'Product feature not found' });
        }

        const product_id = existingFeature[0].product_id;

        // Check if product exists
        const [productCheck] = await db.execute('SELECT id FROM products WHERE id = ?', [product_id]);
        if (productCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Delete existing features for this product
        await db.execute('DELETE FROM product_features WHERE product_id = ?', [product_id]);

        // Split feature points by comma and create separate records
        const featurePointsArray = feature_points.split(',').map(point => point.trim()).filter(point => point !== '');

        if (featurePointsArray.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one feature point is required' });
        }

        const updatedFeatures = [];

        for (const point of featurePointsArray) {
            const [result] = await db.execute(
                'INSERT INTO product_features (product_id, feature_points) VALUES (?, ?)',
                [product_id, point]
            );

            const [newFeature] = await db.execute('SELECT * FROM product_features WHERE id = ?', [result.insertId]);
            updatedFeatures.push(newFeature[0]);
        }

        res.json({ success: true, data: updatedFeatures });
    } catch (error) {
        console.error('Error updating product features:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete product feature
const deleteProductFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM product_features WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Product feature not found' });
        }

        res.json({ success: true, message: 'Product feature deleted successfully' });
    } catch (error) {
        console.error('Error deleting product feature:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// =======================================
// PRODUCT COMPARISON CONTROLLERS
// =======================================

// Get similar products for comparison (same category and subcategory)
const getSimilarProductsForComparison = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { limit = 10 } = req.query;

        // First get the current product's category and subcategory
        // Try product_category_map first, then fallback to products table directly
        const [currentProduct] = await db.execute(`
            SELECT p.id, p.item_name, p.slug, p.discount, p.status,
                   COALESCE(c1.name, c2.name) as category_name,
                   COALESCE(sc1.name, sc2.name) as subcategory_name,
                   COALESCE(pcm.category_id, p.category_id) as category_id,
                   COALESCE(pcm.subcategory_id, p.subcategory_id) as subcategory_id,
                   (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image
            FROM products p
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c1 ON pcm.category_id = c1.id
            LEFT JOIN subcategories sc1 ON pcm.subcategory_id = sc1.id
            LEFT JOIN categories c2 ON p.category_id = c2.id
            LEFT JOIN subcategories sc2 ON p.subcategory_id = sc2.id
            WHERE p.id = ? AND p.status = 'active'
        `, [product_id]);

        if (currentProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = currentProduct[0];

        // Get category and subcategory IDs (from either product_category_map or products table)
        const categoryId = product.category_id;
        const subcategoryId = product.subcategory_id;

        // Check if product has category
        if (!categoryId) {
            return res.json({
                success: true,
                data: {
                    current_product: {
                        id: product.id,
                        name: product.item_name,
                        slug: product.slug,
                        discount: product.discount,
                        category: product.category_name,
                        subcategory: product.subcategory_name,
                        image: product.main_image
                    },
                    similar_products: []
                }
            });
        }

        // Build query based on whether subcategory exists
        let similarProductsQuery;
        let similarProductsParams;

        if (subcategoryId) {
            // Match both category and subcategory
            similarProductsQuery = `
                SELECT DISTINCT p.id, p.item_name, p.slug, p.discount, p.status, p.created_at,
                       COALESCE(c1.name, c2.name) as category_name,
                       COALESCE(sc1.name, sc2.name) as subcategory_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                       (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
                       (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id) as avg_rating,
                       (SELECT MIN(sell_price) FROM product_options WHERE product_id = p.id) as min_price,
                       (SELECT MAX(sell_price) FROM product_options WHERE product_id = p.id) as max_price
                FROM products p
                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                LEFT JOIN categories c1 ON pcm.category_id = c1.id
                LEFT JOIN subcategories sc1 ON pcm.subcategory_id = sc1.id
                LEFT JOIN categories c2 ON p.category_id = c2.id
                LEFT JOIN subcategories sc2 ON p.subcategory_id = sc2.id
                WHERE (
                    (pcm.category_id = ? AND pcm.subcategory_id = ?) OR
                    (p.category_id = ? AND p.subcategory_id = ?)
                )
                AND p.id != ? 
                AND p.status = 'active'
                ORDER BY p.created_at DESC
                LIMIT ${parseInt(limit)}
            `;
            similarProductsParams = [categoryId, subcategoryId, categoryId, subcategoryId, product_id];
        } else {
            // Match only by category
            similarProductsQuery = `
                SELECT DISTINCT p.id, p.item_name, p.slug, p.discount, p.status, p.created_at,
                       COALESCE(c1.name, c2.name) as category_name,
                       COALESCE(sc1.name, sc2.name) as subcategory_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                       (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
                       (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id) as avg_rating,
                       (SELECT MIN(sell_price) FROM product_options WHERE product_id = p.id) as min_price,
                       (SELECT MAX(sell_price) FROM product_options WHERE product_id = p.id) as max_price
                FROM products p
                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                LEFT JOIN categories c1 ON pcm.category_id = c1.id
                LEFT JOIN subcategories sc1 ON pcm.subcategory_id = sc1.id
                LEFT JOIN categories c2 ON p.category_id = c2.id
                LEFT JOIN subcategories sc2 ON p.subcategory_id = sc2.id
                WHERE (
                    pcm.category_id = ? OR p.category_id = ?
                )
                AND p.id != ? 
                AND p.status = 'active'
                ORDER BY p.created_at DESC
                LIMIT ${parseInt(limit)}
            `;
            similarProductsParams = [categoryId, categoryId, product_id];
        }

        const [similarProducts] = await db.execute(similarProductsQuery, similarProductsParams);

        // If no similar products in same category/subcategory, get products from same category only
        let fallbackProducts = [];
        if (similarProducts.length === 0 && categoryId) {
            const [categoryProducts] = await db.execute(`
                SELECT DISTINCT p.id, p.item_name, p.slug, p.discount, p.status, p.created_at,
                       COALESCE(c1.name, c2.name) as category_name,
                       COALESCE(sc1.name, sc2.name) as subcategory_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                       (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
                       (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id) as avg_rating,
                       (SELECT MIN(sell_price) FROM product_options WHERE product_id = p.id) as min_price,
                       (SELECT MAX(sell_price) FROM product_options WHERE product_id = p.id) as max_price
                FROM products p
                LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
                LEFT JOIN categories c1 ON pcm.category_id = c1.id
                LEFT JOIN subcategories sc1 ON pcm.subcategory_id = sc1.id
                LEFT JOIN categories c2 ON p.category_id = c2.id
                LEFT JOIN subcategories sc2 ON p.subcategory_id = sc2.id
                WHERE (
                    pcm.category_id = ? OR p.category_id = ?
                )
                AND p.id != ? 
                AND p.status = 'active'
                ORDER BY p.created_at DESC
                LIMIT ${parseInt(limit)}
            `, [categoryId, categoryId, product_id]);
            fallbackProducts = categoryProducts;
        }

        const productsToShow = similarProducts.length > 0 ? similarProducts : fallbackProducts;

        // Format the response
        const formattedProducts = productsToShow.map(p => ({
            id: p.id,
            name: p.item_name,
            slug: p.slug,
            current_price: p.min_price || 0,
            original_price: p.max_price || 0,
            discount: p.discount,
            category: p.category_name,
            subcategory: p.subcategory_name,
            image: p.main_image,
            review_count: p.review_count || 0,
            avg_rating: p.avg_rating ? parseFloat(p.avg_rating).toFixed(1) : '0.0'
        }));

        res.json({
            success: true,
            data: {
                current_product: {
                    id: product.id,
                    name: product.item_name,
                    slug: product.slug,
                    discount: product.discount,
                    category: product.category_name,
                    subcategory: product.subcategory_name,
                    image: product.main_image
                },
                similar_products: formattedProducts
            }
        });

    } catch (error) {
        console.error('Error getting similar products for comparison:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get detailed comparison data for two products
const getProductComparison = async (req, res) => {
    try {
        const { product1_id, product2_id } = req.params;

        if (!product1_id || !product2_id) {
            return res.status(400).json({
                success: false,
                message: 'Both product IDs are required'
            });
        }

        // Get detailed information for both products
        const [products] = await db.execute(`
            SELECT 
                p.id, p.item_name, p.slug, p.description, p.discount, 
                p.status, p.created_at, p.updated_at,
                COALESCE(c1.name, c2.name) as category_name, 
                COALESCE(sc1.name, sc2.name) as subcategory_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
                (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id) as avg_rating,
                (SELECT MIN(sell_price) FROM product_options WHERE product_id = p.id) as min_price,
                (SELECT MAX(sell_price) FROM product_options WHERE product_id = p.id) as max_price
            FROM products p
            LEFT JOIN product_category_map pcm ON p.id = pcm.product_id
            LEFT JOIN categories c1 ON pcm.category_id = c1.id
            LEFT JOIN subcategories sc1 ON pcm.subcategory_id = sc1.id
            LEFT JOIN categories c2 ON p.category_id = c2.id
            LEFT JOIN subcategories sc2 ON p.subcategory_id = sc2.id
            WHERE p.id IN (?, ?) AND p.status = 'active'
        `, [product1_id, product2_id]);

        if (products.length !== 2) {
            return res.status(404).json({
                success: false,
                message: 'One or both products not found'
            });
        }

        // Check if both products have valid data
        const validProducts = products.filter(p => p.id && p.item_name);
        if (validProducts.length !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product data'
            });
        }

        // Get product options for both products
        const [productOptions] = await db.execute(`
            SELECT product_id, size, weight, metal_color, dimensions, gender, occasion, value, sell_price
            FROM product_options 
            WHERE product_id IN (?, ?)
            ORDER BY product_id, sell_price ASC
        `, [product1_id, product2_id]);

        // Get product images for both products
        const [productImages] = await db.execute(`
            SELECT product_id, image_url, is_thumbnail
            FROM product_images 
            WHERE product_id IN (?, ?)
            ORDER BY product_id, is_thumbnail DESC, id ASC
        `, [product1_id, product2_id]);

        // Organize the data
        const product1 = products.find(p => p.id == product1_id);
        const product2 = products.find(p => p.id == product2_id);

        const product1Options = productOptions.filter(opt => opt.product_id == product1_id) || [];
        const product2Options = productOptions.filter(opt => opt.product_id == product2_id) || [];

        const product1Images = productImages.filter(img => img.product_id == product1_id) || [];
        const product2Images = productImages.filter(img => img.product_id == product2_id) || [];

        // Format the response
        const formatProduct = (product, options, images) => ({
            id: product.id,
            name: product.item_name,
            slug: product.slug,
            description: product.description,
            discount: product.discount,
            category: product.category_name,
            subcategory: product.subcategory_name,
            main_image: product.main_image,
            review_count: product.review_count || 0,
            avg_rating: product.avg_rating ? parseFloat(product.avg_rating).toFixed(1) : '0.0',
            created_at: product.created_at,
            updated_at: product.updated_at,
            specifications: {
                // Specifications are now part of the products table
                // These fields are now directly in the product object
            },
            // Price breakup functionality removed
            options: options.map(opt => ({
                size: opt.size,
                weight: opt.weight,
                metal_color: opt.metal_color,
                dimensions: opt.dimensions,
                gender: opt.gender,
                occasion: opt.occasion,
                value: opt.value,
                price: opt.sell_price
            })),
            images: images.map(img => ({
                url: img.image_url,
                is_primary: img.is_thumbnail
            }))
        });

        const comparisonData = {
            product1: formatProduct(product1, product1Options, product1Images),
            product2: formatProduct(product2, product2Options, product2Images)
        };

        res.json({
            success: true,
            data: comparisonData
        });

    } catch (error) {
        console.error('Error getting product comparison:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Restock product (admin only)
const restockProduct = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { quantity = 1 } = req.body;

        // Check if product exists
        const [products] = await db.execute(
            'SELECT * FROM products WHERE id = ?',
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Update product options quantity
        await db.execute(
            'UPDATE product_options SET quantity = quantity + ? WHERE product_id = ?',
            [quantity, product_id]
        );

        // Log the restock action in inventory_logs table
        await db.execute(
            'INSERT INTO inventory_logs (product_id, change_type, quantity, reason) VALUES (?, ?, ?, ?)',
            [product_id, 'in', quantity, 'Admin restock from wishlist monitoring']
        );

        res.json({
            success: true,
            message: 'Product restocked successfully'
        });
    } catch (error) {
        console.error('Error restocking product:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =======================================
// PRODUCT SECTIONS CONTROLLER
// =======================================

// Get products by section
const getProductsBySection = async (req, res) => {
    try {
        const { section_name } = req.params;

        // Validate section name
        const validSections = ['latest_luxury', 'similar_products', 'you_may_also_like', 'signature_pieces'];
        if (!validSections.includes(section_name)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section name'
            });
        }

        let products = [];
        let productIds = [];

        if (section_name === 'latest_luxury') {
            // For latest luxury: Get most expensive products (highest sell_price)
            const [luxuryProducts] = await db.execute(`
                SELECT 
                    p.*,
                    COALESCE(MAX(po.sell_price), 0) as max_price
                FROM products p
                LEFT JOIN product_options po ON p.id = po.product_id
                WHERE p.status = 'active'
                GROUP BY p.id
                HAVING max_price > 0
                ORDER BY max_price DESC, p.created_at DESC
                LIMIT 10
            `);
            products = luxuryProducts;
        } else if (section_name === 'signature_pieces') {
            // For signature pieces: Get best-selling products (most ordered)
            // Only show products that have actually been sold (exist in order_items)
            const [signatureProducts] = await db.execute(`
                SELECT 
                    p.*,
                    COALESCE(SUM(oi.quantity), 0) as total_sold
                FROM products p
                INNER JOIN order_items oi ON p.id = oi.product_id
                WHERE p.status = 'active'
                GROUP BY p.id
                HAVING total_sold > 0
                ORDER BY total_sold DESC, p.created_at DESC
                LIMIT 10
            `);
            products = signatureProducts;
        } else {
            // For other sections: Use existing logic with product_sections table
            const [sectionProducts] = await db.execute(`
      SELECT 
        p.*,
        ps.sort_order,
        ps.is_active as section_active
      FROM products p
      INNER JOIN product_sections ps ON p.id = ps.product_id
      WHERE ps.section_name = ? 
      AND ps.is_active = 1 
      AND p.status = 'active'
      ORDER BY ps.sort_order ASC, p.created_at DESC
      LIMIT 10
    `, [section_name]);
            products = sectionProducts;
        }

        if (!products.length) {
            return res.json({ success: true, data: [] });
        }

        // Get all product IDs
        productIds = products.map(p => p.id);

        // Fetch related data in bulk
        const [images] = await db.execute(
            `SELECT * FROM product_images WHERE product_id IN (${productIds.map(() => '?').join(',')}) ORDER BY sort_order ASC`, productIds
        );
        const [options] = await db.execute(
            `SELECT * FROM product_options WHERE product_id IN (${productIds.map(() => '?').join(',')})`, productIds
        );

        // Attach details to each product
        const detailedProducts = products.map(product => ({
            ...product,
            images: images.filter(img => img.product_id === product.id),
            product_options: options.filter(opt => opt.product_id === product.id),
        }));

        res.json({
            success: true,
            data: detailedProducts
        });
    } catch (error) {
        console.error('Error getting products by section:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all product sections (admin)
const getAllProductSections = async (req, res) => {
    try {
        const [sections] = await db.execute(`
            SELECT 
                ps.*,
                p.item_name as product_name,
                p.slug as product_slug,
                p.status as product_status
            FROM product_sections ps
            INNER JOIN products p ON ps.product_id = p.id
            ORDER BY ps.section_name ASC, ps.sort_order ASC
        `);

        res.json({
            success: true,
            data: sections
        });
    } catch (error) {
        console.error('Error getting all product sections:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add product to section
const addProductToSection = async (req, res) => {
    try {
        const { product_id, section_name, sort_order = 0 } = req.body;

        // Validate section name
        const validSections = ['latest_luxury', 'similar_products', 'you_may_also_like', 'signature_pieces'];
        if (!validSections.includes(section_name)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section name'
            });
        }

        // Check if product exists
        const [product] = await db.execute(
            'SELECT id, name FROM products WHERE id = ?',
            [product_id]
        );

        if (product.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Add product to section
        await db.execute(`
            INSERT INTO product_sections (product_id, section_name, sort_order) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            sort_order = VALUES(sort_order),
            is_active = 1,
            updated_at = CURRENT_TIMESTAMP
        `, [product_id, section_name, sort_order]);

        res.json({
            success: true,
            message: 'Product added to section successfully'
        });
    } catch (error) {
        console.error('Error adding product to section:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Remove product from section
const removeProductFromSection = async (req, res) => {
    try {
        const { product_id, section_name } = req.params;

        // Validate section name
        const validSections = ['latest_luxury', 'similar_products', 'you_may_also_like', 'signature_pieces'];
        if (!validSections.includes(section_name)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section name'
            });
        }

        await db.execute(`
            DELETE FROM product_sections 
            WHERE product_id = ? AND section_name = ?
        `, [product_id, section_name]);

        res.json({
            success: true,
            message: 'Product removed from section successfully'
        });
    } catch (error) {
        console.error('Error removing product from section:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update product section order
const updateProductSectionOrder = async (req, res) => {
    try {
        const { section_name } = req.params;
        const { products } = req.body; // Array of {product_id, sort_order}

        // Validate section name
        const validSections = ['latest_luxury', 'similar_products', 'you_may_also_like', 'signature_pieces'];
        if (!validSections.includes(section_name)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section name'
            });
        }

        // Update sort order for each product
        for (const product of products) {
            await db.execute(`
                UPDATE product_sections 
                SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
                WHERE product_id = ? AND section_name = ?
            `, [product.sort_order, product.product_id, section_name]);
        }

        res.json({
            success: true,
            message: 'Section order updated successfully'
        });
    } catch (error) {
        console.error('Error updating product section order:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get available products for section (admin)
const getAvailableProductsForSection = async (req, res) => {
    try {
        const { section_name } = req.params;

        // Validate section name
        const validSections = ['latest_luxury', 'similar_products', 'you_may_also_like', 'signature_pieces'];
        if (!validSections.includes(section_name)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section name'
            });
        }

        // Get products that are not in this section
        const [products] = await db.execute(`
            SELECT 
                p.id,
                p.item_name,
                p.slug,
                p.status,
                p.created_at
            FROM products p
            WHERE p.status = 'active'
            AND p.id NOT IN (
                SELECT product_id 
                FROM product_sections 
                WHERE section_name = ?
            )
            ORDER BY p.item_name ASC
        `, [section_name]);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error getting available products for section:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get certificates for user's ordered products
const getUserProductCertificates = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        // Get all products that the user has ordered
        const [orderedProducts] = await db.execute(`
            SELECT DISTINCT oi.product_id, p.item_name as product_name, p.slug as product_slug, o.created_at
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, [userId]);

        if (orderedProducts.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Get certificates for all ordered products
        const productIds = orderedProducts.map(p => p.product_id);
        const placeholders = productIds.map(() => '?').join(',');

        const [certificates] = await db.execute(`
            SELECT pc.*, p.item_name as product_name, p.slug as product_slug
            FROM product_certificates pc
            JOIN products p ON pc.product_id = p.id
            WHERE pc.product_id IN (${placeholders})
            AND pc.certificate_name IS NOT NULL 
            AND pc.certificate_name != ''
            AND p.id IS NOT NULL
            ORDER BY pc.created_at DESC
        `, productIds);

        // Get certificate files for each certificate
        const certificatesWithFiles = await Promise.all(certificates.map(async (cert) => {
            const [files] = await db.execute(
                'SELECT * FROM product_certificate_files WHERE certificate_id = ?',
                [cert.id]
            );
            return {
                ...cert,
                files: files
            };
        }));

        res.json({
            success: true,
            data: certificatesWithFiles
        });
    } catch (error) {
        console.error('Error getting user product certificates:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =======================================
// PRODUCT BANNER CMS CONTROLLER
// =======================================

// Get banner by device type
const getProductBanner = async (req, res) => {
    try {
        const deviceType = req.query.device_type || 'desktop';

        // Validate device type
        if (!['desktop', 'mobile'].includes(deviceType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid device type. Must be desktop or mobile'
            });
        }

        const [banners] = await db.execute(
            'SELECT * FROM product_banner WHERE device_type = ? AND is_active = true LIMIT 1',
            [deviceType]
        );

        if (!banners || banners.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No ${deviceType} banner found`
            });
        }

        res.json({
            success: true,
            data: banners[0]
        });
    } catch (error) {
        console.error('Error getting product banner:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create or update banner (admin only)
const createOrUpdateBanner = async (req, res) => {
    try {
        const { title, subtitle, device_type = 'desktop' } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        // Validate device type
        if (!['desktop', 'mobile'].includes(device_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid device type. Must be desktop or mobile'
            });
        }

        // Get the file path if an image was uploaded
        let background_image = null;
        if (req.file) {
            try {
                // Compress image using Sharp (max 1MB)
                const sharp = require('sharp');
                const fs = require('fs');
                const inputPath = req.file.path;
                const outputPath = inputPath.replace(/\.[^/.]+$/, '_compressed.jpg');

                // Helper function to compress to 1MB
                const maxSizeBytes = 1000 * 1024; // 1MB
                const originalStats = fs.statSync(inputPath);
                let quality = 85;
                let finalPath = outputPath;

                if (originalStats.size <= maxSizeBytes) {
                    fs.copyFileSync(inputPath, outputPath);
                } else {
                    // Compress with decreasing quality until under 1MB
                    while (quality > 30) {
                        await sharp(inputPath)
                            .rotate() // Auto-rotate based on EXIF
                            .jpeg({ quality: quality, mozjpeg: true, progressive: true })
                            .toFile(finalPath);

                        const stats = fs.statSync(finalPath);
                        if (stats.size <= maxSizeBytes) {
                            break;
                        }
                        quality -= 10;
                    }

                    // If still too large, resize
                    const stats = fs.statSync(finalPath);
                    if (stats.size > maxSizeBytes) {
                        const metadata = await sharp(finalPath).metadata();
                        const newWidth = Math.floor(metadata.width * 0.8);
                        const newHeight = Math.floor(metadata.height * 0.8);

                        await sharp(inputPath)
                            .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
                            .rotate()
                            .jpeg({ quality: 75, mozjpeg: true, progressive: true })
                            .toFile(finalPath);
                    }
                }

                // Delete original file and rename compressed file
                if (fs.existsSync(inputPath)) {
                    fs.unlinkSync(inputPath);
                }
                fs.renameSync(finalPath, inputPath);

                background_image = `/product_banner/${req.file.filename}`;
            } catch (error) {
                console.error('Error compressing image:', error);
                background_image = `/product_banner/${req.file.filename}`;
            }
        }

        // Check if banner exists for this device type
        const [existingBanner] = await db.execute(
            'SELECT * FROM product_banner WHERE device_type = ?',
            [device_type]
        );

        if (existingBanner.length > 0) {
            // Update existing banner
            const updates = [];
            const values = [];

            updates.push('title = ?');
            values.push(title);

            updates.push('subtitle = ?');
            values.push(subtitle || null);

            if (background_image) {
                updates.push('background_image = ?');
                values.push(background_image);

                // Delete old image if it exists and is different from the new one
                if (existingBanner[0].background_image) {
                    try {
                        const oldImagePath = path.join(__dirname, '..', 'public', existingBanner[0].background_image.replace(/^\//, ''));
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    } catch (error) {
                        console.error('Error deleting old image:', error);
                    }
                }
            }

            // Add WHERE clause to update specific banner
            const query = `UPDATE product_banner SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE device_type = ?`;
            values.push(device_type);
            await db.execute(query, values);

            res.json({
                success: true,
                message: 'Banner updated successfully'
            });
        } else {
            // Create new banner
            if (!background_image) {
                return res.status(400).json({
                    success: false,
                    message: 'Background image is required for initial banner creation'
                });
            }

            await db.execute(
                'INSERT INTO product_banner (title, subtitle, background_image, device_type) VALUES (?, ?, ?, ?)',
                [title, subtitle || null, background_image, device_type]
            );

            res.status(201).json({
                success: true,
                message: `${device_type} banner created successfully`
            });
        }
    } catch (error) {
        console.error('Error managing banner:', error);
        // Delete uploaded file if there was an error
        if (req.file) {
            const filePath = path.join(__dirname, '..', 'public', 'product_banner', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get product with all AddProductPopup data
const getProductWithFullData = async (req, res) => {
    try {
        const { id } = req.params;

        // Get main product data with metal type, metal purity names, and category names
        const [products] = await db.execute(
            `SELECT p.*, 
                    mt.name as metal_type_name,
                    mp.purity_name as metal_purity_name,
                    mp.tunch_value as metal_purity_tunch,
                    c.name as category_name,
                    sc.name as subcategory_name,
                    ssc.name as sub_subcategory_name
             FROM products p
             LEFT JOIN metal_types mt ON p.metal_id = mt.id
             LEFT JOIN metal_purities mp ON p.metal_purity_id = mp.id
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
             LEFT JOIN sub_subcategories ssc ON p.sub_subcategory_id = ssc.id
             WHERE p.id = ?`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const product = products[0];

        // Get product options - simplified for current schema
        let productOptions;
        try {
            const [options] = await db.execute(
                `SELECT po.* 
                 FROM product_options po 
                 WHERE po.product_id = ?`,
                [id]
            );
            productOptions = options;
        } catch (error) {
            console.error("Error fetching product options:", error);
            productOptions = [];
        }

        // Get product less weight items (using product_less_weight table)
        const [productLessWeight] = await db.execute(
            `SELECT * FROM product_less_weight WHERE product_id = ? ORDER BY id ASC`,
            [id]
        );


        // Get images
        const [images] = await db.execute(
            `SELECT * FROM product_images WHERE product_id = ?`,
            [id]
        );

        // Get videos
        const [videos] = await db.execute(
            `SELECT * FROM product_videos WHERE product_id = ?`,
            [id]
        );


        // Get certificates
        const [certificates] = await db.execute(
            `SELECT * FROM product_certificates WHERE product_id = ?`,
            [id]
        );

        // Get product features
        const [productFeatures] = await db.execute(
            `SELECT * FROM product_features WHERE product_id = ? ORDER BY id`,
            [id]
        );

        // Helper function to remove null/undefined values from objects
        const removeNullValues = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            const cleaned = {};
            Object.keys(obj).forEach(key => {
                if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                    cleaned[key] = obj[key];
                }
            });
            return cleaned;
        };

        // Map database fields to frontend fields for less weight items
        const mappedProductLessWeight = productLessWeight.map(item => ({
            ...item,
            weight: item.weight, // Use weight directly from database
            profit: item.total_profit, // Map total_profit to profit for frontend
            total_profit: item.total_profit, // Keep original field name for ViewProductPopup
            weight_carat: item.weight_carat, // Keep original field name for compatibility
            // Ensure purchase_rate is preserved
            purchase_rate: item.purchase_rate,
            purchase_value: item.purchase_value,
            sale_rate: item.sale_rate,
            sale_value: item.sale_value
        }));

        const responseData = {
            ...removeNullValues(product),
            product_options: productOptions.length > 0 ? productOptions : [],
            product_less_weight: mappedProductLessWeight.length > 0 ? mappedProductLessWeight : [],
            images: images.length > 0 ? images : [],
            product_images: images.length > 0 ? images : [], // Add alias for frontend compatibility
            product_videos: videos.length > 0 ? videos : [],
            product_certificates: certificates.length > 0 ? certificates : [],
            product_features: productFeatures.length > 0 ? productFeatures : [],
            videos_count: videos.length || 0,
            certificates_count: certificates.length || 0,
            options_count: productOptions.length || 0,
            less_weight_count: mappedProductLessWeight.length || 0,
            images_count: images.length || 0,
            features_count: productFeatures.length || 0
        };

        return res.status(200).json({
            success: true,
            data: responseData,
        });

    } catch (error) {
        console.error("❌ Error getting product:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting product",
            error: error.message,
        });
    }
};


// Get categories with subcategories and sub-subcategories
const getCategoriesHierarchy = async (req, res) => {
    try {
        // Get categories
        const [categories] = await db.execute(
            `SELECT * FROM categories WHERE status = 'active' ORDER BY name`
        );

        // Get subcategories
        const [subcategories] = await db.execute(
            `SELECT * FROM subcategories WHERE status = 'active' ORDER BY name`
        );

        // Get sub-subcategories
        const [subSubcategories] = await db.execute(
            `SELECT * FROM sub_subcategories WHERE status = 'active' ORDER BY name`
        );

        // Organize data hierarchically
        const organizedCategories = categories.map(category => {
            const categorySubcategories = subcategories.filter(sub => sub.category_id === category.id);

            return {
                ...category,
                subcategories: categorySubcategories.map(subcategory => {
                    const subcategorySubSubcategories = subSubcategories.filter(subsub => subsub.subcategory_id === subcategory.id);

                    return {
                        ...subcategory,
                        sub_subcategories: subcategorySubSubcategories
                    };
                })
            };
        });

        res.status(200).json({
            success: true,
            data: organizedCategories
        });

    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// =======================================
// EDIT PRODUCT POPUP SECTION FUNCTIONS
// =======================================

// Image Section Functions
const reorderProductImages = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { imageOrder } = req.body;

        if (!imageOrder || !Array.isArray(imageOrder)) {
            return res.status(400).json({
                success: false,
                message: 'Image order array is required'
            });
        }

        // Update image order in database
        for (let i = 0; i < imageOrder.length; i++) {
            await db.execute(
                'UPDATE product_images SET display_order = ? WHERE id = ? AND product_id = ?',
                [i + 1, imageOrder[i], product_id]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Image order updated successfully'
        });
    } catch (error) {
        console.error('Error reordering product images:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

const updateProductImages = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { images } = req.body;

        // Update product images in database
        // This function can handle image metadata updates
        res.status(200).json({
            success: true,
            message: 'Product images updated successfully'
        });
    } catch (error) {
        console.error('Error updating product images:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Video Section Functions
const reorderProductVideos = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { videoOrder } = req.body;

        if (!videoOrder || !Array.isArray(videoOrder)) {
            return res.status(400).json({
                success: false,
                message: 'Video order array is required'
            });
        }

        // Update video order in database
        for (let i = 0; i < videoOrder.length; i++) {
            await db.execute(
                'UPDATE product_videos SET display_order = ? WHERE id = ? AND product_id = ?',
                [i + 1, videoOrder[i], product_id]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Video order updated successfully'
        });
    } catch (error) {
        console.error('Error reordering product videos:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

const updateProductVideos = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { videos } = req.body;

        // Update product videos in database
        res.status(200).json({
            success: true,
            message: 'Product videos updated successfully'
        });
    } catch (error) {
        console.error('Error updating product videos:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

// Product Data Section Functions
const getProductData = async (req, res) => {
    try {
        const { product_id } = req.params;

        // Get main product data with category names
        const [products] = await db.execute(
            `SELECT p.*,
                    c.name as category_name,
                    sc.name as subcategory_name,
                    ssc.name as sub_subcategory_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
             LEFT JOIN sub_subcategories ssc ON p.sub_subcategory_id = ssc.id
             WHERE p.id = ?`,
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = products[0];


        // Get product options
        const [productOptions] = await db.execute(
            'SELECT * FROM product_options WHERE product_id = ? ORDER BY id',
            [product_id]
        );

        // Get product features
        const [productFeatures] = await db.execute(
            'SELECT * FROM product_features WHERE product_id = ? ORDER BY id',
            [product_id]
        );

        // Get less weight items
        const [lessWeightItems] = await db.execute(
            'SELECT * FROM product_less_weight WHERE product_id = ? ORDER BY id',
            [product_id]
        );

        // Map database fields to frontend fields for less weight items
        const mappedLessWeightItems = lessWeightItems.map(item => ({
            ...item,
            weight: item.weight, // Use weight directly from database
            profit: item.total_profit, // Map total_profit to profit for frontend
            total_profit: item.total_profit, // Keep original field name for ViewProductPopup
            weight_carat: item.weight, // Map weight to weight_carat for compatibility
            total_sale_rate: item.sale_value, // Map sale_value to total_sale_rate for frontend calculations
            pieces_rate: item.purchase_value, // Map purchase_value to pieces_rate for frontend
            per_value: item.purchase_value, // Map purchase_value to per_value for frontend
            weight_in_grams: item.weight_in_grams || item.weight // Map weight_in_grams
        }));

        // Get weight details
        const [weightDetails] = await db.execute(
            'SELECT * FROM product_weight_details WHERE product_id = ?',
            [product_id]
        );

        const responseData = {
            ...product,
            product_options: productOptions,
            product_features: productFeatures,
            product_less_weight: mappedLessWeightItems,
            weight_details: weightDetails.length > 0 ? weightDetails[0] : null
        };

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error getting product data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateProductData = async (req, res) => {
    let connection;
    try {
        const { product_id } = req.params;
        const productData = req.body;


        // Start database transaction
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Remove product overview data (admin-only, not saved to backend)
        const { productOverview, ...dataToSave } = productData;

        // Extract special sections
        const { product_less_weight, product_options, product_features, ...mainProductData } = dataToSave;

        // Helper function to sanitize values and prevent undefined
        const sanitizeValue = (value) => {
            if (value === undefined || value === null) {
                return null;
            }
            if (typeof value === 'string' && value.trim() === '') {
                return null;
            }
            return value;
        };

        // Update main product data in database
        const updateFields = [];
        const updateValues = [];

        // Define allowed fields for products table (based on actual database schema)
        const allowedFields = [
            'sku', 'tag_number', 'slug', 'batch', 'description', 'status', 'item_name', 'stamp',
            'remark', 'unit', 'pieces', 'gross_weight', 'less_weight', 'net_weight', 'additional_weight',
            'tunch', 'wastage_percentage', 'rate', 'diamond_weight', 'stone_weight', 'labour', 'labour_on',
            'other', 'total_fine_weight', 'total_rs', 'design_type', 'manufacturing', 'customizable',
            'engraving', 'hallmark', 'certificate_number', 'category_id', 'subcategory_id', 'sub_subcategory_id',
            'metal_id', 'metal_purity_id', 'discount'
        ];

        // Validate foreign key references before updating
        if (mainProductData.metal_id && mainProductData.metal_id !== '' && mainProductData.metal_id !== null) {
            const [metalTypeCheck] = await connection.execute('SELECT id FROM metal_types WHERE id = ?', [mainProductData.metal_id]);
            if (metalTypeCheck.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Invalid metal_id: ${mainProductData.metal_id} does not exist in metal_types table`
                });
            }
        }

        if (mainProductData.metal_purity_id && mainProductData.metal_purity_id !== '' && mainProductData.metal_purity_id !== null) {
            const [metalPurityCheck] = await connection.execute('SELECT id FROM metal_purities WHERE id = ?', [mainProductData.metal_purity_id]);
            if (metalPurityCheck.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Invalid metal_purity_id: ${mainProductData.metal_purity_id} does not exist in metal_purities table`
                });
            }
        }

        if (mainProductData.category_id && mainProductData.category_id !== '' && mainProductData.category_id !== null) {
            const [categoryCheck] = await connection.execute('SELECT id FROM categories WHERE id = ?', [mainProductData.category_id]);
            if (categoryCheck.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Invalid category_id: ${mainProductData.category_id} does not exist in categories table`
                });
            }
        }

        if (mainProductData.subcategory_id && mainProductData.subcategory_id !== '' && mainProductData.subcategory_id !== null) {
            const [subcategoryCheck] = await connection.execute('SELECT id FROM subcategories WHERE id = ?', [mainProductData.subcategory_id]);
            if (subcategoryCheck.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Invalid subcategory_id: ${mainProductData.subcategory_id} does not exist in subcategories table`
                });
            }
        }

        if (mainProductData.sub_subcategory_id && mainProductData.sub_subcategory_id !== '' && mainProductData.sub_subcategory_id !== null) {
            const [subSubcategoryCheck] = await connection.execute('SELECT id FROM sub_subcategories WHERE id = ?', [mainProductData.sub_subcategory_id]);
            if (subSubcategoryCheck.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Invalid sub_subcategory_id: ${mainProductData.sub_subcategory_id} does not exist in sub_subcategories table`
                });
            }
        }

        // Auto-generate SKU if item_name is being updated
        if (mainProductData.item_name && mainProductData.item_name.trim() !== '') {
            try {
                const newSKU = await generateUniqueSKU(mainProductData.item_name);
                updateFields.push('sku = ?');
                updateValues.push(newSKU);
            } catch (error) {
                console.error('Failed to generate SKU:', error);
                // Continue without SKU update if generation fails
            }
        }

        // Field mapping for frontend to database field names
        const fieldMapping = {
            'manufacturing_type': 'manufacturing', // Frontend sends manufacturing_type, DB has manufacturing
            'engraving_option': 'engraving'        // Frontend sends engraving_option, DB has engraving
        };

        // Build update fields with proper sanitization and field mapping
        Object.keys(mainProductData).forEach(key => {
            // Map frontend field name to database field name
            const dbFieldName = fieldMapping[key] || key;

            if (allowedFields.includes(dbFieldName)) {
                let sanitizedValue = sanitizeValue(mainProductData[key]);

                // Special handling for TINYINT(1) fields - MySQL stores 0 or 1
                // Frontend sends boolean true/false, convert to number 0/1
                if (['customizable', 'engraving', 'hallmark'].includes(dbFieldName)) {
                    const originalValue = mainProductData[key];

                    // Convert to TINYINT (0 or 1)
                    if (originalValue === true) {
                        sanitizedValue = 1;
                    } else if (originalValue === false) {
                        sanitizedValue = 0;
                    } else {
                        sanitizedValue = 0;
                    }
                }

                // Special handling for pieces field - ensure 0 is preserved
                if (dbFieldName === 'pieces') {
                    if (sanitizedValue === null || sanitizedValue === undefined) {
                        sanitizedValue = null;
                    } else {
                        // Convert to integer, preserving 0
                        const piecesNum = parseInt(sanitizedValue, 10);
                        sanitizedValue = isNaN(piecesNum) ? null : piecesNum;
                    }
                }

                updateFields.push(`${dbFieldName} = ?`);
                updateValues.push(sanitizedValue);
            }
        });

        // Update main product data
        if (updateFields.length > 0) {
            updateValues.push(product_id);
            const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
            await connection.execute(query, updateValues);
        }

        // Handle Less Weight Items
        if (product_less_weight && Array.isArray(product_less_weight)) {
            // Delete existing less weight items
            await connection.execute('DELETE FROM product_less_weight WHERE product_id = ?', [product_id]);

            // Insert new less weight items
            for (const item of product_less_weight) {
                if (item.item && item.item.trim() !== '') {
                    const insertValues = [
                        product_id,
                        sanitizeValue(item.item),
                        sanitizeValue(item.stamp),
                        sanitizeValue(item.clarity),
                        sanitizeValue(item.color),
                        sanitizeValue(item.cuts),
                        sanitizeValue(item.shapes),
                        sanitizeValue(item.remarks),
                        sanitizeValue(item.pieces) || 1,
                        sanitizeValue(item.weight) || sanitizeValue(item.weight_carat),
                        sanitizeValue(item.units) || 'carat',
                        sanitizeValue(item.tunch),
                        sanitizeValue(item.purchase_rate),
                        sanitizeValue(item.sale_rate),
                        sanitizeValue(item.total_profit) || sanitizeValue(item.profit),
                        sanitizeValue(item.purchase_value) || sanitizeValue(item.per_value) || sanitizeValue(item.pieces_rate),
                        sanitizeValue(item.sale_value) || sanitizeValue(item.total_sale_rate)
                    ];


                    await connection.execute(`
                        INSERT INTO product_less_weight (
                            product_id, item, stamp, clarity, color, cuts, shapes, 
                            remarks, pieces, weight, units, tunch, purchase_rate, 
                            sale_rate, total_profit, purchase_value, sale_value
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, insertValues);
                }
            }
        }

        // Handle Product Options
        if (product_options && Array.isArray(product_options)) {
            // Delete existing product options
            await connection.execute('DELETE FROM product_options WHERE product_id = ?', [product_id]);

            // Insert new product options
            for (const option of product_options) {
                if (option.size || option.weight || option.value || option.sell_price) {
                    await connection.execute(`
                        INSERT INTO product_options (
                            product_id, size, weight, dimensions, metal_color, 
                            gender, occasion, value, sell_price
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        product_id,
                        sanitizeValue(option.size),
                        sanitizeValue(option.weight),
                        sanitizeValue(option.dimensions),
                        sanitizeValue(option.metal_color),
                        sanitizeValue(option.gender),
                        sanitizeValue(option.occasion),
                        sanitizeValue(option.value),
                        sanitizeValue(option.sell_price)
                    ]);
                }
            }
        }

        // Handle Product Features
        if (product_features && Array.isArray(product_features)) {
            // Delete existing product features
            await connection.execute('DELETE FROM product_features WHERE product_id = ?', [product_id]);

            // Insert new product features
            for (const feature of product_features) {
                if (feature.feature_points && feature.feature_points.trim() !== '') {
                    await connection.execute(`
                        INSERT INTO product_features (product_id, feature_points) 
                        VALUES (?, ?)
                    `, [product_id, sanitizeValue(feature.feature_points)]);
                }
            }
        }

        // Commit transaction
        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Product data updated successfully'
        });
    } catch (error) {
        console.error('Error updating product data:', error);

        // Rollback transaction if it was started
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    } finally {
        // Release connection
        if (connection) {
            connection.release();
        }
    }
};


const updateProductCategories = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { category_id, subcategory_id, sub_subcategory_id } = req.body;

        await db.execute(
            'UPDATE products SET category_id = ?, subcategory_id = ?, sub_subcategory_id = ? WHERE id = ?',
            [category_id, subcategory_id, sub_subcategory_id, product_id]
        );

        res.status(200).json({
            success: true,
            message: 'Product categories updated successfully'
        });
    } catch (error) {
        console.error('Error updating product categories:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

const updateProductCertification = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { certificates } = req.body;

        // Update product certification data
        // This can handle certificate metadata updates
        res.status(200).json({
            success: true,
            message: 'Product certification updated successfully'
        });
    } catch (error) {
        console.error('Error updating product certification:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

const compressExistingMedia = async (req, res) => {
    try {
        const { product_id } = req.params;

        // Get all images for the product
        const [images] = await db.execute(
            'SELECT id, image_name, image_url FROM product_images WHERE product_id = ?',
            [product_id]
        );

        // Get all videos for the product
        const [videos] = await db.execute(
            'SELECT id, video_name, video_url FROM product_videos WHERE product_id = ?',
            [product_id]
        );

        let compressionResults = {
            images: [],
            videos: [],
            totalSpaceSaved: 0
        };

        // Compress existing images
        for (const image of images) {
            try {
                const imagePath = path.join(__dirname, '..', 'public', image.image_url);
                if (fs.existsSync(imagePath)) {
                    const result = await compressImage(imagePath, 85);
                    if (result.compressed) {
                        compressionResults.images.push({
                            id: image.id,
                            name: image.image_name,
                            originalSize: result.originalSize,
                            finalSize: result.finalSize,
                            compressionRatio: result.compressionRatio
                        });
                        compressionResults.totalSpaceSaved += (result.originalSize - result.finalSize);
                    }
                }
            } catch (error) {
                console.error(`Error compressing image ${image.image_name}:`, error);
            }
        }

        // Process existing videos
        for (const video of videos) {
            try {
                const videoPath = path.join(__dirname, '..', 'public', video.video_url);
                if (fs.existsSync(videoPath)) {
                    const result = await processVideo(videoPath);
                    if (result.processed) {
                        compressionResults.videos.push({
                            id: video.id,
                            name: video.video_name,
                            originalSize: result.originalSize,
                            finalSize: result.finalSize,
                            thumbnailCreated: result.thumbnailCreated
                        });
                    }
                }
            } catch (error) {
                console.error(`Error processing video ${video.video_name}:`, error);
            }
        }

        res.json({
            success: true,
            message: 'Media compression completed',
            data: compressionResults
        });

    } catch (error) {
        console.error('Error compressing existing media:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
};

const getAllProductBanners = async (req, res) => {
    try {
        const [banners] = await db.execute(
            'SELECT * FROM product_banner ORDER BY device_type ASC, created_at DESC'
        );

        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('Error getting all product banners:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const checkTagNumbers = async (req, res) => {
    try {
        const { tagNumbers } = req.body;

        if (!Array.isArray(tagNumbers) || tagNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tag numbers array is required'
            });
        }

        // Check which tag numbers exist in the database
        const placeholders = tagNumbers.map(() => '?').join(',');
        const [results] = await db.execute(
            `SELECT tag_number FROM products WHERE tag_number IN (${placeholders})`,
            tagNumbers
        );

        const existingTagNumbers = results.map(row => row.tag_number);

        res.json({
            success: true,
            existingTagNumbers,
            totalChecked: tagNumbers.length,
            existingCount: existingTagNumbers.length,
            newCount: tagNumbers.length - existingTagNumbers.length
        });
    } catch (error) {
        console.error('Error checking tag numbers:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while checking tag numbers'
        });
    }
};

module.exports = {
    getAllReviews,
    sendMessageToReviewer,
    getAllProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    deleteProductImage,
    getProductVideos,
    uploadProductVideos,
    deleteProductVideo,
    generateTagNumber,
    generateSKUEndpoint,
    getProductStats,
    bulkUpdateProducts,
    bulkDeleteProducts,
    bulkUploadProducts,
    checkTagNumbers,
    upload,
    videoUpload,
    reviewUpload,
    getProductMetalTypes,
    getProductDiamondQualities,
    getProductSizeOptions,
    getProductWeightOptions,
    getProductReviews,
    createProductReview,
    deleteProductReview,
    getLatestSignatureProduct,
    getLatestLuxuryProducts,
    getNewInProducts,
    getBestsellerProducts,
    createProductCertificate,
    getProductCertificates,
    updateProductCertificate,
    deleteProductCertificate,
    uploadCertificateFiles,
    updateExistingProductSlugs,
    flagReview,
    getSimilarProductsForComparison,
    getProductComparison,
    getProductFeatures,
    createProductFeature,
    updateProductFeature,
    deleteProductFeature,
    restockProduct,
    getProductsBySection,
    getAllProductSections,
    addProductToSection,
    removeProductFromSection,
    updateProductSectionOrder,
    getAvailableProductsForSection,
    getUserProductCertificates,
    getProductBanner,
    createOrUpdateBanner,
    getAllProductBanners,
    createProductWithFullData: createProduct,
    getProductWithFullData,
    getCategoriesHierarchy,
    reorderProductImages,
    updateProductImages,
    reorderProductVideos,
    updateProductVideos,
    getProductData,
    updateProductData,
    updateProductCategories,
    updateProductCertification,
    compressExistingMedia
}; 