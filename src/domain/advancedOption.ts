import { z } from 'zod';

const advancedOptionIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .describe('kebab-case id');

export const prerequisiteKindSchema = z.enum(['group-selected']);

const groupSelectedPrerequisiteSchema = z.object({
  kind: prerequisiteKindSchema.extract([prerequisiteKindSchema.enum["group-selected"]]),
  group: z.string().describe('rule group selector'),
});

const prerequisiteSchema = z
  .discriminatedUnion('kind', [groupSelectedPrerequisiteSchema])
  .describe('condition for the option to apply');

export const contributionKindSchema = z.enum(['per-file-ignores']);

const perFileIgnoresContributionSchema = z.object({
  kind: contributionKindSchema.extract([contributionKindSchema.enum["per-file-ignores"]]),
  glob: z.string().describe('file glob'),
  selectors: z.array(z.string()).nonempty().describe('rule selectors'),
});

const contributionSchema = z
  .discriminatedUnion('kind', [perFileIgnoresContributionSchema])
  .describe('addition to the generated config');

export const advancedOptionSchema = z.object({
  description: z.string().describe('UI explanation'),
  prerequisite: prerequisiteSchema,
  contribution: contributionSchema,
});

export const advancedOptionCatalogSchema = z.object({
  $schema: z.string().describe('JSON Schema path'),
  options: z.record(advancedOptionIdSchema, advancedOptionSchema).describe('in display order'),
});

export type TPrerequisiteKind = z.infer<typeof prerequisiteKindSchema>;
export type TPrerequisite = z.infer<typeof prerequisiteSchema>;
export type TPrerequisiteOf<K extends TPrerequisiteKind> = Extract<TPrerequisite, { kind: K }>;
export type TContributionKind = z.infer<typeof contributionKindSchema>;
export type TContribution = z.infer<typeof contributionSchema>;
export type TContributionOf<K extends TContributionKind> = Extract<TContribution, { kind: K }>;
export type TAdvancedOption = z.infer<typeof advancedOptionSchema>;
export type TAdvancedOptionCatalog = z.infer<typeof advancedOptionCatalogSchema>;
export type TAdvancedOptions = TAdvancedOptionCatalog['options'];
