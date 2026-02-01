I see the issue. The current todos UI is a **floating modal overlay** (like a popup), not integrated into the sidebar. Let me write Sprint 12.5.1 to fix this:

---

## Sprint 12.5.1: Unified Left Sidebar with Tabs

### Goal

Replace the floating panels with a single, unified left sidebar containing tabs for Chat, Inbox, and Todos.

### Current State (Problem)
- Chat panel = separate fixed panel
- Todos = floating modal overlay
- Inbox/Triage = another separate panel
- Multiple toggles, fragmented UX

### Target State
```
┌────────────────────────────────────────────┐
│ Chat │ Inbox │ Todos            [+]        │
│ ════                                       │
│                                            │
│  [Content for active tab]                  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ What's on your mind?             [→] │  │  ← only shows on Chat tab
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Restructure left panel with tabs |
| `style.css` | Tab styles, remove modal styles for todos |
| `js/panel-manager.js` | Handle tab switching instead of multiple panels |
| `js/todos-ui.js` | Render into tab content, not modal |
| `js/triage-ui.js` | Render into tab content (Inbox) |

---

### Step 1: Update HTML Structure

Replace the current panel structure in `index.html`:

```html
<!-- Unified Left Sidebar -->
<aside id="left-sidebar" class="left-sidebar">
  <!-- Tab Bar -->
  <div class="sidebar-tabs">
    <button class="sidebar-tab active" data-tab="chat">Chat</button>
    <button class="sidebar-tab" data-tab="inbox">Inbox</button>
    <button class="sidebar-tab" data-tab="todos">Todos</button>
    <button class="sidebar-tab-action" id="new-chat-btn" title="New conversation">+</button>
  </div>

  <!-- Tab Content: Chat -->
  <div class="sidebar-content" id="tab-chat">
    <div class="chat-messages" id="chat-messages">
      <!-- Messages render here -->
    </div>
    <div class="chat-input-area">
      <textarea id="chat-input" placeholder="What's on your mind?" rows="1"></textarea>
      <button id="chat-send" class="chat-send-btn">→</button>
    </div>
  </div>

  <!-- Tab Content: Inbox -->
  <div class="sidebar-content hidden" id="tab-inbox">
    <div id="inbox-content">
      <!-- Triage/inbox items render here -->
    </div>
  </div>

  <!-- Tab Content: Todos -->
  <div class="sidebar-content hidden" id="tab-todos">
    <div id="todos-content">
      <!-- Todos render here -->
    </div>
  </div>
</aside>

<!-- Main Content: Calendar -->
<main id="main-content" class="main-content">
  <!-- Calendar renders here -->
</main>
```

**Delete these from HTML:**
- `<div id="todos-container" class="hidden"></div>` (the modal)
- The separate `#chat-panel` structure
- The separate triage panel if it exists

---

### Step 2: Update Styles

Replace/add in `style.css`:

```css
/* ============================================
   UNIFIED LEFT SIDEBAR
   ============================================ */

.left-sidebar {
  position: fixed;
  top: 60px; /* Below header */
  left: 0;
  width: 320px;
  height: calc(100vh - 60px);
  background: #fff;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

/* Tab Bar */
.sidebar-tabs {
  display: flex;
  align-items: center;
  padding: 12px 12px 0;
  border-bottom: 1px solid #e5e5e5;
  gap: 4px;
}

.sidebar-tab {
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #78716c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s ease;
}

.sidebar-tab:hover {
  color: #1c1917;
}

.sidebar-tab.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}

.sidebar-tab-action {
  margin-left: auto;
  padding: 6px 12px;
  background: #f5f5f4;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 500;
  color: #78716c;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sidebar-tab-action:hover {
  background: #6366f1;
  color: #fff;
}

/* Tab Content */
.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-content.hidden {
  display: none;
}

/* Chat Tab */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input-area textarea {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
}

.chat-input-area textarea:focus {
  outline: none;
  border-color: #6366f1;
}

.chat-send-btn {
  padding: 10px 14px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.chat-send-btn:hover {
  background: #4f46e5;
}

/* Inbox Tab */
#inbox-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Todos Tab */
#todos-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.todos-group {
  margin-bottom: 20px;
}

.todos-group-label {
  font-size: 11px;
  font-weight: 600;
  color: #78716c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f4;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d6d3d1;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.todo-checkbox:hover {
  border-color: #6366f1;
}

.todo-priority {
  font-size: 12px;
  flex-shrink: 0;
}

.todo-title {
  flex: 1;
  font-size: 14px;
  color: #1c1917;
}

.todo-deadline {
  font-size: 12px;
  color: #dc2626;
}

/* Main Content */
.main-content {
  margin-left: 320px;
  padding: 20px;
  min-height: calc(100vh - 60px);
}

/* ============================================
   DELETE THESE (old modal styles)
   ============================================ */
/* Remove the .todos-container modal overlay styles */
/* Remove the .todos-panel modal card styles */
```

---

### Step 3: Tab Switching Logic

Create `js/sidebar-tabs.js`:

