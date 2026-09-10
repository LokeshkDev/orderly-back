import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCopy, FiCheck, FiTag, FiGift, FiZap, FiClock, FiArrowRight } from 'react-icons/fi';
import { getPopupCoupons } from '../../services/api';
import './CouponsPopupModal.css';

const SESSION_DISMISSED_KEY = 'orderly_coupons_popup_dismissed';
const PERSISTENT_DISMISSED_KEY = 'orderly_coupons_popup_dismissed_until';

const CouponsPopupModal = () => {
  const [coupons, setCoupons] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenClosed, setHasBeenClosed] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem(SESSION_DISMISSED_KEY));
    } catch {
      return false;
    }
  });
  const [copiedCode, setCopiedCode] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch popup coupons on mount (cached via fetchCachedGet)
  useEffect(() => {
    let active = true;
    const fetchCoupons = async () => {
      try {
        const res = await getPopupCoupons();
        if (active && res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCoupons(res.data);
        }
      } catch (e) {}
    };
    fetchCoupons();

    const onSync = () => fetchCoupons();
    window.addEventListener('orderly_coupons_updated', onSync);
    return () => {
      active = false;
      window.removeEventListener('orderly_coupons_updated', onSync);
    };
  }, []);

  // 2. Initial show of the popup:
  // Shows popup after initial render. If user hasn't closed it yet in this session,
  // trigger popup cleanly after page load (1.8s delay to allow initial paint to finish).
  useEffect(() => {
    if (coupons.length === 0) return;

    // Check if dismissed in this session or persistent storage
    try {
      if (sessionStorage.getItem(SESSION_DISMISSED_KEY)) {
        setHasBeenClosed(true);
        return;
      }
      const until = localStorage.getItem(PERSISTENT_DISMISSED_KEY);
      if (until && Number(until) > Date.now()) {
        setHasBeenClosed(true);
        return;
      }
    } catch (e) {}

    let timer = null;
    const triggerPopup = () => {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 1800);
    };

    if (document.readyState === 'complete') {
      triggerPopup();
    } else {
      window.addEventListener('load', triggerPopup, { once: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('load', triggerPopup);
    };
  }, [coupons]);

  // Handle closing modal:
  // When closed, activate hasBeenClosed so floating pill appears!
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setHasBeenClosed(true);
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
      if (dontShowAgain) {
        localStorage.setItem(PERSISTENT_DISMISSED_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      }
    } catch (e) {}
  }, [dontShowAgain]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Copy code handler with feedback
  const handleCopyCode = (code) => {
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setHasInteracted(true);
      setTimeout(() => {
        setCopiedCode(null);
      }, 2500);
    } catch (e) {}
  };

  const handleShopNow = () => {
    handleClose();
    navigate('/shop');
  };

  // If no coupons are configured for popup, render nothing
  if (coupons.length === 0) return null;

  return (
    <>
      {/* FLOATING CORNER RE-OPEN PILL: ONLY shown AFTER user closes the initial popup */}
      {!isOpen && hasBeenClosed && (
        <button
          type="button"
          className="orderly-coupon-pill-trigger fade-in-up"
          onClick={() => setIsOpen(true)}
          title="View Available Promo Codes"
          aria-label="View Available Promo Codes"
        >
          <span className="pill-badge-pulse" />
          <FiGift className="pill-icon" />
          <span className="pill-text">Offers ({coupons.length})</span>
        </button>
      )}

      {/* SINGLE COMBINED COUPON POPUP MODAL */}
      {isOpen && (
        <div
          className="orderly-coupon-modal-backdrop fade-in"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
        >
          <div
            className="orderly-coupon-modal-card scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              className="coupon-modal-close-btn"
              onClick={handleClose}
              aria-label="Close offers dialog"
            >
              <FiX />
            </button>

            {/* MODAL HEADER */}
            <div className="coupon-modal-header text-center">
              <div className="coupon-privilege-badge">
                <FiZap className="me-1 text-warning" /> VIP PROMOTIONAL PRIVILEGE
              </div>
              <h2 id="coupon-modal-title" className="coupon-modal-title mt-2 mb-1">
                {coupons.length > 1 ? 'Special Offers Just For You' : 'Exclusive VIP Voucher'}
              </h2>
              <p className="coupon-modal-subtitle text-muted mb-0">
                {coupons.length > 1
                  ? `Enjoy ${coupons.length} limited-time vouchers tailored for your order. Copy and apply at checkout:`
                  : 'Apply this limited-time voucher code during checkout for instant savings:'}
              </p>
            </div>

            {/* COMBINED COUPON CARDS CONTAINER */}
            <div className="coupon-cards-container">
              {coupons.map((coupon, idx) => {
                const isCopied = copiedCode === coupon.code;
                const isPercentage = coupon.discount_type === 'percentage';
                const discountText = isPercentage
                  ? `${coupon.discount_value}% OFF`
                  : `₹${Number(coupon.discount_value).toLocaleString('en-IN')} OFF`;
                const minOrder = Number(coupon.min_order || 0);

                return (
                  <div key={coupon.id || idx} className="single-coupon-item-card">
                    <div className="coupon-card-ribbon">
                      <span className="coupon-discount-tag">{discountText}</span>
                      {coupon.expires_at && (
                        <span className="coupon-expiry-tag d-inline-flex align-items-center gap-1">
                          <FiClock /> Exp: {String(coupon.expires_at).slice(0, 10)}
                        </span>
                      )}
                    </div>

                    <div className="coupon-card-body">
                      {coupon.description && (
                        <p className="coupon-desc mb-2">{coupon.description}</p>
                      )}

                      <div className="coupon-meta-row d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div className="coupon-terms small text-muted">
                          {minOrder > 0 ? (
                            <span>Min order: <strong>₹{minOrder.toLocaleString('en-IN')}</strong></span>
                          ) : (
                            <span>No minimum order</span>
                          )}
                          {coupon.max_discount && (
                            <span className="ms-2">| Max cap: <strong>₹{Number(coupon.max_discount).toLocaleString('en-IN')}</strong></span>
                          )}
                        </div>

                        {/* COPY CODE BOX */}
                        <div className="coupon-code-action-box d-flex align-items-center gap-1.5">
                          <span className="coupon-code-label font-monospace">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            className={`btn-copy-coupon ${isCopied ? 'copied' : ''}`}
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copy code to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <FiCheck /> COPIED!
                              </>
                            ) : (
                              <>
                                <FiCopy /> COPY
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MODAL FOOTER */}
            <div className="coupon-modal-footer">
              <button
                type="button"
                className="btn-coupon-shop-now"
                onClick={handleShopNow}
              >
                <span>Shop Catalog & Apply Code</span>
                <FiArrowRight />
              </button>

              <div className="d-flex align-items-center justify-content-between mt-3 text-muted extra-small">
                <label className="d-inline-flex align-items-center gap-1.5 cursor-pointer user-select-none">
                  <input
                    type="checkbox"
                    className="form-check-input mt-0"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span>Don't show for 7 days</span>
                </label>

                <button
                  type="button"
                  className="btn btn-link text-muted p-0 text-decoration-none extra-small"
                  onClick={handleClose}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CouponsPopupModal;

