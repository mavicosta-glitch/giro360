"use client";

import { useState } from "react";
import {
  Check,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type {
  AdBannerData,
  AdBannerTheme,
  AdBannerVariant,
} from "@/domain/entities/banner";
import type { CreateBannerInput } from "@/domain/validation/schemas";

interface BannerManagerProps {
  banners: AdBannerData[];
  isMutating: boolean;
  onCreate: (payload: CreateBannerInput) => Promise<void>;
  onUpdate: (
    payload: Partial<CreateBannerInput> & { id: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const THEME_LABELS: Record<AdBannerTheme, string> = {
  "salvador-blue": "Azul Salvador",
  "agro-green": "Verde Agro",
  "commerce-gold": "Grafite & Ouro",
  "institutional-navy": "Azul Marinho Institucional",
};

const VARIANT_LABELS: Record<AdBannerVariant, string> = {
  leaderboard: "Horizontal Topo (728x90)",
  rectangle: "Retangular Lateral (4:3)",
  sidebar: "Barra Lateral",
};

export function BannerManager({
  banners,
  isMutating,
  onCreate,
  onUpdate,
  onDelete,
}: BannerManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [advertiser, setAdvertiser] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [badgeText, setBadgeText] = useState("Publicidade Institucional");
  const [ctaLabel, setCtaLabel] = useState("Saiba mais");
  const [href, setHref] = useState("/categoria/bahia");
  const [variant, setVariant] = useState<AdBannerVariant>("rectangle");
  const [theme, setTheme] = useState<AdBannerTheme>("salvador-blue");
  const [displayOrder, setDisplayOrder] = useState(banners.length + 1);
  const [isActive, setIsActive] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setAdvertiser("");
    setHeadline("");
    setSubheadline("");
    setBadgeText("Publicidade Institucional");
    setCtaLabel("Saiba mais");
    setHref("/categoria/bahia");
    setVariant("rectangle");
    setTheme("salvador-blue");
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setFormError(null);
  };

  const startEdit = (b: AdBannerData) => {
    setEditingId(b.id);
    setAdvertiser(b.advertiser);
    setHeadline(b.headline);
    setSubheadline(b.subheadline ?? "");
    setBadgeText(b.badgeText ?? "Publicidade Institucional");
    setCtaLabel(b.ctaLabel ?? "Saiba mais");
    setHref(b.href);
    setVariant(b.variant);
    setTheme(b.theme);
    setDisplayOrder(b.displayOrder ?? 0);
    setIsActive(b.isActive ?? true);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload: CreateBannerInput = {
        advertiser,
        headline,
        subheadline,
        badgeText,
        ctaLabel,
        href,
        variant,
        theme,
        displayOrder,
        isActive,
      };
      if (editingId) {
        await onUpdate({ id: editingId, ...payload });
      } else {
        await onCreate(payload);
      }
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Erro ao salvar banner."
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="banner-form-heading"
        className="rounded-md border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2
            id="banner-form-heading"
            className="font-display text-base font-black text-[#05226B]"
          >
            {editingId ? "Editar Banner" : "Novo Banner Institucional"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="banner-advertiser"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Anunciante / Órgão *
            </label>
            <input
              id="banner-advertiser"
              type="text"
              required
              value={advertiser}
              onChange={(e) => setAdvertiser(e.target.value)}
              placeholder="Ex: Prefeitura de Salvador"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="banner-headline"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Chamada Principal *
            </label>
            <input
              id="banner-headline"
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ex: E muito mais!"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="banner-sub"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Subtítulo
            </label>
            <input
              id="banner-sub"
              type="text"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="Obras, mobilidade e serviços"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="banner-variant"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Formato
              </label>
              <select
                id="banner-variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value as AdBannerVariant)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#05226B] focus:outline-none"
              >
                <option value="leaderboard">Topo (Horizontal)</option>
                <option value="rectangle">Lateral (4:3)</option>
                <option value="sidebar">Lateral Compacto</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="banner-theme"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Tema Visual
              </label>
              <select
                id="banner-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as AdBannerTheme)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#05226B] focus:outline-none"
              >
                {Object.entries(THEME_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label
                htmlFor="banner-href"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Link de Destino *
              </label>
              <input
                id="banner-href"
                type="text"
                required
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/categoria/bahia"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="banner-order"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Ordem
              </label>
              <input
                id="banner-order"
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="banner-badge"
                className="block text-[11px] font-bold uppercase text-slate-600"
              >
                Selo Superior
              </label>
              <input
                id="banner-badge"
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="banner-cta"
                className="block text-[11px] font-bold uppercase text-slate-600"
              >
                Texto CTA
              </label>
              <input
                id="banner-cta"
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[#05226B]"
            />
            Banner ativo no portal
          </label>

          <button
            type="submit"
            disabled={isMutating}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#05226B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#082F8A] disabled:opacity-60"
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : editingId ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {editingId ? "Salvar Banner" : "Cadastrar Banner"}
          </button>
        </form>
      </section>

      <section
        aria-labelledby="banner-list-heading"
        className="rounded-md border border-slate-200 bg-white shadow-2xs lg:col-span-8"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2
            id="banner-list-heading"
            className="font-display text-base font-black text-slate-900"
          >
            Banners Cadastrados ({banners.length})
          </h2>
          <p className="text-xs text-slate-500">
            Controla o banner horizontal no topo e os blocos institucionais da barra lateral.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Anunciante & Chamada</th>
                <th className="px-4 py-3">Formato / Tema</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">
                    #{b.displayOrder ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-950">{b.advertiser}</p>
                    <p className="text-xs text-slate-600">
                      {b.headline}
                      {b.subheadline ? ` — ${b.subheadline}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400">{b.href}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    <p className="font-semibold">
                      {VARIANT_LABELS[b.variant]}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {THEME_LABELS[b.theme]}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({ id: b.id, isActive: !(b.isActive ?? true) })
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        b.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {b.isActive ? (
                        <>
                          <Eye className="h-3 w-3" aria-hidden="true" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" aria-hidden="true" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(b)}
                        aria-label={`Editar banner ${b.advertiser}`}
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#05226B]"
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {confirmDeleteId === b.id ? (
                        <div className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDelete(b.id);
                              setConfirmDeleteId(null);
                            }}
                            className="text-[11px] font-bold text-red-700 hover:underline"
                          >
                            Confirmar
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
                          onClick={() => setConfirmDeleteId(b.id)}
                          aria-label={`Excluir banner ${b.advertiser}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

