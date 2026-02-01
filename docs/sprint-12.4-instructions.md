# Sprint 12.4: Todo Display (Minimal)

## Context

Part of Sprint 12: Brain Dump → Organized Calendar & Todos. This sprint creates a simple todo list UI so users can see their todos.

**Repo:** `rramkhel/sprekta-lite`
**Live:** `https://sprekta-lite.vercel.app`
**Stack:** Vanilla JS, Supabase, Vercel serverless functions

---

## Goal

Create a minimal todo list display:
- Grouped by time (today/tomorrow/this week/future/someday)
- Shows priority icons (🔴🟡🟢)
- Checkbox to complete todos
- No editing, no fancy features — just a list

---

## Files to Create/Modify

1. `js/todos-ui.js` (new)
2. `api/todos/index.js` (new)
3. `index.html` (add container)
4. `style.css` (add styles)

---

## Step 1: Create TodosUI Module

Create `js/todos-ui.js`:

```javascript
const TodosUI = {
  container: null,
  todos: [],

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (this.container) {
      this.load();
    }
  },

  async load() {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to load todos');

      const data = await response.json();
      this.todos = data || [];
      this.render();
    } catch (err) {
      console.error('Failed to load todos:', err);
      this.todos = [];
      this.render();
    }
  },

  render() {
    if (!this.container) return;

    const grouped = this.groupByTimeGroup(this.todos.filter(t => !t.completed));

    this.container.innerHTML = `
      <div class="todos-panel">
        <div class="todos-header">
          <h3>To-Do List</h3>
          <button class="todos-refresh-btn" id="todos-refresh">
            <i data-lucide="refresh-cw"></i>
          </button>
        </div>
        <div class="todos-list">
          ${this.renderGroup('Today', grouped.today)}
          ${this.renderGroup('Tomorrow', grouped.tomorrow)}
          ${this.renderGroup('This Week', grouped.this_week)}
          ${this.renderGroup('Future', grouped.future)}
          ${this.renderGroup('Someday', grouped.someday)}
        </div>
      </div>
    `;

    this.bindEvents();

    // Refresh lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
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

    const scheduledTime = todo.scheduled_time
      ? `<span class="todo-time">${this.formatTime(todo.scheduled_time)}</span>`
      : '';

    return `
      <div class="todo-item" data-id="${todo.id}">
        <button class="todo-checkbox" data-id="${todo.id}">☐</button>
        <span class="todo-priority">${priorityIcon}</span>
        <span class="todo-title">${this.escapeHtml(todo.title)}</span>
        ${scheduledTime}
        ${deadline}
      </div>
    `;
  },

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  formatTime(timeStr) {
    // timeStr is "HH:MM" in 24-hour format
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  bindEvents() {
    // Checkbox clicks
    this.container.querySelectorAll('.todo-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.toggleComplete(id);
      });
    });

    // Refresh button
    const refreshBtn = document.getElementById('todos-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.load());
    }
  },

  async toggleComplete(id) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });

      if (!response.ok) throw new Error('Failed to complete todo');

      await this.load();
    } catch (err) {
      console.error('Failed to complete todo:', err);
    }
  }
};

export default TodosUI;
```

---

## Step 2: Create Todos API Endpoint

Create `api/todos/index.js`:

```javascript
import { createServiceClient } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createServiceClient();

  try {
    if (req.method === 'GET') {
      // For now, fetch all todos (auth can be added later)
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Todos fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch todos' });
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

Create `api/todos/[id].js` for completing todos:

```javascript
import { createServiceClient } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createServiceClient();

  try {
    if (req.method === 'PATCH') {
      const { completed } = req.body;

      const { data, error } = await supabase
        .from('todos')
        .update({
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Todo update error:', error);
        return res.status(500).json({ error: 'Failed to update todo' });
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Step 3: Add Container to HTML

In `index.html`, add a todos container (placement depends on your layout):

```html
<!-- Todos Container -->
<div id="todos-container" class="todos-container"></div>
```

And import the module at the bottom:

```html
<script type="module">
  import TodosUI from './js/todos-ui.js';

  // Initialize todos
  TodosUI.init('todos-container');

  // Make globally available
  window.TodosUI = TodosUI;
</script>
```

---

## Step 4: Add Styles

Add to `style.css`:

```css
/* ============================================
   TODOS LIST
   ============================================ */

.todos-container {
  /* Positioning depends on your layout */
}

.todos-panel {
  padding: 16px;
  background: #fff;
}

.todos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.todos-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1c1917;
}

.todos-refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #78716c;
  display: flex;
  align-items: center;
}

.todos-refresh-btn:hover {
  color: #1c1917;
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.todos-group {
  margin-bottom: 4px;
}

.todos-group-label {
  font-size: 12px;
  font-weight: 600;
  color: #78716c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f4;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-checkbox {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
}

.todo-checkbox:hover {
  opacity: 0.7;
}

.todo-priority {
  font-size: 12px;
  line-height: 1;
}

.todo-title {
  flex: 1;
  font-size: 14px;
  color: #1c1917;
}

.todo-time {
  font-size: 12px;
  color: #57534e;
  margin-right: 4px;
}

.todo-deadline {
  font-size: 12px;
  color: #dc2626;
}
```

---

## Testing

After deploying:

1. **Create a todo via chat**
   ```
   call mom
   ```

2. **Check todos endpoint**
   ```
   curl https://your-app.vercel.app/api/todos
   ```

3. **Verify UI shows the todo**
   - Should appear under "SOMEDAY"
   - Should have 🟢 icon (flexible priority)

4. **Complete a todo**
   - Click the checkbox
   - Todo should disappear from list

---

## Commit Message

```bash
git add js/todos-ui.js api/todos/index.js api/todos/[id].js index.html style.css
git commit -m "feat: minimal todo list display

- TodosUI for displaying grouped todos
- /api/todos endpoint for fetching
- /api/todos/[id] endpoint for completing
- Group by time_group, show priority icons
- Checkbox to mark complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Next Step

After completing this sprint, proceed to Sprint 12.5: Testing Scenarios.
