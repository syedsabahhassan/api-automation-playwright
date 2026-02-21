import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schemaCache = new Map<string, ValidateFunction>();

/**
 * Validates a response body against a JSON Schema file stored in /schemas.
 *
 * @param schemaName  Filename without extension, e.g. 'loan-application'
 * @param data        The parsed JSON body to validate
 * @returns           { valid, errors } — callers assert valid === true
 */
export function validateSchema(
  schemaName: string,
  data: unknown,
): { valid: boolean; errors: string[] } {
  let validate = schemaCache.get(schemaName);

  if (!validate) {
    const schemaPath = join(__dirname, '..', '..', 'schemas', `${schemaName}.json`);
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    validate = ajv.compile(schema);
    schemaCache.set(schemaName, validate);
  }

  const valid = validate(data) as boolean;
  const errors = valid
    ? []
    : (validate.errors ?? []).map(
        (e) => `${e.instancePath || '(root)'} ${e.message ?? ''}`.trim(),
      );

  return { valid, errors };
}
