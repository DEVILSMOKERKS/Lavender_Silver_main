import React from 'react';
import { FaShoppingCart, FaVideo, FaCheck } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import './VideoCart.css';
import { useNavigate } from 'react-router-dom';

const steps = [
  { label: 'Cart', icon: <FaShoppingCart />, route: '/video-cart' },
  { label: 'Book Video Call', icon: <FaVideo />, route: '/video-cart/booking' },
  { label: 'Confirmation', icon: <MdVerified />, route: '/video-cart/thankyou' },
];

const VideoCartStepper = ({ activeStep = 0 }) => {
  const navigate = useNavigate();
  return (
    <div className="videocart-topbar">
      {steps.map((step, idx) => {
        const isCompleted = idx < activeStep;
        const isActive = idx === activeStep;
        const isClickable = idx <= activeStep;
        const handleStepClick = () => {
          if (isClickable) navigate(step.route);
        };
        return (
          <React.Fragment key={step.label + idx}>
            <div
              className={
                'videocart-step-circle' +
                (isCompleted ? ' completed' : '') +
                (isActive ? ' active' : '') +
                (isClickable ? ' clickable' : '')
              }
              onClick={isClickable ? handleStepClick : undefined}
              style={isClickable ? { cursor: 'pointer' } : {}}
            >
              <span className="videocart-step-icon">
                {isCompleted ? <FaCheck /> : step.icon}
              </span>
            </div>
            <span className="videocart-step-label">{step.label}</span>
            {idx < steps.length - 1 && (
              <div className={
                'videocart-step-line' + (isCompleted ? ' completed' : '')
              } />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default VideoCartStepper;