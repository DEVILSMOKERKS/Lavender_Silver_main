import React, { useState, useEffect, useContext } from "react";
import { LuFacebook } from "react-icons/lu";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SlSocialYoutube } from "react-icons/sl";
import { Phone, Mail, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/img/Logo/logo2.png?w=140&format=webp&q=75";
import footerBg from "../../assets/img/Logo/footer.png?w=721&format=webp&q=75";
import diamondDecor from "../../assets/img/icons/diamond2.png";
import "./Footer.css";
import PvjMember from "../pvj-member/PvjMember";
import { HashLink } from 'react-router-hash-link';
import { UserContext } from "../../context/UserContext";
import { useDynamicLinks } from "../../hooks/useDynamicLinks";
import { getWhatsAppURL, getTelURL, getMailtoURL, getGoogleMapsURL } from "../../utils/dynamicLinks";
import Newsletter from "./Newsletter";

// Update Footer to accept setIsSignupOpen as a prop
const Footer = React.memo(({ setIsSignupOpen }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { links } = useDynamicLinks();

  // handle track order
  const handleTrackOrderClick = (e) => {
    e.preventDefault();
    if (user) {
      // Navigate to myaccount with orders section hash link
      localStorage.setItem('myAccountSelectedMenu', 'Orders');
      navigate("/myaccount#orders");
    } else if (setIsSignupOpen) {
      setIsSignupOpen(true);
    } else {
      navigate("/signup");
    }
  };

  return (
    <>
      <PvjMember />
      <footer className="footer-section">
        {/* Top right diamond image */}
        <img
          src={diamondDecor}
          alt="Diamond"
          className="footer-diamond-top-right"
          width="100"
          height="100"
          loading="lazy"
          decoding="async"
        />
        <img
          src={diamondDecor}
          alt="Diamond"
          className="footer-diamond-top-left"
          width="100"
          height="100"
          loading="lazy"
          decoding="async"
        />
        <div className="footer-container mx-auto px-6 lg:px-16 pt-60 pb-32">
          {/* Main Footer Content - 5 Columns */}
          <div
            className="footer-grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12 fopto"
            style={{ paddingTop: "50px" }}
          >
            {/* Column 1: Logo and Description */}
            <div className="footer-brand lg:col-span-1 mr-20">
              <div className="footer-logo-container mb-4">
                <div className="footer-logo-diamond"></div>
                <div className="footer-logo-text">
                  <span className="footer-logo-main">
                    <Link to='/'><img src={logo} alt="Lavender Silver Logo" loading="lazy" decoding="async" width="140" height="91" /></Link>
                  </span>
                </div>
              </div>
              <p className="footer-description">
                Lavender Silver Offers Timeless Craftsmanship, Exclusive
                Collections, And Trusted Service To Celebrate Your Most Precious
                Moments With Unmatched Elegance And Purity.
              </p>
            </div>

            {/* Column 2: Company */}
            <div className="footer-column" style={{ marginLeft: "70px" }}>
              <h3 className="footer-heading">Company</h3>
              <ul className="footer-links">
                <li>
                  <Link to="/" className="footer-link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/About-us" className="footer-link">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/blogs" className="footer-link">
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="footer-link">
                    All Collection
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="footer-link">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Shop */}
            <div className="footer-column" style={{ marginLeft: "50px" }}>
              <h3 className="footer-heading">Shop</h3>
              <ul className="footer-links">
                <li>
                  <HashLink smooth to="/#main-category-section" className="footer-link">
                    Categories
                  </HashLink>
                </li>
                <li>
                  <Link to="/shop?sort=new" className="footer-link">
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link to="/shop?sort=best" className="footer-link">
                    Bestsellers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Customer Care */}
            <div className="footer-column">
              <h3 className="footer-heading">Customer Care</h3>
              <ul className="footer-links">
                <li>
                  <Link to="/faq" className="footer-link">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-policy" className="footer-link">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="footer-link">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/return-and-cancellation" className="footer-link">
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="footer-link">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Contact Info & Social */}
            <div className="footer-column footer-contact-social-column">
              {/* Contact Info Section */}
              <div className="contact-section">
                <h3 className="footer-heading">Contact Info</h3>
                <ul className="footer-contact-list">
                  <li className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} className="footer-contact-icon" />
                    <a href={getGoogleMapsURL(links.address)} target="_blank" rel="noopener noreferrer" className="footer-contact-link" style={{ display: 'inline', color: 'inherit', textDecoration: 'none' }}>
                      {links.address}
                    </a>
                  </li>
                  <li className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} className="footer-contact-icon" />
                    <a
                      href={getTelURL(links.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-contact-link"
                      style={{ display: 'inline', color: 'inherit', textDecoration: 'none' }}
                    >
                      {links.whatsapp}
                    </a>
                  </li>
                  <li className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} className="footer-contact-icon" />
                    <a
                      href={getMailtoURL(links.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-contact-link"
                      style={{ display: 'inline', color: 'inherit', textDecoration: 'none' }}
                    >
                      {links.email}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Social Section */}
              <div className="social-section">
                <h3 className="footer-heading">Follow Us On:-</h3>
                <div className="footer-social-links">
                  <a
                    href={links.facebook}
                    className="footer-social-link"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LuFacebook />
                  </a>
                  <a
                    href={links.instagram}
                    className="footer-social-link"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href={getWhatsAppURL(links.whatsapp)}
                    className="footer-social-link"
                    aria-label="WhatsApp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaWhatsapp />
                  </a>
                  <a
                    href={links.youtube}
                    className="footer-social-link"
                    aria-label="YouTube"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SlSocialYoutube />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <Newsletter />

          {/* Large Background Image */}
          <div className="footer-bg-img">
            <img src={footerBg} alt="Lavender Silver" loading="lazy" decoding="async" width="5120" height="940" sizes="(max-width: 768px) 100vw, 721px" />
          </div>
        </div>
      </footer>
    </>
  );
});

