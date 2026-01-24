# Sprekta - AI Calendar Application Overview

**Version:** 0.8.0
**Status:** MVP in Development
**Repository:** https://github.com/rramkhel/sprekta-lite

---

## Product Vision

Sprekta is an AI-powered calendar assistant that helps users organize their time through natural language conversations. Instead of manually creating events, users describe what's on their mind, and the AI helps them break down complex situations into actionable calendar items.

### Core Value Proposition

- **Natural Planning**: Talk through your thoughts, deadlines, and commitments in plain language
- **Intelligent Triage**: AI helps identify conflicts, missing information, and planning gaps
- **Personalized Assistance**: Profile system lets the AI learn your patterns, priorities, and red flags
- **Frictionless Capture**: Quick capture for rapid event entry, conversational mode for complex planning

---

## Feature Overview

### ✅ Implemented Features

#### 1. **Calendar Management**
- **Month View**: Traditional monthly calendar grid with event pills
- **Day View**: Hourly timeline for detailed scheduling (7 AM - 9 PM)
- **Event CRUD**: Create, read, update, delete events with drag-and-drop
- **Quick Capture**: Natural language event parsing ("Call mom tomorrow at 6pm")
- **Persistent Storage**: Events saved to Supabase PostgreSQL database

#### 2. **AI Planning Assistant** (Triage/Conversation Mode)
- **Side Panel Chat**: Persistent conversation interface alongside calendar
- **Natural Language Processing**: Claude 3.5 Sonnet for understanding complex scheduling needs
- **Context-Aware Responses**: AI remembers conversation history within a session
- **Profile Integration**: Uses user profile for personalized recommendations
- **Multi-Phase Conversations**: Initial question → clarification → final plan

#### 3. **User Authentication & Accounts** (Milestone 8)
- **Sign Up/Sign In**: Email/password authentication via Supabase Auth
- **Password Management**: In-app password changes, forgot password flow
- **Session Management**: JWT token-based authentication with secure storage
- **Account Deletion**: Self-service account deletion with data cleanup
- **Anonymous Mode**: Use app without login, claim data upon sign-up

#### 4. **User Profiles**
- **Personal Info**: Name, preferences, patterns
- **Red Flags**: Things you tend to mess up or forget (AI watches for these)
- **Key People**: Important contacts with relationships
- **Priorities**: Ranked priorities for scheduling conflict resolution
- **Free-Form Notes**: Additional context for the AI

#### 5. **Conversation History**
- **Past Conversations**: Browse previous planning sessions
- **Resume Conversations**: Pick up where you left off
- **Archive System**: Archive old conversations to keep history clean

#### 6. **Settings & Account Management**
- **Unified Settings Page**: Tabbed interface for Account + Profile
- **Account Tab**: Email, member since, password changes, account deletion
- **Profile Tab**: All profile fields in structured form
- **Toast Notifications**: Success/error feedback for user actions

#### 7. **Developer Tools**
- **Dev Panel**: Inspect AI responses, view action logs
- **Response Inspector**: Debug JSON responses from AI
- **Action Log**: Track user actions and API calls

---

## Technical Architecture

### Frontend Stack

**Core Technologies:**
- **Pure JavaScript** (ES6 Modules) - No framework, vanilla JS
- **HTML5 + CSS3** - Semantic markup, modern CSS features
- **Lucide Icons** - SVG icon library
- **Inter Font** (Google Fonts) - Typography

**Key Modules:**
- `app.js` - Calendar core, event management, drag-and-drop
- `js/auth-state.js` - Authentication state management
- `js/auth-ui.js` - Sign in/up modals, user dropdown
- `js/settings-ui.js` - Unified settings page (Account + Profile tabs)
- `js/triage-ui.js` - Chat interface for AI planning
- `js/triage-state.js` - Conversation state, API calls
- `js/profile-ui.js` - Profile modal (legacy, now in Settings)
- `js/history-ui.js` - Conversation history modal
- `js/session.js` - Anonymous session tracking
- `dev-panel.js` - Developer debugging tools

