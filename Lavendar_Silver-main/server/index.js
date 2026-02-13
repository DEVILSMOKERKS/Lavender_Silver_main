require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const compression = require('compression');

const authRoutes = require('./routes/auth.routes.js');
const digitalGoldRoutes = require('./routes/digitalGold.routes.js');
const userRoutes = require('./routes/user.routes.js');
const googleRoutes = require('./routes/google.routes.js');
const facebookRoutes = require('./routes/facebook.routes.js');
const facebookPixelRoutes = require('./routes/facebookPixel.routes.js');
const categoryRoutes = require('./routes/category.routes.js');
const subcategoryRoutes = require('./routes/subcategory.routes.js');
const blogRoutes = require('./routes/blog.routes.js');
const discountRoutes = require('./routes/discount.routes.js');
const contactusRoutes = require('./routes/contactus.routes.js');
const aboutRoutes = require('./routes/about.routes.js');
const faqRoutes = require('./routes/faq.routes.js');
const returnPolicyRoutes = require('./routes/returnPolicy.routes.js');
const privacyPolicyRoutes = require('./routes/privacyPolicy.routes.js');
const termsConditionsRoutes = require('./routes/termsConditions.routes.js');
const shippingPolicyRoutes = require('./routes/shippingPolicy.routes.js');
const shopBannerRoutes = require('./routes/shopBanner.routes.js');
const eliteMembersRoutes = require('./routes/elite_members.routes.js');
const homeBannerRoutes = require('./routes/home_banner.routes.js');
const orderRoutes = require('./routes/order.routes.js');
const productRoutes = require('./routes/product.routes.js');
const cartRoutes = require('./routes/cart.routes.js');
const wishlistRoutes = require('./routes/wishlist.routes.js');
const supportRoutes = require('./routes/support.routes.js');
const notificationRoutes = require('./routes/notification.routes.js');
const videoConsultationRoutes = require('./routes/video-consultation.routes.js');
const chatbotRoutes = require('./routes/chatbot.routes.js');
const goldmineRoutes = require('./routes/goldmine.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const metalRatesRoutes = require('./routes/metalRates.routes.js');
const productPriceCalculationRoutes = require('./routes/productPriceCalculation.routes.js');
const emailAutomationRoutes = require('./routes/emailAutomation.routes.js');
const salesRoutes = require('./routes/sales.routes.js');
const customJewelryRoutes = require('./routes/customJewelry.routes.js');
const gemstoneRoutes = require('./routes/gemstone.routes.js');
const gemstoneCatalogRoutes = require('./routes/gemstoneCatalog.routes.js');
const subSubcategoryRoutes = require('./routes/subSubcategory.routes.js');
const productWeightRoutes = require('./routes/productWeight.routes.js');
const galleryRoutes = require('./routes/gallery.routes.js');
const offerCarouselRoutes = require('./routes/offerCarousel.routes.js');
const clientDiaryRoutes = require('./routes/clientDiary.routes.js');
const pincodeRoutes = require('./routes/pincode.routes.js');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan('dev'));

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));




const allowedOrigins = [
  'http://93.127.206.25:3000',
  'http://localhost:5174',
  'http://93.127.206.25:5173',
  'https://93.127.206.25:3000',
  'https://93.127.206.25:5173',
  'http://69.62.81.55:5174',
  'https://pvjewellers.in',
  'https://www.pvjewellers.in',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));


app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));

app.use(cookieParser());

app.use((req, res, next) => {
  if (!req.cookies.guest_id) {
    const guestId = uuidv4();
    res.cookie('guest_id', guestId, {
      maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });
    req.guest_id = guestId;
  } else {
    req.guest_id = req.cookies.guest_id;
  }
  next();
});


['profiles', 'products', 'categories', 'blogs', 'subcategories', 'home_banners', 'featured-category', 'wrapped_with_love', 'global_metal_types', 'second_feature_cat', 'instagram_images', 'promo-banners', "aboutus", "shop_banner", "reviews", "product_banner", "uploads", "custom-jewelry", "certificates", "offerCarousel", "gallery", "client_diary"].forEach(folder => {
  app.use(`/${folder}`, express.static(path.join(__dirname, 'public', folder), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));
});


// ✅ API Routes with CORS and no-cache headers
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }

  // Set no-cache headers for all API routes
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/digital-gold', digitalGoldRoutes);
app.use('/api/users', userRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/facebook-pixel', facebookPixelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/contact-us', contactusRoutes);
app.use('/api/about-us', aboutRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/return-policy', returnPolicyRoutes);
app.use('/api/privacy-policy', privacyPolicyRoutes);
app.use('/api/terms-conditions', termsConditionsRoutes);
app.use('/api/shipping-policy', shippingPolicyRoutes);
app.use('/api/shop-banners', shopBannerRoutes);
app.use('/api/elite-members', eliteMembersRoutes);
app.use('/api/home-banners', homeBannerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', wishlistRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/video-consultation', videoConsultationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/goldmine', goldmineRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/metal-rates', metalRatesRoutes);
app.use('/api/product-price-calculation', productPriceCalculationRoutes);
app.use('/api/email-automation', emailAutomationRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/custom-jewelry', customJewelryRoutes);
app.use('/api/gemstones', gemstoneRoutes);
app.use('/api/gemstone-catalog', gemstoneCatalogRoutes);
app.use('/api/offer-carousel', offerCarouselRoutes);
app.use('/api/sub-subcategories', subSubcategoryRoutes);
app.use('/api/product-weight', productWeightRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/client-diary', clientDiaryRoutes);
app.use('/api/pincodes', pincodeRoutes);


app.use('/certificates', express.static(path.join(__dirname, 'public', 'certificates'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      res.setHeader('Content-Type', `image/${ext.slice(1)}`);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'PVJ API running', data: null });
});


app.use((req, res, next) => {

  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Not Found', data: null });
  }

  next();
});


app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    data: null
  });
});


const { initializeEmailAutomation } = require('./utils/initializeEmailAutomation');
const { initializeCronJobs } = require('./utils/cronJobs');

const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ PVJ backend running on http://0.0.0.0:${PORT}`);


  try {
    await initializeEmailAutomation();
    initializeCronJobs();
  } catch (error) {
    console.error('❌ Error initializing email automation:', error);
  }
});
