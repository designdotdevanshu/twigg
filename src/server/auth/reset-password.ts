import type { User } from "better-auth";

export const getResetPasswordEmailTemplate = (
  user: User,
  url: string,
): string => {
  const currentTime = new Date()
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  return `
  <div
    style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: hsl(0 0% 100%); color: hsl(240 10% 3.9%); padding: 24px; border-radius: 8px; max-width: 480px; margin: 0 auto; border: 1px solid hsl(240 5.9% 90%); box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid hsl(240 5.9% 90%)">
      <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: hsl(240 5.9% 10%); letter-spacing: -0.025em">Twigg</h1>
      <p style="margin: 4px 0 0; font-size: 14px; color: hsl(240 3.8% 46.1%)">Expense Tracking Made Simple</p>
    </div>

    <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px; color: hsl(240 5.9% 10%)">Reset Your Password</h2>

    <p style="margin: 0 0 16px; color: hsl(240 10% 3.9%); line-height: 1.5">Hello ${user.name ?? user.email},</p>

    <p style="margin: 0 0 20px; color: hsl(240 3.8% 46.1%); line-height: 1.6">We received a request to reset your password for your Twigg account. Click the button below to create a new password and get back to tracking your expenses.</p>

    <div style="text-align: center; margin: 24px 0">
      <a
        href="${url}"
        style="display: inline-block; padding: 14px 28px; font-weight: 600; color: hsl(0 0% 98%); background-color: hsl(240 5.9% 10%); border-radius: 8px; text-decoration: none; border: 1px solid hsl(240 5.9% 10%); font-size: 16px">
        Reset Your Password
      </a>
    </div>

    <div style="background-color: hsl(240 4.8% 95.9%); padding: 16px; border-radius: 6px; margin: 20px 0">
      <p style="margin: 0 0 8px; font-size: 14px; color: hsl(240 5.9% 10%); font-weight: 500">Button not working?</p>
      <p style="margin: 0; font-size: 13px; color: hsl(240 3.8% 46.1%); word-break: break-all; line-height: 1.4">
        Copy and paste this link into your browser: <br />
        <span style="color: hsl(240 5.9% 10%); font-family: monospace; background-color: hsl(240 4.8% 95.9%); padding: 2px 4px; border-radius: 3px">${url}</span>
      </p>
    </div>

    <div style="border-top: 1px solid hsl(240 5.9% 90%); padding-top: 20px; margin-top: 24px">
      <div style="background-color: hsl(43 74% 66% / 0.1); border: 1px solid hsl(43 74% 66% / 0.3); border-radius: 6px; padding: 16px; margin-bottom: 16px">
        <p style="margin: 0 0 8px; font-size: 14px; color: hsl(240 5.9% 10%); font-weight: 600">⚠️ Important Security Information</p>
        <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: hsl(240 3.8% 46.1%); line-height: 1.5">
          <li>This reset link expires in <strong>1 hour</strong></li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Never share your password or reset links with anyone</li>
          <li>Suspicious activity? <a href="https://twigg.vercel.app/support" style="color: hsl(240 5.9% 10%); text-decoration: underline">Report it here</a></li>
        </ul>
      </div>
    </div>

    <div style="margin: 20px 0; padding: 12px; background-color: hsl(240 4.8% 95.9%); border-radius: 6px">
      <p style="margin: 0; font-size: 12px; color: hsl(240 3.8% 46.1%)">
        <strong>Request Details:</strong><br />
        Time: ${currentTime} UTC<br />
        If this wasn't you, <a href="https://twigg.vercel.app/support" style="color: hsl(240 5.9% 10%)">contact our support team</a> immediately.
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid hsl(240 5.9% 90%)">
      <p style="margin: 0 0 8px; font-size: 12px; color: hsl(240 3.8% 46.1%)">
        This email was sent by <strong>Twigg</strong><br />
        <a href="https://twigg.vercel.app" style="color: hsl(240 5.9% 10%); text-decoration: none">twigg.vercel.app</a>
      </p>
      <p style="margin: 0; font-size: 11px; color: hsl(240 3.8% 46.1%)">Questions? Visit our <a href="https://twigg.vercel.app/support" style="color: hsl(240 5.9% 10%)">support center</a></p>
    </div>
  </div>
`;
};
