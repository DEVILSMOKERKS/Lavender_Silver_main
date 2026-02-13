import React from "react";
import { useNavigate } from "react-router-dom";

import "./thankyou.css";
import ringImg from "../../assets/img/Pearl-necklace-in-a-dark-red-gift-box.jpg";
import diamondIcon2 from "../../assets/img/icons/diamond5.jpeg";

const Thankyou = () => {
  const navigate = useNavigate();

  // Set background to light color
  React.useEffect(() => {
    document.body.style.background = "#f7f7fa";
    return () => { document.body.style.background = ""; };
  }, []);

  // Navigate to shop page
  const handleExplore = () => {
    navigate("/shop");
  };

  return (
    <div className="thankyou-container" style={{ background: "#f7f7fa" }}>
      <div className="thankyou-image-section">
        <img src={ringImg} alt="Diamond Ring" className="thankyou-ring-img" loading="lazy" decoding="async" />
      </div>
      <div className="card-container">
        <div className="thankyou-card">
          <div className="thankyou-border">
            <div className="thankyou-header">
              <h2> Thank You For Shopping With Us , Lavender Silver </h2>
            </div>
            <img src={diamondIcon2} alt="Diamond" className="thankyou-diamond-icon" loading="lazy" decoding="async" />
            <hr />
            <div className="thankyou-details" style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '18px', margin: '10px 0', color: '#333' }}>
                Your order will dispatch soon!
              </p>
              <p style={{ fontSize: '16px', margin: '10px 0', color: '#666' }}>
                We'll send you a confirmation email with all the details.
              </p>
            </div>
            <hr />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <button
                className="thankyou-track-btn"
                onClick={handleExplore}
              >
                Explore
              </button>
            </div>
            <img src={diamondIcon2} alt="Diamond" className="thankyou-corner-icon" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Thankyou;
