/**
 * Lead Scoring Engine
 * Scores incoming client intakes based on deal potential, urgency, and completeness.
 * Produces a 0–100 score with breakdown by category.
 */
const LeadScoring = (() => {

  // Weight each scoring dimension (must sum to 100)
  const WEIGHTS = {
    dealSize: 30,      // Potential revenue/commission
    urgency: 25,       // How soon they need to act
    completeness: 20,  // How much info they provided
    readiness: 15,     // Signals of a serious buyer/tenant
    budgetClarity: 10  // Did they specify budget/rate?
  };

  // Timeline urgency scores (0–1)
  const TIMELINE_SCORES = {
    immediate: 1.0,
    '1-3months': 0.85,
    '3-6months': 0.6,
    '6-12months': 0.35,
    '12plus': 0.15,
    flexible: 0.4,
    '': 0
  };

  /**
   * Score a completed intake. Returns { total, breakdown, tier, label }.
   */
  function scoreIntake(state) {
    if (!state || !state.clientType) {
      return { total: 0, breakdown: {}, tier: 'unscored', label: 'Incomplete' };
    }

    const data = state.formData || {};
    const breakdown = {};

    // 1. Deal Size (based on SF, budget, property value)
    breakdown.dealSize = scoreDealSize(state.clientType, data);

    // 2. Urgency (timeline)
    breakdown.urgency = scoreUrgency(data);

    // 3. Completeness (% of fields filled)
    breakdown.completeness = scoreCompleteness(state.clientType, data);

    // 4. Readiness signals
    breakdown.readiness = scoreReadiness(state.clientType, data, state);

    // 5. Budget clarity
    breakdown.budgetClarity = scoreBudgetClarity(state.clientType, data);

    // Calculate weighted total
    let total = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
      total += (breakdown[key] || 0) * weight;
    }
    total = Math.round(total);

    // Determine tier
    const tier = getTier(total);

    return {
      total,
      breakdown,
      tier: tier.id,
      label: tier.label,
      color: tier.color
    };
  }

  function scoreDealSize(clientType, data) {
    switch (clientType) {
      case 'tenant': {
        const sfMax = parseInt(data.sf_max) || 0;
        const sfMin = parseInt(data.sf_min) || 0;
        const avgSf = sfMax > 0 ? (sfMin + sfMax) / 2 : sfMin;
        // Scale: 500 SF = 0.1, 5000 SF = 0.5, 20000+ SF = 1.0
        if (avgSf <= 0) return 0;
        if (avgSf >= 20000) return 1.0;
        return Math.min(1.0, avgSf / 20000 + 0.1);
      }
      case 'landlord': {
        const totalSf = parseInt(data.total_sf) || 0;
        const availSf = parseInt(data.available_sf) || 0;
        const sf = availSf > 0 ? availSf : totalSf;
        if (sf <= 0) return 0;
        if (sf >= 50000) return 1.0;
        return Math.min(1.0, sf / 50000 + 0.1);
      }
      case 'buyer_seller': {
        // Parse budget range for deal size signal
        // Handles formats: "$2M", "$5m", "$500K", "$2,000,000", "$2000000"
        const budget = data.budget_range || '';
        if (!budget) return 0;
        const millions = parseBudgetToMillions(budget);
        if (millions <= 0) return 0.3;  // Provided text but no parseable number
        if (millions >= 10) return 1.0;  // $10M+
        if (millions >= 5) return 0.8;   // $5M+
        if (millions >= 2) return 0.6;   // $2M+
        if (millions >= 1) return 0.4;   // $1M+
        if (millions >= 0.5) return 0.3; // $500K+
        return 0.2;
      }
      default:
        return 0;
    }
  }

  /**
   * Parse a budget string into millions. Handles "$2M", "$500K", "$2,000,000".
   * Returns the largest number found, normalized to millions.
   */
  function parseBudgetToMillions(str) {
    let maxMillions = 0;
    // Match number + optional suffix (K, M, B)
    const pattern = /[\$]?\s*([\d,.]+)\s*([KkMmBb])?/g;
    let match;
    while ((match = pattern.exec(str)) !== null) {
      let num = parseFloat(match[1].replace(/,/g, '')) || 0;
      const suffix = (match[2] || '').toUpperCase();
      if (suffix === 'B') num *= 1000;
      else if (suffix === 'M') num *= 1;
      else if (suffix === 'K') num /= 1000;
      else if (num >= 100000) num /= 1000000; // Raw large number → assume dollars
      // else: bare small number → assume millions (e.g., "$2" in "$2-5M" context)
      maxMillions = Math.max(maxMillions, num);
    }
    return maxMillions;
  }

  function scoreUrgency(data) {
    const timeline = data.timeline || '';
    return TIMELINE_SCORES[timeline] || 0;
  }

  function scoreCompleteness(clientType, data) {
    const fields = Questionnaire.getFieldDefinitions(clientType);
    if (!fields || fields.length === 0) return 0;

    let filled = 0;
    let total = 0;

    fields.forEach(field => {
      total++;
      const val = data[field.name];
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val) && val.length === 0) return;
        filled++;
      }
    });

    return total > 0 ? filled / total : 0;
  }

  function scoreReadiness(clientType, data, state) {
    let signals = 0;
    let maxSignals = 0;

    // Agreement signed/sent = strong readiness signal
    maxSignals += 2;
    if (state.agreementAccepted) signals += 2;

    // Files uploaded = engagement signal
    maxSignals += 1;
    if (state.files && state.files.length > 0) signals += 1;

    // Type-specific signals
    switch (clientType) {
      case 'tenant':
        maxSignals += 2;
        if (data.locations) signals += 1;       // Knows where they want to be
        if (data.requirements) signals += 1;     // Has specific requirements
        break;
      case 'landlord':
        maxSignals += 2;
        if (data.address) signals += 1;          // Has a specific property
        if (data.asking_rate) signals += 1;      // Knows their rate
        break;
      case 'buyer_seller':
        maxSignals += 3;
        if (data.exchange_1031 === 'yes') signals += 1;  // 1031 = motivated timeline
        if (data.cap_rate) signals += 1;         // Sophisticated buyer
        if (data.target_market) signals += 1;    // Knows the market
        break;
    }

    return maxSignals > 0 ? signals / maxSignals : 0;
  }

  function scoreBudgetClarity(clientType, data) {
    switch (clientType) {
      case 'tenant':
        return data.budget ? 1.0 : 0;
      case 'landlord':
        return data.asking_rate ? 1.0 : 0;
      case 'buyer_seller': {
        let score = 0;
        if (data.budget_range) score += 0.5;
        if (data.cap_rate) score += 0.25;
        if (data.cash_on_cash) score += 0.25;
        return score;
      }
      default:
        return 0;
    }
  }

  function getTier(score) {
    if (score >= 80) return { id: 'hot', label: 'Hot Lead', color: '#C53030' };
    if (score >= 60) return { id: 'warm', label: 'Warm Lead', color: '#CBA135' };
    if (score >= 40) return { id: 'nurture', label: 'Nurture', color: '#2D6A2E' };
    if (score >= 20) return { id: 'cold', label: 'Cold', color: '#6B6B60' };
    return { id: 'unscored', label: 'Incomplete', color: '#9E9E90' };
  }

  /**
   * Render the lead score card into a container element.
   */
  function renderScoreCard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = AppState.getState();
    const result = scoreIntake(state);

    container.innerHTML = `
      <div class="lead-score-card">
        <div class="lead-score-header">
          <span class="lead-score-label">Lead Score</span>
          <span class="lead-score-tier" style="color: ${result.color}">${result.label}</span>
        </div>
        <div class="lead-score-ring-container">
          <svg class="lead-score-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E2D9" stroke-width="8"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="${result.color}" stroke-width="8"
              stroke-dasharray="${2 * Math.PI * 52}"
              stroke-dashoffset="${2 * Math.PI * 52 * (1 - result.total / 100)}"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"
              class="lead-score-progress"/>
          </svg>
          <div class="lead-score-number">${result.total}</div>
        </div>
        <div class="lead-score-breakdown">
          ${renderBreakdownBar('Deal Size', result.breakdown.dealSize, WEIGHTS.dealSize)}
          ${renderBreakdownBar('Urgency', result.breakdown.urgency, WEIGHTS.urgency)}
          ${renderBreakdownBar('Completeness', result.breakdown.completeness, WEIGHTS.completeness)}
          ${renderBreakdownBar('Readiness', result.breakdown.readiness, WEIGHTS.readiness)}
          ${renderBreakdownBar('Budget Clarity', result.breakdown.budgetClarity, WEIGHTS.budgetClarity)}
        </div>
      </div>
    `;
  }

  function renderBreakdownBar(label, score, weight) {
    const pct = Math.round((score || 0) * 100);
    const contribution = Math.round((score || 0) * weight);
    return `
      <div class="score-breakdown-row">
        <span class="score-breakdown-label">${label}</span>
        <div class="score-breakdown-bar-track">
          <div class="score-breakdown-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="score-breakdown-value">+${contribution}</span>
      </div>
    `;
  }

  return { scoreIntake, renderScoreCard };
})();
