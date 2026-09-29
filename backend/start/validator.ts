/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Validation messages in Portuguese, since the API is consumed by a
 * Portuguese interface.
 */
vine.messagesProvider = new SimpleMessagesProvider(
  {
    'required': 'O campo {{ field }} é obrigatório.',
    'string': 'O campo {{ field }} deve ser um texto.',
    'number': 'O campo {{ field }} deve ser um número.',
    'boolean': 'O campo {{ field }} deve ser verdadeiro ou falso.',
    'enum': 'O campo {{ field }} deve ser um destes valores: {{ choices }}.',
    'array': 'O campo {{ field }} deve ser uma lista.',
    'object': 'O campo {{ field }} deve ser um objeto.',
    'minLength': 'O campo {{ field }} deve ter pelo menos {{ min }} caracteres.',
    'maxLength': 'O campo {{ field }} deve ter no máximo {{ max }} caracteres.',
    'distinct': 'O campo {{ field }} tem valores repetidos.',
    'range': 'O campo {{ field }} deve estar entre {{ min }} e {{ max }}.',
    'min': 'O campo {{ field }} deve ser no mínimo {{ min }}.',
    'positive': 'O campo {{ field }} deve ser maior que zero.',
    'withoutDecimals': 'O campo {{ field }} deve ser um número inteiro.',
    'regex': 'O campo {{ field }} está em um formato inválido.',
    'database.exists': 'O {{ field }} informado não existe.',
    'items.array.minLength': 'O pedido precisa ter pelo menos um produto.',
    'items.distinct': 'Cada produto só pode aparecer uma vez no pedido.',
    'items.*.quantity.range': 'A quantidade deve estar entre {{ min }} e {{ max }}.',
    'customerId.required': 'Selecione o cliente do pedido.',
    'customerId.database.exists': 'Cliente não encontrado.',
  },
  {
    name: 'nome',
    phone: 'telefone',
    priceCents: 'preço',
    active: 'ativo',
    customerId: 'cliente',
    items: 'itens',
    quantity: 'quantidade',
    productId: 'produto',
    status: 'status',
    page: 'página',
    perPage: 'itens por página',
    search: 'busca',
  }
)
