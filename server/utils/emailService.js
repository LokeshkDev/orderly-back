import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { buildCourierTrackingUrl } from './deliveryCalculator.js';

dotenv.config();

export const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.ADMIN_EMAIL;
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  return Boolean(user && pass && user.includes('@') && !user.includes('your-email@'));
};

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const interpolateTemplate = (template = '', variables = {}) => {
  if (!template || typeof template !== 'string') return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
  });
};

const renderItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p style="color: #64748b; font-size: 14px; margin: 8px 0;">Curated apparel item(s)</p>';
  }

  const rows = items.map((item) => {
    const name = item.name || item.product_name || item.productName || 'Curated Apparel Item';
    const size = item.selectedSize || item.size ? `Size: ${item.selectedSize || item.size}` : '';
    const color = item.selectedColor || item.color ? `Color: ${item.selectedColor || item.color}` : '';
    const variant = [color, size].filter(Boolean).join(' | ');
    const qty = Number(item.quantity || 1);
    const price = Number(item.price ?? item.unit_price ?? 0);
    const itemTotal = price * qty;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 14px 10px; font-size: 14px; color: #0f172a; vertical-align: top;">
          <strong style="color: #0f172a; font-size: 14px; display: block;">${name}</strong>
          ${variant ? `<span style="font-size: 12px; color: #64748b; margin-top: 3px; display: inline-block;">${variant}</span>` : ''}
        </td>
        <td style="padding: 14px 10px; font-size: 14px; color: #334155; text-align: center; vertical-align: top; font-weight: 600;">${qty}</td>
        <td style="padding: 14px 10px; font-size: 14px; color: #0f172a; text-align: right; font-weight: 700; vertical-align: top;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 18px;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
          <th style="padding: 10px 10px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
          <th style="padding: 10px 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
          <th style="padding: 10px 10px; font-size: 11px; font-weight: 800; color: #475569; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const renderAddressHtml = (address = {}) => {
  if (!address || typeof address !== 'object') return '';
  const fullName = address.fullName || `${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Customer';
  const line = address.address || address.street || '';
  const city = address.city || '';
  const state = address.state || '';
  const pincode = address.pincode || '';
  const phone = address.phone || '';

  return `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-top: 10px; font-size: 14px; line-height: 1.5; color: #334155;">
      <strong style="color: #0f172a; display: block; margin-bottom: 4px; font-size: 14px;">${fullName}</strong>
      ${line ? `<div style="color: #475569;">${line}</div>` : ''}
      <div style="color: #475569;">${[city, state].filter(Boolean).join(', ')}${pincode ? ` - ${pincode}` : ''}</div>
      ${phone ? `<div style="color: #64748b; font-size: 13px; margin-top: 6px; font-weight: 600;">Phone: ${phone}</div>` : ''}
    </div>
  `;
};

export const buildOrderEmailPayload = (details = {}) => {
  const {
    orderNumber = 'ORDER',
    customerName = 'Valued Customer',
    customerEmail = '',
    adminEmail = '',
    status = 'pending',
    type = 'order_placed',
    paymentStatus = 'pending',
    paymentMethod = 'Online',
    subtotal = 0,
    discount = 0,
    deliveryCharge = 0,
    amount = 0,
    items = [],
    shippingAddress = {},
    courierName = '',
    trackingNumber = '',
    trackingUrl = '',
    shippedDate = '',
    deliveredDate = '',
    cancelReason = '',
    failReason = '',
    emailSettings = null,
    courierSettings = null
  } = details;

  const normalizedOrderNumber = String(orderNumber || 'ORDER').trim();
  const normalizedStatus = String(status || 'pending').toUpperCase();
  const adminTarget = adminEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || process.env.GMAIL_USER || 'admin@orderlymenswear.in';
  const customerTarget = customerEmail || '';
  const orderTotal = Number(amount || subtotal + deliveryCharge - discount || 0);

  const effectiveTrackingUrl = trackingUrl || buildCourierTrackingUrl(courierName, trackingNumber, courierSettings);
  const formattedOrderDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
  const formattedShippedDate = shippedDate || new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
  const formattedDeliveredDate = deliveredDate || new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });

  const productsText = Array.isArray(items) && items.length > 0
    ? items.map(i => `${i.name || i.product_name || 'Item'} (x${i.quantity || 1})`).join(', ')
    : 'Menswear apparel items';

  const addressString = typeof shippingAddress === 'string'
    ? shippingAddress
    : [
        shippingAddress.fullName || `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.pincode
      ].filter(Boolean).join(', ');

  const templateVariables = {
    customerName,
    orderNumber: normalizedOrderNumber,
    orderDate: formattedOrderDate,
    products: productsText,
    subtotal: formatCurrency(subtotal),
    discount: formatCurrency(discount),
    deliveryCharge: deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge),
    total: formatCurrency(orderTotal),
    courierName: courierName || 'Express Domestic Courier',
    trackingNumber: trackingNumber || 'N/A',
    trackingUrl: effectiveTrackingUrl,
    deliveryDate: formattedDeliveredDate,
    shippingAddress: addressString
  };

  // Master Dark Luxury Header with Brand Phoenix Emblem & Bold Typography
  const emailHeader = `
    <div style="background-color: #06090e; padding: 28px 20px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 3px solid #dc2626;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td align="center" style="vertical-align: middle;">
            <div style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #ffffff; font-family: 'Helvetica Neue', Arial, sans-serif; text-transform: uppercase;">
              <span style="color: #dc2626;">✦</span> ORDERLY
            </div>
            <div style="font-size: 11px; letter-spacing: 2.5px; color: #94a3b8; font-weight: 800; margin-top: 4px; text-transform: uppercase;">
              STYLE THAT MATTERS • MENS WEAR
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  const emailFooter = `
    <div style="background-color: #0b0f19; padding: 26px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); border-radius: 0 0 12px 12px; font-size: 13px; color: #94a3b8;">
      <p style="margin: 0 0 6px 0; font-weight: 800; color: #ffffff; letter-spacing: 1px; font-size: 14px;">ORDERLY MENS WEAR</p>
      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px;">Valasaravakkam & Kundrathur, Chennai, Tamil Nadu, India</p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">Need assistance with this order? Reply directly to this email or reach us at <a href="mailto:support@orderlymenswear.in" style="color: #dc2626; text-decoration: none; font-weight: 600;">support@orderlymenswear.in</a></p>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #475569;">© 2026 ORDERLY Mens Wear. All rights reserved.</p>
    </div>
  `;

  let customerSubject = '';
  let customerContent = '';
  let adminSubject = '';

  const lowerType = String(type || '').toLowerCase();
  const lowerStatus = String(status || '').toLowerCase();

  // 1. ORDER PLACED (CONFIRMED)
  if (lowerType === 'order_placed' || lowerType === 'payment_success' || lowerStatus === 'confirmed' || lowerStatus === 'pending') {
    const config = emailSettings?.new_order;
    customerSubject = config?.subject
      ? interpolateTemplate(config.subject, templateVariables)
      : `ORDERLY | Order Confirmed! #${normalizedOrderNumber}`;

    adminSubject = `🚨 ORDERLY Admin | New Order Received #${normalizedOrderNumber} (${formatCurrency(orderTotal)})`;

    customerContent = `
      <div style="padding: 32px 26px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 14px; letter-spacing: 0.5px;">
            ✓ ORDER CONFIRMED & IN FULFILLMENT
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 23px; font-weight: 800;">Thank you for your order, ${customerName}!</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">We have successfully received order <strong style="color: #0f172a;">#${normalizedOrderNumber}</strong> placed on ${formattedOrderDate}.</p>
        </div>

        ${config?.custom_message ? `<div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 14px 16px; border-radius: 4px; margin-bottom: 22px; font-size: 14px; color: #334155;">${interpolateTemplate(config.custom_message, templateVariables)}</div>` : ''}

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 26px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Order Summary</h3>
        ${renderItemsHtml(items)}

        <!-- Pricing Breakdown -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Subtotal</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(subtotal || orderTotal)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="padding: 6px 0; color: #059669;">Promo Discount</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #059669;">-${formatCurrency(discount)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Delivery Fee</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: ${deliveryCharge === 0 ? '#059669' : '#0f172a'};">
              ${deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
            </td>
          </tr>
          <tr style="border-top: 2px solid #cbd5e1; font-size: 16px;">
            <td style="padding: 12px 0 6px 0; font-weight: 800; color: #0f172a;">Grand Total</td>
            <td style="padding: 12px 0 6px 0; text-align: right; font-weight: 900; color: #dc2626;">${formatCurrency(orderTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Payment Method</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #334155; font-size: 13px;">${String(paymentMethod).toUpperCase()} (${String(paymentStatus).toUpperCase()})</td>
          </tr>
        </table>

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 28px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</h3>
        ${renderAddressHtml(shippingAddress)}
      </div>
    `;
  }

  // 2. ORDER CANCELLED
  else if (lowerType === 'order_cancelled' || lowerStatus === 'cancelled' || lowerStatus === 'canceled') {
    customerSubject = `ORDERLY | Order Cancelled #${normalizedOrderNumber}`;
    adminSubject = `⚠️ ORDERLY Admin | Order Cancelled #${normalizedOrderNumber} (${formatCurrency(orderTotal)})`;

    customerContent = `
      <div style="padding: 32px 26px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="display: inline-block; background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 14px; letter-spacing: 0.5px;">
            ✕ ORDER CANCELLED
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 23px; font-weight: 800;">Your Order #${normalizedOrderNumber} Has Been Cancelled</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">Hello ${customerName}, your order #${normalizedOrderNumber} has been marked as cancelled.</p>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 6px; margin-bottom: 22px; font-size: 14px; color: #991b1b; line-height: 1.5;">
          <strong>Refund Information:</strong> If you made an online prepayment (Card/UPI/NetBanking), a full refund of <strong>${formatCurrency(orderTotal)}</strong> has been initiated and will reflect in your bank/card within 3-5 business days.
          ${cancelReason ? `<div style="margin-top: 6px; color: #7f1d1d;"><strong>Reason:</strong> ${cancelReason}</div>` : ''}
        </div>

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 26px 0 12px 0; text-transform: uppercase;">Cancelled Items</h3>
        ${renderItemsHtml(items)}

        <div style="text-align: center; margin: 26px 0 10px 0;">
          <a href="https://orderlymenswear.in/shop" target="_blank" style="background-color: #dc2626; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block;">Browse Latest Collections →</a>
        </div>
      </div>
    `;
  }

  // 3. ORDER FAILED / PAYMENT FAILED
  else if (lowerType === 'order_failed' || lowerType === 'payment_failed' || lowerStatus === 'failed') {
    customerSubject = `ORDERLY | Payment Incomplete for Order #${normalizedOrderNumber}`;
    adminSubject = `⚠️ ORDERLY Admin | Payment Failed for Order #${normalizedOrderNumber} (${formatCurrency(orderTotal)})`;

    customerContent = `
      <div style="padding: 32px 26px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="display: inline-block; background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 14px; letter-spacing: 0.5px;">
            ⚠️ PAYMENT INCOMPLETE / FAILED
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 23px; font-weight: 800;">Payment Was Not Completed</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">Hello ${customerName}, the transaction for order <strong style="color: #0f172a;">#${normalizedOrderNumber}</strong> was not completed.</p>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 22px; font-size: 14px; color: #92400e; line-height: 1.5;">
          <strong>What happened?</strong> Your bank or payment gateway encountered an issue while processing the amount of <strong>${formatCurrency(orderTotal)}</strong>. Any debited amount will be reversed back by your bank automatically.
          ${failReason ? `<div style="margin-top: 6px;"><strong>Details:</strong> ${failReason}</div>` : ''}
        </div>

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 26px 0 12px 0; text-transform: uppercase;">Items In Your Bag</h3>
        ${renderItemsHtml(items)}

        <div style="text-align: center; margin: 26px 0 10px 0;">
          <a href="https://orderlymenswear.in/checkout" target="_blank" style="background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block;">Retry Payment / Checkout →</a>
        </div>
      </div>
    `;
  }

  // 4. ORDER SHIPPED
  else if (lowerType === 'order_shipped' || lowerStatus === 'shipped') {
    const config = emailSettings?.order_shipped;
    customerSubject = config?.subject
      ? interpolateTemplate(config.subject, templateVariables)
      : `ORDERLY | Your Order #${normalizedOrderNumber} Has Been Shipped!`;

    adminSubject = `📦 ORDERLY Admin | Order Shipped #${normalizedOrderNumber}`;

    customerContent = `
      <div style="padding: 32px 26px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="display: inline-block; background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 14px; letter-spacing: 0.5px;">
            ✈️ PARCEL ON THE WAY
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 23px; font-weight: 800;">Your Order Has Been Shipped!</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">Great news, ${customerName}! Your parcel for order <strong style="color: #0f172a;">#${normalizedOrderNumber}</strong> is on its way.</p>
        </div>

        <!-- Tracking Card -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; margin: 20px 0; text-align: center;">
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px;">Courier Partner</div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">${courierName || 'Express Domestic Courier'}</div>
          
          <div style="font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 700;">AWB / TRACKING NUMBER</div>
          <div style="font-size: 16px; font-family: monospace; font-weight: 800; color: #0f172a; background-color: #ffffff; display: inline-block; padding: 8px 20px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 16px;">
            ${trackingNumber || 'Available shortly'}
          </div>

          ${effectiveTrackingUrl ? `
          <div>
            <a href="${effectiveTrackingUrl}" target="_blank" style="background-color: #dc2626; color: #ffffff; display: inline-block; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none;">
              Track Shipment Live →
            </a>
          </div>
          ` : ''}
        </div>

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 26px 0 12px 0; text-transform: uppercase;">Items Shipped</h3>
        ${renderItemsHtml(items)}

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 26px 0 12px 0; text-transform: uppercase;">Delivering To</h3>
        ${renderAddressHtml(shippingAddress)}
      </div>
    `;
  }

  // 5. ORDER DELIVERED
  else if (lowerType === 'order_delivered' || lowerStatus === 'delivered') {
    const config = emailSettings?.order_delivered;
    customerSubject = config?.subject
      ? interpolateTemplate(config.subject, templateVariables)
      : `ORDERLY | Your Order #${normalizedOrderNumber} Has Been Delivered!`;

    adminSubject = `🎉 ORDERLY Admin | Order Delivered #${normalizedOrderNumber}`;

    customerContent = `
      <div style="padding: 32px 26px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 26px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; margin-bottom: 14px; letter-spacing: 0.5px;">
            ✓ DELIVERED SUCCESSFULLY
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 23px; font-weight: 800;">Your Parcel Has Arrived!</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">Hello ${customerName}, your order <strong style="color: #0f172a;">#${normalizedOrderNumber}</strong> was delivered on ${formattedDeliveredDate}.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">We hope you love your ORDERLY menswear. Enjoy 15 days doorstep size exchange guarantee on all orders.</p>
        </div>

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 26px 0 12px 0; text-transform: uppercase;">Items Delivered</h3>
        ${renderItemsHtml(items)}
      </div>
    `;
  }

  // GENERIC UPDATE
  else {
    customerSubject = `ORDERLY | Order Status Update #${normalizedOrderNumber}`;
    adminSubject = `ORDERLY Admin | Order Status Update #${normalizedOrderNumber}`;

    customerContent = `
      <div style="padding: 32px 26px; background-color: #ffffff;">
        <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 800;">Hello ${customerName},</h2>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Your order <strong>#${normalizedOrderNumber}</strong> status has been updated to <strong style="color: #dc2626;">${normalizedStatus}</strong>.</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Total: <strong>${formatCurrency(orderTotal)}</strong></p>
        ${renderItemsHtml(items)}
      </div>
    `;
  }

  const customerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #cbd5e1;">
          ${emailHeader}
          ${customerContent}
          ${emailFooter}
        </div>
      </body>
    </html>
  `;

  const adminHtml = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
      <body style="margin: 0; padding: 24px 12px; background-color: #0b0f19; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); overflow: hidden; border: 1px solid #cbd5e1;">
          <div style="background-color: #06090e; padding: 20px; text-align: center; border-bottom: 2px solid #dc2626;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 1px;">ORDERLY STORE ALERT</h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase;">Event: ${type} (${normalizedStatus})</p>
          </div>
          <div style="padding: 24px; font-size: 14px; color: #1e293b; line-height: 1.6;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <p style="margin: 0 0 6px 0;"><strong>Order Number:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: 700; color: #dc2626;">#${normalizedOrderNumber}</span></p>
              <p style="margin: 0 0 6px 0;"><strong>Customer:</strong> ${customerName} (${customerEmail || 'No email'})</p>
              <p style="margin: 0 0 6px 0;"><strong>Total Value:</strong> ${formatCurrency(orderTotal)} (${paymentMethod.toUpperCase()})</p>
              ${courierName ? `<p style="margin: 0;"><strong>Courier:</strong> ${courierName} | <strong>AWB:</strong> ${trackingNumber}</p>` : ''}
            </div>
            ${renderItemsHtml(items)}
            <div style="margin-top: 14px;">
              <strong>Delivery Address:</strong>
              ${renderAddressHtml(shippingAddress)}
            </div>
          </div>
          ${emailFooter}
        </div>
      </body>
    </html>
  `;

  return {
    customer: {
      to: customerTarget,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_USER || 'concierge@orderlymenswear.in',
      subject: customerSubject,
      html: customerHtml
    },
    admin: {
      to: adminTarget,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_USER || 'concierge@orderlymenswear.in',
      subject: adminSubject,
      html: adminHtml
    }
  };
};

export const sendOrderEmail = async (details = {}) => {
  if (!isEmailConfigured()) {
    console.info(`[EmailService] Simulated order email (${details.type || 'update'}/${details.status || ''}) for #${details.orderNumber}`);
    return { success: false, simulated: true, message: 'Email credentials not configured in .env' };
  }

  try {
    const payload = buildOrderEmailPayload(details);
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER || process.env.GMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD
      }
    });

    const recipients = [];
    if (payload.customer.to) recipients.push({ ...payload.customer, to: payload.customer.to });
    if (payload.admin.to && payload.admin.to !== payload.customer.to) recipients.push({ ...payload.admin, to: payload.admin.to });

    if (!recipients.length) {
      return { success: false, message: 'No email recipients configured.' };
    }

    await Promise.allSettled(recipients.map((mail) => transporter.sendMail(mail)));
    return { success: true, sent: recipients.length };
  } catch (error) {
    console.error('Order email sending error:', error.message);
    return { success: false, message: error.message };
  }
};

