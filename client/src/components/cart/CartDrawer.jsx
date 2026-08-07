import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiTruck, FiArrowRight, FiTag } from 'react-icons/fi';
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
    total,
    shippingCost,
    freeShippingThreshold,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const hasFreeShippingPromo = freeShippingThreshold > 0;
  const freeShippingProgress = hasFreeShippingPromo ? Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100)) : 0;
  const amountNeededForFreeShipping = hasFreeShippingPromo ? Math.max(0, freeShippingThreshold - subtotal) : 0;

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
    const isLoggedIn = Boolean(
      localStorage.getItem('orderly_customer_token') ||
      localStorage.getItem('orderly_logged_in_user')
    );
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="cart-drawer-backdrop">
      <div className="cart-drawer-panel glass-panel">
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="d-flex align-items-center gap-2">
            <FiShoppingBag className="cart-header-icon" />
            <h5 className="mb-0">Shopping Cart</h5>
            <span className="cart-count-badge">({cart.length})</span>
          </div>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}>
            <FiX />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {hasFreeShippingPromo && (
          <div className="free-shipping-container">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="shipping-text">
              <FiTruck className="me-1 text-accent-red" />
              {amountNeededForFreeShipping === 0 ? (
                <strong className="text-success">You've Unlocked FREE Express Shipping! 🎉</strong>
              ) : (
                <>Add <strong>{formatPrice(amountNeededForFreeShipping)}</strong> more for FREE shipping</>
              )}
            </span>
            <span className="shipping-percentage">{freeShippingProgress}%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
        )}

        {/* Cart Items List */}
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
                  <img src={item.images?.[0] || item.image} alt={item.name} className="cart-item-img" />
                  
                  <div className="cart-item-details">
                    <span className="cart-item-brand">{item.brand || 'ORDERLY CURATED'}</span>
                    <h6 className="cart-item-title">{item.name}</h6>
                    
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
                        <span>Color: <strong>{item.selectedColor}</strong></span>
                      </div>
                    )}

                    <span className="cart-item-price">{formatPrice(item.price)}</span>
                    
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

                  <button 
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.cartItemId)}
                    title="Remove Item"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Checkout */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Coupon Code Box */}
            <div className="coupon-box">
              {appliedCoupon ? (
                <div className="coupon-applied-alert">
                  <span><FiTag /> Code <strong>{appliedCoupon.code}</strong> Applied {appliedCoupon.discountPercent ? `(${appliedCoupon.discountPercent}% Off)` : ''}</span>
                  <button className="remove-coupon-btn" onClick={removeCoupon}>Remove</button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="coupon-form">
                  <input 
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="coupon-input"
                  />
                  <button type="submit" className="coupon-btn">Apply</button>
                </form>
              )}
              {couponMsg && (
                <span className={`coupon-feedback ${couponMsg.success ? 'text-success' : 'text-danger'}`}>
                  {couponMsg.message}
                </span>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="price-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row text-success">
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Estimated Shipping</span>
                <span>{shippingCost === 0 ? <strong className="text-success">FREE</strong> : formatPrice(shippingCost)}</span>
              </div>

              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span className="total-price">{formatPrice(total)}</span>
              </div>
            </div>

            {/* CTA */}
            <button className="btn-primary-orderly w-100 py-3 mt-2" onClick={handleCheckout}>
              Proceed To Checkout <FiArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
