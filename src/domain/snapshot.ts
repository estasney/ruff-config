import {z} from 'zod';

import type {TAdvancedOptions} from "~/domain/advancedOption";
import type {TAdvancedOptionStates} from "~/domain/advancedOptionState";
import type {TRuleGroups} from "~/domain/rule";
import type {TRuleState, TRuleStates} from "~/domain/ruleState";

export const SNAPSHOT_SCHEMA_VERSION = 2;

const ruleStateSchema = z.enum(['on', 'off']) satisfies z.ZodType<TRuleState>;

export const storedStatesSchema = z.record(z.string(), ruleStateSchema);

export const snapshotSchema = z.object({
    schemaVersion: z.literal(SNAPSHOT_SCHEMA_VERSION),
    ruffVersion: z.string(),
    states: storedStatesSchema,
    advancedOptionStates: z.record(z.string(), z.boolean()),
});

export type TSnapshot = z.infer<typeof snapshotSchema>;

const snapshotV1Schema = z.object({
    schemaVersion: z.literal(1),
    ruffVersion: z.string(),
    states: storedStatesSchema,
});

const storedSnapshotSchema = z.union([
    snapshotSchema,
    snapshotV1Schema.transform(
        (v1): TSnapshot => ({
            schemaVersion: SNAPSHOT_SCHEMA_VERSION,
            ruffVersion: v1.ruffVersion,
            states: v1.states,
            advancedOptionStates: {},
        }),
    ),
]);

export interface IReconciledRuleStates {
    states: TRuleStates;
    droppedCodes: string[];
}

export interface IHydratedStates extends IReconciledRuleStates {
    advancedOptionStates: TAdvancedOptionStates;
}

export const parseSnapshot = (raw: unknown): TSnapshot | null => {
    const result = storedSnapshotSchema.safeParse(raw);
    return result.success ? result.data : null;
};

const dropUndefinedValues = <T>(record: Partial<Record<string, T>>): Record<string, T> => {
    const compacted: Record<string, T> = {};
    for (const [key, value] of Object.entries(record)) {
        if (value !== undefined) compacted[key] = value;
    }
    return compacted;
};

export const makeSnapshot = (
    ruffVersion: string,
    states: TRuleStates,
    advancedOptionStates: TAdvancedOptionStates,
): TSnapshot => ({
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    ruffVersion,
    states: dropUndefinedValues(states),
    advancedOptionStates: dropUndefinedValues(advancedOptionStates),
});

export const reconcileStates = (groups: TRuleGroups, states: TRuleStates): IReconciledRuleStates => {
    const knownCodes = new Set<string>();
    for (const group of Object.values(groups)) {
        for (const rule of group.rules) knownCodes.add(rule.code);
    }

    const kept: TRuleStates = {};
    const droppedCodes: string[] = [];
    for (const [code, state] of Object.entries(states)) {
        if (state === undefined) continue;
        if (knownCodes.has(code)) kept[code] = state;
        else if (state === 'on') droppedCodes.push(code);
    }
    droppedCodes.sort();
    return {states: kept, droppedCodes};
};

// The option catalog changes with app releases, not ruff releases, so this runs on every load.
const reconcileAdvancedOptionStates = (
    advancedOptions: TAdvancedOptions,
    advancedOptionStates: TAdvancedOptionStates,
): TAdvancedOptionStates =>
    Object.fromEntries(Object.entries(advancedOptionStates).filter(([id]) => Object.hasOwn(advancedOptions, id)));

export const reconcileSnapshot = (
    groups: TRuleGroups,
    advancedOptions: TAdvancedOptions,
    snapshot: TSnapshot,
    currentRuffVersion: string,
): IHydratedStates => {
    const reconciledRuleStates: IReconciledRuleStates =
        snapshot.ruffVersion === currentRuffVersion
            ? {states: snapshot.states, droppedCodes: []}
            : reconcileStates(groups, snapshot.states);
    return {
        ...reconciledRuleStates,
        advancedOptionStates: reconcileAdvancedOptionStates(advancedOptions, snapshot.advancedOptionStates),
    };
};
