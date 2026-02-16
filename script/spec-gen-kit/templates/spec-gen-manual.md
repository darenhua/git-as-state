Read `@{{WORKING_DIR}}`

This is an approved prototype — a human developer reviewed the output and approved it as a good solution.

The human has pointed at a specific aspect of this prototype that they want to spec out. Their description may be brief, vague, or use shorthand — they're describing it the way they'd describe it to a colleague who already has context:

> {{APPROVED_REQUIREMENT}}

## Your Task

The human's description is a **pointer**, not a complete specification. Your job is to:

1. **Use the vague description to identify which part of the codebase they're talking about.** "The react grab stuff" means find the react-grab integration code. "How the cards look" means find the card styling. "The data fetching pattern" means find the repository/API layer. The human knows what they mean — you need to find it in the code.

2. **Once you've identified the relevant code, study it deeply and produce a full SPEC** as if you had been given a detailed requirements description. The code itself is the source of truth — the human's vague pointer just tells you where to look.

3. **Infer what the human likely cared about** based on what the code does. If the code has careful error handling, the human probably cared about error handling. If the code has a specific ordering of operations with enforcement, the human probably cared about that ordering. If the styling uses specific spacing values and dark mode variants, the human probably cared about the visual precision. Let the code's level of care guide your spec's level of detail.

**Critical context:** The coding agent who reads this spec also has full access to the approved prototype source code. The spec should **reference the actual code by file path and line number** (`📎 path/to/file.ext#L12-L45`) rather than redundantly restating it. The spec is a guide for reading, understanding, and reproducing the prototype — not a replacement for it.

## How to Analyze the Prototype

The approved requirement could be anything — a UI layout, an API pattern, a database access layer, a state management approach, a third-party integration, an algorithm, a data flow, etc.

Your job is to:

1. **Identify what kind of thing was approved** — is it visual? architectural? behavioral? a data contract? an interaction pattern? a system integration?
2. **Choose the right vocabulary for the spec** — a UI spec uses visual language (layout, spacing, color, hierarchy). An architecture spec uses structural language (layers, boundaries, data flow, contracts). An integration spec uses interface language (inputs, outputs, configuration, error handling). Match the spec language to the domain.
3. **Extract the details at the right level** — for a UI, that means exact spacing values and color tokens in property tables. For a repository pattern, that means method signatures, query patterns, and error handling contracts. For an integration, that means configuration shape, API surface, and data transformation steps. The level of detail should be whatever a coding agent needs to reproduce correctness without guessing.

## What the SPEC Must Contain

### 1. WHAT — Requirement (Behavioral)

Describe what the human observed and approved. Since you're working from a vague pointer + code, **reconstruct what the human likely saw and liked** by reading what the code produces.

This is written from the **human's perspective** — what they would have seen, experienced, or verified that made them approve this prototype.

**How to write the WHAT section well:**

The WHAT should read like a human walking someone through the system, explaining what it does by showing concrete examples of how it works. The style depends on the domain:

- **For UI/visual requirements** — describe the visual hierarchy and feel. What draws the eye first? What feels subordinate? Does it feel airy or cramped? Does the card float? These are short, observational bullets. Property tables in the HOW section carry the precise values.

- **For systems, APIs, fullstack features, integrations, or anything with behavior** — describe the system by narrating how a user or developer would walk through it. Define functions by giving concrete usage examples, not abstract signatures. For instance, don't just say "createCommit takes a callback that mutates the codebase." Instead say: "You call createCommit with a side-effect — like creating an empty folder with a blank page.tsx is one commit, then running create-next-app inside that folder is another commit using the same function." The example IS the spec. Specify ordering constraints and enforcement rules inline where they matter.

- **For data patterns, repo layers, or architectural boundaries** — describe the guarantees the pattern provides from the consumer's perspective. "Components never touch the database directly. All queries go through a typed repository that returns domain objects, not raw rows."

In all cases: if there are parts that are stubbed, incomplete, or intentionally left ambiguous in the prototype, call that out explicitly. The coding agent needs to know what's load-bearing vs. placeholder.

