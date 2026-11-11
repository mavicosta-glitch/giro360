"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Sparkles, Upload, X } from "lucide-react";
import type { Article, ArticleStatus } from "@/domain/entities/article";
import type { Category } from "@/domain/entities/category";
import type { CreateArticleInput } from "@/domain/validation/schemas";
import { estimateReadingTime, slugify } from "@/lib/formatters";

const GALLERY_PRESETS = [
  { label: "Esportes / Estádio", url: "/images/news/hero-esportes.jpg" },
  { label: "Brasil / Economia Doméstica", url: "/images/news/brasil-gas.jpg" },
  { label: "Salvador / Baía", url: "/images/news/bahia-ferry.jpg" },
  { label: "Economia / Porto", url: "/images/news/economia-porto.jpg" },
  { label: "Agro / Oeste BA", url: "/images/news/agro-bahia.jpg" },
  { label: "Cultura / Pelourinho", url: "/images/news/cultura-salvador.jpg" },
  { label: "Tech / Smartphones", url: "/images/news/mundo-cameras.jpg" },
  { label: "Segurança / Polícia", url: "/images/news/policia-bahia.jpg" },
];

interface ArticleFormModalProps {
  article?: Article | null;
  categories: Category[];
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSave: (payload: CreateArticleInput & { id?: string }) => Promise<void>;
}

