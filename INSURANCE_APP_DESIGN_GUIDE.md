# Insurance App Design Guide

## Purpose

This document defines the current visual and interaction system for the Insurance App so future pages, forms, dashboards, tables, modals, and admin workspaces stay consistent.

It is based on the live code implementation in this repository, especially:

- [src/styles/globals.css](/abs/path/C:/AI-Insuarance-App/src/styles/globals.css:1)
- [src/components/ui/Button.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Button.tsx:1)
- [src/components/ui/Input.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Input.tsx:1)
- [src/components/ui/Select.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Select.tsx:1)
- [src/components/ui/Card.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Card.tsx:1)
- [src/components/ui/Badge.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Badge.tsx:1)
- [src/components/ui/Tabs.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Tabs.tsx:1)
- [src/components/ui/DataTable.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/DataTable.tsx:1)
- [src/components/layout/TopHeader.tsx](/abs/path/C:/AI-Insuarance-App/src/components/layout/TopHeader.tsx:1)

## Design Direction

The product style is:

- premium but not flashy
- soft enterprise insurance UI
- rounded modern surfaces
- bright light mode with strong contrast
- dark mode that remains readable and calm
- data-dense, but with enough spacing to avoid looking crowded

The app should feel:

- professional
- executive-ready
- structured
- interactive
- consistent across all workspaces

## Theme Tokens

Defined in [src/styles/globals.css](/abs/path/C:/AI-Insuarance-App/src/styles/globals.css:1).

## Core palette

### Light mode tokens

- `--background: 220 43% 98%`
- `--foreground: 222 47% 8%`
- `--surface: 0 0% 100%`
- `--surface-soft: 216 100% 99%`
- `--surface-muted: 214 45% 96%`
- `--border: 214 30% 88%`
- `--border-soft: 214 32% 93%`
- `--primary: 218 70% 44%`
- `--primary-light: 217 91% 60%`
- `--primary-dark: 224 64% 33%`
- `--secondary: 246 90% 67%`
- `--success: 160 80% 31%`
- `--warning: 38 92% 50%`
- `--danger: 0 84% 60%`
- `--info: 190 90% 38%`
- `--muted: 215 32% 94%`
- `--muted-foreground: 215 15% 42%`
- `--field-surface: 216 65.79% 92.15%`

### Dark mode tokens

- `--background: 210 65% 8%`
- `--foreground: 214 100% 96%`
- `--surface: 211 64% 12%`
- `--surface-soft: 209 61% 16%`
- `--surface-muted: 209 58% 18%`
- `--border: 207 48% 23%`
- `--border-soft: 207 46% 25%`
- `--primary: 217 91% 60%`
- `--primary-light: 213 94% 68%`
- `--primary-dark: 224 76% 48%`
- `--secondary: 258 90% 66%`
- `--success: 160 84% 39%`
- `--warning: 43 96% 56%`
- `--danger: 0 91% 71%`
- `--info: 188 86% 53%`
- `--muted: 210 50% 18%`
- `--muted-foreground: 212 24% 73%`
- `--field-surface: 209 44% 24%`

## Practical color usage

### Primary blue

Use for:

- primary actions
- active tabs
- key icons
- main selected states
- navigation active states
- focus accents

### Secondary violet

Use for:

- supporting highlight states
- AI/secondary capsule variants
- category accents when blue is already dominant

### Success green

Use for:

- approved / active / healthy states
- success toasts
- completed progress or positive metrics

### Warning amber

Use for:

- pending states
- caution notices
- review-needed chips

### Danger red

Use for:

- destructive actions
- rejected states
- missing required information
- risky or blocked values

### Info cyan

Use for:

- informational tags
- neutral performance indicators
- supporting analytics accents

## Typography

## General rule

The app uses clean sans-serif system styling with a slightly compact enterprise rhythm. Body text is intentionally modest so the UI can fit dense insurance operations data without becoming oversized.

## Typography scale in practice

- App eyebrow labels: `12px`, uppercase, bold, increased tracking
- Standard form labels / helper labels: `11px` to `12px`, uppercase or subdued
- Body text: `13px` to `14px`
- Primary page/workspace headings: `17px` to `20px`
- Card titles: `14px` to `16px`
- Table headers: `12px`, uppercase, bold
- Button text: `12px` to `14px`, semibold/bold

