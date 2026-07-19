import assert from "node:assert/strict";
import test from "node:test";

import { parseSkillFile } from "../src/frontmatter.js";

test("parses YAML frontmatter without consuming the body", () => {
  const parsed = parseSkillFile(`---
name: diagnosing-bugs
description: Diagnose hard regressions
disable-model-invocation: true
---

# Workflow

Reproduce before fixing.
`);

  assert.equal(parsed.frontmatter.name, "diagnosing-bugs");
  assert.equal(parsed.frontmatter["disable-model-invocation"], true);
  assert.match(parsed.body, /Reproduce before fixing/);
});

test("treats malformed or absent frontmatter as plain content", () => {
  const parsed = parseSkillFile("# Skill\n\nNo metadata.");

  assert.deepEqual(parsed.frontmatter, {});
  assert.match(parsed.body, /No metadata/);
});