export function ArticleFormModal({
  article,
  categories,
  isSubmitting,
  errorMessage,
  onClose,
  onSave,
}: ArticleFormModalProps) {
  const isEditing = Boolean(article);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [subtitle, setSubtitle] = useState(article?.subtitle ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [categoryId, setCategoryId] = useState(
    article?.categoryId ?? categories[0]?.id ?? ""
  );
  const [coverImage, setCoverImage] = useState(
    article?.coverImage ?? "/images/news/bahia-ferry.jpg"
  );
  const [coverAlt, setCoverAlt] = useState(article?.coverAlt ?? "");
  const [imageCaption, setImageCaption] = useState(article?.imageCaption ?? "");
  const [authorName, setAuthorName] = useState(
    article?.authorName ?? "Redação BA Infoco"
  );
  const [authorRole, setAuthorRole] = useState(
    article?.authorRole ?? "Redação"
  );
  const [status, setStatus] = useState<ArticleStatus>(
    article?.status ?? "published"
  );
  const [isHero, setIsHero] = useState(article?.isHero ?? false);
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking ?? false);
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured ?? false);
  const [tagsRaw, setTagsRaw] = useState(article?.tags.join(", ") ?? "");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const previewSlug = slug.trim() ? slugify(slug) : slugify(title);
  const readingTime = estimateReadingTime(content);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setUploadError(json.error ?? "Não foi possível enviar a imagem.");
        return;
      }
      setCoverImage(json.url);
    } catch {
      setUploadError("Erro de rede ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await onSave({
      id: article?.id,
      title,
      slug: slug.trim() || undefined,
      subtitle,
      content,
      coverImage,
      coverAlt: coverAlt.trim() || title.trim(),
      imageCaption,
      categoryId,
      authorName,
      authorRole,
      status,
      isHero,
      isBreaking,
      isFeatured,
      tags,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-xs sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#05226B] px-5 py-4 text-white">
          <div>
            <h2
              id="article-modal-title"
              className="font-display text-lg font-extrabold"
            >
              {isEditing ? "Editar Notícia" : "Nova Matéria Editorial"}
            </h2>
            <p className="text-xs text-white/80">
              Preencha os campos com foco em SEO, acessibilidade e clareza jornalística.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário de notícia"
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
        >
          {errorMessage && (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
            >
              {errorMessage}
            </div>
          )}

          {/* Manchete e Slug */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-8">
              <label
                htmlFor="article-title"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Manchete Principal *
              </label>
              <input
                id="article-title"
                type="text"
                required
                minLength={8}
                maxLength={180}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Porto de Salvador bate recorde de exportações no trimestre"
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="article-category"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Editoria (Categoria) *
              </label>
              <select
                id="article-category"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-7">
              <label
                htmlFor="article-subtitle"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Subtítulo / Linha Fina *
              </label>
              <textarea
                id="article-subtitle"
                required
                rows={2}
                minLength={10}
                maxLength={320}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Resumo objetivo que complementa a manchete e melhora o snippet de SEO."
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div className="md:col-span-5">
              <label
                htmlFor="article-slug"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Slug da URL (Opcional)
              </label>
              <input
                id="article-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="gerado-automaticamente"
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
              <p className="mt-1 truncate text-[11px] text-slate-500">
                URL: /noticia/
                <span className="font-semibold text-slate-700">
                  {previewSlug || "..."}
                </span>
              </p>
            </div>
          </div>

          {/* Imagem de Capa + Upload + Presets */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <ImagePlus className="h-4 w-4 text-[#05226B]" aria-hidden="true" />
                Imagem de Capa & Acessibilidade (SEO)
              </span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#05226B] bg-white px-3 py-1.5 text-xs font-bold text-[#05226B] transition hover:bg-[#05226B] hover:text-white">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{uploading ? "Enviando..." : "Enviar arquivo local"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {uploadError && (
              <p className="mt-2 text-xs font-semibold text-red-700">
                {uploadError}
              </p>
            )}

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="space-y-3 md:col-span-7">
                <div>
                  <label
                    htmlFor="article-cover-url"
                    className="block text-[11px] font-bold uppercase text-slate-600"
                  >
                    URL ou Caminho da Imagem *
                  </label>
                  <input
                    id="article-cover-url"
                    type="text"
                    required
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://... ou /images/news/..."
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#05226B] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="article-cover-alt"
                      className="block text-[11px] font-bold uppercase text-slate-600"
                    >
                      Texto Alternativo (ALT) *
                    </label>
                    <button
                      type="button"
                      onClick={() => title.trim() && setCoverAlt(title.trim())}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#05226B] hover:underline"
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Copiar da manchete
                    </button>
                  </div>
                  <input
                    id="article-cover-alt"
                    type="text"
                    required
                    minLength={5}
                    value={coverAlt}
                    onChange={(e) => setCoverAlt(e.target.value)}
                    placeholder="Descreva objetivamente o que aparece na foto"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#05226B] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="article-image-caption"
                    className="block text-[11px] font-bold uppercase text-slate-600"
                  >
                    Legenda / Crédito da Foto
                  </label>
                  <input
                    id="article-image-caption"
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Ex: Foto: Redação BA Infoco"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#05226B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-5">
                <p className="mb-1 text-[11px] font-bold uppercase text-slate-600">
                  Pré-visualização
                </p>
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-slate-300 bg-slate-200">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={coverAlt || "Pré-visualização da capa"}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {GALLERY_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCoverImage(preset.url)}
                      className={`rounded border px-2 py-0.5 text-[10px] font-semibold transition ${
                        coverImage === preset.url
                          ? "border-[#05226B] bg-[#05226B] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo da Matéria */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="article-content"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Corpo da Matéria *
              </label>
              <span className="text-[11px] font-medium text-slate-500">
                Tempo estimado de leitura: {readingTime} min
              </span>
            </div>
            <textarea
              id="article-content"
              required
              minLength={30}
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva os parágrafos da reportagem separados por linha em branco..."
              className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm leading-relaxed text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          {/* Autor, Tags, Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="article-author"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Autor *
              </label>
              <input
                id="article-author"
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="article-role"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Cargo / Editoria
              </label>
              <input
                id="article-role"
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="article-tags"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Tags (vírgula)
              </label>
              <input
                id="article-tags"
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="Bahia, Salvador, Economia"
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="article-status"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Status
              </label>
              <select
                id="article-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#05226B] focus:outline-none"
              >
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>
          </div>

          {/* Posicionamento Editorial */}
          <fieldset className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-700">
              Posicionamento na Capa do Portal
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-slate-200 bg-white p-3 hover:border-[#C80A14]">
                <input
                  type="checkbox"
                  checked={isHero}
                  onChange={(e) => setIsHero(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#C80A14]"
                />
                <span className="text-xs">
                  <strong className="block text-slate-900">
                    Manchete Principal (Hero)
                  </strong>
                  <span className="text-slate-500">
                    Destaque máximo no bloco vermelho principal.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-slate-200 bg-white p-3 hover:border-[#C80A14]">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#C80A14]"
                />
                <span className="text-xs">
                  <strong className="block text-slate-900">
                    Ticker &ldquo;Destaques&rdquo;
                  </strong>
                  <span className="text-slate-500">
                    Exibir na barra rotativa de últimas notícias.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-slate-200 bg-white p-3 hover:border-[#05226B]">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#05226B]"
                />
                <span className="text-xs">
                  <strong className="block text-slate-900">
                    Coluna Secundária
                  </strong>
                  <span className="text-slate-500">
                    Bloco de notícias recentes ao lado do Hero.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          {/* Ações do Modal */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="inline-flex items-center gap-2 rounded-md bg-[#05226B] px-5 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-[#082F8A] disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {isEditing ? "Salvar Alterações" : "Publicar Matéria"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

