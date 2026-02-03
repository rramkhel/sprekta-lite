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
    // Build Right Now data first (sets this.focusTaskId)
    const rightNow = this.buildRightNowData(apiData.today);

    return {
      rightNow,
      today: {
        dayName: apiData.today.dayName,
        context: apiData.today.context,
        groups: apiData.today.groups.map(group => ({
          ...group,
          count: this.calculateGroupCount(group),
          tasks: group.tasks.map(task => ({
            id: task.id,
            title: task.title,
            done: task.completed || false,
            current: task.id === this.focusTaskId, // Mark focus task
            emoji: task.emoji,
            meta: task.meta,
            context_group: task.context_group
          }))
        })),
        anchor: apiData.today.anchor ? {
          time: this.formatTime(apiData.today.anchor.time),
          title: apiData.today.anchor.title,
          flagged: apiData.today.anchor.flagged || false
        } : null
      },
      tomorrow: apiData.tomorrow,
      totals: apiData.totals
    };
  }

  buildRightNowData(apiData) {
    const { groups, anchor } = apiData;
    const allTasks = groups.flatMap(g => g.tasks);
    const incompleteTasks = allTasks.filter(t => !t.completed);

    // Get focus task (user-selected or first incomplete)
    const focusTaskId = this.getFocusTaskId();
    let focusTask = incompleteTasks.find(t => t.id === focusTaskId);

    // If no valid focus task, default to first incomplete
    if (!focusTask && incompleteTasks.length > 0) {
      focusTask = incompleteTasks[0];
      this.setFocusTaskId(focusTask.id);
    }

    // Store focusTaskId so renderTaskItem can mark it
    this.focusTaskId = focusTask?.id || null;

    // Calculate up next and then
    const focusIndex = incompleteTasks.findIndex(t => t.id === focusTask?.id);
    const upNext = incompleteTasks[focusIndex + 1] || null;
    const then = anchor;

    return {
      focusTask,
      upNext,
      then,
      incompleteTasks
    };
  }

  // Focus task localStorage methods
  getFocusTaskId() {
    return localStorage.getItem('sprekta_focus_task_id');
  }

  setFocusTaskId(taskId) {
    if (taskId) {
      localStorage.setItem('sprekta_focus_task_id', taskId);
    } else {
      localStorage.removeItem('sprekta_focus_task_id');
    }
  }

  calculateGroupCount(group) {
    const incompleteCount = group.tasks.filter(t => !t.completed).length;
    return incompleteCount > 0 ? `${incompleteCount} left` : '';
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
    const container = document.querySelector('.right-now-section');
    if (!container) return;

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();

    // No tasks state
    if (!rightNow.focusTask) {
      container.innerHTML = `
        <div class="right-now-header">
          <span class="right-now-label">RIGHT NOW</span>
          <span class="right-now-time">${currentTime}</span>
        </div>
        <div class="focus-clear">
          <span>✨ All clear for now</span>
        </div>
      `;
      return;
    }

    // Normal state with focus task
    container.innerHTML = `
      <div class="right-now-header">
        <span class="right-now-label">RIGHT NOW</span>
        <span class="right-now-time">${currentTime}</span>
      </div>

      <div class="focus-task">
        <div class="focus-task-row">
          <div class="focus-task-content">
            <span class="focus-task-priority">${this.getPriorityIcon(rightNow.focusTask)}</span>
            <span class="focus-task-title">${rightNow.focusTask.title}</span>
          </div>
          <button class="focus-change-btn" data-action="change-focus">change</button>
        </div>
      </div>

      <div class="up-next">
        ${rightNow.upNext ? `
          <div class="up-next-item">
            <span class="up-next-label">up next</span>
            <span class="up-next-content">${rightNow.upNext.title}${rightNow.upNext.context_group ? ` (${this.formatGroupName(rightNow.upNext.context_group)})` : ''}</span>
          </div>
        ` : ''}
        ${rightNow.then ? `
          <div class="up-next-item">
            <span class="up-next-label">then</span>
            <span class="up-next-content">${rightNow.then.title}${rightNow.then.time ? ` · ${this.formatTime(rightNow.then.time)}` : ''} ${rightNow.then.flagged ? '<span class="flag">🚩</span>' : ''}</span>
          </div>
        ` : ''}
      </div>
    `;

    // Attach change handler
    this.attachFocusChangeHandler(rightNow.incompleteTasks);
  }

  getPriorityIcon(task) {
    if (task.priority === 'non_negotiable') return '🔴';
    if (task.priority === 'important') return '🟠';
    return '🟡';
  }

  formatGroupName(group) {
    const names = {
      'while_home': 'while home',
      'on_the_way': 'on the way',
      'at_office': 'at office',
      'due_today': 'due today'
    };
    return names[group] || group.replace(/_/g, ' ');
  }

  /**
   * Attach focus change handler
   */
  attachFocusChangeHandler(incompleteTasks) {
    const changeBtn = document.querySelector('[data-action="change-focus"]');
    if (!changeBtn) return;

    changeBtn.addEventListener('click', () => {
      this.showFocusPicker(incompleteTasks);
    });
  }

  /**
   * Show focus picker modal
   */
  showFocusPicker(tasks) {
    // Create modal/dropdown to pick focus task
    const picker = document.createElement('div');
    picker.className = 'focus-picker-overlay';
    picker.innerHTML = `
      <div class="focus-picker">
        <div class="focus-picker-header">
          <span>What do you want to focus on?</span>
          <button class="focus-picker-close">×</button>
        </div>
        <div class="focus-picker-list">
          ${tasks.map(task => `
            <div class="focus-picker-item" data-task-id="${task.id}">
              <span class="focus-picker-priority">${this.getPriorityIcon(task)}</span>
              <span class="focus-picker-title">${task.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(picker);

    // Close handler
    picker.querySelector('.focus-picker-close').addEventListener('click', () => {
      picker.remove();
    });

    picker.addEventListener('click', (e) => {
      if (e.target === picker) picker.remove();
    });

    // Select handler
    picker.querySelectorAll('.focus-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        const taskId = item.dataset.taskId;
        this.setFocusTaskId(taskId);
        picker.remove();
        this.fetchAndRender(); // Re-render with new focus
      });
    });
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

    // If completing the focus task, clear it
    if (!isCompleted && taskId === this.getFocusTaskId()) {
      this.setFocusTaskId(null);
    }

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
   * Render Tomorrow section (Sprint 17.4)
   */
  renderTomorrow(tomorrow) {
    const container = document.getElementById('tomorrow-section');
    if (!container) return;

    // Clear day state
    if (!tomorrow || (tomorrow.taskCount === 0 && tomorrow.eventCount === 0)) {
      container.innerHTML = `
        <div class="tomorrow-header">
          <span class="tomorrow-title">Tomorrow · ${tomorrow?.dayName || 'Unknown'}</span>
          <span class="tomorrow-vibe">clear day ✨</span>
        </div>
      `;
      return;
    }

    let itemsHtml = '';

    if (tomorrow.flagged.length > 0) {
      // Show flagged items (up to 3)
      itemsHtml = tomorrow.flagged.slice(0, 3).map(item => `
        <div class="tomorrow-item">
          <span class="flag">🚩</span>
          <span>${item.title}${item.time ? ` · ${this.formatTime(item.time)}` : ''}</span>
        </div>
      `).join('');

      if (tomorrow.flagged.length > 3) {
        itemsHtml += `<div class="tomorrow-more">+${tomorrow.flagged.length - 3} more</div>`;
      }
    } else if (tomorrow.eventCount > 0) {
      // No flagged, but has events - show count summary
      itemsHtml = `
        <div class="tomorrow-item tomorrow-item-subtle">
          ${tomorrow.taskCount} tasks · ${tomorrow.eventCount} event${tomorrow.eventCount > 1 ? 's' : ''}
        </div>
      `;
    } else {
      // Just tasks
      itemsHtml = `
        <div class="tomorrow-item tomorrow-item-subtle">
          ${tomorrow.taskCount} task${tomorrow.taskCount > 1 ? 's' : ''}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="tomorrow-header">
        <span class="tomorrow-title">Tomorrow · ${tomorrow.dayName}</span>
        <span class="tomorrow-vibe">${tomorrow.vibe}</span>
      </div>
      ${itemsHtml}
    `;
  }

  /**
   * Render footer (Sprint 17.4)
   */
  renderFooter(totals) {
    const statusEl = document.getElementById('status-check');
    const countsEl = document.getElementById('status-counts');

    // Status check
    if (statusEl) {
      if (totals.allAccountedFor) {
        statusEl.innerHTML = `
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          all accounted for
        `;
        statusEl.classList.remove('warning');
        statusEl.classList.add('success');
      } else {
        statusEl.innerHTML = `
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          ${totals.orphanedCount} item${totals.orphanedCount > 1 ? 's' : ''} need attention
        `;
        statusEl.classList.remove('success');
        statusEl.classList.add('warning');
      }
    }

    // Counts
    if (countsEl) {
      countsEl.textContent = `${totals.taskCount} tasks · ${totals.flaggedCount} 🚩`;
    }
  }
}

export default TodayUI;
