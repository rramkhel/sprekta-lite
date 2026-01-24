# Sprint 9.2: Capture Classification

## Sprint Goal

Build the AI classification system that categorizes captures and decides what happens to each one. Database schema for tracking captures through their lifecycle.

---

## Current State

**What exists:**
- Quick capture input in header
- `api/parse.js` → AI parses natural language to event
- Events go directly to calendar

**What we're building:**
- New `captures` table to track raw inputs
- AI classification: event vs todo vs reference
- Completeness detection: complete vs incomplete
- Routing logic: calendar vs ghost vs backlog

---

## Task 1: Database Schema

**File:** Create migration or run in Supabase SQL editor

```sql
-- Captures table: tracks everything user jots down
CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  
  -- Raw input
  raw_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI classification
  capture_type TEXT CHECK (capture_type IN ('event', 'todo', 'reference', 'idea', 'unknown')),
  completeness TEXT CHECK (completeness IN ('complete', 'incomplete', 'unknown')),
  has_deadline BOOLEAN DEFAULT FALSE,
  confidence FLOAT, -- 0-1 AI confidence score
  
  -- Parsed data (flexible JSON)
  parsed_data JSONB DEFAULT '{}',
  -- Example: { 
  --   "title": "Dentist", 
  --   "date": "2026-01-28", 
  --   "time": "15:00",
  --   "deadline": "2026-11-28",
  --   "recurrence": "annual"
  -- }
  
  -- Lifecycle
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Just captured, not processed
    'scheduled',  -- Created as calendar event
    'ghost',      -- Created as ghost event (incomplete)
    'backlog',    -- In backlog (no time)
    'resolved',   -- User resolved via triage
    'archived',   -- Manually archived
    'decayed'     -- Auto-expired
  )),
  
  resolved_at TIMESTAMPTZ,
  decay_at TIMESTAMPTZ, -- When this should auto-expire
  
  -- Links to other tables
  event_id UUID REFERENCES events(id), -- If converted to event
  conversation_id UUID REFERENCES conversations(id), -- If resolved via chat
  
  -- Metadata
  source TEXT DEFAULT 'quick_capture' CHECK (source IN ('quick_capture', 'chat', 'import')),
  
  CONSTRAINT user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Index for common queries
CREATE INDEX idx_captures_user_status ON captures(user_id, status);
CREATE INDEX idx_captures_session_status ON captures(session_id, status);
CREATE INDEX idx_captures_decay ON captures(decay_at) WHERE status NOT IN ('scheduled', 'resolved', 'archived', 'decayed');

-- RLS policies
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own captures" ON captures
  FOR SELECT USING (
    auth.uid() = user_id OR 
    session_id = current_setting('app.session_id', true)
  );

CREATE POLICY "Users can insert own captures" ON captures
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can update own captures" ON captures
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    session_id = current_setting('app.session_id', true)
  );
```

**Update events table:**

```sql
-- Add ghost event support to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_ghost BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capture_id UUID REFERENCES captures(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'none' 
  CHECK (enrichment_status IN ('none', 'prompted', 'complete'));
```

---

## Task 2: Classification API Endpoint

