import { Resend } from 'resend';

export interface AppointmentEmailParams {
  to: string;
  customerName: string;
  businessName: string;
  appointmentTime: string; // ISO string
  serviceNames: string[];
  staffName: string | null;
  status: string;
  manageUrl: string;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export async function sendAppointmentConfirmationEmail(params: AppointmentEmailParams) {
  // Initialize inside the function so env vars are always read fresh (not at module load time)
  const resend = new Resend(process.env.RESEND_API_KEY);
  const EMAIL_FROM = process.env.EMAIL_FROM || 'Booking App <onboarding@resend.dev>';

  const {
    to,
    customerName,
    businessName,
    appointmentTime,
    serviceNames,
    staffName,
    manageUrl,
  } = params;

  const formattedTime = formatDateTime(appointmentTime);
  const servicesHtml = serviceNames.map(s => `<li style="margin: 4px 0;">${s}</li>`).join('');
  const servicesText = serviceNames.join(', ');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 520px; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background: #0f0f0f; padding: 28px 32px;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">${businessName}</p>
              <p style="margin: 6px 0 0; font-size: 13px; color: #9ca3af;">Appointment Confirmation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #111827;">Hi <strong>${customerName}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #374151; line-height: 1.6;">
                Your appointment is confirmed. Here are your details:
              </p>

              <!-- Details Card -->
              <table width="100%" style="background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #6b7280;">Date &amp; Time</p>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${formattedTime}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #6b7280;">Services</p>
                          <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: #111827;">${servicesHtml}</ul>
                        </td>
                      </tr>
                      ${staffName ? `
                      <tr>
                        <td style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
                          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #6b7280;">Provider</p>
                          <p style="margin: 0; font-size: 14px; color: #111827;">${staffName}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Manage Link -->
              <p style="margin: 0 0 16px; font-size: 14px; color: #374151;">
                Need to cancel or reschedule? Use the link below:
              </p>
              <a href="${manageUrl}"
                style="display: inline-block; background: #0f0f0f; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 24px; border-radius: 8px;">
                Manage Appointment
              </a>

              <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                <!-- TODO: Replace ?id= link with a signed email verification token before production -->
                If you did not make this booking, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${customerName},

Your appointment at ${businessName} is confirmed.

Date & Time: ${formattedTime}
Services: ${servicesText}
${staffName ? `Provider: ${staffName}` : ''}

Manage your appointment (cancel or reschedule):
${manageUrl}

If you did not make this booking, please ignore this email.
  `.trim();

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Your appointment is confirmed',
    html,
    text,
  });
}

export async function sendAppointmentReminderEmail(params: AppointmentEmailParams) {
  // Initialize inside the function so env vars are always read fresh
  const resend = new Resend(process.env.RESEND_API_KEY);
  const EMAIL_FROM = process.env.EMAIL_FROM || 'Booking App <onboarding@resend.dev>';

  const {
    to,
    customerName,
    businessName,
    appointmentTime,
    serviceNames,
    staffName,
    manageUrl,
  } = params;

  const formattedTime = formatDateTime(appointmentTime);
  const servicesHtml = serviceNames.map(s => `<li style="margin: 4px 0;">${s}</li>`).join('');
  const servicesText = serviceNames.join(', ');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 520px; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background: #0f0f0f; padding: 28px 32px;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">${businessName}</p>
              <p style="margin: 6px 0 0; font-size: 13px; color: #9ca3af;">Appointment Reminder</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #111827;">Hi <strong>${customerName}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #374151; line-height: 1.6;">
                This is a friendly reminder for your upcoming appointment. Here are the details:
              </p>

              <!-- Details Card -->
              <table width="100%" style="background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #6b7280;">Date &amp; Time</p>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${formattedTime}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #6b7280;">Services</p>
                          <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: #111827;">${servicesHtml}</ul>
                        </td>
                      </tr>
                      ${staffName ? `
                      <tr>
                        <td style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
                          <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #6b7280;">Provider</p>
                          <p style="margin: 0; font-size: 14px; color: #111827;">${staffName}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Manage Link -->
              <p style="margin: 0 0 16px; font-size: 14px; color: #374151;">
                Need to make a change? Manage your appointment below:
              </p>
              <a href="${manageUrl}"
                style="display: inline-block; background: #0f0f0f; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 24px; border-radius: 8px;">
                Manage Appointment
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${customerName},

This is a reminder for your upcoming appointment at ${businessName}.

Date & Time: ${formattedTime}
Services: ${servicesText}
${staffName ? `Provider: ${staffName}` : ''}

Manage your appointment:
${manageUrl}
  `.trim();

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Appointment Reminder',
    html,
    text,
  });
}
