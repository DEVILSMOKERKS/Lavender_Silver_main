const multer = require('multer');
const path = require("path");
const fs = require("fs");



const allowedFolders = ["blogs", "products", "categories", "profiles", "subcategories", "home_banners", "featured-category", "wrapped_with_love", "global_metal_types", "second_feature_cat", "instagram_images", "certificates", "promo-banners", "aboutus", "shop_banner", "product_banner", "offerCarousel", "gallery", "client_diary"];


const isValidFolder = (folderPath) => {
  const cleanFolder = folderPath.replace("/", "");
  return allowedFolders.includes(cleanFolder);
};

const upload = {
  single: (fieldName, maxCount, folderPath) => {
    if (typeof maxCount === 'string' && maxCount.startsWith("/")) {
      folderPath = maxCount;
      maxCount = undefined;
    }

    if (typeof folderPath === 'string' && folderPath.startsWith("/")) {
      let cleanFolder = folderPath.replace("/", "");

      if (!isValidFolder("/" + cleanFolder)) {
        return (req, res, next) => {
          return res.status(400).json({
            error: `Invalid folder '${cleanFolder}'. Allowed: ${allowedFolders.join(", ")}`
          });
        };
      }

      const uploadDir = path.join("public", cleanFolder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const originalName = file.originalname;
          const targetPath = path.join(uploadDir, originalName);

          if (fs.existsSync(targetPath)) {
            cb(new Error(`Image already exists: ${originalName}`));
          } else {
            cb(null, originalName);
          }
        }
      });

      const multerMiddleware = multer({ storage }).single(fieldName);

      return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
          if (err) {
            return res.status(409).json({ error: err.message });
          }
          next();
        });
      };
    } else {
      const uploadDir = path.join("public", "products");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const originalName = file.originalname;
          const targetPath = path.join(uploadDir, originalName);

          if (fs.existsSync(targetPath)) {
            cb(new Error(`Image already exists: ${originalName}`));
          } else {
            cb(null, originalName);
          }
        }
      });

      const multerMiddleware = multer({ storage }).single(fieldName);

      return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
          if (err) {
            return res.status(409).json({ error: err.message });
          }
          next();
        });
      };
    }
  },
  array: (fieldName, maxCount, folderPath) => {
    if (typeof folderPath === 'string' && folderPath.startsWith("/")) {
      let cleanFolder = folderPath.replace("/", "");
      if (!isValidFolder("/" + cleanFolder)) {
        return (req, res, next) => {
          return res.status(400).json({
            error: `Invalid folder '${cleanFolder}'. Allowed: ${allowedFolders.join(", ")}`
          });
        };
      }
      const uploadDir = path.join("public", cleanFolder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const originalName = file.originalname;
          const targetPath = path.join(uploadDir, originalName);
          if (fs.existsSync(targetPath)) {
            cb(new Error(`Image already exists: ${originalName}`));
          } else {
            cb(null, originalName);
          }
        }
      });
      const multerMiddleware = multer({ storage }).array(fieldName, maxCount);
      return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
          if (err) {
            return res.status(409).json({ error: err.message });
          }
          next();
        });
      };
    } else {
      const uploadDir = path.join("public", "products");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const originalName = file.originalname;
          const targetPath = path.join(uploadDir, originalName);
          if (fs.existsSync(targetPath)) {
            cb(new Error(`Image already exists: ${originalName}`));
          } else {
            cb(null, originalName);
          }
        }
      });
      const multerMiddleware = multer({ storage }).array(fieldName, maxCount);
      return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
          if (err) {
            return res.status(409).json({ error: err.message });
          }
          next();
        });
      };
    }
  }
};
module.exports = { upload };

