import { parse as parseYaml } from "yaml";
export function parseSkillFile(content) {
    const normalized = content.replace(/^\uFEFF/, "");
    if (!normalized.startsWith("---")) {
        return { frontmatter: {}, body: normalized };
    }
    const lines = normalized.split(/\r?\n/);
    if (lines[0].trim() !== "---") {
        return { frontmatter: {}, body: normalized };
    }
    const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (closingIndex < 0) {
        return { frontmatter: {}, body: normalized };
    }
    const yaml = lines.slice(1, closingIndex).join("\n");
    let frontmatter = {};
    try {
        const value = parseYaml(yaml);
        if (value && typeof value === "object" && !Array.isArray(value)) {
            frontmatter = value;
        }
    }
    catch {
        frontmatter = {};
    }
    return {
        frontmatter,
        body: lines.slice(closingIndex + 1).join("\n"),
    };
}
export function stringValue(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
}
export function booleanValue(value) {
    return typeof value === "boolean" ? value : undefined;
}
//# sourceMappingURL=frontmatter.js.map