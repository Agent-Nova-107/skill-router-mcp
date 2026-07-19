# Skill Router MCP

Skill Router MCP is a local, read-only router for large collections of agent skills. It indexes installed `SKILL.md` files, searches their metadata and workflows, reports duplicate definitions, and recommends a transparent candidate set to an AI agent.

The router does not execute skills and does not make the final choice. It returns:

- primary candidates;
- complementary skills;
- additional candidates that might otherwise be hidden by a small result limit;
- invocation mode (`automatic`, `manual-only`, or unspecified);
- matching evidence and duplicate paths.

No LLM, embedding API, account, telemetry, or network call is used for routing.

## MCP tools

- `inventory_skills` — summarizes indexed roots, invocation modes, duplicate names, and read errors.
- `search_skills` — deterministic scored search for a capability or task.
- `recommend_skills` — proposes primary, complementary, and additional candidates while leaving the decision to the agent.
- `explain_skill` — returns metadata and duplicate locations for an exact skill name.

All tools are declared read-only and idempotent.

## Requirements

- Node.js 20 or newer.
- An MCP client with local stdio support, such as Cursor.

## Install

```bash
npm install -g https://github.com/Agent-Nova-107/skill-router-mcp/archive/refs/heads/main.tar.gz
```

Add the server to Cursor's user MCP configuration:

```json
{
  "mcpServers": {
    "skill-router": {
      "command": "skill-router-mcp"
    }
  }
}
```

Install the optional agent skill:

```bash
npx skills add Agent-Nova-107/skill-router-mcp --global --agent cursor --yes
```

Copy `cursor/skill-routing.mdc` to `~/.cursor/rules/skill-routing.mdc` if you want Cursor to consult the router automatically for ambiguous or complex tasks.

Restart Cursor after changing MCP configuration.

## Indexed locations

By default the server checks:

```text
~/.agents/skills/
~/.cursor/skills/
<current-directory>/.agents/skills/
<current-directory>/.cursor/skills/
```

Override this list with `SKILL_ROUTER_PATHS`, using the operating system's normal path separator (`;` on Windows, `:` on Unix):

```powershell
$env:SKILL_ROUTER_PATHS = "C:\skills;D:\team-skills"
```

Symbolic links are not followed. Skill files larger than 256 KiB and traversal deeper than eight directories are rejected.

## Routing model

Routing is deterministic:

1. Parse YAML frontmatter and invocation metadata.
2. Normalize English and French task terms.
3. Score name, description, workflow text, and lifecycle intent separately.
4. Collapse duplicate names while exposing every duplicate path.
5. Return a broad candidate pool divided into primary, complementary, and additional sections.

Scores rank candidates; they are not probabilities or quality ratings.

## Security and limitations

- Tools accept task text and skill names, not arbitrary filesystem paths.
- The server only reads the configured skill roots.
- Prompt text inside a skill is treated as searchable data, never executed.
- Keyword routing can miss semantic relationships or rank generic descriptions too highly.
- A recommendation proves relevance only, not quality, freshness, compatibility, or safety.
- The AI agent must inspect the task, codebase, and selected skill before acting.

## Development

```bash
npm ci
npm run check
npm test
npm run build
```

To smoke-test the stdio server with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
