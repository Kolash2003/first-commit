# Errata — AI Knowledge & Error Recurrence Engine

Errata turns the broken error loop (**error → paste → fix → forget**) into an active learning engine (**error → "seen 3× before" → attempt or defer → fix → documented forever**).

Backed by an **Online Neo4j Graph Database** (Neo4j AuraDB or remote instance) and local Obsidian-compatible Markdown vault, Errata connects to AI coding assistants (OpenCode, Claude Code, Cursor, Codex, Windsurf) through the **Model Context Protocol (MCP)**.

---

## 1. Quick Start

### 1.1 Configure Online Neo4j Connection
Create `.env.local` or copy from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your online Neo4j credentials (e.g. from a free [Neo4j AuraDB](https://neo4j.com/cloud/platform/aura-graph-database/) instance):

```env
NEO4J_URI=neo4j+s://your-db-id.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-secure-password
NEO4J_DATABASE=neo4j
```

Or provide a single connection URL:
```env
NEO4J_URL=neo4j+s://neo4j:your-password@your-db-id.databases.neo4j.io:7687
```

### 1.2 Start the Next.js Dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive Force-Directed Knowledge Graph, Occurrence Timeline, Markdown Vault, Analytics, and MCP Playground.

---

## 2. Connecting to AI Assistants

Errata exposes an MCP server over `stdio` via `bin/errata-mcp.ts`.

### 2.1 OpenCode
OpenCode detects `.mcp.json` and `opencode.json` in this workspace automatically.

To configure globally across all repositories, add to `~/.config/opencode/opencode.jsonc`:
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "errata": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "tsx",
        "/home/aneesh/Desktop/developer/first-commit/bin/errata-mcp.ts"
      ]
    }
  }
}
```

### 2.2 Claude Code
Add Errata to Claude Code:
```bash
claude mcp add errata -- npx -y tsx /home/aneesh/Desktop/developer/first-commit/bin/errata-mcp.ts
```

### 2.3 Cursor
Create or add to `.cursor/mcp.json` (or via Cursor Settings → Features → MCP):
```json
{
  "mcpServers": {
    "errata": {
      "command": "npx",
      "args": ["-y", "tsx", "/home/aneesh/Desktop/developer/first-commit/bin/errata-mcp.ts"]
    }
  }
}
```

### 2.4 Windsurf / Codeium
Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "errata": {
      "command": "npx",
      "args": ["-y", "tsx", "/home/aneesh/Desktop/developer/first-commit/bin/errata-mcp.ts"]
    }
  }
}
```

---

## 3. How Errata Intercepts and Captures Errors

```
[ Error Occurs in Terminal / Build ]
              │
              ▼
    1. AI calls `check_error`
              │
      ┌───────┴───────┐
      ▼               ▼
[ New Error ]   [ Seen 3x Before ]
      │               │
      │       AI surfaces Interrupt Prompt:
      │       "You've hit this before. Root cause: <cause>.
      │        Want to try fixing it yourself first?"
      │               │
      └───────┬───────┘
              ▼
    2. Fix Applied & Verified
              │
              ▼
    3. AI calls `log_resolution`
              │
      ┌───────┴────────────────────────┐
      ▼                                ▼
[ Online Neo4j Graph DB ]      [ Local Markdown Vault ]
- ErrorClass & Occurrence      - ~/.errata/vault/errors/
- RootCause & Fix nodes        - Mermaid Diagrams
- Concept & Tech tags          - Obsidian-compatible
```

### Protocol Rules for AI Assistants
The server instructions and [AGENTS.md](file:///home/aneesh/Desktop/developer/first-commit/AGENTS.md) instruct the AI assistant to:
1. **Before fixing any error**: Call `check_error` with the error text and stack trace.
2. **If matched**: Present the interrupt prompt to the developer so they have an opportunity to solve it unaided.
3. **After fixing**: Call `log_resolution` with root cause, fix steps, Mermaid diagrams, and whether the developer solved it unaided.

---

## 4. MCP Tools Reference

| Tool | Trigger | Key Arguments | Purpose |
|------|---------|---------------|---------|
| `check_error` | Before fixing | `error_message`, `stack_trace`, `technology` | Intercepts error; checks Neo4j using fingerprint + vector embeddings; returns recurrence count and interrupt prompt. |
| `log_resolution` | After fixing | `error_message`, `root_cause`, `fix`, `explanation`, `diagrams`, `technology`, `concepts`, `user_solved_unaided` | Persists nodes & edges to Neo4j; writes Markdown doc with Mermaid diagrams to local vault. |
| `get_error_doc` | On demand | `doc_path` | Retrieves generated Markdown file and Mermaid diagrams. |
| `get_stats` | On demand | _none_ | Returns recidivism rate, self-solve rate, and top recurring error classes. |
| `search_errors` | On demand | `query`, `limit` | Searches recorded error classes by keyword or concept. |

---

## 5. Scripts

- `npm run dev`: Launch the Next.js web dashboard on [http://localhost:3000](http://localhost:3000).
- `npm run mcp`: Run the Errata MCP stdio server.
- `npm run test:normalizer`: Run unit tests verifying deterministic fingerprint matching across error variations.
- `npm run test:mcp`: Run integration test simulating the full check → fix → log loop.
- `npx tsx scripts/seed-demo.ts`: Seed realistic error classes and Mermaid diagrams into Neo4j and the local vault.
