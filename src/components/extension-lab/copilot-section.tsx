"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Loader2,
  Trash2,
  User,
  Sparkles,
} from "lucide-react";
import { SectionWrapper } from "./section-wrapper";
import { Markdown } from "./markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Comment le content script de KIROV3 injecte-t-il un prompt dans le textarea de ChatGPT ?",
  "Explique le pattern du Circuit Breaker dans le BridgeClient.",
  "Comment une extension peut-elle agir comme copilote sur une page web ?",
  "Quelle est la différence entre Manifest V2 et V3 pour les extensions IA ?",
];

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour 👋 Je suis le **Copilote KIROV3**. J’ai analysé l’extension `GLOBAL_KIROV3` (Manifest V3) et je peux t’expliquer son architecture, ses 9 modules, son cycle P1–P6, et plus largement comment concevoir des extensions de navigateur augmentées par l’IA.\n\nPose-moi une question ou choisis une suggestion ci-dessous.",
};

export function CopilotSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m !== WELCOME)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessages([...nextMessages, { role: "assistant", content: data.response }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Le copilote a échoué");
      setMessages(nextMessages);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function reset() {
    setMessages([WELCOME]);
    setInput("");
    toast.success("Conversation réinitialisée");
  }

  return (
    <SectionWrapper
      id="copilot"
      pillar="Pilier 3 · Copilote"
      title="L’extension comme copilote utilisateur"
      subtitle="KIROV3 agit comme un véritable copilote : il injecte des prompts ingénierisés, affiche des toasts de feedback, et superpose un overlay « Build Monitor ». Ce pilier met en pratique l’aide IA conversationnelle — pose tes questions sur l’extension à un copilote expert."
    >
      <Card className="border-slate-800 bg-slate-900/40">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
              <Bot className="h-4 w-4 text-cyan-300" />
            </div>
            Copilote KIROV3
            <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" />
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-slate-500 hover:text-slate-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="ml-1.5 hidden sm:inline">Effacer</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="custom-scroll h-[440px] overflow-y-auto p-4"
          >
            <div className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        m.role === "user"
                          ? "bg-slate-800 text-slate-300"
                          : "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                      }`}
                    >
                      {m.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                        m.role === "user"
                          ? "bg-cyan-500/15 text-slate-100 ring-1 ring-cyan-500/20"
                          : "border border-slate-800 bg-slate-950/60 text-slate-200"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <Markdown content={m.content} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                          style={{
                            animation: "copilot-bounce 1.2s infinite",
                            animationDelay: `${d * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-800 px-4 py-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{s}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-800 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Demande quelque chose au copilote…"
                className="min-h-[44px] max-h-32 resize-none border-slate-700 bg-slate-950/60 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/40"
              />
              <Button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="h-11 shrink-0 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-600">
              Entrée pour envoyer · Maj+Entrée pour un saut de ligne
            </p>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
