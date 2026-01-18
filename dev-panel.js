/**
 * Developer Panel for Demo Mode
 *
 * Provides in-app testing controls:
 * - Toggle between demo/real mode
 * - Quick scenario selection
 * - Response inspector
 * - Action log
 * - Visual indicators
 */

import { mockAI } from './test-data/mock-ai-engine.js';
import { quickCaptureScenarios } from './test-data/scenarios/quick-capture-scenarios.js';
import { triageScenarios } from './test-data/scenarios/triage-scenarios.js';
import * as versionUI from './versioning/version-ui.js';

// ============================================
// STATE MANAGEMENT
// ============================================

let devPanelState = {
  isOpen: false,
  lastResponse: null,
  actionLog: [],
  selectedScenario: null
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the dev panel
 */
export function initDevPanel() {
  // Restore demo mode state from localStorage
  const savedDemoMode = localStorage.getItem('DEMO_MODE');
  if (savedDemoMode !== null) {
    window.DEMO_MODE = savedDemoMode === 'true';
  }

  // Set up event listeners
  setupEventListeners();

  // Update UI to reflect current state
  updateDemoModeUI();

  // Initialize version UI
  versionUI.init();

  console.log('[Dev Panel] Initialized. Demo mode:', window.DEMO_MODE);
}

/**
 * Set up event listeners for dev panel controls
 */
function setupEventListeners() {
  // Toggle dev panel
  const devBadge = document.getElementById('dev-badge');
  if (devBadge) {
    devBadge.addEventListener('click', toggleDevPanel);
  }

  // Close dev panel
  const closeBtn = document.getElementById('dev-panel-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => setDevPanelOpen(false));
  }

  // Demo mode toggle
  const demoToggle = document.getElementById('demo-mode-toggle');
  if (demoToggle) {
    demoToggle.addEventListener('change', handleDemoModeToggle);
  }

  // Scenario selector
  const scenarioSelect = document.getElementById('scenario-select');
  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', handleScenarioSelect);
  }

  // Load scenario button
  const loadScenarioBtn = document.getElementById('load-scenario-btn');
  if (loadScenarioBtn) {
    loadScenarioBtn.addEventListener('click', loadSelectedScenario);
  }

  // Clear log button
  const clearLogBtn = document.getElementById('clear-log-btn');
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', clearActionLog);
  }
}

// ============================================
// PANEL CONTROLS
// ============================================

/**
 * Toggle dev panel open/closed
 */
function toggleDevPanel() {
  setDevPanelOpen(!devPanelState.isOpen);
}

/**
 * Set dev panel open state
 */
function setDevPanelOpen(isOpen) {
  devPanelState.isOpen = isOpen;
  const panel = document.getElementById('dev-panel');
  if (panel) {
    panel.classList.toggle('open', isOpen);
  }
}

/**
 * Handle demo mode toggle
 */
