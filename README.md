# Resolute Real Estate — Client Onboarding Portal

A professional, branded onboarding experience for new CRE clients. One shareable link walks clients through intake, a representation agreement, and document upload.

## Features

- **Branded Welcome Page** — Resolute Real Estate design system with Jack Rohr's contact info
- **Adaptive Questionnaire** — Dynamic forms based on client type (Tenant, Landlord/Owner, Buyer/Seller)
- **Representation Agreement** — Scrollable agreement with typed e-signature
- **Document Upload** — Drag-and-drop file upload with type detection
- **Confirmation Summary** — Full recap of submitted information with next steps

## Quick Start

1. Open `index.html` in any browser — no build step or server required
2. Deploy to GitHub Pages, Netlify, or any static host

## File Structure

```
├── index.html              # Single-page app
├── css/
│   ├── tokens.css          # Design system (colors, fonts, spacing)
│   ├── base.css            # Reset + global styles
│   ├── layout.css          # Wizard container + stepper
│   └── components.css      # All UI components
├── js/
│   ├── state.js            # Form state management
│   ├── wizard.js           # Step navigation
│   ├── questionnaire.js    # Dynamic form rendering
│   ├── validation.js       # Input validation
│   ├── upload.js           # File upload handling
│   └── app.js              # App init + agreement template
└── assets/
    └── resolute-logo.svg   # Logo placeholder
```

## Customization

- **Logo:** Replace `assets/resolute-logo.svg` with your actual logo
- **Colors/Fonts:** Edit `css/tokens.css`
- **Agreement Text:** Edit the `AGREEMENT_TEMPLATE` in `js/app.js`
- **Questionnaire Fields:** Edit field definitions in `js/questionnaire.js`

## Contact

Jack Rohr, Managing Broker
Resolute Real Estate
(303) 842-1869 | jrohr@resoluteinv.com
