// Minimal JSON-Schema validator for Jont inputs — VOL-11 §4 step (2).
// Deliberately small: type, properties, required, items, enum, bounds.
// Failures carry JSON-path field pointers for ARGUMENTS_INVALID (VOL-05 §9).

import type { JsonSchema } from './types';

export interface SchemaIssue {
  field: string;
  message: string;
}

export function validateAgainstSchema(
  value: unknown,
  schema: JsonSchema,
  path = '$',
): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  switch (schema.type) {
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return [{ field: path, message: `expected an object` }];
      }
      const obj = value as Record<string, unknown>;
      for (const key of schema.required ?? []) {
        if (!(key in obj) || obj[key] === undefined) {
          issues.push({ field: `${path}.${key}`, message: 'is required' });
        }
      }
      if (schema.additionalProperties === false) {
        const allowed = new Set(Object.keys(schema.properties ?? {}));
        for (const key of Object.keys(obj)) {
          if (!allowed.has(key)) {
            issues.push({ field: `${path}.${key}`, message: 'unknown property' });
          }
        }
      }
      for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
        if (obj[key] !== undefined) {
          issues.push(...validateAgainstSchema(obj[key], propSchema, `${path}.${key}`));
        }
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(value)) {
        return [{ field: path, message: `expected an array` }];
      }
      if (schema.items) {
        value.forEach((item, i) => {
          issues.push(...validateAgainstSchema(item, schema.items!, `${path}[${i}]`));
        });
      }
      break;
    }
    case 'string': {
      if (typeof value !== 'string') {
        return [{ field: path, message: `expected a string` }];
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        issues.push({ field: path, message: `must be at least ${schema.minLength} characters` });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        issues.push({ field: path, message: `must be at most ${schema.maxLength} characters` });
      }
      if (schema.enum && !schema.enum.includes(value)) {
        issues.push({ field: path, message: `must be one of: ${schema.enum.join(', ')}` });
      }
      break;
    }
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return [{ field: path, message: `expected a number` }];
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        issues.push({ field: path, message: `must be ≥ ${schema.minimum}` });
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        issues.push({ field: path, message: `must be ≤ ${schema.maximum}` });
      }
      if (schema.enum && !schema.enum.includes(value)) {
        issues.push({ field: path, message: `must be one of: ${schema.enum.join(', ')}` });
      }
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        return [{ field: path, message: `expected a boolean` }];
      }
      break;
    }
  }

  return issues;
}
