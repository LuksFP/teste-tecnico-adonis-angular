# Frontend

Angular 22 com componentes standalone, signals e sem Zone.js. Formulários com Reactive Forms tipados. TypeScript em modo `strict` com `strictTemplates`, então erros de tipo no HTML dos componentes quebram o build.

## Rotas

| Rota | Tela | Observação |
|---|---|---|
| `/orders` | Lista de pedidos | Rota inicial |
| `/orders/new` | Novo pedido | Protegida pelo `unsavedChangesGuard` |
| `/orders/:id` | Detalhe do pedido | `id` chega como input do componente (`withComponentInputBinding`) |
| `/products` | Produtos | |
| `/customers` | Clientes | Não está no PDF, mas o pedido precisa de cliente cadastrado |

Todas carregam sob demanda (`loadComponent`), cada tela vira um arquivo JS separado no build.

## Telas

### Pedidos (`features/orders/orders-page`)

Tabela com número, cliente, data, valor e status, que é o mínimo que o PDF pede.

- Busca por número ou nome do cliente, esperando 300 ms depois da última tecla antes de chamar a API.
- Filtro por status em botões com a contagem de cada um. A contagem usa o `total` de uma página de 1 item por status, sem endpoint extra.
- Trocar filtro volta para a página 1 (`linkedSignal`), senão daria para cair numa página que não existe mais.
- Clicar na linha abre o pedido.

### Novo pedido (`features/orders/new-order`)

Cobre cada item do PDF: selecionar cliente, adicionar produtos, informar quantidade, remover, ver os valores e finalizar.

- Só aparecem produtos ativos (`GET /products?active=true`).
- Adicionar um produto que já está no pedido soma a quantidade, em vez de criar outra linha.
- A quantidade tem botões − e + e aceita digitação; valores fora de 1 a 999 são ajustados.
- À direita, a "comanda" mostra o total em tempo real. Ele é uma prévia: o valor que vale é o que a API calcula.
- Sem cliente ou sem produto, o botão mostra o que falta e não chama a API.
- Se a API recusar (por exemplo, um produto foi desativado por outra pessoa enquanto o pedido era montado), a mensagem aparece acima do botão e a lista de produtos é recarregada.
- Criado o pedido, abre o detalhe dele com um aviso de sucesso.

O estado do pedido em montagem fica em `order-draft.ts`, uma classe com signals separada do componente, que é testada sozinha.

### Detalhe do pedido (`features/orders/order-detail`)

- Linha do tempo com as 4 etapas, destacando a atual.
- Itens com o preço pago (`unitPriceCents`), não o preço de hoje.
- Botões de status gerados a partir de `nextStatuses` da API. O front não repete a regra do fluxo; se a regra mudar na API, os botões acompanham.
- Cancelar pede confirmação.
- A troca manda o status que está na tela (`from`). Se outra pessoa mudou o pedido antes, a API responde 409, aparece o aviso e o pedido é recarregado.
- Pedido finalizado ou cancelado ganha um carimbo e fica sem botões.

### Produtos e clientes

Lista com busca e paginação, e um formulário que abre no topo para cadastrar ou editar.

- Produto: preço digitado em reais e enviado em centavos (`Math.round(preco * 100)`). Ativar/desativar direto na linha.
- Cliente: telefone validado no front com a mesma regra da API (10 a 13 dígitos).
- Erros de validação da API aparecem embaixo do campo correspondente (`applyServerErrors`), inclusive quando o nome do campo muda entre API e tela (`priceCents` → `price`).

## Peças compartilhadas

| Peça | Arquivo | O que faz |
|---|---|---|
| `ApiError` | `core/api/api-error.ts` | Lê `{ error: { code, message, details } }` da API. Sem conexão vira `NETWORK_ERROR` com mensagem própria |
| `apiErrorInterceptor` | `core/api/api-error.interceptor.ts` | Toda falha HTTP vira `ApiError`. Rede fora e erro 500 mostram aviso na hora; erro de validação e de regra fica para a tela tratar |
| `unsavedChangesGuard` | `core/guards/unsaved-changes.guard.ts` | Pergunta antes de sair do novo pedido com itens não salvos. Depois de salvar, não pergunta |
| `ToastService` | `core/notifications/` | Avisos que somem em 4 s, com `aria-live` para leitor de tela |
| `toQueryParams` | `core/api/query-params.ts` | Monta a query string ignorando filtros vazios |
| `debounced` | `shared/utils/debounced.ts` | Signal que só muda depois que o original para de mudar |
| `MoneyPipe` | `shared/pipes/money.pipe.ts` | `2500` → `R$ 25,00` |
| `Pagination`, `StatusBadge`, `Avatar` | `shared/ui/` | Paginação, badge colorido de status, iniciais do cliente |

## Estados de tela

Toda lista tem os quatro: carregando, erro (com "Tentar de novo"), vazia (com mensagem diferente para "sem registros" e "sem resultados para o filtro") e com dados. Durante uma recarga a tabela fica semitransparente em vez de sumir.

## Visual

O PDF não avalia design, mas o front não usa template pronto. A ideia é uma comanda de balcão:

- Fundo cor de papel com textura, texto em tinta escura, vermelho de carimbo como cor de destaque.
- Fontes: Bricolage Grotesque nos títulos, IBM Plex Sans no texto, IBM Plex Mono em números (preço, número do pedido), como numa comanda impressa.
- A comanda do novo pedido sobe por cima da linha do título e fica levemente inclinada, com borda serrilhada.
- Barra lateral com borda picotada; carimbo de "Cancelado"/"Finalizado" no detalhe.

Tudo em `src/styles.css`, com as cores em variáveis no topo.

## Acessibilidade

- Todo campo tem `label`; campos com erro ganham borda e mensagem em texto, não só cor.
- Status tem texto além da cor.
- Link "Pular para o conteúdo", foco visível em tudo, navegação completa por teclado.
- Link ativo do menu com `aria-current`.
- Animações desligadas quando o sistema pede menos movimento (`prefers-reduced-motion`).
- Layout funciona a partir de 390 px de largura; o menu vira barra no topo.
