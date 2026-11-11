import type {
  AdBannerData,
  AdBannerTheme,
  AdBannerVariant,
  CreateBannerDTO,
  UpdateBannerDTO,
} from "@/domain/entities/banner";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  isMissingTableError,
  translateSupabaseError,
} from "@/infrastructure/supabase/client";

interface BannerRow {
  id: string;
  advertiser: string;
  headline: string;
  subheadline: string | null;
  cta_label: string | null;
  badge_text: string | null;
  href: string;
  variant: AdBannerVariant;
  theme: AdBannerTheme;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

function mapRowToBanner(row: BannerRow): AdBannerData {
  return {
    id: row.id,
    advertiser: row.advertiser,
    headline: row.headline,
    subheadline: row.subheadline ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    badgeText: row.badge_text ?? undefined,
    href: row.href,
    variant: row.variant,
    theme: row.theme,
    isActive: Boolean(row.is_active),
    displayOrder: Number(row.display_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BannerRepository {
  async findAll(
    options?: { activeOnly?: boolean },
    accessToken?: string
  ): Promise<AdBannerData[]> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    let query = client
      .from("ad_banners")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (options?.activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(
        translateSupabaseError(error, "Erro ao carregar banners.")
      );
    }

    return ((data ?? []) as unknown as BannerRow[]).map(mapRowToBanner);
  }

  async create(
    dto: CreateBannerDTO,
    accessToken?: string
  ): Promise<AdBannerData> {
    const client = createSupabaseAdminClient(accessToken);
    const { data, error } = await client
      .from("ad_banners")
      .insert({
        advertiser: dto.advertiser.trim(),
        headline: dto.headline.trim(),
        subheadline: (dto.subheadline ?? "").trim(),
        cta_label: (dto.ctaLabel ?? "Saiba mais").trim(),
        badge_text: (dto.badgeText ?? "Publicidade Institucional").trim(),
        href: dto.href.trim(),
        variant: dto.variant,
        theme: dto.theme,
        is_active: dto.isActive ?? true,
        display_order: dto.displayOrder ?? 0,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        translateSupabaseError(error, "Erro ao criar banner institucional.")
      );
    }

    return mapRowToBanner(data as unknown as BannerRow);
  }

  async update(
    dto: UpdateBannerDTO,
    accessToken?: string
  ): Promise<AdBannerData> {
    const client = createSupabaseAdminClient(accessToken);
    const { data: existing, error: fetchError } = await client
      .from("ad_banners")
      .select("*")
      .eq("id", dto.id)
      .maybeSingle();

    if (fetchError || !existing) {
      throw new Error("Banner não encontrado.");
    }

    const row = existing as unknown as BannerRow;
    const { data, error } = await client
      .from("ad_banners")
      .update({
        advertiser:
          dto.advertiser !== undefined
            ? dto.advertiser.trim()
            : row.advertiser,
        headline:
          dto.headline !== undefined ? dto.headline.trim() : row.headline,
        subheadline:
          dto.subheadline !== undefined
            ? dto.subheadline.trim()
            : row.subheadline,
        cta_label:
          dto.ctaLabel !== undefined ? dto.ctaLabel.trim() : row.cta_label,
        badge_text:
          dto.badgeText !== undefined ? dto.badgeText.trim() : row.badge_text,
        href: dto.href !== undefined ? dto.href.trim() : row.href,
        variant: dto.variant ?? row.variant,
        theme: dto.theme ?? row.theme,
        is_active: dto.isActive ?? row.is_active,
        display_order: dto.displayOrder ?? row.display_order,
      })
      .eq("id", dto.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        translateSupabaseError(error, "Erro ao atualizar banner.")
      );
    }

    return mapRowToBanner(data as unknown as BannerRow);
  }

  async delete(id: string, accessToken?: string): Promise<void> {
    const client = createSupabaseAdminClient(accessToken);
    const { error } = await client.from("ad_banners").delete().eq("id", id);
    if (error) {
      throw new Error(translateSupabaseError(error, "Erro ao excluir banner."));
    }
  }
}

export const bannerRepository = new BannerRepository();

