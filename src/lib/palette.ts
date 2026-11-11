/**
 * Paleta oficial do portal BA Infoco / Giro360:
 * Azul-petróleo + Dourado + Branco + Gelo Azulado + Grafite Azulado.
 */
export const PORTAL_PALETTE = {
  petrol: "#123B50",
  gold: "#D6A843",
  goldHover: "#C29534",
  white: "#FFFFFF",
  ice: "#EAF0F2",
  graphite: "#263746",
} as const;

export const CATEGORY_PRESET_COLORS = [
  "#123B50",
  "#263746",
  "#9E7622",
  "#1A4D5E",
  "#2E5266",
  "#1F5E5B",
  "#7C5D1B",
  "#385166",
  "#0E2D3D",
] as const;

/**
 * Calcula cor de texto (#123B50 ou #FFFFFF) com contraste WCAG adequado sobre um fundo hexadecimal.
 */
export function getContrastTextColor(hexColor?: string): "#123B50" | "#FFFFFF" {
  const normalized = (hexColor ?? "").trim().replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return "#FFFFFF";
  }

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.34 ? "#123B50" : "#FFFFFF";
}
