# InsureAI — Insurance App Design System & Layout Specification

> Use this document as the single source of truth for building the Vite + React + Tailwind CSS insurance application from scratch. Every page, table, card, form, modal, tab, filter, dashboard widget, and admin screen must follow this design system consistently.

---

## 1. Product Direction

### App Name
**InsureAI**

### Product Type
Premium insurance operations platform for inquiry intake, underwriting review, quote production, renewals, analytics, product administration, and admin management.

### Design Goal
The application must feel:

- Premium
- Enterprise-grade
- Trustworthy
- Fast
- Sleek
- AI-powered
- Operationally dense but still clean
- Consistent across every page
- Built for daily insurance operations, not a generic CRUD admin panel

### Visual Inspiration
The UI direction should feel like a hybrid of:

- Microsoft Fluent enterprise apps
- Linear
- Stripe Dashboard
- Notion-style clean workspace
- Modern AI command-center dashboards
- Premium SaaS admin systems

The app should not look basic, template-like, or randomly styled page by page.

---

## 2. Core UX Principles

1. **Consistency above everything**  
   One table style. One card style. One button system. One modal system. One form system. One tab system.

2. **Light and dark mode from day one**  
   The app must support both light and dark mode using CSS variables and Tailwind tokens.

3. **Premium but practical**  
   Use polish, shadows, motion, gradients, and micro-interactions, but never make the UX decorative or slow.

4. **Dense enterprise data, clean presentation**  
   Tables and dashboards must support real operational data without looking crowded.

5. **AI as a subtle layer**  
   AI features should feel integrated through badges, scores, summaries, insight cards, and animated processing states.

6. **Responsive web app**  
   Desktop-first enterprise layout with strong tablet and mobile behavior.

7. **Minimum readable font size**  
   No text smaller than **12px** anywhere in the app.

---

## 3. Technology Stack

Use the following stack:

```txt
Vite
React
TypeScript
Tailwind CSS
Lucide React Icons
Framer Motion
Recharts
React Router
TanStack Table
React Hook Form
Zod
clsx
class-variance-authority
```

### Styling Approach
Use:

- Tailwind CSS utility classes
- CSS variables for theme tokens
- Component variants for buttons, cards, badges, forms, tabs, tables
- No inline random colors
- No page-specific design exceptions unless added to this design system first

---

## 4. Global Theme Modes

The app must support:

1. **Light Mode** — default mode for enterprise clarity
2. **Dark Mode** — premium command-center mode

Dark mode must not be an afterthought. Every component must be designed and tested in both modes.

### Theme Toggle
Place theme toggle in the top-right app header near user profile.

---

## 5. Color System

All colors must be implemented as CSS variables and extended in Tailwind.

### 5.1 Brand Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---:|---:|---|
| `primary` | `#215CBE` | `#3B82F6` | Main actions, active nav, active tabs, links |
| `primary-light` | `#3B82F6` | `#60A5FA` | Hover, glow, selected rows |
| `primary-dark` | `#1E3A8A` | `#1D4ED8` | Pressed state, strong accents |
| `secondary` | `#6D5EF6` | `#8B5CF6` | AI highlights, underwriter workflow |
| `success` | `#108D61` | `#10B981` | Approved, completed, positive values |
| `warning` | `#F59E0B` | `#FBBF24` | Pending, attention, review queues |
| `danger` | `#EF4444` | `#F87171` | Rejected, overdue, destructive actions |
| `info` | `#0891B2` | `#06B6D4` | AI processing, documents, neutral info |

### 5.2 Light Mode Surface Colors

| Token | Value | Usage |
|---|---:|---|
| `background` | `#F6F8FC` | Main app background |
| `surface` | `#FFFFFF` | Cards, tables, panels |
| `surface-soft` | `#F9FBFF` | Subtle nested surfaces |
| `surface-muted` | `#EEF3FA` | Filter bars, table header |
| `border` | `#D8E0EA` | Default border |
| `border-soft` | `#E7EDF5` | Inner separators |
| `text` | `#0B1220` | Primary text |
| `text-muted` | `#526173` | Secondary text |
| `text-soft` | `#7A8699` | Captions, helper text |

