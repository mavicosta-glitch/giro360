# Giro360 / BA Infoco — Portal de Notícias de Alta Performance

Portal de notícias regional construído com **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **TanStack Query v5**, **Lucide React**, **Zod** e persistência completa em **Supabase** (**PostgreSQL + Row Level Security + Auth + Storage**), incluindo um **Painel Administrativo (`/admin`)** completo para gestão de notícias, editorias, banners publicitários e inscritos na newsletter.

## Principais Recursos

- **Clean Architecture:** separação clara entre `domain/`, `infrastructure/`, `application/`, `lib/` e `components/`.
- **Layout Editorial Clássico Elevado:** cabeçalho institucional com menu de editorias horizontal e drawer mobile acessível, ticker rotativo **Destaques**, bloco **Hero** de alto contraste, grid assimétrico e widgets laterais (**Mais Lidas**, clima/mercado, banners e newsletter).
- **SEO Técnico & Core Web Vitals:** HTML5 semântico, dados estruturados Schema.org JSON-LD (`WebSite`, `NewsMediaOrganization`, `NewsArticle`, `BreadcrumbList`), `sitemap.xml`, `robots.txt` e otimização via `next/image` (`priority` no Hero e `loading="lazy"` nas demais imagens).
- **Banco de Dados & Segurança no Supabase (`supabase/schema.sql`):**
  - Tabelas `categories`, `articles`, `banners`, `newsletter_subscribers` e `admin_profiles`.
  - Triggers para `updated_at`, exclusividade de `is_hero` e promoção automática do primeiro usuário autenticado para administrador.
  - Políticas **RLS** para leitura pública segura e escrita restrita a administradores autenticados via **Supabase Auth**, além do bucket público `news-media` no **Supabase Storage** para uploads.
- **Painel Administrativo (`/admin`):** autenticação via Supabase Auth, CRUD de notícias (rascunho/publicada, Hero, Ticker, Coluna Secundária, upload no Supabase Storage via `/api/upload`), CRUD de categorias/editorias, gestão de banners institucionais e gestão de inscritos da newsletter.

## Configuração do Supabase

1. Crie um projeto no Supabase e copie `.env.example` para `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Abra o **SQL Editor** no painel do Supabase, cole o conteúdo de `supabase/schema.sql` e execute uma única vez.
3. Acesse `/admin` e crie a primeira conta administrativa (ou cadastre em *Authentication -> Users* com confirmação de e-mail ativada).

## Scripts Disponíveis

```bash
npm install
npm run dev               # Inicia em modo desenvolvimento (http://localhost:3000)
npx next build --webpack  # Build de produção (ou `npm run build`)
npm start                 # Servidor de produção
npm run typecheck         # Verificação TypeScript
npm run lint              # ESLint
npm test                  # Testes unitários (node --test)
```

## Rotas Principais

- `/` — Capa editorial do portal
- `/categoria/[slug]` — Listagem por editoria
- `/noticia/[slug]` — Página da matéria com `NewsArticle` JSON-LD
- `/busca` — Arquivo e busca instantânea
- `/admin` — Painel Administrativo (CMS autenticado via Supabase Auth)
- `/api/health` — Diagnóstico de conexão e tabelas do Supabase
- `/sitemap.xml` e `/robots.txt` — Indexação SEO

