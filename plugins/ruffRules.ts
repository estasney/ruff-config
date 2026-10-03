import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';
import { z } from 'zod';

import { ruffRuleListSchema, type TRuffRule } from '../src/domain/ruffRule';
import { ruffLinterListSchema, type TRuffLinter } from '../src/domain/ruffLinter';
import type { TRule, TRuleGroup, TRuleset } from '../src/domain/rule';
import { invariant } from '../src/lib/invariant';

const VIRTUAL_ID = 'virtual:ruff-rules';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets');
const RULES_PATH = resolve(ASSETS, 'ruffRules.json');
const LINTERS_PATH = resolve(ASSETS, 'ruffLinters.json');
const VERSION_PATH = resolve(ASSETS, 'ruffVersion.json');

type TSelectableRuffRule = TRuffRule & {
  code: string;
  linter: string;
  status: Exclude<TRuffRule['status'], { Removed: unknown }>;
};

// ruff rejects a removed rule selected by exact code.
const isSelectable = (rule: TRuffRule): rule is TSelectableRuffRule =>
  rule.code !== null && rule.linter !== null && !('Removed' in rule.status);

const toStatus = (status: TSelectableRuffRule['status']): TRule['status'] =>
  'Stable' in status
    ? { kind: 'Stable', since: status.Stable.since }
    : { kind: 'Preview', since: status.Preview.since };

const toRule = (raw: TSelectableRuffRule): TRule => ({
  code: raw.code,
  name: raw.name,
  description: raw.summary,
  explanation: raw.explanation,
  fixAvailability: raw.fix_availability,
  preview: raw.preview,
  status: toStatus(raw.status),
});

interface TGroupIdentity {
  key: string;
  name: string;
}

// A group's key is emitted directly as a ruff selector, so it must be a real
// prefix. The signal to split a linter into sub-selectors is whether it declares
// `categories`, not whether its own prefix is empty. ruff forms each subcategory
// selector by appending the category prefix to the linter prefix: pycodestyle
// ("") yields E, W and Pylint ("PL") yields PLC, PLE, PLR, PLW. Rule codes carry
// that full prefix (PLC0105), so categories are matched on linter.prefix +
// category.prefix. Linters without categories use their prefix directly.
const groupFor = (rule: TSelectableRuffRule, linters: Map<string, TRuffLinter>): TGroupIdentity => {
  const linter = linters.get(rule.linter);
  invariant(linter, `no linter metadata for ${rule.linter}`);

  if (linter.categories && linter.categories.length > 0) {
    const category = linter.categories.find((c) => rule.code.startsWith(linter.prefix + c.prefix));
    invariant(category, `no category prefix matches code ${rule.code}`);
    return { key: linter.prefix + category.prefix, name: `${linter.name} ${category.name}` };
  }

  invariant(linter.prefix !== '', `linter ${rule.linter} has neither prefix nor categories`);
  return { key: linter.prefix, name: linter.name };
};

const buildRuleset = (
  rawRules: TRuffRule[],
  rawLinters: TRuffLinter[],
  ruffVersion: string,
): TRuleset => {
  const linters = new Map(rawLinters.map((l) => [l.name, l] as const));
  const groups = new Map<string, TRuleGroup>();

  for (const rule of rawRules.filter(isSelectable)) {
    const { key, name } = groupFor(rule, linters);
    const existing = groups.get(key);
    if (existing) {
      existing.rules.push(toRule(rule));
    } else {
      groups.set(key, { name, rules: [toRule(rule)] });
    }
  }

  for (const group of groups.values()) {
    group.rules.sort((a, b) => a.code.localeCompare(b.code));
  }

  const sorted = Object.fromEntries([...groups].sort(([a], [b]) => a.localeCompare(b)));
  return { ruffVersion, groups: sorted };
};

const parseAsset = <T>(path: string, schema: z.ZodType<T>): T => {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[ruff-rules] ${path} does not match the expected ruff output shape:`);
    console.error(z.prettifyError(parsed.error));
    throw new Error(`${path} failed schema validation`);
  }
  return parsed.data;
};

const loadRuleset = (): string => {
  const rules = parseAsset(RULES_PATH, ruffRuleListSchema);
  const linters = parseAsset(LINTERS_PATH, ruffLinterListSchema);
  const { version } = JSON.parse(readFileSync(VERSION_PATH, 'utf8')) as { version: string };
  return `export default ${JSON.stringify(buildRuleset(rules, linters, version))}`;
};

export const ruffRules = (): Plugin => ({
  name: 'ruff-rules',
  resolveId(id) {
    if (id === VIRTUAL_ID) return RESOLVED_ID;
  },
  load(id) {
    if (id !== RESOLVED_ID) return;
    this.addWatchFile(RULES_PATH);
    this.addWatchFile(LINTERS_PATH);
    this.addWatchFile(VERSION_PATH);
    return loadRuleset();
  },
});
