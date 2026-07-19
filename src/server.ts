import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildSkillIndex } from "./discovery.js";
import { rankSkills, recommend } from "./ranking.js";
import { normalize } from "./text.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "skill-router",
      version: "0.1.0",
    },
    {
      instructions:
        "Read-only router for installed agent skills. Results are advisory: inspect the task and make the final skill selection. Never claim a skill was executed merely because it was recommended.",
    },
  );

  server.registerTool(
    "inventory_skills",
    {
      title: "Inventory installed skills",
      description:
        "Index installed SKILL.md files and summarize roots, invocation modes, duplicate names, and read errors. Read-only.",
      inputSchema: {
        includeDuplicatePaths: z
          .boolean()
          .optional()
          .default(true)
          .describe("Include all paths for duplicate skill names"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ includeDuplicatePaths }) => {
      const index = await buildSkillIndex();
      const byName = new Map<string, typeof index.skills>();
      for (const skill of index.skills) {
        const key = normalize(skill.name);
        const entries = byName.get(key) ?? [];
        entries.push(skill);
        byName.set(key, entries);
      }
      const duplicates = [...byName.values()]
        .filter((entries) => entries.length > 1)
        .map((entries) => ({
          name: entries[0].name,
          count: entries.length,
          ...(includeDuplicatePaths
            ? { paths: entries.map((entry) => entry.path) }
            : {}),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
      return jsonResult({
        total: index.skills.length,
        uniqueNames: byName.size,
        manualOnly: index.skills.filter(
          (skill) => skill.invocationMode === "manual-only",
        ).length,
        automatic: index.skills.filter(
          (skill) => skill.invocationMode === "automatic",
        ).length,
        unspecifiedInvocation: index.skills.filter(
          (skill) => skill.invocationMode === "unspecified",
        ).length,
        roots: index.roots,
        duplicates,
        errors: index.errors,
        indexedAt: index.indexedAt,
      });
    },
  );

  server.registerTool(
    "search_skills",
    {
      title: "Search installed skills",
      description:
        "Search installed skills deterministically by task terms. Returns scored candidates and reasons without choosing for the agent.",
      inputSchema: {
        query: z.string().min(2).max(2_000).describe("Task or capability to search for"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .default(15)
          .describe("Maximum unique skill names returned"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ query, limit }) => {
      const index = await buildSkillIndex();
      const results = rankSkills(index.skills, query).slice(0, limit);
      return jsonResult({
        query,
        results,
        indexedSkills: index.skills.length,
        indexErrors: index.errors,
        indexedAt: index.indexedAt,
      });
    },
  );

  server.registerTool(
    "recommend_skills",
    {
      title: "Recommend a skill flow",
      description:
        "Recommend primary, complementary, and additional installed skills for a task. Advisory only; the AI agent retains the final decision and additional candidates are not hidden.",
      inputSchema: {
        task: z.string().min(3).max(4_000).describe("Complete task description"),
        primaryLimit: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .default(5)
          .describe("Maximum primary recommendations; not a total candidate limit"),
        candidateLimit: z
          .number()
          .int()
          .min(3)
          .max(50)
          .optional()
          .default(20)
          .describe("Total candidate pool retained across all sections"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ task, primaryLimit, candidateLimit }) => {
      const index = await buildSkillIndex();
      const recommendation = recommend(
        index.skills,
        task,
        index.indexedAt,
        primaryLimit,
        Math.max(candidateLimit, primaryLimit),
      );
      if (index.errors.length) {
        recommendation.notes.push(
          `${index.errors.length} skill files or roots could not be indexed; consult inventory_skills for details.`,
        );
      }
      return jsonResult(recommendation);
    },
  );

  server.registerTool(
    "explain_skill",
    {
      title: "Explain an installed skill",
      description:
        "Return metadata and duplicate locations for an exact installed skill name without executing it or dumping its full prompt.",
      inputSchema: {
        name: z.string().min(1).max(200).describe("Exact skill name"),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ name }) => {
      const index = await buildSkillIndex();
      const key = normalize(name);
      const matches = index.skills
        .filter((skill) => normalize(skill.name) === key)
        .map((skill) => ({
          name: skill.name,
          description: skill.description,
          path: skill.path,
          root: skill.root,
          invocationMode: skill.invocationMode,
          origin: skill.origin,
        }));
      return jsonResult({
        name,
        found: matches.length > 0,
        matches,
        note:
          matches.length > 1
            ? "Multiple definitions exist. The agent must inspect provenance before selecting one."
            : undefined,
      });
    },
  );

  return server;
}

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function jsonResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}
