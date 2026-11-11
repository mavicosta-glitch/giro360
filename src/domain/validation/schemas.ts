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

export const createBannerSchema = z.object({
  advertiser: z
    .string()
    .trim()
    .min(2, "O nome do anunciante deve ter pelo menos 2 caracteres.")
    .max(80),
  headline: z
    .string()
    .trim()
    .min(2, "O título principal do banner é obrigatório.")
    .max(100),
  subheadline: z.string().trim().max(140).optional().default(""),
  ctaLabel: z.string().trim().max(40).optional().default("Saiba mais"),
  badgeText: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default("Publicidade Institucional"),
  href: z
    .string()
    .trim()
    .min(1, "Informe o link de destino do banner.")
    .refine(
      (val) =>
        val.startsWith("/") ||
        val.startsWith("https://") ||
        val.startsWith("http://"),
      "O link deve iniciar com /, https:// ou http://."
    ),
  variant: z.enum(["leaderboard", "rectangle", "sidebar"]).default("rectangle"),
  theme: z
    .enum([
      "salvador-blue",
      "agro-green",
      "commerce-gold",
      "institutional-navy",
    ])
    .default("salvador-blue"),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export const updateBannerSchema = createBannerSchema.partial().extend({
  id: z.string().trim().min(1, "ID do banner é obrigatório."),
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um endereço de e-mail válido."),
});

export const adminAuthSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres.")
    .max(128),
  fullName: z.string().trim().max(80).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type AdminAuthInput = z.infer<typeof adminAuthSchema>;

