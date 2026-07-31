# 🚀 Guia Completo: Configurar Supabase para o ERP Matadero

Este guia mostra **passo a passo** como configurar o Supabase para o projeto.

---

## 📋 Passo 1: Criar projeto no Supabase

1. Vai a [supabase.com](https://supabase.com) e faz login
2. Clica em **"New Project"**
3. Escolhe a tua organização (ou cria uma)
4. Preenche:
   - **Name:** `matadero-erp` (ou o nome que preferires)
   - **Database Password:** ⚠️ **MUITO IMPORTANTE** — guarda esta password! Vais precisar dela.
   - **Region:** Escolhe **West EU (Ireland)** ou **South EU (Madrid se disponível)** — mais perto de Espanha
5. Clica em **"Create new project"**
6. Espera ~2 minutos enquanto o projeto é provisionado

---

## 📋 Passo 2: Obter as credenciais

1. No painel do projeto, vai a **⚙️ Settings** → **API**
2. Copia os seguintes valores:

```
Project URL:        https://[teu-project-id].supabase.co
anon public key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   ⚠️ SECRETO!
```

3. Cola estes valores no ficheiro `apps/web/.env.local` (cria-o se não existir):

```env
NEXT_PUBLIC_SUPABASE_URL=https://teu-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 📋 Passo 3: Executar as migrations SQL

Vamos executar as migrations **diretamente no SQL Editor** do Supabase (mais simples que CLI).

> 💡 Se já tinhas o projeto configurado **antes** desta versão, executa primeiro a
> **migration 0004** (`0004_colaboradores.sql`), que converte automaticamente a base de
> dados dos nomes antigos ("funcionarios" → "colaboradores"). Em bases novas basta
> executar 0001 → 0002 → 0003 → 0004 por ordem.

### Migration 0001 — Schema RH

1. No painel Supabase, vai a **🗄️ SQL Editor** (menu lateral esquerdo)
2. Clica em **"New query"**
3. Abre o ficheiro `supabase/migrations/0001_rh_initial.sql` no teu editor
4. **Copia TODO o conteúdo** (618 linhas)
5. Cola no SQL Editor
6. Clica em **"Run"** (▶️) ou `Ctrl/Cmd + Enter`
7. Espera ver a mensagem "Success. No rows returned" ✅

### Migration 0002 — Funções e utilidades

1. Clica novamente em **"New query"**
2. Abre `supabase/migrations/0002_rh_util_functions.sql` (390 linhas)
3. Copia, cola e executa
4. Confirma o sucesso ✅

### Migration 0003 — Ajustes

1. Abre `supabase/migrations/0003_nif_nie_opcional.sql` e executa
2. Abre `supabase/migrations/0003_ponto_fixes.sql` e executa

### Migration 0004 — Renomeação "funcionario" → "colaborador"

1. Abre `supabase/migrations/0004_colaboradores.sql` e executa
2. Confirma o sucesso ✅

---

## 📋 Passo 4: Verificar o que foi criado

Vai a **🗄️ Database** → **Tables** e deves ver:

| Tabela | Descrição |
|---|---|
| `departamentos` | 8 departamentos pré-configurados |
| `colaboradores` | Cadastro principal |
| `contratos` | Histórico de contratos |
| `documentos_colaborador` | Arquivos (DNI, contratos, etc.) |
| `exames_medicos` | Exames e vigilência médica |
| `entregas_epi` | EPI's entregues |
| `utilizadores` | Login + roles |
| `ferias` | Gestão de férias |
| `marcacoes_ponto` | Registo horário (RD 8/2019) |
| `turnos` | Escalas de turnos |
| `audit_log` | Log de auditoria |

Vai a **🗄️ Database** → **Views** e confirma:
- `v_colaboradores_ativos`
- `v_exames_a_vencer`
- `v_contratos_a_expirar`

Vai a **🗄️ Database** → **Functions** e confirma:
- `validar_nif()`
- `validar_cif()`
- `calcular_dias_ferias()`
- `calcular_horas_jornada()`

---

## 📋 Passo 5: Criar o primeiro utilizador admin

### 5.1. Criar o user no Supabase Auth

1. Vai a **🔐 Authentication** → **Users** (menu lateral)
2. Clica em **"Add user"** → **"Create new user"**
3. Preenche:
   - **Email:** `admin@matadero.es` (ou o teu email real)
   - **Password:** uma password forte (mínimo 8 caracteres)
   - **Auto Confirm User:** ✅ **marca esta opção** (assim não precisas confirmar email)
4. Clica em **"Create user"**
5. **Copia o `User UID`** que aparece (vais precisar)

### 5.2. Associar o user ao nosso sistema

Vai a **🗄️ SQL Editor** → **New query** e executa:

```sql
-- 1. Criar o registo na tabela 'utilizadores' (ligado ao auth.users)
INSERT INTO public.utilizadores (user_id, email, role, ativo)
VALUES (
  'COLA-AQUI-O-UUID-DO-USER',     -- substitui pelo UUID que copiaste
  'admin@matadero.es',             -- mesmo email do passo 5.1
  'admin',
  TRUE
);

-- 2. Criar o colaborador correspondente
INSERT INTO public.colaboradores (
  nif, nombre, apellido1, fecha_nacimiento, fecha_admision,
  email, tipo_contrato, jornada, horas_semanales, salario_base,
  estado, departamento_id
) VALUES (
  '00000000A',
  'Admin',
  'Sistema',
  '1990-01-01',
  CURRENT_DATE,
  'admin@matadero.es',
  'indefinido',
  'completa',
  40,
  3000,
  'ativo',
  (SELECT id FROM departamentos WHERE codigo = 'ADM')
);

-- 3. Associar o utilizador ao colaborador
UPDATE public.utilizadores
SET colaborador_id = (SELECT id FROM colaboradores WHERE email = 'admin@matadero.es')
WHERE email = 'admin@matadero.es';

-- 4. Confirmar tudo
SELECT u.email, u.role, f.nombre, f.apellido1, d.nombre AS departamento
FROM utilizadores u
LEFT JOIN colaboradores f ON u.colaborador_id = f.id
LEFT JOIN departamentos d ON f.departamento_id = d.id;
```

Deves ver 1 linha com os dados do admin criado. ✅

---

## 📋 Passo 6: Configurar Storage (buckets)

As migrations já criaram os buckets automaticamente. Vamos confirmar e dar permissões:

1. Vai a **🗂️ Storage** (menu lateral)
2. Deves ver 4 buckets criados:
   - `fotos-colaboradores` (privado)
   - `documentos-colaboradores` (privado)
   - `contratos` (privado)
   - `exames-medicos` (privado)

3. Para cada bucket, clica nele e em **"Policies"**:
   - Deves ver policies como `rh_manage_fotos` e `colaborador_ler_proprio_documento`
   - Se não aparecer, as policies não foram criadas — avisa-me

---

## 📋 Passo 7: Configurar Authentication

Vai a **🔐 Authentication** → **URL Configuration**:

| Campo | Valor |
|---|---|
| **Site URL** | `http://localhost:3000` (em dev) |
| **Redirect URLs** | `http://localhost:3000/auth/callback` |

> ⚠️ Quando fizeres deploy para produção, vai precisar de atualizar para o URL real (ex: `https://erp.matadero.es`)

Vai a **🔐 Authentication** → **Email Templates** (opcional):
- Personaliza o template de "Confirm Signup" e "Reset Password" em espanhol.

---

## 📋 Passo 8: Iniciar a app e testar!

1. No terminal, na raiz do projeto:
   ```bash
   npm run dev
   ```

2. Abre [http://localhost:3000](http://localhost:3000) no browser

3. Deves ver a página inicial do ERP (em PT-BR)

4. Clica em "Entrar" e faz login com:
   - Email: `admin@matadero.es`
   - Password: a que definiste no passo 5.1

5. Deves ser redirecionado para o **Dashboard** 🎉

6. Testa:
   - Ir a **Colaboradores** → deve mostrar lista vazia
   - Clicar em **"Novo Colaborador"** e preencher o formulário
   - Verificar que a validação de NIF funciona (ex: `12345678Z` é válido ✅)
   - Verificar que é possível cadastrar sem NIF nem NIE (ambos opcionais)

---

## 🔧 Troubleshooting

### ❌ Erro: "Invalid API key"
→ Verifica que `.env.local` tem as variáveis corretas e reinicia o servidor (`Ctrl+C` + `npm run dev`).

### ❌ Erro: "permission denied for table colaboradores"
→ As RLS policies não foram aplicadas. Volta a executar a migration 0001.

### ❌ Login não funciona mas credenciais estão certas
→ Vai a **Authentication** → **Users** e confirma que o user está com **"Email Confirmed"** ✅.
Se não estiver, clica nos "..." → **"Send magic link"** OU executa no SQL:
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'admin@matadero.es';
```

### ❌ NIF válido está a dar erro
→ Testa com valores conhecidos: `12345678Z` (válido), `00000000A` (inválido).

### ❌ Sidebar mostra tudo mesmo sendo "colaborador"
→ O role na tabela `utilizadores` não está correto. Verifica:
```sql
SELECT email, role FROM utilizadores;
```

---

## 📊 Comandos úteis para testar

Ver todos os colaboradores:
```sql
SELECT * FROM colaboradores;
```

Ver colaboradores com info de departamento:
```sql
SELECT f.nombre, f.apellido1, f.email, f.estado, d.nombre AS departamento
FROM colaboradores f
LEFT JOIN departamentos d ON f.departamento_id = d.id
WHERE f.deleted_at IS NULL;
```

Inserir dados de teste (alternativa: executa `supabase/seed.sql`, que também cria os utilizadores de auth):
```sql
-- Inserir 5 colaboradores de teste
INSERT INTO colaboradores (nif, nombre, apellido1, fecha_nacimiento, fecha_admision, email, tipo_contrato, salario_base, departamento_id)
VALUES
  ('11111111A', 'Juan', 'García', '1985-03-15', '2020-01-15', 'juan@matadero.es', 'indefinido', 1500, (SELECT id FROM departamentos WHERE codigo='SACRIF')),
  ('22222222B', 'María', 'López', '1990-07-22', '2021-06-01', 'maria@matadero.es', 'indefinido', 1600, (SELECT id FROM departamentos WHERE codigo='DESP')),
  ('33333333C', 'Pedro', 'Martínez', '1988-11-30', '2019-09-10', 'pedro@matadero.es', 'temporal', 1400, (SELECT id FROM departamentos WHERE codigo='CAM')),
  ('44444444D', 'Ana', 'Rodríguez', '1992-05-18', '2022-03-20', 'ana@matadero.es', 'indefinido', 1700, (SELECT id FROM departamentos WHERE codigo='CAL')),
  ('55555555E', 'Carlos', 'Sánchez', '1986-09-12', '2018-11-05', 'carlos@matadero.es', 'indefinido', 1550, (SELECT id FROM departamentos WHERE codigo='MANT'));
```

---

## ✅ Checklist final

- [ ] Projeto Supabase criado
- [ ] Credenciais copiadas para `.env.local`
- [ ] Migration 0001 executada (✅ Success)
- [ ] Migration 0002 executada (✅ Success)
- [ ] Migration 0003 executada (✅ Success)
- [ ] Migration 0004 executada (✅ Success)
- [ ] Tabelas criadas (visíveis em Database → Tables)
- [ ] Views criadas (visíveis em Database → Views)
- [ ] Funções criadas (visíveis em Database → Functions)
- [ ] User admin criado em Authentication → Users
- [ ] User associado à tabela `utilizadores`
- [ ] Colaborador correspondente criado
- [ ] 4 buckets de Storage criados
- [ ] Site URL configurada
- [ ] App a correr em `localhost:3000`
- [ ] Login funciona
- [ ] Dashboard aparece após login
- [ ] Consegui cadastrar um colaborador de teste

---

## 🆘 Precisas de ajuda?

Diz-me em que **passo** estás e qual o **erro** (se houver). Posso ajudar a:
- Diagnosticar problemas específicos
- Ajustar configurações
- Adicionar dados de teste
- Resolver erros de SQL
- Configurar email templates
- Deploy para produção

**Próximo passo recomendado:** quando terminares a configuração, diz-me se tudo funcionou, e avançamos para o **módulo de Ponto/Horas** (RD 8/2019).