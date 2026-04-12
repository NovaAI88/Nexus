# NEXUS — Product Concept v1.0

**Status:** Approved by Nicholas — 2026-04-12
**Next step:** Write build plan → phase briefs → ATLAS execution

---

## What It Is

A personal + team planning OS. Beautiful enough for daily personal use. Powerful enough for entrepreneurs managing projects and small teams.

Not another project tool. Not another calendar. A single place where your day, your projects, and your team stay in sync — and AI does the heavy lifting of figuring out what you should be working on.

---

## The User

**Two tiers, one product.**

**Personal** — entrepreneurs, freelancers, high-performers who need to run their day with clarity. Today's tasks, this week's focus, their projects — all in one view. No team features unless they want them.

**Team / Enterprise** — same person, but they're managing 2–10 people. Project status, task assignment, timelines, who's doing what today. Small to mid-size teams who've outgrown Notion and find ClickUp overwhelming.

---

## The Core UI — 5 Pages

### 1. Today (Primary View)

Inspired by: **Structured + Sunsama**

Split layout:
- **Left panel** — Inbox / Task Queue. Unscheduled tasks pulled from all active projects. Drag to schedule.
- **Right panel** — Timeline. Hour-by-hour day view. Tasks dropped into time slots. Calendar events shown inline (Google Cal / Outlook integration).

Each task shows: project tag (color-coded), time estimate, subtasks toggle, completion checkbox.

At the top: **AI Morning Brief** — "You have 3 tasks carrying over from yesterday. Your heaviest day is Thursday. Here's what I recommend for today." One button to accept the plan.

This is the page users open every morning. It should feel like a calm command center, not a todo list.

---

### 2. Week

Inspired by: **Sunsama + TeamGantt**

Multi-column layout — one column per day (Mon–Sun).

Each day column shows: scheduled tasks with time estimates, total hours loaded, color-coded project tags.

**For teams:** Switch between Personal Week and Team Week. Team Week shows one column per team member. See who's overloaded, who has capacity. Drag tasks between people.

Right panel: **Waiting List** — tasks not yet scheduled for the week. Pull them in as capacity opens.

---

### 3. Projects

Inspired by: **MS Planner + TeamGantt**

Board + Timeline toggle.

**Board view** — Kanban columns per project. Status columns: Not Started / In Progress / Review / Done. Each card shows assignee avatar, due date, priority tag, task count.

**Timeline view** — Gantt-style. Projects on the left axis, horizontal bars showing duration. Drag to reschedule. Dependencies shown as connectors. Color = project.

Project health summary at the top of each project: % complete, tasks overdue, team capacity.

**AI Project Builder** — This is the differentiator (see below).

---

### 4. Home / Dashboard

Inspired by: **MS Planner dashboard cards**

Clean overview — not a page you live in, a page you glance at.

Cards:
- Today's task count + time loaded
- This week's project progress (mini progress bars per project)
- Team snapshot — who's blocked, who's heads-down
- Revenue or goal metric (optional, user-defined KPI)
- Upcoming deadlines in the next 7 days

Clean. Scannable. One-glance status.

---

### 5. Inbox / Capture

Fast capture. Drop thoughts, tasks, ideas here. No project, no date, no pressure.

AI processes these in the background and asks: "This looks like it belongs to NEXUS. Should I add it as a task under Phase 2?"

Inbox zero is the goal. Everything either gets scheduled, assigned to a project, or archived.

---

## The AI Layer — Core Differentiator

**AI Project Generator**

You give NEXUS a project name and a goal. AI generates:
- Full task list with subtasks
- Suggested timeline
- Dependencies
- Team assignments (if team plan)

Example: "Launch Shopify app — 90 days." → AI returns a structured project plan ready to review and adjust.

**AI Daily Planner**

Every morning, AI reviews:
- Incomplete tasks from yesterday
- Deadlines in the next 7 days
- Your calendar events (blocks)
- Your team's capacity

It generates a recommended day plan. You accept, adjust, or ignore it. One click to apply.

**AI Weekly Review** (Friday or Monday)

"You completed 14 of 18 tasks. NEXUS project is 3 days behind. Team capacity is tight next week — consider pushing the design review." Actionable, not just a report.

---

## Pricing

| Tier | Price | What It Gets You |
|------|-------|------------------|
| **Free** | €0 | Today view, 3 active projects, no team features, no AI |
| **Personal** | €8/month | All pages, unlimited projects, AI daily planner + weekly review |
| **Team** | €20/user/month | Everything in Personal + team week view, task assignment, project health, AI project generator |
| **Enterprise** | Custom | SSO, admin controls, audit logs, custom integrations |

---

## What Gets Removed / Rebuilt

**Remove:** Revenue dashboard (company-internal, not product-relevant), Agents page as-is, History in its current form.

**Rebuild as new:** Home (into dashboard cards), Today (full Structured-style layout), Week (multi-column with team toggle), Projects (board + Gantt), Inbox (fast capture).

---

## What Makes This Winnable

Most planning tools are either beautiful but shallow (Structured, Sunsama) or powerful but ugly and overwhelming (ClickUp, Asana). Nothing in the mid-market hits the intersection of:

- Beautiful daily use
- Real project/team power
- AI that actually plans for you

That's NEXUS. The AI layer is the moat — not the AI novelty, but that it reduces the daily friction of "what should I actually work on right now?"

---

## Strategic Notes

- Sunsama charges €16/month for a beautiful day planner with no team or project depth. NEXUS goes above them on enterprise, competes on personal UX.
- The AI project generator is the biggest risk and the biggest upside. Get this right first.
- Build Today and Projects before anything else. Those are the core pages.
- Team features should be pulled by real user demand, not pushed by the roadmap.

---

## Reference Inspiration

| Source | What We Take From It |
|--------|----------------------|
| Structured | Time-based day view, inbox + timeline split, clean minimal aesthetic |
| MS Planner | Project status cards, member assignment, board layout |
| TeamGantt | Multi-person day columns, color-coded task blocks, waiting list panel |
| Sunsama | Day columns with task lists + time estimates, subtasks, project tags, calendar integration |
