/**
 * Version UI (Browser-Compatible)
 *
 * UI components for managing snapshots and milestones in the browser.
 * Uses localStorage for snapshot storage and provides export/import functionality.
 */

// ============================================
// STATE
// ============================================

let versionState = {
  currentTab: 'snapshots', // 'snapshots' or 'milestones'
  selectedSnapshots: [], // For comparison
  isComparing: false
};

const STORAGE_KEYS = {
  SNAPSHOTS: 'sprekta_snapshots_manifest',
  MILESTONES: 'sprekta_milestones_manifest',
  CURRENT_VERSION: 'sprekta_current_version'
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize version UI
 */
export async function init() {
  initializeStorage();
  setupEventListeners();
  await loadVersionsFromServer();
  renderVersionsList();
}

/**
 * Initialize localStorage if needed
 */
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.SNAPSHOTS)) {
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify({
      snapshots: []
    }));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MILESTONES)) {
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify({
      milestones: []
    }));
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.version-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });

  // Save snapshot button
  const saveBtn = document.getElementById('save-snapshot-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', openSaveModal);
  }

  // Compare button
  const compareBtn = document.getElementById('compare-btn');
  if (compareBtn) {
    compareBtn.addEventListener('click', handleCompare);
  }
}

// ============================================
// API CALLS
// ============================================

/**
 * Call versions API
 */
