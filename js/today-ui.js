// Sprint 17.2: Today Page UI Component with Real Data

class TodayUI {
  constructor() {
    this.container = document.getElementById('today-page');
    this.focusTaskId = null; // Will be set in Sprint 17.3
    this.init();
  }

  init() {
    this.updateCurrentTime();
    setInterval(() => this.updateCurrentTime(), 60000); // Update every minute

    // Fetch and render real data
    this.fetchAndRender();
  }

  /**
   * Fetch today's data from API and render
   */
  async fetchAndRender() {
    try {
      const sessionId = localStorage.getItem('session_id');
      const token = localStorage.getItem('supabase.auth.token');

      const headers = {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      };

      if (token) {
        headers['Authorization'] = `Bearer ${JSON.parse(token).access_token}`;
      }

      const response = await fetch('/api/todos/today', { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch today data');
      }

      const data = await response.json();
      console.log('[TodayUI] Fetched data:', data);

      // Transform API data to render format
      const renderData = this.transformData(data);
      this.render(renderData);

    } catch (error) {
      console.error('[TodayUI] Fetch error:', error);
      // Fall back to placeholder for now
      this.renderPlaceholder();
    }
  }

  /**
   * Transform API data to render format
   */
  transformData(apiData) {
    return {
      rightNow: this.buildRightNowData(apiData),
      today: {
        dayName: apiData.dayName,
        context: apiData.context,
        groups: apiData.groups.map(group => ({
          ...group,
          count: this.calculateGroupCount(group),
          tasks: group.tasks.map(task => ({
            id: task.id,
            title: task.title,
            done: task.completed || false,
            current: false, // Will be set based on focusTaskId in Sprint 17.3
            emoji: task.emoji,
            meta: task.meta
          }))
        })),
        anchor: apiData.anchor ? {
          time: this.formatTime(apiData.anchor.time),
          title: apiData.anchor.title,
          flagged: apiData.anchor.flagged || false
        } : null
      },
      tomorrow: this.buildTomorrowData(),
      totals: this.buildTotalsData(apiData)
    };
  }

  buildRightNowData(apiData) {
    // Placeholder for Sprint 17.3
    return {
      task: {
        title: "Choose your focus",
        priority: ''
      },
      upNext: "to be determined",
      then: "see what's ahead"
    };
  }

  calculateGroupCount(group) {
    const incompleteCount = group.tasks.filter(t => !t.completed).length;
    return incompleteCount > 0 ? `${incompleteCount} left` : '';
  }

  buildTomorrowData() {
    // Placeholder for Sprint 17.4
    return {
      dayName: 'Tomorrow',
      vibe: 'Loading...',
      items: []
    };
  }

  buildTotalsData(apiData) {
    const allTasks = apiData.groups.flatMap(g => g.tasks);
    const flaggedCount = allTasks.filter(t => t.priority === 'non_negotiable').length;

    return {
      allAccountedFor: true,
      taskCount: allTasks.length,
      flaggedCount
    };
  }

  updateCurrentTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase();
    }
  }

  /**
   * Render placeholder data for Sprint 17.1 layout testing
   */
  renderPlaceholder() {
    const placeholderData = {
      rightNow: {
        task: {
          title: "Wrap mom's gift",
          priority: '🔴'
        },
        deadline: '5:15 PM',
        timeRemaining: '2h 41m',
        upNext: "pick up bouquet (on the way)",
        then: "Mom's Birthday · 7pm 🚩"
      },
      today: {
        dayName: 'Monday',
        context: "you're at home for mom's birthday",
        groups: [
          {
            title: "WHILE YOU'RE HOME",
            count: '3 left',
            tasks: [
              { title: "Fix aunty's macbook", done: true },
              { title: "Grab TKD uniforms", done: true },
              { title: "Wrap mom's gift", done: false, current: true },
              { title: "Bring blanket back to office", done: false },
              { title: "Laundry", done: false }
            ]
          },
          {
            title: "ON THE WAY",
            subtitle: "leave by 5:15",
            tasks: [
              { title: "Pick up bouquet", done: false, emoji: "💐" }
            ]
          },
          {
            title: "DUE TODAY",
            tasks: [
              { title: "SmartStop payment", done: true, meta: "paid" }
            ]
          }
        ],
        anchor: {
          time: "7:00 PM",
          title: "Mom's Birthday",
          flagged: true
        }
      },
      tomorrow: {
        dayName: 'Tuesday',
        vibe: 'light day · 1 deadline',
        items: [
          { title: "Reply to Jeff · EOD", flagged: true }
        ]
      },
      totals: {
        allAccountedFor: true,
        taskCount: 18,
        flaggedCount: 4
      }
    };

    this.render(placeholderData);
  }

  /**
   * Main render method
   */
  render(data) {
    this.renderRightNow(data.rightNow);
    this.renderToday(data.today);
    this.renderTomorrow(data.tomorrow);
    this.renderFooter(data.totals);
  }

  /**
   * Render Right Now section
   */
  renderRightNow(rightNow) {
    const focusTask = document.getElementById('focus-task');
    const upNext = document.getElementById('up-next');

    if (!focusTask || !upNext) return;

    // Focus task
    focusTask.innerHTML = `
      <div class="focus-task-priority">${rightNow.task.priority}</div>
      <div class="focus-task-title">${rightNow.task.title}</div>
      <div class="focus-task-deadline">
        you have until ${rightNow.deadline} (${rightNow.timeRemaining})
      </div>
    `;

    // Up next
    upNext.innerHTML = `
      <div>
        <span class="up-next-label">up next:</span> ${rightNow.upNext}
      </div>
      <div>
        <span class="up-next-label">then:</span> ${rightNow.then}
      </div>
    `;
  }

  /**
   * Render Today section
   */
  renderToday(today) {
    // Title and context
    const titleEl = document.getElementById('today-title');
    const contextEl = document.getElementById('today-context');

    if (titleEl) {
      titleEl.textContent = `TODAY · ${today.dayName}`;
    }

    if (contextEl) {
      contextEl.textContent = today.context;
    }

    // Task groups
    const groupsContainer = document.getElementById('task-groups');
    if (!groupsContainer) return;

    groupsContainer.innerHTML = today.groups.map(group => `
      <div class="task-group">
        <div class="task-group-header">
          <div>
            <div class="task-group-title">${group.title}</div>
            ${group.subtitle ? `<div class="task-group-subtitle">${group.subtitle}</div>` : ''}
          </div>
          ${group.count ? `<div class="task-group-count">${group.count}</div>` : ''}
        </div>
        <div class="task-group-items">
          ${group.tasks.map(task => this.renderTaskItem(task)).join('')}
        </div>
      </div>
    `).join('');

    // Anchor event
    const anchorEl = document.getElementById('anchor-event');
    if (today.anchor && anchorEl) {
      anchorEl.innerHTML = `
        <div class="anchor-event-content">
          <div class="anchor-event-time">${today.anchor.time}</div>
          <div class="anchor-event-title">${today.anchor.title}</div>
        </div>
        ${today.anchor.flagged ? '<div class="anchor-event-flag">🚩</div>' : ''}
      `;
      anchorEl.style.display = 'flex';
    } else if (anchorEl) {
      anchorEl.style.display = 'none';
    }

    // Hide context if not present
    if (contextEl) {
      contextEl.style.display = today.context ? 'block' : 'none';
    }

    // Attach event listeners for checkboxes
    this.attachTaskListeners();
  }

  /**
   * Render a single task item
   */
  renderTaskItem(task) {
    const classes = ['task-item'];
    if (task.done) classes.push('done');
    if (task.current) classes.push('current');

    return `
      <div class="${classes.join(' ')}" data-task-id="${task.id}">
        <div class="task-item-checkbox" data-task-id="${task.id}">
          ${task.done ? `
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          ` : ''}
        </div>
        <div class="task-item-content">
          <div>
            <span class="task-item-title">${task.title}</span>
            ${task.emoji ? ` ${task.emoji}` : ''}
          </div>
          <div>
            ${task.current ? '<span class="task-item-current-marker">← right now</span>' : ''}
            ${task.meta ? `<span class="task-item-meta">${task.meta}</span>` : ''}
            ${task.done ? '<span class="task-item-meta">done</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners for task checkboxes
   */
  attachTaskListeners() {
    document.querySelectorAll('.task-item-checkbox').forEach(checkbox => {
      checkbox.addEventListener('click', (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        this.toggleTask(taskId);
      });
    });
  }

  /**
   * Toggle task completion
   */
  async toggleTask(taskId) {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`).closest('.task-item');
    if (!taskEl) return;

    const isCompleted = taskEl.classList.contains('done');

    // Optimistic update
    taskEl.classList.toggle('done');

    try {
      const sessionId = localStorage.getItem('session_id');
      const token = localStorage.getItem('supabase.auth.token');

      const headers = {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      };

      if (token) {
        headers['Authorization'] = `Bearer ${JSON.parse(token).access_token}`;
      }

      const response = await fetch(`/api/todos/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ completed: !isCompleted })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh the page data
      await this.fetchAndRender();

    } catch (error) {
      console.error('[TodayUI] Toggle task error:', error);
      // Revert optimistic update
      taskEl.classList.toggle('done');
    }
  }

  /**
   * Format time (HH:MM) to 12-hour format
   */
  formatTime(time) {
    if (!time) return '';

    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Render Tomorrow section
   */
  renderTomorrow(tomorrow) {
    const tomorrowSection = document.getElementById('tomorrow-section');
    if (!tomorrowSection) return;

    tomorrowSection.innerHTML = `
      <div class="tomorrow-header">
        <h2 class="tomorrow-title">TOMORROW · ${tomorrow.dayName}</h2>
        <span class="tomorrow-vibe">${tomorrow.vibe}</span>
      </div>
      ${tomorrow.items.map(item => `
        <div class="tomorrow-item">
          ${item.flagged ? '🚩 ' : ''}${item.title}
        </div>
      `).join('')}
    `;
  }

  /**
   * Render footer
   */
  renderFooter(totals) {
    const statusCheck = document.getElementById('status-check');
    const statusCounts = document.getElementById('status-counts');

    if (statusCounts) {
      statusCounts.textContent = `${totals.taskCount} tasks · ${totals.flaggedCount} 🚩`;
    }

    // Status check already has inline SVG in HTML
  }
}

export default TodayUI;
