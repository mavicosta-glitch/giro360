"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Crown,
  Edit3,
  ExternalLink,
  FolderTree,
  LayoutList,
  LogOut,
  Megaphone,
  Newspaper,
  Plus,
  Radio,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { Article } from "@/domain/entities/article";
import type { AdBannerData } from "@/domain/entities/banner";
import type { Category } from "@/domain/entities/category";
import type { NewsletterSubscriber } from "@/domain/entities/newsletter";
import type {
  CreateArticleInput,
  CreateBannerInput,
  CreateCategoryInput,
} from "@/domain/validation/schemas";
import {
  AdminStatsCards,
  type AdminStats,
} from "@/components/admin/AdminStatsCards";
import { ArticleFormModal } from "@/components/admin/ArticleFormModal";
import { BannerManager } from "@/components/admin/BannerManager";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { SubscriberManager } from "@/components/admin/SubscriberManager";
import { getContrastTextColor } from "@/lib/palette";
import { formatNumberPtBr, formatPtBrDateTime } from "@/lib/formatters";

interface AdminDashboardProps {
  initialArticles: Article[];
  initialCategories: Category[];
  initialBanners: AdBannerData[];
  initialSubscribers: NewsletterSubscriber[];
  initialStats: AdminStats;
  adminEmail?: string;
}

type ActiveTab = "articles" | "categories" | "banners" | "subscribers";

