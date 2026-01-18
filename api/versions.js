/**
 * Versions API
 *
 * Serverless endpoint for version management operations.
 * Bridges browser UI with Node.js file system operations.
 */

import {
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
} from '../versioning/snapshot-manager.js';

import {
  isGitAvailable,
  gitCreateBranch,
  gitCommitMilestone,
  gitGetCurrentBranch,
  gitStatus
} from '../versioning/git-helper.js';

// ============================================
// MAIN HANDLER
// ============================================

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize versioning system
    initVersioning();

    // Route to appropriate handler
    const { action } = req.query;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, action);
      case 'POST':
        return await handlePost(req, res, action);
      case 'DELETE':
        return await handleDelete(req, res, action);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Versions API] Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// ============================================
// GET HANDLERS
// ============================================

async function handleGet(req, res, action) {
  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'current':
      return handleGetCurrent(req, res);
    case 'status':
      return handleGetStatus(req, res);
    default:
      return handleList(req, res);
  }
}

/**
 * List all snapshots and milestones
 */
async function handleList(req, res) {
  const snapshots = listSnapshots();
  const milestones = listMilestones();
  const current = getCurrentSnapshot();

  return res.status(200).json({
    snapshots,
    milestones,
    current
  });
}

/**
 * Get current snapshot
 */
async function handleGetCurrent(req, res) {
  const current = getCurrentSnapshot();
  return res.status(200).json({ current });
}

/**
 * Get git status
 */
async function handleGetStatus(req, res) {
  const gitAvailable = isGitAvailable();
  const status = gitAvailable ? gitStatus() : null;
  const branch = gitAvailable ? gitGetCurrentBranch() : null;

  return res.status(200).json({
    gitAvailable,
    gitStatus: status,
    currentBranch: branch
  });
}

// ============================================
// POST HANDLERS
// ============================================

async function handlePost(req, res, action) {
  switch (action) {
    case 'save':
      return handleSave(req, res);
    case 'load':
      return handleLoad(req, res);
    case 'promote':
      return handlePromote(req, res);
    case 'compare':
      return handleCompare(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

/**
 * Save new snapshot
 * POST /api/versions?action=save
 * Body: { name, description }
 */
async function handleSave(req, res) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const snapshot = saveSnapshot(name, description || '');
    return res.status(200).json({
      success: true,
      snapshot,
      message: `Snapshot "${name}" saved successfully`
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

/**
 * Load snapshot
 * POST /api/versions?action=load
 * Body: { snapshotId }
 */
async function handleLoad(req, res) {
  const { snapshotId } = req.body;

  if (!snapshotId) {
    return res.status(400).json({ error: 'Snapshot ID is required' });
  }

  try {
    const snapshot = loadSnapshot(snapshotId);
    return res.status(200).json({
      success: true,
      snapshot,
      message: `Snapshot "${snapshot.name}" loaded successfully`
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

/**
 * Promote snapshot to milestone
 * POST /api/versions?action=promote
 * Body: { snapshotId, version, createBranch }
 */
async function handlePromote(req, res) {
  const { snapshotId, version, createBranch = true } = req.body;

  if (!snapshotId || !version) {
    return res.status(400).json({
      error: 'Snapshot ID and version are required'
    });
  }

  try {
    const snapshot = getSnapshot(snapshotId);
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    let gitBranch = null;
    let gitCommit = null;

    // Create git branch and commit if git is available
    if (isGitAvailable() && createBranch) {
      try {
        // Create branch
        gitBranch = gitCreateBranch(version);

        // Prepare files to commit
        const filesToCommit = [
          'versioning/milestones/',
          'types/schemas.js',
          'test-data/mock-ai-engine.js',
          'test-data/scenarios/',
          'config/features.js'
        ];

        // Commit milestone
        gitCommit = gitCommitMilestone(
          version,
          snapshot.description,
          filesToCommit
        );
      } catch (gitError) {
        console.warn('[Versions API] Git operation failed:', gitError.message);
        // Continue without git integration
      }
    }

    // Promote to milestone
    const milestone = promoteToMilestone(
      snapshotId,
      version,
      gitBranch,
      gitCommit
    );

    return res.status(200).json({
      success: true,
      milestone,
      gitBranch,
      gitCommit,
      message: `Snapshot promoted to milestone "${version}"${gitBranch ? ` on branch ${gitBranch}` : ''}`
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

/**
 * Compare two snapshots
 * POST /api/versions?action=compare
 * Body: { snapshotId1, snapshotId2 }
 */
async function handleCompare(req, res) {
  const { snapshotId1, snapshotId2 } = req.body;

  if (!snapshotId1 || !snapshotId2) {
    return res.status(400).json({
      error: 'Two snapshot IDs are required'
    });
  }

  try {
    const comparison = compareSnapshots(snapshotId1, snapshotId2);
    return res.status(200).json({
      success: true,
      comparison
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

// ============================================
// DELETE HANDLERS
// ============================================

async function handleDelete(req, res, action) {
  const { snapshotId, milestoneId } = req.query;

  if (action === 'milestone' && milestoneId) {
    return handleDeleteMilestone(req, res, milestoneId);
  }

  if (snapshotId) {
    return handleDeleteSnapshot(req, res, snapshotId);
  }

  return res.status(400).json({ error: 'Invalid delete request' });
}

/**
 * Delete snapshot
 * DELETE /api/versions?snapshotId=xxx
 */
async function handleDeleteSnapshot(req, res, snapshotId) {
  try {
    deleteSnapshot(snapshotId);
    return res.status(200).json({
      success: true,
      message: 'Snapshot deleted successfully'
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}

/**
 * Delete milestone
 * DELETE /api/versions?action=milestone&milestoneId=xxx
 */
async function handleDeleteMilestone(req, res, milestoneId) {
  try {
    deleteMilestone(milestoneId);
    return res.status(200).json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
}
