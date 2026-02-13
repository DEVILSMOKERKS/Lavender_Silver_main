import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import logo from '../../../assets/img/Logo/green-logo.png';
import offerIcon from '../../../assets/img/icons/admin-navbar/offer.png';
import digitalIcon from '../../../assets/img/icons/admin-navbar/digital.png';
import documentIcon from '../../../assets/img/icons/admin-navbar/document.png';
import exchangeIcon from '../../../assets/img/icons/admin-navbar/exchange.png';
import marketingIcon from '../../../assets/img/icons/admin-navbar/marketing.png';
import usersIcon from '../../../assets/img/icons/admin-navbar/users.png';
import shippingIcon from '../../../assets/img/icons/admin-navbar/shipping.png';
import bagIcon from '../../../assets/img/icons/admin-navbar/bag.png';
import productIcon from '../../../assets/img/icons/admin-navbar/product.png';
import shoppingCartIcon from '../../../assets/img/icons/admin-navbar/shopping-cart.png';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Video,
  ListOrdered,
  BookOpen,
  HeartHandshake,
  FileText,
  Layers,
  Tag,
  ShieldCheck,
  MapPin,
  UserCircle,
  Ticket,
  Phone,
  Crown,
  Mail,
  Star,
  TrendingUp,
  Facebook,
  BarChart2,
  Image,
  GalleryHorizontal,
  Sparkles,
  ImageIcon,
  FolderOpen,
  Gift,
  BookMarked,
  Instagram,
  MessageCircle,
  HelpCircle,
  FileCheck,
  Truck
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
  },
  {
    label: 'Orders & Consultations',
    icon: shoppingCartIcon,
    children: [
      { label: 'Orders Management', path: '/admin/orders/orders-management', icon: ShoppingCart },
      { label: 'Video Consultations', path: '/admin/orders/video-consultations', icon: Video },
      { label: 'Cart Management', path: '/admin/orders/cart-management', icon: ListOrdered },
    ],
  },
  {
    label: 'Products & Inventory',
    icon: productIcon,
    children: [
      { label: 'Product Listing', path: '/admin/products/listing', icon: BookOpen },
      { label: 'Wishlist Monitoring', path: '/admin/products/wishlist-monitoring', icon: HeartHandshake },
      { label: 'Certificate Management', path: '/admin/products/certificate-management', icon: FileText },
      { label: 'Product Categories', path: '/admin/products/product-catelog', icon: Layers },
    ],
  },
  {
    label: 'Discounts & Coupons',
    icon: bagIcon,
    children: [
      { label: 'User Coupons', path: '/admin/carts-discounts/cart-and-discount', icon: Tag },
      { label: 'Discount Codes', path: '/admin/carts-discounts/discount-management', icon: ShieldCheck },
    ],
  },
  {
    label: 'Shipping & Delivery',
    icon: shippingIcon,
    children: [
      { label: 'Pincode Management', path: '/admin/shipping/pincode-management', icon: MapPin },
      // { label: 'Product Delivery', path: '/admin/shipping/product-delivery', icon: Truck },
    ],
  },
  {
    label: 'User Management',
    icon: usersIcon,
    path: '/admin/user-management',
    children: [
      { label: 'User Account', path: '/admin/user-management/user-account', icon: UserCircle },
      { label: 'Support Ticket', path: '/admin/user-management/support-ticket', icon: Ticket },
      { label: 'Contact Management', path: '/admin/user-management/contact-management', icon: Phone },
      { label: 'Subscribe Member', path: '/admin/user-management/elite-member-management', icon: Crown },
    ],
  },
  {
    label: 'Marketing & Insights',
    icon: marketingIcon,
    children: [
      { label: 'Email Automation', path: '/admin/marketing/email-automation', icon: Mail },
      { label: 'Review Rating', path: '/admin/marketing/review-rating', icon: Star },
      { label: 'Most Selling Products', path: '/admin/marketing/most-selling-products', icon: TrendingUp },
      { label: 'Most Selling Locations', path: '/admin/marketing/most-selling-locations', icon: MapPin },
      { label: 'Facebook Pixel', path: '/admin/marketing/facebook-pixel', icon: Facebook },
    ],
  },
  {
    label: 'Gold & Silver Price',
    icon: exchangeIcon,
    children: [
      { label: 'Rate Prediction', path: '/admin/gold-silver/rate-prediction', icon: TrendingUp },
      { label: 'Rate Update Setting', path: '/admin/gold-silver/rate-update', icon: BarChart2 },
      { label: 'Prediction Management', path: '/admin/gold-silver/prediction-management', icon: Sparkles },
    ],
  },
  {
    label: 'CMS & Content',
    icon: documentIcon,
    children: [
      { label: 'CMS Tracker', path: '/admin/cms/cms-tracker', icon: FileText },
      { label: 'Hero Banner', path: '/admin/cms/hero-banner', icon: Image },
      { label: 'Featured Category', path: '/admin/cms/featured-images', icon: GalleryHorizontal },
      { label: 'Wrapped With Love Banners', path: '/admin/cms/pvj-prediction', icon: Sparkles },
      { label: 'Gallery Management', path: '/admin/cms/gallery-management', icon: ImageIcon },
      { label: 'Second Feature Category', path: '/admin/cms/second-category', icon: FolderOpen },
      { label: 'Offer Carousel', path: '/admin/cms/offer-carousel', icon: Gift },
      { label: 'Client Diary', path: '/admin/cms/client-diary', icon: BookMarked },
      { label: 'Instagram', path: '/admin/cms/insta-images', icon: Instagram },
      { label: 'Blog Guide', path: '/admin/cms/blog-guide', icon: FileText },
      { label: 'Shop Banner', path: '/admin/cms/shop-banner', icon: Image },
      { label: 'Product Banner', path: '/admin/cms/product-banner', icon: Image },
      { label: 'Social Links', path: '/admin/cms/social-links', icon: MessageCircle },
      { label: 'About Us', path: '/admin/cms/about-us', icon: FileText },
      { label: 'FAQ Management', path: '/admin/cms/faq-management', icon: HelpCircle },
      { label: 'Return Policy', path: '/admin/cms/return-policy', icon: FileCheck },
      { label: 'Privacy Policy', path: '/admin/cms/privacy-policy', icon: FileText },
      { label: 'Terms & Conditions', path: '/admin/cms/terms-conditions', icon: FileText },
      { label: 'Shipping Policy', path: '/admin/cms/shipping-policy', icon: Truck },
    ],
  },
  {
    label: 'Digital Gold',
    icon: digitalIcon,
    path: '/admin/digital-gold',
  },
  {
    label: 'Custom Jewelry',
    icon: bagIcon,
    path: '/admin/custom-jewelry',
  },
  {
    label: '11 + 1 Plan',
    icon: offerIcon,
    path: '/admin/plan-controller-center',
  },
  {
    label: 'Chatbot Q&A',
    icon: documentIcon, // or any other icon you prefer
    path: '/admin/chatbot-qa-management',
  },
];

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Function to find active item based on current path
  const findActiveItem = (path) => {
    // First check main items
    const mainItem = navItems.find(item => item.path === path);
    if (mainItem) return mainItem.label;

    // Then check children
    for (const item of navItems) {
      if (item.children) {
        const childItem = item.children.find(child => child.path === path);
        if (childItem) {
          return childItem.label;
        }
      }
    }
    return 'Dashboard'; // Default fallback
  };

  // Find parent menu item for a given path
  const findParentMenu = (path) => {
    for (const item of navItems) {
      if (item.children && item.children.some(child => child.path === path)) {
        return item.label;
      }
    }
    return null;
  };

  const [activeItem, setActiveItem] = useState(findActiveItem(location.pathname));
  const [openSubmenu, setOpenSubmenu] = useState(findParentMenu(location.pathname));

  const handleNavClick = (item) => {
    if (item.children) {
      setOpenSubmenu(openSubmenu === item.label ? null : item.label);
    } else {
      setActiveItem(item.label);
      setOpenSubmenu(null);
      if (item.path) navigate(item.path);
      onClose && onClose();
    }
  };

  const handleSubmenuClick = (child) => {
    setActiveItem(child.label);
    if (child.path) navigate(child.path);
    onClose && onClose();
  };

  // Update active item when location changes
  useEffect(() => {
    const newActiveItem = findActiveItem(location.pathname);
    setActiveItem(newActiveItem);
    setOpenSubmenu(findParentMenu(location.pathname));
  }, [location.pathname]);

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`admin-sidebar-overlay${open ? ' open' : ''}`} onClick={onClose}></div>
      <aside className={`admin-sidebar${open ? ' open' : ''}`}>
        <Link to="/admin/dashboard" className="admin-sidebar-logo">
          <img src={logo} alt="PVJ Logo" loading="lazy" decoding="async" />
        </Link>
        {/* Close button for mobile */}
        <button className="admin-sidebar-close" onClick={onClose} aria-label="Close menu">&times;</button>
        <nav className="admin-sidebar-nav">
          <ul>
            {navItems.map(item => (
              <React.Fragment key={item.label}>
                <li
                  className={
                    (activeItem === item.label || (item.children && openSubmenu === item.label))
                      ? 'admin-sidebar-nav-item active'
                      : 'admin-sidebar-nav-item'
                  }
                  onClick={() => handleNavClick(item)}
                >
                  <span className="admin-sidebar-icon">
                    {typeof item.icon === 'string' ? (
                      <img src={item.icon} alt={item.label} style={{ width: '22px', height: '22px', display: 'block' }} loading="lazy" decoding="async" />
                    ) : (
                      <item.icon size={22} />
                    )}
                  </span>
                  <span>{item.label}</span>
                  {item.children && (
                    <span className="submenu-arrow">
                      {openSubmenu === item.label ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  )}
                </li>
                {item.children && openSubmenu === item.label && (
                  <ul className="admin-sidebar-submenu">
                    {item.children.map(child => {
                      const IconComponent = child.icon;
                      return (
                        <li
                          key={child.label}
                          className={
                            location.pathname === child.path ? 'admin-sidebar-submenu-item active' : 'admin-sidebar-submenu-item'
                          }
                          onClick={e => { e.stopPropagation(); handleSubmenuClick(child); }}
                        >
                          {IconComponent && (
                            <span className="admin-sidebar-submenu-icon">
                              <IconComponent size={16} />
                            </span>
                          )}
                          <span>{child.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </React.Fragment>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar; 