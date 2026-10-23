import nodemailer from "nodemailer";
import { getSmtpConfig } from "../src/lib/emailService";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  console.log("=================================================");
  console.log("📧 Neo Cloud Bites - Zoho ZeptoMail SMTP Test Tool");
  console.log("=================================================\n");

  const config = getSmtpConfig();

  console.log("Detected SMTP Configuration:");
  console.log(`  • Host:         ${config.host}`);
  console.log(`  • Port:         ${config.port}`);
  console.log(`  • Secure (SSL): ${config.secure ? "true (SSL 465)" : "false (STARTTLS 587)"}`);
  console.log(`  • Username:     ${config.user}`);
  console.log(`  • Password:     ${config.pass ? `${config.pass.slice(0, 4)}... (length: ${config.pass.length})` : "❌ NOT SET"}`);
  console.log(`  • From Address: ${config.from}`);
  console.log(`  • Admin Email:  ${config.adminEmail}\n`);

  if (!config.pass) {
    console.error("❌ Error: SMTP_PASS is missing in your .env file!");
    console.log("Add your ZeptoMail Send Mail Token password to backend/.env:");
    console.log('SMTP_PASS="PHt..."');
    process.exit(1);
  }

  console.log("🔌 Connecting to SMTP server & verifying credentials...");

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass.replace(/\s+/g, ""),
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  try {
    await transporter.verify();
    console.log("✅ Success: SMTP handshake & authentication verified successfully!\n");
  } catch (verifyErr: any) {
    console.error("❌ SMTP Verification Failed!");
    console.error("   Message:", verifyErr.message);
    if (verifyErr.code) console.error("   Code:   ", verifyErr.code);
    if (verifyErr.response) console.error("   Server: ", verifyErr.response);
    console.log("\nCommon fixes for Zoho ZeptoMail:");
    console.log("1. Check that SMTP_HOST is 'smtp.zeptomail.in' (or 'smtp.zeptomail.com').");
    console.log("2. Check that SMTP_PORT is 587 (TLS) or 465 (SSL).");
    console.log("3. Username is typically 'mailapikey' or 'emailapikey'.");
    console.log("4. Ensure your password is the full ZeptoMail Send Mail Token (starts with PHt).");
    process.exit(1);
  }

  const targetEmail = process.argv[2];
  if (targetEmail && targetEmail.includes("@")) {
    console.log(`📤 Sending test email to: ${targetEmail}...`);
    try {
      const info = await transporter.sendMail({
        from: config.from,
        to: targetEmail,
        subject: "🎉 Neo Cloud Bites - Zoho ZeptoMail SMTP Test",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #ff5500;">ZeptoMail SMTP is Working!</h2>
            <p>This is a test email sent from <strong>Neo Cloud Bites</strong> backend via Zoho ZeptoMail.</p>
            <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 13px; color: #64748b;">
              Server: <code>${config.host}:${config.port}</code><br/>
              Sender: <code>${config.from}</code><br/>
              Timestamp: ${new Date().toISOString()}
            </p>
          </div>
        `,
        text: `ZeptoMail SMTP is working! Sent from Neo Cloud Bites at ${new Date().toISOString()}`,
      });

      console.log(`✅ Test email delivered successfully!`);
      console.log(`   Message ID: ${info.messageId}`);
      if (info.response) console.log(`   Response:   ${info.response}`);
    } catch (sendErr: any) {
      console.error("❌ Failed to send test email:");
      console.error("   Message:", sendErr.message);
      if (sendErr.response) console.error("   Server: ", sendErr.response);
      console.log("\nNote: ZeptoMail requires your sender domain (@neocloudbites.com) to be verified in ZeptoMail.");
    }
  } else {
    console.log("💡 Tip: You can test sending an actual email by passing an email address:");
    console.log("   npx tsx scripts/test-smtp.ts your-email@gmail.com\n");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
