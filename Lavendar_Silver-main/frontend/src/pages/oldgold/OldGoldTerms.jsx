import React from 'react'
import './OldGoldTerms.css';

import diamondIcon from '../../assets/img/icons/diamond.png';
import redCheckmark from '../../assets/img/icons/red-checkmark.png';
import blueCheckmark from '../../assets/img/icons/blue-checkmark.png';
import warnings from '../../assets/img/icons/warnings.png';

const OldGoldTerms = () => {
  return (
    <div>

      {/* Diamond Icon at Top */}
      <div className='old-exchange-diamond-top'>
        <img src={diamondIcon} alt="Diamond Icon" className='old-exchange-header-icon' loading="lazy" decoding="async" />
      </div>
      {/* Heading Section */}
      <div className='old-exchange-header'>
        <div className='old-exchange-header-line old-exchange-header-line-left'></div>
        <div className='old-exchange-header-content'>
          <span className='old-exchange-header-title1'>Eligibility & Terms </span>
        </div>
        <div className='old-exchange-header-line old-exchange-header-line-right'></div>
      </div>
      <div className='old-exchange-header-desc'>
        Simple requirements to ensure a smooth and secure exchange process
      </div>


      {/* Feature Cards */}
      <div className="old-exchange-cards">
        <div className="old-terms-card">
          <div className="old-terms-whitBg">
            <img src={redCheckmark} alt="Gold Purity Accepted" className="red_checkmark_Icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">Gold Purity Accepted</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc"><b>22kt And 24kt Gold Jewelry Accepted</b></p>
          <p className="old-exchange-card-desc-bg">We Accept All Forms Of 22kt And 24kt Gold Including Rings, Chains, Bangles, Earrings, And Coins. 18kt Gold Is Also Accepted With Adjusted Rates.</p>
        </div>
        <div className="old-terms-card">
          <div className="old-terms-whitBg">
            <img src={blueCheckmark} alt="Required Documents" className="red_checkmark_Icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">Required Documents</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc"><b>Valid ID Proof And Original Purchase Invoice</b></p>
          <p className="old-exchange-card-desc-bg">Bring Any Government-Issued Photo ID (Aadhaar, PAN, Passport, Or Driving License) Along With Original Jewelry Purchase Bills If Available.</p>
        </div>
        <div className="old-terms-card">
          <div className="old-terms-whitBg">
            <img src={blueCheckmark} alt="Minimum Weight" className="red_checkmark_Icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">Minimum Weight</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc"><b>Minimum 5 Grams Of Gold Required</b></p>
          <p className="old-exchange-card-desc-bg">We Require A Minimum Of 5 Grams Of Gold For Exchange. Multiple Small Pieces Can Be Combined To Meet This Requirement.</p>
        </div>
        <div className="old-terms-card">
          <div className="old-terms-whitBg">
            <img src={warnings} alt="Important Notes" className="red_checkmark_Icon" loading="lazy" decoding="async" />
          </div>
          <h3 className="old-exchange-card-title">Important Notes</h3>
          <div className='old-exchange-card-line'></div>
          <p className="old-exchange-card-desc"><b>Stones And Other Metals Excluded From Weight</b></p>
          <p className="old-exchange-card-desc-bg">Precious Stones, Diamonds, And Non-Gold Components Are Removed Before Weighing. Only Pure Gold Content Is Considered For Valuation.</p>
        </div>
      </div>

    </div>
  )
}

export default OldGoldTerms
