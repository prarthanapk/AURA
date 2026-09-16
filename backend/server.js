const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------------------------------
// CORS Configuration
// Restrict to local development origins
// ----------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:8085',
  'http://127.0.0.1:8085',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl) or any frontend origin (localhost, GitHub Pages, custom domains)
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ----------------------------------------------------------------------------
// Helper Functions: Reference ID & Timestamp
// ----------------------------------------------------------------------------
function generateReferenceNumber() {
  const randCode = Math.floor(1000 + Math.random() * 9000);
  return `AURA-${randCode}`;
}

function formatServerTimestamp() {
  const now = new Date();
  const day = now.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

// ----------------------------------------------------------------------------
// Nodemailer Transporter Factory
// ----------------------------------------------------------------------------
function createSmtpTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // true for 465, false for 587 or other ports
    auth: {
      user: user,
      pass: pass
    }
  });
}

// ----------------------------------------------------------------------------
// HTML Email Templates (AURA Black / Deep-Red Aesthetic)
// ----------------------------------------------------------------------------

/**
 * Admin Notification Email Template
 */
function buildAdminEmailHtml({ name, age, location, email, grievance, reference, submissionTime }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>🚨 Someone Needs Your Help! | ${reference}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0B0A0A; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#F3EDED;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0A0A; padding:30px 15px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#161313; border:1px solid rgba(168,50,50,0.35); border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.8);">
            
            <!-- Header -->
            <tr>
              <td style="padding:32px 36px 20px 36px; border-bottom:1px solid rgba(143,37,37,0.25); background:linear-gradient(180deg, rgba(143,37,37,0.18) 0%, rgba(22,19,19,0) 100%);">
                <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#C44747; font-weight:700; margin-bottom:6px;">
                  🚨 SOMEONE NEEDS YOUR HELP!
                </div>
                <h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:0.04em; color:#F3EDED;">
                  AURA — GUARDIAN OF UNHEARD VOICES
                </h1>
                <p style="margin:6px 0 0 0; font-size:13px; color:#A9A0A0;">
                  A visitor has requested your superhero help through AURA.
                </p>
              </td>
            </tr>

            <!-- Request Details Banner -->
            <tr>
              <td style="padding:16px 36px; background-color:#121010; border-bottom:1px solid rgba(143,37,37,0.2);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#A9A0A0;">Reference ID</span><br>
                      <strong style="font-size:15px; color:#C44747;">${reference}</strong>
                    </td>
                    <td align="right">
                      <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#A9A0A0;">Submitted At</span><br>
                      <strong style="font-size:13px; color:#F3EDED;">${submissionTime}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Visitor Details -->
            <tr>
              <td style="padding:26px 36px 14px 36px;">
                <h3 style="margin:0 0 14px 0; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#C44747;">
                  VISITOR DETAILS
                </h3>
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px; color:#F3EDED;">
                  <tr>
                    <td width="110" style="color:#A9A0A0; padding-left:0;">Name:</td>
                    <td style="font-weight:600;">${name || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="color:#A9A0A0; padding-left:0;">Age:</td>
                    <td>${age || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="color:#A9A0A0; padding-left:0;">Location:</td>
                    <td>${location || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style="color:#A9A0A0; padding-left:0;">Email:</td>
                    <td><a href="mailto:${email}" style="color:#C44747; text-decoration:none; font-weight:600;">${email}</a></td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Their Message -->
            <tr>
              <td style="padding:10px 36px 28px 36px;">
                <h3 style="margin:0 0 12px 0; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#C44747;">
                  THEIR MESSAGE
                </h3>
                <div style="background-color:#0B0A0A; border:1px solid rgba(168,50,50,0.28); border-radius:8px; padding:18px 20px; font-size:14px; line-height:1.65; color:#F3EDED; white-space:pre-wrap;">${grievance}</div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 36px; background-color:#0E0C0C; border-top:1px solid rgba(143,37,37,0.2); font-size:11px; color:#6e6767; text-align:center;">
                AURA Automated Notification Gateway &bull; Sent automatically upon visitor submission.
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

/**
 * Visitor Confirmation Email Template
 */
function buildVisitorEmailHtml({ name, reference, submissionTime }) {
  const displayName = name ? name.trim() : 'Friend';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>AURA has heard you</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0B0A0A; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#F3EDED;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0A0A; padding:30px 15px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#161313; border:1px solid rgba(168,50,50,0.35); border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.8);">
            
            <!-- Crest & Brand Header -->
            <tr>
              <td align="center" style="padding:36px 36px 20px 36px; background:linear-gradient(180deg, rgba(143,37,37,0.2) 0%, rgba(22,19,19,0) 100%);">
                <div style="width:48px; height:48px; border-radius:50%; background:rgba(143,37,37,0.25); border:1px solid rgba(196,71,71,0.5); display:inline-block; line-height:48px; text-align:center; font-size:22px; color:#C44747; margin-bottom:14px;">
                  🛡️
                </div>
                <h1 style="margin:0; font-size:24px; font-weight:700; letter-spacing:0.08em; color:#F3EDED;">
                  AURA
                </h1>
                <p style="margin:4px 0 0 0; font-size:12px; text-transform:uppercase; letter-spacing:0.18em; color:#C44747; font-weight:600;">
                  Guardian of Unheard Voices
                </p>
              </td>
            </tr>

            <!-- Personal Message Body -->
            <tr>
              <td style="padding:24px 36px 28px 36px; font-size:15px; line-height:1.7; color:#F3EDED;">
                <p style="margin:0 0 16px 0; font-size:16px;">
                  Hi <strong>${displayName}</strong>,
                </p>

                <p style="margin:0 0 16px 0; font-weight:600; color:#F3EDED;">
                  Your message has reached AURA.
                </p>

                <p style="margin:0 0 12px 0; color:#A9A0A0;">
                  You don't have to explain everything perfectly.<br>
                  You don't have to have all the answers.
                </p>

                <p style="margin:0 0 24px 0; font-size:16px; color:#C44747; font-weight:600;">
                  Your voice has been heard.
                </p>

                <!-- Receipt Box -->
                <div style="background-color:#0B0A0A; border:1px solid rgba(168,50,50,0.28); border-radius:10px; padding:18px 22px; margin-bottom:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                    <tr>
                      <td style="padding-bottom:10px;">
                        <span style="color:#A9A0A0; font-size:11px; text-transform:uppercase; letter-spacing:0.1em;">Reference Number</span><br>
                        <strong style="font-size:16px; color:#F3EDED; letter-spacing:0.05em;">${reference}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span style="color:#A9A0A0; font-size:11px; text-transform:uppercase; letter-spacing:0.1em;">Submitted At</span><br>
                        <strong style="color:#A9A0A0;">${submissionTime}</strong>
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="margin:0 0 4px 0; font-style:italic; font-size:14px; color:#C44747; text-align:center;">
                  "Everyone deserves to be heard."
                </p>

                <p style="margin:0; font-size:13px; color:#A9A0A0; text-align:center;">
                  — AURA, Guardian of Unheard Voices
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 36px; background-color:#0E0C0C; border-top:1px solid rgba(143,37,37,0.2); font-size:11px; color:#6e6767; text-align:center;">
                Confidential Automated Confirmation &bull; AURA Sanctuary
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

/**
 * Visitor Guidance Email Template
 */
function buildGuidanceEmailHtml({ name, grievance, guidance, reference }) {
  const displayName = name ? name.trim() : 'Friend';
  const grievanceBlock = grievance && grievance.trim() ? `
    <!-- Your Message -->
    <tr>
      <td style="padding:10px 36px 18px 36px;">
        <h3 style="margin:0 0 10px 0; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#C44747; font-weight:700;">
          YOUR MESSAGE
        </h3>
        <div style="background-color:#0B0A0A; border:1px solid rgba(168,50,50,0.25); border-radius:8px; padding:14px 18px; font-size:13px; line-height:1.6; color:#A9A0A0; white-space:pre-wrap;">${grievance.trim()}</div>
      </td>
    </tr>
  ` : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>AURA — Your Guidance</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0B0A0A; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#F3EDED;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0A0A; padding:30px 15px;">
      <tr>
        <td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#161313; border:1px solid rgba(168,50,50,0.35); border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.8);">
            
            <!-- Crest & Brand Header -->
            <tr>
              <td align="center" style="padding:36px 36px 18px 36px; background:linear-gradient(180deg, rgba(143,37,37,0.22) 0%, rgba(22,19,19,0) 100%);">
                <div style="width:48px; height:48px; border-radius:50%; background:rgba(143,37,37,0.25); border:1px solid rgba(196,71,71,0.5); display:inline-block; line-height:48px; text-align:center; font-size:22px; color:#C44747; margin-bottom:12px;">
                  🛡️
                </div>
                <h1 style="margin:0; font-size:24px; font-weight:700; letter-spacing:0.08em; color:#F3EDED;">
                  AURA
                </h1>
                <p style="margin:4px 0 0 0; font-size:12px; text-transform:uppercase; letter-spacing:0.18em; color:#C44747; font-weight:600;">
                  Guardian of Unheard Voices
                </p>
                <p style="margin:16px 0 0 0; font-size:17px; font-style:italic; color:#F3EDED; font-weight:500;">
                  "I heard you."
                </p>
              </td>
            </tr>

            <!-- Personal Greeting -->
            <tr>
              <td style="padding:22px 36px 14px 36px; font-size:15px; line-height:1.6; color:#F3EDED;">
                <p style="margin:0 0 10px 0; font-size:16px;">
                  Hello <strong>${displayName}</strong>,
                </p>
                <p style="margin:0; color:#A9A0A0; font-size:14px;">
                  Thank you for trusting AURA with your words.
                </p>
              </td>
            </tr>

            ${grievanceBlock}

            <!-- AURA's Guidance -->
            <tr>
              <td style="padding:10px 36px 22px 36px;">
                <h3 style="margin:0 0 12px 0; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#C44747; font-weight:700;">
                  AURA'S GUIDANCE
                </h3>
                <div style="background-color:#0B0A0A; border:1px solid rgba(196,71,71,0.35); border-left:4px solid #C44747; border-radius:8px; padding:20px 22px; font-size:14px; line-height:1.75; color:#F3EDED; white-space:pre-wrap;">${guidance.trim()}</div>
              </td>
            </tr>

            <!-- Reference Section -->
            <tr>
              <td style="padding:14px 36px 20px 36px; background-color:#121010; border-top:1px solid rgba(143,37,37,0.2); border-bottom:1px solid rgba(143,37,37,0.2);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#A9A0A0;">REFERENCE</span><br>
                      <strong style="font-size:15px; color:#C44747; letter-spacing:0.06em;">${reference}</strong>
                    </td>
                    <td align="right">
                      <span style="font-size:12px; font-style:italic; color:#A9A0A0;">"Everyone deserves to be heard."</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Disclaimer & Footer -->
            <tr>
              <td style="padding:18px 36px; background-color:#0E0C0C; font-size:11px; line-height:1.55; color:#6e6767; text-align:center;">
                This email is a follow-up from AURA and is not a replacement for professional emergency or medical assistance.
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

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AURA backend'
  });
});

/**
 * POST /api/submit-grievance
 */
app.post('/api/submit-grievance', async (req, res) => {
  try {
    const { name, age, location, email, candidateEmail, grievance } = req.body || {};

    // Basic Validation
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.'
      });
    }

    if (!grievance || !grievance.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide details of your grievance or request.'
      });
    }

    // 1. Generate unique reference ID on the server (AURA-XXXX)
    const reference = generateReferenceNumber();

    // 2. Generate submission timestamp on the server
    const submissionTime = formatServerTimestamp();

    // 3. Setup Nodemailer Transporter
    const transporter = createSmtpTransporter();
    const adminEmail = (process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || '').trim();

    if (!transporter) {
      console.warn('⚠️ [AURA Server] SMTP credentials are not configured in backend/.env. Emails cannot be dispatched.');
      return res.status(500).json({
        success: false,
        error: 'SMTP credentials are not configured in backend/.env. Please set SMTP_USER and SMTP_PASSWORD to enable real email dispatch.'
      });
    }

    // Candidate recipient email is set according to the email provided in the chat
    const targetCandidateEmail = (candidateEmail || email).trim();
    // Dispatch alert to candidate recipient from chat, plus configured admin email if different
    const candidateAlertRecipients = Array.from(
      new Set([targetCandidateEmail, adminEmail].filter(Boolean))
    ).join(', ');

    console.log(`📨 [AURA Server] Sending emails for submission ${reference}...`);
    console.log(`   Candidate Recipient: ${targetCandidateEmail}`);
    console.log(`   Alert Recipient(s): ${candidateAlertRecipients}`);
    console.log(`   Visitor Recipient: ${email.trim()}`);

    // 4. Send Email to Candidate Recipient ("🚨 Someone Needs Your Help!")
    const adminMailOptions = {
      from: `"AURA Sanctuary" <${process.env.SMTP_USER}>`,
      to: candidateAlertRecipients,
      subject: `🚨 Someone Needs Your Help! | ${reference}`,
      html: buildAdminEmailHtml({
        name: name || 'Anonymous',
        age: age || 'Not specified',
        location: location || 'Not specified',
        email: email.trim(),
        grievance: grievance.trim(),
        reference,
        submissionTime
      })
    };

    // 5. Send Confirmation Email to Visitor
    const visitorMailOptions = {
      from: `"AURA Guardian" <${process.env.SMTP_USER}>`,
      to: email.trim(),
      subject: `AURA has heard you — ${reference}`,
      html: buildVisitorEmailHtml({
        name: name || 'Friend',
        reference,
        submissionTime
      })
    };

    // Execute both sends in parallel
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(visitorMailOptions)
    ]);

    console.log(`✅ [AURA Server] Emails successfully sent for ${reference} to Admin and Visitor (${email}).`);

    return res.status(200).json({
      success: true,
      reference,
      submissionTime
    });

  } catch (error) {
    console.error('❌ [AURA Server] Error handling grievance submission:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to dispatch email. Please verify SMTP settings.'
    });
  }
});

