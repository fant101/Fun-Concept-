/**
 * Intake Analytics Dashboard
 * Tracks all completed intakes and provides pipeline visibility.
 * Data stored in localStorage; in production, this would hit an API.
 */
const IntakeAnalytics = (() => {

  const STORAGE_KEY = 'resolute_intake_analytics';

  /**
   * Save a completed intake to the analytics store.
   */
  function recordIntake(state) {
    const intakes = loadIntakes();
    const score = LeadScoring.scoreIntake(state);
    const data = state.formData || {};

    const record = {
      id: generateId(),
      timestamp: Date.now(),
      clientType: state.clientType,
      contactName: data.contact_name || data.company || 'Unknown',
      email: data.email || '',
      phone: data.phone || '',
      company: data.company || '',
      leadScore: score.total,
      leadTier: score.tier,
      leadLabel: score.label,
      agreementStatus: state.agreementAccepted ? 'signed' : 'pending',
      filesCount: (state.files || []).length,
      timeline: data.timeline || '',
      status: 'new', // new → contacted → active → closed
      // Store key metrics per type
      metrics: extractMetrics(state.clientType, data),
      scoreBreakdown: score.breakdown
    };

    intakes.push(record);
    saveIntakes(intakes);
    return record;
  }

  function extractMetrics(clientType, data) {
    switch (clientType) {
      case 'tenant':
        return {
          spaceType: data.space_type || '',
          sfMin: data.sf_min || '',
          sfMax: data.sf_max || '',
          budget: data.budget || '',
          locations: data.locations || '',
          timeline: data.timeline || ''
        };
      case 'landlord':
        return {
          propertyName: data.property_name || '',
          address: data.address || '',
          propertyType: data.property_type || '',
          totalSf: data.total_sf || '',
          availableSf: data.available_sf || '',
          askingRate: data.asking_rate || '',
          goals: data.goals || []
        };
      case 'buyer_seller':
        return {
          intent: data.intent || '',
          propertyTypes: data.property_types || [],
          budgetRange: data.budget_range || '',
          capRate: data.cap_rate || '',
          exchange1031: data.exchange_1031 || '',
          targetMarket: data.target_market || ''
        };
      default:
        return {};
    }
  }

  /**
   * Get pipeline summary statistics.
   */
  function getPipelineStats() {
    const intakes = loadIntakes();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recent30 = intakes.filter(i => i.timestamp >= thirtyDaysAgo);
    const recent7 = intakes.filter(i => i.timestamp >= sevenDaysAgo);

    // Type breakdown
    const byType = { tenant: 0, landlord: 0, buyer_seller: 0 };
    recent30.forEach(i => { if (byType[i.clientType] !== undefined) byType[i.clientType]++; });

    // Tier breakdown
    const byTier = { hot: 0, warm: 0, nurture: 0, cold: 0 };
    recent30.forEach(i => { if (byTier[i.leadTier] !== undefined) byTier[i.leadTier]++; });

    // Status breakdown
    const byStatus = { new: 0, contacted: 0, active: 0, closed: 0 };
    intakes.forEach(i => { if (byStatus[i.status] !== undefined) byStatus[i.status]++; });

    // Agreement rate
    const signedCount = recent30.filter(i => i.agreementStatus === 'signed').length;
    const agreementRate = recent30.length > 0 ? Math.round(signedCount / recent30.length * 100) : 0;

    // Average lead score
    const avgScore = recent30.length > 0
      ? Math.round(recent30.reduce((sum, i) => sum + i.leadScore, 0) / recent30.length)
      : 0;

    return {
      total: intakes.length,
      last30Days: recent30.length,
      last7Days: recent7.length,
      byType,
      byTier,
      byStatus,
      agreementRate,
      avgScore,
      topLeads: intakes
        .filter(i => i.status !== 'closed')
        .sort((a, b) => b.leadScore - a.leadScore)
        .slice(0, 5)
    };
  }

  /**
   * Render the analytics dashboard into a container.
   */
  function renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = getPipelineStats();
    const intakes = loadIntakes();

    container.innerHTML = `
      <div class="analytics-dashboard">
        <div class="analytics-header">
          <h2>Intake Analytics</h2>
          <p class="analytics-subtitle">Pipeline overview and lead intelligence</p>
        </div>

        <!-- KPI Cards -->
        <div class="analytics-kpi-grid">
          ${kpiCard('Total Intakes', stats.total, '')}
          ${kpiCard('Last 30 Days', stats.last30Days, stats.last7Days > 0 ? `+${stats.last7Days} this week` : '')}
          ${kpiCard('Avg Lead Score', stats.avgScore + '/100', stats.avgScore >= 60 ? 'Strong pipeline' : '')}
          ${kpiCard('Agreement Rate', stats.agreementRate + '%', `${stats.byStatus.new} awaiting signature`)}
        </div>

        <!-- Pipeline by Type -->
        <div class="analytics-section">
          <h3>By Client Type (30 days)</h3>
          <div class="analytics-bar-chart">
            ${typeBar('Tenant', stats.byType.tenant, stats.last30Days)}
            ${typeBar('Landlord', stats.byType.landlord, stats.last30Days)}
            ${typeBar('Buyer/Seller', stats.byType.buyer_seller, stats.last30Days)}
          </div>
        </div>

        <!-- Lead Quality Distribution -->
        <div class="analytics-section">
          <h3>Lead Quality (30 days)</h3>
          <div class="analytics-tier-grid">
            ${tierBadge('Hot', stats.byTier.hot, '#C53030')}
            ${tierBadge('Warm', stats.byTier.warm, '#CBA135')}
            ${tierBadge('Nurture', stats.byTier.nurture, '#2D6A2E')}
            ${tierBadge('Cold', stats.byTier.cold, '#6B6B60')}
          </div>
        </div>

        <!-- Top Leads -->
        ${stats.topLeads.length > 0 ? `
          <div class="analytics-section">
            <h3>Top Active Leads</h3>
            <div class="analytics-leads-table">
              ${stats.topLeads.map(lead => leadRow(lead)).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Recent Intakes -->
        ${intakes.length > 0 ? `
          <div class="analytics-section">
            <h3>Recent Intakes</h3>
            <div class="analytics-leads-table">
              ${intakes.slice(-10).reverse().map(lead => leadRow(lead)).join('')}
            </div>
          </div>
        ` : `
          <div class="analytics-empty">
            <p>No intakes recorded yet. Completed onboarding submissions will appear here.</p>
          </div>
        `}
      </div>
    `;

    // Wire up status change buttons
    container.querySelectorAll('.lead-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const newStatus = btn.dataset.status;
        updateIntakeStatus(id, newStatus);
        renderDashboard(containerId);
      });
    });
  }

  function kpiCard(label, value, subtitle) {
    return `
      <div class="analytics-kpi">
        <div class="analytics-kpi-value">${value}</div>
        <div class="analytics-kpi-label">${label}</div>
        ${subtitle ? `<div class="analytics-kpi-sub">${subtitle}</div>` : ''}
      </div>
    `;
  }

  function typeBar(label, count, total) {
    const pct = total > 0 ? Math.round(count / total * 100) : 0;
    return `
      <div class="analytics-bar-row">
        <span class="analytics-bar-label">${label}</span>
        <div class="analytics-bar-track">
          <div class="analytics-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="analytics-bar-count">${count}</span>
      </div>
    `;
  }

  function tierBadge(label, count, color) {
    return `
      <div class="analytics-tier-badge">
        <div class="analytics-tier-dot" style="background: ${color}"></div>
        <span class="analytics-tier-count">${count}</span>
        <span class="analytics-tier-label">${label}</span>
      </div>
    `;
  }

  function leadRow(lead) {
    const date = new Date(lead.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const typeLabels = { tenant: 'Tenant', landlord: 'Landlord', buyer_seller: 'Buyer/Seller' };
    const statusColors = { new: '#CBA135', contacted: '#2D6A2E', active: '#131F13', closed: '#9E9E90' };
    const nextStatus = { new: 'contacted', contacted: 'active', active: 'closed' };

    return `
      <div class="analytics-lead-row">
        <div class="analytics-lead-score" style="color: ${lead.leadScore >= 60 ? '#CBA135' : '#6B6B60'}">${lead.leadScore}</div>
        <div class="analytics-lead-info">
          <div class="analytics-lead-name">${escapeHtml(lead.contactName)}</div>
          <div class="analytics-lead-meta">${typeLabels[lead.clientType] || lead.clientType} · ${date}</div>
        </div>
        <div class="analytics-lead-status">
          <span class="analytics-status-dot" style="background: ${statusColors[lead.status] || '#9E9E90'}"></span>
          <span>${lead.status}</span>
        </div>
        ${nextStatus[lead.status] ? `
          <button class="lead-status-btn btn-sm btn-secondary" data-id="${lead.id}" data-status="${nextStatus[lead.status]}" type="button">
            → ${nextStatus[lead.status]}
          </button>
        ` : ''}
      </div>
    `;
  }

  // === STATUS MANAGEMENT ===

  function updateIntakeStatus(id, newStatus) {
    const intakes = loadIntakes();
    const intake = intakes.find(i => i.id === id);
    if (intake) {
      intake.status = newStatus;
      saveIntakes(intakes);
    }
  }

  // === STORAGE ===

  function loadIntakes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveIntakes(intakes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(intakes));
    } catch (e) {
      console.warn('Failed to save intake analytics:', e);
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return { recordIntake, getPipelineStats, renderDashboard, loadIntakes };
})();
