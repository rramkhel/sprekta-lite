# Sprint 7.3: Conversation History

## Goal

Show users their past conversations. Let them resume old conversations or start new ones.

**Time Estimate:** ~2 hours

---

## Files to Create/Modify

```
api/
  conversations/
    index.js          ← NEW: GET list user's conversations
  conversation/[id]/
    archive.js        ← NEW: Archive conversation

js/
  history-ui.js       ← NEW: Conversation history component
  triage-state.js     ← Update to support resuming conversations

index.html            ← Add history button + container
style.css             ← History styles
```

---

## Task 1: List Conversations Endpoint

**File:** `api/conversations/index.js` (NEW)

Note: This is `/api/conversations` (plural) vs `/api/conversation` (singular for create).

```javascript
import { createServiceClient } from '../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'];

    let userId = null;

    // Check auth
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabaseAuth = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      if (user) userId = user.id;
    }

    if (!userId && !sessionId) {
      return res.status(400).json({ error: 'Authentication or sessionId required' });
    }

    const supabase = createServiceClient();

    // Build query
    let query = supabase
      .from('conversations')
      .select('id, title, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('List conversations error:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    // Get message count and preview for each conversation
    const conversationsWithPreview = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get message count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        // Get first user message for preview
        const { data: firstMessage } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .eq('role', 'user')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        return {
          ...conv,
          preview: firstMessage?.content?.substring(0, 100) || null,
          messageCount: count || 0
        };
      })
    );

    return res.status(200).json({ conversations: conversationsWithPreview });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Task 2: Archive Conversation Endpoint

**File:** `api/conversation/[id]/archive.js` (NEW)

```javascript
import { createServiceClient } from '../../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    const sessionId = req.headers['x-session-id'];
    const authHeader = req.headers.authorization;

    const supabase = createServiceClient();

    // Verify ownership
    const { data: conversation } = await supabase
      .from('conversations')
      .select('session_id, user_id')
      .eq('id', id)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check ownership
    let authorized = false;
    if (conversation.session_id === sessionId) authorized = true;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      if (user && conversation.user_id === user.id) authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Archive (set status)
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to archive' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Task 3: History UI Component

**File:** `js/history-ui.js` (NEW)

```javascript
import AuthUI from './auth-ui.js';
import Session from './session.js';
import TriageState from './triage-state.js';
import ChatUI from './triage-ui.js';

const HistoryUI = {
  container: null,
  conversations: [],
  isOpen: false,
  isLoading: false,

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  async open() {
    this.isOpen = true;
    this.container.classList.remove('hidden');

    this.renderLoading();
    await this.loadConversations();
    this.render();
  },

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  },

  async loadConversations() {
    this.isLoading = true;

    try {
      const headers = {
        'X-Session-Id': Session.getId()
      };

      const token = await AuthUI.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/conversations', { headers });

      if (!response.ok) throw new Error('Failed to load');

      const data = await response.json();
      this.conversations = data.conversations || [];

    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.conversations = [];
    }

    this.isLoading = false;
  },

  render() {
    const active = this.conversations.filter(c => c.status === 'active');
    const resolved = this.conversations.filter(c => c.status === 'resolved');

    this.container.innerHTML = `
      <div class="history-panel">
        <div class="history-header">
          <h2>Conversations</h2>
          <button class="history-close">×</button>
        </div>

        <div class="history-content">
          ${active.length > 0 ? `
            <div class="history-section">
              <h3>Active</h3>
              ${active.map(c => this.renderConversationItem(c)).join('')}
            </div>
          ` : ''}

          ${resolved.length > 0 ? `
            <div class="history-section">
              <h3>Past</h3>
              ${resolved.map(c => this.renderConversationItem(c)).join('')}
            </div>
          ` : ''}

          ${this.conversations.length === 0 ? `
            <div class="history-empty">
              <p>No conversations yet.</p>
              <button class="history-start-btn">Start Planning</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.bindEvents();
  },

  renderConversationItem(conv) {
    const date = new Date(conv.updated_at);
    const dateStr = this.formatDate(date);
    const title = conv.title || conv.preview?.substring(0, 50) || 'Untitled';

    return `
      <div class="history-item" data-id="${conv.id}">
        <div class="history-item-content">
          <div class="history-item-title">${this.escapeHtml(title)}</div>
          <div class="history-item-meta">
            ${dateStr} · ${conv.messageCount} messages
          </div>
          ${conv.preview ? `
            <div class="history-item-preview">${this.escapeHtml(conv.preview)}...</div>
          ` : ''}
        </div>
        <div class="history-item-actions">
          <button class="history-resume" data-id="${conv.id}" title="Resume">
            →
          </button>
          ${conv.status === 'active' ? `
            <button class="history-archive" data-id="${conv.id}" title="Archive">
              ✓
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderLoading() {
    this.container.innerHTML = `
      <div class="history-panel">
        <div class="history-header">
          <h2>Conversations</h2>
          <button class="history-close">×</button>
        </div>
        <div class="history-loading">
          <div class="typing-indicator"><span></span><span></span><span></span></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    `;

    this.container.querySelector('.history-close')?.addEventListener('click', () => this.close());
  },

  bindEvents() {
    // Close
    this.container.querySelector('.history-close')?.addEventListener('click', () => this.close());

    // Start new
    this.container.querySelector('.history-start-btn')?.addEventListener('click', () => {
      this.close();
      ChatUI.toggle();
    });

    // Resume buttons
    this.container.querySelectorAll('.history-resume').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await this.resumeConversation(id);
      });
    });

    // Archive buttons
    this.container.querySelectorAll('.history-archive').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.target.dataset.id;
        await this.archiveConversation(id);
      });
    });
  },

  async resumeConversation(id) {
    this.close();

    // Set the conversation ID in state and open chat
    await TriageState.resumeConversation(id);
    ChatUI.open();
  },

  async archiveConversation(id) {
    try {
      const headers = {
        'X-Session-Id': Session.getId()
      };

      const token = await AuthUI.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/conversation/${id}/archive`, {
        method: 'POST',
        headers
      });

      if (!response.ok) throw new Error('Failed to archive');

      // Refresh list
      await this.loadConversations();
      this.render();

    } catch (error) {
      console.error('Failed to archive:', error);
      alert('Failed to archive conversation');
    }
  },

  formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString();
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export default HistoryUI;
```

---

## Task 4: Update State Manager for Resume

**File:** `js/triage-state.js`

Add this method to the TriageState object:

```javascript
// Add this method to TriageState

