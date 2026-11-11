"use client";

import { useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = (await res.json()) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error ?? "Não foi possível confirmar sua inscrição.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text:
          json.message ??
          "Inscrição confirmada! Obrigado por acompanhar o BA Infoco.",
      });
      setEmail("");
    } catch {
      setFeedback({
        type: "error",
        text: "Erro de conexão ao registrar seu e-mail.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="rounded-sm border border-[#05226B]/20 bg-[#05226B] p-5 text-white shadow-xs"
    >
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-[#FFD400]" aria-hidden="true" />
        <h2
          id="newsletter-heading"
          className="font-display text-sm font-extrabold uppercase tracking-wider"
        >
          Plantão BA Infoco
        </h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/90">
        Receba as principais manchetes da Bahia, economia e esportes direto no seu e-mail.
      </p>

      {feedback?.type === "success" ? (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-xs bg-white/15 px-3 py-2.5 text-xs font-semibold text-white"
        >
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-[#4ADE80]"
            aria-hidden="true"
          />
          <span>{feedback.text}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <label htmlFor="sidebar-newsletter-email" className="sr-only">
            Seu melhor e-mail
          </label>
          <input
            id="sidebar-newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com.br"
            className="w-full rounded-xs border border-white/25 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />
          {feedback?.type === "error" && (
            <p role="alert" className="text-[11px] font-semibold text-[#FCA5A5]">
              {feedback.text}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-1.5 rounded-xs bg-[#C80A14] px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-[#A60710] disabled:opacity-60"
          >
            {submitting && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            Receber Destaques
          </button>
        </form>
      )}
    </section>
  );
}
