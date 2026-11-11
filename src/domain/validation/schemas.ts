import { z } from "zod";

const imagePathOrUrlSchema = z
  .string()
  .trim()
  .min(1, "A imagem de capa é obrigatória.")
  .refine(
    (val) =>
      val.startsWith("/") ||
      val.startsWith("https://") ||
      val.startsWith("http://") ||
      val.startsWith("data:image/"),
    "Informe uma URL válida (https://...) ou caminho local (/images/...)."
  );

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome da categoria deve ter pelo menos 2 caracteres.")
    .max(40, "O nome da categoria deve ter no máximo 40 caracteres."),
  slug: z
    .string()
    .trim()
    .max(50, "O slug deve ter no máximo 50 caracteres.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(240, "A descrição deve ter no máximo 240 caracteres.")
    .optional()
    .default(""),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal #RRGGBB.")
    .optional()
    .default("#05226B"),
  displayOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  showInMenu: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().trim().min(1, "ID da categoria é obrigatório."),
});

export const createArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "A manchete deve ter pelo menos 8 caracteres.")
    .max(180, "A manchete deve ter no máximo 180 caracteres."),
  slug: z
    .string()
    .trim()
    .max(200, "O slug deve ter no máximo 200 caracteres.")
    .optional(),
  subtitle: z
    .string()
    .trim()
    .min(10, "O subtítulo/linha fina deve ter pelo menos 10 caracteres.")
    .max(320, "O subtítulo deve ter no máximo 320 caracteres."),
  content: z
    .string()
    .trim()
    .min(30, "O conteúdo da matéria deve ter pelo menos 30 caracteres."),
  coverImage: imagePathOrUrlSchema,
  coverAlt: z
    .string()
    .trim()
    .min(5, "O texto alternativo (alt) da imagem é obrigatório para SEO e acessibilidade.")
    .max(200),
  imageCaption: z.string().trim().max(180).optional().default(""),
  categoryId: z.string().trim().min(1, "Selecione uma categoria."),
  authorName: z
    .string()
    .trim()
    .min(2, "O nome do autor é obrigatório.")
    .max(80),
  authorRole: z.string().trim().max(80).optional().default("Redação"),
  status: z.enum(["published", "draft"]).optional().default("published"),
  isHero: z.boolean().optional().default(false),
  isBreaking: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  tags: z.array(z.string().trim().min(1)).max(12).optional().default([]),
  publishedAt: z.string().trim().optional(),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
  id: z.string().trim().min(1, "ID da notícia é obrigatório."),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

