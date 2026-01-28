/**
 * Developer Panel
 *
 * Provides in-app testing controls:
 * - Response inspector
 * - Action log
 */

import * as versionUI from './versioning/version-ui.js';

// ============================================
// CHAT TEST SCENARIOS
// ============================================

const CHAT_SCENARIOS = [
  {
    id: 'simple-event',
    name: 'Simple Event',
    category: 'Basic Capture',
    input: 'dentist appointment tuesday at 2pm',
    expected: 'Should capture with date and time, commit: immediate'
  },
  {
    id: 'event-no-time',
    name: 'Event Without Time',
    category: 'Basic Capture',
    input: 'need to call mom this week',
    expected: 'Should capture title, ask about specific time'
  },
  {
    id: 'event-relative-date',
    name: 'Relative Date',
    category: 'Basic Capture',
    input: 'dinner with Alex tomorrow night',
    expected: 'Should parse "tomorrow" correctly, might ask for time'
  },
  {
    id: 'multi-item-dump',
    name: 'Multi-Item Dump',
    category: 'Advanced',
    input: 'okay so I have dentist wed 2pm, pick up dry cleaning, and Q1 report due friday',
    expected: 'Should capture first item, mention others in reply'
  },
  {
    id: 'followup-time',
    name: 'Follow-up: Add Time',
    category: 'Conversation',
    input: '3:30pm',
    expected: 'Should update previous capture with time (requires prior message)'
  },
  {
    id: 'followup-location',
    name: 'Follow-up: Add Location',
    category: 'Conversation',
    input: 'at the coffee shop on main street',
    expected: 'Should update previous capture with location'
  },
  {
    id: 'vague-planning',
    name: 'Vague Planning Request',
    category: 'Planning',
    input: 'I need to figure out this weekend',
    expected: 'Should ask clarifying questions, not create event yet'
  },
  {
    id: 'busy-week',
    name: 'Overwhelm/Brain Dump',
    category: 'Planning',
    input: 'ugh I have so much going on - work deadline, kids birthday party, car needs oil change, and I promised to help my sister move',
    expected: 'Should acknowledge, start capturing systematically'
  },
  {
    id: 'casual-chat',
    name: 'Casual Chat (No Event)',
    category: 'Edge Cases',
    input: 'hey how are you doing today?',
    expected: 'Should respond conversationally, no event capture'
  },
  {
    id: 'ambiguous',
    name: 'Ambiguous Input',
    category: 'Edge Cases',
    input: 'sarah thing',
    expected: 'Should ask for clarification, not guess'
  }
];

// ============================================
// STATE MANAGEMENT
// ============================================

let devPanelState = {
  isOpen: false,
  lastResponse: null,
  actionLog: [],
  selectedScenario: null,
  selectedChatScenario: null
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

  // Render chat scenarios
  renderChatScenarios();

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
// CHAT SCENARIOS
// ============================================

/**
 * Render chat scenarios dropdown
 */
function renderChatScenarios() {
  const container = document.getElementById('chat-scenarios-container');
  if (!container) return;

  // Group by category
  const categories = {};
  CHAT_SCENARIOS.forEach(s => {
    if (!categories[s.category]) categories[s.category] = [];
    categories[s.category].push(s);
  });

  let optionsHtml = '<option value="">Select a scenario...</option>';

  Object.entries(categories).forEach(([category, scenarios]) => {
    optionsHtml += `<optgroup label="${category}">`;
    scenarios.forEach(s => {
      optionsHtml += `<option value="${s.id}">${s.name}</option>`;
    });
    optionsHtml += '</optgroup>';
  });

  container.innerHTML = `
    <select id="chat-scenario-select" class="dev-select">
      ${optionsHtml}
    </select>
    <div id="chat-scenario-preview" class="scenario-preview hidden">
      <div class="preview-input"></div>
      <div class="preview-expected"></div>
    </div>
    <div class="scenario-actions">
      <button id="load-chat-scenario" class="dev-btn" disabled>Load into Chat</button>
      <button id="send-chat-scenario" class="dev-btn dev-btn-primary" disabled>Send to Chat</button>
    </div>
  `;

  // Bind events
  const select = document.getElementById('chat-scenario-select');
  const loadBtn = document.getElementById('load-chat-scenario');
  const sendBtn = document.getElementById('send-chat-scenario');
  const preview = document.getElementById('chat-scenario-preview');

  select?.addEventListener('change', (e) => {
    const scenario = CHAT_SCENARIOS.find(s => s.id === e.target.value);

    if (scenario) {
      preview.classList.remove('hidden');
      preview.querySelector('.preview-input').textContent = `"${scenario.input}"`;
      preview.querySelector('.preview-expected').textContent = scenario.expected;
      loadBtn.disabled = false;
      sendBtn.disabled = false;
      devPanelState.selectedChatScenario = scenario;
    } else {
      preview.classList.add('hidden');
      loadBtn.disabled = true;
      sendBtn.disabled = true;
      devPanelState.selectedChatScenario = null;
    }
  });

  loadBtn?.addEventListener('click', () => loadChatScenario(false));
  sendBtn?.addEventListener('click', () => loadChatScenario(true));
}

/**
 * Load scenario into chat (optionally auto-send)
 */
async function loadChatScenario(autoSend = false) {
  const scenario = devPanelState.selectedChatScenario;
  if (!scenario) return;

  // Open chat panel
  if (window.PanelManager) {
    window.PanelManager.open('chat');
  }

  // Wait for panel to open
  await new Promise(resolve => setTimeout(resolve, 100));

  // Find chat input
  const input = document.getElementById('chat-input');
  if (!input) {
    console.error('Chat input not found');
    return;
  }

  // Fill input
  input.value = scenario.input;
  input.focus();

  // Log action
  logAction(`Loaded scenario: ${scenario.name}`);

  // Auto-send if requested
  if (autoSend) {
    // Trigger send (find and click send button)
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) {
      sendBtn.click();
    } else {
      // Fallback: dispatch Enter key
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
    logAction(`Sent scenario: ${scenario.name}`);
  }
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
