interface JsonLdScriptProps {
  data: Record<string, unknown>;
}

/**
 * Injeta dados estruturados Schema.org (JSON-LD) para SEO técnico avançado.
 */
export function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

