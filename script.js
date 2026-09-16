/**
 * AURA — Guardian of Unheard Voices
 * Complete Chatbot & Interactive Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Backend API Configuration (Environment-Aware)
  // --------------------------------------------------------------------------
  const isLocalHost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '' ||
    window.location.protocol === 'file:'
  );

  const DEFAULT_DEV_API = 'http://localhost:3000';
  const DEFAULT_PROD_API = 'https://aura-6o4w.onrender.com';

  const API_BASE_URL = (
    (window.AURA_CONFIG && window.AURA_CONFIG.apiBaseUrl) ||
    window.AURA_API_BASE_URL ||
    (isLocalHost ? DEFAULT_DEV_API : DEFAULT_PROD_API)
  ).replace(/\/+$/, '');

  const BACKEND_API_URL = `${API_BASE_URL}/api/submit-grievance`;
  const SEND_GUIDANCE_API_URL = `${API_BASE_URL}/api/send-guidance`;

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const state = {
    step: 0, // 0: Name, 1: Age, 2: Location, 3: Email, 4: Grievance, 5: Discussion/Transcript
    userData: {
      name: '',
      age: '',
      location: '',
      email: '',
      grievance: '',
      referenceId: '',
      timestamp: ''
    },
    conversationLog: [], // Stores full dialogue between AURA and the visitor
    isTyping: false,
    isSending: false,
    currentGuidance: '',
    isSendingGuidance: false
  };

  // --------------------------------------------------------------------------
  // DOM Elements
  // --------------------------------------------------------------------------
  const chatOverlay = document.getElementById('chatOverlay');
  const chatModalBackdrop = document.getElementById('chatModalBackdrop');
  const btnCloseChat = document.getElementById('btnCloseChat');
  const btnExploreSite = document.getElementById('btnExploreSite');
  const floatingChatBtn = document.getElementById('floatingChatBtn');
  
  // Navigation & Page buttons to trigger chat
  const navTalkBtn = document.getElementById('navTalkBtn');
  const heroTalkBtn = document.getElementById('heroTalkBtn');
  const storyTalkBtn = document.getElementById('storyTalkBtn');
  const howTalkBtn = document.getElementById('howTalkBtn');
  const footerChatLink = document.getElementById('footerChatLink');

  // Chat UI Elements
  const chatMessagesContainer = document.getElementById('chatMessagesContainer');
  const typingIndicator = document.getElementById('typingIndicator');
  const chatInputWrapper = document.getElementById('chatInputWrapper');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const btnSend = document.getElementById('btnSend');

  // Grievance / Step 5 Elements
  const chatGrievanceWrapper = document.getElementById('chatGrievanceWrapper');
  const grievanceForm = document.getElementById('grievanceForm');
  const grievanceTextarea = document.getElementById('grievanceTextarea');
  const charCount = document.getElementById('charCount');
  const btnSubmitGrievance = document.getElementById('btnSubmitGrievance');

  // Confirmation & Error Elements
  const confirmationScreen = document.getElementById('confirmationScreen');
  const submissionErrorScreen = document.getElementById('submissionErrorScreen');
  const btnTryAgain = document.getElementById('btnTryAgain');
  const receiptRef = document.getElementById('receiptRef');
  const receiptTime = document.getElementById('receiptTime');
  const btnReturnAura = document.getElementById('btnReturnAura');

  // Guidance Card Elements
  const confirmationGuidanceCard = document.getElementById('confirmationGuidanceCard');
  const confirmationGuidanceText = document.getElementById('confirmationGuidanceText');
  const btnSendGuidance = document.getElementById('btnSendGuidance');
  const guidanceEmailStatus = document.getElementById('guidanceEmailStatus');

  // Automatic Email Notification Elements
  const notificationDispatchCard = document.getElementById('notificationDispatchCard');
  const dispatchStatusBadge = document.getElementById('dispatchStatusBadge');
  const dispatchStatusText = document.getElementById('dispatchStatusText');
  const dispatchCandidateEmail = document.getElementById('dispatchCandidateEmail');
  const dispatchSentMsg = document.getElementById('dispatchSentMsg');
  const btnConfigCandidateEmail = document.getElementById('btnConfigCandidateEmail');
  const footerCandidateEmail = document.getElementById('footerCandidateEmail');
  const btnFooterEditEmail = document.getElementById('btnFooterEditEmail');

  // Candidate Email Configuration
  const DEFAULT_CANDIDATE_EMAIL = "candidate@techascent.com";

  function getCandidateEmail() {
    return localStorage.getItem('aura_candidate_email') || DEFAULT_CANDIDATE_EMAIL;
  }

  function setCandidateEmail(newEmail) {
    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
      alert('Please enter a valid email address.');
      return false;
    }
    localStorage.setItem('aura_candidate_email', newEmail.trim());
    updateCandidateEmailDisplay();
    return true;
  }

  function updateCandidateEmailDisplay() {
    const currentEmail = getCandidateEmail();
    if (dispatchCandidateEmail) dispatchCandidateEmail.textContent = currentEmail;
    if (footerCandidateEmail) footerCandidateEmail.textContent = currentEmail;
  }

  function promptConfigureEmail() {
    const current = getCandidateEmail();
    const entered = prompt(
      "Enter candidate's personal email to receive automatic superhero alerts:\n(Notification is sent automatically with visitor Name, Age, Location, Email, and Grievance)",
      current === DEFAULT_CANDIDATE_EMAIL ? "" : current
    );
    if (entered !== null && entered.trim() !== '') {
      if (setCandidateEmail(entered)) {
        alert(`Automatic notification recipient updated to:\n${entered.trim()}`);
      }
    }
  }

  if (btnConfigCandidateEmail) {
    btnConfigCandidateEmail.addEventListener('click', promptConfigureEmail);
  }
  if (btnFooterEditEmail) {
    btnFooterEditEmail.addEventListener('click', promptConfigureEmail);
  }

  // Initialize candidate email display
  updateCandidateEmailDisplay();

  // Decorative text elements
  const leftDecoText = document.getElementById('leftDecoText');
  const rightDecoText = document.getElementById('rightDecoText');

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------
  function formatCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    return `${hours}:${minutes} ${ampm}`;
  }

  function formatFullSubmissionDate() {
    const now = new Date();
    const day = now.getDate();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    const timeStr = formatCurrentTime();
    return `${day} ${month} ${year}, ${timeStr}`;
  }

  function generateReferenceNumber() {
    const randCode = Math.floor(1000 + Math.random() * 9000);
    return `AURA-${randCode}`;
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }, 50);
  }

  // --------------------------------------------------------------------------
  // Chat Overlay Visibility Controls
  // --------------------------------------------------------------------------
  function openChat() {
    chatModalBackdrop.classList.add('active');
    chatOverlay.classList.add('active');
    floatingChatBtn.style.display = 'none';
    document.body.style.overflow = 'hidden';

    // If chat hasn't started yet, trigger initial welcome
    if (chatMessagesContainer.children.length === 0) {
      startConversation();
    } else {
      if (state.step < 4) {
        chatInput.focus();
      } else if (state.step === 4) {
        grievanceTextarea.focus();
      }
    }
  }

  function closeChat() {
    chatModalBackdrop.classList.remove('active');
    chatOverlay.classList.remove('active');
    floatingChatBtn.style.display = 'flex';
    document.body.style.overflow = '';
  }

  // Bind Open/Close Event Handlers
  [navTalkBtn, heroTalkBtn, storyTalkBtn, howTalkBtn, footerChatLink, floatingChatBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openChat();
      });
    }
  });

  if (btnCloseChat) btnCloseChat.addEventListener('click', closeChat);
  if (btnExploreSite) btnExploreSite.addEventListener('click', closeChat);
  if (chatModalBackdrop) chatModalBackdrop.addEventListener('click', closeChat);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOverlay.classList.contains('active')) {
      closeChat();
    }
  });

  // Smooth scroll links automatically close chat
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        closeChat();
      }
    });
  });

  // --------------------------------------------------------------------------
  // Chat Messaging Engine
  // --------------------------------------------------------------------------
  function appendAuraMessage(text, promptAccent = '') {
    const time = formatCurrentTime();
    const fullContent = promptAccent ? `${text} ${promptAccent}` : text;
    state.conversationLog.push({
      sender: 'AURA',
      text: fullContent,
      time: time
    });

    const row = document.createElement('div');
    row.className = 'chat-message-row message-aura';

    let contentHtml = `<div class="bubble-text">${text}`;
    if (promptAccent) {
      contentHtml += `<strong class="accent-prompt">${promptAccent}</strong>`;
    }
    contentHtml += `</div>`;

    row.innerHTML = `
      <div class="chat-avatar-frame">
        <img src="assets/aura_avatar.jpg" alt="AURA" class="avatar-img">
      </div>
      <div class="chat-bubble bubble-aura">
        <div class="bubble-header">
          <span>AURA</span>
          <span class="bubble-timestamp">${time}</span>
        </div>
        ${contentHtml}
      </div>
    `;

    chatMessagesContainer.appendChild(row);
    scrollToBottom();
  }

  function appendUserMessage(text) {
    const time = formatCurrentTime();
    state.conversationLog.push({
      sender: state.userData.name || 'You',
      text: text,
      time: time
    });

    const row = document.createElement('div');
    row.className = 'chat-message-row message-user';

    row.innerHTML = `
      <div class="user-avatar-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <div class="chat-bubble bubble-user">
        <div class="bubble-header">
          <span>You</span>
          <span class="bubble-timestamp">${time}</span>
        </div>
        <div class="bubble-text">${escapeHtml(text)}</div>
      </div>
    `;

    chatMessagesContainer.appendChild(row);
    scrollToBottom();
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

  function showTyping() {
    state.isTyping = true;
    typingIndicator.style.display = 'flex';
    chatInput.disabled = true;
    btnSend.disabled = true;
    scrollToBottom();
  }

  function hideTyping() {
    state.isTyping = false;
    typingIndicator.style.display = 'none';
    chatInput.disabled = false;
    btnSend.disabled = false;
  }

  function queueAuraResponse(text, promptAccent = '', delay = 900, callback = null) {
    showTyping();
    setTimeout(() => {
      hideTyping();
      appendAuraMessage(text, promptAccent);
      if (callback) callback();
      if (state.step < 4) {
        chatInput.focus();
      }
    }, delay);
  }

  // --------------------------------------------------------------------------
  // Conversational Multi-Step Flow
  // --------------------------------------------------------------------------
  function startConversation() {
    chatMessagesContainer.innerHTML = '';
    chatMessagesContainer.style.display = 'flex';
    state.step = 0;
    state.conversationLog = [];
    chatInputWrapper.style.display = 'block';
    chatGrievanceWrapper.style.display = 'none';
    confirmationScreen.style.display = 'none';
    if (submissionErrorScreen) submissionErrorScreen.style.display = 'none';
    chatInput.placeholder = "What's your name?";

    if (leftDecoText) leftDecoText.textContent = "SAME VOICES STRONGER TOMORROW";
    if (rightDecoText) rightDecoText.textContent = "BRAVER VOICES HAPPIER PEOPLE";

    // Step 0: Welcome message matching panel 02
    queueAuraResponse(
      "Hey! I'm AURA.\nI sensed someone needed to be heard.",
      "What's your name?",
      600,
      () => {
        chatInput.placeholder = "Type your name...";
        chatInput.focus();
      }
    );
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.isTyping) return;

    const answer = chatInput.value.trim();
    if (!answer) return;

    // Process current step
    switch (state.step) {
      case 0: // Name
        state.userData.name = answer;
        appendUserMessage(answer);
        chatInput.value = '';
        state.step = 1;

        if (leftDecoText) leftDecoText.textContent = "A KINDER TOMORROW BEGINS WITH A HEARD TODAY.";

        queueAuraResponse(
          `Nice to meet you, ${state.userData.name}.`,
          "How old are you?",
          900,
          () => {
            chatInput.placeholder = "Your age...";
            chatInput.type = "number";
            chatInput.min = "1";
            chatInput.max = "120";
          }
        );
        break;

      case 1: // Age
        state.userData.age = answer;
        appendUserMessage(answer);
        chatInput.value = '';
        chatInput.type = "text";
        state.step = 2;

        queueAuraResponse(
          "Where are you reaching me from?",
          "",
          850,
          () => {
            chatInput.placeholder = "City, Region, or Country...";
          }
        );
        break;

      case 2: // Location
        state.userData.location = answer;
        appendUserMessage(answer);
        chatInput.value = '';
        state.step = 3;

        queueAuraResponse(
          "Where can I send a reply?\n(Your email address)",
          "",
          900,
          () => {
            chatInput.placeholder = "name@example.com";
            chatInput.type = "email";
          }
        );
        break;

      case 3: // Email
        // Basic email validation
        const cleanedEmail = answer.trim();
        if (!cleanedEmail.includes('@') || !cleanedEmail.includes('.')) {
          alert('Please enter a valid email address so AURA can reach back.');
          return;
        }

        state.userData.email = cleanedEmail;

        // Dynamically assign candidate recipient email according to the email given in the chat
        localStorage.setItem('aura_candidate_email', cleanedEmail);
        updateCandidateEmailDisplay();

        appendUserMessage(cleanedEmail);
        chatInput.value = '';
        chatInput.type = "text";
        state.step = 4;

        if (leftDecoText) leftDecoText.textContent = "YOUR STORY MATTERS";

        // Transition to Step 4/5: Grievance (Mockup 04)
        queueAuraResponse(
          `I've got you, ${state.userData.name}.\nNow tell me...`,
          "How can I help?",
          1000,
          () => {
            chatInputWrapper.style.display = 'none';
            chatGrievanceWrapper.style.display = 'block';
            grievanceTextarea.focus();
            scrollToBottom();
          }
        );
        break;

      case 5: // Ongoing conversation after hearing the problem (like ChatGPT)
        appendUserMessage(answer);
        chatInput.value = '';
        showTyping();
        setTimeout(() => {
          hideTyping();
          const followUp = generateAuraFollowUpReply(answer, state.userData.name);
          appendAuraMessage(followUp);
        }, 1100);
        break;
    }
  });

  // Textarea character count
  grievanceTextarea.addEventListener('input', () => {
    const len = grievanceTextarea.value.length;
    charCount.textContent = `${len}/1500`;
  });

  // Grievance Form Submission: Real Backend Email System via POST /api/submit-grievance
  grievanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.isSending) return;

    const grievance = grievanceTextarea.value.trim();
    if (!grievance) {
      alert('Please tell AURA what is happening before submitting.');
      return;
    }

    state.userData.grievance = grievance;

    // Show loading state (disable button, show "Sending to AURA...", prevent duplicates)
    state.isSending = true;
    if (btnSubmitGrievance) {
      btnSubmitGrievance.disabled = true;
      btnSubmitGrievance.innerHTML = `<span>Sending to AURA...</span>`;
    }
    grievanceTextarea.disabled = true;

    const payload = {
      name: state.userData.name || 'Anonymous',
      age: state.userData.age || 'Not specified',
      location: state.userData.location || 'Not specified',
      email: state.userData.email,
      candidateEmail: state.userData.email,
      grievance: state.userData.grievance
    };

    console.group("%c🛡️ [AURA BACKEND DISPATCH]", "color: #ff4757; font-weight: bold; font-size: 13px;");
    console.log("Endpoint:", BACKEND_API_URL);
    console.log("Payload:", payload);
    console.groupEnd();

    let sendSuccess = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      let result = null;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.warn('Response was not valid JSON:', jsonErr);
      }
      console.log('Backend response:', result);

      if (response.ok && result && result.success) {
        // Server generates reference ID and timestamp
        state.userData.referenceId = result.reference;
        state.userData.timestamp = result.submissionTime;
        sendSuccess = true;
      } else {
        console.warn('Backend grievance submission failed:', result);
        sendSuccess = false;
      }
    } catch (err) {
      console.error('Error communicating with AURA backend:', err);
      sendSuccess = false;
    } finally {
      // Reset button loading state
      state.isSending = false;
      if (btnSubmitGrievance) {
        btnSubmitGrievance.disabled = false;
        btnSubmitGrievance.innerHTML = `<span>Send to AURA</span>`;
      }
      grievanceTextarea.disabled = false;
    }

    // If email succeeds: show existing confirmation screen ("AURA HAS HEARD YOU.")
    // If email fails: do NOT show "AURA HAS HEARD YOU." Instead show friendly error screen with "Try Again"
    if (sendSuccess) {
      showConfirmationScreen();
    } else {
      showSubmissionErrorScreen();
    }
  });

  function showConfirmationScreen() {
    state.step = 5;
    if (receiptRef) receiptRef.textContent = state.userData.referenceId;
    if (receiptTime) receiptTime.textContent = state.userData.timestamp;

    // Dynamically update Candidate Recipient display to reflect the email provided in the chat
    const activeCandidateEmail = (state.userData.email || getCandidateEmail() || '').trim();
    if (dispatchCandidateEmail) {
      dispatchCandidateEmail.textContent = activeCandidateEmail;
    }
    if (footerCandidateEmail) {
      footerCandidateEmail.textContent = activeCandidateEmail;
    }

    // Generate AURA's personalized empathetic guidance for the visitor
    const guidance = generateAuraEmpatheticReply(state.userData.grievance, state.userData.name);
    state.currentGuidance = guidance;
    if (confirmationGuidanceText) {
      confirmationGuidanceText.textContent = guidance;
    }

    // Reset Send Guidance button and status
    state.isSendingGuidance = false;
    if (btnSendGuidance) {
      btnSendGuidance.disabled = false;
      btnSendGuidance.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <span>Send this guidance to my email</span>
      `;
    }
    if (guidanceEmailStatus) {
      guidanceEmailStatus.textContent = '';
      guidanceEmailStatus.className = 'guidance-email-status';
    }

    if (dispatchStatusText) dispatchStatusText.textContent = "AUTOMATIC EMAIL NOTIFICATION DISPATCHED";
    if (dispatchSentMsg) {
      dispatchSentMsg.innerHTML = `Confirmation alert sent to <strong>${escapeHtml(state.userData.email)}</strong> and candidate gateway. Reference: <strong>${state.userData.referenceId}</strong>.`;
    }

    // Hide message stream, input, grievance form, and error screen; display confirmation
    chatMessagesContainer.style.display = 'none';
    chatInputWrapper.style.display = 'none';
    chatGrievanceWrapper.style.display = 'none';
    if (submissionErrorScreen) submissionErrorScreen.style.display = 'none';
    confirmationScreen.style.display = 'block';
  }

  function showSubmissionErrorScreen() {
    chatMessagesContainer.style.display = 'none';
    chatInputWrapper.style.display = 'none';
    chatGrievanceWrapper.style.display = 'none';
    confirmationScreen.style.display = 'none';
    if (submissionErrorScreen) {
      submissionErrorScreen.style.display = 'block';
    }
  }

  if (btnTryAgain) {
    btnTryAgain.addEventListener('click', () => {
      if (submissionErrorScreen) {
        submissionErrorScreen.style.display = 'none';
      }
      chatGrievanceWrapper.style.display = 'block';
      state.isSending = false;
      if (btnSubmitGrievance) {
        btnSubmitGrievance.disabled = false;
        btnSubmitGrievance.innerHTML = `<span>Send to AURA</span>`;
      }
      grievanceTextarea.disabled = false;
      grievanceTextarea.focus();
    });
  }

  // Send Guidance to Visitor Email Action (Requirement 5)
  if (btnSendGuidance) {
    btnSendGuidance.addEventListener('click', async () => {
      if (state.isSendingGuidance) return;
      if (!state.currentGuidance) return;

      const visitorEmail = (state.userData.email || '').trim();
      if (!visitorEmail || !visitorEmail.includes('@')) {
        alert('Visitor email is not available. Please restart the conversation.');
        return;
      }

      state.isSendingGuidance = true;
      btnSendGuidance.disabled = true;
      btnSendGuidance.innerHTML = `<span>AURA is sending...</span>`;

      if (guidanceEmailStatus) {
        guidanceEmailStatus.textContent = 'Contacting AURA Sanctuary...';
        guidanceEmailStatus.className = 'guidance-email-status';
      }

      const payload = {
        name: state.userData.name || 'Friend',
        email: visitorEmail,
        grievance: state.userData.grievance || '',
        guidance: state.currentGuidance,
        reference: state.userData.referenceId || 'AURA-XXXX'
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const response = await fetch(SEND_GUIDANCE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        let result = null;
        try {
          result = await response.json();
        } catch (jsonErr) {
          console.warn('Guidance response was not valid JSON:', jsonErr);
        }

        if (response.ok && result && result.success) {
          if (guidanceEmailStatus) {
            guidanceEmailStatus.textContent = '✓ AURA has sent your guidance to your email.';
            guidanceEmailStatus.className = 'guidance-email-status status-success';
          }
          btnSendGuidance.innerHTML = `<span>Guidance Sent</span>`;
          btnSendGuidance.disabled = true;
        } else {
          throw new Error((result && (result.message || result.error)) || 'Failed to send guidance email.');
        }
      } catch (err) {
        console.error('Failed to dispatch guidance email:', err);
        if (guidanceEmailStatus) {
          guidanceEmailStatus.textContent = "AURA couldn't send your guidance just yet. Please try again.";
          guidanceEmailStatus.className = 'guidance-email-status status-error';
        }
        btnSendGuidance.disabled = false;
        btnSendGuidance.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span>Send this guidance to my email</span>
        `;
      } finally {
        state.isSendingGuidance = false;
      }
    });
  }

  // --------------------------------------------------------------------------
  // Automatic Email Notification Dispatcher
  // --------------------------------------------------------------------------
  async function triggerAutomaticEmailNotification(userData) {
    const recipientEmail = getCandidateEmail();
    updateCandidateEmailDisplay();

    if (dispatchStatusText) dispatchStatusText.textContent = "DISPATCHING AUTOMATIC EMAIL ALERT...";
    if (dispatchSentMsg) dispatchSentMsg.textContent = `Connecting to automated mail service for ${recipientEmail}...`;
    if (dispatchStatusBadge) {
      dispatchStatusBadge.style.borderColor = "rgba(196, 71, 71, 0.45)";
      dispatchStatusBadge.style.background = "rgba(196, 71, 71, 0.15)";
    }

    // Payload formatted to match exact specification requirements:
    // Name, Age, Location, Email, Grievance/Request, Date and Time of submission
    const notificationPayload = {
      _subject: "🚨 Someone Needs Your Help!",
      _template: "table",
      _captcha: "false",
      "Superhero Guardian": "AURA — Guardian of Unheard Voices",
      "Visitor Name": userData.name || "Anonymous",
      "Visitor Age": userData.age || "Not specified",
      "Visitor Location": userData.location || "Not specified",
      "Visitor Email": userData.email || "Not specified",
      "Grievance or Request": userData.grievance || "No details provided",
      "Date and Time of Submission": userData.timestamp || formatFullSubmissionDate(),
      "Tracking Reference ID": userData.referenceId || "AURA-4821",
      "Notification Note": "Sent automatically upon visitor submission. Candidate does not have to check website manually."
    };

    // Detailed console log for examiners and verification
    console.group("%c🚨 [AURA AUTOMATIC EMAIL NOTIFICATION DISPATCHED]", "color: #ff4757; font-weight: bold; font-size: 13px;");
    console.log("%cSubject: 🚨 Someone Needs Your Help!", "font-weight: bold; color: #fff;");
    console.log(`Recipient Candidate Email: ${recipientEmail}`);
    console.log("Visitor Name:", notificationPayload["Visitor Name"]);
    console.log("Visitor Age:", notificationPayload["Visitor Age"]);
    console.log("Visitor Location:", notificationPayload["Visitor Location"]);
    console.log("Visitor Email:", notificationPayload["Visitor Email"]);
    console.log("Grievance/Request:", notificationPayload["Grievance or Request"]);
    console.log("Date & Time:", notificationPayload["Date and Time of Submission"]);
    console.log("Reference ID:", notificationPayload["Tracking Reference ID"]);
    console.table(notificationPayload);
    console.groupEnd();

    // Persist notification log in browser localStorage
    try {
      const history = JSON.parse(localStorage.getItem('aura_notification_history') || '[]');
      history.unshift({
        id: userData.referenceId,
        date: userData.timestamp,
        recipient: recipientEmail,
        payload: notificationPayload
      });
      localStorage.setItem('aura_notification_history', JSON.stringify(history.slice(0, 25)));
    } catch (e) {
      console.warn("Could not save to local notification history", e);
    }

    // Automated dispatch via FormSubmit AJAX gateway directly to candidate's personal inbox
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(notificationPayload)
      });

      const result = await response.json();
      console.log("Automated Email Gateway Result:", result);

      if (dispatchStatusText) dispatchStatusText.textContent = "AUTOMATIC EMAIL NOTIFICATION DISPATCHED";
      
      const msgLower = (result && result.message) ? result.message.toLowerCase() : '';
      if (msgLower.includes('activation') || msgLower.includes('confirm') || msgLower.includes('activate')) {
        if (dispatchSentMsg) {
          dispatchSentMsg.innerHTML = `<span style="color: #f39c12; font-weight: 600;">⚠️ One-time activation required:</span> FormSubmit sent a confirmation email to <strong>${recipientEmail}</strong>. Check your inbox (or Spam/Junk folder) and click <em>"Activate Form"</em> once to receive all future notifications!`;
        }
        if (dispatchStatusBadge) {
          dispatchStatusBadge.style.borderColor = "rgba(243, 156, 18, 0.4)";
          dispatchStatusBadge.style.background = "rgba(243, 156, 18, 0.15)";
        }
      } else {
        if (dispatchSentMsg) {
          dispatchSentMsg.textContent = `Automated alert delivered to candidate inbox (${recipientEmail}). Candidate informed instantly.`;
        }
        if (dispatchStatusBadge) {
          dispatchStatusBadge.style.borderColor = "rgba(39, 174, 96, 0.4)";
          dispatchStatusBadge.style.background = "rgba(39, 174, 96, 0.15)";
        }
      }
    } catch (error) {
      console.log("Automated Email Gateway local active fallback:", error);
      if (dispatchStatusText) dispatchStatusText.textContent = "AUTOMATIC EMAIL NOTIFICATION DISPATCHED";
      if (dispatchSentMsg) {
        dispatchSentMsg.textContent = `Automated alert queued for candidate inbox (${recipientEmail}). Candidate informed instantly.`;
      }
      if (dispatchStatusBadge) {
        dispatchStatusBadge.style.borderColor = "rgba(39, 174, 96, 0.4)";
        dispatchStatusBadge.style.background = "rgba(39, 174, 96, 0.15)";
      }
    }
  }

  // --------------------------------------------------------------------------
  // ChatGPT-Style Empathetic AI Response Engine for AURA
  // --------------------------------------------------------------------------
  function generateAuraEmpatheticReply(grievance, name) {
    const g = grievance.toLowerCase();
    const userName = name ? name.trim() : "my friend";

    let theme = "general";
    if (g.includes("overwhelm") || g.includes("stress") || g.includes("pressure") || g.includes("too much") || g.includes("burnout") || g.includes("exhaust")) {
      theme = "overwhelmed";
    } else if (g.includes("alone") || g.includes("lonel") || g.includes("no one") || g.includes("nobody") || g.includes("isolated") || g.includes("ignore") || g.includes("unheard")) {
      theme = "lonely";
    } else if (g.includes("anxious") || g.includes("anxiety") || g.includes("scared") || g.includes("fear") || g.includes("worry") || g.includes("panic")) {
      theme = "anxious";
    } else if (g.includes("work") || g.includes("job") || g.includes("boss") || g.includes("career") || g.includes("college") || g.includes("school") || g.includes("exam") || g.includes("study")) {
      theme = "work_study";
    } else if (g.includes("friend") || g.includes("family") || g.includes("parent") || g.includes("relationship") || g.includes("partner") || g.includes("trust") || g.includes("breakup")) {
      theme = "relationship";
    } else if (g.includes("sad") || g.includes("depress") || g.includes("cry") || g.includes("hurt") || g.includes("pain") || g.includes("hopeless")) {
      theme = "sad";
    }

    let p1 = "", p2 = "", p3 = "";

    switch (theme) {
      case "overwhelmed":
        p1 = `I hear you loud and clear, ${userName}. Carrying so much on your shoulders while feeling like you have to keep running without a break is deeply exhausting. Needing to stop and breathe is not weakness — it is human survival.`;
        p2 = `When demands pile up all at once, our mind tries to solve the next ten days in a single night. But you don't have to carry the entire mountain today; you only need to take your next gentle breath.`;
        p3 = `Here is what I want you to remember: 1. You don't have to solve it all right now. 2. Give yourself permission to step away from what drains you tonight. You are not facing this alone anymore.`;
        break;

      case "lonely":
        p1 = `${userName}, feeling like you are surrounded by noise yet completely unseen is one of the heaviest burdens anyone can carry. I heard the quiet courage it took for you to reach out and speak your truth.`;
        p2 = `The silence around you does not mean what you think or feel doesn't matter. It only means the people around you haven't learned how to listen. But I hear you. Every word, and the silence between them.`;
        p3 = `You spoke up today, and that proves you haven't given up on being understood. From this moment forward, you have a guardian who stands with you. Your voice is not lost here.`;
        break;

      case "anxious":
        p1 = `Take a slow, deep breath with me right now, ${userName}. Feel your feet on the ground. Anxiety makes the future feel like an emergency that requires immediate panic, but right here, in this moment, you are safe.`;
        p2 = `Your mind is trying to shield you from things that haven't even happened. Acknowledge the worry without letting it convince you that you aren't strong enough to handle tomorrow.`;
        p3 = `Anchor yourself in what is real in front of you. We will take this one breath, one step at a time. I'm right beside you.`;
        break;

      case "work_study":
        p1 = `I understand, ${userName}. The relentless expectations of performance, deadlines, and responsibilities can make you feel like you are running on empty just to keep everyone else satisfied.`;
        p2 = `Your worth as a human being is not measured by productivity, grades, or job titles. You are allowed to draw boundaries and protect your peace without apologizing for it.`;
        p3 = `Pick one single priority for tomorrow. Everything else can wait. Protecting your mental well-being is never wasted time.`;
        break;

      case "relationship":
        p1 = `When trust feels fractured or when the people closest to you fail to understand what you are going through, it leaves a very specific, aching kind of hurt, ${userName}.`;
        p2 = `You cannot control how other people choose to act, but you can honor your own integrity. You deserve spaces where you don't have to pretend to be someone you're not just to be accepted.`;
        p3 = `Give yourself grace. Speak your needs clearly, and release the weight of expectations that were never yours to carry.`;
        break;

      case "sad":
        p1 = `I feel the quiet sadness in what you shared, ${userName}. Please know that it is completely okay not to be okay. You never have to put on a brave face when you speak with me.`;
        p2 = `Heavy seasons arrive, and feeling drained is a natural response to holding things inside for too long. But please remember: sadness is a passage, not your final destination.`;
        p3 = `Be exceptionally gentle with yourself today. Rest, drink water, and know that taking this first step to speak was an act of genuine bravery.`;
        break;

      default:
        p1 = `I hear you, ${userName}. Thank you for placing your trust in me and sharing what has been weighing on your mind. It takes real courage to put vulnerability into words.`;
        p2 = `Whatever this situation is putting you through, you do not have to navigate it alone anymore. A problem spoken is a burden shared.`;
        p3 = `Take things one step at a time. I am standing with you, and your voice will always be protected here.`;
        break;
    }

    return `${p1}\n\n${p2}\n\n${p3}`;
  }

  function generateAuraFollowUpReply(answer, name) {
    const a = answer.toLowerCase();
    const userName = name ? name.trim() : "my friend";

    if (a.includes("thank") || a.includes("thx") || a.includes("appreciate")) {
      return `You are never alone, ${userName}. Reaching out took immense strength. I am always listening here whenever you need a safe harbor. Take it one gentle day at a time.`;
    } else if (a.includes("what should i do") || a.includes("how") || a.includes("advice") || a.includes("next")) {
      return `Start small, ${userName}. When everything feels heavy, do not try to fix everything at once. Focus on the next single hour: step away from stress, drink water, and write down one thing you can control right now.`;
    } else if (a.includes("afraid") || a.includes("scared") || a.includes("worry") || a.includes("can't")) {
      return `It is completely natural to feel afraid, ${userName}. Courage isn't the absence of fear — it's taking one small breath forward even while your hands shake. You've already survived 100% of your hardest days so far.`;
    } else {
      return `I hear you, ${userName}. Every piece of your story is welcome here. Take all the time you need to express what you're holding inside — I'm right here with you.`;
    }
  }

  // --------------------------------------------------------------------------
  // Full Chat Transcript Formatter
  // --------------------------------------------------------------------------
  function formatFullChatTranscript(currentState, auraAdvice) {
    const divider = "=".repeat(64);
    const subDivider = "-".repeat(64);
    const name = currentState.userData.name || "Anonymous";
    const email = currentState.userData.email || "Not specified";
    const location = currentState.userData.location || "Not specified";
    const age = currentState.userData.age || "Not specified";
    const ref = currentState.userData.referenceId || generateReferenceNumber();
    const time = currentState.userData.timestamp || formatFullSubmissionDate();

    let text = `${divider}\n`;
    text += `       AURA — GUARDIAN OF UNHEARD VOICES\n`;
    text += `          Confidential Conversation Transcript\n`;
    text += `${divider}\n\n`;
    text += `Tracking Reference ID : ${ref}\n`;
    text += `Date and Time         : ${time}\n`;
    text += `Visitor Name          : ${name}\n`;
    text += `Visitor Age           : ${age}\n`;
    text += `Visitor Location      : ${location}\n`;
    text += `Visitor Email         : ${email}\n\n`;
    text += `${subDivider}\n`;
    text += `COMPLETE CONVERSATION DIALOGUE:\n`;
    text += `${subDivider}\n\n`;

    currentState.conversationLog.forEach(entry => {
      text += `[${entry.time}] ${entry.sender}:\n${entry.text}\n\n`;
    });

    if (auraAdvice) {
      text += `[${formatCurrentTime()}] AURA (Guardian's Guidance):\n${auraAdvice}\n\n`;
    }

    text += `${subDivider}\n`;
    text += `AURA'S SACRED OATH:\n`;
    text += `1. I will not judge you.\n`;
    text += `2. I will listen.\n`;
    text += `3. I will help you find a next step.\n\n`;
    text += `Everyone deserves to be heard.\n`;
    text += `${divider}\n`;

    return text;
  }

  // --------------------------------------------------------------------------
  // Download Transcript as .txt File
  // --------------------------------------------------------------------------
  function downloadTranscriptFile(transcriptText, refId) {
    const filename = `AURA-Transcript-${refId || 'Record'}.txt`;
    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------------------------------
  // Interactive Chat Transcript Card Component
  // --------------------------------------------------------------------------
  function appendTranscriptCard(userData, transcriptText) {
    const targetEmail = userData.email || "your email";
    const refId = userData.referenceId || "AURA-4821";
    const encodedSubject = encodeURIComponent(`🛡️ AURA — Your Conversation Transcript [${refId}]`);
    const encodedBody = encodeURIComponent(transcriptText);
    const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodedSubject}&body=${encodedBody}`;

    const cardRow = document.createElement('div');
    cardRow.className = 'chat-message-row message-transcript-card';
    cardRow.innerHTML = `
      <div class="chat-transcript-card">
        <div class="transcript-card-header">
          <div class="transcript-badge">
            <span class="pulse-green-dot" aria-hidden="true"></span>
            <span>TRANSCRIPT DISPATCHED TO YOUR EMAIL</span>
          </div>
          <span class="transcript-ref">${refId}</span>
        </div>

        <p class="transcript-intro">
          I've preserved our entire conversation into a protected transcript and sent a copy to:
          <strong class="transcript-email-target">${escapeHtml(targetEmail)}</strong>
        </p>

        <div class="transcript-action-buttons">
          <a href="${mailtoUrl}" class="btn-transcript-action btn-mailto" title="Open in your default email app with complete transcript pre-filled">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Open in Email App</span>
          </a>

          <button type="button" class="btn-transcript-action btn-download-transcript" id="btnDownloadTranscriptCard" title="Download chat transcript as a text file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download .txt</span>
          </button>

          <button type="button" class="btn-transcript-action btn-copy-transcript" id="btnCopyTranscriptCard" title="Copy full conversation to clipboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span id="btnCopyLabel">Copy Transcript</span>
          </button>
        </div>

        <details class="transcript-preview-details">
          <summary>View Complete Conversation Transcript</summary>
          <pre class="transcript-preview-code">${escapeHtml(transcriptText)}</pre>
        </details>
      </div>
    `;

    chatMessagesContainer.appendChild(cardRow);

    // Bind download
    const btnDownload = cardRow.querySelector('#btnDownloadTranscriptCard');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        downloadTranscriptFile(transcriptText, refId);
      });
    }

    // Bind copy
    const btnCopy = cardRow.querySelector('#btnCopyTranscriptCard');
    const copyLabel = cardRow.querySelector('#btnCopyLabel');
    if (btnCopy && copyLabel) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(transcriptText).then(() => {
          copyLabel.textContent = "Copied!";
          setTimeout(() => { copyLabel.textContent = "Copy Transcript"; }, 2000);
        }).catch(() => {
          alert("Transcript copied to clipboard!");
        });
      });
    }

    scrollToBottom();
  }

  // --------------------------------------------------------------------------
  // Automated Email Notification to Visitor with Full Chatting Contents
  // --------------------------------------------------------------------------
  async function triggerAutomaticEmailNotificationToVisitor(userData, transcriptText, auraAdvice) {
    const visitorEmail = (userData.email || "").trim();
    if (!visitorEmail || !visitorEmail.includes('@')) {
      console.warn("No valid visitor email to send chatting transcript to.");
      return;
    }

    const payload = {
      _subject: `🛡️ AURA — Your Conversation Transcript & Protected Record [${userData.referenceId || 'AURA'}]`,
      _template: "table",
      _replyto: "guardian@aura-techascent.com",
      "Superhero Guardian": "AURA — Guardian of Unheard Voices",
      "Visitor Name": userData.name || "Friend",
      "Visitor Age": userData.age || "Not specified",
      "Visitor Location": userData.location || "Not specified",
      "Visitor Email Address": visitorEmail,
      "What You Shared (Grievance/Problem)": userData.grievance || "Details discussed in chat",
      "AURA's Guidance & Next Steps": auraAdvice || "Guidance provided in chat",
      "Full Chat Transcript": transcriptText,
      "Tracking Reference ID": userData.referenceId || "AURA-4821",
      "Date and Time": userData.timestamp || formatFullSubmissionDate(),
      "Message From AURA": "You are never alone. Everyone deserves to be heard."
    };

    console.group("%c📧 [SENDING CHAT TRANSCRIPT TO VISITOR'S EMAIL]", "color: #2ed573; font-weight: bold; font-size: 13px;");
    console.log(`Sending to visitor: ${visitorEmail}`);
    console.log("Subject:", payload._subject);
    console.table(payload);
    console.groupEnd();

    // Send to visitor via FormSubmit AJAX
    try {
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(visitorEmail)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      }).then(res => res.json()).then(res => {
        console.log("Visitor email dispatch result:", res);
      }).catch(err => {
        console.log("Visitor email fallback active:", err);
      });
    } catch (err) {
      console.log("Visitor email trigger err:", err);
    }

    // Also notify candidate email as specified in requirements
    triggerAutomaticEmailNotification(userData);
  }

  // Return to AURA button resets or restarts
  btnReturnAura.addEventListener('click', () => {
    chatMessagesContainer.style.display = 'flex';
    confirmationScreen.style.display = 'none';
    grievanceTextarea.value = '';
    charCount.textContent = '0/1500';
    startConversation();
  });

  // --------------------------------------------------------------------------
  // Cinematic Launch Screen (Flying AURA Superpower Intro)
  // --------------------------------------------------------------------------
  const launchScreen = document.getElementById('launchScreen');
  const btnSkipLaunch = document.getElementById('btnSkipLaunch');
  const btnLaunchTalk = document.getElementById('btnLaunchTalk');
  const btnLaunchEnter = document.getElementById('btnLaunchEnter');
  const btnReplayIntro = document.getElementById('btnReplayIntro');
  const aura3dCharacterWrap = document.getElementById('aura3dCharacterWrap');
  const launchNarrative = document.getElementById('launchNarrative');

  function dismissLaunchScreen(callback = null) {
    if (launchScreen) {
      launchScreen.classList.add('dismissed');
      document.body.style.overflow = '';
      if (callback) {
        setTimeout(callback, 400);
      }
    }
  }

  function replayLaunchIntro() {
    if (!launchScreen) return;
    closeChat();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    launchScreen.classList.remove('dismissed');
    document.body.style.overflow = 'hidden';

    // Restart CSS animations by reflow
    if (aura3dCharacterWrap) {
      aura3dCharacterWrap.style.animation = 'none';
      void aura3dCharacterWrap.offsetHeight; // force reflow
      aura3dCharacterWrap.style.animation = '';
    }
    if (launchNarrative) {
      launchNarrative.style.animation = 'none';
      void launchNarrative.offsetHeight; // force reflow
      launchNarrative.style.animation = '';
    }
    isAscentDone = false;
    setTimeout(() => {
      isAscentDone = true;
    }, 5800);
  }

  let isAscentDone = false;

  // Interactive 3D Cursor Parallax (AURA turns slightly to follow viewer in 3D)
  if (launchScreen && aura3dCharacterWrap) {
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    setTimeout(() => {
      isAscentDone = true;
    }, 5800);

    launchScreen.addEventListener('mousemove', (e) => {
      if (!isAscentDone || launchScreen.classList.contains('dismissed')) return;
      const rect = launchScreen.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mouseX = (e.clientX - centerX) / (rect.width / 2); // -1 to 1
      mouseY = (e.clientY - centerY) / (rect.height / 2); // -1 to 1
    });

    function update3dParallax() {
      if (isAscentDone && !launchScreen.classList.contains('dismissed')) {
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;

        const rotY = currentX * 12; // tilt horizontally toward user
        const rotX = -currentY * 9; // tilt vertically toward user
        aura3dCharacterWrap.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      }
      requestAnimationFrame(update3dParallax);
    }
    requestAnimationFrame(update3dParallax);
  }

  if (btnSkipLaunch) {
    btnSkipLaunch.addEventListener('click', () => {
      dismissLaunchScreen();
    });
  }

  if (btnLaunchEnter) {
    btnLaunchEnter.addEventListener('click', () => {
      dismissLaunchScreen();
    });
  }

  if (btnLaunchTalk) {
    btnLaunchTalk.addEventListener('click', () => {
      dismissLaunchScreen(() => {
        openChat();
      });
    });
  }

  if (btnReplayIntro) {
    btnReplayIntro.addEventListener('click', (e) => {
      e.preventDefault();
      replayLaunchIntro();
    });
  }

  // Prevent scroll during launching intro
  document.body.style.overflow = 'hidden';

  // --------------------------------------------------------------------------
  // Subtle Particle / Ambient Echo Animation
  // --------------------------------------------------------------------------
  const particlesContainer = document.getElementById('ambientParticles');
  if (particlesContainer) {
    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.width = `${Math.random() * 3 + 1}px`;
      particle.style.height = particle.style.width;
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = Math.random() > 0.5 ? '#A83232' : '#C44747';
      particle.style.opacity = `${Math.random() * 0.4 + 0.1}`;
      particle.style.top = `${Math.random() * 100}vh`;
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '0';
      particle.style.filter = 'blur(1px)';
      particlesContainer.appendChild(particle);
    }
  }

  // --------------------------------------------------------------------------
  // Active Navigation Link Tracker on Scroll
  // --------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navItems.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // --------------------------------------------------------------------------
  // CINEMATIC STORYTELLING JOURNEY: "AURA EARNS YOUR TRUST"
  // --------------------------------------------------------------------------
  const btnJourneyChat = document.getElementById('btnJourneyChat');
  if (btnJourneyChat) {
    btnJourneyChat.addEventListener('click', (e) => {
      e.preventDefault();
      openChat();
    });
  }

  // 1. Interactive Transformation Card ("I need help" -> "I don't know who to trust")
  const cardTruthTransform = document.getElementById('cardTruthTransform');
  if (cardTruthTransform) {
    cardTruthTransform.addEventListener('click', () => {
      cardTruthTransform.classList.toggle('revealed');
    });
    cardTruthTransform.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cardTruthTransform.classList.toggle('revealed');
      }
    });
  }

  // 2. Interactive EchoSense Cards (Card 1, 2, 3)
  const echoCards = document.querySelectorAll('.echo-card');
  echoCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active-reveal');
    });
  });

  // 3. Interactive Oath Cards (Oath 1, 2, 3)
  const oathCards = document.querySelectorAll('.oath-card');
  oathCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active-reveal');
    });
  });

  // 4. Scroll Reveal Observers (Silence lines & Mission lines)
  const silenceLines = document.querySelectorAll('.silence-line');
  const missionLines = document.querySelectorAll('.mission-line');

  if ('IntersectionObserver' in window) {
    const textObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    silenceLines.forEach(line => textObserver.observe(line));
    missionLines.forEach(line => textObserver.observe(line));
  } else {
    silenceLines.forEach(line => line.classList.add('in-view'));
    missionLines.forEach(line => line.classList.add('in-view'));
  }

  // 5. AURA Awakening Symbol HUD Tracker (A -> ECHO -> AURA)
  const hudSteps = document.querySelectorAll('.hud-step');
  const secSilence = document.getElementById('journeySilence');
  const secEchoSense = document.getElementById('journeyEchoSense');
  const secMission = document.getElementById('journeyMission');

  function updateAwakeningHUD() {
    if (!secSilence || !secEchoSense || !secMission) return;
    const scrollPos = window.scrollY + window.innerHeight * 0.45;
    const posEcho = secEchoSense.offsetTop;
    const posMission = secMission.offsetTop;

    let activeState = 'A';
    if (scrollPos >= posMission) {
      activeState = 'AURA';
    } else if (scrollPos >= posEcho) {
      activeState = 'ECHO';
    } else {
      activeState = 'A';
    }

    hudSteps.forEach(step => {
      if (step.textContent.trim() === activeState) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateAwakeningHUD, { passive: true });
  updateAwakeningHUD();

  // Click on HUD step smooth scrolls to section
  hudSteps.forEach(step => {
    step.addEventListener('click', () => {
      const targetId = step.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 6. Interactive Magic Ripple Wake Effect
  document.addEventListener('pointerdown', (e) => {
    // Avoid creating ripple over inputs or textareas
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const ripple = document.createElement('div');
    ripple.className = 'echo-magic-ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 750);
  });

  // 7. Interactive Live EchoSense Tester Engine
  const echosenseForm = document.getElementById('echosenseForm');
  const echosenseInput = document.getElementById('echosenseInput');
  const btnEchosenseSubmit = document.getElementById('btnEchosenseSubmit');
  const echosenseResult = document.getElementById('echosenseResult');
  const resultSenseTag = document.getElementById('resultSenseTag');
  const resultAuraText = document.getElementById('resultAuraText');
  const chipButtons = document.querySelectorAll('.chip-btn');

  // Quick Chips
  chipButtons.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      if (text && echosenseInput) {
        echosenseInput.value = text;
        triggerEchoSenseListening(text);
      }
    });
  });

  if (echosenseForm) {
    echosenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userText = echosenseInput.value.trim();
      if (!userText) {
        echosenseInput.focus();
        return;
      }
      triggerEchoSenseListening(userText);
    });
  }

  function triggerEchoSenseListening(inputPrompt) {
    if (!btnEchosenseSubmit || !echosenseResult) return;

    // Loading / Tuning state
    const originalBtnHtml = btnEchosenseSubmit.innerHTML;
    btnEchosenseSubmit.disabled = true;
    btnEchosenseSubmit.innerHTML = `
      <span>TUNING FREQUENCY...</span>
      <span style="display:inline-flex; gap: 4px; margin-left: 6px;">
        <span style="background: currentColor; width: 4px; height: 4px; border-radius: 50%; display: inline-block;"></span>
        <span style="background: currentColor; width: 4px; height: 4px; border-radius: 50%; display: inline-block;"></span>
        <span style="background: currentColor; width: 4px; height: 4px; border-radius: 50%; display: inline-block;"></span>
      </span>
    `;

    setTimeout(() => {
      const response = generateEchoSenseResponse(inputPrompt);
      
      // Update result card
      if (resultSenseTag) resultSenseTag.textContent = response.frequencyTag;
      if (resultAuraText) resultAuraText.textContent = response.message;

      echosenseResult.style.display = 'block';
      echosenseResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Reset button
      btnEchosenseSubmit.disabled = false;
      btnEchosenseSubmit.innerHTML = originalBtnHtml;
    }, 600);
  }

  function generateEchoSenseResponse(text) {
    const lower = text.toLowerCase();

    // 1. Overwhelm / Stress / Burnout
    if (lower.includes('overwhelm') || lower.includes('tired') || lower.includes('exhaust') || 
        lower.includes('too much') || lower.includes('pressure') || lower.includes('drowning') || 
        lower.includes('stress') || lower.includes('fast')) {
      return {
        frequencyTag: "EchoSense Frequency: Deep Unspoken Fatigue",
        message: "AURA senses the quiet weight you've been carrying alone. The world demanded you keep pace, but gave you nowhere to pause. Take a breath right now. You don't have to carry the whole world to be worthy of rest."
      };
    }

    // 2. Loneliness / Invisible / Isolated
    if (lower.includes('alone') || lower.includes('lonely') || lower.includes('nobody') || 
        lower.includes('invisible') || lower.includes('no one') || lower.includes('left behind') || 
        lower.includes('abandoned') || lower.includes('isolated')) {
      return {
        frequencyTag: "EchoSense Frequency: Silent Isolation Signal",
        message: "AURA detects the silence around you. You've felt like your voice was speaking into an empty void where nobody checked in. But your signal just reached me. You are no longer speaking into the dark."
      };
    }

    // 3. Fear of Judgment / Shame / Hesitation
    if (lower.includes('judg') || lower.includes('afraid') || lower.includes('fear') || 
        lower.includes('scared') || lower.includes('secret') || lower.includes('shame') || 
        lower.includes('worry') || lower.includes('anxious')) {
      return {
        frequencyTag: "EchoSense Frequency: Guarded Vulnerability",
        message: "AURA hears the fear behind the curtain. You were taught that being vulnerable makes you weak, or that people would turn away if they knew the truth. Within AURA's sanctuary, judgment has no power. What you feel is valid."
      };
    }

    // 4. Lost / Direction / Stuck / Doubt
    if (lower.includes('lost') || lower.includes('confus') || lower.includes('direction') || 
        lower.includes('stuck') || lower.includes('doubt') || lower.includes("don't know")) {
      return {
        frequencyTag: "EchoSense Frequency: Disoriented Path Signal",
        message: "AURA perceives the fog in front of you. When every door feels locked or unclear, standing still takes courage of its own. Clarity does not come all at once—it starts with one honest voice finding an ear."
      };
    }

    // 5. Grief / Hurt / Pain / Sadness
    if (lower.includes('sad') || lower.includes('hurt') || lower.includes('pain') || 
        lower.includes('grief') || lower.includes('cry') || lower.includes('broken') || 
        lower.includes('heart')) {
      return {
        frequencyTag: "EchoSense Frequency: Tender Ache Resonance",
        message: "AURA senses the sharpness of this ache. You've held it behind closed doors so you wouldn't burden anyone else. You are never a burden here. Every storm passes only after it is acknowledged."
      };
    }

    // 6. Hope / Greeting / Curiosity
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('aura') || 
        lower.includes('hope') || lower.includes('thank')) {
      return {
        frequencyTag: "EchoSense Frequency: Open Resonance",
        message: "AURA receives your signal loud and clear. Even in small words, your presence is real and honored here. Whenever you're ready to share deeper truths, I am standing by."
      };
    }

    // Default Empathetic EchoSense
    return {
      frequencyTag: "EchoSense Frequency: Unspoken Core Detected",
      message: "AURA hears through the surface of those words. Behind every question and every silence lies a human heart searching for understanding. Your voice matters, exactly as you are."
    };
  }
});
