# Product Requirements Document: Sprekta Calendar

## Executive Summary

**Product Name:** Sprekta  
**Version:** 1.0 MVP  
**Date:** January 2026  
**Owner:** Rachel Ramkhelawan  

Sprekta is a touchless calendaring system that enables busy professionals to capture thoughts, tasks, and events naturally through conversational AI, then intelligently organizes and confirms them through progressive disclosure. The system learns user patterns and context to provide smart suggestions, minimizing the cognitive load of calendar management while maximizing presence and goal achievement.

---

## Problem Statement

Busy professionals juggling multiple responsibilities (day job, side projects, personal commitments) struggle with:
- **Cognitive overhead** of proper calendar management during busy moments
- **Context switching** between capturing ideas and structuring them
- **Lost information** when thoughts come at inconvenient times
- **Decision fatigue** from repetitive scheduling questions
- **Friction** in traditional calendar interfaces that demand immediate structure

Current solutions (Google Calendar, Notion, etc.) require users to have complete information upfront and use complex interfaces. This creates barriers to capture and forces users to either lose information or interrupt their flow.

---

## Solution Overview

Sprekta introduces a **capture-first, process-later** workflow with intelligent background processing:

1. **Quick Capture:** Users jot down anything (voice or text) without structure
2. **AI Processing:** System extracts events, tasks, and reminders in background
3. **Staging:** Calendar-ready items are "penciled in" with pending status
4. **Progressive Triage:** User confirms and enriches details through guided, pattern-aware questions
5. **Continuous Learning:** System learns user patterns to provide better suggestions over time

---

## Core User Flows

### Flow 1: Quick Capture
**Goal:** Enable frictionless thought capture

**Steps:**
1. User clicks "Jot it down" button (always visible, bottom-right)
2. Modal opens with text input and voice option
3. User dumps thoughts naturally: "Call mom tomorrow at 6pm about birthday plans. Pick up groceries - milk, eggs, bread. Remind me to follow up with Marcus about Q1 roadmap by Friday"
4. User clicks "Capture"
5. System processes in background
6. Toast notification confirms: "✓ Event penciled in - 1 event added to calendar (needs confirmation)"

**Success Criteria:**
- Capture completion time < 10 seconds
- Zero required fields
- No interruptions to user flow

### Flow 2: Background Processing
**Goal:** Intelligently parse and categorize captured content

**Steps:**
1. AI analyzes captured text
2. Extracts temporal markers (tomorrow, Friday, 6pm, etc.)
3. Identifies entities (people, places, activities)
4. Categorizes: Event vs Task vs Reminder
5. For events: extracts title, date, time (minimum viable data)
6. Adds events to calendar with `pending: true` status
7. Stores tasks for future task view
8. Sets reminders in system

