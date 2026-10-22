import nodemailer from "nodemailer";

/**
 * ==============================================================================
 * 📧 Neo Cloud Bites - Centralized Email Service
 * ==============================================================================
 * Handles transactional emails via SMTP (Gmail or custom SMTP server).
 * Safely falls back if credentials are not configured so APIs never fail.
 */

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== "false"; // true for 465, false for 587
const SMTP_USER = process.env.SMTP_USER || "johnwick380900@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || `"Neo Cloud Bites" <${SMTP_USER}>`;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "johnwick380900@gmail.com";
const APP_URL =
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://dev.neocloudbites.com";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_PASS || SMTP_PASS.trim() === "" || SMTP_PASS.includes("YOUR_")) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS.replace(/\s+/g, ""), // clean spaces from app password if present
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  bccAdmin?: boolean;
}

/**
 * Low-level email sender that will never throw or crash the caller.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  bccAdmin = false,
}: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = getTransporter();

    if (!client) {
      console.warn(
        `[EmailService] ⚠️ SMTP credentials not configured (SMTP_PASS missing in .env). Email to <${Array.isArray(to) ? to.join(", ") : to}> skipped.`
      );
      return { success: false, error: "SMTP credentials not configured" };
    }

    const recipients = Array.isArray(to) ? to.filter(Boolean).join(", ") : to;
    if (!recipients) {
      return { success: false, error: "No recipient specified" };
    }

    const bccList: string[] = [];
    if (bccAdmin && ADMIN_EMAIL && !recipients.includes(ADMIN_EMAIL)) {
      bccList.push(ADMIN_EMAIL);
    }

    const info = await client.sendMail({
      from: SMTP_FROM,
      to: recipients,
      bcc: bccList.length > 0 ? bccList.join(", ") : undefined,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    console.log(`[EmailService] ✅ Email sent to ${recipients}: "${subject}" (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EmailService] ❌ Failed to send email to ${to}:`, err.message || err);
    return { success: false, error: err.message || "Unknown email error" };
  }
}

/**
 * Base responsive HTML email wrapper with Neo Cloud Kitchen branding.
 */
