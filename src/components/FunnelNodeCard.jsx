import React from 'react';
import {
  Copy,
  Trash2,
  ArrowRight,
  RotateCcw,
  Link2,
  GripHorizontal,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { BLOCK_MAP, CATEGORY_THEMES } from '../data/funnelCatalog';
import DynamicIcon from './DynamicIcon';
import { formatCurrencyBRL, formatNumberBR } from '../utils/simulationEngine';

export const NODE_WIDTH = 284;
export const NODE_HEIGHT = 276;

export default function FunnelNodeCard({
  node,
  nodeResult,
  isSelected,
  isConnectingFromThis,
  isValidConnectionTarget,
  onSelect,
  onStartDragNode,
  onUpdateNodeTitle,
  onUpdateNodeMetric,
  onDuplicateNode,
  onDeleteNode,
  onStartConnectionDrag,
  onCompleteConnection,
  onToggleClickConnect,
}) {
  const fallbackTheme = CATEGORY_THEMES[node.category] || CATEGORY_THEMES.traffic;
  const catalogInfo = BLOCK_MAP[node.type] || {
    ...fallbackTheme,
    index: 1,
    title: node.title,
    subtitle: 'Bloco Estratégico',
    iconName: 'Layers',
    categoryTitle: 'Bloco de Funil',
  };

  const accent = catalogInfo.accent || '#2563EB';
  const accentLight = catalogInfo.accentLight || '#60A5FA';
  const badgeBg = catalogInfo.badgeBg || 'rgba(37, 99, 235, 0.16)';
  const borderAccent = catalogInfo.borderAccent || 'rgba(59, 130, 246, 0.35)';
  const headerGradient =
    catalogInfo.headerGradient || 'linear-gradient(90deg, #1E40AF 0%, #0284C7 100%)';
  const cardHeaderTint = catalogInfo.cardHeaderTint || 'rgba(30, 64, 175, 0.14)';

  const inputVolume = nodeResult?.inputVolume ?? (Number(node.metrics?.visitors) || 0);
  const outputVolume = nodeResult?.outputVolume ?? 0;
  const totalCost = nodeResult?.totalCost ?? 0;
  const totalRevenue = nodeResult?.totalRevenue ?? 0;
  const isDrivenByFlow = nodeResult?.isDrivenByFlow ?? false;
  const hasIncoming = nodeResult?.hasIncoming ?? false;

  const stopDragPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        width: `${NODE_WIDTH}px`,
        borderColor: isSelected
          ? accentLight
          : isValidConnectionTarget
          ? '#34D399'
          : borderAccent,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
        if (isValidConnectionTarget) {
          onCompleteConnection(node.id);
          return;
        }
        onStartDragNode(e, node.id);
      }}
      onMouseUp={(e) => {
        if (isValidConnectionTarget) {
          e.stopPropagation();
          onCompleteConnection(node.id);
        }
      }}
      className={`absolute top-0 left-0 rounded-xl bg-[#1E1E24] border transition-all duration-150 select-none group ${
        isSelected
          ? 'ring-2 ring-offset-1 ring-offset-[#121214] shadow-2xl z-20'
          : isValidConnectionTarget
          ? 'ring-2 ring-emerald-400 shadow-xl z-20 cursor-pointer'
          : 'hover:brightness-[1.03] shadow-[0_12px_30px_rgba(0,0,0,0.55)] z-10'
      }`}
    >
      {/* Top Category Color Strip */}
      <div
        className="h-1.5 w-full rounded-t-xl"
        style={{ background: headerGradient }}
      />

      {/* LEFT INPUT PORT (Conector de Entrada) */}
      <div
        onMouseUp={(e) => {
          e.stopPropagation();
          onCompleteConnection(node.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isValidConnectionTarget) {
            onCompleteConnection(node.id);
          }
        }}
        title="Porta de Entrada do Fluxo (Solte uma conexão aqui)"
        className={`absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-crosshair z-30 ${
          isValidConnectionTarget
            ? 'bg-emerald-500/25 scale-125 ring-2 ring-emerald-400'
            : 'bg-transparent hover:bg-white/10'
        }`}
      >
        <div
          style={{
            backgroundColor: hasIncoming
              ? accentLight
              : isValidConnectionTarget
              ? '#10B981'
              : '#272730',
            borderColor: hasIncoming ? '#121214' : accentLight,
          }}
          className="w-3.5 h-3.5 rounded-full border-2 transition-all"
        />
      </div>

      {/* RIGHT OUTPUT PORT (Conector de Saída — Arrastar ou Clicar para Conectar) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnectionDrag(e, node.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleClickConnect(node.id);
        }}
        title="Conectar Saída → Arraste ou clique para ligar a outro bloco"
        className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-crosshair z-30 ${
          isConnectingFromThis
            ? 'scale-125 ring-2 ring-white/60'
            : 'bg-transparent hover:bg-white/10'
        }`}
      >
        <div
          style={{
            backgroundColor: isConnectingFromThis ? accentLight : '#18181D',
            borderColor: accentLight,
            color: isConnectingFromThis ? '#121214' : accentLight,
          }}
          className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
        </div>
      </div>

      {/* Card Header: Category Tinted Surface, Icon, Editable Title, Quick Actions */}
      <div
        style={{ background: cardHeaderTint }}
        className="p-3 pb-2.5 border-b border-white/[0.08] flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            style={{
              backgroundColor: badgeBg,
              color: accentLight,
              border: `1px solid ${borderAccent}`,
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          >
            <DynamicIcon name={catalogInfo.iconName} className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {catalogInfo.index && (
                <span
                  style={{
                    backgroundColor: badgeBg,
                    color: accentLight,
                    border: `1px solid ${borderAccent}`,
                  }}
                  className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0"
                >
                  #{String(catalogInfo.index).padStart(2, '0')}
                </span>
              )}
              <span
                style={{ color: accentLight }}
                className="text-[9px] font-bold uppercase tracking-wider truncate"
              >
                {catalogInfo.categoryTitle}
              </span>
              <GripHorizontal className="w-3 h-3 text-zinc-500 shrink-0" />
            </div>

            <input
              type="text"
              value={node.title}
              onMouseDown={stopDragPropagation}
              onChange={(e) => onUpdateNodeTitle(node.id, e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-zinc-100 focus:outline-none focus:bg-[#121214] focus:px-1.5 py-0.5 rounded border border-transparent focus:border-white/30 truncate mt-0.5 transition-all"
              title={node.title}
            />
          </div>
        </div>

        {/* Action Buttons: Connect, Duplicate, Delete */}
        <div
          className="flex items-center gap-1 shrink-0"
          onMouseDown={stopDragPropagation}
        >
          <button
            onClick={() => onToggleClickConnect(node.id)}
            style={
              isConnectingFromThis
                ? { backgroundColor: accent, color: '#FFFFFF', borderColor: accentLight }
                : undefined
            }
            className={`p-1.5 rounded-md border transition-all ${
              isConnectingFromThis
                ? ''
                : 'bg-[#151519]/90 hover:bg-[#272730] text-zinc-400 hover:text-white border-white/[0.08]'
            }`}
            title="Conectar a outro bloco (ou arraste do terminal direito)"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicateNode(node.id)}
            className="p-1.5 rounded-md bg-[#151519]/90 hover:bg-[#272730] text-zinc-400 hover:text-white border border-white/[0.08] transition-colors"
            title="Duplicar bloco"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteNode(node.id)}
            className="p-1.5 rounded-md bg-[#151519]/90 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 border border-white/[0.08] hover:border-red-700/50 transition-colors"
            title="Excluir bloco"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Editable Metrics Grid */}
      <div
        className="p-3 space-y-2.5 text-xs"
        onMouseDown={stopDragPropagation}
      >
        {/* Row 1: Visitantes / Impressões & Taxa de Conversão % */}
        <div className="grid grid-cols-2 gap-2">
          {/* Visitantes / Entrada */}
          <div className="bg-[#141418] p-2 rounded-lg border border-white/[0.07] focus-within:border-blue-500/60 transition-colors">
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[10px] text-zinc-400 font-medium truncate">
                {node.category === 'traffic' ? 'Visitantes / Cliques' : 'Entrada / Visitas'}
              </label>
              {isDrivenByFlow ? (
                <span
                  style={{
                    backgroundColor: badgeBg,
                    color: accentLight,
                  }}
                  className="text-[9px] font-mono font-semibold px-1 rounded"
                  title="Calculado automaticamente pelas setas de entrada"
                >
                  Fluxo
                </span>
              ) : hasIncoming && node.metrics?.manualVisitorsOverride ? (
                <button
                  onClick={() =>
                    onUpdateNodeMetric(node.id, 'manualVisitorsOverride', false)
                  }
                  className="text-[9px] font-mono px-1 rounded bg-amber-950/80 text-amber-300 hover:bg-amber-900/80 flex items-center gap-0.5 border border-amber-700/50"
                  title="Voltar a usar o fluxo automático das conexões"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Auto
                </button>
              ) : null}
            </div>
            <input
              type="number"
              min="0"
              step="100"
              value={
                isDrivenByFlow
                  ? Math.round(inputVolume)
                  : node.metrics?.visitors ?? 0
              }
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                onUpdateNodeMetric(node.id, 'visitors', val, true);
              }}
              className="w-full bg-transparent font-mono text-xs font-bold text-white focus:outline-none"
            />
          </div>

          {/* Taxa de Conversão % */}
          <div className="bg-[#141418] p-2 rounded-lg border border-white/[0.07] focus-within:border-emerald-500/60 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-zinc-400 font-medium truncate">
                Conversão (%)
              </label>
              <span style={{ color: accentLight }} className="text-[9px] font-mono font-bold">
                %
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={node.metrics?.conversionRate ?? 0}
                onChange={(e) => {
                  const val =
                    e.target.value === ''
                      ? 0
                      : Math.min(100, Math.max(0, Number(e.target.value)));
                  onUpdateNodeMetric(node.id, 'conversionRate', val);
                }}
                style={{ color: accentLight }}
                className="w-full bg-transparent font-mono text-xs font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mini Conversion Progress Bar (Category Colored) */}
        <div className="w-full h-1.5 bg-[#121214] rounded-full overflow-hidden border border-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, Number(node.metrics?.conversionRate) || 0))}%`,
              background: headerGradient,
            }}
          />
        </div>

        {/* Row 2: Custo por Lead/Clique (R$) & Ticket Médio (R$) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Custo por Clique / Lead R$ */}
          <div className="bg-[#141418] p-2 rounded-lg border border-white/[0.07] focus-within:border-blue-500/60 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-zinc-400 font-medium truncate">
                {node.category === 'traffic' ? 'CPC / Custo (R$)' : 'Custo / Lead (R$)'}
              </label>
              <Wallet className="w-2.5 h-2.5 text-sky-400" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-zinc-500">R$</span>
              <input
                type="number"
                min="0"
                step="0.10"
                value={node.metrics?.costPerUnit ?? 0}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                  onUpdateNodeMetric(node.id, 'costPerUnit', val);
                }}
                className="w-full bg-transparent font-mono text-xs font-semibold text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Ticket Médio R$ */}
          <div className="bg-[#141418] p-2 rounded-lg border border-white/[0.07] focus-within:border-amber-500/60 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-zinc-400 font-medium truncate">
                Ticket Médio (R$)
              </label>
              <TrendingUp className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-zinc-500">R$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={node.metrics?.averageTicket ?? 0}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                  onUpdateNodeMetric(node.id, 'averageTicket', val);
                }}
                className="w-full bg-transparent font-mono text-xs font-bold text-amber-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Output Telemetry Footer */}
      <div className="px-3 py-2 rounded-b-xl bg-[#16161B] border-t border-white/[0.07] flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-zinc-400 font-mono truncate">
            {formatNumberBR(inputVolume)}
          </span>
          <ArrowRight style={{ color: accentLight }} className="w-3 h-3 shrink-0" />
          <span className="font-mono font-bold text-white truncate">
            {formatNumberBR(outputVolume)}
          </span>
          <span className="text-[10px] text-zinc-500">saída</span>
        </div>

        {totalRevenue > 0 ? (
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shrink-0">
            +{formatCurrencyBRL(totalRevenue)}
          </span>
        ) : totalCost > 0 ? (
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950/80 text-sky-300 border border-blue-700/50 shrink-0">
            -{formatCurrencyBRL(totalCost)}
          </span>
        ) : (
          <span
            style={{ color: accentLight }}
            className="font-mono text-[10px] font-semibold"
          >
            {Math.round(nodeResult?.conversionRate || 0)}% conv.
          </span>
        )}
      </div>
    </div>
  );
}
