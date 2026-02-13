import React from 'react'
import './digitalGold.css';
import bannerImg from '../../assets/img/banner/digital-gold-banner.png';
import bannerImg2 from '../../assets/img/banner/digital-gold-banner-2.png';
import diamondIcon from '../../assets/img/icons/diamond.png';
import shield from '../../assets/img/icons/shield.png';
import logistic from '../../assets/img/icons/Logistic.png';
import goldBrick from '../../assets/img/icons/gold-bricks.png';
import rupees from '../../assets/img/icons/rupees.png';

const DigitalGold = () => {
  return (
    <div>
      <div className="digital-gold-banner">
        <img src={bannerImg} alt="Digital Gold - Safe & Trustworthy" className="digital-gold-banner-img" loading="lazy" decoding="async" />
      </div>

      {/* second section */}
      <div className='digital-gold-second-section'>
        <div className='digital-gold-left-section'>
          <img src={bannerImg2} alt="Digital Gold - Safe & Trustworthy" loading="lazy" decoding="async" />
        </div>
        <div className='digital-gold-right-section'>
          <h2>WHAT IS DIGITAL GOLD</h2>
          <p className='digital-gold-desc'>
            PVJ Digital Gold is a modern and convenient way to invest in 100% pure 24 Karat gold, backed by the trust of PVJ Jewellers. Whether you're planning for future celebrations, personal milestones, or simply want to build your wealth, digital gold offers a smart and secure solution for every goal.
          </p>
          <p className='digital-gold-desc'>
            With PVJ Digital Gold, you can start saving with an amount as low as ₹100, making it accessible for everyone—no matter where you are in your financial journey. Your gold is stored in 100% insured and secure vaults, ensuring the highest level of safety and peace of mind.</p>
          <p className='digital-gold-desc'>
            We believe in transparency and flexibility. That's why you can track, buy, sell, or exchange your gold anytime—either online through PVJJewellers.com or offline at any of our PVJ Jewellers stores across India. Whether you want to convert your savings into a beautiful piece of jewellery or simply hold your investment, the choice is always yours.
          </p>
          <p className='digital-gold-desc'>
            Gone are the days of worrying about storage, purity, or price fluctuations. With real-time market-linked pricing and 24/7 access, PVJ Digital Gold gives you complete control and confidence over your gold investment.
          </p>
          <p className='digital-gold-desc digital-gold-desc-forth'>
            Start your golden journey today with PVJ Digital Gold—pure, powerful, and personal.
          </p>

        </div>
      </div>

      {/* third-section */}
      <div className="digital-gold-key-features-section">
        <div className="key-features-header">
          <img src={diamondIcon} alt="Key Features Icon" className="key-features-icon" loading="lazy" decoding="async" />
          <div className="key-features-title-row">
            <div className="key-features-line key-features-line-left"></div>
            <h2>Key Features</h2>
            <div className="key-features-line key-features-line-right"></div>
          </div>
        </div>
        <div className="digital-gold-key-features-cards">
          <div className="digital-gold-key-feature-card">
            <img src={shield} alt="Safety Guaranteed" className="feature-icon" loading="lazy" decoding="async" />
            <h3>Safety Guaranteed</h3>
            <div className="feature-line"></div>
            <p>Unlike Physical Gold, It Is Virtually Bought And You Don't Have To Worry About Theft Or Expensive Locker Fees. Your Gold Is Safely Stored With Us. This Is Powered By SafeGold And Backed By The Trust Of Tata.</p>
          </div>
          <div className="digital-gold-key-feature-card">
            <img src={logistic} alt="Sell Anytime" className="feature-icon" loading="lazy" decoding="async" />
            <h3>Safely Sell Anytime From Home</h3>
            <div className="feature-line"></div>
            <p>Sell Anytime, Without Going Anywhere And Receive Money Direct In Your Account.</p>
          </div>
          <div className="digital-gold-key-feature-card">
            <img src={goldBrick} alt="Convert To Physical Gold" className="feature-icon" loading="lazy" decoding="async" />
            <h3>Safely Convert To Physical Gold</h3>
            <div className="feature-line"></div>
            <p>You Can Convert Your Digital Gold To Physical Gold Anytime In The Form Of Jewellery In Our Store Or Our Website.</p>
          </div>
          <div className="digital-gold-key-feature-card">
            <img src={rupees} alt="Buy As Low As ₹100" className="feature-icon" loading="lazy" decoding="async" />
            <h3>Safely Buy As Low As ₹100</h3>
            <div className="feature-line"></div>
            <p>You Can Convert Your Digital Gold To Physical Gold Anytime In The Form Of Jewellery In Our Store Or Our Website.</p>
          </div>
        </div>
      </div>


      {/* fourth-section */}

      <div className='digital-gold-fourth-section-container'>

        <div className="key-features-header">
          <img src={diamondIcon} alt="Key Features Icon" className="key-features-icon" loading="lazy" />
          <div className="key-features-title-row">
            <div className="key-features-line key-features-line-left"></div>
            <h2>How It Works</h2>
            <div className="key-features-line key-features-line-right"></div>
          </div>
          <p>Bringing convenience and safety to buying Gold!</p>
        </div>

        <div className="digital-gold-fourth-section-box">
          <div className="dg-tabs-row">
            <h3 className="dg-tab dg-tab-active">BUY</h3>
            <h3 className="dg-tab">SELL</h3>
            <h3 className="dg-tab">EXCHANGE/REDEEM</h3>
          </div>
          <div className="dg-stepper-row">
            <div className="dg-stepper-step">
              <div className="dg-stepper-circle">
                <span className="dg-step-label">STEP</span>
                <span className="dg-step-number">01</span>
              </div>
              <div className="dg-stepper-title">Login</div>
              <div className="dg-stepper-desc">Login Or Register With Tanishq. Complete Your Account Setup</div>
            </div>
            <div className="dg-stepper-divider"></div>
            <div className="dg-stepper-step">
              <div className="dg-stepper-circle">
                <span className="dg-step-label">STEP</span>
                <span className="dg-step-number">02</span>
              </div>
              <div className="dg-stepper-title">Enter Amount</div>
              <div className="dg-stepper-desc">Enter Your Amount In Rupees Or Gold In Grams To Buy</div>
            </div>
            <div className="dg-stepper-divider"></div>
            <div className="dg-stepper-step">
              <div className="dg-stepper-circle">
                <span className="dg-step-label">STEP</span>
                <span className="dg-step-number">03</span>
              </div>
              <div className="dg-stepper-title">Payment</div>
              <div className="dg-stepper-desc">Choose Your Payment Method. You Will Have Multiple Payment Options To Choose From Such As An Account, Card, Or Wallet.</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default DigitalGold
