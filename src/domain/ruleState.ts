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
