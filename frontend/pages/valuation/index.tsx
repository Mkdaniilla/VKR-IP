"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";
import FormattedPrice from "../../components/FormattedPrice";
import {
  getToken,
  getIPObjects,
  IPType,
  ValuationPayload,
  getProtectedFileUrl,
  getApiUrl,
} from "../../lib/api";

import AssetHealthRadar from "../../components/AssetHealthRadar";
import ValuationChat from "../../components/ValuationChat";
import { Zap, Download, Scale, ShieldCheck, Box, ArrowRight, FileText, Bot } from "lucide-react";

const API_URL = getApiUrl();

type ValuationResponse = {
  id: number;
  baseline_value: number;
  ai_adjustment: number;
  final_value: number;
  final_value_min?: number;
  final_value_max?: number;
  currency: string;
  factors_breakdown?: { name: string; impact: number; type: 'percentage' | 'multiplier'; icon: string }[];
  evidence_logs?: { factor: string; value: string; source: string; status: string }[];
  multiples_used: {
    ai_bullets: string[];
    strategic_recommendations: { icon: string; text: string }[];
    methodology: string;
  };
  pdf_url: string;
};

export default function ValuationPage() {
  const [results, setResults] = useState<ValuationResponse | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownloadReport = async () => {
    if (!results) return;
    setGeneratingPdf(true);
    try {
      const blobUrl = await getProtectedFileUrl(`${API_URL}/api/valuation/report/${results.pdf_url.split("/").pop()}`);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Valuation_Report_${results.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Не удалось скачать отчет");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-12 pb-20 mt-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              Valuation <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Suite 2.0</span>
            </h1>
            <p className="max-w-2xl text-lg text-white/40 font-medium leading-relaxed">
              Профессиональный анализ НМА по стандартам <span className="text-cyan-400/60 font-black tracking-widest uppercase text-sm">IVSC</span>.
              Интерактивное интервью на базе ИИ для сбора доказательной базы и точного расчета стоимости.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Результат оценки</span>
            <div className="text-4xl md:text-5xl font-black text-white px-8 py-4 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl backdrop-blur-xl">
              {results ? (
                <div className="flex flex-col items-end">
                  <span className="text-cyan-400">{results.final_value.toLocaleString()} {results.currency}</span>
                </div>
              ) : "0 RUB"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Interface: Chat or Results */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {!results ? (
              <ValuationChat onValuationComplete={(res) => setResults(res)} />
            ) : (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                {/* Main Value Card */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-cyan-600/20 to-indigo-600/20 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl">
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                    <ShieldCheck className="w-64 h-64 text-white" />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="space-y-6 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Рыночная стоимость (Fair Value)</span>
                      </div>
                      <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter">
                        <FormattedPrice value={results.final_value} currency={results.currency} />
                      </h2>
                      {results.final_value_min && (
                        <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                          <span className="text-xs font-bold text-white/30 uppercase">Диапазон:</span>
                          <span className="text-sm font-black text-cyan-400">
                            {results.final_value_min.toLocaleString()} — {results.final_value_max?.toLocaleString()} {results.currency}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleDownloadReport}
                      disabled={generatingPdf}
                      className="group/btn flex items-center gap-6 px-10 py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {generatingPdf ? "Формирование..." : "Скачать PDF отчет"}
                      <div className="p-2 bg-slate-950 rounded-lg group-hover/btn:translate-x-1 transition-transform">
                        <Download className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Factors Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter">Факторы влияния</h3>
                      <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-400 uppercase">AI Analytics</div>
                    </div>
                    <div className="space-y-6">
                      {results.factors_breakdown?.map((f, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg border border-white/5 group-hover:bg-white/10 transition-colors">
                              {f.icon}
                            </div>
                            <span className="text-sm text-white/60 font-bold">{f.name}</span>
                          </div>
                          <span className={`text-sm font-black ${f.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {f.impact > 0 ? '+' : ''}{f.impact}{f.type === 'percentage' ? '%' : 'x'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-8">
                    <div className="bg-white/5 border border-white/5 rounded-[3rem] p-8 flex-1">
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6">Confidence Score</h3>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black inline-block py-1 px-3 uppercase rounded-full text-cyan-600 bg-cyan-200">
                              Высокая точность
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black inline-block text-cyan-600">85%</span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-white/10">
                          <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-cyan-500 animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/20 uppercase font-bold leading-relaxed px-2 mt-4 text-center">
                        Расчёт выполнен на основе {results.evidence_logs?.length || 0} подтвержденных фактов.
                      </p>
                    </div>
                    <button
                      onClick={() => setResults(null)}
                      className="w-full py-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/40 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                    >
                      Сбросить и начать новый расчет
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
              <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em] mb-8">Asset Health Radar</h3>
              <div className="h-[300px] flex items-center justify-center">
                <AssetHealthRadar />
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-8">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <Zap className="w-4 h-4 text-yellow-500" />
                Стратегия
              </h3>
              <div className="space-y-6">
                {results?.multiples_used?.strategic_recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group">
                    <span className="text-xl group-hover:scale-110 transition-transform">{rec.icon}</span>
                    <p className="text-[10px] text-white/50 font-bold uppercase leading-relaxed">{rec.text}</p>
                  </div>
                )) || (
                    <div className="p-8 text-center text-[10px] text-white/20 uppercase font-black">
                      Данные появятся после расчета
                    </div>
                  )}
              </div>
            </div>

            <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2.5rem] flex items-start gap-4">
              <Scale className="w-8 h-8 text-cyan-500 flex-shrink-0" />
              <div className="space-y-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Compliance</span>
                <p className="text-[10px] text-white/60 font-bold uppercase leading-[1.5em]">
                  Relief from Royalty + DCF. <br />
                  IVSC 2024 / IVS 210.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
