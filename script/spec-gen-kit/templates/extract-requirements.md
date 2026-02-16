You are reading a conversation history between a human developer and an AI assistant where they collaborated to build a prototype. Your job is to reverse-engineer what the human actually cared about — what requirements they were steering toward — by studying the human's messages.

## The Conversation

{{CONVERSATION_HISTORY}}

## Your Task

Study the **human's messages** in this conversation. Pay attention to:

1. **What the human repeated or came back to** — If the human mentioned something once, it might be incidental. If they brought it up again, corrected the AI about it, or followed up to verify it was there, it's load-bearing. Repetition = importance.

2. **What the human corrected** — When the AI produced something and the human said "no, not like that, like this" — the correction reveals what the human actually wanted. The wrong version the AI produced is useful context too: it shows the boundary of what's acceptable.

3. **What the human described with concrete examples** — When the human stopped speaking abstractly and started giving specific scenarios ("like, I want to call createCommit and pass in a function that creates the folder, and that's one commit"), they're defining a hard requirement. The example IS the spec.

4. **What the human asked to verify at the end** — The last few human messages often reveal what they checked before approving. These are the acceptance criteria.

5. **What the human explicitly deprioritized or deferred** — "stub this out", "don't worry about that for now", "we can handle that later" — these define the boundary of scope. They're important because they tell a future coding agent what NOT to spend time on.

6. **Ordering and enforcement constraints** — If the human said things must happen in a specific order, or that certain preconditions must be met before a step can run, capture those exactly. These are easy to miss and hard to reverse-engineer from code alone.

## What to Produce

Produce a **detailed requirements extraction** — a rich description of what the human wanted, loaded with the specific insights, context, corrections, and examples from the conversation. This output will be fed directly to a separate spec-generation agent that has access to the prototype code but has NOT seen this conversation. That agent depends on the detail you provide here to understand what matters and why.

**Be generous with detail.** The spec-generation agent has no other context about the human's intent. Everything you extract here — the corrections, the examples the human gave, the things they obsessed over, the boundaries they drew — is the only signal that agent gets. If you leave something out, the spec agent will have to guess, and it will probably guess wrong.

The output must be:

- **Concrete, not abstract** — describe requirements through usage examples and scenarios, not feature lists. "The createCommit function takes a callback that mutates the codebase before committing — like creating an empty folder is one commit, running a setup script is another" NOT "a generic commit abstraction with side-effect support."

- **Narrated as a walkthrough** — describe the system by walking through how it works, the way a human would explain it to a colleague. Numbered items are fine but can flow between structured and narrative.

- **Loaded with conversational context** — when the human corrected the AI, include BOTH what the AI got wrong AND what the human wanted instead. This correction pair is extremely valuable — it defines the boundary of correctness. When the human gave an example to explain what they meant, include the example verbatim or near-verbatim. When the human verified something at the end, note what they checked and what the outcome was.

- **Honest about edges** — if the human accepted something as stubbed/incomplete, say so and explain what "done" would look like vs. what "good enough for now" looks like. "The create-PR function is stubbed — the human accepted that GitHub CLI integration wasn't figured out yet, but the interface and call site should exist. The human expects this to eventually call `gh pr create` but didn't require it for this prototype."

- **Prioritized by obsession** — requirements the human hammered on repeatedly should be front and center with the most detail. Things mentioned once in passing should be at the end or noted as minor.

- **Includes the human's definition-of-success signals** — what did the human check at the end? What did they ask to see? What made them say "yes"? These are the acceptance criteria that the spec agent needs to build the Definition of Success section.

## Output Format

Structure the output as one or more requirement blocks. If the human was steering toward multiple distinct concerns (e.g., a UI layout AND an API pattern AND a data flow), separate them. If it was all one thing, keep it as one block.

```markdown
## Requirement 1: [Short Name]

[Narrative description with concrete examples, written in a natural voice. Walk through the system/feature/pattern describing what it does, how the human expected it to work, with specific scenarios as the spec. Call out ordering constraints, enforcement rules, and edge cases inline.]

**What the human kept coming back to:**
- [The things they repeated, corrected, or verified — these are the hard requirements]

**Key corrections from the conversation:**
- [What the AI got wrong → what the human wanted instead. These define boundaries of correctness.]

**What the human checked before approving:**
- [What they verified, asked to see, or tested at the end]

**What the human accepted as incomplete/stubbed:**
- [Things explicitly deferred or marked as "good enough for now", with context on what "done" would look like]

---

## Requirement 2: [Short Name]

[Same format, if there's a second distinct concern]
```

If there's only one requirement, skip the numbering and just write it as a single block.

## What NOT to Produce

- Do not produce a generic feature list or PRD-style document
- Do not describe what the AI did — describe what the human wanted
- Do not infer requirements that the human never mentioned or steered toward
- Do not clean up or formalize the human's language into corporate-speak — keep the natural, concrete, example-driven voice
- Do not include the human's off-topic messages, greetings, or meta-discussion about the process
