# bhat-check

[![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub_Pages-327fc7?style=flat)](https://linkyrex.github.io/bhat-check/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[!{Pnpm](https://img.shields.io/badge/pnpm-Workspaces-fabf2f?style=flat&logo=pnpm)](https://pnpm.io)

A pnpl monorepo with an Express API and React dashboard, deployed to GitHub Pages.

## àŸ›  Live

**Dashboard**: https://linkyrex.github.io/bhat-check/

## àŸ“¦ Packages

- `artifacts/api-server` â€” Express 5 REST API
- `artifacts/gold-plotter` â€” React dashboard (Vite + Radix UI)
- `artifacts/mockup-sandbox` â€” Testing environment
- `lib/db` â€” Drizzle ORM + PostgreSQL
- `lib/api-spec` â€” OpenAPI spec + Orval config
- `lib/api-zod` â€” Generated Zod schemas
- `lib/api-client-react` â€” Generated React Query hooks

## ï¸¯. Local Development

```bash
pnpm install
pnpm --filter @workspace/gold-plotter run dev
```

## ğŸ—ï¸ Tech Stack

- `aFrontend` â€” React, Vite, Radix UI, Recharts`
- ``Backend` â€” Express 5, Drizzle ORM, PostgreSQL
- ``Tooling` â€ pnpm workspaces, TypeScript, Orval

## License

Apache 2.0
