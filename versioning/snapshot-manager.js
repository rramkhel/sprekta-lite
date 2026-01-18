/**
 * Snapshot Manager
 *
 * Core versioning system for saving/loading/comparing prototype snapshots.
 * Handles both local snapshots (.gitignored) and milestones (committed to git).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ============================================
// PATHS
// ============================================

const PATHS = {
  snapshots: path.join(PROJECT_ROOT, 'versioning', 'snapshots'),
  milestones: path.join(PROJECT_ROOT, 'versioning', 'milestones'),
  snapshotsManifest: path.join(PROJECT_ROOT, 'versioning', 'snapshots', 'manifest.json'),
  milestonesManifest: path.join(PROJECT_ROOT, 'versioning', 'milestones', 'manifest.json'),

  // Files to snapshot
  schemas: path.join(PROJECT_ROOT, 'types', 'schemas.js'),
  mockAI: path.join(PROJECT_ROOT, 'test-data', 'mock-ai-engine.js'),
  scenarios: path.join(PROJECT_ROOT, 'test-data', 'scenarios'),
  features: path.join(PROJECT_ROOT, 'config', 'features.js')
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize versioning system (create folders, manifests)
 */
export function initVersioning() {
  // Create folders if they don't exist
  [PATHS.snapshots, PATHS.milestones].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create manifests if they don't exist
  if (!fs.existsSync(PATHS.snapshotsManifest)) {
    fs.writeFileSync(PATHS.snapshotsManifest, JSON.stringify({
      snapshots: [],
      currentVersion: null
    }, null, 2));
  }

  if (!fs.existsSync(PATHS.milestonesManifest)) {
    fs.writeFileSync(PATHS.milestonesManifest, JSON.stringify({
      milestones: []
    }, null, 2));
  }
}

// ============================================
// SAVE SNAPSHOT
// ============================================

/**
 * Save current state as a snapshot
 * @param {string} name - Snapshot name (e.g., "v2-triage")
 * @param {string} description - What changed
 * @returns {Object} Saved snapshot metadata
 */
export function saveSnapshot(name, description = '') {
  initVersioning();

  const timestamp = new Date().toISOString();
  const id = `snap_${Date.now()}`;
  const snapshotDir = path.join(PATHS.snapshots, name);

  // Create snapshot directory
  if (fs.existsSync(snapshotDir)) {
    throw new Error(`Snapshot "${name}" already exists`);
  }
  fs.mkdirSync(snapshotDir, { recursive: true });

  // Files to copy
  const filesToCopy = [
    { src: PATHS.schemas, dest: path.join(snapshotDir, 'schemas.js'), name: 'schemas' },
    { src: PATHS.mockAI, dest: path.join(snapshotDir, 'mock-ai-engine.js'), name: 'mockAI' },
    { src: PATHS.features, dest: path.join(snapshotDir, 'features.js'), name: 'features' }
  ];

  // Copy scenarios folder
  const scenariosDir = path.join(snapshotDir, 'scenarios');
  fs.mkdirSync(scenariosDir, { recursive: true });

  const scenarioFiles = fs.readdirSync(PATHS.scenarios)
    .filter(f => f.endsWith('.js'));

  scenarioFiles.forEach(file => {
    fs.copyFileSync(
      path.join(PATHS.scenarios, file),
      path.join(scenariosDir, file)
    );
  });

  // Copy main files and calculate checksums
  const checksums = {};
  filesToCopy.forEach(({ src, dest, name: fileName }) => {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      checksums[fileName] = calculateChecksum(src);
    }
  });

  // Create snapshot metadata
  const snapshot = {
    id,
    name,
    description,
    timestamp,
    files: {
      schemas: 'schemas.js',
      mockAI: 'mock-ai-engine.js',
      scenarios: scenarioFiles,
      features: 'features.js'
    },
    checksums
  };

  // Save metadata to snapshot folder
  fs.writeFileSync(
    path.join(snapshotDir, 'metadata.json'),
    JSON.stringify(snapshot, null, 2)
  );

  // Update manifest
  const manifest = readSnapshotsManifest();
  manifest.snapshots.push(snapshot);
  manifest.currentVersion = id;
  writeSnapshotsManifest(manifest);

  return snapshot;
}

// ============================================
// LOAD SNAPSHOT
// ============================================