**File:** `api/classify.js` (NEW)

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, timezone = 'America/New_York' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: timezone
  });

  const prompt = `You are a smart capture classifier for a calendar app. Analyze this user input and classify it.

Today is: ${today}
User timezone: ${timezone}

User input: "${text}"

Classify this input and extract structured data. Return ONLY valid JSON:

{
  "capture_type": "event" | "todo" | "reference" | "idea" | "unknown",
  "completeness": "complete" | "incomplete" | "unknown",
  "confidence": 0.0-1.0,
  "has_deadline": boolean,
  "parsed_data": {
    "title": "string - the core thing",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM (24h) or null", 
    "end_time": "HH:MM or null",
    "deadline": "YYYY-MM-DD or null (for todos)",
    "recurrence": "annual" | "weekly" | "monthly" | null,
    "notes": "any additional context"
  },
  "reasoning": "brief explanation of classification"
}

Classification rules:
- EVENT: Has a specific date AND time → capture_type: "event"
  - Complete if: has date AND time
  - Incomplete if: has date but no time, or vague date ("next week")
  
- TODO: Action to take, may have deadline but no specific time
  - "call mom" → todo, no deadline
  - "call mom before thanksgiving" → todo, has_deadline: true
  - "buy batteries" → todo, timeless

- REFERENCE: Information to remember, not an action
  - "sarah's birthday march 15" → reference, annual recurrence
  - "doctor's number: 555-1234" → reference

- IDEA: Thought or suggestion, not actionable yet
  - "what if we did X" → idea

Examples:
- "dentist tuesday 3pm" → event, complete, date: next tuesday, time: 15:00
- "dentist next week" → event, incomplete, date: null (vague)
- "dentist sometime" → event, incomplete
- "call mom about thanksgiving" → todo, has_deadline: true (implicit)
- "buy batteries" → todo, has_deadline: false
- "sarah bday march 15" → reference, recurrence: annual
- "maybe try that new restaurant" → idea`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    
    // Parse JSON from response
    let result;
    try {
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return res.status(500).json({ 
        error: 'Failed to parse classification',
        raw: content 
      });
    }

    // Calculate decay_at based on type
    let decay_at = null;
    if (result.capture_type === 'todo' && !result.has_deadline) {
      // Timeless todos decay in 14 days
      decay_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    } else if (result.completeness === 'incomplete') {
      // Incomplete events decay in 7 days
      decay_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    return res.status(200).json({
      ...result,
      decay_at,
      raw_text: text
    });

  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({ 
      error: 'Classification failed',
      message: error.message 
    });
  }
}
```

---

## Task 3: Capture Processing Logic

**File:** `js/capture-processor.js` (NEW)

```javascript
/**
 * Capture Processor
 * 
 * Takes raw user input, classifies it, and routes to appropriate destination.
 */

import { getSessionId, getAuthHeaders } from './auth-helpers.js';

