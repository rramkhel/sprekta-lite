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

    // Restore last active tab from localStorage
    const saved = localStorage.getItem('sprekta_active_tab');
    if (saved) {
      this.switchTo(saved);
    }

    console.log('SidebarTabs initialized');
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
    if (tabName === 'inbox' && window.TriagePanel) {
      window.TriagePanel.refresh();
    }

    console.log(`Switched to ${tabName} tab`);
  },

  newChat() {
    // Switch to chat tab
    this.switchTo('chat');

    // Trigger new conversation
    if (window.ChatUI?.newConversation) {
      window.ChatUI.newConversation();
    }

    // Focus input
    const input = document.getElementById('chat-input');
    if (input) {
      input.focus();
    }
  }
};

export default SidebarTabs;
