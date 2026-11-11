export type AdBannerVariant = "leaderboard" | "rectangle" | "sidebar";

export interface AdBannerData {
  id: string;
  advertiser: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  badgeText?: string;
  href: string;
  variant: AdBannerVariant;
  theme: "salvador-blue" | "agro-green" | "commerce-gold" | "institutional-navy";
}

