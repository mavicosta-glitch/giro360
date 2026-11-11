export type AdBannerVariant = "leaderboard" | "rectangle" | "sidebar";

export type AdBannerTheme =
  | "salvador-blue"
  | "agro-green"
  | "commerce-gold"
  | "institutional-navy";

export interface AdBannerData {
  id: string;
  advertiser: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  badgeText?: string;
  href: string;
  variant: AdBannerVariant;
  theme: AdBannerTheme;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBannerDTO {
  advertiser: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  badgeText?: string;
  href: string;
  variant: AdBannerVariant;
  theme: AdBannerTheme;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateBannerDTO extends Partial<CreateBannerDTO> {
  id: string;
}
