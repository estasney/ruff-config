import {useContext} from "react";

import {type IRuleStatesContext, RuleStatesContext} from "~/context/RuleStatesContext";
import {invariant} from "~/lib/invariant";

export const useRuleStates = (): IRuleStatesContext => {
    const context = useContext(RuleStatesContext);
    invariant(context, 'useRuleStates must be used within a RuleStatesProvider');
    return context;
};
