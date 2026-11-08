import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowDownRight,
  Sliders,
  RotateCcw,
  Download,
  BarChart3,
  Layers,
} from 'lucide-react';
import { formatCurrencyBRL, formatNumberBR } from '../utils/simulationEngine';

export default function SimulationDrawer({
  isOpen,
  onClose,
  simulation,
  scenario,
  setScenario,
  onExportJSON,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bottlenecks' | 'whatif'

  if (!isOpen) return null;

  const { summary, stageFunnel, bottlenecks } = simulation;

  const getRoasStatus = (roas) => {
    if (roas >= 3.5) {
      return {
        label: 'Escala Alta (Excelente)',
        badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60',
      };
    }
    if (roas >= 2.0) {
      return {
        label: 'Funil Saudável (Lucrativo)',
        badgeClass: 'bg-blue-950/90 text-sky-300 border-blue-700/60',
      };
    }
    if (roas >= 1.0) {
      return {
        label: 'Margem Moderada (Empate)',
        badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-700/60',
      };
    }
    return {
      label: 'Abaixo do Ponto de Equilíbrio',
      badgeClass: 'bg-red-950/90 text-red-300 border-red-700/60',
    };
  };

  const roasBadge = getRoasStatus(summary.roas);
  const hasScenarioActive =
    scenario.trafficBoostPct !== 0 ||
    scenario.conversionBoostPct !== 0 ||
    scenario.costReductionPct !== 0;

  return (
    <div className="fixed inset-y-0 right-0 top-16 w-full sm:w-[460px] lg:w-[520px] bg-[#1E1E24] border-l border-white/[0.08] shadow-[-20px_0_50px_rgba(0,0,0,0.75)] z-40 flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#18181D]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center border border-emerald-400/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Simulação Financeira & Projeção
              </h2>
              {hasScenarioActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-950/90 text-violet-300 border border-violet-700/60">
                  Cenário Ativo
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Cálculo em tempo real de ponta a ponta do funil
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-[#272730] hover:bg-[#32323D] text-zinc-400 hover:text-white border border-white/[0.08] transition-colors"
          title="Fechar Painel de Simulação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.08] bg-[#1E1E24] flex items-center gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white border border-emerald-500'
              : 'bg-[#25252E] text-zinc-400 hover:text-zinc-200 border border-white/[0.07]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Projeção & Gargalos
        </button>
        <button
          onClick={() => setActiveTab('bottlenecks')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'bottlenecks'
              ? 'bg-blue-600 text-white border border-blue-500'
              : 'bg-[#25252E] text-zinc-400 hover:text-zinc-200 border border-white/[0.07]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Etapas ({bottlenecks.length})
        </button>
        <button
          onClick={() => setActiveTab('whatif')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'whatif'
              ? 'bg-violet-600 text-white border border-violet-500'
              : 'bg-[#25252E] text-zinc-400 hover:text-zinc-200 border border-white/[0.07]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Simulador "E Se"
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Main Financial Hero Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#23232D] to-[#18181F] border border-emerald-700/35">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Faturamento Total Estimado
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${roasBadge.badgeClass}`}
            >
              {roasBadge.label}
            </span>
          </div>

          <div className="font-mono text-3xl font-extrabold text-emerald-400 tracking-tight">
            {formatCurrencyBRL(summary.totalRevenue)}
          </div>

          <div className="mt-3 pt-3 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block">
                Investimento Tráfego
              </span>
              <span className="font-mono font-bold text-sky-400">
                {formatCurrencyBRL(summary.totalInvestment)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">
                Lucro Líquido Est.
              </span>
              <span
                className={`font-mono font-bold ${
                  summary.netProfit >= 0 ? 'text-emerald-300' : 'text-red-400'
                }`}
              >
                {formatCurrencyBRL(summary.netProfit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">
                ROAS Global
              </span>
              <span className="font-mono font-extrabold text-amber-400">
                {summary.roas.toFixed(2)}x{' '}
                <span className="text-[10px] font-normal text-zinc-400">
                  ({summary.roiPct >= 0 ? '+' : ''}
                  {Math.round(summary.roiPct)}%)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Unit Economics Cards: CPA, CPL, Clientes, Leads */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#18181D] border border-amber-700/30">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span>CPA Médio (Custo/Venda)</span>
              <Target className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {formatCurrencyBRL(summary.cpa)}
            </div>
            <div className="text-[10px] text-amber-300/80 mt-0.5 font-mono">
              {formatNumberBR(summary.totalCustomers)} vendas principais
              {summary.totalUpsells > 0
                ? ` + ${formatNumberBR(summary.totalUpsells)} upsells`
                : ''}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#18181D] border border-emerald-700/30">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
              <span>CPL Médio (Custo/Lead)</span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {formatCurrencyBRL(summary.cpl)}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5 font-mono">
              {formatNumberBR(summary.totalLeads)} leads capturados
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Gráfico de Gargalos: Queda Percentual Etapa por Etapa */}
            <div className="p-4 rounded-xl bg-[#18181D] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                    Gráfico de Gargalos do Funil
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Queda percentual de conversão de etapa em etapa
                  </p>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#25252E] text-zinc-200 border border-white/[0.08]">
                  Conv. Global: {summary.overallConversionRate.toFixed(2)}%
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {stageFunnel.map((stage, idx) => (
                  <div key={stage.id} className="space-y-1.5">
                    {/* Drop-off Connector Banner between macro stages */}
                    {idx > 0 && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#121214] border border-white/[0.06] text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            Retenção da etapa:{' '}
                            <strong className="text-white font-mono">
                              {stage.stepConversionPct.toFixed(1)}%
                            </strong>
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-semibold text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-700/40">
                          -{stage.stepDropOffPct.toFixed(1)}% queda (
                          -{formatNumberBR(stage.lostVolume)})
                        </span>
                      </div>
                    )}

                    {/* Stage Bar */}
                    <div className="p-2.5 rounded-lg bg-[#1E1E24] border border-white/[0.07]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="font-semibold text-zinc-100">
                            {stage.label}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white">
                          {formatNumberBR(stage.volume)}
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-[#121214] rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${stage.widthPct}%`,
                            backgroundColor: stage.color,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        {stage.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnóstico Inteligente do Principal Gargalo */}
            {bottlenecks.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-700/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Maior Gargalo Detectado: {bottlenecks[0].title}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Esta etapa apresenta uma retenção de{' '}
                  <strong className="text-emerald-300 font-mono">
                    {bottlenecks[0].conversionRate.toFixed(1)}%
                  </strong>{' '}
                  e queda de{' '}
                  <strong className="text-amber-300 font-mono">
                    {bottlenecks[0].dropOffRate.toFixed(1)}%
                  </strong>{' '}
                  (perdendo{' '}
                  <strong className="text-white font-mono">
                    {formatNumberBR(bottlenecks[0].dropOffVolume)}
                  </strong>{' '}
                  usuários de {formatNumberBR(bottlenecks[0].inputVolume)} que entram).
                  Otimizar esta taxa em <strong>+5%</strong> aumentará diretamente o volume nas etapas finais de conversão.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'bottlenecks' && (
          <div className="space-y-2.5">
            <div className="text-xs text-zinc-400 mb-2">
              Análise individual de todas as etapas ativas no canvas, ordenadas pela maior taxa de perda (drop-off):
            </div>
            {bottlenecks.map((item, idx) => (
              <div
                key={item.nodeId}
                className="p-3 rounded-xl bg-[#18181D] border border-white/[0.08] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded bg-[#25252E] font-mono text-[10px] font-bold flex items-center justify-center text-sky-300 border border-white/[0.08] shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {item.title}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                      item.severity === 'critical'
                        ? 'bg-red-950/80 text-red-300 border-red-700/60'
                        : item.severity === 'warning'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                    }`}
                  >
                    -{item.dropOffRate.toFixed(1)}% queda
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#121214] p-2 rounded-lg font-mono border border-white/[0.06]">
                  <div>
                    <span className="text-[9px] text-zinc-500 block">ENTRADA</span>
                    <span className="text-sky-300 font-semibold">
                      {formatNumberBR(item.inputVolume)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 block">CONVERSÃO</span>
                    <span className="text-emerald-400 font-bold">
                      {item.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 block">SAÍDA</span>
                    <span className="text-amber-300 font-semibold">
                      {formatNumberBR(item.outputVolume)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'whatif' && (
          <div className="p-4 rounded-xl bg-[#18181D] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Simulador de Elasticidade ("E Se...")
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Projete o lucro ao escalar tráfego ou otimizar conversões
                </p>
              </div>
              {hasScenarioActive && (
                <button
                  onClick={() =>
                    setScenario({
                      trafficBoostPct: 0,
                      conversionBoostPct: 0,
                      costReductionPct: 0,
                    })
                  }
                  className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resetar
                </button>
              )}
            </div>

            {/* Slider 1: Escala de Tráfego */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">
                  Volume de Tráfego (Escala)
                </span>
                <span className="font-mono font-bold text-sky-400">
                  {scenario.trafficBoostPct >= 0 ? '+' : ''}
                  {scenario.trafficBoostPct}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="200"
                step="5"
                value={scenario.trafficBoostPct}
                onChange={(e) =>
                  setScenario((prev) => ({
                    ...prev,
                    trafficBoostPct: Number(e.target.value),
                  }))
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Slider 2: Melhoria Relativa nas Taxas de Conversão */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">
                  Otimização de Conversão (CRO)
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {scenario.conversionBoostPct >= 0 ? '+' : ''}
                  {scenario.conversionBoostPct}%
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="2"
                value={scenario.conversionBoostPct}
                onChange={(e) =>
                  setScenario((prev) => ({
                    ...prev,
                    conversionBoostPct: Number(e.target.value),
                  }))
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Slider 3: Redução no Custo por Clique / Lead */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">
                  Redução de CPC / Custo de Tráfego
                </span>
                <span className="font-mono font-bold text-violet-400">
                  -{scenario.costReductionPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={scenario.costReductionPct}
                onChange={(e) =>
                  setScenario((prev) => ({
                    ...prev,
                    costReductionPct: Number(e.target.value),
                  }))
                }
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Action */}
      <div className="p-4 border-t border-white/[0.08] bg-[#18181D] flex items-center justify-between gap-3">
        <button
          onClick={onExportJSON}
          className="flex-1 py-2.5 px-4 rounded-lg bg-[#25252E] hover:bg-[#30303C] text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 border border-white/[0.08] transition-colors"
        >
          <Download className="w-4 h-4 text-sky-400" />
          Exportar Relatório (JSON)
        </button>
        <button
          onClick={onClose}
          className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
        >
          Continuar Editando
        </button>
      </div>
    </div>
  );
}
