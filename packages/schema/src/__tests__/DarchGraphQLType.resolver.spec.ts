import { PromiseType } from '@darch/utils/lib/typeUtils';
import { assert, IsExact } from 'conditional-type-checks';
import { GraphQLObjectType, GraphQLSchema, printSchema } from 'graphql';

import { DarchGraphQLType } from '../DarchGraphQLType';
import { createDarchSchema, Schema } from '../Schema';

describe('createResolver', () => {
  afterEach(async () => {
    await Schema.reset();
  });

  it('Should create a Resolver', () => {
    const UserType = createDarchSchema('User', {
      name: { string: {}, description: 'the user name' },
      id: 'ulid',
    });

    const resolver = new DarchGraphQLType(UserType).resolver({
      name: 'User',
      args: { id: 'ulid' },
      description: 'User resolver',
      async resolve(_, { id }) {
        return {
          name: id,
          id: id,
        } as any;
      },
    });

    type Return = PromiseType<ReturnType<typeof resolver.resolve>>;
    type Args = Parameters<typeof resolver.resolve>[1];

    assert<IsExact<Return, { name: string; id: string }>>(true);
    assert<IsExact<Args, { id: string }>>(true);

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',

        fields: () => ({
          users: resolver,
        }),
      }),
    });

    expect(printSchema(schema).split('\n')).toEqual([
      'type Query {',
      '  """User resolver"""',
      '  users(id: Ulid!): User!',
      '}',
      '',
      'type User {',
      '  """the user name"""',
      '  name: String!',
      '  id: Ulid!',
      '}',
      '',
      'scalar Ulid',
    ]);
  });

  it('Should create complex types preserving names', () => {
    const user = createDarchSchema('user', {
      name: 'string',
      age: 'int?',
    });

    const userAddress = createDarchSchema('UserAddress', {
      street: 'string',
      number: 'int?',
    }).describe('The user address');

    const resolver = new DarchGraphQLType(user).resolver({
      name: 'Users',
      args: {
        name: 'string',
        addresses: { schema: userAddress, list: true },
        records: { record: { keyType: 'int', type: { enum: ['banana'] } } },
      } as const,
      resolve() {
        return {} as any;
      },
    });

    type Return = ReturnType<typeof resolver.resolve>;
    type Args = Parameters<typeof resolver.resolve>[1];

    assert<IsExact<Return, Promise<{ name: string; age?: number }>>>(true);

    assert<
      IsExact<
        Args,
        {
          name: string;
          addresses: {
            number?: number | undefined;
            street: string;
          }[];
          records: { [K: number]: 'banana' };
        }
      >
    >(true);

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',

        fields: () => ({
          users: resolver,
        }),
      }),
    });

    expect(printSchema(schema).split('\n')).toEqual([
      'type Query {',
      '  users(name: String!, addresses: [UserAddressInput]!, records: UsersInput_recordsRecord!): user!',
      '}',
      '',
      'type user {',
      '  name: String!',
      '  age: Int',
      '}',
      '',
      'input UserAddressInput {',
      '  street: String!',
      '  number: Int',
      '}',
      '',
      'scalar UsersInput_recordsRecord',
    ]);
  });

  it('Should accept literals as type', () => {
    const resolver = new DarchGraphQLType('Airplanes', '[int]?').resolver({
      name: 'Airplanes',
      args: undefined,
      async resolve() {
        return undefined;
      },
    });

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',

        fields: () => ({
          airplanes: resolver,
        }),
      }),
    });

    expect(printSchema(schema).split('\n')).toEqual([
      'type Query {',
      '  airplanes: [Int]',
      '}',
    ]);
  });
});
