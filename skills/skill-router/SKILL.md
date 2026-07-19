---
name: skill-router
description: Finds and compares installed agent skills through the read-only skill-router MCP. Use when the user asks which skill to use or when a task is ambiguous, unfamiliar, multi-domain, or requires a multi-step workflow.
---

# Skill Router

1. For a known skill name, call `explain_skill`.
2. For a capability lookup, call `search_skills`.
3. For an ambiguous or multi-step task, call `recommend_skills`.
4. Review primary, complementary, and additional candidates.
5. Select only the skills justified by the current task and codebase.
6. Respect `manual-only` metadata and disclose duplicates when they affect the choice.

The router is advisory and read-only. It does not install, invoke, or execute skills. Never claim otherwise.
