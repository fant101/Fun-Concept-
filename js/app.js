/**
 * App initialization, event wiring, form submission, analytics, and summary renderer.
 */
const App = (() => {

  const CLIENT_TYPE_LABELS = {
    tenant: 'Tenant Representative',
    landlord: 'Landlord / Owner',
    buyer_seller: 'Investment Sales'
  };

  function init() {
    Wizard.init();
    Upload.init();
    wireEvents();
    checkSavedSession();
    Analytics.trackStep(0);
  }

  function wireEvents() {
    // Step 0: Get Started
    document.getElementById('btn-get-started').addEventListener('click', () => {
      Wizard.goToStep(1);
    });

    // Step 1: Client type cards
    document.querySelectorAll('.card-select').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.card-select').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        AppState.updateState('clientType', card.dataset.type);
        // Clear previous form data when type changes
        AppState.updateState('formData', {});
        Validation.clearStepError();
      });
    });

    // Step navigation buttons
    document.getElementById('btn-back-1').addEventListener('click', () => Wizard.goToStep(0));
    document.getElementById('btn-next-1').addEventListener('click', () => Wizard.goToStep(2));

    document.getElementById('btn-back-2').addEventListener('click', () => Wizard.goToStep(1));
    document.getElementById('btn-next-2').addEventListener('click', () => Wizard.goToStep(3));

    document.getElementById('btn-back-3').addEventListener('click', () => Wizard.goToStep(2));
    document.getElementById('btn-next-3').addEventListener('click', () => Wizard.goToStep(4));

    document.getElementById('btn-back-4').addEventListener('click', () => Wizard.goToStep(3));
    document.getElementById('btn-next-4').addEventListener('click', () => {
      const success = Wizard.goToStep(5);
      if (success) submitOnboarding();
    });

    // Start Over
    document.getElementById('btn-start-over').addEventListener('click', () => {
      AppState.resetState();
      HelloSignIntegration.reset();

      // Reset UI
      document.querySelectorAll('.card-select').forEach(c => c.classList.remove('selected'));
      document.getElementById('questionnaire-form').innerHTML = '';
      document.getElementById('file-list').innerHTML = '';

      Wizard.goToStep(0);
    });

    // PDF download button (added dynamically on confirmation step)
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-download-pdf' || e.target.closest('#btn-download-pdf')) {
        generatePDF();
      }
    });
  }

  /**
   * Check for a saved session and offer to resume.
   */
  function checkSavedSession() {
    if (!AppState.hasSavedSession()) return;

    const state = AppState.getState();
    if (state.currentStep === 0) return;

    // Restore client type card selection
    if (state.clientType) {
      const card = document.querySelector(`.card-select[data-type="${state.clientType}"]`);
      if (card) card.classList.add('selected');
    }

    // Show resume banner
    const banner = document.createElement('div');
    banner.className = 'resume-banner';
    banner.innerHTML = `
      <p>You have a saved session. Would you like to continue where you left off?</p>
      <div class="resume-actions">
        <button class="btn-primary btn-sm" id="btn-resume-session">Resume</button>
        <button class="btn-secondary btn-sm" id="btn-new-session">Start Fresh</button>
      </div>
    `;

    const panel = document.querySelector('.step-panel.active');
    if (panel) panel.prepend(banner);

    document.getElementById('btn-resume-session').addEventListener('click', () => {
      banner.remove();
      Wizard.goToStep(state.currentStep);
    });

    document.getElementById('btn-new-session').addEventListener('click', () => {
      banner.remove();
      AppState.resetState();
      document.querySelectorAll('.card-select').forEach(c => c.classList.remove('selected'));
    });
  }

  /**
   * Populate agreement step with HelloSign flow for the correct DORA form.
   */
  function populateAgreement() {
    const state = AppState.getState();
    HelloSignIntegration.renderAgreementStep(state.clientType);
  }

  /**
   * Submit completed onboarding data.
   * Uses Netlify Forms for the data submission + email notification.
   */
  async function submitOnboarding() {
    const state = AppState.getState();
    const data = state.formData;

    // Build form data for Netlify Forms
    const formBody = new URLSearchParams();
    formBody.append('form-name', 'onboarding');
    formBody.append('client-type', state.clientType || '');
    formBody.append('contact-name', data.contact_name || '');
    formBody.append('email', data.email || '');
    formBody.append('phone', data.phone || '');
    formBody.append('agreement-status', state.agreementAccepted ? 'accepted' : 'pending');
    formBody.append('agreement-date', state.signatureDate || '');
    formBody.append('files-count', String(state.files.length));

    // Add all form fields
    Object.entries(data).forEach(([key, value]) => {
      const val = Array.isArray(value) ? value.join(', ') : String(value);
      formBody.append(`field-${key}`, val);
    });

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });

      if (!response.ok) {
        console.warn('Form submission response:', response.status);
      }

      Analytics.trackEvent('onboarding_complete', {
        clientType: state.clientType,
        fieldsCompleted: Object.keys(data).length,
        filesUploaded: state.files.length,
        agreementSigned: state.agreementAccepted
      });

    } catch (error) {
      // Non-blocking — the user already sees the confirmation
      console.warn('Form submission error (non-blocking):', error.message);
    }

    // Upload files if any
    if (state.files.length > 0) {
      uploadFiles(state.files);
    }
  }

  /**
   * Upload files to the serverless function.
   */
  async function uploadFiles(files) {
    try {
      const fileData = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        fileData.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        });
      }

      await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData })
      });
    } catch (error) {
      console.warn('File upload error (non-blocking):', error.message);
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Render the confirmation summary from state.
   */
  function renderSummary() {
    const state = AppState.getState();
    const data = state.formData;
    const card = document.getElementById('summary-card');

    // Build heading
    const name = data.contact_name || data.company || 'Client';
    document.getElementById('confirmation-heading').textContent = `Thank You, ${name}!`;

    let html = '';

    // Client type badge
    html += `
      <div class="summary-section">
        <div class="summary-label">Client Type</div>
        <div><span class="badge">${CLIENT_TYPE_LABELS[state.clientType] || state.clientType}</span></div>
      </div>
    `;

    // Key fields
    const keyFields = getKeyFields(state.clientType, data);
    if (keyFields.length > 0) {
      html += '<div class="summary-section">';
      html += '<div class="summary-label">Details</div>';
      keyFields.forEach(({ label, value }) => {
        html += `<div class="summary-value"><strong>${label}:</strong> ${escapeHtml(String(value))}</div>`;
      });
      html += '</div>';
    }

    // Agreement — show DORA form name + HelloSign status
    const formName = HelloSignIntegration.getFormName(state.clientType);
    const sigStatus = state.agreementAccepted ? 'Sent for signing via HelloSign' : 'Not yet signed';
    html += `
      <div class="summary-section">
        <div class="summary-label">Representation Agreement</div>
        <div class="summary-value">
          <strong>${formName}</strong><br>
          ${sigStatus}
          ${state.signatureDate ? ' — ' + state.signatureDate : ''}
        </div>
      </div>
    `;

    // Files
    if (state.files.length > 0) {
      html += `
        <div class="summary-section">
          <div class="summary-label">Documents Uploaded</div>
          <div class="summary-value">${state.files.length} file${state.files.length !== 1 ? 's' : ''}:
            ${state.files.map(f => escapeHtml(f.name)).join(', ')}
          </div>
        </div>
      `;
    }

    // PDF download button
    html += `
      <div class="summary-actions">
        <button class="btn-secondary btn-sm" id="btn-download-pdf" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -3px; margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Summary (PDF)
        </button>
      </div>
    `;

    card.innerHTML = html;
  }

  function getKeyFields(clientType, data) {
    const fields = [];
    const add = (label, key) => {
      if (data[key]) {
        const val = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
        fields.push({ label, value: val });
      }
    };

    // Common
    add('Name', 'contact_name');
    add('Email', 'email');
    add('Phone', 'phone');

    switch (clientType) {
      case 'tenant':
        add('Company', 'company');
        add('Space Type', 'space_type');
        add('Size Range', 'sf_min');
        if (data.sf_min && data.sf_max) {
          fields[fields.length - 1].value = `${data.sf_min} - ${data.sf_max} SF`;
        }
        add('Budget', 'budget');
        add('Locations', 'locations');
        add('Timeline', 'timeline');
        break;

      case 'landlord':
        add('Property', 'property_name');
        add('Address', 'address');
        add('Property Type', 'property_type');
        add('Total SF', 'total_sf');
        add('Available SF', 'available_sf');
        add('Asking Rate', 'asking_rate');
        add('Goals', 'goals');
        add('Timeline', 'timeline');
        break;

      case 'buyer_seller':
        add('Intent', 'intent');
        add('Property Types', 'property_types');
        add('Target Market', 'target_market');
        add('Budget/Price', 'budget_range');
        add('Cap Rate Target', 'cap_rate');
        add('1031 Exchange', 'exchange_1031');
        add('Timeline', 'timeline');
        break;
    }

    return fields;
  }

  /**
   * Generate PDF summary using jsPDF (loaded from CDN on demand).
   */
  async function generatePDF() {
    const btn = document.getElementById('btn-download-pdf');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating...';
    }

    try {
      // Load jsPDF from CDN if not already loaded
      if (!window.jspdf) {
        await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const state = AppState.getState();
      const data = state.formData;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(19, 31, 19); // dark green
      doc.text('Resolute Real Estate', 20, 25);

      doc.setFontSize(12);
      doc.setTextColor(203, 161, 53); // gold
      doc.text('Client Onboarding Summary', 20, 33);

      // Divider
      doc.setDrawColor(203, 161, 53);
      doc.setLineWidth(0.5);
      doc.line(20, 38, 190, 38);

      // Content
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      let y = 48;

      const addLine = (label, value) => {
        if (!value) return;
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, 20, y);
        doc.setFont(undefined, 'normal');
        const val = String(value);
        // Word wrap long values
        const lines = doc.splitTextToSize(val, 120);
        doc.text(lines, 70, y);
        y += lines.length * 6 + 2;
      };

      addLine('Client Type', CLIENT_TYPE_LABELS[state.clientType] || state.clientType);
      addLine('Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

      y += 4;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(19, 31, 19);
      doc.text('Details', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const keyFields = getKeyFields(state.clientType, data);
      keyFields.forEach(({ label, value }) => {
        addLine(label, value);
        if (y > 270) { doc.addPage(); y = 20; }
      });

      y += 4;
      addLine('Agreement', state.agreementAccepted
        ? `${HelloSignIntegration.getFormName(state.clientType)} — Sent via HelloSign`
        : 'Not yet signed');

      if (state.files.length > 0) {
        addLine('Files Uploaded', state.files.map(f => f.name).join(', '));
      }

      // Footer
      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Jack Rohr, Managing Broker — (303) 842-1869 — jrohr@resoluteinv.com', 20, y);

      const clientName = data.contact_name || data.company || 'client';
      doc.save(`Resolute-Onboarding-${clientName.replace(/\s+/g, '-')}.pdf`);

    } catch (error) {
      console.error('PDF generation error:', error);
      ErrorHandler.showToast('PDF generation failed. Please try again.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -3px; margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Summary (PDF)
        `;
      }
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, populateAgreement, renderSummary };
})();

/**
 * Simple analytics / funnel tracking.
 */
const Analytics = (() => {
  const events = [];

  function trackStep(stepIndex) {
    const entry = {
      type: 'step_view',
      step: stepIndex,
      timestamp: Date.now()
    };
    events.push(entry);
    log(entry);
  }

  function trackEvent(name, data) {
    const entry = {
      type: name,
      data,
      timestamp: Date.now()
    };
    events.push(entry);
    log(entry);
  }

  function log(entry) {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[Analytics]', entry.type, entry);
    }
    // In production, send to your analytics endpoint:
    // navigator.sendBeacon('/api/analytics', JSON.stringify(entry));
  }

  function getEvents() {
    return [...events];
  }

  return { trackStep, trackEvent, getEvents };
})();

/**
 * Global error handler and toast notifications.
 */
const ErrorHandler = (() => {
  let toastContainer;

  function init() {
    // Create toast container
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('Uncaught error:', e.message);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled rejection:', e.reason);
    });

    // Offline detection
    window.addEventListener('offline', () => {
      showToast('You appear to be offline. Some features may not work.', 'warning');
    });

    window.addEventListener('online', () => {
      showToast('You\'re back online.', 'success');
    });
  }

  function showToast(message, type = 'error') {
    if (!toastContainer) init();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  return { init, showToast };
})();

// Boot the app
document.addEventListener('DOMContentLoaded', () => {
  ErrorHandler.init();
  App.init();
});
