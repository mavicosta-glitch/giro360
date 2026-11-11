"use client";

import { useState } from "react";
import { BellRing, Mail, Trash2 } from "lucide-react";
import type { NewsletterSubscriber } from "@/domain/entities/newsletter";
import { formatPtBrDateTime } from "@/lib/formatters";

interface SubscriberManagerProps {
  subscribers: NewsletterSubscriber[];
  onDelete: (id: string) => Promise<void>;
}

export function SubscriberManager({
  subscribers,
  onDelete,
}: SubscriberManagerProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="subs-heading"
      className="rounded-md border border-slate-200 bg-white shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h2
            id="subs-heading"
            className="flex items-center gap-2 font-display text-base font-black text-slate-900"
          >
            <BellRing className="h-4 w-4 text-[#C80A14]" aria-hidden="true" />
            Inscritos no Plantão BA Infoco ({subscribers.length})
          </h2>
          <p className="text-xs text-slate-500">
            Leitores cadastrados via widget da barra lateral com proteção RLS (somente administradores).
          </p>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-slate-500">
          Nenhum leitor inscrito na newsletter ainda.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data de Inscrição</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <Mail
                        className="h-3.5 w-3.5 text-slate-400"
                        aria-hidden="true"
                      />
                      {sub.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      {sub.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatPtBrDateTime(sub.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirmId === sub.id ? (
                      <div className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDelete(sub.id);
                            setConfirmId(null);
                          }}
                          className="text-[11px] font-bold text-red-700 hover:underline"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="text-[11px] text-slate-600 hover:underline"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(sub.id)}
                        aria-label={`Remover ${sub.email}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

