---
name: "IPS Salud Integral · Gestión Documental"
description: "Internal document-management console for a healthcare provider — a calm navy-and-teal operations UI."
colors:
  primary: "#0a77a6"
  primary-deep: "#086a95"
  primary-foreground: "#ffffff"
  background: "#f7f8fa"
  foreground: "#111827"
  card: "#ffffff"
  muted: "#f0f2f5"
  muted-foreground: "#4b5563"
  secondary: "#f0f2f5"
  secondary-foreground: "#4b5563"
  accent: "#e8f6fd"
  accent-foreground: "#0369a1"
  border: "#e2e6ec"
  input: "#e2e6ec"
  ring: "#0a77a6"
  destructive: "#dc2626"
  success: "hsl(142 71% 36%)"
  warning: "#d97706"
  sidebar: "#1a2744"
  sidebar-foreground: "#ffffff"
  sidebar-muted: "rgb(255 255 255 / 0.6)"
  sidebar-accent: "rgb(10 119 166 / 0.32)"
  sidebar-accent-foreground: "#7dd3f7"
  sidebar-border: "rgb(255 255 255 / 0.08)"
typography:
  display:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.71875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
  micro:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.65625rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
  metric:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.25rem"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.25rem"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "2.25rem"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  nav-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.625rem"
  table-header:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
    padding: "0.625rem 1.5rem"
---

# Design System: IPS Salud Integral · Gestión Documental

## Overview

**Creative North Star: "The Clinic Front Desk"**

This is the interface of a competent institutional front desk in a healthcare
setting: someone who knows exactly where every document lives, answers quickly,
and never loses a file. A deep institutional navy carries authority and holds the
frame; a clean clinical teal signals action and care. Everything between is white
paper on a soft grey counter. Nothing is decorative — the personality is in the
precision.

The system is **Operate mode**: staff come to finish a task (upload, classify,
find, download), not to be impressed. Density is comfortable-professional, not
cramped and not airy-marketing. Screens follow one skeleton — a white header band
with breadcrumb, title and one-line description, then a centered working column
(max ~1152px) of white cards on the grey canvas. The reading experience is quiet
and scannable; the color does the pointing.

Two deliberate moves away from a generic admin template: surfaces carry **real,
standing elevation** (cards, the sidebar and dialogs are visibly layered at rest,
not flat rectangles separated only by hairlines), and controls feel **solid and
confident** — full-height targets, firm contrast, unambiguous affordances. The one
rejected direction is "SaaS marketing dashboard": no gradient hero cards, no
multi-color chart candy, no illustration in the working screens.

The system ships **a single light theme.** There is no dark mode; the palette,
elevation and browser-surface tokens are all defined for light only.

**Key Characteristics:**
- Navy frame, white paper, one teal accent — a three-value system.
- One consistent page skeleton: header band + centered working column.
- Standing elevation: surfaces are layered at rest, hover adds one more step.
- Uppercase micro-labels for all metadata; body copy never shouts.
- Solid controls (2.25rem / h-9) on a unified 10px corner radius.
- Every management table ends in a right-aligned `⋯` actions column.
- Destructive actions always route through one centered confirm dialog.

## Colors

A restrained three-value palette — institutional navy, clinical teal, and neutral
paper — with saturated hues reserved for status only.

### Primary
- **Clinical Teal** (`#0a77a6`): the only saturated color in a working screen.
  Primary buttons, links, active navigation, focus rings, selection highlight,
  and small "this is interactive / this is now" cues. Its scarcity is what makes
  it read as a signal. Tuned from the incumbent `#0b8fc9` so white text and
  `text-primary` links clear WCAG AA (≥4.7:1 on both the white card and the grey
  canvas).
- **Teal Deep** (`#086a95`): hover/active state for teal surfaces. Replaces the
  incumbent opacity-based `primary/90` hover with a solid darker step.
- **Accent Wash** (`#e8f6fd`) with **Accent Ink** (`#0369a1`): tint fills behind
  teal icons and quiet informational chips.

### Neutral
- **Ink** (`#111827`): all primary text. Never use pure `#000`.
- **Paper** (`#ffffff`): every card, panel, table and dialog surface.
- **Counter Grey** (`#f7f8fa`): the app canvas the paper sits on.
- **Muted Surface** (`#f0f2f5`): secondary buttons, inset rows, skeletons.
- **Muted Ink** (`#4b5563`): secondary text, table-header labels, meta.
- **Hairline** (`#e2e6ec`): borders, dividers, input strokes. Present but never
  the primary means of separating a surface — elevation does that.

