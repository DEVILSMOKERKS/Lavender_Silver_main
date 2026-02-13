import React from 'react'
import './OldGoldHowItWorks.css';
import diamondIcon from '../../assets/img/icons/diamond.png';
import oldGoldJwellery from '../../assets/img/old-gold-jwellery.png';
import oldGoldKaratmeter from '../../assets/img/old-gold-karatmeter.png';
import oldGoldMelt from '../../assets/img/old-gold-melt.png';
import oldGoldShopp from '../../assets/img/old-gold-shopp.png';

const OldGoldHowItWorks = () => {
  return (
    <div className='howit-works-container'>
      {/* Diamond Icon at Top */}
      <div className='old-exchange-diamond-top'>
        <img src={diamondIcon} alt="Diamond Icon" className='old-exchange-header-icon' loading="lazy" decoding="async" />
      </div>
      {/* Heading Section */}
      <div className='old-exchange-header'>
        <div className='old-exchange-header-line old-exchange-header-line-left'></div>
        <div className='old-exchange-header-content'>
          <span className='old-exchange-header-title1'>How It <span className='old-exchange-header-title3'>Works</span></span>

        </div>
        <div className='old-exchange-header-line old-exchange-header-line-right'></div>
      </div>
      <div className='old-exchange-header-desc oldHowItDescri'>
        Experience The Most Trusted And Transparent Gold Exchange Process With Guaranteed Satisfaction
      </div>

      {/* cards section */}

      <div className="how-it-works-cards">
        {/* Step 1 */}
        <div className="how-it-works-card">
          <div className="old-gold-works-img-wrap">
            <img src={oldGoldJwellery} alt="Step 1" className="how-it-works-img" loading="lazy" decoding="async" />
            <div className="how-it-works-step-badge">STEP 1</div>
            <div className="how-it-works-step-badge-1"></div>
          </div>
          <p className="how-it-works-desc">Bring Your Old Gold To A PVJ JEwellers Store Near You.</p>
        </div>
        {/* Step 2 */}
        <div className="how-it-works-card">
          <div className="old-gold-works-img-wrap">
            <img src={oldGoldKaratmeter} alt="Step 2" className="how-it-works-img" loading="lazy" decoding="async" />
            <div className="how-it-works-step-badge">STEP 2</div>
            <div className="how-it-works-step-badge-1"></div>
          </div>
          <p className="how-it-works-desc">Our Karatmeter Will Assess The Purity Of Your Gold.</p>
        </div>
        {/* Step 3 */}
        <div className="how-it-works-card">
          <div className="old-gold-works-img-wrap">
            <img src={oldGoldMelt} alt="Step 3" className="how-it-works-img" loading="lazy" decoding="async" />
            <div className="how-it-works-step-badge">STEP 3</div>
            <div className="how-it-works-step-badge-1"></div>
          </div>
          <p className="how-it-works-desc">Your Old Gold Will Be Melted In Front Of You.</p>
        </div>
        {/* Step 4 */}
        <div className="how-it-works-card">
          <div className="old-gold-works-img-wrap">
            <img src={oldGoldShopp} alt="Step 4" className="how-it-works-img" loading="lazy" decoding="async" />
            <div className="how-it-works-step-badge">STEP 4</div>
            <div className="how-it-works-step-badge-1"></div>
          </div>
          <p className="how-it-works-desc">Select Your New Certified Jewellery.</p>
        </div>
      </div>

    </div>
  )
}

export default OldGoldHowItWorks;
