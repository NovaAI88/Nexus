# NEXUS — Master Build Plan v1.0

**Created:** 2026-04-12
**Status:** Active — approved by Nicholas
**Strategy:** Web app first → Mac app → iPhone app
**Reference concept:** NEXUS_CONCEPT_v1.md
**Design reference:** NEXUS_DESIGN_BRIEF_v1.md

---

## Strategic Decision

Keep the existing React codebase. Delete all page components and UI. Rebuild the interface from scratch on top of the existing build setup, routing skeleton, and package.json. This is a complete UI overhaul, not a new project.

---

## Build Sequence

```
N1.0 Foundation Reset       ← Start here
   ↓
N2.0 Today Page             ← Core daily driver (highest priority)
   ↓
N3.0 Projects Page          ← Project management core
   ↓
N4.0 Week Page              ← Week planning view
   ↓
N5.0 Home Dashboard         ← Overview cards
   ↓
N6.0 Inbox / Capture        ← Fast capture and triage
   ↓
N7.0 AI Layer               ← AI daily planner + project generator
   ↓
N8.0 Web Production         ← Auth, subscriptions, deploy ← Web complete
   ↓
N9.0 Mac App                ← Electron wrapper + Mac UX
   ↓
N10.0 iPhone App            ← React Native / Swift ← Full launch
```

**Web milestone:** End of N8.0 — production-ready web app, paying customers possible
**Mac milestone:** End of N9.0
**Full launch milestone:** End of N10.0

---

## Phase Briefs

---

### N1.0 — Foundation Reset + Design System

**Objective:** Strip the old UI. Establish the new design system and shell. ATLAS has a clean, structured foundation to build every subsequent page on.

**Scope:**
- Delete all existing page components (Home, Today, Week, Revenue, Company, Agents, History)
- Delete all company-specific data wiring (Nova, AUREON, VORTEX agent data)
- Implement design tokens: colors, typography, spacing (see Design Brief)
- New sidebar navigation: Home, Today, Week, Projects, Inbox — 5 items only
- Empty state placeholder for each of the 5 pages
- Dark mode as default, light mode toggle ready
- Global layout: fixed sidebar (240px) + fluid content area
- Install Lucide Icons, Inter font, any new dependencies needed

