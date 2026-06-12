import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import ruleset from 'virtual:ruff-rules';
import {type IRuleStatesContext, RuleStatesContext} from "~/context/RuleStatesContext";
import type {TRuleState, TRuleStates} from "~/domain/ruleState";
import {countRuleStates, countRules, generateConfig} from "~/domain/ruleState";
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
    let raw: unknown = null;
    try {
        raw = await readStoredSnapshot();
    } catch (error) {
        console.error('Failed to read stored snapshot:', error);
    }

    const snapshot = parseSnapshot(raw);
    if (snapshot) return reconcileSnapshot(groups, snapshot, ruffVersion);

    const legacyStates = readLegacyStates();
    if (!legacyStates) return {states: {}, droppedCodes: []};

    // The legacy record carries no ruff version, so reconcile unconditionally.
    // Remove it only once the imported snapshot is durably in IndexedDB.
    const hydrated = reconcileStates(groups, legacyStates);
    try {
        await writeStoredSnapshot(makeSnapshot(ruffVersion, hydrated.states));
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

    const totalRules = useMemo(() => countRules(groups), []);
    const stats = useMemo(() => countRuleStates(ruleStates, totalRules), [ruleStates, totalRules]);

    const getConfig = useCallback(() => generateConfig(groups, ruleStates), [ruleStates]);

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
        pendingSnapshotRef.current = makeSnapshot(ruffVersion, ruleStates);
        const timer = window.setTimeout(flushPendingSnapshot, PERSIST_DEBOUNCE_MS);
        return () => {
            window.clearTimeout(timer);
        };
    }, [ruleStates, flushPendingSnapshot]);

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
            stats,
            droppedCodes: hydrated.droppedCodes,
            getConfig,
            setRuleState,
            setGroupState,
        }),
        [ruleStates, stats, hydrated.droppedCodes, getConfig, setRuleState, setGroupState],
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
                return {states: {}, droppedCodes: []};
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
