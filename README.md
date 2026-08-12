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
| `ruffVersion.json` | `ruff version --output-format json`, filtered to `version` |

To update, run `make assets` (regenerates all three), then `make build`.

Releases are separate: `make version-patch` (or `version-minor`,
`version-major`) bumps `package.json` and `package-lock.json`, commits only
those two files as `vX.Y.Z`, and creates an annotated tag `vX.Y.Z` noting the
bundled ruff data version. It refuses to run on a dirty working tree.

Keep all three regenerated from the same ruff release. `ruffLinters.json` is the
source of truth for selector keys: each linter's non-empty `prefix` is its
selector, and the one linter with an empty `prefix` (pycodestyle) is split into
the selectors listed in its `categories` (`E`, `W`).
