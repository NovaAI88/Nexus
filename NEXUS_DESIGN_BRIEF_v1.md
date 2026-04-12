# NEXUS — Design Brief v1.0

**Created:** 2026-04-12
**For:** ATLAS (implementation) + Nicholas (review)
**Reference concept:** NEXUS_CONCEPT_v1.md
**Inspiration:** Structured, Sunsama, MS Planner, TeamGantt

---

## Design Philosophy

**Calm productivity.** NEXUS should feel like a high-end tool — not a noisy SaaS dashboard. Every screen should reduce anxiety, not create it. Think Sunsama's restraint, not Jira's chaos.

**Rules:**
- Empty space is not wasted space — use it deliberately
- Information hierarchy matters — one primary action per screen
- Color is meaning — not decoration
- Dark mode is the default — light mode is secondary
- Every component earns its place

---

## Color System

### Base (Dark Mode)

| Token | Value | Use |
|-------|-------|-----|
| `bg-base` | `#0D0D0F` | App background |
| `bg-surface` | `#161618` | Sidebar, panels |
| `bg-card` | `#1E1E21` | Cards, modals |
| `bg-hover` | `#26262A` | Hover states |
| `border` | `#2A2A2F` | Dividers, card borders |
| `border-subtle` | `#1F1F23` | Subtle separators |

### Text

| Token | Value | Use |
|-------|-------|-----|
| `text-primary` | `#F8F8FA` | Headings, main content |
| `text-secondary` | `#A0A0AB` | Labels, metadata |
| `text-muted` | `#6B6B78` | Placeholder, disabled |

### Accent (Primary)

| Token | Value | Use |
|-------|-------|-----|
| `accent` | `#6B6BF0` | Primary buttons, active nav, links |
| `accent-hover` | `#5858D4` | Button hover |
| `accent-subtle` | `#6B6BF014` | Accent backgrounds (badges, highlights) |
| `accent-muted` | `#9B8FF7` | Secondary accent, gradient end |

### Project Colors (6 options — user picks when creating project)

| Name | Value |
|------|-------|
| Indigo | `#6B6BF0` |
| Violet | `#9B5FE0` |
| Rose | `#E05F7E` |
| Amber | `#E0A040` |
| Teal | `#40C9A2` |
| Sky | `#4097E0` |

Project color appears as: left border stripe on task cards, pill tag background (10% opacity), project indicator dot.

### Semantic

| Token | Value | Use |
|-------|-------|-----|
| `success` | `#34D399` | Completion, healthy state |
| `warning` | `#FBBF24` | Attention needed, hours overload |
| `error` | `#F87171` | Blocked, overdue |
| `info` | `#60A5FA` | AI indicators, tips |

### Light Mode (secondary)

Invert the palette: `bg-base` → `#FAFAFA`, `bg-surface` → `#F0F0F2`, `bg-card` → `#FFFFFF`, text inverted. Accent stays `#6B6BF0`. Implementation: CSS variables switched via `data-theme="light"` on `<html>`.

---

## Typography

**Primary font:** Inter (Google Fonts — weights 400, 500, 600, 700)
**Monospace font:** JetBrains Mono (time displays, durations, numeric values)

### Type Scale

| Name | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| `display` | 32px | 700 | 1.2 | Page titles (rare) |
| `heading-lg` | 24px | 600 | 1.3 | Section headings |
| `heading-md` | 20px | 600 | 1.35 | Card headings |
| `heading-sm` | 16px | 600 | 1.4 | Sub-section headings |
| `body-lg` | 16px | 400 | 1.6 | Primary body text |
| `body-md` | 14px | 400 | 1.6 | Default body, list items |
| `body-sm` | 13px | 400 | 1.5 | Secondary labels |
| `caption` | 12px | 500 | 1.4 | Badges, timestamps, metadata |
| `mono` | 13px | 400 | 1.5 | Time displays, durations |

---

## Spacing System

