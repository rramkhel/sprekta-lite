# Sprekta Lite

A personal calendar and productivity application.

## Project Structure

```
sprekta-lite/
├── index.html          # Main HTML file (517 lines)
├── css/
│   └── styles.css      # All application styles (1,640 lines)
├── js/
│   └── app.js          # Application logic and functionality (1,141 lines)
├── assets/             # For images, icons, and other static assets
├── docs/
│   ├── Sprekta_PRD.md  # Product Requirements Document
│   └── Sprekta_TechDoc.md  # Technical Documentation
└── README.md           # This file
```

## File Organization

The project has been refactored from a single monolithic HTML file (~3,293 lines) into a well-organized structure:

- **index.html**: Clean HTML structure with semantic markup
- **css/styles.css**: All CSS styles including:
  - Base styles and CSS variables
  - Component styles (header, profile, calendar, notes, etc.)
  - Responsive media queries
  - Animations and transitions

- **js/app.js**: JavaScript application logic including:
  - Event management
  - Calendar rendering
  - Chat functionality
  - Notes management
  - UI interactions and state management

## Getting Started

1. Open `index.html` in a modern web browser
2. The application loads external CSS and JavaScript files automatically
3. No build process required - it's a pure client-side application

## Features

- Calendar view with event management
- Chat interface for natural language input
- Notes taking functionality
- Quick capture modal for rapid input
- Profile management
- Responsive design for mobile and desktop

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses Lucide icons (loaded via CDN)
- Uses Inter font family (loaded via Google Fonts)

## Development

The application uses vanilla JavaScript with no framework dependencies. All state is managed in localStorage for persistence.

To modify:
- **Styles**: Edit `css/styles.css`
- **Functionality**: Edit `js/app.js`
- **Structure**: Edit `index.html`

Changes are reflected immediately on page refresh.
