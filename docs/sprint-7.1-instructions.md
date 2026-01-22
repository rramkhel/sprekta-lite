# Sprint 7.1: Profile Database & API

## Goal

Create the profiles table and API endpoints. Users can create, read, update their profile.

**Time Estimate:** ~2 hours

---

## Task 1: Database Schema

Run in Supabase SQL Editor:

```sql
-- ============================================
-- PROFILES TABLE
-- ============================================

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,

  -- Core identity
  name text,

  -- Structured profile data
  patterns jsonb default '[]',      -- ["Morning person", "Need buffer time"]
  red_flags jsonb default '[]',     -- ["Forgets to eat when busy", "Overcommits"]
  key_people jsonb default '[]',    -- [{name: "Sarah", relationship: "partner"}]
  priorities jsonb default '[]',    -- ["Family time", "Exercise", "Sprekta work"]

  -- Free-form context (backward compatible with pasted text)
  notes text,

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One profile per user
  constraint profiles_user_id_unique unique (user_id)
);

-- ============================================
-- UPDATE CONVERSATIONS TABLE
-- ============================================

-- Add profile_id to link conversation to profile snapshot
alter table public.conversations
  add column profile_id uuid references public.profiles;

-- Add title for conversation history display
alter table public.conversations
  add column title text;

-- ============================================
-- INDEXES
-- ============================================

create index idx_profiles_user_id on public.profiles(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

alter table public.profiles enable row level security;

-- Users can only see their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Users can create their own profile
create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Users can delete their own profile
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();
```

---

## Task 2: Profile API Endpoints

**File:** `api/profile/index.js` (NEW)

Handles GET (fetch) and POST (create) and PUT (update):

```javascript
import { createServiceClient } from '../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth required for all profile operations
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token
  const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const supabase = createServiceClient();

  try {
    // GET - Fetch profile
    if (req.method === 'GET') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Profile fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }

      return res.status(200).json({ profile: profile || null });
    }

    // POST - Create profile
    if (req.method === 'POST') {
      const { name, patterns, redFlags, keyPeople, priorities, notes } = req.body;

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Profile already exists. Use PUT to update.' });
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: name || null,
          patterns: patterns || [],
          red_flags: redFlags || [],
          key_people: keyPeople || [],
          priorities: priorities || [],
          notes: notes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Profile create error:', error);
        return res.status(500).json({ error: 'Failed to create profile' });
      }

      return res.status(201).json({ profile });
    }

    // PUT - Update profile
    if (req.method === 'PUT') {
      const { name, patterns, redFlags, keyPeople, priorities, notes } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (patterns !== undefined) updates.patterns = patterns;
      if (redFlags !== undefined) updates.red_flags = redFlags;
      if (keyPeople !== undefined) updates.key_people = keyPeople;
      if (priorities !== undefined) updates.priorities = priorities;
      if (notes !== undefined) updates.notes = notes;

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      return res.status(200).json({ profile });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Task 3: Profile Text Generation

For the AI system prompt, we need to convert structured profile to readable text:

**File:** `lib/profile-utils.js` (NEW)

```javascript
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
```

---

## Task 4: Update Message Endpoint to Use Stored Profile

**File:** `api/conversation/[id]/message.js`

Update to fetch profile from database (add this after fetching conversation):

```javascript
// Near the top of the handler, after fetching conversation:

// Fetch user's profile if they're logged in
let profileText = conversation.profile_text; // Fallback to pasted text

if (conversation.user_id) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', conversation.user_id)
    .single();

  if (profile) {
    // Convert structured profile to text
    const { profileToText } = await import('../../../lib/profile-utils.js');
    profileText = profileToText(profile);
  }
}

// Then use profileText in buildSystemPrompt(profileText)
```

---

## Checklist

- [ ] `profiles` table created
- [ ] `conversations` table updated (profile_id, title columns)
- [ ] RLS policies on profiles
- [ ] `GET /api/profile` - fetch profile
- [ ] `POST /api/profile` - create profile
- [ ] `PUT /api/profile` - update profile
- [ ] `lib/profile-utils.js` - text conversion helpers
- [ ] Message endpoint uses stored profile

---

## Testing

Test the profile API:

```bash
# 1. Create a profile (requires auth token)
curl -X POST http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","patterns":["Morning person"],"redFlags":["Forgets lunch"]}'

# 2. Get profile
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Update profile
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Smith","patterns":["Morning person","Needs breaks"]}'
```

---

## Commit

```bash
git add api/profile/ lib/profile-utils.js api/conversation/ supabase/migrations/
git commit -m "feat: profile database and API (Sprint 7.1)

- profiles table with structured data (patterns, red_flags, etc.)
- CRUD endpoints for profile management
- Profile-to-text conversion for AI context
- Message endpoint fetches stored profile
- RLS policies for user isolation"
```

---

Ready for Sprint 7.2 (Profile UI)!
