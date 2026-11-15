# Contrato da API do protótipo

Base `/api`. Entradas JSON. Preços são inteiros em centavos. IDs são UUIDs. A API é da Vitrine Viva, não da Tray.

## Público

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/catalog` | Produtos e configurações públicas |
| POST | `/orders` | Criar pré-compra |
| GET | `/orders/:id` | Acompanhar com `X-Order-Token` |
| POST | `/orders/:id/complete` | Concluir demonstração com escolhas |
| POST | `/orders/:id/cancel` | Cancelar antes da conclusão |
| POST | `/orders/:id/reopen` | Pedir nova conferência após revisão |

Exemplo de criação:

```json
{
  "customer": "Ana",
  "requestId": "uuid-unico-por-tentativa",
  "items": [{"productId": "uuid-do-produto", "qty": 1}]
}
```

A resposta inclui `id`, `token` e `status`. Guarde o token somente para o cliente que iniciou a solicitação. O projeto usa um link com fragmento para acompanhamento. Não compartilhe esse link como se fosse público.

Conclusão:

```json
{"choices":{"uuid-do-item-em-falta":"uuid-da-alternativa"}}
```

Use `null` para remover um item em falta. Itens confirmados são mantidos. Repetir a conclusão de um pedido concluído não gera uma nova baixa.

## Autenticação

`POST /login` recebe `{ "password": "senha-configurada-no-servidor" }` e cria cookie HttpOnly, SameSite=Strict, válido por oito horas. `POST /logout` encerra a sessão. `GET /session` informa se existe sessão administrativa válida.

As sessões ficam em memória e são encerradas ao reiniciar o servidor. Não existe recuperação de senha ou conta multiusuário no protótipo.

## Administração

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/admin/state` | Produtos, pedidos, rascunhos, eventos e configuração |
| POST | `/admin/settings` | Nome, descrição, retirada e prazo |
| POST | `/admin/products` | Cadastro manual |
| POST | `/admin/products/:id` | Editar dados, mantendo saldo |
| POST | `/admin/movement` | Entrada ou saída com motivo |
| POST | `/admin/extract` | Extrair rascunho de cadastro ou conferência |
| POST | `/admin/drafts/:id/confirm` | Confirmar cadastro revisado |
| POST | `/admin/drafts/:id/discard` | Descartar rascunho |
| POST | `/admin/orders/:id/review` | Confirmar disponibilidade de todos os itens |
| GET | `/admin/export` | Exportar catálogo JSON, sem fotos |

Movimentação:

```json
{"productId":"uuid","delta":-1,"reason":"Venda no balcão"}
```

Conferência:

```json
{"lines":[{"productId":"uuid","available":true}]}
```

`false` significa esgotado e zera o saldo conhecido após a confirmação. Não representa estoque parcial. Se houver somente parte da quantidade solicitada, registre a quantidade real e ajuste a seleção da cliente; não marque esgotado por conveniência.

Extração:

```json
{
  "kind":"product",
  "text":"Tenho cinco cadernos verdes por trinta reais cada.",
  "attachment":{"mime":"image/jpeg","data":"BASE64"}
}
```

`attachment` é opcional. Para `kind: "review"`, envie também `orderId`; a resposta preenche opções para revisão e não muda o estoque. O modelo recebe apenas os itens daquele pedido. Para cadastro, a resposta fica registrada como rascunho.

## Persistência e concorrência

O banco usa uma tabela de registros JSON identificados por tipo e ID. Essa escolha simplifica o protótipo, mas não é um modelo recomendado para catálogos grandes. Operações de estoque usam transações síncronas; a conclusão agrega quantidades por produto antes de verificar o saldo, inclusive quando uma alternativa coincide com outro item da seleção.

Estados do pedido: `pending`, `review`, `completed`, `cancelled`. Eventos registram alterações de estoque, configuração, cadastro e andamento. Não há apagamento de histórico pelo painel.

## Limites relevantes

A aplicação é de uma loja e um administrador. Não oferece controle de permissões por funcionário, reserva com vencimento, frete, pagamento, emissão fiscal, reconciliação com ERP ou sincronização com a Tray. Os limites de requisição ficam em memória e não são um sistema distribuído de proteção. O catálogo contém fotos em data URL para simplificar a execução local; em escala, use armazenamento de arquivos dedicado.