### Backend Stack

**Infrastructure:**
- **Vercel Serverless Functions** - API endpoints
- **Supabase** - PostgreSQL database + authentication
- **Anthropic Claude API** - AI conversation engine

**API Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/parse` | POST | Parse natural language to structured event data |
| `/api/events` | GET | Fetch all events |
| `/api/events` | POST | Create new event |
| `/api/events/[id]` | PUT | Update event |
| `/api/events/[id]` | DELETE | Delete event |
| `/api/triage` | POST | AI conversation endpoint |
| `/api/conversation` | POST | Start/resume conversation |
| `/api/conversation/[id]` | GET | Load conversation messages |
| `/api/conversation/[id]/message` | POST | Send message to AI |
| `/api/conversation/claim` | POST | Claim anonymous conversations on login |
| `/api/profile` | GET/POST/PUT | User profile management |
| `/api/account/delete` | DELETE | Delete user account and all data |

### Database Schema

**Tables:**

```sql
-- Users (managed by Supabase Auth)
auth.users (id, email, created_at, ...)

-- Events
events (
  id BIGINT PRIMARY KEY,
  title TEXT,
  date TEXT,
  time TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMP
)

-- Conversations
conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  profile_text TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Messages
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  phase TEXT,
  created_at TIMESTAMP
)

-- Profiles
profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  patterns TEXT[],
  red_flags TEXT[],
  key_people JSONB,
  priorities TEXT[],
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Row Level Security (RLS):**
- Events: Users can only access their own events or events with their session_id
- Conversations: Users can only access their own conversations or anonymous conversations with their session_id
- Messages: Access controlled through conversation ownership
- Profiles: Users can only access their own profile

### Authentication Flow

1. **Anonymous Usage**: Generate client-side session ID, store events with session_id
2. **Sign Up**: Supabase creates user, sets JWT token in localStorage
3. **Claim Flow**: POST to `/api/conversation/claim` to associate anonymous data with user_id
4. **Sign In**: Verify credentials, return JWT token
5. **Session Management**: JWT token sent as Bearer token in all authenticated requests
6. **Password Reset**: Email magic link, redirect to Settings page with `?reset=true`

### AI Conversation System

**Flow:**
1. User opens chat panel → `TriageState.start()` creates/resumes conversation
2. User sends message → `POST /api/conversation/[id]/message`
3. Backend loads conversation history + user profile
4. Builds prompt with system instructions + profile context + message history
5. Calls Claude API (streaming disabled for simplicity)
6. Parses response, stores assistant message
7. Returns reply + phase indicator to frontend

**Phases:**
- `initial` - AI asking questions, gathering context
- `clarifying` - Working through details
- `planning` - Presenting structured plan
- `complete` - Conversation concluded

**Profile Integration:**
- User profile text injected into system prompt
- AI uses patterns, red flags, priorities for personalized advice
- Example: If user tends to "underestimate travel time", AI adds buffer

---

## Design Patterns & Conventions

### Frontend Architecture

**Module Pattern:**
```javascript
const MyModule = {
  init() { /* setup */ },
  render() { /* UI */ },
  handleEvent() { /* logic */ }
};
export default MyModule;
```

**State Management:**
- Each module manages its own state
- Global access via `window.ModuleName` where needed
- No centralized store, intentionally simple

**Event Handling:**
- Inline `onclick` for simple calendar interactions (legacy)
- `addEventListener` for modals and complex components
- Event delegation where appropriate

**Naming Conventions:**
- Files: `kebab-case.js`
- Classes: `PascalCase` (rarely used)
- Functions: `camelCase`
- CSS: `kebab-case` for classes
- Constants: `UPPER_SNAKE_CASE`

### Backend Patterns