**Success Criteria:**
- 90%+ accuracy on date/time extraction
- Handles natural language variations
- Non-blocking (doesn't slow down capture)

### Flow 3: Staged Events (Penciling In)
**Goal:** Show captured events immediately while signaling they need confirmation

**Steps:**
1. Pending events appear on calendar with grey dotted border
2. Visual distinction from confirmed events (solid border, color fill)
3. Events are clickable
4. Badge shows "X events need attention" (future enhancement)

**Success Criteria:**
- Clear visual distinction between pending/confirmed
- No confusion about event status
- Clickable affordance is discoverable

### Flow 4: Progressive Triage
**Goal:** Efficiently gather additional context through smart questions

**Steps:**
1. User clicks pending event on calendar
2. Triage modal opens showing extracted details
3. **Step 1:** "Where will this be?" 
   - Shows suggestions based on patterns: "Office", "Home", "Virtual"
   - User selects or types custom location
4. **Step 2:** "How long should I block for this?"
   - Suggests durations based on event type and history
5. **Step 3:** "Need time to get there or prep?"
   - AI references profile: "I notice you usually take the bus. Should I add buffer time?"
   - Suggests: "15 min before", "30 min before", "No buffer"
6. **Step 4:** "Any reminders or prep needed?"
   - Optional field, can skip
7. User clicks "Confirm Event"
8. Event becomes solid on calendar with all details

**Success Criteria:**
- Average triage time < 60 seconds per event
- Questions feel relevant and smart (pattern-based)
- User can skip any question
- One-click suggestions for common answers

### Flow 5: Profile Building
**Goal:** System learns about user to provide better suggestions

**Steps:**
1. System observes patterns from conversations and events
2. Extracts profile data:
   - **Core Identity:** Name, role, location, personality, work style
   - **Current Context:** Active projects, life phase, challenges, transportation
   - **Key People:** Relationships and context about frequent contacts
   - **Goals:** Professional, personal, financial objectives
   - **Preferences:** Communication style, meeting times, work hours
   - **Constraints:** Recurring commitments, blackout times, travel patterns
   - **Locations:** Frequent places, commute routes
   - **Habits:** Daily routines, self-care practices
   - **Tools:** Software used, workflows
3. Updates profile automatically after each interaction
4. Uses profile to inform triage questions and suggestions
5. User can view profile via hamburger menu (read-only in MVP)

**Success Criteria:**
- Profile populates within 5-10 interactions
- Suggestions improve over time (measurable by user acceptance rate)
- Profile sections feel relevant and accurate

---

## Feature Requirements

### Must Have (MVP)

#### 1. Quick Capture System
- **Floating action button** bottom-right, always visible
- Text input with multi-line support
- Voice input button (Web Speech API)
- "Capture" confirmation button
- Toast notification on successful capture (bottom-left)
- Saves to persistent storage

#### 2. AI Event Parsing
- Extract date from natural language (today, tomorrow, Monday, next week, etc.)
- Extract time (9am, 2:30pm, 14:00, etc.)
- Extract title (everything else after date/time removed)
- Handle multiple events in single capture
- Create pending events with minimum viable data (title, date, time)

#### 3. Calendar View
- Month grid showing current month
- Previous/next month navigation
- Events displayed on correct dates
- Visual distinction: Pending (grey dotted border) vs Confirmed (solid orange)
- Clickable pending events
- Today's date highlighted
- Event pills show title (truncated if needed)

#### 4. Triage Modal
- Opens when clicking pending event
- Shows captured text and extracted details
- Progressive disclosure (one question at a time)
- Four steps: Location → Duration → Buffer Time → Reminders
- Smart suggestions based on patterns
- One-click suggestion chips
- "Confirm Event" finalizes and closes
- "Cancel" discards changes

#### 5. Profile System
- Automatic extraction from conversations
- Storage in persistent window.storage
- Eight sections: Core Identity, Current Context, Key People, Goals, Preferences, Constraints, Locations, Habits, Tools
- View-only hamburger menu access
- Pre-populated with sample data for demo

#### 6. Notes System
- Apple Notes-style interface
- Sidebar with note list grouped by time (Today, Yesterday, etc.)
- Rich text editor (bold, italic, bullets, numbered lists)
- Auto-save on edit
- New note creation
- Delete notes
- Search/filter (future)

#### 7. Multi-View Interface
- Four main views: Chat | Both | Calendar | Notes
- Toggle buttons in header
- Chat: Conversational AI for calendar creation
- Both: Split view (40% chat, 60% calendar)
- Calendar: Full calendar with triage
- Notes: Note-taking interface
- Responsive: Mobile forces single-view mode

#### 8. Persistent Storage
- All events saved to window.storage
- All notes saved to window.storage
- Profile saved to window.storage
- Quick captures saved to window.storage
- Data persists across sessions

### Should Have (Post-MVP)

#### 9. Task Management
- Dedicated Tasks view/tab
- Checkbox-style todo list
- Due dates and priorities
- Categories/tags
- Integration with quick capture

#### 10. Inbox View
- Unified view of items needing attention
- Pending events
- Unprocessed captures
- Tasks without due dates
- Batch triage actions

#### 11. Smart Scheduling
- Conflict detection
- Optimal time suggestions
- Automatic rescheduling based on priorities
- Travel time auto-calculation
- Buffer time enforcement

#### 12. Reminders & Notifications
- Event reminders (15 min, 1 hour before, etc.)
- Task due date reminders
- Follow-up reminders (from quick capture)
- Browser notifications (with permission)

#### 13. Profile Editing
- Manual profile updates
- Confidence scores visible
- Delete/archive old context
- Export profile data

### Nice to Have (Future)

#### 14. Calendar Integrations
- Google Calendar sync
- Apple Calendar sync
- Outlook integration
- Two-way sync

#### 15. Collaboration
- Shared calendars
- Meeting scheduling with others
- Availability sharing
- Event invites

#### 16. Advanced AI
- Multi-turn conversation in chat
- Proactive suggestions ("You have 30 min free, want to...?")
- Goal tracking and progress
- Conflict resolution ("This conflicts with X, should I...?")

#### 17. Analytics & Insights
- Time tracking by category
- Goal progress visualization
- Pattern insights ("You tend to schedule lunch at 1pm")
- Productivity metrics

---

## User Experience Requirements

### Design Principles
1. **Capture-first:** Never interrupt user flow with required fields
2. **Progressive disclosure:** Ask questions only when needed, one at a time
3. **Pattern-aware:** Use historical data to reduce decision fatigue
4. **Trustworthy:** Visual clarity on pending vs confirmed states
5. **Minimal:** Clean, spacious interface inspired by Claude.ai

### Visual Design
- **Typography:** Inter font family, 13-15px body text, tight line-height (1.4-1.5)
- **Colors:** Off-white background (#f5f5f4), dark text (#292524), orange accent (#ea580c)
- **Spacing:** Notepad-style tight spacing, not Notion-style wide margins
- **Components:** Subtle borders, soft shadows, rounded corners (8-12px)
- **Animations:** Smooth 200-300ms transitions, slide-in toasts, modal animations

### Interaction Patterns
- **Quick actions:** One-click suggestions wherever possible
- **Keyboard shortcuts:** Enter to submit, Esc to cancel (future: global hotkeys)
- **Mobile-first:** Touch-friendly targets, thumb-zone optimization
- **Feedback:** Immediate visual feedback (toasts, state changes)

---

## Technical Requirements

### Performance
- Initial load: < 2 seconds
- Capture completion: < 200ms
- Calendar render: < 500ms
- Triage modal open: < 300ms
- Storage operations: Non-blocking

### Browser Support
- Chrome 90+ (primary)
- Safari 14+ (secondary)
- Firefox 88+ (secondary)
- Edge 90+ (secondary)

### Data & Privacy
- All data stored locally (window.storage)
- No external database in MVP
- Anthropic API for AI processing (chat feature)
- User owns all data
- Easy export/import (future)

### Accessibility
- Keyboard navigation for all actions
- ARIA labels on interactive elements
- Screen reader compatible
- High contrast mode support
- Focus indicators

---

## Success Metrics

### Primary Metrics
1. **Capture rate:** % of users who use quick capture weekly
2. **Triage completion rate:** % of pending events that get confirmed
3. **Time to triage:** Average seconds from pending to confirmed
4. **Retention:** % of users active after 7 days, 30 days

### Secondary Metrics
1. **Events created:** Average events per user per week
2. **Profile richness:** Average number of populated profile fields
3. **Suggestion acceptance:** % of suggested values accepted vs manual entry
4. **Multi-view usage:** Distribution of time across Chat/Calendar/Notes views

### Quality Metrics
1. **Parse accuracy:** % of dates/times extracted correctly
2. **User corrections:** % of extracted data that gets manually corrected
3. **Error rate:** Failed captures, storage errors, crashes
4. **Satisfaction:** User rating (post-MVP survey)

---

## Constraints & Assumptions

### Technical Constraints
- Single-page application (no server-side rendering)
- Client-side storage only (no backend database)
- Anthropic API dependency for chat AI
- Browser storage limits (~5MB per origin)

### Business Constraints
- Solo founder (Rachel) building initially
- Limited budget for API costs
- MVP timeline: Q1 2026
- Target: 100 beta users initially

### Assumptions
- Users have stable internet connection
- Users grant microphone permission for voice capture
- Users are comfortable with AI processing their data
- Primary use case is knowledge workers with busy schedules

---

## Risks & Mitigations

### Risk 1: AI Parsing Accuracy
**Impact:** High - Core value proposition  
**Likelihood:** Medium  
**Mitigation:** 
- Start with rule-based parsing for common patterns
- Use AI as enhancement, not dependency
- Allow manual correction easily
- Improve over time with user feedback

### Risk 2: User Adoption of Triage
**Impact:** High - Events stay pending if not triaged  
**Likelihood:** Medium  
**Mitigation:**
- Make triage quick and delightful (< 60 sec)
- Allow batch operations (future)
- Send gentle reminders
- Show value ("5 pending events" badge)

### Risk 3: Storage Limits
**Impact:** Medium - Users lose data if limit exceeded  
**Likelihood:** Low for MVP  
**Mitigation:**
- Monitor storage usage
- Warn user at 80% capacity
- Implement archiving/export
- Consider cloud backup (post-MVP)

### Risk 4: Profile Privacy Concerns
**Impact:** Medium - Users may not trust AI learning about them  
**Likelihood:** Low  
**Mitigation:**
- Be transparent about what's stored
- Keep data local-only
- Allow profile viewing
- Add deletion options (post-MVP)

---

## Launch Plan

### Phase 1: Internal Testing (Week 1-2)
- Rachel dogfoods daily
- Iterate on UX friction points
- Fix critical bugs
- Validate core flows

### Phase 2: Friends & Family (Week 3-4)
- 10-15 close contacts
- Weekly feedback sessions
- Focus on capture → triage flow
- Measure completion rates

### Phase 3: Private Beta (Month 2)
- 50-100 users
- Application-based access
- Active community engagement
- Feature requests prioritized

### Phase 4: Public Beta (Month 3+)
- Open waitlist
- Gradual rollout
- Community building
- Press outreach

---

## Open Questions

1. Should we allow editing pending events before triage, or force triage flow?
2. What happens if user never confirms a pending event? Auto-confirm after X days?
3. Should Tasks be a separate tab or integrated into Calendar as all-day events?
4. How do we handle recurring events in quick capture?
5. Should voice capture auto-submit or require confirmation?
6. What's the onboarding experience for first-time users?
7. Should we show a "pending events" count badge on Calendar tab?
8. How do we handle timezone changes/travel?

---

## Appendix

### User Personas

**Primary: "Busy Dual-Track Professional"**
- Example: Rachel (Product Manager + Startup Founder)
- Needs: Quick capture during meetings, context switching, time optimization
- Pain points: Too many small tasks, calendar friction, decision fatigue
- Success: Can jot without interrupting flow, AI handles categorization

**Secondary: "On-the-Go Professional"**
- Example: Sales exec, consultant, busy parent
- Needs: Voice capture, mobile-first, location-aware
- Pain points: Can't type while driving, forget thoughts, location context lost
- Success: Voice capture during commute, automatic travel time

### Competitive Analysis

| Feature | Sprekta | Google Calendar | Notion | Todoist |
|---------|---------|----------------|--------|---------|
| Quick Capture | ✅ (Core) | ❌ | ❌ | ⚠️ (Text only) |
| Voice Input | ✅ | ❌ | ❌ | ⚠️ (Premium) |
| AI Processing | ✅ | ❌ | ⚠️ (AI blocks) | ❌ |
| Progressive Triage | ✅ (Unique) | ❌ | ❌ | ❌ |
| Pattern Learning | ✅ | ❌ | ❌ | ❌ |
| Calendar View | ✅ | ✅ | ❌ | ⚠️ (Limited) |
| Notes Integration | ✅ | ❌ | ✅ | ❌ |
| Local-First | ✅ | ❌ | ❌ | ❌ |

**Key Differentiators:**
1. Capture-first workflow (not form-first)
2. Progressive disclosure triage (not all-at-once)
3. Pattern learning from profile (not static)
4. Unified capture for events/tasks/notes (not siloed)

---

## Version History

- **v1.0** (January 2026): Initial PRD for MVP
- **v1.1** (TBD): Post-beta updates based on user feedback

---

**Document Owner:** Rachel Ramkhelawan  
**Last Updated:** January 8, 2026  
**Status:** Draft - Ready for Development
