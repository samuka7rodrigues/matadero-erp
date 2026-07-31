# 🐂 ERP Matadero — Documentação

Sistema de gestão integral (ERP) para matadouro em Espanha, com ~100 colaboradores.

## 📚 Documentos

| # | Documento | Descrição |
|---|---|---|
| 01 | [Análise Funcional](./01-analise-funcional.md) | Visão geral, RFs, RNFs, personas, casos de uso UML |
| 02 | [Regras de Negócio](./02-regras-negocio.md) | Legislação espanhola aplicable (jornada, férias, nóminas, faturação, RGPD) |

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 14 + TypeScript + Tailwind + shadcn/ui
- **Mobile:** Expo (React Native)
- **Backend:** Next.js API Routes
- **DB & Auth:** Supabase (PostgreSQL)
- **Hosting:** Vercel + Supabase
- **i18n:** PT-BR + ES

## 📦 Módulos (MVP)

- ✅ RH (cadastros, contratos, férias, recibos)
- ✅ Ponto/Horas (marcações, apuramento, turnos)
- ✅ Financeiro (contas, faturação, tesouraria)
- ✅ Auth & Permissões
- 🔄 Rastreabilidade animal (Fase 2)

## 🌍 Idiomas

- 🇧🇷 Português (PT-BR) — desenvolvimento
- 🇪🇸 Espanhol (ES) — produção

## 📁 Estrutura

```
matadero-erp/
├── docs/                   # Este diretório
├── apps/
│   ├── web/               # Painel administrativo (Next.js)
│   └── mobile/            # App mobile (Expo)
├── packages/
│   ├── database/          # Schemas e migrations Supabase
│   ├── i18n/              # Traduções PT-BR + ES
│   ├── types/             # TypeScript types partilhados
│   └── ui/                # Componentes UI partilhados
└── supabase/
    ├── migrations/
    └── seed.sql
```

## 📞 Contactos

- **Analista Funcional:** Samuel Oliveira
- **Cliente:** Matadero (Espanha)
- **Data início:** 2026-07-31
