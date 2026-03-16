/**
 * App initialization, event wiring, agreement template, and summary renderer.
 */
const App = (() => {

  // ===== Shared agreement sections =====
  const AGREEMENT_HEADER = (title) => `
<h4>${title}</h4>
<p>This Agreement ("Agreement") is entered into as of <strong>{{date}}</strong> by and between <strong>{{clientName}}</strong> ("Client") and <strong>Resolute Real Estate</strong>, a Colorado licensed real estate brokerage ("Broker"), represented by <strong>Jack Rohr</strong>, Managing Broker.</p>
`;

  const AGREEMENT_COMMON_SECTIONS = `
<h4>TERM</h4>
<p>This Agreement shall be effective as of the date first written above and shall continue for a period of twelve (12) months unless earlier terminated by either party upon thirty (30) days' written notice to the other party.</p>

<h4>CONFIDENTIALITY</h4>
<p>Broker shall maintain the confidentiality of all proprietary, financial, and business information provided by Client in connection with this engagement, and shall not disclose such information to any third party without Client's prior written consent, except as required by law or as necessary to perform Broker's duties hereunder.</p>

<h4>LIMITATION OF LIABILITY</h4>
<p>Neither party shall be liable to the other for any indirect, incidental, special, or consequential damages arising out of or related to this Agreement. Broker's total liability under this Agreement shall not exceed the amount of compensation actually received by Broker from Client.</p>

<h4>GOVERNING LAW</h4>
<p>This Agreement shall be governed by and construed in accordance with the laws of the State of Colorado. Any disputes shall be resolved through mediation prior to litigation, with venue in the county where the Broker's principal office is located.</p>

<h4>ENTIRE AGREEMENT</h4>
<p>This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, negotiations, and discussions. This Agreement may only be amended in writing signed by both parties.</p>
`;

  // ===== Tenant Representation Agreement =====
  const AGREEMENT_TENANT = AGREEMENT_HEADER('EXCLUSIVE TENANT REPRESENTATION AGREEMENT') + `
<h4>1. SCOPE OF REPRESENTATION</h4>
<p>Client hereby engages Broker as Client's <strong>exclusive tenant representative</strong> to assist in locating, evaluating, and negotiating lease terms for commercial space. Broker shall identify properties meeting Client's stated requirements including but not limited to: location preferences, size requirements, budget parameters, and any special needs outlined in the accompanying questionnaire.</p>

<h4>2. BROKER'S DUTIES</h4>
<p>Broker shall: (a) conduct a thorough market survey of available properties matching Client's criteria; (b) schedule and coordinate property tours; (c) provide market data, comparable lease analysis, and occupancy cost projections; (d) negotiate lease terms, concessions, and tenant improvement allowances on Client's behalf; (e) coordinate with Client's legal counsel for lease review; (f) assist with space planning and build-out coordination as needed; and (g) exercise reasonable skill and care throughout the engagement.</p>

<h4>3. CLIENT'S DUTIES</h4>
<p>Client shall: (a) work exclusively with Broker for all commercial space requirements during the term of this Agreement; (b) refer any direct landlord inquiries or proposals to Broker; (c) provide accurate and complete information regarding space needs, financial qualifications, and timeline; (d) promptly review properties presented and respond to Broker's communications; (e) not enter into direct negotiations with any landlord or their representative for space identified during this engagement.</p>

<h4>4. COMPENSATION</h4>
<p>Broker's compensation shall typically be paid by the landlord of the property leased by Client, as is customary in commercial real estate transactions. In the event a landlord does not offer tenant representative compensation, Client and Broker shall agree upon an alternative fee arrangement in writing prior to Client's execution of any lease. The standard commission rate shall be negotiated on a per-transaction basis.</p>

<h4>5. TAIL PERIOD</h4>
<p>If Client enters into a lease for any property identified or presented by Broker within six (6) months following termination of this Agreement, Broker shall be entitled to the commission that would have been due had this Agreement been in effect at the time of such lease execution.</p>
` + AGREEMENT_COMMON_SECTIONS;

  // ===== Landlord / Listing Agreement =====
  const AGREEMENT_LANDLORD = AGREEMENT_HEADER('EXCLUSIVE LISTING AGREEMENT') + `
<h4>1. SCOPE OF REPRESENTATION</h4>
<p>Client hereby grants Broker the <strong>exclusive right to lease and/or sell</strong> the property described in the accompanying questionnaire ("the Property"). Broker shall use commercially reasonable efforts to market the Property, procure qualified tenants or buyers, and negotiate transaction terms on Client's behalf.</p>

<h4>2. BROKER'S DUTIES</h4>
<p>Broker shall: (a) prepare a comprehensive marketing strategy for the Property including pricing recommendations based on comparable market data; (b) create professional marketing materials including offering memorandums, flyers, and online listings; (c) list the Property on relevant commercial real estate databases and platforms (CoStar, LoopNet, Crexi, and others as appropriate); (d) conduct property showings and tours with prospective tenants or buyers; (e) screen and qualify prospective tenants including financial review; (f) negotiate letter of intent (LOI) terms, lease terms, or purchase agreement terms on Client's behalf; (g) coordinate with Client's legal counsel and property management as needed; and (h) provide regular activity reports and market updates.</p>

<h4>3. CLIENT'S DUTIES</h4>
<p>Client shall: (a) refer all inquiries regarding the Property to Broker; (b) provide Broker with accurate property information including square footage, existing lease details, operating expenses, capital improvements, and environmental disclosures; (c) make the Property reasonably available for showings; (d) disclose any known material defects or conditions affecting the Property; (e) not enter into any lease, sale, or other transaction for the Property without Broker's involvement during the term of this Agreement; and (f) maintain appropriate property insurance throughout the listing period.</p>

<h4>4. COMPENSATION</h4>
<p>Client shall pay Broker a commission as follows: For <strong>lease transactions</strong>, a commission equal to a percentage of the aggregate base rental over the initial lease term, to be agreed upon in writing prior to marketing. For <strong>sale transactions</strong>, a commission equal to a percentage of the gross sale price, to be agreed upon in writing prior to marketing. Commission shall be earned upon execution of a binding lease or purchase agreement and payable at lease commencement or closing, as applicable. Broker may cooperate with and offer compensation to other licensed brokers representing prospective tenants or buyers.</p>

<h4>5. MARKETING EXPENSES</h4>
<p>Broker shall bear standard marketing costs including online listings and basic marketing materials. Client shall be responsible for any premium marketing expenses (professional photography, drone footage, signage, or premium platform placements) only if approved in writing in advance.</p>

<h4>6. TAIL PERIOD</h4>
<p>If a lease or sale is executed with any party who was introduced to, shown, or made aware of the Property during the term of this Agreement, or within twelve (12) months following its termination, Broker shall be entitled to the agreed-upon commission. Within ten (10) business days of termination, Broker shall provide Client with a written list of all parties so introduced.</p>
` + AGREEMENT_COMMON_SECTIONS;

  // ===== Buyer/Seller (Investment Sales) Agreement =====
  const AGREEMENT_BUYER_SELLER = AGREEMENT_HEADER('EXCLUSIVE INVESTMENT SALES REPRESENTATION AGREEMENT') + `
<h4>1. SCOPE OF REPRESENTATION</h4>
<p>Client hereby engages Broker as Client's <strong>exclusive representative</strong> for the {{intentDescription}} of commercial real estate as described in the accompanying questionnaire. Broker shall use commercially reasonable efforts to identify opportunities, conduct due diligence support, and negotiate transaction terms aligned with Client's investment objectives.</p>

<h4>2. BROKER'S DUTIES — ACQUISITIONS</h4>
<p>For acquisition engagements, Broker shall: (a) conduct targeted market research to identify properties matching Client's investment criteria including property type, geography, price range, and return thresholds; (b) source both on-market and off-market acquisition opportunities; (c) prepare preliminary financial analysis including pro forma projections, cap rate analysis, and cash-on-cash return estimates; (d) coordinate property tours, inspections, and due diligence activities; (e) negotiate letter of intent (LOI) and purchase agreement terms; (f) coordinate with Client's lender, attorney, accountant, and 1031 exchange intermediary as applicable; and (g) assist through closing.</p>

<h4>3. BROKER'S DUTIES — DISPOSITIONS</h4>
<p>For disposition engagements, Broker shall: (a) prepare a broker opinion of value (BOV) or comparative market analysis; (b) develop a comprehensive marketing and disposition strategy; (c) create professional offering materials including an offering memorandum (OM) with financial analysis; (d) maintain a confidential marketing process with qualified buyers; (e) qualify prospective buyers including proof of funds and track record verification; (f) negotiate LOI and purchase agreement terms; (g) manage the due diligence process; and (h) coordinate through closing.</p>

<h4>4. CLIENT'S DUTIES</h4>
<p>Client shall: (a) work exclusively with Broker for the transaction types described herein during the term of this Agreement; (b) provide accurate financial information, investment criteria, proof of funds or financing pre-approval as applicable; (c) promptly review opportunities, offers, and documents presented by Broker; (d) disclose all material facts regarding any property being sold; (e) not enter into direct negotiations with any party for properties identified or marketed by Broker; and (f) notify Broker of any changes to investment criteria or timeline.</p>

<h4>5. COMPENSATION</h4>
<p>For <strong>acquisition transactions</strong>, Broker's commission shall be paid by the seller or seller's broker as is customary, or by Client if no seller-side commission is offered, at a rate to be agreed upon in writing prior to Client's execution of any purchase agreement. For <strong>disposition transactions</strong>, Client shall pay Broker a commission equal to a percentage of the gross sale price, to be agreed upon in writing prior to marketing. Commission shall be earned upon execution of a binding purchase agreement and payable at closing. In the event of a <strong>1031 exchange</strong>, Broker shall coordinate with Client's qualified intermediary and commission shall be payable at the closing of the relinquished property sale.</p>

<h4>6. DUE DILIGENCE</h4>
<p>Broker shall assist Client in coordinating due diligence activities but shall not be responsible for the accuracy of information provided by third parties including sellers, appraisers, inspectors, or environmental consultants. Client acknowledges that Broker is not qualified to provide legal, tax, structural, or environmental advice and that Client should engage appropriate professionals for such matters.</p>

<h4>7. TAIL PERIOD</h4>
<p>If Client completes a transaction involving any property identified, presented, or marketed by Broker within twelve (12) months following termination of this Agreement, Broker shall be entitled to the commission that would have been due had this Agreement been in effect. Broker shall provide a written list of such properties within ten (10) business days of termination.</p>
` + AGREEMENT_COMMON_SECTIONS;

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

  function getAgreementTemplate(clientType) {
    switch (clientType) {
      case 'tenant': return AGREEMENT_TENANT;
      case 'landlord': return AGREEMENT_LANDLORD;
      case 'buyer_seller': return AGREEMENT_BUYER_SELLER;
      default: return AGREEMENT_TENANT;
    }
  }

  function populateAgreement() {
    const state = AppState.getState();
    const clientName = state.formData.contact_name || state.formData.company || 'Client';
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Determine intent description for buyer/seller
    const intent = state.formData.intent || 'acquisition and/or disposition';
    const intentMap = {
      buy: 'acquisition',
      sell: 'disposition',
      both: 'acquisition and disposition'
    };
    const intentDescription = intentMap[intent] || intent;

    const template = getAgreementTemplate(state.clientType);
    const agreementEl = document.getElementById('agreement-text');
    agreementEl.innerHTML = template
      .replace(/\{\{clientName\}\}/g, escapeHtml(clientName))
      .replace(/\{\{date\}\}/g, today)
      .replace(/\{\{intentDescription\}\}/g, intentDescription);

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
    const agreementNames = {
      tenant: 'Exclusive Tenant Representation Agreement',
      landlord: 'Exclusive Listing Agreement',
      buyer_seller: 'Exclusive Investment Sales Agreement'
    };
    html += `
      <div class="summary-section">
        <div class="summary-label">Agreement</div>
        <div class="summary-value">
          <strong>${agreementNames[state.clientType] || 'Representation Agreement'}</strong><br>
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
