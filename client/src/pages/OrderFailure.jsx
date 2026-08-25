import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { FiXCircle, FiHome, FiRefreshCw, FiHelpCircle } from 'react-icons/fi';
import './OrderSuccess.css';

const OrderFailure = () => {
  const location = useLocation();
  const state = location.state || {};
  const errorMessage = state.message || 'Payment processing was cancelled or unable to complete.';

  return (
    <>
      <SEO 
        title="Order Cancelled | ORDERLY Menswear" 
        canonicalPath="/order-failure"
        noindex={true}
      />
      <div className="orderly-success-page py-5">
        <div className="container" style={{ maxWidth: '760px' }}>
          <div className="success-glass-card mx-auto rounded-4 p-4 p-md-5 text-center fade-in-up">
            
            {/* Animated Red Warning Ring */}
            <div className="success-icon-animated-ring mx-auto mb-4" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', animation: 'none' }}>
              <FiXCircle className="success-check-icon" style={{ color: '#ef4444' }} />
            </div>

            <span className="order-confirmed-pill mb-3 d-inline-block" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
              ORDER PAYMENT UNFINISHED
            </span>
            
            <h1 className="success-greeting-heading text-white fw-bold mb-2">
              Payment Could Not Be Completed
            </h1>
            <p className="text-muted max-w-500 mx-auto mb-4">
              {errorMessage} No charges were deducted from your bank account.
            </p>

            {/* Help Callout */}
            <div className="order-receipt-panel p-4 rounded-4 text-start mb-4">
              <h6 className="text-white fw-bold mb-2 d-flex align-items-center gap-2">
                <FiHelpCircle className="text-warning" /> Need assistance completing your order?
              </h6>
              <p className="text-muted small mb-0">
                You can retry your transaction with UPI, Credit/Debit Cards, or Net Banking, or contact our Atelier Concierge for instant checkout support.
              </p>
            </div>

            {/* Dual Action Buttons with 20px Explicit Gap */}
            <div className="order-success-actions-row">
              <Link to="/checkout" className="btn-primary-orderly py-3 px-4 fw-bold d-inline-flex align-items-center justify-content-center gap-2">
                <FiRefreshCw /> Retry Checkout
              </Link>
              <Link to="/" className="btn-outline-orderly py-3 px-4 fw-bold d-inline-flex align-items-center justify-content-center gap-2">
                <FiHome /> Return To Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderFailure;
