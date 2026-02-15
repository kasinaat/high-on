import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail({
  to,
  outletName,
  inviterName,
  token,
}: {
  to: string;
  outletName: string;
  inviterName: string;
  token: string;
}) {
  const inviteUrl = `${process.env.BETTER_AUTH_URL}/accept-invite?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "High On <noreply@yourdomain.com>",
      to: [to],
      subject: `You're invited to manage ${outletName}`,
      html: getInvitationEmailHtml({ outletName, inviterName, inviteUrl }),
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

function getInvitationEmailHtml({
  outletName,
  inviterName,
  inviteUrl,
}: {
  outletName: string;
  inviterName: string;
  inviteUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Outlet Admin Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FDF8F4;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FDF8F4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E6658B 0%, #F9D161 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🍦 High On</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Ice Cream Outlet Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #441520; font-size: 24px;">You've Been Invited!</h2>
              
              <p style="margin: 0 0 16px 0; color: #553343; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to manage their ice cream outlet:
              </p>
              
              <div style="background-color: #FDF8F4; border-left: 4px solid #E6658B; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #441520; font-size: 18px; font-weight: 600;">🏪 ${outletName}</p>
              </div>
              
              <p style="margin: 24px 0; color: #553343; font-size: 16px; line-height: 1.6;">
                As an outlet admin, you'll be able to:
              </p>
              
              <ul style="margin: 16px 0; padding-left: 20px; color: #553343; font-size: 15px; line-height: 1.8;">
                <li>Manage inventory and products</li>
                <li>Track sales and orders</li>
                <li>Monitor outlet performance</li>
                <li>Collaborate with the team</li>
              </ul>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #E6658B; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(230, 101, 139, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #7B5F6D; font-size: 14px; line-height: 1.6;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #FDF8F4; padding: 24px 30px; text-align: center; border-top: 1px solid #F3E6E0;">
              <p style="margin: 0; color: #7B5F6D; font-size: 13px;">
                © 2026 High On. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; color: #7B5F6D; font-size: 13px;">
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