### 2. HOW — Specification

Break the implementation into its **logical concerns** — whatever they are for this domain. Each concern gets its own subsection with:

- A name that describes the concern
- A reference to the source code: `📎 {{WORKING_DIR}}/file.ext#L__-L__`
- A description of what that code achieves and **why** it produces the approved result
- **Precise details** extracted into the appropriate format for the domain:
  - For visual concerns → **property tables** (CSS values, spacing, colors, typography)
  - For data/API concerns → **interface definitions** (types, method signatures, return shapes)
  - For behavioral concerns → **state/flow diagrams** (inputs → transformations → outputs)
  - For configuration concerns → **config tables** (keys, values, defaults, constraints)
  - For integration concerns → **contract definitions** (what you send, what you get back, error cases)

Use whatever format makes the concern **reproducible without guessing**. The test is: could a coding agent read this section and know exactly what to build, with no ambiguity?

### 3. Structural Specification

Show how the pieces fit together:

- For UI → DOM tree / component hierarchy
- For architecture → layer diagram / module boundaries / data flow
- For integration → sequence diagram / call chain
- For data patterns → schema / entity relationships

Reference the prototype code. Include technology constraints (framework, libraries, conventions) that a coding agent must follow to stay compatible.

### 4. Reproduction Steps

Numbered steps a coding agent would follow to reproduce this from scratch. Each step should be verifiable. Reference prototype code where useful:

> "Follow the query pattern at `📎 {{WORKING_DIR}}/repo.ts#L22-L40`"

Include a **"What NOT to do"** section — common deviations or "improvements" that would break the approved result.

### 5. Definition of Success (Behavioral Verification)

A checklist of things the human would **observe or verify** to confirm the reproduction is correct. Each item is a yes/no check written from the human's perspective.

Since you're working from vague input, **derive success criteria from the code's own level of care.** If the code handles edge cases carefully, those edge cases are success criteria. If the code enforces ordering, ordering enforcement is a success criterion. If the code has specific visual values, visual precision is a success criterion.

Explicitly state what is **NOT** a success criterion to prevent the coding agent from optimizing for the wrong things. "Tests pass" and "builds succeed" are never sufficient — the human approved this prototype because of something they observed about the outcome, not because it compiled.

---

## Output Format

```markdown
# SPEC: [Feature/Pattern Name]

**Source of truth:** `{{WORKING_DIR}}/[primary file(s)]`
**Approved by:** Human developer (prototype review)
**Scope:** [One-line description of what this spec covers]
**Domain:** [UI | Architecture | Data | Integration | Behavior | ...]

---

## 1. Requirement (WHAT)

[Behavioral description of the approved outcome. For UI: describe the visual feel and hierarchy. For systems/APIs/fullstack: walk through the system narrating how it works with concrete usage examples — define functions by showing how they're called, specify ordering/enforcement rules inline. For data/architecture: describe the guarantees from the consumer's perspective.]

### What the human approved (behavioral observation)

[Bullet list — what the human would have observed/verified/experienced. Inferred from what the code produces and the human's pointer.]

---

## 2. Specification (HOW)

### 2.1 [Concern Name]

[Description + why this produces the approved result]

📎 `{{WORKING_DIR}}/file.ext#L__-L__`

[Property table / interface definition / config table / flow description — whatever format fits this concern]

[Repeat for each concern]

---

## 3. Structure

### 3.1 [Hierarchy / Architecture / Data Flow]

[Diagram or tree appropriate to the domain]

### 3.2 [Primary Code Reference]

📎 `{{WORKING_DIR}}/file.ext` (full file)

### 3.3 Technology Constraints

[Framework, libraries, conventions the coding agent must follow]

---

## 4. Reproduction Steps

[Numbered steps with code references]

### What NOT to do

[Common deviations that break the approved result]

---

## 5. Definition of Success