Base unit: 4px. Use multiples only.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Micro gaps |
| `space-2` | 8px | Tight padding |
| `space-3` | 12px | Component padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large gaps |
| `space-12` | 48px | Page padding |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 6px | Tags, pills, badges |
| `radius-md` | 8px | Buttons, inputs, dropdowns |
| `radius-lg` | 12px | Cards, panels |
| `radius-xl` | 16px | Modals, sheets |
| `radius-full` | 9999px | Avatars, toggle switches |

---

## Shadows

```css
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.5);
--shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.7);
--shadow-focus: 0 0 0 2px #6B6BF0;
--shadow-drag: 0 8px 24px rgba(0, 0, 0, 0.6);
```

---

## Layout

### App Shell

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)  │  Content Area (fluid)   │
│                   │                          │
│  Logo             │                          │
│                   │  Page content here       │
│  Nav items        │                          │
│  · Home           │                          │
│  · Today    ●     │                          │
│  · Week           │                          │
│  · Projects       │                          │
│  · Inbox    20    │                          │
│                   │                          │
│  ─────────────    │                          │
│  User avatar      │                          │
│  Settings         │                          │
└─────────────────────────────────────────────┘
```

- Sidebar: `240px` fixed, `bg-surface`, right border `border`
- Sidebar collapsed state: `64px` icon-only (toggle on hover or button)
- Content area: `calc(100vw - 240px)`, `bg-base`, `padding: 32px`
- Max content width: `1200px` centered within content area (for wide screens)

### Today Page Layout

```
┌────────────────┬─────────────────────────────┐
│  Inbox / Queue │  Timeline                    │
│  (40%)         │  (60%)                       │
│                │                              │
│  AI Brief      │  6:00 AM ─────────────────  │
│  ───────────   │  7:00 AM ─────────────────  │
│                │  8:00 AM  [Task block]        │
│  Task cards    │  9:00 AM ─────────────────  │
│  ···           │  10:00 AM [Task block]        │
│                │  ···                         │
└────────────────┴─────────────────────────────┘
```

### Week Page Layout

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬──────────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │ Waiting  │
│     │     │     │     │     │     │     │ List     │
│ 4h  │ 6h  │ 8h⚠ │ 3h  │ 5h  │     │     │          │
│     │     │     │     │     │     │     │ Unschd   │
│ [T] │     │ [T] │     │ [T] │     │     │ tasks    │
│ [T] │ [T] │ [T] │ [T] │     │     │     │ here     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴──────────┘
```

---

## Core Components

### Task Card (Inbox / Today variant)

```
┌──────────────────────────────────────────┐
│ ○  Task title goes here           2h    │
│    ● NEXUS  ● Design  +2 subtasks       │
└──────────────────────────────────────────┘
```

- Left: checkbox (circle, `border` color, `accent` on hover + complete)
- Title: `body-md`, `text-primary`
- Right: time estimate badge (`mono`, `caption`, `bg-card`, `radius-sm`)
- Bottom row: project tag pills (colored, `radius-sm`, 10% opacity bg) + subtask count
- Left border: 3px solid, project color
- Completed: checkbox fills `success`, title `line-through text-muted`
- Hover: `bg-hover`, subtle lift (`shadow-card`)

### Project Tag Pill

```
● NEXUS
```

- Color dot + project name
- `bg`: project color at 12% opacity
- `text`: project color
- `border-radius: radius-sm`
- `padding: 2px 8px`
- `font: caption, weight 500`

### Time Estimate Badge

```
2h 30m
```

- `font: mono, caption`
- `bg: bg-hover`
- `text: text-secondary`
- `border-radius: radius-sm`
- `padding: 2px 6px`

### Primary Button

```
┌──────────────────┐
│  + Create Project │
└──────────────────┘
```

- `bg: accent`, `text: white`, `radius: radius-md`
- `padding: 8px 16px`, `font: body-md weight 500`
- Hover: `bg: accent-hover`
- Focus: `shadow-focus`
- Disabled: `opacity: 0.4`, `cursor: not-allowed`

### Secondary Button

Same as primary but: `bg: bg-card`, `border: 1px solid border`, `text: text-primary`

### Input

```
┌──────────────────────────────────┐
│  Task name...                    │
└──────────────────────────────────┘
```

