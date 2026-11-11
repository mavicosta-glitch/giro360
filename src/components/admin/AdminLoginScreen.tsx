"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  UserPlus,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

interface AdminLoginScreenProps {
  needsDbSetup?: boolean;
  pendingRoleMessage?: string | null;
}

export function AdminLoginScreen({
  needsDbSetup = false,
  pendingRoleMessage = null,
}: AdminLoginScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(pendingRoleMessage);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: mode === "signup" ? fullName : undefined,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        requiresEmailConfirmation?: boolean;
      };

      if (!res.ok) {
        setError(json.error ?? "Falha na autenticação.");
        return;
      }

      if (json.requiresEmailConfirmation) {
        setInfo(
          json.message ??
            "Conta criada! Confirme seu e-mail ou ative o usuário em Authentication → Users no Supabase e faça login."
        );
        setMode("login");
        return;
      }

      router.refresh();
    } catch {
      setError("Erro de conexão ao autenticar no Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <BrandLogo />
          <h1 className="mt-4 font-display text-xl font-black text-[#05226B]">
            Acesso ao Painel Editorial
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Autenticação segura via Supabase Auth & Row-Level Security (RLS).
          </p>
        </div>

        {needsDbSetup && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900"
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div>
              <strong className="block font-bold">
                Banco de dados ainda não inicializado
              </strong>
              <span className="mt-0.5 block">
                Execute o script SQL completo no <strong>Supabase SQL Editor</strong> antes de realizar o login.
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded py-2 transition ${
              mode === "login"
                ? "bg-white text-[#05226B] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`rounded py-2 transition ${
              mode === "signup"
                ? "bg-white text-[#05226B] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Primeiro Acesso
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800"
          >
            {error}
          </div>
        )}

        {info && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="admin-fullname"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Nome Completo
              </label>
              <input
                id="admin-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Editor-Chefe BA Infoco"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              E-mail Administrativo
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bainfoco.com.br"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#05226B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#082F8A] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : mode === "login" ? (
              <Lock className="h-4 w-4" aria-hidden="true" />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            )}
            {mode === "login"
              ? "Entrar no Painel"
              : "Criar Primeiro Administrador"}
          </button>
        </form>

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
          <strong>Dica de Primeiro Acesso:</strong> o primeiro usuário criado no projeto é promovido automaticamente para <code className="font-mono font-semibold">admin</code>. Caso a confirmação de e-mail esteja ativa, confirme pelo link recebido ou marque <em>Auto Confirm User</em> em <em>Authentication → Users</em> no painel do Supabase.
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#05226B] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar para a Capa do Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

