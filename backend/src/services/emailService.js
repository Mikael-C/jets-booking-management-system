const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }
  return transporter;
};

const FROM = process.env.EMAIL_FROM || 'Orbelo Charter <noreply@orbelo.com>';

const baseHtmlTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header h1 { color: #c9a84c; margin: 0; font-size: 24px; letter-spacing: 2px; }
    .header p { color: #94a3b8; margin: 5px 0 0; font-size: 12px; letter-spacing: 1px; }
    .body { padding: 30px; }
    .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; }
    .btn { display: inline-block; padding: 12px 28px; background: #c9a84c; color: #1a1a2e; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .detail-label { color: #64748b; font-size: 13px; }
    .detail-value { font-weight: 600; font-size: 13px; }
    .amount { color: #c9a84c; font-size: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ORBELO</h1>
      <p>PRIVATE JET CHARTER</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>Orbelo Charter | Private Jet Booking Management</p>
      <p>This email was sent by the Orbelo system. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn(`Email not sent (SMTP not configured): ${subject} -> ${to}`);
      return { success: false, message: 'SMTP not configured' };
    }

    const info = await getTransporter().sendMail({
      from: FROM,
      to,
      subject,
      html,
      text,
      attachments,
    });

    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email send failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n, cur = 'EUR') => `${cur} ${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const legCode = (a) => (a && (a.icao || a.code)) || '';
const routeOf = (legs = []) => {
  const live = legs.filter((l) => !l.isCancelled);
  if (!live.length) return '';
  return [legCode(live[0].origin), ...live.map((l) => legCode(l.destination))].filter(Boolean).join(' → ');
};

/** The links block printed in agreement emails (all clickable). */
const linksBlock = (links) =>
  links
    ? `
    <div style="margin-top:18px;padding:12px 14px;border:1px solid #C9A24A;border-radius:8px;background:#FBF6EA;">
      <div><strong>Sign online:</strong> <a href="${esc(links.sign)}">${esc(links.signLabel)}</a></div>
      <div style="font-size:13px;margin-top:6px;">
        Charter agreement (C2): <a href="${esc(links.form)}">orbaero.com/legal/charter-agreement</a><br>
        C1 Brokerage Terms: <a href="${esc(links.terms)}">/legal/terms</a> ·
        C3 Cancellation Policy: <a href="${esc(links.cancellation)}">/legal/cancellation</a> ·
        C5 Privacy Notice: <a href="${esc(links.privacy)}">/legal/privacy</a>
      </div>
    </div>`
    : '';

const sendQuoteEmail = async (to, bookingData, pdfBuffer = null, links = null) => {
  const { client, legs, pricing, aircraft } = bookingData;
  const ref = (links && links.quote) || bookingData.quoteId || bookingData.tripNumber || '';
  const leg = (legs || [])[0] || {};
  const html = baseHtmlTemplate(`
    <h2>Your Charter Quotation</h2>
    <p>Dear ${esc(bookingData.authorisedOwnerName || client?.fullName || 'Valued Client')},</p>
    <p>Please find your charter quotation attached.</p>
    <div class="detail-row"><span class="detail-label">Quote</span><span class="detail-value">${esc(ref)}</span></div>
    <div class="detail-row"><span class="detail-label">Route</span><span class="detail-value">${esc(routeOf(legs || []))}</span></div>
    <div class="detail-row"><span class="detail-label">First departure</span><span class="detail-value">${esc(leg.flightDate || '')} ${esc(leg.departureTimeLocal || '')}</span></div>
    <div class="detail-row"><span class="detail-label">Aircraft</span><span class="detail-value">${esc(aircraft?.name || '')}</span></div>
    <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value amount">${esc(money(pricing?.totalFlightPrice, pricing?.currency || 'EUR'))}</span></div>
    <p style="margin-top:20px;">To book, sign the charter agreement online. The booking is confirmed as soon as it is signed.</p>
    ${linksBlock(links)}
    <p style="margin-top:18px;">Best regards,<br>The Orbelo Charter Team</p>
  `);

  const attachments = pdfBuffer ? [{
    filename: `${ref || 'Quote'}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }] : [];

  return sendEmail({ to, subject: `Charter quotation ${ref}`, html, attachments });
};

