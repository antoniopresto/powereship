import * as fs from 'fs-extra';

import { CircularDeps } from '../CircularDeps';
import { parseFieldDefinitionConfig } from '../ObjectType';
import {
  GraphQLSchemaWithUtils,
  resolversTypescriptParts,
} from '../createGraphQLSchema';

import {
  getSchemaQueryTemplates,
  SchemaQueryTemplatesOptions,
} from './getQueryTemplates';

export async function generateClientUtils(
  schema: GraphQLSchemaWithUtils,
  options?: SchemaQueryTemplatesOptions
) {
  const [tsParts, queryTemplates] = await Promise.all([
    resolversTypescriptParts({
      name: 'GraphQLInterfaces',
      options: {},
      resolvers: schema.utils.resolvers,
    }),

    getSchemaQueryTemplates(schema, options),
  ]);

  const header = [
    '// Autogenerated, do not edit by hand',
    '/* istanbul ignore file */',
    '/* eslint-disable */',
    //
    "import { GraphType } from '@swind/schema';\n\n",
    '\nexport type GraphQLClientError = { message: string, path: string[] };\n', //
    '\nexport type ID = number | string;\n', //
    `\nexport type GraphQLClientResponse<Result> = {data: Result, errors: null} | {data: null, errors: GraphQLClientError[]}\n`,
  ];

  let clientInterface = ``;

  clientInterface += `\nexport interface ExpectedGraphQLClient {\n`;

  let helpersText = `\n\n`;
  helpersText += `\nexport const graphqlClientHelpers = {\n`;

  const commonTypings = new Map<string, string>();

  // adding the input (args) and payload types for each resolver
  tsParts.lines.forEach(({ payloadName, args, payload, inputName }) => {
    commonTypings.set(
      payloadName,
      `export type ${payloadName} = ${payload.code}`
    );
    commonTypings.set(inputName, `export type ${inputName} = ${args.code}`);
  });

  // adding the GraphqlClient interface for each resolver
  tsParts.lines.forEach(
    ({
      payloadName,
      inputName,
      resolver: { description, deprecationReason, name, args: resolverArgs },
    }) => {
      clientInterface += description ? `/**\n${description}\n**/` : '';
      clientInterface += deprecationReason
        ? `/**\n@deprecated\n${deprecationReason}\n**/`
        : '';

      const argsText = resolverArgs
        ? `args: ${inputName}`
        : `args?: ${inputName}`;

      clientInterface += `\n${name}: {${argsText}, payload: GraphQLClientResponse<${payloadName}>},`;

      clientInterface += `\n`;
    }
  );

  // adding the query and fragment texts for each resolver
  tsParts.lines.forEach(
    ({
      payloadName,
      inputName,
      resolver: { name, typeDef, kind, argsDef },
    }) => {
      helpersText += `\n${name}: {\n name: "${name}", \n`;

      helpersText += `kind: '${kind}',payload: ${rehydrateType(
        payloadName,
        typeDef
      )},\n`;

      helpersText += `\ninput: ${rehydrateType(
        inputName,
        argsDef
          ? { object: argsDef }
          : { record: { keyType: 'string', type: 'unknown' } }
      )},\n`;

      const resolverQueries = queryTemplates.queryByResolver[kind][name];

      helpersText += `\noperation: ${JSON.stringify(
        {
          query: resolverQueries.fullQuery,
          varNames: resolverQueries.argsParsed.vars.reduce((acc, next) => {
            return {
              ...acc,
              [next.name]: {
                ...next,
                // example -> "limit": "cashbackIntervals_limit"
                varName: next.varName.replace(/^\$/, ''),
              },
            };
          }, {} as any),
        },
        null,
        2
      )} as const,\n`;

      helpersText += `\n},\n`;
    }
  );

  clientInterface += `\n}\n`;
  helpersText += `\n} as const;\n`;
  helpersText += genClientBody();

  const result = [
    header.join('\n\n'), //
    [...commonTypings.values()].join('\n\n'),
    clientInterface,
    helpersText,
  ].join('\n');

  return CircularDeps.prettier.format(result, {
    parser: 'typescript',
    singleQuote: true,
  });
}

let creating = false;
export async function saveGraphQLClientUtils(
  schema: GraphQLSchemaWithUtils,
  DEST: string
) {
  if (creating) return;
  creating = true;

  const exists = fs.existsSync(DEST);
  const now = Date.now();
  const mtime = exists ? fs.statSync(DEST).mtimeMs : 0;

  const diff = now - mtime;
  if (diff < 3000) return;

  console.info(`saveGraphQLTypescript in progress.`);
  const ts = await generateClientUtils(schema);

  if (exists) {
    await fs.remove(DEST);
  }

  await fs.ensureFile(DEST);
  await fs.writeFile(DEST, ts);

  creating = false;
  console.info(`generated in ${DEST}`);
}

function rehydrateType(name: string, field: any) {
  const parsed = parseFieldDefinitionConfig(field, {
    deep: { omitMeta: true },
  });
  const json = JSON.stringify(parsed);
  return `GraphType.getOrSet("${name}", ${json} as const)`;
}

function genClientBody() {
  return [
    '',
    'export type GraphqlClientHelpers = typeof graphqlClientHelpers;',
    'export type GraphQLEntry = GraphqlClientHelpers[keyof GraphqlClientHelpers];',
    '',
    "export type GraphQLFetchParams<K extends GraphQLEntry['name']> = {",
    '  operationInfo: GraphqlClientHelpers[K];',
    '  operationName: K;',
    "  getBody: (args: ExpectedGraphQLClient[K]['args']) => {",
    '    query: string;',
    '    variables: Record<string, any>;',
    '    operationName: K;',
    '  };',
    "  parseArgs: (args: ExpectedGraphQLClient[K]['args']) => Record<string, any>;",
    "  mountBodyString(args: ExpectedGraphQLClient[K]['args']): string;",
    '};',
    '',
    "export function getGraphQLFetchHelpers<MethodName extends GraphQLEntry['name']>(",
    '  methodName: MethodName,',
    '): GraphQLFetchParams<MethodName> {',
    '  const helpers = graphqlClientHelpers[methodName];',
    '',
    '  function parseArgs(args: any) {',
    '    const vars: Record<string, any> = {};',
    '    const parsedArgs: any = helpers.input.parse(args || {}, (_, error) => {',
    '      return `\\nGraphQLClientArgumentsError: method ${methodName}: \\n${error.message}`;',
    '    });',
    '',
    '    Object.entries(helpers.operation.varNames).forEach(([inputVarName, { varName }]) => {',
    '      vars[varName] = parsedArgs[inputVarName];',
    '    });',
    '',
    '    return vars;',
    '  }',
    '',
    '  function getBody(args: any) {',
    '    const variables = parseArgs(args);',
    '    return {',
    '      query: helpers.operation.query,',
    '      variables,',
    '      operationName: methodName,',
    '    };',
    '  }',
    '',
    '  function mountBodyString(args: any) {',
    '    const body = getBody(args);',
    '    return JSON.stringify(body);',
    '  }',
    '',
    '  return {',
    '    operationInfo: helpers,',
    '    operationName: methodName,',
    '    parseArgs,',
    '    getBody,',
    '    mountBodyString,',
    '  };',
    '}',
    '',
  ].join('\n');
}
