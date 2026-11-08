import React, { useState } from 'react';
import {
  Workflow,
  FilePlus2,
  Save,
  Download,
  Trash2,
  Play,
  Edit3,
  Upload,
} from 'lucide-react';
import { formatCurrencyBRL } from '../utils/simulationEngine';

export default function Header({
  funnelName,
  setFunnelName,
  onOpenNewFunnelModal,
  onSaveProject,
  onExportJSON,
  onImportJSON,
  onClearCanvas,
  onOpenSimulation,
  isSimulationOpen,
  summary,
  nodeCount,
  edgeCount,
  lastSavedAt,
}) {
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <header className="h-16 bg-[#1E1E24] border-b border-white/[0.08] px-4 flex items-center justify-between gap-3 z-30 shrink-0">
      {/* Left: Brand Logo + Corporate Status Badge + Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-teal-700 text-white flex items-center justify-center border border-blue-400/30 shadow-sm">
            <Workflow className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-sm tracking-tight text-white uppercase">
                Building <span className="text-sky-400 font-semibold">Money</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Modo Editor / Simulação Ativo
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
              {isEditingName ? (
                <input
                  type="text"
                  value={funnelName}
                  onChange={(e) => setFunnelName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="bg-[#121214] text-zinc-100 px-2 py-0.5 rounded border border-blue-500/60 focus:outline-none text-xs font-medium w-56"
                />
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="group flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors truncate max-w-[240px]"
                  title="Clique para renomear o funil"
                >
                  <span className="truncate font-medium">{funnelName}</span>
                  <Edit3 className="w-3 h-3 text-zinc-500 group-hover:text-sky-400 transition-colors shrink-0" />
                </button>
              )}
              <span className="text-zinc-600 hidden md:inline">•</span>
              <span className="hidden md:inline font-mono text-[10px] text-zinc-400">
                {nodeCount} blocos · {edgeCount} conexões
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live Telemetry Pill (Desktop XL) */}
      <div className="hidden xl:flex items-center gap-4 px-3.5 py-1.5 rounded-lg bg-[#121214] border border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            Investimento
          </span>
          <span className="font-mono text-xs font-semibold text-sky-400">
            {formatCurrencyBRL(summary?.totalInvestment || 0)}
          </span>
        </div>
        <div className="h-6 w-px bg-white/[0.08]" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            Faturamento Est.
          </span>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {formatCurrencyBRL(summary?.totalRevenue || 0)}
          </span>
        </div>
        <div className="h-6 w-px bg-white/[0.08]" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            ROAS Global
          </span>
          <span className="font-mono text-xs font-bold text-amber-400">
            {(summary?.roas || 0).toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNewFunnelModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#272730] hover:bg-[#30303B] text-zinc-200 border border-white/[0.08] hover:border-blue-500/40 transition-colors"
          title="Criar Novo Funil ou Carregar Modelo"
        >
          <FilePlus2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Novo Funil</span>
        </button>

        <button
          onClick={onSaveProject}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#272730] hover:bg-[#30303B] text-zinc-200 border border-white/[0.08] hover:border-emerald-500/40 transition-colors"
          title={`Salvar no navegador (${lastSavedAt ? `Salvo às ${lastSavedAt}` : 'Auto-save ativo'})`}
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Salvar Projeto</span>
        </button>

        <button
          onClick={onExportJSON}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#272730] hover:bg-[#30303B] text-zinc-200 border border-white/[0.08] hover:border-violet-500/40 transition-colors"
          title="Exportar estrutura do funil e relatório financeiro em JSON"
        >
          <Download className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden lg:inline">Exportar Relatório (JSON)</span>
        </button>

        <label
          className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-[#272730] hover:bg-[#30303B] text-zinc-300 border border-white/[0.08] hover:border-white/20 transition-colors"
          title="Importar arquivo JSON de funil salvo"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <input
            type="file"
            accept=".json,application/json"
            onChange={onImportJSON}
            className="hidden"
          />
        </label>

        <button
          onClick={onClearCanvas}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#272730] hover:bg-red-950/50 text-zinc-300 hover:text-red-300 border border-white/[0.08] hover:border-red-700/50 transition-colors"
          title="Limpar todos os blocos e conexões do Canvas"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Limpar Canvas</span>
        </button>

        <button
          onClick={onOpenSimulation}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
            isSimulationOpen
              ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 shadow-sm'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simular Métricas</span>
        </button>
      </div>
    </header>
  );
}