/** One-time code for the online signature. */
const sendSignCodeEmail = async (to, { name, number, code }) => {
  const html = baseHtmlTemplate(`
    <h2>Your signing code</h2>
    <p>Dear ${esc(name || 'client')},</p>
    <p>Use this code to sign charter agreement <strong>${esc(number)}</strong>:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:bold;margin:16px 0;">${esc(code)}</p>
    <p>The code is valid for 15 minutes. If you did not ask for it, you can ignore this email.</p>
  `);
  return sendEmail({ to, subject: `Signing code for ${number}`, html, text: `Your code to sign ${number}: ${code} (valid 15 minutes)` });
};

/** The countersigned agreement and the signature certificate, after the client signs. */
const sendSignedAgreementEmail = async (to, { name, number, tripNumber, links, attachments = [], cc }) => {
  const html = baseHtmlTemplate(`
    <h2>Charter agreement signed</h2>
    <p>Dear ${esc(name || 'client')},</p>
    <p>Thank you. Charter agreement <strong>${esc(number)}</strong> is signed and countersigned, and your booking <strong>${esc(tripNumber)}</strong> is confirmed.</p>
    <p>The countersigned agreement and the signature certificate are attached. Your first invoice follows separately with its due date.</p>
    ${linksBlock(links)}
    <p style="margin-top:18px;">Best regards,<br>The Orbelo Charter Team</p>
  `);
  return sendEmail({ to: cc ? [to, cc].filter(Boolean).join(',') : to, subject: `Charter agreement ${number} signed · booking ${tripNumber}`, html, attachments });
};

const sendBookingConfirmationEmail = async (to, bookingData) => {
  const { tripNumber, client, legs, aircraft } = bookingData;
  const leg = legs?.[0] || {};
  const html = baseHtmlTemplate(`
    <h2>✅ Booking Confirmed</h2>
    <p>Dear ${client?.fullName || 'Valued Client'},</p>
    <p>Your private jet charter has been confirmed. Here are your trip details:</p>
    <div class="detail-row"><span class="detail-label">Booking Reference</span><span class="detail-value">${tripNumber}</span></div>
    <div class="detail-row"><span class="detail-label">Route</span><span class="detail-value">${leg.fromIcao || ''} → ${leg.toIcao || ''}</span></div>
    <div class="detail-row"><span class="detail-label">Departure</span><span class="detail-value">${leg.departureDate || ''} ${leg.departureTime || ''}</span></div>
    <div class="detail-row"><span class="detail-label">Aircraft</span><span class="detail-value">${aircraft?.name || ''} ${aircraft?.registration ? '(' + aircraft.registration + ')' : ''}</span></div>
    <p style="margin-top:20px;">Your flight crew will be in touch 24 hours before departure. Safe travels!</p>
    <p>Best regards,<br>The Orbelo Charter Team</p>
  `);
  return sendEmail({ to, subject: `Flight Confirmed - ${tripNumber}`, html });
};

