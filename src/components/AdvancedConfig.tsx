import {useCallback, useState} from "react";

import {AdvancedOptionRow} from "~/components/AdvancedOptionRow";
import type {TAdvancedOptions} from "~/domain/advancedOption";
import {prerequisiteLabel, type TAdvancedOptionStates} from "~/domain/advancedOptionState";
import {contributionSummary} from "~/domain/config";

interface IAdvancedConfigProps {
    advancedOptions: TAdvancedOptions;
    advancedOptionStates: TAdvancedOptionStates;
    onOptionChange: (id: string, isEnabled: boolean) => void;
}

export const AdvancedConfig = ({advancedOptions, advancedOptionStates, onOptionChange}: IAdvancedConfigProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    return (
        <div className="bg-gray-800 rounded-b-lg shadow-lg overflow-hidden mb-4">
            <button
                onClick={handleToggle}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between pl-6 pr-4 py-3 text-left text-sm bg-gray-700/40 hover:bg-gray-700"
            >
                <span className="font-bold text-gray-200">Advanced Config</span>
                <span className="font-sans text-base text-gray-400">{isExpanded ? '▾' : '▸'}</span>
            </button>

            {isExpanded ? (
                <div className="border-t border-gray-700 bg-gray-800">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-700/40 text-left text-gray-300">
                            <tr>
                                <th className="w-12 px-2 py-2" />
                                <th className="w-28 px-3 py-2 font-medium">Applies to</th>
                                <th className="w-64 px-3 py-2 font-medium">Effect</th>
                                <th className="px-3 py-2 font-medium">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(advancedOptions).map(([id, option]) => (
                                <AdvancedOptionRow
                                    key={id}
                                    id={id}
                                    option={option}
                                    isEnabled={advancedOptionStates[id] === true}
                                    prerequisiteLabel={prerequisiteLabel(option.prerequisite)}
                                    contributionSummary={contributionSummary(option.contribution)}
                                    onChange={onOptionChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};
