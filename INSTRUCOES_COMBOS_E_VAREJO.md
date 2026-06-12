# Instruções: Configuração de Combos e Varejo Vinculado (Cigarros)

Este guia explica como ativar e utilizar os novos recursos de controle de estoque inteligente no seu PDV.

---

## ⚡ 1. Migração no Supabase (Necessário para sincronização)

Para sincronizar combos e avulsos na nuvem com celulares e outros PCs, execute as seguintes linhas no seu painel do Supabase:

1. Acesse **[Supabase Console](https://supabase.com/)** e abra o seu projeto.
2. No menu lateral esquerdo, clique em **SQL Editor**.
3. Clique em **New Query** (Nova Consulta).
4. Cole o código SQL abaixo e clique no botão **RUN** (ou pressione `Ctrl + Enter`):

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS "parentProductId" INT REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "conversionFactor" INT DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "unitsInOpen" INT DEFAULT 0;
```

---

## 🍺 2. Como Utilizar Combos (Vodka + Suco + Gelo, etc.)

Os combos não controlam estoque direto, mas sim o estoque de seus componentes individuais.

### Cadastro do Combo:
1. Vá em **Gestão -> Produtos**.
2. Clique em **+ Produto** para criar um novo produto.
3. No campo **Tipo de Produto**, mude de "Produto Normal" para **"Combo / Kit"**.
4. Defina o Nome, Categoria, Unidade e Preço de Venda do Combo.
5. Na seção **Componentes do Combo**:
   - Selecione o primeiro componente (ex: Dose de Vodka) e clique no botão **+** para adicionar.
   - Selecione o segundo componente (ex: Suco Lata) e adicione.
   - Faça o mesmo para os outros itens.
6. Clique em **Salvar**.

### No PDV:
* O PDV exibirá o estoque disponível para o combo calculado com base no componente que tiver a menor quantidade no estoque real.
* Ao vender 1 Combo, o estoque de todos os componentes vinculados é deduzido simultaneamente em segundo plano.

---

## 🚬 3. Como Utilizar Varejo Vinculado (Cigarro Avulso)

Esta lógica gerencia a abertura automática de maços para venda de cigarros avulsos.

### Cadastro:
1. Cadastre primeiro o produto pai: `Cigarro Maço` (Tipo: **Normal**, Estoque Atual = `5`, Estoque Mínimo = `1`, Unidade = `maço`).
2. Cadastre em seguida o produto filho: `Cigarro Varejo` (Tipo: **Varejo Vinculado**).
3. Na seção **Vínculo de Estoque**:
   - Selecione `Cigarro Maço` como o **Produto Pai**.
   - Defina o **Fator de Conversão** como `20` (quantidade de cigarros avulsos contidos em 1 maço).
   - Defina as **Unidades no Maço Aberto** como `0` (se ainda não tiver nenhum maço aberto no balcão).
4. Clique em **Salvar**.

### No PDV:
* Ao vender `1 Cigarro Varejo`, o sistema detectará que os avulsos abertos estão em `0`. Ele abrirá automaticamente 1 maço fechado:
  * O estoque de `Cigarro Maço` cairá de **5** para **4**.
  * A contagem de avulsos do `Cigarro Varejo` mudará para **19** (20 - 1).
* As próximas vendas do avulso reduzirão o contador para 18, 17, 16... sem alterar o estoque de maços fechados.
* Ao zerar o maço aberto, a venda de mais um avulso abrirá o próximo maço fechado, reiniciando o ciclo.
