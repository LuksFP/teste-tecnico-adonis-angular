# Decisões

## Stack

A API usa AdonisJS 7 e o front usa Angular 22, as versões atuais, e as duas exigem Node 24. Dava para fazer em AdonisJS 6 e Angular 20 e rodar no Node 20, mas projeto novo não começa em versão velha, ainda mais numa vaga dessa stack. O custo é um passo a mais para quem avalia, e ele está no `.nvmrc` e no README.

O banco é SQLite. O PDF deixa a escolha livre e cita o SQLite entre as opções, e ele tem uma vantagem que pesa num teste: não precisa instalar nada, quem avalia clona e roda. Como todo acesso passa pelo Lucid, ir para PostgreSQL é mudar a conexão em `config/database.ts`, não o código ([banco-de-dados.md](banco-de-dados.md#trocar-de-banco)).

## Modelagem

Dinheiro é inteiro em centavos. A alternativa óbvia seria `decimal(10,2)`, só que no SQLite decimal vira ponto flutuante, e no JavaScript também, e ponto flutuante soma `0.1 + 0.2` como `0.30000000000000004`. Inteiro é exato em qualquer banco e em qualquer linguagem.

O item do pedido guarda uma cópia do preço. Guardar só o `product_id` e ler o preço atual seria exatamente o que a regra 6 proíbe.

Os totais também são gravados, e não calculados na leitura. O pedido é o registro do que foi cobrado, e deve continuar com o mesmo valor mesmo se um dia a forma de calcular mudar. De quebra, a listagem não recalcula nada.

Produto não se apaga, se desativa. Apagar quebraria o histórico dos pedidos em que ele aparece, então o banco impede (`RESTRICT`) e a API nem tem rota de `DELETE`.

Os models declaram as colunas à mão. O AdonisJS 7 consegue gerar isso a partir do banco, mas aí a modelagem fica escondida num arquivo gerado, e uso do ORM é um dos critérios do PDF.

## Arquitetura

Só o pedido tem service. Clientes e produtos são cadastro sem regra, e um service para eles só repetiria o controller. Também não há camada de repository: por cima do Lucid ela só repassaria chamadas, porque os models do Lucid já são a camada de dados.

O fluxo de status é uma tabela em `app/domain/order_status.ts`, não uma sequência de `if` dentro do service. Nessa tabela o fluxo inteiro cabe em 6 linhas, é testado sem banco e alimenta ao mesmo tempo a validação da troca e o `nextStatuses` que a API devolve.

Esse `nextStatuses` é o que decide os botões na tela do pedido. O front poderia conhecer o fluxo por conta própria, mas então existiriam duas cópias da regra, e cedo ou tarde o front mostraria um botão que a API recusa.

A proteção contra dois atendentes no mesmo pedido não está no PDF. Entrou porque é o problema real de um balcão com mais de uma pessoa atendendo, e custou pouco: o front manda o status que está vendo e o `UPDATE` só grava se o pedido ainda estiver nele ([regras-de-negocio.md](regras-de-negocio.md#dois-atendentes-no-mesmo-pedido)).

Todo erro sai no mesmo formato, `{ error: { code, message, details } }`. Com os formatos padrão do framework, cada tipo de erro teria uma cara, e o front precisaria de um tratamento para cada. Assim existe um único lugar que lê erro no front (`ApiError`), e o `code` decide o que fazer sem ninguém comparar texto de mensagem.

422 e 409 não são a mesma coisa. 422 diz que o que foi enviado está errado. 409 diz que o que foi enviado está certo, mas o pedido não está num estado que permita aquilo.

## O que ficou de fora

Autenticação ficou de fora porque o PDF não pede. O kit do AdonisJS vinha com login e sessão, e tirei tudo para não deixar código sem uso no repositório.

Não há como excluir cliente nem produto, pelo motivo do histórico, e não há como editar os itens de um pedido já criado, porque isso mudaria um valor que o cliente já viu.

Os seletores do novo pedido carregam até 100 clientes e 100 produtos. Para uma empresa pequena é suficiente. Com catálogo maior, o próximo passo seria um campo de busca com autocomplete, e depois dele um histórico de mudanças de status numa tabela `order_status_changes`.

## Onde o PDF deixa margem

As setas do fluxo (Pendente → Em preparação → Pronto → Finalizado) foram lidas como sequência obrigatória: pendente não vai direto para pronto, e nada volta.

O PDF diz que cancelado não volta, mas não diz nada sobre cancelar um pedido finalizado. Tratei finalizado como final também, porque cancelar pedido entregue é estorno, outro processo. Se a leitura esperada for a outra, a mudança é uma linha em `order_status.ts`.

As telas de clientes e de detalhe do pedido não estão na lista de telas. A primeira existe porque sem ela não há cliente para o pedido. A segunda é onde "consultar pedido" e "alterar status", que o PDF pede na API, chegam até quem usa o sistema.
