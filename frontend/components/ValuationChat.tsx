import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface Question {
    id: number;
    text: string;
    group: string;
}

interface Message {
    role: 'bot' | 'user';
    content: string;
    type?: 'question' | 'fact' | 'suggestion';
}

interface ValuationChatProps {
    ipType: string;
    onConfirmFact: (fact: any) => void;
    onFinish: () => void;
}

export default function ValuationChat({ ipType, onConfirmFact, onFinish }: ValuationChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Привет! Я ваш ИИ-ассистент по оценке. Чтобы расчет был точным и доказательным, мне нужно задать вам несколько уточняющих вопросов по вашему активу. Начнем?' }
    ]);
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchScenario() {
            try {
                const r = await fetch(`/api/valuation/interview/scenario/${ipType}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await r.json();
                setQuestions(data.questions || []);
            } catch (err) {
                console.error("Failed to fetch scenario", err);
            }
        }
        if (ipType) fetchScenario();
    }, [ipType]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue('');
        setLoading(true);

        // Логика интервьюера
        setTimeout(() => {
            if (currentQuestionIndex === -1) {
                // Первый вопрос
                setMessages(prev => [...prev, { role: 'bot', content: questions[0], type: 'question' }]);
                setCurrentQuestionIndex(0);
            } else {
                // Подтверждаем факт из ответа (упрощенно)
                const fact = {
                    question_group: ipType === 'software' ? 'Разработка' : 'Рынок',
                    value: userMsg,
                    evidence_source: 'Интервью',
                    status: 'confirmed'
                };
                onConfirmFact(fact);

                setMessages(prev => [...prev,
                { role: 'bot', content: 'Принято. Я добавил это в доказательную базу отчета.', type: 'fact' }
                ]);

                if (currentQuestionIndex + 1 < questions.length) {
                    const nextIdx = currentQuestionIndex + 1;
                    setTimeout(() => {
                        setMessages(prev => [...prev, { role: 'bot', content: questions[nextIdx], type: 'question' }]);
                        setCurrentQuestionIndex(nextIdx);
                    }, 800);
                } else {
                    setMessages(prev => [...prev, { role: 'bot', content: 'Отлично! Я собрал достаточно данных для формирования экспертного заключения. Теперь мы можем запускать расчет.', type: 'suggestion' }]);
                    onFinish();
                }
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[500px] bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tighter">Оценщик-интервьюер</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Online Analysis</span>
                        </div>
                    </div>
                </div>
                <Sparkles className="w-5 h-5 text-cyan-500/50" />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${m.role === 'user' ? 'bg-blue-500/20 border-blue-500/30' : 'bg-slate-800 border-white/10'}`}>
                                {m.role === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-cyan-400" />}
                            </div>
                            <div className={`p-4 rounded-3xl text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : m.type === 'fact'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-white/5 border border-white/5 text-white/80'
                                }`}>
                                {m.type === 'fact' && <CheckCircle2 className="w-4 h-4 mb-2" />}
                                {m.content}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl flex gap-2">
                            <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white/5 border-t border-white/5">
                <div className="relative group">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ваш ответ..."
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/20"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        title="Отправить ответ"
                        aria-label="Отправить ответ"
                        className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="mt-4 text-[9px] text-white/20 text-center font-bold uppercase tracking-widest">
                    Данные из чата формируют доказательную базу отчета
                </p>
            </div>
        </div>
    );
}
