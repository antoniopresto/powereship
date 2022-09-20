import type { ObjectType } from './ObjectType';

export function isObjectValidationError(
  input: any
): input is Error & { fieldErrors: string[] } {
  return input?.isObjectValidationError === true;
}

export function isObject(input: any): input is ObjectType<any> {
  return input?.__isDarchObject === true;
}
