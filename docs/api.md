# Referência da API

Base: `http://localhost:3333/api/v1`. Todas as requisições e respostas são JSON.

## Convenções

Toda resposta de sucesso vem dentro de `data`, e as listas paginadas trazem também `metadata`:

```json
{
  "data": [{ "id": 1, "name": "Ana Souza", "phone": "(13) 99812-4410", "createdAt": "2026-09-29T15:00:25.000+00:00", "updatedAt": "2026-09-29T15:00:25.000+00:00" }],
  "metadata": {
    "total": 4, "perPage": 1, "currentPage": 1, "lastPage": 4, "firstPage": 1,
    "firstPageUrl": "/api/v1/customers?page=1", "lastPageUrl": "/api/v1/customers?page=4",
    "nextPageUrl": "/api/v1/customers?page=2", "previousPageUrl": null
  }
}
```

Erro tem sempre o mesmo formato, qualquer que seja a causa:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Os dados enviados são inválidos.", "details": [ ... ] } }
```

Dinheiro é sempre inteiro em centavos (`2500` é R$ 25,00). Toda listagem aceita `page`, que começa em 1, e `perPage`, que vale 10 se não for informado e vai no máximo até 100.

## Códigos de erro

| HTTP | `code` | Quando |
|---|---|---|
| 400 | `INVALID_JSON` | Corpo da requisição não é JSON válido |
| 404 | `NOT_FOUND` | Id que não existe |
| 404 | `E_ROUTE_NOT_FOUND` | Rota que não existe (inclui id não numérico e `DELETE`) |
| 409 | `INVALID_STATUS_TRANSITION` | Troca de status fora do fluxo. `details` traz `from`, `to` e `allowed` |
| 409 | `ORDER_STATUS_CHANGED` | O pedido mudou de status antes desta troca: o `from` enviado não é mais o status atual, ou outra requisição gravou primeiro |
| 422 | `VALIDATION_ERROR` | Entrada inválida. `details` é uma lista `{ field, message, rule }` |
| 422 | `PRODUCT_NOT_FOUND` | Pedido com produto que não existe. `details.productIds` |
| 422 | `PRODUCT_INACTIVE` | Pedido com produto inativo. `details.productIds` |
| 500 | `INTERNAL_ERROR` | Falha inesperada. A mensagem é genérica; o detalhe fica só no log |

---

## Saúde

### `GET /health`

Fora do prefixo `/api/v1`. Responde `200 { "status": "ok", "database": "ok" }`, ou `503` com `"database": "down"` se o banco não responder.

---

## Clientes

| Campo | Tipo | Regra |
|---|---|---|
| `name` | texto | 2 a 120 caracteres, espaços nas pontas são removidos |
| `phone` | texto | Só dígitos, espaço, `( ) - . +`, com 10 a 13 dígitos. Ex.: `(13) 99812-4410`, `+55 13 99812-4410` |

### `GET /customers`

Query: `page`, `perPage`, `search` (procura no nome e no telefone). Ordenado por nome.

### `GET /customers/:id`

`404 NOT_FOUND` se não existir.

### `POST /customers`

```json
{ "name": "Bruno Lima", "phone": "(13) 99745-1022" }
```

`201` com o cliente criado.

### `PATCH /customers/:id` (ou `PUT`)

Envia só o que muda: `{ "phone": "(11) 98888-7777" }`.

---

## Produtos

| Campo | Tipo | Regra |
|---|---|---|
| `name` | texto | 2 a 120 caracteres |
| `priceCents` | inteiro | 1 a 100.000.000 (R$ 0,01 a R$ 1.000.000,00) |
| `active` | booleano | Opcional, padrão `true` |

### `GET /products`

Query: `page`, `perPage`, `search` (nome), `active` (`true`/`false`). Ordenado por nome.

### `GET /products/:id`

### `POST /products`

```json
{ "name": "X-Salada", "priceCents": 2800 }
```

### `PATCH /products/:id` (ou `PUT`)

Edição parcial. Ativar e desativar é esta mesma rota: `{ "active": false }`.
Mudar o preço não altera pedidos já feitos (ver [regras-de-negocio.md](regras-de-negocio.md)).

---

## Pedidos

### `GET /orders`

Query: `page`, `perPage`, `status`, `customerId`, `search`. A busca aceita o número do pedido (`search=12`) ou parte do nome do cliente (`search=bruno`). Ordenado do mais novo para o mais antigo. Cada pedido vem com `customer`.

### `GET /orders/:id`

Pedido com `customer` e `items`, e cada item com `product`.

### `POST /orders`

```json
{
  "customerId": 1,
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 4, "quantity": 1 }
  ]
}
```

| Campo | Regra |
|---|---|
| `customerId` | Obrigatório e precisa existir |
| `items` | Pelo menos 1 item, sem repetir `productId` |
| `items[].quantity` | Inteiro de 1 a 999 |

Qualquer outro campo (um `totalCents`, um preço) é ignorado: preço e total saem do banco.

Resposta `201`:

```json
{
  "data": {
    "id": 8,
    "customerId": 1,
    "status": "pending",
    "totalCents": 5700,
    "createdAt": "2026-09-29T16:01:22.000+00:00",
    "updatedAt": "2026-09-29T16:01:22.000+00:00",
    "nextStatuses": ["preparing", "canceled"],
    "customer": { "id": 1, "name": "Ana Souza", "phone": "(13) 99812-4410", "...": "..." },
    "items": [
      { "id": 13, "productId": 1, "quantity": 2, "unitPriceCents": 2500, "totalCents": 5000, "product": { "id": 1, "name": "X-Burger", "priceCents": 2500, "active": true, "...": "..." } },
      { "id": 14, "productId": 4, "quantity": 1, "unitPriceCents": 700, "totalCents": 700, "product": { "...": "..." } }
    ]
  }
}
```

`unitPriceCents` é o preço no momento da compra e `product.priceCents` é o preço de hoje. Os dois podem ser diferentes, e a regra 6 existe justamente para isso. `nextStatuses` lista os status para onde o pedido pode ir agora, e é com ele que o front decide quais botões mostrar.

Erros possíveis: `422 VALIDATION_ERROR`, `422 PRODUCT_NOT_FOUND`, `422 PRODUCT_INACTIVE`.

### `PATCH /orders/:id/status`

```json
{ "status": "preparing", "from": "pending" }
```

| Campo | Regra |
|---|---|
| `status` | Obrigatório: `pending`, `preparing`, `ready`, `completed` ou `canceled` |
| `from` | Opcional. O status que o cliente está vendo. Se o pedido já não estiver nele, a troca é recusada com `409 ORDER_STATUS_CHANGED` |

Resposta `200` com o pedido completo.

Exemplo de troca recusada:

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Não é possível mudar o pedido de \"preparing\" para \"pending\".",
    "details": { "from": "preparing", "to": "pending", "allowed": ["ready", "canceled"] }
  }
}
```

Erros possíveis: `404 NOT_FOUND`, `409 INVALID_STATUS_TRANSITION`, `409 ORDER_STATUS_CHANGED`, `422 VALIDATION_ERROR`.

---

## O que não existe

Não há `DELETE` para clientes nem produtos. Os dois podem estar em pedidos, o banco impede a exclusão (`RESTRICT`), e produto sai de circulação sendo desativado. Também não dá para editar os itens de um pedido já criado: o PDF não pede, e isso mudaria um valor que o cliente já viu. Autenticação não existe porque o PDF não pede.