export function wrapHtmlEmail(
  title: string,
  contentHtml: string,
  options?: {
    headerColor?: "orange" | "green" | "red" | "amber" | "purple" | "blue";
    headerSubtitle?: string;
  }
): string {
  const colorMap: Record<string, string> = {
    orange: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
    green: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
    red: "linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)",
    amber: "linear-gradient(135deg, #B45309 0%, #D97706 100%)",
    purple: "linear-gradient(135deg, #6B21A8 0%, #7E22CE 100%)",
    blue: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  };

  const headerBg = colorMap[options?.headerColor || "orange"];
  const headerSub = options?.headerSubtitle || "Fresh • Hygienic • Delivered Hot";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; }
    .container { max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
    .header { background: ${headerBg}; padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.95; }
    .body { padding: 32px 24px; }
    .footer { background-color: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #EA580C; color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 18px; }
    .btn-green { background-color: #16A34A !important; }
    .btn-red { background-color: #DC2626 !important; }
    .btn-purple { background-color: #7E22CE !important; }
    .btn-outline { background-color: #FFFFFF !important; color: #1E293B !important; border: 1.5px solid #CBD5E1; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge-pending { background-color: #FEF3C7; color: #B45309; }
    .badge-accepted { background-color: #E0E7FF; color: #4338CA; }
    .badge-preparing { background-color: #F3E8FF; color: #7E22CE; }
    .badge-delivery { background-color: #E0F2FE; color: #0369A1; }
    .badge-delivered { background-color: #DCFCE7; color: #15803D; }
    .badge-cancelled { background-color: #FEE2E2; color: #B91C1C; }
    .badge-purple { background-color: #F3E8FF; color: #6B21A8; }
    .badge-blue { background-color: #DBEAFE; color: #1E40AF; }
    .info-card { background-color: #F8FAFC; border-radius: 12px; padding: 16px 18px; margin: 18px 0; border: 1.5px solid #E2E8F0; }
    .alert-card { border-radius: 12px; padding: 14px 16px; margin: 16px 0; font-size: 13.5px; line-height: 1.5; }
    .alert-success { background-color: #F0FDF4; border: 1px solid #BBF7D0; color: #166534; }
    .alert-warning { background-color: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; }
    .alert-danger { background-color: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }
    .metric-grid { display: flex; gap: 10px; margin: 16px 0; }
    .metric-box { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; text-align: center; }
    .metric-val { font-size: 18px; font-weight: 800; color: #0F172A; }
    .metric-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; color: #64748B; border-bottom: 2px solid #E2E8F0; }
    td { padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #F1F5F9; color: #334155; }
    .total-row td { font-weight: 800; font-size: 16px; color: #0F172A; border-top: 2px solid #E2E8F0; border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Neo Cloud Bites</h1>
      <p>${headerSub}</p>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Need help? Contact support at <a href="mailto:${ADMIN_EMAIL}" style="color: #EA580C; text-decoration: none;">${ADMIN_EMAIL}</a></p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Neo Cloud Bites. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ==============================================================================
// 1. 🍳 NEO CLOUD BITES – SELLER ONBOARDING EMAILS
// ==============================================================================

export interface SellerApplicationSubmittedOptions {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
  trackingId: string;
  category?: string;
  phone?: string;
}

/**
 * 1.1 Seller Application Submitted Email
 */
export async function sendSellerApplicationSubmittedEmail({
  sellerName,
  sellerEmail,
  businessName,
  trackingId,
  category = "FOOD",
  phone,
}: SellerApplicationSubmittedOptions) {
  const displayName = sellerName || businessName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-pending">Application Submitted</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Welcome to Neo Cloud Bites, ${displayName}!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Your partner onboarding application for <strong>${businessName}</strong> has been received.
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Tracking ID:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #0F172A;">${trackingId}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Kitchen / Business:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #0F172A;">${businessName}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Category:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #EA580C;">${category}</td>
        </tr>
        ${phone ? `
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Contact:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; color: #334155;">${phone}</td>
        </tr>` : ""}
      </table>
    </div>

    <div class="alert-card alert-warning">
      <strong>🔍 What Happens Next?</strong><br>
      Our quality and documentation verification team is reviewing your details (FSSAI, identity verification, kitchen address). Most applications are processed within 24 to 48 business hours. You will receive an email as soon as your application is reviewed.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/seller/register/status?trackingId=${trackingId}" class="btn">Track Application Status</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Application Received - ${businessName}`, content, {
    headerColor: "orange",
    headerSubtitle: "Seller Partner Onboarding",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `📋 Application Submitted: ${businessName} (ID: ${trackingId}) - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

export interface SellerApplicationRejectedOptions {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
  reason?: string;
  reapplyUrl?: string;
}

/**
 * 1.2 Seller Application Rejected / Revision Required Email
 */
export async function sendSellerApplicationRejectedEmail({
  sellerName,
  sellerEmail,
  businessName,
  reason,
  reapplyUrl,
}: SellerApplicationRejectedOptions) {
  const displayName = sellerName || businessName || "Partner";
  const feedbackReason = reason || "Incomplete documentation or clarification required on submitted kitchen license.";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Action Required</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Application Update Required for ${businessName}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Dear ${displayName}, thank you for your interest in partnering with Neo Cloud Bites.
      </p>
    </div>

    <div class="alert-card alert-danger">
      <strong style="display: block; margin-bottom: 4px; font-size: 14px;">📝 Feedback from Verification Team:</strong>
      <p style="margin: 0; font-size: 14px; line-height: 1.5;">${feedbackReason}</p>
    </div>

    <div class="info-card">
      <h4 style="margin: 0 0 10px 0; color: #0F172A; font-size: 14px;">How to Reapply / Update Documents:</h4>
      <ol style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #334155; line-height: 1.6;">
        <li>Click the button below to open your seller onboarding application.</li>
        <li>Review the feedback and re-upload clear copies of the requested documents (e.g. FSSAI license, Aadhaar, Bank passbook).</li>
        <li>Submit your updated profile for priority re-review.</li>
      </ol>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${reapplyUrl || `${APP_URL}/seller/register`}" class="btn btn-red">Reapply / Update Documents</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Action Required: Application Revision - ${businessName}`, content, {
    headerColor: "red",
    headerSubtitle: "Partner Verification Notice",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `⚠️ Action Required: Please Reapply / Update Documents for ${businessName} - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

export interface SellerApplicationApprovedOptions {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
  dashboardUrl?: string;
}

/**
 * 1.3 Seller Application Approved Email
 */
export async function sendSellerApplicationApprovedEmail({
  sellerName,
  sellerEmail,
  businessName,
  dashboardUrl,
}: SellerApplicationApprovedOptions) {
  const displayName = sellerName || businessName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Verified & Approved</span>
      <h2 style="font-size: 24px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        🎉 Welcome Aboard, ${displayName}!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Your kitchen <strong>${businessName}</strong> has been officially approved!
      </p>
    </div>

    <div class="alert-card alert-success">
      <strong>✨ Your Kitchen is Active!</strong><br>
      Our quality verification team has approved your application and certified your kitchen profile. You can now access your Seller Dashboard, configure your daily food menu, set delivery radius, and purchase a partner subscription to start receiving orders.
    </div>

    <div class="info-card">
      <h4 style="margin: 0 0 10px 0; color: #0F172A; font-size: 14px;">Next Steps to Go Live:</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #334155; line-height: 1.6;">
        <li><strong>Step 1:</strong> Log in to your Seller Dashboard.</li>
        <li><strong>Step 2:</strong> Add your signature dishes, prices, and food photos.</li>
        <li><strong>Step 3:</strong> Activate a subscription plan to open your kitchen to hungry customers nearby.</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${dashboardUrl || `${APP_URL}/seller/dashboard`}" class="btn btn-green">Go to Seller Dashboard</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Kitchen Approved - ${businessName}`, content, {
    headerColor: "green",
    headerSubtitle: "Welcome to Neo Cloud Bites",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `🎉 Congratulations! Your Kitchen "${businessName}" is Approved - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

export interface KitchenDeletionOptions {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
  scheduledDate?: string;
  scheduledDeletionDate?: string;
  gracePeriodDays?: number;
  daysRemaining?: number;
}

/**
 * 1.4 Kitchen Soft Deletion Email
 */
export async function sendKitchenSoftDeletedEmail({
  sellerName,
  sellerEmail,
  businessName,
  scheduledDate,
  scheduledDeletionDate,
  gracePeriodDays,
  daysRemaining,
}: KitchenDeletionOptions) {
  const resolvedScheduledDate = scheduledDeletionDate || scheduledDate || "30 days from today";
  const resolvedDays = daysRemaining || gracePeriodDays || 30;
  const displayName = sellerName || businessName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Kitchen Deactivated</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Kitchen Deactivation Notice: ${businessName}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Dear ${displayName}, a request to delete your kitchen profile has been processed.
      </p>
    </div>

    <div class="alert-card alert-warning">
      <strong>⚠️ Soft Deletion in Effect</strong><br>
      Your kitchen and its menu items have been deactivated and hidden from customer discovery. Your account is scheduled for <strong>permanent deletion on ${resolvedScheduledDate}</strong> (${resolvedDays}-day safety grace period).
    </div>

    <div class="info-card">
      <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5;">
        <strong>Changed your mind?</strong><br>
        If this deletion was requested in error or you wish to reactivate your kitchen, simply log in to your seller account before <strong>${resolvedScheduledDate}</strong>. Logging in will automatically cancel deletion and restore your kitchen profile and menu.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/login" class="btn">Log In to Cancel Deletion</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Kitchen Deactivation - ${businessName}`, content, {
    headerColor: "amber",
    headerSubtitle: "Kitchen Account Notice",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `⚠️ Kitchen Deactivation Notice: ${businessName} - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

/**
 * 1.5 Kitchen Permanent Deletion Email
 */
export async function sendKitchenPermanentlyDeletedEmail({
  sellerName,
  sellerEmail,
  businessName,
}: {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
}) {
  const displayName = sellerName || businessName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Permanently Deleted</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Permanent Deletion Complete: ${businessName}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Dear ${displayName}, this email confirms that your kitchen has been permanently removed.
      </p>
    </div>

    <div class="alert-card alert-danger">
      <strong>🗑️ Data Erased</strong><br>
      The kitchen profile for <strong>${businessName}</strong>, along with all associated menus, business verification documents, and sensitive credentials, has been permanently purged from our platform in compliance with data privacy regulations.
    </div>

    <p style="font-size: 13.5px; color: #64748B; line-height: 1.5; text-align: center;">
      Thank you for having been part of the Neo Cloud Bites network. If you ever wish to partner with us in the future, you are always welcome to register a fresh kitchen application.
    </p>
  `;

  const html = wrapHtmlEmail(`Permanent Deletion - ${businessName}`, content, {
    headerColor: "red",
    headerSubtitle: "Account Closed",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `Confirmation: Permanent Deletion of Kitchen "${businessName}" - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

/**
 * 1.6 Kitchen Deactivation Revoked / Restored Email
 */
export async function sendKitchenDeletionRevokedEmail({
  sellerName,
  sellerEmail,
  businessName,
}: {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
}) {
  const displayName = sellerName || businessName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Deletion Revoked</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Kitchen Deactivation Revoked: ${businessName}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Dear ${displayName}, your kitchen deletion request has been successfully cancelled.
      </p>
    </div>

    <div class="alert-card alert-success">
      <strong>✅ Kitchen Restored</strong><br>
      Your kitchen profile for <strong>${businessName}</strong>, along with your active menu items and operations, has been fully reactivated and restored to normal standing.
    </div>

    <div class="info-card">
      <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5;">
        Your kitchen profile and menu have been restored. You can now manage your kitchen, accept customer orders, and update your menu directly from your operations console.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/seller/dashboard" class="btn btn-green">Go to Seller Dashboard</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Kitchen Deactivation Revoked - ${businessName}`, content, {
    headerColor: "green",
    headerSubtitle: "Kitchen Account Notice",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `✅ Kitchen Deactivation Revoked: ${businessName} - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

// ==============================================================================
// 2. 💳 SELLER SUBSCRIPTION EMAILS
// ==============================================================================

export interface SellerSubscriptionInvoiceOptions {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
  planName: string;
  planCategory?: string;
  durationMonths?: number;
  amountPaid: number;
  validUntil: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  appliedCoupon?: string | null;
}

/**
 * 2.1 Seller Subscription Purchase – Tax Invoice Email
 */
export async function sendSellerSubscriptionInvoiceEmail({
  sellerName,
  sellerEmail,
  businessName,
  planName,
  planCategory = "FOOD",
  durationMonths = 1,
  amountPaid,
  validUntil,
  invoiceNumber,
  invoiceDate,
  paymentId,
  razorpayPaymentId,
  razorpayOrderId,
  appliedCoupon,
}: SellerSubscriptionInvoiceOptions) {
  const resolvedPaymentId = paymentId || razorpayPaymentId;
  const invoiceId = invoiceNumber || `INV-SUB-${(resolvedPaymentId || Math.random().toString(36).substring(2, 8)).slice(-8).toUpperCase()}`;
  const formattedAmount = (amountPaid || 0).toLocaleString("en-IN");
  const formattedDate = invoiceDate || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Invoice Paid</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Tax Invoice: Partner Subscription
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Invoice #${invoiceId} • Date: ${formattedDate}
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Billed To:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; font-weight: 700; color: #0F172A;">${businessName} (${sellerName || "Partner"})</td>
        </tr>
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Plan:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; font-weight: 700; color: #EA580C;">${planName} (${planCategory})</td>
        </tr>
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Duration:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; color: #334155;">${durationMonths} Month${durationMonths > 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Valid Until:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; font-weight: 700; color: #15803D;">${validUntil}</td>
        </tr>
        ${appliedCoupon ? `
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Coupon Applied:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; color: #7E22CE; font-weight: 700;">${appliedCoupon}</td>
        </tr>` : ""}
        ${razorpayPaymentId ? `
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Payment ID:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; font-family: monospace; font-size: 12px; color: #64748B;">${razorpayPaymentId}</td>
        </tr>` : ""}
      </table>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Duration</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${planName}</strong><br><small style="color: #64748B;">Partner Cloud Kitchen Subscription</small></td>
          <td style="text-align: center;">${durationMonths}m</td>
          <td style="text-align: right;">₹${formattedAmount}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">Total Paid</td>
          <td style="text-align: right;">₹${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${APP_URL}/seller/dashboard" class="btn btn-green">View Seller Dashboard</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Subscription Invoice #${invoiceId}`, content, {
    headerColor: "green",
    headerSubtitle: "Tax Invoice & Payment Receipt",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `🧾 Subscription Tax Invoice #${invoiceId} (₹${formattedAmount}) - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

export interface SellerSubscriptionReminderOptions {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
  planName: string;
  daysRemaining: number;
  expiryDate: string;
  renewUrl?: string;
}

/**
 * 2.2 Seller Subscription Ending Soon – Renewal Reminder Email
 */
export async function sendSellerSubscriptionEndingSoonEmail({
  sellerName,
  sellerEmail,
  businessName,
  planName,
  daysRemaining,
  expiryDate,
  renewUrl,
}: SellerSubscriptionReminderOptions) {
  const displayName = sellerName || businessName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-pending">Renewal Reminder</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Your Subscription Ends in ${daysRemaining} Day${daysRemaining > 1 ? "s" : ""}!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${displayName}, your <strong>${planName}</strong> subscription for <strong>${businessName}</strong> expires on <strong>${expiryDate}</strong>.
      </p>
    </div>

    <div class="alert-card alert-warning">
      <strong>⚠️ Keep Your Kitchen Online!</strong><br>
      When your subscription concludes, your kitchen menu will be temporarily hidden from customer searches and new food orders will be paused. Renew now to ensure zero downtime and uninterrupted order revenue!
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${renewUrl || `${APP_URL}/seller/subscription`}" class="btn">Renew Subscription Now</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Subscription Ending Soon - ${businessName}`, content, {
    headerColor: "amber",
    headerSubtitle: "Subscription Renewal Reminder",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `⏳ Renewal Reminder: Your Subscription Ends in ${daysRemaining} Day${daysRemaining > 1 ? "s" : ""} - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

/**
 * 2.3 Seller Subscription Ended Email
 */
export async function sendSellerSubscriptionEndedEmail({
  sellerName,
  sellerEmail,
  businessName,
  planName,
  expiryDate,
  renewUrl,
}: {
  sellerName?: string;
  sellerEmail: string;
  businessName: string;
  planName: string;
  expiryDate: string;
  renewUrl?: string;
}) {
  const displayName = sellerName || businessName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Subscription Expired</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Subscription Ended for ${businessName}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${displayName}, your <strong>${planName}</strong> plan expired on <strong>${expiryDate}</strong>.
      </p>
    </div>

    <div class="alert-card alert-danger">
      <strong>⏸️ Kitchen Orders Paused</strong><br>
      Your kitchen is currently paused and cannot receive new orders from customers. To reactivate your menu and get back on the marketplace, please renew your subscription.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${renewUrl || `${APP_URL}/seller/subscription`}" class="btn btn-red">Reactivate Subscription</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Subscription Ended - ${businessName}`, content, {
    headerColor: "red",
    headerSubtitle: "Subscription Status",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `⚠️ Subscription Expired: ${businessName} is Currently Paused - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

// ==============================================================================
// 3. 🍱 MEAL SUBSCRIPTION – USER EMAILS
// ==============================================================================

export interface UserMealSubscriptionConfirmationOptions {
  customerName: string;
  customerEmail: string;
  planName: string;
  durationDays?: number;
  slots?: string[];
  startDate: string;
  endDate: string;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod?: string;
  subscriptionId?: string;
}

/**
 * 3.1 User Meal Subscription Purchase Confirmation Email
 */
export async function sendUserMealSubscriptionConfirmationEmail({
  customerName,
  customerEmail,
  planName,
  durationDays = 30,
  slots = [],
  startDate,
  endDate,
  totalAmount,
  deliveryAddress,
  paymentMethod = "Online",
  subscriptionId,
}: UserMealSubscriptionConfirmationOptions) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Subscription Confirmed</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Welcome to ${planName}, ${customerName}!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Your daily meal subscription has been confirmed and scheduled.
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 5px 0; color: #64748B;"><strong>Meal Plan:</strong></td>
          <td style="border: none; padding: 5px 0; text-align: right; font-weight: 700; color: #0F172A;">${planName}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 0; color: #64748B;"><strong>Validity:</strong></td>
          <td style="border: none; padding: 5px 0; text-align: right; color: #334155;">${durationDays} Days (${startDate} to ${endDate})</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 0; color: #64748B;"><strong>Scheduled Slots:</strong></td>
          <td style="border: none; padding: 5px 0; text-align: right; font-weight: 700; color: #EA580C;">${slots.length > 0 ? slots.join(", ") : "Daily Slots"}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 0; color: #64748B;"><strong>Total Paid:</strong></td>
          <td style="border: none; padding: 5px 0; text-align: right; font-weight: 800; color: #15803D;">₹${(totalAmount || 0).toLocaleString("en-IN")} (${paymentMethod})</td>
        </tr>
        <tr>
          <td style="border: none; padding: 5px 0; color: #64748B;"><strong>Delivery Address:</strong></td>
          <td style="border: none; padding: 5px 0; text-align: right; color: #334155;">${deliveryAddress}</td>
        </tr>
      </table>
    </div>

    <div class="alert-card alert-success">
      <strong>🍲 Fresh Food Everyday</strong><br>
      Our partner chefs cook your meals freshly before each delivery slot. Delivery valets will arrive with an OTP verification for safe and timely handovers.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/my-subscription${subscriptionId ? `?id=${subscriptionId}` : ""}" class="btn btn-green">Manage Meal Subscription</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Meal Subscription Confirmed - ${planName}`, content, {
    headerColor: "green",
    headerSubtitle: "Daily Gourmet Meal Subscription",
  });

  return sendEmail({
    to: customerEmail,
    subject: `🍱 Meal Subscription Confirmed: ${planName} - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

export interface UserMealSubscriptionPausedOptions {
  customerName: string;
  customerEmail: string;
  planName: string;
  pauseStartDate: string;
  pauseEndDate: string;
  requestedDays: number;
  extendedEndDate?: string;
  subscriptionId?: string;
}

/**
 * 3.2 User Pauses a Plan – Email Including the Pause Date
 */
export async function sendUserMealSubscriptionPausedEmail({
  customerName,
  customerEmail,
  planName,
  pauseStartDate,
  pauseEndDate,
  requestedDays,
  extendedEndDate,
  subscriptionId,
}: UserMealSubscriptionPausedOptions) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-pending">Plan Paused</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Meal Subscription Paused
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${customerName}, your daily meals for <strong>${planName}</strong> have been paused as requested.
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Pause Date:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #EA580C;">${pauseStartDate}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Scheduled Resume Date:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #15803D;">${pauseEndDate}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Pause Duration:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; color: #334155;">${requestedDays} Day${requestedDays > 1 ? "s" : ""}</td>
        </tr>
        ${extendedEndDate ? `
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>New Extended End Date:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #0F172A;">${extendedEndDate}</td>
        </tr>` : ""}
      </table>
    </div>

    <div class="alert-card alert-warning">
      <strong>⏸️ No Deliveries During Pause</strong><br>
      No meals will be prepared or dispatched during this pause period. Your subscription validity has been extended automatically so you never lose a single meal you paid for. You can resume early anytime from your dashboard.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/my-subscription${subscriptionId ? `?id=${subscriptionId}` : ""}" class="btn">View / Resume Subscription</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Subscription Paused - ${planName}`, content, {
    headerColor: "amber",
    headerSubtitle: "Meal Plan Schedule Update",
  });

  return sendEmail({
    to: customerEmail,
    subject: `⏸️ Meal Subscription Paused (From ${pauseStartDate}) - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

export interface UserMealSubscriptionResumedOptions {
  customerName: string;
  customerEmail: string;
  planName: string;
  resumeDate: string;
  updatedEndDate?: string;
  subscriptionId?: string;
}

/**
 * 3.3 User Resumes a Plan – Email Including the Resume Date
 */
export async function sendUserMealSubscriptionResumedEmail({
  customerName,
  customerEmail,
  planName,
  resumeDate,
  updatedEndDate,
  subscriptionId,
}: UserMealSubscriptionResumedOptions) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Plan Active</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Welcome Back! Meal Deliveries Resumed
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${customerName}, your meal plan <strong>${planName}</strong> is back in action!
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Resume Date:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #15803D;">${resumeDate}</td>
        </tr>
        ${updatedEndDate ? `
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Current End Date:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #0F172A;">${updatedEndDate}</td>
        </tr>` : ""}
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Status:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; color: #15803D; font-weight: 700;">Active & Scheduled</td>
        </tr>
      </table>
    </div>

    <div class="alert-card alert-success">
      <strong>🍱 Daily Meals Scheduled</strong><br>
      Your upcoming meal deliveries are active again. Our kitchen partner will prepare your meals for your regular daily time slots.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/my-subscription${subscriptionId ? `?id=${subscriptionId}` : ""}" class="btn btn-green">View Meal Schedule</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Subscription Resumed - ${planName}`, content, {
    headerColor: "green",
    headerSubtitle: "Meal Plan Resumed",
  });

  return sendEmail({
    to: customerEmail,
    subject: `▶️ Meal Subscription Resumed (On ${resumeDate}) - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

/**
 * 3.4 User Meal Subscription Expiring Soon Email (Next few days)
 */
export async function sendUserMealSubscriptionExpiringSoonEmail({
  customerName,
  customerEmail,
  planName,
  daysRemaining,
  expiryDate,
  renewUrl,
}: {
  customerName: string;
  customerEmail: string;
  planName: string;
  daysRemaining: number;
  expiryDate: string;
  renewUrl?: string;
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-pending">Expiring Soon</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Your Meal Plan Ends in ${daysRemaining} Day${daysRemaining > 1 ? "s" : ""}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${customerName}, your <strong>${planName}</strong> plan is scheduled to conclude on <strong>${expiryDate}</strong>.
      </p>
    </div>

    <div class="alert-card alert-warning">
      <strong>🍲 Keep Your Routine Going!</strong><br>
      Don't let your healthy, fresh meal deliveries stop. Renew your plan today to ensure unbroken daily meals delivered to your doorstep.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${renewUrl || `${APP_URL}/meal-plans`}" class="btn">Renew Meal Subscription</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Meal Plan Expiring Soon - ${planName}`, content, {
    headerColor: "amber",
    headerSubtitle: "Meal Plan Renewal Reminder",
  });

  return sendEmail({
    to: customerEmail,
    subject: `⏰ Your Meal Subscription Expires in ${daysRemaining} Day${daysRemaining > 1 ? "s" : ""} - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

/**
 * 3.5 Meal Subscription Expired Email
 */
export async function sendUserMealSubscriptionExpiredEmail({
  customerName,
  customerEmail,
  planName,
  expiryDate,
  renewUrl,
}: {
  customerName: string;
  customerEmail: string;
  planName: string;
  expiryDate: string;
  renewUrl?: string;
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Plan Concluded</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Thank You for Subscribing, ${customerName}!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Your <strong>${planName}</strong> meal subscription concluded on <strong>${expiryDate}</strong>.
      </p>
    </div>

    <p style="font-size: 14px; color: #334155; line-height: 1.6; text-align: center;">
      We hope you enjoyed healthy, home-style chef preparations every day. When you're ready to restart daily deliveries, explore our updated weekly and monthly meal menus!
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${renewUrl || `${APP_URL}/meal-plans`}" class="btn">Browse & Renew Meal Plans</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Meal Plan Ended - ${planName}`, content, {
    headerColor: "orange",
    headerSubtitle: "Meal Subscription Ended",
  });

  return sendEmail({
    to: customerEmail,
    subject: `Meal Subscription Ended: ${planName} - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

// ==============================================================================
// 4. 🍽️ ORDERS (PLACED, DELIVERED, CANCELLED)
// ==============================================================================

/**
 * 4.1 Order Placed Notification (Enhanced)
 */
export async function sendOrderPlacedNotification(order: any, customer?: any, seller?: any) {
  const recipientEmail = customer?.email || order?.user?.email;
  const customerName = customer?.name || order?.user?.name || "Valued Customer";
  const orderId = order.id;
  const totalAmount = (order.totalAmount || 0).toLocaleString("en-IN");
  const address = order.deliveryAddress || "Address provided at checkout";

  let items: any[] = [];
  try {
    items = typeof order.items === "string" ? JSON.parse(order.items) : (order.items || []);
  } catch {
    items = [];
  }

  const itemsRows = items
    .map(
      (item: any) => `
    <tr>
      <td><strong>${item.name || "Dish Item"}</strong>${item.variantName || item.variant ? `<br><small style="color: #64748B;">${item.variantName || item.variant}</small>` : ""}</td>
      <td style="text-align: center;">${item.quantity || item.qty || 1}</td>
      <td style="text-align: right;">₹${((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString("en-IN")}</td>
    </tr>
  `
    )
    .join("");

  const isCod = order.paymentMethod === "COD" || order.paymentMethod === "Cash on Delivery";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-pending">Order Confirmed</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 4px 0;">Thank You for Your Order, ${customerName}!</h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">Order #${orderId} has been transmitted to the kitchen for fresh preparation.</p>
    </div>

    <div class="info-card">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748B;"><strong>Delivery Address:</strong></p>
      <p style="margin: 0; font-size: 14px; color: #1E293B;">${address}</p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748B;">
        <strong>Payment Method:</strong> ${order.paymentMethod || "COD"} • 
        <strong style="color: ${order.isPaid ? "#15803D" : "#B45309"};">${order.isPaid ? "Paid Online" : isCod ? `Cash on Delivery (₹${totalAmount} to pay)` : "Pending"}</strong>
      </p>
    </div>

    <h3 style="font-size: 15px; font-weight: 700; color: #0F172A; margin: 16px 0 8px 0;">Order Items Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr class="total-row">
          <td colspan="2">Total Amount</td>
          <td style="text-align: right;">₹${totalAmount}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 28px;">
      <a href="${APP_URL}/orders-desktop?orderId=${orderId}&action=track" class="btn">Track Order Live</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Order Confirmed - #${orderId}`, content, {
    headerColor: "orange",
    headerSubtitle: "Order Placed Successfully",
  });

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `🍽️ Order Confirmed! #${orderId} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  } else if (ADMIN_EMAIL) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🍽️ New Order Received! #${orderId} - Neo Cloud Bites`,
      html,
    });
  }
}

/**
 * 4.2 Order Delivered Email
 */
export async function sendOrderDeliveredEmail({
  order,
  customer,
  seller,
}: {
  order: any;
  customer?: any;
  seller?: any;
}) {
  const recipientEmail = customer?.email || order?.user?.email;
  const customerName = customer?.name || order?.user?.name || "Customer";
  const orderId = order.id;
  const kitchenName = seller?.businessName || order?.seller?.businessName || "Kitchen Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Delivered Successfully</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        🎉 Order Delivered! Enjoy Your Food!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${customerName}, your meal from <strong>${kitchenName}</strong> has been delivered.
      </p>
    </div>

    <div class="alert-card alert-success">
      <strong>✨ Bon Appétit!</strong><br>
      Your order #${orderId} has been completed. We hope you love every bite! Tell us how your food was by dropping a quick rating and review.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/orders-desktop?orderId=${orderId}" class="btn btn-green">Rate & Review Food</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Order Delivered - #${orderId}`, content, {
    headerColor: "green",
    headerSubtitle: "Delivery Complete",
  });

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `🎉 Order Delivered! #${orderId.slice(0, 8)} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  }
}

/**
 * 4.3 Order Cancelled Email
 */
export async function sendOrderCancelledEmail({
  order,
  customer,
  reason,
  refundInitiated,
  refundAmount,
}: {
  order: any;
  customer?: any;
  reason?: string;
  refundInitiated?: boolean;
  refundAmount?: number;
}) {
  const recipientEmail = customer?.email || order?.user?.email;
  const customerName = customer?.name || order?.user?.name || "Customer";
  const orderId = order.id;
  const amount = refundAmount !== undefined ? refundAmount : order.totalAmount || 0;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Order Cancelled</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Order #${orderId} Cancelled
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${customerName}, your food order has been cancelled.
      </p>
    </div>

    <div class="info-card">
      <p style="margin: 0 0 6px 0; font-size: 13.5px; color: #64748B;"><strong>Cancellation Reason:</strong></p>
      <p style="margin: 0; font-size: 14px; color: #0F172A;">${reason || "Order cancelled prior to food preparation."}</p>
    </div>

    ${refundInitiated && amount > 0 ? `
    <div class="alert-card alert-success">
      <strong>💳 100% Refund Initiated</strong><br>
      A full refund of <strong>₹${amount.toLocaleString("en-IN")}</strong> has been initiated to your original payment method. The amount will reflect on your card/bank statement within 3–5 business days.
    </div>` : `
    <div class="alert-card alert-warning">
      <strong>Shield: No Cancellation Fee</strong><br>
      Since this order was Cash on Delivery (COD) or a 100% discount promotion, no amount was charged and no cancellation fee applies.
    </div>`}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/food-explore" class="btn">Explore Food Menu</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Order Cancelled - #${orderId}`, content, {
    headerColor: "red",
    headerSubtitle: "Order Cancellation Notice",
  });

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `❌ Order Cancelled: #${orderId.slice(0, 8)} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  }
}

/**
 * 4.4 Generic Order Status Notification (Preserved for backwards compatibility)
 */
export async function sendOrderStatusNotification(
  order: any,
  status: string,
  customer?: any,
  notes?: string
) {
  if (status.toUpperCase() === "DELIVERED") {
    return sendOrderDeliveredEmail({ order, customer });
  }

  if (status.toUpperCase() === "CANCELLED") {
    const isPaid = order.isPaid && order.totalAmount > 0;
    return sendOrderCancelledEmail({
      order,
      customer,
      reason: notes,
      refundInitiated: isPaid,
      refundAmount: order.totalAmount,
    });
  }

  const recipientEmail = customer?.email || order?.user?.email;
  const customerName = customer?.name || order?.user?.name || "Customer";
  const orderId = order.id;

  const statusConfig: Record<string, { badgeClass: string; title: string; subtitle: string; icon: string }> = {
    ACCEPTED: {
      badgeClass: "badge-accepted",
      title: "Kitchen Accepted Your Order!",
      subtitle: "The chef has reviewed and accepted your order. Cooking will begin shortly.",
      icon: "👨‍🍳",
    },
    PREPARING: {
      badgeClass: "badge-preparing",
      title: "Order is Being Prepared!",
      subtitle: "Your meal is in the kitchen and will be packed fresh and hot.",
      icon: "🍳",
    },
    OUT_FOR_DELIVERY: {
      badgeClass: "badge-delivery",
      title: "Out for Delivery!",
      subtitle: "The delivery partner is on the way to your doorstep.",
      icon: "🛵",
    },
  };

  const currentConfig = statusConfig[status.toUpperCase()] || {
    badgeClass: "badge-pending",
    title: `Order Status: ${status}`,
    subtitle: `Your order status has been updated to ${status}.`,
    icon: "📦",
  };

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge ${currentConfig.badgeClass}">${status}</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        ${currentConfig.icon} ${currentConfig.title}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">Order #${orderId}</p>
    </div>

    <div class="info-card">
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">
        Hi <strong>${customerName}</strong>, ${currentConfig.subtitle}
      </p>
      ${notes ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #64748B;"><em>Note: ${notes}</em></p>` : ""}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/orders-desktop?orderId=${orderId}" class="btn">View Order Details</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Order ${status} - #${orderId}`, content, {
    headerColor: "orange",
  });

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `${currentConfig.icon} Order #${orderId} ${status} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  }
}

// ==============================================================================
// 5. 👤 USER ACCOUNT EMAILS (SOFT DELETION, PERMANENT, PASSWORD CHANGED)
// ==============================================================================

export interface UserAccountSoftDeletedOptions {
  userName?: string;
  userEmail: string;
  scheduledDate?: string;
  scheduledDeletionDate?: string;
  gracePeriodDays?: number;
  daysRemaining?: number;
}

/**
 * 5.1 Account Deleted Email after Soft Deletion
 */
export async function sendUserAccountSoftDeletedEmail({
  userName,
  userEmail,
  scheduledDate,
  scheduledDeletionDate,
  gracePeriodDays,
  daysRemaining,
}: UserAccountSoftDeletedOptions) {
  const resolvedScheduledDate = scheduledDeletionDate || scheduledDate || "30 days from today";
  const resolvedDays = daysRemaining || gracePeriodDays || 30;
  const displayName = userName || "User";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Account Deactivated</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Account Deletion Request Received
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Dear ${displayName}, a request to delete your Neo Cloud Bites account (${userEmail}) has been initiated.
      </p>
    </div>

    <div class="alert-card alert-warning">
      <strong>🗓️ Safety Grace Period (${resolvedDays} Days)</strong><br>
      Your account has been deactivated. It is scheduled for <strong>permanent deletion on ${resolvedScheduledDate}</strong>.
    </div>

    <div class="info-card">
      <h4 style="margin: 0 0 8px 0; color: #0F172A; font-size: 14px;">Want to Keep Your Account?</h4>
      <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5;">
        If you change your mind or did not make this request, simply log in to your account before <strong>${resolvedScheduledDate}</strong>. Logging in will automatically restore your account, past orders, and saved addresses.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/login" class="btn">Log In to Restore Account</a>
    </div>
  `;

  const html = wrapHtmlEmail("Account Deletion Notice", content, {
    headerColor: "amber",
    headerSubtitle: "Account Security Notice",
  });

  return sendEmail({
    to: userEmail,
    subject: `⚠️ Account Deletion Requested - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

/**
 * 5.2 Account Deletion Email for Permanent Deletion
 */
export async function sendUserAccountPermanentlyDeletedEmail({
  userName,
  userEmail,
}: {
  userName?: string;
  userEmail: string;
}) {
  const displayName = userName || "User";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Permanently Deleted</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Your Account Has Been Permanently Deleted
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Dear ${displayName}, this confirms that your Neo Cloud Bites account has been permanently removed.
      </p>
    </div>

    <div class="alert-card alert-danger">
      <strong>🛡️ Data Erased</strong><br>
      All personal identifiers, contact details, and saved preferences associated with <strong>${userEmail}</strong> have been permanently scrubbed from our systems in compliance with privacy laws.
    </div>

    <p style="font-size: 13.5px; color: #64748B; text-align: center; line-height: 1.5;">
      We are sorry to see you go. If you ever wish to order delicious home-cooked meals in the future, you are always welcome to create a fresh account.
    </p>
  `;

  const html = wrapHtmlEmail("Account Permanently Deleted", content, {
    headerColor: "red",
    headerSubtitle: "Account Closed",
  });

  return sendEmail({
    to: userEmail,
    subject: `Confirmation: Account Permanently Deleted - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

/**
 * 5.2b User Account Deletion Revoked / Restored Email
 */
export async function sendUserAccountRestoredEmail({
  userName,
  userEmail,
}: {
  userName?: string;
  userEmail: string;
}) {
  const displayName = userName || "Valued Customer";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Account Restored</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Welcome Back, ${displayName}!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Your account deletion request has been successfully cancelled.
      </p>
    </div>

    <div class="alert-card alert-success">
      <strong>✅ Account Reactivated</strong><br>
      Your Neo Cloud Bites customer account, saved delivery addresses, and past order history have been fully restored.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/explore-desktop" class="btn">Explore Foods &amp; Restaurants</a>
    </div>
  `;

  const html = wrapHtmlEmail("Account Restored - Neo Cloud Bites", content, {
    headerColor: "green",
    headerSubtitle: "Account Notice",
  });

  return sendEmail({
    to: userEmail,
    subject: "✅ Account Deletion Revoked - Neo Cloud Bites",
    html,
    bccAdmin: true,
  });
}

export interface PasswordChangedOptions {
  userName?: string;
  userEmail: string;
  role?: string;
  timestamp?: string;
}

/**
 * 5.3 Password Changed Successfully Email (User & Seller)
 */
export async function sendPasswordChangedEmail({
  userName,
  userEmail,
  role = "USER",
  timestamp,
}: PasswordChangedOptions) {
  const displayName = userName || (role === "SELLER" ? "Kitchen Partner" : "Customer");
  const timeFormatted = timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-blue">Security Alert</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Password Changed Successfully
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${displayName}, your password was updated on <strong>${timeFormatted}</strong>.
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Account Email:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; font-weight: 700; color: #0F172A;">${userEmail}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Account Type:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; color: #334155;">${role === "SELLER" ? "Seller Partner" : "Customer"}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 4px 0; color: #64748B;"><strong>Timestamp:</strong></td>
          <td style="border: none; padding: 4px 0; text-align: right; color: #334155;">${timeFormatted}</td>
        </tr>
      </table>
    </div>

    <div class="alert-card alert-warning">
      <strong>⚠️ Did not make this change?</strong><br>
      If you did NOT change your password, someone else may have gained unauthorized access to your account. Please reset your password immediately and contact support at <a href="mailto:${ADMIN_EMAIL}" style="color: #B45309;">${ADMIN_EMAIL}</a>.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/login" class="btn">Log In to Account</a>
    </div>
  `;

  const html = wrapHtmlEmail("Password Changed Successfully", content, {
    headerColor: "blue",
    headerSubtitle: "Security Notification",
  });

  return sendEmail({
    to: userEmail,
    subject: `🔒 Security Alert: Password Changed Successfully - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

// ==============================================================================
// 7. 🏷️ SELLER COUPONS (EXPIRY & PERFORMANCE REPORT)
// ==============================================================================

export interface CouponExpiredReportOptions {
  sellerName?: string;
  sellerEmail: string;
  couponCode: string;
  expiryReason?: string;
  usageCount: number;
  totalDiscountGiven: number;
  totalSalesAmount: number;
}

/**
 * 7.1 Coupon Expiry & Performance Report Email
 */
export async function sendCouponExpiredEmail({
  sellerName,
  sellerEmail,
  couponCode,
  expiryReason = "Reached configured validity period",
  usageCount,
  totalDiscountGiven,
  totalSalesAmount,
}: CouponExpiredReportOptions) {
  const displayName = sellerName || "Partner";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-purple">Coupon Expired</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Coupon Campaign Ended: [${couponCode}]
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${displayName}, your discount coupon <strong>${couponCode}</strong> has expired (${expiryReason}).
      </p>
    </div>

    <h3 style="font-size: 15px; font-weight: 700; color: #0F172A; margin: 20px 0 8px 0; text-align: center;">
      📊 Campaign Performance Report
    </h3>

    <div class="metric-grid">
      <div class="metric-box">
        <div class="metric-val" style="color: #7E22CE;">${usageCount}</div>
        <div class="metric-lbl">Orders Placed</div>
      </div>
      <div class="metric-box">
        <div class="metric-val" style="color: #15803D;">₹${totalDiscountGiven.toLocaleString("en-IN")}</div>
        <div class="metric-lbl">Saved by Users</div>
      </div>
      <div class="metric-box">
        <div class="metric-val" style="color: #EA580C;">₹${totalSalesAmount.toLocaleString("en-IN")}</div>
        <div class="metric-lbl">Total Sales</div>
      </div>
    </div>

    <div class="alert-card alert-success">
      <strong>📈 Coupons Drive Growth!</strong><br>
      This coupon generated <strong>₹${totalSalesAmount.toLocaleString("en-IN")}</strong> in orders. Discounts attract new customers and build loyal repeat diners. Launch another promotion to keep your kitchen thriving!
    </div>

    <div style="text-align: center; margin-top: 26px;">
      <a href="${APP_URL}/seller/coupons" class="btn btn-purple">Create New Coupon Campaign</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Coupon Report - ${couponCode}`, content, {
    headerColor: "purple",
    headerSubtitle: "Campaign Performance Summary",
  });

  return sendEmail({
    to: sellerEmail,
    subject: `📊 Coupon Expired & Campaign Report: [${couponCode}] - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

// ==============================================================================
// 8. 💸 REFUND EMAILS (INITIATED, COMPLETED)
// ==============================================================================

export interface RefundInitiatedOptions {
  customerName: string;
  customerEmail: string;
  orderId: string;
  refundAmount: number;
  paymentMethod?: string;
  estimatedDays?: string;
}

/**
 * 8.1 Cancelled Order – Refund Initiated Email
 */
export async function sendRefundInitiatedEmail({
  customerName,
  customerEmail,
  orderId,
  refundAmount,
  paymentMethod = "Online Payment",
  estimatedDays = "3–5 business days",
}: RefundInitiatedOptions) {
  const formattedAmount = (refundAmount || 0).toLocaleString("en-IN");

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-accepted">Refund Initiated</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        100% Refund Initiated for Order #${orderId.slice(0, 8)}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${customerName}, your refund has been initiated to your original payment method.
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Order ID:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #0F172A;">#${orderId}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Refund Amount:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 800; color: #15803D; font-size: 16px;">₹${formattedAmount}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Original Method:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; color: #334155;">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Expected Within:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #0F172A;">${estimatedDays}</td>
        </tr>
      </table>
    </div>

    <div class="alert-card alert-success">
      <strong>ℹ️ Direct to Source Credit</strong><br>
      The refund will be credited directly back to the original bank account, credit/debit card, or UPI VPA used at checkout. Banking timelines may take 3 to 5 business days to reflect in your statement.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/orders-desktop?orderId=${orderId}" class="btn">View Order in My Orders</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Refund Initiated - #${orderId}`, content, {
    headerColor: "green",
    headerSubtitle: "Payment Refund Update",
  });

  return sendEmail({
    to: customerEmail,
    subject: `💳 Refund Initiated for Order #${orderId.slice(0, 8)} (₹${formattedAmount}) - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

export interface RefundCompletedOptions {
  customerName: string;
  customerEmail: string;
  orderId: string;
  refundAmount: number;
  transactionId?: string | null;
  adminNote?: string | null;
}

/**
 * 8.2 Refund Completed Successfully Email
 */
export async function sendRefundCompletedEmail({
  customerName,
  customerEmail,
  orderId,
  refundAmount,
  transactionId,
  adminNote,
}: RefundCompletedOptions) {
  const formattedAmount = (refundAmount || 0).toLocaleString("en-IN");

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Refund Completed</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        Refund Completed Successfully!
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">
        Hi ${customerName}, your refund of <strong>₹${formattedAmount}</strong> has been processed.
      </p>
    </div>

    <div class="info-card">
      <table style="margin-top: 0;">
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Order ID:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #0F172A;">#${orderId}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Refund Amount:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 800; color: #15803D; font-size: 16px;">₹${formattedAmount}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Status:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-weight: 700; color: #15803D;">Processed & Credited</td>
        </tr>
        ${transactionId ? `
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Transaction / Reference ID:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-family: monospace; font-size: 12px; color: #0F172A;">${transactionId}</td>
        </tr>` : ""}
        ${adminNote ? `
        <tr>
          <td style="border: none; padding: 6px 0; color: #64748B;"><strong>Admin Note:</strong></td>
          <td style="border: none; padding: 6px 0; text-align: right; font-style: italic; color: #64748B;">${adminNote}</td>
        </tr>` : ""}
      </table>
    </div>

    <div class="alert-card alert-success">
      <strong>✅ Transaction Complete</strong><br>
      The funds have been credited to your payment gateway account / bank card. If you have any questions regarding your refund, quote Order ID #${orderId} when contacting support.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/orders-desktop" class="btn btn-green">View My Orders</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Refund Processed - #${orderId}`, content, {
    headerColor: "green",
    headerSubtitle: "Refund Confirmation",
  });

  return sendEmail({
    to: customerEmail,
    subject: `✅ Refund Completed for Order #${orderId.slice(0, 8)} (₹${formattedAmount}) - Neo Cloud Bites`,
    html,
    bccAdmin: true,
  });
}

// Backward compatibility alias for legacy callers
export const sendMealSubscriptionActivatedNotification = async (
  subscription: any,
  plan?: any,
  user?: any
) => {
  // If called directly with UserMealSubscriptionConfirmationOptions
  if (subscription && typeof subscription.customerEmail === "string") {
    return sendUserMealSubscriptionConfirmationEmail(subscription);
  }

  const customerName = user?.name || subscription?.user?.name || "Subscriber";
  const customerEmail = user?.email || subscription?.user?.email;
  if (!customerEmail) return;

  const planName = plan?.name || subscription?.plan?.name || "Meal Plan";
  const startDateStr = subscription?.startDate
    ? new Date(subscription.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const endDateStr = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Ongoing";

  const slots = subscription?.slots
    ? subscription.slots.map((s: any) => s.slot?.name || s.slotId || "Meal Slot").filter(Boolean)
    : [];

  return sendUserMealSubscriptionConfirmationEmail({
    customerName,
    customerEmail,
    planName,
    durationDays: subscription?.durationDays || (subscription?.cycle === "WEEKLY" ? 7 : 30),
    slots,
    startDate: startDateStr,
    endDate: endDateStr,
    totalAmount: subscription?.pricePaid || plan?.weeklyPrice || 0,
    deliveryAddress: subscription?.deliveryAddress || "Provided delivery address",
    subscriptionId: subscription?.id,
  });
};
export const sendMealSlotDeliveredNotification = async (
  subscription: any,
  slotName: string,
  user?: any
) => {
  const recipientEmail = user?.email || subscription?.user?.email;
  const customerName = user?.name || subscription?.user?.name || "Subscriber";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Delivered (OTP Verified)</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">🍱 ${slotName} Delivered!</h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">Verified with customer delivery OTP.</p>
    </div>

    <p style="font-size: 14px; color: #334155;">Hi <strong>${customerName}</strong>, your scheduled ${slotName} meal has been delivered. Enjoy your meal!</p>
  `;

  const html = wrapHtmlEmail(`Meal Delivered - ${slotName}`, content);

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `🍱 Meal Delivered: ${slotName} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  }
};

export const sendSubscriptionPauseNotification = async (
  subscription: any,
  isPaused: boolean,
  pauseDays?: number,
  user?: any,
  pauseStartDateStr?: string,
  pauseEndDateStr?: string,
  extendedEndDateStr?: string
) => {
  const recipientEmail = user?.email || subscription?.user?.email;
  const customerName = user?.name || subscription?.user?.name || "Subscriber";
  const planName = subscription?.plan?.name || "Meal Plan";

  if (isPaused) {
    return sendUserMealSubscriptionPausedEmail({
      customerName,
      customerEmail: recipientEmail,
      planName,
      pauseStartDate: pauseStartDateStr || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      pauseEndDate: pauseEndDateStr || `${pauseDays || 1} days from pause`,
      requestedDays: pauseDays || 1,
      extendedEndDate: extendedEndDateStr,
      subscriptionId: subscription.id,
    });
  } else {
    return sendUserMealSubscriptionResumedEmail({
      customerName,
      customerEmail: recipientEmail,
      planName,
      resumeDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      updatedEndDate: extendedEndDateStr,
      subscriptionId: subscription.id,
    });
  }
};

// ==============================================================================
// 9. 🔐 EMAIL VERIFICATION OTP (SELLER ONBOARDING & SIGNUP)
// ==============================================================================

export interface SendVerificationEmailOtpOptions {
  email: string;
  otp: string;
  userName?: string;
  purpose?: string;
}

export async function sendVerificationEmailOtp({
  email,
  otp,
  userName = "Partner",
  purpose = "seller_onboarding",
}: SendVerificationEmailOtpOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isSeller = purpose.includes("seller");
  const headline = isSeller ? "Partner Email Verification" : "Email Verification";

  const content = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6;">
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
        Verify Your Email Address
      </h2>
      <p style="font-size: 14px; margin-bottom: 20px; color: #475569;">
        Hello <strong>${userName}</strong>,<br/>
        Thank you for ${isSeller ? "registering your kitchen with" : "signing up for"} <strong>Neo Cloud Bites</strong>. Please enter the 6-digit verification code below to verify your email address:
      </p>

      <div style="background-color: #FFF9F4; border: 2px dashed #FF5500; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #FF5500; display: inline-block;">
          ${otp}
        </span>
        <div style="font-size: 12.5px; color: #64748B; margin-top: 8px; font-weight: 500;">
          Valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </div>
      </div>

      <p style="font-size: 13px; color: #64748B; margin-top: 24px; line-height: 1.5;">
        If you didn't request this verification code, please ignore this email or contact support if you have concerns.
      </p>
    </div>
  `;

  const html = wrapHtmlEmail(headline, content, {
    headerColor: "orange",
    headerSubtitle: "Secure Verification Code",
  });

  return sendEmail({
    to: email,
    subject: `🔐 Your Neo Cloud Bites Verification Code: ${otp}`,
    html,
  });
}

