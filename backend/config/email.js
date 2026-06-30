const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'noreply@camping.dz';

const sendVerificationEmail = async (to, code) => {
  if (!resend) {
    console.log(`[DEV] Verification code for ${to}: ${code}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your account',
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`,
  });
};

const sendNewBookingEmail = async (ownerEmail, ownerName, camperName, siteName, checkIn, checkOut, guests, total) => {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `New booking for ${siteName}`,
    html: `
      <h2>New Booking!</h2>
      <p>Hi <strong>${ownerName}</strong>,</p>
      <p><strong>${camperName}</strong> just booked your site <strong>${siteName}</strong>.</p>
      <ul>
        <li>Check-in: ${checkIn}</li>
        <li>Check-out: ${checkOut}</li>
        <li>Guests: ${guests}</li>
        <li>Total: DZD ${total}</li>
      </ul>
    `,
  });
};

module.exports = { sendVerificationEmail, sendNewBookingEmail };
