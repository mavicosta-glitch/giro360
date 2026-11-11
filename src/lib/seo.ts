import type { Article } from "@/domain/entities/article";

export const SITE_CONFIG = {
  name: "BA Infoco",
  tagline: "Informação em Tempo Real — Bahia, Brasil e Mundo",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "pt_BR",
  language: "pt-BR",
  publisherEmail: "redacao@bainfoco.com.br",
  city: "Salvador",
  state: "BA",
  country: "BR",
};

/**
 * Gera JSON-LD Schema.org para WebSite + SearchAction e NewsMediaOrganization.
 */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsMediaOrganization",
        "@id": `${SITE_CONFIG.url}/#organization`,
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_CONFIG.url}/images/logo-ba-infoco.svg`,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE_CONFIG.city,
          addressRegion: SITE_CONFIG.state,
          addressCountry: SITE_CONFIG.country,
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: SITE_CONFIG.publisherEmail,
          contactType: "editorial",
          availableLanguage: "Portuguese",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_CONFIG.url}/#website`,
        url: SITE_CONFIG.url,
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.tagline,
        inLanguage: SITE_CONFIG.language,
        publisher: {
          "@id": `${SITE_CONFIG.url}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_CONFIG.url}/busca?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/**
 * Gera JSON-LD Schema.org NewsArticle para páginas de matéria.
 */
export function buildNewsArticleJsonLd(article: Article) {
  const articleUrl = `${SITE_CONFIG.url}/noticia/${article.slug}`;
  const imageUrl = article.coverImage.startsWith("http")
    ? article.coverImage
    : `${SITE_CONFIG.url}${article.coverImage}`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: article.title,
    description: article.subtitle,
    image: [imageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: SITE_CONFIG.language,
    articleSection: article.categoryName,
    keywords: article.tags.join(", "),
    author: {
      "@type": "Person",
      name: article.authorName,
      jobTitle: article.authorRole,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_CONFIG.url}/images/logo-ba-infoco.svg`,
      },
    },
  };
}

/**
 * Gera JSON-LD BreadcrumbList para navegação estruturada nos motores de busca.
 */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.path}`,
    })),
  };
}

