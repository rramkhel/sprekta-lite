const TodosUI = {
  container: null,
  todos: [],

  init() {
    // Render into tab content, not modal
    this.container = document.getElementById('todos-content');
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

  bindEvents() {
    // Checkbox clicks
    this.container.querySelectorAll('.todo-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.toggleComplete(id);
      });
    });
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
