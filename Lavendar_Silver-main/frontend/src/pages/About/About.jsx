import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './About.css';
import about1 from '../../assets/img/about1.png';
import missionIcon from '../../assets/img/icons/mission.png';
import visionIcon from '../../assets/img/icons/vision.png';
import diamond3 from '../../assets/img/icons/diamond3.png';
import necklace from '../../assets/img/icons/necklace.png';
import { Gem, Award, Palette, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import diamond from "../../assets/img/icons/diamond.png";
import icon1 from "../../assets/img/icons/1.png";
import icon2 from "../../assets/img/icons/2.png";
import icon3 from "../../assets/img/icons/3.png";
import aboutup from '../../assets/img/aboutup.jpg';
import aboutbg from '../../assets/img/aboutbg.jpg';
import Blog from '../../components/blog/Blog';
import PvjMember from '../../components/pvj-member/PvjMember';
import rectangle137 from '../../assets/img/Rectangle 137.png';
import rectangle106 from '../../assets/img/Rectangle 106.png';
import { HashLink } from 'react-router-hash-link';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AboutSection = () => {
  const [aboutData, setAboutData] = useState({
    aboutSection: null,
    missionVision: [],
    journeyTimeline: [],
    craftsmanship: null,
    whatMakesUs: null,
    whoWeAre: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutUsData = async () => {
      try {
        // Fetch all About Us data
        const response = await axios.get(`${API_BASE_URL}/api/about-us/all`);

        if (response.data.success) {
          const data = response.data.data;

          setAboutData({
            aboutSection: data.aboutSection || null,
            missionVision: data.missionVision || [],
            journeyTimeline: data.journeyTimeline || [],
            craftsmanship: data.craftsmanship || null,
            whatMakesUs: data.whatMakesUs || null,
            whoWeAre: data.whoWeAre || null
          });
        }
      } catch (error) {
        console.error('Error fetching About Us data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutUsData();
  }, []);

  if (loading) {
    return (
      <div className="about-container">
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h2>Loading About Us...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="about-container">
      {/* Top Banner Image */}
      <div className="about-banner">
        <div className="about-banner-overlay"></div>
        <div className="about-banner-content">
          <h1 className="about-banner-title">ABOUT US</h1>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="about-main-section">
        <div className="about-content-wrapper">
          <div className="about-grid">
            {/* Left Text Section */}
            <div className="about-text-area">
              <div className="about-header">
                <h2 className="about-section-title">
                  {aboutData.aboutSection?.section_title || "WHO WE ARE"}
                </h2>
                <div className="about-title-line"></div>
              </div>
              <h3 className="about-main-title">
                {aboutData.aboutSection?.subheading || "Crafting More Than Jewellery — We Craft Emotions"}
              </h3>
              <div className="about-text-content">
                <p>
                  {aboutData.aboutSection?.description ||
                    "At Lavender Silver, we believe jewellery is not just an accessory — it's a reflection of your story, your culture, and your individuality. Born from a passion for timeless beauty and rooted in fine craftsmanship, our brand blends traditional elegance with modern style."
                  }
                </p>
              </div>
              <HashLink smooth to="#journey-section" className="about-view-btn">
                {aboutData.aboutSection?.button_text || "View More"}
              </HashLink>
            </div>
            {/* Right Image Section */}
            <div className="about-image-area">
              <div className="about-image-container">
                <img
                  src={aboutData.aboutSection?.image_url ? `${API_BASE_URL}${aboutData.aboutSection.image_url}` : about1}
                  alt="Jewelry showcase"
                  className="about-main-img"
                  loading="lazy"
                />
                {/* Lavender Silver Logo Overlay */}
                <div className="about-logo-overlay">
                  <div className="about-logo-content">
                    <div className="about-logo-text">
                      {aboutData.aboutSection?.badge_text || "Lavender Silver"}
                    </div>
                    <div className="about-logo-line"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mission & Vision Section */}
      <MissionVisionSection missionVision={aboutData.missionVision} />
      {/* journey section */}
      <div id="journey-section">
        <JourneySection journeyTimeline={aboutData.journeyTimeline} />
      </div>
      {/* Craftsmanship Section */}
      <CraftsmanshipSection craftsmanship={aboutData.craftsmanship} />
      {/* What Makes Us Different Section */}
      <WhatMakesUsDifferentSection whatMakesUs={aboutData.whatMakesUs} whoWeAre={aboutData.whoWeAre} />
    </div>
  );
};

const MissionVisionSection = ({ missionVision }) => {
  // Check if we have valid data from backend
  const hasBackendData = missionVision && missionVision.length > 0;

  if (hasBackendData) {
    // Use dynamic data from backend
    const missionEntry = missionVision.find(item => item.type === 'mission') || missionVision[0];
    const visionEntry = missionVision.find(item => item.type === 'vision') || missionVision[1];

    return (
      <div className="mission-vision-section">
        {/* Top Left Necklace Image */}
        <img src={necklace} alt="Necklace" className="mission-vision-necklace" loading="lazy" decoding="async" />
        <div className="mission-vision-container">
          {/* Mission & Vision Cards Centered */}
          <div className="mission-vision-cards">
            {/* Mission */}
            {missionEntry && (
              <div className="mission-card">
                <div className="mission-icon">
                  <img
                    src={missionEntry?.icon_url ?
                      `${API_BASE_URL}${missionEntry.icon_url}` :
                      missionIcon}
                    alt="Mission Icon"
                    className="mission-vision-img"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h2 className="mission-title">
                    {missionEntry?.title || "OUR MISSION"}
                  </h2>
                  <p className="mission-text">
                    {missionEntry?.description ||
                      "Capture Hearts With Exquisite Designs At An Exceptional Value, And An Unmatched Customer Experience."
                    }
                  </p>
                </div>
              </div>
            )}
            {/* Vision */}
            {visionEntry && (
              <div className="vision-card">
                <div className="vision-icon">
                  <img
                    src={visionEntry?.icon_url ?
                      `${API_BASE_URL}${visionEntry.icon_url}` :
                      visionIcon}
                    alt="Vision Icon"
                    className="mission-vision-img"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h2 className="vision-title">
                    {visionEntry?.title || "OUR VISION"}
                  </h2>
                  <p className="vision-text">
                    {visionEntry?.description ||
                      "Become The Most Loved Jewellery Brand In India & Beyond!"
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Right Center Diamond Image */}
          <img src={diamond3} alt="Diamond" className="mission-vision-diamond" loading="lazy" decoding="async" />
        </div>
      </div>
    );
  } else {
    // Use static data (original hardcoded content)

    return (
      <div className="mission-vision-section">
        {/* Top Left Necklace Image */}
        <img src={necklace} alt="Necklace" className="mission-vision-necklace" loading="lazy" decoding="async" />
        <div className="mission-vision-container">
          {/* Mission & Vision Cards Centered */}
          <div className="mission-vision-cards">
            {/* Mission */}
            <div className="mission-card">
              <div className="mission-icon">
                <img src={missionIcon} alt="Mission Icon" className="mission-vision-img" loading="lazy" decoding="async" />
              </div>
              <div>
                <h2 className="mission-title">OUR MISSION</h2>
                <p className="mission-text">
                  Capture Hearts With Exquisite Designs At An Exceptional Value, And An Unmatched Customer Experience.
                </p>
              </div>
            </div>
            {/* Vision */}
            <div className="vision-card">
              <div className="vision-icon">
                <img src={visionIcon} alt="Vision Icon" className="mission-vision-img" loading="lazy" decoding="async" />
              </div>
              <div>
                <h2 className="vision-title">OUR VISION</h2>
                <p className="vision-text">
                  Become The Most Loved Jewellery Brand In India & Beyond!
                </p>
              </div>
            </div>
          </div>
          {/* Right Center Diamond Image */}
          <img src={diamond3} alt="Diamond" className="mission-vision-diamond" loading="lazy" decoding="async" />
        </div>
      </div>
    );
  }
};

const JourneySection = ({ journeyTimeline }) => {
  // Check if we have valid data from backend
  const hasBackendData = journeyTimeline && journeyTimeline.length > 0;
  const scrollContainerRef = React.useRef(null);
  const [showPrevButton, setShowPrevButton] = React.useState(false);
  const [showNextButton, setShowNextButton] = React.useState(true);

  // Check scroll position and update button visibility
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      setShowPrevButton(scrollLeft > 0);
      setShowNextButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      checkScrollButtons();
      const container = scrollContainerRef.current;
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [hasBackendData, journeyTimeline]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.journey-card')?.offsetWidth || 350;
      scrollContainerRef.current.scrollBy({
        left: -cardWidth - 20,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.journey-card')?.offsetWidth || 350;
      scrollContainerRef.current.scrollBy({
        left: cardWidth + 20,
        behavior: 'smooth'
      });
    }
  };

  if (hasBackendData) {
    // Use dynamic data from backend

    return (
      <div className="journey-container">
        <div className="journey-title-area">
          <img src={diamond} alt="diamond" className="journey-title-icon" loading="lazy" decoding="async" />
          <div className="journey-title-block">
            <div className="journey-title-line journey-title-line-left" />
            <h2 className="journey-title-text">
              {journeyTimeline[0]?.heading_title || "The Journey"}
            </h2>
            <div className="journey-title-line journey-title-line-right" />
          </div>
        </div>
        <div className="journey-carousel-container">
          <div className="journey-scroll-wrapper">
            <div
              className="journey-carousel"
              ref={scrollContainerRef}
              onScroll={checkScrollButtons}
            >
              {journeyTimeline.map((item, idx) => (
                <div key={idx} className="journey-card-wrapper">
                  <div className="journey-card" style={{ position: 'relative' }}>
                    <div className='journey-card-img-wrapper'>
                      <img src={item.image_url ? `${API_BASE_URL}${item.image_url}` : rectangle137} alt={item.year} className="journey-card-img" loading="lazy" decoding="async" />
                    </div>
                    <div className="journey-card-content">
                      <div className="journey-card-year">{item.year}</div>
                      <div className="journey-card-desc">{item.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Custom arrows below the carousel */}
          <div className="journey-carousel-arrow-group">
            {showPrevButton && (
              <button
                className="journey-arrow"
                onClick={scrollLeft}
                aria-label="Previous"
              >
                <ArrowLeft size={22} />
              </button>
            )}
            {showNextButton && (
              <button
                className="journey-arrow"
                onClick={scrollRight}
                aria-label="Next"
              >
                <ArrowRight size={22} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // Use static data (original hardcoded content)

    const journeyData = [
      { year: '2018', desc: `Founded with a vision to bring authentic, handcrafted jewelry to every home. Our journey began with a commitment to quality and craftsmanship.`, img: rectangle137 },
      { year: '2020', desc: `Expanded our reach and introduced innovative designs, blending traditional techniques with modern aesthetics. Building trust, one piece at a time.`, img: rectangle106 },
      { year: '2022', desc: `Reached new milestones in customer satisfaction and product excellence. Continuing to craft emotions and create memories through our jewelry.`, img: rectangle137 },
    ];

    return (
      <div className="journey-container">
        <div className="journey-title-area">
          <img src={diamond} alt="diamond" className="journey-title-icon" loading="lazy" decoding="async" />
          <div className="journey-title-block">
            <div className="journey-title-line journey-title-line-left" />
            <h2 className="journey-title-text">The Journey</h2>
            <div className="journey-title-line journey-title-line-right" />
          </div>
        </div>
        <div className="journey-carousel-container">
          <div className="journey-scroll-wrapper">
            <div
              className="journey-carousel"
              ref={scrollContainerRef}
              onScroll={checkScrollButtons}
            >
              {journeyData.map((item, idx) => (
                <div key={idx} className="journey-card-wrapper">
                  <div className="journey-card" style={{ position: 'relative' }}>
                    <div className='journey-card-img-wrapper'>
                      <img src={item.img} alt={item.year} className="journey-card-img" loading="lazy" decoding="async" />
                    </div>
                    <div className="journey-card-content">
                      <div className="journey-card-year">{item.year}</div>
                      <div className="journey-card-desc">{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Custom arrows below the carousel */}
          <div className="journey-carousel-arrow-group">
            {showPrevButton && (
              <button
                className="journey-arrow"
                onClick={scrollLeft}
                aria-label="Previous"
              >
                <ArrowLeft size={22} />
              </button>
            )}
            {showNextButton && (
              <button
                className="journey-arrow"
                onClick={scrollRight}
                aria-label="Next"
              >
                <ArrowRight size={22} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const CraftsmanshipSection = ({ craftsmanship }) => {
  // Check if we have valid data from backend
  const hasBackendData = craftsmanship && craftsmanship.id;

  if (hasBackendData) {
    // Use dynamic data from backend

    return (
      <div className="craftsmanship-wrapper">
        <div className="craftsmanship-container">
          {/* Header Section */}
          <div className="craftsmanship-header">
            <div className="craftsmanship-icon-wrapper">
              <img src={diamond} alt="Diamond Icon" className="craftsmanship-header-img" loading="lazy" decoding="async" />
            </div>
            <div className="craftsmanship-title-row">
              <span className="craftsmanship-title-line-left"></span>
              <h2 className="craftsmanship-main-title">
                {craftsmanship?.heading_title || "Craftsmanship & Quality"}
              </h2>
              <span className="craftsmanship-title-line-right"></span>
            </div>
            <p className="craftsmanship-subtitle">
              {craftsmanship?.subheading || "Every Piece Is A Promise Of Purity, Precision, And Passion."}
            </p>
          </div>
          {/* Features Grid */}
          <div className="craftsmanship-grid">
            {/* Artisan Crafted Card */}
            <div className="craftsmanship-card">
              <div className="craftsmanship-card-icon-wrapper">
                <div className="craftsmanship-card-icon-bg">
                  <span className="craftsmanship-card-icon">
                    <img
                      src={craftsmanship?.card1_icon_url ? `${API_BASE_URL}${craftsmanship.card1_icon_url}` : icon1}
                      alt="Artisan Crafted Icon"
                      className="craftsmanship-card-img"
                      loading="lazy"
                    />
                  </span>
                </div>
              </div>
              <h3 className="craftsmanship-card-title">
                {craftsmanship?.card1_title || "Artisan Crafted"}
              </h3>
              <p className="craftsmanship-card-description">
                {craftsmanship?.card1_description ||
                  "We Work With Skilled Artisans Who Bring Decades Of Experience To Each Piece, Blending Traditional Techniques With Modern Innovation."
                }
              </p>
            </div>
            {/* Certified Materials Card */}
            <div className="craftsmanship-card">
              <div className="craftsmanship-card-icon-wrapper">
                <div className="craftsmanship-card-icon-bg">
                  <span className="craftsmanship-card-icon">
                    <img
                      src={craftsmanship?.card2_icon_url ? `${API_BASE_URL}${craftsmanship.card2_icon_url}` : icon2}
                      alt="Certified Materials Icon"
                      className="craftsmanship-card-img"
                      loading="lazy"
                    />
                  </span>
                </div>
              </div>
              <h3 className="craftsmanship-card-title">
                {craftsmanship?.card2_title || "Certified Materials"}
              </h3>
              <p className="craftsmanship-card-description">
                {craftsmanship?.card2_description ||
                  "From Ethically Mined Gemstones To 100% Real Gold, Silver, And Diamonds — Our Commitment To Authenticity Defines Our Work."
                }
              </p>
            </div>
            {/* Precision Design Card */}
            <div className="craftsmanship-card">
              <div className="craftsmanship-card-icon-wrapper">
                <div className="craftsmanship-card-icon-bg">
                  <span className="craftsmanship-card-icon">
                    <img
                      src={craftsmanship?.card3_icon_url ? `${API_BASE_URL}${craftsmanship.card3_icon_url}` : icon3}
                      alt="Precision Design Icon"
                      className="craftsmanship-card-img"
                      loading="lazy"
                    />
                  </span>
                </div>
              </div>
              <h3 className="craftsmanship-card-title">
                {craftsmanship?.card3_title || "Precision Design"}
              </h3>
              <p className="craftsmanship-card-description">
                {craftsmanship?.card3_description ||
                  "Each Piece Undergoes A Meticulous Design Process, Ensuring Perfect Balance Between Artistic Expression And Wearable Comfort."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Use static data (original hardcoded content)

    return (
      <div className="craftsmanship-wrapper">
        <div className="craftsmanship-container">
          {/* Header Section */}
          <div className="craftsmanship-header">
            <div className="craftsmanship-icon-wrapper">
              <img src={diamond} alt="Diamond Icon" className="craftsmanship-header-img" loading="lazy" decoding="async" />
            </div>
            <div className="craftsmanship-title-row">
              <span className="craftsmanship-title-line-left"></span>
              <h2 className="craftsmanship-main-title">
                Craftsmanship & Quality
              </h2>
              <span className="craftsmanship-title-line-right"></span>
            </div>
            <p className="craftsmanship-subtitle">
              Every Piece Is A Promise Of Purity, Precision, And Passion.
            </p>
          </div>
          {/* Features Grid */}
          <div className="craftsmanship-grid">
            {/* Artisan Crafted Card */}
            <div className="craftsmanship-card">
              <div className="craftsmanship-card-icon-wrapper">
                <div className="craftsmanship-card-icon-bg">
                  <span className="craftsmanship-card-icon">
                    <img src={icon1} alt="Artisan Crafted Icon" className="craftsmanship-card-img" loading="lazy" decoding="async" />
                  </span>
                </div>
              </div>
              <h3 className="craftsmanship-card-title">Artisan Crafted</h3>
              <p className="craftsmanship-card-description">
                We Work With Skilled Artisans Who Bring Decades Of Experience To Each Piece, Blending Traditional Techniques With Modern Innovation.
              </p>
            </div>
            {/* Certified Materials Card */}
            <div className="craftsmanship-card">
              <div className="craftsmanship-card-icon-wrapper">
                <div className="craftsmanship-card-icon-bg">
                  <span className="craftsmanship-card-icon">
                    <img src={icon2} alt="Certified Materials Icon" className="craftsmanship-card-img" loading="lazy" decoding="async" />
                  </span>
                </div>
              </div>
              <h3 className="craftsmanship-card-title">Certified Materials</h3>
              <p className="craftsmanship-card-description">
                From Ethically Mined Gemstones To 100% Real Gold, Silver, And Diamonds — Our Commitment To Authenticity Defines Our Work.
              </p>
            </div>
            {/* Precision Design Card */}
            <div className="craftsmanship-card">
              <div className="craftsmanship-card-icon-wrapper">
                <div className="craftsmanship-card-icon-bg">
                  <span className="craftsmanship-card-icon">
                    <img src={icon3} alt="Precision Design Icon" className="craftsmanship-card-img" loading="lazy" decoding="async" />
                  </span>
                </div>
              </div>
              <h3 className="craftsmanship-card-title">Precision Design</h3>
              <p className="craftsmanship-card-description">
                Each Piece Undergoes A Meticulous Design Process, Ensuring Perfect Balance Between Artistic Expression And Wearable Comfort.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

const WhatMakesUsDifferentSection = ({ whatMakesUs, whoWeAre }) => {

  return (
    <div className="different-wrapper">
      {/* What Makes Us Different Section */}
      <div className="different-main-section" style={{ backgroundImage: `url(${aboutbg})` }}>
        <div className="different-overlay"></div>
        <div className="different-content-container">
          {/* Header - Centered above both image and text */}
          <div className="different-header">
            <div className="about-different-title-line">
              <span className="about-different-title-line-left"></span>
              <h2 className="about-different-title">
                {whatMakesUs?.section_heading || "WHAT MAKES US DIFFERENT"}
              </h2>
              <span className="about-different-title-line-right"></span>
            </div>
          </div>
          <div className="different-grid">
            {/* Left Image Section */}
            <div className="different-image-area">
              <div className="different-image-frame">
                <img
                  src={whatMakesUs?.image_url ? `${API_BASE_URL}${whatMakesUs.image_url}` : aboutup}
                  alt="Jewelry model"
                  className="different-main-image"
                  loading="lazy"
                />
              </div>
            </div>
            {/* Right Content Section */}
            <div className="different-text-area">
              {/* Features List */}
              <div className="different-features-list">
                {/* Feature 1 */}
                <div className="different-feature-item">
                  <div className="different-check-icon">
                    <Check className="different-check-svg" />
                  </div>
                  <div className="different-feature-content">
                    <h3 className="different-feature-title">
                      {whatMakesUs?.point1_title || "Certified Precious Metals & Gemstones"}
                    </h3>
                    <p className="different-feature-description">
                      {whatMakesUs?.point1_subtitle ||
                        "Every Stone And Metal We Use Is Certified For Purity And Quality, Giving You Complete Confidence In Your Purchase."
                      }
                    </p>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="different-feature-item">
                  <div className="different-check-icon">
                    <Check className="different-check-svg" />
                  </div>
                  <div className="different-feature-content">
                    <h3 className="different-feature-title">
                      {whatMakesUs?.point2_title || "Handcrafted By Local Artisans"}
                    </h3>
                    <p className="different-feature-description">
                      {whatMakesUs?.point2_subtitle ||
                        "Our Pieces Are Crafted By Skilled Local Artisans, Preserving Traditional Techniques While Supporting Local Communities."
                      }
                    </p>
                  </div>
                </div>
                {/* Feature 3 */}
                <div className="different-feature-item">
                  <div className="different-check-icon">
                    <Check className="different-check-svg" />
                  </div>
                  <div className="different-feature-content">
                    <h3 className="different-feature-title">
                      {whatMakesUs?.point3_title || "Custom Design & Bridal Collection"}
                    </h3>
                    <p className="different-feature-description">
                      {whatMakesUs?.point3_subtitle ||
                        "Create Your Dream Jewelry With Our Bespoke Design Service, Perfect For Creating Heirloom Pieces And Wedding Collections."
                      }
                    </p>
                  </div>
                </div>
                {/* Feature 4 */}
                <div className="different-feature-item">
                  <div className="different-check-icon">
                    <Check className="different-check-svg" />
                  </div>
                  <div className="different-feature-content">
                    <h3 className="different-feature-title">
                      {whatMakesUs?.point4_title || "100% Transparency & BIS Hallmarked Jewellery"}
                    </h3>
                    <p className="different-feature-description">
                      {whatMakesUs?.point4_subtitle ||
                        "Every Stone And Metal We Use Is Certified For Purity And Quality, Giving You Complete Confidence In Your Purchase."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Who We Are Section */}
      <div className="who-we-are-section">
        <div className="who-content-container">
          <div className="who-grid">
            {/* Left Image Section */}
            <div className="who-image-area">
              <img
                src={whoWeAre?.image_url ? `${API_BASE_URL}${whoWeAre.image_url}` : aboutbg}
                alt="Three women in traditional jewelry"
                className="who-main-image"
                loading="lazy"
              />
            </div>
            {/* Right Text Section */}
            <div className="who-text-area">
              <div className="who-header">
                <h2 className="who-section-title">
                  {whoWeAre?.heading_title || "WHO WE ARE"}
                </h2>
                <div className="who-title-line"></div>
              </div>
              <h3 className="who-main-title">
                {whoWeAre?.subheading_title || "Crafting More Than Jewellery — We Craft Emotions"}
              </h3>
              <div className="who-text-content">
                <p>
                  {whoWeAre?.content_paragraph ||
                    "At Lavender Silver, we believe jewellery is not just an accessory — it's a reflection of your story, your culture, and your individuality. Born from a passion for timeless beauty and rooted in fine craftsmanship, our brand blends traditional elegance with modern style."
                  }
                </p>
                <p className="who-additional-text">
                  {whoWeAre?.bold_text ||
                    "handcrafted by skilled artisans, we're proud to offer pieces that are as meaningful as they are magnificent"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* blog section */}
      <Blog />

    </div>
  );
};

export default AboutSection;