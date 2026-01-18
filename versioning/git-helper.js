/**
 * Git Helper
 *
 * Wrapper around git commands for version management.
 * Creates branches, commits milestones, and provides git-based safety net.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ============================================
// GIT AVAILABILITY
// ============================================

/**
 * Check if git is available
 * @returns {boolean} True if git is installed and repo is initialized
 */
export function isGitAvailable() {
  try {
    execSync('git --version', { cwd: PROJECT_ROOT, stdio: 'ignore' });
    execSync('git rev-parse --git-dir', { cwd: PROJECT_ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// BRANCH MANAGEMENT
// ============================================

/**
 * Create a new git branch for a prototype version
 * @param {string} name - Branch name (will be prefixed with 'prototype/')
 * @returns {string} Full branch name
 */
export function gitCreateBranch(name) {
  if (!isGitAvailable()) {
    throw new Error('Git is not available');
  }

  const branchName = `prototype/${name}`;

  try {
    // Check if branch already exists
    const branches = execSync('git branch --list', { cwd: PROJECT_ROOT, encoding: 'utf8' });
    if (branches.includes(branchName)) {
      throw new Error(`Branch "${branchName}" already exists`);
    }

    // Create branch from current HEAD
    execSync(`git branch ${branchName}`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
    return branchName;
  } catch (error) {
    throw new Error(`Failed to create git branch: ${error.message}`);
  }
}

/**
 * List all prototype branches
 * @returns {Array<{name: string, current: boolean}>} List of branches
 */
export function gitListBranches() {
  if (!isGitAvailable()) {
    return [];
  }

  try {
    const output = execSync('git branch', { cwd: PROJECT_ROOT, encoding: 'utf8' });
    const branches = output.split('\n')
      .filter(line => line.trim())
      .filter(line => line.includes('prototype/'))
      .map(line => ({
        name: line.replace(/^\*?\s+/, '').trim(),
        current: line.startsWith('*')
      }));

    return branches;
  } catch (error) {
    console.error('Failed to list git branches:', error);
    return [];
  }
}

/**
 * Checkout a git branch
 * @param {string} branchName - Branch to checkout
 * @returns {boolean} Success
 */
export function gitCheckoutBranch(branchName) {
  if (!isGitAvailable()) {
    throw new Error('Git is not available');
  }

  try {
    execSync(`git checkout ${branchName}`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
    return true;
  } catch (error) {
    throw new Error(`Failed to checkout branch: ${error.message}`);
  }
}

/**
 * Get current branch name
 * @returns {string|null} Current branch name
 */
export function gitGetCurrentBranch() {
  if (!isGitAvailable()) {
    return null;
  }

  try {
    const output = execSync('git rev-parse --abbrev-ref HEAD', { cwd: PROJECT_ROOT, encoding: 'utf8' });
    return output.trim();
  } catch {
    return null;
  }
}

// ============================================
// COMMIT MANAGEMENT
// ============================================

/**
 * Commit milestone files to git
 * @param {string} name - Milestone name
 * @param {string} description - Description of changes
 * @param {Array<string>} files - Files to commit (relative to project root)
 * @returns {string} Commit hash
 */
export function gitCommitMilestone(name, description, files = []) {
  if (!isGitAvailable()) {
    throw new Error('Git is not available');
  }

  try {
    // Add files
    const filesToAdd = files.length > 0 ? files : ['versioning/milestones/'];
    filesToAdd.forEach(file => {
      const filePath = path.join(PROJECT_ROOT, file);
      try {
        execSync(`git add "${filePath}"`, { cwd: PROJECT_ROOT, stdio: 'pipe' });
      } catch (error) {
        console.warn(`Could not add file: ${file}`, error.message);
      }
    });

    // Create commit message
    const commitMessage = formatCommitMessage(name, description, files);

    // Commit
    execSync(`git commit -m "${escapeForShell(commitMessage)}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });

    // Get commit hash
    const hash = execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
    return hash;
  } catch (error) {
    throw new Error(`Failed to commit milestone: ${error.message}`);
  }
}

/**
 * Format commit message for milestone
 * @param {string} name - Milestone name
 * @param {string} description - Description
 * @param {Array<string>} files - Changed files
 * @returns {string} Formatted commit message
 */
function formatCommitMessage(name, description, files) {
  const fileList = files.length > 0
    ? files.map(f => `- ${f}`).join('\\n')
    : '- types/schemas.js\\n- test-data/mock-ai-engine.js\\n- test-data/scenarios/*.js\\n- config/features.js';

  return `[MILESTONE] ${name}: ${description}

Changes:
${description}

Files saved:
${fileList}

🤖 Generated with Claude Code
`;
}

/**
 * Escape string for shell command
 */
function escapeForShell(str) {
  return str.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\$/g, '\\$');
}

// ============================================
// DIFF & COMPARISON
// ============================================

/**
 * Get diff between two branches
 * @param {string} branch1 - First branch
 * @param {string} branch2 - Second branch
 * @param {string} filePath - Optional specific file to diff
 * @returns {string} Diff output
 */
export function gitDiff(branch1, branch2, filePath = null) {
  if (!isGitAvailable()) {
    throw new Error('Git is not available');
  }

  try {
    const fileArg = filePath ? ` -- ${filePath}` : '';
    const output = execSync(`git diff ${branch1}..${branch2}${fileArg}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    return output;
  } catch (error) {
    throw new Error(`Failed to diff branches: ${error.message}`);
  }
}

/**
 * Get list of changed files between branches
 * @param {string} branch1 - First branch
 * @param {string} branch2 - Second branch
 * @returns {Array<string>} List of changed files
 */
export function gitChangedFiles(branch1, branch2) {
  if (!isGitAvailable()) {
    throw new Error('Git is not available');
  }

  try {
    const output = execSync(`git diff --name-only ${branch1}..${branch2}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    return output.split('\n').filter(line => line.trim());
  } catch (error) {
    throw new Error(`Failed to get changed files: ${error.message}`);
  }
}

// ============================================
// STATUS & INFO
// ============================================

/**
 * Get git status
 * @returns {Object} Status info
 */
export function gitStatus() {
  if (!isGitAvailable()) {
    return { clean: true, files: [] };
  }

  try {
    const output = execSync('git status --porcelain', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });

    const files = output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const status = line.substring(0, 2).trim();
        const file = line.substring(3);
        return { status, file };
      });

    return {
      clean: files.length === 0,
      files
    };
  } catch {
    return { clean: true, files: [] };
  }
}

/**
 * Get commit info
 * @param {string} commitHash - Commit hash (optional, defaults to HEAD)
 * @returns {Object} Commit info
 */
export function gitCommitInfo(commitHash = 'HEAD') {
  if (!isGitAvailable()) {
    return null;
  }

  try {
    const hash = execSync(`git rev-parse ${commitHash}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    }).trim();

    const message = execSync(`git log -1 --format=%B ${commitHash}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    }).trim();

    const author = execSync(`git log -1 --format=%an ${commitHash}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    }).trim();

    const date = execSync(`git log -1 --format=%ai ${commitHash}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    }).trim();

    return { hash, message, author, date };
  } catch {
    return null;
  }
}

// ============================================
// BRANCH DELETION
// ============================================

/**
 * Delete a git branch
 * @param {string} branchName - Branch to delete
 * @param {boolean} force - Force delete even if not merged
 * @returns {boolean} Success
 */
export function gitDeleteBranch(branchName, force = false) {
  if (!isGitAvailable()) {
    throw new Error('Git is not available');
  }

  try {
    const flag = force ? '-D' : '-d';
    execSync(`git branch ${flag} ${branchName}`, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    throw new Error(`Failed to delete branch: ${error.message}`);
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  isGitAvailable,
  gitCreateBranch,
  gitListBranches,
  gitCheckoutBranch,
  gitGetCurrentBranch,
  gitCommitMilestone,
  gitDiff,
  gitChangedFiles,
  gitStatus,
  gitCommitInfo,
  gitDeleteBranch
};
