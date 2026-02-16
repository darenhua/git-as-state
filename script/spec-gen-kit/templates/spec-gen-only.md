Read `@{{WORKING_DIR}}`

This is an approved prototype — a human developer built this through a conversation with an AI assistant and approved the final result as a good solution. The entire prototype is what was approved. Your job is to produce a single spec that would let a coding agent reproduce this prototype's essence in a different codebase.

## The Conversation That Built This Prototype

Below is the conversation history where this prototype was developed. Study it to understand **what the human was trying to achieve, what they steered toward, what they corrected, and what they ultimately accepted.**

{{CONVERSATION_HISTORY}}

## Human's Guide Hint

The human provided a brief hint about what the core essence of this prototype is — what matters most if you had to boil it down:

> {{GUIDE_HINT}}

## Your Task

Produce a **single, holistic SPEC** that captures the entire approved prototype as one reproducible unit. Unlike other spec workflows that break a prototype into many independent requirements, this spec treats the prototype as one thing: "reproduce this."

The challenge is that "reproduce this" is meaningless without understanding:
- **What the human was actually trying to build** (from the conversation)
- **What the core essence is** (from the guide hint)
- **What a coding agent needs to know to get it right** (from the code)

Use the conversation history and the guide hint together to **pare down** the prototype to its essential definition of correctness. Not every line of code is equally important. Some parts are the soul of the prototype — the thing the human was chasing through the whole conversation. Other parts are scaffolding, boilerplate, or incidental decisions. The spec should make clear which is which.

**Critical context:** The coding agent who reads this spec also has full access to the approved prototype source code at `{{WORKING_DIR}}`. The spec should **reference the actual code by file path and line number** (`📎 path/to/file.ext#L12-L45`) rather than redundantly restating it. But unlike a targeted spec for one concern, this spec must give the agent a **map of the whole prototype** — what each part does, which parts are load-bearing, and how they connect.

## How to Analyze

1. **Read the conversation to understand intent.** What was the human trying to build? What problem were they solving? What did they keep pushing on? What did they accept as "good enough"? The conversation tells you what the human cares about — the code tells you how it was solved.

2. **Use the guide hint to identify the essence.** The hint is the human saying "if you had to summarize what this prototype IS, it's this." Use it to prioritize. The parts of the code that serve the hint are the core. Everything else is supporting infrastructure.

3. **Read the code to understand the full picture.** Map out every file, every component, every API route, every data flow. Understand how they connect. Then, guided by the conversation and hint, annotate which pieces are:
   - **Core** — the essential behavior the human was chasing. A reproduction that gets this wrong has failed.
   - **Supporting** — necessary infrastructure (routing, layout, types) that must exist for the core to work but isn't itself the point.
   - **Incidental** — decisions that could have gone another way without the human caring (variable names, file organization, specific library choices unless the library IS the point).

## What the SPEC Must Contain

### 1. WHAT — The Prototype's Purpose

Describe what this prototype does as a whole, narrated the way the human would explain it. Walk through the system showing how it works with concrete examples. This should read like the human's original vision — reconstructed from the conversation — not like a technical architecture doc.

Include:
- What the human was trying to build and why
- How a user/developer experiences the prototype (the walkthrough)
- What the human kept steering toward in the conversation (the obsessions)
- What was explicitly deferred or stubbed (the boundaries)

### 2. HOW — The Full Map

Break the prototype into its logical parts. For each part:

- Name the concern
- Classify it: **Core** | **Supporting** | **Incidental**
- Reference the source: `📎 {{WORKING_DIR}}/file.ext#L__-L__`
- Describe what it does and how it connects to other parts
- For **Core** parts: extract precise details (property tables, interface definitions, config tables, flow descriptions — whatever fits the domain)
- For **Supporting** parts: describe what must exist and why, but note where a different implementation would be acceptable
- For **Incidental** parts: note briefly, flag as flexible

The coding agent needs to understand the whole system, but needs to know where to spend their precision budget.

### 3. How the Parts Connect

Show the full structure — how data flows, how components compose, how the API routes connect to the UI, how state moves through the system. This is the map that prevents a coding agent from reproducing each piece correctly but assembling them wrong.

Use whatever format fits:
- For fullstack → request/response flow diagrams
- For UI → component tree with data flow annotations  
- For architecture → layer diagram with dependency arrows
- For integrations → sequence diagram

Reference the prototype code. Include technology constraints.

### 4. Reproduction Steps

Numbered steps to reproduce the **entire prototype** from scratch. Order matters — what must exist before what? Group steps by phase if the prototype has natural phases (e.g., "set up the data layer first, then the API routes, then the UI").

For each step:
- Reference the prototype code
- Note whether this step is **Core** (must be exact) or **Supporting** (must exist but implementation is flexible)

Include a **"What NOT to do"** section.

### 5. Definition of Success

A checklist of things the human would observe to confirm the reproduction captures the prototype's essence. Derived from:
- What the human kept steering toward in the conversation → hard requirements
- What the human corrected during development → boundaries of correctness  
- What the human verified at the end → acceptance criteria
- What the guide hint points to → the soul of the prototype

This is a **holistic** check — the reproduction should feel like the same prototype, not just pass a list of individual feature checks. Include a "gestalt" criterion: "If the human saw this reproduction side-by-side with the original, would they say it's the same thing?"

Explicitly state what is NOT a success criterion.

---

## Output Format

```markdown
# SPEC: [Prototype Name] — Full Reproduction

**Source of truth:** `{{WORKING_DIR}}/`
**Approved by:** Human developer (prototype review)
**Scope:** Full prototype reproduction
**Essence:** [One-line summary derived from the guide hint]

---

## 1. Purpose (WHAT)

[Narrative walkthrough of what this prototype does, reconstructed from the conversation. What was the human trying to build? How does it work? What did they obsess over?]

### The human's vision (from conversation)

[What the human was chasing — the corrections, the examples they gave, the things they pushed on]

### Scope boundaries

[What was explicitly deferred, stubbed, or accepted as incomplete]

---

## 2. Full Map (HOW)

### 2.1 [Part Name] — Core

[Description, precise details, code references]

📎 `{{WORKING_DIR}}/file.ext#L__-L__`

[Property table / interface definition / flow description]

### 2.2 [Part Name] — Supporting

[What must exist and why, but implementation is flexible]

📎 `{{WORKING_DIR}}/file.ext#L__-L__`

### 2.3 [Part Name] — Incidental

[Brief note, flagged as flexible]

[Repeat for all parts]

---

## 3. How the Parts Connect

[Full system diagram / flow / architecture — showing how everything fits together]

### Technology Constraints

[Framework, libraries, conventions]

---

## 4. Reproduction Steps

**Phase 1: [Foundation]**
1. [Step] — Core / Supporting
   📎 `{{WORKING_DIR}}/file.ext#L__-L__`

**Phase 2: [Core Logic]**
2. [Step] — Core
   📎 `{{WORKING_DIR}}/file.ext#L__-L__`

[Continue...]

### What NOT to do

[Common deviations that would break the reproduction]

---

## 5. Definition of Success

**Gestalt check:** If the human saw this reproduction side-by-side with the original prototype, would they say "yes, that's the same thing"?

**Specific checks:**
1. [Behavioral check derived from conversation obsessions]
2. [Behavioral check derived from corrections]
3. [Behavioral check derived from guide hint / essence]

### What is NOT a success criterion

[Explicit exclusions — incidental decisions, scaffolding details, etc.]
```
