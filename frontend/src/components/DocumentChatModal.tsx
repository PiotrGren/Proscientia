import React, { useState, useRef, useEffect } from "react";
import { FiSend, FiX, FiCpu, FiUser, FiLayers } from "react-icons/fi";
import axiosInstance from "../utils/axiosInstance";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[]; // Lista fragmentów tekstu, na których oparło się AI
};

interface DocumentChatModalProps {
  docId: number;
  docTitle: string;
  onClose: () => void;
}

const DocumentChatModal: React.FC<DocumentChatModalProps> = ({ docId, docTitle, onClose }) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: `Cześć! Jestem Twoim asystentem wiedzy. Przeczytałem dokument "${docTitle}". O co chcesz zapytać?`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Automatyczne przewijanie do dołu
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query;
    setQuery("");
    
    // 1. Dodaj wiadomość użytkownika
    const userMsg: Message = { id: Date.now(), role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Wyślij do API
      const res = await axiosInstance.post(`/agents/ask/${docId}/`, {
        question: userText,
      });

      // 3. Dodaj odpowiedź AI
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
      
    } catch (error: any) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Przepraszam, wystąpił błąd podczas przetwarzania pytania. Sprawdź czy dokument został zindeksowany.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-2xl h-[80vh] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-800/50 border-b border-zinc-700">
            <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <FiCpu className="text-orange-400" />
                    Agent Wiedzy
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[300px]">
                    Dokument: {docTitle}
                </p>
            </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-700 rounded-full text-slate-400 hover:text-white transition">
            <FiX size={20} />
          </button>
        </div>

        {/* MESSAGES LIST */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-orange-600 text-white rounded-br-none"
                    : "bg-zinc-800 text-slate-200 rounded-bl-none border border-zinc-700"
                }`}
              >
                {/* Ikona roli */}
                <div className="mb-1 flex items-center gap-2 opacity-70 text-xs font-bold uppercase tracking-wide">
                    {msg.role === "user" ? <FiUser /> : <FiCpu />}
                    {msg.role === "user" ? "Ty" : "AI Assistant"}
                </div>
                
                {/* Treść */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Źródła (tylko dla AI) */}
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                        <p className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                            <FiLayers /> Źródła (RAG Context):
                        </p>
                        <div className="space-y-1">
                            {msg.sources.map((src, idx) => (
                                <div key={idx} className="text-[10px] bg-black/20 p-1.5 rounded border border-white/5 text-slate-400 italic">
                                    "...{src}..."
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-none border border-zinc-700 flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <form onSubmit={handleSend} className="p-4 bg-zinc-800/30 border-t border-zinc-700 flex gap-3">
          <input
            type="text"
            className="flex-1 bg-zinc-900 border border-zinc-600 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            placeholder="Zadaj pytanie dotyczące treści..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-orange-900/20"
          >
            <FiSend size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DocumentChatModal;