/**
 * Load a snapshot (restore files)
 * @param {string} snapshotId - ID or name of snapshot to load
 * @returns {Object} Loaded snapshot metadata
 */
export function loadSnapshot(snapshotId) {
  const manifest = readSnapshotsManifest();
  const snapshot = manifest.snapshots.find(s => s.id === snapshotId || s.name === snapshotId);

  if (!snapshot) {
    throw new Error(`Snapshot "${snapshotId}" not found`);
  }

  const snapshotDir = path.join(PATHS.snapshots, snapshot.name);

  if (!fs.existsSync(snapshotDir)) {
    throw new Error(`Snapshot directory not found: ${snapshotDir}`);
  }

  // Restore files
  const filesToRestore = [
    { src: path.join(snapshotDir, 'schemas.js'), dest: PATHS.schemas },
    { src: path.join(snapshotDir, 'mock-ai-engine.js'), dest: PATHS.mockAI },
    { src: path.join(snapshotDir, 'features.js'), dest: PATHS.features }
  ];

  filesToRestore.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });

  // Restore scenarios
  const scenariosDir = path.join(snapshotDir, 'scenarios');
  if (fs.existsSync(scenariosDir)) {
    const scenarioFiles = fs.readdirSync(scenariosDir);
    scenarioFiles.forEach(file => {
      fs.copyFileSync(
        path.join(scenariosDir, file),
        path.join(PATHS.scenarios, file)
      );
    });
  }

  // Update current version
  manifest.currentVersion = snapshot.id;
  writeSnapshotsManifest(manifest);

  return snapshot;
}

// ============================================
// LIST & GET
// ============================================

/**
 * List all snapshots
 * @returns {Array} Array of snapshot metadata
 */