## Typography rules

- Keep headings compact, not oversized
- Use uppercase eyebrow text sparingly for section framing
- Use muted text for supporting context, never for primary record identity
- Avoid large paragraph blocks unless used in summary cards, AI summaries, or document/email previews

## Layout System

## Global app shell

The shell consists of:

- fixed left sidebar
- sticky top header
- scrollable content region

The shell must always feel stable while pages underneath update independently.

## Spacing rhythm

Common spacing values across the app:

- 4px to 8px for very tight internal spacing
- 12px to 16px for form control spacing
- 20px to 24px for card padding
- 28px to 32px for section separation

## Corner radius language

The app uses soft rounded geometry:

- cards: around `22px`
- inputs: around `14px`
- tabs: `16px` to `20px`
- buttons: mostly pill or near-pill
- modals/popovers: `18px` to `24px`

Use rounded values consistently. Avoid sharp rectangles.

## Form Design

## Form field background

All primary form fields should use the shared field surface:

- `hsl(216deg 65.79% 92.15% / 79%)` in light mode
- dark mapped token through `--field-surface`

This is exposed via the shared utility:

- `.form-field-surface`

This is a core design rule and should remain consistent across:

- inquiry edit
- quote edit
- product edit
- business rule forms
- account/contact forms
- template modals

## Input component

Defined in [src/components/ui/Input.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Input.tsx:1).

Current structure:

- height: `42px`
- radius: `14px`
- border: standard border token
- surface: `form-field-surface`
- text size: `sm`
- focus:
  - border primary
  - `ring-4`
  - `primary/10`

### Input usage rules

- Use for single-line text, email, phone, number, search
- Do not switch to plain white fields unless a special preview/editor experience requires it
- Keep labels outside the field, not floating inside

## Textareas

Should follow the same field-surface visual system:

- same border family
- same focus ring
- same radius family
- comfortable vertical padding

For AI response editing or notes:

- allow taller min-height only where content really needs it
- avoid oversized empty textarea areas

## Select / dropdown design

Defined in [src/components/ui/Select.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Select.tsx:1).

### Trigger

- height: `48px`
- radius: `12px`
- uses field surface
- white/soft neutral text area
- subtle shadow
- chevron icon on right

### Dropdown content

- white background in light mode
- dark slate in dark mode
- rounded `2xl`
- border with soft shadow
- options with hover/active tint rather than browser-native look

### Dropdown rules

- Never use native ugly browser select styling for main app forms
- Keep dropdown width aligned to trigger
- Keep hover state soft
- Selected item should be clear but not too loud
- Avoid bold placeholder emphasis that competes with real values

## Form sections

Forms across the app usually follow:

- section title
- grouped fields
- 2-column or 3-column responsive grid
- optional long-text field full width

### Preferred field grouping

- Details
- Risk
- Premium
- Contact Information
- Address Information
- Operational Summary
- Template Settings

### Full-width rows

Use full-width rows for:

- AI summaries
- risk summary
- rich text content
- long descriptions
- document/email body

## Buttons

Defined in [src/components/ui/Button.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Button.tsx:1).

## Variants

- `primary`
- `secondary`
- `outline`
- `ghost`
- `destructive`
- `ai`

## Sizes

- `sm`
- `md`
- `lg`
- `icon`

## Button rules

### Primary

Use for:

- Save
- Create
- Confirm
- Main form action

Visual:

- blue fill
- white text
- glow/shadow accent

### Secondary / outline

Use for:

- edit toggle
- supporting actions
- modal secondary actions
- alternative actions in headers

### Ghost

Use for:

- header icon buttons
- lightweight contextual controls
- icon-only interactions

### AI

Use only inside AI-specific sections when the action belongs to AI-derived workflow.

## Button behavior

- rounded-full or soft-pill by default
- compact but not cramped
- hover should be clear
- active state may slightly scale down
- disabled state should visibly lower opacity

## Cards

Defined in [src/components/ui/Card.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Card.tsx:1).

## Base card language

- rounded `22px`
- border with soft token
- white surface in light mode
- dark surface in dark mode

## Variants

- `default`
- `premium`
- `glass`
- `interactive`

## Card usage patterns

### Default card

Use for:

- form sections
- simple content containers
- standard panels

### Premium card

Use for:

- important data tables
- hero metric panels
- stronger elevated modules

