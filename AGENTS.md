<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Errata Active Learning & Error Memory Protocol

This workspace is connected to **Errata**, an active error recurrence engine backed by an online Neo4j knowledge graph and local Markdown vault (`~/.errata/vault/`).

Whenever you work in this repository, you MUST follow this two-step error capture loop:

### 1. BEFORE Fixing Any Error (Compilation, Build, Test, or Runtime)
- You MUST call the MCP tool `check_error` with:
  - `error_message`: Full error text or primary exception message.
  - `stack_trace`: Top in-project stack frames (optional).
  - `technology`: Array of technologies involved (e.g. `["nextjs", "typescript", "neo4j"]`).
- **If `check_error` returns a match (`match: true`):**
  - Inform the user immediately using the provided `interrupt_prompt`:
    > *"You've hit this error X times before. Root cause: <cause>. Want to try fixing it yourself first? (hint: <hint>)"*
  - Give the user a moment to try fixing it themselves, or proceed if requested.

### 2. AFTER the Error is Solved and Verified
- You MUST call the MCP tool `log_resolution` with:
  - `error_message`: The original error.
  - `root_cause`: Plain-English explanation of why this error occurred.
  - `fix`: Clear, verified steps/code changes that resolved it.
  - `explanation`: Educational takeaway for the developer.
  - `diagrams`: Mermaid flowchart (`root_cause_flow`) and/or sequence diagram (`fix_sequence`).
  - `technology`: List of technologies involved.
  - `concepts`: Fundamental concepts taught (e.g. `["ports", "async-state"]`).
  - `user_solved_unaided`: `true` if the developer solved it unaided, `false` if you wrote the fix code.
- This permanently records the solution into the online Neo4j graph and updates the Markdown documentation in the local vault.

