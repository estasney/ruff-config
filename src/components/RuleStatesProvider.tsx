import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import advancedOptions from 'virtual:advanced-options';
import ruleset from 'virtual:ruff-rules';
import {type IRuleStatesContext, RuleStatesContext} from "~/context/RuleStatesContext";
import type {TAdvancedOptionStates} from "~/domain/advancedOptionState";
import {generateConfig} from "~/domain/config";
import type {TRuleState, TRuleStates} from "~/domain/ruleState";
import {countRuleStates, countRules} from "~/domain/ruleState";
import {
    type IHydratedStates,
    makeSnapshot,
    parseSnapshot,
    reconcileSnapshot,
    reconcileStates,
    storedStatesSchema,
    type TSnapshot,
} from "~/domain/snapshot";
import {readStoredSnapshot, writeStoredSnapshot} from "~/lib/snapshotStore";

const {groups, ruffVersion} = ruleset;

const LEGACY_STORAGE_KEY = 'ruffRuleStates.v2';
const PERSIST_DEBOUNCE_MS = 300;

const readLegacyStates = (): TRuleStates | null => {
    try {
        const item = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!item) return null;
        const raw: unknown = JSON.parse(item);
        const parsed = storedStatesSchema.safeParse(raw);
        return parsed.success ? parsed.data : null;
    } catch (error) {
        console.error('Failed to read legacy rule states:', error);
        return null;
    }
};

const loadHydratedStates = async (): Promise<IHydratedStates> => {
    const stored = await readStoredSnapshot();
    if (stored !== undefined) {
        const snapshot = parseSnapshot(stored);
        if (!snapshot) throw new Error('Stored snapshot does not match the current schema');
        return reconcileSnapshot(groups, advancedOptions, snapshot, ruffVersion);
    }

    // IndexedDB is empty, so importing the legacy record cannot overwrite a snapshot.
    const legacyStates = readLegacyStates();
    if (!legacyStates) return {states: {}, advancedOptionStates: {}, droppedCodes: []};

    // The legacy record carries no ruff version, so reconcile unconditionally.
    // Remove it only once the imported snapshot is durably in IndexedDB.
    const hydrated: IHydratedStates = {...reconcileStates(groups, legacyStates), advancedOptionStates: {}};
    try {
        await writeStoredSnapshot(makeSnapshot(ruffVersion, hydrated.states, hydrated.advancedOptionStates));
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to migrate legacy rule states:', error);
    }
    return hydrated;
};

interface IHydratedProviderProps {
    hydrated: IHydratedStates;
    children: ReactNode;
}

const HydratedRuleStatesProvider = ({hydrated, children}: IHydratedProviderProps) => {
    const [ruleStates, setRuleStates] = useState<TRuleStates>(hydrated.states);
    const [advancedOptionStates, setAdvancedOptionStates] = useState<TAdvancedOptionStates>(
        hydrated.advancedOptionStates,
    );

    const totalRules = useMemo(() => countRules(groups), []);
    const stats = useMemo(() => countRuleStates(ruleStates, totalRules), [ruleStates, totalRules]);

    const getConfig = useCallback(
        () => generateConfig(groups, ruleStates, advancedOptions, advancedOptionStates),
        [ruleStates, advancedOptionStates],
    );

    const setRuleState = useCallback((code: string, newState: TRuleState) => {
        setRuleStates((prev) => ({...prev, [code]: newState}));
    }, []);

    const setGroupState = useCallback((groupCode: string, newState: TRuleState) => {
        const {rules} = groups[groupCode];
        setRuleStates((prev) => {
            const next = {...prev};
            for (const rule of rules) next[rule.code] = newState;
            return next;
        });
    }, []);

    const setAdvancedOptionState = useCallback((id: string, isEnabled: boolean) => {
        setAdvancedOptionStates((prev) => ({...prev, [id]: isEnabled}));
    }, []);

    const pendingSnapshotRef = useRef<TSnapshot | null>(null);

    const flushPendingSnapshot = useCallback(() => {
        const snapshot = pendingSnapshotRef.current;
        if (!snapshot) return;
        pendingSnapshotRef.current = null;
        writeStoredSnapshot(snapshot).catch((error: unknown) => {
            console.error('Failed to persist rule states:', error);
        });
    }, []);

    useEffect(() => {
        // Persist only user edits; hydrated states may stand in for a snapshot this build cannot read.
        if (ruleStates === hydrated.states && advancedOptionStates === hydrated.advancedOptionStates) return;
        pendingSnapshotRef.current = makeSnapshot(ruffVersion, ruleStates, advancedOptionStates);
        const timer = window.setTimeout(flushPendingSnapshot, PERSIST_DEBOUNCE_MS);
        return () => {
            window.clearTimeout(timer);
        };
    }, [ruleStates, advancedOptionStates, hydrated.states, hydrated.advancedOptionStates, flushPendingSnapshot]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flushPendingSnapshot();
        };
        window.addEventListener('pagehide', flushPendingSnapshot);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('pagehide', flushPendingSnapshot);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [flushPendingSnapshot]);

    const value = useMemo<IRuleStatesContext>(
        () => ({
            groups,
            ruleStates,
            advancedOptions,
            advancedOptionStates,
            stats,
            droppedCodes: hydrated.droppedCodes,
            getConfig,
            setRuleState,
            setGroupState,
            setAdvancedOptionState,
        }),
        [
            ruleStates,
            advancedOptionStates,
            stats,
            hydrated.droppedCodes,
            getConfig,
            setRuleState,
            setGroupState,
            setAdvancedOptionState,
        ],
    );

    return <RuleStatesContext.Provider value={value}>{children}</RuleStatesContext.Provider>;
};

interface IRuleStatesProviderProps {
    children: ReactNode;
}

export const RuleStatesProvider = ({children}: IRuleStatesProviderProps) => {
    const [hydrated, setHydrated] = useState<IHydratedStates | null>(null);

    useEffect(() => {
        let cancelled = false;
        void loadHydratedStates()
            .catch((error: unknown): IHydratedStates => {
                console.error('Failed to load rule states:', error);
                return {states: {}, advancedOptionStates: {}, droppedCodes: []};
            })
            .then((result) => {
                if (!cancelled) setHydrated(result);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (hydrated === null) return null;

    return <HydratedRuleStatesProvider hydrated={hydrated}>{children}</HydratedRuleStatesProvider>;
};
