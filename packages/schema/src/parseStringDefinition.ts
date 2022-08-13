import { memoize } from '@darch/utils/lib/memoize';

import { FieldTypeName } from './fields/_fieldDefinitions';
import { FinalFieldDefinition } from './fields/_parseFields';
import { isFieldTypeName } from './fields/fieldTypes';

function _parseStringDefinition<T extends AnyStringFieldDefinition>(
  typeName: T
): FinalFieldDefinition {
  const t = typeNameFromTemplate(typeName);
  const isOptional = isOptionalTemplate(typeName);
  const isList = isListTemplate(typeName);

  const obj = {
    type: t,
    optional: !!isOptional,
    list: !!isList,
    def: undefined,
    defaultValue: undefined,
  };

  return obj;
}

function _isOptionalTemplate<T extends string>(
  type: T
): T extends `${string}?` ? true : false {
  return !!type.match(/\?$/) as any;
}

function _isListTemplate<T extends string>(
  type: T
): T extends `[${string}]` | `[${string}]?` ? true : false {
  return !!type.match(/]\??$/) as any;
}

function _typeNameFromTemplate<T extends FieldTypeName>(
  enhanced: AnyStringFieldDefinition
): T {
  return enhanced.replace(/[\[\]?, ]/g, '') as any;
}

function _isStringFieldDefinition(t: any): t is AnyStringFieldDefinition {
  if (typeof t !== 'string') return false;
  const field = typeNameFromTemplate(t as any);
  return isFieldTypeName(field);
}

export const parseStringDefinition = memoize(_parseStringDefinition);
export const typeNameFromTemplate = memoize(_typeNameFromTemplate);
export const isStringFieldDefinition = memoize(_isStringFieldDefinition);
export const isListTemplate = memoize(_isListTemplate);
export const isOptionalTemplate = memoize(_isOptionalTemplate);

export type AnyStringFieldDefinition =
  | FieldTypeName
  | `${FieldTypeName}?`
  | `[${FieldTypeName}]`
  | `[${FieldTypeName}]?`;

export type ExtractStringFieldDefType<T extends AnyStringFieldDefinition> =
  //
  T extends FieldTypeName
    ? T
    : T extends `[${infer U}]?`
    ? U
    : T extends `${infer U}?`
    ? U
    : T extends `[${infer U}]`
    ? U
    : never;

export type ParseStringDefinition<S> =
  //
  S extends FieldTypeName
    ? {
        type: S;
        list: false;
        optional: false;
        def: undefined;
        description?: string;
      }
    : //
    //
    S extends `${FieldTypeName}?`
    ? //
      {
        type: ExtractStringFieldDefType<S>;
        list: false;
        optional: true;
        def: undefined;
        description?: string;
      }
    : //
    S extends `[${FieldTypeName}]`
    ? //
      {
        type: ExtractStringFieldDefType<S>;
        list: true;
        optional: false;
        def: undefined;
        description?: string;
      }
    : //
    S extends `[${FieldTypeName}]?`
    ? //
      {
        type: ExtractStringFieldDefType<S>;
        list: true;
        optional: true;
        def: undefined;
        description?: string;
      }
    : never;
