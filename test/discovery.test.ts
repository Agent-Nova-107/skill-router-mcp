import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildSkillIndex } from "../src/discovery.js";

test("indexes nested skills and records invocation mode", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "skill-router-"));
  context.after(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });
  const directory = path.join(root, "security-review");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, "SKILL.md"),
    `---
name: security-review
description: Review code for security vulnerabilities
disable-model-invocation: true
metadata:
  origin: test
---

# Security review
`,
  );

  const index = await buildSkillIndex([root]);

  assert.equal(index.errors.length, 0);
  assert.equal(index.skills.length, 1);
  assert.equal(index.skills[0].name, "security-review");
  assert.equal(index.skills[0].invocationMode, "manual-only");
  assert.equal(index.skills[0].origin, "test");
});
