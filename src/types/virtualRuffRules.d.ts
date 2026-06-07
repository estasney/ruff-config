declare module 'virtual:ruff-rules' {
  import type { TRuleset } from '~/domain/rule';

  const ruleset: TRuleset;
  export default ruleset;
}