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
          <div class="todos-header-actions">
            <button class="todos-refresh-btn" id="todos-refresh">
              <i data-lucide="refresh-cw"></i>
            </button>
            <button class="todos-close-btn" id="todos-close">×</button>
          </div>
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

    // Close button
    const closeBtn = document.getElementById('todos-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.container.classList.add('hidden');
      });
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
