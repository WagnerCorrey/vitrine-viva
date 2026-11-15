# Configuração da Vitrine Viva

Copie `.env.example` para `.env`.

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS:

```sh
cp .env.example .env
```

Edite `.env` no seu computador. Não cole chaves em mensagens, commits ou código do navegador. Reinicie `npm start` após alterar as configurações.

## Gemini

Preencha `GEMINI_API_KEY` e `GEMINI_MODEL`. O modelo padrão é configurável; use um modelo disponível na sua conta e compatível com os formatos enviados.

O painel permite anexar arquivos e gravar áudio quando a chave está configurada. O navegador pede permissão para usar o microfone e requer localhost ou HTTPS. O áudio é limitado a um minuto. Arquivos de extração têm limite de 5 MB. Fotos incorporadas ao cadastro têm limite de aproximadamente 2 MB.

Áudio, texto e anexos são enviados à API configurada somente ao solicitar a extração. O resultado fica em rascunho. Uma nota fiscal pode informar custo, mas esse valor não é convertido automaticamente em preço de venda. Campos desconhecidos precisam ser preenchidos na revisão.

## Telegram

1. Crie seu bot no BotFather e obtenha o token.
2. Informe `TELEGRAM_BOT_TOKEN` e o identificador do seu chat privado em `TELEGRAM_CHAT_ID`.
3. Configure `PUBLIC_URL` com o endereço da aplicação que você consegue abrir.
4. Inicie uma conversa privada com seu bot e envie `/start`.
5. Reinicie o servidor com as variáveis preenchidas.

O conector usa **long polling**. Não exige webhook público para receber mensagens, mas o processo Node precisa permanecer rodando e ter acesso à internet. Não execute outra instância de polling do mesmo bot. Um webhook previamente configurado em outro projeto deve ser removido antes de usar este modo.

Somente o chat privado configurado pode cadastrar ou confirmar. A aplicação não escolhe automaticamente o primeiro usuário que escrever para o bot.

- `/start` apresenta o fluxo e volta ao cadastro.
- `/cadastro` sai da conferência e inicia um novo cadastro.
- `/painel` mostra o endereço do painel web.
- Descrição, foto com legenda, áudio ou PDF geram rascunho.
- **Confirmar** salva o rascunho válido; **Descartar** preserva o estado anterior.
- Uma pré-compra gera uma notificação. Toque em **Conferir este pedido**, responda e revise o resumo antes de confirmar.
- Para corrigir um rascunho incompleto, use o painel da aplicação.

Envie cada cadastro com suas informações em uma única mensagem ou arquivo com legenda. A versão atual não agrupa automaticamente um áudio e uma foto enviados em mensagens separadas. Sem Gemini, descrições no formato local funcionam, mas não há transcrição de áudio nem leitura de PDF.

## Tray

A aba **Integrações** informa que a Tray não está conectada. O botão de exportação gera um JSON do catálogo local. Esse JSON não é apresentado como payload oficial da Tray e não é enviado à empresa.

O próximo trabalho é desenvolver e testar um adaptador com as credenciais autorizadas da loja, mapear produtos/variações e definir a passagem ao checkout. Não inclua tokens da Tray no frontend.

## Docker

Defina em `.env` uma `ADMIN_PASSWORD` diferente de `jupara-demo` e execute:

```sh
docker compose up --build
```

A configuração publica a porta apenas em `127.0.0.1:3000` e preserva o banco em um volume. Para exposição pública, configure HTTPS, senha forte e `COOKIE_SECURE=true`, revise limites de acesso e backups. Esta versão é um protótipo de uma loja, não um serviço multiempresa pronto para produção.