### Institutional Navy (chrome only)
- **Institutional Navy** (`#1a2744`): the sidebar, and the full-bleed backdrop of
  the auth screens. It is the frame around the product, never a fill inside the
  content canvas.
- **Navy sub-tones**: `sidebar-foreground` `#ffffff`, `sidebar-muted`
  `rgb(255 255 255 / 0.6)` for secondary nav text, `sidebar-accent`
  `rgb(10 119 166 / 0.32)` behind the active nav item with
  `sidebar-accent-foreground` `#7dd3f7` text, `sidebar-border`
  `rgb(255 255 255 / 0.08)` for the internal rules.

### Status (never decorative)
- **Danger** (`#dc2626`): destructive buttons, error text, invalid fields.
- **Success** (`hsl(142 71% 36%)`): confirmation only.
- **Warning** (`#d97706`): caution states only.
- **Info** shares Clinical Teal (`#0a77a6`).

### Named Rules
**The Navy Frame Rule.** Navy appears only as chrome — the sidebar and the auth
backdrop. It never fills a card, section, or surface inside the content canvas.

**The One Teal Rule.** Clinical Teal covers ≤10% of any working screen: the
primary action, the active nav item, focus, selection. If a second element wants
teal, one of them is not actually primary.

**The Status-Only Rule.** Red, green and amber are outcomes, not styling. A button
is teal or neutral unless its job is to destroy something.

## Typography

**Display / Body / Label Font:** DM Sans (with `ui-sans-serif, system-ui,
-apple-system, "Segoe UI", sans-serif` fallback). One family, weights 400 / 500 /
600 / 700. No serif, no mono.

**Character:** DM Sans is geometric but slightly humanist — modern and crisp
without feeling cold or techy. Hierarchy is carried by weight and a tight
negative tracking on headings, not by many sizes.

### Hierarchy
- **Display** (700, `1.875rem` / 30px, line-height 1.1, `-0.02em`): the one
  welcome/greeting headline per landing screen. `tabular-nums` when it is a metric.
- **Headline** (700, `1.375rem` / 22px, 1.2, `-0.01em`): auth card titles, major
  empty states.
- **Title** (600, `1.125rem` / 18px, 1.3, `-0.01em`): page `<h1>` in the header
  band, section headers. Card titles step down to 16px / 600.
- **Body** (400, `0.875rem` / 14px, 1.5): all running text, table cells, form
  values. Descriptions and meta drop to 12–13px in muted ink.
- **Label** (600, `0.71875rem` / 11.5px, `0.06em`, UPPERCASE): table column
  headers, eyebrows, stat captions.
- **Micro** (600, `0.65625rem` / 10.5px, `0.06em`): the `--text-micro` token —
  sidebar section headers (uppercase, wider tracking, at 55% white) and the
  smallest inline badges (role chips inside a table cell).
- **Metric** (700, `1.75rem` / 28px, `tabular-nums`): the `--text-metric` token —
  dashboard stat-card values only.

### Named Rules
**The Uppercase Label Rule.** Metadata is uppercase, ~11px, 600, letter-spaced:
table headers, eyebrows, stat captions, sidebar sections. Running text, buttons
and links are never uppercase.

**The Weight-Not-Size Rule.** Seven sizes ship — five running roles (display,
headline, title, body, label) plus `micro` and `metric` for two specific jobs.
New emphasis comes from 400 → 600 → 700 and from muted vs. ink color, not from an
eighth size.

## Layout

- **Shell:** fixed 224px (`w-56`) navy sidebar on `md+`, collapsing to a sheet
  behind a menu button below `md`. The content area is a single flex column that
  owns its own scroll; the shell never scrolls.
- **Page skeleton:** a white header band (`bg-card`, bottom hairline,
  `px-4 sm:px-6 lg:px-7`, `py-4`) containing breadcrumb → `<h1>` → one-line
  description, then a centered working column: `max-width: 72rem` (1152px, some
  narrower screens use 64rem), `px-4 sm:px-6 lg:px-7`, `py-4 sm:py-6 lg:py-7`,
  vertical rhythm `gap-6` (24px) between blocks.
- **Grids:** card grids are `gap-3` (12px), `sm:grid-cols-2 lg:grid-cols-4` for
  stat rows, `md:grid-cols-2 lg:grid-cols-3` for action cards.
- **Spacing rhythm:** 4px base. Common steps 8 / 12 / 16 / 24 / 32. Card interior
  padding is 24px (`p-6`); table cells are `0.625rem` vertical × `1.5rem`
  horizontal.
- **Density:** comfortable-professional. Table rows ~40px, controls 40px, not the
  compressed 32px of a data-heavy admin nor the 56px of a marketing site.

