import {
    contributionKindSchema,
    type TAdvancedOptions,
    type TContributionKind,
    type TContributionOf,
} from "~/domain/advancedOption";
import {isPrerequisiteMet, type TAdvancedOptionStates} from "~/domain/advancedOptionState";
import type {TRuleGroups} from "~/domain/rule";
import {ruleStateOf, type TRuleStates} from "~/domain/ruleState";

interface IConfigAdditions {
    perFileIgnores: Map<string, Set<string>>;
}

interface IContributionBehavior<K extends TContributionKind> {
    apply: (contribution: TContributionOf<K>, additions: IConfigAdditions) => void;
    summary: (contribution: TContributionOf<K>) => string;
}

const contributionBehaviors: {[K in TContributionKind]: IContributionBehavior<K>} = {
    [contributionKindSchema.enum['per-file-ignores']]: {
        apply: (contribution, {perFileIgnores}) => {
            const selectors = perFileIgnores.get(contribution.glob) ?? new Set<string>();
            for (const selector of contribution.selectors) selectors.add(selector);
            perFileIgnores.set(contribution.glob, selectors);
        },
        summary: (contribution) =>
            `Ignore ${contribution.selectors.map((s) => `\`${s}\``).join(', ')} in \`${contribution.glob}\``,
    },
};

const applyContribution = <K extends TContributionKind>(
    contribution: TContributionOf<K>,
    additions: IConfigAdditions,
): void => {
    contributionBehaviors[contribution.kind].apply(contribution, additions);
};

export const contributionSummary = <K extends TContributionKind>(contribution: TContributionOf<K>): string =>
    contributionBehaviors[contribution.kind].summary(contribution);

const collectConfigAdditions = (
    groups: TRuleGroups,
    ruleStates: TRuleStates,
    advancedOptions: TAdvancedOptions,
    advancedOptionStates: TAdvancedOptionStates,
): IConfigAdditions => {
    const additions: IConfigAdditions = {perFileIgnores: new Map()};
    for (const [id, {prerequisite, contribution}] of Object.entries(advancedOptions)) {
        if (advancedOptionStates[id] === true && isPrerequisiteMet(prerequisite, groups, ruleStates)) {
            applyContribution(contribution, additions);
        }
    }
    return additions;
};

export const generateConfig = (
    groups: TRuleGroups,
    ruleStates: TRuleStates,
    advancedOptions: TAdvancedOptions,
    advancedOptionStates: TAdvancedOptionStates,
): string => {
    const selected: string[] = [];
    const ignored: string[] = [];

    for (const [groupCode, group] of Object.entries(groups)) {
        const onCodes: string[] = [];
        const offCodes: string[] = [];
        for (const rule of group.rules) {
            if (ruleStateOf(ruleStates, rule.code) === 'on') onCodes.push(rule.code);
            else offCodes.push(rule.code);
        }

        if (onCodes.length === 0) continue;

        if (offCodes.length === 0) {
            selected.push(groupCode);
            continue;
        }

        // Partial group: spell it whichever way is shorter. Either the chosen
        // rules listed directly, or the whole group minus the rules left off.
        // The group form also keeps any rules Ruff later adds to the group on.
        if (1 + offCodes.length < onCodes.length) {
            selected.push(groupCode);
            ignored.push(...offCodes);
        } else {
            selected.push(...onCodes);
        }
    }

    selected.sort();
    ignored.sort();

    let config = '[tool.ruff.lint]\n';
    if (selected.length === 0 && ignored.length === 0) {
        config += 'select = []\n';
    }
    if (selected.length > 0) {
        config += `select = [\n${selected.map((s) => `    "${s}",`).join('\n')}\n]\n`;
    }
    if (ignored.length > 0) {
        config += `ignore = [\n${ignored.map((s) => `    "${s}",`).join('\n')}\n]\n`;
    }

    const {perFileIgnores} = collectConfigAdditions(groups, ruleStates, advancedOptions, advancedOptionStates);
    if (perFileIgnores.size > 0) {
        config += '\n[tool.ruff.lint.per-file-ignores]\n';
        for (const [glob, selectors] of [...perFileIgnores].sort(([a], [b]) => a.localeCompare(b))) {
            config += `${JSON.stringify(glob)} = [${[...selectors].sort().map((s) => `"${s}"`).join(', ')}]\n`;
        }
    }
    return config;
};
