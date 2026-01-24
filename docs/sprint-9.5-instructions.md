# Sprint 9.5: Decay System & Admin View

## Sprint Goal

Implement automatic decay for stale items (ghost events, old todos) and build the admin debugging view for seeing all event metadata.

---

## Current State

**What exists:**
- `captures.decay_at` field in database
- Items classified with decay timing
- Ghost events and backlog items

**What we're building:**
- Scheduled decay job (Vercel cron or manual trigger)
- Decay warnings before expiration
- Admin table view of all captures/events
- Admin settings for decay timing

---

## Part 1: Decay System

### Task 1.1: Decay Processing Endpoint

**File:** `api/decay/process.js` (NEW)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Process decayed items
 * 
 * Called by cron job or manually triggered.
 * Marks items past their decay_at as 'decayed'.
 */
export default async function handler(req, res) {
  // Verify request is from cron or admin
  const authHeader = req.headers.authorization;
  const cronSecret = req.headers['x-cron-secret'];
  
  if (cronSecret !== process.env.CRON_SECRET && !authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date().toISOString();

  try {
    // Find items ready to decay
    const { data: expiredCaptures, error: fetchError } = await supabase
      .from('captures')
      .select('id, raw_text, capture_type, status, event_id')
      .lt('decay_at', now)
      .not('status', 'in', '("scheduled","resolved","archived","decayed")');

    if (fetchError) {
      throw fetchError;
    }

    if (expiredCaptures.length === 0) {
      return res.status(200).json({ 
        message: 'No items to decay',
        processed: 0 
      });
    }

    // Process each expired item
    const results = {
      decayed: [],
      errors: []
    };

    for (const capture of expiredCaptures) {
      try {
        // Update capture status
        await supabase
          .from('captures')
          .update({ 
            status: 'decayed',
            resolved_at: now
          })
          .eq('id', capture.id);

        // If linked to ghost event, delete or archive the event
        if (capture.event_id) {
          await supabase
            .from('events')
            .delete()
            .eq('id', capture.event_id)
            .eq('is_ghost', true); // Safety: only delete ghost events
        }

        results.decayed.push({
          id: capture.id,
          text: capture.raw_text?.slice(0, 50)
        });

      } catch (itemError) {
        results.errors.push({
          id: capture.id,
          error: itemError.message
        });
      }
    }

    return res.status(200).json({
      message: `Processed ${results.decayed.length} items`,
      processed: results.decayed.length,
      errors: results.errors.length,
      details: results
    });

  } catch (error) {
    console.error('Decay processing error:', error);
    return res.status(500).json({ 
      error: 'Decay processing failed',
      message: error.message 
    });
  }
}
```

### Task 1.2: Vercel Cron Configuration

**File:** `vercel.json` (update)

```json
{
  "crons": [
    {
      "path": "/api/decay/process",
      "schedule": "0 6 * * *"
    }
  ]
}
```

This runs daily at 6 AM UTC. Adjust as needed.

**Add to environment variables in Vercel:**
```
CRON_SECRET=your-random-secret-here
```

### Task 1.3: Decay Warning System

**File:** `api/decay/warnings.js` (NEW)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get items approaching decay
 * 
 * Returns items that will decay within the next N days.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const daysAhead = parseInt(req.query.days) || 3;
  
  const now = new Date();
  const warningDate = new Date(now);
  warningDate.setDate(warningDate.getDate() + daysAhead);

  try {
    const { data, error } = await supabase
      .from('captures')
      .select('id, raw_text, capture_type, status, decay_at, created_at, parsed_data')
      .gt('decay_at', now.toISOString())
      .lt('decay_at', warningDate.toISOString())
      .not('status', 'in', '("scheduled","resolved","archived","decayed")')
      .order('decay_at', { ascending: true });

    if (error) throw error;

    // Calculate days until decay for each
    const warnings = data.map(item => ({
      ...item,
      daysUntilDecay: Math.ceil(
        (new Date(item.decay_at) - now) / (1000 * 60 * 60 * 24)
      )
    }));

    return res.status(200).json(warnings);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### Task 1.4: Update Triage Manager for Decay Warnings

**File:** `js/triage-manager.js` (update)

```javascript
// Add to TriageManager

/**
 * Fetch items approaching decay
 */
async fetchDecayWarnings() {
  try {
    const response = await fetch('/api/decay/warnings?days=3', {
      headers: await getAuthHeaders()
    });
    
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

// Update refresh() to include decay warnings
async refresh() {
  const [events, captures, decayWarnings] = await Promise.all([
    this.fetchUpcomingEvents(),
    this.fetchCaptures(),
    this.fetchDecayWarnings()
  ]);

  // ... existing logic ...

  // Add decay warnings to needs attention
  this.data.decayWarnings = decayWarnings;

  this.notifyListeners();
}
```

---

## Part 2: Admin View

### Task 2.1: Admin Panel HTML

**File:** `index.html` (add admin panel container)

```html
<!-- Admin Panel (hidden by default) -->
<div id="admin-panel" class="admin-panel hidden">
  <div class="admin-header">
    <h2>Admin: All Events & Captures</h2>
    <div class="admin-actions">
      <button id="admin-refresh" class="admin-btn">Refresh</button>
      <button id="admin-export" class="admin-btn">Export CSV</button>
      <button id="admin-close" class="admin-btn-close">×</button>
    </div>
  </div>
  
  <div class="admin-tabs">
    <button class="admin-tab active" data-tab="captures">Captures</button>
    <button class="admin-tab" data-tab="events">Events</button>
    <button class="admin-tab" data-tab="settings">Settings</button>
  </div>
  
  <div class="admin-content">
    <div id="admin-captures" class="admin-tab-content active">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Raw Text</th>
            <th>Type</th>
            <th>Status</th>
            <th>Decay At</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="admin-captures-body"></tbody>
      </table>
    </div>
    
    <div id="admin-events" class="admin-tab-content">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Time</th>
            <th>Ghost?</th>
            <th>Capture ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="admin-events-body"></tbody>
      </table>
    </div>
    
    <div id="admin-settings" class="admin-tab-content">
      <div class="admin-settings-form">
        <div class="admin-setting">
          <label>Default decay (timeless todos)</label>
          <select id="setting-decay-todos">
            <option value="7">7 days</option>
            <option value="14" selected>14 days</option>
            <option value="30">30 days</option>
            <option value="0">Never</option>
          </select>
        </div>
        
        <div class="admin-setting">
          <label>Default decay (ghost events)</label>
          <select id="setting-decay-ghosts">
            <option value="3">3 days</option>
            <option value="7" selected>7 days</option>
            <option value="14">14 days</option>
            <option value="0">Never</option>
          </select>
        </div>
        
        <div class="admin-setting">
          <label>Nudge frequency (approaching deadline)</label>
          <select id="setting-nudge-frequency">
            <option value="1">1 day before</option>
            <option value="3" selected>3 days before</option>
            <option value="7">1 week before</option>
          </select>
        </div>
        
        <button id="admin-save-settings" class="admin-btn-primary">Save Settings</button>
        
        <hr />
        
        <div class="admin-danger-zone">
          <h4>Manual Actions</h4>
          <button id="admin-run-decay" class="admin-btn-danger">Run Decay Now</button>
          <button id="admin-clear-decayed" class="admin-btn-danger">Clear Decayed Items</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Task 2.2: Admin Panel JavaScript

**File:** `js/admin-panel.js` (NEW)

```javascript
/**
 * Admin Panel
 * 
 * Debugging view for all captures and events.
 */

import { getAuthHeaders } from './auth-helpers.js';

const AdminPanel = {
  panel: null,
  isOpen: false,

  init() {
    this.panel = document.getElementById('admin-panel');
    if (!this.panel) return;

    this.bindEvents();
    this.setupKeyboardShortcut();
  },

  bindEvents() {
    // Close button
    document.getElementById('admin-close')?.addEventListener('click', () => this.close());

    // Refresh button
    document.getElementById('admin-refresh')?.addEventListener('click', () => this.refresh());

    // Export button
    document.getElementById('admin-export')?.addEventListener('click', () => this.exportCSV());

    // Tab switching
    this.panel.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Settings save
    document.getElementById('admin-save-settings')?.addEventListener('click', () => this.saveSettings());

    // Manual decay
    document.getElementById('admin-run-decay')?.addEventListener('click', () => this.runDecay());

    // Clear decayed
    document.getElementById('admin-clear-decayed')?.addEventListener('click', () => this.clearDecayed());
  },

  setupKeyboardShortcut() {
    // Cmd/Ctrl + Shift + A to toggle admin
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.toggle();
      }
    });
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  async open() {
    this.panel.classList.remove('hidden');
    this.isOpen = true;
    await this.refresh();
  },

  close() {
    this.panel.classList.add('hidden');
    this.isOpen = false;
  },

  async refresh() {
    await Promise.all([
      this.loadCaptures(),
      this.loadEvents()
    ]);
  },

  async loadCaptures() {
    try {
      const response = await fetch('/api/admin/captures', {
        headers: await getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const captures = await response.json();
      this.renderCaptures(captures);
    } catch (e) {
      console.error('Failed to load captures:', e);
    }
  },

  renderCaptures(captures) {
    const tbody = document.getElementById('admin-captures-body');
    if (!tbody) return;

    tbody.innerHTML = captures.map(c => `
      <tr data-id="${c.id}" class="admin-row ${c.status}">
        <td class="admin-cell-text" title="${this.escapeHtml(c.raw_text)}">
          ${this.escapeHtml(c.raw_text?.slice(0, 40))}${c.raw_text?.length > 40 ? '...' : ''}
        </td>
        <td><span class="admin-badge admin-badge-${c.capture_type}">${c.capture_type}</span></td>
        <td><span class="admin-badge admin-badge-${c.status}">${c.status}</span></td>
        <td>${c.decay_at ? this.formatDate(c.decay_at) : '—'}</td>
        <td>${this.formatDate(c.created_at)}</td>
        <td>
          <button class="admin-action" onclick="AdminPanel.editCapture('${c.id}')">Edit</button>
          <button class="admin-action admin-action-danger" onclick="AdminPanel.deleteCapture('${c.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  },

  async loadEvents() {
    try {
      const response = await fetch('/api/admin/events', {
        headers: await getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const events = await response.json();
      this.renderEvents(events);
    } catch (e) {
      console.error('Failed to load events:', e);
    }
  },

  renderEvents(events) {
    const tbody = document.getElementById('admin-events-body');
    if (!tbody) return;

    tbody.innerHTML = events.map(e => `
      <tr data-id="${e.id}" class="admin-row ${e.is_ghost ? 'ghost' : ''}">
        <td>${this.escapeHtml(e.title)}</td>
        <td>${e.date}</td>
        <td>${e.start_time || '—'}</td>
        <td>${e.is_ghost ? '<span class="admin-badge admin-badge-ghost">Ghost</span>' : '—'}</td>
        <td>${e.capture_id ? e.capture_id.slice(0, 8) + '...' : '—'}</td>
        <td>
          <button class="admin-action" onclick="AdminPanel.editEvent('${e.id}')">Edit</button>
          <button class="admin-action admin-action-danger" onclick="AdminPanel.deleteEvent('${e.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  },

  switchTab(tabName) {
    // Update tab buttons
    this.panel.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content
    this.panel.querySelectorAll('.admin-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `admin-${tabName}`);
    });
  },

  async saveSettings() {
    const settings = {
      decayTodos: document.getElementById('setting-decay-todos').value,
      decayGhosts: document.getElementById('setting-decay-ghosts').value,
      nudgeFrequency: document.getElementById('setting-nudge-frequency').value
    };

    localStorage.setItem('sprekta_admin_settings', JSON.stringify(settings));
    alert('Settings saved locally');
  },

  async runDecay() {
    if (!confirm('Run decay processing now? This will archive expired items.')) return;

    try {
      const response = await fetch('/api/decay/process', {
        method: 'POST',
        headers: await getAuthHeaders()
      });

      const result = await response.json();
      alert(`Decay complete: ${result.processed} items processed`);
      await this.refresh();
    } catch (e) {
      alert('Decay failed: ' + e.message);
    }
  },

  async clearDecayed() {
    if (!confirm('Permanently delete all decayed items?')) return;

    try {
      const response = await fetch('/api/admin/clear-decayed', {
        method: 'DELETE',
        headers: await getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to clear');
      
      alert('Decayed items cleared');
      await this.refresh();
    } catch (e) {
      alert('Clear failed: ' + e.message);
    }
  },

  exportCSV() {
    // Get current tab data and export
    const activeTab = this.panel.querySelector('.admin-tab-content.active');
    const table = activeTab?.querySelector('.admin-table');
    if (!table) return;

    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('th, td').forEach(cell => {
        cells.push('"' + cell.textContent.replace(/"/g, '""') + '"');
      });
      rows.push(cells.join(','));
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sprekta-admin-${Date.now()}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Expose for inline handlers
  async editCapture(id) { console.log('Edit capture:', id); },
  async deleteCapture(id) { 
    if (!confirm('Delete this capture?')) return;
    await fetch(`/api/capture/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    await this.refresh();
  },
  async editEvent(id) { console.log('Edit event:', id); },
  async deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    await this.refresh();
  }
};

// Expose globally for inline handlers
window.AdminPanel = AdminPanel;

export default AdminPanel;
```

### Task 2.3: Admin API Endpoints

**File:** `api/admin/captures.js` (NEW)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // TODO: Add admin auth check
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('captures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
```

**File:** `api/admin/events.js` (NEW)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })
    .limit(200);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
```

### Task 2.4: Admin Panel Styles

**File:** `style.css`

```css
/* ============================================
   ADMIN PANEL
   ============================================ */

.admin-panel {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: var(--bg-primary, #fff);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-panel.hidden {
  display: none;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color, #ddd);
  background: var(--bg-secondary, #f8f8f8);
}

.admin-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.admin-actions {
  display: flex;
  gap: 8px;
}

.admin-btn {
  padding: 8px 16px;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.admin-btn:hover {
  background: var(--bg-hover, #f0f0f0);
}

.admin-btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-muted, #888);
  cursor: pointer;
  padding: 4px 8px;
}

.admin-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-color, #ddd);
  padding: 0 24px;
}

.admin-tab {
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 14px;
  color: var(--text-secondary, #666);
  cursor: pointer;
}

.admin-tab:hover {
  color: var(--text-primary, #333);
}

.admin-tab.active {
  color: var(--primary-color, #007AFF);
  border-bottom-color: var(--primary-color, #007AFF);
}

.admin-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.admin-tab-content {
  display: none;
}

.admin-tab-content.active {
  display: block;
}

/* Admin table */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.admin-table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--bg-secondary, #f8f8f8);
  border-bottom: 1px solid var(--border-color, #ddd);
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.admin-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #eee);
}

.admin-row.decayed {
  opacity: 0.5;
}

.admin-row.ghost {
  background: var(--ghost-bg, rgba(255, 200, 0, 0.05));
}

.admin-cell-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Admin badges */
.admin-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.admin-badge-event { background: #E3F2FD; color: #1565C0; }
.admin-badge-todo { background: #FFF3E0; color: #E65100; }
.admin-badge-reference { background: #E8F5E9; color: #2E7D32; }
.admin-badge-pending { background: #FFF8E1; color: #F57C00; }
.admin-badge-scheduled { background: #E8F5E9; color: #388E3C; }
.admin-badge-ghost { background: #FFECB3; color: #FF8F00; }
.admin-badge-backlog { background: #F3E5F5; color: #7B1FA2; }
.admin-badge-decayed { background: #ECEFF1; color: #546E7A; }

/* Admin actions */
.admin-action {
  padding: 4px 8px;
  background: none;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  margin-right: 4px;
}

.admin-action:hover {
  background: var(--bg-hover, #f0f0f0);
}

.admin-action-danger {
  color: var(--danger-color, #DC3545);
  border-color: var(--danger-color, #DC3545);
}

/* Admin settings */
.admin-settings-form {
  max-width: 400px;
}

.admin-setting {
  margin-bottom: 20px;
}

.admin-setting label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.admin-setting select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 14px;
}

.admin-btn-primary {
  padding: 12px 24px;
  background: var(--primary-color, #007AFF);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.admin-danger-zone {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, #ddd);
}

.admin-danger-zone h4 {
  color: var(--danger-color, #DC3545);
  margin-bottom: 16px;
}

.admin-btn-danger {
  padding: 8px 16px;
  background: white;
  color: var(--danger-color, #DC3545);
  border: 1px solid var(--danger-color, #DC3545);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 8px;
}

.admin-btn-danger:hover {
  background: var(--danger-color, #DC3545);
  color: white;
}
```

---

## Checklist

- [ ] Decay processing endpoint works
- [ ] Vercel cron configured (or manual trigger)
- [ ] Decay warnings fetched for approaching items
- [ ] Admin panel opens with Cmd+Shift+A
- [ ] Captures table shows all captures
- [ ] Events table shows all events
- [ ] Settings tab allows decay configuration
- [ ] Export CSV works
- [ ] Manual decay trigger works
- [ ] Delete actions work

---

## Commit

```bash
git add api/decay/ api/admin/ js/admin-panel.js style.css index.html vercel.json
git commit -m "feat: decay system + admin panel (Sprint 9.5)

- Automatic decay processing (cron)
- Decay warnings for approaching expirations
- Admin view with captures and events tables
- Settings for decay timing
- Manual decay trigger and CSV export"
```

---

## Next Sprint

Sprint 9.6: Polish & Integration — End-to-end testing, edge cases, mobile optimization.
