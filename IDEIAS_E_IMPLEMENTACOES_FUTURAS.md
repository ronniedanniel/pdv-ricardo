# Roadmap: Ideias e Implementações Futuras (PDV Ricardo)

Este documento reúne todas as ideias de melhorias, automações e integrações de terceiros mapeadas para o sistema PDV do Bar do Ricardo, organizadas por módulos com seus requisitos técnicos.

---

## 📢 MÓDULO 1: Integração com o WhatsApp

### 1.1 Comparativo de Opções de Integração de Mensagens

#### Opção A: Click-to-Chat (Manual & 100% Gratuito)
*   **Como funciona:** O sistema gera a mensagem com os gastos do cliente e abre uma aba do WhatsApp com o chat do cliente e o texto já preenchido. O operador só precisa clicar em "Enviar".
*   **Custo:** R$ 0,00.
*   **Requisitos:** Nenhum cadastro ou configurações de servidor.
*   **Envio:** Semi-automático.

#### Opção B: API de Gateway Não Oficial (Automático & Baixo Custo) - *Recomendado para Automação*
*   **Como funciona:** Conecta-se um número de WhatsApp comum ao sistema através da leitura de um QR Code (como no WhatsApp Web). O sistema envia a mensagem em segundo plano sem qualquer clique humano.
*   **Serviços comuns:** [Z-API](https://z-api.io/), [Evolution API](https://github.com/Evolution-API/evolution-api) (código aberto).
*   **Custo:** Mensalidade fixa (Z-API: ~R$ 49 a R$ 99/mês) ou hospedagem própria em servidor gratuito.
*   **Envio:** 100% Automático.

#### Opção C: API Cloud Oficial da Meta (Automático & Seguro)
*   **Como funciona:** O sistema se conecta diretamente à infraestrutura da Meta para disparar mensagens oficiais. Não precisa de celular conectado.
*   **Custo:** Pago por conversa iniciada (cerca de R$ 0,30 a R$ 0,40 por conversa ativa de 24h).
*   **Requisitos:** Exige ter CNPJ, criar conta no Meta Business Suite e verificar a empresa.

---

### 1.2 Recursos de WhatsApp do Pendura (Fiado)

#### A. Notificação Imediata a cada Lançamento no Pendura
*   **Lógica:** Ao fechar uma venda no fiado, o sistema detecta o telefone do cliente e dispara uma requisição em segundo plano para o gateway do WhatsApp.
*   **Mensagem enviada:**
    ```text
    *Bar do Ricardo - Pendura Lançado* 📝
    
    Olá, [Nome]!
    Registramos no seu pendura:
    • [Qtd]x [Produto] ([Valor])
    
    💰 *Valor lançado hoje:* [Valor da Compra]
    📉 *Seu saldo pendente atualizado:* *[Saldo Geral]*
    
    Agradecemos a preferência! 🍻
    ```

#### B. Relatório Diário Consolidado (Extrato Geral)
*   **Disparo Manual (1 Clique):** Botão no painel do caixa que loops por todos os devedores ativos do dia, consolida os itens consumidos e envia a lista de cobrança.
*   **Disparo Automático na Nuvem (Supabase Cron):** Script rodando em segundo plano no Supabase que acorda todo dia às 23:30h, calcula pendências de devedores e envia as mensagens de forma autônoma.

#### C. Geração de QR Code e Copia e Cola PIX no WhatsApp
*   **Pix Copia e Cola:** O JavaScript do PDV gera a linha EMV do Pix com o valor da dívida e a sua chave cadastrada. O código de texto é enviado na mensagem de cobrança.
*   **QR Code (Imagem):** A string do Pix é convertida em imagem usando a API gratuita do `QR Server` (`https://api.qrserver.com/v1/create-qr-code/?data=PIX_PAYLOAD`). O gateway envia a imagem gerada diretamente no chat do cliente.

---

## 🔌 MÓDULO 2: Integrações com Outras Plataformas

### 2.1 iFood (Gestão Unificada de Delivery)
*   **O que faz:** Pedidos feitos no iFood entram direto na tela do seu PDV (como comandas de entrega) sem digitação manual.
*   **Requisitos:**
    1.  Loja ativa no iFood.
    2.  Registrar o CNPJ no Portal de Desenvolvedores do iFood para obter as credenciais (`Client ID` e `Client Secret`).
    3.  Configurar uma **Supabase Edge Function** para receber e processar os avisos de novos pedidos do iFood (*Webhooks*).

### 2.2 Google Maps (Rotas & Taxas de Entrega)
*   **O que faz:** Autocompleta o endereço do cliente ao cadastrar uma entrega, calcula a distância exata em quilômetros do bar até a casa do cliente e sugere a taxa de entrega automática (ex: R$ 2,00/km).
*   **Requisitos:**
    1.  Conta no Google Cloud Platform.
    2.  Ativar as chaves de API: *Maps JavaScript API*, *Places API* e *Distance Matrix API*.
    3.  Cartão cadastrado no Google (possui US$ 200 de crédito grátis todo mês para consultas gratuitas na prática).

### 2.3 Waze (Navegação para Entregadores)
*   **O que faz:** Adiciona o botão "Abrir no Waze" na tela de entregas. Ao ser clicado no celular do entregador, o aplicativo do Waze inicia a rota GPS direto para o cliente.
*   **Requisitos:**
    *   **100% Gratuito.** Não exige chaves ou cadastros. Realizado por meio de *Deep Linking* (`https://waze.com/ul?q=[ENDEREÇO]&navigate=yes`).

### 2.4 Mercado Pago (Baixa Automática de Pix & Cartões)
*   **O que faz:**
    *   **Pix na Tela:** O PDV gera um QR Code Pix no caixa. Quando o cliente paga no celular dele, o sistema detecta o pagamento em 2 segundos e fecha a venda sozinho.
    *   **Link de Cobrança:** Envia um link de pagamento via WhatsApp para que clientes paguem suas contas ou fiados de casa via cartão ou Pix.
*   **Requisitos:**
    1.  Conta ativa no Mercado Pago.
    2.  Copiar o `Access Token` e a `Public Key` no painel de desenvolvedores do Mercado Pago.
    3.  Configurar um endereço seguro de recebimento (*Webhook*) no Supabase para processar os pagamentos aprovados.
