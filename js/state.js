/**
 * Central state management for the onboarding wizard.
 */
const AppState = (() => {
  let state = createFreshState();

  function createFreshState() {
    return {
      currentStep: 0,
      clientType: null, // 'tenant' | 'landlord' | 'buyer_seller'
      formData: {},
      agreementAccepted: false,
      signatureName: '',
      signatureDate: '',
      files: []
    };
  }

  function getState() {
    return state;
  }

  function updateState(key, value) {
    state[key] = value;
  }

  function updateFormField(fieldName, value) {
    state.formData[fieldName] = value;
  }

  function getFormData() {
    return { ...state.formData };
  }

  function resetState() {
    state = createFreshState();
  }

  return {
    getState,
    updateState,
    updateFormField,
    getFormData,
    resetState
  };
})();
