import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { Copy } from 'lucide-react';
import './myAccount.css';
import discountIcon from '../../assets/img/icons/discount 2.png';
import timerIcon from '../../assets/img/icons/timer1.png';

const OffersAndDiscounts = () => {
  const { user, token } = useContext(UserContext);
  const [offers, setOffers] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const review = {
    name: 'Jay Sharma',
    date: 'May 25, 2025',
    rating: 5,
    text: `They Have The Best Collection Of Jewellery And At Reasonable Prices. You Can Also Customise Your Jewellery As Per Your Need. They Also Were Very Much Polite And Have A Good Service Too. Even They Delivered The Jewellery To Me, When I Requested Them If They Could Deliver If Possible. Thank You So Much. Had A Very Good Experience!`,
  };

  // Copy code to clipboard function
  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    }
  };

  useEffect(() => {
    const fetchOffersAndCoupons = async () => {
      try {
        setLoading(true);

        // Fetch frontend discounts - Fixed API endpoint
        const frontendResponse = await axios.get(`${API_BASE_URL}/api/discounts/frontend`);
        if (frontendResponse.data.success) {
          setOffers(frontendResponse.data.data || []);
        }

        // Fetch user-specific coupons if user is logged in
        if (user && user.id) {
          try {
            const userCouponsResponse = await axios.get(`${API_BASE_URL}/api/discounts/user-coupons/user/${user.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userCouponsResponse.data.success) {
              setUserCoupons(userCouponsResponse.data.data || []);
            }
          } catch (couponError) {
            console.error('Error fetching user coupons:', couponError);
            // Don't set error for user coupons as it's optional
          }
        }
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers');
        // Set default offers if API fails
        setOffers([
          { code: 'GOLD20', title: '20% OFF', description: 'On Gold Jewellery' },
          { code: 'SILVER15', title: '15% OFF', description: 'On Silver Jewellery' },
          { code: 'DIAMOND25', title: '25% OFF', description: 'On Diamond Jewellery' },
          { code: 'WELCOME10', title: '10% OFF', description: 'Welcome Discount' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOffersAndCoupons();
  }, [user, token, API_BASE_URL]);

  // Combine frontend offers with user coupons
  const allOffers = [...offers, ...userCoupons];

  // Format offer data for display
  const formatOffer = (offer) => {
    return {
      code: offer.code || offer.coupon_code || 'OFFER',
      desc: offer.title || `${offer.discount_value || 0}% OFF`,
      details: offer.description || 'Special Offer'
    };
  };

  if (loading) {
    return (
      <div className="myaccount_right_bottom">
        <div className="offers-grid-section">
          <div className="offers-grid">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="offer-card" style={{ opacity: 0.6 }}>
                <div className="offer-card-desc">Loading...</div>
                <div className="offer-card-details">Loading...</div>
                <button className="offer-apply-btn" disabled>
                  <span className="offer-btn-icon-wrap">
                    <Copy size={16} className="offer-btn-icon" />
                  </span>
                  Loading...
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="myaccount_right_bottom">
      {/* Offers Section */}
      <div className="offers-grid-section">
        <div className="offers-grid">
          {allOffers.length > 0 ? (
            allOffers.map((offer, idx) => {
              const formattedOffer = formatOffer(offer);
              const isCopied = copiedCode === formattedOffer.code;

              return (
                <div key={idx} className="offer-card">

                  <div className="offer-card-desc">{formattedOffer.desc}</div>
                  <div className="offer-card-details">{formattedOffer.details}</div>
                  <button
                    className="offer-apply-btn"
                    onClick={() => copyToClipboard(formattedOffer.code)}
                    style={{
                      backgroundColor: isCopied ? '#28a745' : undefined,
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <span className="offer-btn-icon-wrap">
                      <Copy size={16} className="offer-btn-icon" />
                    </span>
                    {isCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              );
            })
          ) : (
            // Show "No offers found" message
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <img src={discountIcon} alt="discount" style={{ width: '48px', height: '48px', opacity: 0.5 }} loading="lazy" decoding="async" />
              </div>
              <div>No offers found</div>
              <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.7 }}>
                Check back later for exciting discounts and offers!
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Review Section */}
      {/* <div >
        <div className='my-account-review-section'>
          <span className='myaccount_right_heading'>REVIEW</span>
          <button style={{ background: '#F5F2E1', color: '#0E593C', border: '1px solid #0E593C', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Write A Review</button>
        </div>
        <div className='my-account-offer_and_dis-blog-box'>
          <div className='my-account-offer_and_dis-name' >
            <div className='my-account-offer_and_dis-nameCh'>J</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{review.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {[...Array(review.rating)].map((_, i) => <span key={i} style={{ color: '#FFD700', fontSize: 16 }}>★</span>)}
                </span>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>{review.date}</span>
              </div>
            </div>
            <div style={{ marginLeft: 10, display: 'flex', gap: 10 }}>
              <span style={{ cursor: 'pointer', color: '#888' }} title="Edit">✎</span>
              <span style={{ cursor: 'pointer', color: '#888' }} title="Delete">🗑</span>
            </div>
          </div>
          <div style={{ fontSize: 15, color: '#222', marginTop: 6, fontWeight: 500 }}>{review.text}</div>
        </div>
      </div> */}
    </div>
  );
};

export default OffersAndDiscounts; 