import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { useCart } from '../context/CartContext';
import { createOrder, createRazorpayOrder, getPaymentConfig, getSettings, verifyRazorpayPayment, reportRazorpayFailure, getActiveCoupons } from '../services/api';
import { formatPrice } from '../utils/formatters';
import { 
  FiLock, FiCheckCircle, FiCreditCard, FiTruck, FiHome, FiBriefcase, FiMapPin, FiShield, FiAlertCircle, FiTag, FiCopy, FiCheck
} from 'react-icons/fi';
import './Checkout.css';

let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
};

const Checkout = () => {
  const { 
    cart, 
    total, 
    subtotal, 
    pairWellWithDiscount,
    isMultiPairOfferActive,
    totalSavings,
    shippingCost, 
    discountAmount, 
    appliedCoupon, 
    clearCart, 
    pricingBreakdown,
    deliveryResult,
    pincode,
    setPincode,
    applyCoupon,
    removeCoupon
  } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState({ razorpayKeyId: '', currency: 'INR', codAdvancePercentage: 10 });
  const [siteSettings, setSiteSettings] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    let active = true;
    const loadCoupons = async () => {
      const res = await getActiveCoupons();
      if (active && res && res.success && Array.isArray(res.data)) {
        setAvailableCoupons(res.data.filter(c => c.show_on_checkout !== false));
      }
    };
    loadCoupons();
    const handleCouponsUpdated = () => loadCoupons();
    window.addEventListener('orderly_coupons_updated', handleCouponsUpdated);
    window.addEventListener('storage', handleCouponsUpdated);
    return () => {
      active = false;
      window.removeEventListener('orderly_coupons_updated', handleCouponsUpdated);
      window.removeEventListener('storage', handleCouponsUpdated);
    };
  }, []);

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponInput.trim() || couponLoading) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const res = await applyCoupon(couponInput);
    setCouponLoading(false);
    setCouponMsg(res);
    if (res.success) setCouponInput('');
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 1500);
  };

  // Address Type State (Home, Office, Other)
  const [addressType, setAddressType] = useState('Home');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: pincode || ''
  });

  useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      const [paymentRes, settingsRes] = await Promise.all([getPaymentConfig(), getSettings()]);
      if (!active) return;
      if (paymentRes?.success) setPaymentConfig({
        razorpayKeyId: paymentRes.data?.razorpayKeyId || '',
        currency: paymentRes.data?.currency || 'INR',
        codAdvancePercentage: Number(paymentRes.data?.codAdvancePercentage) || 10
      });
      if (settingsRes?.success) setSiteSettings(settingsRes.data || {});
    };
    loadConfig();
    window.addEventListener('orderly_settings_updated', loadConfig);
    return () => {
      active = false;
      window.removeEventListener('orderly_settings_updated', loadConfig);
    };
  }, []);

  const codEnabled = String(siteSettings?.cod_enabled ?? 'true') !== 'false';
  const codAdvancePercentage = Number(paymentConfig.codAdvancePercentage) || 10;
  const codAdvanceAmount = Math.max(0, Math.round((Number(subtotal) || 0) * (codAdvancePercentage / 100) + (Number(shippingCost) || 0)));
  const codBalanceDue = Math.max(0, Math.round((Number(total) || 0) - codAdvanceAmount));
  const paymentDueNow = paymentMethod === 'cod' ? codAdvanceAmount : Number(total) || 0;
  const paymentLabel = paymentMethod === 'cod' ? 'COD Advance' : 'Online Payment';

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pincode') {
      const cleanPin = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, pincode: cleanPin }));
      setPincode(cleanPin);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (submitting) return;
    if (deliveryResult?.isBelowMinOrder) {
      setOrderError(`Minimum order value of ₹${deliveryResult.minOrderAmount} is required for delivery.`);
      return;
    }

    setSubmitting(true);
    setOrderError(null);

    const nameParts = formData.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || formData.fullName.trim() || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

    const shippingAddress = {
      firstName,
      lastName,
      fullName: formData.fullName.trim() || `${firstName} ${lastName}`.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      addressType: addressType
    };

    const orderData = {
      items: cart.map(item => ({
        id: item.id,
        productId: item.productId || item.product_id || item.id,
        product_id: item.productId || item.product_id || item.id,
        isCombo: Boolean(item.isCombo),
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice || item.original_price || item.price,
        quantity: item.quantity || 1,
        selectedSize: item.selectedSize || 'M',
        selectedColor: item.selectedColor || null,
        selectedPieces: item.selectedPieces || [],
        pairOffer: item.pairOffer || null,
        isPairOffer: Boolean(item.isPairOffer || item.pairOffer?.enabled)
      })),
      shippingAddress,
      subtotal,
      discount: discountAmount,
      shippingFee: shippingCost,
      shipping_fee: shippingCost,
      delivery_method: deliveryResult?.method,
      delivery_location_label: deliveryResult?.locationLabel,
      total,
      paymentMethod,
      payment_method: paymentMethod,
      couponCode: appliedCoupon?.code || '',
      pricingBreakdown
    };

    try {
      const res = await createOrder(orderData);
      if (!res || !res.success) {
        setOrderError(res?.message || 'Order failed. Please try again.');
        setSubmitting(false);
        return;
      }

      const createdOrder = res.data || {};
      const paymentOrderRes = await createRazorpayOrder({
        orderId: createdOrder.id,
        orderNumber: createdOrder.order_number,
        paymentMethod
      });

      if (!paymentOrderRes?.success) {
        setOrderError(paymentOrderRes?.message || 'Unable to create payment session.');
        setSubmitting(false);
        return;
      }

      const amountDueNow = Number(paymentOrderRes.data?.amount || 0);
      if (amountDueNow <= 0) {
        clearCart();
        navigate('/order-success', {
          state: {
            orderId: createdOrder.order_number,
            total: Number(createdOrder.total) || total,
            customerName: formData.fullName,
            email: formData.email,
            paymentMethod: paymentLabel,
            amountPaid: 0,
            balanceDue: Number(createdOrder.total) || total,
            pricingBreakdown
          }
        });
        return;
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        setOrderError('Razorpay checkout script could not be loaded.');
        setSubmitting(false);
        return;
      }

      const paymentDescription = paymentMethod === 'cod'
        ? `COD advance payment of ${formatPrice(paymentOrderRes.data?.amountRupees || paymentDueNow / 100)}`
        : `Secure online payment for ${createdOrder.order_number}`;

      let paymentHandled = false;
      const finishSuccess = () => {
        if (paymentHandled) return;
        paymentHandled = true;
        clearCart();
        navigate('/order-success', {
          state: {
            orderId: createdOrder.order_number,
            total: Number(createdOrder.total) || total,
            customerName: formData.fullName,
            email: formData.email,
            paymentMethod: paymentLabel,
            amountPaid: paymentMethod === 'cod' ? codAdvanceAmount : total,
            balanceDue: paymentMethod === 'cod' ? codBalanceDue : 0,
            pricingBreakdown
          }
        });
      };

      const finishFailure = (message = 'Payment failed or was cancelled. Your order remains pending.') => {
        if (paymentHandled) return;
        paymentHandled = true;
        try {
          reportRazorpayFailure({
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
            failureMessage: message
          });
        } catch (e) {}

        navigate('/order-failure', {
          state: {
            orderId: createdOrder.order_number,
            message
          }
        });
        setSubmitting(false);
      };

      const razorpay = new window.Razorpay({
        key: paymentOrderRes.data?.keyId || paymentConfig.razorpayKeyId,
        amount: amountDueNow,
        currency: paymentOrderRes.data?.currency || paymentConfig.currency || 'INR',
        name: 'ORDERLY Mens Wear',
        description: paymentDescription,
        order_id: paymentOrderRes.data?.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          order_number: createdOrder.order_number,
          payment_method: paymentMethod
        },
        theme: {
          color: '#c1121f'
        },
        modal: {
          ondismiss: () => finishFailure('Payment was cancelled. You can retry the checkout or continue shopping.')
        },
        handler: async (response) => {
          const verifyRes = await verifyRazorpayPayment({
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          if (verifyRes?.success) {
            finishSuccess();
          } else {
            finishFailure(verifyRes?.message || 'Payment verification failed. Please contact support.');
          }
        }
      });

      razorpay.on('payment.failed', (failure) => {
        const failureMessage = failure?.error?.description || 'Payment failed or was cancelled. Your order remains pending.';
        finishFailure(failureMessage);
      });

      razorpay.open();
    } catch (error) {
      setOrderError(error?.message || 'Something went wrong during checkout.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h3>Your Cart is Empty</h3>
        <p className="text-muted">Add items to your cart before proceeding to checkout.</p>
        <Link to="/" className="btn-primary-orderly mt-3">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Secure Checkout | ORDERLY Mens Wear" 
        canonicalPath="/checkout"
        noindex={true}
      />
      <div className="orderly-checkout-page section-padding">
        <div className="container">
          <div className="section-title-wrapper text-center mb-4">
            <span className="section-subtitle"><FiLock className="me-1" /> 256-Bit Encrypted Secure Checkout</span>
            <h1 className="section-title">ORDERLY Checkout</h1>
          </div>

          {orderError && (
            <div className="alert alert-danger text-center mb-4">
              <FiCheckCircle className="me-2" />
              {orderError}
            </div>
          )}

          <form onSubmit={handleSubmitOrder}>
            <div className="row g-5">
              {/* Left Column: Address & Payment */}
              <div className="col-lg-7">
                {/* 1. Contact & Shipping */}
                <div className="checkout-block glass-panel p-4 mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                    <h5 className="block-title mb-0">1. Shipping Address</h5>
                    
                    {/* Address Type Selection (Home, Office, Other) */}
                    <div className="addr-type-pills-group">
                      <button
                        type="button"
                        className={`addr-type-pill ${addressType === 'Home' ? 'active' : ''}`}
                        onClick={() => setAddressType('Home')}
                      >
                        <FiHome className="pill-icon" /> Home
                      </button>
                      <button
                        type="button"
                        className={`addr-type-pill ${addressType === 'Office' ? 'active' : ''}`}
                        onClick={() => setAddressType('Office')}
                      >
                        <FiBriefcase className="pill-icon" /> Office
                      </button>
                      <button
                        type="button"
                        className={`addr-type-pill ${addressType === 'Other' ? 'active' : ''}`}
                        onClick={() => setAddressType('Other')}
                      >
                        <FiMapPin className="pill-icon" /> Other
                      </button>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12">
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Name *"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address *"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number *"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>
                    <div className="col-12">
                      <input
                        type="text"
                        name="address"
                        placeholder="Street Address, House/Apt No. *"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        name="city"
                        placeholder="City *"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        name="state"
                        placeholder="State *"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode (6-digit) *"
                        required
                        value={formData.pincode}
                        onChange={handleChange}
                        className="checkout-input"
                        maxLength={6}
                      />
                    </div>

                    {/* Live Pincode Location Resolution Badge */}
                    {formData.pincode && formData.pincode.length === 6 && (
                      <div className="col-12 mt-2">
                        <div className="p-2 px-3 rounded-2 d-flex align-items-center justify-content-between" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <span className="small text-white d-flex align-items-center gap-1">
                            <FiMapPin className="text-danger" />
                            <span>Delivery Destination: <strong>{deliveryResult?.locationLabel || (deliveryResult?.method === 'pincode_based' ? 'Standard Location' : 'All India')}</strong></span>
                          </span>
                          <span className="badge bg-danger fs-7">
                            {shippingCost === 0 ? 'FREE DELIVERY' : `Delivery Charge: ${formatPrice(shippingCost)}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Minimum Order Value Alert */}
                    {deliveryResult?.isBelowMinOrder && (
                      <div className="col-12 mt-2">
                        <div className="alert alert-warning p-2 small mb-0 d-flex align-items-center gap-2">
                          <FiAlertCircle className="text-warning flex-shrink-0" style={{ fontSize: '1.2rem' }} />
                          <div>
                            <strong>Minimum Order Required:</strong> A minimum order value of <strong>{formatPrice(deliveryResult.minOrderAmount)}</strong> is required for delivery (Current cart: <strong>{formatPrice(subtotal)}</strong>).
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* 2. Payment Selection */}
                <div className="checkout-block glass-panel p-4">
                  <h5 className="block-title mb-4">2. Select Payment Method</h5>

                  {codEnabled ? (
                    <div className="payment-note mb-3">
                      <FiShield className="me-2" />
                      COD requires a {codAdvancePercentage}% advance of subtotal + delivery charges. You will pay the balance on delivery.
                    </div>
                  ) : (
                    <div className="payment-note mb-3 text-warning">
                      <FiAlertCircle className="me-2" />
                      Cash on Delivery is currently disabled by admin.
                    </div>
                  )}

                  <div className="payment-options-list">
                    <label className={`payment-radio-card ${paymentMethod === 'online' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'online'}
                        onChange={() => setPaymentMethod('online')}
                      />
                      <div className="d-flex align-items-center gap-3">
                        <FiCreditCard className="pay-icon" />
                        <div>
                          <strong className="payment-title">Online Payment</strong>
                          <span className="d-block payment-desc">Pay securely with Razorpay using card, UPI, wallet, or netbanking</span>
                        </div>
                      </div>
                    </label>
                    {codEnabled && (
                      <label className={`payment-radio-card ${paymentMethod === 'cod' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="pay"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                        />
                        <div className="d-flex align-items-center gap-3">
                          <FiTruck className="pay-icon" />
                          <div>
                            <strong className="payment-title">Cash On Delivery (COD)</strong>
                            <span className="d-block payment-desc">
                              Pay {formatPrice(paymentDueNow)} now, then {formatPrice(codBalanceDue)} on delivery
                            </span>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="col-lg-5">
                <div className="order-summary-block glass-panel p-4">
                  <h5 className="block-title mb-4">Order Summary ({cart.length} items)</h5>

                  <div className="summary-items-list mb-4">
                    {cart.map(item => (
                      <div key={item.cartItemId} className="summary-item-row">
                        <img src={item.images?.[0] || item.image} alt={item.name} className="summary-item-img" />
                        <div className="summary-item-info">
                          <div className="d-flex align-items-center flex-wrap gap-1 mb-1">
                            <h6 className="text-white fw-bold mb-0">{item.name}</h6>
                            {item.isPairOffer && (
                              <span className="badge bg-danger text-white extra-small">
                                PAIR PRODUCT {item.pairOffer?.discount_percent ? `(${item.pairOffer.discount_percent}% OFF)` : ''}
                              </span>
                            )}
                          </div>
                          <div className="summary-item-meta">
                            <span>Qty: <strong className="meta-val-qty">{item.quantity}</strong></span>
                            {(item.selectedSize || item.size) && (
                              <span className="ms-2">| Size: <strong className="meta-val-highlight">{item.selectedSize || item.size}</strong></span>
                            )}
                            {(item.selectedColor || item.color) && (
                              <span className="ms-2">| Color: <strong className="meta-val-highlight">{item.selectedColor || item.color}</strong></span>
                            )}
                          </div>

                          {/* Combo Bundle Pieces Breakdown */}
                          {item.isCombo && Array.isArray(item.selectedPieces) && item.selectedPieces.length > 0 && (
                            <div className="combo-checkout-pieces mt-1 extra-small text-light">
                              {item.selectedPieces.map((p, pIdx) => (
                                <div key={pIdx} className="text-truncate">
                                  • {p.name || `Piece ${pIdx + 1}`}: <span className="text-warning">{p.color} / Size {p.size}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="summary-item-price">
                          {Number(item.originalPrice || item.original_price || 0) > Number(item.price || 0) && (
                            <del className="me-1 text-muted small">{formatPrice((item.originalPrice || item.original_price) * item.quantity)}</del>
                          )}
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Apply Box */}
                  <div className="checkout-coupon-box mb-4">
                    {appliedCoupon ? (
                      <div className="checkout-coupon-applied">
                        <div className="d-flex align-items-center gap-2">
                          <FiCheck className="text-success" />
                          <strong className="text-success">Coupon {appliedCoupon.code} applied!</strong>
                        </div>
                        <button 
                          type="button"
                          className="checkout-coupon-remove"
                          onClick={() => { removeCoupon(); setCouponMsg(null); }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="checkout-coupon-form">
                        <input
                          type="text"
                          className="checkout-coupon-input"
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCouponSubmit(e);
                            }
                          }}
                          disabled={couponLoading}
                        />
                        <button 
                          type="button" 
                          className="checkout-coupon-apply" 
                          onClick={handleCouponSubmit}
                          disabled={couponLoading || !couponInput.trim()}
                        >
                          {couponLoading ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                    )}

                    {couponMsg && !appliedCoupon && (
                      <span className={`checkout-coupon-feedback ${couponMsg.success ? 'text-success' : 'text-danger'}`}>
                        {couponMsg.message}
                      </span>
                    )}

                    {availableCoupons.length > 0 && !appliedCoupon && (
                      <div className="checkout-coupon-offers">
                        <span className="checkout-coupon-offers-label">
                          <FiTag /> Available Coupons:
                        </span>
                        {availableCoupons.slice(0, 4).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className="checkout-coupon-chip"
                            onClick={() => {
                              setCouponInput(c.code);
                              handleCopyCode(c.code);
                            }}
                            title={`${c.description || ''} — click to use code`}
                          >
                            {c.code}
                            <span className="checkout-coupon-chip-icon">
                              {copiedCode === c.code ? <FiCheck /> : <FiCopy />}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="checkout-price-calc pt-3 border-top border-secondary">
                    {pricingBreakdown?.isPairOfferActive && pricingBreakdown?.totalMrp > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total MRP ({cart.length} items)</span>
                        <span>{formatPrice(pricingBreakdown.totalMrp)}</span>
                      </div>
                    )}

                    {pairWellWithDiscount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Pair Offer ({pricingBreakdown?.discountPercent || (isMultiPairOfferActive ? 25 : 20)}% OFF)</span>
                        <span>-{formatPrice(pairWellWithDiscount)}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Coupon Discount</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mb-2">
                      <span>
                        {deliveryResult?.methodLabel || 'Express Shipping'}
                      </span>
                      <span>{shippingCost === 0 ? <strong className="text-success">FREE</strong> : formatPrice(shippingCost)}</span>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <span>{paymentMethod === 'cod' ? `COD Advance (Delivery + ${codAdvancePercentage}% of Subtotal)` : 'Payable Now'}</span>
                      <span className="text-warning fw-bold">{formatPrice(paymentDueNow)}</span>
                    </div>

                    {paymentMethod === 'cod' && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Balance Due on Delivery</span>
                        <span>{formatPrice(codBalanceDue)}</span>
                      </div>
                    )}

                    {totalSavings > 0 && (
                      <div className="p-2 rounded mt-2 mb-2 text-center text-success fw-bold" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        🎉 Total Savings: You Save {formatPrice(totalSavings)}!
                      </div>
                    )}

                    <div className="d-flex justify-content-between fs-4 font-weight-bold pt-3 border-top border-secondary text-white">
                      <span>{paymentMethod === 'cod' ? 'Order Total' : 'Total Payable'}</span>
                      <span className="text-accent-red">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary-orderly w-100 py-3 mt-4 fs-6 fw-bold" 
                    disabled={submitting || deliveryResult?.isBelowMinOrder}
                  >
                    <FiLock /> {submitting ? 'Starting Payment...' : (
                      deliveryResult?.isBelowMinOrder
                        ? `Min Order ₹${deliveryResult.minOrderAmount} Required`
                        : (paymentMethod === 'cod' ? `Pay ${formatPrice(paymentDueNow)} & Place COD Order` : `Pay ${formatPrice(paymentDueNow)} Securely`)
                    )}
                  </button>

                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Checkout;
