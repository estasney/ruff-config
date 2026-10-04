import {type ChangeEvent, useCallback} from "react";

import {CodeSpans} from "~/components/CodeSpans";
import type {TAdvancedOption} from "~/domain/advancedOption";

interface IAdvancedOptionRowProps {
    id: string;
    option: TAdvancedOption;
    isEnabled: boolean;
    prerequisiteLabel: string;
    contributionSummary: string;
    onChange: (id: string, isEnabled: boolean) => void;
}

export const AdvancedOptionRow = ({
    id,
    option,
    isEnabled,
    prerequisiteLabel,
    contributionSummary,
    onChange,
}: IAdvancedOptionRowProps) => {
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onChange(id, event.target.checked);
        },
        [onChange, id],
    );

    return (
        <tr className="border-t border-gray-700 hover:bg-gray-700/40">
            <td className="px-2 py-1 text-center">
                <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={handleChange}
                    className="h-4 w-4 cursor-pointer accent-blue-500"
                />
            </td>
            <td className="px-3 py-2 font-mono font-medium text-blue-400">{prerequisiteLabel}</td>
            <td className="px-3 py-2 text-gray-300 text-xs">
                <CodeSpans text={contributionSummary} />
            </td>
            <td className="px-3 py-2 text-gray-400 text-xs">
                <CodeSpans text={option.description} />
            </td>
        </tr>
    );
};