export function listSnapshots() {
  const manifest = readSnapshotsManifest();
  return manifest.snapshots.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

/**
 * Get snapshot by ID or name
 * @param {string} snapshotId - ID or name
 * @returns {Object|null} Snapshot metadata
 */
export function getSnapshot(snapshotId) {
  const manifest = readSnapshotsManifest();
  return manifest.snapshots.find(s => s.id === snapshotId || s.name === snapshotId) || null;
}

/**
 * Get current snapshot
 * @returns {Object|null} Current snapshot metadata
 */
export function getCurrentSnapshot() {
  const manifest = readSnapshotsManifest();
  if (!manifest.currentVersion) return null;
  return getSnapshot(manifest.currentVersion);
}

// ============================================
// DELETE SNAPSHOT
// ============================================

/**
 * Delete a snapshot
 * @param {string} snapshotId - ID or name of snapshot to delete
 * @returns {boolean} Success
 */
export function deleteSnapshot(snapshotId) {
  const manifest = readSnapshotsManifest();
  const snapshot = manifest.snapshots.find(s => s.id === snapshotId || s.name === snapshotId);

  if (!snapshot) {
    throw new Error(`Snapshot "${snapshotId}" not found`);
  }

  // Don't delete current snapshot
  if (manifest.currentVersion === snapshot.id) {
    throw new Error('Cannot delete current snapshot. Load a different snapshot first.');
  }

  // Delete directory
  const snapshotDir = path.join(PATHS.snapshots, snapshot.name);
  if (fs.existsSync(snapshotDir)) {
    fs.rmSync(snapshotDir, { recursive: true, force: true });
  }

  // Remove from manifest
  manifest.snapshots = manifest.snapshots.filter(s => s.id !== snapshot.id);
  writeSnapshotsManifest(manifest);

  return true;
}

// ============================================
// COMPARE SNAPSHOTS
// ============================================

/**
 * Compare two snapshots
 * @param {string} snapshotId1 - First snapshot ID/name
 * @param {string} snapshotId2 - Second snapshot ID/name
 * @returns {Object} Comparison result with diffs
 */
export function compareSnapshots(snapshotId1, snapshotId2) {
  const snap1 = getSnapshot(snapshotId1);
  const snap2 = getSnapshot(snapshotId2);

  if (!snap1 || !snap2) {
    throw new Error('One or both snapshots not found');
  }

  const snap1Dir = path.join(PATHS.snapshots, snap1.name);
  const snap2Dir = path.join(PATHS.snapshots, snap2.name);

  // Compare files
  const filesToCompare = ['schemas.js', 'mock-ai-engine.js', 'features.js'];
  const diffs = {};

  filesToCompare.forEach(filename => {
    const file1 = path.join(snap1Dir, filename);
    const file2 = path.join(snap2Dir, filename);

    if (fs.existsSync(file1) && fs.existsSync(file2)) {
      const content1 = fs.readFileSync(file1, 'utf8');
      const content2 = fs.readFileSync(file2, 'utf8');

      diffs[filename] = {
        changed: content1 !== content2,
        lines1: content1.split('\n').length,
        lines2: content2.split('\n').length,
        content1,
        content2
      };
    }
  });

  return {
    snapshot1: snap1,
    snapshot2: snap2,
    diffs
  };
}

// ============================================
// MILESTONES
// ============================================

/**
 * Promote a snapshot to a milestone
 * @param {string} snapshotId - Snapshot to promote
 * @param {string} version - Version number (e.g., "v1.0")
 * @param {string} gitBranch - Git branch name (optional)
 * @param {string} gitCommit - Git commit hash (optional)
 * @returns {Object} Milestone metadata
 */
export function promoteToMilestone(snapshotId, version, gitBranch = null, gitCommit = null) {
  const snapshot = getSnapshot(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot "${snapshotId}" not found`);
  }

  const milestoneDir = path.join(PATHS.milestones, version);

  // Check if milestone already exists
  if (fs.existsSync(milestoneDir)) {
    throw new Error(`Milestone "${version}" already exists`);
  }

  // Copy snapshot to milestones
  const snapshotDir = path.join(PATHS.snapshots, snapshot.name);
  fs.cpSync(snapshotDir, milestoneDir, { recursive: true });

  // Create milestone metadata
  const milestone = {
    id: version,
    name: version,
    description: snapshot.description,
    timestamp: new Date().toISOString(),
    gitBranch,
    gitCommit,
    promotedFrom: snapshot.id,
    files: snapshot.files
  };

  // Save milestone metadata
  fs.writeFileSync(
    path.join(milestoneDir, 'metadata.json'),
    JSON.stringify(milestone, null, 2)
  );

  // Update milestones manifest
  const manifest = readMilestonesManifest();
  manifest.milestones.push(milestone);
  writeMilestonesManifest(manifest);

  return milestone;
}

/**
 * List all milestones
 * @returns {Array} Array of milestone metadata
 */
export function listMilestones() {
  const manifest = readMilestonesManifest();
  return manifest.milestones.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

/**
 * Delete a milestone
 * @param {string} milestoneId - Milestone version to delete
 * @returns {boolean} Success
 */
export function deleteMilestone(milestoneId) {
  const manifest = readMilestonesManifest();
  const milestone = manifest.milestones.find(m => m.id === milestoneId);

  if (!milestone) {
    throw new Error(`Milestone "${milestoneId}" not found`);
  }

  // Delete directory
  const milestoneDir = path.join(PATHS.milestones, milestone.name);
  if (fs.existsSync(milestoneDir)) {
    fs.rmSync(milestoneDir, { recursive: true, force: true });
  }

  // Remove from manifest
  manifest.milestones = manifest.milestones.filter(m => m.id !== milestoneId);
  writeMilestonesManifest(manifest);

  return true;
}

// ============================================
// HELPERS
// ============================================

/**
 * Calculate file checksum (MD5)
 */
function calculateChecksum(filepath) {
  const content = fs.readFileSync(filepath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Read snapshots manifest
 */
function readSnapshotsManifest() {
  initVersioning();
  return JSON.parse(fs.readFileSync(PATHS.snapshotsManifest, 'utf8'));
}

/**
 * Write snapshots manifest
 */
function writeSnapshotsManifest(manifest) {
  fs.writeFileSync(PATHS.snapshotsManifest, JSON.stringify(manifest, null, 2));
}

/**
 * Read milestones manifest
 */
function readMilestonesManifest() {
  initVersioning();
  return JSON.parse(fs.readFileSync(PATHS.milestonesManifest, 'utf8'));
}

/**
 * Write milestones manifest
 */
function writeMilestonesManifest(manifest) {
  fs.writeFileSync(PATHS.milestonesManifest, JSON.stringify(manifest, null, 2));
}

// ============================================
// EXPORTS
// ============================================

export default {
  initVersioning,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  getSnapshot,
  getCurrentSnapshot,
  deleteSnapshot,
  compareSnapshots,
  promoteToMilestone,
  listMilestones,
  deleteMilestone
};
