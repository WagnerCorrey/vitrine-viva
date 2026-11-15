# Demonstração da Vitrine Viva

Use dados fictícios. A versão entregue permite demonstrar a jornada sem qualquer cobrança.

## Preparar

Execute `npm start` e deixe abertas duas abas. Na primeira, acesse a vitrine em <http://localhost:3000>. Na segunda, acesse a área da lojista em <http://localhost:3000/#admin>. Em uma instalação sem configurações próprias, entre com a senha demonstrativa `jupara-demo`.

A sequência pode ser gravada em blocos, evitando espera no vídeo.

## Cadastro da loja

Em Minha loja, clique em Configurar passo a passo. Preencha nome, descrição, retirada e prazo. Confirme o resumo. Mostre que a vitrine usa as informações salvas.

Essa configuração ocorre no painel web nesta versão. Não a apresente como implantação automática na Tray ou como conversa de onboarding no Telegram.

## Cadastro de produto

Abra **Assistente** e clique em **Usar exemplo de descrição**. O exemplo cadastra cadernos verdes. Prepare a ficha, revise os campos, confirme e confira o novo produto no estoque.

Sem chave de IA, informe que é um interpretador local do formato demonstrativo. Para gravar a extração real de áudio, configure Gemini, grave a mensagem, prepare a ficha e confira os dados. A IA pode errar ou retornar campos incompletos.

## Entrada e saída

Abra Produtos e estoque. Selecione Entrada / saída em um produto. Registre uma saída no balcão com o motivo. Confira o saldo e o histórico.

## Pré-compra e retorno

1. Na vitrine, selecione caderno azul, duas canetas e lápis de cor comum.
2. Envie a solicitação e mostre o estado Aguardando conferência.
3. Na aba da lojista, abra Pré-compras e confira os itens.
4. Marque o lápis comum como esgotado, mantendo caderno e canetas disponíveis.
5. Confirme o resumo e volte à página da cliente. A confirmação zera o saldo do item marcado como esgotado. A tela da cliente consulta o estado a cada quatro segundos enquanto aguarda.
6. Mostre a alternativa Premium da mesma categoria e o botão para seguir sem o item.
7. Aceite uma opção, confira o total e conclua o pedido demonstrativo.
8. Volte ao estoque e mostre as saídas registradas.

O sistema não reserva os produtos na pré-compra. Se o estoque mudar entre conferência e conclusão, a cliente deve pedir nova conferência. Não existe cobrança nesta versão.

## Telegram real

Com token e chat privado configurados, crie uma nova pré-compra. Mostre a notificação no aplicativo Telegram. Toque em Conferir este pedido, envie a resposta e confirme o resumo.

Se Gemini estiver configurado, use áudio. Sem ele, confira manualmente no painel. O bot não sugere a substituição no áudio: a vitrine apresenta as alternativas após a conferência.

## Fechamento

Mostre a aba Integrações. Diferencie o núcleo local funcionando dos conectores que exigem configuração. A Tray permanece como próxima integração técnica, e não como uma venda já realizada na plataforma.
