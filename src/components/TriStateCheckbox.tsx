import {useCallback, useEffect, useRef} from "react";

import type {TGroupState, TRuleState} from "~/domain/ruleState";

interface ITriStateCheckboxProps {
    state: TGroupState;
    onChange: (newState: TRuleState) => void;
}

export const TriStateCheckbox = ({state, onChange}: ITriStateCheckboxProps) => {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current) ref.current.indeterminate = state === 'indeterminate';
    }, [state]);

    const handleChange = useCallback(() => {
        onChange(state === 'on' ? 'off' : 'on');
    }, [onChange, state]);

    return (
        <input
            ref={ref}
            type="checkbox"
            checked={state === 'on'}
            onChange={handleChange}
            className="h-4 w-4 cursor-pointer accent-blue-500"
        />
    );
};
