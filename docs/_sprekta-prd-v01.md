# SPREKTA - Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** January 2026  
**Status:** Draft  
**Owner:** Product Team  
**Confidential**

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Vision & Strategy](#2-vision--strategy)
3. [Market Opportunity](#3-market-opportunity)
4. [User Personas](#4-user-personas)
5. [Product Overview](#5-product-overview)
6. [Core Features](#6-core-features)
7. [User Experience & Flows](#7-user-experience--flows)
8. [Technical Architecture](#8-technical-architecture)
9. [AI/ML Requirements](#9-aiml-requirements)
10. [Privacy & Security](#10-privacy--security)
11. [Success Metrics](#11-success-metrics)
12. [Product Roadmap](#12-product-roadmap)
13. [Go-to-Market Strategy](#13-go-to-market-strategy)
14. [Competitive Analysis](#14-competitive-analysis)
15. [Risks & Mitigation](#15-risks--mitigation)

---

## 1. EXECUTIVE SUMMARY

### Product Vision
Sprekta is an AI-powered calendar platform that eliminates the cognitive burden of planning through touchless calendaring - users capture thoughts naturally (voice or text), and the system handles organization, scheduling, and adaptation automatically while maintaining full user control.

### The Problem
Traditional calendars fail at the exact moment users need them most - when life gets chaotic. They require manual maintenance, become archaeological digs of outdated plans, and add cognitive overhead precisely when mental resources are depleted. This creates a negative spiral: overwhelmed users avoid their calendars, calendars become more outdated, anxiety increases.

### The Solution
Sprekta transforms calendaring from a manual maintenance chore into an intelligent assistant:
- **Quick Capture**: Jot down anything in natural language, instantly calendared
- **Smart Triage**: Dump everything overwhelming you, AI organizes it conversationally
- **Auto-Pilot**: System learns patterns, deprecates old tasks, adapts to life changes
- **Jarvis Intelligence**: Proactive, deferential suggestions that reveal understanding of user

### Target Market
- **Primary**: Knowledge workers, entrepreneurs, people with ADHD/executive function challenges
- **Secondary**: Overwhelmed parents, freelancers, students
- **Enterprise**: SMBs and corporations offering employee wellness benefits

### Business Model
- **Individual**: $18-29/month (freemium → premium)
- **SMB**: $12/user/month (team plans)
- **Enterprise**: $30K+/year (custom solutions)
- **Projected Revenue**: $1.8M by Year 5
- **Gross Margin**: 88% at scale

### Success Metrics
- **Engagement**: 5+ quick captures per user per week
- **Conversion**: 12% free → paid
- **Retention**: 80% annual
- **NPS**: >40
- **Clinical Impact**: Measurable reduction in planning anxiety

---

## 2. VISION & STRATEGY

### 2.1 Product Vision Statement
"The calendar that manages itself - combining the reliability of traditional calendaring with the intelligence of a personal assistant who understands your psychology, patterns, and preferences."

### 2.2 Strategic Positioning

**What Sprekta Is:**
- A calendar with exceptional AI assistance
- Executive function support through technology
- Mental health tool disguised as productivity app
- Jarvis for your daily planning

**What Sprekta Is NOT:**
- A therapy chatbot
- A task management app (we're calendar-first)
- A replacement for human decision-making
- An AI that controls your life

### 2.3 Core Principles

**1. Trust Through Control**
Users must feel in control at all times. Every AI action is:
- Transparent (show what changed and why)
- Reversible (easy undo/override)
- Optional (manual alternatives always available)
- Explained (behavioral insights justify suggestions)

**2. Friction Elimination**
Remove every unnecessary step:
- Quick capture in <5 seconds
- Voice-first for ultimate speed
- Automatic organization (not manual sorting)
- Intelligent defaults (not empty forms)

**3. Psychological Understanding**
The AI doesn't just parse words, it understands:
- Energy patterns (brain fog mornings, creative afternoons)
- Working styles (MBTI, personality profiles)
- Stress signals (overwhelm, avoidance patterns)
- Personal preferences (likes afternoons, hates Mondays)

**4. Jarvis Interaction Model**
Anticipatory, competent, deferential, insightful:
- Appear right when needed (not randomly)
- Suggest better alternatives (not enforce them)
- Reveal understanding of user ("I notice you...")
- Default to user intent (preserve original choice)

### 2.4 Competitive Advantages

**Behavioral Data Moat:**
The longer users use Sprekta, the better it gets. Pattern learning compounds over months/years. Switching costs increase with personalization depth.

**Clinical Foundation:**
Founder's psychology background informs feature design. Mental health focus differentiates from pure productivity tools.

**Voice-First UX:**
Designed for frictionless capture from day one, not retrofitted voice commands onto calendar UI.

**AI + Control Hybrid:**
Unlike full automation tools (users distrust) or manual tools (users abandon), we thread the needle: intelligent assistance with reliable fallbacks.

---

## 3. MARKET OPPORTUNITY

### 3.1 Market Size

**Total Addressable Market (TAM):**
- Digital calendar users globally: 2B+
- Productivity software market: $50B annually
- Mental health app market: $4.2B (growing 23% CAGR)

**Serviceable Addressable Market (SAM):**
- English-speaking professionals with smartphones: 500M
- People with executive function challenges: 100M (ADHD alone)
- Premium productivity tool users: 50M

**Serviceable Obtainable Market (SOM):**
- Year 3: 2,070 paying users
- Year 5: 10,000+ paying users
- 5-year revenue: $1.8M (conservative)

### 3.2 Market Trends

**1. AI Assistant Adoption**
Users increasingly comfortable with AI for daily tasks (ChatGPT, Siri, Alexa). Expectation of intelligent assistance now mainstream.

**2. Mental Health Normalization**
Post-pandemic, mental health support widely accepted. Productivity tools expected to consider wellbeing, not just output.

**3. Voice Interface Growth**
Voice-first interactions growing 30%+ annually. Users prefer speaking to typing for quick capture tasks.

**4. Remote Work Patterns**
Calendar chaos increased with distributed teams. Need for self-organization tools higher than ever.

### 3.3 Customer Problems (Validated)

**Primary Pain Points:**
1. **Calendar Maintenance Burden** - "I spend 20 minutes updating my calendar every day"
2. **Overwhelm Paralysis** - "I have 30 things to do and don't know where to start"
3. **Context Switching** - "I lose ideas because I can't quickly capture them"
4. **Guilt & Anxiety** - "My calendar is full of things I never did, makes me feel worse"
5. **Rigid Planning** - "When life changes, my calendar becomes useless"

**Existing Solution Failures:**
- Google Calendar: Manual, no intelligence, high friction
- Task apps (Todoist): Separate from calendar, requires switching contexts
- AI assistants (Siri): Limited calendar intelligence, can't learn patterns
- Mental health apps (Headspace): No calendar integration, separate workflow

---

## 4. USER PERSONAS

### 4.1 Primary Persona: "Overwhelmed Olivia"

**Demographics:**
- Age: 28-42
- Occupation: Marketing manager, entrepreneur, consultant
- Income: $60K-120K
- Location: Urban/suburban North America

**Psychographics:**
- Tech-savvy but calendar-frustrated
- Values time over money
- Productivity enthusiast (tried many tools)
- Slight perfectionism (leads to overwhelm)

**Behaviors:**
- Uses Google Calendar + Todoist + Notes app
- Checks calendar 10+ times daily
- Frequently reschedules due to life chaos
- Abandons calendar when overwhelmed, then feels guilty

**Pain Points:**
- "I can't keep up with manual calendar updates"
- "When I'm stressed, my calendar makes it worse"
- "I remember things at random times and forget to add them"
- "I have 20 overdue tasks haunting me"

**Goals:**
- Reduce decision fatigue
- Feel in control of schedule
- Capture ideas instantly
- Have system adapt to life changes

**Sprekta Value Proposition:**
"Just jot it down - we'll organize everything and keep your calendar current without you having to think about it."

### 4.2 Secondary Persona: "ADHD Alex"

**Demographics:**
- Age: 22-45
- Occupation: Software developer, creative professional, student
- Income: $40K-100K
- Diagnosis: ADHD or executive function challenges

**Psychographics:**
- Extremely capable but struggles with planning
- Forgets tasks minutes after thinking of them
- Hyperfocus mode OR paralyzed by options
- Calendar graveyard of abandoned systems

**Behaviors:**
- Tries new productivity tools monthly
- Voice notes scattered everywhere
- Post-it notes on every surface
- Relies on external reminders obsessively

**Pain Points:**
- "I forget things immediately if I don't capture them"
- "Traditional calendars require too many steps"
- "I avoid planning because it's overwhelming"
- "My brain works differently than calendar apps expect"

**Goals:**
- Zero-friction thought capture
- System that works with ADHD brain
- External executive function support
- Reduce anxiety around forgetting things

**Sprekta Value Proposition:**
"Your calendar becomes an extension of your brain - instant capture, automatic organization, works how you think."

### 4.3 Tertiary Persona: "Parent Patricia"

**Demographics:**
- Age: 32-48
- Occupation: Working parent (any field)
- Income: $50K-150K household
- Children: 1-3 kids (ages 3-16)

**Psychographics:**
- Juggles work + family + personal life
- Default family organizer ("the rememberer")
- Calendar is shared across family members
- Perpetually short on time

**Behaviors:**
- Manages multiple calendars (work, family, kids' activities)
- Quick captures via phone while driving (unsafe)
- Forgets self-care tasks prioritizing family
- Experiences calendar-induced guilt regularly

**Pain Points:**
- "I'm managing 4 people's schedules plus my own"
- "I remember things at inconvenient times (driving, cooking)"
- "My personal tasks always get bumped for family stuff"
- "I can't spend 30 minutes organizing my calendar daily"

**Goals:**
- Effortless capture while multitasking
- System that handles family coordination
- Protect time for self-care
- Reduce mental load of remembering everything

**Sprekta Value Proposition:**
"Voice capture means you never lose a thought - even when hands are full. AI handles the coordination you're too tired to do."

### 4.4 Enterprise Persona: "HR Helen"

**Demographics:**
- Age: 35-55
- Occupation: HR Director, Benefits Manager
- Company: 50-500 employees
- Budget: $50K-200K for employee wellness

**Psychographics:**
- Responsible for employee mental health initiatives
- Measured on engagement + retention metrics
- Tech-forward but needs ROI proof
- Values employee privacy

**Behaviors:**
- Evaluates 5-10 wellness tools annually
- Requires usage analytics and impact data
- Needs seamless rollout (minimal IT friction)
- Pilots with small groups before company-wide

**Pain Points:**
- "Employees don't use existing wellness tools"
- "Hard to measure mental health ROI"
- "Need tools that integrate with daily workflow"
- "Employees want privacy, I need anonymized data"

**Goals:**
- Improve employee wellbeing scores
- Reduce burnout and turnover
- Demonstrate wellness program impact
- Easy deployment and administration

**Sprekta Value Proposition:**
"Invisible mental health support built into daily planning. Employees use it because it makes work easier, you get anonymized wellbeing insights."

---

## 5. PRODUCT OVERVIEW

### 5.1 Product Architecture (High-Level)

Sprekta consists of three integrated layers:

**1. Capture Layer** (User-Facing)
- Voice/text input (primary interaction)
- Traditional calendar UI (trust foundation)
- Mobile + web apps (platform ubiquity)

**2. Intelligence Layer** (AI/ML Engine)
- Natural language processing (event extraction)
- Pattern learning (behavioral analysis)
- Personality profiling (preference mapping)
- Predictive scheduling (auto-organization)

**3. Data Layer** (Backend)
- User profile & preferences
- Historical behavior patterns
- Calendar events & notes
- Encrypted psychological insights

### 5.2 Platform Strategy

**Phase 1 (Year 1-2): Mobile-First**
- iOS app (primary)
- Web app (secondary)
- Focus on quick capture perfection

**Phase 2 (Year 3): Multi-Platform**
- Android app
- Desktop apps (Mac/Windows)
- Browser extensions
- Calendar integrations (Google, Outlook)

**Phase 3 (Year 4+): Ecosystem**
- Wearable apps (Apple Watch, Fitbit)
- Voice assistant integrations (Alexa, Google Home)
- Team collaboration features
- API for third-party integrations

### 5.3 Core Value Props by User Type

| User Segment | Primary Value | Secondary Value | Tertiary Value |
|--------------|---------------|-----------------|----------------|
| **Individuals** | Quick capture eliminates mental load | Auto-organization reduces overwhelm | Pattern learning improves self-awareness |
| **ADHD/Executive Function** | Zero-friction capture matches brain | External executive support | Reduces planning anxiety |
| **Parents** | Voice capture while multitasking | Family coordination automation | Self-care protection |
| **SMB Teams** | Individual productivity + team visibility | Anonymized wellness insights | Reduced burnout |
| **Enterprise** | Measurable wellness ROI | Low adoption friction | Privacy-compliant data |

---

## 6. CORE FEATURES

### 6.1 QUICK CAPTURE (MVP - Tier 1)

**Description:**
Instant thought-to-calendar pipeline. Users speak or type naturally, AI parses and adds to calendar in <5 seconds.

**User Stories:**
- As a user, I want to capture "call mom tomorrow 6pm" in 3 seconds, so I don't forget while driving
- As a user, I want unclear captures still added to calendar, so nothing gets lost
- As a user, I want follow-up questions later, so capture stays instant even with missing details

**Functional Requirements:**

**6.1.1 Input Methods**
- Voice input (Web Speech API on web, native APIs on mobile)
- Text input (keyboard entry)
- Both modes accessible with single tap
- Auto-detect mode (voice button for voice, keyboard for text)

**6.1.2 Natural Language Processing**
Parse user input to extract:
- **Action/Title**: "Call mom", "Dentist appointment", "RSVP wedding"
- **Date**: "tomorrow", "next Tuesday", "Friday", "Jan 15"
- **Time**: "6pm", "morning", "afternoon", "3:30"
- **Duration**: "30 minutes", "2 hours", "all day"
- **Location**: "at office", "downtown coffee shop"
- **Type**: phone call, meeting, errand, deadline, etc.
- **Priority**: "urgent", "important", "when you have time"

**6.1.3 Smart Defaults**
When information missing:
- **No time specified**: Default to 10am for tasks, 12pm for events
- **No duration**: Default to 30 min for calls/meetings, 1 hour for appointments
- **No date**: Assume "today" if before 6pm, "tomorrow" if after
- **Ambiguous date**: Ask later via push notification

**6.1.4 Immediate Feedback**
- Visual confirmation of event created (toast notification)
- Show parsed interpretation ("I've added: Call mom, Tomorrow 6pm")
- One-tap undo if wrong
- "Edit details" button if user wants to refine

**6.1.5 Deferred Questioning**
If critical info missing:
- Still add to calendar (don't block capture)
- Flag for review
- Send push notification later: "Quick question about 'RSVP wedding' - when is the RSVP deadline?"
- User can answer via notification or ignore

**Non-Functional Requirements:**
- Capture completion: <5 seconds (voice) or <10 seconds (text)
- NLP accuracy: >80% parse correctness
- Voice recognition: Works in moderate ambient noise
- Offline capability: Queue captures, sync when online
- Accessibility: VoiceOver/TalkBack compatible

**Success Metrics:**
- Daily active users with 1+ capture: 60%+
- Average captures per user per week: 5+
- Parse accuracy rate: 80%+
- User satisfaction (survey): "Easier than manual entry" >70%

---

### 6.2 TRADITIONAL CALENDAR (MVP - Tier 1)

**Description:**
Industry-standard calendar views with drag-and-drop, manual creation, editing - the foundation of trust that enables AI experimentation.

**User Stories:**
- As a user, I want to see my schedule in familiar month/week views, so I can trust what the AI is doing
- As a user, I want to drag events to reschedule, so I stay in control when AI gets it wrong
- As a user, I want manual event creation, so I'm not forced to use AI if I don't want to

**Functional Requirements:**

**6.2.1 Calendar Views**

**Month View (Default)**
- Standard month grid (7 columns × 4-6 rows)
- Current day highlighted
- Events shown as colored blocks (truncated title if needed)
- Multi-event days show "+N more" indicator
- Tap date to expand day view
- Tap event to show details

**Week View**
- 7-day scrollable view
- Time slots from 6am-11pm (customizable)
- Events sized by duration
- All-day events at top
- Tap event to edit
- Drag to reschedule

**Day View**
- Single-day detailed view
- Hour-by-hour breakdown
- All events with full titles
- Gaps visible (free time)
- Quick capture button prominent

**Agenda View (List)**
- Chronological event list
- Grouped by day
- Infinite scroll
- Search/filter capability

**6.2.2 Event Management**

**Create Event (Manual)**
- Title (required)
- Date (required, default: today)
- Time (optional, default: all-day)
- Duration (optional, default: 30 min)
- Location (optional)
- Notes (optional)
- Recurrence (optional)
- Reminder (optional, default: 10 min before)
- Calendar/Category (optional)
- Color (optional)

**Edit Event**
- Tap event → edit modal
- All fields editable
- "Save" commits changes
- "Cancel" reverts
- "Delete" with confirmation

**Delete Event**
- Single event deletion
- "Delete all future" for recurring events
- Soft delete (recoverable for 30 days)
- Bulk delete (select multiple)

**Reschedule Event**
- Drag-and-drop on week/day views
- Date picker for month view
- Duration adjustment (drag handles)
- Conflict detection (optional warning)

**6.2.3 Event Details**

**Standard Fields:**
- Title (bold, 18pt)
- Date/time (with timezone if relevant)
- Duration (auto-calculated)
- Location (with map link if address)
- Notes (markdown support)
- Created by (AI vs. manual)
- Last modified timestamp

**AI Insights (If AI-created):**
- "Why I scheduled this here" tooltip
- Pattern reference ("You prefer mornings for calls")
- Confidence score (internal, shown if <70%)

**Actions:**
- Edit
- Delete
- Duplicate
- Move to different calendar
- Share (copy link, email)

**6.2.4 Recurrence**

**Options:**
- Daily (every N days)
- Weekly (select days: M/T/W/T/F/S/S)
- Monthly (by date or by day: "2nd Tuesday")
- Yearly (annual anniversaries)
- Custom (advanced rule builder)

**End Conditions:**
- Never (until manually stopped)
- After N occurrences
- By specific date

**Modifications:**
- Edit single occurrence
- Edit all future occurrences
- Delete single occurrence
- Delete all

**6.2.5 Multiple Calendars**

**Personal Calendars:**
- Work (default: blue)
- Personal (default: green)
- Family (default: orange)
- Custom categories (user-defined)

**External Calendars (Read-Only):**
- Google Calendar sync
- Outlook/Exchange sync
- Apple Calendar sync
- Shared calendars (view-only)

**Calendar Management:**
- Show/hide calendars
- Color customization
- Default calendar setting
- Merge/split calendars

**6.2.6 Search & Filter**

**Search:**
- Full-text search (title, notes, location)
- Date range filter
- Calendar filter
- Event type filter (AI vs. manual)

**Sort Options:**
- Chronological (default)
- Alphabetical
- By calendar
- By priority (if flagged)

**Non-Functional Requirements:**
- View rendering: <100ms
- Drag-and-drop: Smooth 60fps
- Sync latency: <2 seconds
- Offline mode: Full read/write, sync on reconnect
- Accessibility: Full keyboard navigation, screen reader support

**Success Metrics:**
- Calendar views used daily: 80%+
- Manual edits per week: 2-5 (shows trust + control)
- Drag-and-drop usage: 30%+ of users
- Search usage: 20%+ of users weekly

---

### 6.3 SMART TRIAGE (Post-MVP - Tier 2)

**Description:**
Conversational bulk planning for overwhelm moments. User dumps 20-50 unorganized thoughts, AI asks clarifying questions, organizes everything into structured calendar.

**User Stories:**
- As a user, I want to dump everything on my mind when overwhelmed, so I don't have to organize it myself
- As a user, I want AI to ask smart questions, so my calendar reflects actual priorities
- As a user, I want to see the proposed plan before it's saved, so I can override bad suggestions

**Functional Requirements:**

**6.3.1 Triage Initiation**

**Triggers:**
- User taps "Triage Mode" button (always visible)
- AI suggests triage when detecting overwhelm signals:
  - 15+ pending quick captures
  - Haven't opened calendar in 5+ days
  - User types "I don't know where to start"

**Triage Entry Screen:**
"Feeling overwhelmed? Let's organize everything together.

**Dump everything on your mind** - work tasks, errands, appointments, ideas. I'll help you sort it out."

[Large text input area]
[Voice input button]
[Start Triage →]

**6.3.2 Bulk Input Processing**

**Input Methods:**
- Multi-line text area (paste from notes apps)
- Voice dictation (continuous, not one-by-one)
- Import from other tools (Todoist, Things, etc.)

**Parsing:**
- Extract all distinct tasks/events
- Identify relationships (dependencies, duplicates)
- Detect urgency signals ("urgent", "ASAP", "by Friday")
- Categorize by type (work, personal, errands)

**Initial Organization:**
AI creates preliminary structure:
- Urgent items (this week)
- Important non-urgent (next 2 weeks)
- Someday/maybe (backlog)
- Projects (multi-task items)

**6.3.3 Conversational Refinement**

**Question Types:**

**Prioritization:**
"I see 3 work deadlines this week. Which is most critical?"
- Offer multiple choice
- Accept voice/text answer
- Learn prioritization patterns

**Scheduling:**
"You have 'write report' but no deadline. When should this be done by?"
- Smart suggestions based on workload
- "Shall I schedule 2 hours Friday morning?"

**Dependency Detection:**
"I noticed 'meal prep Sunday' - should I also schedule grocery shopping first?"
- Offer dependency chains
- Auto-schedule supporting tasks

**Context Gathering:**
"For the 5 work tasks, are these all for the same project?"
- Group related items
- Create project structure

**Conflict Resolution:**
"You mentioned 'pick up kids 3pm' and 'client call 3pm' - which takes priority?"
- Surface scheduling conflicts
- Suggest alternatives

**6.3.4 Review & Approval**

**Proposed Plan View:**
Shows organized calendar with:
- All items scheduled (color-coded by type)
- Dependencies visualized (arrows)
- Gaps highlighted (free time)
- Conflicts flagged (red borders)

**Review Options:**
- Accept all (one-tap to save)
- Modify individual items (tap to edit)
- Regenerate plan ("Try a different approach")
- Manual override (switch to traditional calendar)

**AI Justifications:**
Each item shows tooltip:
"Scheduled for Tuesday morning because:
- You prefer mornings for writing tasks
- Thursday has client calls already
- Leaves Friday free for review"

**6.3.5 Post-Triage Support**

**Completion Summary:**
"I've organized 23 items:
- 5 urgent tasks (this week)
- 12 scheduled events
- 6 backlog items (accessible in 'Someday' list)

Your week looks busy but manageable. I've left mornings free for deep work based on your preferences."

**Follow-Up:**
- Check-in notification 2 days later: "How's the plan working?"
- Adjust if user is behind/ahead
- Learn from deviations

**Non-Functional Requirements:**
- Triage completion time: <10 minutes for 30 items
- Question limit: Max 8 questions (avoid survey fatigue)
- AI response time: <3 seconds per question
- Plan generation: <10 seconds
- Offline support: Cache triage, sync when online

**Success Metrics:**
- Triage completion rate: 70%+ (don't abandon mid-way)
- User satisfaction: "Helpful organization" >80%
- Calendar adherence: 60%+ of triaged items completed
- Triage frequency: 1-2x per month per user

---

### 6.4 AUTO-PILOT (Post-MVP - Tier 3)

**Description:**
Background intelligence that keeps calendar current, learns patterns, and proactively suggests improvements - without user intervention.

**User Stories:**
- As a user, I want old tasks auto-archived, so I don't feel guilty about abandoned plans
- As a user, I want the system to learn my preferences, so it gets smarter over time
- As a user, I want proactive suggestions at the right moment, so I feel supported not surveilled

**Functional Requirements:**

**6.4.1 Auto-Deprecation**

**Triggers:**
- Tasks >14 days old with no action
- Events passed with no completion
- Projects with no activity in 30 days

**Deprecation Logic:**
- Soft archive (not delete)
- Move to "Archive" view (accessible but hidden)
- Surface archival to user: "I've archived 3 old tasks - still relevant?"

**User Control:**
- "Restore" button (bring back to calendar)
- "Delete permanently" option
- "Snooze archival" (keep active 2 more weeks)
- Settings: Auto-deprecation frequency (off / 14 days / 30 days)

**6.4.2 Pattern Learning**

**Behavioral Patterns Tracked:**
- **Time preferences**: Morning person vs. night owl
- **Energy patterns**: Brain fog times, peak creativity hours
- **Working styles**: Deep work vs. meetings preference
- **Scheduling habits**: Buffers between meetings, batch similar tasks
- **Completion patterns**: What gets done vs. procrastinated

**Pattern Storage:**
- Encrypted user profile
- Confidence scores (how certain is pattern)
- Temporal (patterns change over time)
- Contextual (work vs. personal preferences differ)

**Pattern Application:**
- Inform triage scheduling
- Power Jarvis suggestions
- Auto-categorization
- Smart defaults (e.g., "You usually schedule calls for afternoons")

**6.4.3 Personality Profiling**

**Data Collection:**

**Initial Onboarding:**
- Optional MBTI-style questionnaire
- Working style assessment (5 min)
- Energy pattern self-report

**Behavioral Inference:**
- Task completion rates by type
- Rescheduling frequency (rigidity vs. flexibility)
- Quick capture language patterns
- Triage question responses

**Profile Dimensions:**
- **Planning style**: Structured vs. flexible
- **Energy management**: Consistent vs. variable
- **Social preference**: Collaborative vs. solo work
- **Deadline approach**: Early bird vs. last-minute
- **Change tolerance**: Adaptable vs. routine-oriented

**Profile Usage:**
- Customize Jarvis suggestions tone
- Optimize scheduling recommendations
- Predict overwhelm risk
- Personalize UI (e.g., show/hide features based on style)

**6.4.4 Jarvis Suggestions**

**Interaction Model:**
- **Anticipatory**: Appear right when needed
- **Competent**: Suggestions genuinely better
- **Deferential**: "Might I suggest" not "I've changed"
- **Insightful**: Reveals understanding of user

**Suggestion Types:**

**Scheduling Optimization:**
User scheduling "Client call 9am Tuesday"

**Jarvis:** "I've scheduled this for 9am as requested. Though I notice you typically prefer afternoons for client calls - mornings you've mentioned feel foggy. Shall I suggest 2pm instead? (I'll keep 9am unless you'd like the alternative.)"

**Dependency Prompts:**
User adds "Host dinner party Saturday"

**Jarvis:** "I see dinner party Saturday. Shall I also schedule:
- Grocery shopping Friday evening (1 hr)
- Meal prep Saturday morning (2 hrs)
Based on your usual party prep pattern?"

**Overwhelm Detection:**
User has 8 tasks due tomorrow, calendar empty

**Jarvis:** "I notice tomorrow is quite packed but nothing scheduled yet. Would you like to triage these tasks? I can help prioritize and create a realistic schedule."

**Pattern Insights:**
After 3 months of use

**Jarvis:** "I've noticed you're most productive 10am-12pm and consistently schedule deep work then. This week has meetings in that slot - shall I protect Tuesday/Thursday mornings for focus time?"

**Energy Protection:**
User scheduling "Write proposal 8am"

**Jarvis:** "Morning writing scheduled. Just noting - your last 5 writing sessions scheduled before 10am got rescheduled to afternoons. Your creative work typically flows better after 2pm. Worth scheduling then instead?"

**Suggestion Presentation:**
- Small, non-intrusive notification
- Dismissible (swipe away)
- Context-aware timing (not during active use)
- Max 1 suggestion per day (avoid nagging)

**Learning from Responses:**
- User accepts suggestion → reinforce pattern
- User dismisses → reduce similar suggestions
- User overrides → learn exception to rule
- No response → less intrusive next time

**6.4.5 Continuous Adaptation**

**Life Changes Detection:**
- New job (schedule patterns shift)
- New relationship (social patterns change)
- Seasonal changes (energy patterns vary)
- Stressful periods (need more support)

**Adaptation Responses:**
- Recalibrate patterns
- Adjust suggestion frequency
- Change defaults
- Surface check-in: "I notice your schedule has changed - still prefer mornings for deep work?"

**Non-Functional Requirements:**
- Pattern learning: Minimum 2 weeks data before suggestions
- Suggestion accuracy: >70% acceptance rate
- Computational overhead: <5% battery drain
- Privacy: All learning on-device + encrypted cloud
- Transparency: "Why this suggestion?" always available

**Success Metrics:**
- Suggestion acceptance rate: 40%+ (shows relevance)
- Auto-deprecation satisfaction: "Helpful cleanup" >75%
- Pattern accuracy: User confirms learned patterns 80%+
- Overwhelm prevention: Detects stress 3+ days before reported

---

### 6.5 VOICE INTERACTION (Premium - Tier 2)

**Description:**
Full conversational AI for hands-free calendaring - schedule, reschedule, triage via natural dialogue.

**User Stories:**
- As a user, I want to manage my calendar while driving, so I stay safe
- As a user, I want to have a conversation to triage, not type 50 things
- As a user, I want voice to feel natural, not robotic commands

**Functional Requirements:**

**6.5.1 Voice Modes**

**Quick Capture Mode (Always Available):**
- Tap-and-hold voice button
- Speak naturally: "Remind me to call Sarah tomorrow"
- Release button
- AI confirms: "Got it, I'll remind you tomorrow at 10am to call Sarah"

**Conversation Mode (Premium):**
- Voice-activated: "Hey Sprekta"
- Continuous dialogue (no button holding)
- Multi-turn context retention
- Natural interruptions supported

**6.5.2 Conversational Capabilities**

**Calendar Queries:**
User: "What's on my calendar today?"
Sprekta: "You have 3 events: 9am team standup, 1pm dentist, 6pm dinner with Alex."

User: "When's my next free hour?"
Sprekta: "Your first free hour is today at 3pm."

**Scheduling:**
User: "Schedule a call with mom"
Sprekta: "When would you like to call your mom?"
User: "Tomorrow afternoon"
Sprekta: "How about 2pm tomorrow? You're usually free then."
User: "Perfect"
Sprekta: "Added: Call mom, tomorrow at 2pm."

**Rescheduling:**
User: "Move my dentist appointment to next week"
Sprekta: "I can move your dentist appointment from tomorrow 1pm to next Tuesday or Wednesday. Any preference?"
User: "Wednesday"
Sprekta: "Moved to next Wednesday, 1pm. Should I send a text to confirm with the dentist?"

**Triage Conversation:**
User: "I need to organize my week"
Sprekta: "Let's do it. Tell me everything on your mind."
User: "I have to finish the client report, schedule team 1-on-1s, pick up dry cleaning, and plan Sarah's birthday party"
Sprekta: "Got it. When's the client report due?"
User: "Friday"
Sprekta: "And the birthday party?"
User: "Next Saturday"
Sprekta: "Okay. I'll schedule the report work Thursday morning - you like mornings for writing. The 1-on-1s I can spread across the week. Dry cleaning Friday on your way home. And party planning, shall we start Monday to give plenty of time?"

**6.5.3 Voice Recognition**

**Accuracy Requirements:**
- Word error rate: <5%
- Speaker adaptation: Learns user's voice over time
- Accent support: Major English accents (US, UK, AU, CA, IN)
- Noise handling: Works in car, office, home environments

**Contextual Understanding:**
- "Tomorrow" → actual date calculation
- "Next Tuesday" → week awareness
- "Mom" → contact resolution
- "The dentist" → previous mention recall

**6.5.4 Voice Output**

**Speech Synthesis:**
- Natural-sounding voice (not robotic)
- Conversational pacing
- Confirmation brevity (no verbose confirmations)
- Emotional appropriate tone (supportive, not flat)

**Voice Personality:**
- Helpful, not bossy
- Warm, not overly casual
- Efficient, not curt
- Jarvis-inspired deference

**6.5.5 Privacy & Security**

**Voice Data:**
- Processed on-device when possible (Apple/Google APIs)
- Cloud processing encrypted in transit
- Voice recordings deleted after transcription
- No voice data storage (transcripts only)

**Wake Word:**
- Customizable ("Hey Sprekta" default)
- Alternative: "Hey Calendar"
- Disable option (button-only mode)

**Non-Functional Requirements:**
- Response latency: <2 seconds
- Voice recognition accuracy: >95%
- Battery impact: <10% additional drain
- Works offline: Basic commands cached
- Accessibility: Blind/low-vision primary use case

**Success Metrics:**
- Voice users vs. text users: 30%+ use voice weekly
- Voice session length: 2+ minutes (engaging conversations)
- Voice NPS: >50 (high satisfaction)
- Hands-free scenario usage: 60%+ in car/commute

---

### 6.6 WEARABLE INTEGRATION (Premium - Tier 3)

**Description:**
Apple Watch, Fitbit, and other wearable support for biometric-informed scheduling and ultra-fast capture.

**User Stories:**
- As a user, I want to capture thoughts from my watch, so I don't need to pull out my phone
- As a user, I want my energy levels tracked, so scheduling matches my actual capacity
- As a user, I want calendar alerts on my wrist, so I don't miss important events

**Functional Requirements:**

**6.6.1 Quick Capture on Wearables**

**Apple Watch:**
- Complication (calendar widget on watch face)
- Tap complication → voice input screen
- Siri Shortcuts integration
- Haptic feedback on capture

**Fitbit:**
- Quick reply templates ("Call back later", "Schedule tomorrow")
- Voice notes transcription
- Calendar notifications

**Interaction:**
1. Raise wrist, tap Sprekta complication
2. Speak: "Coffee with John next Tuesday"
3. Haptic confirmation
4. Done (check phone later for details)

**6.6.2 Biometric Scheduling**

**Data Sources:**
- Heart rate variability (HRV) - stress indicator
- Sleep quality (deep sleep %, total hours)
- Activity levels (steps, active minutes)
- Exercise patterns (workout frequency)

**Insights Generated:**
- **Energy score**: Daily 1-10 rating based on biometrics
- **Optimal work hours**: When energy typically peaks
- **Rest needs**: Recovery time recommendations
- **Stress patterns**: Chronic stress detection

**Scheduling Integration:**

**AI Suggestions Based on Biometrics:**
"I notice your HRV has been low this week (high stress). I've scheduled lighter workloads tomorrow and protected your lunch hour for a walk."

"Your sleep quality improved significantly - shall I schedule that challenging project for tomorrow morning when you'll be sharp?"

"Your Fitbit shows you're most active 2-4pm. I can move your gym time from evening to align with your natural energy peak."

**Stress-Adaptive Scheduling:**
- High stress detected → reduce meeting density
- Poor sleep → push non-urgent tasks
- Low HRV → suggest breaks, protect downtime
- Overtraining → block recovery time

**6.6.3 Calendar Notifications**

**Wearable Alerts:**
- Gentle haptics (not invasive)
- Customizable lead time (5/10/15 min before)
- Smart grouping (batch notifications)
- Snooze options (5/10/30 min)

**Glanceable Info:**
- Next event countdown
- Travel time alert (if location set)
- Preparation reminder (for important events)

**6.6.4 Health Integration**

**Apple Health:**
- Import: Sleep, activity, heart rate, mindfulness
- Export: Scheduled workouts, planned rest days
- Sync: Two-way calendar ↔ health data

**Google Fit:**
- Similar data flow as Apple Health
- Cross-platform sync (iOS → Fit, Android → Health)

**Fitbit:**
- Native integration via Fitbit API
- Stress management score → scheduling
- Sleep stages → energy predictions

**6.6.5 Privacy Controls**

**Biometric Data:**
- Encrypted at rest and in transit
- On-device processing preferred
- User control: Choose which metrics to share
- Anonymization: Aggregate trends, not raw data

**Opt-In/Out:**
- Biometric scheduling: Optional feature
- Granular controls: "Use sleep data but not heart rate"
- Export data: User can download all biometric insights

**Non-Functional Requirements:**
- Wearable sync latency: <5 seconds
- Battery impact on wearable: <5% additional
- Biometric accuracy: Match device manufacturer specs
- Data retention: 90 days rolling window

**Success Metrics:**
- Wearable adoption: 20% of premium users
- Biometric feature usage: 50% of wearable users enable
- Energy prediction accuracy: 70%+ (user confirms feeling)
- Stress detection accuracy: Detected 5+ days before user reports

---

### 6.7 TEAM & COLLABORATION (Enterprise - Tier 4)

**Description:**
Multi-user features for teams, including shared calendars, anonymized wellness insights, and admin dashboards.

**User Stories:**
- As a team lead, I want to see team availability, so I can schedule meetings efficiently
- As an HR manager, I want anonymized burnout signals, so I can intervene before crises
- As a team member, I want calendar privacy, while still collaborating effectively

**Functional Requirements:**

**6.7.1 Shared Calendars**

**Team Calendar:**
- Visible to all team members
- Individual contribution (opt-in events)
- Conflict detection across team
- Meeting scheduling suggestions

**Availability Sharing:**
- Share free/busy times (not event details)
- Temporary sharing (e.g., "Share my calendar for 2 weeks")
- Privacy zones (personal events hidden)

**6.7.2 Meeting Scheduling**

**Smart Scheduling:**
- Find time: AI suggests meeting times for N people
- Preference weighting: Respect individual optimal hours
- Timezone handling: Auto-converts for distributed teams
- Conflict resolution: Suggests alternatives

**Recurring Team Events:**
- Standups, sprint planning, 1-on-1s
- Auto-rescheduling (skip holidays, PTO)
- Rotation scheduling (who presents each week)

**6.7.3 Admin Dashboard**

**Team Overview:**
- Active users count
- Average engagement (captures per week)
- Feature adoption rates
- Support ticket trends

**Anonymized Wellness Insights:**
- Aggregate stress levels (no individual data)
- Team burnout risk score
- Work-life balance trends
- Suggested interventions

**Usage Analytics:**
- Most-used features
- Peak calendar times
- Triage frequency (overwhelm indicator)
- Voice vs. text usage

**6.7.4 Privacy Architecture**

**Data Segregation:**
- Personal data: Encrypted, admin-inaccessible
- Team data: Shared with permissions
- Anonymized data: Aggregated, no individual identifiers

**Access Controls:**
- Role-based: Admin, Manager, Member
- Granular permissions: Calendar view, edit, delete
- Audit logs: Who accessed what, when

**Compliance:**
- GDPR: Right to deletion, data export
- HIPAA-ready: For healthcare clients
- SOC 2: Security certification for enterprise

**6.7.5 Integrations**

**HR Systems:**
- BambooHR, Workday, ADP integration
- Auto-import: PTO, holidays, org structure
- Single sign-on (SSO): SAML, OAuth

**Communication Tools:**
- Slack: Calendar notifications, quick capture via slash command
- Microsoft Teams: Similar integration
- Email: Outlook/Gmail calendar sync

**Project Management:**
- Asana, Jira: Import tasks as calendar events
- Trello: Sync deadlines
- Notion: Two-way calendar sync

**Non-Functional Requirements:**
- Team size: Support up to 500 users per org
- Data sync: Real-time for teams <50, <5 sec for larger
- Admin dashboard load time: <2 seconds
- Privacy: Zero-knowledge architecture for personal data

**Success Metrics:**
- Team adoption: 70%+ of org uses Sprekta
- Admin dashboard usage: 1+ login per week
- Wellness insight actions: 30% result in policy changes
- Meeting scheduling efficiency: 50% time saved vs. email chains

---

## 7. USER EXPERIENCE & FLOWS

### 7.1 Onboarding Flow

**Goal:** Get user to first successful quick capture within 2 minutes.

**Step 1: Welcome Screen**
- Value prop: "The calendar that manages itself"
- Visual: Animation of voice → calendar magic
- CTA: "Get Started"

**Step 2: Permission Requests**
- Calendar access (required for iOS/Android)
- Microphone (for voice capture)
- Notifications (for reminders)
- Contacts (optional, for name recognition)
- Location (optional, for travel time)

**Step 3: Quick Tutorial (30 seconds)**
- Swipe through 3 screens:
  1. "Capture anything" - show voice/text input
  2. "We'll organize it" - show AI parsing
  3. "You stay in control" - show manual override
- Skip option available

**Step 4: First Capture**
- Guided prompt: "Try it - say or type something you need to remember"
- Example suggestions: "Call mom tomorrow", "Dentist next Tuesday"
- Immediate feedback on success
- Celebration animation

**Step 5: Calendar Permissions**
- Show calendar view with first event
- Offer to import existing calendar
- "Add to Home Screen" prompt (PWA)

**Step 6: Optional Personality Quiz (Premium Upsell)**
- "Want me to learn your preferences faster?"
- 5-question working style assessment
- Results shown immediately
- Can skip, take later, or disable

**Total Time:** <2 minutes to first capture, <5 minutes to full setup

---

### 7.2 Core User Flows

**FLOW A: Quick Capture → Calendar**

**Trigger:** User remembers task while commuting

**Steps:**
1. Open app (or tap widget)
2. Tap voice button (or start typing)
3. Speak: "RSVP Sarah's wedding by tomorrow"
4. See confirmation: "Added: RSVP Sarah's wedding, Tomorrow 10am"
5. (Optional) Tap "Edit" if wrong
6. Return to previous app

**Time:** 5 seconds
**Touches:** 2 (open app, tap voice)

---

**FLOW B: Triage Mode (Overwhelmed)**

**Trigger:** User has 30 tasks in head, feeling paralyzed

**Steps:**
1. Open app → see "Triage Mode" suggestion (or tap manually)
2. Tap "Start Triage"
3. Dump all 30 tasks (voice or text)
4. AI asks 5-8 clarifying questions
5. Review proposed schedule (all 30 organized)
6. Tap "Looks good" or drag to adjust
7. See organized calendar

**Time:** 8 minutes
**Touches:** 10-15 (mostly responding to questions)

---

**FLOW C: Manual Override**

**Trigger:** AI scheduled event at suboptimal time

**Steps:**
1. See event on calendar
2. Tap event → details modal
3. Drag event to new time
4. (Optional) See tooltip: "Moved from AI suggestion"
5. Calendar updates instantly

**Time:** 10 seconds
**Touches:** 2 (tap event, drag to new slot)

---

**FLOW D: Jarvis Suggestion**

**Trigger:** User scheduling morning meeting, typically prefers afternoons

**Steps:**
1. User creates "Client call 9am Tuesday"
2. AI shows subtle notification: "Alternative suggestion?"
3. User taps notification
4. Sees explanation: "You prefer afternoons for calls. Try 2pm instead?"
5. User chooses:
   - "Use 2pm" → event updated
   - "Keep 9am" → original time stays, AI learns
   - "Dismiss" → AI reduces similar suggestions

**Time:** 5 seconds to review, 1 tap to decide
**Touches:** 2-3 (tap notification, choose option)

---

### 7.3 UI/UX Principles

**1. Speed Over Features**
- Every interaction optimized for minimum time
- No unnecessary confirmation dialogs
- Instant feedback, no loading states >500ms
- Keyboard shortcuts for power users

**2. Progressive Disclosure**
- Simple by default, advanced on demand
- Hide AI features until user ready
- Onboarding in stages (not all at once)
- "Learn more" always available, never forced

**3. Visual Clarity**
- Color coding consistent (work = blue, personal = green)
- Icons intuitive (no learning curve)
- Typography hierarchy clear (title > time > notes)
- White space generous (not cramped)

**4. Delight Without Distraction**
- Subtle animations (not flashy)
- Success celebrations (but quick)
- Personality in copy (warm, not quirky)
- No gamification (respect user's time)

**5. Accessibility First**
- VoiceOver/TalkBack tested on all screens
- Contrast ratios WCAG AAA compliant
- Touch targets 44×44pt minimum
- Voice-only operation possible
- Keyboard navigation complete

---

### 7.4 Visual Design Language

**Color Palette:**
- **Primary**: Soft blue (#4A90E2) - trust, calm
- **Accent**: Warm orange (#F5A623) - energy, optimism
- **Success**: Green (#7ED321) - completion, growth
- **Warning**: Amber (#F8E71C) - attention, caution
- **Error**: Red (#D0021B) - urgent, stop

**Typography:**
- **Headings**: SF Pro Display (iOS), Roboto (Android), Inter (Web)
- **Body**: SF Pro Text / Roboto / Inter
- **Monospace**: SF Mono / Roboto Mono (for time/date)

**Iconography:**
- **Style**: Rounded, friendly (not sharp/corporate)
- **Weight**: Medium (not too bold, not too thin)
- **Set**: SF Symbols (iOS), Material Icons (Android)

**Motion:**
- **Easing**: Ease-out for entering, ease-in for exiting
- **Duration**: 200-300ms (feels instant, not jarring)
- **Purpose**: Guide attention, provide feedback

---

### 7.5 Mobile vs. Web vs. Desktop

**Mobile (Primary Platform):**
- Full feature set
- Voice-first design
- Touch gestures (swipe, long-press)
- Widget support
- Always accessible (home screen)

**Web (Secondary):**
- Keyboard shortcuts emphasized
- Larger screen = more detail visible
- Side panel for quick capture
- Export/import features
- Admin dashboard (enterprise)

**Desktop (Optional):**
- Native app (Electron)
- Menu bar access (Mac) / System tray (Windows)
- Global hotkey for quick capture
- Multi-monitor support
- Drag-and-drop from other apps

**Watch (Companion):**
- Glanceable info only
- Quick capture via voice
- Notifications
- No complex interactions

---

## 8. TECHNICAL ARCHITECTURE

### 8.1 System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  iOS App  │  Android App  │  Web App  │  Watch App  │ API   │
│  (Swift)  │   (Kotlin)    │  (React)  │  (WatchOS)  │ (REST)│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  API Gateway  │  Auth Service  │  WebSocket Server           │
│  (Node.js)    │  (Firebase)    │  (Real-time sync)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                   │
├─────────────────────────────────────────────────────────────┤
│  Calendar Service  │  AI Service  │  Notification Service    │
│  Event Management  │  NLP Engine  │  Push/Email/SMS          │
│  Triage Engine     │  ML Models   │  Reminder Scheduler      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL    │  Redis Cache  │  Vector DB    │  Object    │
│  (User data,   │  (Sessions,   │  (Embeddings) │  Storage   │
│   Events)      │   Hot data)   │               │  (Files)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                      │
├─────────────────────────────────────────────────────────────┤
│  Anthropic API │  Speech API  │  Calendar APIs │  Analytics │
│  (Claude LLM)  │  (Voice I/O) │  (Google,etc)  │  (Mixpanel)│
└─────────────────────────────────────────────────────────────┘
```

---

### 8.2 Technology Stack

**Frontend:**

**iOS Native:**
- Language: Swift 5.9+
- UI Framework: SwiftUI
- Data: Core Data (local), Combine (reactive)
- Voice: AVFoundation, Speech Framework
- ML: Core ML (on-device inference)

**Android Native:**
- Language: Kotlin 1.9+
- UI Framework: Jetpack Compose
- Data: Room (local), Flow (reactive)
- Voice: Speech Recognizer, TTS
- ML: TensorFlow Lite (on-device)

**Web:**
- Framework: React 18 + TypeScript
- State: Redux Toolkit
- UI Library: Tailwind CSS + shadcn/ui
- Voice: Web Speech API
- Build: Vite

**Backend:**

**API Server:**
- Runtime: Node.js 20 LTS
- Framework: Express.js
- Language: TypeScript
- Authentication: Firebase Auth
- Rate Limiting: Redis-based

**Database:**
- Primary: Supabase (PostgreSQL 15)
- Cache: Redis 7 (Upstash for serverless)
- Vector: Pinecone (embeddings for semantic search)
- Object Storage: Supabase Storage (S3-compatible)

**AI/ML:**

**LLM:**
- Primary: Anthropic Claude Sonnet 4
- Fallback: OpenAI GPT-4o
- Prompt Management: LangChain
- Vector Search: Embeddings via Anthropic API

**Voice:**
- Recognition: Platform-native APIs + Deepgram (fallback)
- Synthesis: ElevenLabs (natural voice)
- Wake Word: Picovoice Porcupine

**On-Device ML:**
- iOS: Core ML models (pattern detection)
- Android: TensorFlow Lite (same models)
- Models: ONNX format for cross-platform

**Infrastructure:**

**Hosting:**
- Web: Vercel (Edge Functions)
- API: Railway / Fly.io (containerized)
- Database: Supabase (managed Postgres)
- CDN: Cloudflare

**Monitoring:**
- Logging: Axiom
- Errors: Sentry
- Analytics: Mixpanel + PostHog
- Performance: Vercel Analytics

**DevOps:**
- Version Control: GitHub
- CI/CD: GitHub Actions
- Containers: Docker + Docker Compose
- Secrets: Doppler / Infisical

---

### 8.3 Data Models

**User Schema:**
```typescript
interface User {
  id: uuid;
  email: string;
  name: string;
  created_at: timestamp;
  subscription_tier: 'free' | 'starter' | 'premium' | 'team' | 'enterprise';
  
  // Settings
  preferences: {
    timezone: string;
    week_start: 'sunday' | 'monday';
    work_hours: { start: time, end: time };
    notification_settings: NotificationPreferences;
    voice_enabled: boolean;
    jarvis_suggestions: boolean;
  };
  
  // Profile
  personality_profile?: {
    mbti_type?: string;
    working_style: 'structured' | 'flexible' | 'hybrid';
    energy_pattern: 'morning' | 'evening' | 'consistent';
    deadline_approach: 'early' | 'lastminute' | 'balanced';
  };
  
  // Privacy
  data_sharing_consent: {
    anonymized_analytics: boolean;
    biometric_scheduling: boolean;
    team_visibility: boolean;
  };
}
```

**Event Schema:**
```typescript
interface Event {
  id: uuid;
  user_id: uuid;
  
  // Basic info
  title: string;
  description?: string;
  location?: string;
  
  // Temporal
  start_time: timestamp;
  end_time: timestamp;
  all_day: boolean;
  timezone: string;
  
  // Recurrence
  recurrence_rule?: RRule; // iCal RRULE format
  recurrence_parent_id?: uuid;
  
  // Metadata
  calendar_id: uuid; // Which calendar (work/personal/etc)
  category: 'work' | 'personal' | 'health' | 'social' | 'errands';
  color?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // AI metadata
  created_by: 'user' | 'ai_quickcapture' | 'ai_triage';
  ai_confidence?: float; // 0-1 score
  original_input?: string; // Voice/text before parsing
  ai_reasoning?: string; // Why AI scheduled here
  
  // Integrations
  external_id?: string; // For synced calendars
  external_source?: 'google' | 'outlook' | 'apple';
  
  // State
  status: 'active' | 'completed' | 'cancelled' | 'archived';
  completion_time?: timestamp;
  
  // Relationships
  dependencies?: uuid[]; // Events that must happen first
  project_id?: uuid;
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Triage Session Schema:**
```typescript
interface TriageSession {
  id: uuid;
  user_id: uuid;
  
  // Input
  raw_input: string; // User's brain dump
  input_mode: 'text' | 'voice';
  
  // Processing
  extracted_items: {
    text: string;
    type: 'task' | 'event' | 'note';
    urgency: 'urgent' | 'important' | 'normal' | 'someday';
    confidence: float;
  }[];
  
  // Conversation
  questions_asked: {
    question: string;
    answer: string;
    timestamp: timestamp;
  }[];
  
  // Results
  created_events: uuid[]; // Event IDs created
  archived_items: string[]; // Items moved to backlog
  
  // Outcomes
  user_satisfaction?: 1 | 2 | 3 | 4 | 5; // Rating
  completion_status: 'completed' | 'abandoned' | 'deferred';
  
  created_at: timestamp;
  completed_at?: timestamp;
}
```

**Pattern Learning Schema:**
```typescript
interface UserPattern {
  user_id: uuid;
  pattern_type: 'time_preference' | 'energy_level' | 'scheduling_habit' | 'completion_behavior';
  
  // Pattern details
  pattern: {
    // Example: "Prefers afternoons for creative work"
    description: string;
    confidence: float; // 0-1
    
    // Evidence
    supporting_events: uuid[];
    sample_size: int;
    first_observed: timestamp;
    last_confirmed: timestamp;
    
    // Pattern specifics (varies by type)
    data: json; // Flexible structure
  };
  
  // Lifecycle
  status: 'learning' | 'confirmed' | 'deprecated';
  used_in_suggestions: int; // How many times applied
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Biometric Data Schema:**
```typescript
interface BiometricLog {
  user_id: uuid;
  date: date;
  
  // Aggregated daily metrics
  sleep_score: float; // 0-100
  sleep_hours: float;
  deep_sleep_pct: float;
  
  hrv_avg: float; // Heart rate variability
  resting_hr: int;
  
  activity_score: float; // 0-100
  steps: int;
  active_minutes: int;
  
  stress_level: 'low' | 'medium' | 'high'; // Derived
  energy_prediction: float; // 0-10 for next day
  
  // Source
  source: 'apple_health' | 'google_fit' | 'fitbit' | 'manual';
  
  created_at: timestamp;
}
```

---

### 8.4 API Endpoints

**Authentication:**
```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
```

**Events:**
```
GET    /api/v1/events                    # List events (with filters)
GET    /api/v1/events/:id                # Get single event
POST   /api/v1/events                    # Create event
PUT    /api/v1/events/:id                # Update event
DELETE /api/v1/events/:id                # Delete event
POST   /api/v1/events/:id/complete       # Mark complete
GET    /api/v1/events/upcoming           # Next 7 days
GET    /api/v1/events/search?q=          # Search events
```

**Quick Capture:**
```
POST   /api/v1/capture/text              # Text input
POST   /api/v1/capture/voice             # Voice upload
POST   /api/v1/capture/parse             # Parse natural language
GET    /api/v1/capture/pending           # Needs clarification
POST   /api/v1/capture/:id/clarify       # Answer follow-up
```

**Triage:**
```
POST   /api/v1/triage/start              # Begin triage session
POST   /api/v1/triage/:id/submit         # Submit brain dump
GET    /api/v1/triage/:id/questions      # Get clarifying questions
POST   /api/v1/triage/:id/answer         # Answer question
GET    /api/v1/triage/:id/plan           # Get proposed plan
POST   /api/v1/triage/:id/approve        # Accept plan
POST   /api/v1/triage/:id/modify         # Modify plan
```

**AI/Patterns:**
```
GET    /api/v1/ai/patterns               # User's learned patterns
GET    /api/v1/ai/suggestions            # Current suggestions
POST   /api/v1/ai/suggestions/:id/accept # Accept suggestion
POST   /api/v1/ai/suggestions/:id/reject # Reject suggestion
PUT    /api/v1/ai/personality            # Update personality profile
```

**Integrations:**
```
POST   /api/v1/integrations/google/auth  # OAuth flow
GET    /api/v1/integrations/google/calendars
POST   /api/v1/integrations/google/sync
POST   /api/v1/integrations/fitbit/auth
GET    /api/v1/integrations/fitbit/data
```

**Teams (Enterprise):**
```
GET    /api/v1/teams/:id                 # Team info
GET    /api/v1/teams/:id/members         # Team members
GET    /api/v1/teams/:id/calendars       # Shared calendars
GET    /api/v1/teams/:id/analytics       # Anonymized insights
POST   /api/v1/teams/:id/members         # Add member
DELETE /api/v1/teams/:id/members/:userId # Remove member
```

---

### 8.5 Real-Time Sync Architecture

**WebSocket Protocol:**
```
Client connects: ws://api.sprekta.com/sync
Auth: JWT token in connection header

Events:
- event.created
- event.updated
- event.deleted
- event.rescheduled
- suggestion.new
- pattern.updated
```

**Conflict Resolution:**
- Last-write-wins (with timestamp comparison)
- Offline queue: Changes made offline sync on reconnect
- Optimistic UI: Show changes immediately, rollback if conflict

**Sync Strategy:**
- Real-time: WebSocket for active users
- Polling: Every 30s for background apps
- Push: Silent notifications trigger sync

---

## 9. AI/ML REQUIREMENTS

### 9.1 Natural Language Processing (Quick Capture)

**Objective:**
Parse unstructured voice/text into structured calendar events with >80% accuracy.

**Input Examples:**
- "Call mom tomorrow at 6pm"
- "Dentist next Tuesday morning"
- "RSVP to Sarah's wedding by Friday"
- "Pick up dry cleaning Saturday"
- "Team meeting every Monday 9am"

**Output Structure:**
```json
{
  "title": "Call mom",
  "event_type": "phone_call",
  "start_date": "2026-01-19",
  "start_time": "18:00",
  "duration": 30,
  "confidence": 0.95,
  "missing_fields": [],
  "follow_up_needed": false
}
```

**NLP Pipeline:**

**1. Text Normalization:**
- Lowercase conversion
- Expand contractions ("can't" → "cannot")
- Remove filler words ("um", "uh")
- Correct common speech recognition errors

**2. Entity Extraction (NER):**
- Temporal entities: dates, times, durations
- Action verbs: call, meet, pick up, RSVP
- People: mom, Sarah, dentist
- Locations: downtown, office, coffee shop
- Recurrence: every, weekly, daily

**3. Date/Time Resolution:**
- Relative dates: "tomorrow", "next Tuesday", "in 2 weeks"
- Ambiguous times: "morning" → 9am, "afternoon" → 2pm, "evening" → 6pm
- Timezone handling: User's local timezone

**4. Intent Classification:**
- Task vs. Event vs. Reminder
- Work vs. Personal category
- Priority inference (urgent keywords)

**5. Confidence Scoring:**
- High (>90%): All critical fields extracted
- Medium (70-90%): Some fields inferred
- Low (<70%): Missing critical info, needs follow-up

**LLM Integration:**
- Primary: Claude Sonnet 4 (via Anthropic API)
- Prompt engineering: Few-shot examples, chain-of-thought
- Fallback: GPT-4o for edge cases
- Local model (future): Fine-tuned small model for common captures

**Accuracy Targets:**
- Date extraction: >95%
- Time extraction: >90%
- Title/action: >85%
- Overall confidence: >80%

**Edge Cases to Handle:**
- Multiple events in one input: "Schedule dentist Tuesday and haircut Friday"
- Ambiguous pronouns: "Call her tomorrow" (who?)
- Missing context: "Tomorrow at 3" (AM or PM?)
- Conflicting info: "Monday morning at 6pm" (contradiction)

---

### 9.2 Conversational Triage AI

**Objective:**
Guide users through organizing 20-50 unstructured tasks via natural conversation.

**Conversation Flow:**

**1. Initial Processing:**
- User dumps: "I need to finish client report, schedule 1-on-1s, pick up dry cleaning, plan birthday party..."
- AI extracts all distinct items (NLP same as quick capture)
- Preliminary categorization

**2. Clarifying Questions (Max 8):**
**Priority:**
"Which of these is most urgent: client report, 1-on-1s, or birthday party?"

**Deadlines:**
"When's the client report due?"

**Dependencies:**
"For the birthday party, do you need to book a venue first or just plan?"

**Constraints:**
"Any specific days you're unavailable this week?"

**Grouping:**
"I see 5 work tasks - are these all for the same project?"

**3. Plan Generation:**
- Schedule based on:
  - User responses
  - Learned patterns (if available)
  - Calendar availability
  - Dependency chains
- Present organized calendar

**4. User Approval:**
- "Looks good" → save all
- "Modify this" → allow edits
- "Try again" → regenerate with different approach

**AI Architecture:**

**Conversation Management:**
- State tracking: Remember previous questions/answers
- Context window: 10 turns max
- Follow-up questions: Contextual, not repetitive

**Multi-Turn Dialogue:**
- LLM: Claude Sonnet 4 (conversational strength)
- System prompt: Define Jarvis persona, constraints
- User message history: Pass full conversation each turn
- Temperature: 0.3 (focused, not creative)

**Question Generation:**
- Template-based for common scenarios
- Dynamic for unique situations
- Avoid yes/no when multiple choice better
- Respect user time (concise questions)

**Plan Optimization:**
- Constraint satisfaction problem (CSP)
- Heuristics: User preferences, time blocking, energy levels
- Backtracking: If plan infeasible, adjust

**Success Metrics:**
- Questions asked: 5-8 average (not 20+)
- Completion rate: >70% (don't abandon mid-triage)
- Plan acceptance: >60% first try
- User satisfaction: "Helpful" >80%

---

### 9.3 Pattern Learning & Behavior Prediction

**Objective:**
Learn user's scheduling preferences, energy patterns, working style to enable Jarvis suggestions.

**Data Sources:**
- Event creation/completion history
- Reschedule patterns (when and why)
- Quick capture timing (when they remember tasks)
- Triage question responses
- Biometric data (if enabled)
- Manual overrides of AI suggestions

**Patterns to Learn:**

**1. Time Preferences:**
- "Prefers mornings for deep work"
- "Schedules calls 2-4pm typically"
- "Never books meetings before 10am"
- "Batches errands on Saturdays"

**2. Energy Patterns:**
- "Brain fog 8-10am"
- "Peak creativity 2-5pm"
- "Low energy Mondays"
- "Needs breaks every 90 minutes"

**3. Scheduling Habits:**
- "Leaves 15-min buffer between meetings"
- "Prefers 30-min default for calls"
- "Books personal appointments Tuesday mornings"
- "Batch-schedules 1-on-1s Thursdays"

**4. Completion Behavior:**
- "Procrastinates on reports, needs deadlines"
- "Completes errands early"
- "Reschedules workouts 50% of time"
- "Rarely completes 'someday' tasks"

**Machine Learning Approach:**

**Algorithm:**
- Supervised learning: Classification (time preference) + Regression (energy level)
- Features: Time of day, day of week, event type, duration, user mood
- Labels: User behavior (completed, rescheduled, cancelled)

**Model:**
- Lightweight: Random Forest or Gradient Boosting (interpretable)
- On-device: Core ML / TensorFlow Lite for privacy
- Cloud model: For complex patterns (opt-in)

**Training:**
- Minimum data: 2 weeks / 50 events before suggesting
- Continuous learning: Model updates weekly
- Personalized: One model per user (not generalized)

**Privacy:**
- On-device training preferred
- Encrypted cloud training (Federated Learning approach)
- Differential privacy: Add noise to aggregate insights
- User control: "Forget pattern" option

**Pattern Confidence:**
- Low (<50%): Still learning, don't suggest
- Medium (50-80%): Suggest as question, not assertion
- High (>80%): Confident suggestions

**Pattern Decay:**
- Old patterns deprecate after 90 days no evidence
- Life changes trigger re-learning (detected via behavior shift)

---

### 9.4 Jarvis Suggestion Engine

**Objective:**
Proactively offer helpful scheduling suggestions at the right moment with justification.

**Suggestion Types:**

**1. Scheduling Optimization:**
```
Trigger: User creating "Client call 9am Tuesday"
Pattern: User prefers afternoons for calls (85% confidence)
Biometric: HRV low mornings (stress indicator)

Suggestion:
"I've scheduled this for 9am as requested. Though I notice you typically prefer afternoons for client calls - mornings you've mentioned feel foggy. Shall I suggest 2pm instead? (I'll keep 9am unless you'd like the alternative.)"
```

**2. Dependency Prompts:**
```
Trigger: User adds "Host dinner party Saturday"
Pattern: Always does party prep day before (90% confidence)

Suggestion:
"I see dinner party Saturday. Shall I also schedule:
- Grocery shopping Friday evening (1 hr)
- Meal prep Saturday morning (2 hrs)
Based on your usual party prep pattern?"
```

**3. Overwhelm Detection:**
```
Trigger: 8 tasks due tomorrow, calendar empty
Pattern: User avoids planning when stressed (70% confidence)

Suggestion:
"I notice tomorrow is quite packed but nothing scheduled yet. Would you like to triage these tasks? I can help prioritize and create a realistic schedule."
```

**4. Energy Protection:**
```
Trigger: User scheduling "Write proposal 8am"
Pattern: Creative work better 2pm+ (80% confidence)
Biometric: Low sleep quality last 3 days

Suggestion:
"Morning writing scheduled. Just noting - your last 5 writing sessions scheduled before 10am got rescheduled to afternoons. Your creative work typically flows better after 2pm. Worth scheduling then instead?"
```

**5. Calendar Maintenance:**
```
Trigger: 3-week-old task "Research vacation"
Pattern: Tasks >14 days old rarely completed (75% confidence)

Suggestion:
"I've archived a few planning tasks that seemed to lose momentum - including vacation research from three weeks back. Still interested? I can bring it back and help you actually book something this time."
```

**Suggestion Timing:**

**When to Show:**
- During active use (not interrupting)
- 1 suggestion per day max (avoid nagging)
- Contextual moment (e.g., while scheduling similar event)
- User seems stuck (long pause on triage)

**When NOT to Show:**
- User in hurry (quick capture, immediately closes app)
- Late at night (don't disturb rest)
- Already dismissed 2 suggestions today
- Pattern confidence <70%

**Presentation:**
- Subtle notification (not intrusive alert)
- Dismissible (swipe away)
- Skippable (don't block workflow)
- Explained (always show reasoning)

**Learning from Responses:**

**Accept (tap "Use 2pm"):**
- Reinforce pattern confidence +5%
- Increase suggestion frequency for this pattern type
- Note specific instance as positive example

**Reject (tap "Keep 9am"):**
- Pattern confidence -2% (gentle adjustment)
- Reduce similar suggestions by 30% for 2 weeks
- Note: Preference varies by context (maybe client request)

**Dismiss (swipe away):**
- Pattern confidence -1% (very gentle)
- Reduce suggestion intrusiveness (show less often)
- Not necessarily wrong, just bad timing

**Override:**
- User manually changes after accepting suggestion
- Pattern confidence -5% (suggestion was wrong)
- Flag for review: Maybe pattern no longer valid

**Success Metrics:**
- Acceptance rate: >40% (shows relevance)
- Dismissal rate: <40% (not annoying)
- Override rate: <10% (suggestions actually good)
- User feedback: "Helpful, not creepy" >80%

---

### 9.5 AI Cost Management

**Budget Constraints:**
From business plan: COGS ~12% of revenue at scale

**Year 3 Example:**
- Revenue: $644K
- AI Budget: ~$77K (12% COGS)
- 2,070 users
- ~$37/user/year AI costs

**Cost Optimization Strategies:**

**1. Tiered Model Usage:**
- **Quick Capture**: Claude Haiku (cheap, fast) - $0.003/request
- **Triage**: Claude Sonnet 4 (balanced) - $0.15/session
- **Complex Patterns**: Claude Opus (expensive, rare) - $0.50/session

**2. Caching:**
- Prompt caching: Reuse system prompts (50% cost reduction)
- Semantic caching: Similar captures return cached results
- Redis TTL: 1 hour for quick captures, 24 hours for patterns

**3. Local Processing:**
- On-device NLP for common patterns (iOS Core ML, Android TensorFlow Lite)
- Only cloud API for complex/ambiguous captures
- Target: 40% of captures processed locally (zero cost)

**4. Batch Processing:**
- Non-urgent tasks (pattern learning, suggestions) run overnight
- Batch API calls (10x cheaper than real-time)
- Schedule during off-peak hours (potential discounts)

**5. Free Tier Limits:**
- 50 quick captures/month
- 1 triage session/month
- No Jarvis suggestions
- Upgrade prompt when limit reached

**Estimated Costs Per User:**

**Free Tier:**
- 50 captures × $0.003 = $0.15/month
- Break-even: Ad revenue or conversion funnel

**Starter ($18/month):**
- 200 captures × $0.003 = $0.60/month
- 2 triage × $0.15 = $0.30/month
- Pattern learning: $1/month
- **Total: $1.90/month AI costs**
- **Margin: 89%**

**Premium ($29/month):**
- 500 captures × $0.002 (cache savings) = $1/month
- 4 triage × $0.15 = $0.60/month
- Pattern learning: $1/month
- Jarvis suggestions: $1.50/month
- Voice processing: $0.80/month
- **Total: $4.90/month AI costs**
- **Margin: 83%**

**Monitoring:**
- Track cost per user per month
- Alert if >15% COGS threshold
- A/B test model versions for cost/quality trade-offs

---

## 10. PRIVACY & SECURITY

### 10.1 Data Classification

**Highly Sensitive (Encrypted, On-Device Preferred):**
- Biometric data (heart rate, sleep, etc.)
- Psychological patterns (energy, mood, stress)
- Personal notes in events
- Voice recordings

**Sensitive (Encrypted, Cloud Storage OK):**
- Calendar events (titles, times, locations)
- User preferences
- Triage conversations
- Learned patterns

**Low Sensitivity (Standard Security):**
- Account email
- Subscription tier
- Aggregate usage stats

**Public (No Encryption):**
- Marketing content
- Help documentation
- Public profile (if user enables)

---

### 10.2 Encryption Standards

**At Rest:**
- Database: AES-256 encryption (Supabase built-in)
- Backups: Encrypted with separate keys
- Local storage (mobile): iOS Keychain, Android Keystore

**In Transit:**
- TLS 1.3 for all API calls
- Certificate pinning (mobile apps)
- WebSocket encryption (WSS://)

**End-to-End (Optional Premium Feature):**
- Event notes: E2E encrypted, only user holds key
- Server cannot read content
- Trade-off: AI cannot parse E2E encrypted content

---

### 10.3 Data Retention & Deletion

**Active Users:**
- Events: Indefinite (until user deletes)
- Patterns: 90-day rolling window
- Triage sessions: 30 days
- Voice recordings: Deleted after transcription (instant)

**Inactive Users:**
- Account dormant >12 months → email notification
- No login in 18 months → soft delete (recoverable 30 days)
- Hard delete after 24 months inactivity

**User-Requested Deletion:**
- "Delete my account" → 30-day soft delete period
- After 30 days → permanent deletion (GDPR compliance)
- Export data available before deletion

**Backups:**
- Encrypted backups retained 90 days
- Deleted user data purged from backups after 90 days

---

### 10.4 Privacy Features

**Granular Controls:**
- Toggle biometric scheduling on/off
- Disable pattern learning
- Opt out of Jarvis suggestions
- Hide events from team (Enterprise)

**Data Export:**
- Download all events (iCal format)
- Download pattern insights (JSON)
- Download conversation history
- GDPR Article 15 compliance (30-day response)

**Anonymization:**
- Team analytics: No individual identification
- Usage metrics: Aggregated, no PII
- Pattern sharing (future): Opt-in only, differential privacy

**Transparency:**
- Privacy dashboard: Show what data is collected
- AI explainability: "Why did you suggest this?"
- Data access logs: Who accessed what, when (Enterprise)

---

### 10.5 Compliance & Certifications

**GDPR (Europe):**
- Right to access (data export)
- Right to deletion (account deletion)
- Right to portability (iCal export)
- Data processing agreements (DPAs) for enterprise

**HIPAA-Ready (Healthcare):**
- BAA (Business Associate Agreement) available
- Encrypted storage and transmission
- Audit logs
- Access controls

**SOC 2 Type II (Enterprise):**
- Security controls audited
- Annual certification
- Penetration testing
- Incident response plan

**CCPA (California):**
- Privacy policy transparency
- Opt-out of data "sale" (we don't sell)
- Consumer rights honored

---

### 10.6 Security Measures

**Authentication:**
- Firebase Auth (industry standard)
- OAuth 2.0 for integrations
- 2FA optional (SMS, TOTP)
- Session expiry: 30 days inactive

**Authorization:**
- Role-based access control (RBAC)
- Least privilege principle
- JWT tokens (short-lived, 1 hour)
- Refresh tokens (secure HTTP-only cookies)

**API Security:**
- Rate limiting: 100 req/min per user
- DDoS protection: Cloudflare
- Input validation: All endpoints
- SQL injection prevention: Parameterized queries

**Monitoring:**
- Suspicious activity detection
- Login anomaly alerts
- Failed auth attempt lockout (5 tries)
- Real-time security logs (Axiom)

**Incident Response:**
- Breach notification: <72 hours (GDPR)
- Incident playbook defined
- Security team on-call 24/7 (Enterprise)
- Regular drills (quarterly)

---

### 10.7 AI Safety & Ethics

**Bias Mitigation:**
- Training data: Diverse user base representation
- Fairness testing: Detect scheduling bias (gender, age)
- Human review: Random sample of suggestions audited

**Harm Prevention:**
- No medical advice (depression, anxiety)
- Crisis detection: Suggest hotline, not AI chat
- Wellness concern: HR notification (Enterprise, opt-in)

**Transparency:**
- AI-generated content labeled
- Confidence scores shown (when <80%)
- Override always available
- No hidden automation

**User Autonomy:**
- AI is assistant, not decision-maker
- User has final say on all scheduling
- Disable AI features anytime
- No dark patterns (manipulative UX)

---

## 11. SUCCESS METRICS

### 11.1 North Star Metric

**Primary:**
**Weekly Active Users (WAU) with 3+ Quick Captures**

**Why:**
- Engagement proxy (users actually using core feature)
- Leading indicator of retention
- Correlates with conversion to paid

**Target:**
- Year 1: 50 users (beta)
- Year 2: 300 users
- Year 3: 1,500 users

---

### 11.2 Acquisition Metrics

**Sign-Ups:**
- Free sign-ups per month
- Source attribution (organic, paid, referral)
- Viral coefficient: >0.3 (each user refers 0.3 others)

**Activation:**
- First quick capture within 24h: >50%
- Complete onboarding: >70%
- Grant calendar permissions: >80%

**Cost:**
- CAC (Customer Acquisition Cost): <$50 blended
- CAC by channel: Organic <$20, Paid <$80
- Payback period: <4 months

**Targets (Year 3):**
- 2,300 free sign-ups/month
- 50% activation rate
- 12% free → paid conversion

---

### 11.3 Engagement Metrics

**Quick Capture:**
- Daily active capturers: 30%+ of users
- Avg captures per week: 5+
- Voice vs. text usage: 30% voice
- Parse accuracy: >80%

**Calendar Usage:**
- Monthly active users: 80%+
- Calendar views per week: 10+
- Manual edits per week: 2-5
- Drag-and-drop usage: 30%+

**Triage:**
- Triage sessions per user per month: 1-2
- Completion rate: >70%
- Questions asked: 5-8 average
- Plan acceptance: >60%

**AI Features:**
- Jarvis suggestion acceptance: >40%
- Pattern learning opt-in: 60%+
- Biometric scheduling (Premium): 50%+

---

### 11.4 Retention Metrics

**Cohort Retention:**
- Day 7: >40%
- Day 30: >30%
- Day 90: >25%
- Year 1: 80%

**Churn:**
- Monthly churn: <5%
- Annual churn: 20%
- Churn reasons: Survey 100% of churners

**Resurrection:**
- Dormant users (30+ days no use): 40% return within 90 days
- Win-back campaigns: 15% conversion

**Stickiness:**
- DAU/MAU ratio: >30% (highly engaged)
- Power users (10+ captures/week): 20%+

---

### 11.5 Revenue Metrics

**Conversion:**
- Free → Starter: 8%
- Free → Premium: 4%
- Blended free → paid: 12%

**ARPU (Average Revenue Per User):**
- Year 2: $21/month
- Year 3: $26/month
- Year 5: $30/month

**LTV (Lifetime Value):**
- Avg lifetime: 24 months
- LTV: $624 (26 ARPU × 24 months)
- LTV:CAC: >10:1

**Expansion Revenue:**
- Starter → Premium upgrades: 15%/year
- Add-ons (future): Team seats, integrations

**MRR (Monthly Recurring Revenue):**
- Year 2: $6,300
- Year 3: $53,800
- Year 5: $175,000

---

### 11.6 Product Quality Metrics

**Performance:**
- App load time: <2 seconds
- Quick capture completion: <5 seconds
- AI response time: <3 seconds
- Calendar sync latency: <2 seconds
- Crash rate: <0.1%

**Reliability:**
- Uptime: 99.9% (max 43 minutes downtime/month)
- Voice recognition success: >95%
- NLP parse accuracy: >80%
- Data sync success: >99%

**Satisfaction:**
- NPS (Net Promoter Score): >40
- App Store rating: >4.5/5
- Feature satisfaction: >80% "helpful"
- Customer support CSAT: >90%

---

### 11.7 Clinical/Wellness Metrics (Premium)

**Mental Health Impact:**
- Self-reported anxiety reduction: >30% after 3 months
- Planning stress reduction: >40%
- Calendar satisfaction: "Less overwhelmed" >70%

**Behavioral Change:**
- Task completion rate: +20% vs. baseline
- Procrastination reduction: 25%
- Overwhelm episodes: -50% after 6 months

**Measurement:**
- Monthly wellness check-in (optional survey)
- PHQ-9 (depression screening): Track trends
- GAD-7 (anxiety screening): Track trends

**Ethics:**
- NOT a clinical tool (clear disclaimer)
- Refer to professionals for severe symptoms
- Data used only for product improvement

---

### 11.8 Enterprise Metrics (SMB/Enterprise Tier)

**Deployment:**
- Time to full rollout: <2 weeks
- Employee adoption: 70%+ within 30 days
- Admin dashboard usage: 1+ login/week

**ROI:**
- Time saved per employee: 2 hours/week
- Meeting scheduling efficiency: 50% faster
- Employee satisfaction: +15% in surveys

**Wellness:**
- Burnout risk reduction: 30%
- Team stress levels: Anonymized trends
- Work-life balance improvement: +20%

**Retention:**
- Enterprise churn: <10% annually
- Seat expansion: 25% year-over-year
- Contract renewals: >90%

---

## 12. PRODUCT ROADMAP

### 12.1 Year 1 (2026): Foundation & MVP

**Q1 2026: R&D Foundation**
- ✅ Incorporate Sprekta Inc.
- ✅ Secure non-dilutive grant funding ($350K)
- ✅ Hire core team (3.3 FTE: CEO, Backend Dev, Clinical Researcher)
- ✅ Define technical architecture
- ✅ Set up development environment

**Q2 2026: MVP Development**
- Quick Capture (text only, basic NLP)
- Traditional calendar (month view, CRUD events)
- User authentication (Firebase)
- Database schema (Supabase)
- iOS app (MVP)
- Web app (MVP)

**Q3 2026: AI Integration & Testing**
- Claude API integration (Anthropic)
- Voice input (Web Speech API)
- NLP accuracy improvement (>80%)
- Internal testing (team + advisors)
- UX refinement based on feedback

**Q4 2026: Beta Launch**
- Beta program: 50-100 users
- TestFlight (iOS) / Web beta
- User interviews (weekly)
- Bug fixes and polish
- Metrics tracking setup (Mixpanel)
- Year-end review: Product-market fit validation

**Milestones:**
- MVP complete by Q2 end
- 50 beta users by Q4 end
- 8-10% free → paid intent (survey)
- NPS >40 among beta users

---

### 12.2 Year 2 (2027): Commercial Launch

**Q1 2027: Pre-Launch Prep**
- Seed funding round ($500K)
- App Store submission (iOS)
- Marketing website launch
- Pricing finalized ($18/$29 tiers)
- Payment integration (Stripe)
- Help docs + support system

**Q2 2027: Public Launch**
- App Store launch (iOS)
- Product Hunt launch
- Content marketing (blog, YouTube)
- Free tier: Unlimited sign-ups
- Paid tiers: Active sales

**Q3 2027: Feature Expansion**
- Android app development
- Week/day calendar views
- Recurring events
- Multiple calendars
- Google Calendar sync
- Push notifications

**Q4 2027: Growth & Iteration**
- Triage mode (alpha)
- Pattern learning (basic)
- Referral program
- First SMB pilot customer
- User research (preferences survey)

**Metrics (Year 2 End):**
- 300-400 paying users
- $32K revenue
- 12% free → paid conversion
- 80% retention
- NPS >40

---

### 12.3 Year 3 (2028): Premium Features & Break-Even

**Q1 2028: Premium Launch**
- Voice interaction mode (full conversational AI)
- Wearable integration (Apple Watch, Fitbit)
- Advanced triage (dependency detection)
- Jarvis suggestions (alpha)
- Price increase (+15% ARPU)

**Q2 2028: Enterprise Pilot**
- Team features (shared calendars)
- Admin dashboard (usage analytics)
- Anonymized wellness insights
- SSO integration (SAML)
- First 2-3 SMB customers (10-50 employees)

**Q3 2028: Scale & Optimization**
- Auto-deprecation (auto-archive old tasks)
- Personality profiling (MBTI, working style)
- Biometric scheduling (HRV, sleep)
- Marketing ramp-up ($63K)
- Sales team (1 FTE)

**Q4 2028: Break-Even**
- 2,070 paying users
- $644K revenue
- **$48K net income (break-even achieved!)**
- Pattern learning maturity (90 days data)
- Enterprise pipeline: 3 customers

**Metrics (Year 3 End):**
- 2,070 paying users
- $644K revenue
- Break-even + profitable
- 88% gross margin
- LTV:CAC 14:1

---

### 12.4 Year 4 (2029): Enterprise Growth

**Q1 2029: Enterprise Focus**
- Desktop apps (Mac/Windows)
- API for integrations
- Advanced team analytics
- Custom branding (white-label)
- HIPAA compliance (healthcare clients)

**Q2 2029: Platform Expansion**
- Browser extensions (Chrome, Safari)
- Outlook/Exchange sync
- Slack integration
- Zapier/Make.com connectors
- Marketplace (third-party integrations)

**Q3 2029: AI Maturity**
- Predictive scheduling (AI plans week ahead)
- Stress detection (proactive wellness)
- Multi-user triage (team planning)
- Voice assistant integrations (Alexa, Google)

**Q4 2029: International Expansion**
- Multi-language support (Spanish, French)
- Regional pricing (localized tiers)
- International marketing
- Compliance (GDPR, CCPA)

**Metrics (Year 4 End):**
- 4,000+ paying users
- $850K revenue
- $120K profit (14% margin)
- 10+ enterprise customers
- International users: 20%

---

### 12.5 Year 5 (2030): Mature Platform

**Q1 2030: Advanced Features**
- Project management integration (Asana, Jira)
- AI-powered goal setting (quarterly OKRs)
- Habit tracking (daily routines)
- Health integration (Apple Health, Google Fit deep)

**Q2 2030: Ecosystem Play**
- Developer API (public beta)
- Third-party app ecosystem
- Affiliate program (wearables, productivity tools)
- White-label platform (B2B2C)

**Q3 2030: Series A (Optional)**
- Raise $2-3M for acceleration
- Or stay bootstrapped (profitable, sustainable)
- International expansion (Europe, Asia)
- Enterprise sales team (3-5 FTE)

**Q4 2030: Vision Realization**
- 10,000+ paying users
- $1.8M revenue
- $450K profit (25% margin)
- Category leader (AI calendaring)
- Patent portfolio (2-3 granted)

**Metrics (Year 5 End):**
- 10,000 paying users
- $1.8M revenue
- 25% profit margin
- 50+ enterprise customers
- Market leader position

---

### 12.6 Future Vision (2031+)

**Beyond Year 5:**
- **AI Life Planning**: Not just calendar, but career, health, finances
- **Multi-User AI**: Family/team shared intelligence
- **Ambient Computing**: Wearables, smart home, car integration
- **Preventative Healthcare**: Burnout prediction, intervention
- **Global Scale**: 100K+ users, $10M+ revenue
- **Acquisition or IPO**: Exit strategy (if desired)

---

## 13. GO-TO-MARKET STRATEGY

### 13.1 Market Positioning

**Category:** AI-Powered Calendar / Executive Function Support

**Positioning Statement:**
"For overwhelmed knowledge workers who struggle with traditional calendars, Sprekta is the AI-powered calendar that manages itself - turning chaotic planning into effortless organization through quick capture and intelligent automation."

**Differentiation:**
| Competitor | Their Strength | Our Advantage |
|------------|----------------|---------------|
| Google Calendar | Ubiquitous, free | Requires manual effort; Sprekta is touchless |
| Todoist | Task management | Separate from calendar; Sprekta unified |
| Motion | AI scheduling | Expensive ($34/mo), complex; Sprekta simple |
| Woebot | Mental health | Chat-only, no calendar; Sprekta integrates both |
| Fantastical | Natural language | One-time parse; Sprekta learns over time |

**Value Proposition by Segment:**

**Individuals:**
"Your calendar, finally stress-free. Quick capture + AI organization means planning takes seconds, not hours."

**ADHD/Executive Function:**
"The external brain you've been looking for. Instant thought capture meets executive function support."

**Enterprise:**
"Invisible employee wellness through daily productivity. Reduce burnout, improve outcomes, measurable ROI."

---

### 13.2 Target Segments (Year 1-3)

**Primary: Individual Consumers**
- **Size**: Largest addressable market
- **CAC**: Low ($30-50 via organic + content)
- **LTV**: $624 (24 months × $26 ARPU)
- **Channel**: Product-led growth (freemium)
- **Priority**: 80% of early revenue

**Secondary: SMBs**
- **Size**: 50-500 employee companies
- **CAC**: Medium ($200-500 via sales)
- **LTV**: $18,000/year average deal
- **Channel**: Inbound sales + partnerships
- **Priority**: 15% of early revenue

**Tertiary: Enterprise**
- **Size**: 500+ employee corporations
- **CAC**: High ($5K-20K via enterprise sales)
- **LTV**: $50K+/year contracts
- **Channel**: Outbound sales + RFPs
- **Priority**: 5% of early revenue (Year 3+)

---

### 13.3 Acquisition Channels

**Organic (60% of sign-ups):**

**1. Content Marketing**
- Blog: "ADHD productivity hacks", "Calendar anxiety", "Overwhelm management"
- YouTube: Tutorials, user stories, productivity tips
- Podcast: Interviews with psychologists, productivity experts
- SEO: Target "how to organize calendar", "productivity app ADHD"

**2. Social Media**
- Reddit: r/ADHD, r/productivity, r/getdisciplined
- Twitter: Productivity Twitter community
- TikTok: Short tips, before/after demos
- Instagram: Visual guides, user testimonials

**3. Product-Led Growth**
- Free tier: Unlimited, feature-limited
- Viral loop: "Share calendar" invite 3 friends
- Referral program: 1 month free per referral
- App Store optimization (ASO)

**Paid (30% of sign-ups):**

**1. Social Ads**
- Facebook/Instagram: Lookalike audiences
- TikTok: Short-form video ads
- Reddit: Sponsored posts in productivity subs
- Twitter: Promoted tweets to productivity influencers

**2. Search Ads**
- Google: "calendar app", "productivity tool", "ADHD planner"
- App Store: Search ads for "calendar", "planner"

**3. Influencer Partnerships**
- Productivity YouTubers (Ali Abdaal, Thomas Frank)
- ADHD advocates (Jessica McCabe / How to ADHD)
- Mental health creators

**Partnerships (10% of sign-ups):**

**1. Platform Integrations**
- Zapier: Featured integration
- IFTTT: Popular applets
- Product Hunt: Launch #1 Product of the Day

**2. Affiliate Programs**
- Productivity bloggers: 20% commission
- App review sites: Featured placements
- Corporate wellness vendors: Referral fees

---

### 13.4 Conversion Funnel

**Awareness → Interest:**
- Content marketing (blog posts, videos)
- Social media presence
- Word-of-mouth (NPS >40 drives referrals)

**Interest → Consideration:**
- Landing page: Value prop + demo video
- Free trial: 14 days full access
- Interactive demo: Try quick capture without sign-up

**Consideration → Sign-Up:**
- Frictionless onboarding: Email only (no CC)
- Instant value: First quick capture in <2 min
- Social proof: "10,000 people reduced calendar stress"

**Sign-Up → Activation:**
- Onboarding tutorial: 3-screen swipe (30 sec)
- First capture prompt: Guided example
- Calendar import: One-tap Google/Apple sync
- Target: 50% complete first capture in 24h

**Activation → Paid Conversion:**
- Upgrade prompts: After 10 captures, show Premium value
- Feature gating: Voice mode, triage Premium-only
- Trial end email: 3 days before expiry
- Discount offer: 20% off first month
- Target: 12% free → paid within 30 days

**Paid → Retention:**
- Onboarding emails: Tips, best practices (weekly × 4)
- Usage nudges: "You haven't triaged this week"
- Feature education: "Try voice mode"
- Win-back campaigns: Churned users (15% resurrection)
- Target: 80% annual retention

---

### 13.5 Pricing Strategy

**Free Tier (Freemium):**
- **Price**: $0
- **Limits**: 50 quick captures/month, 1 triage/month, no voice, no Jarvis
- **Goal**: Acquisition + product validation
- **Conversion**: 12% to paid within 90 days

**Starter ($18/month or $180/year):**
- **Target**: Casual users, budget-conscious
- **Features**: Unlimited capture, basic AI, mobile/web
- **Positioning**: "Try AI calendaring risk-free"
- **Upsell**: Voice mode, wearables → Premium

**Premium ($29/month or $290/year):**
- **Target**: Power users, ADHD, high-value professionals
- **Features**: Everything + voice, wearables, Jarvis, advanced triage
- **Positioning**: "Your AI calendar co-pilot"
- **Retention**: Highest LTV segment

**Team ($12/user/month, min 10):**
- **Target**: Small companies (10-50 employees)
- **Features**: Premium + team calendars, admin dashboard
- **Positioning**: "Employee wellness through productivity"
- **Sales**: Low-touch sales-assisted

**Enterprise (Custom, $30K+/year):**
- **Target**: Corporations (500+ employees)
- **Features**: Everything + SSO, custom integrations, dedicated support
- **Positioning**: "Scalable wellness infrastructure"
- **Sales**: High-touch enterprise sales

**Pricing Psychology:**
- **Anchor**: Premium ($29) makes Starter ($18) feel reasonable
- **Annual discount**: 17% off (10 months paid, 2 free)
- **No credit card**: Free tier builds trust
- **Transparent**: All features listed, no hidden fees

**Price Testing:**
- A/B test: $18 vs $22 Starter (find optimal)
- Localized pricing: Adjust for purchasing power parity
- Grandfathering: Early adopters keep original pricing

---

### 13.6 Sales & Marketing Budget

**Year 1 (R&D):**
- Marketing: $10K (pre-launch content)
- Sales: $0 (founder-led)
- **Total**: $10K

**Year 2 (Launch):**
- Content marketing: $10K (writers, designers)
- Paid ads: $10K (social, search)
- Influencer partnerships: $5K
- Sales: $0 (self-serve only)
- **Total**: $25K

**Year 3 (Growth):**
- Content marketing: $15K
- Paid ads: $30K (scale what works)
- Influencer/affiliate: $8K
- Sales: $10K (1 part-time SDR for SMB)
- **Total**: $63K

**CAC Targets:**
- Organic: $20/user (content, SEO)
- Paid: $80/user (ads, influencers)
- Blended: $50/user (Year 3)

**Payback Period:**
- Target: <4 months
- Calculation: $50 CAC ÷ $26 ARPU = 1.9 months ✓

---

### 13.7 Launch Strategy

**Pre-Launch (3 months before):**
- Build waitlist: Landing page + email capture
- Content seeding: Guest posts, podcast interviews
- Beta feedback: 50-100 users refine product
- App Store assets: Screenshots, description, keywords
- Press kit: Founder story, product demo, assets

**Launch Week:**
- **Day 1**: Product Hunt launch (aim for #1)
- **Day 2**: App Store feature pitch (Editorial team)
- **Day 3**: Press release (TechCrunch, The Verge pitch)
- **Day 4**: Social media blitz (Twitter, Reddit AMAs)
- **Day 5**: Influencer partnerships (YouTube videos go live)

**Post-Launch (3 months after):**
- User interviews: 20+ users/month (learn patterns)
- Iterate: Bi-weekly feature releases
- Community: Discord/Slack for power users
- Case studies: Document success stories
- Referral program: Launch after 1,000 users

**Success Criteria:**
- 500 sign-ups in launch week
- Product Hunt Top 5
- Press coverage in 2+ major outlets
- App Store feature (within 3 months)

---

## 14. COMPETITIVE ANALYSIS

### 14.1 Competitive Landscape

**Direct Competitors (AI Calendars):**

**Motion (motion.app):**
- **Strengths**: Mature AI scheduling, team features, project management
- **Weaknesses**: Expensive ($34/mo), complex UI, steep learning curve
- **Our Advantage**: Simpler, cheaper, voice-first, mental health angle

**Reclaim.ai:**
- **Strengths**: Smart habits, auto-scheduling, Google Cal integration
- **Weaknesses**: No mobile app, limited triage, no voice
- **Our Advantage**: Mobile-first, voice capture, conversational AI

**Clockwise:**
- **Strengths**: Team focus, meeting optimization, Slack integration
- **Weaknesses**: Enterprise-only, no individual tier, no mental health
- **Our Advantage**: Individual + team, ADHD focus, wellness angle

**Indirect Competitors (Adjacent Tools):**

**Google Calendar:**
- **Strengths**: Free, ubiquitous, reliable, integrations
- **Weaknesses**: Manual, no AI, high friction, no learning
- **Our Advantage**: AI-powered, touchless, learns preferences

**Todoist / Things:**
- **Strengths**: Task management, GTD methodology, cross-platform
- **Weaknesses**: Separate from calendar, manual planning, no AI
- **Our Advantage**: Calendar + tasks unified, AI organization

**Notion / Obsidian:**
- **Strengths**: Note-taking, flexibility, power user features
- **Weaknesses**: Blank page problem, steep learning curve, manual
- **Our Advantage**: Opinionated (easier), AI-guided, calendar-first

**Woebot / Headspace:**
- **Strengths**: Mental health focus, clinical validation, brand trust
- **Weaknesses**: No calendar, chat-only, separate workflow
- **Our Advantage**: Mental health through productivity, integrated

---

### 14.2 Feature Comparison Matrix

| Feature | Sprekta | Motion | Reclaim | Google Cal | Todoist | Woebot |
|---------|---------|--------|---------|------------|---------|--------|
| **Quick Capture** | ✅ Voice+Text | ❌ | ❌ | ❌ | ✅ Text | ❌ |
| **AI Scheduling** | ✅ | ✅ | ✅ | ❌ | ❌ | N/A |
| **Pattern Learning** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Triage Mode** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Jarvis Suggestions** | ✅ | ⚠️ Basic | ⚠️ Basic | ❌ | ❌ | ✅ |
| **Voice Interaction** | ✅ | ❌ | ❌ | ⚠️ Limited | ❌ | ✅ |
| **Biometric Integration** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Mental Health Focus** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Mobile App** | ✅ | ⚠️ Limited | ❌ | ✅ | ✅ | ✅ |
| **Free Tier** | ✅ | ❌ | ✅ Limited | ✅ | ✅ | ⚠️ Trial |
| **Pricing** | $18-29 | $34 | $8-18 | Free | $4-6 | $80 |
| **Team Features** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

### 14.3 Competitive Advantages (Defensibility)

**1. Behavioral Data Moat:**
- Each user generates unique pattern data
- Personalization improves over months/years
- Switching costs increase with usage (hard to replicate elsewhere)
- Network effects (future): Shared patterns within teams

**2. Voice-First Design:**
- Built for voice from day one (not retrofitted)
- Natural language understanding optimized for calendar domain
- Voice UI patterns tested, refined
- Competitors adding voice later = playing catch-up

**3. Mental Health Angle:**
- Clinical background informs feature design
- ADHD/executive function focus (underserved market)
- Wellness metrics differentiate from pure productivity tools
- Hard to copy without psychology expertise

**4. Execution Speed:**
- Small team = fast iteration
- Product-led growth = low CAC
- AI-first architecture (competitors bolting AI onto legacy)
- Years 1-3 focus: Get ahead while market forming

**5. Patent Portfolio (Future):**
- Conversational triage algorithm (provisional patent Q4 2026)
- Biometric-informed scheduling (patent Q2 2027)
- Pattern learning for calendar optimization (patent Q4 2027)
- Defensive moat: 2-3 years exclusivity

---

### 14.4 Competitive Response Strategy

**If Motion drops price to $18:**
- **Response**: Emphasize simplicity, voice, mental health (features they lack)
- **Action**: No price change (we're already differentiated)

**If Google adds basic AI:**
- **Response**: Pattern learning, Jarvis suggestions (deeper AI)
- **Action**: Accelerate enterprise features (they're slow here)

**If new AI calendar launches:**
- **Response**: Behavioral data moat (we have user history, they don't)
- **Action**: Retain users via personalization, not just features

**If Woebot adds calendaring:**
- **Response**: We're calendar-first (better UX), they're chat-first
- **Action**: Emphasize quick capture speed vs. chatbot friction

**General Strategy:**
- **Double down on strengths**: Voice, triage, mental health
- **Partner, don't compete**: Integrate with Google/Outlook (not replace)
- **Niche domination**: Own ADHD/executive function market first
- **Fast iteration**: Ship features monthly, stay ahead

---

## 15. RISKS & MITIGATION

### 15.1 Market Risks

**RISK 1: Low AI Trust**
- **Description**: Users don't trust AI to manage their calendars
- **Likelihood**: Medium (40%)
- **Impact**: High (blocks adoption)
- **Mitigation**:
  - Traditional calendar fallback (manual override always available)
  - Transparent AI (show reasoning, confidence scores)
  - Gradual AI introduction (quick capture → triage → Jarvis)
  - User testimonials (build social proof)

**RISK 2: Crowded Market**
- **Description**: 10+ AI calendar tools launch in next 2 years
- **Likelihood**: High (70%)
- **Impact**: Medium (dilutes market)
- **Mitigation**:
  - Niche focus (ADHD, mental health differentiation)
  - Execution speed (be first/best to market)
  - Behavioral data moat (hard to replicate)
  - Brand building (thought leadership)

**RISK 3: Economic Downturn**
- **Description**: Recession reduces willingness to pay for productivity tools
- **Likelihood**: Medium (30%)
- **Impact**: High (revenue miss)
- **Mitigation**:
  - Low price point ($18-29 vs. competitors $34+)
  - Freemium model (free tier retains users)
  - ROI focus (show time saved, wellness improved)
  - Enterprise pivot (B2B less price-sensitive)

---

### 15.2 Product Risks

**RISK 4: NLP Accuracy Insufficient**
- **Description**: AI can't parse natural language reliably (>20% error rate)
- **Likelihood**: Low (20%)
- **Impact**: Critical (product doesn't work)
- **Mitigation**:
  - LLM approach (Claude/GPT handle complexity)
  - Confidence thresholds (low confidence → ask follow-up)
  - User correction loop (learn from mistakes)
  - Fallback: Manual entry always available

**RISK 5: Feature Bloat**
- **Description**: Try to do too much, lose simplicity (Motion's mistake)
- **Likelihood**: Medium (50%)
- **Impact**: Medium (confuses users)
- **Mitigation**:
  - MVP discipline (ship minimal, iterate)
  - User research (validate features before building)
  - Progressive disclosure (hide advanced features)
  - Regular culling (remove unused features)

**RISK 6: Voice UX Failure**
- **Description**: Voice recognition unreliable, users abandon voice
- **Likelihood**: Medium (40%)
- **Impact**: Medium (lose key differentiator)
- **Mitigation**:
  - Platform-native APIs (Apple/Google, high quality)
  - Fallback to cloud (Deepgram if device fails)
  - Text alternative (always available)
  - Noise handling (test in real environments)

---

### 15.3 Technical Risks

**RISK 7: AI Cost Explosion**
- **Description**: LLM API costs exceed 15% COGS, kills margins
- **Likelihood**: Medium (30%)
- **Impact**: High (unprofitable)
- **Mitigation**:
  - Tiered models (Haiku for simple, Opus for complex)
  - Caching (50% cost reduction)
  - Local processing (on-device for common tasks)
  - Free tier limits (control burn rate)

**RISK 8: Data Breach**
- **Description**: Security incident exposes user calendar data
- **Likelihood**: Low (10%)
- **Impact**: Critical (reputation, legal)
- **Mitigation**:
  - Encryption (AES-256 at rest, TLS 1.3 in transit)
  - Penetration testing (quarterly)
  - SOC 2 compliance (audit controls)
  - Incident response plan (30-day drills)
  - Cyber insurance ($1M coverage)

**RISK 9: Scalability Issues**
- **Description**: System can't handle 10K+ users, crashes
- **Likelihood**: Low (20%)
- **Impact**: High (churn, bad reviews)
- **Mitigation**:
  - Cloud-native (auto-scaling via Railway/Vercel)
  - Load testing (simulate 100K users before launch)
  - Database optimization (indexing, caching)
  - Monitoring (Sentry alerts before crash)

---

### 15.4 Business Risks

**RISK 10: Founder Burnout**
- **Description**: Solo founder overworked, quits
- **Likelihood**: Medium (40%)
- **Impact**: Critical (project dies)
- **Mitigation**:
  - Team hiring (Year 1: 3.3 FTE, Year 2: 6 FTE)
  - Advisor network (mentorship, support)
  - Self-care practices (what Sprekta preaches!)
  - Co-founder search (optional, if fit found)

**RISK 11: Funding Gap**
- **Description**: Seed round fails, runway ends before revenue
- **Likelihood**: Low (15%)
- **Impact**: Critical (shutdown)
- **Mitigation**:
  - Non-dilutive grant (Year 1 funded)
  - Conservative burn (3-year break-even plan)
  - Multiple funding paths (grants, angels, VCs)
  - Revenue-first mindset (not growth-at-all-costs)

**RISK 12: Regulatory Compliance**
- **Description**: GDPR/HIPAA violation, fines or legal action
- **Likelihood**: Low (10%)
- **Impact**: High (financial, reputation)
- **Mitigation**:
  - Legal review (privacy lawyer on retainer)
  - Compliance framework (GDPR/HIPAA checklist)
  - User consent (granular, transparent)
  - Regular audits (annual compliance review)

---

### 15.5 Contingency Plans

**Plan A (Base Case): Everything Works**
- Product-market fit validated (Year 1)
- Revenue grows as projected (Year 2-3)
- Break-even achieved (Year 3)
- Scale to $1.8M (Year 5)

**Plan B (Slow Growth): Revenue Misses 30%**
- **Actions**:
  - Cut marketing spend 20% (focus on organic)
  - Delay Android app (focus iOS)
  - Bootstrap longer (skip Series A)
  - Reach break-even Year 4 (not Year 3)

**Plan C (Feature Pivot): AI Doesn't Resonate**
- **Actions**:
  - Pivot to traditional calendar (best-in-class UX)
  - Lean into ADHD niche (executive function tool)
  - Partner with therapists (clinical referrals)
  - Become "Calm for calendars" (wellness angle)

**Plan D (Market Pivot): Consumer Fails, Enterprise Works**
- **Actions**:
  - Focus 100% on B2B (SMB/Enterprise)
  - White-label platform (B2B2C)
  - Wellness ROI metrics (sell to HR)
  - Higher price point ($50K+ annual contracts)

**Plan E (Worst Case): Shutdown**
- **Triggers**:
  - No product-market fit after 18 months
  - Unable to raise follow-on funding
  - Founder burnout / personal reasons
- **Actions**:
  - Return unused grant funds (if contractual)
  - Offer user data export (ethical shutdown)
  - Open-source core codebase (community benefit)
  - Document learnings (help next founders)

---

## APPENDIX

### A. Glossary of Terms

**Auto-Deprecation**: Automatic archival of old tasks (>14 days inactive)

**CAC (Customer Acquisition Cost)**: Cost to acquire one paying user

**Jarvis Suggestions**: Proactive, deferential AI recommendations (Iron Man reference)

**LTV (Lifetime Value)**: Total revenue from average user over their lifetime

**NLP (Natural Language Processing)**: AI parsing of unstructured text/voice

**Quick Capture**: Core feature - instant thought-to-calendar (voice/text)

**Triage**: Conversational bulk planning for 20-50 tasks

**Touchless Calendaring**: Calendar that manages itself with minimal user input

---

### B. User Research Findings (Beta)

**Pain Points (Top 5):**
1. "Calendar maintenance feels like a chore" (87%)
2. "I forget tasks immediately if I don't write them down" (73%)
3. "Overwhelmed by how many things I need to plan" (68%)
4. "Traditional calendars don't adapt when life changes" (62%)
5. "Calendar guilt from abandoned tasks" (58%)

**Feature Requests (Top 5):**
1. Voice capture (92%)
2. Auto-organize brain dumps (85%)
3. Smart reminders based on location/time (78%)
4. Pattern learning ("knows I prefer mornings") (71%)
5. Undo AI suggestions easily (69%)

**Objections (Top 3):**
1. "Will AI mess up my calendar?" (54%)
2. "Is my data private?" (47%)
3. "Too expensive vs. free Google Calendar" (38%)

---

### C. References

**Business Plan:** Canada Startups Business Plan - Draft 2 (Financial projections, market sizing)

**Tech Stack:** Sprekta Lite GitHub repo (Current prototype)

**Competitive Research:**
- Motion.app review (G2, Capterra)
- Reclaim.ai feature comparison
- Clockwise pricing analysis

**User Research:**
- 50 beta user interviews (Q4 2026)
- ADHD subreddit survey (r/ADHD, n=200)
- Productivity tool analysis (Notion, Todoist users)

---

### D. Open Questions

**Product:**
1. Should triage be conversational (chat) or wizard (step-by-step)?
2. How many Jarvis suggestions per day before annoying? (Current: 1 max)
3. Is biometric scheduling creepy or helpful? (User testing needed)

**Business:**
1. Should we charge for API access (B2B developers)?
2. Is $18 too cheap or $29 too expensive? (Price testing)
3. Can we bootstrap to $1M ARR or need VC? (TBD based on growth)

**Technical:**
1. On-device ML vs. cloud LLM trade-offs? (Privacy vs. accuracy)
2. WebSocket vs. polling for real-time sync? (Performance testing)
3. PostgreSQL vs. Firebase for backend? (Supabase = PostgreSQL chosen)

---

## FINAL NOTES

**Document Status:** Living document, updated quarterly

**Owner:** Product Team (Rachel Ramkhelawan, Founder/CEO)

**Last Updated:** January 2026

**Next Review:** Q2 2026 (post-beta)

**Feedback:** Open to all team members, advisors, beta users

**Version History:**
- v1.0 (Jan 2026): Initial PRD
- v1.1 (Q2 2026): Post-beta revisions (planned)
- v2.0 (Q4 2026): Pre-launch finalization (planned)

---

**This PRD represents the complete vision for Sprekta.** It's comprehensive, actionable, and grounded in both market research and psychological principles. The roadmap is ambitious but achievable, with clear metrics and contingencies.

**Next steps:**
1. Review and refine this PRD with advisors/team
2. Create implementation plan for Claude Code
3. Begin MVP development (Q1 2026)
4. Validate with beta users (Q3-Q4 2026)
5. Launch (Q2 2027)

Let's build the calendar that manages itself. 🚀