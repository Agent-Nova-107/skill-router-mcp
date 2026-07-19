interface ParsedSkill {
    frontmatter: Record<string, unknown>;
    body: string;
}
export declare function parseSkillFile(content: string): ParsedSkill;
export declare function stringValue(value: unknown): string | undefined;
export declare function booleanValue(value: unknown): boolean | undefined;
export {};
