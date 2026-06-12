import {createContext} from 'react';

import type {TRuleGroups} from "~/domain/rule";
import type {IRuleStats, TRuleState, TRuleStates} from "~/domain/ruleState";

export interface IRuleStatesContext {
    groups: TRuleGroups;
    ruleStates: TRuleStates;
    stats: IRuleStats;
    droppedCodes: readonly string[];
    getConfig: () => string;
    setRuleState: (code: string, newState: TRuleState) => void;
    setGroupState: (groupCode: string, newState: TRuleState) => void;
}

export const RuleStatesContext = createContext<IRuleStatesContext | null>(null);
