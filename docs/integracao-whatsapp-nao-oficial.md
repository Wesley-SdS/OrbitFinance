# Integração WhatsApp Não-Oficial (Evolution/Zapster)

Este guia descreve como integrar o assistente ao WhatsApp sem a API oficial, usando ferramentas open source populares. Use com cautela: soluções não-oficiais podem violar termos do WhatsApp e causar banimento do número.

## Opções Principais
- Evolution API (open source)
  - Fornece uma REST API/Webhook sobre um cliente WhatsApp Web.
  - Recursos: múltiplas sessões, envio/recebimento de mensagens, mídia, webhooks.
  - Deploy: Docker, configura variáveis e expõe endpoints HTTP.
- Zapster (provedor/stack de automação)
  - Oferece gestão de sessões e endpoints para envio/recebimento.
  - Consulte documentação do provedor para endpoints específicos.

## Evolution API — Setup Rápido (exemplo)
1) Pré-requisitos
   - Docker e Docker Compose.
   - Domínio/URL pública (ngrok em dev).
2) Subir serviço
   - Clone o repositório da Evolution API.
   - Configure `docker-compose.yml` com variáveis: porta HTTP, secrets e webhooks.
   - Suba com `docker compose up -d`.
3) Criar sessão
   - Chame o endpoint de criação de sessão (HTTP) e escaneie o QR Code no WhatsApp.
   - Configure o Webhook de eventos para apontar para `app/api/whatsapp/webhook` do projeto.
4) Enviar mensagens
   - Use o endpoint de envio de texto/mídia informando `session` e `to` (telefone em E.164 ou local com DDI/DDDs conforme a ferramenta).
5) Receber mensagens
   - Evolution envia POSTs ao seu Webhook com dados do remetente, tipo (texto/imagem/áudio), IDs e links de mídia.

## Zapster — Setup Geral (exemplo)
1) Crie e autentique uma sessão (QR Code) para um número.
2) Configure o Webhook para seu endpoint público.
3) Use os endpoints do provedor para enviar texto/mídia e baixar arquivos.
4) Ajuste mapeamentos no `WhatsAppProvider` para normalizar payloads.

## Adaptação no Projeto
- Crie um adapter `WhatsAppProviderEvolution` e/ou `WhatsAppProviderZapster` implementando a interface `WhatsAppProvider`.
- Mapeie:
  - Normalização de eventos inbound (texto, imagem, áudio, documento).
  - Download de mídia e headers necessários.
  - Tratamento de reenvio/duplicidades (idempotência `providerMessageId`).
- Assine o Webhook com secret (se disponível) e valide assinatura.

## Observabilidade e Resiliência
- Retry exponencial para downloads de mídia.
- Dead-letter para falhas persistentes.
- Circuit breaker para provedores indisponíveis.

## Produção vs Desenvolvimento
- Desenvolvimento: Evolution/Zapster agilizam validações e UX.
- Produção: prefira API oficial (Meta) por estabilidade, templates e compliance.

