import {z} from 'zod';

import type {TRuleGroups} from "~/domain/rule";
import type {TRuleState, TRuleStates} from "~/domain/ruleState";

export const SNAPSHOT_SCHEMA_VERSION = 1;

const ruleStateSchema = z.enum(['on', 'off']) satisfies z.ZodType<TRuleState>;

export const storedStatesSchema = z.record(z.string(), ruleStateSchema);

export const snapshotSchema = z.object({
    schemaVersion: z.literal(SNAPSHOT_SCHEMA_VERSION),
    ruffVersion: z.string(),
    states: storedStatesSchema,
});

export type TSnapshot = z.infer<typeof snapshotSchema>;

export interface IHydratedStates {
    states: TRuleStates;
    droppedCodes: string[];
}

export const parseSnapshot = (raw: unknown): TSnapshot | null => {
    const result = snapshotSchema.safeParse(raw);
    return result.success ? result.data : null;
};

export const makeSnapshot = (ruffVersion: string, states: TRuleStates): TSnapshot => {
    const compacted: Record<string, TRuleState> = {};
    for (const [code, state] of Object.entries(states)) {
        if (state !== undefined) compacted[code] = state;
    }
    return {schemaVersion: SNAPSHOT_SCHEMA_VERSION, ruffVersion, states: compacted};
};

export const reconcileStates = (groups: TRuleGroups, states: TRuleStates): IHydratedStates => {
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

export const reconcileSnapshot = (
    groups: TRuleGroups,
    snapshot: TSnapshot,
    currentRuffVersion: string,
): IHydratedStates =>
    snapshot.ruffVersion === currentRuffVersion
        ? {states: snapshot.states, droppedCodes: []}
        : reconcileStates(groups, snapshot.states);
