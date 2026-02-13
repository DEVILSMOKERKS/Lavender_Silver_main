import React, { useState } from 'react';
import axios from 'axios';
import './pvjMember.css';
import membershipBanner from '../../assets/img/banner/membership-banner.jpg';
import membershipBannerMobile from '../../assets/img/banner/membership-banner-mobile.jpg';
import giftBox from '../../assets/img/gift-box.png?w=123&format=webp&q=75';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const PvjMember = () => {
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(''); // 'success' or 'error'

  // Picture element handles responsive images via CSS media queries
  // No need for JavaScript-based mobile detection

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    setMsgType('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/elite-members`, { email, gender });
      if (res.data.success) {
        setMsg('Thank you for becoming an Elite Member!');
        setMsgType('success');
        setEmail('');
        setGender('');
      } else {
        setMsg(res.data.message || 'Something went wrong');
        setMsgType('error');
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Network error. Please try again.');
      setMsgType('error');
    }
    setSubmitting(false);
    setTimeout(() => setMsg(''), 3000);
  };

  // return (
  //   <div className='pvjMember-main'>
  //     <div className="pvj-member-section">
  //       {/* Use picture element for responsive images with high priority for LCP */}
  //       {/* Picture element allows browser to choose optimal image based on viewport */}
  //       <picture className="pvj-member-bg-picture">
  //         <source
  //           media="(max-width: 768px)"
  //           srcSet={membershipBannerMobile}
  //         />
  //         <img
  //           src={membershipBanner}
  //           alt=""
  //           className="pvj-member-bg-image"
  //           loading="eager"
  //           decoding="async"
  //           aria-hidden="true"
  //           width="1200"
  //           height="450"
  //         />
  //       </picture>
  //       <div className="pvj-member-content">
  //         <div className="pvj-member-left">
  //           <img src={giftBox} alt="Gift Box" className="pvj-gift-box" loading="eager" decoding="async" width="120" height="120" />
  //           <div className="pvj-member-text">
  //             <h2>
  //               BECOME A LAVENDER SILVER <span className="pvj-elite">Elite</span> MEMBER
  //             </h2>
  //             <p>To Explore Handpicked Jewels, Private Launches & Special Savings.</p>
  //           </div>
  //         </div>
  //         <div className="pvj-member-right">
  //           <form className="pvj-member-form" onSubmit={handleSubmit}>
  //             {/* Radio Group moved to top */}
  //             <div className="pvj-member-radio-group">
  //               <label className="pvj-radio-label" htmlFor="elite-female">
  //                 <input
  //                   id="elite-female"
  //                   type="radio"
  //                   name="gender"
  //                   className="pvj-radio-input"
  //                   value="Female"
  //                   checked={gender === 'Female'}
  //                   onChange={e => setGender(e.target.value)}
  //                   autoComplete="off"
  //                 />
  //                 <span className="pvj-custom-radio"></span>
  //                 Female
  //               </label>
  //               <label className="pvj-radio-label" htmlFor="elite-male">
  //                 <input
  //                   id="elite-male"
  //                   type="radio"
  //                   name="gender"
  //                   className="pvj-radio-input"
  //                   value="Male"
  //                   checked={gender === 'Male'}
  //                   onChange={e => setGender(e.target.value)}
  //                   autoComplete="off"
  //                 />
  //                 <span className="pvj-custom-radio"></span>
  //                 Male
  //               </label>
  //               <label className="pvj-radio-label" htmlFor="elite-other">
  //                 <input
  //                   id="elite-other"
  //                   type="radio"
  //                   name="gender"
  //                   className="pvj-radio-input"
  //                   value="Other"
  //                   checked={gender === 'Other'}
  //                   onChange={e => setGender(e.target.value)}
  //                   autoComplete="off"
  //                 />
  //                 <span className="pvj-custom-radio"></span>
  //                 Other
  //               </label>
  //             </div>

  //             {/* Email Input */}
  //             <div className='membmaininp' style={{ position: 'relative' }}>
  //               <input
  //                 id="elite-email"
  //                 type="email"
  //                 placeholder="Enter Email"
  //                 className="pvj-member-input"
  //                 value={email}
  //                 onChange={e => setEmail(e.target.value)}
  //                 autoComplete="email"
  //                 required
  //               />
  //               <button type="submit" className="pvj-member-submit" disabled={submitting}>
  //                 {submitting ? 'Submitting...' : 'Submit'}
  //               </button>
  //               {msg && (
  //                 <div
  //                   style={{
  //                     position: 'absolute',
  //                     left: 0,
  //                     right: 0,
  //                     top: '100%',
  //                     marginTop: 2,
  //                     color: msgType === 'success' ? 'white' : 'var(--pvj-gold)',
  //                     fontWeight: 500,
  //                     textAlign: 'center',
  //                     fontSize: 14,
  //                     pointerEvents: 'none',
  //                     borderRadius: 4,
  //                     zIndex: 2,
  //                   }}
  //                 >
  //                   {msg}
  //                 </div>
  //               )}
  //             </div>
  //           </form>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default PvjMember;
