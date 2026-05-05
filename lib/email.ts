import { Resend } from "resend";

const FROM = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const SITE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type EmailPayload = Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0];

async function sendEmail(payload: EmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const response = await getResend().emails.send(payload);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response;
}

function baseTemplate(title: string, body: string): string {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${title}</title>
        </head>
        <body style="margin:0;padding:0;background:#0a0e17;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e17;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">

                            <!-- Header -->
                            <tr>
                                <td style="background:#111827;padding:28px 36px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                                    <span style="font-size:22px;font-weight:800;color:#f97316;letter-spacing:-0.5px;">Saha</span><span style="font-size:22px;font-weight:800;color:#e2e8f0;letter-spacing:-0.5px;">Tour</span>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:32px 36px;">
                                    ${body}
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding:20px 36px 28px;border-top:1px solid rgba(255,255,255,0.06);">
                                    <p style="margin:0;font-size:12px;color:#475569;">
                                        You received this email because you have an account on
                                        <a href="${SITE}" style="color:#f97316;text-decoration:none;">SahaTour</a>.
                                        If you did not request this, you can safely ignore it.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`;
}

// ── Verification code ──
export async function sendVerificationEmail(email: string, code: string) {
    const body = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">Verify your email</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
            Welcome to SahaTOur! Enter the code below to activate your account.
            It expires in <strong style="color:#e2e8f0;">15 minutes</strong>.
        </p>
        <div style="background:#0a0e17;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#f97316;">${code}</span>
        </div>
        <p style="margin:0;font-size:13px;color:#475569;">
            If you didn't create an account, you can safely ignore this email.
        </p>`;

    return sendEmail({
        from: FROM,
        to: email,
        subject: `${code} is your SahaTour verification code`,
        html: baseTemplate("Verify your email", body),
    });
}

// ── Password changed ──
export async function sendPasswordChangedEmail(email: string, username: string) {
    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">Password changed</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6;">
        Hi <strong style="color:#e2e8f0;">${username}</strong>, your SahaTour password was just changed.
        If this was you, no action is needed.
      </p>
      <div style="background:#0a0e17;border:1px solid rgba(255,165,0,0.15);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#fbbf24;">
          ⚠️ If you did not make this change, please contact us immediately and secure your account.
        </p>
      </div>
      <a href="${SITE}/auth/login" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
        Go to Login
      </a>`;

    return sendEmail({
        from: FROM,
        to: email,
        subject: "Your SahaTour password was changed",
        html: baseTemplate("Password changed", body),
    });
}

// ── New booking (to owner) ──
export async function sendNewBookingEmail(
    ownerEmail: string,
    ownerUsername: string,
    camperUsername: string,
    campsiteName: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    totalPrice: number,
) {
    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">New booking request</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
        Hi <strong style="color:#e2e8f0;">${ownerUsername}</strong>, 
        <strong style="color:#f97316;">${camperUsername}</strong> has requested a booking at your campsite.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e17;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:28px;">
        <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Campsite</span><br/>
          <span style="font-size:14px;color:#e2e8f0;font-weight:600;">${campsiteName}</span>
        </td></tr>
        <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Dates</span><br/>
          <span style="font-size:14px;color:#e2e8f0;">${checkIn} → ${checkOut}</span>
        </td></tr>
        <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Guests</span><br/>
          <span style="font-size:14px;color:#e2e8f0;">${guests}</span>
        </td></tr>
        <tr><td style="padding:14px 20px;">
          <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Total</span><br/>
          <span style="font-size:14px;color:#f97316;font-weight:700;">${totalPrice.toLocaleString()} DZD</span>
        </td></tr>
      </table>
      <a href="${SITE}/dashboard" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
        Manage in Dashboard
      </a>`;

    return sendEmail({
        from: FROM,
        to: ownerEmail,
        subject: `New booking request for ${campsiteName}`,
        html: baseTemplate("New booking request", body),
    });
}

// ── Booking status update (to camper) ──
export async function sendBookingStatusEmail(
    camperEmail: string,
    camperUsername: string,
    campsiteName: string,
    newStatus: "confirmed" | "cancelled" | "completed",
    checkIn: string,
    checkOut: string,
) {
    const statusConfig = {
        confirmed: {
            emoji: "✅",
            label: "Confirmed",
            color: "#4ade80",
            message: "Great news! Your booking has been confirmed by the campsite owner. Get ready for your adventure.",
        },
        cancelled: {
            emoji: "❌",
            label: "Cancelled",
            color: "#f87171",
            message: "Unfortunately your booking has been cancelled. You can browse other campsites and book again.",
        },
        completed: {
            emoji: "🏕️",
            label: "Completed",
            color: "#94a3b8",
            message: "Your stay is now marked as completed. We hope you had an amazing experience!",
        },
    };

    const cfg = statusConfig[newStatus];

    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">
        ${cfg.emoji} Booking ${cfg.label}
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
        Hi <strong style="color:#e2e8f0;">${camperUsername}</strong>, ${cfg.message}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e17;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:28px;">
        <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Campsite</span><br/>
          <span style="font-size:14px;color:#e2e8f0;font-weight:600;">${campsiteName}</span>
        </td></tr>
        <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Dates</span><br/>
          <span style="font-size:14px;color:#e2e8f0;">${checkIn} → ${checkOut}</span>
        </td></tr>
        <tr><td style="padding:14px 20px;">
          <span style="font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Status</span><br/>
          <span style="font-size:14px;font-weight:700;color:${cfg.color};">${cfg.label}</span>
        </td></tr>
      </table>
      <a href="${SITE}/trips" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
        View My Trips
      </a>`;

    return sendEmail({
        from: FROM,
        to: camperEmail,
        subject: `Your booking at ${campsiteName} is ${cfg.label}`,
        html: baseTemplate(`Booking ${cfg.label}`, body),
    });
}

// ── Campsite approved (to owner) ──
export async function sendCampsiteApprovedEmail(
    ownerEmail: string,
    ownerUsername: string,
    campsiteName: string,
    campsiteId: string,
) {
    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">🎉 Campsite approved!</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
        Hi <strong style="color:#e2e8f0;">${ownerUsername}</strong>, your campsite 
        <strong style="color:#f97316;">${campsiteName}</strong> has been approved by our team 
        and is now live on the explore page.
      </p>
      <a href="${SITE}/explore/${campsiteId}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
        View Campsite
      </a>`;

    return sendEmail({
        from: FROM,
        to: ownerEmail,
        subject: `${campsiteName} is now live on SahaTour`,
        html: baseTemplate("Campsite approved", body),
    });
}

// ── Campsite rejected (to owner) ──
export async function sendCampsiteRejectedEmail(
    ownerEmail: string,
    ownerUsername: string,
    campsiteName: string,
) {
    const body = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">Campsite not approved</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
        Hi <strong style="color:#e2e8f0;">${ownerUsername}</strong>, unfortunately your campsite 
        <strong style="color:#f97316;">${campsiteName}</strong> was not approved at this time.
        Please review our guidelines, update your listing, and resubmit for approval.
      </p>
      <a href="${SITE}/dashboard" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
        Go to Dashboard
      </a>`;

    return sendEmail({
        from: FROM,
        to: ownerEmail,
        subject: `Update required for ${campsiteName} — SahaTour`,
        html: baseTemplate("Campsite not approved", body),
    });
}
