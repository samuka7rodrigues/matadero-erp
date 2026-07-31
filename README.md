# 🐂 ERP Matadero

> Sistema de Gestão Integral para matadouro em Espanha.
> ~100 colaboradores · PT-BR + ES · Web + Mobile · Cloud-native

---

## 🚀 Quick Start

### 1. Pré-requisitos

- **Node.js** ≥ 20 ([instalar](https://nodejs.org))
- **npm** ≥ 10 (já vem com o Node)
- **Conta Supabase** ([criar grátis](https://supabase.com))

### 2. Instalar dependências

```bash
cd matadero-erp
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cd apps/web
cp .env.example .env.local
```

Edita `.env.local` com as credenciais do teu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://teu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 4. Executar migrations no Supabase

1. Vai ao **Dashboard Supabase** → SQL Editor
2. Cria nova query
3. Cola o conteúdo de `supabase/migrations/0001_rh_initial.sql` → Run
4. Repete para `0002_rh_util_functions.sql` e `0003_ponto_fixes.sql`

Ou via CLI:
```bash
npm install -g supabase
supabase link --project-ref teu-project-id
supabase db push
```

### 5. Iniciar servidor de desenvolvimento

```bash
cd matadero-erp
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 📁 Estrutura

```
matadero-erp/
├── apps/
│   └── web/                    # App Next.js (painel admin)
│       ├── src/
│       │   ├── app/[locale]/   # Rotas com i18n
│       │   ├── components/     # Componentes React
│       │   ├── lib/            # Utilitários e clientes Supabase
│       │   ├── actions/        # Server Actions (Next.js)
│       │   └── i18n/           # Configuração next-intl
│       └── ...
├── packages/
│   ├── database/               # Referência às migrations
│   ├── i18n/                   # Traduções PT-BR + ES
│   └── types/                  # TypeScript types partilhados
├── supabase/
│   └── migrations/             # Scripts SQL (executar no Supabase)
└── docs/
    ├── 01-analise-funcional.md
    ├── 02-regras-negocio.md
    └── INDICE.md
```

---

## 🧪 Criar primeiro utilizador admin

Depois de instalar, executa este SQL no Supabase para criar o teu primeiro admin:

```sql
-- Substituir 'teu-email@dominio.com' e 'tua-password'
-- Primeiro criar no auth.users via Dashboard Authentication > Users > Add User
-- Depois:
INSERT INTO public.utilizadores (user_id, email, role, ativo)
SELECT id, email, 'admin', TRUE FROM auth.users WHERE email = 'teu-email@dominio.com';

-- E criar o colaborador correspondente
INSERT INTO public.colaboradores (
  nif, nombre, apellido1, fecha_nacimiento, fecha_admision,
  email, tipo_contrato, salario_base
) VALUES (
  '00000000A', 'Admin', 'Sistema', '1990-01-01', '2026-01-01',
  'teu-email@dominio.com', 'indefinido', 2000
);
```

### 🧪 Base de teste (colaboradores + ponto)

Para testar o módulo de Ponto com dados prontos, executa `supabase/seed.sql` no **SQL Editor** do Supabase. Cria 1 admin + 5 colaboradores (email + password `Teste123!`) e insere marcações de exemplo de hoje para `juan@matadero.es`.

---

## 📚 Documentação

| Documento | Descrição |
|---|---|
| [Análise Funcional](docs/01-analise-funcional.md) | RFs, RNFs, casos de uso, arquitetura |
| [Regras de Negócio](docs/02-regras-negocio.md) | Legislação espanhola (RD 8/2019, ET, RGPD) |

---

## 🛠️ Stack

- **Next.js 14** (App Router + Server Actions)
- **TypeScript** estrito
- **Tailwind CSS** + componentes shadcn-style
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **next-intl** (i18n PT-BR / ES)
- **React Hook Form** + **Zod** (validação)
- **Recharts** (gráficos)

---

## 📋 Status do Projeto

### ✅ Implementado
- [x] Setup do projeto Next.js + Supabase
- [x] Configuração i18n (PT-BR + ES)
- [x] Schema SQL do módulo RH (colaboradores, contratos, férias, EPI's, exames)
- [x] Sistema de permissões com RLS no Supabase
- [x] Autenticação (login, logout, forgot password)
- [x] CRUD de Colaboradores (UI + Server Actions)
- [x] Validação de NIF em tempo real
- [x] Dashboard com KPIs
- [x] Módulo de Ponto (marcações entrada/saída/almoço, resumo diário de horas)

### 🔄 Em desenvolvimento
- [ ] Upload de documentos (DNI, contratos, exames)
- [ ] Apuramento mensal de ponto (RD 8/2019)
- [ ] Cálculo de horas extras (relatório)
- [ ] Recibos de vencimento (PDF)
- [ ] Módulo Financeiro (faturas, despesas)
- [ ] App Mobile (Expo)

---

## 🚢 Deploy

### Vercel (recomendado)
1. Importa o repo no [Vercel](https://vercel.com)
2. Root directory: `apps/web`
3. Adiciona as env vars
4. Deploy!

### Supabase
Já está — basta teres o projeto criado.

---

## 📝 Licença

UNLICENSED — propriedade do cliente.
