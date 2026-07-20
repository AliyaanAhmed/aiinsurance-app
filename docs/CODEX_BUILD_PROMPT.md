# Build prompt — paste this into Claude Code / Codex to scaffold the app

Everything below the line is meant to be handed to your coding agent as-is (edit the bracketed
placeholders first). It assumes it's starting a fresh module folder, separate from your main
app, that will later be embedded/imported.

---

You are scaffolding a standalone React module called **Landing Studio**: a two-pane app where a
user chats with an AI on the left and sees a live, animated preview of an insurance landing page
(with a lead-capture form) on the right. It will later be embedded inside a larger app, so keep
it self-contained — no reliance on global routing, no assumptions about a host app's auth.

## 1. Project setup

- Vite + React 18 + TypeScript.
- Tailwind CSS, configured with CSS custom properties for brand tokens (`--brand-primary`,
  `--brand-secondary`, `--brand-accent`, `--font-display`, `--font-body`) so components can be
  re-themed at runtime per broker without rebuilding.
- ESLint + Prettier, strict TS (`strict: true`).

Install these dependencies:

```bash
npm install zod zustand zundo framer-motion gsap react-hook-form @hookform/resolvers
npm install @dnd-kit/core @dnd-kit/sortable recharts lucide-react @tiptap/react @tiptap/starter-kit
npm install -D @types/node
```

Do not add any CDN `<script>` tags for any of the above — everything is imported through npm.

## 2. Folder structure

Create exactly this structure (empty/stub files are fine where noted):

```
src/
  components/
    studio/
      ChatPanel.tsx
      MessageBubble.tsx
      SuggestionChips.tsx
      StagePicker.tsx
      DeviceFrameToggle.tsx
      PreviewPane.tsx
    sections/
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
      AnimatedSection.tsx
  generative-ui/
    schemas.ts
    registry/
      componentRegistry.tsx
  store/
    landingPageStore.ts
  services/
    ai/
      azure-ai.service.ts
  theme/
    tokens.ts
  App.tsx
  main.tsx
server/
  index.mjs
  prompts/
    aurelian-system.md
  validation/
    blockRules.ts
  .env.example
```

## 3. Layout (App.tsx)

A resizable two-pane layout: `ChatPanel` on the left (~38% width, min 340px), `PreviewPane` on
the right (remaining width). `PreviewPane` has a top bar with: device-size toggle (mobile /
tablet / desktop, implemented as a fixed-width scaled container — 375px / 768px / 100% — not an
iframe), and a fullscreen toggle (expands `PreviewPane` to cover the whole viewport, hiding
`ChatPanel` behind a slide-out toggle).

## 4. `generative-ui/schemas.ts`

Define Zod schemas for:

- A base `BlockEnvelope` schema: `{ id: string, type: <enum>, action: "upsert"|"remove"|
  "reorder", animation: { entrance: "fadeUp"|"fadeIn"|"slideInLeft"|"zoomIn"|"none", stagger:
  boolean }, themeOverride?: {...}, props: <discriminated by type> }`.
- One schema per section type: `navbar`, `hero`, `logosBand`, `servicesGrid`, `leadForm`,
  `testimonials`, `statsBand`, `faq`, `ctaBanner`, `footer`, `dynamicChart`. Use Zod's
  discriminated union on `type` so TypeScript narrows `props` correctly.
- The `leadForm` props schema needs its own nested field schema: `kind` enum (`text | email |
  tel | number | date | select | radio | checkbox | textarea | richtext | fileUpload`),
  `label`, `required`, `options?` (for select/radio), and a `steps: FormStep[]` array (single
  step = array of length 1).
- The full response envelope schema: `{ assistant_markdown: string, suggestions: string[],
  stage: <stage enum>, ui_blocks: BlockEnvelope[] }`.

Export TypeScript types via `z.infer<>` — don't hand-write parallel interfaces.

## 5. `generative-ui/registry/componentRegistry.tsx`

A plain object/map from block `type` → React component, e.g.:

```ts
export const componentRegistry: Record<BlockType, React.ComponentType<{ props: any }>> = {
  navbar: Navbar,
  hero: Hero,
  servicesGrid: ServicesGrid,
  leadForm: LeadForm,
  testimonials: Testimonials,
  statsBand: StatsBand,
  faq: Faq,
  ctaBanner: CtaBanner,
  footer: Footer,
  dynamicChart: DynamicChart,
};
```

`PreviewPane` iterates the store's ordered block list and renders `componentRegistry[block.type]`
wrapped in `<AnimatedSection animation={block.animation}>`. If a block's `type` isn't in the
registry, render nothing in production and a small dev-only warning box in development — never
throw, never render raw JSON.