Footer.displayName = 'Footer';

// Update MobileFooter to accept setIsSignupOpen as a prop
const MobileFooter = React.memo(({ setIsSignupOpen }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { links } = useDynamicLinks();

  const handleTrackOrderClick = (e) => {
    e.preventDefault();
    if (user) {
      // Navigate to myaccount with orders section hash link
      localStorage.setItem('myAccountSelectedMenu', 'Orders');
      navigate("/myaccount#orders");
    } else if (setIsSignupOpen) {
      setIsSignupOpen(true);
    } else {
      navigate("/signup");
    }
  };

  return (
    <>
      <PvjMember />
      <footer className="mobile-footer-section">
        {/* Logo and Description */}
        <div className="mobile-footer-logo-desc">
          <div className="footer-logo-container mb-4">
            <div className="footer-logo-diamond"></div>
            <div className="footer-logo-text">
              <span className="footer-logo-main">
                <Link to='/'><img src={logo} alt="Lavender Silver Logo" className="mobile-footer-logo" loading="lazy" decoding="async" width="140" height="91" /></Link>
              </span>
            </div>
          </div>
          <p className="mobile-footer-description">
            Lavender Silver Offers Timeless Craftsmanship, Exclusive
            Collections, And Trusted Service To Celebrate Your Most Precious
            Moments With Unmatched Elegance And Purity.
          </p>
        </div>

        {/* Main Links */}
        <div className="mobile-footer-links-blocks">
          <div className="mobile-footer-links-col">
            <h3 className="mobile-footer-heading">Company</h3>
            <ul>
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/About-us" className="footer-link">About Us</Link></li>
              <li><Link to="/blogs" className="footer-link">Blogs</Link></li>
              <li><Link to="/carts" className="footer-link">All Collection</Link></li>
              <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
            </ul>
          </div>

          <div className="mobile-footer-links-col">
            <h3 className="mobile-footer-heading">Shop</h3>
            <ul>
              <li>
                <HashLink smooth to="/#main-category-section" className="footer-link">
                  Categories
                </HashLink>
              </li>
              <li>
                <Link to="/shop?sort=new" className="footer-link">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=best" className="footer-link">
                  Bestsellers
                </Link>
              </li>
            </ul>
          </div>

          <div className="mobile-footer-links-col">
            <h3 className="mobile-footer-heading">Customer Care</h3>
            <ul>
              <li><Link to="/faq" className="footer-link">FAQs</Link></li>
              <li><Link to="/shipping-policy" className="footer-link">Shipping Policy</Link></li>
              <li><Link to="/privacy-policy" className="footer-link">Privacy Policy</Link></li>
              <li><Link to="/return-and-cancellation" className="footer-link">Return Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="footer-link">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mobile-footer-contact-info">
          <h3 className="mobile-footer-heading">Contact Info</h3>
          <ul className="footer-contact-list">
            <li className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} className="mobile-footer-contact-icon" />
              <a href={getGoogleMapsURL(links.address)} target="_blank" rel="noopener noreferrer" className="footer-contact-link" style={{ display: 'inline', color: 'inherit', textDecoration: 'none' }}>
                {links.address}
              </a>
            </li>
            <li className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} className="mobile-footer-contact-icon" />
              <a
                href={getTelURL(links.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-link"
                style={{ display: 'inline', color: 'inherit', textDecoration: 'none' }}
              >
                {links.whatsapp}
              </a>
            </li>
            <li className="footer-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} className="mobile-footer-contact-icon" />
              <a
                href={getMailtoURL(links.email)}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-link"
                style={{ display: 'inline', color: 'inherit', textDecoration: 'none' }}
              >
                {links.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Social Links */}
        <div className="mobile-footer-social">
          <h3 className="mobile-footer-heading">Follow Us On:-</h3>
          <div className="mobile-footer-social-links">
            <a
              href={links.facebook}
              className="footer-social-link"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LuFacebook />
            </a>
            <a
              href={links.instagram}
              className="footer-social-link"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href={getWhatsAppURL(links.whatsapp)}
              className="footer-social-link"
              aria-label="WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp />
            </a>
            <a
              href={links.youtube}
              className="footer-social-link"
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
            >
              <SlSocialYoutube />
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mobile-footer-bottom">
          <div className="mobile-footer-divider"></div>
          <div className="mobile-footer-large-text">
            <img src={footerBg} alt="Lavender Silver" className="mobile-footer-large-logo" loading="lazy" decoding="async" width="721" height="132" sizes="(max-width: 768px) 100vw, 721px" />
          </div>
        </div>
      </footer>
    </>
  );
});

MobileFooter.displayName = 'MobileFooter';

// Update ResponsiveFooter to pass setIsSignupOpen to Footer and MobileFooter
const ResponsiveFooter = React.memo((props) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

  useEffect(() => {
    // Throttle resize events to reduce main-thread work
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 769);
      }, 150); // Throttle to 150ms
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return isMobile ? <MobileFooter {...props} /> : <Footer {...props} />;
});

ResponsiveFooter.displayName = 'ResponsiveFooter';

export default ResponsiveFooter;
