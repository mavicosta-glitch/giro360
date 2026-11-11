# Giro360 / BA Infoco — Portal de Notícias de Alta Performance

Portal de notícias regional construído com **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **TanStack Query v5**, **Lucide React**, **Zod** e persistência em **SQLite nativo (`node:sqlite`)**, incluindo um **Painel Administrativo (`/admin`)** completo para gestão de notícias e editorias.

## Principais Recursos

- **Clean Architecture:** separação clara entre `domain/`, `infrastructure/`, `application/`, `lib/` e `components/`.
- **Layout Editorial Clássico Elevado:** cabeçalho institucional com menu de editorias horizontal e drawer mobile acessível, ticker rotativo **Destaques**, bloco **Hero** de alto contraste, grid assimétrico e widgets laterais (**Mais Lidas**, clima/mercado e newsletter).
- **SEO Técnico & Core Web Vitals:** HTML5 semântico, dados estruturados Schema.org JSON-LD (`WebSite`, `NewsMediaOrganization`, `NewsArticle`, `BreadcrumbList`), `sitemap.xml`, `robots.txt` e otimização via `next/image` (`priority` no Hero e `loading="lazy"` nas demais imagens).
- **Painel Administrativo (`/admin`):** CRUD completo de notícias (rascunho/publicada, Hero, Ticker, Coluna Secundária, upload de imagem local via `/api/upload`) e CRUD de categorias/editorias (nome, slug, cor, ordem e visibilidade no menu).

## Scripts Disponíveis

```bash
npm install
npm run dev          # Inicia em modo desenvolvimento (http://localhost:3000)
npx next build --webpack  # Build de produção (ou `npm run build` fora de sandbox restrito)
npm start            # Servidor de produção
npm run typecheck    # Verificação TypeScript
npm run lint         # ESLint
npm test             # Testes unitários (node --test)
```

## Rotas Principais

- `/` — Capa editorial do portal
- `/categoria/[slug]` — Listagem por editoria
- `/noticia/[slug]` — Página da matéria com `NewsArticle` JSON-LD
- `/busca` — Arquivo e busca instantânea
- `/admin` — Painel Administrativo (CMS)
- `/sitemap.xml` e `/robots.txt` — Indexação SEO
