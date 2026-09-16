const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend HTTPS Email Client
const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'AURA <onboarding@resend.dev>';

// ----------------------------------------------------------------------------
// CORS Configuration
// Allows requests from local development, GitHub Pages, Render, and custom domains
// ----------------------------------------------------------------------------
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl) or any frontend origin
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
// HTML Email Templates (AURA Black / Deep-Red Aesthetic)
// ----------------------------------------------------------------------------

/**
 * Admin Notification Email Template
 * Dispatched to NOTIFICATION_EMAIL when a citizen reaches out.
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
                AURA Automated Notification Gateway &bull; Sent automatically upon visitor submission via Resend HTTPS API.
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
 * Dispatched to the EXACT email entered by the visitor in the chatbot.
 */
function buildVisitorEmailHtml({ name, reference, submissionTime, grievance }) {
  const displayName = name ? name.trim() : 'Friend';
  const grievanceSection = grievance ? `
    <div style="background-color:#0B0A0A; border:1px solid rgba(168,50,50,0.25); border-radius:8px; padding:16px 20px; margin-bottom:22px;">
      <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#C44747; font-weight:600;">Your Message</span>
      <p style="margin:8px 0 0 0; font-size:14px; color:#F3EDED; line-height:1.6; white-space:pre-wrap;">${grievance}</p>
    </div>
  ` : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>AURA has heard you — ${reference}</title>
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
                <div style="background-color:#0B0A0A; border:1px solid rgba(168,50,50,0.28); border-radius:10px; padding:18px 22px; margin-bottom:20px;">
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

                ${grievanceSection}

                <p style="margin:0 0 4px 0; font-style:italic; font-size:14px; color:#C44747; text-align:center;">
                  "Everyone deserves to be heard."
                </p>

                <p style="margin:0 0 20px 0; font-size:13px; color:#A9A0A0; text-align:center;">
                  — AURA, Guardian of Unheard Voices
                </p>

                <!-- Clear Disclaimer -->
                <div style="border-top:1px solid rgba(143,37,37,0.2); padding-top:16px; font-size:11px; line-height:1.55; color:#787070; text-align:center;">
                  <strong>Disclaimer:</strong> AURA is a creative project and fictional superhero sanctuary interface. It does not provide medical, legal, or professional crisis intervention services. If you are in immediate distress or facing an emergency, please connect with certified local emergency response services.
                </div>
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
 * Dispatched to the EXACT email entered by the visitor in the chatbot.
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
    <title>AURA — Your Guidance | ${reference}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0B0A0A; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#F3EDED;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0A0A; padding:30px 15px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#161313; border:1px solid rgba(168,50,50,0.35); border-radius:14px; overflow:hidden; box-shadow:0 12px 35px rgba(0,0,0,0.8);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding:34px 36px 20px 36px; background:linear-gradient(180deg, rgba(143,37,37,0.2) 0%, rgba(22,19,19,0) 100%); border-bottom:1px solid rgba(143,37,37,0.25);">
                <div style="width:44px; height:44px; border-radius:50%; background:rgba(143,37,37,0.25); border:1px solid rgba(196,71,71,0.5); display:inline-block; line-height:44px; text-align:center; font-size:20px; color:#C44747; margin-bottom:12px;">
                  🛡️
                </div>
                <h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:0.06em; color:#F3EDED;">
                  AURA
                </h1>
                <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:#C44747; font-weight:600;">
                  Guardian of Unheard Voices
                </p>
                <p style="margin:12px 0 0 0; font-style:italic; font-size:13px; color:#A9A0A0;">
                  "I heard you."
                </p>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding:26px 36px 10px 36px; font-size:15px; line-height:1.7; color:#F3EDED;">
                <p style="margin:0; font-size:16px;">
                  Hello <strong>${displayName}</strong>,
                </p>
                <p style="margin:8px 0 0 0; font-size:14px; color:#A9A0A0;">
                  Thank you for trusting AURA with your words. Here is the guidance I prepared for you.
                </p>
              </td>
            </tr>

            ${grievanceBlock}

            <!-- AURA's Guidance -->
            <tr>
              <td style="padding:10px 36px 24px 36px;">
                <h3 style="margin:0 0 10px 0; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#C44747; font-weight:700;">
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
                <strong>Disclaimer:</strong> This email is a follow-up from AURA and is not a replacement for professional emergency, mental-health, or medical assistance. If you are experiencing a crisis, please contact local emergency support services.
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
    service: 'AURA backend',
    emailEngine: 'Resend HTTPS API'
  });
});

/**
 * POST /api/submit-grievance
 * 
 * Flow:
 * 1. Extract visitor info from request body.
 * 2. Validate email and grievance.
 * 3. Generate reference number (AURA-XXXX) and submission timestamp.
 * 4. Send VISITOR confirmation email to the exact email address entered in the chatbot.
 * 5. Send ADMIN alert notification to NOTIFICATION_EMAIL.
 * 6. Return JSON success response.
 */
