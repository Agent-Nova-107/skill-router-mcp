const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "for",
  "from",
  "how",
  "in",
  "la",
  "le",
  "les",
  "of",
  "on",
  "or",
  "ou",
  "pour",
  "sur",
  "the",
  "to",
  "un",
  "une",
  "use",
  "with",
]);

const EXPANSIONS: Record<string, string[]> = {
  architecture: ["codebase", "design", "module", "refactor"],
  audit: ["review", "check", "verify", "inspection"],
  bug: ["debug", "diagnose", "regression", "fix"],
  bouton: ["button", "ui", "interface"],
  buttons: ["button", "ui", "interface"],
  ci: ["continuous", "integration", "github", "actions"],
  concevoir: ["design", "plan", "architecture"],
  corrige: ["fix", "bug", "debug"],
  database: ["db", "sql", "postgres", "migration"],
  erreur: ["error", "bug", "debug", "diagnose"],
  feature: ["implement", "build", "tdd", "spec"],
  interface: ["ui", "frontend", "accessibility"],
  implementer: ["implement", "feature", "build"],
  performance: ["benchmark", "latency", "optimize", "profiling"],
  plan: ["spec", "design", "architecture", "grill"],
  rust: ["cargo", "clippy"],
  revue: ["review", "audit", "verify"],
  securite: ["security", "vulnerability", "threat"],
  security: ["vulnerability", "threat", "audit"],
  test: ["tdd", "testing", "verification", "qa"],
};

export function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function tokenize(value: string): Set<string> {
  const initial = tokenizeExact(value);
  const result = new Set(initial);
  for (const token of initial) {
    const expansions = Object.hasOwn(EXPANSIONS, token) ? EXPANSIONS[token] : [];
    for (const expansion of expansions) {
      result.add(expansion);
    }
  }
  return result;
}

export function tokenizeExact(value: string): Set<string> {
  const initial = normalize(value)
    .split(/[^a-z0-9+#]+/)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
  const result = new Set(initial);
  for (const token of initial) {
    if (token.length > 3 && token.endsWith("s")) {
      result.add(token.slice(0, -1));
    }
  }
  return result;
}

export function detectIntent(task: string): string {
  const tokens = tokenize(task);
  if (hasAny(tokens, ["bug", "debug", "diagnose", "regression", "fix"])) {
    return "diagnose";
  }
  if (hasAny(tokens, ["security", "vulnerability", "threat"])) {
    return "security-review";
  }
  if (hasAny(tokens, ["feature", "implement", "build"])) {
    return "implementation";
  }
  if (hasAny(tokens, ["architecture", "codebase", "module", "refactor"])) {
    return "architecture";
  }
  if (hasAny(tokens, ["test", "testing", "tdd", "qa"])) {
    return "testing";
  }
  if (hasAny(tokens, ["plan", "spec", "design", "idea"])) {
    return "planning";
  }
  if (hasAny(tokens, ["review", "audit", "check", "verify"])) {
    return "review";
  }
  if (hasAny(tokens, ["learn", "teach", "explain"])) {
    return "learning";
  }
  return "general";
}

function hasAny(tokens: Set<string>, candidates: string[]): boolean {
  return candidates.some((candidate) => tokens.has(candidate));
}
