import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import { getToken } from '../../lib/api';

interface Risk {
    id: string;
    type: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    text: string;
    context: string;
    recommendation?: string;
}

interface DocumentData {
    document_id: number;
    filename: string;
    html: string;
    risks: Risk[];
    total_risks: number;
    severity_counts: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

const severityColors = {
    critical: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: '🔴' },
    high: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', icon: '🟠' },
    medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', icon: '🟡' },
    low: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', icon: '🟢' },
};

export default function DocumentViewer() {
    const router = useRouter();
    const { id } = router.query;
    const [data, setData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchDocument = async () => {
            try {
                const token = getToken();
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}/view-highlighted`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Не удалось загрузить документ');
                }

                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [id]);

    useEffect(() => {
        if (!data) return;

        // Добавляем обработчики кликов на подсвеченные риски
        const marks = document.querySelectorAll('.risk-highlight');
        marks.forEach((mark) => {
            mark.addEventListener('click', (e) => {
                const riskId = (e.target as HTMLElement).dataset.riskId;
                if (riskId) {
                    setSelectedRisk(riskId);
                    // Скроллим к риску в боковой панели
                    const riskElement = document.getElementById(`sidebar-${riskId}`);
                    if (riskElement) {
                        riskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        });
    }, [data]);

    const scrollToRisk = (riskId: string) => {
        setSelectedRisk(riskId);
        const element = document.querySelector(`[data-risk-id="${riskId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Анимация мигания
            element.classList.add('animate-pulse');
            setTimeout(() => element.classList.remove('animate-pulse'), 2000);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="glass-panel p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <p className="text-white/70">Загрузка документа...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="glass-panel p-8 text-center max-w-md">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Ошибка</h2>
                        <p className="text-white/70">{error || 'Документ не найден'}</p>
                        <button
                            onClick={() => router.back()}
                            className="glass-button-primary mt-4"
                        >
                            Вернуться назад
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="text-cyan-400 hover:text-cyan-300 mb-2 flex items-center gap-2"
                        >
                            ← Назад
                        </button>
                        <h1 className="text-3xl font-black text-white mb-2">
                            📄 {data.filename}
                        </h1>
                        <div className="flex gap-4 text-sm">
                            <span className="text-white/70">
                                Найдено рисков: <span className="text-cyan-400 font-bold">{data.total_risks}</span>
                            </span>
                            {data.severity_counts.critical > 0 && (
                                <span className="text-red-400">🔴 {data.severity_counts.critical} критических</span>
                            )}
                            {data.severity_counts.high > 0 && (
                                <span className="text-orange-400">🟠 {data.severity_counts.high} высоких</span>
                            )}
                            {data.severity_counts.medium > 0 && (
                                <span className="text-yellow-400">🟡 {data.severity_counts.medium} средних</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Document Content */}
                    <div className="col-span-8">
                        <div className="glass-panel p-8 prose prose-invert max-w-none">
                            <div
                                className="document-content"
                                dangerouslySetInnerHTML={{ __html: data.html }}
                            />
                        </div>
                    </div>

                    {/* Risks Sidebar */}
                    <div className="col-span-4">
                        <div className="glass-panel p-6 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
                            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                                🎯 Обнаруженные риски
                            </h2>

                            {data.risks.length === 0 ? (
                                <p className="text-white/50 text-center py-8">
                                    Рисков не обнаружено
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {data.risks.map((risk) => {
                                        const colors = severityColors[risk.severity];
                                        const isSelected = selectedRisk === risk.id;

                                        return (
                                            <div
                                                key={risk.id}
                                                id={`sidebar-${risk.id}`}
                                                onClick={() => scrollToRisk(risk.id)}
                                                className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${colors.bg} ${colors.border} ${colors.text}
                          ${isSelected ? 'ring-2 ring-cyan-400 scale-105' : 'hover:scale-102'}
                        `}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">{colors.icon}</span>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-white mb-1">{risk.title}</h3>
                                                        <p className="text-xs opacity-70 mb-2">"{risk.text}"</p>
                                                        <div className="text-[10px] opacity-50 italic mb-2">
                                                            ...{risk.context}...
                                                        </div>
                                                        {risk.recommendation && (
                                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-sm">💡</span>
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-white/90 mb-1">Рекомендация:</p>
                                                                        <p className="text-[10px] opacity-80 leading-relaxed">
                                                                            {risk.recommendation}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .document-content {
          color: white;
          line-height: 1.8;
        }
        
        .document-content p {
          margin-bottom: 1rem;
        }

        .document-content mark.risk-highlight {
          cursor: pointer;
          transition: all 0.2s;
        }

        .document-content mark.risk-highlight:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px currentColor;
        }

        .prose-invert {
          --tw-prose-body: rgb(255 255 255 / 0.8);
          --tw-prose-headings: rgb(255 255 255);
          --tw-prose-bold: rgb(255 255 255);
        }
      `}</style>
        </DashboardLayout>
    );
}
