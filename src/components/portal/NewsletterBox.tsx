"use client";

import { useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";

export function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
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

      {submitted ? (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-xs bg-white/15 px-3 py-2.5 text-xs font-semibold text-white"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4ADE80]" aria-hidden="true" />
          <span>Inscrição confirmada! Obrigado por acompanhar o BA Infoco.</span>
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
          <button
            type="submit"
            className="w-full rounded-xs bg-[#C80A14] px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-[#A60710]"
          >
            Receber Destaques
          </button>
        </form>
      )}
    </section>
  );
}