async resumeConversation(conversationId) {
  this.status = 'loading';
  this.conversationId = conversationId;

  try {
    await this.loadMessages();
    this.status = 'active';
    return true;
  } catch (error) {
    console.error('Failed to resume conversation:', error);
    this.status = 'error';
    throw error;
  }
},
```

---

## Task 5: Update index.html

Add history container and wire up button:

```html
<!-- History container -->
<div id="history-container" class="hidden"></div>

<!-- In script section -->
<script type="module">
  import HistoryUI from './js/history-ui.js';

  HistoryUI.init('history-container');

  // Add history button (you'll add the button in the UI later)
  document.getElementById('history-btn')?.addEventListener('click', () => {
    HistoryUI.open();
  });
</script>
```

---

## Task 6: History Styles

**File:** `style.css`

Add these styles:

```css
/* ============================================
   CONVERSATION HISTORY
   ============================================ */

.history-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  max-width: 100%;
  height: 100vh;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 900;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.history-header h2 {
  margin: 0;
  font-size: 18px;
}

.history-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-section {
  margin-bottom: 24px;
}

.history-section h3 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
  margin: 0 0 12px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f9f9f9;
  transition: background 0.15s ease;
}

.history-item:hover {
  background: #f0f0f0;
}

.history-item-content {
  flex: 1;
  min-width: 0;
}

.history-item-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-meta {
  font-size: 12px;
  color: #666;
}

.history-item-preview {
  font-size: 13px;
  color: #666;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-item-actions {
  display: flex;
  gap: 4px;
}

.history-resume,
.history-archive {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.15s ease;
}

.history-resume:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.history-archive:hover {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.history-start-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.history-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

/* Mobile */
@media (max-width: 640px) {
  .history-panel {
    width: 100%;
  }

  .history-item {
    padding: 16px;
  }

  .history-resume,
  .history-archive {
    min-width: 44px;
    min-height: 44px;
  }
}
```

---

## Checklist

- [ ] `GET /api/conversations` - list conversations
- [ ] `POST /api/conversation/:id/archive` - archive conversation
- [ ] `js/history-ui.js` created
- [ ] `resumeConversation()` method added to triage-state.js
- [ ] History container in index.html
- [ ] History panel opens and shows conversations
- [ ] Active and past sections separate
- [ ] Resume loads conversation and opens chat
- [ ] Archive moves conversation to "past"
- [ ] Mobile responsive

---

## Testing

1. Open app → click history button
2. See list of your conversations
3. Click → to resume an old conversation
4. Chat opens with message history
5. Click ✓ to archive an active conversation
6. It moves to "Past" section
7. Click "Start Planning" if empty
8. Opens chat panel

---

## Commit

```bash
git add api/conversations/ api/conversation/[id]/archive.js js/history-ui.js js/triage-state.js index.html style.css
git commit -m "feat: conversation history (Sprint 7.3)

- List conversations endpoint with preview/count
- Archive conversation endpoint
- History UI panel with active/past sections
- Resume past conversations
- Mobile responsive design"
```

---

Ready for Sprint 7.4 (Integration Polish)!