### Glass card

Use for:

- overlays
- blur-enhanced hero panels
- premium timeline/popup surfaces

### Interactive card

Use for:

- selectable records
- dashboards where hover elevation is useful
- tiles that open detail pages

## Tables

Defined in [src/components/ui/DataTable.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/DataTable.tsx:1).

## Table container

- wrapped inside premium card
- soft border
- horizontal overflow supported

## Table header

- muted light surface background
- uppercase header labels
- bold text
- increased letter spacing

## Table rows

- white background
- soft border separators
- subtle hover tint using primary color

## Table rules

- Use hyperlink navigation in key identity columns instead of separate “View” buttons where possible
- Preserve table header on empty states when filtering is involved
- Empty state should appear inside the table if context matters
- Column filters should open as small anchored popovers, not full-width filter blocks

## Recommended table columns

Keep the first column for:

- primary record name
- version
- identifier

Use capsules/chips in table cells for:

- category
- status
- inquiry type
- property
- review state

## Badges, Tags, and Capsules

Defined in [src/components/ui/Badge.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Badge.tsx:1).

## Built-in variants

- `new`
- `review`
- `approved`
- `rejected`
- `pending`
- `info`
- `neutral`

## Badge rules

- Keep them small
- Use rounded-full
- Use subtle tinted background with matching text and border
- Avoid heavy shadows
- Keep one clear purpose per capsule

## Common app capsule usage

- status
- category
- property
- inquiry type
- template state
- imported tags
- AI category tags

## Status color guidance

- New: blue
- Review: violet
- Approved/Active: green
- Rejected/Declined: red
- Pending: amber
- Neutral/info: gray or cyan depending on context

## Tabs

Defined in [src/components/ui/Tabs.tsx](/abs/path/C:/AI-Insuarance-App/src/components/ui/Tabs.tsx:1).

## Tab container

- full width
- rounded `20px`
- soft border
- white surface
- slim padded container

## Tab trigger

- min height around `44px`
- icon + label pattern supported
- active state fills with primary blue
- inactive state uses muted foreground

## Tab rules

- Use these full-width tabs for record workspaces
- Do not use them for small filter pills
- Pair each tab with a relevant icon when possible
- Keep labels short

## Where these tabs should be used

- Inquiry workspace
- Quote workspace
- Product editor
- Account workspace
- any primary record edit experience with multiple subviews

## Header Design

## Top app header

Defined in [src/components/layout/TopHeader.tsx](/abs/path/C:/AI-Insuarance-App/src/components/layout/TopHeader.tsx:1).

Current rules:

- sticky
- translucent gradient background
- blurred backdrop
- compact title stack on left
- actions on right

### Right-side controls

- page refresh button
- theme toggle
- user/profile/role dropdown

### Profile dropdown

- compact trigger with moderate radius
- not overly rounded
- role shown inside trigger
- dropdown uses white/light surface with structured sections

## Record workspace headers

For Inquiry, Quote, Product, Business Rule, Account, Contact, and Policy workspaces:

- keep height compact
- record title should be the strongest text
- metadata line should be short and secondary
- action buttons should not overcrowd the header
- summary widgets must not dominate the header height

## Sidebar Design

The sidebar should feel:

- fixed
- dark, premium, and calm
- scrollable when content is long
- scrollbars hidden when possible

## Sidebar rules

- keep section labels uppercase and subtle
- active nav item uses primary highlight
- icons should be small and consistent
- profile block at bottom should feel like part of the shell, not a separate app

## Dashboard Design

## Layout rules

- hero section first
- then 2-column component layout
- each main analytic component should usually fit `col-6 / col-6`

## Dashboard hero

Should include:

- welcome/title
- supporting context line
- subtle background illustration or low-opacity icon treatment
- not too many stacked cards

## Dashboard cards

Avoid:

- too many similar KPI cards with the same visual weight
- oversized charts that overflow or dominate

Prefer:

- balanced chart modules
- 2-up layout
- one clear chart type per purpose
- consistent card padding and axis spacing

## Dashboard component styling

- use stronger visual hierarchy than standard forms
- charts should feel premium but readable
- component titles should be clear and modest
- legend colors must map cleanly to app tokens

## AI-Specific Styling

Some areas of the app are intentionally AI-themed:

- AI Extracted Response
- AI assistant/chatbot
- AI summary cards

