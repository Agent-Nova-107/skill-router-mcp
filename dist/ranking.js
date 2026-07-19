import { detectIntent, normalize, tokenize, tokenizeExact } from "./text.js";
const INTENT_HINTS = {
    diagnose: ["diagnos", "debug", "bug", "regression", "tdd", "testing"],
    "security-review": ["security", "threat", "vulnerability", "review", "scan"],
    architecture: ["architecture", "codebase", "design", "domain", "module", "refactor"],
    testing: ["test", "tdd", "qa", "verification", "e2e"],
    implementation: ["implement", "feature", "tdd", "coding", "build"],
    planning: ["plan", "spec", "grill", "design", "wayfinder", "prototype"],
    review: ["review", "audit", "verify", "quality"],
    learning: ["teach", "learn", "documentation", "research"],
    general: [],
};
export function rankSkills(skills, query, includeIntentBoost = false) {
    const queryTokens = tokenizeExact(query);
    const expandedQueryTokens = tokenize(query);
    const normalizedQuery = normalize(query);
    const intent = detectIntent(query);
    const intentHints = includeIntentBoost ? INTENT_HINTS[intent] ?? [] : [];
    const ranked = skills
        .map((skill) => scoreSkill(skill, queryTokens, expandedQueryTokens, normalizedQuery, intentHints))
        .filter((skill) => skill.score > 0)
        .sort(compareRanked);
    return deduplicateByName(ranked);
}
export function recommend(skills, task, indexedAt, primaryLimit = 5, candidateLimit = 15) {
    const intent = detectIntent(task);
    const ranked = rankSkills(skills, task, true).slice(0, candidateLimit);
    const directHints = new Set(INTENT_HINTS[intent] ?? []);
    const primary = [];
    const remaining = [];
    for (const candidate of ranked) {
        const candidateTokens = tokenize(`${candidate.name} ${candidate.description}`);
        const direct = [...directHints].some((hint) => [...candidateTokens].some((token) => token.includes(hint) || hint.includes(token)));
        if (primary.length < primaryLimit && (direct || primary.length === 0)) {
            primary.push(candidate);
        }
        else {
            remaining.push(candidate);
        }
    }
    const complementary = remaining.slice(0, Math.min(5, remaining.length));
    const additionalCandidates = remaining.slice(complementary.length);
    const notes = [
        "Recommendations are advisory; the AI agent must inspect the task and make the final selection.",
        "Additional candidates are retained to avoid hiding relevant specialist skills.",
    ];
    if (primary.some((skill) => skill.invocationMode === "manual-only")) {
        notes.push("At least one primary skill is manual-only and requires explicit user or agent invocation.");
    }
    if (ranked.some((skill) => skill.duplicatePaths.length > 0)) {
        notes.push("Duplicate skill names were collapsed; inspect duplicatePaths before choosing an implementation.");
    }
    return {
        intent,
        primary,
        complementary,
        additionalCandidates,
        notes,
        indexedSkills: skills.length,
        indexedAt,
    };
}
function scoreSkill(skill, queryTokens, expandedQueryTokens, normalizedQuery, intentHints) {
    const name = normalize(skill.name);
    const description = normalize(skill.description);
    const body = normalize(skill.body);
    const nameTokens = tokenizeExact(skill.name);
    const descriptionTokens = tokenizeExact(skill.description);
    let score = 0;
    const reasons = [];
    if (name.length >= 3 && normalizedQuery.includes(name)) {
        score += 60;
        reasons.push("skill name appears in the task");
    }
    const nameMatches = intersection(queryTokens, nameTokens);
    const descriptionMatches = intersection(queryTokens, descriptionTokens);
    const bodyMatches = [...queryTokens].filter((token) => !nameTokens.has(token) &&
        !descriptionTokens.has(token) &&
        body.includes(token));
    score += nameMatches.length * 18;
    score += descriptionMatches.length * 8;
    score += Math.min(bodyMatches.length, 5) * 2;
    const expandedSkillTokens = tokenize(`${skill.name} ${skill.description}`);
    const semanticMatches = intersection(expandedQueryTokens, expandedSkillTokens).filter((token) => !queryTokens.has(token));
    score += Math.min(semanticMatches.length, 3) * 2;
    if (nameMatches.length) {
        reasons.push(`name matches: ${nameMatches.join(", ")}`);
    }
    if (descriptionMatches.length) {
        reasons.push(`description matches: ${descriptionMatches.join(", ")}`);
    }
    if (bodyMatches.length) {
        reasons.push(`workflow mentions: ${bodyMatches.slice(0, 5).join(", ")}`);
    }
    if (semanticMatches.length) {
        reasons.push(`related terms: ${semanticMatches.slice(0, 3).join(", ")}`);
    }
    const hintMatches = intentHints.filter((hint) => name.includes(hint) || description.includes(hint));
    if (hintMatches.length) {
        score += Math.min(hintMatches.length, 3) * 7;
        reasons.push(`intent fit: ${hintMatches.slice(0, 3).join(", ")}`);
    }
    if (skill.invocationMode === "manual-only") {
        reasons.push("manual invocation only");
    }
    return {
        name: skill.name,
        description: skill.description,
        path: skill.path,
        invocationMode: skill.invocationMode,
        score,
        reasons,
        duplicatePaths: [],
    };
}
function deduplicateByName(skills) {
    const selected = new Map();
    for (const skill of skills) {
        const key = normalize(skill.name);
        const existing = selected.get(key);
        if (!existing) {
            selected.set(key, skill);
            continue;
        }
        existing.duplicatePaths.push(skill.path, ...skill.duplicatePaths);
    }
    return [...selected.values()].sort(compareRanked);
}
function intersection(left, right) {
    return [...left].filter((value) => right.has(value)).sort();
}
function compareRanked(left, right) {
    return right.score - left.score || left.name.localeCompare(right.name);
}
//# sourceMappingURL=ranking.js.map