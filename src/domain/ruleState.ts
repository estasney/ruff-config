import type {TRule, TRuleGroup, TRuleGroups} from "~/domain/rule";

export type TRuleState = 'on' | 'off';
export type TGroupState = TRuleState | 'indeterminate';
export type TRuleStates = Partial<Record<string, TRuleState>>;

export interface IRuleStats {
    selected: number;
    total: number;
}

export const ruleStateOf = (states: TRuleStates, code: string): TRuleState =>
    states[code] ?? 'off';

export const deriveGroupState = (rules: TRule[], states: TRuleStates): TGroupState => {
    const groupStates = rules.map((rule) => ruleStateOf(states, rule.code));
    if (groupStates.every((s) => s === 'on')) return 'on';
    if (groupStates.every((s) => s === 'off')) return 'off';
    return 'indeterminate';
};

export const countRules = (groups: TRuleGroups): number =>
    Object.values(groups).reduce((sum, group) => sum + group.rules.length, 0);

export const countRuleStates = (states: TRuleStates, total: number): IRuleStats => {
    let selected = 0;
    for (const state of Object.values(states)) {
        if (state === 'on') selected++;
    }
    return {selected, total};
};

export const filterGroups = (groups: TRuleGroups, term: string): [string, TRuleGroup][] => {
    if (!term) return Object.entries(groups);
    const needle = term.toLowerCase();
    return Object.entries(groups)
        .map(([code, group]): [string, TRuleGroup] | null => {
            const groupMatches =
                code.toLowerCase().includes(needle) || group.name.toLowerCase().includes(needle);
            if (groupMatches) return [code, group];
            const matchingRules = group.rules.filter(
                (rule) =>
                    rule.code.toLowerCase().includes(needle) ||
                    rule.name.toLowerCase().includes(needle) ||
                    rule.description.toLowerCase().includes(needle),
            );
            if (matchingRules.length > 0) return [code, {...group, rules: matchingRules}];
            return null;
        })
        .filter((entry): entry is [string, TRuleGroup] => entry !== null);
};

export const generateConfig = (groups: TRuleGroups, states: TRuleStates): string => {
    const selected: string[] = [];
    const ignored: string[] = [];

    for (const [groupCode, group] of Object.entries(groups)) {
        const onCodes: string[] = [];
        const offCodes: string[] = [];
        for (const rule of group.rules) {
            if (ruleStateOf(states, rule.code) === 'on') onCodes.push(rule.code);
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

    if (selected.length === 0 && ignored.length === 0) {
        return '[tool.ruff.lint]\nselect = []\n';
    }

    selected.sort();
    ignored.sort();

    let config = '[tool.ruff.lint]\n';
    if (selected.length > 0) {
        config += `select = [\n${selected.map((s) => `    "${s}",`).join('\n')}\n]\n`;
    }
    if (ignored.length > 0) {
        config += `ignore = [\n${ignored.map((s) => `    "${s}",`).join('\n')}\n]\n`;
    }
    return config;
};
