import {createContext} from 'react';

import type {TAdvancedOptions} from "~/domain/advancedOption";
import type {TAdvancedOptionStates} from "~/domain/advancedOptionState";
import type {TRuleGroups} from "~/domain/rule";
import type {IRuleStats, TRuleState, TRuleStates} from "~/domain/ruleState";

export interface IRuleStatesContext {
    groups: TRuleGroups;
    ruleStates: TRuleStates;
    advancedOptions: TAdvancedOptions;
    advancedOptionStates: TAdvancedOptionStates;
    stats: IRuleStats;
    droppedCodes: readonly string[];
    getConfig: () => string;
    setRuleState: (code: string, newState: TRuleState) => void;
    setGroupState: (groupCode: string, newState: TRuleState) => void;
    setAdvancedOptionState: (id: string, isEnabled: boolean) => void;
}

export const RuleStatesContext = createContext<IRuleStatesContext | null>(null);
