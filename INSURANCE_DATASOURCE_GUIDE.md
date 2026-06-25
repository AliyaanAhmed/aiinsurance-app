# Insurance Quotes Data Source Guide

This file documents how we will add Dataverse tables to the `Insurance Quotes` Power Apps Code App and how we will handle relationship-based records in services.

It is based on:

- the verified setup in this repo
- the Power Code App patterns from the attached project references
- the relationship-query patterns from the attached project references

## 1. Core Rule

A Dataverse table existing in the environment or solution is not enough.

If we want to use a table in this Code App, we must add it as a **Code App data source**.

Without that, the app will not get:

- Power Apps datasource wiring
- generated schema metadata
- generated TypeScript model files
- generated TypeScript service files

## 2. App Context For This Repo

Current Code App:

- App Name: `Insurance Quotes`
- Environment ID: `75dd5fe2-be00-e8ef-b643-353c3cdd9ac7`
- Solution ID: `27da6077-5118-f111-8342-7ced8da0b39a`
- Dataverse Org URL: `https://org6fc049b4.crm6.dynamics.com`

## 3. How We Add A Table As A Data Source

Command pattern for this repo:

```bash
npx power-apps add-data-source --non-interactive --api-id dataverse --resource-name <logical-table-name> --org-url "https://org6fc049b4.crm6.dynamics.com" --solution-id 27da6077-5118-f111-8342-7ced8da0b39a --json
```

Example that we already verified:

```bash
npx power-apps add-data-source --non-interactive --api-id dataverse --resource-name aur_products --org-url "https://org6fc049b4.crm6.dynamics.com" --solution-id 27da6077-5118-f111-8342-7ced8da0b39a --json
```

## 4. What To Verify After Adding A Table

After adding a datasource, verify these files:

- `power.config.json`
- `.power/schemas/appschemas/dataSourcesInfo.ts`
- `.power/schemas/dataverse/*.Schema.json`
- `src/generated/models/*`
- `src/generated/services/*`

For the tested `aur_products` table, the generated outputs are:

- [power.config.json](/C:/AI-Insuarance-App/power.config.json)
- [.power/schemas/appschemas/dataSourcesInfo.ts](/C:/AI-Insuarance-App/.power/schemas/appschemas/dataSourcesInfo.ts)
- [.power/schemas/dataverse/products.Schema.json](/C:/AI-Insuarance-App/.power/schemas/dataverse/products.Schema.json)
- [src/generated/models/Aur_productsesModel.ts](/C:/AI-Insuarance-App/src/generated/models/Aur_productsesModel.ts)
- [src/generated/services/Aur_productsesService.ts](/C:/AI-Insuarance-App/src/generated/services/Aur_productsesService.ts)

## 5. Important Rules We Will Follow

- Never manually edit files inside `src/generated/`
- Never assume a table is usable just because it is visible in the solution
- Always add the table as a Code App datasource first
- Always use the Dataverse org URL, not the maker portal URL
- Always verify generated files after adding a datasource
- Build before pushing when possible

## 6. How Generated Services Work

After a table is added, Power Apps generates a typed service and model.

Example from this repo:

- [src/generated/services/Aur_productsesService.ts](/C:/AI-Insuarance-App/src/generated/services/Aur_productsesService.ts)
- [src/generated/models/Aur_productsesModel.ts](/C:/AI-Insuarance-App/src/generated/models/Aur_productsesModel.ts)

Typical generated methods:

- `create(...)`
- `update(...)`
- `delete(...)`
- `get(...)`
- `getAll(...)`
- `getMetadata(...)`

These generated services should be treated as the low-level Dataverse access layer.

## 7. Service Layer Pattern We Will Use

We will not place raw Dataverse mapping logic directly in UI pages.

Preferred structure:

- `src/generated/`
  Power Apps generated models and services
- `src/api/dataverse/`
  optional adapter files if we want a cleaner API boundary
- `src/services/`
  app-facing business logic and mapping
