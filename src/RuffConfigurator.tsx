import { useEffect,useMemo, useState } from 'react';

import ruleset from 'virtual:ruff-rules';
import type { TRule, TRuleGroup } from '~/domain/rule';

type TRuleState = 'selected' | 'ignored' | 'unselected';
type TGroupState = TRuleState | 'mixed';
type TRuleStates = Record<string, TRuleState>;
type TExpandedGroups = Set<string>;

const { ruffVersion, groups: TYPED_RULE_GROUPS } = ruleset;


function useDebounceState<T>(initialValue: T, delay: number): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return [value, debouncedValue, setValue];
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

interface IStateIcon {
  state: TRuleState;
}

const StateIcon = ({ state }: IStateIcon) => {
  if (state === 'selected') return <span className="text-green-400 font-bold">✓</span>;
  if (state === 'ignored') return <span className="text-red-400 font-bold">✗</span>;
  return <span className="text-gray-600">○</span>;
};

interface ITriStateCheckbox {
  state: TGroupState;
  onChange: (newState: TRuleState) => void;
  label?: string;
  isGroup?: boolean;
}

const TriStateCheckbox = ({ state, onChange, label, isGroup = false }: ITriStateCheckbox) => {
  const cycleState = () => {
    if (state === 'unselected' || state === 'mixed') onChange('selected');
    else if (state === 'selected') onChange('ignored');
    else onChange('unselected');
  };

  const displayState: TRuleState = state === 'mixed' ? 'unselected' : state;

  return (
    <button
      onClick={cycleState}
      className={`flex items-center gap-2 text-left w-full px-2 py-1 rounded hover:bg-gray-700 ${isGroup ? 'font-semibold' : ''}`}
    >
      <StateIcon state={displayState} />
      {label && <span className="truncate">{label}</span>}
    </button>
  );
};

