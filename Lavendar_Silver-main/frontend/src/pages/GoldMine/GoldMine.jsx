import React, { useState, useEffect } from "react";
import { Clock, Gift, BadgePercent } from "lucide-react";
import diamondIcon from "../../assets/img/icons/diamond.png";
import oldstar from "../../assets/img/banner/oldstar.png";
import stapBorder from '../../assets/img/icons/stap-border.png';
import goldmineBanner from '../../assets/img/banner/goldmine-banner.jpg';
import goldmineBannerMobile from '../../assets/img/banner/goldmine-banner-mobile.jpg';
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import "./GoldMine.css";

const installmentOptions = [
  { label: "10 Months", value: 10 },
  { label: "12 Months", value: 12 },
  { label: "15 Months", value: 15 },
];

const GoldMine = () => {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(2000);
  const [months, setMonths] = useState(10);

  // Check if user is logged in
  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
  }, [user, token, navigate]);

  // Show loading or redirect if not authenticated
  if (!user || !token) {
    return null;
  }

  // Calculation logic (example, adjust as needed)
  const totalInvestment = amount * months;
  const monthlyPayment = amount / 10;
  const eleventhMonthPayment = amount * 0.91; // Example: 9% discount
  const buyNow = amount;
  const savings = amount * 0.3; // Example: 30% savings
  const earlyRedemption6 = amount * 0.6;
  const earlyRedemption8 = amount * 0.8;

  return (
    <>
      {/* GoldMineHero Section */}
      <div className="goldmine-hero-container">
        <img
          src={goldmineBanner}
          alt="Gold Mine Banner"
          className="goldmine-hero-bg goldmine-hero-bg-desktop"
        />
        <img
          src={goldmineBannerMobile}
          alt="Gold Mine Banner Mobile"
          className="goldmine-hero-bg goldmine-hero-bg-mobile"
        />
        <div className="goldmine-hero-content">
          <img
            src={oldstar}
            alt="Decorative Star"
            className="goldmine-hero-star"
          />
        </div>
        <div className="goldmine-hero-inputbar">
          <div className="goldmine-hero-inputbar-title">Get Started Today</div>
          <div className="goldmine-hero-inputbar-fields">
            <input
              type="number"
              placeholder="Enter Monthly Amount"
              className="goldmine-hero-input"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="goldmine-hero-input"
              style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
            />
            <button
              className="goldmine-hero-btn"
              onClick={() => navigate('/goldmine-subscription')}
            >
              Start Now →
            </button>
          </div>
        </div>
      </div>

      {/* Why Gold Mine Section */}
      <section className="goldmine-why-section">
        <div className="goldmine-why-diamond-wrap">
          <img
            src={diamondIcon}
            alt="Diamond"
            className="goldmine-why-diamond"
          />
        </div>
        <div className="goldmine-why-title-wrap">
          <span className="category-title-line left" />
          <h2 className="goldmine-why-title">Why Gold Mine Plan?</h2>
          <span className="category-title-line right" />
        </div>
        <div className="goldmine-why-subtitle">
          Experience The Ultimate In Jewelry Shopping With Our Innovative
          Payment Solutions
        </div>
        <div className="goldmine-why-cards">
          <div className="goldmine-why-card">
            <div className="goldmine-why-icon goldmine-why-icon-bg">
              <Clock size={28} strokeWidth={1} />
            </div>
            <div className="goldmine-why-card-title">Plan Ahead</div>
            <div className="goldmine-why-card-desc">
              Planning Makes Your Life Easy And Profitable. Start Your Jewelry
              Journey Today.
            </div>
          </div>
          <div className="goldmine-why-card">
            <div className="goldmine-why-icon goldmine-why-icon-bg">
              <Gift size={28} strokeWidth={1} />
            </div>
            <div className="goldmine-why-card-title">For Special Moments</div>
            <div className="goldmine-why-card-desc">
              One For Gifting Occasions To Make Her Special Occasions Memorable.
            </div>
          </div>
          <div className="goldmine-why-card">
            <div className="goldmine-why-icon goldmine-why-icon-bg">
              <BadgePercent size={28} strokeWidth={1} />
            </div>
            <div className="goldmine-why-card-title">Special Discounts</div>
            <div className="goldmine-why-card-desc">
              Pay 10 Installments And Get 100% Off On Your 11th Installment.
            </div>
          </div>
        </div>
      </section>

      {/* How Does It Work Section */}
      <section className="goldmine-how-section">
        <img src={oldstar} alt="Star" className="goldmine-how-star" loading="lazy" decoding="async" />
        <div className="goldmine-how-diamond-wrap">
          <img
            src={diamondIcon}
            alt="Diamond"
            className="goldmine-how-diamond"
            loading="lazy"
          />
        </div>
        <div className="goldmine-how-title-wrap">
          <span className="category-title-line left" />
          <h2 className="goldmine-how-title">How Does It Work?</h2>
          <span className="category-title-line right" />
        </div>
        <div className="goldmine-how-subtitle">
          Simple Steps To Get Your Dream Jewelry
        </div>
        <div className="goldmine-how-content">
          <div className="goldmine-how-left">
            <div className="goldmine-how-circle-img-wrap">
              <img
                src={stapBorder}
                alt="Step Border"
                className="goldmine-how-circle-img"
                loading="lazy"
              />
              <div className="goldmine-how-circle-inner">
                <div className="goldmine-how-steps-title">3 EASY STEPS</div>
                <div className="goldmine-how-steps-desc">
                  To Purchase The Jewellery Your Heart Desires
                </div>
              </div>
            </div>
          </div>
          <div className="goldmine-how-right">
            <div className="goldmine-how-step-box">
              <div className="goldmine-how-step-num">1</div>
              <div>
                <div className="goldmine-how-step-title">Pay Monthly</div>
                <div className="goldmine-how-step-desc">
                  Choose Your Monthly Installment With Easy Payment Options.
                </div>
              </div>
            </div>
            <div className="goldmine-how-step-box">
              <div className="goldmine-how-step-num">2</div>
              <div>
                <div className="goldmine-how-step-title">
                  Get Special Discounts
                </div>
                <div className="goldmine-how-step-desc">
                  Make 10 Installments And Get 100% Discount On Your 11th Installment.
                </div>
              </div>
            </div>
            <div className="goldmine-how-step-box">
              <div className="goldmine-how-step-num">3</div>
              <div>
                <div className="goldmine-how-step-title">Happy Shopping!</div>
                <div className="goldmine-how-step-desc">
                  Use The Code Redeemed Voucher Provided By Our On The Date Of
                  11th Month For Online.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gold Mine Calculator Section */}
      <section className="goldmine-calc-section">
        <div className="goldmine-calc-container">
          <div className="goldmine-how-diamond-wrap">
            <img src={diamondIcon} alt="Diamond" className="goldmine-how-diamond" loading="lazy" decoding="async" />
          </div>
          <div className="goldmine-calc-header">
            <div className="goldmine-calc-title-wrap">
              <span className="category-title-line left" />
              <h2 className="goldmine-calc-title">Gold Mine Calculator</h2>
              <span className="category-title-line right" />
            </div>
            <div className="goldmine-calc-subtitle">
              Calculate Your Monthly Installments And Savings
            </div>
          </div>
          <div className="goldmine-calc-main">
            <div className="goldmine-calc-left">
              <div className="goldmine-calc-input-section">
                <h3 className="goldmine-calc-input-title">Slide or enter monthly installment amount</h3>
                <div className="goldmine-calc-input-group">
                  <div className="goldmine-calc-input-wrapper">
                    <label className="goldmine-calc-input-label">Monthly Amount</label>
                    <input
                      type="number"
                      className="goldmine-calc-amount-input"
                      value={amount}
                      min={100}
                      max={100000}
                      step={100}
                      onChange={e => setAmount(Number(e.target.value))}
                      loading="lazy"
                    />
                  </div>
                  <button className="goldmine-calc-check-btn">CHECK</button>
                </div>
                <input
                  type="range"
                  min={100}
                  max={10000}
                  step={100}
                  value={amount}
                  className="goldmine-calc-slider"
                  onChange={e => setAmount(Number(e.target.value))}
                  loading="lazy"
                />
              </div>

              <div className="goldmine-calc-pie-chart">
                <div className="goldmine-calc-pie">
                  <div
                    className="goldmine-calc-pie-segment you-pay"
                    style={{
                      transform: `rotate(0deg)`,
                      background: `conic-gradient(var(--pvj-maroon, #7b2b3e) 0deg ${(8 / 11) * 360}deg, var(--pvj-green, #0E593C) ${(8 / 11) * 360}deg 360deg)`
                    }}
                  >
                  </div>
                  <div className="goldmine-calc-pie-center">
                    <div className="goldmine-calc-pie-label you-pay-label">
                      <span>You Pay</span>
                      <span className="goldmine-calc-pie-amount">₹{(amount * 10).toLocaleString()}</span>
                    </div>
                    <div className="goldmine-calc-pie-label discount-label">
                      <span>100% Discount</span>
                      <span className="goldmine-calc-pie-amount">₹{amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="goldmine-calc-right">
              <div className="goldmine-calc-summary">
                <div className="goldmine-calc-summary-item">
                  <div className="goldmine-calc-summary-icon pink-icon"></div>
                  <div className="goldmine-calc-summary-content">
                    <div className="goldmine-calc-summary-label">Your total payment</div>
                    <div className="goldmine-calc-summary-period">(Period of 10 months)</div>
                    <div className="goldmine-calc-summary-amount">₹ {(amount * 10).toLocaleString()}</div>
                  </div>
                </div>

                <div className="goldmine-calc-summary-item">
                  <div className="goldmine-calc-summary-icon green-icon"></div>
                  <div className="goldmine-calc-summary-content">
                    <div className="goldmine-calc-summary-label">100% Discount on 11th installment</div>
                    <div className="goldmine-calc-summary-period">(100% of 1 month installment value)</div>
                    <div className="goldmine-calc-summary-amount">₹ {amount.toLocaleString()}</div>
                  </div>
                </div>

                <div className="goldmine-calc-divider"></div>

                <div className="goldmine-calc-jewellery-value">
                  <div className="goldmine-calc-jewellery-label">Buy any jewellery worth: (after 11th month)</div>
                  <div className="goldmine-calc-jewellery-amount">₹ {(amount * 11).toLocaleString()}</div>
                </div>

                <div className="goldmine-calc-effective">
                  <div className="goldmine-calc-effective-label">You effectively pay</div>
                  <div className="goldmine-calc-discount-badge">9.09% discount!</div>
                  <div className="goldmine-calc-effective-amount">₹ {(amount * 10).toLocaleString()}</div>
                </div>
              </div>

              <div className="goldmine-calc-early-redemption">
                <div className="goldmine-calc-early-title">Early Redemption</div>
                <div className="goldmine-calc-early-cards">
                  <div className="goldmine-calc-early-card">
                    <div className="goldmine-calc-early-month">6th Month</div>
                    <div className="goldmine-calc-early-amount">₹ {(amount * 5 + amount * 0.25).toLocaleString()}</div>
                    <div className="goldmine-calc-early-info">ⓘ</div>
                  </div>
                  <div className="goldmine-calc-early-card">
                    <div className="goldmine-calc-early-month">8th Month</div>
                    <div className="goldmine-calc-early-amount">₹ {(amount * 7 + amount * 0.5).toLocaleString()}</div>
                    <div className="goldmine-calc-early-info">ⓘ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GoldMine;