### 5.3 Dark Mode Surface Colors

| Token | Value | Usage |
|---|---:|---|
| `background` | `#071421` | Main app background |
| `surface` | `#0B1F33` | Cards, tables, panels |
| `surface-soft` | `#102A43` | Nested cards, hover surfaces |
| `surface-muted` | `#142F4A` | Table headers, filter bars |
| `border` | `#1E3A56` | Default border |
| `border-soft` | `#203B57` | Inner separators |
| `text` | `#EAF2FF` | Primary text |
| `text-muted` | `#A8B8CC` | Secondary text |
| `text-soft` | `#7890A8` | Captions, helper text |

### 5.4 Chart Colors

Use the same chart colors across all dashboards and analytics pages.

```ts
const chartColors = {
  blue: '#3B82F6',
  teal: '#14B8A6',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',
  cyan: '#06B6D4',
  slate: '#64748B',
};
```

### 5.5 Status Color Rules

| Status | Color | Badge Style |
|---|---|---|
| New | Blue | Soft blue pill |
| In Progress | Amber | Soft amber pill |
| Review | Violet | Soft violet pill |
| Awaiting Review | Violet | Soft violet pill |
| Approved | Green | Soft green pill |
| Completed | Green | Soft green pill |
| Rejected | Red | Soft red pill |
| Pending | Amber | Soft amber pill |
| Closed | Slate | Soft gray pill |
| Renewal Due | Red | Soft red pill |
| AI Processing | Cyan/Blue | Animated subtle pulse |

---

## 6. Tailwind Theme Setup

Use this structure in `tailwind.config.ts`.

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        'surface-soft': 'hsl(var(--surface-soft))',
        'surface-muted': 'hsl(var(--surface-muted))',
        border: 'hsl(var(--border))',
        'border-soft': 'hsl(var(--border-soft))',
        primary: 'hsl(var(--primary))',
        'primary-light': 'hsl(var(--primary-light))',
        'primary-dark': 'hsl(var(--primary-dark))',
        secondary: 'hsl(var(--secondary))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
        info: 'hsl(var(--info))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
        card: '0 12px 32px rgba(15, 23, 42, 0.10)',
        premium: '0 20px 60px rgba(15, 23, 42, 0.16)',
        glow: '0 0 0 1px rgba(59, 130, 246, 0.20), 0 20px 60px rgba(59, 130, 246, 0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.35s ease-out both',
        'fade-in': 'fadeIn 0.25s ease-out both',
        'scale-in': 'scaleIn 0.22s ease-out both',
        'soft-pulse': 'softPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        softPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Global CSS Variables

