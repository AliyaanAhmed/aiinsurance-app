# Landing Page Design Studio — Architecture & Tech Stack Plan

## 1. What we're building

A standalone React module — "chat on the left, live preview on the right" — that lets an
insurance broker describe their brand and their lead-gen needs in plain language, and get a
polished, animated landing page (with a working lead capture form) built for them turn by turn.
It's later embedded inside your main insurance app, so it needs to be a self-contained package
(its own store, its own component registry, no leakage of globals) rather than something wired
tightly to a host app's routing/auth.

The core technical idea is **Generative UI, not Generative Code**: the LLM never writes JSX,
HTML, or JS. It only ever returns typed JSON describing *which* pre-built, pre-styled section
components to place on the page and *what content* goes in them. Your React app owns every
pixel and every animation; the LLM just fills in a form, essentially — a very smart form,
but a form. This is what lets you guarantee no broken markup, no XSS, no runaway styles, and no
off-brand insurance claims sneaking onto a client's site.

## 2. End-to-end flow

```
┌───────────────────────────┐        ┌──────────────────────────┐
│        React Studio        │        │      Local Proxy          │
│                             │        │   server/index.mjs        │
│  ChatPanel   PreviewPane   │  POST  │                            │
│  (messages)  (renderer)    │───────▶│  loads aurelian-system.md  │
│                             │        │  + conversation state     │
│  Zustand store:             │◀───────│  calls Azure Foundry       │
│   - conversationStage       │  JSON  │  validates LLM JSON        │
│   - draft landing page tree │        │  (schema + safety pass)    │
│   - patch history (undo)    │        └──────────────────────────┘
└───────────────────────────┘                     │
                                                   ▼
                                     ┌──────────────────────────┐
                                     │   Azure Foundry (GPT-5.1)  │
                                     └──────────────────────────┘
```

This is exactly your existing `LLM_COMMUNICATION.md` flow — we're not replacing it, we're
extending the contract (Section 5) and adding a rendering + safety layer on the frontend
(Section 6).

## 3. Tech stack

| Concern | Choice | Why |
|---|---|---|
| App shell | Vite + React 18 + TypeScript | Matches your existing `src/services/ai/azure-ai.service.ts` setup; TS is not optional here — the whole safety model depends on typed schemas. |
| Styling | Tailwind CSS + CSS variables for brand tokens | Utility-first for the studio chrome; CSS variables (`--brand-primary`, `--brand-font-display`, etc.) let the *same* section components re-skin themselves per broker without regenerating code. |
| Studio chrome animation | Framer Motion | Chat bubbles, panel transitions, device-frame toggling — anything driven by React state is more natural in Framer Motion than GSAP. |
| Rendered-page animation | GSAP + ScrollTrigger | For the actual landing page output: scroll-triggered section reveals, hero parallax, staggered card entrances. GSAP timelines give you frame-accurate orchestration that a "high-end agency site" needs (see references you attached — Webprofits, Revent). Load via npm, not CDN, so it's tree-shakeable and versioned. |
| Schema validation | Zod | Validates every LLM response against the `ui_blocks` contract *before* it touches React. Reuse the same Zod schemas to generate TypeScript types (`z.infer`) so `componentRegistry.tsx` and `schemas.ts` never drift apart. |
| Form engine (rendered forms) | React Hook Form + Zod resolver | The forms *brokers'* visitors fill out (get-a-quote, callback request) — multi-step, conditional fields, proper validation, cheap to re-render. |
| Field/section reordering (studio only) | dnd-kit | For a broker who wants to manually nudge form-field order or section order after the LLM builds it. |
| State management | Zustand (+ `zundo` middleware) | Small, no boilerplate, and `zundo` gives you undo/redo on the draft landing page tree almost for free — important since "enhance this button color" needs to be reversible. |
| Charts (dynamicChart blocks) | Recharts | Already implied by your existing contract (`chartType: "pie"` etc). |
| Rich text (rich-text form fields / static copy blocks) | Tiptap | Headless, React-native, easy to constrain to a safe subset of marks (bold/italic/links only — no arbitrary HTML). |
| Icons | lucide-react | Consistent, tree-shakeable, matches shadcn ecosystem. |
| Studio UI primitives (dialogs, dropdowns, tabs, tooltips) | shadcn/ui | For the *studio's own* chrome (settings panels, the device-frame toggle, upload dialogs) — not for the rendered landing pages, which use their own themeable section components. |
| Preview responsiveness | A scaled `<div>` frame, not an `<iframe>` | Fix a pixel width (375 / 768 / 1440) and let CSS do the rest; a plain container is simpler than double-mounting React in an iframe, and you don't need iframe sandboxing since content is never raw HTML/JS — it's typed React components you control. |

