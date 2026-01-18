/**
 * Prototype Scenario Tester
 *
 * Interactive UI for testing scenarios with mock data
 */

// State
let currentScenario = null;
let actionLog = [];
let quickCaptureScenarios = [];
let triageScenarios = [];

/**
 * Initialize the prototype tester
 */
async function init() {
  try {
    console.log('Initializing prototype tester...');

    // Import scenarios dynamically
    const quickCaptureModule = await import('./test-data/scenarios/quick-capture-scenarios.js');
    const triageModule = await import('./test-data/scenarios/triage-scenarios.js');

    quickCaptureScenarios = quickCaptureModule.quickCaptureScenarios;
    triageScenarios = triageModule.triageScenarios;

    console.log(`Loaded ${quickCaptureScenarios.length} quick capture scenarios`);
    console.log(`Loaded ${triageScenarios.length} triage scenarios`);

    renderScenarioList();
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    document.getElementById('scenarios-list').innerHTML = `
      <div style="padding: 20px; color: #dc2626;">
        <strong>Error loading scenarios:</strong><br/>
        ${error.message}<br/><br/>
        Check browser console for details.
      </div>
    `;
  }
}

/**
 * Get categories from loaded scenarios
 */
function getCategories() {
  return [...new Set(quickCaptureScenarios.map(s => s.category))];
}

/**
 * Render the list of scenarios in the left panel
 */
function renderScenarioList() {
  const container = document.getElementById('scenarios-list');
  const categories = getCategories();

  container.innerHTML = '';

  categories.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'scenario-category';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.textContent = category.replace('-', ' ');
    categoryDiv.appendChild(header);

    const scenarios = quickCaptureScenarios.filter(s => s.category === category);
    scenarios.forEach(scenario => {
      const item = document.createElement('div');
      item.className = 'scenario-item';
      item.innerHTML = `
        <div class="scenario-name">${scenario.name}</div>
        <div class="scenario-preview">"${scenario.input}"</div>
      `;
      item.addEventListener('click', () => loadScenario(scenario));
      categoryDiv.appendChild(item);
    });

    container.appendChild(categoryDiv);
  });
}

/**
 * Load and display a scenario
 */
function loadScenario(scenario) {
  currentScenario = scenario;
  actionLog = [];

  // Update active state
  document.querySelectorAll('.scenario-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.closest('.scenario-item').classList.add('active');

  // Update header
  document.getElementById('current-scenario-name').textContent = scenario.name;

  // Log action
  logAction(`Loaded scenario: ${scenario.name}`);

  // Get mock response
  const mockResponse = scenario.getMockResponse(scenario.input);

  // Render UI
  renderQuickCaptureUI(scenario.input, mockResponse);

  // Render debug info
  renderDebugInfo(scenario, mockResponse);
}

/**
 * Render the quick capture UI with mock response
 */
function renderQuickCaptureUI(input, response) {
  const container = document.getElementById('ui-preview');

  container.innerHTML = `
    <div class="mock-quick-capture">
      <input
        type="text"
        class="mock-input"
        value="${input}"
        placeholder="Jot it down..."
        readonly
      />

      <div class="mock-response">
        <div class="response-action">
          ${getActionIcon(response.action)} ${response.action.replace('_', ' ')}
        </div>

        ${response.userMessage ? `
          <div class="response-message">${response.userMessage}</div>
        ` : ''}

        ${response.events && response.events.length > 0 ? `
          <div class="event-preview">
            ${renderEventPreview(response.events[0])}
          </div>
        ` : ''}

        ${response.suggestedActions ? `
          <div class="response-buttons">
            ${response.suggestedActions.map(action => `
              <button class="response-btn ${action.label.includes('Create') || action.label.includes('Save') ? 'primary' : ''}"
                      onclick="window.handleAction('${action.action}')">
                ${action.icon ? getActionIcon(action.action) : ''} ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="action-log">
        <div class="log-header">Action Log</div>
        <div id="action-log-entries"></div>
      </div>
    </div>
  `;

  renderActionLog();
}

/**
 * Render event preview
 */
function renderEventPreview(event) {
  return `
    <div class="event-field">
      <div class="event-label">Title:</div>
      <div class="event-value">${event.title}</div>
    </div>
    ${event.date ? `
      <div class="event-field">
        <div class="event-label">Date:</div>
        <div class="event-value">${event.date}</div>
      </div>
    ` : ''}
    ${event.time ? `
      <div class="event-field">
        <div class="event-label">Time:</div>
        <div class="event-value">${event.time}</div>
      </div>
    ` : ''}
    <div class="event-field">
      <div class="event-label">Confidence:</div>
      <div class="event-value">
        <span class="confidence-badge confidence-${event.confidence}">${event.confidence}</span>
      </div>
    </div>
  `;
}

/**
 * Render debug information
 */
function renderDebugInfo(scenario, response) {
  const container = document.getElementById('debug-info');

  container.innerHTML = `
    <div class="debug-section">
      <div class="debug-label">Scenario ID</div>
      <div class="debug-value">${scenario.id}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Category</div>
      <div class="debug-value">${scenario.category}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Expected Action</div>
      <div class="debug-value">${scenario.expectedAction}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Expected Confidence</div>
      <div class="debug-value">${scenario.expectedConfidence}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Mock Response</div>
      <div class="json-viewer">${syntaxHighlightJSON(response)}</div>
    </div>

    <button class="edit-response-btn" onclick="window.editResponse()">
      ✏️ Edit Response
    </button>

    ${scenario.notes ? `
      <div class="debug-section">
        <div class="debug-label">Notes</div>
        <div class="debug-value">${scenario.notes}</div>
      </div>
    ` : ''}
  `;
}

/**
 * Render action log
 */
function renderActionLog() {
  const container = document.getElementById('action-log-entries');
  if (!container) return;

  container.innerHTML = actionLog.map(entry => `
    <div class="log-entry">${entry}</div>
  `).join('');
}

/**
 * Log an action
 */
function logAction(message) {
  const timestamp = new Date().toLocaleTimeString();
  actionLog.push(`[${timestamp}] ${message}`);
  renderActionLog();
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
    'open_time_picker': '🕐',
    'confirm_create': '✔️',
    'open_triage': '✏️'
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

  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
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
 * Handle action click
 */
window.handleAction = function(action) {
  logAction(`User clicked: ${action}`);

  // Show what would happen
  alert(`Action: ${action}\n\nIn the real app, this would:\n- Update the UI\n- Save data\n- Show next step`);

  // You can extend this to actually test the full flow
};

/**
 * Edit the mock response
 */
window.editResponse = function() {
  if (!currentScenario) return;

  const currentResponse = currentScenario.getMockResponse(currentScenario.input);
  const jsonString = JSON.stringify(currentResponse, null, 2);

  const newJSON = prompt('Edit the mock response (valid JSON):', jsonString);

  if (newJSON) {
    try {
      const parsed = JSON.parse(newJSON);
      // Update the scenario's response temporarily
      currentScenario.getMockResponse = () => parsed;
      loadScenario(currentScenario);
      logAction('Response edited successfully');
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  }
};

// Initialize on page load
init();
