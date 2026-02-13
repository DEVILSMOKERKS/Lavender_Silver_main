import React from 'react';
import VideoCartStepper from './VideoCartStepper';
import './VideoCart.css';
import { useNavigate } from 'react-router-dom';

// Import images
import mandala1 from '../../assets/img/beautiful-ethnic-mandala-design-1.png?w=410&format=webp&q=75';
import mandala2 from '../../assets/img/beautiful-ethnic-mandala-design-2.png?w=410&format=webp&q=75';
import goldDiamond from '../../assets/img/icons/gold-dimond.png';

const VideoCartThankYou = () => {
  // const navigate = useNavigate(); // Button not needed as per reference
  return (
    <>
      <VideoCartStepper activeStep={2} />
      <div className="videocart-thankyou-bg-alt">
        <img src={mandala1} alt="mandala corner" className="thankyou-mandala top-left" loading="lazy" decoding="async" />
        <img src={mandala2} alt="mandala center" className="thankyou-mandala bottom-right" loading="lazy" decoding="async" />
        {/* Decorative diamond icon in background, top left */}
        <img src={goldDiamond} alt="diamond bg" className="thankyou-diamond-bg" loading="lazy" decoding="async" />
        {/* Gold diamond icon top right as before */}
        <img src={goldDiamond} alt="gold diamond" className="thankyou-gold-diamond-alt" loading="lazy" decoding="async" />
        <div className="videocart-thankyou-content-alt">
          <div className="thankyou-badge-alt">
            {/* Gold badge with checkmark */}
            <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M35 4c2.6 0 4.7 2.1 5 4.7l.3 2.6c.2 1.7 1.7 2.9 3.4 2.7l2.6-.3c2.6-.3 5 1.4 5.7 3.9l.7 2.5c.5 1.7 2.3 2.5 3.8 1.7l2.3-1.2c2.3-1.2 5.1-.3 6.3 2l1.2 2.3c.8 1.5 2.7 1.8 3.8.7l1.9-1.9c1.9-1.9 5-1.9 6.9 0l1.9 1.9c1.1 1.1 1.1 3 0 4.1l-1.9 1.9c-1.1 1.1-.8 3 .7 3.8l2.3 1.2c2.3 1.2 3.2 4 2 6.3l-1.2 2.3c-.8 1.5 0 3.3 1.7 3.8l2.5.7c2.5.7 4.2 3.1 3.9 5.7l-.3 2.6c-.2 1.7 1 3.2 2.7 3.4l2.6.3c2.6.3 4.7 2.4 4.7 5v2.7c0 2.6-2.1 4.7-4.7 5l-2.6.3c-1.7.2-2.9 1.7-2.7 3.4l.3 2.6c.3 2.6-1.4 5-3.9 5.7l-2.5.7c-1.7.5-2.5 2.3-1.7 3.8l1.2 2.3c1.2 2.3.3 5.1-2 6.3l-2.3 1.2c-1.5.8-1.8 2.7-.7 3.8l1.9 1.9c1.9 1.9 1.9 5 0 6.9l-1.9 1.9c-1.1 1.1-3 1.1-4.1 0l-1.9-1.9c-1.1-1.1-3-.8-3.8.7l-1.2 2.3c-1.2 2.3-4 3.2-6.3 2l-2.3-1.2c-1.5-.8-3.3 0-3.8 1.7l-.7 2.5c-.7 2.5-3.1 4.2-5.7 3.9l-2.6-.3c-1.7-.2-3.2 1-3.4 2.7l-.3 2.6c-.3 2.6-2.4 4.7-5 4.7h-2.7c-2.6 0-4.7-2.1-5-4.7l-.3-2.6c-.2-1.7-1.7-2.9-3.4-2.7l-2.6.3c-2.6.3-5-1.4-5.7-3.9l-.7-2.5c-.5-1.7-2.3-2.5-3.8-1.7l-2.3 1.2c-2.3 1.2-5.1.3-6.3-2l-1.2-2.3c-.8-1.5-2.7-1.8-3.8-.7l-1.9 1.9c-1.9 1.9-5 1.9-6.9 0l-1.9-1.9c-1.1-1.1-1.1-3 0-4.1l1.9-1.9c1.1-1.1.8-3-.7-3.8l-2.3-1.2c-2.3-1.2-3.2-4-.7-6.3l1.2-2.3c.8-1.5 0-3.3-1.7-3.8l-2.5-.7c-2.5-.7-4.2-3.1-3.9-5.7l.3-2.6c.2-1.7-1-3.2-2.7-3.4l-2.6-.3c-2.6-.3-4.7-2.4-4.7-5v-2.7c0-2.6 2.1-4.7 4.7-5l2.6-.3c1.7-.2 2.9-1.7 2.7-3.4l-.3-2.6c-.3-2.6 1.4-5 3.9-5.7l2.5-.7c1.7-.5 2.5-2.3 1.7-3.8l-1.2-2.3c-1.2-2.3-.3-5.1 2-6.3l2.3-1.2c1.5-.8 1.8-2.7.7-3.8l-1.9-1.9c-1.9-1.9-1.9-5 0-6.9l1.9-1.9c1.1-1.1 3-1.1 4.1 0l1.9 1.9c1.1 1.1 3 .8 3.8-.7l1.2-2.3c1.2-2.3 4-3.2 6.3-2l2.3 1.2c1.5.8 3.3 0 3.8-1.7l.7-2.5c.7-2.5 3.1-4.2 5.7-3.9l2.6.3c1.7.2 3.2-1 3.4-2.7l.3-2.6C30.3 6.1 32.4 4 35 4z" fill="#D6B889" />
              <path d="M24 36.5l8 8 14-16" stroke="#185c37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="videocart-thankyou-title-alt">Thank You!</h2>
          <div className="videocart-thankyou-message-alt">
            Our consultant will call you in <b>15 minutes</b> to confirm your appointment
          </div>
          <div className="videocart-thankyou-tollfree-alt">
            You can also call our toll free<br />
            <a
              href="https://wa.me/919950108143"
              className="videocart-thankyou-tollfree-number-alt"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              +919950108143
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoCartThankYou;