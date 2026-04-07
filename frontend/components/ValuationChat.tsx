import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Box, FileText, ArrowRight } from 'lucide-react';
import { IPObject, getIPObjects, IP_TYPES_RU } from '../lib/api';

interface Message {
    role: 'bot' | 'user';
    content: string;
    type?: 'question' | 'fact' | 'suggestion' | 'selection' | 'result';
    data?: any;
}

interface ValuationChatProps {
    onValuationComplete: (res: any) => void;
}

type InterviewPhase = 'selection' | 'scenario' | 'industry' | 'financials' | 'calculating' | 'finished';

export default function ValuationChat({ onValuationComplete }: ValuationChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Привет! Я ваш ИИ-ассистент MDM. Сегодня мы проведем профессиональную оценку вашего актива через интерактивное интервью.' }
    ]);
    const [phase, setPhase] = useState<InterviewPhase>('selection');
    const [ipObjects, setIpObjects] = useState<IPObject[]>([]);
    const [selectedIP, setSelectedIP] = useState<IPObject | null>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [formData, setForm] = useState<any>({
        annual_revenue: 0,
        cost_rd: 0,
        interview_responses: [],
        subtype: '',
        industry: 'it'
    });
    const [scenarioTitle, setScenarioTitle] = useState('Аудит актива');
    const [financialStep, setFinancialStep] = useState(0); // 0: revenue, 1: r&d

    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Загрузка активов при старте
    useEffect(() => {
        async function load() {
            try {
                const objects = await getIPObjects();
                setIpObjects(objects);

                // Проверка objectId в URL для автовыбора
                const urlParams = new URLSearchParams(window.location.search);
                const objId = urlParams.get('objectId');
                if (objId) {
                    const found = objects.find(o => o.id === parseInt(objId));
                    if (found) {
                        handleSelectIP(found);
                        return;
                    }
                }

                setMessages(prev => [...prev, { role: 'bot', type: 'selection', content: 'Для начала, выберите объект из вашего портфеля, который мы будем оценивать:' }]);
            } catch (err) {
                console.error('[ValuationChat] Load objects error:', err);
                setMessages(prev => [...prev, { role: 'bot', content: 'Ошибка загрузки объектов. Пожалуйста убедитесь, что вы авторизованы.' }]);
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // 2. Обработка выбора актива
    const handleSelectIP = async (ip: IPObject) => {
        const typeKey = (ip.type || 'other').toLowerCase();
        const typeRus = IP_TYPES_RU[typeKey as keyof typeof IP_TYPES_RU] || ip.type || 'Актив';

        // План: Ограничиваем оценку только брендами для ВКР
        const isSupported = typeKey === 'trademark';

        if (!isSupported) {
            setMessages(prev => [...prev,
            { role: 'user', content: `Выбираю объект: ${ip.title}` },
            {
                role: 'bot',
                content: `На текущем этапе разработки модуль интеллектуальной оценки (Deep AI Valuation) полностью откалиброван для Товарных знаков. Оценка типа "${typeRus}" находится в режиме закрытого тестирования. Пожалуйста, выберите Товарный знак для демонстрации всех возможностей системы.`
            }
            ]);
            return;
        }

        setSelectedIP(ip);
        setMessages(prev => [...prev,
        { role: 'user', content: `Выбираю объект: ${ip.title}` },
        { role: 'bot', content: `Отлично. Я подготовил сценарий аудита для типа "${typeRus}". Начнем с качественных характеристик.` }
        ]);
        setLoading(true);

        try {
            const r = await fetch(`/api/valuation/interview/scenario/${ip.type}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            const scenario = await r.json();

            setQuestions(scenario.questions || []);
            setScenarioTitle(scenario.title || 'Аудит актива');
            setCurrentQuestionIdx(0);
            setForm(f => ({ ...f, subtype: scenario.title || '' }));
            setPhase('scenario');

            setTimeout(() => {
                const firstQ = scenario.questions && scenario.questions[0] ? scenario.questions[0] : 'Расскажите подробнее об объекте';
                setMessages(prev => [...prev, { role: 'bot', content: firstQ, type: 'question' }]);
                setLoading(false);
            }, 1000);
        } catch (err) {
            console.error('[ValuationChat] Scenario load error:', err);
            setMessages(prev => [...prev, { role: 'bot', content: 'Не удалось загрузить специфичный сценарий, переходим к экономике.' }]);
            setPhase('financials');
            setLoading(false);
        }
    };

    const handleSelectIndustry = (code: string, label: string) => {
        setForm(f => ({ ...f, industry: code }));
        setMessages(prev => [...prev,
        { role: 'user', content: `Отрасль: ${label}` },
        { role: 'bot', content: 'Отлично. Ставки роялти и рисков настроены. Теперь перейдем к экономике. Укажите годовую выручку актива (₽). Если её пока нет, введите 0.' }
        ]);
        setPhase('financials');
    };

    const handleSend = async () => {
        if (!inputValue.trim() || loading) return;
        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue('');
        setLoading(true);

        // Имитация раздумий ИИ
        setTimeout(async () => {
            if (phase === 'scenario') {
                // ... (логика обновления ответов)
                setForm(f => ({
                    ...f,
                    interview_responses: [...f.interview_responses, {
                        question_group: scenarioTitle,
                        question_text: questions[currentQuestionIdx],
                        value: userMsg,
                        status: 'confirmed'
                    }]
                }));

                const nextIdx = currentQuestionIdx + 1;
                if (nextIdx < questions.length) {
                    setMessages(prev => [...prev, { role: 'bot', content: questions[nextIdx], type: 'question' }]);
                    setCurrentQuestionIdx(nextIdx);
                } else {
                    // Переход к ВЫБОРУ ОТРАСЛИ (вместо экономики)
                    setPhase('industry');
                    setMessages(prev => [...prev, {
                        role: 'bot',
                        content: 'На основе ваших ответов я подготовил рыночные коэффициенты. Пожалуйста, подтвердите отрасль вашего актива для применения стандартов IVS:'
                    }]);
                }
            } else if (phase === 'financials') {
                const val = parseFloat(userMsg.replace(/[^0-9.]/g, '')) || 0;

                if (financialStep === 0) {
                    // Обработали выручку, переходим к R&D
                    setForm(f => ({ ...f, annual_revenue: val }));
                    setFinancialStep(1);
                    setMessages(prev => [...prev, { role: 'bot', content: 'Записал. А каков был общий бюджет на разработку или создание этого актива (R&D Cost)? Если данные неизвестны, укажите 0.' }]);
                } else {
                    // Обработали R&D, запускаем расчет
                    setForm(f => {
                        const finalUpdated = { ...f, cost_rd: val };
                        setPhase('calculating');
                        runFinalValuation(finalUpdated);
                        return finalUpdated;
                    });
                }
            }
            setLoading(false);
        }, 800);
    };

    const runFinalValuation = async (finalData: any) => {
        setMessages(prev => [...prev, { role: 'bot', content: 'Анализирую данные и формирую отчет по стандартам IVSC...' }]);

        try {
            const payload = {
                ip_object_id: selectedIP?.id,
                ip_type: selectedIP?.type || 'software',
                jurisdictions: ['RU'],
                brand_strength: 5,
                royalty_rate: 0,
                remaining_years: 5,
                market_reach: 'national',
                currency: 'RUB',
                legal_robustness: ['registered'],
                scope_protection: 5,
                valuation_purpose: 'market',
                subtype_metrics: {},
                ...finalData, // Твой выбор (отрасль и т.д.) перекрывает дефолты
            };

            const r = await fetch('/api/valuation/estimate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!r.ok) {
                const errData = await r.json();
                throw new Error(errData.detail || 'Ошибка сервера');
            }

            const res = await r.json();
            onValuationComplete(res);
            setPhase('finished');
            setMessages(prev => [...prev, {
                role: 'bot',
                type: 'result',
                content: `Оценка завершена успешно! Мы определили рыночную стоимость актива.`,
                data: res
            }]);
        } catch (err: any) {
            console.error('[ValuationChat] Calculation error:', err);
            setMessages(prev => [...prev, { role: 'bot', content: 'Ошибка при расчете: ' + (err.message || 'сервер недоступен') }]);
            setPhase('financials');
        }
    };

    return (
        <div className="flex flex-col h-[750px] bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <Bot className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tighter">Мастер оценки ИС</h4>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">MDM Агент (ИИ)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-slate-900/50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                        <div className={`max-w-[85%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border ${m.role === 'user' ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-slate-800 border-white/10'}`}>
                                {m.role === 'user' ? <User className="w-5 h-5 text-indigo-400" /> : <Bot className="w-5 h-5 text-cyan-400" />}
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className={`p-6 rounded-[2rem] text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                                    : 'bg-white/5 border border-white/5 text-white/90 shadow-sm'
                                    }`}>
                                    {m.content}
                                </div>

                                {/* Выбор объекта */}
                                {m.type === 'selection' && phase === 'selection' && (
                                    <div className="grid grid-cols-1 gap-2 mt-2">
                                        {ipObjects.map(obj => (
                                            <button
                                                key={obj.id}
                                                onClick={() => handleSelectIP(obj)}
                                                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Box className="w-5 h-5 text-white/40 group-hover:text-cyan-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white/80">{obj.title || 'Без названия'}</span>
                                                        <span className="text-[10px] text-white/30 uppercase tracking-wider">
                                                            {obj.type ? (IP_TYPES_RU[obj.type.toLowerCase() as keyof typeof IP_TYPES_RU] || obj.type) : 'Неизвестный тип'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-cyan-400" />
                                            </button>
                                        ))}
                                        {ipObjects.length === 0 && !loading && (
                                            <p className="text-[10px] text-rose-400 uppercase font-black px-4">Нет доступных активов в портфеле</p>
                                        )}
                                    </div>
                                )}

                                {/* Выбор направленности знака */}
                                {phase === 'scenario' && m.role === 'bot' && m.content.includes('направленность знака') && i === messages.length - 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                        {[
                                            { id: 'corp', n: 'Корпоративный бренд' },
                                            { id: 'prod', n: 'Продуктовая линейка' },
                                            { id: 'retail', n: 'Торговая сеть' },
                                            { id: 'personal', n: 'Личный бренд' },
                                            { id: 'franchise', n: 'Франшиза' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setInputValue(opt.n);
                                                    setTimeout(() => {
                                                        const btn = document.getElementById('chat-send-btn');
                                                        btn?.click();
                                                    }, 50);
                                                }}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all text-[10px] font-bold text-white uppercase text-left pl-4"
                                            >
                                                {opt.n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Выбор географии (Market Reach) */}
                                {phase === 'scenario' && m.role === 'bot' && m.content.includes('других странах') && i === messages.length - 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                        {[
                                            { id: 'national', n: 'Только Россия (Нац.)' },
                                            { id: 'regional', n: 'СНГ / Ближнее зарубежье' },
                                            { id: 'global', n: 'Глобальный (Экспорт)' },
                                            { id: 'local', n: 'Локальный рынок (Регион)' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setInputValue(opt.n);
                                                    setTimeout(() => {
                                                        const btn = document.getElementById('chat-send-btn');
                                                        btn?.click();
                                                    }, 50);
                                                }}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all text-[10px] font-bold text-white uppercase text-left pl-4"
                                            >
                                                {opt.n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Выбор лицензионной истории */}
                                {phase === 'scenario' && m.role === 'bot' && m.content.includes('лицензии на использование') && i === messages.length - 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                        {[
                                            { id: 'rospatent', n: 'Да, зарегистрированы в Роспатенте' },
                                            { id: 'simple', n: 'Да, без регистрации' },
                                            { id: 'planned', n: 'В процессе переговоров' },
                                            { id: 'none', n: 'Нет, используем единолично' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setInputValue(opt.n);
                                                    setTimeout(() => {
                                                        const btn = document.getElementById('chat-send-btn');
                                                        btn?.click();
                                                    }, 50);
                                                }}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all text-[10px] font-bold text-white uppercase text-left pl-4"
                                            >
                                                {opt.n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Выбор обременений (Pledge) */}
                                {phase === 'scenario' && m.role === 'bot' && m.content.includes('под залогом в банке') && i === messages.length - 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                        {[
                                            { id: 'none', n: 'Нет, обременений нет' },
                                            { id: 'bank', n: 'Да, в залоге у банка' },
                                            { id: 'dispute', n: 'Да, судебные споры / арест' },
                                            { id: 'lease', n: 'Ограничено лицензией' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setInputValue(opt.n);
                                                    setTimeout(() => {
                                                        const btn = document.getElementById('chat-send-btn');
                                                        btn?.click();
                                                    }, 50);
                                                }}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-rose-500/20 hover:border-rose-500/50 transition-all text-[10px] font-bold text-white uppercase text-left pl-4"
                                            >
                                                {opt.n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Выбор истории защиты (Defense History) */}
                                {phase === 'scenario' && m.role === 'bot' && m.content.includes('защиты бренда в суде') && i === messages.length - 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                        {[
                                            { id: 'win_many', n: 'Да, несколько успешных защит' },
                                            { id: 'win_one', n: 'Был один успешный кейс' },
                                            { id: 'neutral', n: 'Споров не было, бренд надежен' },
                                            { id: 'risk', n: 'Были сложности / частичные отказы' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setInputValue(opt.n);
                                                    setTimeout(() => {
                                                        const btn = document.getElementById('chat-send-btn');
                                                        btn?.click();
                                                    }, 50);
                                                }}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-[10px] font-bold text-white uppercase text-left pl-4"
                                            >
                                                {opt.n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Выбор бюджета на продвижение (Budget) */}
                                {phase === 'scenario' && m.role === 'bot' && m.content.includes('бюджет на продвижение') && i === messages.length - 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                        {[
                                            { id: 'low', n: 'До 50 000 руб./мес.' },
                                            { id: 'medium', n: '50 000 – 200 000 руб./мес.' },
                                            { id: 'high', n: '200 000 – 1 000 000 руб./мес.' },
                                            { id: 'pro', n: '1 000 000 – 5 000 000 руб./мес.' },
                                            { id: 'leader', n: 'Свыше 5 млн руб./мес.' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setInputValue(opt.n);
                                                    setTimeout(() => {
                                                        const btn = document.getElementById('chat-send-btn');
                                                        btn?.click();
                                                    }, 50);
                                                }}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-violet-500/20 hover:border-violet-500/50 transition-all text-[10px] font-bold text-white uppercase text-left pl-4"
                                            >
                                                {opt.n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Выбор отрасали */}
                                {phase === 'industry' && m.role === 'bot' && i === messages.length - 1 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {[
                                            { id: 'it', n: 'IT / ПО' },
                                            { id: 'pharma', n: 'Фармацевтика' },
                                            { id: 'manufacturing', n: 'Промышленность' },
                                            { id: 'fintech', n: 'Финтех' },
                                            { id: 'retail', n: 'Ритейл / Ткани' },
                                            { id: 'fmcg', n: 'FMCG (Товары)' },
                                            { id: 'energy', n: 'Энергетика' },
                                            { id: 'agro', n: 'Агросектор' },
                                            { id: 'horeca', n: 'HoReCa (Отели)' },
                                            { id: 'media', n: 'Медиа / Кино' },
                                            { id: 'services', n: 'Услуги' },
                                            { id: 'education', n: 'Образование' },
                                            { id: 'construction', n: 'Строительство' },
                                            { id: 'other', n: 'Другое' }
                                        ].map(ind => (
                                            <button
                                                key={ind.id}
                                                onClick={() => handleSelectIndustry(ind.id, ind.n)}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-[9px] font-bold text-white uppercase tracking-tight leading-tight"
                                            >
                                                {ind.n}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Результаты */}
                                {m.type === 'result' && m.data && (
                                    <div className="mt-4 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] flex flex-col gap-6 animate-in zoom-in-95">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Рыночная стоимость</span>
                                            <span className="text-emerald-400 font-black text-2xl">
                                                {(m.data.final_value || 0).toLocaleString()} ₽
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <span className="block text-[8px] text-white/30 uppercase font-bold mb-1">Min диапазон</span>
                                                <span className="text-xs text-white/70">{(m.data.final_value_min || (m.data.final_value || 0) * 0.9).toLocaleString()} ₽</span>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <span className="block text-[8px] text-white/30 uppercase font-bold mb-1">Max диапазон</span>
                                                <span className="text-xs text-white/70">{(m.data.final_value_max || (m.data.final_value || 0) * 1.1).toLocaleString()} ₽</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (m.data.pdf_url) {
                                                    window.open(`/api/valuation/report/${m.data.pdf_url.split('/').pop()}`, '_blank');
                                                }
                                            }}
                                            className="w-full flex items-center justify-center gap-3 p-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            <FileText className="w-5 h-5" />
                                            Скачать PDF-Заключение
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start p-4">
                        <div className="flex gap-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input section */}
            {phase !== 'finished' && (
                <div className="p-8 bg-slate-950 border-t border-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={phase === 'selection' ? 'Сначала выберите объект из списка выше...' : 'Введите ваш ответ...'}
                            disabled={phase === 'selection' || loading}
                            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-5 pl-8 pr-16 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/20"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || loading}
                            title="Отправить сообщение"
                            className="absolute right-3 top-3 bottom-3 w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