const sendInvoiceEmail = async (to, bookingData, pdfBuffer = null) => {
  const { tripNumber, invoiceNumber, pricing, client } = bookingData;
  const html = baseHtmlTemplate(`
    <h2>Invoice</h2>
    <p>Dear ${client?.fullName || 'Valued Client'},</p>
    <p>Please find attached your invoice for charter services.</p>
    <div class="detail-row"><span class="detail-label">Invoice Number</span><span class="detail-value">${invoiceNumber || tripNumber}</span></div>
    <div class="detail-row"><span class="detail-label">Trip Reference</span><span class="detail-value">${tripNumber}</span></div>
    <div class="detail-row"><span class="detail-label">Amount Due</span><span class="detail-value amount">${pricing?.currency || 'USD'} ${(pricing?.grandTotal || 0).toLocaleString()}</span></div>
    <p>Please arrange payment as per the agreed terms. For payment details, refer to the attached invoice.</p>
    <p>Best regards,<br>The Orbelo Finance Team</p>
  `);
  const attachments = pdfBuffer ? [{
    filename: `Orbelo-Invoice-${invoiceNumber || tripNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }] : [];
  return sendEmail({ to, subject: `Orbelo Invoice - ${invoiceNumber || tripNumber}`, html, attachments });
};

const sendPaymentReceivedEmail = async (to, paymentData) => {
  const { amount, currency, tripNumber, paymentDate, method } = paymentData;
  const html = baseHtmlTemplate(`
    <h2>✅ Payment Received</h2>
    <p>Thank you! We have successfully received your payment.</p>
    <div class="detail-row"><span class="detail-label">Trip Reference</span><span class="detail-value">${tripNumber}</span></div>
    <div class="detail-row"><span class="detail-label">Amount Received</span><span class="detail-value amount">${currency || 'USD'} ${(amount || 0).toLocaleString()}</span></div>
    <div class="detail-row"><span class="detail-label">Payment Date</span><span class="detail-value">${paymentDate || new Date().toDateString()}</span></div>
    <div class="detail-row"><span class="detail-label">Payment Method</span><span class="detail-value">${method || 'Bank Transfer'}</span></div>
    <p>Your booking is now confirmed. We look forward to serving you.</p>
    <p>Best regards,<br>The Orbelo Finance Team</p>
  `);
  return sendEmail({ to, subject: `Payment Received - ${tripNumber}`, html });
};

const sendStatusUpdateEmail = async (to, bookingData, oldStatus, newStatus) => {
  const { tripNumber, client } = bookingData;
  const statusLabels = {
    submitted: 'Submitted', in_sourcing: 'In Sourcing', quoted: 'Quoted',
    accepted: 'Accepted', paid: 'Paid', confirmed: 'Confirmed',
    dispatched: 'Dispatched', in_flight: 'In Flight', flown: 'Flown',
    completed: 'Completed', cancelled: 'Cancelled',
  };
  const html = baseHtmlTemplate(`
    <h2>Booking Status Update</h2>
    <p>Dear ${client?.fullName || 'Valued Client'},</p>
    <p>Your booking status has been updated:</p>
    <div class="detail-row"><span class="detail-label">Trip Reference</span><span class="detail-value">${tripNumber}</span></div>
    <div class="detail-row"><span class="detail-label">Previous Status</span><span class="detail-value">${statusLabels[oldStatus] || oldStatus}</span></div>
    <div class="detail-row"><span class="detail-label">New Status</span><span class="detail-value" style="color:#c9a84c">${statusLabels[newStatus] || newStatus}</span></div>
    <p>If you have any questions, please contact your Orbelo representative.</p>
    <p>Best regards,<br>The Orbelo Team</p>
  `);
  return sendEmail({ to, subject: `Status Update: ${tripNumber} - ${statusLabels[newStatus] || newStatus}`, html });
};

const sendAgentNotificationEmail = async (to, requestData) => {
  const { requestNumber, title, status, agentName } = requestData;
  const html = baseHtmlTemplate(`
    <h2>Request Update</h2>
    <p>Dear ${agentName},</p>
    <p>Your request has been updated:</p>
    <div class="detail-row"><span class="detail-label">Request Number</span><span class="detail-value">${requestNumber}</span></div>
    <div class="detail-row"><span class="detail-label">Title</span><span class="detail-value">${title}</span></div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#c9a84c">${status}</span></div>
    <p>Log in to the Orbelo portal to view the latest updates.</p>
    <p>Best regards,<br>The Orbelo Team</p>
  `);
  return sendEmail({ to, subject: `Request Update - ${requestNumber}`, html });
};

module.exports = {
  sendEmail,
  sendQuoteEmail,
  sendSignCodeEmail,
  sendSignedAgreementEmail,
  sendBookingConfirmationEmail,
  sendInvoiceEmail,
  sendPaymentReceivedEmail,
  sendStatusUpdateEmail,
  sendAgentNotificationEmail,
};