- `src/domain/`
  clean domain types for UI use
- `src/pages/` and `src/components/`
  presentation only

Recommended flow:

1. generated service retrieves raw Dataverse rows
2. service or adapter normalizes them
3. UI consumes clean domain types

## 8. Recommended Basic Service Example

Example pattern for a products service wrapper:

```ts
import { Aur_productsesService } from '@/generated/services/Aur_productsesService'

export async function listProducts() {
  const result = await Aur_productsesService.getAll({
    select: ['aur_productsid', 'aur_name'],
    orderBy: ['aur_name asc'],
  })

  return (result.data ?? []).map((row) => ({
    id: row.aur_productsid ?? '',
    name: row.aur_name ?? '',
  }))
}
```

This pattern keeps UI code simple and avoids spreading generated model details everywhere.

## 9. How We Will Handle Relationship Records

For related tables, we will follow the same approach used in your attached reference docs:

- add all involved tables as datasources
- use generated services for each datasource
- retrieve related records in separate calls when appropriate
- stitch the final shape together in app code

We usually do **not** depend on one large `expand` query for everything.

## 10. One-To-Many Relationship Pattern

Example:

- `Table 1` = parent
- `Table 2` = child

Preferred pattern:

1. add both tables as datasources
2. retrieve the parent record
3. retrieve child records using the parent lookup raw id
4. map them into the final UI shape

Example shape:

```ts
const parent = await ParentService.get(parentId, {
  select: ['parentid', 'name'],
})

const children = await ChildService.getAll({
  select: ['childid', 'name', '_parent_value'],
  filter: `_parent_value eq ${parentId}`,
  orderBy: ['name asc'],
})

return {
  id: parent.data?.parentid ?? '',
  name: parent.data?.name ?? '',
  children: children.data ?? [],
}
```

## 11. Many-To-Many Relationship Pattern

If two main tables are linked through an intersect / relationship table, we will:

1. add the two main tables as datasources
2. add the relationship table as a datasource
3. use the relationship-table generated service directly
4. create or delete relationship rows through wrapper services
5. restore selections by querying the relationship table

This is the recommended pattern for selection-based relationships.

## 12. Nested / Threaded Relationship Pattern

If the UI needs threaded or nested data:

- load the related records using the generated service
- group them in a service file
- return a UI-friendly nested structure

Example use cases:

- comments with replies
- notes grouped under a quote
- attachments grouped under a record

## 13. Lookup, Choice, and Create Rules

We will follow these field rules consistently:

### Lookup fields

On retrieve:

- preserve raw lookup id for logic
- preserve formatted lookup label for display when available

On create/update:

- use `@odata.bind`

Example:

```ts
'aur_product@odata.bind': `/aur_productses(${productId})`
```

### Choice / option set fields

On retrieve:

- use formatted label for UI
- preserve raw numeric value for app logic

On create/update:

- send the raw numeric option value

### Text and number fields

On retrieve:

- use plain field values

On create/update:

- send plain field values

## 14. Recommended Files We Will Create As The App Grows

For each important business area, we should prefer a wrapper service in `src/services/`.

Examples:

- `src/services/productService.ts`
- `src/services/quoteService.ts`
- `src/services/customerService.ts`
- `src/services/policyService.ts`

If needed, we can also add:

- `src/api/dataverse/`
- `src/domain/`
- `src/hooks/`

## 15. Workflow We Will Follow Every Time

For each new Dataverse table:

1. get the logical table name
2. run `add-data-source`
3. verify generated files
4. create a wrapper service if the table is used by UI
5. keep generated code untouched
6. run build
7. push to Power Apps

## 16. Summary

For this repo, the datasource process is:

1. add the Dataverse table using logical name + org URL + solution ID
2. verify Power Apps generated files
3. use generated services as the base integration layer
4. build app-facing wrapper services for business logic and relationship handling
5. keep relationship stitching in services, not in page components

This is the pattern we should keep following for all remaining tables in `Insurance Quotes`.