function handleDemoModeToggle(event) {
  window.DEMO_MODE = event.target.checked;
  localStorage.setItem('DEMO_MODE', window.DEMO_MODE);
  updateDemoModeUI();
  logAction(`Demo mode ${window.DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Update UI to reflect demo mode state
 */
function updateDemoModeUI() {
  // Update toggle checkbox
  const toggle = document.getElementById('demo-mode-toggle');
  if (toggle) {
    toggle.checked = window.DEMO_MODE;
  }

  // Update demo pill in header
  const pill = document.getElementById('demo-pill');
  if (pill) {
    pill.style.display = window.DEMO_MODE ? 'inline-flex' : 'none';
  }

  // Update dev badge appearance
  const badge = document.getElementById('dev-badge');
  if (badge) {
    badge.classList.toggle('active', window.DEMO_MODE);
  }

  // Update scenario controls visibility
  const scenarioControls = document.getElementById('scenario-controls');
  if (scenarioControls) {
    scenarioControls.style.display = window.DEMO_MODE ? 'block' : 'none';
  }
}

// ============================================
// SCENARIO MANAGEMENT
// ============================================

/**
 * Populate scenario selector dropdown
 */
export function populateScenarioSelector() {
  const select = document.getElementById('scenario-select');
  if (!select) return;

  // Clear existing options
  select.innerHTML = '<option value="">-- Select a scenario --</option>';

  // Get all categories
  const categories = [...new Set(quickCaptureScenarios.map(s => s.category))];

  // Add scenarios by category
  categories.forEach(category => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category.replace('-', ' ').toUpperCase();

    const scenarios = quickCaptureScenarios.filter(s => s.category === category);
    scenarios.forEach(scenario => {
      const option = document.createElement('option');
      option.value = scenario.id;
      option.textContent = scenario.name;
      option.dataset.input = scenario.input;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });
}

/**
 * Handle scenario selection
 */
function handleScenarioSelect(event) {
  const scenarioId = event.target.value;
  if (!scenarioId) {
    devPanelState.selectedScenario = null;
    return;
  }

  const scenario = quickCaptureScenarios.find(s => s.id === scenarioId);
  devPanelState.selectedScenario = scenario;

  // Show scenario preview
  const preview = document.getElementById('scenario-preview');
  if (preview && scenario) {
    preview.innerHTML = `
      <div class="scenario-preview-content">
        <div class="preview-label">Input:</div>
        <div class="preview-input">"${scenario.input}"</div>
        <div class="preview-label">Expected:</div>
        <div class="preview-expected">
          ${scenario.expectedAction} (${scenario.expectedConfidence} confidence)
        </div>
      </div>
    `;
  }
}

/**
 * Load selected scenario into quick capture
 */
function loadSelectedScenario() {
  const scenario = devPanelState.selectedScenario;
  if (!scenario) return;

  // Set input value
  const input = document.getElementById('quick-capture-input');
  if (input) {
    input.value = scenario.input;
    input.focus();
  }

  logAction(`Loaded scenario: ${scenario.name}`);
}

// ============================================
// RESPONSE INSPECTION
// ============================================

/**
 * Update response inspector with latest AI response
 * @param {Object} response - The AI response object
 */
export function updateResponseInspector(response) {
  devPanelState.lastResponse = response;

  const inspector = document.getElementById('response-inspector');
  if (!inspector) return;

  inspector.innerHTML = `
    <div class="response-summary">
      <div class="response-field">
        <span class="field-label">Action:</span>
        <span class="field-value">${getActionIcon(response.action)} ${response.action}</span>
      </div>
      <div class="response-field">
        <span class="field-label">Confidence:</span>
        <span class="field-value">
          <span class="confidence-badge confidence-${response.confidence}">${response.confidence}</span>
        </span>
      </div>
      ${response.events && response.events.length > 0 ? `
        <div class="response-field">
          <span class="field-label">Events:</span>
          <span class="field-value">${response.events.length}</span>
        </div>
      ` : ''}
    </div>
    <div class="response-json">
      <div class="json-header">
        <span>Full Response</span>
        <button onclick="window.devPanel.copyResponse()" class="copy-btn">Copy JSON</button>
      </div>
      <pre class="json-viewer">${syntaxHighlightJSON(response)}</pre>
    </div>
  `;

  logAction(`Response received: ${response.action} (${response.confidence})`);
}

/**
 * Copy response JSON to clipboard
 */
export function copyResponse() {
  if (!devPanelState.lastResponse) return;

  const json = JSON.stringify(devPanelState.lastResponse, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    logAction('Response JSON copied to clipboard');
    showToast('Copied to clipboard!');
  });
}

// ============================================
// ACTION LOG
// ============================================

/**
 * Log an action in the dev panel
 * @param {string} message - Action message
 */
export function logAction(message) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { timestamp, message };
  devPanelState.actionLog.unshift(entry); // Most recent first

  // Keep only last 50 entries
  if (devPanelState.actionLog.length > 50) {
    devPanelState.actionLog = devPanelState.actionLog.slice(0, 50);
  }

  updateActionLog();
}

/**
 * Update action log UI
 */
function updateActionLog() {
  const logContainer = document.getElementById('action-log-entries');
  if (!logContainer) return;

  logContainer.innerHTML = devPanelState.actionLog.map(entry => `
    <div class="log-entry">
      <span class="log-time">${entry.timestamp}</span>
      <span class="log-message">${entry.message}</span>
    </div>
  `).join('');
}

/**
 * Clear action log
 */
function clearActionLog() {
  devPanelState.actionLog = [];
  updateActionLog();
  logAction('Action log cleared');
}

// ============================================
// HELPERS
// ============================================

/**
 * Get icon for action type
 */
function getActionIcon(action) {
  const icons = {
    'create_event': '📅',
    'create_task': '✅',
    'create_note': '📝',
    'ask_question': '❓',
    'show_alternatives': '🔀',
    'create_checklist': '☑️',
    'modify_event': '✏️',
    'suggest_times': '🕐'
  };
  return icons[action] || '•';
}

/**
 * Syntax highlight JSON
 */
function syntaxHighlightJSON(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }

  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return json.replace(/(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'json-number';
    if (/^\"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

/**
 * Show toast notification
 */
function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'dev-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 2 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ============================================
// EXPORTS
// ============================================

// Expose methods to window for inline event handlers
window.devPanel = {
  copyResponse,
  logAction
};

// Export functions for use in app.js
export default {
  initDevPanel,
  populateScenarioSelector,
  updateResponseInspector,
  logAction
};