app.post('/api/submit-grievance', async (req, res) => {
  try {
    const { name, age, location, email, grievance } = req.body || {};

    // Validate email
    const visitorEmail = (email || '').trim();
    if (!visitorEmail || !visitorEmail.includes('@') || !visitorEmail.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    // Validate grievance
    const visitorGrievance = (grievance || '').trim();
    if (!visitorGrievance) {
      return res.status(400).json({
        success: false,
        message: 'Please provide details of your grievance or request.'
      });
    }

    const visitorName = (name || '').trim() || 'Friend';
    const visitorAge = (age || '').trim() || 'Not specified';
    const visitorLocation = (location || '').trim() || 'Not specified';

    // 1. Generate unique reference ID on the server (AURA-XXXX)
    const reference = generateReferenceNumber();

    // 2. Generate submission timestamp on the server
    const submissionTime = formatServerTimestamp();

    // 3. Verify Resend Client Configuration
    if (!resend) {
      console.warn('⚠️ [AURA Server] RESEND_API_KEY is not configured in backend/.env.');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please set RESEND_API_KEY in environment variables.'
      });
    }

    console.log(`📨 [AURA Server] Dispatching emails via Resend for submission ${reference}...`);
    console.log(`   Visitor recipient (from chat): ${visitorEmail}`);

    // 4. Send VISITOR Confirmation Email (Must go to the exact email entered in chat)
    const visitorEmailPromise = resend.emails.send({
      from: SENDER_EMAIL,
      to: [visitorEmail],
      subject: `AURA has heard you — ${reference}`,
      html: buildVisitorEmailHtml({
        name: visitorName,
        reference,
        submissionTime,
        grievance: visitorGrievance
      })
    });

    // 5. Send ADMIN Notification Email (to NOTIFICATION_EMAIL if configured)
    const adminEmail = (process.env.NOTIFICATION_EMAIL || '').trim();
    let adminEmailPromise = null;
    if (adminEmail && adminEmail.includes('@')) {
      console.log(`   Admin recipient: ${adminEmail}`);
      adminEmailPromise = resend.emails.send({
        from: SENDER_EMAIL,
        to: [adminEmail],
        subject: `🚨 Someone Needs Your Help! | ${reference}`,
        html: buildAdminEmailHtml({
          name: visitorName,
          age: visitorAge,
          location: visitorLocation,
          email: visitorEmail,
          grievance: visitorGrievance,
          reference,
          submissionTime
        })
      });
    }

    // Execute email sends
    const [visitorResult, adminResult] = await Promise.all([
      visitorEmailPromise.catch(err => ({ error: err })),
      adminEmailPromise ? adminEmailPromise.catch(err => ({ error: err })) : Promise.resolve({ data: null })
    ]);

    // Check for Resend errors on visitor confirmation
    if (visitorResult && visitorResult.error) {
      console.error('❌ [AURA Server] Resend error delivering to visitor email:', visitorResult.error);
      return res.status(502).json({
        success: false,
        message: visitorResult.error.message || 'Unable to deliver confirmation email to your address. Please try again.'
      });
    }

    if (adminResult && adminResult.error) {
      console.warn('⚠️ [AURA Server] Resend notice for admin email:', adminResult.error.message || adminResult.error);
    }

    console.log(`✅ [AURA Server] Successfully dispatched confirmation email for ${reference} to ${visitorEmail}.`);

    return res.status(200).json({
      success: true,
      reference,
      submissionTime
    });

  } catch (error) {
    console.error('❌ [AURA Server] Unexpected error handling grievance submission:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred while processing your request. Please try again.'
    });
  }
});

/**
 * POST /api/send-guidance
 * 
 * Dispatches personalized guidance text to the visitor's email address collected in chat.
 */
app.post('/api/send-guidance', async (req, res) => {
  try {
    const { name, email, grievance, guidance, reference } = req.body || {};

    // Validation
    const visitorName = (name || '').trim() || 'Friend';
    const visitorEmail = (email || '').trim();
    const visitorGuidance = (guidance || '').trim();
    const refCode = (reference || '').trim() || generateReferenceNumber();

    if (!visitorEmail || !visitorEmail.includes('@') || !visitorEmail.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'A valid visitor email address is required.'
      });
    }

    if (!visitorGuidance) {
      return res.status(400).json({
        success: false,
        message: 'Guidance content is required.'
      });
    }

    // Verify Resend Client Configuration
    if (!resend) {
      console.warn('⚠️ [AURA Server] RESEND_API_KEY is not configured in backend/.env.');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please set RESEND_API_KEY in environment variables.'
      });
    }

    console.log(`📨 [AURA Server] Dispatching guidance email for ${refCode} to visitor: ${visitorEmail}...`);

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [visitorEmail],
      subject: `AURA — Your Guidance | ${refCode}`,
      html: buildGuidanceEmailHtml({
        name: visitorName,
        email: visitorEmail,
        grievance: (grievance || '').trim(),
        guidance: visitorGuidance,
        reference: refCode
      })
    });

    if (error) {
      console.error('❌ [AURA Server] Resend error delivering guidance email:', error);
      return res.status(502).json({
        success: false,
        message: error.message || 'Unable to deliver guidance email. Please try again.'
      });
    }

    console.log(`✅ [AURA Server] Guidance email successfully dispatched for ${refCode} to ${visitorEmail}.`);

    return res.status(200).json({
      success: true,
      message: 'Guidance email dispatched successfully.',
      reference: refCode
    });

  } catch (error) {
    console.error('❌ [AURA Server] Unexpected error sending guidance email:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred while sending your guidance email.'
    });
  }
});

// ----------------------------------------------------------------------------
// Start Server
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`🛡️ AURA Backend Server running on http://localhost:${PORT}`);
  console.log(`Email Transport: Resend HTTPS API (Sender: ${SENDER_EMAIL})`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Submission endpoint: POST http://localhost:${PORT}/api/submit-grievance`);
  console.log(`Guidance endpoint: POST http://localhost:${PORT}/api/send-guidance`);
  console.log('=======================================================');
});
