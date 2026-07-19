import type { RankedSkill, Recommendation, SkillRecord } from "./types.js";
export declare function rankSkills(skills: SkillRecord[], query: string, includeIntentBoost?: boolean): RankedSkill[];
export declare function recommend(skills: SkillRecord[], task: string, indexedAt: string, primaryLimit?: number, candidateLimit?: number): Recommendation;