## Elevation & Depth

This system uses **standing elevation** — a hybrid that leans on real shadows.
Surfaces are layered at rest, and hover adds one step rather than introducing the
first. This is a deliberate move past the near-flat incumbent, chosen to make the
navy frame / white paper separation unmistakable.

### Shadow Vocabulary
- **Raised** (`box-shadow: 0 1px 2px rgb(17 24 39 / 0.04), 0 2px 8px rgb(17 24 39 / 0.06)`):
  the resting state of every card, panel and table container on the grey canvas.
- **Detached Frame** (`box-shadow: 2px 0 12px rgb(17 24 39 / 0.06)` on the right
  edge, plus the sidebar border): lifts the navy sidebar off the content area.
- **Overlay** (`box-shadow: 0 8px 24px rgb(17 24 39 / 0.12)`): dropdown menus,
  popovers, the mobile nav sheet.
- **Modal** (`box-shadow: 0 24px 64px rgb(0 0 0 / 0.28)`): centered dialogs and
  the auth card. The strongest step; signals "resolve this before continuing."
- **Hover Lift**: interactive cards add `translateY(-2px)` and step from Raised to
  Overlay on hover; they never start flat.

### Named Rules
**The Standing Depth Rule.** Elevation exists at rest — card = Raised, sidebar =
Detached Frame, dialog = Modal. Hover moves a surface one step up the ladder; it
is never what makes a surface leave the page for the first time.

**The Hairline-Plus-Shadow Rule.** A resting surface keeps its 1px `#e2e6ec`
border *and* its Raised shadow. The border defines the edge crisply; the shadow
does the lifting.

## Shapes

- **Corner radius:** unify on the `--radius` token = **10px**. Controls (buttons,
  inputs, menus, nav items) use 10px; containers (cards, dialogs, sheets) use
  12–16px; badges, avatars and status dots are fully round.
- **Incumbent note:** shadcn primitives currently render Tailwind's 6px
  `rounded-md`. New work standardizes on 10px; treat 6px as legacy to migrate.
- **Borders:** 1px, `#e2e6ec`, on every resting surface and input. Focus swaps the
  border to teal and adds a 3px `rgb(10 119 166 / 0.5)` ring.
- **Silhouette:** rectangular and calm. The one recurring motif is the small
  rounded-square brand tile (34–42px, 10px radius, teal fill, "IPS" in extrabold
  white) — it stands in for the absent logo in the sidebar and auth card.

## Components

### Buttons
- **Shape:** 10px radius (`{rounded.md}`), 2.25rem (36px) tall by default, `sm`
  variant 2rem, `lg` 2.5rem, icon 2.25rem square. Text 14px / 500, never
  uppercase, 8px gap to a 16px icon.
- **Primary:** solid Clinical Teal (`#0a77a6`) fill, white text, `0 1.25rem`
  horizontal padding. Hover → Teal Deep (`#086a95`). The one high-emphasis action
  per view.
- **Secondary:** Muted Surface (`#f0f2f5`) fill, muted-ink text. For "cancel" and
  secondary paths.
- **Outline:** white fill, hairline border, ink text; hover fills Accent Wash.
- **Ghost:** no fill at rest; hover fills Accent Wash. Used for row/toolbar
  actions and the sidebar logout.
- **Destructive:** solid Danger (`#dc2626`), white text. Only for actions that
  delete.
- **Focus:** border → teal, plus 3px `ring-ring/50` halo. **Disabled:** 50%
  opacity, no pointer events. **Loading:** leading spinner, control disabled.

### Inputs / Fields
- **Style:** white fill, 1px `#e2e6ec` border, 10px radius, 2.25rem tall, `0.75rem`
  horizontal padding, 14px text, muted-ink placeholder.
- **Focus:** border → teal (`#0a77a6`) + 3px `rgb(10 119 166 / 0.5)` ring; smooth
  `color, box-shadow` transition.
- **Error:** `aria-invalid` → border Danger + `rgb(220 38 38 / 0.2)` ring, with an
  error message in Danger text below.
- **Disabled:** 50% opacity, `not-allowed` cursor.
- Native `<select>` for page-size and simple pickers keeps the same border/radius
  at 2rem height.

### Cards / Containers
- **Corner:** 12px (`{rounded.lg}`); the auth card goes to 16px.
- **Background:** Paper white on the Counter Grey canvas.
- **Elevation:** Raised at rest (see Elevation). Action cards add Hover Lift
  (`-translate-y-0.5` + step to Overlay).
