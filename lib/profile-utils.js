/**
 * Convert structured profile to text for AI context
 */
export function profileToText(profile) {
  if (!profile) return null;

  const sections = [];

  if (profile.name) {
    sections.push(`Name: ${profile.name}`);
  }

  if (profile.patterns?.length > 0) {
    sections.push(`Patterns & Preferences:\n${profile.patterns.map(p => `- ${p}`).join('\n')}`);
  }

  if (profile.red_flags?.length > 0) {
    sections.push(`Red Flags (things I tend to mess up):\n${profile.red_flags.map(r => `- ${r}`).join('\n')}`);
  }

  if (profile.key_people?.length > 0) {
    const peopleList = profile.key_people.map(p =>
      `- ${p.name}${p.relationship ? ` (${p.relationship})` : ''}`
    ).join('\n');
    sections.push(`Key People:\n${peopleList}`);
  }

  if (profile.priorities?.length > 0) {
    sections.push(`Priorities:\n${profile.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}`);
  }

  if (profile.notes) {
    sections.push(`Additional Context:\n${profile.notes}`);
  }

  return sections.join('\n\n');
}

/**
 * Parse pasted text into structured profile (best effort)
 * Used for migrating from text-only profiles
 */
export function textToProfile(text) {
  // This is a simple heuristic parser
  // Could be enhanced with AI later

  const profile = {
    patterns: [],
    red_flags: [],
    key_people: [],
    priorities: [],
    notes: text // Keep original as notes fallback
  };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let currentSection = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect section headers
    if (lowerLine.includes('pattern') || lowerLine.includes('preference')) {
      currentSection = 'patterns';
      continue;
    }
    if (lowerLine.includes('red flag') || lowerLine.includes('warning') || lowerLine.includes('tend to')) {
      currentSection = 'red_flags';
      continue;
    }
    if (lowerLine.includes('people') || lowerLine.includes('family') || lowerLine.includes('team')) {
      currentSection = 'key_people';
      continue;
    }
    if (lowerLine.includes('priorit') || lowerLine.includes('important')) {
      currentSection = 'priorities';
      continue;
    }

    // Add to current section if it's a list item
    if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
      const content = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');

      if (currentSection === 'patterns') {
        profile.patterns.push(content);
      } else if (currentSection === 'red_flags') {
        profile.red_flags.push(content);
      } else if (currentSection === 'key_people') {
        // Try to parse "Name (relationship)" format
        const match = content.match(/^([^(]+)(?:\(([^)]+)\))?/);
        if (match) {
          profile.key_people.push({
            name: match[1].trim(),
            relationship: match[2]?.trim() || null
          });
        }
      } else if (currentSection === 'priorities') {
        profile.priorities.push(content);
      }
    }
  }

  return profile;
}
