/**
 * Feature Flags Configuration
 *
 * Centralized feature toggles for controlling app behavior during development.
 * Update these flags to enable/disable features without code changes.
 *
 * Usage:
 *   import { isEnabled, features } from '../config/features.js';
 *   if (isEnabled('PROTOTYPE_MODE')) { ... }
 */

/**
 * Feature flags object
 *
 * @type {Object.<string, boolean>}
 */
export const features = {
  /**
   * PROTOTYPE_MODE
   * When enabled, uses cheaper AI model (Haiku) instead of production model (Sonnet)
   * Recommended: true during development, false in production
   */
  PROTOTYPE_MODE: true,

  /**
   * AUTO_CREATE_HIGH_CONFIDENCE
   * When enabled, automatically creates events for high-confidence parses
   * without showing the triage modal
   * Recommended: false (manual review is safer)
   */
  AUTO_CREATE_HIGH_CONFIDENCE: false,

  /**
   * SHOW_AI_REASONING
   * When enabled, displays the AI's confidence level and reasoning in the UI
   * Useful for debugging and understanding AI behavior
   * Recommended: true during development, false in production
   */
  SHOW_AI_REASONING: false,
};

/**
 * Check if a feature is enabled
 *
 * @param {string} featureName - The name of the feature to check
 * @returns {boolean} True if the feature is enabled, false otherwise
 *
 * @example
 * if (isEnabled('PROTOTYPE_MODE')) {
 *   model = 'claude-haiku-4-5-20251001';
 * }
 */
export function isEnabled(featureName) {
  if (!(featureName in features)) {
    console.warn(`Unknown feature flag: ${featureName}`);
    return false;
  }
  return features[featureName];
}

/**
 * Get all enabled features
 *
 * @returns {string[]} Array of enabled feature names
 */
export function getEnabledFeatures() {
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

/**
 * Get all disabled features
 *
 * @returns {string[]} Array of disabled feature names
 */
export function getDisabledFeatures() {
  return Object.entries(features)
    .filter(([_, enabled]) => !enabled)
    .map(([name]) => name);
}
