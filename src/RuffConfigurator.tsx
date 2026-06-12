import {useCallback, useState} from 'react';

import ruleset from 'virtual:ruff-rules';
import {ConfigModal} from "~/components/ConfigModal";
import {RuleGroup} from "~/components/RuleGroup";
import {deriveGroupState} from "~/domain/ruleState";
import {useGroupSearch} from "~/hooks/useGroupSearch.ts";
import {useRuleStates} from "~/hooks/useRuleStates.ts";

type TExpandedGroups = Set<string>;

const {ruffVersion} = ruleset;

export const RuffConfigurator = () => {
    const {groups, ruleStates, stats, getConfig, setRuleState, setGroupState, droppedCodes} = useRuleStates();
    const {searchTerm, filteredGroups, onSearchChange} = useGroupSearch(groups);
    const [expandedGroups, setExpandedGroups] = useState<TExpandedGroups>(() => new Set());
    const [showConfig, setShowConfig] = useState(false);
    const [dropNoticeDismissed, setDropNoticeDismissed] = useState(false);

    const toggleGroup = useCallback((groupCode: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupCode)) next.delete(groupCode);
            else next.add(groupCode);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setExpandedGroups(new Set(Object.keys(groups)));
    }, [groups]);

    const collapseAll = useCallback(() => {
        setExpandedGroups(new Set());
    }, []);

    const openConfig = useCallback(() => {
        setShowConfig(true);
    }, []);

    const dismissDropNotice = useCallback(() => {
        setDropNoticeDismissed(true);
    }, []);

    const closeConfig = useCallback(() => {
        setShowConfig(false);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
                    <div className="flex items-baseline gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-100">Ruff Rules Configurator</h1>
                        <span className="text-sm text-gray-500">ruff {ruffVersion}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        <input
                            type="text"
                            placeholder="Search rules..."
                            value={searchTerm}
                            onChange={onSearchChange}
                            className="flex-1 min-w-64 px-4 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                            <button onClick={expandAll} className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
                                Expand All
                            </button>
                            <button onClick={collapseAll} className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
                                Collapse All
                            </button>
                            <button onClick={openConfig} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Generate Config
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-6 text-sm text-gray-300">
                        <span>Total: <strong>{stats.total}</strong></span>
                        <span className="text-green-400">Selected: <strong>{stats.selected}</strong></span>
                    </div>
                </div>

                {droppedCodes.length > 0 && !dropNoticeDismissed ? (
                    <div className="bg-amber-950 border border-amber-700 rounded-lg p-4 mb-4 flex items-start justify-between gap-4 text-sm text-amber-200">
                        <span>
                            Your saved selection included {droppedCodes.length === 1 ? 'a rule that no longer exists' : `${String(droppedCodes.length)} rules that no longer exist`} in
                            ruff {ruffVersion} and was updated: {droppedCodes.join(', ')}
                        </span>
                        <button onClick={dismissDropNotice} className="px-3 py-1 border border-amber-700 rounded hover:bg-amber-900 shrink-0">
                            Dismiss
                        </button>
                    </div>
                ) : null}

                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {filteredGroups.map(([groupCode, group]) => (
                        <RuleGroup
                            key={groupCode}
                            groupCode={groupCode}
                            group={group}
                            groupState={deriveGroupState(group.rules, ruleStates)}
                            isExpanded={expandedGroups.has(groupCode)}
                            ruleStates={ruleStates}
                            onToggle={toggleGroup}
                            onGroupChange={setGroupState}
                            onRuleChange={setRuleState}
                        />
                    ))}
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center text-gray-400">
                        No rules match your search.
                    </div>
                ) : null}
            </div>

            {showConfig ? <ConfigModal config={getConfig()} onClose={closeConfig} /> : null}
        </div>
    );
};
