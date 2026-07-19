export type InvocationMode = "automatic" | "manual-only" | "unspecified";
export interface SkillRecord {
    name: string;
    description: string;
    path: string;
    root: string;
    invocationMode: InvocationMode;
    origin?: string;
    body: string;
    tokens: Set<string>;
}
export interface RankedSkill {
    name: string;
    description: string;
    path: string;
    invocationMode: InvocationMode;
    score: number;
    reasons: string[];
    duplicatePaths: string[];
}
export interface Recommendation {
    intent: string;
    primary: RankedSkill[];
    complementary: RankedSkill[];
    additionalCandidates: RankedSkill[];
    notes: string[];
    indexedSkills: number;
    indexedAt: string;
}