## 6. `store/landingPageStore.ts`

Zustand store (wrapped with the `zundo` `temporal` middleware for undo/redo) holding:

- `stage: string` — current conversation stage.
- `blocks: BlockEnvelope[]` — the current landing page tree, ordered.
- `messages: {role: 'user'|'assistant', content: string}[]` — chat history sent to the proxy.
- `applyServerResponse(response)` — merges incoming `ui_blocks` into `blocks` by `id`:
  `action: "upsert"` replaces-or-appends, `"remove"` filters it out, `"reorder"` moves it to a
  given index. New ids should be flagged so `AnimatedSection` plays a full entrance; changed
  existing ids should play a lighter "updated" pulse instead of re-animating from scratch.

## 7. `AnimatedSection.tsx`

A wrapper component that takes `{ entrance, stagger, children }`, uses GSAP + ScrollTrigger to
animate the section in on scroll (or immediately, if already in view when it's first added),
and short-circuits to a plain opacity fade with no motion if
`window.matchMedia('(prefers-reduced-motion: reduce)').matches`. `stagger` animates direct
children in sequence rather than the whole block at once (used by grid-like sections).

## 8. `LeadForm/` engine

`LeadForm.tsx` takes the `leadForm` block's `props` (steps + fields), builds a Zod schema from
the field list at render time (map `kind` → the right Zod validator, `required` → `.min(1)` /
non-optional), and drives it with `react-hook-form` + `@hookform/resolvers/zod`. Multi-step:
show `StepIndicator`, validate only the current step's fields before advancing, keep all
step values in one RHF form context so back/forward doesn't lose data. `FormField.tsx` switches
on `kind` to render the right input (text/email/tel/number/date inputs, a `<select>`, radio
group, checkbox, `<textarea>`, a constrained Tiptap instance for `richtext` limited to
bold/italic/link marks only, and a file input for `fileUpload`).

## 9. `services/ai/azure-ai.service.ts`

Keep this matching the existing contract in `LLM_COMMUNICATION.md`: POST to
`http://127.0.0.1:8787/assistant/messages` with `{ conversationId, message, messages }`, return
the parsed `{ id, message, suggestions, title, ui, stage }` response. Add a thin retry: if the
proxy responds with a `422` (schema validation failure), resend once with an added system note
before surfacing an error state to the chat UI.

## 10. `server/index.mjs` and `server/validation/blockRules.ts`

Extend the existing proxy (same shape as `LLM_COMMUNICATION.md` — loads
`server/prompts/aurelian-system.md`, calls Azure Foundry, parses the JSON). After parsing:

1. Validate against the Zod envelope schema from `schemas.ts` (share the schema file between
   client and server via a common package/path, don't duplicate it).
2. Run `blockRules.ts` — plain functions, one per rule from the architecture plan's Section 4
   (word-count ceilings, required lead-form fields, no raw HTML/script strings, denylist of
   absolute/guarantee insurance phrases, hex-contrast check, no competitor names). Return a list
   of violations.
3. If there are violations, make **one** corrective call back to the LLM with the violations
   listed plainly, asking it to fix just those fields, before responding to the client. If it
   still fails, respond with `422` and a safe fallback `assistant_markdown` apologizing and
   asking the user to rephrase — never forward invalid blocks to the frontend.

## 11. `server/.env.example`

```env
FOUNDRY_RESPONSES_URL=
FOUNDRY_API_KEY=
FOUNDRY_MODEL=gpt-5.1
```

Do not commit a real `.env`; `.gitignore` it.

## 12. Acceptance checklist for this scaffold

- [ ] App boots with `npm run dev`, two-pane layout renders, device-size + fullscreen toggles
      work with no LLM call yet (use a hardcoded fixture JSON matching the envelope schema).
- [ ] Fixture renders through the real `componentRegistry`, not hand-written markup, so we know
      the registry works before the LLM is involved.
- [ ] `npm run typecheck` passes with strict TS and no `any` in `schemas.ts`.
- [ ] Sending a message in `ChatPanel` round-trips through `azure-ai.service.ts` → proxy →
      Azure Foundry and updates `PreviewPane` with a smooth entrance animation on new blocks.
- [ ] Reduced-motion is respected (test via OS/browser setting).
- [ ] Undo/redo (via `zundo`) reverts the last block change without a full page reload.

Stop and ask me before choosing a UI kit for the studio chrome beyond what's listed above, and
before adding any dependency not in Section 1.
