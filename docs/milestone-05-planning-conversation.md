# Milestone 5: Intelligent Planning Conversation

## Overview

Fix the AI planning behavior. Currently it's too passive ("what's your biggest concern?"). We need it to **demonstrate understanding immediately** by organizing what it heard, while still being conversational.

**Core insight:** The AI should always provide value on every turn - not just ask questions. Show you understood → identify the anchor → surface one insight → ask ONE targeted question.

---

## Current State

**What exists:**
- `api/triage.js` with basic prompt
- Side panel chat (Sprint 4.1)
- Conversation persists in localStorage

**The problem:**
- Prompt says "don't structure until they ask"
- Results in passive Q&A instead of active organizing
- User has to do the mental work themselves

---

## The Fix: Phase-Based Conversation

The AI should behave differently depending on conversation phase:

| Phase | Trigger | AI Behavior |
|-------|---------|-------------|
| **Initial dump** | First user message | Organize everything, identify anchor, surface constraint, ask ONE question |
| **Clarification** | User answers a question | Incorporate answer, update the picture, ask next question OR propose plan |
| **Refinement** | User pushes back or adds info | Adjust, acknowledge, keep moving toward resolution |
| **Resolution** | User says "looks good" / "that works" | Confirm the plan, offer to add to calendar |