No CDNs for anything load-bearing. Everything ships through npm so versions are pinned and the
module can be bundled cleanly into the host app later.

## 4. The safety model (the part that stops "LLM blunders")

Three layers, in order:

1. **Structural validation (Zod).** The LLM can only ever emit block `type`s from a fixed
   enum (`hero`, `navbar`, `servicesGrid`, `leadForm`, `testimonials`, `statsBand`, `faq`,
   `footer`, `ctaBanner`, `logosBand`, `teamGrid`, `dynamicChart`, ...). Anything outside the
   enum, or missing required fields, is rejected by the proxy *before* it reaches the frontend.
   On rejection, the proxy can auto-retry once with a corrective system message ("your last
   response had an invalid block, here's the schema again") rather than surfacing an error to
   the user.

2. **Semantic / business-rule validation (custom rules, run in the proxy).** Structural
   validity isn't enough — a hero headline of 40 words is valid JSON but a bad design. Rules to
   enforce server-side:
   - Headline/subheadline word-count ceilings per section type.
   - At least one required field in any `leadForm` block; email or phone must be present.
   - No literal `<script>`, `javascript:`, or raw HTML tags in any string field.
   - No absolute/guarantee language in insurance copy ("guaranteed lowest price," "we will
     always beat any quote") — flag against a small denylist of regulated phrases and ask the
     LLM to rephrase.
   - No competitor names, no fabricated license/registration numbers, no fabricated review
     counts or "4.9 stars from 12,000 customers" unless the broker supplied that number.
   - Hex colors must parse and pass a minimum contrast ratio against their intended background
     (WCAG AA) — reject and ask for an adjusted shade rather than silently rendering
     low-contrast text.

3. **Registry allow-list (frontend).** `componentRegistry.tsx` only knows how to render the
   exact block types it has a component for. Even if something slipped through validation, an
   unrecognized type renders nothing (or a neutral placeholder in dev), never arbitrary markup.

This is the same idea your `LLM_COMMUNICATION.md` already describes ("does not render arbitrary
code from the LLM") — this plan just specifies exactly *what* the extra business-rule layer
checks, since "restrict the LLM from making blunders" is really a compliance problem as much as
a technical one, given it's insurance.

## 5. Extending the JSON contract: patch-based blocks

Your current contract has the proxy return a flat `ui: [...]` array each turn. That's fine for
a one-shot answer, but this studio is a *long, iterative* conversation — by message 15 you don't
want the LLM re-emitting the entire page every turn (expensive, slow, and risks it silently
rewriting something the broker already approved).

**Recommended extension** (backward compatible — `action` defaults to `"upsert"` if omitted):

```json
{
  "assistant_markdown": "Great, let's talk about your hero section...",
  "suggestions": ["Add a testimonials section", "Change the CTA color", "Preview on mobile"],
  "stage": "hero",
  "ui_blocks": [
    {
      "id": "hero-1",
      "type": "hero",
      "action": "upsert",
      "animation": { "entrance": "fadeUp", "stagger": false },
      "props": {
        "eyebrow": "Auto & Home Insurance",
        "headline": "Coverage that keeps up with your life",
        "subheadline": "Get a personalized quote in under two minutes.",
        "ctaLabel": "Get my quote",
        "backgroundStyle": "gradient",
        "media": { "type": "image", "src": null, "altPrompt": "friendly agent with client" }
      }
    }
  ]
}
```

- `id` — stable identifier so the frontend store can merge blocks instead of replacing the
  whole tree. New `id` → new section, animates in as "new." Same `id`, changed `props` →
  in-place update, animates as a subtle "updated" pulse instead of a full re-entrance.
- `action` — `"upsert" | "remove" | "reorder"`. Lets "enhance mode" say *remove the FAQ
  section* or *move testimonials above services* without re-describing every other section.
- `stage` — which step of the question flow this turn belongs to (Section 7). Drives the
  studio's own progress indicator ("Step 4 of 9: Lead form").
- `animation.entrance` — a small closed enum (`fadeUp | fadeIn | slideInLeft | zoomIn | none`),
  never free-form. The *renderer* owns the actual GSAP timeline; the LLM just picks a mood.

## 6. Section catalog (v1)

| type | purpose | key props |
|---|---|---|
| `navbar` | logo, nav links, CTA button | `links[]`, `ctaLabel`, `sticky` |
| `hero` | thesis of the page | `eyebrow`, `headline`, `subheadline`, `ctaLabel`, `media`, `backgroundStyle` |
| `logosBand` | "trusted by / underwritten by" partners | `logos[]` |
| `servicesGrid` | coverage types / products offered | `items[]{icon,title,description}` |
| `statsBand` | trust numbers (years in business, claims paid, clients) | `stats[]{value,label}` |
| `leadForm` | the actual conversion form | see Section 8 — its own sub-schema |
| `testimonials` | social proof | `items[]{quote,name,role,avatar}` |
| `faq` | objection handling | `items[]{q,a}` |
| `ctaBanner` | secondary conversion push before footer | `headline`, `ctaLabel` |
| `footer` | links, contact, compliance/disclaimer text | `columns[]`, `social[]`, `disclaimer` |
| `dynamicChart` / `coverageBreakdown` | your existing chart contract, reused here for e.g. "what's included" visuals | unchanged from `LLM_COMMUNICATION.md` |

Every section also carries a `themeOverride?` (optional per-section color/background tweak),
so "make the CTA banner section have a dark background" is a targeted patch, not a full
re-theme.

## 7. Conversation flow (the question sequence)

A fixed *stage machine*, not a free-for-all — this is what makes the LLM feel like a senior
designer running a real client intake instead of guessing. Detailed question wording and
defaults live in the system prompt (`aurelian-system.md`); the stages themselves:

1. `intro` — company/brand name, tagline, one-line description of what they sell.
2. `identity` — logo upload (optional), brand colors (hex or "pick for me"), overall tone
   (professional / friendly / bold / minimal — presented as a quick-pick, not an essay prompt).
3. `hero` — headline direction, CTA goal (quote / callback / download), hero visual style.
4. `navbar` — which links, whether to include a phone number / CTA button.
5. `services` — what products/coverage to feature, how many, icons vs. photos.
6. `leadForm` — **the important one** — see Section 8.
7. `trust` — testimonials, stats, partner logos (all optional, can skip).
8. `faq` — optional objection-handling content.
9. `footer` — links, social, required compliance/disclaimer text (ask directly — this is
   insurance, don't invent legal text).
10. `review` — full-page summary, then flip into **enhance mode**: from here on, any request
    ("change the button color," "add a carousel to the hero," "make the form 3 steps instead
    of 1") is treated as a targeted patch against the existing tree, not a restart.

At every stage the LLM offers a sensible one-tap default ("Not sure? I'd suggest a deep navy
and warm gold — professional but not sterile") rather than blocking on an answer, but it never
silently invents brand-sensitive facts (colors it can render, but license numbers, guarantee
language, or review counts it must ask for or omit).

## 8. The form engine (this is the differentiator, worth its own sub-schema)

`leadForm` is not one prop bag — it has its own nested schema, because "let the broker design
the form" is a whole feature on its own:

```json
{
  "type": "leadForm",
  "props": {
    "layout": "singleStep",           // or "multiStep"
    "steps": [
      {
        "title": "Get your quote",
        "fields": [
          { "id": "f1", "kind": "text", "label": "Full name", "required": true },
          { "id": "f2", "kind": "email", "label": "Email", "required": true },
          { "id": "f3", "kind": "tel", "label": "Phone", "required": false },
          { "id": "f4", "kind": "select", "label": "Coverage type",
            "options": ["Auto", "Home", "Life", "Business"], "required": true },
          { "id": "f5", "kind": "date", "label": "Policy start date", "required": false },
          { "id": "f6", "kind": "richtext", "label": "Anything else we should know?" }
        ]
      }
    ],
    "submitLabel": "Get my free quote",
    "consentText": "By submitting, you agree to be contacted about your quote."
  }
}
```

Field `kind` enum: `text | email | tel | number | date | select | radio | checkbox | textarea |
richtext | fileUpload`. Multi-step just means `steps.length > 1`; the renderer supplies the
step indicator, back/next buttons, and per-step validation via React Hook Form + Zod, generated
from this same JSON — one schema, two consumers (render + validate).

Consent/disclaimer text (`consentText`) is asked for explicitly in stage 6 or 9, never
auto-generated, for obvious compliance reasons.

## 9. Animation system

- **Entrance:** every rendered section is wrapped in a generic `<AnimatedSection>` that reads
  `animation.entrance` off its block and drives a GSAP `ScrollTrigger` fromTo (opacity + y or
  scale). The LLM picks the *enum value*, never the timeline — this is what keeps "feels custom"
  and "can't break" compatible.
- **Stagger:** grid-like sections (`servicesGrid`, `testimonials`, `logosBand`) support
  `animation.stagger: true`, animating children in sequence rather than as one block.
  Per the design-quality guidance below: use staggered/scroll reveals only where they earn their
  place, not on every section — restraint reads as more "high-end" than motion on everything.
- **Micro-interactions:** button hover/press states, nav-link underline, are plain CSS/Tailwind
  transitions — not GSAP — since they're stateless and don't need timeline orchestration.
- Respect `prefers-reduced-motion` globally; `<AnimatedSection>` short-circuits to a plain fade
  or no animation when it's set.

## 10. Visual-design guardrails (why the output won't look "AI-generated")

Worth calling out explicitly, since you flagged this: LLM-generated design defaults tend to
cluster around a small number of clichés (a cream background with a serif display and a
terracotta accent; a near-black page with one neon accent; a hairline-rule newspaper layout).
The system prompt (file 3) is written to actively steer away from these defaults and instead
derive a small **token system** per brand — 4–6 named brand colors, a deliberate type pairing
(display + body + a utility face for form labels/captions), and one "signature" layout choice —
so two different brokers' pages don't converge on the same look. This is baked into the prompt
itself, not left to chance.

## 11. Folder structure (module-local, ready to embed later)

```
landing-studio/                  ← the whole module, embeddable as a package later
  src/
    components/
      studio/
        ChatPanel.tsx
        MessageBubble.tsx
        SuggestionChips.tsx
        StagePicker.tsx
        DeviceFrameToggle.tsx
        PreviewPane.tsx
      sections/                  ← the rendered, themeable landing-page components
        Navbar.tsx
        Hero.tsx
        ServicesGrid.tsx
        LeadForm/
          LeadForm.tsx
          FormField.tsx
          StepIndicator.tsx
        Testimonials.tsx
        StatsBand.tsx
        Faq.tsx
        CtaBanner.tsx
        Footer.tsx
        AnimatedSection.tsx      ← shared GSAP wrapper
    generative-ui/
      schemas.ts                 ← Zod schemas, one per block type + the envelope schema
      registry/
        componentRegistry.tsx    ← type -> component map
    store/
      landingPageStore.ts        ← Zustand + zundo, holds draft tree + conversation stage
    services/
      ai/
        azure-ai.service.ts      ← unchanged from your current file
    theme/
      tokens.ts                  ← runtime CSS var injection from the brand palette
  server/
    index.mjs                    ← unchanged proxy, plus the validation layer from Section 4
    prompts/
      aurelian-system.md         ← file 3 of this plan
    validation/
      blockRules.ts              ← the semantic rules from Section 4, layer 2
```

## 12. Build order (so this isn't overwhelming)

1. Vite/Tailwind/TS scaffold, static two-pane layout (no LLM yet), hardcoded fake preview.
2. Zod schemas + component registry + a handful of static section components, rendering a
   hand-written JSON fixture — prove the renderer before touching the LLM at all.
3. Wire the existing proxy contract (`azure-ai.service.ts` → `/assistant/messages`), swap the
   fixture for real LLM output, add the retry-on-invalid-schema loop.
4. Add the patch/`id`-based merge logic to the store, the stage machine, undo/redo.
5. Build the lead-form engine (multi-step, field types, RHF+Zod validation) as its own
   sub-module, since it's the most complex single piece.
6. Layer in GSAP entrance/stagger animations, device-frame preview, fullscreen toggle.
7. Add the business-rule validation layer server-side (Section 4, layer 2) — do this before
   any broker-facing pilot, not after.

The next two files hand this plan to a coding agent (build prompt) and to the LLM itself
(system prompt).
