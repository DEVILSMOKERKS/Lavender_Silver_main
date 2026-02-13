import React from 'react'
import './OldGoldExchange.css';
import diamondIcon from '../../assets/img/icons/diamond.png';
import profit from '../../assets/img/icons/profit.png';
import security from '../../assets/img/icons/security.png';
import Process_cycle from '../../assets/img/icons/Process_cycle.png';
import necklace from '../../assets/img/icons/necklace.png';

const OldGoldExchange = () => {
  return (
    <div className='oldExchange-container'>
      {/* Diamond Icon at Top */}
      <div className='old-exchange-diamond-top'>
        <img src={diamondIcon} alt="Diamond Icon" className='old-exchange-header-icon' loading="lazy" decoding="async" />
      </div>
      {/* Heading Section */}
      <div className='old-exchange-header'>
        <div className='old-exchange-header-line old-exchange-header-line-left'></div>
        <div className='old-exchange-header-content'>
          <span className='old-exchange-header-title1'>Why Choose Our <span className='old-exchange-header-title2'>Gold</span></span>
          <span className='old-exchange-header-title3'>Exchange</span>
        </div>
        <div className='old-exchange-header-line old-exchange-header-line-right'></div>
      </div>
      <div className='old-exchange-header-desc'>
        Experience The Most Trusted And Transparent Gold Exchange Process With Guaranteed Satisfaction
      </div>

      {/* Feature Cards */}
      <div className="old-exchange-cards">
        <div className="old-exchange-card">
          <div className="old-exchange-card-imgwrap">
            <img src={profit} alt="Best Market Value" className="old-exchange-card-icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">Best Market Value</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc">Get The Highest Rates Based On Current Market Prices With No Hidden Deductions.</p>
        </div>
        <div className="old-exchange-card">
          <div className="old-exchange-card-imgwrap">
            <img src={security} alt="100% Transparent" className="old-exchange-card-icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">100% Transparent</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc">Watch The Entire Evaluation Process With German Technology And Digital Scales.</p>
        </div>
        <div className="old-exchange-card">
          <div className="old-exchange-card-imgwrap">
            <img src={Process_cycle} alt="Instant Process" className="old-exchange-card-icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">Instant Process</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc">Quick Evaluation And Immediate Exchange - Walk Out With New Jewelry In Minutes.</p>
        </div>
        <div className="old-exchange-card">
          <div className="old-exchange-card-imgwrap">
            <img src={necklace} alt="Free Upgrade" className="old-exchange-card-icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">Free Upgrade</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc">Upgrade To Modern Designs With Craftsmanship Bonus And Exclusive Collections.</p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="old-exchange-banner-container">
        <div className="old-exchange-banner">
          <div className="old-exchange-banner-item">
            <h4>50,000+</h4>
            <p>Happy Customer</p>
          </div>
          <div className="old-exchange-banner-item">
            <h4>&#8377;100Cr+</h4>
            <p>Gold Exchanged</p>
          </div>
          <div className="old-exchange-banner-item">
            <h4>99.8%</h4>
            <p>Satisfaction Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OldGoldExchange;
