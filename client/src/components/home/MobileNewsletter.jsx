import React, { useState } from 'react';
import { FiMail, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MobileNewsletter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribed(true);
    toast.success('🎉 Welcome to ORDERLY VIP Club! Coupon code ORDERLY10 sent.');
  };

  return (
    <section className="mobile-only py-3">
      <div className="mobile-newsletter-card">
        <FiMail className="mobile-newsletter-icon" />
        <h3 className="mobile-newsletter-title">STAY IN THE LOOP</h3>
        <p className="mobile-newsletter-sub">
          Subscribe to get updates on new arrivals, exclusive offers and more.
        </p>

        {subscribed ? (
          <div className="p-3 bg-dark border border-danger text-danger rounded small fw-bold">
            <FiCheck className="me-1" /> THANK YOU FOR SUBSCRIBING!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input 
              type="email" 
              className="mobile-newsletter-input" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-mobile-red-solid w-100 py-2">
              SUBSCRIBE
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default MobileNewsletter;
