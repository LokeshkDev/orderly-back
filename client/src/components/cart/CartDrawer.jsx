import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiX, 
  FiTrash2, 
  FiPlus, 
  FiMinus, 
  FiShoppingBag, 
  FiArrowRight, 
  FiTag, 
  FiCheckCircle, 
  FiChevronDown, 
  FiChevronUp,
  FiPercent
} from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatters';
import './CartDrawer.css';

const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    originalSubtotal,
    pairWellWithDiscount,
    isMultiPairOfferActive,
    totalSavings,
    pairSettings,
    cartTotal,
    freeShippingThreshold,
    appliedCoupon,
    discountAmount,
    pricingBreakdown,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [isTariffOpen, setIsTariffOpen] = useState(false); // Collapsed by default to maximize product viewing space
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // WCAG 2.1 AA Keyboard Focus Trap & Escape Dismissal
  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponInput || couponLoading) return;
    setCouponLoading(true);
    const res = await applyCoupon(couponInput);
    setCouponLoading(false);
    setCouponMsg(res);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}>
      <div 
        ref={drawerRef}
        className="cart-drawer-panel glass-panel" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Screen Reader Live Region for status */}
        <div className="visually-hidden" aria-live="polite" aria-atomic="true">
          Shopping bag updated. Current total items: {totalItemsCount}. Total: {formatPrice(cartTotal)}.
        </div>

        {/* Header */}
        <div className="cart-drawer-header">
          <div className="d-flex align-items-center gap-2">
            <FiShoppingBag className="cart-header-icon" />
            <h4 id="cart-drawer-title" className="cart-drawer-title mb-0">Shopping Bag ({totalItemsCount})</h4>
          </div>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
            <FiX />
          </button>
        </div>

        {/* Cart Multi-Product Pair Offer Unlocked Alert */}
        {isMultiPairOfferActive && (
          <div className="cart-pair-unlocked-banner">
            <FiCheckCircle className="text-accent-red flex-shrink-0" />
            <span><strong>Pair Offer Active:</strong> Flat {pairSettings?.discount_percent || 25}% OFF on total MRP!</span>
          </div>
        )}

        {/* Body — Maximized Scrollable Products Area */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <FiShoppingBag className="empty-cart-icon" />
              <h5>Your Bag is Empty</h5>
              <p>Explore our luxury collection and craft your unique style.</p>
              <button 
                className="btn-primary-orderly mt-3"
                onClick={() => { setIsCartOpen(false); navigate('/'); }}
              >
                Shop Luxury Collection
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.cartItemId} className="cart-item-card">
                  <img 
                    src={item.images?.[0] || item.image || '/logo.png'} 
                    alt={item.name} 
                    className="cart-item-img"
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                  
                  <div className="cart-item-details">
                    <div className="d-flex align-items-center gap-1 flex-wrap mb-1">
                      <span className="cart-item-brand">{item.brand || 'ORDERLY'}</span>
                      {item.isPairOffer && (
                        <span className="cart-pair-badge">
                          <FiTag /> PAIR PRODUCT {item.pairOffer?.discount_percent ? `(${item.pairOffer.discount_percent}% OFF)` : ''}
                        </span>
                      )}
                    </div>
                    <h6 className="cart-item-title" title={item.name}>{item.name}</h6>
                    
                    {item.isCombo ? (
                      <div className="cart-combo-pieces-box">
                        <div className="d-flex align-items-center mb-1">
                          <span className="cart-combo-badge">COMBO BUNDLE</span>
                        </div>
                        {item.selectedPieces && item.selectedPieces.length > 0 ? (
                          item.selectedPieces.map((p, pIdx) => (
                            <div key={pIdx} className="cart-piece-row">
                              <span className="piece-dot">•</span>
                              <span className="piece-name">{p.pieceLabel || p.name}:</span>
                              <strong className="piece-spec">{p.color || 'Default'} / {p.size || 'M'}</strong>
                            </div>
                          ))
                        ) : (
                          <div className="cart-piece-row">Includes multi-piece bundle items</div>
                        )}
                      </div>
                    ) : (
                      <div className="cart-item-meta">
                        <span>Size: <strong>{item.selectedSize}</strong></span>
                        {item.selectedColor && item.selectedColor !== 'Standard' && (
                          <span>Color: <strong>{item.selectedColor}</strong></span>
                        )}
                      </div>
                    )}

                    <div className="cart-item-price-qty-row">
                      <span className="cart-item-price">
                        {Number(item.originalPrice || item.original_price || 0) > Number(item.price || 0) && (
                          <del className="cart-item-mrp">{formatPrice(item.originalPrice || item.original_price)}</del>
                        )}
                        <strong>{formatPrice(item.price)}</strong>
                      </span>
                      
                      {/* Quantity Controls */}
                      <div className="cart-qty-controls">
                        <button onClick={() => updateQuantity(item.cartItemId, -1)} aria-label="Decrease quantity">
                          <FiMinus />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, 1)} aria-label="Increase quantity">
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.cartItemId)}
                    title="Remove Item"
                    aria-label="Remove Item"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Compact Collapsible Tariff Accordion */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Standalone Coupon Apply Box (Outside Price Accordion) */}
            <div className="coupon-box mb-2">
              {appliedCoupon ? (
                <div className="coupon-applied-alert">
                  <span><FiCheckCircle /> Coupon <strong>{appliedCoupon.code}</strong> applied! You save {formatPrice(discountAmount)}</span>
                  <button 
                    type="button"
                    className="remove-coupon-btn"
                    onClick={() => { removeCoupon(); setCouponMsg(null); }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form className="coupon-form" onSubmit={handleCouponSubmit}>
                  <input
                    type="text"
                    className="coupon-input"
                    placeholder="Enter coupon code (e.g. FESTIVE500)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    disabled={couponLoading}
                  />
                  <button type="submit" className="coupon-btn" disabled={couponLoading || !couponInput.trim()}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponMsg && !appliedCoupon && (
                <span className={`coupon-feedback ${couponMsg.success ? 'text-success' : 'text-danger'}`}>
                  {couponMsg.message}
                </span>
              )}
            </div>

            {/* Collapsible Tariff / Price Breakdown Accordion */}
            <div className="cart-tariff-accordion">
              {/* Accordion Toggle Header */}
              <button 
                type="button" 
                className="cart-tariff-accordion-toggle"
                onClick={() => setIsTariffOpen(!isTariffOpen)}
                aria-expanded={isTariffOpen}
              >
                <span className="tariff-toggle-left">
                  <FiPercent className="text-accent-red" />
                  <span>Price Details</span>
                  {totalSavings > 0 && (
                    <span className="tariff-savings-tag">Save {formatPrice(totalSavings)}</span>
                  )}
                </span>
                <span className="tariff-toggle-right">
                  <span className="tariff-toggle-hint">{isTariffOpen ? 'Hide' : 'View'}</span>
                  {isTariffOpen ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              {/* Accordion Collapsible Content (Strictly Price Breakdown) */}
              {isTariffOpen && (
                <div className="cart-tariff-breakdown-content">
                  {pricingBreakdown.isPairOfferActive && pricingBreakdown.totalMrp > 0 ? (
                    <div className="summary-row">
                      <span>Total MRP ({totalItemsCount} items)</span>
                      <span>{formatPrice(pricingBreakdown.totalMrp)}</span>
                    </div>
                  ) : (
                    <div className="summary-row">
                      <span>Total MRP</span>
                      <span>{formatPrice(originalSubtotal || subtotal)}</span>
                    </div>
                  )}

                  {pairWellWithDiscount > 0 && (
                    <div className="summary-row text-accent-red fw-bold">
                      <span>Pair Offer ({pricingBreakdown.discountPercent || (isMultiPairOfferActive ? 25 : 20)}% OFF)</span>
                      <span>-{formatPrice(pairWellWithDiscount)}</span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="summary-row text-accent-red fw-bold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Estimated Delivery</span>
                    <span className={subtotal >= freeShippingThreshold ? 'text-success fw-bold' : ''}>
                      {subtotal >= freeShippingThreshold ? 'FREE' : 'Calculated at Checkout'}
                    </span>
                  </div>
                </div>
              )}

              {/* Always Visible Total Amount Bar */}
              <div className="summary-row total-row">
                <div className="d-flex flex-column">
                  <span className="total-title">Total Amount</span>
                  {totalSavings > 0 && (
                    <span className="total-savings-sub">You save {formatPrice(totalSavings)}</span>
                  )}
                </div>
                <span className="total-price">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            {/* Primary CTA */}
            <button className="btn-primary-orderly cart-checkout-cta w-100" onClick={handleCheckout}>
              <span>Proceed To Checkout</span>
              <FiArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
