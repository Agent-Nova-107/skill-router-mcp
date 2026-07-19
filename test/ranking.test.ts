import assert from "node:assert/strict";
import test from "node:test";

import { recommend } from "../src/ranking.js";
import { tokenize } from "../src/text.js";
import type { SkillRecord } from "../src/types.js";

const skills: SkillRecord[] = [
  skill(
    "diagnosing-bugs",
    "Disciplined diagnosis for difficult bugs and regressions",
    "manual-only",
  ),
  skill("tdd", "Test-driven development and regression tests"),
  skill("rust-patterns", "Idiomatic Rust coding patterns"),
  skill("code-review", "Review a completed code change"),
  skill("security-review", "Audit application security"),
  skill("documentation", "Write project documentation"),
];

test("recommends diagnosis while retaining additional candidates", () => {
  const result = recommend(
    skills,
    "Corrige un bug Rust intermittent avec un test de régression",
    "2026-07-19T00:00:00.000Z",
    2,
    6,
  );

  assert.equal(result.intent, "diagnose");
  assert.equal(result.primary[0].name, "diagnosing-bugs");
  assert.ok(
    [...result.primary, ...result.complementary, ...result.additionalCandidates].some(
      (candidate) => candidate.name === "rust-patterns",
    ),
  );
  assert.ok(result.notes.some((note) => note.includes("manual-only")));
});

test("collapses duplicate names but exposes their paths", () => {
  const duplicated = [
    skill("tdd", "Test-driven development", "unspecified", "/global/tdd/SKILL.md"),
    skill("tdd", "Project-specific TDD", "automatic", "/project/tdd/SKILL.md"),
  ];

  const result = recommend(
    duplicated,
    "Use TDD to implement this feature",
    "2026-07-19T00:00:00.000Z",
    5,
    10,
  );

  assert.equal(result.primary.length, 1);
  assert.equal(result.primary[0].duplicatePaths.length, 1);
  assert.notEqual(result.primary[0].duplicatePaths[0], result.primary[0].path);
});

test("tokenization treats object prototype names as plain input", () => {
  assert.doesNotThrow(() => tokenize("constructor function toString"));
});

function skill(
  name: string,
  description: string,
  invocationMode: SkillRecord["invocationMode"] = "unspecified",
  path = `/skills/${name}/SKILL.md`,
): SkillRecord {
  const body = `${description}\nUse when relevant.`;
  return {
    name,
    description,
    path,
    root: "/skills",
    invocationMode,
    body,
    tokens: tokenize(`${name} ${description} ${body}`),
  };
}
