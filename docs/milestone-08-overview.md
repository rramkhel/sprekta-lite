# Milestone 8: Authentication (Balanced)

## Overview

Email auth that feels like a real app. User menu, toasts, self-service password change and account deletion. No OAuth complexity.

---

## What's In

| Feature | Effort | Included |
|---------|--------|----------|
| Sign in / Sign up (email) | Baseline | ✅ |
| Password reset (email link) | Baseline | ✅ |
| Claim anonymous conversations | Baseline | ✅ |
| User menu dropdown | Low | ✅ |
| Toast notifications | Low | ✅ |
| Account info (read-only) | Low | ✅ |
| Change password in-app | Medium | ✅ |
| Delete account | Medium | ✅ |

## What's Out (For Now)

| Feature | Effort | Why Skip |
|---------|--------|----------|
| Google OAuth | Higher | Google Cloud setup, redirect handling |
| Change email | Medium | Edge case, use new account instead |
| Sign out everywhere | Low | Edge case |
| Full settings page with nav | Medium | Overkill for now |

---

## User Flows

```
NOT LOGGED IN:
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                          [Sign In]   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    Sign In / Sign Up Modal                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Email: [________________________]                     │  │
│  │  Password: [________________________]                  │  │
│  │                                                        │  │
│  │  [Sign In]                                             │  │
│  │                                                        │  │
│  │  Don't have an account? Sign up                        │  │
│  │  Forgot password?                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

LOGGED IN:
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                    [R] rachel@... ▼  │
└──────────────────────────────────────────────────────────────┘
                              ↓ click
                    ┌──────────────────┐
                    │  👤 Account       │
                    │  ─────────────── │
                    │  🚪 Sign Out      │
                    └──────────────────┘
                              ↓ Account
┌──────────────────────────────────────────────────────────────┐
│                      Account Modal                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  EMAIL                                                 │  │
│  │  rachel@example.com                                    │  │
│  │                                                        │  │
│  │  MEMBER SINCE                                          │  │
│  │  January 2026                                          │  │
│  │                                                        │  │
│  │  ─────────────────────────────────────────────────     │  │
│  │                                                        │  │
│  │  CHANGE PASSWORD                                       │  │
│  │  New password: [____________________]                  │  │
│  │  Confirm: [____________________]                       │  │
│  │  [Update Password]                                     │  │
│  │                                                        │  │
│  │  ─────────────────────────────────────────────────     │  │
│  │                                                        │  │
│  │  [Delete Account]  ← danger style                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

TOAST (appears top-right, auto-dismisses):
┌─────────────────────────┐
│ ✓ Password updated      │
└─────────────────────────┘
```

---

## Sprint Plan

| Sprint | Goal | Deliverables |
|--------|------|--------------|
| 8.1 | Auth state + sign in/up | State manager, modal, forms, header button |
| 8.2 | User menu + account modal | Dropdown, account info, change password, delete |
| 8.3 | Polish + claim | Toasts, password reset, claim conversations, loading states |

---

## Milestone 8 Summary

After completing Milestone 8 (Balanced), users have:

| Feature | Status |
|---------|--------|
| Sign up (email/password) | ✅ |
| Sign in | ✅ |
| Sign out | ✅ |
| Password reset (email link) | ✅ |
| User menu dropdown | ✅ |
| Account info (read-only) | ✅ |
| Change password in-app | ✅ |
| Delete account | ✅ |
| Claim anonymous conversations | ✅ |
| Toast notifications | ✅ |
| Loading states | ✅ |

**Not included (can add later):**
- Google OAuth
- Change email
- Sign out everywhere
- Full settings page

---

Ready to execute after Milestones 6 and 7!
