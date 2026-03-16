/**
 * App initialization, event wiring, agreement template, and summary renderer.
 */
const App = (() => {

  const AGREEMENT_TEMPLATE = `
<h4>EXCLUSIVE REPRESENTATION AGREEMENT</h4>
<p>This Representation Agreement ("Agreement") is entered into as of <strong>{{date}}</strong> by and between <strong>{{clientName}}</strong> ("Client") and <strong>Resolute Real Estate</strong>, a Colorado licensed real estate brokerage ("Broker"), represented by <strong>Jack Rohr</strong>, Managing Broker.</p>

<h4>1. SCOPE OF REPRESENTATION</h4>
<p>Client hereby engages Broker to act as Client's exclusive representative in connection with commercial real estate transactions as described in the accompanying questionnaire. Broker shall use commercially reasonable efforts to assist Client in identifying, evaluating, and negotiating suitable commercial real estate opportunities.</p>

<h4>2. TERM</h4>
<p>This Agreement shall be effective as of the date first written above and shall continue for a period of twelve (12) months unless earlier terminated by either party upon thirty (30) days' written notice to the other party.</p>

<h4>3. BROKER'S DUTIES</h4>
<p>Broker shall: (a) exercise reasonable skill and care in the performance of its duties; (b) maintain the confidentiality of Client's proprietary information; (c) disclose to Client any known material facts affecting the value or desirability of properties; (d) account for all funds received on behalf of Client; and (e) comply with all applicable laws and regulations governing real estate brokerage.</p>

<h4>4. CLIENT'S DUTIES</h4>
<p>Client shall: (a) work exclusively with Broker during the term of this Agreement for the transaction types described herein; (b) provide Broker with accurate and complete information necessary to perform its duties; (c) promptly review and respond to communications from Broker; and (d) comply with all applicable laws and regulations.</p>

<h4>5. COMPENSATION</h4>
<p>Broker's compensation shall be negotiated on a per-transaction basis and confirmed in writing prior to the execution of any binding agreement. Compensation may be in the form of a commission, fee, or other arrangement as mutually agreed upon by the parties.</p>

<h4>6. LIMITATION OF LIABILITY</h4>
<p>Neither party shall be liable to the other for any indirect, incidental, special, or consequential damages arising out of or related to this Agreement. Broker's total liability under this Agreement shall not exceed the amount of compensation actually received by Broker from Client.</p>

<h4>7. GOVERNING LAW</h4>
<p>This Agreement shall be governed by and construed in accordance with the laws of the State of Colorado.</p>

<h4>8. ENTIRE AGREEMENT</h4>
<p>This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, negotiations, and discussions. This Agreement may only be amended in writing signed by both parties.</p>
`;

  const CLIENT_TYPE_LABELS = {
    tenant: 'Tenant Representative',
    landlord: 'Landlord / Owner',
    buyer_seller: 'Investment Sales'
  };

  function init() {
    Wizard.init();
    Upload.init();

    // Set today's date on signature field
    const dateField = document.getElementById('signature-date');
    if (dateField) {
      dateField.value = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    wireEvents();
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
    document.getElementById('btn-next-4').addEventListener('click', () => Wizard.goToStep(5));

    // Agreement checkbox and signature
    const checkbox = document.getElementById('agreement-checkbox');
    const sigName = document.getElementById('signature-name');

    checkbox.addEventListener('change', () => {
      AppState.updateState('agreementAccepted', checkbox.checked);
      Validation.clearStepError();
    });

    sigName.addEventListener('input', () => {
      AppState.updateState('signatureName', sigName.value);
      Validation.clearStepError();
    });

    // Start Over
    document.getElementById('btn-start-over').addEventListener('click', () => {
      AppState.resetState();

      // Reset UI
      document.querySelectorAll('.card-select').forEach(c => c.classList.remove('selected'));
      document.getElementById('questionnaire-form').innerHTML = '';
      checkbox.checked = false;
      sigName.value = '';
      document.getElementById('file-list').innerHTML = '';

      Wizard.goToStep(0);
    });
  }

  function populateAgreement() {
    const state = AppState.getState();
    const clientName = state.formData.contact_name || state.formData.company || 'Client';
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const agreementEl = document.getElementById('agreement-text');
    agreementEl.innerHTML = AGREEMENT_TEMPLATE
      .replace(/\{\{clientName\}\}/g, escapeHtml(clientName))
      .replace(/\{\{date\}\}/g, today);

    // Update signature date
    const dateField = document.getElementById('signature-date');
    if (dateField) dateField.value = today;
    AppState.updateState('signatureDate', today);
  }

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

    // Agreement
    html += `
      <div class="summary-section">
        <div class="summary-label">Agreement</div>
        <div class="summary-value">
          ${state.agreementAccepted ? 'Signed' : 'Not signed'}
          ${state.signatureName ? '&mdash; ' + escapeHtml(state.signatureName) : ''}
          ${state.signatureDate ? ' on ' + state.signatureDate : ''}
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, populateAgreement, renderSummary };
})();

// Boot the app
document.addEventListener('DOMContentLoaded', App.init);
