import {useCallback} from "react";

import {TriStateCheckbox} from "~/components/TriStateCheckbox";
import type {TRule} from "~/domain/rule";
import type {TRuleState} from "~/domain/ruleState";

interface IRuleRowProps {
    rule: TRule;
    state: TRuleState;
    onChange: (code: string, newState: TRuleState) => void;
}

export const RuleRow = ({rule, state, onChange}: IRuleRowProps) => {
    const handleChange = useCallback(
        (newState: TRuleState) => {
            onChange(rule.code, newState);
        },
        [onChange, rule.code],
    );

    return (
        <tr className="border-t border-gray-700 hover:bg-gray-700/40">
            <td className="px-2 py-1">
                <TriStateCheckbox state={state} onChange={handleChange} />
            </td>
            <td className="px-3 py-2 font-mono text-blue-400 font-medium">{rule.code}</td>
            <td className="px-3 py-2 font-mono text-gray-300 text-xs">{rule.name}</td>
            <td className="px-3 py-2 text-gray-400">{rule.description}</td>
        </tr>
    );
};
