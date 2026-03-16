/**
 * Dynamic questionnaire form rendering based on client type.
 */
const Questionnaire = (() => {

  const fieldDefinitions = {
    tenant: [
      { name: 'company', label: 'Company Name', type: 'text', required: true, placeholder: 'Your company name' },
      { name: 'contact_name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@company.com' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '(303) 555-0100' },
      { name: 'space_type', label: 'Space Type', type: 'select', required: true, options: [
        { value: '', label: 'Select space type...' },
        { value: 'office', label: 'Office' },
        { value: 'retail', label: 'Retail' },
        { value: 'industrial', label: 'Industrial / Warehouse' },
        { value: 'flex', label: 'Flex Space' },
        { value: 'medical', label: 'Medical / Healthcare' },
        { value: 'other', label: 'Other' }
      ]},
      { name: 'sf_min', label: 'Minimum Square Footage', type: 'number', required: true, placeholder: 'e.g. 2000', row: 'sf' },
      { name: 'sf_max', label: 'Maximum Square Footage', type: 'number', required: true, placeholder: 'e.g. 5000', row: 'sf' },
      { name: 'budget', label: 'Budget / Rate Expectations', type: 'text', required: false, placeholder: 'e.g. $20-25/SF NNN' },
      { name: 'locations', label: 'Preferred Locations / Submarkets', type: 'text', required: false, placeholder: 'e.g. Downtown Denver, DTC, Boulder' },
      { name: 'timeline', label: 'Timeline', type: 'select', required: true, options: [
        { value: '', label: 'When do you need space?' },
        { value: 'immediate', label: 'Immediately (0-30 days)' },
        { value: '1-3months', label: '1-3 Months' },
        { value: '3-6months', label: '3-6 Months' },
        { value: '6-12months', label: '6-12 Months' },
        { value: '12plus', label: '12+ Months' }
      ]},
      { name: 'requirements', label: 'Special Requirements', type: 'textarea', required: false, placeholder: 'Parking needs, loading docks, build-out requirements, etc.' }
    ],

    landlord: [
      { name: 'contact_name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Full name' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@company.com' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '(303) 555-0100' },
      { name: 'property_name', label: 'Property Name', type: 'text', required: true, placeholder: 'e.g. Resolute Business Center' },
      { name: 'address', label: 'Property Address', type: 'text', required: true, placeholder: 'Full street address' },
      { name: 'property_type', label: 'Property Type', type: 'select', required: true, options: [
        { value: '', label: 'Select property type...' },
        { value: 'office', label: 'Office' },
        { value: 'retail', label: 'Retail' },
        { value: 'industrial', label: 'Industrial / Warehouse' },
        { value: 'mixed', label: 'Mixed-Use' },
        { value: 'multifamily', label: 'Multifamily' },
        { value: 'other', label: 'Other' }
      ]},
      { name: 'total_sf', label: 'Total Square Footage', type: 'number', required: true, placeholder: 'e.g. 50000', row: 'sf' },
      { name: 'available_sf', label: 'Available Square Footage', type: 'number', required: true, placeholder: 'e.g. 15000', row: 'sf' },
      { name: 'asking_rate', label: 'Current Asking Rate', type: 'text', required: false, placeholder: 'e.g. $22/SF NNN' },
      { name: 'occupancy', label: 'Current Occupancy %', type: 'number', required: false, placeholder: 'e.g. 85' },
      { name: 'goals', label: 'Goals', type: 'checkbox-group', required: true, options: [
        { value: 'leaseup', label: 'Lease-Up' },
        { value: 'sell', label: 'Sell' },
        { value: 'reposition', label: 'Reposition' },
        { value: 'management', label: 'Property Management' }
      ]},
      { name: 'timeline', label: 'Timeline', type: 'select', required: true, options: [
        { value: '', label: 'What is your timeline?' },
        { value: 'immediate', label: 'Immediately' },
        { value: '1-3months', label: '1-3 Months' },
        { value: '3-6months', label: '3-6 Months' },
        { value: '6-12months', label: '6-12 Months' },
        { value: 'flexible', label: 'Flexible' }
      ]}
    ],

    buyer_seller: [
      { name: 'contact_name', label: 'Name', type: 'text', required: true, placeholder: 'Full name or company name' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@company.com' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '(303) 555-0100' },
      { name: 'intent', label: 'Are you looking to...', type: 'radio', required: true, options: [
        { value: 'buy', label: 'Buy' },
        { value: 'sell', label: 'Sell' },
        { value: 'both', label: 'Both' }
      ]},
      { name: 'property_types', label: 'Property Type Preferences', type: 'checkbox-group', required: true, options: [
        { value: 'office', label: 'Office' },
        { value: 'retail', label: 'Retail' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'multifamily', label: 'Multifamily' },
        { value: 'mixed', label: 'Mixed-Use' },
        { value: 'land', label: 'Land' }
      ]},
      { name: 'target_market', label: 'Target Market / Geography', type: 'text', required: false, placeholder: 'e.g. Denver Metro, Front Range, Colorado' },
      { name: 'budget_range', label: 'Budget Range / Asking Price', type: 'text', required: true, placeholder: 'e.g. $2M - $5M' },
      { name: 'cap_rate', label: 'Target Cap Rate', type: 'text', required: false, placeholder: 'e.g. 6.5% - 8%', row: 'metrics' },
      { name: 'cash_on_cash', label: 'Target Cash-on-Cash Return', type: 'text', required: false, placeholder: 'e.g. 8% - 12%', row: 'metrics' },
      { name: 'exchange_1031', label: '1031 Exchange?', type: 'radio', required: true, options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'considering', label: 'Considering' }
      ]},
      { name: 'timeline', label: 'Timeline', type: 'select', required: true, options: [
        { value: '', label: 'What is your timeline?' },
        { value: 'immediate', label: 'Immediately' },
        { value: '1-3months', label: '1-3 Months' },
        { value: '3-6months', label: '3-6 Months' },
        { value: '6-12months', label: '6-12 Months' },
        { value: '12plus', label: '12+ Months' }
      ]},
      { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Any other details about your investment criteria or goals...' }
    ]
  };

  function renderForm(clientType) {
    const container = document.getElementById('questionnaire-form');
    const fields = fieldDefinitions[clientType];
    if (!fields) return;

    container.innerHTML = '';

    let currentRow = null;
    let rowDiv = null;

    fields.forEach(field => {
      // Handle row grouping
      if (field.row && field.row === currentRow && rowDiv) {
        rowDiv.appendChild(createField(field));
        return;
      }

      if (field.row) {
        currentRow = field.row;
        rowDiv = document.createElement('div');
        rowDiv.className = 'form-row';
        rowDiv.appendChild(createField(field));
        container.appendChild(rowDiv);
        return;
      }

      currentRow = null;
      rowDiv = null;
      container.appendChild(createField(field));
    });
  }

  function createField(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-field';
    wrapper.dataset.fieldName = field.name;

    const label = document.createElement('label');
    label.setAttribute('for', `field-${field.name}`);
    label.innerHTML = field.label + (field.required ? ' <span class="required-mark">*</span>' : '');
    wrapper.appendChild(label);

    let input;
    const savedData = AppState.getFormData();
    const savedValue = savedData[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        input = document.createElement('input');
        input.type = field.type;
        input.id = `field-${field.name}`;
        input.name = field.name;
        input.className = 'form-input';
        input.placeholder = field.placeholder || '';
        input.required = field.required;
        if (savedValue != null && savedValue !== '') input.value = savedValue;
        input.addEventListener('input', () => {
          AppState.updateFormField(field.name, input.value);
          clearFieldError(wrapper);
        });
        wrapper.appendChild(input);
        break;

      case 'select':
        input = document.createElement('select');
        input.id = `field-${field.name}`;
        input.name = field.name;
        input.className = 'form-input';
        input.required = field.required;
        field.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          input.appendChild(option);
        });
        if (savedValue != null && savedValue !== '') input.value = savedValue;
        input.addEventListener('change', () => {
          AppState.updateFormField(field.name, input.value);
          clearFieldError(wrapper);
        });
        wrapper.appendChild(input);
        break;

      case 'textarea':
        input = document.createElement('textarea');
        input.id = `field-${field.name}`;
        input.name = field.name;
        input.className = 'form-input';
        input.placeholder = field.placeholder || '';
        input.required = field.required;
        if (savedValue != null && savedValue !== '') input.value = savedValue;
        input.addEventListener('input', () => {
          AppState.updateFormField(field.name, input.value);
          clearFieldError(wrapper);
        });
        wrapper.appendChild(input);
        break;

      case 'radio':
        const radioGroup = document.createElement('div');
        radioGroup.className = 'radio-group';
        field.options.forEach(opt => {
          const radioLabel = document.createElement('label');
          radioLabel.className = 'radio-label';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = field.name;
          radio.value = opt.value;
          if (savedValue === opt.value) radio.checked = true;
          radio.addEventListener('change', () => {
            AppState.updateFormField(field.name, opt.value);
            clearFieldError(wrapper);
          });
          radioLabel.appendChild(radio);
          radioLabel.appendChild(document.createElement('span'));
          radioLabel.lastChild.textContent = opt.label;
          radioGroup.appendChild(radioLabel);
        });
        wrapper.appendChild(radioGroup);
        break;

      case 'checkbox-group':
        const cbGroup = document.createElement('div');
        cbGroup.className = 'checkbox-group';
        const savedArr = Array.isArray(savedValue) ? savedValue : [];
        field.options.forEach(opt => {
          const cbLabel = document.createElement('label');
          cbLabel.className = 'checkbox-label';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.name = field.name;
          cb.value = opt.value;
          if (savedArr.includes(opt.value)) cb.checked = true;
          cb.addEventListener('change', () => {
            const checked = cbGroup.querySelectorAll('input:checked');
            const values = Array.from(checked).map(c => c.value);
            AppState.updateFormField(field.name, values);
            clearFieldError(wrapper);
          });
          cbLabel.appendChild(cb);
          cbLabel.appendChild(document.createElement('span'));
          cbLabel.lastChild.textContent = opt.label;
          cbGroup.appendChild(cbLabel);
        });
        wrapper.appendChild(cbGroup);
        break;
    }

    // Error message element
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    wrapper.appendChild(errorEl);

    return wrapper;
  }

  function clearFieldError(wrapper) {
    wrapper.classList.remove('has-error');
    const err = wrapper.querySelector('.form-error');
    if (err) err.textContent = '';
  }

  function getFieldDefinitions(clientType) {
    return fieldDefinitions[clientType] || [];
  }

  return { renderForm, getFieldDefinitions };
})();
