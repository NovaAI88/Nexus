# NEXUS — Life & Work OS

## Vision

NEXUS is a personal operating system that unifies all company departments, life activities, and daily scheduling into one intelligent interface. It knows where you stand across every project, recommends what to work on next, and structures your day around your energy levels — creating a seamless work-life balance engine.

NEXUS is not a to-do app. It is a command center that thinks ahead.

---

## Core Principles

1. **One source of truth** — Every department, project, and task lives in NEXUS. No context-switching between tools.
2. **Energy-aware scheduling** — The day is structured around biological energy zones (peak, high, moderate, low, recovery). Deep work happens during peak energy. Breaks happen when they should.
3. **Intelligence-driven** — NEXUS recommends what to work on, when to take breaks, when to eat, exercise, and recover. You confirm or adjust. It learns.
4. **Timeline-first** — The day is a visual timeline. Drag tasks onto it, resize blocks, let the engine fill gaps intelligently.
5. **Cross-department awareness** — NEXUS tracks all departments (Nexus, Hephaestus, Xenon, Aureon, etc.), knows what was done last, and surfaces the most urgent work regardless of which department it belongs to.

---

## Platform Targets

| Platform | Tech | Priority | Status |
|----------|------|----------|--------|
| **Web App** | React (CRA) | P0 — Foundation | In progress |
| **Mac App** | SwiftUI | P1 — Primary daily driver | Planned |
| **iOS App** | SwiftUI (shared code with Mac) | P2 — Mobile companion | Planned |
| **watchOS App** | SwiftUI (shared code) | P3 — Glanceable + haptics | Planned |

### Architecture for native apps
```
nexus-core/          ← Swift Package (shared across all Apple platforms)
  ├── EnergyModel         — energy zones, time mapping, work style presets
  ├── ExecutionEngine     — task prioritization, department scoring, recommendations
  ├── ScheduleManager     — block creation, gap finding, conflict resolution
  ├── LifeActivities      — 7 categories, 43+ activities, zone affinities
  └── DataSync            — CloudKit sync across all devices

nexus-mac/           ← SwiftUI Mac app (full interface)
nexus-ios/           ← SwiftUI iOS app (mobile-optimized views)
nexus-watch/         ← SwiftUI watchOS app (complications, haptics, glances)
nexus-ui/            ← React web app (browser access, rapid prototyping)
```

---

## Navigation Structure (4 tabs)

| Tab | Purpose |
|-----|---------|
| **Today** | Daily execution — active block, task list, timeline, energy bar, life activities |
| **Week** | 7-day planner — drag tasks across days, see the full week at a glance |
| **Company** | All departments — status, urgency, projects, next actions, blockers |
| **Log** | History — completed tasks, activity log, proof of work |

---

## Key Features

### 1. Energy Zone System
- 5 zones: Peak, High, Moderate, Low, Recovery
- Mapped to time-of-day (configurable per user)
- Work style presets: Default, Early Bird (-60min), Night Owl (+60min)
- Visual energy bar showing zones across the day with current time marker
- Tasks scored by zone affinity (deep work boosted during peak, light work during low)

### 2. Execution Engine
- Pure function: takes company state + time context + energy context → outputs prioritized recommendations
- Scores each department by urgency, recency, project count, and energy zone fit
- Generates work block suggestions with specific time slots
- Generates life block suggestions (breaks, meals, exercise) based on schedule gaps and energy rules

### 3. Life Activity System
- 7 categories: Fitness, Wellness, Nutrition, Personal Development, Social, Recovery, Planning
- 43 activities with default durations, icons, and energy zone affinities
- "For You" recommendations based on current energy zone
- One-click scheduling into the next available gap

