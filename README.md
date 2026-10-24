A GraphQL API built on top of NestJS and containerized by Docker.

### Category limits

`CategoryLimitsModule` stores per-user category limits in `categorylimitrecords`.
Default versions apply from their `YYYY-MM` period until the next version; monthly overrides
apply only to their exact period. Earlier months are preserved when a new default is saved.

- Query: `getCategoryLimits(year: Int!, month: Int!)`.
- Mutation: `saveCategoryLimits(year: Int!, month: Int!, scope: String!, changes: [CategoryLimitChange!]!)`.
- Scope is `default` (from this month) or `month` (this month only).
- Changes contain `categoryId` and nullable `monthlyLimit`. Zero is a valid limit; null means no limit.
- `resetToDefault: true` with scope `month` removes the override. Saving a new default clears an override in that same month.
- Both operations use the JWT user and check category ownership, including shared default categories.
- All changes are validated before a batch write. A unique user/category/scope/period index prevents duplicate versions.
- Saving also raises any configured parent limit below the sum of its child limits, including unchanged children. Larger parents are never lowered; null parents remain unlimited, while zero parents can be raised. Amounts are summed in integer cents and oversized totals are rejected before writing.
- Recurring parent minimums use recurring child limits. A one-month child exception can raise the parent's monthly override without changing its recurring limit. Resets are checked too, so resetting a parent cannot leave it below its children's monthly total. Earlier periods are not rewritten. The mutation returns the adjusted parent limits with the rest of the saved configuration.

Deploy the backend before the updated frontend. No existing category or expense migration is needed.
Validation: `npm run build` and `npm test -- --runInBand category-limits`.

The application was built for the [Budget App](http://95.217.18.50:5000/).

### Getting started
Start the application

`npm start:dev`

Build and start the container

`docker-compose up`

### Automatic redeployment on the server

For redeploying the docker image we are using [watchtower](https://containrrr.dev/watchtower/).

To activate automatic redeployment, simply execute the following command on the server:

```
docker run -d \
--name watchtower \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/localtime:/etc/localtime:ro \
containrrr/watchtower \
--cleanup \
--remove-volumes \
--interval 60
```
