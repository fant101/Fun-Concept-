/**
 * HelloSign (Dropbox Sign) integration for DORA rep agreement signing.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a HelloSign account at https://app.hellosign.com/
 * 2. Get your API key from: https://app.hellosign.com/home/myAccount#api
 * 3. Upload your 3 DORA PDF templates and create HelloSign templates:
 *    - Tenant Rep: Colorado Exclusive Tenant Representative Agreement
 *    - Listing:    Colorado Exclusive Right to Lease/Sell Listing Agreement
 *    - Buyer/Seller: Colorado Exclusive Right to Buy / Seller Agency Agreement
 * 4. Copy each template ID into TEMPLATE_IDS below
 * 5. Set your API key in the HELLOSIGN_CONFIG
 * 6. For production: move API calls to a serverless function (see /api/README.md)
 *
 * NOTE: In production, the API key must NOT be in client-side code.
 * Use a serverless function (Netlify Function, Cloudflare Worker, etc.)
 * to proxy the HelloSign API calls. See the api/ folder for examples.
 */
const HelloSignIntegration = (() => {

  // ===== CONFIGURATION — UPDATE THESE =====
  const HELLOSIGN_CONFIG = {
    clientId: 'YOUR_HELLOSIGN_CLIENT_ID',  // From HelloSign dashboard
    testMode: true                          // Set false for production
  };

  // Map client types to HelloSign template IDs (DORA forms)
  const TEMPLATE_IDS = {
    tenant:       'YOUR_TENANT_REP_TEMPLATE_ID',       // DORA Exclusive Tenant Rep Agreement
    landlord:     'YOUR_LISTING_TEMPLATE_ID',           // DORA Exclusive Right to Lease/Sell
    buyer_seller: 'YOUR_BUYER_SELLER_TEMPLATE_ID'       // DORA Exclusive Right to Buy / Seller Agency
  };

  // Human-readable names for each DORA form
  const FORM_NAMES = {
    tenant:       'Colorado Exclusive Right to Represent Tenant (DORA)',
    landlord:     'Colorado Exclusive Right to Sell/Lease Listing Contract (DORA)',
    buyer_seller: 'Colorado Exclusive Right to Buy / Seller Agency Contract (DORA)'
  };

  // Track signing state
  let signingStatus = 'pending'; // 'pending' | 'sent' | 'signed' | 'declined' | 'error'
  let signatureRequestId = null;

  /**
   * Get the DORA form name for a given client type.
   */
  function getFormName(clientType) {
    return FORM_NAMES[clientType] || 'Colorado Representation Agreement (DORA)';
  }

  /**
   * Get the template ID for a given client type.
   */
  function getTemplateId(clientType) {
    return TEMPLATE_IDS[clientType] || null;
  }

  /**
   * Check if HelloSign is configured (template IDs are set).
   */
  function isConfigured() {
    return HELLOSIGN_CONFIG.clientId !== 'YOUR_HELLOSIGN_CLIENT_ID';
  }

  /**
   * Initialize the agreement step UI based on client type.
   * Called when the user enters step 3.
   */
  function renderAgreementStep(clientType) {
    const container = document.getElementById('agreement-text');
    const formName = getFormName(clientType);
    const configured = isConfigured();

    container.innerHTML = `
      <div class="hellosign-info">
        <div class="hellosign-doc-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h4>${formName}</h4>
        <p>This is the official Colorado Real Estate Commission (CREC/DORA) representation agreement. It will be sent to you for electronic signature via HelloSign.</p>
        <div class="hellosign-details">
          <div class="hellosign-detail-row">
            <span class="hellosign-detail-label">Document</span>
            <span class="hellosign-detail-value">${formName}</span>
          </div>
          <div class="hellosign-detail-row">
            <span class="hellosign-detail-label">Broker</span>
            <span class="hellosign-detail-value">Jack Rohr, Managing Broker — Resolute Real Estate</span>
          </div>
          <div class="hellosign-detail-row">
            <span class="hellosign-detail-label">Signing Method</span>
            <span class="hellosign-detail-value">HelloSign (Dropbox Sign) — Legally binding e-signature</span>
          </div>
        </div>
      </div>
    `;

    updateSigningUI();
  }

  /**
   * Update the signing status UI.
   */
  function updateSigningUI() {
    const signArea = document.querySelector('.agreement-sign');
    if (!signArea) return;

    const configured = isConfigured();
    const state = AppState.getState();
    const email = state.formData.email || '';
    const name = state.formData.contact_name || '';

    if (signingStatus === 'signed') {
      signArea.innerHTML = `
        <div class="hellosign-status hellosign-status--signed">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#263826" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
          </svg>
          <div>
            <strong>Agreement Signed</strong>
            <p>The ${getFormName(state.clientType)} has been signed successfully. A copy has been sent to your email.</p>
          </div>
        </div>
      `;
      return;
    }

    if (signingStatus === 'sent') {
      signArea.innerHTML = `
        <div class="hellosign-status hellosign-status--sent">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBA135" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <div>
            <strong>Agreement Sent</strong>
            <p>Check your email (${escapeHtml(email)}) for the HelloSign signing link. You can also sign in the embedded window above.</p>
          </div>
        </div>
        <button class="btn-secondary btn-sm" id="btn-resend-signing" type="button">Resend Email</button>
      `;
      return;
    }

    // Default: pending — show send button
    signArea.innerHTML = `
      <div class="hellosign-send-info">
        <p>By clicking "Send Agreement," the DORA form will be sent to <strong>${escapeHtml(email || 'your email')}</strong> for electronic signature via HelloSign.</p>
        ${!configured ? `
          <div class="hellosign-setup-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>HelloSign is not configured yet. Set your Client ID and Template IDs in <code>js/hellosign.js</code> to enable signing. You can skip this step for now.</span>
          </div>
        ` : ''}
      </div>
      <div class="hellosign-actions">
        <button class="btn-primary" id="btn-send-agreement" type="button" ${!configured ? 'disabled' : ''}>
          ${configured ? 'Send Agreement for Signing' : 'HelloSign Not Configured'}
        </button>
        <button class="btn-secondary btn-sm" id="btn-skip-signing" type="button">Skip for Now</button>
      </div>
    `;

    // Wire up buttons
    const sendBtn = document.getElementById('btn-send-agreement');
    const skipBtn = document.getElementById('btn-skip-signing');

    if (sendBtn && configured) {
      sendBtn.addEventListener('click', () => sendForSigning());
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        AppState.updateState('agreementAccepted', false);
        AppState.updateState('signatureName', 'Skipped — will sign later');
        AppState.updateState('signatureDate', new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        }));
        signingStatus = 'signed'; // Allow proceeding
        Validation.clearStepError();
        updateSigningUI();
      });
    }
  }

  /**
   * Send the DORA agreement for signing via HelloSign.
   * In production, this should call your serverless function, not the API directly.
   */
  async function sendForSigning() {
    const state = AppState.getState();
    const templateId = getTemplateId(state.clientType);

    if (!templateId || templateId.startsWith('YOUR_')) {
      console.error('HelloSign template ID not configured for:', state.clientType);
      return;
    }

    const sendBtn = document.getElementById('btn-send-agreement');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
    }

    try {
      // In production, call YOUR serverless function endpoint:
      // const response = await fetch('/api/hellosign/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     templateId: templateId,
      //     signerEmail: state.formData.email,
      //     signerName: state.formData.contact_name || state.formData.company,
      //     clientType: state.clientType,
      //     metadata: {
      //       company: state.formData.company || '',
      //       phone: state.formData.phone || '',
      //       onboardingDate: new Date().toISOString()
      //     }
      //   })
      // });
      //
      // const data = await response.json();
      // signatureRequestId = data.signatureRequestId;
      //
      // If using embedded signing, open the HelloSign client:
      // HelloSign.open(data.signUrl, {
      //   clientId: HELLOSIGN_CONFIG.clientId,
      //   skipDomainVerification: HELLOSIGN_CONFIG.testMode
      // });

      // For now, simulate success:
      signingStatus = 'sent';
      signatureRequestId = 'simulated_' + Date.now();

      AppState.updateState('agreementAccepted', true);
      AppState.updateState('signatureName', 'Sent via HelloSign');
      AppState.updateState('signatureDate', new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }));

      updateSigningUI();

    } catch (error) {
      console.error('HelloSign send error:', error);
      signingStatus = 'error';
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Retry Sending';
      }
    }
  }

  /**
   * Check if the agreement step is complete (signed or skipped).
   */
  function isComplete() {
    return signingStatus === 'signed' || signingStatus === 'sent';
  }

  /**
   * Reset signing state.
   */
  function reset() {
    signingStatus = 'pending';
    signatureRequestId = null;
  }

  /**
   * Escape HTML helper.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    renderAgreementStep,
    updateSigningUI,
    sendForSigning,
    isComplete,
    getFormName,
    reset,
    isConfigured,
    FORM_NAMES
  };
})();
