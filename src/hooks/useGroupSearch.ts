import {type ChangeEvent, useCallback, useMemo} from "react";

import type {TRuleGroup, TRuleGroups} from "~/domain/rule";
import {filterGroups} from "~/domain/ruleState";
import {useDebouncedState} from "~/hooks/useDebouncedState.ts";

interface IUseGroupSearch {
    searchTerm: string;
    filteredGroups: [string, TRuleGroup][];
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const useGroupSearch = (groups: TRuleGroups): IUseGroupSearch => {
    const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('', 250);

    const filteredGroups = useMemo(
        () => filterGroups(groups, debouncedSearchTerm),
        [groups, debouncedSearchTerm],
    );

    const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    }, [setSearchTerm]);

    return {searchTerm, filteredGroups, onSearchChange};
};
