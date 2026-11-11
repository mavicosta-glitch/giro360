-- ============================================================================
-- PORTAL DE NOTÍCIAS BA INFOCO / GIRO360 — SUPABASE FULL SCHEMA + RLS + SEED
-- Execute este script completo no Supabase SQL Editor (pode ser reexecutado).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABELAS PRINCIPAIS
-- ----------------------------------------------------------------------------

-- Perfis administrativos vinculados ao Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'pending' CHECK (role IN ('admin', 'editor', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Editorias / Categorias de notícias
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#05226B' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  display_order integer NOT NULL DEFAULT 0,
  show_in_menu boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Matérias / Notícias do Portal
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  subtitle text NOT NULL,
  content text NOT NULL,
  cover_image text NOT NULL,
  cover_alt text NOT NULL,
  image_caption text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  author_name text NOT NULL,
  author_role text NOT NULL DEFAULT 'Redação',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  is_hero boolean NOT NULL DEFAULT false,
  is_breaking boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  views bigint NOT NULL DEFAULT 0 CHECK (views >= 0),
  reading_time_minutes integer NOT NULL DEFAULT 1 CHECK (reading_time_minutes >= 1),
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Banners Institucionais / Publicidade gerenciados pelo Painel Admin
CREATE TABLE IF NOT EXISTS public.ad_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser text NOT NULL,
  headline text NOT NULL,
  subheadline text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'Saiba mais',
  badge_text text NOT NULL DEFAULT 'Publicidade Institucional',
  href text NOT NULL,
  variant text NOT NULL DEFAULT 'rectangle' CHECK (variant IN ('leaderboard', 'rectangle', 'sidebar')),
  theme text NOT NULL DEFAULT 'salvador-blue' CHECK (theme IN ('salvador-blue', 'agro-green', 'commerce-gold', 'institutional-navy')),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inscritos da Newsletter ("Plantão BA Infoco")
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. ÍNDICES DE PERFORMANCE PARA CORE WEB VITALS E CONSULTAS DO PORTAL
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_categories_order
  ON public.categories (display_order ASC, name ASC);

CREATE INDEX IF NOT EXISTS idx_articles_status_published
  ON public.articles (status, published_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_category_status
  ON public.articles (category_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_views
  ON public.articles (status, views DESC, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_breaking
  ON public.articles (status, is_breaking, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_tags_gin
  ON public.articles USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_ad_banners_active_order
  ON public.ad_banners (is_active, display_order ASC);

-- ----------------------------------------------------------------------------
-- 3. FUNÇÕES DE SEGURANÇA, TRIGGERS E RPCs
-- ----------------------------------------------------------------------------

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_articles_updated_at ON public.articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_ad_banners_updated_at ON public.ad_banners;
CREATE TRIGGER trg_ad_banners_updated_at
  BEFORE UPDATE ON public.ad_banners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Garante atomicamente que apenas uma matéria seja Manchete Principal (Hero)
CREATE OR REPLACE FUNCTION public.ensure_single_hero_article()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_hero = true AND pg_trigger_depth() = 1 THEN
    UPDATE public.articles
       SET is_hero = false
     WHERE is_hero = true
       AND id IS DISTINCT FROM NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_articles_single_hero ON public.articles;
CREATE TRIGGER trg_articles_single_hero
  BEFORE INSERT OR UPDATE OF is_hero ON public.articles
  FOR EACH ROW
  WHEN (NEW.is_hero = true)
  EXECUTE FUNCTION public.ensure_single_hero_article();

-- Verifica se o usuário autenticado é administrador ou editor autorizado
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.admin_profiles
     WHERE id = auth.uid()
       AND role IN ('admin', 'editor')
  );
$$;

-- Bootstrap automático: o primeiro usuário criado no Supabase Auth vira 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE role = 'admin'
  ) INTO v_has_admin;

  INSERT INTO public.admin_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrador'),
    CASE WHEN NOT v_has_admin THEN 'admin' ELSE 'pending' END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill caso algum usuário já tenha sido criado antes da execução deste SQL
INSERT INTO public.admin_profiles (id, email, full_name, role)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', 'Administrador'),
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at ASC) = 1
      AND NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE role = 'admin')
    THEN 'admin'
    ELSE 'pending'
  END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Incrementa visualizações de matéria publicada sem liberar UPDATE público na tabela
CREATE OR REPLACE FUNCTION public.increment_article_views(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles
     SET views = views + 1
   WHERE slug = p_slug
     AND status = 'published';
END;
$$;

-- Retorna métricas consolidadas do portal (rascunhos/inscritos apenas para admins)
CREATE OR REPLACE FUNCTION public.get_portal_stats()
RETURNS TABLE (
  total_articles bigint,
  published_articles bigint,
  draft_articles bigint,
  breaking_articles bigint,
  total_views bigint,
  total_categories bigint,
  total_banners bigint,
  total_subscribers bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN public.is_admin() OR auth.role() = 'service_role'
      THEN (SELECT COUNT(*) FROM public.articles)
      ELSE (SELECT COUNT(*) FROM public.articles WHERE status = 'published')
    END AS total_articles,
    (SELECT COUNT(*) FROM public.articles WHERE status = 'published') AS published_articles,
    CASE WHEN public.is_admin() OR auth.role() = 'service_role'
      THEN (SELECT COUNT(*) FROM public.articles WHERE status = 'draft')
      ELSE 0::bigint
    END AS draft_articles,
    (SELECT COUNT(*) FROM public.articles WHERE status = 'published' AND is_breaking = true) AS breaking_articles,
    COALESCE((SELECT SUM(views) FROM public.articles WHERE status = 'published'), 0)::bigint AS total_views,
    (SELECT COUNT(*) FROM public.categories) AS total_categories,
    (SELECT COUNT(*) FROM public.ad_banners) AS total_banners,
    CASE WHEN public.is_admin() OR auth.role() = 'service_role'
      THEN (SELECT COUNT(*) FROM public.newsletter_subscribers WHERE status = 'active')
      ELSE 0::bigint
    END AS total_subscribers;
$$;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) E PERMISSÕES
-- ----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.categories, public.articles, public.ad_banners TO anon, authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.categories, public.articles, public.ad_banners, public.newsletter_subscribers, public.admin_profiles TO authenticated;

GRANT EXECUTE ON FUNCTION public.increment_article_views(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies: admin_profiles
DROP POLICY IF EXISTS "admin_profiles_select_own_or_admin" ON public.admin_profiles;
CREATE POLICY "admin_profiles_select_own_or_admin"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "admin_profiles_update_admin" ON public.admin_profiles;
CREATE POLICY "admin_profiles_update_admin"
  ON public.admin_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policies: categories
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete"
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Policies: articles
DROP POLICY IF EXISTS "articles_public_read_published_or_admin" ON public.articles;
CREATE POLICY "articles_public_read_published_or_admin"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "articles_admin_insert" ON public.articles;
CREATE POLICY "articles_admin_insert"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "articles_admin_update" ON public.articles;
CREATE POLICY "articles_admin_update"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "articles_admin_delete" ON public.articles;
CREATE POLICY "articles_admin_delete"
  ON public.articles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Policies: ad_banners
DROP POLICY IF EXISTS "ad_banners_public_read_active_or_admin" ON public.ad_banners;
CREATE POLICY "ad_banners_public_read_active_or_admin"
  ON public.ad_banners FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "ad_banners_admin_insert" ON public.ad_banners;
CREATE POLICY "ad_banners_admin_insert"
  ON public.ad_banners FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ad_banners_admin_update" ON public.ad_banners;
CREATE POLICY "ad_banners_admin_update"
  ON public.ad_banners FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ad_banners_admin_delete" ON public.ad_banners;
CREATE POLICY "ad_banners_admin_delete"
  ON public.ad_banners FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Policies: newsletter_subscribers
DROP POLICY IF EXISTS "newsletter_public_subscribe" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_public_subscribe"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

DROP POLICY IF EXISTS "newsletter_admin_read" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_read"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "newsletter_admin_delete" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_delete"
  ON public.newsletter_subscribers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. SUPABASE STORAGE BUCKET PARA UPLOAD DE IMAGENS (news-media)
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-media',
  'news-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "ba_infoco_news_media_public_read" ON storage.objects;
CREATE POLICY "ba_infoco_news_media_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'news-media');

DROP POLICY IF EXISTS "ba_infoco_news_media_admin_insert" ON storage.objects;
CREATE POLICY "ba_infoco_news_media_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news-media' AND public.is_admin());

DROP POLICY IF EXISTS "ba_infoco_news_media_admin_update" ON storage.objects;
CREATE POLICY "ba_infoco_news_media_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'news-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'news-media' AND public.is_admin());

DROP POLICY IF EXISTS "ba_infoco_news_media_admin_delete" ON storage.objects;
CREATE POLICY "ba_infoco_news_media_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'news-media' AND public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. SEED INICIAL IDEMPOTENTE (13 EDITORIAS, 12 NOTÍCIAS E 3 BANNERS)
-- ----------------------------------------------------------------------------

INSERT INTO public.categories (name, slug, description, color, display_order, show_in_menu)
VALUES
  ('Agricultura', 'agricultura', 'Safra baiana, agronegócio, exportações e inovações no campo.', '#15803D', 1, true),
  ('Animais', 'animais', 'Bem-estar animal, fauna silvestre e campanhas de adoção na Bahia.', '#0F766E', 2, true),
  ('Bahia', 'bahia', 'Notícias de Salvador, Região Metropolitana e interior do estado.', '#05226B', 3, true),
  ('Brasil', 'brasil', 'Política nacional, programas sociais e decisões de Brasília.', '#1D4ED8', 4, true),
  ('Cultura', 'cultura', 'Agenda cultural, patrimônio histórico, música e artes da Bahia.', '#7E22CE', 5, true),
  ('Economia', 'economia', 'Mercado, indústria, portos, comércio e finanças pessoais.', '#B45309', 6, true),
  ('Entretenimento', 'entretenimento', 'Cinema, streaming, festivais e programação de lazer.', '#BE185D', 7, true),
  ('Esportes', 'esportes', 'Futebol baiano, Brasileirão, Seleção e modalidades olímpicas.', '#C80A14', 8, true),
  ('Famosos', 'famosos', 'Bastidores da TV, celebridades e eventos pelo Brasil.', '#DB2777', 9, true),
  ('Hotelaria', 'hotelaria', 'Turismo, rede hoteleira, resorts e ocupação no litoral baiano.', '#0369A1', 10, true),
  ('Meio Ambiente', 'meio-ambiente', 'Sustentabilidade, preservação costeira e energias limpas.', '#166534', 11, true),
  ('Mundo', 'mundo', 'Geopolítica, tecnologia global e principais fatos internacionais.', '#334155', 12, true),
  ('Polícia', 'policia', 'Segurança pública, operações integradas e trânsito nas rodovias.', '#991B1B', 13, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (
  title, slug, subtitle, content, cover_image, cover_alt, image_caption,
  category_id, author_name, author_role, status, is_hero, is_breaking, is_featured,
  tags, views, reading_time_minutes, published_at
)
VALUES
  (
    'Galvão Bueno critica mudanças na comissão técnica e cobra planejamento para a Seleção Brasileira',
    'galvao-bueno-critica-mudancas-na-comissao-tecnica-e-cobra-planejamento-para-a-selecao-brasileira',
    'Narrador analisou o momento do futebol nacional durante transmissão ao vivo e defendeu continuidade nos projetos de base antes das eliminatórias.',
    E'Durante participação em programa esportivo nesta noite, o narrador Galvão Bueno voltou a comentar os rumos da Seleção Brasileira e as recentes demissões no comando técnico do futebol nacional.\n\nSegundo o comunicador, a constante troca de treinadores compromete a construção de uma identidade tática sólida. "Não se constrói uma seleção competitiva trocando de comando a cada seis meses. É preciso respaldo, método e observação real dos campeonatos regionais e do Brasileirão", afirmou.\n\nA declaração repercutiu rapidamente entre dirigentes, ex-jogadores e torcedores nas redes sociais. Analistas destacam que os próximos compromissos da equipe exigirão convocação equilibrada entre atletas que atuam na Europa e destaques do futebol brasileiro, incluindo nomes que brilham nos clubes nordestinos.\n\nA Confederação deve anunciar o calendário de preparação até o fim da semana, com jogos amistosos previstos para o próximo trimestre.',
    '/images/news/hero-esportes.jpg',
    'Comentarista esportivo brasileiro em estúdio de televisão com painéis de estádio ao fundo',
    'Transmissão ao vivo analisou os bastidores da Seleção. Foto: Divulgação',
    (SELECT id FROM public.categories WHERE slug = 'esportes'),
    'Rafael Santana',
    'Editor de Esportes',
    'published',
    true,
    false,
    false,
    ARRAY['Futebol', 'Seleção Brasileira', 'Esportes', 'Bastidores'],
    18420,
    2,
    now() - interval '1 hour'
  ),
  (
    'Gás do Povo é prorrogado até 2031; veja quem terá direito ao benefício e como consultar',
    'gas-do-povo-e-prorrogado-ate-2031-veja-quem-tera-direito-ao-beneficio-e-como-consultar',
    'Medida garante subsídio integral do botijão de 13 kg para famílias inscritas no CadÚnico e amplia rede de revendas credenciadas na Bahia.',
    E'O governo federal confirmou a prorrogação do programa Gás do Povo até dezembro de 2031, assegurando previsibilidade orçamentária para milhões de famílias em situação de vulnerabilidade social em todo o país.\n\nNa Bahia, mais de 1,4 milhão de lares já utilizam o benefício diretamente nas distribuidoras credenciadas por meio de aplicativo oficial ou cartão vinculado ao Cadastro Único (CadÚnico).\n\nPara manter o auxílio ativo, os beneficiários devem manter a inscrição atualizada nos Centros de Referência de Assistência Social (CRAS) do município, especialmente em casos de mudança de endereço ou alteração na composição familiar.\n\nA nova portaria também simplifica o credenciamento de pequenas revendedoras nos municípios do interior baiano, reduzindo o deslocamento dos moradores das zonas rurais.',
    '/images/news/brasil-gas.jpg',
    'Fileiras de botijões de gás residenciais azuis e prateados organizados em distribuidora autorizada',
    'Programa atende mais de 1,4 milhão de famílias na Bahia. Foto: Agência Brasil',
    (SELECT id FROM public.categories WHERE slug = 'brasil'),
    'Mariana Oliveira',
    'Correspondente Nacional',
    'published',
    false,
    true,
    true,
    ARRAY['Brasil', 'Gás do Povo', 'Economia Popular', 'CadÚnico'],
    14950,
    2,
    now() - interval '2 hours'
  ),
  (
    'Sistema Ferry-Boat amplia horários e registra fluxo intenso na travessia Salvador–Itaparica',
    'sistema-ferry-boat-amplia-horarios-e-registra-fluxo-intenso-na-travessia-salvador-itaparica',
    'Operação especial conta com seis embarcações simultâneas na Baía de Todos-os-Santos e monitoramento digital de filas nos terminais.',
    E'A travessia marítima entre Salvador e a Ilha de Itaparica opera com esquema reforçado a partir desta semana para atender ao aumento de passageiros entre a capital baiana e o Recôncavo.\n\nDe acordo com a concessionária responsável pelos terminais de São Joaquim e Bom Despacho, seis embarcações estão em operação contínua com saídas a cada 30 minutos nos horários de pico.\n\nOs passageiros também passaram a contar com painel atualizado em tempo real para acompanhar o tempo estimado de espera antes mesmo de chegar ao embarque. A recomendação para motoristas é priorizar a compra antecipada com hora marcada.\n\nEquipes da agência reguladora acompanham a operação e reforçaram a sinalização nos acessos rodoviários da BA-001.',
    '/images/news/bahia-ferry.jpg',
    'Ferry-boat de passageiros navegando pelas águas azuis da Baía de Todos-os-Santos em Salvador',
    'Embarcações operam com saídas a cada 30 minutos nos picos. Foto: Redação BA Infoco',
    (SELECT id FROM public.categories WHERE slug = 'bahia'),
    'Lucas Ferreira',
    'Repórter Salvador',
    'published',
    false,
    false,
    true,
    ARRAY['Bahia', 'Salvador', 'Ferry-Boat', 'Mobilidade'],
    11380,
    2,
    now() - interval '3 hours'
  ),
  (
    'Jornalistas que cobrem tecnologia e redes sociais têm contas suspensas após polêmica global',
    'jornalistas-que-cobrem-tecnologia-e-redes-sociais-tem-contas-suspensas-apos-polemica-global',
    'Entidades internacionais de imprensa cobram transparência nos critérios de moderação e impacto sobre a cobertura jornalística independente.',
    E'Uma onda de suspensões temporárias envolvendo perfis de repórteres especializados em tecnologia reacendeu o debate internacional sobre moderação algorítmica e liberdade de imprensa nas plataformas digitais.\n\nDe acordo com associações de jornalistas nos Estados Unidos e na Europa, ao menos doze profissionais tiveram suas contas restringidas sem aviso prévio detalhado após publicarem reportagens investigativas sobre infraestrutura de dados.\n\nEspecialistas em direito digital apontam que a dependência de canais proprietários reforça a importância de portais jornalísticos independentes, newsletters diretas e padrões abertos de distribuição de conteúdo.\n\nApós repercussão mundial, parte dos perfis começou a ser restabelecida sob revisão manual.',
    '/images/news/mundo-cameras.jpg',
    'Dois smartphones modernos lado a lado exibindo módulos triplos de câmeras em estúdio',
    'Debate sobre transparência digital ganha força global. Foto: Arquivo Tech',
    (SELECT id FROM public.categories WHERE slug = 'mundo'),
    'Camila Mendes',
    'Editora Internacional',
    'published',
    false,
    true,
    false,
    ARRAY['Mundo', 'Tecnologia', 'Imprensa', 'Redes Sociais'],
    9840,
    2,
    now() - interval '4 hours'
  ),
  (
    'Supercâmeras em 2026: comparativo testa sensores noturnos e zoom óptico nos novos flagships',
    'supercameras-em-2026-comparativo-testa-sensores-noturnos-e-zoom-optico-nos-novos-flagships',
    'Testes práticos em ambientes de baixa luminosidade revelam avanços expressivos em processamento computacional e fidelidade de cores.',
    E'A nova geração de smartphones topo de linha trouxe saltos significativos em fotografia móvel, especialmente na captura noturna e na estabilização óptica para gravações em 4K a 60 quadros por segundo.\n\nEm testes comparativos realizados em Salvador durante o pôr do sol e em ruas históricas com iluminação mista, os sensores de 1 polegada reduziram o ruído digital em até 40% em comparação aos modelos do ano anterior.\n\nOutro destaque ficou por conta das lentes periscópicas com zoom óptico de 5x, capazes de preservar nitidez mesmo em retratos à distância sem perda perceptível de detalhes.\n\nEspecialistas lembram, porém, que o pós-processamento equilibrado — evitando saturação excessiva — segue sendo o principal divisor entre câmeras profissionais e registros automatizados.',
    '/images/news/mundo-cameras.jpg',
    'Comparativo de sistemas avançados de câmeras em smartphones flagship sobre bancada de estúdio',
    'Sensores maiores ampliam alcance dinâmico em fotos noturnas. Foto: TechLab',
    (SELECT id FROM public.categories WHERE slug = 'mundo'),
    'Thiago Nogueira',
    'Colunista de Tecnologia',
    'published',
    false,
    true,
    false,
    ARRAY['Supercâmeras', 'Smartphones', 'Tecnologia', 'Review'],
    8710,
    2,
    now() - interval '5 hours'
  ),
  (
    'Oeste da Bahia projeta safra recorde de grãos com avanço de agricultura de precisão',
    'oeste-da-bahia-projeta-safra-recorde-de-graos-com-avanco-de-agricultura-de-precisao',
    'Municípios como Luís Eduardo Magalhães e Barreiras lideram investimentos em telemetria de colheitadeiras e irrigação sustentável.',
    E'Produtores do Oeste baiano projetam um crescimento superior a 7% no volume total de grãos colhidos nesta temporada, impulsionados por condições climáticas regulares e pela adoção acelerada de ferramentas de agricultura de precisão.\n\nEm propriedades de Luís Eduardo Magalhães e Barreiras, sensores instalados nas colheitadeiras mapeiam em tempo real a produtividade por metro quadrado, permitindo ajuste fino na aplicação de fertilizantes e economia de insumos.\n\nSegundo levantamento das associações rurais do estado, o escoamento pela Ferrovia de Integração Oeste-Leste e pelos corredores rodoviários rumo ao Porto de Salvador deve bater recorde histórico neste semestre.\n\nO setor também amplia parcerias técnicas para preservação de nascentes do cerrado baiano.',
    '/images/news/agro-bahia.jpg',
    'Colheitadeira moderna realizando colheita em plantação dourada de soja no Oeste da Bahia',
    'Tecnologia no campo eleva produtividade no Oeste baiano. Foto: AgroBA',
    (SELECT id FROM public.categories WHERE slug = 'agricultura'),
    'Eduardo Carvalho',
    'Editor de Agronegócio',
    'published',
    false,
    false,
    false,
    ARRAY['Agricultura', 'Oeste Baiano', 'Soja', 'Safra'],
    7420,
    2,
    now() - interval '6 hours'
  ),
  (
    'Festival de Cultura e Economia Criativa leva programação gratuita ao Pelourinho neste fim de semana',
    'festival-de-cultura-e-economia-criativa-leva-programacao-gratuita-ao-pelourinho-neste-fim-de-semana',
    'Largo Tereza Batista e praças do Centro Histórico recebem apresentações musicais, feiras de artesanato e oficinas de gastronomia baiana.',
    E'O Centro Histórico de Salvador será palco, entre sexta-feira e domingo, de mais uma edição do Festival de Cultura e Economia Criativa do Pelourinho, reunindo artistas independentes, mestres da percussão e coletivos de gastronomia regional.\n\nA programação inclui cortejos culturais a partir das 16h, exposições fotográficas em casarões restaurados e feira de economia solidária com mais de 60 empreendedores locais.\n\nDe acordo com a organização, a expectativa é atrair cerca de 35 mil visitantes ao longo dos três dias, fortalecendo a rede hoteleira, bares e restaurantes do Centro Antigo.\n\nO transporte público terá reforço de linhas noturnas saindo da Estação da Lapa e do Terminal da Barroquinha.',
    '/images/news/cultura-salvador.jpg',
    'Casarões coloniais coloridos do Pelourinho em Salvador com bandeirolas festivas sob luz dourada',
    'Centro Histórico recebe programação aberta ao público. Foto: Secult Divulgação',
    (SELECT id FROM public.categories WHERE slug = 'cultura'),
    'Ana Paula Lima',
    'Repórter de Cultura',
    'published',
    false,
    false,
    false,
    ARRAY['Cultura', 'Pelourinho', 'Salvador', 'Agenda Cultural'],
    6890,
    2,
    now() - interval '8 hours'
  ),
  (
    'Porto de Salvador registra alta de 14% na movimentação de contêineres e impulsiona exportações',
    'porto-de-salvador-registra-alta-de-14-na-movimentacao-de-conteineres-e-impulsiona-exportacoes',
    'Crescimento nos embarques de frutas, celulose e manufaturados consolida terminal baiano como hub estratégico do Nordeste.',
    E'O Terminal de Contêineres do Porto de Salvador encerrou o trimestre com crescimento de 14% na movimentação de cargas em comparação ao mesmo período do ano passado, puxado pelas exportações do agronegócio e da indústria petroquímica.\n\nOs novos guindastes de grande porte e a ampliação da profundidade do canal de acesso permitiram a atracação simultânea de navios de maior capacidade, reduzindo o tempo médio de espera das embarcações.\n\nEconomistas avaliam que a eficiência portuária tem efeito multiplicador sobre a geração de empregos na logística, transporte rodoviário e serviços especializados na Região Metropolitana de Salvador.',
    '/images/news/economia-porto.jpg',
    'Terminal de contêineres do Porto de Salvador com navios cargueiros e guindastes ao entardecer',
    'Movimentação portuária impulsiona cadeias produtivas da Bahia. Foto: PortoBA',
    (SELECT id FROM public.categories WHERE slug = 'economia'),
    'Henrique Vasconcelos',
    'Editor de Economia',
    'published',
    false,
    false,
    false,
    ARRAY['Economia', 'Porto de Salvador', 'Exportações', 'Logística'],
    6150,
    1,
    now() - interval '10 hours'
  ),
  (
    'Operação integrada reforça policiamento preventivo e fiscalização nas rodovias baianas',
    'operacao-integrada-reforca-policiamento-preventivo-e-fiscalizacao-nas-rodovias-baianas',
    'Ação reúne efetivos especializados em pontos estratégicos da BR-324, BR-116 e vias litorâneas durante o fim de semana.',
    E'As forças de segurança da Bahia iniciaram uma nova etapa da operação integrada de policiamento ostensivo e fiscalização viária nos principais corredores de acesso à capital e ao interior do estado.\n\nCom apoio de videomonitoramento e leitura automática de placas, as equipes atuam de forma coordenada na BR-324, na BR-116 e na Estrada do Coco para coibir roubos de carga, transporte irregular e infrações graves de trânsito.\n\nSegundo balanço preliminar divulgado pela coordenação da operação, os primeiros dois dias já registraram redução significativa nos índices de ocorrências na Região Metropolitana.\n\nMotoristas podem acionar os canais de emergência pelos telefones 190 e 191 em qualquer trecho monitorado.',
    '/images/news/policia-bahia.jpg',
    'Viatura policial estadual em patrulhamento preventivo em avenida costeira da Bahia ao anoitecer',
    'Efetivo atua com apoio de câmeras inteligentes nas rodovias. Foto: SSP-BA',
    (SELECT id FROM public.categories WHERE slug = 'policia'),
    'Marcos Vinicius',
    'Setorista de Segurança',
    'published',
    false,
    false,
    false,
    ARRAY['Polícia', 'Segurança', 'BR-324', 'Bahia'],
    5430,
    2,
    now() - interval '12 hours'
  ),
  (
    'Ocupação hoteleira em Salvador e Litoral Norte supera 82% com calendário de eventos e turismo',
    'ocupacao-hoteleira-em-salvador-e-litoral-norte-supera-82-com-calendario-de-eventos-e-turismo',
    'Fluxo de visitantes nacionais e voos internacionais aquecem diárias e geram novas vagas temporárias no setor de serviços.',
    E'Levantamento da associação do setor hoteleiro aponta que a taxa média de ocupação em Salvador e nos resorts do Litoral Norte ultrapassou 82% neste mês, superando as projeções iniciais da temporada.\n\nO desempenho positivo é atribuído à ampliação da malha aérea no Aeroporto Internacional de Salvador e à agenda contínua de congressos corporativos, feiras e atrações culturais.\n\nEmpresários do ramo destacam que o turismo de negócios passou a preencher períodos tradicionalmente de menor demanda, garantindo maior estabilidade para trabalhadores do setor.',
    '/images/news/bahia-ferry.jpg',
    'Paisagem costeira de Salvador e Baía de Todos-os-Santos em tarde ensolarada',
    'Turismo corporativo e de lazer sustentam alta ocupação. Foto: Setur',
    (SELECT id FROM public.categories WHERE slug = 'hotelaria'),
    'Juliana Costa',
    'Redação BA Infoco',
    'published',
    false,
    false,
    false,
    ARRAY['Hotelaria', 'Turismo', 'Salvador', 'Litoral Norte'],
    4120,
    1,
    now() - interval '14 hours'
  ),
  (
    'Projeto de restauração da Mata Atlântica recupera mais de 400 hectares no Sul da Bahia',
    'projeto-de-restauracao-da-mata-atlantica-recupera-mais-de-400-hectares-no-sul-da-bahia',
    'Iniciativa une produtores de cacau cabruca, pesquisadores universitários e corredores ecológicos para proteção da fauna nativa.',
    E'Um consórcio ambiental formado por produtores rurais e institutos de pesquisa concluiu o plantio de 320 mil mudas nativas no Sul da Bahia, ampliando corredores ecológicos entre reservas de Mata Atlântica.\n\nO modelo combina conservação florestal com o cultivo tradicional de cacau no sistema cabruca, que mantém árvores de grande porte para sombreamento e preserva o habitat de espécies ameaçadas.\n\nAlém do ganho ambiental, o projeto certifica propriedades familiares para acesso a mercados internacionais com prêmio de sustentabilidade.',
    '/images/news/agro-bahia.jpg',
    'Paisagem agrícola sustentável no interior da Bahia sob céu azul',
    'Sistema cabruca concilia renda rural e preservação ambiental. Foto: Inema',
    (SELECT id FROM public.categories WHERE slug = 'meio-ambiente'),
    'Eduardo Carvalho',
    'Editor de Sustentabilidade',
    'published',
    false,
    false,
    false,
    ARRAY['Meio Ambiente', 'Mata Atlântica', 'Sul da Bahia', 'Cacau'],
    3680,
    1,
    now() - interval '18 hours'
  ),
  (
    'Campanha municipal de adoção responsável e vacinação animal abre novos postos em Salvador',
    'campanha-municipal-de-adocao-responsavel-e-vacinacao-animal-abre-novos-postos-em-salvador',
    'Atendimento gratuito inclui microchipagem, avaliação veterinária e feira de adoção de cães e gatos neste sábado.',
    E'Tutores de cães e gatos contarão com seis novos pontos itinerantes de vacinação antirrábica e cadastro gratuito para castração a partir deste fim de semana na capital baiana.\n\nA iniciativa também promove feiras de adoção responsável em parques públicos, com animais já vacinados, vermifugados e avaliados por médicos veterinários.\n\nPara adotar, o interessado deve apresentar documento de identidade com foto, comprovante de residência e passar por breve entrevista de orientação sobre guarda responsável.',
    '/images/news/cultura-salvador.jpg',
    'Espaço público arborizado em Salvador durante programação comunitária',
    'Feiras de adoção ocorrem em praças e parques da capital. Foto: Divulgação',
    (SELECT id FROM public.categories WHERE slug = 'animais'),
    'Mariana Oliveira',
    'Redação BA Infoco',
    'published',
    false,
    false,
    false,
    ARRAY['Animais', 'Adoção', 'Salvador', 'Bem-Estar'],
    2940,
    1,
    now() - interval '22 hours'
  )
ON CONFLICT (slug) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ad_banners) THEN
    INSERT INTO public.ad_banners (
      advertiser, headline, subheadline, cta_label, badge_text, href, variant, theme, is_active, display_order
    )
    VALUES
      (
        'Salvador Prefeitura',
        'E muito mais!',
        'Obras, mobilidade e serviços em toda a capital',
        'Conheça as ações',
        'Campanha Institucional',
        '/categoria/bahia',
        'leaderboard',
        'salvador-blue',
        true,
        1
      ),
      (
        'Salvador Prefeitura',
        'E muito mais!',
        'Voga',
        'Saiba mais',
        'Publicidade Institucional',
        '/categoria/bahia',
        'rectangle',
        'institutional-navy',
        true,
        2
      ),
      (
        'Agro Bahia Forte',
        'Energia que move o Oeste',
        'Safra 2026',
        'Confira o especial',
        'Informe Especial',
        '/categoria/agricultura',
        'rectangle',
        'agro-green',
        true,
        3
      );
  END IF;
END $$;

