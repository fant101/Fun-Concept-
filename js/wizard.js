/**
 * Wizard navigation and stepper UI.
 */
const Wizard = (() => {
  const TOTAL_STEPS = 6;
  let panels, stepperSteps, stepperLines;

  function init() {
    panels = document.querySelectorAll('.step-panel');
    stepperSteps = document.querySelectorAll('.stepper-step');
    stepperLines = document.querySelectorAll('.stepper-line');
  }

  function goToStep(n) {
    // Bounds check
    if (n < 0 || n >= TOTAL_STEPS || !panels || !panels[n]) {
      console.warn('Wizard: invalid step', n);
      return false;
    }

    const state = AppState.getState();
    const current = state.currentStep;

    // Don't navigate to same step
    if (n === current) return true;

    // Validate before advancing (not when going back)
    if (n > current) {
      const validation = Validation.validateStep(current);
      if (!validation.valid) {
        Validation.showStepError(validation.errors[0]);
        return false;
      }
      Validation.clearStepError();
    } else {
      Validation.clearStepError();
    }

    // Special handling: render questionnaire when entering step 2
    if (n === 2) {
      if (!state.clientType) {
        Validation.showStepError('Please select a client type first.');
        return false;
      }
      Questionnaire.renderForm(state.clientType);
    }

    // Special handling: populate agreement when entering step 3
    if (n === 3) {
      App.populateAgreement();
    }

    // Special handling: render summary when entering step 5
    if (n === 5) {
      App.renderSummary();
    }

    // Hide current, show target
    panels.forEach(p => p.classList.remove('active'));
    panels[n].classList.add('active');

    // Update stepper
    renderStepper(n);

    // Update state
    AppState.updateState('currentStep', n);

    // Track step in analytics
    if (typeof Analytics !== 'undefined') {
      Analytics.trackStep(n);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return true;
  }

  function renderStepper(activeStep) {
    stepperSteps.forEach((step, i) => {
      step.classList.remove('active', 'completed');
      if (i === activeStep) {
        step.classList.add('active');
      } else if (i < activeStep) {
        step.classList.add('completed');
      }
    });

    stepperLines.forEach((line, i) => {
      line.classList.toggle('completed', i < activeStep);
    });
  }

  return { init, goToStep };
})();