```javascript
const SidebarTabs = {
  activeTab: 'chat',

  init() {
    // Bind tab clicks
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTo(tabName);
      });
    });

    // Bind new chat button
    document.getElementById('new-chat-btn')?.addEventListener('click', () => {
      this.newChat();
    });

    // Restore last active tab
    const saved = localStorage.getItem('sprekta_active_tab');
    if (saved) {
      this.switchTo(saved);
    }
  },

  switchTo(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content visibility
    document.querySelectorAll('.sidebar-content').forEach(content => {
      const contentTab = content.id.replace('tab-', '');
      content.classList.toggle('hidden', contentTab !== tabName);
    });

    // Save state
    localStorage.setItem('sprekta_active_tab', tabName);

    // Load content if needed
    if (tabName === 'todos' && window.TodosUI) {
      window.TodosUI.load();
    }
    if (tabName === 'inbox' && window.InboxUI) {
      window.InboxUI.load();
    }
  },

  newChat() {
    // Switch to chat tab
    this.switchTo('chat');
    
    // Trigger new conversation
    if (window.ChatUI?.newConversation) {
      window.ChatUI.newConversation();
    }
  }
};

export default SidebarTabs;
```

---

### Step 4: Update TodosUI

Modify `js/todos-ui.js` to render into the tab content instead of a modal:

```javascript
const TodosUI = {
  container: null,
  todos: [],

  init() {
    // Render into tab content, not modal
    this.container = document.getElementById('todos-content');
    this.load();
  },

  async load() {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to load todos');
      this.todos = await response.json();
      this.render();
    } catch (err) {
      console.error('Failed to load todos:', err);
      this.renderError();
    }
  },

  render() {
    if (!this.container) return;

    const incomplete = this.todos.filter(t => !t.completed);
    const grouped = this.groupByTimeGroup(incomplete);

    if (incomplete.length === 0) {
      this.container.innerHTML = `
        <div class="todos-empty">
          <p>No todos yet</p>
          <p class="text-muted">Chat with Sprekta to add tasks</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      ${this.renderGroup('Today', grouped.today)}
      ${this.renderGroup('Tomorrow', grouped.tomorrow)}
      ${this.renderGroup('This Week', grouped.this_week)}
      ${this.renderGroup('Future', grouped.future)}
      ${this.renderGroup('Someday', grouped.someday)}
    `;

    this.bindEvents();
  },

  groupByTimeGroup(todos) {
    return {
      today: todos.filter(t => t.time_group === 'today'),
      tomorrow: todos.filter(t => t.time_group === 'tomorrow'),
      this_week: todos.filter(t => t.time_group === 'this_week'),
      future: todos.filter(t => t.time_group === 'future'),
      someday: todos.filter(t => t.time_group === 'someday')
    };
  },

  renderGroup(label, todos) {
    if (todos.length === 0) return '';

    return `
      <div class="todos-group">
        <h4 class="todos-group-label">${label}</h4>
        ${todos.map(t => this.renderTodo(t)).join('')}
      </div>
    `;
  },

  renderTodo(todo) {
    const priorityIcon = {
      non_negotiable: '🔴',
      important: '🟡',
      flexible: '🟢'
    }[todo.priority] || '⚪';

    const deadline = todo.deadline
      ? `<span class="todo-deadline">due ${this.formatDate(todo.deadline)}</span>`
      : '';

    return `
      <div class="todo-item" data-id="${todo.id}">
        <button class="todo-checkbox" data-id="${todo.id}"></button>
        <span class="todo-priority">${priorityIcon}</span>
        <span class="todo-title">${this.escapeHtml(todo.title)}</span>
        ${deadline}
      </div>
    `;
  },

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  renderError() {
    this.container.innerHTML = `
      <div class="todos-error">
        <p>Couldn't load todos</p>
        <button onclick="TodosUI.load()">Retry</button>
      </div>
    `;
  },

  bindEvents() {
    this.container.querySelectorAll('.todo-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.toggleComplete(id);
      });
    });
  },

  async toggleComplete(id) {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });
      await this.load();
    } catch (err) {
      console.error('Failed to complete todo:', err);
    }
  }
};

export default TodosUI;
```

---

### Step 5: Initialize in index.html

```html
<script type="module">
  import SidebarTabs from './js/sidebar-tabs.js';
  import TodosUI from './js/todos-ui.js';
  import ChatUI from './js/triage-ui.js';  // or wherever chat lives

  // Initialize
  SidebarTabs.init();
  TodosUI.init();
  ChatUI.init();

  // Make available globally
  window.SidebarTabs = SidebarTabs;
  window.TodosUI = TodosUI;
  window.ChatUI = ChatUI;
</script>
```

---

### Step 6: Clean Up Header

Remove the separate toggle buttons from header since everything is now in the sidebar:

```html
<!-- Remove these from header-right -->
<!-- <button id="toggle-triage">...</button> -->
<!-- <button id="toggle-todos">...</button> -->
```

Keep just:
```html
<div class="header-right">
  <button id="profile-btn" class="profile-btn">
    <i data-lucide="user"></i>
  </button>
  <div id="auth-header"></div>
</div>
```

---

### Summary

| Before | After |
|--------|-------|
| Floating todos modal | Integrated in sidebar tab |
| Separate chat panel | Chat tab in sidebar |
| Separate triage panel | Inbox tab in sidebar |
| 3 toggle buttons in header | No toggles, always visible sidebar |
| Multiple overlapping UIs | One unified sidebar |

---

Ready for Claude Code?