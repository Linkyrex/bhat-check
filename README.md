# bhat-check

[![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub_Pages-327fc7?style=flat)](https://linkyrex.github.io/bhat-check/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[!{Pnpm](https://img.shields.io/badge/pnpm-Workspaces-fabf2f?style=flat&logo=pnpm)](https://pnpm.io)

A pnpl monorepo with an Express API and React dashboard, deployed to GitHub Pages.

## 🚀 Live

**Dashboard**: https://linkyrex.github.io/bhat-check/

## 📦 Packages

- `artifacts/api-server` — Express 5 REST API
- `artifacts/gold-plotter` — React dashboard (Vite + Radix UI)
- `artifacts/mockup-sandbox` — Testing environment
- `lib/db` — Drizzle ORM + PostgreSQL
- `lib/api-spec` — OpenAPI spec + Orval config
- `lib/api-zod` — Generated Zod schemas
- `lib/api-client-react` — Generated React Query hooks

## 🛠️ Local Development

```bash
pnpm install
pnpm --filter @workspace/gold-plotter run dev
```

## 🏗️ Tech Stack

- **Frontend**: React, Vite, Radix UI, Recharts
- **Backend**: Express 5, Drizzle ORM, PostgreSQL
- **Tooling**: pnpm workspaces, TypeScript, Orval

## License

MIT
