# Comanda: gestão de pedidos

[![CI](https://github.com/LuksFP/teste-tecnico-adonis-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/LuksFP/teste-tecnico-adonis-angular/actions/workflows/ci.yml)

Teste técnico para vaga de AdonisJS + Angular. Uma empresa pequena cadastra clientes e produtos, monta pedidos no balcão e acompanha cada um de Pendente até Finalizado.

| Parte | Stack |
|---|---|
| `backend/` | AdonisJS 7, Lucid ORM, VineJS, SQLite (better-sqlite3), Japa |
| `frontend/` | Angular 22 (standalone, signals, zoneless), Reactive Forms, Vitest |

## Como rodar

### Com Docker

```bash
docker compose up --build
```

Abre em http://localhost:8080. Sobem a API e o front, as migrations rodam e o seed entra sozinho. Não precisa ter Node instalado. O banco fica num volume, então os pedidos continuam lá depois de um restart; `docker compose down -v` apaga tudo e volta ao seed.

No container o front é o build de produção servido por nginx, que repassa `/api` para a API. É o mesmo papel do `proxy.conf.json` em desenvolvimento.

### Sem Docker

Requer **Node 24** (`nvm use` na raiz lê o `.nvmrc`). O AdonisJS 7 e o Angular 22 não rodam no Node 20.

```bash
# API em http://localhost:3333
cd backend
npm install
cp .env.example .env
node ace generate:key
node ace migration:run
node ace db:seed        # opcional: 4 clientes, 6 produtos (1 inativo) e 5 pedidos
npm run dev

# Front em http://localhost:4200, em outro terminal
cd frontend
npm install
npm start
```

O front chama `/api/v1` e o `proxy.conf.json` do Angular repassa para a porta 3333, então não precisa configurar CORS em desenvolvimento.

### Testes

```bash
cd backend && npm test          # 46 testes: fluxo de status, regras do pedido, validações e respostas de erro
cd frontend && npx ng test --watch=false   # 34 testes: telas de novo pedido, detalhe e produto, interceptor, guard, paginação
```

O GitHub Actions roda lint, typecheck e os testes da API, e o build e os testes do front, a cada push (`.github/workflows/ci.yml`).

Os testes da API usam um SQLite separado (`tmp/db.test.sqlite3`, definido no `.env.test`) e cada teste roda dentro de uma transação desfeita no final.

## API

Base: `/api/v1`. Respostas de sucesso vêm em `{ data }` (listas paginadas também trazem `metadata`); erros vêm sempre em `{ error: { code, message, details? } }`.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/customers?page&perPage&search` | Lista clientes (busca por nome ou telefone) |
| POST | `/customers` | Cadastra cliente |
| GET / PATCH | `/customers/:id` | Consulta / edita cliente |
| GET | `/products?page&perPage&search&active` | Lista produtos (filtro por ativo/inativo) |
| POST | `/products` | Cadastra produto |
| GET / PATCH | `/products/:id` | Consulta / edita produto (ativar e desativar = `PATCH { active }`) |
| GET | `/orders?page&perPage&search&status&customerId` | Lista pedidos (busca por nº ou nome do cliente) |
| POST | `/orders` | Cria pedido: `{ customerId, items: [{ productId, quantity }] }` |
| GET | `/orders/:id` | Consulta pedido com cliente e itens |
| PATCH | `/orders/:id/status` | Muda o status: `{ status, from? }` (`from` = status visto na tela) |

`perPage` vai até 100 (padrão 10). Fora do `/api/v1`, `GET /health` responde o status da API e do banco.

## Onde está cada regra do PDF

| Regra | Implementação |
|---|---|
| 1. Pedido tem cliente | `customerId` obrigatório e com `exists` no banco (`app/validators/order.ts`) |
| 2. Pelo menos um produto | `items` com `minLength(1)` |
| 3. Quantidade mínima 1 | `quantity` inteiro entre 1 e 999 |
| 4. Produto inativo não entra em pedido novo | `OrderService.create` → `422 PRODUCT_INACTIVE` |
| 5. Valor calculado no backend | O body só aceita id e quantidade; preço e totais vêm do banco. Um `totalCents` enviado pelo cliente é ignorado (há teste para isso) |
| 6. Preço congelado no item | `order_items.unit_price_cents` é copiado do produto na criação. Mudar o preço do produto depois não altera o pedido (há teste para isso) |
| 7 e 8. Fluxo de status | `app/domain/order_status.ts`: mapa de transições permitidas. Fora dele → `409 INVALID_STATUS_TRANSITION` |

Além das 8 regras, a API protege o caso de dois atendentes mexendo no mesmo pedido. O front manda o status que está na tela (`from`), e o `UPDATE` só grava se o pedido ainda estiver no status lido. Se alguém mudou o pedido antes, a API responde `409 ORDER_STATUS_CHANGED` e não age em cima de informação velha. O cenário completo está em [docs/regras-de-negocio.md](docs/regras-de-negocio.md#dois-atendentes-no-mesmo-pedido).

## Decisões que valem saber antes de ler o código

Dinheiro é inteiro em centavos (`2500` é R$ 25,00), porque ponto flutuante erra conta de dinheiro. O fluxo de status não pula etapa e trata Finalizado como final, igual a Cancelado: o PDF só fala do cancelado, mas pedido entregue não se cancela. Só o pedido tem service, porque só ele tem regra; clientes e produtos são cadastro, e os controllers usam os models do Lucid direto. Não existe camada de repository nem autenticação, e a tela de clientes existe mesmo fora da lista do PDF, porque sem ela não há cliente para o pedido. O raciocínio de cada escolha, com a alternativa descartada, está em [docs/decisoes.md](docs/decisoes.md).

Os diferenciais do PDF estão todos feitos: testes automatizados rodando no CI, paginação, filtros, busca de pedidos, tratamento global de erros, interceptor e guard no Angular, services, transaction, seeds e validações além das pedidas.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/arquitetura.md](docs/arquitetura.md) | Camadas, pastas e o caminho de uma requisição |
| [docs/api.md](docs/api.md) | Todos os endpoints, campos, exemplos e códigos de erro |
| [docs/banco-de-dados.md](docs/banco-de-dados.md) | Tabelas, relações, índices e por que foram modeladas assim |
| [docs/regras-de-negocio.md](docs/regras-de-negocio.md) | As 8 regras do PDF, fluxo de status e alteração simultânea |
| [docs/frontend.md](docs/frontend.md) | Rotas, telas, interceptor, guard, estados e visual |
| [docs/testes.md](docs/testes.md) | O que cada teste cobre e como foi conferido que eles pegam bug |
| [docs/decisoes.md](docs/decisoes.md) | Escolhas, alternativas descartadas e interpretações do PDF |
