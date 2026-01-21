# Milestone 04: Hybrid Chat + Calendar

## Overview

Rebuild Plan Mode as a persistent side-panel chat that works alongside the calendar, not instead of it. The calendar stays visible and interactive while you think through plans with the AI.

**Core insight:** Planning isn't a separate "mode" you enter. It's a conversation that happens while you're looking at your life.

---

## Problems with Current Approach

| Issue | What's wrong |
|-------|--------------|
| Full-screen takeover | Can't see calendar, can't move events, can't get context |
| Card appears immediately | AI jumps to "here's your plan" before any real conversation |
| Ephemeral | Hit "Back" and conversation is gone |
| Feels like a verdict | Structured card + green button says "accept this" too early |

---

## New Approach

### Two Distinct Tools

**Jot it down (unchanged)**
- Quick, one-shot capture
- "Call mom tomorrow 6pm" → event
- Modal → done → gone
- No conversation needed

**Plan something (rebuilt)**
- Side panel chat
- Calendar stays visible
- Conversational, exploratory
- Persists until you're done
- Structure emerges when ready

### Layout

```
┌────────────────────────────────────────────────┐
│  Header                    [Profile] [DEV]     │
├────────────────────────────────────────────────┤
│                                                │
│              Calendar (full)                   │
│                                                │
├────────────────────────────────────────────────┤
│  [💬 Plan something]              [✏️ Jot]     │
└────────────────────────────────────────────────┘

Chat open:
┌────────────────────────────────────────────────┐
│  Header                                        │
├───────────────────────┬────────────────────────┤
│                       │  Planning Chat         │
│      Calendar         │                        │
│   (still usable)      │  [conversation...]     │
│                       │                        │
│                       │  [type here...]        │
├───────────────────────┴────────────────────────┤
│  [💬 Plan something]              [✏️ Jot]     │
└────────────────────────────────────────────────┘
```

### Two Phases of Conversation

| Phase | What happens | UI |
|-------|--------------|-----|
| **Scratchpad** | Messy thinking, AI asks questions, exploring | Just chat. No structure. No card. |
| **Ready** | User says "ok let's make a plan" or AI offers | Card appears with proposed structure |

The card is NOT shown by default. It emerges when the conversation reaches a natural planning point.

---

## Milestone Plan

| Sprint | Goal | Key Deliverables |
|--------|------|------------------|
| 4.1 | Side Panel Layout | Calendar + chat side-by-side, chat toggle, basic persistence |
| 4.2 | Scratchpad Mode | Remove immediate card, AI asks questions first, conversational flow |
| 4.3 | Ready Phase | Card appears when appropriate, user can accept/edit |
| 4.4 | Polish | Mobile layout, animations, edge cases |

---

## Sprint 4.1: Side Panel Layout

**Goal:** Restructure UI so chat is a collapsible side panel and calendar stays visible.

### What Changes

| Before | After |
|--------|-------|
| Full-screen triage container | Side panel (40% width) |
| Calendar hidden when planning | Calendar visible (60% width) |
| Conversation lost on close | Conversation persists in localStorage |
| Card shown immediately | Card hidden (Sprint 4.2) |

### Files to Modify

```
js/triage-ui.js       ← Rewrite open/close, remove full-screen takeover
style.css             ← Side panel layout, calendar resize
index.html            ← Update container structure
```

### Key Behaviors

1. **Toggle chat** - "Plan something" opens/closes side panel
2. **Calendar shrinks** - Goes from 100% to ~60% width when chat open
3. **Calendar stays interactive** - Can click events, drag, navigate months
4. **Chat persists** - Close and reopen, conversation is still there
5. **No card yet** - Just chat bubbles for now (card comes in 4.2)

---

## Success Criteria (Milestone 04)

1. ✅ Chat opens as side panel, not full-screen
2. ✅ Calendar visible and interactive while chatting
3. ✅ Conversation persists (close/reopen works)
4. ✅ AI has actual conversation before showing structure
5. ✅ Card only appears when user is ready
6. ✅ Mobile: stacked layout works
7. ✅ Jot it down still works (unchanged)

---

## Out of Scope (for now)

- Multiple conversation threads
- Chat history beyond current session
- Card editing inline
- Voice input
