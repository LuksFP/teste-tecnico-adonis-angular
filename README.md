# Comanda — gestão de pedidos

[![CI](https://github.com/LuksFP/teste-tecnico-adonis-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/LuksFP/teste-tecnico-adonis-angular/actions/workflows/ci.yml)

Teste técnico AdonisJS + Angular: cadastro de clientes e produtos, criação e acompanhamento de pedidos.

| Parte | Stack |
|---|---|
| `backend/` | AdonisJS 7, Lucid ORM, VineJS, SQLite (better-sqlite3), Japa |
| `frontend/` | Angular 22 (standalone, signals, zoneless), Reactive Forms, Vitest |

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

## Como rodar

Requer **Node 24** (`nvm use` na raiz lê o `.nvmrc`). O AdonisJS 7 e o Angular 22 não rodam no Node 20.

```bash
# API — http://localhost:3333
cd backend
npm install
cp .env.example .env
node ace generate:key
node ace migration:run
node ace db:seed        # opcional: 4 clientes, 6 produtos (1 inativo) e 5 pedidos
npm run dev

# Front — http://localhost:4200 (em outro terminal)
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
| GET | `/health` | Status da API e do banco |

`perPage` vai até 100 (padrão 10).

## Regras de negócio — onde estão

| Regra | Implementação |
|---|---|
| 1. Pedido tem cliente | `customerId` obrigatório e com `exists` no banco (`app/validators/order.ts`) |
| 2. Pelo menos um produto | `items` com `minLength(1)` |
| 3. Quantidade mínima 1 | `quantity` inteiro entre 1 e 999 |
| 4. Produto inativo não entra em pedido novo | `OrderService.create` → `422 PRODUCT_INACTIVE` |
| 5. Valor calculado no backend | O body só aceita id e quantidade; preço e totais vêm do banco. Um `totalCents` enviado pelo cliente é ignorado (há teste para isso) |
| 6. Preço congelado no item | `order_items.unit_price_cents` é copiado do produto na criação. Mudar o preço do produto depois não altera o pedido (há teste para isso) |
| 7 e 8. Fluxo de status | `app/domain/order_status.ts`: mapa de transições permitidas. Fora dele → `409 INVALID_STATUS_TRANSITION` |

**Dois atendentes no mesmo pedido:** o front manda o status que está na tela (`from`), e o `UPDATE` só grava se o pedido ainda estiver no status lido. Nos dois casos, se alguém mudou o pedido antes, a API responde `409 ORDER_STATUS_CHANGED` em vez de agir em cima de informação velha. Explicação completa em [docs/regras-de-negocio.md](docs/regras-de-negocio.md#dois-atendentes-no-mesmo-pedido).

## Decisões

- **Dinheiro em centavos (inteiro).** `priceCents`, `unitPriceCents`, `totalCents`. Evita erro de arredondamento de float; o front formata para R$.
- **Fluxo de status.** `pending → preparing → ready → completed`, sem pular e sem voltar etapa. Qualquer pedido ainda não finalizado pode ser cancelado. `completed` e `canceled` são finais: o enunciado diz que cancelado não volta; tratei finalizado da mesma forma, já que um pedido entregue não faz sentido ser cancelado. A resposta do pedido traz `nextStatuses`, e o front só mostra os botões que a API aceita.
- **Criação do pedido numa transação** (`db.transaction`): pedido e itens são gravados juntos ou nada é gravado.
- **Produto repetido no mesmo pedido** é recusado pela API (`distinct`). No front, adicionar de novo um produto que já está no pedido soma a quantidade.
- **Camadas:** rotas → controllers (HTTP) → `OrderService` (regras do pedido) → models Lucid. Clientes e produtos são CRUD sem regra própria, então os controllers usam os models direto, com query scopes (`search`) nos models. Não criei uma camada de repositório por cima do Lucid: os models já fazem esse papel.
- **Models com colunas declaradas** em vez do schema gerado pelo AdonisJS 7, para a modelagem ficar legível no próprio model.
- **SQLite com chave estrangeira ligada** (`PRAGMA foreign_keys = ON` no pool): o banco também garante as relações. Trocar para PostgreSQL/MySQL é só mudar a conexão em `config/database.ts`.
- **Sem autenticação**, porque o enunciado não pede. O kit da API vinha com auth/sessão e eu removi.
- **Mensagens de validação em português** (`start/validator.ts`).

## Front

- `core/`: models, services HTTP, `apiErrorInterceptor` (transforma toda falha em `ApiError`; falha de rede e erro 500 viram aviso na tela; erros de validação ficam com o formulário), toasts e o guard `unsavedChangesGuard`, que pergunta antes de sair do "Novo pedido" com itens não salvos.
- `features/`: telas de pedidos (lista, detalhe com troca de status, novo pedido), produtos e clientes. As listas usam `rxResource` com paginação, busca com debounce e filtros.
- `features/orders/order-draft.ts`: estado do pedido em montagem (adicionar, mudar quantidade, remover, total de prévia), testado isoladamente.
- A tela de clientes não está na lista de telas do enunciado, mas sem ela não dá para cadastrar o cliente que o pedido exige.
- Os seletores do "Novo pedido" carregam até 100 clientes e 100 produtos ativos, o que cobre uma empresa pequena. Com catálogo maior, o próximo passo seria um campo de busca com autocomplete.

## Diferenciais cobertos

Testes automatizados (API e front) rodando no CI, paginação, filtros, busca de pedidos, tratamento global de erros (`app/exceptions/handler.ts`), interceptor Angular, guard, services, transaction, seeds e validações extras (telefone, preço inteiro positivo, produto repetido, limites de paginação).
