import type {TRule, TRuleGroup, TRuleGroups} from "~/domain/rule";

export type TRuleState = 'selected' | 'ignored' | 'unselected';
export type TGroupState = TRuleState | 'mixed';
export type TRuleStates = Partial<Record<string, TRuleState>>;

export interface IRuleStats {
    selected: number;
    ignored: number;
    total: number;
}

export const ruleStateOf = (states: TRuleStates, code: string): TRuleState =>
    states[code] ?? 'unselected';

export const deriveGroupState = (rules: TRule[], states: TRuleStates): TGroupState => {
    const groupStates = rules.map((rule) => ruleStateOf(states, rule.code));
    if (groupStates.every((s) => s === 'selected')) return 'selected';
    if (groupStates.every((s) => s === 'ignored')) return 'ignored';
    if (groupStates.every((s) => s === 'unselected')) return 'unselected';
    return 'mixed';
};

export const countRules = (groups: TRuleGroups): number =>
    Object.values(groups).reduce((sum, group) => sum + group.rules.length, 0);

export const countRuleStates = (states: TRuleStates, total: number): IRuleStats => {
    let selected = 0;
    let ignored = 0;
    for (const state of Object.values(states)) {
        if (state === 'selected') selected++;
        else if (state === 'ignored') ignored++;
    }
    return {selected, ignored, total};
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
        const groupState = deriveGroupState(group.rules, states);
        if (groupState === 'selected') {
            selected.push(groupCode);
        } else if (groupState === 'ignored') {
            ignored.push(groupCode);
        } else {
            for (const rule of group.rules) {
                const state = states[rule.code];
                if (state === 'selected') selected.push(rule.code);
                else if (state === 'ignored') ignored.push(rule.code);
            }
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
