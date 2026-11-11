import type {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "@/domain/entities/category";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  isMissingTableError,
  translateSupabaseError,
} from "@/infrastructure/supabase/client";
import { slugify } from "@/lib/formatters";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  display_order: number;
  show_in_menu: boolean;
  created_at: string;
  updated_at: string;
  articles?: Array<{ count: number }>;
}

function mapRowToCategory(row: CategoryRow): Category {
  const count = Array.isArray(row.articles)
    ? Number(row.articles[0]?.count ?? 0)
    : undefined;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    color: row.color || "#05226B",
    displayOrder: Number(row.display_order ?? 0),
    showInMenu: Boolean(row.show_in_menu),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    articleCount: count,
  };
}

export class CategoryRepository {
  async findAll(
    options?: { showInMenuOnly?: boolean; includeCounts?: boolean },
    accessToken?: string
  ): Promise<Category[]> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    const selectClause = options?.includeCounts ? "*, articles(count)" : "*";

    let query = client
      .from("categories")
      .select(selectClause)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (options?.showInMenuOnly) {
      query = query.eq("show_in_menu", true);
    }

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(
        translateSupabaseError(error, "Erro ao carregar editorias.")
      );
    }

    return ((data ?? []) as unknown as CategoryRow[]).map(mapRowToCategory);
  }

  async findById(id: string, accessToken?: string): Promise<Category | null> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(
        translateSupabaseError(error, "Erro ao buscar editoria por ID.")
      );
    }

    return data ? mapRowToCategory(data as unknown as CategoryRow) : null;
  }

  async findBySlug(
    slug: string,
    accessToken?: string
  ): Promise<Category | null> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    const { data, error } = await client
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(
        translateSupabaseError(error, "Erro ao buscar editoria por slug.")
      );
    }

    return data ? mapRowToCategory(data as unknown as CategoryRow) : null;
  }

  async create(
    dto: CreateCategoryDTO,
    accessToken?: string
  ): Promise<Category> {
    const client = createSupabaseAdminClient(accessToken);
    const baseSlug = slugify(dto.slug || dto.name);
    if (!baseSlug) {
      throw new Error("Não foi possível gerar um slug válido para a editoria.");
    }

    const existing = await this.findBySlug(baseSlug, accessToken);
    if (existing) {
      throw new Error(`Já existe uma editoria com o slug "${baseSlug}".`);
    }

    const { data, error } = await client
      .from("categories")
      .insert({
        name: dto.name.trim(),
        slug: baseSlug,
        description: (dto.description ?? "").trim(),
        color: dto.color || "#05226B",
        display_order: dto.displayOrder ?? 0,
        show_in_menu: dto.showInMenu ?? true,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        translateSupabaseError(error, "Falha ao criar editoria no Supabase.")
      );
    }

    return mapRowToCategory(data as unknown as CategoryRow);
  }

  async update(
    dto: UpdateCategoryDTO,
    accessToken?: string
  ): Promise<Category> {
    const client = createSupabaseAdminClient(accessToken);
    const existing = await this.findById(dto.id, accessToken);
    if (!existing) {
      throw new Error("Editoria não encontrada.");
    }

    const nextSlug =
      dto.slug !== undefined ? slugify(dto.slug) : existing.slug;
    if (!nextSlug) {
      throw new Error("Slug inválido para a editoria.");
    }

    if (nextSlug !== existing.slug) {
      const { data: conflict } = await client
        .from("categories")
        .select("id")
        .eq("slug", nextSlug)
        .neq("id", dto.id)
        .maybeSingle();

      if (conflict) {
        throw new Error(
          `O slug "${nextSlug}" já está em uso por outra editoria.`
        );
      }
    }

    const { data, error } = await client
      .from("categories")
      .update({
        name: dto.name !== undefined ? dto.name.trim() : existing.name,
        slug: nextSlug,
        description:
          dto.description !== undefined
            ? dto.description.trim()
            : existing.description,
        color: dto.color !== undefined ? dto.color : existing.color,
        display_order:
          dto.displayOrder !== undefined
            ? dto.displayOrder
            : existing.displayOrder,
        show_in_menu:
          dto.showInMenu !== undefined ? dto.showInMenu : existing.showInMenu,
      })
      .eq("id", dto.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        translateSupabaseError(error, "Falha ao atualizar editoria.")
      );
    }

    return mapRowToCategory(data as unknown as CategoryRow);
  }

  async delete(id: string, accessToken?: string): Promise<void> {
    const client = createSupabaseAdminClient(accessToken);
    const existing = await this.findById(id, accessToken);
    if (!existing) {
      throw new Error("Editoria não encontrada.");
    }

    const { count, error: countError } = await client
      .from("articles")
      .select("id", { count: "exact" })
      .eq("category_id", id)
      .limit(1);

    if (countError) {
      throw new Error(
        translateSupabaseError(countError, "Erro ao verificar matérias da editoria.")
      );
    }

    if ((count ?? 0) > 0) {
      throw new Error(
        `Não é possível excluir "${existing.name}" porque há ${count} matéria(s) vinculada(s). Mova ou exclua as matérias antes.`
      );
    }

    const { error } = await client.from("categories").delete().eq("id", id);
    if (error) {
      throw new Error(
        translateSupabaseError(error, "Erro ao excluir editoria.")
      );
    }
  }
}

export const categoryRepository = new CategoryRepository();
