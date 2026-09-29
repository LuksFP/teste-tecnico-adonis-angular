# Decisões

Cada decisão com o que foi escolhido, o que ficou de fora e por quê.

## Stack

**AdonisJS 7 e Angular 22 (as versões atuais), rodando em Node 24.**
Alternativa: AdonisJS 6 e Angular 20 no Node 20. Foi escolhida a versão atual porque a vaga é dessa stack e ninguém começa projeto novo em versão antiga. O custo é exigir Node 24, que está no `.nvmrc` e no README.

**SQLite.**
O PDF deixa o banco livre e cita SQLite como opção. Ele não precisa de instalação, então quem avalia clona e roda. O acesso é todo pelo Lucid, então trocar para PostgreSQL muda a configuração, não o código ([banco-de-dados.md](banco-de-dados.md#trocar-de-banco)).

## Modelagem

**Dinheiro em centavos, inteiro.**
Alternativa: `decimal(10,2)`. No SQLite, decimal vira ponto flutuante, e no JavaScript também. Inteiro é exato em qualquer banco e em qualquer linguagem.

**Preço copiado para o item do pedido.**
É a regra 6. A alternativa (guardar só o `product_id` e ler o preço atual) é exatamente o que o PDF diz para não fazer.

**Totais gravados, não calculados na leitura.**
O pedido é um registro do que foi cobrado. Gravar evita recalcular a cada listagem e deixa o valor fixo mesmo se a regra de cálculo mudar um dia.

**Produto não se apaga, se desativa.**
Apagar quebraria o histórico dos pedidos. O banco reforça com `RESTRICT`, e a API não tem rota de `DELETE`.

**Colunas declaradas nos models.**
O AdonisJS 7 pode gerar os models a partir do banco. Declarar à mão deixa a modelagem visível no model e mostra o uso do ORM, que é um critério do PDF.

## Arquitetura

**Service só para pedidos, sem repository.**
Clientes e produtos são cadastro sem regra; um service para eles repetiria o controller. Repository por cima do Lucid seria uma camada que só repassa chamadas, já que os models do Lucid são a camada de dados.

**Fluxo de status numa tabela (`app/domain/order_status.ts`).**
Alternativa: `if`s espalhados no service. A tabela deixa o fluxo inteiro legível em 6 linhas, é testada sem banco e é a mesma fonte para a validação e para o `nextStatuses` que o front usa.

**A API diz os próximos status (`nextStatuses`).**
Alternativa: o front conhecer o fluxo. Com a regra num lugar só, não existe o caso de o front mostrar um botão que a API vai recusar.

**Proteção contra alteração simultânea.**
Fora do PDF, mas é o problema real de um sistema de balcão com mais de um atendente. Duas partes: o `from` enviado pelo front e o `UPDATE` condicional. Detalhes em [regras-de-negocio.md](regras-de-negocio.md#dois-atendentes-no-mesmo-pedido).

**Um formato de erro para tudo.**
Alternativa: deixar cada erro no formato padrão do framework. Com um formato só, o front tem um único lugar que lê erro (`ApiError`), e o `code` permite decidir o que fazer sem comparar texto de mensagem.

**Status 409 para conflito de estado, 422 para dado inválido.**
422 significa "o que você mandou está errado". 409 significa "o que você mandou está certo, mas o pedido não está num estado que permita isso".

## O que ficou de fora

| Item | Motivo |
|---|---|
| Autenticação | O PDF não pede. O kit do AdonisJS vinha com login e sessão, e foi removido para não deixar código sem uso |
| Excluir cliente/produto | Quebraria o histórico. Produto é desativado |
| Editar itens de pedido já criado | O PDF não pede, e mudaria o valor que o cliente já viu |
| Busca com autocomplete no novo pedido | Os seletores carregam até 100 clientes e 100 produtos, o que cobre uma empresa pequena. Com catálogo maior, seria o próximo passo |
| Histórico de mudanças de status | Seria uma tabela `order_status_changes`. Útil, mas além do pedido |

## Interpretações do PDF

1. **Status não pula etapa nem volta.** As setas do PDF descrevem uma sequência.
2. **Finalizado não pode ser cancelado.** O PDF só diz que cancelado não volta. Cancelar pedido entregue seria estorno. Mudar isso é uma linha em `order_status.ts`.
3. **Tela de clientes existe.** Não está na lista de telas do PDF, mas sem ela não há como cadastrar o cliente que o pedido exige.
4. **Tela de detalhe do pedido existe.** É onde "consultar pedido" e "alterar status" da API aparecem para o usuário.
