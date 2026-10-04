import {prerequisiteKindSchema, type TPrerequisiteKind, type TPrerequisiteOf} from "~/domain/advancedOption";
import type {TRuleGroups} from "~/domain/rule";
import {deriveGroupState, type TRuleStates} from "~/domain/ruleState";

export type TAdvancedOptionStates = Partial<Record<string, boolean>>;

interface IPrerequisiteBehavior<K extends TPrerequisiteKind> {
    isMet: (prerequisite: TPrerequisiteOf<K>, groups: TRuleGroups, ruleStates: TRuleStates) => boolean;
    label: (prerequisite: TPrerequisiteOf<K>) => string;
}

const prerequisiteBehaviors: {[K in TPrerequisiteKind]: IPrerequisiteBehavior<K>} = {
    [prerequisiteKindSchema.enum['group-selected']]: {
        isMet: (prerequisite, groups, ruleStates) =>
            deriveGroupState(groups[prerequisite.group].rules, ruleStates) !== 'off',
        label: (prerequisite) => prerequisite.group,
    },
};

export const isPrerequisiteMet = <K extends TPrerequisiteKind>(
    prerequisite: TPrerequisiteOf<K>,
    groups: TRuleGroups,
    ruleStates: TRuleStates,
): boolean => prerequisiteBehaviors[prerequisite.kind].isMet(prerequisite, groups, ruleStates);

export const prerequisiteLabel = <K extends TPrerequisiteKind>(prerequisite: TPrerequisiteOf<K>): string =>
    prerequisiteBehaviors[prerequisite.kind].label(prerequisite);
