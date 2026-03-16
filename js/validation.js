/**
 * Per-step validation logic.
 */
const Validation = (() => {

  function validateStep(stepIndex) {
    switch (stepIndex) {
      case 0: return { valid: true, errors: [] };
      case 1: return validateClientType();
      case 2: return validateQuestionnaire();
      case 3: return validateAgreement();
      case 4: return { valid: true, errors: [] }; // Upload is optional
      default: return { valid: true, errors: [] };
    }
  }

  function validateClientType() {
    const state = AppState.getState();
    if (!state.clientType) {
      return { valid: false, errors: ['Please select a client type to continue.'] };
    }
    return { valid: true, errors: [] };
  }

  function validateQuestionnaire() {
    const state = AppState.getState();
    const fields = Questionnaire.getFieldDefinitions(state.clientType);
    const errors = [];
    let firstErrorField = null;

    fields.forEach(field => {
      if (!field.required) return;

      const value = state.formData[field.name];
      const wrapper = document.querySelector(`[data-field-name="${field.name}"]`);

      let isValid = true;
      let message = `${field.label} is required.`;

      if (field.type === 'checkbox-group') {
        if (!value || !Array.isArray(value) || value.length === 0) {
          isValid = false;
          message = `Please select at least one option for ${field.label}.`;
        }
      } else if (field.type === 'radio') {
        if (!value) {
          isValid = false;
        }
      } else {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          isValid = false;
        }
      }

      // Email format check
      if (isValid && field.type === 'email' && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          isValid = false;
          message = 'Please enter a valid email address.';
        }
      }

      if (!isValid && wrapper) {
        wrapper.classList.add('has-error');
        const errorEl = wrapper.querySelector('.form-error');
        if (errorEl) errorEl.textContent = message;
        if (!firstErrorField) firstErrorField = wrapper;
        errors.push(message);
      }
    });

    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = firstErrorField.querySelector('input, select, textarea');
      if (input) input.focus();
    }

    return { valid: errors.length === 0, errors };
  }

  function validateAgreement() {
    const state = AppState.getState();
    const errors = [];

    if (!state.agreementAccepted) {
      errors.push('Please accept the representation agreement to continue.');
    }

    if (!state.signatureName || state.signatureName.trim() === '') {
      errors.push('Please type your full name as a signature.');
    }

    return { valid: errors.length === 0, errors };
  }

  function showStepError(message) {
    let errorBox = document.querySelector('.step-panel.active .step-error');
    if (!errorBox) {
      errorBox = document.createElement('div');
      errorBox.className = 'step-error';
      const activePanel = document.querySelector('.step-panel.active');
      const nav = activePanel.querySelector('.step-nav');
      if (nav) {
        activePanel.insertBefore(errorBox, nav);
      } else {
        activePanel.appendChild(errorBox);
      }
    }
    errorBox.textContent = message;
    errorBox.classList.add('visible');
  }

  function clearStepError() {
    const errors = document.querySelectorAll('.step-error');
    errors.forEach(e => {
      e.classList.remove('visible');
      e.textContent = '';
    });
  }

  return { validateStep, showStepError, clearStepError };
})();
