import { z } from 'zod';

const linterCategorySchema = z.object({
  prefix: z.string(),
  name: z.string(),
});

export const ruffLinterSchema = z.object({
  prefix: z.string(),
  name: z.string(),
  url: z.string().optional(),
  categories: z.array(linterCategorySchema).optional(),
});

export const ruffLinterListSchema = z.array(ruffLinterSchema);

export type TRuffLinter = z.infer<typeof ruffLinterSchema>;
