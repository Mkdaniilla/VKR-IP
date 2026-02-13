import React, { useState, useRef, useEffect } from "react";
import { askAI } from "../lib/api";
import {
    MessageSquare,
    X,
    Send,
    Zap,
    Bot,
    User,
    ExternalLink,
    ChevronDown
} from "lucide-react";

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

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

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
        } catch (err: any) {
            setChat((prev) => [
                ...prev,
                { role: "ai", text: "Ошибка: " + err.message }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[99999] flex flex-col-reverse items-end">
            {/* Chat Button */}
            <button
                onClick={toggleChat}
                title="AI Помощник"
                className={`group relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_15px_40px_rgba(34,211,238,0.3)] border border-white/20 flex items-center justify-center transition-all duration-500 cursor-pointer outline-none ${isOpen ? "rotate-[360deg] scale-90" : "hover:scale-110 hover:shadow-[0_20px_50px_rgba(34,211,238,0.5)] active:scale-95"
                    }`}
            >
                <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                {isOpen ? (
                    <X className="w-8 h-8 text-white relative z-10" />
                ) : (
                    <MessageSquare className="w-8 h-8 text-white relative z-10" />
                )}
                {!isOpen && (
                    <div className="absolute top-0 right-0 bg-cyan-400 w-4 h-4 rounded-full border-[3px] border-[#020617] animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)] pointer-events-none"></div>
                )}
            </button>

            {/* Premium Chat Interface */}
            {isOpen && (
                <div
                    className="w-[340px] md:w-[360px] glass-card rounded-[2.5rem] rounded-br-none mb-4 shadow-[0_45px_110px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden flex flex-col h-[550px] md:h-[620px] animate-in-smart origin-bottom-right z-top"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 backdrop-blur-3xl p-5 text-white flex items-center justify-between border-b border-white/5 relative overflow-hidden text-left">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[40px] -ml-16 -mt-16 pointer-events-none"></div>

                        <div className="flex items-center gap-4 relative z-10 pointer-events-none">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg overflow-hidden backdrop-blur-md bg-white/5">
                                <Bot className="w-7 h-7 text-cyan-400" />
                            </div>
                            <div>
                                <p className="font-bold text-xs tracking-tight uppercase leading-none mb-1">Матрешка AI</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                                    <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Online</span>
                                </div>
                            </div>
                        </div>

                        <button
                            title="Свернуть"
                            onClick={() => setIsOpen(false)}
                            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                            <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div ref={scrollRef} className="flex-grow overflow-y-auto p-5 space-y-5 custom-scrollbar bg-black/40 text-left select-text scroll-smooth">
                        {chat.length === 0 && (
                            <div className="text-center py-12 px-6 h-full flex flex-col justify-center items-center">
                                <div className="w-20 h-20 mb-6 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-white/5">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
                                    <Bot className="w-10 h-10 text-cyan-400 relative z-10 animate-float" />
                                </div>
                                <h3 className="font-bold text-white text-base uppercase tracking-widest mb-2">Привет! Я Матрешка.</h3>
                                <p className="text-[10px] text-white/30 font-bold leading-relaxed uppercase tracking-widest text-center">
                                    Я ваш интеллектуальный помощник.<br />Задайте любой вопрос по базе знаний!
                                </p>
                            </div>
                        )}

                        {chat.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in-slide`}>
                                <div className={`max-w-[88%] p-4 rounded-[1.5rem] shadow-xl relative group/msg ${msg.role === "user"
                                    ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none border border-white/20"
                                    : "bg-white/10 text-white/90 border border-white/10 rounded-tl-none backdrop-blur-xl"
                                    }`}>
                                    <p className="text-[13px] font-medium whitespace-pre-wrap leading-relaxed tracking-wide">{msg.text}</p>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                                                Источники:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.sources.map(s => (
                                                    <a
                                                        key={s.id}
                                                        href={`/knowledge/${s.id}`}
                                                        className="text-[10px] bg-white/5 hover:bg-white/15 text-white/50 hover:text-cyan-400 px-3 py-1.5 rounded-xl border border-white/10 hover:border-cyan-400/40 transition-all font-bold uppercase tracking-tight flex items-center gap-2"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        {s.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-white/10 p-4 rounded-[1.5rem] rounded-tl-none border border-white/10 shadow-2xl backdrop-blur-xl flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0s]"></div>
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Анализ...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Field */}
                    <form onSubmit={handleAsk} className="p-5 bg-black/60 border-t border-white/5 flex gap-3 items-center backdrop-blur-3xl">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Спросить..."
                                className="glass-input !py-4 !h-14 w-full !text-sm !px-5 pr-12 !bg-white/5 focus:!bg-white/10 border-white/10 focus:border-cyan-500/50 transition-all placeholder:text-white/20 outline-none"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/10">
                                <Zap className="w-5 h-5" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            title="Отправить"
                            disabled={loading || !question.trim()}
                            className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl flex items-center justify-center hover:shadow-[0_10px_30px_rgba(34,211,238,0.4)] disabled:opacity-20 transition-all shadow-2xl active:scale-95 group/send"
                        >
                            <Send className="w-6 h-6 transition-transform group-hover/send:translate-x-1 group-hover/send:-translate-y-1" />
                        </button>
                    </form>
                </div>
            )}

            <style jsx>{`
                @keyframes smart-open {
                    from { opacity: 0; transform: scale(0.4) translateY(30px); filter: blur(15px); }
                    to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                }
                .animate-in-smart {
                    animation: smart-open 0.45s cubic-bezier(0.19, 1, 0.22, 1) forwards;
                }
                @keyframes slide-msg {
                    from { transform: translateY(15px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-in-slide { animation: slide-msg 0.4s ease-out forwards; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes float-ani {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-10px) rotate(3deg); }
                }
                .animate-float { animation: float-ani 6s ease-in-out infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}</style>
        </div>
    );
}
