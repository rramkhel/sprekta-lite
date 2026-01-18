/**
 * Prompt Loader Utility
 *
 * Loads prompt templates from markdown files and replaces variable placeholders.
 * This enables easy prompt iteration without modifying code.
 *
 * Usage:
 *   import { loadPrompt } from '../prompts/loader.js';
 *   const prompt = loadPrompt('calendar-parser', { CURRENT_DATE: '2025-01-18' });
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this module (for ESM compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a prompt template and replace variables
 *
 * @param {string} filename - Name of the prompt file (without .md extension)
 * @param {Object} variables - Key-value pairs to replace in the template
 * @returns {string} The processed prompt with variables replaced
 *
 * @example
 * const prompt = loadPrompt('calendar-parser', {
 *   CURRENT_DATE: new Date().toISOString().split('T')[0]
 * });
 */
export function loadPrompt(filename, variables = {}) {
  try {
    // Construct the full path to the prompt file
    const promptPath = join(__dirname, `${filename}.md`);

    // Read the prompt file
    let promptContent = readFileSync(promptPath, 'utf-8');

    // Replace all {{VARIABLE}} placeholders with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      promptContent = promptContent.replace(placeholder, value);
    });

    return promptContent;

  } catch (error) {
    console.error(`Error loading prompt "${filename}":`, error);
    throw new Error(`Failed to load prompt: ${filename}`);
  }
}

/**
 * Validate that all required variables are provided
 *
 * @param {string} promptContent - The prompt content to check
 * @param {Object} variables - The variables that were provided
 * @returns {string[]} Array of missing variable names
 */
export function findMissingVariables(promptContent, variables) {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const foundPlaceholders = new Set();
  let match;

  while ((match = placeholderRegex.exec(promptContent)) !== null) {
    foundPlaceholders.add(match[1]);
  }

  const providedVariables = new Set(Object.keys(variables));
  const missing = [...foundPlaceholders].filter(v => !providedVariables.has(v));

  return missing;
}
