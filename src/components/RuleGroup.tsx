import {useCallback} from "react";

import {RuleRow} from "~/components/RuleRow";
import {TriStateCheckbox} from "~/components/TriStateCheckbox";
import type {TRuleGroup} from "~/domain/rule";
import {ruleStateOf, type TGroupState, type TRuleState, type TRuleStates} from "~/domain/ruleState";

interface IRuleGroupProps {
    groupCode: string;
    group: TRuleGroup;
    groupState: TGroupState;
    isExpanded: boolean;
    ruleStates: TRuleStates;
    onToggle: (groupCode: string) => void;
    onGroupChange: (groupCode: string, newState: TRuleState) => void;
    onRuleChange: (code: string, newState: TRuleState) => void;
}

export const RuleGroup = ({
    groupCode,
    group,
    groupState,
    isExpanded,
    ruleStates,
    onToggle,
    onGroupChange,
    onRuleChange,
}: IRuleGroupProps) => {
    const handleToggle = useCallback(() => {
        onToggle(groupCode);
    }, [onToggle, groupCode]);

    const handleGroupChange = useCallback(
        (newState: TRuleState) => {
            onGroupChange(groupCode, newState);
        },
        [onGroupChange, groupCode],
    );

    return (
        <div className="border-b border-gray-700 last:border-b-0">
            <div className="flex items-center bg-gray-700/40 hover:bg-gray-700">
                <div className="w-12 shrink-0 flex justify-center">
                    <TriStateCheckbox state={groupState} onChange={handleGroupChange} />
                </div>
                <button
                    onClick={handleToggle}
                    className="flex-1 flex items-center justify-between px-4 py-3 text-left text-sm"
                >
                    <div>
                        <span className="font-mono font-bold text-blue-400">{groupCode}</span>
                        <span className="mx-2 text-gray-500">—</span>
                        <span className="text-gray-200">{group.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({group.rules.length} rules)</span>
                    </div>
                    <span className="font-sans text-base text-gray-500">{isExpanded ? '▾' : '▸'}</span>
                </button>
            </div>

            {isExpanded ? (
                <div className="border-t border-gray-700 bg-gray-800">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-700/40 text-left text-gray-300">
                            <tr>
                                <th className="w-12 px-2 py-2" />
                                <th className="w-28 px-3 py-2 font-medium">Code</th>
                                <th className="w-64 px-3 py-2 font-medium">Name</th>
                                <th className="px-3 py-2 font-medium">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.rules.map((rule) => (
                                <RuleRow
                                    key={rule.code}
                                    rule={rule}
                                    state={ruleStateOf(ruleStates, rule.code)}
                                    onChange={onRuleChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};
