/**
 * Auto-Generated Client Requirements Brief
 * Produces a polished, broker-ready PDF from intake data.
 * This is the doc Jack sends to landlords/listing agents when sourcing space.
 */
const RequirementsBrief = (() => {

  // Page layout constants
  const MARGIN = 20;
  const PAGE_WIDTH = 210; // A4 mm
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const LINE_HEIGHT = 6;

  const CLIENT_TYPE_TITLES = {
    tenant: 'Tenant Requirements Brief',
    landlord: 'Listing Summary Brief',
    buyer_seller: 'Investment Criteria Brief'
  };

  const CLIENT_TYPE_SUBTITLES = {
    tenant: 'Active Tenant Requirement — Confidential',
    landlord: 'Property Listing Overview — Prepared by Resolute Real Estate',
    buyer_seller: 'Acquisition / Disposition Criteria — Confidential'
  };

  /**
   * Generate and download the requirements brief PDF.
   */
  async function generate() {
    const state = AppState.getState();
    if (!state.clientType) return;

    // Load jsPDF on demand
    if (!window.jspdf) {
      await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const data = state.formData;
    let y = MARGIN;

    // === HEADER BAR ===
    doc.setFillColor(19, 31, 19); // dark green
    doc.rect(0, 0, PAGE_WIDTH, 38, 'F');

    // Gold accent line
    doc.setFillColor(203, 161, 53);
    doc.rect(0, 38, PAGE_WIDTH, 1.5, 'F');

    // Company name
    doc.setTextColor(203, 161, 53);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('RESOLUTE REAL ESTATE', MARGIN, 14);

    // Document title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(CLIENT_TYPE_TITLES[state.clientType] || 'Client Brief', MARGIN, 25);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(CLIENT_TYPE_SUBTITLES[state.clientType] || '', MARGIN, 33);

    // Date on right
    doc.setTextColor(203, 161, 53);
    doc.setFontSize(9);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(dateStr, PAGE_WIDTH - MARGIN, 14, { align: 'right' });

    // Lead score on right
    const score = LeadScoring.scoreIntake(state);
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Lead Score: ${score.total}/100 — ${score.label}`, PAGE_WIDTH - MARGIN, 33, { align: 'right' });

    y = 48;

    // === CONTACT INFORMATION ===
    y = sectionHeader(doc, 'Contact Information', y);
    y = infoRow(doc, 'Name', data.contact_name, y);
    if (data.company) y = infoRow(doc, 'Company', data.company, y);
    y = infoRow(doc, 'Email', data.email, y);
    y = infoRow(doc, 'Phone', data.phone, y);
    y += 4;

    // === TYPE-SPECIFIC SECTIONS ===
    switch (state.clientType) {
      case 'tenant':
        y = buildTenantBrief(doc, data, y);
        break;
      case 'landlord':
        y = buildLandlordBrief(doc, data, y);
        break;
      case 'buyer_seller':
        y = buildBuyerSellerBrief(doc, data, y);
        break;
    }

    // === AGREEMENT STATUS ===
    y = checkPageBreak(doc, y, 30);
    y = sectionHeader(doc, 'Agreement Status', y);
    const agreementName = HelloSignIntegration.getFormName(state.clientType);
    y = infoRow(doc, 'Document', agreementName, y);
    y = infoRow(doc, 'Status', state.agreementAccepted ? 'Sent for Signing via HelloSign' : 'Not Yet Signed', y);
    if (state.signatureDate) y = infoRow(doc, 'Date', state.signatureDate, y);
    y += 4;

    // === FILES ===
    if (state.files && state.files.length > 0) {
      y = checkPageBreak(doc, y, 20);
      y = sectionHeader(doc, 'Documents Uploaded', y);
      state.files.forEach(f => {
        y = checkPageBreak(doc, y, LINE_HEIGHT + 2);
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`• ${f.name} (${formatSize(f.size)})`, MARGIN + 2, y);
        y += LINE_HEIGHT;
      });
      y += 4;
    }

    // === INTERNAL NOTES (for broker only) ===
    y = checkPageBreak(doc, y, 40);
    y = sectionHeader(doc, 'Broker Notes (Internal)', y);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 248, 243); // parchment
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 30, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('Use this space for follow-up notes, next steps, and action items.', MARGIN + 4, y + 6);
    y += 36;

    // === FOOTER ===
    addFooter(doc);

    // Download
    const clientName = data.contact_name || data.company || 'Client';
    const typeLabel = state.clientType.replace('_', '-');
    doc.save(`Resolute-${typeLabel}-brief-${clientName.replace(/\s+/g, '-')}.pdf`);
  }

  function buildTenantBrief(doc, data, y) {
    // Space Requirements
    y = sectionHeader(doc, 'Space Requirements', y);

    const spaceTypeLabels = {
      office: 'Office', retail: 'Retail', industrial: 'Industrial / Warehouse',
      flex: 'Flex Space', medical: 'Medical / Healthcare', other: 'Other'
    };

    y = infoRow(doc, 'Space Type', spaceTypeLabels[data.space_type] || data.space_type, y);

    if (data.sf_min || data.sf_max) {
      const sfRange = data.sf_min && data.sf_max
        ? `${Number(data.sf_min).toLocaleString()} – ${Number(data.sf_max).toLocaleString()} SF`
        : data.sf_min ? `${Number(data.sf_min).toLocaleString()}+ SF` : `Up to ${Number(data.sf_max).toLocaleString()} SF`;
      y = infoRow(doc, 'Size Range', sfRange, y);
    }

    if (data.budget) y = infoRow(doc, 'Budget / Rate', data.budget, y);
    if (data.locations) y = infoRow(doc, 'Preferred Locations', data.locations, y);

    const timelineLabels = {
      immediate: 'Immediately (0-30 days)', '1-3months': '1-3 Months',
      '3-6months': '3-6 Months', '6-12months': '6-12 Months', '12plus': '12+ Months'
    };
    y = infoRow(doc, 'Timeline', timelineLabels[data.timeline] || data.timeline, y);
    y += 4;

    // Special Requirements
    if (data.requirements) {
      y = checkPageBreak(doc, y, 20);
      y = sectionHeader(doc, 'Special Requirements', y);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(data.requirements, CONTENT_WIDTH - 4);
      doc.text(lines, MARGIN + 2, y);
      y += lines.length * LINE_HEIGHT + 4;
    }

    return y;
  }

  function buildLandlordBrief(doc, data, y) {
    y = sectionHeader(doc, 'Property Details', y);
    if (data.property_name) y = infoRow(doc, 'Property Name', data.property_name, y);
    if (data.address) y = infoRow(doc, 'Address', data.address, y);

    const propTypeLabels = {
      office: 'Office', retail: 'Retail', industrial: 'Industrial / Warehouse',
      mixed: 'Mixed-Use', multifamily: 'Multifamily', other: 'Other'
    };
    y = infoRow(doc, 'Property Type', propTypeLabels[data.property_type] || data.property_type, y);

    if (data.total_sf) y = infoRow(doc, 'Total SF', Number(data.total_sf).toLocaleString() + ' SF', y);
    if (data.available_sf) y = infoRow(doc, 'Available SF', Number(data.available_sf).toLocaleString() + ' SF', y);
    if (data.asking_rate) y = infoRow(doc, 'Asking Rate', data.asking_rate, y);
    if (data.occupancy) y = infoRow(doc, 'Occupancy', data.occupancy + '%', y);
    y += 4;

    // Goals
    if (data.goals && data.goals.length > 0) {
      y = checkPageBreak(doc, y, 15);
      y = sectionHeader(doc, 'Owner Goals', y);
      const goalLabels = { leaseup: 'Lease-Up', sell: 'Sell', reposition: 'Reposition', management: 'Property Management' };
      const goalStr = data.goals.map(g => goalLabels[g] || g).join(', ');
      y = infoRow(doc, 'Goals', goalStr, y);

      const timelineLabels = {
        immediate: 'Immediately', '1-3months': '1-3 Months',
        '3-6months': '3-6 Months', '6-12months': '6-12 Months', flexible: 'Flexible'
      };
      y = infoRow(doc, 'Timeline', timelineLabels[data.timeline] || data.timeline, y);
      y += 4;
    }

    return y;
  }

  function buildBuyerSellerBrief(doc, data, y) {
    y = sectionHeader(doc, 'Investment Criteria', y);

    const intentLabels = { buy: 'Buyer', sell: 'Seller', both: 'Buyer & Seller' };
    y = infoRow(doc, 'Intent', intentLabels[data.intent] || data.intent, y);

    if (data.property_types && data.property_types.length > 0) {
      const ptLabels = {
        office: 'Office', retail: 'Retail', industrial: 'Industrial',
        multifamily: 'Multifamily', mixed: 'Mixed-Use', land: 'Land'
      };
      y = infoRow(doc, 'Property Types', data.property_types.map(t => ptLabels[t] || t).join(', '), y);
    }

    if (data.target_market) y = infoRow(doc, 'Target Market', data.target_market, y);
    if (data.budget_range) y = infoRow(doc, 'Budget / Price Range', data.budget_range, y);
    y += 4;

    // Financial Targets
    if (data.cap_rate || data.cash_on_cash) {
      y = checkPageBreak(doc, y, 20);
      y = sectionHeader(doc, 'Financial Targets', y);
      if (data.cap_rate) y = infoRow(doc, 'Target Cap Rate', data.cap_rate, y);
      if (data.cash_on_cash) y = infoRow(doc, 'Target Cash-on-Cash', data.cash_on_cash, y);

      const exchLabels = { yes: 'Yes — Active 1031', no: 'No', considering: 'Considering' };
      y = infoRow(doc, '1031 Exchange', exchLabels[data.exchange_1031] || data.exchange_1031, y);
      y += 4;
    }

    const timelineLabels = {
      immediate: 'Immediately', '1-3months': '1-3 Months',
      '3-6months': '3-6 Months', '6-12months': '6-12 Months', '12plus': '12+ Months'
    };
    y = checkPageBreak(doc, y, 10);
    y = infoRow(doc, 'Timeline', timelineLabels[data.timeline] || data.timeline, y);

    if (data.notes) {
      y += 2;
      y = checkPageBreak(doc, y, 20);
      y = sectionHeader(doc, 'Additional Notes', y);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(data.notes, CONTENT_WIDTH - 4);
      doc.text(lines, MARGIN + 2, y);
      y += lines.length * LINE_HEIGHT + 4;
    }

    return y;
  }

  // === PDF HELPERS ===

  function sectionHeader(doc, title, y) {
    y = checkPageBreak(doc, y, 15);

    // Gold accent line
    doc.setFillColor(203, 161, 53);
    doc.rect(MARGIN, y, 30, 0.8, 'F');
    y += 5;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(19, 31, 19);
    doc.text(title, MARGIN, y);
    y += 7;

    doc.setFont(undefined, 'normal');
    return y;
  }

  function infoRow(doc, label, value, y) {
    if (!value) return y;
    y = checkPageBreak(doc, y, LINE_HEIGHT + 2);

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(label + ':', MARGIN + 2, y);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    const valStr = String(value);
    const lines = doc.splitTextToSize(valStr, CONTENT_WIDTH - 52);
    doc.text(lines, MARGIN + 50, y);
    y += Math.max(LINE_HEIGHT, lines.length * LINE_HEIGHT) + 1;

    return y;
  }

  function checkPageBreak(doc, y, needed) {
    if (y + needed > 275) {
      doc.addPage();
      addFooter(doc);
      return MARGIN + 10;
    }
    return y;
  }

  function addFooter(doc) {
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);

    // Footer line
    doc.setDrawColor(203, 161, 53);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 282, PAGE_WIDTH - MARGIN, 282);

    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('CONFIDENTIAL — Prepared by Resolute Real Estate', MARGIN, 287);
    doc.text('Jack Rohr, Managing Broker | (303) 842-1869 | jrohr@resoluteinv.com', MARGIN, 291);
    doc.text(`Page ${pageCount}`, PAGE_WIDTH - MARGIN, 287, { align: 'right' });
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return { generate };
})();