**Exclusions:**
- No page content yet (that's N2.0–N6.0)
- No backend, no auth, no API
- No animations yet

**Deliverables:**
- `src/design/tokens.ts` — all design tokens (colors, spacing, radii, shadows)
- `src/components/layout/Sidebar.tsx` — new sidebar with 5 nav items
- `src/components/layout/Shell.tsx` — app shell (sidebar + content area)
- `src/pages/` — 5 placeholder page files with page title + empty state
- `src/App.tsx` — updated routing to 5 new pages
- All old pages and data files deleted

**Validation:**
- App loads without errors
- Sidebar renders with correct nav items
- Each route renders its placeholder page
- Design tokens applied consistently across shell
- No old company-internal references remain in codebase

**Revenue Relevance:** Foundation for the entire product. No N2.0 without this.

**Review Gate:** Nova reviews — design tokens correct, shell clean, old code gone, no regressions.

---

### N2.0 — Today Page

**Objective:** Build the primary daily driver. This is the page users open every morning. It must be beautiful, functional, and immediately useful.

**Scope:**
- Split layout: left panel (Inbox/Queue) + right panel (Timeline)
- Left panel: list of unscheduled tasks, draggable, sorted by project
- Right panel: hour-by-hour timeline (6am–10pm), time slots, drag task to schedule
- Task card component: checkbox, title, project tag (color pill), time estimate badge, subtask count
- AI Morning Brief banner (static placeholder text — AI in N7.0)
- "Add task" quick input at top of inbox panel
- Day navigation: prev/next day arrows + today button
- Completion state: strike-through, move to bottom

**Exclusions:**
- No real data persistence yet (localStorage is fine)
- No backend / Supabase yet
- No actual AI (static banner is fine)
- No team features

**Deliverables:**
- `src/pages/Today.tsx` — full Today page
- `src/components/today/InboxPanel.tsx`
- `src/components/today/Timeline.tsx`
- `src/components/today/TaskCard.tsx`
- `src/components/today/MorningBrief.tsx` (static)
- Drag-and-drop between panels functional

**Validation:**
- Tasks appear in inbox panel
- Drag task from inbox to timeline slot — task moves
- Task card shows all fields (title, project tag, time estimate, subtask count)
- Day navigation works
- Completing a task moves it to bottom with strike-through
- No layout breaks on 1280×800, 1440×900, 1920×1080

**Revenue Relevance:** Today page is the product's first impression. This is what users pay for.

**Review Gate:** Nova + Nicholas review — must feel premium, not like a demo.

---

### N3.0 — Projects Page

**Objective:** Full project management — board view and timeline view. This is the power layer of NEXUS.

**Scope:**
- Project list (sidebar or top bar — ATLAS to decide based on design)
- Board view: Kanban columns — Not Started / In Progress / Review / Done
- Task cards on board: title, assignee avatar (single user for now), due date, priority badge
- Create project modal: name, color, goal statement
- Create task within project: title, due date, priority, time estimate, subtasks
- Project health bar: % complete shown on project header
- Timeline / Gantt view toggle: horizontal bars per project, drag to reschedule
- "AI Project Builder" button (placeholder — routes to AI in N7.0)

**Exclusions:**
- No multi-user / team assignment yet (placeholder avatar only)
- No real backend persistence (localStorage)
- No Gantt dependencies/connectors in this phase (just bars)

**Deliverables:**
- `src/pages/Projects.tsx`
- `src/components/projects/BoardView.tsx`
- `src/components/projects/GanttView.tsx`
- `src/components/projects/ProjectCard.tsx`
- `src/components/projects/TaskCard.tsx` (board variant)
- `src/components/projects/CreateProjectModal.tsx`
- `src/components/projects/CreateTaskModal.tsx`

**Validation:**
- Create a project — appears in list
- Add tasks to project — appear in correct column
- Drag task between columns — status updates
- Switch to Gantt view — bars render per project with correct dates
- AI Project Builder button visible (disabled state with tooltip)

**Review Gate:** Nova + Nicholas review — board must feel like a real product, not a prototype.

---

### N4.0 — Week Page

**Objective:** Week planning view — see the full week at a glance, balance workload, pull tasks from the waiting list.

**Scope:**
- 7 columns layout (Mon–Sun), each showing scheduled tasks for that day
- Each day column: date header, total hours loaded badge, task list
- Task items in column: title, project tag, time estimate
- Waiting list panel (right or bottom): unscheduled tasks for the week, pull into any day
- Week navigation: prev/next week, current week button
- Hours overload indicator: column header turns amber if >8h loaded
- "Team Week" toggle stub (disabled, shows upgrade prompt)

**Exclusions:**
- No real team features (stub only)
- No calendar integration yet (N8.0)
- localStorage data only

**Deliverables:**
- `src/pages/Week.tsx`
- `src/components/week/DayColumn.tsx`
- `src/components/week/WaitingList.tsx`
- `src/components/week/WeekHeader.tsx`

**Validation:**
- 7 columns render with correct dates
- Tasks from Today page appear in correct day column
- Drag task from waiting list to day column — task scheduled
- Hours loaded badge updates correctly
- Week navigation works

**Review Gate:** Nova reviews — must be visually clean with no crowding.

---

### N5.0 — Home Dashboard

**Objective:** One-glance company/personal overview. Not a page you live in — a page you check in 10 seconds.

**Scope:**
- Dashboard cards layout (CSS grid, responsive)
- Card 1: Today — task count, hours loaded, completion %
- Card 2: This Week — mini progress bars per active project
- Card 3: Upcoming Deadlines — next 7 days, sorted by date
- Card 4: KPI widget — user-defined metric (label + number + target, editable)
- Card 5: Quick capture — inline task input that routes to Inbox
- Empty states for each card when no data exists

**Exclusions:**
- No team snapshot card yet (team feature comes with auth/users)
- No real-time data — reads from localStorage

**Deliverables:**
- `src/pages/Home.tsx`
- `src/components/home/` — one file per card component

**Validation:**
- All 5 cards render with no layout breaks
- KPI widget is editable inline
- Quick capture adds task to Inbox
- Deadline card shows tasks with due dates from Projects

**Review Gate:** Nova reviews — clean, scannable, no clutter.

---

### N6.0 — Inbox / Capture

**Objective:** Fast thought capture and triage. Inbox zero is the flow. Everything gets scheduled, assigned, or archived.

**Scope:**
- Full-page inbox list
- Quick capture bar at top: type + Enter to capture
- Each inbox item: title, capture timestamp, triage actions (Schedule / Assign to Project / Archive)
- Assign to Project: project picker modal
- Schedule: date picker → routes to Today page on correct day
- Archive: moves to collapsed "Archived" section at bottom
- Item count badge on sidebar Inbox nav item
- Empty state: "Inbox zero" celebration message

**Exclusions:**
- No AI categorization in this phase
- No email/Slack import

**Deliverables:**
- `src/pages/Inbox.tsx`
- `src/components/inbox/CaptureBar.tsx`
- `src/components/inbox/InboxItem.tsx`
- `src/components/inbox/AssignModal.tsx`

**Validation:**
- Type + Enter captures item, appears in list instantly
- Assign to Project moves item to correct project
- Schedule opens date picker, moves item to Today/Week
- Archive hides item (reversible)
- Badge count on sidebar updates correctly

**Review Gate:** Nova reviews — capture must be instant and frictionless.

---

### N7.0 — AI Layer — Phase 1

**Objective:** Wire in the AI features that differentiate NEXUS. Daily planner, weekly review, project generator.

**Scope:**
- Claude API integration (backend proxy — no API key in frontend)
- AI Morning Brief: generate based on today's tasks + overdue items + week deadlines
- AI Daily Planner: suggest time blocks for today's task list, respecting estimated durations
- AI Project Generator: input project name + goal → Claude returns structured task list + timeline → user reviews + accepts
- AI Weekly Review (Friday trigger or manual button): summary of week completion, overdue items, next week capacity

**Exclusions:**
- No calendar integration for AI context yet
- No team-aware AI (personal only in this phase)

**Deliverables:**
- `server/api/ai.js` (or equivalent proxy endpoint)
- `src/services/ai.ts` — AI service layer
- `src/components/ai/MorningBrief.tsx` — live version replacing static
- `src/components/ai/ProjectGenerator.tsx` — modal for AI project creation
- `src/components/ai/WeeklyReview.tsx`

**Validation:**
- AI Morning Brief generates contextual text from real task data
- AI Project Generator returns structured plan within 5 seconds
- Plan can be reviewed and accepted (imports tasks into project)
- AI calls fail gracefully — fallback to static message, no crash
- No API key exposed in frontend bundle

**Revenue Relevance:** AI layer is the primary justification for the €8/month and €20/user/month tiers.

**Review Gate:** Nova + Nicholas review — AI output must be genuinely useful, not generic.

---

### N8.0 — Web Production + Auth + Subscriptions

**Objective:** Production-ready web application. Real users, real payments.

**Scope:**
- Supabase auth: email + Google OAuth login
- Data persistence: migrate from localStorage to Supabase (tasks, projects, inbox items)
- Stripe subscription: Free / Personal (€8/month) / Team (€20/user/month) tiers
- Feature gating: AI features gated to Personal+, team features gated to Team+
- Domain deployment (Vercel or equivalent)
- Responsive design: ensure all pages work at 1280px+ (desktop-focused, not mobile)
- Performance: Lighthouse score >85 on Performance, >90 on Accessibility
- Basic onboarding: welcome modal, sample project on first login

**Exclusions:**
- No native mobile app (N10.0)
- No SSO / enterprise auth
- No admin dashboard

**Deliverables:**
- Supabase schema: users, projects, tasks, inbox_items
- Auth flow: login, signup, logout, Google OAuth
- Stripe integration: checkout, webhook handler, subscription status
- All 5 core pages reading/writing from Supabase
- Deployed production URL
- Onboarding flow

**Validation:**
- User can sign up, create project, add tasks — data persists on refresh
- Free user cannot access AI features — upgrade prompt shown
- Stripe checkout completes — subscription activates — AI features unlock
- Production URL loads in <2 seconds
- No auth vulnerabilities (RLS policies on all Supabase tables)

**Revenue Relevance:** This phase makes NEXUS a revenue-generating product.

**Review Gate:** Nova + Nicholas full review — this is the launch gate. Nothing goes live without approval.

---

### N9.0 — Mac App (Electron)

**Objective:** Ship NEXUS as a native Mac desktop app using Electron. Wrap the web app with Mac-native UX enhancements.

**Scope:**
- Electron wrapper of the production web app
- Custom title bar (frameless window with Mac traffic lights)
- Menu bar widget: quick task capture from any app
- Native notifications: daily morning brief, deadline reminders
- Mac App Store submission
- Auto-updater

**Exclusions:**
- No SwiftUI rewrite (Electron first — faster to market)
- No Mac-exclusive features (same data as web)

**Deliverables:**
- `electron/` directory with main process, preload scripts
- Menu bar widget component
- Native notification handlers
- Mac App Store build + submission
- Auto-update configured

**Review Gate:** Nova + Nicholas review — must feel native, not like a browser tab.

---

### N10.0 — iPhone App

**Objective:** Ship NEXUS on iPhone. Today-focused mobile experience.

**Scope:**
- React Native implementation (reuses logic from web, new native UI)
- Today page as primary view (mobile-first)
- Inbox capture via iOS share sheet
- Push notifications for morning brief + deadlines
- App Store submission
- Supabase auth (same account as web)

**Exclusions:**
- No Projects page on mobile in first version (web-only)
- No Week page on mobile in first version
- No team features on mobile

**Deliverables:**
- React Native project setup
- Today page (native)
- Inbox capture (native)
- Push notification integration
- App Store submission

**Review Gate:** Nova + Nicholas review — full TestFlight pass before submission.

---

## Summary Timeline

| Phase | Focus | Output |
|-------|-------|--------|
| N1.0 | Foundation | Clean shell, design system |
| N2.0 | Today | Core daily driver |
| N3.0 | Projects | Project management |
| N4.0 | Week | Week view |
| N5.0 | Home | Dashboard |
| N6.0 | Inbox | Capture + triage |
| N7.0 | AI Layer | Smart planning |
| N8.0 | Production | Paying customers possible ✅ |
| N9.0 | Mac App | Mac App Store |
| N10.0 | iPhone | App Store |

**Defined start:** N1.0 — Foundation Reset
**Defined end:** N10.0 — iPhone App Store submission + live