export function AdminDashboard({
  initialArticles,
  initialCategories,
  initialBanners,
  initialSubscribers,
  initialStats,
  adminEmail,
}: AdminDashboardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("articles");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const articlesQuery = useQuery<{ articles: Article[]; stats: AdminStats }>({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const res = await fetch(
        "/api/articles?status=all&limit=200&includeStats=true"
      );
      if (!res.ok) throw new Error("Falha ao carregar notícias.");
      return (await res.json()) as { articles: Article[]; stats: AdminStats };
    },
    initialData: { articles: initialArticles, stats: initialStats },
  });

  const categoriesQuery = useQuery<{ categories: Category[] }>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories?includeCounts=true");
      if (!res.ok) throw new Error("Falha ao carregar editorias.");
      return (await res.json()) as { categories: Category[] };
    },
    initialData: { categories: initialCategories },
  });

  const bannersQuery = useQuery<{ banners: AdBannerData[] }>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      if (!res.ok) throw new Error("Falha ao carregar banners.");
      return (await res.json()) as { banners: AdBannerData[] };
    },
    initialData: { banners: initialBanners },
  });

  const subscribersQuery = useQuery<{ subscribers: NewsletterSubscriber[] }>({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter");
      if (!res.ok) throw new Error("Falha ao carregar inscritos.");
      return (await res.json()) as { subscribers: NewsletterSubscriber[] };
    },
    initialData: { subscribers: initialSubscribers },
  });

  const articles = articlesQuery.data.articles;
  const stats = articlesQuery.data.stats;
  const categories = categoriesQuery.data.categories;
  const banners = bannersQuery.data.banners;
  const subscribers = subscribersQuery.data.subscribers;

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] }),
      queryClient.invalidateQueries({ queryKey: ["breaking-news-ticker"] }),
    ]);
    router.refresh();
  };

  const saveArticleMutation = useMutation({
    mutationFn: async (payload: CreateArticleInput & { id?: string }) => {
      const isEdit = Boolean(payload.id);
      const endpoint = isEdit
        ? `/api/articles/${payload.id}`
        : "/api/articles";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { article?: Article; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Erro ao salvar notícia.");
      }
      return json.article!;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      setModalOpen(false);
      setEditingArticle(null);
      setModalError(null);
      showToast(
        variables.id
          ? "Matéria atualizada com sucesso no Supabase!"
          : "Nova matéria publicada no portal!"
      );
    },
    onError: (err) => {
      setModalError(
        err instanceof Error ? err.message : "Erro ao salvar notícia."
      );
    },
  });

  const quickPatchArticleMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      patch: Record<string, unknown>;
      message: string;
    }) => {
      const res = await fetch(`/api/articles/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.patch),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Falha ao atualizar notícia.");
      }
      return payload.message;
    },
    onSuccess: async (message) => {
      await invalidateAll();
      showToast(message);
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao excluir notícia.");
    },
    onSuccess: async () => {
      setConfirmDeleteId(null);
      await invalidateAll();
      showToast("Notícia removida do Supabase.");
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: CreateCategoryInput) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar editoria.");
    },
    onSuccess: async () => {
      await invalidateAll();
      showToast("Nova editoria adicionada ao menu do portal!");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (
      payload: Partial<CreateCategoryInput> & { id: string }
    ) => {
      const res = await fetch(`/api/categories/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao atualizar editoria.");
    },
    onSuccess: async () => {
      await invalidateAll();
      showToast("Editoria atualizada com sucesso!");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao excluir editoria.");
    },
    onSuccess: async () => {
      await invalidateAll();
      showToast("Editoria removida com sucesso.");
    },
  });

  const createBannerMutation = useMutation({
    mutationFn: async (payload: CreateBannerInput) => {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar banner.");
    },
    onSuccess: async () => {
      await invalidateAll();
      showToast("Banner institucional cadastrado!");
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async (
      payload: Partial<CreateBannerInput> & { id: string }
    ) => {
      const res = await fetch(`/api/banners/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao atualizar banner.");
    },
    onSuccess: async () => {
      await invalidateAll();
      showToast("Banner atualizado!");
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao excluir banner.");
    },
    onSuccess: async () => {
      await invalidateAll();
      showToast("Banner removido.");
    },
  });

  const deleteSubscriberMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao remover inscrito.");
    },
    onSuccess: async () => {
      await invalidateAll();
      showToast("Inscrito removido da lista.");
    },
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((art) => {
      if (statusFilter !== "all" && art.status !== statusFilter) return false;
      if (categoryFilter !== "all" && art.categoryId !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        art.subtitle.toLowerCase().includes(q) ||
        art.authorName.toLowerCase().includes(q) ||
        art.categoryName.toLowerCase().includes(q)
      );
    });
  }, [articles, search, statusFilter, categoryFilter]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setModalError(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#EAF0F2] pb-16">
      <header className="border-b-2 border-[#D6A843] bg-white shadow-2xs">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#123B50]/20 bg-[#EAF0F2] px-3 py-1.5 text-xs font-bold text-[#123B50] transition hover:border-[#123B50] hover:bg-[#123B50] hover:text-[#D6A843]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Voltar ao Portal
            </Link>
            <div>
              <h1 className="font-display text-lg font-black text-[#123B50] sm:text-xl">
                Painel Administrativo — BA Infoco
              </h1>
              <p className="text-xs text-[#263746]/70">
                Conectado ao Supabase PostgreSQL & Storage
                {adminEmail ? ` • ${adminEmail}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#123B50]/20 bg-white px-3 py-2 text-xs font-bold text-[#263746] transition hover:bg-[#EAF0F2] hover:text-[#123B50]"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Abrir Capa
            </Link>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#D6A843] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#123B50] shadow-xs transition hover:bg-[#C29534]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova Notícia
            </button>
            {adminEmail && (
              <button
                type="button"
                onClick={handleLogout}
                title="Encerrar sessão administrativa"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#123B50]/20 bg-white px-3 py-2 text-xs font-bold text-[#263746] hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-[1280px] space-y-6 px-4 sm:px-6">
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-md border border-[#D6A843] bg-[#123B50] px-4 py-3 text-sm font-semibold text-white shadow-xs"
          >
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-[#D6A843]"
              aria-hidden="true"
            />
            <span>{toast}</span>
          </div>
        )}

        <AdminStatsCards stats={stats} />

        <div
          role="tablist"
          aria-label="Seções do painel administrativo"
          className="flex flex-wrap items-center gap-2 border-b border-[#123B50]/15 pb-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "articles"}
            onClick={() => setActiveTab("articles")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
              activeTab === "articles"
                ? "bg-[#123B50] text-[#D6A843] shadow-xs"
                : "bg-white text-[#263746] hover:bg-white/80 hover:text-[#123B50]"
            }`}
          >
            <Newspaper className="h-4 w-4" aria-hidden="true" />
            Notícias ({articles.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "categories"}
            onClick={() => setActiveTab("categories")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
              activeTab === "categories"
                ? "bg-[#123B50] text-[#D6A843] shadow-xs"
                : "bg-white text-[#263746] hover:bg-white/80 hover:text-[#123B50]"
            }`}
          >
            <FolderTree className="h-4 w-4" aria-hidden="true" />
            Editorias ({categories.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "banners"}
            onClick={() => setActiveTab("banners")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
              activeTab === "banners"
                ? "bg-[#123B50] text-[#D6A843] shadow-xs"
                : "bg-white text-[#263746] hover:bg-white/80 hover:text-[#123B50]"
            }`}
          >
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            Banners ({banners.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "subscribers"}
            onClick={() => setActiveTab("subscribers")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
              activeTab === "subscribers"
                ? "bg-[#123B50] text-[#D6A843] shadow-xs"
                : "bg-white text-[#263746] hover:bg-white/80 hover:text-[#123B50]"
            }`}
          >
            <BellRing className="h-4 w-4" aria-hidden="true" />
            Inscritos ({subscribers.length})
          </button>
        </div>

        {activeTab === "articles" && (
          <section
            aria-label="Listagem e gerenciamento de notícias"
            className="rounded-md border border-[#123B50]/15 bg-white shadow-2xs"
          >
            <div className="flex flex-col gap-3 border-b border-[#123B50]/15 p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por manchete, autor ou editoria..."
                  aria-label="Filtrar notícias no painel"
                  className="w-full rounded-md border border-[#123B50]/20 py-2 pl-9 pr-3 text-sm text-[#263746] focus:border-[#123B50] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrar por editoria"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-md border border-[#123B50]/20 bg-white px-3 py-2 text-xs font-semibold text-[#263746] focus:border-[#123B50] focus:outline-none"
                >
                  <option value="all">Todas as Editorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filtrar por status"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "published" | "draft"
                    )
                  }
                  className="rounded-md border border-[#123B50]/20 bg-white px-3 py-2 text-xs font-semibold text-[#263746] focus:border-[#123B50] focus:outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="published">Publicadas</option>
                  <option value="draft">Rascunhos</option>
                </select>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <LayoutList
                  className="h-10 w-10 text-slate-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  Nenhuma matéria encontrada para os filtros selecionados.
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#123B50] px-4 py-2 text-xs font-bold text-white hover:bg-[#263746]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Criar Primeira Notícia
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#123B50]/15 bg-[#EAF0F2] text-[11px] font-bold uppercase tracking-wider text-[#123B50]">
                    <tr>
                      <th className="px-4 py-3">Matéria</th>
                      <th className="px-4 py-3">Editoria</th>
                      <th className="px-4 py-3">Destaques na Capa</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Leituras</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAF0F2]">
                    {filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-[#EAF0F2]/55">
                        <td className="max-w-md px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xs border border-[#123B50]/15 bg-[#EAF0F2]">
                              <Image
                                src={art.coverImage}
                                alt={art.coverAlt}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 font-display text-sm font-bold text-[#123B50]">
                                {art.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Por {art.authorName} •{" "}
                                {formatPtBrDateTime(art.publishedAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="inline-block rounded-xs px-2 py-0.5 text-[11px] font-extrabold uppercase"
                            style={{
                              backgroundColor: art.categoryColor || "#123B50",
                              color: getContrastTextColor(
                                art.categoryColor || "#123B50"
                              ),
                            }}
                          >
                            {art.categoryName}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                quickPatchArticleMutation.mutate({
                                  id: art.id,
                                  patch: { isHero: !art.isHero },
                                  message: !art.isHero
                                    ? `"${art.title}" definida como Manchete Principal (Hero)!`
                                    : "Destaque Hero removido.",
                                })
                              }
                              title="Definir como Manchete Principal (Hero)"
                              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold transition ${
                                art.isHero
                                  ? "border-[#123B50] bg-[#123B50] text-[#D6A843]"
                                  : "border-[#123B50]/20 bg-white text-[#263746] hover:border-[#123B50] hover:text-[#123B50]"
                              }`}
                            >
                              <Crown className="h-3 w-3" aria-hidden="true" />
                              Hero
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                quickPatchArticleMutation.mutate({
                                  id: art.id,
                                  patch: { isBreaking: !art.isBreaking },
                                  message: !art.isBreaking
                                    ? "Adicionada ao Ticker de Destaques!"
                                    : "Removida do Ticker de Destaques.",
                                })
                              }
                              title="Alternar no Ticker de Destaques"
                              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold transition ${
                                art.isBreaking
                                  ? "border-[#D6A843] bg-[#D6A843] text-[#123B50]"
                                  : "border-[#123B50]/20 bg-white text-[#263746] hover:border-[#D6A843] hover:text-[#123B50]"
                              }`}
                            >
                              <Radio className="h-3 w-3" aria-hidden="true" />
                              Ticker
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                quickPatchArticleMutation.mutate({
                                  id: art.id,
                                  patch: { isFeatured: !art.isFeatured },
                                  message: !art.isFeatured
                                    ? "Adicionada à coluna secundária!"
                                    : "Removida da coluna secundária.",
                                })
                              }
                              title="Alternar na Coluna Secundária"
                              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold transition ${
                                art.isFeatured
                                  ? "border-[#263746] bg-[#263746] text-white"
                                  : "border-[#123B50]/20 bg-white text-[#263746] hover:border-[#263746] hover:text-[#123B50]"
                              }`}
                            >
                              <Star className="h-3 w-3" aria-hidden="true" />
                              Lateral
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              quickPatchArticleMutation.mutate({
                                id: art.id,
                                patch: {
                                  status:
                                    art.status === "published"
                                      ? "draft"
                                      : "published",
                                },
                                message:
                                  art.status === "published"
                                    ? "Matéria movida para rascunho."
                                    : "Matéria publicada!",
                              })
                            }
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                              art.status === "published"
                                ? "bg-[#123B50] text-white hover:bg-[#263746]"
                                : "bg-[#EAF0F2] text-[#263746] hover:bg-[#D6A843]/30"
                            }`}
                          >
                            {art.status === "published"
                              ? "Publicada"
                              : "Rascunho"}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-xs font-semibold text-[#263746] whitespace-nowrap">
                          {formatNumberPtBr(art.views)}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {art.status === "published" && (
                              <Link
                                href={`/noticia/${art.slug}`}
                                target="_blank"
                                aria-label={`Visualizar ${art.title} no portal`}
                                className="rounded p-1.5 text-[#263746]/70 hover:bg-[#EAF0F2] hover:text-[#123B50]"
                              >
                                <ExternalLink
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => openEditModal(art)}
                              aria-label={`Editar ${art.title}`}
                              className="rounded p-1.5 text-[#263746] hover:bg-[#EAF0F2] hover:text-[#123B50]"
                            >
                              <Edit3 className="h-4 w-4" aria-hidden="true" />
                            </button>

                            {confirmDeleteId === art.id ? (
                              <div className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteArticleMutation.mutate(art.id)
                                  }
                                  className="text-[11px] font-bold text-red-700 hover:underline"
                                >
                                  Excluir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[11px] text-slate-600 hover:underline"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(art.id)}
                                aria-label={`Excluir ${art.title}`}
                                className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "categories" && (
          <CategoryManager
            categories={categories}
            isMutating={
              createCategoryMutation.isPending ||
              updateCategoryMutation.isPending ||
              deleteCategoryMutation.isPending
            }
            onCreate={(payload) => createCategoryMutation.mutateAsync(payload)}
            onUpdate={(payload) => updateCategoryMutation.mutateAsync(payload)}
            onDelete={(id) => deleteCategoryMutation.mutateAsync(id)}
          />
        )}

        {activeTab === "banners" && (
          <BannerManager
            banners={banners}
            isMutating={
              createBannerMutation.isPending ||
              updateBannerMutation.isPending ||
              deleteBannerMutation.isPending
            }
            onCreate={(payload) => createBannerMutation.mutateAsync(payload)}
            onUpdate={(payload) => updateBannerMutation.mutateAsync(payload)}
            onDelete={(id) => deleteBannerMutation.mutateAsync(id)}
          />
        )}

        {activeTab === "subscribers" && (
          <SubscriberManager
            subscribers={subscribers}
            onDelete={(id) => deleteSubscriberMutation.mutateAsync(id)}
          />
        )}
      </main>

      {modalOpen && (
        <ArticleFormModal
          key={editingArticle?.id ?? "new-article"}
          article={editingArticle}
          categories={categories}
          isSubmitting={saveArticleMutation.isPending}
          errorMessage={modalError}
          onClose={() => {
            setModalOpen(false);
            setEditingArticle(null);
            setModalError(null);
          }}
          onSave={async (payload) => {
            setModalError(null);
            await saveArticleMutation.mutateAsync(payload);
          }}
        />
      )}
    </div>
  );
}
