import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { booleanValue, parseSkillFile, stringValue } from "./frontmatter.js";
import { tokenize } from "./text.js";
const MAX_FILE_BYTES = 256 * 1024;
const MAX_DEPTH = 8;
const IGNORED_DIRECTORIES = new Set([".git", "dist", "node_modules", "target"]);
export function defaultRoots(cwd = process.cwd()) {
    const configured = process.env.SKILL_ROUTER_PATHS?.split(path.delimiter)
        .map((entry) => entry.trim())
        .filter(Boolean);
    if (configured?.length) {
        return configured;
    }
    const home = os.homedir();
    return [
        path.join(home, ".agents", "skills"),
        path.join(home, ".cursor", "skills"),
        path.join(cwd, ".agents", "skills"),
        path.join(cwd, ".cursor", "skills"),
    ];
}
export async function buildSkillIndex(roots = defaultRoots()) {
    const errors = [];
    const existingRoots = [];
    const skillPaths = [];
    for (const root of roots) {
        try {
            const canonical = await fs.realpath(root);
            const stat = await fs.stat(canonical);
            if (!stat.isDirectory()) {
                continue;
            }
            existingRoots.push(canonical);
            await collectSkillFiles(canonical, canonical, 0, skillPaths);
        }
        catch (error) {
            if (!isMissing(error)) {
                errors.push(`${root}: ${messageOf(error)}`);
            }
        }
    }
    const uniquePaths = [...new Set(skillPaths)].sort();
    const skills = [];
    for (const skillPath of uniquePaths) {
        try {
            const record = await readSkill(skillPath, existingRoots);
            skills.push(record);
        }
        catch (error) {
            errors.push(`${skillPath}: ${messageOf(error)}`);
        }
    }
    return {
        skills,
        roots: [...new Set(existingRoots)],
        errors,
        indexedAt: new Date().toISOString(),
    };
}
async function collectSkillFiles(root, directory, depth, results) {
    if (depth > MAX_DEPTH) {
        return;
    }
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isSymbolicLink()) {
            continue;
        }
        const entryPath = path.join(directory, entry.name);
        if (entry.isFile() && entry.name.toUpperCase() === "SKILL.MD") {
            results.push(await fs.realpath(entryPath));
            continue;
        }
        if (entry.isDirectory() &&
            !IGNORED_DIRECTORIES.has(entry.name) &&
            entryPath.startsWith(root)) {
            await collectSkillFiles(root, entryPath, depth + 1, results);
        }
    }
}
async function readSkill(skillPath, roots) {
    const stat = await fs.stat(skillPath);
    if (stat.size > MAX_FILE_BYTES) {
        throw new Error(`file exceeds ${MAX_FILE_BYTES} bytes`);
    }
    const content = await fs.readFile(skillPath, "utf8");
    const { frontmatter, body } = parseSkillFile(content);
    const parentName = path.basename(path.dirname(skillPath));
    const name = stringValue(frontmatter.name) ?? parentName;
    const description = stringValue(frontmatter.description) ??
        firstMeaningfulLine(body) ??
        `Skill ${name}`;
    const disabled = booleanValue(frontmatter["disable-model-invocation"]);
    const invocationMode = disabled === true
        ? "manual-only"
        : disabled === false
            ? "automatic"
            : "unspecified";
    const metadata = frontmatter.metadata &&
        typeof frontmatter.metadata === "object" &&
        !Array.isArray(frontmatter.metadata)
        ? frontmatter.metadata
        : {};
    const root = roots
        .filter((candidate) => skillPath.startsWith(candidate))
        .sort((left, right) => right.length - left.length)[0] ?? path.dirname(skillPath);
    const searchableBody = body.slice(0, 64 * 1024);
    return {
        name,
        description,
        path: skillPath,
        root,
        invocationMode,
        origin: stringValue(metadata.origin),
        body: searchableBody,
        tokens: tokenize(`${name} ${description} ${searchableBody}`),
    };
}
function firstMeaningfulLine(body) {
    return body
        .split(/\r?\n/)
        .map((line) => line.replace(/^#+\s*/, "").trim())
        .find((line) => line.length > 20);
}
function isMissing(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT");
}
function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=discovery.js.map