/**
 * POST /api/send-guidance
 */
app.post('/api/send-guidance', async (req, res) => {
  try {
    const { name, email, grievance, guidance, reference } = req.body || {};

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Visitor name is required.'
      });
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.'
      });
    }

    if (!guidance || !guidance.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Guidance content is required.'
      });
    }

    if (!reference || !reference.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Reference ID is required.'
      });
    }

    // Setup Nodemailer Transporter
    const transporter = createSmtpTransporter();

    if (!transporter) {
      console.warn('⚠️ [AURA Server] SMTP credentials are not configured in backend/.env. Cannot send guidance email.');
      return res.status(500).json({
        success: false,
        error: 'SMTP credentials are not configured in backend/.env.'
      });
    }

    console.log(`📨 [AURA Server] Sending guidance email for ${reference} to ${email}...`);

    const mailOptions = {
      from: `"AURA Guardian" <${process.env.SMTP_USER}>`,
      to: email.trim(),
      subject: `AURA — Your Guidance | ${reference.trim()}`,
      html: buildGuidanceEmailHtml({
        name: name.trim(),
        email: email.trim(),
        grievance: grievance ? grievance.trim() : '',
        guidance: guidance.trim(),
        reference: reference.trim()
      })
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ [AURA Server] Guidance email successfully sent for ${reference} to ${email}.`);

    return res.status(200).json({
      success: true,
      message: 'Guidance email dispatched successfully.',
      reference: reference.trim()
    });

  } catch (error) {
    console.error('❌ [AURA Server] Error sending guidance email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to dispatch guidance email. Please verify SMTP settings.'
    });
  }
});

// ----------------------------------------------------------------------------
// Start Server
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️ AURA Backend Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Submission endpoint: POST http://localhost:${PORT}/api/submit-grievance`);
  console.log(`Guidance endpoint: POST http://localhost:${PORT}/api/send-guidance`);
  console.log(`=======================================================`);
});

