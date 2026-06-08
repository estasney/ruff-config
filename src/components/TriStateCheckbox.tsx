import {useCallback} from "react";

import {StateIcon} from "~/components/StateIcon";
import type {TGroupState, TRuleState} from "~/domain/ruleState";

interface ITriStateCheckboxProps {
    state: TGroupState;
    onChange: (newState: TRuleState) => void;
    label?: string;
    className?: string;
}

export const TriStateCheckbox = ({state, onChange, label, className}: ITriStateCheckboxProps) => {
    const cycleState = useCallback(() => {
        if (state === 'unselected' || state === 'mixed') onChange('selected');
        else if (state === 'selected') onChange('ignored');
        else onChange('unselected');
    }, [onChange, state]);

    const displayState: TRuleState = state === 'mixed' ? 'unselected' : state;

    return (
        <button
            onClick={cycleState}
            className={`flex items-center gap-2 text-left w-full px-2 py-1 rounded hover:bg-gray-700 ${className ?? ''}`}
        >
            <StateIcon state={displayState} />
            {label ? <span className="truncate">{label}</span> : null}
        </button>
    );
};