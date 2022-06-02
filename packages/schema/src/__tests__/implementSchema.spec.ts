import { assert, IsExact } from 'conditional-type-checks';

import { Infer } from '../Infer';
import { createSchema, Schema } from '../Schema';
import { implementSchema, ImplementSchema } from '../implementSchema';

describe('implementSchema', () => {
  afterEach(Schema.reset);

  test('infer ImplementSchema', async () => {
    const nodeType = createSchema('Node', {
      id: 'ID',
    });

    const ship = createSchema({ name: 'string' });

    type Result = ImplementSchema<typeof nodeType, [typeof ship]>;
    type Inferred = Infer<Result>;

    assert<IsExact<Inferred, { id: string; name: string }>>(true);
  });

  test('infer implementSchema', async () => {
    const nodeType = createSchema('Node', {
      id: 'ID',
    });

    const pageNodeType = createSchema('PageNode', {
      title: 'string',
    });

    const ship = implementSchema(
      'ship',
      { name: 'string' },
      nodeType,
      pageNodeType
    );

    type Result = typeof ship;
    type Inferred = Infer<Result>;

    assert<IsExact<Inferred, { id: string; name: string; title: string }>>(
      true
    );
  });

  it('Should extend definition', async () => {
    const nodeType = createSchema('Node', {
      id: 'ID',
      status: { enum: ['published', 'draft'] },
    } as const);

    const pageNodeType = createSchema('PageNode', {
      title: 'string',
    });

    const postType = implementSchema(
      'Post',
      { body: 'string' },
      nodeType,
      pageNodeType
    );

    expect(postType.definition).toEqual({
      __dschm__: {
        def: {
          id: 'Post',
          implements: ['Node', 'PageNode'],
        },
        type: 'meta',
      },
      id: {
        list: false,
        optional: false,
        type: 'ID',
      },
      status: {
        def: ['published', 'draft'],
        list: false,
        optional: false,
        type: 'enum',
      },
      body: {
        list: false,
        optional: false,
        type: 'string',
      },
      title: {
        list: false,
        optional: false,
        type: 'string',
      },
    });
  });

  it('Should create graphql type', async () => {
    const nodeType = createSchema('Node', {
      id: 'ID',
      status: { enum: ['published', 'draft'] },
    } as const);

    const pageNodeType = createSchema('PageNode', {
      title: 'string',
    });

    const postType = implementSchema(
      'Post',
      { body: 'string' },
      nodeType,
      pageNodeType
    );

    expect(postType.graphqlPrint().split('\n')).toEqual([
      'type Post implements NodeInterface & PageNodeInterface {',
      '  title: String!',
      '  id: ID!',
      '  status: Post_statusEnum!',
      '  body: String!',
      '}',
      '',
      'interface NodeInterface {',
      '  id: ID!',
      '  status: Node_statusEnum!',
      '}',
      '',
      'enum Node_statusEnum {',
      '  published',
      '  draft',
      '}',
      '',
      'interface PageNodeInterface {',
      '  title: String!',
      '}',
      '',
      'enum Post_statusEnum {',
      '  published',
      '  draft',
      '}',
    ]);
  });
});
