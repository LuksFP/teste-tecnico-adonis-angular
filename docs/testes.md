# Testes

```bash
cd backend && npm test                      # 46 testes (Japa)
cd frontend && npx ng test --watch=false    # 34 testes (Vitest)
```

O GitHub Actions (`.github/workflows/ci.yml`) roda tudo a cada push: lint, typecheck e testes da API; build e testes do front.

## Como os testes da API funcionam

Os testes usam um banco separado, `tmp/db.test.sqlite3`, definido em `backend/.env.test`, e as migrations rodam uma vez no começo. Cada teste roda dentro de uma transação desfeita no final (`withGlobalTransaction`), então nenhum enxerga os dados de outro e a ordem não importa.

Os testes funcionais sobem a API de verdade e fazem requisições HTTP. Nos casos que devem dar certo, a chamada usa o nome da rota (`client.visit('orders.store')`), que o AdonisJS tipa a partir dos validators e transformers: se o formato da resposta mudar, o teste para de compilar. Nos casos de entrada inválida a chamada usa a URL crua, porque o tipo não deixaria montar a requisição errada. `tests/helpers.ts` tem `createCustomer` e `createProduct`, para cada teste só escrever os campos que importam para ele.

## O que cada arquivo cobre

### `backend/tests/unit/order_status.spec.ts` (4)

A tabela de transições, sem banco: segue o fluxo, não pula nem volta, cancela o que não terminou, cancelado não sai.

### `backend/tests/functional/orders.spec.ts` (21)

Na criação: total calculado no backend mesmo com total falso na requisição; preço congelado depois de mudar o produto; cliente obrigatório e existente; pelo menos um produto; quantidade de 1 a 999 e inteira; produto repetido recusado; produto inativo recusado sem gravar nada; produto reativado volta a ser aceito; desativar produto não mexe em pedido antigo; produto inexistente.

No status: fluxo completo; não pula etapa; cancelado não sai; finalizado não cancela; `nextStatuses` correto; status desconhecido; tela desatualizada (`from`) recusada; requisição atrasada não sobrescreve a mais nova.

Na listagem: mais novo primeiro; paginação; filtro por status e por cliente; busca por nome e por número.

### `backend/tests/functional/customers.spec.ts` (7)

Cadastro com limpeza de espaços, formatos de telefone aceitos e recusados, campos obrigatórios, edição parcial, busca paginada, 404.

### `backend/tests/functional/products.spec.ts` (6)

Ativo por padrão, preço zero ou com fração recusado, ativar/desativar, busca, edição só do preço, filtro por ativo.

### `backend/tests/functional/api_errors.spec.ts` (8)

JSON malformado dá 400; rota inexistente e id não numérico dão 404; 404 para pedido, produto e troca de status inexistentes; limite de 100 por página e página 0; nenhum stack trace na resposta; `/health`; não existe `DELETE`.

## Como os testes do front funcionam

Rodam no Vitest, pelo builder do Angular (`ng test`). Os testes de tela renderizam o componente de verdade e mexem nele pelo HTML: escolhem opção no `select`, digitam, clicam no botão pelo texto. Não tocam em propriedade interna. A API é simulada com `HttpTestingController`, então o teste confere o que o componente mandou (método, URL, corpo) e responde o que quiser, inclusive erro. `src/testing/fixtures.ts` guarda dados no formato das respostas da API e os helpers `choose` e `buttonByText`.

## O que cada arquivo do front cobre

| Arquivo | Testes | Cobre |
|---|---|---|
| `features/orders/new-order.spec.ts` | 4 | Não envia incompleto; soma, remove e mostra total; manda só ids e quantidades e abre o pedido criado; mostra erro de produto desativado e recarrega a lista |
| `features/orders/order-detail.spec.ts` | 6 | Preços pagos e total; só os botões permitidos; avança status mandando `from`; confirmação antes de cancelar; cancelado sem botões e com carimbo; recarrega após 409 |
| `features/products/product-form.spec.ts` | 4 | Reais para centavos; formulário vazio não chama a API; erro da API no campo certo; edição com PATCH |
| `features/orders/order-draft.spec.ts` | 6 | Total, soma de repetidos, limites de quantidade, remoção, payload da API |
| `core/api/api-error.spec.ts` | 4 | Leitura do erro da API, erro de regra, sem conexão, resposta inesperada |
| `core/api/api-error.interceptor.spec.ts` | 2 | Validação fica com a tela; erro 500 gera aviso |
| `core/guards/unsaved-changes.guard.spec.ts` | 2 | Sai direto sem pendência; pergunta com pendência |
| `shared/ui/pagination.spec.ts` | 3 | Faixa exibida, bordas desabilitadas, sem botões numa página só |
| `shared/pipes/money.pipe.spec.ts` | 2 | Formatação em reais, valor ausente |
| `core/api/query-params.spec.ts` | 1 | Filtros vazios ficam fora da URL |

## Sabotagem

Teste que passa com o código quebrado não vale nada. Nas proteções mais importantes, o código foi quebrado de propósito e o teste teve que falhar:

| Sabotagem | Resultado |
|---|---|
| Tirar a recusa de produto inativo | `refuses inactive products and saves nothing` falhou |
| Tirar o `AND status = ?` do UPDATE | `a stale status change does not overwrite a newer one` falhou |
| Ignorar o `from` enviado pelo front | `refuses a change made from an outdated screen` falhou |
| Converter preço multiplicando por 10 em vez de 100 | 2 testes do formulário de produto falharam |
| Tirar o filtro de "só ativos" do novo pedido | os 4 testes do novo pedido falharam |

Depois de cada sabotagem o código foi restaurado e a suíte voltou a passar.
