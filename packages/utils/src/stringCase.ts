import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';
import { slugify } from './slugify';
import { randomItem } from './randomItem';

export function capitalize(input: string) {
  return upperFirst(input);
}

export function joinPathsCamelCase(...parts: (string | null | undefined)[]) {
  return camelCase(joinPathsSnakeCase(...parts));
}

export function joinPathsSnakeCase(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join('_');
}

export const stringCase = {
  keep: (s: string) => s,
  capitalized: (s: string) => capitalize(s),
  lowercase: (s: string) => s.toLowerCase(),
  random: (s: string): string => {
    return stringCase[randomItem(Object.keys(stringCase))](s);
  },
  undefined: (s: string) => stringCase.random(s),
  slugify: (s: string) => slugify(s),
};
