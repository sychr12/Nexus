"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  Paperclip,
  PlayCircle,
  RefreshCcw,
  Send,
  Square,
  UserRound,
  Video,
  X,
} from "lucide-react";
import Sidebar from "@/app/_components/layout/Sidebar";
import { userService } from "../users/services/user.service";
import { mensagemService } from "./services/mensagem.service";
import type { Mensagem, MensagemUser } from "./types/mensagem";

const COLORS = {
  primary: "#2D452F",
  secondary: "#4C6A4B",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function userName(user: MensagemUser) {
  return user.nomeCompleto || user.username;
}

export default function MensagensPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const attachmentUrlsRef = useRef<Record<number, string>>({});

  const [username, setUsername] = useState("Usuario");
  const [users, setUsers] = useState<MensagemUser[]>([]);
  const [currentUser, setCurrentUser] = useState<MensagemUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<number, string>>({});
  const [attachmentErrors, setAttachmentErrors] = useState<Record<number, string>>({});
  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(async (storedUsername?: string) => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      setError("");

      const effectiveUsername = storedUsername || localStorage.getItem("username") || "Usuario";
      const [usersData, mensagensData] = await Promise.all([
        userService.getAllUsers() as Promise<MensagemUser[]>,
        mensagemService.listar(),
      ]);

      const me = usersData.find((user) => user.username === effectiveUsername) || null;
      const activeUsers = usersData.filter((user) => user.status !== "INATIVO" && user.id !== me?.id);

      setUsers(activeUsers);
      setCurrentUser(me);
      setMensagens(Array.isArray(mensagensData) ? mensagensData : []);
      setSelectedUserId((current) => current || activeUsers[0]?.id || null);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem("token");
      const storedUsername = localStorage.getItem("username") || "Usuario";
      setUsername(storedUsername);

      if (!token) {
        router.push("/login");
        return;
      }

      loadData(storedUsername);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData, router, mounted]);

  useEffect(() => {
    const urlsToLoad = mensagens.filter(
      (mensagem) => mensagem.anexoUrl && !attachmentUrls[mensagem.id] && !attachmentErrors[mensagem.id]
    );
    if (urlsToLoad.length === 0) return;

    let cancelled = false;
    async function loadAttachments() {
      const loadedEntries = await Promise.all(
        urlsToLoad.map(async (mensagem) => {
          try {
            const url = await mensagemService.carregarAnexo(mensagem.anexoUrl!);
            return { id: mensagem.id, url };
          } catch (err) {
            return {
              id: mensagem.id,
              error: err instanceof Error ? err.message : "Erro ao carregar anexo",
            };
          }
        })
      );

      if (cancelled) {
        loadedEntries.forEach((entry) => {
          if (entry && "url" in entry && entry.url) URL.revokeObjectURL(entry.url);
        });
        return;
      }

      setAttachmentUrls((current) => {
        const next = { ...current };
        loadedEntries.forEach((entry) => {
          if (entry && "url" in entry && entry.url) next[entry.id] = entry.url;
        });
        return next;
      });

      setAttachmentErrors((current) => {
        const next = { ...current };
        loadedEntries.forEach((entry) => {
          if (entry && "error" in entry && entry.error) next[entry.id] = entry.error;
        });
        return next;
      });
    }

    loadAttachments();
    return () => {
      cancelled = true;
    };
  }, [mensagens, attachmentUrls, attachmentErrors]);

  useEffect(() => {
    attachmentUrlsRef.current = attachmentUrls;
  }, [attachmentUrls]);

  useEffect(() => {
    return () => {
      Object.values(attachmentUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const conversations = useMemo(() => {
    return users.map((user) => {
      const related = mensagens.filter(
        (mensagem) => mensagem.remetenteId === user.id || mensagem.destinatarioId === user.id
      );
      const last = related[related.length - 1];
      return { user, last, total: related.length };
    });
  }, [users, mensagens]);

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;

  const selectedMessages = useMemo(() => {
    if (!selectedUserId || !currentUser) return [];
    return mensagens.filter(
      (mensagem) =>
        (mensagem.remetenteId === currentUser.id && mensagem.destinatarioId === selectedUserId) ||
        (mensagem.remetenteId === selectedUserId && mensagem.destinatarioId === currentUser.id)
    );
  }, [mensagens, selectedUserId, currentUser]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUserId || sending || (!texto.trim() && !anexo)) return;

    try {
      setSending(true);
      setError("");
      await mensagemService.enviar(selectedUserId, texto, anexo);
      setTexto("");
      setAnexo(null);
      await loadData();
    } catch (err) {
      console.error("Erro ao enviar:", err);
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAnexo(new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" }));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Nao foi possivel acessar o microfone neste navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    router.push("/login");
  }

  function renderAttachment(mensagem: Mensagem) {
    if (!mensagem.anexoContentType || !mensagem.anexoUrl) return null;

    const localUrl = attachmentUrls[mensagem.id];
    const attachmentError = attachmentErrors[mensagem.id];
    if (attachmentError) {
      return (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {attachmentError}
        </div>
      );
    }

    if (!localUrl) {
      return (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Carregando anexo...
        </div>
      );
    }

    if (mensagem.anexoContentType.startsWith("image/")) {
      return <img src={localUrl} alt={mensagem.anexoNomeOriginal || "Imagem"} className="mt-3 max-h-72 rounded-lg object-contain" />;
    }

    if (mensagem.anexoContentType.startsWith("audio/")) {
      return <audio src={localUrl} controls className="mt-3 w-full max-w-sm" />;
    }

    if (mensagem.anexoContentType.startsWith("video/")) {
      return <video src={localUrl} controls className="mt-3 max-h-80 w-full rounded-lg bg-black" />;
    }

    return null;
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={handleLogout}
        username={username}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[330px_1fr]">
            {/* Sidebar de usuários */}
            <aside className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: COLORS.border }}>
              <div className="border-b p-5" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                      Mensagens
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                      Comunicacao temporaria por 24h
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadData()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border transition hover:bg-slate-50"
                    style={{ borderColor: COLORS.border, color: COLORS.primary }}
                    title="Atualizar"
                  >
                    <RefreshCcw size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12" style={{ color: COLORS.textLight }}>
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-5 text-center text-sm" style={{ color: COLORS.textLight }}>
                    Nenhum usuario disponivel.
                  </div>
                ) : (
                  conversations.map(({ user, last, total }) => {
                    const active = selectedUserId === user.id;
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className="mb-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                        style={{
                          borderColor: active ? COLORS.accent : COLORS.border,
                          backgroundColor: active ? "#F0F7EE" : COLORS.card,
                        }}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: COLORS.primary }}>
                          <UserRound size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold" style={{ color: COLORS.text }}>
                              {userName(user)}
                            </p>
                            {total > 0 && <span className="text-xs" style={{ color: COLORS.accent }}>{total}</span>}
                          </div>
                          <p className="truncate text-xs" style={{ color: COLORS.textLight }}>
                            {user.perfil || "Cargo nao informado"}
                          </p>
                          {last && (
                            <p className="mt-1 truncate text-xs" style={{ color: COLORS.textLight }}>
                              {last.texto || last.anexoNomeOriginal || "Anexo enviado"}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Área de conversa */}
            <div className="flex min-h-[calc(100vh-160px)] flex-col overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: COLORS.border }}>
              {selectedUser ? (
                <>
                  <header className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: COLORS.border }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg text-white" style={{ backgroundColor: COLORS.secondary }}>
                      <MessageCircle size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: COLORS.primary }}>
                        {userName(selectedUser)}
                      </h2>
                      <p className="text-sm" style={{ color: COLORS.textLight }}>
                        {selectedUser.perfil || "Cargo nao informado"} | mensagens expiram em 24h
                      </p>
                    </div>
                  </header>

                  {error && (
                    <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {selectedMessages.length === 0 ? (
                      <div className="flex h-full min-h-80 items-center justify-center text-center">
                        <div>
                          <MessageCircle className="mx-auto mb-3" style={{ color: COLORS.accent }} size={40} />
                          <p className="font-semibold" style={{ color: COLORS.text }}>
                            Comece uma conversa temporaria
                          </p>
                          <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                            Texto, imagem, audio e video ficam disponiveis por 24h.
                          </p>
                        </div>
                      </div>
                    ) : (
                      selectedMessages.map((mensagem) => {
                        const mine = mensagem.remetenteId === currentUser?.id;
                        return (
                          <article key={mensagem.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div
                              className="max-w-xl rounded-lg border px-4 py-3 shadow-sm"
                              style={{
                                backgroundColor: mine ? "#EDF7E8" : "#FFFFFF",
                                borderColor: mine ? COLORS.light : COLORS.border,
                              }}
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: COLORS.textLight }}>
                                <span className="font-semibold" style={{ color: COLORS.primary }}>
                                  {mine ? "Voce" : (mensagem.remetenteNome || "Usuário")}
                                </span>
                                <span>{mensagem.remetenteCargo || "Cargo nao informado"}</span>
                                <span>{formatTime(mensagem.criadoEm)}</span>
                              </div>
                              {mensagem.texto && <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: COLORS.text }}>{mensagem.texto}</p>}
                              {renderAttachment(mensagem)}
                              <p className="mt-3 text-[11px]" style={{ color: COLORS.textLight }}>
                                Expira em {formatExpiry(mensagem.expiraEm)}
                              </p>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSend} className="border-t p-4" style={{ borderColor: COLORS.border }}>
                    {anexo && (
                      <div className="mb-3 flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                        <div className="flex min-w-0 items-center gap-2">
                          {anexo.type.startsWith("image/") ? <ImageIcon size={16} /> : anexo.type.startsWith("video/") ? <Video size={16} /> : anexo.type.startsWith("audio/") ? <PlayCircle size={16} /> : <Paperclip size={16} />}
                          <span className="truncate">{anexo.name}</span>
                        </div>
                        <button type="button" onClick={() => setAnexo(null)} className="rounded p-1 hover:bg-slate-200" title="Remover anexo">
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,audio/*,video/*"
                        className="hidden"
                        onChange={(event) => setAnexo(event.target.files?.[0] || null)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition hover:bg-slate-50"
                        style={{ borderColor: COLORS.border, color: COLORS.primary }}
                        title="Anexar arquivo"
                      >
                        <Paperclip size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={recording ? stopRecording : startRecording}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition hover:bg-slate-50"
                        style={{
                          borderColor: recording ? "#DC2626" : COLORS.border,
                          color: recording ? "#DC2626" : COLORS.primary,
                        }}
                        title={recording ? "Parar gravacao" : "Gravar audio"}
                      >
                        {recording ? <Square size={18} /> : <Mic size={20} />}
                      </button>
                      <textarea
                        value={texto}
                        onChange={(event) => setTexto(event.target.value)}
                        rows={2}
                        placeholder="Digite sua mensagem temporaria..."
                        className="min-h-11 flex-1 resize-none rounded-lg border px-4 py-2 text-sm outline-none transition focus:ring-2 focus:ring-green-500"
                        style={{ borderColor: COLORS.border, color: COLORS.text }}
                      />
                      <button
                        type="submit"
                        disabled={sending || (!texto.trim() && !anexo)}
                        className="flex h-11 shrink-0 items-center gap-2 rounded-lg px-4 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Enviar
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-center">
                  <div>
                    <UserRound className="mx-auto mb-3" style={{ color: COLORS.accent }} size={42} />
                    <p className="font-semibold" style={{ color: COLORS.text }}>
                      Selecione um usuario
                    </p>
                    <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                      As mensagens sao apagadas automaticamente depois de 24h.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}