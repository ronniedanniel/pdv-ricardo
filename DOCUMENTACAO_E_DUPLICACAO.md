# Guia de Backup, Histórico e Duplicação do PDV

Este documento contém todas as instruções necessárias para realizar o backup completo do sistema, do histórico desta conversa e orientações detalhadas de como duplicar este projeto para futuros estabelecimentos.

---

## 💾 1. Backup do Código do Projeto

O código do seu projeto está totalmente seguro em dois locais:
1. **No seu PC:** Na pasta `C:\Users\NOTE-RJ\Documents\PROJETOS CLAUDE CODE\PDV - RICARDO`.
2. **Na Nuvem (GitHub):** No repositório privado ou público `https://github.com/ronniedanniel/pdv-ricardo.git`.

### Como fazer uma cópia de segurança extra (Recomendado):
* Copie a pasta do projeto `PDV - RICARDO` inteira para um **Pen Drive**, **HD Externo** ou sincronize com serviços de nuvem como **Google Drive**, **OneDrive** ou **Dropbox**.
* Nunca delete a pasta oculta `.git` dentro do projeto, pois ela contém todo o histórico de alterações feitas.

---

## 💬 2. Backup do Histórico desta Conversa

O histórico completo de instruções, explicações e comandos executados neste chat com a IA fica gravado localmente no seu computador.

### Onde encontrar o histórico no seu PC:
O arquivo contendo a conversa está localizado no caminho:
`C:\Users\NOTE-RJ\.gemini\antigravity\brain\0315c3c3-ca7d-4750-8b7e-ee742e381069\.system_generated\logs\transcript.jsonl`

* **Como salvar:** Copie a pasta `0315c3c3-ca7d-4750-8b7e-ee742e381069` (que é o ID desta conversa) e salve-a junto aos seus backups do projeto. O arquivo `transcript.jsonl` pode ser aberto com editores de texto como o VS Code ou Bloco de Notas para visualizar o registro cronológico completo das interações.

---

## 🚀 3. Como Duplicar o PDV para outro Estabelecimento

Se você quiser abrir o mesmo sistema para um **segundo bar ou restaurante**, siga este passo a passo para que os dados fiquem 100% separados (cada um com seus clientes, vendas e caixa):

### Passo A: Criar um Novo Banco de Dados (Supabase)
1. Acesse o [Supabase](https://supabase.com/) e faça login.
2. Clique em **New Project** (Novo Projeto) e configure o nome do novo estabelecimento.
3. No menu lateral esquerdo, acesse **SQL Editor** e clique em **New Query**.
4. Abra o arquivo [supabase_setup.sql](file:///C:/Users/NOTE-RJ/Documents/PROJETOS%20CLAUDE%20CODE/PDV%20-%20RICARDO/supabase_setup.sql) que está na pasta do seu projeto, copie todo o conteúdo dele e cole no editor do Supabase.
5. Clique em **Run** no canto inferior direito para criar todas as tabelas (Categorias, Produtos, Clientes, Fiados, Caixa, Vendas, etc.).

### Passo B: Obter as Novas Chaves de Acesso
1. No painel do seu novo projeto no Supabase, clique na engrenagem de **Project Settings** (Configurações do Projeto).
2. Vá em **API** e copie:
   * **Project API URL** (URL do projeto).
   * **anon/public key** (Chave pública de acesso).

### Passo C: Configurar o Novo Sistema
1. Abra a nova URL do PDV que você publicar (veja o Passo D).
2. Acesse a página de **Configurações** (engrenagem no menu lateral).
3. No campo do Supabase, cole a **URL** e a **Chave Pública** que você acabou de copiar no Passo B.
4. Clique em **Salvar Configurações**. O novo sistema se conectará automaticamente a este novo banco de dados limpo.

### Passo D: Criar um Novo Link de Acesso (Vercel)
Para ter links separados (ex: `estabelecimento1.vercel.app` e `estabelecimento2.vercel.app`), faça o seguinte:
1. No seu painel da [Vercel](https://vercel.com/):
2. Clique em **Add New** > **Project**.
3. Importe o mesmo repositório do GitHub (`pdv-ricardo`).
4. Durante a configuração, defina o nome do projeto (ex: `pdv-estabelecimento2`).
5. Clique em **Deploy**. A Vercel criará um link de acesso novo e exclusivo para o segundo estabelecimento.

---

## 📝 4. Resumo das Customizações Feitas neste PDV

Para referência futura, estas foram as modificações e regras de negócios personalizadas implementadas neste sistema:
1. **Mesa 0 como Venda Rápida (Balcão):** A comanda de número `0` é reservada para vendas rápidas/para viagem, limpando itens antigos toda vez que iniciada.
2. **Atalho de Atendimento Rápido:** Menu superior que permite alternar e iniciar vendas para Clientes Cadastrados, Avulsos ou Mesas de forma direta.
3. **Botão de Lixeira Rápido:** No rodapé do carrinho, um atalho limpa o pedido inteiro com um clique.
4. **Soft Delete de Clientes:** A exclusão comum de clientes apenas os oculta (`active = false`), mantendo-os nos históricos de vendas e relatórios para estatísticas do caixa.
5. **Expurgo Permanente:** Opção avançada dentro do cadastro para deletar fisicamente o cliente e todos os seus fiados do banco de dados, acompanhado de aviso prévio sobre a irreversibilidade do processo.
6. **Fluxo Direto de Pendura:** O botão "Colocar no Pendura" pula a tela de pagamentos e vai direto para a identificação do cliente e confirmação de fiado.
7. **Itens no Pendura:** O modal de pendura lista os produtos e quantidades sendo comprados a prazo.
8. **Histórico de Consumo:** A ficha do cliente exibe em abas separadas tanto o que ele deve em fiado quanto o histórico completo de todas as compras que ele já fez (em dinheiro, pix, etc.).
9. **Resiliência e Fallbacks Supabase:** Inserções e atualizações tratam erros de colunas ausentes no banco legado (como `active`, `customerName`, `tableNum` e `subtotal`), filtrando dados e prevenindo travamentos do sistema.
