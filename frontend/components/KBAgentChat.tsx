import React, { useState } from "react";
import { askAI } from "../lib/api";
import Card from "./ui/Card";

export default function KBAgentChat() {
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [chat, setChat] = useState<{ role: "user" | "ai"; text: string; sources?: { id: number; title: string }[] }[]>([]);

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
        <Card className="flex flex-col h-[500px] !p-0 overflow-hidden border-2 border-green-100 shadow-xl">
            <div className="bg-green-600 p-4 text-white font-bold flex items-center justify-between">
                <span>🤖 ИИ-ассистент БЗ</span>
                <span className="text-xs font-normal opacity-80">Отвечаю по вашей базе знаний</span>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {chat.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        <p className="text-3xl mb-2">👋</p>
                        <p className="text-sm">Задайте вопрос по статьям вашей базы знаний</p>
                    </div>
                )}
                {chat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.role === "user"
                                ? "bg-green-600 text-white rounded-tr-none"
                                : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                            }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Использованные статьи:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {msg.sources.map(s => (
                                            <a key={s.id} href={`/knowledge/${s.id}`} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100 transition-colors">
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
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleAsk} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    placeholder="Спросить ИИ..."
                    className="flex-grow border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </Card>
    );
}
