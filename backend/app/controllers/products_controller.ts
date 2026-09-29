import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import ProductTransformer from '#transformers/product_transformer'
import {
  createProductValidator,
  listProductsValidator,
  updateProductValidator,
} from '#validators/product'
import { DEFAULT_PER_PAGE } from '#validators/shared'

export default class ProductsController {
  async index({ request, serialize }: HttpContext) {
    const filters = await request.validateUsing(listProductsValidator, { data: request.qs() })

    const { search, active } = filters
    const query = Product.query()

    if (search) query.withScopes((scopes) => scopes.search(search))
    if (active !== undefined) query.where('active', active)

    const products = await query
      .orderBy('name')
      .paginate(filters.page ?? 1, filters.perPage ?? DEFAULT_PER_PAGE)
    products.baseUrl(request.url())

    return serialize(ProductTransformer.paginate(products.all(), products.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    return serialize(ProductTransformer.transform(product))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(createProductValidator)
    const product = await Product.create({ active: true, ...payload })

    response.status(201)
    return serialize(ProductTransformer.transform(product))
  }

  /**
   * Also used to activate/deactivate a product by sending only `active`.
   */
  async update({ params, request, serialize }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const payload = await request.validateUsing(updateProductValidator)

    await product.merge(payload).save()
    return serialize(ProductTransformer.transform(product))
  }
}
