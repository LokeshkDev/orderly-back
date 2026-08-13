import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return Boolean(user && pass && user.includes('@'));
};

export const buildOrderEmailPayload = ({
  orderNumber,
  customerName = 'Customer',
  customerEmail = '',
  adminEmail = '',
  status = 'pending',
  type = 'order_update',
  paymentStatus = 'pending',
  amount = 0
}) => {
  const normalizedOrderNumber = String(orderNumber || 'ORDER').trim();
  const normalizedStatus = String(status || 'pending').toUpperCase();
  const normalizedPaymentStatus = String(paymentStatus || 'pending').toUpperCase();
  const adminTarget = adminEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@orderly.com';
  const customerTarget = customerEmail || '';

  const typeLabel = {
    order_placed: 'Order Confirmed',
    payment_success: 'Payment Received',
    payment_failed: 'Payment Issue',
    status_update: 'Order Update',
    order_cancelled: 'Order Cancelled'
  }[type] || 'Order Update';

  const customerSubject = `ORDERLY | ${typeLabel} | #${normalizedOrderNumber}`;
  const adminSubject = `ORDERLY Admin | ${typeLabel} | #${normalizedOrderNumber}`;

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; color: #111827; max-width: 640px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px; color: #111827;">Hello ${customerName},</h2>
      <p style="font-size: 15px; line-height: 1.6;">Your order <strong>#${normalizedOrderNumber}</strong> has a new update.</p>
      <p style="font-size: 15px; line-height: 1.6;">Status: <strong>${normalizedStatus}</strong></p>
      <p style="font-size: 15px; line-height: 1.6;">Payment Status: <strong>${normalizedPaymentStatus}</strong></p>
      <p style="font-size: 15px; line-height: 1.6;">Total Amount: <strong>₹${Number(amount || 0).toLocaleString('en-IN')}</strong></p>
      <p style="font-size: 15px; line-height: 1.6;">Thanks for shopping with ORDERLY Menswear.</p>
      <p style="font-size: 14px; color: #374151; margin-top: 18px;">Regards,<br/>ORDERLY Team</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; color: #111827; max-width: 640px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px; color: #111827;">Order update for #${normalizedOrderNumber}</h2>
      <p style="font-size: 15px; line-height: 1.6;">Customer: <strong>${customerName}</strong></p>
      <p style="font-size: 15px; line-height: 1.6;">Status: <strong>${normalizedStatus}</strong></p>
      <p style="font-size: 15px; line-height: 1.6;">Payment Status: <strong>${normalizedPaymentStatus}</strong></p>
      <p style="font-size: 15px; line-height: 1.6;">Total Amount: <strong>₹${Number(amount || 0).toLocaleString('en-IN')}</strong></p>
      <p style="font-size: 14px; color: #374151; margin-top: 18px;">This is an automated update from the ORDERLY admin system.</p>
    </div>
  `;

  return {
    customer: {
      to: customerTarget,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      subject: customerSubject,
      html: customerHtml
    },
    admin: {
      to: adminTarget,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      subject: adminSubject,
      html: adminHtml
    }
  };
};

export const sendOrderEmail = async (details = {}) => {
  if (!isEmailConfigured()) {
    return { success: false, message: 'Email configuration is incomplete. Add EMAIL_USER and EMAIL_PASS in the env file.' };
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
    console.error('Order email failed:', error.message);
    return { success: false, message: error.message };
  }
};
