import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { formatPrice } from '../utils/formatters';
import { 
  FiLock, FiCheckCircle, FiCreditCard, FiSmartphone, FiTruck, FiUser, FiHome, FiBriefcase, FiMapPin, FiLogIn, FiBookmark 
} from 'react-icons/fi';
import './Checkout.css';

const Checkout = () => {
  const { cart, total, subtotal, shippingCost, discountAmount, appliedCoupon, clearCart } = useCart();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Address Type State (Home, Office, Other)
  const [addressType, setAddressType] = useState('Home');
  const [saveAddressOption, setSaveAddressOption] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: ''
  });

  useEffect(() => {
    // Check login state
    const token = localStorage.getItem('orderly_customer_token');
    const userStr = localStorage.getItem('orderly_logged_in_user');
    const logged = Boolean(token || userStr);
    setIsLoggedIn(logged);

    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setFormData(prev => ({
          ...prev,
          firstName: parsed.name ? parsed.name.split(' ')[0] : prev.firstName,
          lastName: parsed.name ? parsed.name.split(' ').slice(1).join(' ') : prev.lastName,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone
        }));
      } catch (e) {}
    }

    // Load saved addresses
    try {
      const saved = localStorage.getItem('orderly_saved_addresses');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) setSavedAddresses(list);
      }
    } catch (e) {}
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectSavedAddress = (addr) => {
    setFormData({
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      email: addr.email || formData.email,
      phone: addr.phone || formData.phone,
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || 'Karnataka',
      pincode: addr.pincode || ''
    });
    if (addr.addressType) setAddressType(addr.addressType);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    // Mandatory Login Guard
    if (!isLoggedIn) {
      setOrderError('Account login is required before placing an order. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { from: '/checkout' } });
      }, 1200);
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    setOrderError(null);

    const shippingAddress = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      addressType: addressType
    };

    // Save address for future 1-click checkout if requested
    if (saveAddressOption) {
      try {
        const existing = localStorage.getItem('orderly_saved_addresses');
        const list = existing ? JSON.parse(existing) : [];
        const isDuplicate = list.some(a => a.address === shippingAddress.address && a.pincode === shippingAddress.pincode);
        if (!isDuplicate) {
          const updated = [{ ...shippingAddress, id: Date.now() }, ...list];
          localStorage.setItem('orderly_saved_addresses', JSON.stringify(updated));
        }
      } catch (e) {}
    }

    const orderData = {
      items: cart.map(item => ({
        id: item.id,
        productId: item.productId,
        isCombo: Boolean(item.isCombo),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedPieces: item.selectedPieces || []
      })),
      shippingAddress,
      subtotal,
      discount: discountAmount,
      shippingFee: shippingCost,
      shipping_fee: shippingCost,
      total,
      paymentMethod,
      couponCode: appliedCoupon?.code || ''
    };

    const res = await createOrder(orderData);
    if (res && res.success) {
      clearCart();
      navigate('/order-success', {
        state: {
          orderId: res.data?.order_number,
          total: Number(res.data?.total) || total,
          customerName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          paymentMethod
        }
      });
    } else {
      setOrderError(res?.message || 'Order failed. Please try again.');
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
      <SEO title="Secure Checkout | ORDERLY Mens Wear" />
      <div className="orderly-checkout-page section-padding">
        <div className="container">
          <div className="section-title-wrapper text-center mb-4">
            <span className="section-subtitle"><FiLock className="me-1" /> 256-Bit Encrypted Secure Checkout</span>
            <h1 className="section-title">ORDERLY Checkout</h1>
          </div>

          {/* Mandatory Login Warning Banner */}
          {!isLoggedIn && (
            <div className="alert alert-warning d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border-warning">
              <div className="d-flex align-items-center gap-2">
                <FiLock className="fs-4 text-warning" />
                <span>
                  <strong>Account Sign-In Required:</strong> You must be signed in to place your luxury order.
                </span>
              </div>
              <Link to="/login" state={{ from: '/checkout' }} className="btn btn-warning btn-sm fw-bold px-3 py-2 text-dark">
                <FiLogIn /> Sign In / Register
              </Link>
            </div>
          )}

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

                  {/* Pre-fill Saved Address Quick Selector */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-4 p-3 rounded-3 border border-secondary bg-dark shadow-sm">
                      <span className="small text-warning fw-bold d-block mb-2">
                        <FiBookmark className="me-1" /> 1-Click Pre-fill from Saved Addresses:
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {savedAddresses.map((addr, idx) => (
                          <button
                            key={addr.id || idx}
                            type="button"
                            className="saved-address-pill-btn"
                            onClick={() => handleSelectSavedAddress(addr)}
                          >
                            <span className="badge bg-danger me-1">{addr.addressType || 'Saved'}</span>
                            <span className="text-white fw-bold">{addr.firstName || 'Me'}:</span>{' '}
                            <span className="text-light">{addr.address ? `${addr.address.slice(0, 22)}...` : 'Saved Address'} ({addr.city || 'City'})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name *"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name *"
                        required
                        value={formData.lastName}
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
                        placeholder="Pincode *"
                        required
                        value={formData.pincode}
                        onChange={handleChange}
                        className="checkout-input"
                      />
                    </div>

                    <div className="col-12 mt-3">
                      <label className="d-flex align-items-center gap-2 text-muted small cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAddressOption}
                          onChange={(e) => setSaveAddressOption(e.target.checked)}
                          className="form-check-input"
                        />
                        <span>Save this address ({addressType}) for future 1-click express checkout</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Selection */}
                <div className="checkout-block glass-panel p-4">
                  <h5 className="block-title mb-4">2. Select Payment Method</h5>

                  <div className="payment-options-list">
                    <label className={`payment-radio-card ${paymentMethod === 'card' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <div className="d-flex align-items-center gap-3">
                        <FiCreditCard className="pay-icon" />
                        <div>
                          <strong>Credit / Debit Card</strong>
                          <span className="d-block small text-muted">Visa, MasterCard, Amex, RuPay</span>
                        </div>
                      </div>
                    </label>

                    <label className={`payment-radio-card ${paymentMethod === 'upi' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                      />
                      <div className="d-flex align-items-center gap-3">
                        <FiSmartphone className="pay-icon" />
                        <div>
                          <strong>Instant UPI / QR</strong>
                          <span className="d-block small text-muted">GPay, PhonePe, Paytm, BHIM</span>
                        </div>
                      </div>
                    </label>

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
                          <strong>Cash On Delivery (COD)</strong>
                          <span className="d-block small text-muted">Pay at doorstep upon inspection</span>
                        </div>
                      </div>
                    </label>
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
                          <h6 className="text-white fw-bold mb-1">{item.name}</h6>
                          <div className="small text-muted">
                            <span>Qty: <strong className="text-white">{item.quantity}</strong></span>
                            {(item.selectedSize || item.size) && (
                              <span className="ms-2">| Size: <strong className="text-warning">{item.selectedSize || item.size}</strong></span>
                            )}
                            {(item.selectedColor || item.color) && (
                              <span className="ms-2">| Color: <strong className="text-warning">{item.selectedColor || item.color}</strong></span>
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
                        <span className="summary-item-price">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="checkout-price-calc pt-3 border-top border-secondary">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Discount</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-2">
                      <span>Express Shipping</span>
                      <span>{shippingCost === 0 ? <strong className="text-success">FREE</strong> : formatPrice(shippingCost)}</span>
                    </div>
                    <div className="d-flex justify-content-between fs-4 font-weight-bold pt-3 border-top border-secondary text-white">
                      <span>Total Payable</span>
                      <span className="text-accent-red">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary-orderly w-100 py-3 mt-4 fs-6 fw-bold" 
                    disabled={submitting}
                  >
                    <FiLock /> {submitting ? 'Placing Order...' : `Complete Order (${formatPrice(total)})`}
                  </button>

                  {!isLoggedIn && (
                    <span className="text-warning extra-small d-block text-center mt-2">
                      * Login required to submit order
                    </span>
                  )}
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