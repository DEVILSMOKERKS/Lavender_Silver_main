import React from 'react';
import './OldGoldHero.css';
import oldImg from '../../assets/img/banner/oldimg.png';
import star2 from '../../assets/img/banner/oldstar.png';
// import oldBanner from '../../assets/img/banner/oldbanner.png';
// import oldBannerMobile from '../../assets/img/banner/oldbannerMobile.png';
import calenderIcon from '../../assets/img/icons/calendar6.png';
import { Link } from 'react-router-dom';

const OldGoldHero = () => {
  return (
    <div className="oldgold-hero-bg">
      <img src={star2} alt="Star" className="oldgold-hero-star-decor gold-top-right" loading="lazy" decoding="async" />
      <div className="oldgold-hero-content">
        <div className="oldgold-hero-left">
          <h1>
            <span>Turn Your</span>
            <br />
            <span className="oldgold-highlight">Old Gold</span><br />
            <span>Into New <span className="oldgold-dreams">Dreams</span></span>
          </h1>
          <p className="oldgold-hero-desc">
            Exchange Your Old Gold Jewellery For Brand-New, Modern Designs<br />
            With <span className="oldgold-hero-green">Guaranteed Best Market Value</span>
          </p>
          <Link to="/video-cart" className="oldgold-hero-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src={calenderIcon} alt="calendar" loading="lazy" decoding="async" /> Book Appointments
          </Link>
        </div>
        <div className="oldgold-hero-right">
          <div className="oldgold-hero-img-frame brown-box">
            <img src={oldImg} alt="Jewelry" className="oldgold-hero-jewelry" loading="lazy" decoding="async" />
            <img src={star2} alt="Star" className="oldgold-hero-star-green" loading="lazy" decoding="async" />
            <img src={star2} alt="Star" className="oldgold-hero-star-decor img-bottom-left" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OldGoldHero;
