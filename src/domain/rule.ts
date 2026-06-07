import { z } from 'zod';

export const fixAvailabilitySchema = z.enum(['Always', 'None', 'Sometimes']);

export const ruleStatusSchema = z.object({
  kind: z.enum(['Stable', 'Preview', 'Removed']),
  since: z.string(),
});

export const ruleSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  explanation: z.string(),
  fixAvailability: fixAvailabilitySchema,
  preview: z.boolean(),
  status: ruleStatusSchema,
});

export const ruleGroupSchema = z.object({
  name: z.string(),
  rules: z.array(ruleSchema),
});

export const ruleGroupsSchema = z.record(z.string(), ruleGroupSchema);

export const rulesetSchema = z.object({
  ruffVersion: z.string(),
  groups: ruleGroupsSchema,
});

export type TRule = z.infer<typeof ruleSchema>;
export type TRuleGroup = z.infer<typeof ruleGroupSchema>;
export type TRuleGroups = z.infer<typeof ruleGroupsSchema>;
export type TRuleset = z.infer<typeof rulesetSchema>;