async function callAPI(action, method = 'GET', body = null) {
  const url = `/api/versions?action=${action}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

/**
 * Load versions from server
 */
async function loadVersionsFromServer() {
  try {
    const data = await callAPI('list');

    // Sync to localStorage for offline access
    if (data.snapshots) {
      saveSnapshotsManifest({ snapshots: data.snapshots });
    }
    if (data.milestones) {
      saveMilestonesManifest({ milestones: data.milestones });
    }
    if (data.current) {
      setCurrentVersionId(data.current.id);
    }
  } catch (error) {
    console.warn('[Version UI] Failed to load from server, using local storage:', error);
    // Fallback to localStorage - already initialized
  }
}

// ============================================
// TAB MANAGEMENT
// ============================================

/**
 * Switch between snapshots and milestones tabs
 */
function switchTab(tabName) {
  versionState.currentTab = tabName;

  // Update tab UI
  document.querySelectorAll('.version-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  // Show/hide lists
  document.getElementById('snapshots-list').style.display =
    tabName === 'snapshots' ? 'block' : 'none';
  document.getElementById('milestones-list').style.display =
    tabName === 'milestones' ? 'block' : 'none';

  // Update button visibility
  document.getElementById('save-snapshot-btn').style.display =
    tabName === 'snapshots' ? 'inline-block' : 'none';

  renderVersionsList();
}

// ============================================
// RENDER
// ============================================

/**
 * Render versions list
 */
function renderVersionsList() {
  if (versionState.currentTab === 'snapshots') {
    renderSnapshotsList();
  } else {
    renderMilestonesList();
  }
}

/**
 * Render snapshots list
 */
function renderSnapshotsList() {
  const container = document.getElementById('snapshots-list');
  if (!container) return;

  const manifest = getSnapshotsManifest();
  const snapshots = manifest.snapshots.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  if (snapshots.length === 0) {
    container.innerHTML = '<div class="empty-state">No snapshots yet. Click "Save" to create one.</div>';
    return;
  }

  const currentVersionId = getCurrentVersionId();

  container.innerHTML = snapshots.map(snap => `
    <div class="version-item ${snap.id === currentVersionId ? 'current' : ''}" data-id="${snap.id}">
      <div class="version-header">
        <div class="version-name">
          ${snap.name}
          ${snap.id === currentVersionId ? '<span class="current-badge">CURRENT</span>' : ''}
        </div>
        <div class="version-actions">
          <button class="version-action-btn" onclick="window.versionUI.loadSnapshot('${snap.id}')" title="Load">
            📂
          </button>
          <button class="version-action-btn" onclick="window.versionUI.promoteSnapshot('${snap.id}')" title="Promote to Milestone">
            ⭐
          </button>
          <button class="version-action-btn delete" onclick="window.versionUI.deleteSnapshot('${snap.id}')" title="Delete">
            🗑️
          </button>
        </div>
      </div>
      <div class="version-description">${snap.description || 'No description'}</div>
      <div class="version-meta">
        <span class="version-timestamp">${formatTimestamp(snap.timestamp)}</span>
        <span class="version-files">${Object.keys(snap.files).length} files</span>
      </div>
      <label class="version-checkbox">
        <input type="checkbox" onchange="window.versionUI.toggleSelect('${snap.id}')">
        Select for compare
      </label>
    </div>
  `).join('');
}

/**
 * Render milestones list
 */
function renderMilestonesList() {
  const container = document.getElementById('milestones-list');
  if (!container) return;

  const manifest = getMilestonesManifest();
  const milestones = manifest.milestones.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  if (milestones.length === 0) {
    container.innerHTML = '<div class="empty-state">No milestones yet. Promote a snapshot to create one.</div>';
    return;
  }

  container.innerHTML = milestones.map(milestone => `
    <div class="version-item milestone" data-id="${milestone.id}">
      <div class="version-header">
        <div class="version-name">
          ${milestone.name}
          <span class="milestone-badge">MILESTONE</span>
        </div>
        <div class="version-actions">
          <button class="version-action-btn" onclick="window.versionUI.exportMilestone('${milestone.id}')" title="Export">
            💾
          </button>
          <button class="version-action-btn delete" onclick="window.versionUI.deleteMilestone('${milestone.id}')" title="Delete">
            🗑️
          </button>
        </div>
      </div>
      <div class="version-description">${milestone.description || 'No description'}</div>
      <div class="version-meta">
        <span class="version-timestamp">${formatTimestamp(milestone.timestamp)}</span>
        ${milestone.gitBranch ? `<span class="git-branch">🌿 ${milestone.gitBranch}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ============================================
// SAVE SNAPSHOT
// ============================================

/**
 * Open save snapshot modal
 */
export function openSaveModal() {
  const modal = document.getElementById('save-modal');
  if (!modal) {
    // Create modal dynamically
    createSaveModal();
  }

  document.getElementById('save-modal').style.display = 'flex';
  document.getElementById('snapshot-name').focus();
}

/**
 * Create save modal HTML
 */
function createSaveModal() {
  const modalHTML = `
    <div class="version-modal" id="save-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Save Snapshot</h3>
          <button class="modal-close" onclick="window.versionUI.closeModal('save-modal')">×</button>
        </div>
        <div class="modal-body">
          <input type="text" id="snapshot-name" class="version-input" placeholder="e.g., v3-confidence-levels">
          <textarea id="snapshot-desc" class="version-textarea" placeholder="What changed in this version?" rows="3"></textarea>
          <label class="version-checkbox-label">
            <input type="checkbox" id="promote-checkbox">
            <span>Also save as Milestone (preserves in git)</span>
          </label>
        </div>
        <div class="modal-actions">
          <button class="dev-btn" onclick="window.versionUI.closeModal('save-modal')">Cancel</button>
          <button class="dev-btn primary" onclick="window.versionUI.confirmSave()">Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Confirm save snapshot
 */
export async function confirmSave() {
  const name = document.getElementById('snapshot-name').value.trim();
  const description = document.getElementById('snapshot-desc').value.trim();
  const promoteToMilestone = document.getElementById('promote-checkbox').checked;

  if (!name) {
    alert('Please enter a snapshot name');
    return;
  }

  try {
    const result = await saveSnapshot(name, description);
    closeModal('save-modal');
    showToast(result.message || `Snapshot "${name}" saved successfully!`);

    // If promote to milestone was checked, promote it
    if (promoteToMilestone && result.snapshot) {
      await promoteSnapshotToMilestone(result.snapshot.id, name);
      showToast(`Also promoted to milestone: ${name}`);
    }

    await loadVersionsFromServer();
    renderVersionsList();
  } catch (error) {
    alert(`Error saving snapshot: ${error.message}`);
  }
}

/**
 * Save snapshot via API
 */
async function saveSnapshot(name, description) {
  try {
    const data = await callAPI('save', 'POST', { name, description });

    // Update localStorage cache
    if (data.snapshot) {
      const manifest = getSnapshotsManifest();
      manifest.snapshots.push(data.snapshot);
      setCurrentVersionId(data.snapshot.id);
      saveSnapshotsManifest(manifest);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to save snapshot: ${error.message}`);
  }
}

// ============================================
// LOAD SNAPSHOT
// ============================================

/**
 * Load a snapshot
 */
export async function loadSnapshot(snapshotId) {
  const manifest = getSnapshotsManifest();
  const snapshot = manifest.snapshots.find(s => s.id === snapshotId);

  if (!snapshot) {
    alert('Snapshot not found');
    return;
  }

  if (!confirm(`Load snapshot "${snapshot.name}"?\n\nThis will replace your current state. Make sure to save first if needed.`)) {
    return;
  }

  try {
    const data = await callAPI('load', 'POST', { snapshotId });

    // Update localStorage cache
    setCurrentVersionId(snapshotId);

    showToast(data.message || `Loaded snapshot: ${snapshot.name}`);
    renderVersionsList();

    // Log action
    if (window.devPanel) {
      window.devPanel.logAction(`Loaded snapshot: ${snapshot.name}`);
    }

    // Reload page to apply changes
    if (confirm('Page will reload to apply changes. Continue?')) {
      window.location.reload();
    }
  } catch (error) {
    alert(`Error loading snapshot: ${error.message}`);
  }
}

// ============================================
// DELETE SNAPSHOT
// ============================================

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(snapshotId) {
  const manifest = getSnapshotsManifest();
  const snapshot = manifest.snapshots.find(s => s.id === snapshotId);

  if (!snapshot) {
    alert('Snapshot not found');
    return;
  }

  const currentVersionId = getCurrentVersionId();
  if (snapshotId === currentVersionId) {
    alert('Cannot delete the current snapshot. Load a different snapshot first.');
    return;
  }

  if (!confirm(`Delete snapshot "${snapshot.name}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    await fetch(`/api/versions?snapshotId=${snapshotId}`, { method: 'DELETE' });

    // Update localStorage cache
    manifest.snapshots = manifest.snapshots.filter(s => s.id !== snapshotId);
    saveSnapshotsManifest(manifest);

    showToast(`Deleted snapshot: ${snapshot.name}`);
    renderVersionsList();
  } catch (error) {
    alert(`Error deleting snapshot: ${error.message}`);
  }
}

// ============================================
// PROMOTE TO MILESTONE
// ============================================

/**
 * Promote snapshot to milestone
 */
export async function promoteSnapshot(snapshotId) {
  const manifest = getSnapshotsManifest();
  const snapshot = manifest.snapshots.find(s => s.id === snapshotId);

  if (!snapshot) {
    alert('Snapshot not found');
    return;
  }

  const version = prompt('Enter milestone version (e.g., v1.0):', '');
  if (!version) return;

  const createBranch = confirm('Create git branch for this milestone?');

  try {
    await promoteSnapshotToMilestone(snapshotId, version, createBranch);
    showToast(`Promoted to milestone: ${version}`);
    await loadVersionsFromServer();
    switchTab('milestones');
  } catch (error) {
    alert(`Error promoting snapshot: ${error.message}`);
  }
}

/**
 * Promote snapshot to milestone via API
 */
async function promoteSnapshotToMilestone(snapshotId, version, createBranch = true) {
  try {
    const data = await callAPI('promote', 'POST', {
      snapshotId,
      version,
      createBranch
    });

    // Update localStorage cache
    if (data.milestone) {
      const manifest = getMilestonesManifest();
      manifest.milestones.push(data.milestone);
      saveMilestonesManifest(manifest);
    }

    // Show git info if available
    if (data.gitBranch) {
      showToast(`Created git branch: ${data.gitBranch}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to promote to milestone: ${error.message}`);
  }
}

// ============================================
// COMPARISON
// ============================================

/**
 * Toggle snapshot selection for comparison
 */
export function toggleSelect(snapshotId) {
  const index = versionState.selectedSnapshots.indexOf(snapshotId);
  if (index > -1) {
    versionState.selectedSnapshots.splice(index, 1);
  } else {
    versionState.selectedSnapshots.push(snapshotId);
  }

  // Limit to 2 selections
  if (versionState.selectedSnapshots.length > 2) {
    versionState.selectedSnapshots.shift();
  }
}

/**
 * Handle compare button click
 */
function handleCompare() {
  if (versionState.selectedSnapshots.length !== 2) {
    alert('Please select exactly 2 snapshots to compare');
    return;
  }

  compareSnapshots(versionState.selectedSnapshots[0], versionState.selectedSnapshots[1]);
}

/**
 * Compare two snapshots
 */
function compareSnapshots(id1, id2) {
  const manifest = getSnapshotsManifest();
  const snap1 = manifest.snapshots.find(s => s.id === id1);
  const snap2 = manifest.snapshots.find(s => s.id === id2);

  if (!snap1 || !snap2) {
    alert('One or both snapshots not found');
    return;
  }

  // Create/open compare modal
  createCompareModal(snap1, snap2);
}

/**
 * Create compare modal
 */
function createCompareModal(snap1, snap2) {
  const existing = document.getElementById('compare-modal');
  if (existing) {
    existing.remove();
  }

  const modalHTML = `
    <div class="version-modal" id="compare-modal" style="display: flex;">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>Compare Versions</h3>
          <button class="modal-close" onclick="window.versionUI.closeModal('compare-modal')">×</button>
        </div>
        <div class="modal-body">
          <div class="compare-view">
            <div class="compare-column">
              <h4>${snap1.name}</h4>
              <div class="compare-meta">${formatTimestamp(snap1.timestamp)}</div>
              <div class="compare-description">${snap1.description || 'No description'}</div>
            </div>
            <div class="compare-divider">→</div>
            <div class="compare-column">
              <h4>${snap2.name}</h4>
              <div class="compare-meta">${formatTimestamp(snap2.timestamp)}</div>
              <div class="compare-description">${snap2.description || 'No description'}</div>
            </div>
          </div>
          <div class="compare-files">
            <div class="compare-info">
              File comparison would show here. Full diff coming soon.
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="dev-btn" onclick="window.versionUI.closeModal('compare-modal')">Close</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// EXPORT/IMPORT
// ============================================

/**
 * Export milestone as JSON
 */
export function exportMilestone(milestoneId) {
  const manifest = getMilestonesManifest();
  const milestone = manifest.milestones.find(m => m.id === milestoneId);

  if (!milestone) {
    alert('Milestone not found');
    return;
  }

  // Create downloadable JSON
  const dataStr = JSON.stringify(milestone, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportName = `sprekta-milestone-${milestone.name}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportName);
  linkElement.click();

  showToast(`Exported milestone: ${milestone.name}`);
}

/**
 * Delete milestone
 */
export async function deleteMilestone(milestoneId) {
  const manifest = getMilestonesManifest();
  const milestone = manifest.milestones.find(m => m.id === milestoneId);

  if (!milestone) {
    alert('Milestone not found');
    return;
  }

  if (!confirm(`Delete milestone "${milestone.name}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    await fetch(`/api/versions?action=milestone&milestoneId=${milestoneId}`, { method: 'DELETE' });

    // Update localStorage cache
    manifest.milestones = manifest.milestones.filter(m => m.id !== milestoneId);
    saveMilestonesManifest(manifest);

    showToast(`Deleted milestone: ${milestone.name}`);
    renderVersionsList();
  } catch (error) {
    alert(`Error deleting milestone: ${error.message}`);
  }
}

// ============================================
// STORAGE HELPERS
// ============================================

function getSnapshotsManifest() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SNAPSHOTS) || '{"snapshots":[]}');
}

function saveSnapshotsManifest(manifest) {
  localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(manifest));
}

function getMilestonesManifest() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MILESTONES) || '{"milestones":[]}');
}

function saveMilestonesManifest(manifest) {
  localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(manifest));
}

function getCurrentVersionId() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION);
}

function setCurrentVersionId(id) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION, id);
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Close modal
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Show toast notification
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'dev-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// ============================================
// EXPORTS
// ============================================

// Expose to window for inline event handlers
window.versionUI = {
  openSaveModal,
  confirmSave,
  closeModal,
  loadSnapshot,
  deleteSnapshot,
  promoteSnapshot,
  toggleSelect,
  exportMilestone,
  deleteMilestone
};

export default {
  init,
  openSaveModal,
  renderVersionsList
};