- **Border:** 1px Hairline, kept alongside the shadow.
- **Padding:** 24px (`p-6`); vertical `gap-6` between header/content/footer.
- **Stat card:** uppercase 11px caption → 28px bold `tabular-nums` value → one
  muted 12px line with a 16px teal icon.

### Navigation (sidebar)
- **Container:** Institutional Navy, 224px, three zones — brand tile block (top,
  bottom border), scrolling link list, user/logout footer (top border).
- **Section headers:** uppercase 10.5px, `0.1em` tracking, 35% white.
- **Link (rest):** 13.5px / 500, `sidebar-foreground` at 60%, 16px icon at 90%
  opacity, `0.5rem 0.625rem` padding, 10px radius.
- **Link (hover):** background `rgb(255 255 255 / 0.07)`, text to 90%.
- **Link (active):** background `sidebar-accent` (teal 25%), text
  `sidebar-accent-foreground` (`#7dd3f7`).
- **Mobile:** identical list inside a left `Sheet` (Overlay shadow), triggered
  from a `bg-card` top bar that also shows the brand tile and the user email.

### Badges / Chips
- **Style:** fully round, `0.125rem 0.5rem` padding, 12px / 500 text, transparent
  border by default.
- **Variants:** `default` teal fill / white; `secondary` muted fill / muted ink;
  `outline` hairline border / ink; `destructive` Danger / white. Used for role
  names, category tags and counts — not as buttons.

### Data Table
- **Header row:** bottom hairline, cells uppercase 11.5px / 600 / `0.06em` in
  muted ink, `0.625rem 1.5rem` padding, left-aligned except a right-aligned
  **Acciones** column.
- **Body rows:** 14px, bottom hairline per row, first cell an optional 16px
  checkbox, last cell a `⋯` dropdown trigger (ghost icon button → Overlay menu).
- **Selection bar:** when rows are checked, a `bg-muted/60` strip appears above
  the table with the count and bulk actions (export, delete).
- **Empty state:** centered in a `p-10` cell — 14px ink "No hay resultados" + a
  muted 14px hint.
- **Footer:** wrap row with "Mostrando X–Y de N", a page-size `<select>`, and
  prev/next outline buttons.
- Lives inside a Raised card container; the table itself has `overflow-x-auto`.

### Confirm Destructive Dialog (signature)
- The single pattern for every destructive confirmation (delete document, user,
  category, tag). Centered `AlertDialog`, Modal shadow, ~16px radius.
- Title in Title style, description in body/muted, then a right-aligned button
  pair: Secondary "Cancelar" + Destructive confirm (label switches to
  "Eliminando…" and disables while pending).
- Never inline, never a slide-over, never a toast-with-undo in place of the
  dialog.

## Do's and Don'ts

### Do:
- **Do** keep the one page skeleton: white header band (breadcrumb → h1 →
  description) then a centered `max-w-6xl` working column of white cards.
- **Do** reserve Clinical Teal (`#0a77a6`) for the primary action, active nav,
  focus and selection — ≤10% of a screen.
- **Do** give every surface standing elevation (Raised for cards, Detached Frame
  for the sidebar, Modal for dialogs) *and* keep its 1px hairline.
- **Do** set metadata — table headers, eyebrows, stat captions, sidebar sections
  — in uppercase ~11px / 600 / letter-spaced.
- **Do** use `tabular-nums` for every count, size and page number.
- **Do** end every management table with a right-aligned **Acciones** column
  whose trigger is a `⋯` ghost icon button.
- **Do** route every destructive action through the centered Confirm Destructive
  Dialog.
- **Do** keep new controls at 2.25rem (h-9) on the 10px radius; the shared
  `<Input>`, `<Select>`, `<Textarea>` and `<Button>` already agree on it.

### Don't:
- **Don't** put Institutional Navy anywhere inside the content canvas — it is
  sidebar and auth backdrop only.
- **Don't** introduce a second accent hue in Operate screens; red / green / amber
  are status outcomes, not styling.
- **Don't** use pure black — text is Ink `#111827`.
- **Don't** ship flat cards separated only by hairlines; the chosen direction is
  permanent depth.
- **Don't** uppercase body text, buttons or links.
- **Don't** mix corner radii ad hoc — controls 10px, containers 12–16px, pills
  full.
- **Don't** add gradients, hero imagery or illustration to the working screens.
  The auth screen's radial teal glow is the one sanctioned exception, scoped to
  `(auth)`.
- **Don't** replace the Confirm Destructive Dialog with an inline or slide-over
  confirmation.
- **Don't** add `dark:` variants or reach for `next-themes`. The app is
  light-only; a dark variant with no dark token behind it is dead code.
