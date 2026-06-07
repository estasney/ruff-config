# ruff-config

A configurator for ruff's lint rules. Rules are grouped by linter and keyed by
the linter's canonical ruff selector, so a group's key can be emitted directly
into `[tool.ruff.lint]`.

## Regenerating the rule data

Three assets under `src/assets/` are produced verbatim from ruff and consumed by
the Vite plugin (`plugins/ruffRules.ts`), which validates them and performs the
grouping transform at build time:

| Asset | Source |
| --- | --- |
| `ruffRules.json` | `ruff rule --all --output-format json` |
| `ruffLinters.json` | `ruff linter --output-format json` |
| `ruffVersion.json` | `{ "version": "<ruff --version>" }` |

To update, regenerate the two JSON exports and record the ruff version:

```bash
ruff rule --all --output-format json > src/assets/ruffRules.json
ruff linter --output-format json > src/assets/ruffLinters.json
```

Then set `ruffVersion.json` to the ruff version you used, e.g. `{ "version": "0.15.15" }`.

Keep all three regenerated from the same ruff release. `ruffLinters.json` is the
source of truth for selector keys: each linter's non-empty `prefix` is its
selector, and the one linter with an empty `prefix` (pycodestyle) is split into
the selectors listed in its `categories` (`E`, `W`).
