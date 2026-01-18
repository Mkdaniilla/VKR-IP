import React, { useState, useRef, useEffect } from "react";
import { askAI } from "../lib/api";

export default function KBAgentFox() {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [chat, setChat] = useState<{ role: "user" | "ai"; text: string; sources?: { id: number; title: string }[] }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat, loading]);

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || loading) return;

        const userMsg = question;
        setQuestion("");
        setChat((prev) => [...prev, { role: "user", text: userMsg }]);
        setLoading(true);

        try {
            const resp = await askAI(userMsg);
            setChat((prev) => [
                ...prev,
                { role: "ai", text: resp.answer, sources: resp.sources }
            ]);
        } catch (e: any) {
            setChat((prev) => [
                ...prev,
                { role: "ai", text: "Ошибка: " + e.message }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-12 z-[9999] flex flex-col items-end">
            {/* Окно чата */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/30 p-1.5 rounded-full backdrop-blur-sm">
                                <img src="/fox.png" alt="Лис" className="w-8 h-8 rounded-full" style={{ mixBlendMode: 'multiply' }} />
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-tight">Лисёнок-Помощник</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] opacity-80 uppercase tracking-widest font-semibold">В сети</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-black/10 p-2 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                        {chat.length === 0 && (
                            <div className="text-center py-10 px-6">
                                <img src="/fox.png" alt="Лис" className="w-20 h-20 mx-auto mb-4 animate-bounce" style={{ mixBlendMode: 'multiply' }} />
                                <h3 className="font-bold text-gray-800 mb-1">Привет! Я Лисёнок.</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Помогу разобраться в базе знаний. Спрашивайте что угодно!
                                </p>
                            </div>
                        )}
                        {chat.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] p-3 px-4 rounded-2xl shadow-sm ${msg.role === "user"
                                    ? "bg-orange-500 text-white rounded-tr-none"
                                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-gray-100">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Источники:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {msg.sources.map(s => (
                                                    <a key={s.id} href={`/knowledge/${s.id}`} className="text-[10px] bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-100 hover:bg-orange-100 transition-all font-medium">
                                                        #{s.id} {s.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 px-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleAsk} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Спросить лисёнка..."
                            className="flex-grow border-gray-100 bg-gray-50 rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={loading || !question.trim()}
                            className="bg-orange-500 text-white p-2.5 rounded-2xl hover:bg-orange-600 disabled:opacity-30 transition-all shadow-md active:scale-95"
                        >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Кнопка открытия (Лисенок) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative w-16 h-16 rounded-full bg-white shadow-2xl border-2 border-orange-100 flex items-center justify-center transition-all ${isOpen ? "scale-90" : "hover:scale-110 hover:border-orange-200 active:scale-95"
                    }`}
            >
                <img
                    src="/fox.png"
                    alt="Лисёнок-Помощник"
                    className={`w-14 h-14 transition-all group-hover:rotate-12 group-hover:scale-110 ${loading ? "animate-pulse" : "animate-bounce-slow"}`}
                    style={{ mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.1)' }}
                />
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white animate-bounce"></div>
                )}
                <div className="absolute -left-32 bottom-2 bg-white text-gray-700 px-4 py-2 rounded-2xl shadow-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-gray-50 hidden md:block">
                    Привет! Нужна помощь? 🦊
                </div>
            </button>

            <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom-4 { from { transform: translateY(1rem); } to { transform: translateY(0); } }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-in { animation: fade-in 0.3s ease-out, slide-in-from-bottom-4 0.3s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
        </div>
    );
}
