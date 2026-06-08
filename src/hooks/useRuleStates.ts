import {useCallback, useMemo, useState} from "react";

import ruleset from 'virtual:ruff-rules';
import type {TRuleGroups} from "~/domain/rule";
import {
    countRuleStates,
    countRules,
    generateConfig,
    type IRuleStats,
    type TRuleState,
    type TRuleStates,
} from "~/domain/ruleState";
import {useLocalStorage} from "~/hooks/useLocalStorage.ts";

const {groups} = ruleset;

interface IUseRuleStates {
    groups: TRuleGroups;
    ruleStates: TRuleStates;
    stats: IRuleStats;
    getConfig: () => string;
    setRuleState: (code: string, newState: TRuleState) => void;
    setGroupState: (groupCode: string, newState: TRuleState) => void;
    persist: () => void;
}

export const useRuleStates = (): IUseRuleStates => {
    const [storedRuleStates, setStoredRuleStates] = useLocalStorage<TRuleStates>({key: 'ruffRuleStates', initialValue: {}});
    const [ruleStates, setRuleStates] = useState<TRuleStates>(storedRuleStates);

    const totalRules = useMemo(() => countRules(groups), []);
    const stats = useMemo(() => countRuleStates(ruleStates, totalRules), [ruleStates, totalRules]);

    const getConfig = useCallback(() => generateConfig(groups, ruleStates), [ruleStates]);

    const setRuleState = useCallback((code: string, newState: TRuleState) => {
        setRuleStates((prev) => ({...prev, [code]: newState}));
    }, []);

    const setGroupState = useCallback((groupCode: string, newState: TRuleState) => {
        const {rules} = groups[groupCode];
        setRuleStates((prev) => {
            const next = {...prev};
            for (const rule of rules) next[rule.code] = newState;
            return next;
        });
    }, []);

    const persist = useCallback(() => {
        setStoredRuleStates(ruleStates);
    }, [ruleStates, setStoredRuleStates]);

    return {groups, ruleStates, stats, getConfig, setRuleState, setGroupState, persist};
};
