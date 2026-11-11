import type { NewsletterSubscriber } from "@/domain/entities/newsletter";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  isMissingTableError,
  translateSupabaseError,
} from "@/infrastructure/supabase/client";

interface SubscriberRow {
  id: string;
  email: string;
  status: "active" | "unsubscribed";
  created_at: string;
}

function mapRow(row: SubscriberRow): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  };
}

export class NewsletterRepository {
  async subscribe(email: string): Promise<{ alreadySubscribed: boolean }> {
    const client = createSupabasePublicClient();
    const normalized = email.trim().toLowerCase();

    const { error } = await client
      .from("newsletter_subscribers")
      .insert({ email: normalized, status: "active" });

    if (error) {
      if (error.code === "23505") {
        return { alreadySubscribed: true };
      }
      throw new Error(
        translateSupabaseError(error, "Não foi possível registrar seu e-mail.")
      );
    }

    return { alreadySubscribed: false };
  }

  async findAll(accessToken?: string): Promise<NewsletterSubscriber[]> {
    const client = createSupabaseAdminClient(accessToken);
    const { data, error } = await client
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(
        translateSupabaseError(error, "Erro ao carregar inscritos.")
      );
    }

    return ((data ?? []) as unknown as SubscriberRow[]).map(mapRow);
  }

  async delete(id: string, accessToken?: string): Promise<void> {
    const client = createSupabaseAdminClient(accessToken);
    const { error } = await client
      .from("newsletter_subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(
        translateSupabaseError(error, "Erro ao remover inscrito.")
      );
    }
  }
}

export const newsletterRepository = new NewsletterRepository();

