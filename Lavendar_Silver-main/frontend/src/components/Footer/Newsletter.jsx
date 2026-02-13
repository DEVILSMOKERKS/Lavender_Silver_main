import React, { useState } from 'react';
import './Newsletter.css';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Handle newsletter subscription
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <div className="newsletter-section">
      <h3 className="newsletter-heading">Subscribe for exclusive offers and updates!</h3>
      <form onSubmit={handleSubmit} className="newsletter-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="newsletter-input"
          required
        />
        <button type="submit" className="newsletter-button">
          Subscribe
        </button>
      </form>
      {subscribed && (
        <p className="newsletter-success">Thank you for subscribing!</p>
      )}
    </div>
  );
};

export default Newsletter;
