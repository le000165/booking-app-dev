# FrontBeach — AI Project Rules

## Product

FrontBeach is a modern multi-tenant booking SaaS.

The product is:

- web-first
- desktop-first
- calendar-centric
- professional enterprise SaaS

Do not design this like a mobile app.

Mobile responsiveness is required, but desktop UX is the priority.

---

# Core UX Philosophy

The UI should feel:

- modern
- clean
- professional
- premium
- calm
- minimal
- production-ready

Target quality:

- Square
- Linear
- Notion
- Vercel

Do NOT copy branding or exact layouts.

---

# Primary UX Priorities

1. Calendar readability
2. Booking workflow efficiency
3. Consistent spacing
4. Strong visual hierarchy
5. Minimal cognitive load
6. Professional typography
7. Fast scanning
8. Clean desktop workspace

---

# Design Direction

## Workspace

- White or very light gray workspace
- Clean uninterrupted surfaces
- Minimal visual noise
- Spacious but efficient layout density

## Sidebar

- Fixed expanded desktop sidebar
- Simple professional navigation
- Business name at top
- Minimal icons
- Clear hierarchy
- Subtle hover states
- Avoid excessive active-state colors

## Calendar

The calendar is the most important screen.

Requirements:

- maximize usable width
- clean sticky headers
- readable time labels
- balanced spacing
- subtle grid lines
- compact but readable appointments
- clear staff/date hierarchy

Today highlighting:

- only tint the schedule grid body
- never tint sticky headers

## Typography

Typography should feel:

- enterprise
- modern
- highly readable

Avoid:

- tiny fonts
- oversized headings
- inconsistent scales

Use:

- medium/semibold hierarchy
- darker text for readability
- restrained typography scale

## Spacing

Spacing must feel intentional and balanced.

Avoid:

- random padding
- oversized whitespace
- cramped toolbars
- inconsistent margins

Always audit:

- top vs bottom spacing balance
- toolbar spacing
- card density
- alignment rhythm

---

# Visual Rules

## Avoid

- warm/yellow themes
- excessive gradients
- glassmorphism
- oversized shadows
- oversized border radius
- mobile-app styling
- floating card overload
- colorful dashboards
- inconsistent button sizing
- random redesigns

## Prefer

- subtle borders
- restrained shadows
- clean alignment
- minimal surfaces
- consistent button heights
- desktop SaaS density
- calm neutral colors

---

# Engineering Rules

Do NOT:

- break existing APIs
- change database logic
- remove existing functionality
- redesign unrelated components

Always:

- preserve behavior
- refactor incrementally
- explain implementation phases
- reuse existing components where possible

---

# Frontend Architecture

Primary files:

- src/components/layouts/AdminShell.tsx
- src/components/admin/AdminDashboardClient.tsx
- src/components/admin/WeekCalendar.tsx
- src/app/globals.css

Always audit these before major UI changes.

---

# AI Workflow Rules

Claude:

- UX planning
- audits
- spacing systems
- hierarchy
- implementation planning

Codex:

- implementation
- refactoring
- TypeScript fixes
- component cleanup

Gemini Flash:

- quick debugging
- small fixes
- fast iteration

Opus:

- final UX review only

---

# Important

Do NOT redesign pages independently.

Maintain:

- consistent spacing
- consistent typography
- consistent hierarchy
- consistent navigation
- consistent interaction patterns

The entire SaaS must feel like one cohesive product.

# AgentMemory Rules

Use AgentMemory for durable project context only.

Remember:

- stable architecture decisions
- completed phases/sprints
- recurring bugs and fixes
- UI/UX preferences
- naming conventions
- database schema decisions

Do not remember:

- secrets
- API keys
- temporary debugging logs
- one-off experiments
- personal/private information

Before major work, search memory for relevant project context.
After completing work, save a short summary of what changed, what passed, and what remains.
