import { AssertionError } from 'assert';

import { areEqual } from '@darch/utils/lib/areEqual';

import {
  FinalFieldDefinition,
  SchemaDefinitionInput,
} from './fields/_parseFields';
import { parseSchemaDefinition } from './parseSchemaDefinition';

export function assertSameDefinition(
  id: string,
  a: SchemaDefinitionInput,
  b: SchemaDefinitionInput
) {
  a = parseSchemaDefinition(a, { omitMeta: true }).definition;
  b = parseSchemaDefinition(b, { omitMeta: true }).definition;

  if (!areEqual(a, b)) {
    throw new AssertionError({
      expected: a,
      actual: b,
      message: `An Schema with name "${id}" is already registered with another definition.`,
    });
  }
}

export function assertSameField(
  path: string,
  a: FinalFieldDefinition,
  b: FinalFieldDefinition
) {
  if (!areEqual(a, b)) {
    throw new AssertionError({
      expected: a,
      actual: b,
      message: `Different definitions to the same field "${path}"`,
    });
  }
}
