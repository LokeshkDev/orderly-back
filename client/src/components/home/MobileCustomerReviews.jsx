import React from 'react';
import { FaStar } from 'react-icons/fa';

const MobileCustomerReviews = () => {
  const reviews = [
    {
      name: 'Rahul Sharma',
      rating: '4.8/5',
      text: 'Amazing quality and perfect fit. Orderly is my go-to brand now!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Arjun Mehta',
      rating: '4.9/5',
      text: 'Great designs and super fast delivery. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Karan Malhotra',
      rating: '4.7/5',
      text: 'The fabric quality is premium. Loved the shopping experience.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
    }
  ];

  return (
    <section className="mobile-only py-4">
      {/* Benefits Strip matching Screenshot 2 */}
      <div className="mobile-features-strip mb-4">
        <div>
          <div className="mobile-feature-icon-red">🎁</div>
          <div className="mobile-feature-label">100% SECURE<br/>PAYMENTS</div>
        </div>
        <div>
          <div className="mobile-feature-icon-red">🔄</div>
          <div className="mobile-feature-label">EASY<br/>RETURNS</div>
        </div>
        <div>
          <div className="mobile-feature-icon-red">🚚</div>
          <div className="mobile-feature-label">FAST<br/>DELIVERY</div>
        </div>
        <div>
          <div className="mobile-feature-icon-red">🛡️</div>
          <div className="mobile-feature-label">PREMIUM<br/>QUALITY</div>
        </div>
      </div>

      {/* Reviews Card matching Screenshot 2 */}
      <div className="mobile-reviews-card">
        <h3 className="mobile-section-title text-center mb-4">WHAT OUR CUSTOMERS SAY</h3>

        {reviews.map((rev, idx) => (
          <div key={idx} className="mobile-review-item">
            <img src={rev.avatar} alt={rev.name} className="mobile-review-avatar" />
            <div>
              <div className="d-flex align-items-center gap-2">
                <div className="stars-gold" style={{ color: '#EAB308', fontSize: '0.75rem' }}>
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <span className="fw-bold text-white small">{rev.rating}</span>
              </div>
              <p className="mobile-review-text">"{rev.text}"</p>
              <div className="text-white-50 extra-small">— {rev.name}</div>
            </div>
          </div>
        ))}

        <div className="text-center mt-3 pt-2 border-top border-secondary">
          <button type="button" className="btn btn-outline-light btn-sm w-100 fw-bold">
            VIEW ALL REVIEWS
          </button>
        </div>
      </div>

      {/* Service Order Strip matching Screenshot 2 */}
      <div className="mobile-features-strip mt-4">
        <div>
          <div className="mobile-feature-icon-red">🔄</div>
          <div className="mobile-feature-label">7 Days<br/>Returns</div>
        </div>
        <div>
          <div className="mobile-feature-icon-red">💳</div>
          <div className="mobile-feature-label">Secure<br/>Payments</div>
        </div>
        <div>
          <div className="mobile-feature-icon-red">💵</div>
          <div className="mobile-feature-label">COD<br/>Available</div>
        </div>
        <div>
          <div className="mobile-feature-icon-red">📍</div>
          <div className="mobile-feature-label">Track<br/>Order</div>
        </div>
      </div>
    </section>
  );
};

export default MobileCustomerReviews;
