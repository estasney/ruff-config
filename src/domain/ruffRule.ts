import { z } from 'zod';

const sinceSchema = z.object({
  since: z.string(),
});

// Exactly one of these keys is present per rule.
const statusSchema = z.union([
  z.object({ Stable: sinceSchema }),
  z.object({ Preview: sinceSchema }),
  z.object({ Removed: sinceSchema }),
]);

const sourceLocationSchema = z.object({
  file: z.string(),
  line: z.number(),
});

// code/linter are null until ruff assigns them (unselectable preview rules).
export const ruffRuleSchema = z.object({
  name: z.string(),
  code: z.string().nullable(),
  linter: z.string().nullable(),
  summary: z.string(),
  fix: z.string(),
  fix_availability: z.enum(['Always', 'None', 'Sometimes']),
  explanation: z.string(),
  preview: z.boolean(),
  status: statusSchema,
  source_location: sourceLocationSchema,
});

export const ruffRuleListSchema = z.array(ruffRuleSchema);

export type TRuffRule = z.infer<typeof ruffRuleSchema>;