export const sendAdminUserCreatedEmail = async ({ name, email, password, role, creatorName = 'Super Admin' }) => {
  if (!isEmailConfigured()) {
    console.info(`[EmailService] Simulated Admin User Created Email for ${email} (${role})`);
    return { success: false, simulated: true, message: 'Email credentials not configured in .env' };
  }

  try {
    const userAccount = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const userPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || userAccount;
    const loginUrl = process.env.ADMIN_URL || 'http://localhost:5174/login';
    const roleName = role ? String(role).toUpperCase() : 'ADMIN';

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: userAccount,
        pass: userPass
      }
    });

    const userHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
        <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #cbd5e1;">
            <div style="background-color: #06090e; padding: 26px 20px; text-align: center; border-bottom: 2px solid #dc2626;">
              <div style="font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #ffffff; font-family: 'Helvetica Neue', Arial, sans-serif;">
                <span style="color: #dc2626;">✦</span> ORDERLY
              </div>
              <div style="font-size: 11px; letter-spacing: 2px; color: #94a3b8; font-weight: 700; margin-top: 4px; text-transform: uppercase;">
                STORE MANAGEMENT & TEAM ACCESS
              </div>
            </div>
            <div style="padding: 32px 26px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 22px; font-weight: 800;">Welcome to the Team, ${name}!</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">An administrative team account has been provisioned for you on the ORDERLY Store Management Portal.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Assigned Role:</strong> <span style="color: #0f172a; font-weight: 800;">${roleName}</span></div>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Login Email:</strong> <span style="color: #0f172a; font-family: monospace; font-weight: 700;">${email}</span></div>
                <div style="font-size: 13px; color: #64748b;"><strong>Initial Password:</strong> <span style="color: #dc2626; font-family: monospace; font-weight: 800; font-size: 15px;">${password}</span></div>
              </div>

              <div style="text-align: center; margin: 26px 0;">
                <a href="${loginUrl}" target="_blank" style="background-color: #dc2626; color: #ffffff; padding: 12px 34px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block;">Access Admin Panel →</a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">Please change your password after logging in via the top profile menu.</p>
            </div>
            <div style="background-color: #0b0f19; padding: 18px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #94a3b8;">
              ORDERLY Mens Wear • Admin Security & Team Management
            </div>
          </div>
        </body>
      </html>
    `;

    const adminAlertHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin: 0; padding: 24px 12px; background-color: #0b0f19; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 26px; border: 1px solid #cbd5e1;">
            <div style="font-size: 12px; font-weight: 800; color: #dc2626; text-transform: uppercase; margin-bottom: 6px;">SECURITY AUDIT ALERT</div>
            <h3 style="color: #0f172a; margin: 0 0 12px 0;">New Team Member Created</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${roleName}</p>
            <p><strong>Created By:</strong> ${creatorName}</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 18px;">Generated automatically by ORDERLY Security.</p>
          </div>
        </body>
      </html>
    `;

    const mails = [
      {
        to: email,
        from: process.env.EMAIL_FROM || userAccount,
        subject: 'Welcome to ORDERLY Team | Your Admin Portal Credentials',
        html: userHtml
      }
    ];

    if (adminEmail && adminEmail !== email) {
      mails.push({
        to: adminEmail,
        from: process.env.EMAIL_FROM || userAccount,
        subject: `ORDERLY Security | New Team Member Created (${name} - ${roleName})`,
        html: adminAlertHtml
      });
    }

    await Promise.allSettled(mails.map(m => transporter.sendMail(m)));
    return { success: true };
  } catch (err) {
    console.error('Error sending admin creation email:', err.message);
    return { success: false, message: err.message };
  }
};
