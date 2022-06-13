import { tuple } from '@darch/utils/lib/typeUtils';

import { createObjectType } from '../../ObjectType';

describe('ProductType', () => {
  it('works', async () => {
    const productsStatusEnum = tuple('published', 'draft');

    const DimensionsType = createObjectType('Dimensions', {
      weight: 'string?',
      length: 'string?',
      height: 'string?',
      width: 'string?',
    });

    const ProductImageMapType = createObjectType('ProductImageMap', {
      key: 'string?',
      kind: 'string?',
      allowZoom: 'boolean?',
    });

    const BreadCrumb = createObjectType('BreadCrumb', {
      id: 'ID',
      active: 'boolean?',
      name: 'string',
      parentId: 'ID?',
    });

    const StockType = createObjectType('Stock', {
      available: 'boolean',
      count: 'float?',
      maxCartQty: 'float?',
      track: {
        type: 'boolean',
        description: 'Track count',
      },
    });

    const ProductType = createObjectType('Product', {
      sku: 'string',
      title: 'string',
      createdBy: 'string',
      stock: StockType,
      name: 'string',
      shortDescription: 'string?',
      brand: 'string',
      detailsUrl: 'string?',
      alcoholic: 'boolean',
      thumbUrl: 'string?',
      breadcrumb: [BreadCrumb],
      mapOfImages: [ProductImageMapType],
      attributes: 'record',
      currentPrice: 'float',
      priceFrom: 'float?',
      sellPrice: 'float',
      dimensions: DimensionsType,
      tags: '[string]?',
      isDraft: 'boolean?',
      slug: 'string?',
      categories: ['string'],
      status: { enum: productsStatusEnum },
      previousStatus: { enum: productsStatusEnum },
      spotlight: 'boolean?',
      publishedAt: 'date?',
      html: 'string?',
      // homogeneousKit: false,
      // heterogeneousKit: false,
      // kit: false,
      // simpleProduct: true
      // priceType: 'O',
      // validOnStore: true,
      // nutritionalMap: {},
      // commercialStructure: '/43/1632/',
      // showPackUnitPrice: false,
      // nominalPrice: false,
      // priceProgressiveMap: {},
    } as const);

    expect(ProductType.graphqlPrint().split('\n')).toEqual([
      'type Product {',
      '  sku: String!',
      '  title: String!',
      '  createdBy: String!',
      '  stock: Stock!',
      '  name: String!',
      '  shortDescription: String',
      '  brand: String!',
      '  detailsUrl: String',
      '  alcoholic: Boolean!',
      '  thumbUrl: String',
      '  breadcrumb: [BreadCrumb]!',
      '  mapOfImages: [ProductImageMap]!',
      '  attributes: Product_attributesRecord!',
      '  currentPrice: Float!',
      '  priceFrom: Float',
      '  sellPrice: Float!',
      '  dimensions: Dimensions!',
      '  tags: [String]',
      '  isDraft: Boolean',
      '  slug: String',
      '  categories: [String]!',
      '  status: Product_statusEnum!',
      '  previousStatus: Product_previousStatusEnum!',
      '  spotlight: Boolean',
      '  publishedAt: Date',
      '  html: String',
      '}',
      '',
      'type Stock {',
      '  available: Boolean!',
      '  count: Float',
      '  maxCartQty: Float',
      '',
      '  """Track count"""',
      '  track: Boolean!',
      '}',
      '',
      'type BreadCrumb {',
      '  id: ID!',
      '  active: Boolean',
      '  name: String!',
      '  parentId: ID',
      '}',
      '',
      'type ProductImageMap {',
      '  key: String',
      '  kind: String',
      '  allowZoom: Boolean',
      '}',
      '',
      'scalar Product_attributesRecord',
      '',
      'type Dimensions {',
      '  weight: String',
      '  length: String',
      '  height: String',
      '  width: String',
      '}',
      '',
      'enum Product_statusEnum {',
      '  published',
      '  draft',
      '}',
      '',
      'enum Product_previousStatusEnum {',
      '  published',
      '  draft',
      '}',
      '',
      'scalar Date',
    ]);
  });
});