### 4. Today Page (Sunsama-inspired 2-panel)
- **Left panel**: Tasks & execution
  - Primary action banner (engine's top recommendation)
  - Active block card (timer, progress, controls)
  - Scrollable task list with checkbox completion
  - Quick log input
- **Right panel**: Timeline & scheduling
  - Energy bar
  - Visual timeline with time markers
  - Suggested blocks (work + life merged, sorted by time)
  - Life block picker
  - Block summary
  - Day constraints

### 5. Company Page
- Unified intelligence hub for all departments
- Each department shows: name, phase, urgency, next action, blockers
- Expandable to show all projects within a department
- Color-coded by department identity

### 6. Weekly Planner (TODO)
- 7-day column view
- Drag tasks between days
- See scheduled blocks per day
- Weekly priority and outcome tracking
- Energy pattern visualization across the week

### 7. Drag & Drop (TODO)
- Drag tasks from task list onto the timeline
- Drag to reorder/resize timeline blocks
- Snap to 15-minute grid
- Visual feedback (valid/invalid drop zones)

### 8. History / Log
- Completed task records with timestamps and durations
- Activity log entries (manual notes, automatic completions)
- Grouped by date
- Searchable

---

## Data Model

### Core entities
- **Department** — id, name, color, phase, urgency, nextAction, blockers
- **Project** — id, name, departmentId, status, priority, currentState, nextAction
- **Task** — id, title, date, status, projectId, blockId, duration
- **PlannerBlock** — id, date, type, label, start, end (types: work, side-job, fitness, life, break, meal, gym, recovery, system, custom)
- **EnergyProfile** — workStyle, breakFrequency, preferredGymTime, zoneOverrides
- **ActivityLogEntry** — id, timestamp, text, projectId, type
- **CompletedHistoryEntry** — id, taskId, title, startedAt, completedAt, duration

### Persistence
- Web: localStorage via `src/storage/localStore.js`
- Native: CloudKit (synced across devices)
- Future: lightweight backend API for cross-platform sync

---

## File Structure (Web App)

```
src/
├── core/
│   ├── energy/
│   │   ├── energyModel.js        — pure energy zone logic
│   │   └── useEnergyProfile.js   — React hook for energy state
│   ├── engine/
│   │   ├── executionEngine.js    — pure prioritization + recommendation logic
│   │   └── useExecutionEngine.js — React hook wrapper
│   ├── life/
│   │   └── lifeCategories.js     — activity definitions + helpers
│   ├── planner/
│   │   └── usePlannerBlocks.js   — timeline block CRUD
│   ├── projects/
│   │   ├── useProjects.js        — project state management
│   │   ├── useFocusProject.js    — focus project selection
│   │   └── initialState.js       — default data + migration
│   ├── departments/
│   │   └── useDepartments.js     — department definitions
│   ├── tasks/
│   │   └── useTaskEngine.js      — task CRUD + status management
│   ├── adapters/
│   │   └── useCompanyState.js    — cross-department state adapter
│   ├── aureon/
│   │   └── useAureon.js          — Aureon pipeline integration
│   ├── log/
│   │   └── useActivityLog.js     — activity log entries
│   └── theme/
│       └── useTheme.js           — dark/light theme toggle
├── components/
│   ├── Sidebar.js                — navigation sidebar
│   ├── NavSection.js             — nav item group
│   ├── NavItem.js                — individual nav button
│   ├── EnergyBar.js              — energy zone visualization
│   ├── LifeBlockPicker.js        — life activity selection grid
│   ├── TimelinePanel.js          — visual timeline with blocks
│   ├── TaskEnginePanel.js        — task list with completion
│   ├── PrimaryActionBanner.js    — engine recommendation banner
│   ├── SuggestedTimelineBlock.js — suggested block card (work + life)
│   ├── BlockSummaryPanel.js      — current/next block summary
│   ├── PlannerBlocksPanel.js     — day constraint controls
│   ├── QuickLogInput.js          — inline log entry
│   ├── ProjectCard.js            — project detail card
│   ├── SectionCard.js            — generic card wrapper
│   ├── AureonTodayPanel.js       — Aureon pipeline summary
│   └── ThemeToggle.js            — theme switch button
├── pages/
│   ├── TodayPage.js              — 2-panel daily execution view
│   ├── WeeklyPage.js             — weekly planner (to be redesigned)
│   ├── HistoryPage.js            — completed work log
│   └── CompanyPage.js            — department intelligence hub
├── data/
│   └── nexusData.js              — static/seed data
├── storage/
│   └── localStore.js             — localStorage persistence
├── App.js                        — root component, routing, state orchestration
└── App.css                       — all styles (single file, design system tokens)
```

---

## Remaining Web App Work

### Phase A: Visual Polish
- [ ] Softer color palette, more whitespace
- [ ] Sidebar hover/active state refinements
- [ ] Consistent spacing and typography pass
- [ ] Smooth transitions on page switches

### Phase B: Weekly Timeline Page
- [ ] 7-day column layout
- [ ] Show scheduled blocks per day
- [ ] Drag tasks between days
- [ ] Weekly priority display
- [ ] Energy pattern across the week

### Phase C: Drag & Drop
- [ ] Drag tasks from task list to timeline
- [ ] Drag to reorder timeline blocks
- [ ] Drag to resize block duration
- [ ] 15-minute snap grid
- [ ] Visual drop zone indicators

### Phase D: Integration & Polish
- [ ] Test all flows end-to-end (create task → schedule → complete → history)
- [ ] Edge cases (empty states, overflow, timezone)
- [ ] Performance pass (unnecessary re-renders)
- [ ] Final responsive design check

### Phase E: Mac App Scaffolding
- [ ] Create Xcode project with SwiftUI
- [ ] Port energy model to Swift
- [ ] Port execution engine to Swift
- [ ] Build Mac-native Today view
- [ ] CloudKit data sync layer

---

## Design Language

- **Dark-first** with light mode support
- **Minimal chrome** — content over decoration
- **Accent: #6b7cff** (soft indigo)
- **Department colors**: Nexus (#6b7cff), Hephaestus (#22d3ee), Xenon (#a78bfa), Aureon (#34d399)
- **Energy colors**: Peak (#ff4d6d), High (#f59e0b), Moderate (#eab308), Low (#3b82f6), Recovery (#a78bfa)
- **Typography**: Inter, system-ui stack
- **Spacing**: 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48)
- **Borders**: Subtle (#1d2430), Strong (#2a3342)
- **Surfaces**: Layered dark (bg → surface-1 → surface-2 → surface-3)
- **Motion**: Fast (140ms), Base (200ms), Slow (320ms)
- **Layout**: 2-panel for Today (tasks | timeline), single column for Company/Log

---

## How to Resume Work

When starting a new session, feed this document to Claude and say:

> "Read NEXUS_CONCEPT.md, then check the remaining work checklist. Pick up from where we left off."

Claude will:
1. Read this concept to understand the full vision
2. Check the checklist above for what's done vs pending
3. Read the current codebase to understand the actual state
4. Continue building from the next unchecked item
