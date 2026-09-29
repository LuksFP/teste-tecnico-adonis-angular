/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import db from '@adonisjs/lucid/services/db'
import { controllers } from '#generated/controllers'

router.get('/health', async ({ response }) => {
  try {
    await db.rawQuery('select 1')
    return { status: 'ok', database: 'ok' }
  } catch {
    return response.status(503).send({ status: 'degraded', database: 'down' })
  }
})

router
  .group(() => {
    router
      .resource('customers', controllers.Customers)
      .apiOnly()
      .except(['destroy'])
      .where('id', router.matchers.number())

    router
      .resource('products', controllers.Products)
      .apiOnly()
      .except(['destroy'])
      .where('id', router.matchers.number())

    router
      .resource('orders', controllers.Orders)
      .apiOnly()
      .only(['index', 'store', 'show'])
      .where('id', router.matchers.number())

    router
      .patch('orders/:id/status', [controllers.Orders, 'updateStatus'])
      .where('id', router.matchers.number())
      .as('orders.updateStatus')
  })
  .prefix('/api/v1')
