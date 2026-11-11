import crypto from "node:crypto";
import type {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "@/domain/entities/category";
import { getDb } from "@/infrastructure/db/client";
import { slugify } from "@/lib/formatters";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  display_order: number;
  show_in_menu: number;
  created_at: string;
  updated_at: string;
  article_count?: number;
}

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color,
    displayOrder: Number(row.display_order),
    showInMenu: Boolean(row.show_in_menu),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    articleCount:
      typeof row.article_count === "number" ? row.article_count : undefined,
  };
}

export class CategoryRepository {
  findAll(options?: {
    showInMenuOnly?: boolean;
    includeCounts?: boolean;
  }): Category[] {
    const db = getDb();
    const whereClause = options?.showInMenuOnly ? "WHERE c.show_in_menu = 1" : "";

    if (options?.includeCounts) {
      const stmt = db.prepare(`
        SELECT
          c.*,
          COUNT(a.id) AS article_count
        FROM categories c
        LEFT JOIN articles a ON a.category_id = c.id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.name ASC
      `);
      const rows = stmt.all() as unknown as CategoryRow[];
      return rows.map(mapRowToCategory);
    }

    const stmt = db.prepare(`
      SELECT c.*
      FROM categories c
      ${whereClause}
      ORDER BY c.display_order ASC, c.name ASC
    `);
    const rows = stmt.all() as unknown as CategoryRow[];
    return rows.map(mapRowToCategory);
  }

  findById(id: string): Category | null {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id) as unknown as CategoryRow | undefined;
    return row ? mapRowToCategory(row) : null;
  }

  findBySlug(slug: string): Category | null {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM categories WHERE slug = ?")
      .get(slug) as unknown as CategoryRow | undefined;
    return row ? mapRowToCategory(row) : null;
  }

  create(dto: CreateCategoryDTO): Category {
    const db = getDb();
    const now = new Date().toISOString();
    const baseSlug = slugify(dto.slug || dto.name);
    if (!baseSlug) {
      throw new Error("Não foi possível gerar um slug válido para a categoria.");
    }

    const existing = this.findBySlug(baseSlug);
    if (existing) {
      throw new Error(`Já existe uma editoria com o slug "${baseSlug}".`);
    }

    const id = crypto.randomUUID();
    const color = dto.color || "#05226B";
    const displayOrder = dto.displayOrder ?? 0;
    const showInMenu = dto.showInMenu ?? true;

    db.prepare(
      `
      INSERT INTO categories (
        id, name, slug, description, color, display_order, show_in_menu, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      dto.name.trim(),
      baseSlug,
      (dto.description ?? "").trim(),
      color,
      displayOrder,
      showInMenu ? 1 : 0,
      now,
      now
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error("Falha ao criar categoria.");
    }
    return created;
  }

  update(dto: UpdateCategoryDTO): Category {
    const db = getDb();
    const existing = this.findById(dto.id);
    if (!existing) {
      throw new Error("Editoria não encontrada.");
    }

    const nextName = dto.name !== undefined ? dto.name.trim() : existing.name;
    const nextSlug =
      dto.slug !== undefined
        ? slugify(dto.slug)
        : dto.name !== undefined && dto.slug === undefined
          ? existing.slug
          : existing.slug;

    if (!nextSlug) {
      throw new Error("Slug inválido para a editoria.");
    }

    const slugConflict = db
      .prepare("SELECT id FROM categories WHERE slug = ? AND id != ?")
      .get(nextSlug, dto.id) as { id: string } | undefined;

    if (slugConflict) {
      throw new Error(`O slug "${nextSlug}" já está em uso por outra editoria.`);
    }

    const now = new Date().toISOString();

    db.prepare(
      `
      UPDATE categories
      SET
        name = ?,
        slug = ?,
        description = ?,
        color = ?,
        display_order = ?,
        show_in_menu = ?,
        updated_at = ?
      WHERE id = ?
    `
    ).run(
      nextName,
      nextSlug,
      dto.description !== undefined
        ? dto.description.trim()
        : existing.description,
      dto.color !== undefined ? dto.color : existing.color,
      dto.displayOrder !== undefined ? dto.displayOrder : existing.displayOrder,
      dto.showInMenu !== undefined
        ? dto.showInMenu
          ? 1
          : 0
        : existing.showInMenu
          ? 1
          : 0,
      now,
      dto.id
    );

    const updated = this.findById(dto.id);
    if (!updated) {
      throw new Error("Falha ao atualizar editoria.");
    }
    return updated;
  }

  delete(id: string): void {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) {
      throw new Error("Editoria não encontrada.");
    }

    const countRow = db
      .prepare("SELECT COUNT(*) AS total FROM articles WHERE category_id = ?")
      .get(id) as { total: number };

    if (countRow.total > 0) {
      throw new Error(
        `Não é possível excluir "${existing.name}" porque há ${countRow.total} matéria(s) vinculada(s). Mova ou exclua as matérias antes.`
      );
    }

    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  }
}

export const categoryRepository = new CategoryRepository();

