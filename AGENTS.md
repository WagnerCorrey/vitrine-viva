# Vitrine Viva

Projeto Node.js 24 com APIs nativas e SQLite. Execute `npm test` após alterações de comportamento.

## Regras do produto

- Telegram e painel são interfaces da lojista. Cliente usa a vitrine.
- Pré-compra não reserva estoque e não processa pagamento.
- Extração de IA cria rascunho; confirmação humana precede qualquer cadastro.
- Sugestões partem do catálogo, não de uma invenção do modelo.
- Conclusão revalida e desconta o estoque de forma atômica e idempotente.
- Conferência de item esgotado exige decisão explícita da lojista.
- Não anunciar integração ativa com a Tray enquanto não existir adaptador testado.
- Não chamar o interpretador local de IA.

## Desenvolvimento

- Nunca versionar `.env`, `data/`, tokens ou áudios de usuários.
- Preserve a API pública e adicione testes para mudanças nos estados de pedido.
- Mantenha mensagens em português, acessibilidade dos formulários e layout responsivo.
- Não envie dados da loja a serviços externos fora de uma operação explicitamente configurada.
- Use os testes de HTTP para verificar autenticação e isolamento de pedidos.
- Testes de serviços externos devem usar mocks sem credenciais reais no CI.
