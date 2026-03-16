/**
 * Central state management for the onboarding wizard.
 * Includes localStorage persistence for save/resume.
 */
const AppState = (() => {
  const STORAGE_KEY = 'resolute_onboarding_state';
  let state = loadState() || createFreshState();

  function createFreshState() {
    return {
      currentStep: 0,
      clientType: null, // 'tenant' | 'landlord' | 'buyer_seller'
      formData: {},
      agreementAccepted: false,
      signatureName: '',
      signatureDate: '',
      files: [] // Note: File objects can't be serialized — files won't persist across sessions
    };
  }

  function getState() {
    return state;
  }

  function updateState(key, value) {
    state[key] = value;
    saveState();
  }

  function updateFormField(fieldName, value) {
    state.formData[fieldName] = value;
    saveState();
  }

  function getFormData() {
    return { ...state.formData };
  }

  function resetState() {
    state = createFreshState();
    clearStorage();
  }

  /**
   * Save serializable state to localStorage.
   */
  function saveState() {
    try {
      const serializable = {
        currentStep: state.currentStep,
        clientType: state.clientType,
        formData: state.formData,
        agreementAccepted: state.agreementAccepted,
        signatureName: state.signatureName,
        signatureDate: state.signatureDate,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      // localStorage unavailable or full — silently ignore
    }
  }

  /**
   * Load state from localStorage. Returns null if nothing saved.
   */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const saved = JSON.parse(raw);

      // Expire after 7 days
      if (saved.savedAt && Date.now() - saved.savedAt > 7 * 24 * 60 * 60 * 1000) {
        clearStorage();
        return null;
      }

      return {
        currentStep: saved.currentStep || 0,
        clientType: saved.clientType || null,
        formData: saved.formData || {},
        agreementAccepted: saved.agreementAccepted || false,
        signatureName: saved.signatureName || '',
        signatureDate: saved.signatureDate || '',
        files: [] // Can't restore File objects
      };
    } catch (e) {
      return null;
    }
  }

  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Check if there's a saved session to resume.
   */
  function hasSavedSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      return saved.currentStep > 0 || saved.clientType !== null;
    } catch (e) {
      return false;
    }
  }

  return {
    getState,
    updateState,
    updateFormField,
    getFormData,
    resetState,
    hasSavedSession
  };
})();