## AI color direction

Primary AI accent:

- `#A855F7`

Recommended AI surface treatment:

- soft violet to white gradient
- subtle violet border
- white content cards inside
- no heavy neon treatment

## AI section rules

- outer wrapper may have tinted AI gradient
- inner cards should stay clean and readable
- AI-specific toggles and filters can use violet-accent selected states
- confidence scores can use violet/pink ring treatment if readable

## Confidence score pattern

Use:

- circular progress
- compact “Confidence” label
- small but prominent visual

Do not:

- make it larger than the main record content
- replace the record title hierarchy

## AI evidence preview

Evidence preview should feel like:

- a premium extracted-document popover
- warm paper/document styling
- soft blurred context text
- highlighted source excerpt

Not:

- plain browser tooltip
- harsh black modal
- heavy bordered alert box

## Modals and Popovers

## Modal surface

Recommended:

- centered
- rounded `22px` to `28px`
- white or dark surface
- blurred backdrop
- no unexpected extra top margin from stacked utility classes

## Popovers

Use for:

- evidence/source preview
- column filters
- notification panels
- small action menus

Rules:

- anchored to trigger
- solid background, never transparent
- sufficient z-index above cards, tables, and sidebar
- subtle arrow only when it improves context

## Rich Text / Editor Surfaces

Used in:

- email templates
- document templates
- compose email
- template body editing

Rules:

- editor area should stay white/clean for readability
- toolbar should be compact and aligned
- content direction should remain left-to-right
- content body should not reverse typed characters

## Notification Pattern

In inquiry workspace and similar experiences:

- use bell icon with count badge
- dropdown should list notifications in a structured card list
- serial numbers are acceptable
- no unnecessary “mark all as read” actions unless explicitly required

Use theme-aligned colors, not random external colors.

## Empty States

Use the shared empty-state tone:

- concise title
- short descriptive line
- keep inside current context when that context matters
- no oversized illustration unless the whole page is empty

## Skeletons and Loading

Skeletons should:

- appear only for areas still loading
- prioritize primary content quickly
- avoid blocking the full page longer than necessary

Prefer staged loading:

- render shell and essential details first
- load secondary side panels, analytics, timelines, and linked content afterward

## Motion and Interaction

The app should use restrained premium motion:

- hover elevation
- light fade/slide for drawers and rails
- width transitions for collapsible side panes
- subtle pulse only when it communicates state

Avoid:

- overly bouncy animations
- repeated flashy effects
- large motion on dense workspaces

## Page-Specific Design Notes

## Inquiry workspace

- Details tab is the main underwriting canvas
- Email activity must feel like a premium side rail, not a crude sidebar
- AI Extracted Response should visually read as AI-assisted content
- Actions tab should stay compact and groupable

## Quote workbench

- Header should be compact like inquiry header
- Plan-linked content should be clean accordion-first UI
- Quote generation actions should feel formal and document-oriented

## Product editor

- Product Details, Plans, Business Rules should use consistent tab shell
- Auto Apply Actions control should feel integrated, not bolted on

## Business rule workspace

- Consequence management is dense, so spacing and grouping are critical
- Import assistant should feel lightweight, premium, and not too technical

## Template pages

- Email Templates should feel editor-first
- Document Templates should feel workspace-first
- Merge-field side panels should not visually overpower the editor

## Contact and Account workspaces

- Keep forms clean and administrative
- Use tabs only where there is meaningful secondary context, such as linked contacts

## Design Do and Don’t

## Do

- use shared tokens
- use shared field surface
- keep rounded, soft, premium geometry
- keep white inner content surfaces readable
- use consistent icon sizing
- preserve compact enterprise density
- keep tables clean and action-light

## Don’t

- introduce random new colors outside the token system
- use native browser-looking dropdowns
- create headers that are too tall
- stack too many equal-weight cards in one area
- use harsh borders and heavy shadows together
- mix AI styling into non-AI modules without purpose

## Recommended Future Rule

Before adding any new page or major section, align it to these five checkpoints:

1. Does it use the shared token system?
2. Does it use the shared form-field surface?
3. Does it follow the existing tab/card/table language?
4. Does it keep the same premium-but-compact density?
5. Does it fit light and dark mode without visual compromise?

If any answer is no, the page should be revised before being treated as complete.
