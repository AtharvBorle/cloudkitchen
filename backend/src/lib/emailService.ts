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
function wrapHtmlEmail(title: string, contentHtml: string): string {
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
    .header { background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 32px 24px; }
    .footer { background-color: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #EA580C; color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 18px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .badge-pending { background-color: #FEF3C7; color: #B45309; }
    .badge-accepted { background-color: #E0E7FF; color: #4338CA; }
    .badge-preparing { background-color: #F3E8FF; color: #7E22CE; }
    .badge-delivery { background-color: #E0F2FE; color: #0369A1; }
    .badge-delivered { background-color: #DCFCE7; color: #15803D; }
    .badge-cancelled { background-color: #FEE2E2; color: #B91C1C; }
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
      <p>Fresh • Hygienic • Delivered Hot</p>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Need help? Reply to this email or visit our Help Center.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Neo Cloud Bites. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Order Placed / Created Email
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
      <td><strong>${item.name || "Dish Item"}</strong>${item.variantName ? `<br><small style="color: #64748B;">${item.variantName}</small>` : ""}</td>
      <td style="text-align: center;">${item.quantity || 1}</td>
      <td style="text-align: right;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</td>
    </tr>
  `
    )
    .join("");

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-pending">Order Confirmed</span>
      <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 12px 0 4px 0;">Thank You for Your Order, ${customerName}!</h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">Order #${orderId} has been sent to the kitchen for preparation.</p>
    </div>

    <div style="background-color: #F8FAFC; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; border: 1px solid #E2E8F0;">
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748B;"><strong>Delivery Address:</strong></p>
      <p style="margin: 0; font-size: 14px; color: #1E293B;">${address}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748B;"><strong>Payment Method:</strong> ${order.paymentMethod || "COD"} • ${order.isPaid ? "Paid" : "Pay on Delivery"}</p>
    </div>

    <h3 style="font-size: 15px; font-weight: 700; color: #0F172A; margin: 0 0 8px 0;">Order Summary</h3>
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
      <a href="https://dev.neocloudbites.com/my-orders?orderId=${orderId}" class="btn">Track Order Live</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Order Confirmed - #${orderId}`, content);

  // Send to Customer + BCC Admin (johnwick380900@gmail.com)
  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `🍽️ Order Confirmed! #${orderId} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  } else if (ADMIN_EMAIL) {
    // If user has no email, notify admin directly
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🍽️ New Order Received! #${orderId} - Neo Cloud Bites`,
      html,
    });
  }
}

/**
 * 2. Order Status Update Email (Accepted, Preparing, Out for Delivery, Delivered, Cancelled)
 */
export async function sendOrderStatusNotification(
  order: any,
  status: string,
  customer?: any,
  notes?: string
) {
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
    DELIVERED: {
      badgeClass: "badge-delivered",
      title: "Order Delivered Successfully!",
      subtitle: "Your meal has been delivered. Enjoy your food!",
      icon: "🎉",
    },
    COMPLETED: {
      badgeClass: "badge-delivered",
      title: "Order Completed!",
      subtitle: "Thank you for dining with Neo Cloud Bites.",
      icon: "✅",
    },
    CANCELLED: {
      badgeClass: "badge-cancelled",
      title: "Order Cancelled",
      subtitle: notes || "Your order has been cancelled. Any payments made will be refunded automatically.",
      icon: "❌",
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

    <div style="background-color: #F8FAFC; border-radius: 12px; padding: 18px; margin-bottom: 22px; border: 1px solid #E2E8F0;">
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">
        Hi <strong>${customerName}</strong>, ${currentConfig.subtitle}
      </p>
      ${notes ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #64748B;"><em>Note: ${notes}</em></p>` : ""}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dev.neocloudbites.com/my-orders?orderId=${orderId}" class="btn">View Order Details</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Order ${status} - #${orderId}`, content);

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `${currentConfig.icon} Order #${orderId} ${status} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  } else if (ADMIN_EMAIL) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Order #${orderId} status changed to ${status}`,
      html,
    });
  }
}

/**
 * 3. Meal Subscription Activation Notification
 */
export async function sendMealSubscriptionActivatedNotification(
  subscription: any,
  plan?: any,
  user?: any
) {
  const recipientEmail = user?.email || subscription?.user?.email;
  const customerName = user?.name || subscription?.user?.name || "Subscriber";
  const planName = plan?.name || subscription?.plan?.name || "Meal Subscription Plan";
  const startDateStr = subscription.startDate
    ? new Date(subscription.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Tomorrow";
  const address = subscription.deliveryAddress || "Address provided at subscription checkout";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-accepted">Subscription Active</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">Welcome to ${planName}!</h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">Deliveries begin on <strong>${startDateStr}</strong>.</p>
    </div>

    <div style="background-color: #F8FAFC; border-radius: 12px; padding: 18px; margin-bottom: 20px; border: 1px solid #E2E8F0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;">Hi <strong>${customerName}</strong>, your meal subscription has been confirmed and scheduled with the kitchen partner.</p>
      <p style="margin: 0; font-size: 13px; color: #64748B;"><strong>Delivery Address:</strong> ${address}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dev.neocloudbites.com/my-subscription" class="btn">Manage Subscription</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Subscription Activated - ${planName}`, content);

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: `✨ Meal Subscription Activated: ${planName} - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  }
}

/**
 * 4. Meal Slot Delivered with OTP confirmation Notification
 */
export async function sendMealSlotDeliveredNotification(
  subscription: any,
  slotName: string,
  user?: any
) {
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
}

/**
 * 5. Meal Subscription Pause / Resume Notification
 */
export async function sendSubscriptionPauseNotification(
  subscription: any,
  isPaused: boolean,
  pauseDays?: number,
  user?: any
) {
  const recipientEmail = user?.email || subscription?.user?.email;
  const customerName = user?.name || subscription?.user?.name || "Subscriber";
  const planName = subscription?.plan?.name || "Meal Plan";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge ${isPaused ? "badge-pending" : "badge-delivered"}">${isPaused ? "Paused" : "Resumed"}</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 6px 0;">
        ${isPaused ? `⏸️ Subscription Paused for ${pauseDays || 1} Days` : "▶️ Subscription Resumed!"}
      </h2>
      <p style="color: #64748B; font-size: 14px; margin: 0;">${planName}</p>
    </div>

    <p style="font-size: 14px; color: #334155;">
      Hi <strong>${customerName}</strong>, ${
        isPaused
          ? `your daily meal deliveries are temporarily paused for ${pauseDays || 1} day(s). Your validity has been extended automatically!`
          : "your meal deliveries have been resumed and will arrive according to your scheduled meal timings."
      }
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dev.neocloudbites.com/my-subscription" class="btn">View Subscription</a>
    </div>
  `;

  const html = wrapHtmlEmail(`Subscription ${isPaused ? "Paused" : "Resumed"}`, content);

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: isPaused ? `⏸️ Meal Subscription Paused - Neo Cloud Bites` : `▶️ Meal Subscription Resumed - Neo Cloud Bites`,
      html,
      bccAdmin: true,
    });
  }
}
