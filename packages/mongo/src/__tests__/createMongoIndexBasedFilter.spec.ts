import {
  getDocumentIndexFields,
  IndexFilter,
  IndexFilterRecord,
  PKSKValueType,
} from '@powership/transporter';

import { createMongoIndexBasedFilters } from '../parseMongoAttributeFilters';
import { AppMock, createAppMock } from './createAppMock';

describe('createMongoIndexBasedFilter', () => {
  let mockApp: AppMock;

  function hashQueryKey(filter: IndexFilterRecord) {
    return createMongoIndexBasedFilters({
      filter,
      indexConfig,
    })[0]._id;
  }

  it('should hashKey', () => {
    expect(
      hashQueryKey({
        PK: 'users',
        SK: 12000000000000000000000000000000000000,
      })
    ).toEqual('my_entity⋮_id⋮users⋮7z412⋮');

    expect(
      hashQueryKey({
        PK: 'users',
        SK: -0.0000000000000000000000000000000000012,
      })
    ).toEqual('my_entity⋮_id⋮users⋮4z1yx~⋮');

    expect(
      hashQueryKey({
        PK: 'users',
        SK: 0,
      })
    ).toEqual('my_entity⋮_id⋮users⋮5⋮');

    expect(hashQueryKey({ PK: 'users', SK: 2 })).toEqual(
      'my_entity⋮_id⋮users⋮712⋮'
    );

    expect(hashQueryKey({ PK: 'users', SK: '2' })).toEqual(
      'my_entity⋮_id⋮users⋮2⋮'
    );
  });

  async function get(
    PK: PKSKValueType,
    SK: PKSKValueType | IndexFilter | undefined
  ) {
    const $and = createMongoIndexBasedFilters({
      indexConfig,
      filter: {
        PK,
        SK: SK === undefined ? null : SK,
      },
    });

    return await mockApp
      .collection()
      .find({ $and })
      .sort({ _idSK: 1 })
      .project(['_id', '_idPK', '_idSK', '_e', '_c', 'originalSK'])
      .toArray();
  }

  beforeAll(async function () {
    mockApp = await createAppMock().start();

    await Promise.all(
      ITEMS.map(async ({ PK, SK }) => {
        const { indexFields } = getDocumentIndexFields(
          {
            PK,
            SK,
          },
          {
            entity: 'my_entity',
            indexes: [{ name: '_id', PK: ['.PK'], SK: ['.SK'] }],
          }
        );

        const doc: any = {
          ...indexFields,
        };

        if (PK === 'ranking') {
          doc.originalSK = SK;
        }

        await mockApp.collection().insertOne(doc);
      })
    );
  });

  afterAll(async function () {
    await mockApp.reset();
  });

  describe('parse string SK', () => {
    it('should handle empty key condition', async () => {
      const query = createMongoIndexBasedFilters({
        indexConfig,
        filter: {
          PK: '123',
          SK: 'skv',
        },
      });

      expect(query).toEqual([{ _id: 'my_entity⋮_id⋮123⋮skv⋮' }]);
    });

    it('should handle $startsWith', async () => {
      const query = createMongoIndexBasedFilters({
        indexConfig,
        filter: {
          PK: '123',
          SK: {
            $startsWith: 'a',
          },
        },
      });

      expect(query).toEqual([
        {
          _idPK: 'my_entity⋮_id⋮123⋮',
        },
        {
          _idSK: {
            $regex: '^a',
          },
        },
      ]);
    });

    it('should handle $between', async () => {
      const query = createMongoIndexBasedFilters({
        indexConfig,
        filter: {
          PK: '123',
          SK: {
            $between: ['a', 'c'],
          },
        },
      });

      expect(query).toEqual([
        {
          _idPK: 'my_entity⋮_id⋮123⋮',
        },
        {
          _idSK: {
            $gte: 'a',
            $lte: 'c',
          },
        },
      ]);
    });

    it('should handle $eq', async () => {
      const query = createMongoIndexBasedFilters({
        indexConfig,
        filter: {
          PK: 'users⦙123',
          SK: {
            $eq: 'abc',
          },
        },
      });

      expect(query).toEqual([
        {
          _idPK: 'my_entity⋮_id⋮users⦙123⋮',
        },
        {
          _idSK: { $eq: 'abc' },
        },
      ]);
    });

    it('should handle $gt', async () => {
      const query = createMongoIndexBasedFilters({
        filter: {
          PK: 'users⦙123',
          SK: {
            $gt: 'abc',
          },
        },
        indexConfig,
      });

      expect(query).toEqual([
        {
          _idPK: 'my_entity⋮_id⋮users⦙123⋮',
        },
        {
          _idSK: {
            $gt: 'abc',
          },
        },
      ]);
    });

    it('should handle $gte', async () => {
      const query = createMongoIndexBasedFilters({
        filter: {
          PK: 'users⦙123',
          SK: {
            $gte: 'abc',
          },
        },
        indexConfig,
      });

      expect(query).toEqual([
        {
          _idPK: 'my_entity⋮_id⋮users⦙123⋮',
        },
        {
          _idSK: {
            $gte: 'abc',
          },
        },
      ]);
    });

    it('should handle $lt', async () => {
      const query = createMongoIndexBasedFilters({
        filter: {
          PK: 123,
          SK: {
            $lt: 'abc',
          },
        },
        indexConfig,
      });

      expect(query).toEqual([
        {
          _idPK: 'my_entity⋮_id⋮73123⋮',
        },
        {
          _idSK: {
            $lt: 'abc',
          },
        },
      ]);
    });

    it('should handle $lte', async () => {
      const query = createMongoIndexBasedFilters({
        indexConfig,
        filter: {
          PK: 'users⦙123',
          SK: {
            $lte: 'abc',
          },
        },
      });

      expect(query).toEqual([
        {
          _idPK: 'my_entity⋮_id⋮users⦙123⋮',
        },
        {
          _idSK: {
            $lte: 'abc',
          },
        },
      ]);
    });
  });

  describe('query string SK', () => {
    it('should handle empty key condition', async () => {
      expect(await get('users', {})).toHaveLength(6);
    });

    it('should handle $startsWith', async () => {
      const sut = await get('users', { $startsWith: 'cacau' });
      expect(sut).toEqual([
        {
          _id: 'my_entity⋮_id⋮users⋮cacau⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacau2⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau2',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacauZ⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacauZ',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $between', async () => {
      const sut = await get('users', { $between: ['a', 'cz'] });

      expect(sut).toEqual([
        {
          _id: 'my_entity⋮_id⋮users⋮antonio⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'antonio',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacau⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacau2⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau2',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacauZ⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacauZ',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $eq', async () => {
      const sut = await get('users', { $eq: 'cacau' });
      expect(sut).toEqual([
        {
          _id: 'my_entity⋮_id⋮users⋮cacau⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $gt', async () => {
      const sut = await get('users', { $gt: 'cacau' });
      //
      expect(sut).toEqual([
        {
          _id: 'my_entity⋮_id⋮users⋮cacau2⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau2',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacauZ⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacauZ',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮maggie⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'maggie',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮rafaela⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'rafaela',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $gte', async () => {
      const sut = await get('users', { $gte: 'maggie' });
      expect(sut).toEqual([
        {
          _id: 'my_entity⋮_id⋮users⋮maggie⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'maggie',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮rafaela⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'rafaela',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $lt', async () => {
      const sut = await get('users', { $lt: 'cacau2' });
      expect(sut).toEqual([
        {
          _id: 'my_entity⋮_id⋮users⋮antonio⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'antonio',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacau⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $lte', async () => {
      const sut = await get('users', { $lte: 'cacau2' });

      expect(sut).toEqual([
        {
          _id: 'my_entity⋮_id⋮users⋮antonio⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'antonio',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacau⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮users⋮cacau2⋮',
          _idPK: 'my_entity⋮_id⋮users⋮',
          _idSK: 'cacau2',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });
  });

  describe('query number SK', () => {
    it('should handle empty key condition', async () => {
      expect(await get('ranking', {})).toHaveLength(8);
    });

    it('should handle $between', async () => {
      const t1 = await get('ranking', { $between: [0, 2] });

      expect(t1).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮5⋮',
          originalSK: 0,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '5',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮ranking⋮6x7⋮',
          originalSK: 0.007,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '6x7',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮ranking⋮712⋮',
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '712',
          originalSK: 2,
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);

      const t2 = await get('ranking', {
        $between: [-0.1, -0.000000000001],
      });

      expect(t2).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮42y~⋮',
          originalSK: -0.001,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '42y~',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮ranking⋮4by~⋮',
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '4by~',
          originalSK: -0.000000000001,
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $eq', async () => {
      expect(await get('ranking', { $eq: 0.007 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮6x7⋮',
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '6x7',
          originalSK: 0.007,
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle ignore trailing zeros', async () => {
      expect(await get('ranking', { $eq: -0.0 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮5⋮',
          originalSK: 0,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '5',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);

      expect(await get('ranking', { $eq: -0.001 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮42y~⋮',
          originalSK: -0.001,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '42y~',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $gt', async () => {
      expect(await get('ranking', { $gt: 33 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮751⋮',
          originalSK: 10000,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '751',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);

      expect(await get('ranking', { $gt: 33 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮751⋮',
          originalSK: 10000,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '751',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $gte', async () => {
      expect(await get('ranking', { $gte: 33 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮7233⋮',
          originalSK: 33,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '7233',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮ranking⋮751⋮',
          originalSK: 10000,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '751',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $lt', async () => {
      expect(await get('ranking', { $lt: -0.000000000001 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮42y~⋮',
          originalSK: -0.001,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '42y~',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);

      expect(await get('ranking', { $lt: -0.001 })).toEqual([]);

      expect(await get('ranking', { $lt: 0.007 })).toEqual([
        {
          _id: 'my_entity⋮_id⋮ranking⋮42y~⋮',
          originalSK: -0.001,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '42y~',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮ranking⋮4by~⋮',
          originalSK: -0.000000000001,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '4by~',
          _e: 'my_entity',
          _c: expect.any(String),
        },
        {
          _id: 'my_entity⋮_id⋮ranking⋮5⋮',
          originalSK: 0,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '5',
          _e: 'my_entity',
          _c: expect.any(String),
        },
      ]);
    });

    it('should handle $lte', async () => {
      expect(await get('ranking', { $lte: -0.001 })).toEqual([
        expect.objectContaining({
          _id: 'my_entity⋮_id⋮ranking⋮42y~⋮',
          originalSK: -0.001,
          _idPK: 'my_entity⋮_id⋮ranking⋮',
          _idSK: '42y~',
          _e: 'my_entity',
          _c: expect.any(String),
        }),
      ]);

      expect(await get('ranking', { $lte: 33 })).toHaveLength(7);
    });
  });
});

const ITEMS = [
  { PK: 'ranking', SK: -0.001 },
  { PK: 'ranking', SK: -1e-12 },
  { PK: 'ranking', SK: 0 },
  { PK: 'ranking', SK: 0.007 },
  { PK: 'ranking', SK: 10000 },
  { PK: 'ranking', SK: 11 },
  { PK: 'ranking', SK: 2 },
  { PK: 'ranking', SK: 33 },
  { PK: 'users', SK: 'antonio' },
  { PK: 'users', SK: 'cacau' },
  { PK: 'users', SK: 'cacau2' }, //my_entity⋮_id⋮users⋮cacau2
  { PK: 'users', SK: 'cacauZ' },
  { PK: 'users', SK: 'maggie' },
  { PK: 'users', SK: 'rafaela' },
];

const indexConfig = {
  entity: 'my_entity',
  indexes: [{ name: '_id', PK: ['.PK'], SK: ['.SK'] }],
} as const;
