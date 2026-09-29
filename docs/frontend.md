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

A tabela mostra número, cliente, data, valor e status, o mínimo que o PDF pede, e clicar na linha abre o pedido. A busca aceita número ou nome do cliente e só chama a API 300 ms depois da última tecla. O filtro de status virou uma fileira de botões com a contagem de cada status, que sai do `total` de uma página de um item só por status, sem endpoint novo. Trocar de filtro volta para a página 1 (`linkedSignal`); sem isso daria para ficar parado na página 3 de um filtro que só tem uma.

### Novo pedido (`features/orders/new-order`)

Cobre cada item que o PDF lista: selecionar cliente, adicionar produtos, informar quantidade, remover, ver os valores e finalizar.

Só aparecem produtos ativos (`GET /products?active=true`). Adicionar um produto que já está no pedido soma a quantidade, que é o que quem está no balcão espera, em vez de criar uma segunda linha. A quantidade tem − e + e aceita digitação, e qualquer valor fora de 1 a 999 é ajustado. À direita fica a comanda com o total em tempo real, mas esse total é prévia: o valor que vale é o que a API calcula.

Sem cliente ou sem produto, o botão aponta o que falta e não chama a API. Se a API recusar, por exemplo porque alguém desativou um produto enquanto o pedido era montado, a mensagem aparece acima do botão e a lista de produtos recarrega. Com o pedido criado, a tela abre o detalhe dele.

O estado do pedido em montagem mora em `order-draft.ts`, uma classe com signals fora do componente, e por isso tem teste próprio.

### Detalhe do pedido (`features/orders/order-detail`)

Uma linha do tempo mostra as 4 etapas com a atual destacada, e os itens aparecem com o preço pago (`unitPriceCents`), não o de hoje.

Os botões de status vêm do `nextStatuses` da API. O front não repete a regra do fluxo, então se ela mudar na API os botões mudam junto. Cancelar pede confirmação. Cada troca manda o status que está na tela (`from`); se outra pessoa mexeu no pedido antes, a API responde 409, aparece o aviso e o pedido recarrega. Pedido finalizado ou cancelado fica sem botões e ganha um carimbo.

### Produtos e clientes

As duas telas são lista com busca e paginação e um formulário que abre no topo para cadastrar ou editar.

No produto, o preço é digitado em reais e vai em centavos (`Math.round(preco * 100)`), e ativar ou desativar é um clique na própria linha. No cliente, o telefone é validado com a mesma regra da API, de 10 a 13 dígitos. Nos dois, erro de validação da API aparece embaixo do campo certo (`applyServerErrors`), mesmo quando o nome muda entre API e tela, como `priceCents` e `price`.

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

Toda lista tem quatro estados. Enquanto carrega, aparece um esqueleto com o formato da tabela, para a página não pular quando os dados chegam. Com erro, a mensagem vem com "Tentar de novo". Vazia, a tela separa "não tem nada cadastrado", que oferece cadastrar o primeiro, de "nada bate com o filtro", que oferece limpar os filtros. Numa recarga a tabela fica semitransparente em vez de sumir.

## Visual

O PDF não avalia design, mas também não havia motivo para usar template pronto. O tema é comanda de balcão: fundo cor de papel com textura, texto em tinta escura e vermelho de carimbo como cor de destaque. Os títulos usam Bricolage Grotesque, o texto usa IBM Plex Sans, e todo número (preço, número do pedido) usa IBM Plex Mono, como numa comanda impressa. A comanda do novo pedido sobe por cima da linha do título, levemente torta e com a borda serrilhada, e a barra lateral tem borda picotada.

Os movimentos seguem o mesmo tema. As linhas das tabelas aparecem da esquerda para a direita, uma depois da outra, como o cabeçote de uma impressora de comanda, e só quando a linha é nova. O aviso de sucesso cai como um tíquete destacado, e o carimbo de pedido finalizado bate com um pequeno repique. Cada elemento tem seu hover: a linha clicável ganha a marca vermelha de item conferido, link sublinhado engrossa o traço, botão de contorno escurece a borda.

Os cantos também variam por tipo: folha de papel (painel, tabela) é reta, campo e botão são quase retos, o aviso tem canto de tíquete e os filtros de status são pílulas.

Está tudo em `src/styles.css`, com cores e cantos em variáveis no topo.

## Acessibilidade

Todo campo tem `label`, e campo com erro ganha mensagem em texto além da borda vermelha. Status também tem texto, não só cor. Há link para pular direto ao conteúdo, foco visível em todo elemento clicável, navegação completa por teclado e `aria-current` no item ativo do menu. Quem pede menos movimento no sistema (`prefers-reduced-motion`) não vê animação. A partir de 390 px de largura o layout funciona, com o menu virando uma barra no topo.
