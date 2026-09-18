import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiUser, FiMapPin, FiTruck, FiDollarSign, FiCheck, FiPrinter, FiSave, FiCreditCard, FiPackage, FiExternalLink, FiZoomIn, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { 
  DEFAULT_COURIER_SETTINGS, 
  buildCourierTrackingUrl 
} from '../../utils/deliveryCalculator.js';
import StatusBadge from '../../components/common/StatusBadge';
import './Orders.css';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [courierName, setCourierName] = useState('DTDC');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [couriersList, setCouriersList] = useState(DEFAULT_COURIER_SETTINGS);
  const [savingStatus, setSavingStatus] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [combosCatalog, setCombosCatalog] = useState([]);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const [res, settingsRes, prodRes, comboRes] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get('/settings').catch(() => null),
          api.get('/products').catch(() => ({ data: { products: [] } })),
          api.get('/combos').catch(() => ({ data: { combos: [] } }))
        ]);

        if (res.data && res.data.success && res.data.data) {
          const o = res.data.data;
          setOrder(o);
          setStatus(o.status || 'pending');
          setCourierName(o.courier_name || 'DTDC');
          setTrackingNumber(o.tracking_number || '');
        }

        const prods = prodRes?.data?.products || (Array.isArray(prodRes?.data) ? prodRes.data : []);
        setProductsCatalog(prods);

        const cmbs = comboRes?.data?.combos || (Array.isArray(comboRes?.data?.data) ? comboRes.data.data : (Array.isArray(comboRes?.data) ? comboRes.data : []));
        setCombosCatalog(cmbs);

        if (settingsRes?.data?.data?.courier_settings) {
          try {
            const parsedC = typeof settingsRes.data.data.courier_settings === 'string'
              ? JSON.parse(settingsRes.data.data.courier_settings)
              : settingsRes.data.data.courier_settings;
            if (Array.isArray(parsedC) && parsedC.length > 0) {
              setCouriersList(parsedC);
            }
          } catch (e) {}
        }
      } catch (err) {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const resolveItemImage = (item) => {
    if (!item) return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop';
    
    // Direct item image properties (skip unsplash fallback)
    const directImg = item.image || item.coverImage || item.cover_image || item.primaryImage || item.product_image || item.imageUrl || item.Product?.primaryImage || item.Product?.image || item.Product?.images?.[0] || item.Combo?.cover_image || item.Combo?.images?.[0];
    if (directImg && typeof directImg === 'string' && directImg.trim() && !directImg.includes('photo-1596755094514-f87e34085b2c')) {
      return directImg;
    }

    // Strip "(X-Piece Set)" suffix for matching
    const rawName = (item.name || item.product_name || item.productName || '');
    const itemNameLower = rawName.replace(/\s*\(\d+-Piece Set\)\s*$/i, '').toLowerCase().trim();
    const pId = String(item.productId || item.product_id || item.id || '');
    const cId = String(item.comboId || item.combo_id || '');

    // Check combos catalog if combo
    if (item.isCombo || cId || pId.startsWith('combo-') || rawName.toLowerCase().includes('combo')) {
      const matchCombo = combosCatalog.find(c => {
        if (cId && (String(c.id) === cId || String(c._id) === cId)) return true;
        if (pId && (String(c.id) === pId || pId.startsWith(String(c.id)))) return true;
        const cName = (c.name || '').toLowerCase().trim();
        if (cName && cName === itemNameLower) return true;
        if (cName && itemNameLower && (cName.includes(itemNameLower) || itemNameLower.includes(cName))) return true;
        return false;
      });
      if (matchCombo) {
        const comboCover = matchCombo.cover_image || (Array.isArray(matchCombo.images) && matchCombo.images[0]) || matchCombo.items?.[0]?.primaryImage || matchCombo.items?.[0]?.image;
        if (comboCover) return comboCover;
      }
    }

    // Check products catalog
    const matchProd = productsCatalog.find(p => 
      String(p.id) === pId || 
      (p.name && p.name.toLowerCase().trim() === itemNameLower) ||
      (p.name && itemNameLower && (p.name.toLowerCase().trim().includes(itemNameLower) || itemNameLower.includes(p.name.toLowerCase().trim())))
    );
    if (matchProd) {
      const prodImg = matchProd.primaryImage || matchProd.images?.[0] || (Array.isArray(matchProd.colors) && matchProd.colors[0]?.images?.[0]);
      if (prodImg) return prodImg;
    }

    return directImg || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop';
  };

  const resolveItemIdentifier = (item) => {
    if (!item) return null;

    const rawName = (item.name || item.product_name || item.productName || '');
    const itemNameLower = rawName.replace(/\s*\(\d+-Piece Set\)\s*$/i, '').toLowerCase().trim();
    const pId = String(item.productId || item.product_id || item.id || '');
    const cId = String(item.comboId || item.combo_id || '');

    const isCombo = Boolean(
      item.isCombo || 
      item.is_combo || 
      cId || 
      pId.startsWith('combo-') || 
      rawName.toLowerCase().includes('combo')
    );

    if (isCombo) {
      const matchCombo = combosCatalog.find(c => {
        if (cId && (String(c.id) === cId || String(c._id) === cId)) return true;
        if (pId && (String(c.id) === pId || pId.startsWith(String(c.id)))) return true;
        const cName = (c.name || '').toLowerCase().trim();
        if (cName && cName === itemNameLower) return true;
        if (cName && itemNameLower && (cName.includes(itemNameLower) || itemNameLower.includes(cName))) return true;
        return false;
      });
      const comboId = matchCombo?.id || cId || pId.replace(/-\d{10,}$/, '') || pId;
      return {
        type: 'combo',
        label: 'COMBO ID',
        value: comboId
      };
    }

    // Single order -> Show product's SKU
    let productSku = null;
    if (item.sku && String(item.sku).trim() && !String(item.sku).startsWith('ORD-SKU-') && !String(item.sku).includes('combo-')) {
      productSku = String(item.sku).trim();
    } else if (item.product_sku && String(item.product_sku).trim() && !String(item.product_sku).startsWith('ORD-SKU-') && !String(item.product_sku).includes('combo-')) {
      productSku = String(item.product_sku).trim();
    } else if (item.Product?.sku) {
      productSku = String(item.Product.sku).trim();
    }

    if (!productSku) {
      const matchProd = productsCatalog.find(p => 
        String(p.id) === pId || 
        (p.name && p.name.toLowerCase().trim() === itemNameLower) ||
        (p.name && itemNameLower && (p.name.toLowerCase().trim().includes(itemNameLower) || itemNameLower.includes(p.name.toLowerCase().trim())))
      );
      if (matchProd && matchProd.sku) productSku = String(matchProd.sku).trim();
    }

    if (productSku) {
      return {
        type: 'product',
        label: 'SKU',
        value: productSku
      };
    }

    return null;
  };

  const resolveItemSku = (item) => resolveItemIdentifier(item)?.value || '';

  const handleStatusUpdate = async (e) => {
    e.preventDefault();

    if (status.toLowerCase() === 'shipped' && !trackingNumber.trim()) {
      toast.error('Please enter the Tracking / AWB number before setting status to Shipped.');
      return;
    }

    setSavingStatus(true);
    const dynamicTrackingUrl = buildCourierTrackingUrl(courierName, trackingNumber, couriersList);

    try {
      const res = await api.patch(`/orders/${id}/status`, { 
        status,
        courier_name: courierName,
        tracking_number: trackingNumber,
        tracking_url: dynamicTrackingUrl
      });
      if (res.data && res.data.success) {
        toast.success(`Order status updated to "${status.toUpperCase()}"!`);
        setOrder(prev => prev ? {
          ...prev,
          status,
          courier_name: courierName,
          tracking_number: trackingNumber,
          tracking_url: dynamicTrackingUrl
        } : null);
      }
    } catch (err) {
      toast.error('Failed to update order status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="orders-page p-4 text-center py-5">
        <span className="spinner-border text-danger" role="status" />
        <p className="mt-3 text-muted">Loading order invoice details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="orders-page p-4 text-center py-5">
        <FiShoppingCart style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px' }} />
        <h3>Order Not Found</h3>
        <p className="text-muted">The requested order ID does not exist in the database.</p>
        <button className="btn-admin-outline mt-3" onClick={() => navigate('/orders')}>
          ← Back to Orders
        </button>
      </div>
    );
  }

  const customerName = order.Customer?.name || order.customer || 'Guest Customer';
  const customerEmail = order.Customer?.email || order.shipping_address?.email || 'admin@orderly.com';
  const customerPhone = order.Customer?.phone || order.shipping_address?.phone || '+91 98765 43210';
  const address = order.shipping_address || {};
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent Order';

  // Sample items breakdown if DB row missing detailed items array
  const orderItems = order.OrderItems?.length > 0 ? order.OrderItems : (
    order.items || [
      {
        id: 'item-1',
        name: 'Structured European Linen Resort Shirt',
        price: order.total || 3299,
        quantity: 1,
        selectedColor: 'Olive Tan',
        selectedSize: 'L',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop'
      }
    ]
  );

  return (
    <div className="order-detail-page p-4">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <button 
            type="button" 
            className="btn-admin-outline py-1 px-3 mb-2"
            onClick={() => navigate('/orders')}
          >
            <FiArrowLeft /> Back to Orders
          </button>
          <div className="d-flex align-items-center gap-3">
            <h1 className="orders-header-title mb-0">Order #{order.order_number || order.id}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="orders-header-sub mt-1">Placed on {dateStr}</p>
        </div>

        <button 
          type="button" 
          className="btn-admin-outline py-2 px-3"
          onClick={handlePrintInvoice}
        >
          <FiPrinter /> Print Packing Slip
        </button>
      </div>

      {/* Grid Row 1: Customer & Fulfillment Management */}
      <div className="row g-4 mb-4">
        {/* Customer & Delivery Card */}
        <div className="col-lg-6">
          <div className="order-detail-card">
            <h5 className="detail-card-title">
              <FiUser className="text-primary" /> Customer & Shipping Info
            </h5>

            <div className="mb-3">
              <strong className="d-block text-dark fs-6">{customerName}</strong>
              <span className="text-muted small">{customerEmail} • {customerPhone}</span>
            </div>

            <div className="border-top pt-3">
              <h6 className="admin-form-label mb-2"><FiMapPin /> Delivery Address:</h6>
              <p className="text-dark small mb-1 fw-bold">{address.firstName ? `${address.firstName} ${address.lastName}` : customerName}</p>
              <p className="text-muted small mb-1">{address.address || 'MG Road, Koramangala Sector 4'}</p>
              <p className="text-muted small mb-0">{address.city || 'Bengaluru'}, {address.state || 'Karnataka'} - {address.pincode || '560034'}</p>
            </div>

            <div className="border-top pt-3 mt-3 d-flex align-items-center justify-content-between">
              <span className="admin-form-label mb-0"><FiCreditCard /> Payment Method:</span>
              <span className={`payment-method-pill ${order.payment_method?.toLowerCase() === 'cod' ? 'cod' : 'card'}`}>
                {order.payment_method?.toUpperCase() || 'COD'}
              </span>
            </div>
          </div>
        </div>

        {/* Fulfillment & Status Management Card */}
        <div className="col-lg-6">
          <div className="order-detail-card">
            <h5 className="detail-card-title">
              <FiTruck className="text-danger" /> Order Status & Tracking
            </h5>

            <form onSubmit={handleStatusUpdate}>
              <div className="mb-3">
                <label className="admin-form-label">Order Fulfillment Status</label>
                <select 
                  className="admin-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="admin-form-label">Courier Service Partner {status.toLowerCase() === 'shipped' ? '*' : ''}</label>
                <select
                  className="admin-select"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                >
                  {couriersList.map(c => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="admin-form-label">Tracking Number / AWB {status.toLowerCase() === 'shipped' ? '*' : ''}</label>
                <input 
                  type="text" 
                  className="admin-input"
                  placeholder="e.g. DTDC123456789 or ST-88219402"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required={status.toLowerCase() === 'shipped'}
                />
              </div>

              {trackingNumber && (
                <div className="mb-3">
                  <a 
                    href={order.tracking_url || buildCourierTrackingUrl(courierName, trackingNumber, couriersList)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-1 py-2 fw-bold"
                  >
                    <FiTruck /> Open Live Tracking ({courierName}) <FiExternalLink className="ms-1" />
                  </a>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-admin-red w-100 justify-content-center py-2"
                disabled={savingStatus}
              >
                <FiSave /> {savingStatus ? 'Saving Status...' : 'Save Order Status & Tracking'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Ordered Items Table */}
      <div className="order-detail-card mb-4">
        <h5 className="detail-card-title">
          <FiPackage className="text-success" /> Order Items & Pricing Breakdown
        </h5>

        <div className="table-responsive">
          <table className="admin-matrix-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ITEM</th>
                <th>PRODUCT DETAILS</th>
                <th>VARIANT</th>
                <th>PRICE</th>
                <th>QTY</th>
                <th className="text-end">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => {
                const itemImg = resolveItemImage(item);
                const itemIdentifier = resolveItemIdentifier(item);
                const itemName = item.name || item.product_name || item.Product?.name || 'Curated Apparel Item';
                return (
                  <tr key={idx}>
                    <td>
                      <div 
                        className="order-item-thumb-box"
                        onClick={() => setZoomImage({ src: itemImg, title: itemName })}
                        title="Click to zoom primary image"
                      >
                        <img 
                          src={itemImg} 
                          alt={itemName} 
                          className="order-item-thumb-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop';
                          }}
                        />
                        <div className="thumb-zoom-icon-overlay">
                          <FiZoomIn />
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="text-dark d-block mb-1">{itemName}</strong>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {item.isCombo && <span className="badge bg-warning text-dark">COMBO BUNDLE</span>}
                        {itemIdentifier && (
                          <span className={`sku-badge-pill ${itemIdentifier.type === 'combo' ? 'combo-id-pill' : ''}`}>
                            {itemIdentifier.label}: {itemIdentifier.value}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="small text-muted">
                        Color: <strong className="text-dark">{item.selectedColor || item.color || 'Standard'}</strong> | Size: <strong className="text-dark">{item.selectedSize || item.size || 'M'}</strong>
                      </span>
                    </td>
                    <td>₹{item.price || order.total}</td>
                    <td><strong className="text-dark">{item.quantity || 1}</strong></td>
                    <td className="text-end fw-bold text-dark">
                      ₹{(Number(item.price || order.total) * Number(item.quantity || 1)).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="row justify-content-end mt-4 pt-3 border-top">
          <div className="col-md-5 col-lg-4">
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted small">Subtotal:</span>
              <strong className="text-dark">₹{Number(order.subtotal || order.total || 0).toLocaleString()}</strong>
            </div>
            {Number(order.discount || 0) > 0 && (
              <div className="d-flex justify-content-between py-1 text-success">
                <span className="small">Coupon Discount:</span>
                <span className="small font-weight-bold">-₹{Number(order.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted small">
                Shipping Fee:
                {order.delivery_location_label ? ` (${order.delivery_location_label})` : ''}
              </span>
              <span className={Number(order.shipping_fee || order.shippingFee || 0) === 0 ? 'text-success small fw-bold' : 'text-dark small fw-bold'}>
                {Number(order.shipping_fee || order.shippingFee || 0) === 0 ? 'FREE' : `₹${order.shipping_fee || order.shippingFee}`}
              </span>
            </div>
            <div className="d-flex justify-content-between py-2 border-top mt-2 fs-5">
              <strong className="text-dark">Grand Total:</strong>
              <strong className="text-danger">₹{Number(order.total || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── IMAGE LIGHTBOX ZOOM MODAL ───────────────────────── */}
      {zoomImage && (
        <div className="admin-zoom-modal-backdrop" onClick={() => setZoomImage(null)}>
          <div className="admin-zoom-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between w-100 mb-3 pb-2 border-bottom">
              <div>
                <h6 className="fw-bold text-dark mb-0">{zoomImage.title}</h6>
                <span className="text-muted extra-small">Primary Product Image Preview</span>
              </div>
              <button 
                type="button" 
                className="btn-close-modal-icon"
                onClick={() => setZoomImage(null)}
              >
                <FiX />
              </button>
            </div>
            <img src={zoomImage.src} alt={zoomImage.title} className="admin-zoom-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
