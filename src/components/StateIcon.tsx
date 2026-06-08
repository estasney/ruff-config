import {assertNever} from "~/lib/invariant";
import type {TRuleState} from "~/domain/ruleState";

interface IStateIconProps {
    state: TRuleState;
}

export const StateIcon = ({state}: IStateIconProps) => {
    switch (state) {
        case 'selected':
            return <span className="text-green-400 font-bold">✓</span>;
        case 'ignored':
            return <span className="text-red-400 font-bold">✗</span>;
        case 'unselected':
            return <span className="text-gray-600">○</span>;
        default:
            return assertNever(state);
    }
};