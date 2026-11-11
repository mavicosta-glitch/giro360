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
import type { Category } from "@/domain/entities/category";
import type { CreateCategoryInput } from "@/domain/validation/schemas";
import { slugify } from "@/lib/formatters";

const COLOR_PRESETS = [
  "#05226B",
  "#C80A14",
  "#15803D",
  "#1D4ED8",
  "#7E22CE",
  "#B45309",
  "#0F766E",
  "#BE185D",
  "#334155",
];

interface CategoryManagerProps {
  categories: Category[];
  isMutating: boolean;
  onCreate: (payload: CreateCategoryInput) => Promise<void>;
  onUpdate: (
    payload: Partial<CreateCategoryInput> & { id: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryManager({
  categories,
  isMutating,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#05226B");
  const [displayOrder, setDisplayOrder] = useState(categories.length + 1);
  const [showInMenu, setShowInMenu] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setColor("#05226B");
    setDisplayOrder(categories.length + 1);
    setShowInMenu(true);
    setFormError(null);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setColor(cat.color);
    setDisplayOrder(cat.displayOrder);
    setShowInMenu(cat.showInMenu);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingId) {
        await onUpdate({
          id: editingId,
          name,
          slug: slug.trim() || undefined,
          description,
          color,
          displayOrder,
          showInMenu,
        });
      } else {
        await onCreate({
          name,
          slug: slug.trim() || undefined,
          description,
          color,
          displayOrder,
          showInMenu,
        });
      }
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Erro ao salvar editoria."
      );
    }
  };

  const handleDelete = async (id: string) => {
    setFormError(null);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Erro ao excluir editoria."
      );
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Formulário de Criação / Edição */}
      <section
        aria-labelledby="cat-form-heading"
        className="rounded-md border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2
            id="cat-form-heading"
            className="font-display text-base font-black text-[#05226B]"
          >
            {editingId ? "Editar Editoria" : "Nova Editoria"}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              htmlFor="cat-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Nome da Editoria *
            </label>
            <input
              id="cat-name"
              type="text"
              required
              minLength={2}
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tecnologia, Saúde, Carnaval"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="cat-slug"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Slug (URL amigável)
            </label>
            <input
              id="cat-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugify(name) || "gerado-automaticamente"}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="cat-desc"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Descrição (SEO)
            </label>
            <textarea
              id="cat-desc"
              rows={2}
              maxLength={240}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumo para meta description da página da editoria..."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cat-order"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Ordem no Menu
              </label>
              <input
                id="cat-order"
                type="number"
                min={0}
                max={999}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="cat-color"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Cor da Tag
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="cat-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                />
                <span className="font-mono text-xs text-slate-600">
                  {color}
                </span>
              </div>
            </div>
          </div>

          {/* Paleta Rápida */}
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={`Selecionar cor ${preset}`}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  color.toLowerCase() === preset.toLowerCase()
                    ? "border-slate-950 scale-110"
                    : "border-white shadow-xs"
                }`}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={showInMenu}
              onChange={(e) => setShowInMenu(e.target.checked)}
              className="h-4 w-4 accent-[#05226B]"
            />
            Exibir na barra superior de navegação
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
            {editingId ? "Salvar Editoria" : "Cadastrar Editoria"}
          </button>
        </form>
      </section>

      {/* Tabela de Categorias Cadastradas */}
      <section
        aria-labelledby="cat-list-heading"
        className="rounded-md border border-slate-200 bg-white shadow-2xs lg:col-span-8"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="cat-list-heading"
              className="font-display text-base font-black text-slate-900"
            >
              Editorias Cadastradas ({categories.length})
            </h2>
            <p className="text-xs text-slate-500">
              A ordem e a visibilidade refletem imediatamente na barra azul superior do portal.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Editoria</th>
                <th className="px-4 py-3">Matérias</th>
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">
                    #{cat.displayOrder}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-xs"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{cat.name}</p>
                        <p className="text-[11px] text-slate-500">
                          /categoria/{cat.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                    {cat.articleCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({ id: cat.id, showInMenu: !cat.showInMenu })
                      }
                      aria-label={
                        cat.showInMenu
                          ? `Ocultar ${cat.name} do menu`
                          : `Exibir ${cat.name} no menu`
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                        cat.showInMenu
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat.showInMenu ? (
                        <>
                          <Eye className="h-3 w-3" aria-hidden="true" />
                          Visível
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" aria-hidden="true" />
                          Oculta
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        aria-label={`Editar editoria ${cat.name}`}
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#05226B]"
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {confirmDeleteId === cat.id ? (
                        <div className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
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
                          onClick={() => setConfirmDeleteId(cat.id)}
                          aria-label={`Excluir editoria ${cat.name}`}
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

