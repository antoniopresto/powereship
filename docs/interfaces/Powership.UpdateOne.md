[Powership](../README.md) / [Modules](../modules.md) / [Powership](../modules/Powership.md) / UpdateOne

# Interface: UpdateOne<Doc, Indexes\>

[Powership](../modules/Powership.md).UpdateOne

## Type parameters

| Name | Type |
| :------ | :------ |
| `Doc` | extends [`DocumentBase`](../modules/Powership.md#documentbase) |
| `Indexes` | extends [`DocumentIndexesConfig`](Powership.DocumentIndexesConfig.md) |

## Callable

### UpdateOne

▸ **UpdateOne**(`options`): `Promise`<{ `created`: `boolean` ; `error?`: ``null`` \| `string` ; `item`: ``null`` \| `Doc` ; `updated`: `boolean`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Indexes`[`number`] extends `I` ? `I` extends `unknown` ? `I` extends { `PK`: readonly `PK`[] ; `SK?`: readonly `SK`[]  } ? { `condition`: `undefined` \| [`FilterRecord`](../modules/Powership.md#filterrecord)<`Doc`\> ; `context`: `undefined` \| [`LoaderContext`](../modules/Powership.md#loadercontext) ; `filter`: [`Compute`](../modules/Powership.TU.md#compute)<[`UnionToIntersection`](../modules/Powership.TU.md#uniontointersection)<[`IndexFilterRecord`](../modules/Powership.md#indexfilterrecord)<`IndexField`<`PK`, `never`\>, `IndexField`<`SK`, `undefined`\>\> extends `F` ? `F` extends `unknown` ? { [K in string \| number \| symbol]?: F[K] } & { `id?`: [`PKSKValueType`](../modules/Powership.md#pkskvaluetype)  } : {} : {}\>, ``1``\> ; `update`: [`UpdateExpression`](../modules/Powership.md#updateexpression)<`Doc`\> ; `upsert`: `undefined` \| `boolean`  } : `never` : `never` : `never` |

#### Returns

`Promise`<{ `created`: `boolean` ; `error?`: ``null`` \| `string` ; `item`: ``null`` \| `Doc` ; `updated`: `boolean`  }\>

#### Defined in

packages/transporter/lib/IndexMethods.d.ts:71
