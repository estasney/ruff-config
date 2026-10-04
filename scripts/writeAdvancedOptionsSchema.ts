import { writeFileSync } from 'node:fs';

import { z } from 'zod';

import { advancedOptionCatalogSchema } from '../src/domain/advancedOption.ts';

writeFileSync(
  new URL('../src/assets/advancedOptions.schema.json', import.meta.url),
  `${JSON.stringify(z.toJSONSchema(advancedOptionCatalogSchema), null, 2)}\n`,
);
