# PVJ Jewelry Store - Complete E-commerce Platform

## 🏆 Overview

PVJ Jewelry Store is a comprehensive e-commerce platform built with React, Vite, Node.js, and MySQL. The platform provides a complete jewelry shopping experience with advanced features including Facebook authentication, email automation, sales analytics, video consultations, and much more.

## 🚀 Key Features

### Core E-commerce Features
- **Product Management**: Complete product catalog with categories, subcategories, and variants
- **Shopping Cart & Wishlist**: Full cart functionality with persistent storage
- **Order Management**: Complete order processing with status tracking
- **User Authentication**: Multiple authentication methods including Facebook login
- **Payment Integration**: Razorpay payment gateway integration
- **Video Consultations**: Video call scheduling and management
- **Digital Gold**: Digital gold investment platform
- **Goldmine Subscription**: Subscription-based gold savings program

### Advanced Features
- **Facebook Pixel Integration**: Marketing and analytics tracking
- **Email Automation**: Automated email campaigns and notifications
- **Sales Analytics**: Comprehensive sales reporting and insights
- **Bulk Product Upload**: Excel-based bulk product management
- **Invoices & Certificates**: Digital invoice and certificate management
- **Support System**: Complete customer support ticketing system

## 📁 Project Structure

```
PVJ/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── admin/           # Admin panel components
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── server/                  # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── routes/            # API routes
│   ├── middlewares/       # Custom middlewares
│   ├── utils/             # Utility functions
│   └── public/            # File uploads
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Multer** - File upload handling
- **Node-cron** - Scheduled tasks

### Third-party Integrations
- **Facebook SDK** - Social authentication
- **Razorpay** - Payment processing
- **Email Services** - Automated email campaigns

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create `.env` file in server directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=pvj_database

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_here

   # Facebook Configuration
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret

   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Database Setup:**
   - Create MySQL database
   - Import `pvj.sql` schema file
   - Update database connection in `config/db.js`

5. **Start server:**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create `.env` file in frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_FACEBOOK_APP_ID=your_facebook_app_id
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📊 API Documentation

### Authentication APIs
| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/auth/admin/register` | Register admin | No |
| POST | `/api/auth/admin/login` | Admin login | No |
| POST | `/api/users/register` | User registration | No |
| POST | `/api/users/login` | User login | No |
| POST | `/api/facebook/login` | Facebook login | No |
| GET | `/api/auth/whoami` | Get current user | Yes |

### Product APIs
| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/products` | Get all products | No |
| GET | `/api/products/:id` | Get product by ID | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |
| POST | `/api/products/bulk-upload` | Bulk upload products | Admin |

### Cart & Wishlist APIs
| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/cart` | Get user's cart | Yes |
| POST | `/api/cart` | Add to cart | Yes |
| PUT | `/api/cart/:id` | Update cart item | Yes |
| DELETE | `/api/cart/:id` | Remove from cart | Yes |
| GET | `/api/wishlist` | Get user's wishlist | Yes |
| POST | `/api/wishlist` | Add to wishlist | Yes |

### Order APIs
| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders` | Get user's orders | Yes |
| GET | `/api/orders/:id` | Get order by ID | Yes |
| PUT | `/api/orders/:id` | Update order | Admin |
| GET | `/api/orders/:id/invoice` | Download invoice | Yes |

### Video Consultation APIs
| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/video-consultation/request` | Create consultation request | No |
| GET | `/api/video-consultation/user-requests` | Get user's requests | Yes |
| GET | `/api/video-consultation/admin/requests` | Get all requests | Admin |
| PUT | `/api/video-consultation/admin/requests/:id/status` | Update status | Admin |