**Serverless Functions:**
```javascript
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Route by method
  if (req.method === 'GET') { /* ... */ }
  if (req.method === 'POST') { /* ... */ }

  // Error handling
  try { /* ... */ }
  catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

**Database Access:**
- Use `createServiceClient()` for admin operations (RLS bypass)
- Use `createClient()` + user token for user-scoped queries
- Always use `.select()` to fetch data before `.update()`/`.delete()`

---

## Development Milestones

### ✅ Completed Milestones

- **M1**: Basic calendar grid, event rendering
- **M2**: Event CRUD operations
- **M3**: AI-powered natural language parsing
- **M4**: Drag-and-drop event management
- **M5**: Day view with hourly timeline
- **M6**: Conversation mode (Triage system)
- **M7**: User profiles + conversation history
- **M8**: Authentication + account management + unified settings

### 🚧 In Progress / Planned

- **M9**: Event recurrence patterns
- **M10**: Calendar sharing & collaboration
- **M11**: Mobile app (React Native)
- **M12**: Integrations (Google Calendar, Outlook)
- **M13**: Advanced AI features (auto-scheduling, conflict resolution)
- **M14**: Team/family shared calendars

---

## User Flows

### Flow 1: Anonymous User → Quick Capture

1. User visits site (no login required)
2. Clicks "Quick Capture" button
3. Types "Dentist appointment next Tuesday at 2pm"
4. AI parses → event created → appears on calendar
5. Session ID stored in localStorage, event associated with session

### Flow 2: Complex Planning with AI

1. User clicks "Plan something"
2. Chat panel slides in from left
3. User: "I have a trip to SF next week"
4. AI: "When are you leaving? How long are you staying?"
5. User provides details
6. AI presents structured plan with packing checklist, travel times, buffer
7. User accepts → events added to calendar

### Flow 3: Sign Up & Claim Data

1. Anonymous user has created several events and had conversations
2. Clicks "Sign In" → switches to "Sign up"
3. Enters email + password
4. Account created, JWT stored
5. Backend claims anonymous conversations via session_id
6. User sees all their previous data now associated with account

### Flow 4: Profile-Based Planning

1. User goes to Settings → Profile tab
2. Adds: "Red Flag: I tend to underestimate travel time"
3. Later, uses AI planning for a meeting
4. AI automatically adds 15-20min buffer before/after
5. Warns: "Based on your profile, I'm adding extra travel time"

---

## Performance Considerations

### Current Performance

- **Bundle Size**: ~50KB (unminified, no bundler)
- **API Response Times**:
  - Event CRUD: <100ms
  - AI Parse: 2-5s (Claude API)
  - AI Conversation: 3-8s (Claude API)
- **Database Queries**: Optimized with indexes on user_id, session_id
- **Client-Side Rendering**: Minimal DOM manipulation, no virtual DOM

### Optimization Opportunities

1. **Code Splitting**: Lazy load dev panel, settings, history
2. **AI Response Caching**: Cache parsed events for common phrases
3. **Streaming**: Enable streaming for AI responses (better UX)
4. **Service Worker**: Offline calendar viewing
5. **Image Optimization**: Compress/lazy load any future images

---

## Security Model

### Authentication Security

- **Password Hashing**: Handled by Supabase Auth (bcrypt)
- **JWT Tokens**: Stored in localStorage (considered acceptable for MVP)
- **Token Expiry**: Configurable in Supabase (default 1 hour access token, 7 day refresh)
- **HTTPS Only**: All production traffic over TLS

### Authorization (RLS)

- **Row Level Security**: Enforced at database level
- **User Isolation**: Users can only access their own data
- **Service Role**: Backend uses service role only for admin operations
- **Session Claims**: Anonymous sessions can't access other anonymous sessions

### API Security

- **CORS**: Configured per endpoint
- **Rate Limiting**: Not yet implemented (TODO)
- **Input Validation**: Basic validation on all endpoints
- **SQL Injection**: Prevented by Supabase's parameterized queries

### Data Privacy

- **User Data**: Conversations and profiles stored encrypted at rest (Supabase)
- **AI Processing**: User data sent to Anthropic Claude API (per their privacy policy)
- **Account Deletion**: Hard delete of all user data (cascading deletes)

---

## Known Issues & Limitations

### Current Limitations

1. **No Recurring Events**: Each event is one-time only
2. **No Time Zones**: All times assumed in user's local time
3. **Single Calendar**: Users can't have multiple calendars
4. **No Reminders**: No notification system
5. **AI Token Limits**: Long conversations may hit context limits
6. **No Offline Mode**: Requires internet connection

### Known Bugs

1. **Parse API Errors**: Occasionally fails on complex natural language
2. **Modal Z-Index**: Modals can sometimes overlap incorrectly
3. **Mobile Responsiveness**: Day view needs mobile optimization
4. **Session Race Conditions**: Anonymous to authenticated transition can have timing issues

---

## Testing Strategy

### Current Testing

- **Manual Testing**: Primary testing method during MVP phase
- **Dev Panel**: Built-in debugging tools for AI responses
- **Console Logging**: Extensive logging for troubleshooting

### Future Testing Plans

1. **Unit Tests**: Jest for utility functions
2. **Integration Tests**: Playwright for user flows
3. **API Tests**: Supertest for endpoint validation
4. **E2E Tests**: Full user journey testing
5. **Load Testing**: K6 for API performance under load

---

## Deployment

### Current Deployment

- **Platform**: Vercel
- **Branch Deployment**: `main` branch auto-deploys to production
- **Preview Deployments**: All branches get preview URLs
- **Database**: Supabase hosted PostgreSQL
- **Domain**: TBD (currently on Vercel subdomain)

### Environment Variables

Required in Vercel dashboard:

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-api03-xxx
```