- `bg: bg-card`, `border: 1px solid border`, `radius: radius-md`
- `padding: 10px 14px`, `font: body-md`
- Focus: `border-color: accent`, `shadow-focus`
- Placeholder: `text-muted`

### Modal

- `bg: bg-card`, `radius: radius-xl`, `shadow-modal`
- Backdrop: `rgba(0,0,0,0.6)` with blur `backdrop-filter: blur(4px)`
- Max width: `560px`, centered
- Header: title `heading-md` + close button (X icon)
- Footer: action buttons right-aligned

### AI Indicator

When AI is generating:
- Subtle gradient border on the generating element: `accent` → `accent-muted` animated
- Sparkle icon (✦) in `accent` color
- "Generating..." text in `text-secondary`

---

## Icons

**Library:** Lucide React (`lucide-react` npm package)

Key icons:
- Home: `Home`
- Today: `CalendarCheck`
- Week: `CalendarDays`
- Projects: `FolderKanban`
- Inbox: `Inbox`
- Add: `Plus`
- Settings: `Settings`
- AI/Sparkle: `Sparkles`
- Drag handle: `GripVertical`
- Check: `Check`
- Close: `X`
- Arrow: `ChevronLeft`, `ChevronRight`
- Time: `Clock`
- Priority: `Flag`

Icon sizes: `16px` (inline), `20px` (nav), `24px` (page actions)

---

## Animations

```css
/* Standard transition — apply to all interactive elements */
transition: all 150ms ease;

/* Page mount */
animation: fadeSlideIn 200ms ease forwards;
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Drag placeholder */
.drag-placeholder {
  opacity: 0.4;
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
}

/* Task completion */
.task-completing {
  animation: scaleCheck 200ms ease;
}
@keyframes scaleCheck {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
```

Keep animations subtle. Never more than 300ms. No bounce, no spring physics.

---

## Responsive Targets

NEXUS is **desktop-first**. Mobile comes in N10.0.

| Breakpoint | Target |
|-----------|--------|
| 1280px+ | Primary target — all layouts optimized here |
| 1440px+ | Wider content, more comfortable spacing |
| 1920px+ | Max-width cap to prevent over-stretching |

At 1280px:
- Sidebar stays at 240px
- Content area stays fluid
- Split panels (Today) compress gracefully — no overflow

---

## Design System File Structure

```
src/
├── design/
│   ├── tokens.ts          ← All design tokens as CSS variables + TS constants
│   ├── typography.ts      ← Font scale constants
│   └── colors.ts          ← Color palette constants
├── components/
│   ├── ui/                ← Primitive components (Button, Input, Modal, Badge)
│   ├── layout/            ← Shell, Sidebar, PageHeader
│   ├── today/             ← Today page components
│   ├── week/              ← Week page components
│   ├── projects/          ← Projects page components
│   ├── home/              ← Dashboard card components
│   ├── inbox/             ← Inbox components
│   └── ai/                ← AI feature components
└── pages/
    ├── Home.tsx
    ├── Today.tsx
    ├── Week.tsx
    ├── Projects.tsx
    └── Inbox.tsx
```

---

## Do's and Don'ts

### Do
- Use design tokens everywhere — no hardcoded hex values in components
- Keep components small and single-purpose
- Test at 1280px width before any other size
- Show empty states for every list/view
- Use loading skeletons, not spinners, for async data
- Left-align text. Always.

### Don't
- No gradients on backgrounds (only on AI indicators)
- No drop shadows on text
- No more than 3 colors in any single view
- No centered text in lists or tables
- No auto-play animations
- No decorative icons — every icon must have a function

---

## Reference Screenshots (Nicholas's Inspiration)

| Reference | Key Takeaway |
|-----------|-------------|
| Structured | Time-based timeline, inbox + schedule side by side, ultra-clean |
| MS Planner | Project status cards, member assignment, board layout |
| TeamGantt | Multi-column day view, color-coded task blocks, waiting list |
| Sunsama | Day columns, time estimates, project tags, calm aesthetic |

**The NEXUS aesthetic sits between Sunsama (calm, personal) and Linear (precise, powerful). Never Jira.**
