# Contributing

Contributions should preserve four properties:

- routing remains local and deterministic;
- MCP tools remain read-only;
- additional candidates are not silently discarded;
- scoring reasons remain visible to the calling agent.

Every scoring or discovery change requires a test that demonstrates the intended ranking and guards against a relevant false positive.

Run before opening a pull request:

```bash
npm ci
npm run check
npm test
npm run build
```