export function RuffConfigurator() {
  const [storedRuleStates, setStoredRuleStates] = useLocalStorage<TRuleStates>('ruffRuleStates', {});
  const [ruleStates, setRuleStates] = useState<TRuleStates>(storedRuleStates);
  const [expandedGroups, setExpandedGroups] = useState<TExpandedGroups>(() => new Set());
  const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebounceState('', 250);
  const [showConfig, setShowConfig] = useState(false);


  const totalRules = useMemo(() =>
    Object.values(TYPED_RULE_GROUPS).reduce((sum, g) => sum + g.rules.length, 0), []
  );

  const stats = useMemo(() => {
    let selected = 0, ignored = 0;
    Object.values(ruleStates).forEach(state => {
      if (state === 'selected') selected++;
      else if (state === 'ignored') ignored++;
    });
    return { selected, ignored, total: totalRules };
  }, [ruleStates, totalRules]);

  const getGroupState = (groupCode: string): TGroupState => {
    const rules = TYPED_RULE_GROUPS[groupCode].rules;
    const states = rules.map((r: TRule) => ruleStates[r.code] || 'unselected');
    if (states.every((s: TRuleState) => s === 'selected')) return 'selected';
    if (states.every((s: TRuleState) => s === 'ignored')) return 'ignored';
    if (states.every((s: TRuleState) => s === 'unselected')) return 'unselected';
    return 'mixed';
  };

  const setGroupState = (groupCode: string, newState: TRuleState): void => {
    const rules = TYPED_RULE_GROUPS[groupCode].rules;
    setRuleStates(prev => {
      const next = { ...prev };
      rules.forEach((r: TRule) => { next[r.code] = newState; });
      return next;
    });
  };

  const setRuleState = (code: string, state: TRuleState): void => {
    setRuleStates(prev => ({ ...prev, [code]: state }));
  };

  const toggleGroup = (groupCode: string): void => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupCode)) next.delete(groupCode);
      else next.add(groupCode);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(Object.keys(TYPED_RULE_GROUPS)));
  const collapseAll = () => setExpandedGroups(new Set());

  const filteredGroups = useMemo(() => {
    if (!debouncedSearchTerm) return Object.entries(TYPED_RULE_GROUPS);
    const term = debouncedSearchTerm.toLowerCase();
    return Object.entries(TYPED_RULE_GROUPS)
      .map(([code, group]): [string, TRuleGroup] | null => {
        const matchingRules = group.rules.filter((r: TRule) =>
          r.code.toLowerCase().includes(term) ||
          r.name.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term)
        );
        const groupMatches = code.toLowerCase().includes(term) || 
                           group.name.toLowerCase().includes(term);
        if (groupMatches) return [code, group];
        if (matchingRules.length > 0) return [code, { ...group, rules: matchingRules }];
        return null;
      })
      .filter((entry): entry is [string, TRuleGroup] => entry !== null);
  }, [debouncedSearchTerm]);

  const generateConfig = () => {
    const selected: string[] = [];
    const ignored: string[] = [];

    Object.entries(TYPED_RULE_GROUPS).forEach(([groupCode, group]) => {
      const groupState = getGroupState(groupCode);
      if (groupState === 'selected') {
        selected.push(groupCode);
      } else if (groupState === 'ignored') {
        ignored.push(groupCode);
      } else {
        group.rules.forEach((r: TRule) => {
          const state = ruleStates[r.code];
          if (state === 'selected') selected.push(r.code);
          else if (state === 'ignored') ignored.push(r.code);
        });
      }
    });

    selected.sort();
    ignored.sort();

    let config = '[tool.ruff.lint]\n';
    if (selected.length > 0) {
      config += `select = [\n${selected.map(s => `    "${s}",`).join('\n')}\n]\n`;
    }
    if (ignored.length > 0) {
      config += `ignore = [\n${ignored.map(s => `    "${s}",`).join('\n')}\n]\n`;
    }
    return config || '[tool.ruff.lint]\nselect = []\n';
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(generateConfig());
  };

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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-64 px-4 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
                Expand All
              </button>
              <button onClick={collapseAll} className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
                Collapse All
              </button>
              <button
                onClick={() => {
                  setStoredRuleStates(ruleStates);
                  setShowConfig(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate Config
              </button>
            </div>
          </div>

          <div className="flex gap-6 text-sm text-gray-300">
            <span>Total: <strong>{stats.total}</strong></span>
            <span className="text-green-400">Selected: <strong>{stats.selected}</strong></span>
            <span className="text-red-400">Ignored: <strong>{stats.ignored}</strong></span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {filteredGroups.map(([groupCode, group]) => {
            const groupState = getGroupState(groupCode);
            const isExpanded = expandedGroups.has(groupCode);

            return (
              <div key={groupCode} className="border-b border-gray-700 last:border-b-0">
                <div className="flex items-center bg-gray-700/40 hover:bg-gray-700">
                  <div className="w-12 shrink-0">
                    <TriStateCheckbox
                      state={groupState === 'mixed' ? 'unselected' : groupState}
                      onChange={(newState) => setGroupState(groupCode, newState)}
                      isGroup
                    />
                  </div>
                  <button
                    onClick={() => toggleGroup(groupCode)}
                    className="flex-1 flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-400">{groupCode}</span>
                      <span className="mx-2 text-gray-500">—</span>
                      <span className="text-gray-200">{group.name}</span>
                      <span className="ml-2 text-sm text-gray-500">({group.rules.length} rules)</span>
                    </div>
                    <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-700 bg-gray-800">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-700/40 text-left text-gray-300">
                        <tr>
                          <th className="w-12 px-2 py-2"></th>
                          <th className="w-28 px-3 py-2 font-medium">Code</th>
                          <th className="w-64 px-3 py-2 font-medium">Name</th>
                          <th className="px-3 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rules.map((rule: TRule) => (
                          <tr key={rule.code} className="border-t border-gray-700 hover:bg-gray-700/40">
                            <td className="px-2 py-1">
                              <TriStateCheckbox
                                state={ruleStates[rule.code] || 'unselected'}
                                onChange={(newState) => setRuleState(rule.code, newState)}
                              />
                            </td>
                            <td className="px-3 py-2 font-mono text-blue-400 font-medium">
                              {rule.code}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-300 text-xs">
                              {rule.name}
                            </td>
                            <td className="px-3 py-2 text-gray-400">
                              {rule.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center text-gray-400">
            No rules match your search.
          </div>
        )}
      </div>

      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-gray-100">Generated Configuration</h2>
              <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-200 text-2xl">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {generateConfig()}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-gray-300 hover:text-gray-100"
              >
                Close
              </button>
              <button
                onClick={copyConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
