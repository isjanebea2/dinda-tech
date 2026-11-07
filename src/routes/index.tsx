import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { WandSparkles, Send, RotateCcw } from "lucide-react";
import { z } from "zod";
import { isAgeAllowed, MAX_AGE, MIN_AGE } from "@/lib/dinda-prompt";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DInda Tech — Sua madrinha na tecnologia" },
      { name: "description", content: "Quiz acolhedor que descobre sua área na tecnologia: UX Design ou Front-end." },
      { property: "og:title", content: "DInda Tech — Sua madrinha na tecnologia" },
      { property: "og:description", content: "Quiz acolhedor que descobre sua área na tecnologia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Profile = { name: string; email: string; age: number; gender: string };
const PROFILE_KEY = "dinda:profile";
const MSGS_KEY = "dinda:messages";

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  age: z.coerce.number().int("Idade inválida").min(1, "Idade inválida").max(120, "Idade inválida"),
  gender: z.string().trim().min(1, "Informe seu gênero").max(80),
});

function Index() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const p = sessionStorage.getItem(PROFILE_KEY);
      if (p) {
        const parsed = schema.safeParse(JSON.parse(p));
        if (parsed.success && isAgeAllowed(parsed.data.age)) setProfile(parsed.data);
      }
    } catch {}
    setReady(true);
  }, []);

  const reset = () => {
    sessionStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(MSGS_KEY);
    setProfile(null);
  };

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-magic text-primary-foreground shadow-soft">
            <WandSparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-primary">DInda Tech</h1>
            <p className="text-sm text-muted-foreground">Sua madrinha na tecnologia</p>
          </div>
          {profile && (
            <button onClick={reset} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-primary hover:bg-secondary">
              <RotateCcw className="h-4 w-4" /> Recomeçar
            </button>
          )}
        </header>
        {ready && (profile ? <Chat profile={profile} /> : <Intro onDone={setProfile} />)}
      </div>
    </main>
  );
}

function Intro({ onDone }: { onDone: (p: Profile) => void }) {
  const [form, setForm] = useState({ name: "", email: "", age: "", gender: "" });
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return setError(r.error.issues[0]?.message ?? "Dados inválidos");
    setError(null);
    if (!isAgeAllowed(r.data.age)) {
      setDenied(r.data.name);
      return;
    }
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(r.data));
    onDone(r.data);
  };

  if (denied)
    return (
      <div className="rounded-3xl bg-card p-8 text-center shadow-soft">
        <h2 className="font-display text-2xl font-bold text-primary">Oi, {denied}!</h2>
        <p className="mt-3 text-muted-foreground">
          Sinto muito, mas no momento a DInda Tech atende apenas pessoas entre {MIN_AGE} e {MAX_AGE} anos. Obrigada pelo interesse! 💜
        </p>
        <button onClick={() => setDenied(null)} className="mt-6 rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:opacity-90">
          Voltar
        </button>
      </div>
    );

  const field = "w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";
  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-8 shadow-soft">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Boas-vindas à Dinda Tech!</h2>
        <p className="mt-1 text-sm text-muted-foreground">Conte um pouquinho sobre você para começarmos o quiz.</p>
      </div>
      <input className={field} placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={field} type="email" placeholder="Seu e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className={field} type="number" placeholder="Sua idade" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
      <input className={field} aria-label="Seu gênero" placeholder="Seu gênero" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} maxLength={80} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button className="w-full rounded-full bg-magic py-3 font-semibold text-primary-foreground shadow-soft hover:opacity-95">
        Começar ✨
      </button>
    </form>
  );
}

function loadMessages(): UIMessage[] {
  try {
    return JSON.parse(sessionStorage.getItem(MSGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function Chat({ profile }: { profile: Profile }) {
  const [initial] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    messages: initial,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { profile: { name: profile.name, age: profile.age } },
    }),
    onError: (e) => setErr(e.message.includes("402") ? "Créditos de IA esgotados." : "Não consegui responder agora. Tente novamente."),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (messages.length === 0 && status === "ready") {
      sendMessage({ text: `Olá! Meu nome é ${profile.name}.` });
    }
  }, [messages.length, status, profile.name, sendMessage]);

  useEffect(() => {
    if (status === "ready") sessionStorage.setItem(MSGS_KEY, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!busy) inputRef.current?.focus();
  }, [messages, status, busy]);

  const send = () => {
    const t = input.trim();
    if (!t || busy) return;
    setErr(null);
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        {messages.map((m, i) => {
          if (i === 0 && m.role === "user") return null;
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          if (!text) return null;
          return m.role === "user" ? (
            <div key={m.id} className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">
              {text}
            </div>
          ) : (
            <div key={m.id} className="flex gap-3">
              <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-magic text-primary-foreground">
                <WandSparkles className="h-4 w-4" />
              </div>
              <div className="prose prose-sm max-w-none leading-relaxed [&_p]:my-2">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            </div>
          );
        })}
        {status === "submitted" && <p className="animate-pulse pl-11 text-sm text-muted-foreground">Dinda está pensando… ✨</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-4 flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-soft">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escreva sua resposta…"
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 outline-none"
        />
        <button onClick={send} disabled={busy || !input.trim()} aria-label="Enviar" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