const CaptureProcessor = {
  /**
   * Process a raw capture from quick input
   */
  async process(text) {
    // 1. Classify the capture
    const classification = await this.classify(text);
    
    // 2. Save to captures table
    const capture = await this.save(text, classification);
    
    // 3. Route based on classification
    const result = await this.route(capture, classification);
    
    return {
      capture,
      classification,
      result
    };
  },

  /**
   * Call classification API
   */
  async classify(text) {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders()
      },
      body: JSON.stringify({ 
        text,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });

    if (!response.ok) {
      throw new Error('Classification failed');
    }

    return response.json();
  },

  /**
   * Save capture to database
   */
  async save(rawText, classification) {
    const response = await fetch('/api/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders()
      },
      body: JSON.stringify({
        raw_text: rawText,
        capture_type: classification.capture_type,
        completeness: classification.completeness,
        has_deadline: classification.has_deadline,
        confidence: classification.confidence,
        parsed_data: classification.parsed_data,
        decay_at: classification.decay_at
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save capture');
    }

    return response.json();
  },

  /**
   * Route capture to appropriate destination
   */
  async route(capture, classification) {
    const { capture_type, completeness, parsed_data } = classification;

    // Complete event → Calendar
    if (capture_type === 'event' && completeness === 'complete') {
      return this.createCalendarEvent(capture, parsed_data);
    }

    // Incomplete event → Ghost event
    if (capture_type === 'event' && completeness === 'incomplete') {
      return this.createGhostEvent(capture, parsed_data);
    }

    // Reference with date → Annual event
    if (capture_type === 'reference' && parsed_data.date) {
      return this.createAnnualEvent(capture, parsed_data);
    }

    // Todo → Backlog
    if (capture_type === 'todo') {
      return this.addToBacklog(capture, parsed_data);
    }

    // Everything else → Backlog for now
    return this.addToBacklog(capture, parsed_data);
  },

  /**
   * Create a confirmed calendar event
   */
  async createCalendarEvent(capture, data) {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders()
      },
      body: JSON.stringify({
        title: data.title,
        date: data.date,
        start_time: data.time,
        end_time: data.end_time || this.calculateEndTime(data.time),
        notes: data.notes,
        capture_id: capture.id,
        is_ghost: false
      })
    });

    // Update capture status
    await this.updateCaptureStatus(capture.id, 'scheduled', response.id);

    return {
      action: 'created_event',
      event: await response.json()
    };
  },

  /**
   * Create a ghost (tentative) event
   */
  async createGhostEvent(capture, data) {
    // Calculate approximate date range for ghost
    const dateRange = this.estimateDateRange(data);

    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders()
      },
      body: JSON.stringify({
        title: data.title,
        date: dateRange.start,
        start_time: data.time || '09:00', // Default time
        notes: `[Needs confirmation] ${data.notes || ''}`,
        capture_id: capture.id,
        is_ghost: true
      })
    });

    await this.updateCaptureStatus(capture.id, 'ghost', response.id);

    return {
      action: 'created_ghost',
      event: await response.json(),
      needsResolution: true
    };
  },

  /**
   * Create annual recurring event (birthdays, etc)
   */
  async createAnnualEvent(capture, data) {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders()
      },
      body: JSON.stringify({
        title: data.title,
        date: data.date,
        all_day: true,
        recurrence: 'annual',
        capture_id: capture.id,
        is_ghost: false
      })
    });

    await this.updateCaptureStatus(capture.id, 'scheduled', response.id);

    return {
      action: 'created_annual',
      event: await response.json()
    };
  },

  /**
   * Add to backlog (todos, ideas, etc)
   */
  async addToBacklog(capture, data) {
    await this.updateCaptureStatus(capture.id, 'backlog');

    return {
      action: 'added_to_backlog',
      capture,
      hasDeadline: data.deadline || capture.has_deadline
    };
  },

  /**
   * Update capture status and optionally link to event
   */
  async updateCaptureStatus(captureId, status, eventId = null) {
    await fetch(`/api/capture/${captureId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders()
      },
      body: JSON.stringify({
        status,
        event_id: eventId,
        resolved_at: ['scheduled', 'resolved'].includes(status) ? new Date().toISOString() : null
      })
    });
  },

  /**
   * Helper: estimate date range from vague input
   */
  estimateDateRange(data) {
    // "next week" → start of next week
    // "sometime this month" → middle of month
    // No date → 3 days from now (arbitrary)
    
    const now = new Date();
    
    if (data.date) {
      return { start: data.date, end: data.date };
    }

    // Default: 3 days from now
    const start = new Date(now);
    start.setDate(start.getDate() + 3);
    
    return {
      start: start.toISOString().split('T')[0],
      end: start.toISOString().split('T')[0]
    };
  },

  /**
   * Helper: calculate default end time (1 hour after start)
   */
  calculateEndTime(startTime) {
    if (!startTime) return null;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};

export default CaptureProcessor;
```

---

## Task 4: Capture API Endpoints

**File:** `api/capture/index.js` (NEW)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return createCapture(req, res);
  } else if (req.method === 'GET') {
    return getCaptures(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function createCapture(req, res) {
  const { 
    raw_text, 
    capture_type, 
    completeness, 
    has_deadline,
    confidence, 
    parsed_data, 
    decay_at 
  } = req.body;

  // Get user from auth header or session
  const authHeader = req.headers.authorization;
  let userId = null;
  let sessionId = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id;
  }

  if (!userId) {
    sessionId = req.headers['x-session-id'] || req.body.session_id;
  }

  if (!userId && !sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { data, error } = await supabase
    .from('captures')
    .insert({
      user_id: userId,
      session_id: sessionId,
      raw_text,
      capture_type,
      completeness,
      has_deadline,
      confidence,
      parsed_data,
      decay_at,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Create capture error:', error);
    return res.status(500).json({ error: 'Failed to create capture' });
  }

  return res.status(201).json(data);
}

async function getCaptures(req, res) {
  const { status, type, limit = 50 } = req.query;

  // Build query
  let query = supabase
    .from('captures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (type) {
    query = query.eq('capture_type', type);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch captures' });
  }

  return res.status(200).json(data);
}
```

**File:** `api/capture/[id].js` (NEW)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    return updateCapture(req, res, id);
  } else if (req.method === 'DELETE') {
    return deleteCapture(req, res, id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function updateCapture(req, res, id) {
  const updates = req.body;

  const { data, error } = await supabase
    .from('captures')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update capture' });
  }

  return res.status(200).json(data);
}

async function deleteCapture(req, res, id) {
  const { error } = await supabase
    .from('captures')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete capture' });
  }

  return res.status(204).end();
}
```

---

## Task 5: Update Quick Capture to Use Processor

**File:** `app.js` (update existing quick capture handler)

```javascript
import CaptureProcessor from './js/capture-processor.js';

// Update existing quick capture submit handler
async function handleQuickCapture(text) {
  if (!text.trim()) return;

  try {
    // Show loading state
    showCaptureLoading();

    // Process through new system
    const { capture, classification, result } = await CaptureProcessor.process(text);

    // Store result for session summary
    addToCaptureSession({
      raw_text: text,
      action: result.action,
      event: result.event,
      classification
    });

    // Show appropriate feedback
    showCaptureFeedback(result);

    // Refresh calendar if event was created
    if (result.event) {
      refreshCalendar();
    }

    // Clear input
    clearCaptureInput();

  } catch (error) {
    console.error('Capture failed:', error);
    showCaptureError(error.message);
  }
}

// Track captures in current session for "While You Were Away"
const captureSession = [];

function addToCaptureSession(capture) {
  captureSession.push({
    ...capture,
    timestamp: new Date()
  });
  
  // Persist to sessionStorage
  sessionStorage.setItem('capture_session', JSON.stringify(captureSession));
}

function getCaptureSession() {
  return JSON.parse(sessionStorage.getItem('capture_session') || '[]');
}

function clearCaptureSession() {
  captureSession.length = 0;
  sessionStorage.removeItem('capture_session');
}
```

---

## Checklist

- [ ] `captures` table created in Supabase
- [ ] `events` table updated with ghost fields
- [ ] `/api/classify` endpoint works
- [ ] `/api/capture` CRUD endpoints work
- [ ] `CaptureProcessor` classifies and routes correctly
- [ ] Complete events → calendar
- [ ] Incomplete events → ghost events
- [ ] References → annual events
- [ ] Todos → backlog
- [ ] Session captures tracked for summary
- [ ] RLS policies work for auth and anonymous

---

## Testing

Test each capture type:

| Input | Expected Type | Expected Action |
|-------|---------------|-----------------|
| "dentist tue 3pm" | event, complete | → Calendar event |
| "dentist next week" | event, incomplete | → Ghost event |
| "call mom" | todo | → Backlog |
| "call mom before thanksgiving" | todo + deadline | → Backlog with deadline |
| "sarah bday march 15" | reference | → Annual event |
| "buy batteries" | todo | → Backlog |
| "what if we did X" | idea | → Backlog |

---

## Commit

```bash
git add api/classify.js api/capture/ js/capture-processor.js app.js
git commit -m "feat: capture classification system (Sprint 9.2)

- AI-powered capture classification
- Captures table with lifecycle tracking
- Routing: events, ghost events, backlog
- Session tracking for summaries"
```

---

## Next Sprint

Sprint 9.3: Triage Panel UI — The right-side panel with Coming Up, Needs Attention, Backlog sections.
