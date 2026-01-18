        // ============================================
        // DEMO MODE CONFIGURATION
        // ============================================
        // Set DEMO_MODE = true to use mock AI responses (no API calls, free prototyping)
        // Set DEMO_MODE = false to use real AI (requires API key, costs money)
        window.DEMO_MODE = true; // <-- Toggle this for prototyping vs production
        // ============================================

        // Import dev panel and mock AI (if in demo mode)
        let devPanel = null;
        let mockAI = null;

        // Initialize dev panel
        (async () => {
            try {
                const devPanelModule = await import('./dev-panel.js');
                devPanel = devPanelModule.default;
                devPanel.initDevPanel();
                devPanel.populateScenarioSelector();

                // Import mock AI for demo mode
                const mockAIModule = await import('./test-data/mock-ai-engine.js');
                mockAI = mockAIModule.mockAI;

                console.log('[App] Dev panel and mock AI loaded');
            } catch (error) {
                console.error('[App] Failed to load dev panel:', error);
            }
        })();

        lucide.createIcons();

        let conversationHistory = [];
        let events = [];
        let currentDate = new Date();
        let chatStarted = false;
        let userProfile = {
            core: {},
            context: {},
            people: {},
            goals: [],
            updatedAt: null
        };

        // Initialize
        renderCalendar();
        loadEvents();
        loadProfile();

        // Profile functions
        function toggleProfile() {
            const panel = document.getElementById('profilePanel');
            const overlay = document.getElementById('profileOverlay');
            
            panel.classList.toggle('open');
            overlay.classList.toggle('open');
            
            if (panel.classList.contains('open')) {
                lucide.createIcons();
            }
        }

        function closeMenu() {
            const panel = document.getElementById('profilePanel');
            const overlay = document.getElementById('profileOverlay');
            
            panel.classList.remove('open');
            overlay.classList.remove('open');
        }

        function openProfileView() {
            closeMenu();
            const profileView = document.getElementById('profileView');
            profileView.classList.add('active');
            lucide.createIcons();
        }

        function closeProfileView() {
            const profileView = document.getElementById('profileView');
            profileView.classList.remove('active');
        }

        async function loadProfile() {
            try {
                const result = localStorage.getItem('user-profile');
                if (result) {
                    userProfile = JSON.parse(result);
                }
            } catch (error) {
                console.log('No existing profile');
            }
        }

        async function saveProfile() {
            try {
                userProfile.updatedAt = new Date().toISOString();
                localStorage.setItem('user-profile', JSON.stringify(userProfile));
            } catch (error) {
                console.error('Failed to save profile:', error);
            }
        }

        function updateProfile(updates) {
            if (updates.core) {
                userProfile.core = { ...userProfile.core, ...updates.core };
            }
            if (updates.context) {
                userProfile.context = { ...userProfile.context, ...updates.context };
            }
            if (updates.people) {
                userProfile.people = { ...userProfile.people, ...updates.people };
            }
            if (updates.goals) {
                updates.goals.forEach(goal => {
                    if (!userProfile.goals.find(g => g.text === goal.text)) {
                        userProfile.goals.push(goal);
                    }
                });
            }
            saveProfile();
        }

        function renderProfile() {
            const content = document.getElementById('profileContent');
            
            const hasData = Object.keys(userProfile.core).length > 0 || 
                           Object.keys(userProfile.context).length > 0 ||
                           Object.keys(userProfile.people).length > 0 ||
                           userProfile.goals.length > 0;
            
            if (!hasData) {
                content.innerHTML = `
                    <div class="profile-empty">
                        <i data-lucide="user"></i>
                        <p>Your profile will build automatically as you chat. I'll learn about you, your goals, and the people in your life.</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            
            // Core Identity
            if (Object.keys(userProfile.core).length > 0) {
                html += '<div class="profile-section"><div class="profile-section-title">Core Identity</div>';
                for (const [key, value] of Object.entries(userProfile.core)) {
                    html += `
                        <div class="profile-item">
                            <div class="profile-item-label">${capitalizeFirst(key)}</div>
                            <div class="profile-item-value">${escapeHtml(value)}</div>
                        </div>
                    `;
                }
                html += '</div>';
            }
            
            // Current Context
            if (Object.keys(userProfile.context).length > 0) {
                html += '<div class="profile-section"><div class="profile-section-title">Current Context</div>';
                for (const [key, value] of Object.entries(userProfile.context)) {
                    html += `
                        <div class="profile-item">
                            <div class="profile-item-label">${capitalizeFirst(key)}</div>
                            <div class="profile-item-value">${escapeHtml(value)}</div>
                        </div>
                    `;
                }
                html += '</div>';
            }
            
            // People
            if (Object.keys(userProfile.people).length > 0) {
                html += '<div class="profile-section"><div class="profile-section-title">Key People</div>';
                for (const [name, info] of Object.entries(userProfile.people)) {
                    html += `
                        <div class="profile-item">
                            <div class="profile-item-label">${escapeHtml(name)}</div>
                            <div class="profile-item-value">${escapeHtml(info)}</div>
                        </div>
                    `;
                }
                html += '</div>';
            }
            
            // Goals
            if (userProfile.goals.length > 0) {
                html += '<div class="profile-section"><div class="profile-section-title">Goals</div>';
                userProfile.goals.forEach(goal => {
                    html += `
                        <div class="profile-item">
                            <div class="profile-item-value">${escapeHtml(goal.text)}</div>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            content.innerHTML = html;
        }

        function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // View management
        function setView(view) {
            const app = document.querySelector('.app');
            app.className = `app view-${view}`;
            
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            event.target.closest('.view-btn').classList.add('active');
        }

        // Handle empty input
        function handleEmptyInput() {
            const input = document.getElementById('emptyInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Start chat
            chatStarted = true;
            document.getElementById('emptyChat').classList.add('hidden');
            document.getElementById('activeChat').classList.remove('hidden');
            document.getElementById('bottomInput').classList.remove('hidden');
            
            input.value = '';
            sendMessageWithText(message);
        }

        // Auto-resize textarea
        function autoResize(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }

        // Handle keyboard
        function handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }

        // Send message from bottom input
        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            input.value = '';
            input.style.height = 'auto';
            sendMessageWithText(message);
        }

        // Send message logic
        async function sendMessageWithText(message) {
            addMessage('user', message);
            
            conversationHistory.push({
                role: 'user',
                content: message
            });
            
            showTyping();
            
            try {
                // NOTE: Chat feature temporarily disabled - needs serverless endpoint
                // To enable: create /api/chat endpoint similar to /api/parse
                throw new Error('Chat feature coming soon! Use Quick Capture for now.');

                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 1500,
                        system: `You are a calendar and personal assistant. You have access to the user's profile which contains information about them.

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

When the user describes an event, respond with a JSON object that may include BOTH an event AND profile updates:

{
  "action": "add_event",
  "event": {
    "title": "Event title",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "description": "Any additional details"
  },
  "profile_updates": {
    "core": { "name": "Rachel" },
    "context": { "current_project": "building startup" },
    "people": { "Ally": "best friend, works downtown" },
    "goals": [{ "text": "Break even by year 3", "addedAt": "${new Date().toISOString()}" }]
  },
  "message": "Confirmation message"
}

Current date: ${new Date().toISOString().split('T')[0]}

PROFILE EXTRACTION RULES:
- Extract personal info naturally from conversation (name, role, personality traits)
- Note relationships when mentioned ("my friend", "my therapist", "my co-founder")
- Capture goals when stated explicitly
- Identify current context (new job, injury, life phase)
- Add timestamps to temporal facts in context
- Only include profile_updates if you extract new information

If conversational or unclear, respond with:
{
  "action": "clarify",
  "message": "Your response"
}

Reference the profile naturally in responses when relevant. Respond with ONLY the JSON object.`,
                        messages: conversationHistory
                    })
                });
                
                removeTyping();
                
                if (!response.ok) throw new Error('API failed');
                
                const data = await response.json();
                const assistantMessage = data.content[0].text;
                
                conversationHistory.push({
                    role: 'assistant',
                    content: assistantMessage
                });
                
                try {
                    const cleaned = assistantMessage.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(cleaned);
                    
                    // Update profile if new information extracted
                    if (parsed.profile_updates) {
                        updateProfile(parsed.profile_updates);
                    }
                    
                    if (parsed.action === 'add_event' && parsed.event) {
                        events.push({
                            ...parsed.event,
                            id: Date.now()
                        });
                        await saveEvents();
                        renderCalendar();
                        addMessage('assistant', parsed.message || 'Added to your calendar!');
                    } else {
                        addMessage('assistant', parsed.message);
                    }
                } catch (e) {
                    addMessage('assistant', assistantMessage);
                }
                
            } catch (error) {
                removeTyping();
                addMessage('assistant', 'Sorry, something went wrong. Please try again.');
                console.error('Error:', error);
            }
        }

        // Add message
        function addMessage(sender, message) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            
            const label = sender === 'user' ? 'You' : 'Assistant';
            
            messageDiv.innerHTML = `
                <div class="message-label">${label}</div>
                <div class="message-content">${escapeHtml(message)}</div>
            `;
            
            chatMessages.appendChild(messageDiv);
            
            const container = document.querySelector('.chat-messages');
            container.scrollTop = container.scrollHeight;
            
            lucide.createIcons();
        }

        // Typing indicator
        function showTyping() {
            const chatMessages = document.getElementById('chatMessages');
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typingIndicator';
            typingDiv.className = 'message assistant';
            typingDiv.innerHTML = `
                <div class="message-label">Assistant</div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            
            const container = document.querySelector('.chat-messages');
            container.scrollTop = container.scrollHeight;
        }

        function removeTyping() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) indicator.remove();
        }

        // Calendar functions
        function changeMonth(delta) {
            currentDate.setMonth(currentDate.getMonth() + delta);
            renderCalendar();
        }

        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            // Update month/year display
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;
            
            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            
            // Build grid
            let html = '';
            
            // Day headers
            const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayHeaders.forEach(day => {
                html += `<div class="day-header">${day}</div>`;
            });
            
            // Previous month days
            for (let i = firstDay - 1; i >= 0; i--) {
                const day = daysInPrevMonth - i;
                html += `<div class="day-cell other-month"><div class="day-number">${day}</div></div>`;
            }
            
            // Current month days
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                const dayEvents = events.filter(e => e.date === dateStr);
                
                html += `<div class="day-cell ${isToday ? 'today' : ''}">
                    <div class="day-number">${day}</div>
                    <div class="day-events">`;
                
                dayEvents.forEach(event => {
                    const pendingClass = event.pending ? 'pending' : '';
                    const onclick = event.pending ? `onclick="openTriageModal(${event.id})"` : '';
                    html += `<div class="event-pill ${pendingClass}" ${onclick} title="${escapeHtml(event.title)} at ${formatTime(event.time)}">${escapeHtml(event.title)}</div>`;
                });
                
                html += `</div></div>`;
            }
            
            // Next month days
            const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
            const nextMonthDays = totalCells - (firstDay + daysInMonth);
            for (let day = 1; day <= nextMonthDays; day++) {
                html += `<div class="day-cell other-month"><div class="day-number">${day}</div></div>`;
            }
            
            document.getElementById('calendarGrid').innerHTML = html;
        }

        // Format time
        function formatTime(time) {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        }

        // Clear calendar
        async function clearCalendar() {
            if (confirm('Delete all events?')) {
                events = [];
                await saveEvents();
                renderCalendar();
            }
        }

        // Storage functions
        async function loadEvents() {
            try {
                const result = localStorage.getItem('calendar-events');
                if (result) {
                    events = JSON.parse(result);
                    renderCalendar();
                }
            } catch (error) {
                console.log('No existing events');
            }
        }

        async function saveEvents() {
            try {
                localStorage.setItem('calendar-events', JSON.stringify(events));
            } catch (error) {
                console.error('Failed to save:', error);
            }
        }

        // Utility
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Notes functions
        let notes = [];
        let activeNoteId = null;

        async function loadAllNotes() {
            try {
                const result = localStorage.getItem('all-notes');
                if (result) {
                    notes = JSON.parse(result);
                    renderNotesList();
                }
            } catch (error) {
                console.log('No existing notes');
            }
        }

        async function saveAllNotes() {
            try {
                localStorage.setItem('all-notes', JSON.stringify(notes));
            } catch (error) {
                console.error('Failed to save notes:', error);
            }
        }

        function createNewNote() {
            const now = new Date();
            const newNote = {
                id: Date.now(),
                content: '',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
            
            notes.unshift(newNote);
            saveAllNotes();
            openNote(newNote.id);
            renderNotesList();
            
            // Focus editor on mobile
            if (window.innerWidth <= 768) {
                document.querySelector('.app').classList.add('editing');
            }
        }

        function openNote(noteId) {
            activeNoteId = noteId;
            const note = notes.find(n => n.id === noteId);
            
            if (!note) return;
            
            const editor = document.getElementById('notesEditor');
            const timestamp = new Date(note.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            
            editor.innerHTML = `
                <div class="notes-toolbar">
                    <button class="toolbar-btn" onclick="formatText('bold')" title="Bold">
                        <i data-lucide="bold"></i>
                    </button>
                    <button class="toolbar-btn" onclick="formatText('italic')" title="Italic">
                        <i data-lucide="italic"></i>
                    </button>
                    <div class="toolbar-divider"></div>
                    <button class="toolbar-btn" onclick="formatText('insertUnorderedList')" title="Bullet List">
                        <i data-lucide="list"></i>
                    </button>
                    <button class="toolbar-btn" onclick="formatText('insertOrderedList')" title="Numbered List">
                        <i data-lucide="list-ordered"></i>
                    </button>
                </div>
                <div class="notes-editor-container">
                    <div class="notes-editor-inner">
                        <div class="notes-editor-timestamp">${timestamp}</div>
                        <div 
                            class="notes-editor-content" 
                            contenteditable="true"
                            oninput="updateNoteContent(${noteId}, this.innerHTML)"
                            onblur="updateNoteContent(${noteId}, this.innerHTML)"
                            placeholder="Start writing..."
                        >${note.content}</div>
                    </div>
                </div>
            `;
            
            lucide.createIcons();
            renderNotesList();
            
            // Focus editor
            setTimeout(() => {
                const contentEl = editor.querySelector('.notes-editor-content');
                if (contentEl) {
                    contentEl.focus();
                    // Move cursor to end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (contentEl.childNodes.length > 0) {
                        const lastNode = contentEl.childNodes[contentEl.childNodes.length - 1];
                        range.setStartAfter(lastNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            }, 0);
        }

        function updateNoteContent(noteId, content) {
            const note = notes.find(n => n.id === noteId);
            if (note) {
                note.content = content;
                note.updatedAt = new Date().toISOString();
                saveAllNotes();
                renderNotesList();
            }
        }

        function deleteNote(noteId, event) {
            event.stopPropagation();
            
            if (confirm('Delete this note?')) {
                notes = notes.filter(n => n.id !== noteId);
                
                if (activeNoteId === noteId) {
                    activeNoteId = null;
                    const editor = document.getElementById('notesEditor');
                    editor.innerHTML = `
                        <div class="notes-empty-state">
                            <i data-lucide="file-text"></i>
                            <p>Select a note or create a new one</p>
                        </div>
                    `;
                    lucide.createIcons();
                }
                
                saveAllNotes();
                renderNotesList();
            }
        }

        function renderNotesList() {
            const notesList = document.getElementById('notesList');
            
            if (notes.length === 0) {
                notesList.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
                        No notes yet
                    </div>
                `;
                return;
            }
            
            // Group notes by time
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            
            const grouped = {
                today: [],
                yesterday: [],
                week: [],
                older: []
            };
            
            notes.forEach(note => {
                const noteDate = new Date(note.updatedAt);
                const noteDateOnly = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());
                
                if (noteDateOnly.getTime() === today.getTime()) {
                    grouped.today.push(note);
                } else if (noteDateOnly.getTime() === yesterday.getTime()) {
                    grouped.yesterday.push(note);
                } else if (noteDate >= weekAgo) {
                    grouped.week.push(note);
                } else {
                    grouped.older.push(note);
                }
            });
            
            let html = '';
            
            if (grouped.today.length > 0) {
                html += '<div class="notes-group"><div class="notes-group-title">Today</div>';
                grouped.today.forEach(note => {
                    html += renderNoteItem(note);
                });
                html += '</div>';
            }
            
            if (grouped.yesterday.length > 0) {
                html += '<div class="notes-group"><div class="notes-group-title">Yesterday</div>';
                grouped.yesterday.forEach(note => {
                    html += renderNoteItem(note);
                });
                html += '</div>';
            }
            
            if (grouped.week.length > 0) {
                html += '<div class="notes-group"><div class="notes-group-title">Previous 7 Days</div>';
                grouped.week.forEach(note => {
                    html += renderNoteItem(note);
                });
                html += '</div>';
            }
            
            if (grouped.older.length > 0) {
                html += '<div class="notes-group"><div class="notes-group-title">Older</div>';
                grouped.older.forEach(note => {
                    html += renderNoteItem(note);
                });
                html += '</div>';
            }
            
            notesList.innerHTML = html;
            lucide.createIcons();
        }

        function formatText(command) {
            document.execCommand(command, false, null);
        }

        function renderNoteItem(note) {
            // Strip HTML for title and preview
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';
            
            const title = plainText.split('\n')[0] || 'New Note';
            const preview = plainText.split('\n').slice(1).join(' ').substring(0, 50) || 'No additional text';
            const date = new Date(note.updatedAt);
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            return `
                <div class="note-item ${activeNoteId === note.id ? 'active' : ''}" onclick="openNote(${note.id})">
                    <div class="note-item-header">
                        <div class="note-item-title">${escapeHtml(title)}</div>
                        <button class="note-item-delete" onclick="deleteNote(${note.id}, event)">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="note-item-time">${timeStr}</div>
                    <div class="note-item-preview">${escapeHtml(preview)}</div>
                </div>
            `;
        }

        // Load notes on init
        loadAllNotes();

        // Quick Capture functions
        let quickCaptureDemo = true; // Demo mode flag
        
        function openQuickCapture() {
            const modal = document.getElementById('quickCaptureModal');
            const input = document.getElementById('quickCaptureInput');
            
            modal.classList.add('open');
            
            // Pre-fill with example text for demo
            if (quickCaptureDemo) {
                input.value = "Call mom tomorrow at 6pm about birthday plans\n\nPick up groceries - milk, eggs, bread\n\nRemind me to follow up with Marcus about Q1 roadmap by Friday";
            }
            
            setTimeout(() => {
                input.focus();
                // Move cursor to end
                input.setSelectionRange(input.value.length, input.value.length);
            }, 100);
            
            lucide.createIcons();
        }

        function closeQuickCapture() {
            const modal = document.getElementById('quickCaptureModal');
            modal.classList.remove('open');
            
            // Clear input
            document.getElementById('quickCaptureInput').value = '';
        }

        async function submitQuickCapture() {
            const input = document.getElementById('quickCaptureInput');
            const text = input.value.trim();

            if (!text) return;

            // Log action in dev panel
            if (devPanel) {
                devPanel.logAction(`User submitted: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            }

            try {
                let response;

                // === DEMO MODE: Use Mock AI ===
                if (window.DEMO_MODE && mockAI) {
                    // Add artificial delay for realism
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // Get mock response
                    response = mockAI.parseQuickCapture(text);

                    console.log('[Demo Mode] Mock AI response:', response);
                }
                // === PRODUCTION MODE: Use Real API ===
                else {
                    const apiResponse = await fetch('/api/parse', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ text })
                    });

                    if (!apiResponse.ok) {
                        throw new Error(`API error: ${apiResponse.status}`);
                    }

                    response = await apiResponse.json();
                    console.log('[Production Mode] Real AI response:', response);
                }

                // Update dev panel with response
                if (devPanel) {
                    devPanel.updateResponseInspector(response);
                }

                // Process the response
                await processQuickCaptureResponse(text, response);

            } catch (error) {
                console.error('[Quick Capture] Error:', error);

                if (devPanel) {
                    devPanel.logAction(`Error: ${error.message}`);
                }

                showToast('Error', 'Failed to process capture. Please try again.');
            }
        }

        /**
         * Process AI response from quick capture
         */
        async function processQuickCaptureResponse(originalText, response) {
            let addedEvents = 0;
            let addedTasks = 0;
            let addedNotes = 0;

            // Handle different actions
            switch (response.action) {
                case 'create_event':
                    // Add events to calendar
                    if (response.events && response.events.length > 0) {
                        response.events.forEach((eventData, index) => {
                            events.push({
                                id: Date.now() + index,
                                title: eventData.title,
                                date: eventData.date,
                                time: eventData.time,
                                endTime: eventData.endTime,
                                location: eventData.location,
                                description: eventData.userMessage || '',
                                pending: eventData.confidence !== 'high', // Only high confidence auto-confirms
                                originalText: eventData.originalText || originalText,
                                confidence: eventData.confidence
                            });
                            addedEvents++;
                        });

                        await saveEvents();
                        renderCalendar();
                    }
                    break;

                case 'ask_question':
                    // Show triage modal for more info
                    if (response.events && response.events.length > 0) {
                        const tempEvent = {
                            id: Date.now(),
                            title: response.events[0].title,
                            date: response.events[0].date || getTodayDate(),
                            time: response.events[0].time || '09:00',
                            originalText: originalText,
                            pending: true
                        };
                        events.push(tempEvent);
                        await saveEvents();
                        renderCalendar();

                        // Open triage after a moment
                        setTimeout(() => openTriageModal(tempEvent.id), 500);
                    }
                    break;

                case 'create_task':
                    // For now, just count tasks
                    // TODO: Implement actual task creation
                    addedTasks = response.events ? response.events.length : 1;
                    break;

                case 'create_note':
                    // Create a note
                    // TODO: Implement note creation from quick capture
                    addedNotes = 1;
                    break;

                case 'create_checklist':
                    // TODO: Implement checklist creation
                    break;

                case 'show_alternatives':
                    // TODO: Show alternatives UI
                    break;
            }

            // Save capture to storage
            try {
                let captures = [];
                try {
                    const result = localStorage.getItem('quick-captures');
                    if (result) {
                        captures = JSON.parse(result);
                    }
                } catch (e) {}

                captures.push({
                    id: Date.now(),
                    text: originalText,
                    capturedAt: new Date().toISOString(),
                    action: response.action,
                    confidence: response.confidence,
                    processed: true
                });

                localStorage.setItem('quick-captures', JSON.stringify(captures));
            } catch (error) {
                console.error('Failed to save capture:', error);
            }

            // Show appropriate toast
            let toastTitle = "✓ Captured";
            let toastMsg = response.userMessage || "";

            if (!toastMsg) {
                if (addedEvents > 0 && addedTasks > 0) {
                    toastTitle = "✓ Processed";
                    toastMsg = `${addedEvents} event${addedEvents > 1 ? 's' : ''} added, ${addedTasks} task${addedTasks > 1 ? 's' : ''} created`;
                } else if (addedEvents > 0) {
                    toastTitle = response.confidence === 'high' ? "✓ Event confirmed" : "✓ Event penciled in";
                    toastMsg = addedEvents === 1
                        ? `${response.events[0].title} added to calendar`
                        : `${addedEvents} events added to calendar`;
                } else if (addedTasks > 0) {
                    toastTitle = "✓ Tasks created";
                    toastMsg = `${addedTasks} task${addedTasks > 1 ? 's' : ''} added`;
                } else if (addedNotes > 0) {
                    toastTitle = "✓ Note saved";
                    toastMsg = "Note added to your notes";
                } else {
                    toastMsg = "Saved for processing";
                }
            }

            showToast(toastTitle, toastMsg);
            closeQuickCapture();
        }

        /**
         * Helper: Get today's date in YYYY-MM-DD format
         */
        function getTodayDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        }

        function parseEventFromText(text) {
            // Simple parser - in production this would use AI
            const today = new Date();
            let date = null;
            let time = '09:00'; // Default time
            let title = text;
            
            // Extract time
            const timeMatch = text.match(/(\d{1,2})(:\d{2})?\s*(am|pm|AM|PM)/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const minutes = timeMatch[2] ? timeMatch[2].substring(1) : '00';
                const meridiem = timeMatch[3].toLowerCase();
                
                if (meridiem === 'pm' && hour !== 12) hour += 12;
                if (meridiem === 'am' && hour === 12) hour = 0;
                
                time = `${String(hour).padStart(2, '0')}:${minutes}`;
                title = text.replace(timeMatch[0], '').trim();
            }
            
            // Extract date
            const lowerText = text.toLowerCase();
            if (lowerText.includes('tomorrow')) {
                date = new Date(today);
                date.setDate(date.getDate() + 1);
                title = title.replace(/tomorrow/i, '').trim();
            } else if (lowerText.includes('today')) {
                date = new Date(today);
                title = title.replace(/today/i, '').trim();
            } else if (lowerText.includes('next week')) {
                date = new Date(today);
                date.setDate(date.getDate() + 7);
                title = title.replace(/next week/i, '').trim();
            } else {
                // Check for day of week
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const dayMatch = days.find(day => lowerText.includes(day));
                if (dayMatch) {
                    const targetDay = days.indexOf(dayMatch);
                    const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert to Monday = 0
                    let daysToAdd = targetDay - currentDay;
                    if (daysToAdd <= 0) daysToAdd += 7; // Next week if already passed
                    
                    date = new Date(today);
                    date.setDate(date.getDate() + daysToAdd);
                    title = title.replace(new RegExp(dayMatch, 'i'), '').trim();
                }
            }
            
            if (!date) return null;
            
            // Clean up title
            title = title.replace(/^(at|on|for)\s+/i, '').trim();
            
            return {
                title: title || 'Untitled Event',
                date: date.toISOString().split('T')[0],
                time: time
            };
        }

        function captureWithVoice() {
            const input = document.getElementById('quickCaptureInput');
            
            // Demo: Simulate voice input
            input.value = "Schedule dentist appointment next Tuesday at 10am and remind me to bring my insurance card";
            
            // Auto-submit after a moment
            setTimeout(() => {
                submitQuickCapture();
            }, 800);
        }

        function showToast(title, text) {
            const toast = document.getElementById('toast');
            const toastTitle = document.querySelector('.toast-title');
            const message = document.getElementById('toastMessage');
            
            toastTitle.textContent = title;
            message.textContent = text;
            
            toast.classList.add('show');
            lucide.createIcons();
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                hideToast();
            }, 5000);
        }

        function hideToast() {
            const toast = document.getElementById('toast');
            toast.classList.remove('show');
        }

        function viewInbox() {
            hideToast();
            // TODO: Navigate to Inbox view when implemented
            alert('Inbox view coming soon!');
        }

        // Triage Modal Functions
        let currentTriageEvent = null;
        let triageStep = 0;
        
        function openTriageModal(eventId) {
            const event = events.find(e => e.id === eventId);
            if (!event) return;
            
            currentTriageEvent = event;
            triageStep = 0;
            
            renderTriageStep();
            
            const modal = document.getElementById('triageModal');
            modal.classList.add('open');
            
            lucide.createIcons();
        }

        function closeTriageModal() {
            const modal = document.getElementById('triageModal');
            modal.classList.remove('open');
            currentTriageEvent = null;
            triageStep = 0;
        }

        function renderTriageStep() {
            if (!currentTriageEvent) return;
            
            const body = document.getElementById('triageBody');
            const profile = userProfile; // Access user profile for smart suggestions
            
            if (triageStep === 0) {
                // Show extracted details
                body.innerHTML = `
                    <div class="triage-section">
                        <div class="triage-label">What I captured</div>
                        <div class="triage-value">"${escapeHtml(currentTriageEvent.originalText || currentTriageEvent.title)}"</div>
                    </div>
                    
                    <div class="triage-section">
                        <div class="triage-label">Event</div>
                        <div class="triage-value">${escapeHtml(currentTriageEvent.title)}</div>
                    </div>
                    
                    <div class="triage-section">
                        <div class="triage-label">When</div>
                        <div class="triage-value">${formatEventDate(currentTriageEvent.date)} at ${formatTime(currentTriageEvent.time)}</div>
                    </div>
                    
                    <div class="triage-section">
                        <div class="triage-label">Where will this be?</div>
                        <input type="text" class="triage-input" id="triageLocation" placeholder="Add location...">
                        <div class="triage-suggestions">
                            <div class="suggestion-chip" onclick="selectSuggestion('triageLocation', 'Office')">Office</div>
                            <div class="suggestion-chip" onclick="selectSuggestion('triageLocation', 'Home')">Home</div>
                            <div class="suggestion-chip" onclick="selectSuggestion('triageLocation', 'Virtual')">Virtual</div>
                        </div>
                    </div>
                `;
            } else if (triageStep === 1) {
                // Ask about duration
                body.innerHTML = `
                    <div class="triage-section">
                        <div class="triage-label">How long should I block for this?</div>
                        <input type="text" class="triage-input" id="triageDuration" placeholder="e.g., 1 hour, 30 minutes...">
                        <div class="triage-suggestions">
                            <div class="suggestion-chip" onclick="selectSuggestion('triageDuration', '30 minutes')">30 min</div>
                            <div class="suggestion-chip" onclick="selectSuggestion('triageDuration', '1 hour')">1 hour</div>
                            <div class="suggestion-chip" onclick="selectSuggestion('triageDuration', '2 hours')">2 hours</div>
                        </div>
                    </div>
                `;
            } else if (triageStep === 2) {
                // Ask about travel/prep time
                body.innerHTML = `
                    <div class="triage-section">
                        <div class="triage-label">Need time to get there or prep?</div>
                        <div class="triage-value" style="font-size: 13px; color: var(--text-secondary); background: transparent; padding: 0; margin-bottom: 12px;">
                            I notice you usually take the bus. Should I add buffer time?
                        </div>
                        <input type="text" class="triage-input" id="triageBuffer" placeholder="e.g., 30 min before, 15 min prep...">
                        <div class="triage-suggestions">
                            <div class="suggestion-chip" onclick="selectSuggestion('triageBuffer', '15 min before')">15 min before</div>
                            <div class="suggestion-chip" onclick="selectSuggestion('triageBuffer', '30 min before')">30 min before</div>
                            <div class="suggestion-chip" onclick="selectSuggestion('triageBuffer', 'No buffer needed')">No buffer</div>
                        </div>
                    </div>
                `;
            } else if (triageStep === 3) {
                // Ask about reminders
                body.innerHTML = `
                    <div class="triage-section">
                        <div class="triage-label">Any reminders or prep needed?</div>
                        <input type="text" class="triage-input" id="triageReminder" placeholder="What should I remind you about?">
                        <div class="triage-suggestions">
                            <div class="suggestion-chip" onclick="nextTriageStep()">Skip</div>
                        </div>
                    </div>
                `;
            }
            
            lucide.createIcons();
        }

        function selectSuggestion(inputId, value) {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = value;
            }
            setTimeout(nextTriageStep, 200);
        }

        function nextTriageStep() {
            triageStep++;
            if (triageStep <= 3) {
                renderTriageStep();
            } else {
                confirmEvent();
            }
        }

        async function confirmEvent() {
            if (!currentTriageEvent) return;
            
            // Gather all the details from triage
            const location = document.getElementById('triageLocation')?.value || '';
            const duration = document.getElementById('triageDuration')?.value || '';
            const buffer = document.getElementById('triageBuffer')?.value || '';
            const reminder = document.getElementById('triageReminder')?.value || '';
            
            // Update event
            const event = events.find(e => e.id === currentTriageEvent.id);
            if (event) {
                event.pending = false;
                event.location = location;
                event.duration = duration;
                event.buffer = buffer;
                event.reminder = reminder;
                
                // Build description
                let desc = [];
                if (location) desc.push(`📍 ${location}`);
                if (duration) desc.push(`⏱️ ${duration}`);
                if (buffer) desc.push(`🚌 ${buffer}`);
                if (reminder) desc.push(`📌 ${reminder}`);
                
                event.description = desc.join(' • ');
            }
            
            await saveEvents();
            renderCalendar();
            closeTriageModal();
            
            showToast('✓ Event confirmed', `${event.title} is now on your calendar`);
        }

        function formatEventDate(dateStr) {
            const date = new Date(dateStr + 'T00:00:00');
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
            
            if (dateOnly.getTime() === todayOnly.getTime()) {
                return 'Today';
            } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
                return 'Tomorrow';
            } else {
                return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            }
        }
