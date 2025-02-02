import { resetTypesCache } from '@powership/schema';

import { MongoTransporter } from '../MongoTransporter';
import { AppMock, createAppMock } from './createAppMock';

const defaultOptions = () => ({
  collection: 'temp1',
});

export function setupMongoTest(
  _options: Partial<ReturnType<typeof defaultOptions>> = {}
) {
  const options = {
    ...defaultOptions(),
    ..._options,
  };

  let mockApp: AppMock;
  let transporter: MongoTransporter;

  beforeEach(async function () {
    await resetTypesCache();
    mockApp = createAppMock();
    await mockApp.start();
    transporter = new MongoTransporter({
      client: mockApp.client!,
      collection: options.collection,
    });
  });

  afterEach(async function () {
    await mockApp.reset().catch(console.error);
  });

  return {
    app: () => mockApp,
    indexConfig: () =>
      ({
        entity: 'product',
        indexes: [
          {
            PK: ['.storeId'],
            SK: ['.sku'],
            name: '_id',
          },
        ],
      } as const),
    transporter: () => transporter,
  };
}
