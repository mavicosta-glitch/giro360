import assert from "node:assert/strict";
import test from "node:test";
import {
  estimateReadingTime,
  formatPtBrDate,
  slugify,
} from "../src/lib/formatters.ts";
import {
  adminAuthSchema,
  createArticleSchema,
  createBannerSchema,
  createCategorySchema,
  newsletterSchema,
} from "../src/domain/validation/schemas.ts";

test("slugify removes accents, punctuation and normalizes whitespace", () => {
  assert.equal(
    slugify("Polícia Militar reforça operação na BR-324 em Salvador!"),
    "policia-militar-reforca-operacao-na-br-324-em-salvador"
  );
  assert.equal(slugify("  Meio Ambiente & Saúde  "), "meio-ambiente-saude");
});

test("estimateReadingTime calculates minimum 1 minute and scales by word count", () => {
  assert.equal(estimateReadingTime("Texto curto."), 1);
  const longText = Array.from({ length: 450 }, () => "palavra").join(" ");
  assert.equal(estimateReadingTime(longText), 3);
});

test("formatPtBrDate formats ISO dates in Portuguese", () => {
  const formatted = formatPtBrDate("2026-11-10T15:00:00.000Z");
  assert.match(formatted, /10 de novembro de 2026/);
});

test("createCategorySchema validates hex color and name constraints", () => {
  const valid = createCategorySchema.safeParse({
    name: "Tecnologia",
    color: "#05226B",
    displayOrder: 5,
    showInMenu: true,
  });
  assert.equal(valid.success, true);

  const invalidColor = createCategorySchema.safeParse({
    name: "Tecnologia",
    color: "azul",
  });
  assert.equal(invalidColor.success, false);
});

test("createArticleSchema validates mandatory SEO and content fields", () => {
  const valid = createArticleSchema.safeParse({
    title: "Bahia registra aumento no turismo sustentável neste trimestre",
    subtitle: "Fluxo de visitantes cresceu 12% segundo levantamento estadual.",
    content:
      "Reportagem completa detalhando os resultados do setor turístico na Bahia ao longo dos últimos três meses.",
    coverImage: "/images/news/bahia-ferry.jpg",
    coverAlt: "Ferry-boat na Baía de Todos-os-Santos em Salvador",
    categoryId: "cat-1",
    authorName: "Redação BA Infoco",
    status: "published",
    isHero: true,
    isBreaking: false,
    isFeatured: false,
    tags: ["Bahia", "Turismo"],
  });
  assert.equal(valid.success, true);

  const missingAlt = createArticleSchema.safeParse({
    title: "Título válido com mais de oito caracteres",
    subtitle: "Subtítulo válido para matéria jornalística",
    content: "Conteúdo suficientemente longo para passar na validação mínima.",
    coverImage: "/images/news/bahia-ferry.jpg",
    coverAlt: "",
    categoryId: "cat-1",
    authorName: "Redação",
  });
  assert.equal(missingAlt.success, false);
});

test("createBannerSchema validates banner variant, theme and href", () => {
  const valid = createBannerSchema.safeParse({
    advertiser: "Prefeitura de Salvador",
    headline: "E muito mais!",
    subheadline: "Obras de mobilidade na capital baiana.",
    href: "https://www.salvador.ba.gov.br",
    variant: "leaderboard",
    theme: "salvador-blue",
    isActive: true,
    displayOrder: 1,
  });
  assert.equal(valid.success, true);

  const invalidHref = createBannerSchema.safeParse({
    advertiser: "Anunciante",
    headline: "Campanha",
    href: "javascript:alert(1)",
    variant: "rectangle",
    theme: "salvador-blue",
  });
  assert.equal(invalidHref.success, false);
});

test("newsletterSchema normalizes and validates subscriber email", () => {
  const valid = newsletterSchema.safeParse({
    email: "  Leitor@BAInfoco.com.br ",
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.email, "leitor@bainfoco.com.br");
  }

  const invalid = newsletterSchema.safeParse({ email: "email-invalido" });
  assert.equal(invalid.success, false);
});

test("adminAuthSchema requires valid email and minimum 6-char password", () => {
  const valid = adminAuthSchema.safeParse({
    email: "editor@bainfoco.com.br",
    password: "secretpassword",
    fullName: "Editor Chefe",
  });
  assert.equal(valid.success, true);

  const shortPassword = adminAuthSchema.safeParse({
    email: "editor@bainfoco.com.br",
    password: "123",
  });
  assert.equal(shortPassword.success, false);
});

