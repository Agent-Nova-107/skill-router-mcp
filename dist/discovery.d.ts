import type { SkillRecord } from "./types.js";
export interface SkillIndex {
    skills: SkillRecord[];
    roots: string[];
    errors: string[];
    indexedAt: string;
}
export declare function defaultRoots(cwd?: string): string[];
export declare function buildSkillIndex(roots?: string[]): Promise<SkillIndex>;
