/**
 * Developer Panel
 *
 * Provides in-app testing controls:
 * - Response inspector
 * - Action log
 */

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
  // Set up event listeners
  setupEventListeners();

  // Initialize version UI
  versionUI.init();

  console.log('[Dev Panel] Initialized');
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

  // Clear log button
  const clearLogBtn = document.getElementById('clear-log-btn');
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', clearActionLog);
  }

  // Profile toggle
  const profileToggle = document.getElementById('use-profile-toggle');
  if (profileToggle) {
    // Load saved state (default to true if no saved preference)
    const saved = localStorage.getItem('sprekta-use-profile');
    profileToggle.checked = saved !== null ? saved === 'true' : true;
    updateProfileStatus(profileToggle.checked);

    profileToggle.addEventListener('change', (e) => {
      localStorage.setItem('sprekta-use-profile', e.target.checked);
      updateProfileStatus(e.target.checked);
    });
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
 * Update profile status text
 */
function updateProfileStatus(enabled) {
  const status = document.getElementById('profile-status');
  if (status) {
    status.textContent = enabled
      ? 'Profile will be included in chat context'
      : 'Profile disabled - chat will use generic responses';
  }
}

/**
 * Check if profile should be used
 */
export function shouldUseProfile() {
  const toggle = document.getElementById('use-profile-toggle');
  return toggle ? toggle.checked : true; // Default to true
}

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
  updateResponseInspector,
  logAction,
  shouldUseProfile
};