### Sales Analytics APIs
| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/sales/most-selling-products` | Get top selling products | Admin |
| GET | `/api/sales/most-selling-locations` | Get top selling locations | Admin |
| GET | `/api/sales/dashboard` | Get sales dashboard | Admin |
| GET | `/api/sales/comparison` | Get sales comparison | Admin |

## 🎯 Key Components

### Frontend Components

#### User Interface
- **Product Display**: Dynamic product pages with options and pricing
- **Shopping Cart**: Full cart functionality with quantity management
- **Wishlist**: Save and manage favorite products
- **Checkout**: Complete checkout process with payment integration
- **User Dashboard**: Account management and order history

#### Admin Panel
- **Product Management**: Add, edit, and manage products
- **Order Management**: Process and track orders
- **User Management**: Manage customer accounts
- **Analytics Dashboard**: Sales insights and reporting
- **Content Management**: Manage banners, categories, and content

### Backend Services

#### Authentication Service
- JWT-based authentication
- Facebook OAuth integration
- Role-based access control
- Password reset functionality

#### Product Service
- Product CRUD operations
- Category and subcategory management
- Product variants and options
- Bulk product upload via Excel

#### Order Service
- Order processing and tracking
- Payment integration with Razorpay
- Invoice generation
- Shipping management

#### Email Service
- Automated email campaigns
- Transactional emails
- Email templates management
- User activity tracking

## 🔧 Configuration

### Facebook Integration
1. Create Facebook App in Facebook Developer Console
2. Configure OAuth settings with proper redirect URIs
3. Update environment variables with App ID and Secret
4. Test Facebook login functionality

### Email Automation
- Configure SMTP settings in environment variables
- Set up email templates for different campaigns
- Configure automated triggers for user activities
- Set up cron jobs for scheduled emails

### Payment Integration
- Configure Razorpay API keys
- Set up webhook endpoints for payment notifications
- Test payment flow in sandbox mode
- Configure production settings for live payments

## 📈 Features Deep Dive

### Sales Analytics System
The platform includes comprehensive sales analytics with:
- **Most Selling Products**: Track top-performing products with detailed metrics
- **Geographic Analytics**: Analyze sales by location and region
- **Time-based Filtering**: Filter data by different time periods
- **Revenue Tracking**: Monitor revenue trends and growth
- **Customer Insights**: Track customer behavior and preferences

### Email Automation System
Automated email campaigns include:
- **Welcome Emails**: Sent to new users upon registration
- **Abandoned Cart**: Remind users about items left in cart
- **Order Confirmation**: Confirm order placement and details
- **Promotional Emails**: Send offers and product updates
- **Activity Tracking**: Track user engagement and behavior

### Video Consultation System
Video consultation features include:
- **Request Management**: Users can request video consultations
- **Admin Scheduling**: Admins can schedule and manage consultations
- **Status Tracking**: Track consultation status and progress
- **Video Cart**: Add products during video consultations
- **OTP Verification**: Secure consultation request verification

### Digital Gold Platform
Digital gold investment features:
- **Gold Rate Tracking**: Real-time gold rate updates
- **Transaction Management**: Buy and sell digital gold
- **Portfolio Tracking**: Monitor investment performance
- **Forecasting**: Gold rate predictions and trends
- **Razorpay Integration**: Secure payment processing

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user role management
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries
- **File Upload Security**: Secure file handling and validation
- **Rate Limiting**: API rate limiting for security
- **CORS Configuration**: Proper cross-origin resource sharing

## 🚀 Deployment

### Production Deployment

1. **Environment Setup:**
   - Configure production environment variables
   - Set up production database
   - Configure SSL certificates

2. **Frontend Build:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Server Deployment:**
   - Deploy server to production environment
   - Set up reverse proxy (nginx)
   - Configure domain and SSL

4. **Database Migration:**
   - Run database migrations
   - Set up database backups
   - Configure monitoring

### Docker Deployment (Optional)
```dockerfile
# Dockerfile for server
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- Server response time tracking
- Database query optimization
- Memory usage monitoring
- Error logging and tracking

### Business Analytics
- Sales performance tracking
- Customer behavior analysis
- Product performance metrics
- Geographic sales distribution

### User Analytics
- User engagement tracking
- Conversion rate monitoring
- Cart abandonment analysis
- Customer lifetime value


## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   - Check database credentials
   - Verify database server is running
   - Check network connectivity

2. **Authentication Issues:**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Validate Facebook app configuration

3. **File Upload Issues:**
   - Check file size limits
   - Verify file type restrictions
   - Check storage permissions

4. **Email Issues:**
   - Verify SMTP configuration
   - Check email service limits
   - Validate email templates

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

### Console Logging
- Production code uses only `console.error` for error tracking
- Only essential startup logs remain (database connection, server startup)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary and confidential. All rights reserved.

## 📞 Support

For technical support or questions:
- Email: support@pvjewellers.in
- Documentation: Check this README and inline code comments
- Issues: Create issues in the project repository

## 📋 Recent Updates

### Code Quality Improvements
- ✅ Standardized error logging to use `console.error` only
- ✅ Enhanced error tracking and code maintainability

### Metal Rates System
- ✅ Fixed metal rate update functionality with proper validation
- ✅ Added source field validation (ENUM: 'manual' or 'api')
- ✅ Improved error handling and user feedback
- ✅ Enhanced rate calculation and history tracking

### Image Optimization
- ✅ Implemented image compression for all assets
- ✅ Optimized images to reduce file sizes while maintaining quality
- ✅ Preserved original file extensions and names
- ✅ Improved page load performance

## 🎉 Acknowledgments

- React team for the amazing framework
- Vite team for the fast build tool
- Express.js team for the web framework
- All contributors and developers involved

---

**PVJ Jewelry Store** - Your Premium Jewelry Destination 🏆
