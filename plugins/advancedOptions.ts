import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';
import { z } from 'zod';

import {
  advancedOptionCatalogSchema,
  contributionKindSchema,
  prerequisiteKindSchema,
  type TAdvancedOptions,
  type TContributionKind,
  type TContributionOf,
  type TPrerequisiteKind,
  type TPrerequisiteOf,
} from '../src/domain/advancedOption';
import type { TRuleGroups } from '../src/domain/rule';
import { invariant } from '../src/lib/invariant';
import { loadRuleset } from './ruffRules';

const VIRTUAL_ID = 'virtual:advanced-options';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const CATALOG_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/advancedOptions.json');

const parseCatalog = (): TAdvancedOptions => {
  const raw: unknown = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const parsed = advancedOptionCatalogSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[advanced-options] ${CATALOG_PATH} does not match its schema:`);
    console.error(z.prettifyError(parsed.error));
    throw new Error(`${CATALOG_PATH} failed schema validation`);
  }
  return parsed.data.options;
};

interface IRulesetIndex {
  groups: TRuleGroups;
  ruleCodes: Set<string>;
}

const isKnownSelector = (selector: string, { groups, ruleCodes }: IRulesetIndex): boolean =>
  Object.hasOwn(groups, selector) || ruleCodes.has(selector);

const prerequisiteCheckers: {
  [K in TPrerequisiteKind]: (id: string, prerequisite: TPrerequisiteOf<K>, index: IRulesetIndex) => void;
} = {
  [prerequisiteKindSchema.enum['group-selected']]: (id, prerequisite, { groups }) => {
    invariant(Object.hasOwn(groups, prerequisite.group), `${id}: unknown rule group ${prerequisite.group}`);
  },
};

const contributionCheckers: {
  [K in TContributionKind]: (id: string, contribution: TContributionOf<K>, index: IRulesetIndex) => void;
} = {
  [contributionKindSchema.enum['per-file-ignores']]: (id, contribution, index) => {
    for (const selector of contribution.selectors) {
      invariant(isKnownSelector(selector, index), `${id}: unknown rule selector ${selector}`);
    }
  },
};

const checkPrerequisite = <K extends TPrerequisiteKind>(
  id: string,
  prerequisite: TPrerequisiteOf<K>,
  index: IRulesetIndex,
): void => {
  prerequisiteCheckers[prerequisite.kind](id, prerequisite, index);
};

const checkContribution = <K extends TContributionKind>(
  id: string,
  contribution: TContributionOf<K>,
  index: IRulesetIndex,
): void => {
  contributionCheckers[contribution.kind](id, contribution, index);
};

const checkAgainstRuleset = (options: TAdvancedOptions, groups: TRuleGroups): void => {
  const index: IRulesetIndex = {
    groups,
    ruleCodes: new Set(Object.values(groups).flatMap((group) => group.rules.map((rule) => rule.code))),
  };
  for (const [id, { prerequisite, contribution }] of Object.entries(options)) {
    checkPrerequisite(id, prerequisite, index);
    checkContribution(id, contribution, index);
  }
};

export const advancedOptions = (): Plugin => ({
  name: 'advanced-options',
  resolveId(id) {
    if (id === VIRTUAL_ID) return RESOLVED_ID;
  },
  load(id) {
    if (id !== RESOLVED_ID) return;
    this.addWatchFile(CATALOG_PATH);
    const options = parseCatalog();
    checkAgainstRuleset(options, loadRuleset().groups);
    return `export default ${JSON.stringify(options)}`;
  },
});
