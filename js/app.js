/**
 * App initialization, event wiring, and summary renderer.
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
  }

  /**
   * Populate agreement step with HelloSign flow for the correct DORA form.
   */
  function populateAgreement() {
    const state = AppState.getState();
    HelloSignIntegration.renderAgreementStep(state.clientType);
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