[Numbered yes/no behavioral checks — derived from the code's own level of care]

### What is NOT a success criterion

[Explicit exclusions]
```

---

## One-Shot Example

Below is an example of a correctly produced spec. This example happens to be a **UI spec**, so it uses property tables for visual concerns. For a different domain (e.g., a database repository pattern, a third-party SDK integration, or a state machine), the spec would use interface definitions, sequence diagrams, config tables, or whatever format fits that domain. **Match the format to the domain.**

<example>

# SPEC: Module Page Layout — Title, Subheading, and Card

**Source of truth:** `src/app/modules/hello-world/page.tsx`
**Approved by:** Human developer (prototype review)
**Scope:** The visual layout and styling of the page-level UI structure — specifically the title, subheading (description text), and content card.
**Domain:** UI

---

## 1. Requirement (WHAT)

A module page must present a clean, minimal page layout consisting of three visual elements stacked vertically:

1. **Title** — A large, bold heading that names the module. It is the dominant text element on the page.
2. **Subheading** — A quieter, secondary line of text below the title that provides brief context or purpose for the module.
3. **Card** — A visually distinct, bordered container below the header that holds the module's main content. It reads as a "panel" or "surface" that is elevated from the page background.

These three elements together create a **page hierarchy**: the eye moves from title → subheading → card content, top to bottom, with clear visual separation between the header zone and the content zone.

### What the human approved (behavioral observation)

- A clean, professional page that isn't cluttered
- Clear information hierarchy — you instantly know what the page is about (title), what it does (subheading), and where the content lives (card)
- The card feels like a distinct surface — visually separated from the page background by a border and a different background color
- Comfortable whitespace — nothing feels cramped
- The typography scale feels proportional — title commands attention, subheading is clearly subordinate, body text is normal reading size
- Light mode and dark mode both look intentional and consistent

---

## 2. Specification (HOW)

### 2.1 Page Background

The page has a tinted background that is NOT pure white or pure black. This is what makes the card visually "float" above the page.

📎 `src/app/modules/hello-world/page.tsx#L6`

| Property | Light Mode | Dark Mode |
|----------|-----------|-----------|
| Background color | `zinc-50` (#fafafa) | `zinc-950` (#09090b) |

### 2.2 Content Card

📎 `src/app/modules/hello-world/page.tsx#L18-L20`

| Property | Value |
|----------|-------|
| HTML element | `<main>` |
| Border radius | `rounded-lg` |
| Border | `border-zinc-200` / `dark:border-zinc-800` |
| Background | `bg-white` / `dark:bg-zinc-900` |
| Padding | `p-6` |

**Why it works:** Card background differs from page background. Combined with the border, this creates surface elevation without shadows.

---

## 3. Structure

### 3.1 DOM Hierarchy

```
div.page-wrapper          ← min-h-screen, bg, p-8
  div.container           ← mx-auto, max-w-4xl
    header                ← mb-8
      a.back-link         ← ← All Modules
      h1.title            ← Module name
      p.subheading        ← Description
    main.card             ← rounded-lg, border, bg, p-6
      [card content]
```

### 3.2 Component Template

📎 `src/app/modules/hello-world/page.tsx` (full file)

### 3.3 Technology Constraints

- Next.js App Router (`page.tsx` convention)
- Tailwind CSS v4 utility classes only
- Client Component (`"use client"`)
- Geist Sans font (inherited from root layout)

---

## 4. Reproduction Steps

1. Create `page.tsx` inside the module directory
2. Add `"use client"` at top
3. Export default function `[ModuleName]Page`
4. Follow DOM structure from Section 3.1
5. Apply exact Tailwind classes from Section 2 — do not substitute or "improve"

### What NOT to do

- Do not add shadows to the card — border-only is intentional
- Do not use `<div>` instead of `<main>` or `<header>`
- Do not skip dark mode classes

---

## 5. Definition of Success

1. **Title dominance** — largest, boldest text on the page
2. **Card as surface** — visible boundaries, different background from page
3. **Page feels airy** — generous padding, nothing cramped
4. **Dark mode parity** — equally clean, not a broken inversion

### What is NOT a success criterion

- Whether the page has specific functionality
- Whether tests or builds pass
- The specific text content of title or subheading

</example>