---

## Contributing Guidelines

### Code Style

- **No Linter**: Intentionally keeping it simple for MVP
- **Formatting**: 2-space indentation, single quotes for strings
- **Comments**: Explain "why", not "what"
- **File Organization**: Features in separate modules

### Git Workflow

- **Branch**: Create feature branches from `main`
- **Commits**: Descriptive commit messages with emoji prefixes (🤖 for AI-generated)
- **PRs**: Not required for MVP (direct push to main acceptable)
- **Tags**: Semantic versioning for releases

### Documentation

- **Sprint Instructions**: Each sprint has detailed implementation guide
- **Inline Comments**: Complex logic should be commented
- **README Updates**: Keep main README current with feature changes

---

## Future Roadmap

### Phase 1: Core Features (Q1 2026)
- ✅ Calendar CRUD
- ✅ AI parsing
- ✅ Authentication
- ✅ User profiles
- 🚧 Recurring events
- 🚧 Mobile optimization

### Phase 2: Collaboration (Q2 2026)
- Shared calendars
- Event invitations
- Team scheduling
- Calendar permissions

### Phase 3: Integrations (Q3 2026)
- Google Calendar sync
- Outlook integration
- Slack notifications
- Email reminders

### Phase 4: Advanced AI (Q4 2026)
- Auto-scheduling
- Smart conflict resolution
- Predictive suggestions
- Meeting preparation summaries

---

## Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Vanilla JavaScript | ES6 | UI logic |
| | HTML5 | - | Markup |
| | CSS3 | - | Styling |
| | Lucide Icons | Latest | Icon library |
| **Backend** | Vercel Functions | - | Serverless API |
| | Node.js | 18.x | Runtime |
| **Database** | Supabase PostgreSQL | - | Data storage |
| | Supabase Auth | - | User authentication |
| **AI** | Anthropic Claude | 3.5 Sonnet | Natural language processing |
| **Infrastructure** | Vercel | - | Hosting & deployment |
| | GitHub | - | Version control |

---

## Support & Contact

- **Issues**: https://github.com/rramkhel/sprekta-lite/issues
- **Discussions**: https://github.com/rramkhel/sprekta-lite/discussions
- **Documentation**: `/docs` folder in repository

---

**Last Updated**: 2026-01-24
**Document Version**: 1.0
**App Version**: 0.8.0 (Milestone 8 Complete)
