/**
 * Panel Manager
 *
 * Handles three-panel layout state and transitions.
 */

const PanelManager = {
  panels: {
    chat: false,
    triage: false
  },

  init() {
    // Bind toggle buttons
    document.getElementById('toggle-chat')?.addEventListener('click', () => {
      this.toggle('chat');
    });

    document.getElementById('toggle-triage')?.addEventListener('click', () => {
      this.toggle('triage');
    });

    // Bind close buttons
    document.querySelectorAll('.panel-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const panel = e.currentTarget.dataset.panel;
        if (panel) this.close(panel);
      });
    });

    // Restore state from localStorage
    this.restoreState();
  },

  toggle(panel) {
    this.panels[panel] = !this.panels[panel];
    this.update();
    this.saveState();
  },

  open(panel) {
    this.panels[panel] = true;
    this.update();
    this.saveState();
  },

  close(panel) {
    this.panels[panel] = false;
    this.update();
    this.saveState();
  },

  update() {
    const shell = document.getElementById('app-shell');
    const chatPanel = document.getElementById('chat-panel');
    const triagePanel = document.getElementById('triage-panel');
    const chatToggle = document.getElementById('toggle-chat');
    const triageToggle = document.getElementById('toggle-triage');

    // Update panel visibility
    chatPanel?.classList.toggle('hidden', !this.panels.chat);
    triagePanel?.classList.toggle('hidden', !this.panels.triage);

    // Update toggle button states
    chatToggle?.classList.toggle('active', this.panels.chat);
    triageToggle?.classList.toggle('active', this.panels.triage);

    // Update shell class for layout
    const openCount = Object.values(this.panels).filter(Boolean).length;
    shell?.classList.remove('one-panel', 'two-panels', 'three-panels');
    shell?.classList.add(
      openCount === 0 ? 'one-panel' :
      openCount === 1 ? 'two-panels' : 'three-panels'
    );

    // Trigger calendar adaptation
    this.adaptCalendar(openCount);
  },

  adaptCalendar(panelCount) {
    if (panelCount >= 2) {
      // Switch to compact mode
      if (window.enterCompactMode) {
        window.enterCompactMode();
      }
    } else {
      // Switch to standard mode
      if (window.exitCompactMode) {
        window.exitCompactMode();
      }
    }

    // Dispatch event for calendar component to handle
    window.dispatchEvent(new CustomEvent('calendar-layout-change', {
      detail: { compact: panelCount >= 2 }
    }));
  },

  saveState() {
    localStorage.setItem('sprekta_panels', JSON.stringify(this.panels));
  },

  restoreState() {
    try {
      const saved = localStorage.getItem('sprekta_panels');
      if (saved) {
        this.panels = JSON.parse(saved);
        this.update();
      }
    } catch (e) {
      console.warn('Could not restore panel state:', e);
    }
  },

  // Public getters
  isOpen(panel) {
    return this.panels[panel];
  }
};

export default PanelManager;