Use this in `src/styles/globals.css`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 220 43% 98%;
    --foreground: 222 47% 8%;

    --surface: 0 0% 100%;
    --surface-soft: 216 100% 99%;
    --surface-muted: 214 45% 96%;

    --border: 214 30% 88%;
    --border-soft: 214 32% 93%;

    --primary: 218 70% 44%;
    --primary-light: 217 91% 60%;
    --primary-dark: 224 64% 33%;

    --secondary: 246 90% 67%;
    --success: 160 80% 31%;
    --warning: 38 92% 50%;
    --danger: 0 84% 60%;
    --info: 190 90% 38%;

    --muted: 215 32% 94%;
    --muted-foreground: 215 15% 42%;
  }

  .dark {
    --background: 210 65% 8%;
    --foreground: 214 100% 96%;

    --surface: 211 64% 12%;
    --surface-soft: 209 61% 16%;
    --surface-muted: 209 58% 18%;

    --border: 207 48% 23%;
    --border-soft: 207 46% 25%;

    --primary: 217 91% 60%;
    --primary-light: 213 94% 68%;
    --primary-dark: 224 76% 48%;

    --secondary: 258 90% 66%;
    --success: 160 84% 39%;
    --warning: 43 96% 56%;
    --danger: 0 91% 71%;
    --info: 188 86% 53%;

    --muted: 210 50% 18%;
    --muted-foreground: 212 24% 73%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-size: 14px;
  }

  ::selection {
    background: hsl(var(--primary) / 0.18);
  }
}
```

---

## 7. Typography System

Use **Inter** as the primary font.

### Font Scale

| Token | Size | Weight | Usage |
|---|---:|---:|---|
| Display | 32px | 700 | Dashboard welcome title, hero title |
| H1 | 28px | 700 | Page title |
| H2 | 24px | 700 | Section title |
| H3 | 20px | 650 | Card title, modal title |
| H4 | 16px | 650 | Table panel title, form section |
| Body | 14px | 400 | Default text |
| Body Medium | 14px | 500 | Labels, table values |
| Small | 12px | 500 | Captions, badges, metadata |
| Micro | 12px | 600 | Never go below 12px |

### Typography Rules

- Do not use font sizes below 12px.
- Headings must use tight line-height.
- Body text must use readable line-height.
- Table cells should use 13px or 14px.
- Badges and chips should use 12px.
- Use letter spacing only for section labels and navigation group labels.

### Section Label Style

```txt
Font size: 12px
Weight: 700
Letter spacing: 0.16em
Text transform: uppercase
Color: muted foreground
```

---

## 8. App Shell Layout

### Desktop Layout

The app shell must use a persistent left sidebar and top header.

```txt
┌─────────────────────────────────────────────────────────────┐
│ Sidebar │ Top Header                                         │
│         ├────────────────────────────────────────────────────┤
│         │ Page Content                                       │
│         │                                                    │
│         │                                                    │
└─────────┴────────────────────────────────────────────────────┘
```

### Sidebar Width

| State | Width |
|---|---:|
| Expanded | 280px |
| Collapsed | 76px |
| Mobile | Drawer overlay |

### Top Header Height

```txt
72px desktop
64px tablet/mobile
```

### Page Content Padding

```txt
Desktop: 24px
Tablet: 20px
Mobile: 16px
```

### Main Content Max Width

Use full width for dashboards and data pages. Do not center into a narrow container.

---

## 9. Sidebar Design

### Sidebar Style

Light mode:

```txt
Background: #FFFFFF
Border-right: 1px solid border-soft
```

Dark mode:

```txt
Background: linear-gradient(180deg, #06111E 0%, #081A2A 100%)
Border-right: 1px solid #1E3A56
```

### Sidebar Sections

Recommended navigation structure:

```txt
Main
- Executive Dashboard

Leads Management
- All Inquiries
- New Business
- Renewals
- Endorsements

Policy Management
- Quotes
- AI Analytics
- Renewal Watchlist

Product Management
- Products
- Plans
- Coverages
- Benefits
- Warranties
- Exclusions
- Deductibles
- Business Rules

Administration
- Users
- Business Units
- Brokers
- Accounts
- Contacts
- Email Templates
- Document Templates
```

### Sidebar Item Style

Default:

```txt
Height: 44px
Radius: 12px
Padding: 12px
Icon: 18px
Font: 13px / 600
```

Active:

```txt
Background: primary
Text: white
Shadow: subtle primary glow
```

Hover:

```txt
Background: surface-muted
Transform: translateX(2px)
Transition: 180ms ease
```

Dark hover:

```txt
Background: rgba(59, 130, 246, 0.12)
```

### Sidebar User Card

Place at bottom.

```txt
Height: 64px
Radius: 18px
Avatar: 38px circle
Name: 13px / 700
Role: 12px / 500
```

---

## 10. Top Header Design

The top header gives global context and quick actions.

### Header Content

Left:

```txt
Small eyebrow: INSURANCE PLATFORM
Title: Executive operations workspace
```

Center:

```txt
Global search input
```

Right:

```txt
Refresh button
Notifications icon
Theme toggle
User profile capsule
```

### Header Style

```txt
Background: surface / 80%
Backdrop blur: 16px
Border-bottom: 1px solid border-soft
Position: sticky top-0
Z-index: 40
```

---

## 11. Page Header Pattern

Every page must start with a consistent page header.

### Standard Page Header

```txt
Icon circle
Page title
Short description
Primary action button on right
Optional secondary actions
```

Example:

```txt
[Icon] Products
Use the same structured admin workspace as inquiries and quotes to manage product records.
                                                        [+ Add Product]
```

### Detail Page Header

Detail pages use a larger contextual header.

```txt
Back link
Title
Record number / metadata
Product chips
Workflow steps
Action buttons
Summary metric cards
```

---

## 12. Card System

All cards must follow one design language.

### Default Card

```txt
Background: surface
Border: 1px solid border-soft
Radius: 20px
Shadow: soft
Padding: 20px
```

### Premium Dashboard Card

```txt
Background: surface
Border: 1px solid border-soft
Radius: 22px
Shadow: card
Padding: 20px to 24px
Hover: lift 2px + border primary/20
```

### Glass Card Variant

Use only in hero/dashboard sections.

```txt
Background: surface / 82%
Backdrop blur: 18px
Border: 1px solid border-soft
Subtle radial gradient overlay
```

### Card Hover Rule

Cards that are clickable:

```txt
Transition: 180ms ease
Hover transform: translateY(-2px)
Hover shadow: premium
Cursor: pointer
```

Cards that are only containers should not move.

---

## 13. KPI Card System

KPI cards are used on dashboards, analytics pages, and operational overview sections.

### KPI Card Layout

```txt
Top row: Label + icon bubble
Middle: Large number
Bottom: trend / helper text
```

### KPI Card Style

```txt
Min height: 132px
Radius: 20px
Padding: 20px
Background: surface
Border: border-soft
```

### KPI Number

```txt
Font size: 30px
Weight: 750
Line height: 1
```

### KPI Icon Bubble

```txt
Size: 44px
Radius: 14px or full circle
Background: soft status color
Icon: matching status color
```

### KPI Trend

Positive:

```txt
Color: success
Arrow up icon
```

Negative:

```txt
Color: danger
Arrow down icon
```

Neutral:

```txt
Color: muted foreground
```

---

## 14. Button System

Use one button component across the full app.

### Button Sizes

| Size | Height | Padding | Font |
|---|---:|---:|---:|
| sm | 34px | 12px | 12px / 600 |
| md | 40px | 16px | 13px / 650 |
| lg | 48px | 20px | 14px / 700 |
| icon | 40px | square | icon 18px |

### Button Variants

#### Primary

```txt
Background: primary
Text: white
Hover: primary-dark
Shadow: primary glow subtle
```

#### Secondary

```txt
Background: surface-muted
Text: foreground
Border: border-soft
Hover: surface-soft
```

#### Outline

```txt
Background: transparent
Border: border
Text: foreground
Hover: surface-muted
```

#### Ghost

```txt
Background: transparent
Text: muted foreground
Hover: surface-muted
```

#### Destructive

```txt
Background: danger
Text: white
Hover: darker red
```

#### AI Button

```txt
Background: linear-gradient(135deg, primary, secondary)
Text: white
Icon: sparkle or bot
Subtle glow
```

### Button Motion

```txt
Transition: 160ms ease
Active: scale(0.98)
Disabled: opacity 50%, cursor not-allowed
```

---

## 15. Badge, Chip, Tag, Capsule System

Use badges for statuses, chips for filters, and capsules for metadata.

### Badge Style

```txt
Height: 24px
Padding: 0 10px
Radius: full
Font: 12px / 650
```

### Filter Chip Style

```txt
Height: 36px
Padding: 0 14px
Radius: full
Border: 1px solid border-soft
Background: surface
Font: 13px / 650
```

Active filter chip:

```txt
Background: primary
Text: white
Border: primary
Shadow: soft primary glow
```

### Metadata Capsule

Used below titles and on detail pages.

```txt
Height: 32px
Padding: 0 12px
Radius: full
Background: surface-soft
Border: border-soft
Icon: 14px
Font: 12px / 650
```

---

## 16. Table System

This is the only table design allowed in the app.

### Table Container

```txt
Background: surface
Border: 1px solid border-soft
Radius: 20px
Overflow: hidden
Shadow: soft
```

### Table Header

```txt
Height: 52px
Background: surface-muted
Text: muted foreground
Font: 12px / 700
Letter spacing: 0.03em
```

### Table Row

```txt
Min height: 64px
Border-bottom: 1px solid border-soft
Hover background: primary / 4%
Transition: 140ms ease
```

### Table Cell

```txt
Padding: 14px 16px
Font: 13px or 14px
Vertical align: middle
```

### Table Actions

Use icon buttons only.

```txt
Edit icon: muted foreground, hover primary
Delete icon: muted foreground, hover danger
View icon: muted foreground, hover info
```

### Table Empty State

```txt
Centered icon
Title
Description
Optional action button
Min height: 280px
```

### Table Loading State

Use skeleton rows, not spinners.

### Table Rules

- No alternate table designs on different pages.
- Every table must support responsive behavior.
- On mobile, tables can become stacked record cards.
- Table headers must remain visually consistent.
- Row hover must be subtle.
- Use badges for statuses, not colored text alone.

---

## 17. Form System

All forms must follow the same layout.

### Form Field

```txt
Label: 12px / 650
Input height: 42px
Radius: 12px
Border: border
Background: surface
Padding: 12px
Font: 14px
```

### Input States

Default:

```txt
Border: border
Background: surface
```

Focus:

```txt
Border: primary
Ring: primary / 15%
```

Error:

```txt
Border: danger
Helper text: danger
```

Disabled:

```txt
Background: surface-muted
Opacity: 70%
```

### Select Fields

Use same height and radius as input.

### Textarea

```txt
Min height: 110px
Resize: vertical
```

### Form Layouts

Use grid:

```txt
Desktop: 2 or 3 columns depending on content
Tablet: 2 columns
Mobile: 1 column
Gap: 16px
```

### Form Section Card

```txt
Title
Optional description
Fields grid
Footer actions
```

---

## 18. Tabs System

Use the same tabs across detail pages and workspace pages.

### Workspace Tabs

```txt
Container background: surface
Border: border-soft
Radius: 16px
Padding: 4px
```

### Tab Item

```txt
Height: 42px
Radius: 12px
Font: 13px / 650
Icon: 16px
```

Active tab:

```txt
Background: primary
Text: white
Shadow: subtle primary glow
```

Inactive tab:

```txt
Text: muted foreground
Hover background: surface-muted
```

### Detail Page Tabs Example

```txt
Details
AI Extracted Response
Actions
Quotes
Documents
History
```

---

## 19. Filter Bar System

Filter bars appear above tables and analytics views.

### Filter Bar Style

```txt
Background: surface
Border: 1px solid border-soft
Radius: 20px
Padding: 14px
Display: flex
Gap: 12px
```

### Search Input

```txt
Width desktop: 360px to 460px
Height: 42px
Icon left
Radius: 14px
```

### Filter Buttons

Use secondary or outline button style.

### Responsive Behavior

Desktop:

```txt
Search left, filters right
```

Mobile:

```txt
Stack search full width, filters wrap below
```

---

## 20. Modal System

Use one modal design only.

### Modal Overlay

```txt
Background: rgba(2, 6, 23, 0.55)
Backdrop blur: 8px
```

### Modal Panel

```txt
Background: surface
Border: border-soft
Radius: 24px
Shadow: premium
Max width: based on size
Animation: scale-in + fade-in
```

### Modal Sizes

| Size | Width |
|---|---:|
| sm | 420px |
| md | 560px |
| lg | 760px |
| xl | 980px |
| full | calc(100vw - 48px) |

### Modal Structure

```txt
Header: title + description + close button
Body: form/content
Footer: cancel + primary action
```

### Drawer Variant

Use right-side drawer for edit screens with many fields.

```txt
Width: 520px desktop
Mobile: full width
```

---

## 21. Dashboard Design

### Executive Dashboard Layout

```txt
Hero summary panel
KPI row
Charts grid
Operational overview
Recent inquiries table
AI insights / renewal watch widgets
```

### Dashboard Grid

```txt
12-column grid
Gap: 16px or 20px
```

Example desktop layout:

```txt
Hero: 12 columns
KPI cards: 5 cards across
Trend chart: 7 columns
Donut chart: 5 columns
Recent table: 8 columns
Status widget: 4 columns
```

### Hero Panel

The hero should look premium and should include:

```txt
Eyebrow capsule
Welcome title
Short operational description
3 compact metric highlights
Subtle background gradient or insurance line icons
```

Do not overfill the hero.

### Animated Dashboard Components

Use Framer Motion:

```txt
Initial page load: fade-up stagger
KPI number count-up animation
Chart reveal animation
Hover lift on clickable cards
AI processing pulse
```

Motion should feel subtle and fast.

---

## 22. Charts Design

Use Recharts.

### Chart Card Style

Use the default card system.

### Chart Rules

- No random colors.
- Use the chart color tokens.
- Legends must be clean and small.
- Grid lines must be subtle.
- Tooltip must use surface background, border-soft, and rounded corners.
- Charts must work in dark mode.

### Recommended Charts

| Use Case | Chart Type |
|---|---|
| Inquiry trends | Line chart |
| Product distribution | Donut chart |
| Status comparison | Horizontal bar chart |
| Premium over time | Area chart |
| Risk/AI score spread | Bar chart |
| Renewal urgency | Stacked bar or list cards |

---

## 23. Inquiry Management Page

### Page Structure

```txt
Page header
Product/category filter chips
Search and filter bar
Inquiry table
Pagination
```

### Filter Chips

Example:

```txt
All Inquiries 29
Product All Risk - PAR 0
Aviation 0
Car Insurance 6
Medical Insurance 0
Life Insurance 0
Commercial Property Insurance 23
```

Active chip uses primary style.

### Inquiry Table Columns

```txt
Inquiry Number
Client
Product
Broker
Status
AI Score
Premium
Updated
Actions
```

### Inquiry Number Style

Use a small soft teal/blue pill.

### AI Score Style

- 80+ green or blue
- 60–79 amber/blue
- below 60 warning/danger depending on business rule

---

## 24. Inquiry Detail Workspace

This is a central premium page.

### Page Structure

```txt
Back to inquiries
Large inquiry title
Inquiry number
Action buttons
Product/entity chips
Workflow progress stepper
Readiness score cards
Workspace tabs
Tab content
```

### Workflow Stepper

Example steps:

```txt
Email Received
Product Matched
Inquiry Created
Documents Stored
AI Processing
Awaiting Review
```

Stepper style:

```txt
Completed: primary filled circle
Current: primary ring + glow
Upcoming: muted circle
Line: border-soft, active primary
```

### Detail Tabs

```txt
Details
AI Extracted Response
Actions
Quotes
Documents
History
```

### Readiness Cards

Use horizontal compact cards with progress bars.

```txt
Overall Completeness
Information Capture
Document Readiness
Senior Underwriter Approval
```

---

## 25. Products and Admin Pages

Admin/reference pages must be clean, dense, and consistent.

### Page Structure

```txt
Page header with icon and Add button
Search/filter bar
Table
Create/Edit modal or drawer
```

### Product Table Columns

```txt
Product
Inquiry Volume
Premium Total
Insured Total
Actions
```

### Product Library Pages

Use same pattern for:

```txt
Products
Plans
Coverages
Benefits
Warranties
Exclusions
Deductibles
Business Rules
```

No special table design per entity.

---

## 26. Quotes Page

### Page Structure

```txt
Page header
KPI quote summary row
Search/filter bar
Quotes table
Edit quote drawer/modal
```

### Quote Table Columns

```txt
Quote Number
Inquiry
Client
Product
Plan
Premium
Status
Created Date
Actions
```

### Quote Edit Form

Use tabs:

```txt
Quote Details
Plan Details
Email
Documents
```

---

## 27. Renewals Page

Renewals must be a dedicated operational workspace.

### Page Structure

```txt
Page header
Renewal urgency cards
Filter chips
Search/filter bar
Renewal table
Quick action drawer
```

### Urgency States

```txt
Due Soon
Due in 30 Days
Overdue
Reminder Sent
Renewed
Expired
```

### Renewal Table Columns

```txt
Policy Number
Client
Product
Expiry Date
Days Remaining
Renewal Status
Reminder Count
Actions
```

---

## 28. Analytics Page

### Analytics Layout

```txt
Page header
Date range filters
Metric cards
Chart grid
Insight cards
Export actions
```

### Analytics Style

Analytics should look premium and interactive, not like static reports.

Use:

- Chart cards
- KPI summaries
- AI insight cards
- Segmented filters
- Date range picker
- Drill-down table

---

## 29. AI UI Patterns

AI features should use a consistent visual language.

### AI Badge

```txt
Icon: Sparkles or Bot
Gradient background: primary to secondary
Text: white
```

### AI Score

Use score with small visual indicator:

```txt
Score number
Thin progress bar
Status label
```

### AI Processing State

```txt
Soft pulse
Cyan/blue status badge
Progress bar shimmer
```

### AI Insight Card

```txt
Icon bubble
Title
Summary text
Confidence/status badge
Optional action
```

---

## 30. Empty, Loading, and Error States

### Empty State

```txt
Large soft icon bubble
Title
Short description
Optional primary action
```

### Loading State

Use skeletons:

- KPI skeleton cards
- Table skeleton rows
- Chart placeholder skeleton
- Form field skeletons

Avoid full-page spinners except initial app boot.

### Error State

```txt
Soft red icon bubble
Clear title
Helpful message
Retry button
```

---

## 31. Toast and Alert System

### Toast Position

```txt
Bottom-right desktop
Top-center mobile
```

### Toast Types

```txt
Success
Warning
Error
Info
```

### Toast Style

```txt
Background: surface
Border: border-soft
Radius: 16px
Shadow: premium
Icon bubble with type color
```

---

## 32. Responsive Behavior

### Breakpoints

Use Tailwind defaults:

```txt
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Desktop

- Sidebar expanded by default
- Header sticky
- Tables full-width
- Dashboard grid uses 12 columns

### Tablet

- Sidebar collapsible
- Cards move to 2-column layout
- Filter bars wrap

### Mobile

- Sidebar becomes drawer
- Header becomes compact
- Tables become stacked cards where necessary
- Forms become single column
- Primary actions remain visible

---

## 33. Animation and Interaction Rules

Use Framer Motion for controlled animation.

### Allowed Motion

```txt
Fade in
Fade up
Soft scale-in
Hover lift
Number count-up
Progress reveal
Drawer slide-in
Modal scale-in
```

### Timing

```txt
Fast interaction: 120–180ms
Page/card reveal: 220–350ms
Drawer/modal: 220–280ms
```

### Do Not Use

- Heavy bouncing animation
- Random decorative effects
- Slow transitions
- Too much parallax
- Animation that delays work

---

## 34. Accessibility Rules

- Minimum text size: 12px
- All buttons must have focus states
- All icon-only buttons must have aria-label
- Color must not be the only status indicator
- Modal must trap focus
- Sidebar must support keyboard navigation
- Inputs must have labels
- Charts should have summary text where needed
- Maintain strong contrast in both light and dark modes

---

## 35. File and Folder Structure

Recommended structure:

```txt
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  assets/
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      TopHeader.tsx
      PageHeader.tsx
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      Select.tsx
      Textarea.tsx
      Tabs.tsx
      Modal.tsx
      Drawer.tsx
      Table.tsx
      FilterBar.tsx
      EmptyState.tsx
      Skeleton.tsx
      Toast.tsx
      ThemeToggle.tsx
    dashboard/
      KpiCard.tsx
      ChartCard.tsx
      InsightCard.tsx
      ProgressCard.tsx
    inquiry/
      InquiryStepper.tsx
      InquirySummaryCard.tsx
      AiScore.tsx
  hooks/
    useTheme.ts
    useUser.ts
  lib/
    cn.ts
    constants.ts
    formatters.ts
  pages/
    dashboard/
      ExecutiveDashboard.tsx
    inquiries/
      InquiryListPage.tsx
      InquiryDetailPage.tsx
    quotes/
      QuotesPage.tsx
      QuoteEditPage.tsx
    renewals/
      RenewalsPage.tsx
    analytics/
      AnalyticsPage.tsx
    products/
      ProductsPage.tsx
      PlansPage.tsx
      CoveragesPage.tsx
      BenefitsPage.tsx
      WarrantiesPage.tsx
      ExclusionsPage.tsx
      DeductiblesPage.tsx
      BusinessRulesPage.tsx
    admin/
      UsersPage.tsx
      BusinessUnitsPage.tsx
      BrokersPage.tsx
      AccountsPage.tsx
      ContactsPage.tsx
      EmailTemplatesPage.tsx
      DocumentTemplatesPage.tsx
  styles/
    globals.css
```

---

## 36. Component Consistency Contract

Codex must follow this contract:

1. Do not create new button styles inside pages.
2. Do not create new table styles inside pages.
3. Do not create new badge styles inside pages.
4. Do not create new card styles inside pages.
5. Do not hardcode colors in components unless they are in the theme token system.
6. Do not use font size below 12px.
7. Every page must use `AppShell`.
8. Every page must use `PageHeader` unless it is a special detail page.
9. All CRUD list pages must use the same `DataTable` component.
10. All modals must use the same `Modal` or `Drawer` component.
11. All forms must use shared form field components.
12. Dark mode support is mandatory for every new component.

---

## 37. Component Variant Examples

### Button Variant API

```tsx
<Button variant="primary" size="md">Save Changes</Button>
<Button variant="outline" size="md">Cancel</Button>
<Button variant="ghost" size="icon" aria-label="Refresh"><RefreshCw /></Button>
<Button variant="ai" size="md"><Sparkles /> AI Analyze</Button>
```

### Badge Variant API

```tsx
<Badge variant="new">New</Badge>
<Badge variant="review">Review</Badge>
<Badge variant="approved">Approved</Badge>
<Badge variant="rejected">Rejected</Badge>
<Badge variant="pending">Pending</Badge>
```

### Card Variant API

```tsx
<Card variant="default" />
<Card variant="premium" />
<Card variant="glass" />
<Card variant="interactive" />
```

### Table Usage

```tsx
<DataTable
  columns={columns}
  data={inquiries}
  emptyTitle="No inquiries found"
  emptyDescription="Try changing your filters or create a new inquiry."
/>
```

---

## 38. Route Structure

Recommended routes:

```txt
/                         Executive Dashboard
/inquiries                All Inquiries
/inquiries/:id            Inquiry Detail Workspace
/new-business             New Business
/renewals                 Renewals
/endorsements             Endorsements
/quotes                   Quotes
/quotes/:id               Quote Detail/Edit
/ai-analytics             AI Analytics
/renewal-watchlist        Renewal Watchlist
/products                 Products
/plans                    Plans
/coverages                Coverages
/benefits                 Benefits
/warranties               Warranties
/exclusions               Exclusions
/deductibles              Deductibles
/business-rules           Business Rules
/users                    Users
/business-units           Business Units
/brokers                  Brokers
/accounts                 Accounts
/contacts                 Contacts
/email-templates          Email Templates
/document-templates       Document Templates
```

---

## 39. Page Build Priority

Build in this order:

1. Theme system and Tailwind tokens
2. AppShell, Sidebar, TopHeader
3. Shared UI components
4. Executive Dashboard
5. Inquiry Management list
6. Inquiry Detail Workspace
7. Products admin page
8. Quotes page
9. Renewals page
10. Analytics page
11. Remaining admin/product-library pages

---

## 40. Final Visual Standard

The final app should feel like a premium insurance operations command center.

It must have:

- Clean light mode
- Premium dark mode
- Consistent cards, tables, buttons, badges, tabs, modals, and forms
- Smooth but subtle motion
- Strong dashboard experience
- Modern sidebar and header
- AI-powered visual language
- Dense but readable enterprise layouts
- Responsive behavior across desktop, tablet, and mobile

Any new page added later must follow this exact same design system before adding business logic.
