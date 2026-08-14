import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { buildCourierTrackingUrl } from './deliveryCalculator.js';

dotenv.config();

export const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return Boolean(user && pass && user.includes('@'));
};

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

/**
 * Replace placeholders like {{orderNumber}}, {{customerName}}, etc.
 */
export const interpolateTemplate = (template = '', variables = {}) => {
  if (!template || typeof template !== 'string') return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
  });
};

/**
 * Generate formatted HTML items table for emails
 */
const renderItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p style="color: #6b7280; font-size: 14px;">Apparel item(s)</p>';
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
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; font-size: 14px; color: #111827;">
          <strong style="color: #0f172a;">${name}</strong>
          ${variant ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${variant}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; color: #374151; text-align: center;">${qty}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #111827; text-align: right; font-weight: 600;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 16px;">
      <thead>
        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
          <th style="padding: 10px 8px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Product</th>
          <th style="padding: 10px 8px; font-size: 12px; font-weight: 700; color: #475569; text-align: center; text-transform: uppercase;">Qty</th>
          <th style="padding: 10px 8px; font-size: 12px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase;">Total</th>
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
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 14px; line-height: 1.5; color: #374151;">
      <strong style="color: #111827; display: block; margin-bottom: 4px;">${fullName}</strong>
      ${line ? `<div>${line}</div>` : ''}
      <div>${[city, state].filter(Boolean).join(', ')}${pincode ? ` - ${pincode}` : ''}</div>
      ${phone ? `<div style="color: #6b7280; font-size: 13px; margin-top: 4px;">Phone: ${phone}</div>` : ''}
    </div>
  `;
};

export const buildOrderEmailPayload = (details = {}) => {
  const {
    orderNumber = 'ORDER',
    customerName = 'Customer',
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
    emailSettings = null,
    courierSettings = null
  } = details;

  const normalizedOrderNumber = String(orderNumber || 'ORDER').trim();
  const normalizedStatus = String(status || 'pending').toUpperCase();
  const adminTarget = adminEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com';
  const customerTarget = customerEmail || '';
  const orderTotal = Number(amount || subtotal + deliveryCharge - discount || 0);

  const effectiveTrackingUrl = trackingUrl || buildCourierTrackingUrl(courierName, trackingNumber, courierSettings);
  const formattedOrderDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
  const formattedShippedDate = shippedDate || new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
  const formattedDeliveredDate = deliveredDate || new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });

  const productsText = Array.isArray(items) && items.length > 0
    ? items.map(i => `${i.name || i.product_name || 'Item'} (x${i.quantity || 1})`).join(', ')
    : 'Menswear items';

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
    courierName: courierName || 'Express Courier',
    trackingNumber: trackingNumber || 'N/A',
    trackingUrl: effectiveTrackingUrl,
    deliveryDate: formattedDeliveredDate,
    shippingAddress: addressString
  };

  // Base email wrapper styling
  const emailHeader = `
    <div style="background-color: #0f172a; padding: 24px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 800; font-family: 'Helvetica Neue', Arial, sans-serif;">ORDERLY</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">Luxury Menswear Atelier</p>
    </div>
  `;

  const emailFooter = `
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; border-radius: 0 0 12px 12px; font-size: 13px; color: #64748b;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">ORDERLY Mens Wear</p>
      <p style="margin: 0 0 8px 0;">Valasaravakkam & Kundrathur, Chennai, India</p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">For support, reply directly to this email or call our concierge.</p>
    </div>
  `;

  let customerSubject = '';
  let customerContent = '';
  let adminSubject = '';

  // 1. ORDER PLACED (NEW ORDER CONFIRMATION)
  if (type === 'order_placed') {
    const config = emailSettings?.new_order;
    customerSubject = config?.subject
      ? interpolateTemplate(config.subject, templateVariables)
      : `ORDERLY | Order Confirmed | #${normalizedOrderNumber}`;

    adminSubject = `ORDERLY Admin | New Order Received | #${normalizedOrderNumber} (${formatCurrency(orderTotal)})`;

    customerContent = `
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #059669; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 12px; letter-spacing: 0.5px;">
            ORDER CONFIRMED & IN FULFILLMENT
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px;">Thank you for your order, ${customerName}!</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">We have received your order <strong style="color: #0f172a;">#${normalizedOrderNumber}</strong> placed on ${formattedOrderDate}.</p>
        </div>

        ${config?.custom_message ? `<div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #334155;">${interpolateTemplate(config.custom_message, templateVariables)}</div>` : ''}

        <h3 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 24px 0 12px 0;">Order Summary</h3>
        ${renderItemsHtml(items)}

        <!-- Pricing Breakdown Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; color: #374151;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Subtotal</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #111827;">${formatCurrency(subtotal || orderTotal)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="padding: 6px 0; color: #059669;">Coupon Discount</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">-${formatCurrency(discount)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Delivery Charge</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: ${deliveryCharge === 0 ? '#059669' : '#111827'};">
              ${deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
            </td>
          </tr>
          <tr style="border-top: 2px solid #e2e8f0; font-size: 16px;">
            <td style="padding: 12px 0 6px 0; font-weight: 800; color: #0f172a;">Grand Total</td>
            <td style="padding: 12px 0 6px 0; text-align: right; font-weight: 800; color: #c1121f;">${formatCurrency(orderTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Payment Method</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #475569; font-size: 13px;">${String(paymentMethod).toUpperCase()} (${String(paymentStatus).toUpperCase()})</td>
          </tr>
        </table>

        <h3 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 28px 0 12px 0;">Delivery Address</h3>
        ${renderAddressHtml(shippingAddress)}
      </div>
    `;
  }

  // 2. ORDER SHIPPED EMAIL
  else if (type === 'order_shipped' || (type === 'status_update' && status?.toLowerCase() === 'shipped')) {
    const config = emailSettings?.order_shipped;
    customerSubject = config?.subject
      ? interpolateTemplate(config.subject, templateVariables)
      : `ORDERLY | Your Order #${normalizedOrderNumber} Has Been Shipped!`;

    adminSubject = `ORDERLY Admin | Order Shipped | #${normalizedOrderNumber}`;

    customerContent = `
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #eff6ff; color: #2563eb; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 12px; letter-spacing: 0.5px;">
            PARCEL ON THE WAY
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px;">Your order has been shipped!</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">Great news, ${customerName}! Your parcel for order <strong style="color: #0f172a;">#${normalizedOrderNumber}</strong> is on its way to you.</p>
        </div>

        ${config?.custom_message ? `<div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #334155;">${interpolateTemplate(config.custom_message, templateVariables)}</div>` : ''}

        <!-- Shipping & Tracking Details Card -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
          <div style="font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px;">Fulfillment Partner</div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">${courierName || 'Express Domestic Courier'}</div>
          
          <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Tracking Number / AWB</div>
          <div style="font-size: 16px; font-family: monospace; font-weight: 700; color: #1e293b; background-color: #ffffff; display: inline-block; padding: 6px 16px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 18px;">
            ${trackingNumber || 'Available shortly'}
          </div>

          ${effectiveTrackingUrl ? `
          <div style="margin-top: 12px;">
            <a href="${effectiveTrackingUrl}" target="_blank" style="background-color: #c1121f; color: #ffffff; display: inline-block; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(193, 18, 31, 0.2);">
              Track Shipment →
            </a>
          </div>
          ` : ''}
        </div>

        <h3 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 24px 0 12px 0;">Shipment Details</h3>
        ${renderItemsHtml(items)}

        <div style="margin-top: 20px;">
          <strong style="font-size: 14px; color: #0f172a;">Shipping To:</strong>
          ${renderAddressHtml(shippingAddress)}
        </div>
      </div>
    `;
  }

  // 3. ORDER DELIVERED EMAIL
  else if (type === 'order_delivered' || (type === 'status_update' && status?.toLowerCase() === 'delivered')) {
    const config = emailSettings?.order_delivered;
    customerSubject = config?.subject
      ? interpolateTemplate(config.subject, templateVariables)
      : `ORDERLY | Your Order #${normalizedOrderNumber} Has Been Delivered!`;

    adminSubject = `ORDERLY Admin | Order Delivered | #${normalizedOrderNumber}`;

    customerContent = `
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #ecfdf5; color: #059669; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 12px; letter-spacing: 0.5px;">
            DELIVERED SUCCESSFULLY
          </div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 22px;">Your parcel has arrived!</h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.5;">Hello ${customerName}, your order <strong style="color: #0f172a;">#${normalizedOrderNumber}</strong> was delivered on ${formattedDeliveredDate}.</p>
        </div>

        ${config?.custom_message ? `<div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #334155;">${interpolateTemplate(config.custom_message, templateVariables)}</div>` : ''}

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #334155; font-size: 14px;">We hope you love your ORDERLY menswear. If you need any assistance or size adjustments, our 15-day doorstep exchange concierge is here to help.</p>
        </div>

        <h3 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin: 24px 0 12px 0;">Items Delivered</h3>
        ${renderItemsHtml(items)}
      </div>
    `;
  }

  // DEFAULT / GENERIC STATUS UPDATE
  else {
    customerSubject = `ORDERLY | Order Update | #${normalizedOrderNumber}`;
    adminSubject = `ORDERLY Admin | Order Update | #${normalizedOrderNumber}`;

    customerContent = `
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px;">Hello ${customerName},</h2>
        <p style="font-size: 15px; color: #374151; line-height: 1.6;">Your order <strong>#${normalizedOrderNumber}</strong> status has been updated to <strong>${normalizedStatus}</strong>.</p>
        <p style="font-size: 15px; color: #374151; line-height: 1.6;">Total: <strong>${formatCurrency(orderTotal)}</strong></p>
        ${renderItemsHtml(items)}
      </div>
    `;
  }

  const customerHtml = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
      <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
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
      <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background-color: #1e293b; padding: 18px 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px;">ORDERLY Admin Notification</h2>
          </div>
          <div style="padding: 24px; font-size: 14px; color: #1e293b; line-height: 1.6;">
            <p><strong>Event:</strong> ${type} (${normalizedStatus})</p>
            <p><strong>Order #:</strong> ${normalizedOrderNumber}</p>
            <p><strong>Customer:</strong> ${customerName} (${customerEmail || 'No Email'})</p>
            <p><strong>Total:</strong> ${formatCurrency(orderTotal)}</p>
            ${courierName ? `<p><strong>Courier:</strong> ${courierName} | <strong>Tracking:</strong> ${trackingNumber}</p>` : ''}
            <div style="margin-top: 16px;">
              ${renderItemsHtml(items)}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    customer: {
      to: customerTarget,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'concierge@orderlymenswear.com',
      subject: customerSubject,
      html: customerHtml
    },
    admin: {
      to: adminTarget,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'concierge@orderlymenswear.com',
      subject: adminSubject,
      html: adminHtml
    }
  };
};

export const sendOrderEmail = async (details = {}) => {
  if (!isEmailConfigured()) {
    console.info(`[EmailService] Simulated order email (${details.type || 'update'}) for #${details.orderNumber}`);
    return { success: false, simulated: true, message: 'Email credentials not configured in .env' };
  }

  try {
    const payload = buildOrderEmailPayload(details);
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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
