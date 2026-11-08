import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { BLOCK_CATEGORIES } from '../data/funnelCatalog';
import DynamicIcon from './DynamicIcon';

export default function Sidebar({
  onAddBlock,
  isCollapsed,
  setIsCollapsed,
  selectedNodeId,
  autoConnectOnAdd,
  setAutoConnectOnAdd,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState({
    traffic: true,
    pages: true,
    communication: true,
    conversions: true,
  });

  const toggleCategory = (catId) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleDragStart = (e, blockItem) => {
    e.dataTransfer.setData('application/building-money-block', JSON.stringify(blockItem));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredCategories = BLOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.index).includes(searchQuery.trim())
    ),
  })).filter((cat) => cat.items.length > 0);

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-[#1E1E24] border-r border-white/[0.08] flex flex-col items-center py-3 gap-3 z-20 shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-lg bg-[#272730] hover:bg-[#32323D] text-zinc-300 hover:text-white border border-white/[0.08] transition-colors"
          title="Expandir Biblioteca de 20 Estratégias e Blocos"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-white/[0.08]" />

        <div className="flex flex-col gap-2 overflow-y-auto items-center w-full px-1">
          {BLOCK_CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-1.5 items-center w-full">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-xs"
                style={{
                  backgroundColor: cat.badgeBg,
                  color: cat.accentLight,
                  border: `1px solid ${cat.borderAccent}`,
                }}
                title={`${cat.title} (${cat.colorName})`}
              >
                <DynamicIcon name={cat.iconName} className="w-3.5 h-3.5" />
              </div>
              {cat.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => onAddBlock(item)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className="w-9 h-9 rounded-lg bg-[#25252D] hover:bg-[#2E2E38] border border-white/[0.07] flex items-center justify-center transition-all group"
                  style={{
                    color: cat.accentLight,
                  }}
                  title={`${item.index}. ${item.title}`}
                >
                  <DynamicIcon
                    name={item.iconName}
                    className="w-4 h-4 transition-transform group-hover:scale-105"
                  />
                </button>
              ))}
              <div className="w-6 h-px bg-white/[0.06] my-1" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-[#1E1E24] border-r border-white/[0.08] flex flex-col h-full z-20 shrink-0 select-none">
      {/* Top Header of Sidebar */}
      <div className="p-3.5 border-b border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              20 Blocos & Estratégias
            </h2>
            <p className="text-[11px] text-zinc-400">
              Clique ou arraste para mapear o funil
            </p>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg bg-[#272730] hover:bg-[#32323D] text-zinc-400 hover:text-white border border-white/[0.08] transition-colors"
            title="Recolher barra lateral"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar entre os 20 modelos..."
            className="w-full bg-[#121214] text-xs text-zinc-200 placeholder-zinc-500 pl-8 pr-3 py-2 rounded-lg border border-white/[0.08] focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>

        {/* Smart Auto-connect toggle */}
        <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#151519] border border-white/[0.06] cursor-pointer hover:border-white/[0.14] transition-colors">
          <span className="text-[11px] text-zinc-300">
            Conectar automaticamente ao bloco ativo
          </span>
          <input
            type="checkbox"
            checked={autoConnectOnAdd}
            onChange={(e) => setAutoConnectOnAdd(e.target.checked)}
            className="accent-emerald-500 w-3.5 h-3.5 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Categories & 20 Color-Coded Blocks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredCategories.map((category) => {
          const isOpen = openCategories[category.id] ?? true;
          return (
            <div
              key={category.id}
              className="rounded-xl bg-[#16161B] border border-white/[0.07] overflow-hidden"
            >
              {/* Category Header with Corporate Color Coding */}
              <button
                onClick={() => toggleCategory(category.id)}
                style={{
                  background: category.cardHeaderTint,
                  borderBottom: isOpen ? `1px solid ${category.borderAccent}` : 'none',
                }}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:brightness-110 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: category.badgeBg,
                      color: category.accentLight,
                      border: `1px solid ${category.borderAccent}`,
                    }}
                  >
                    <DynamicIcon name={category.iconName} className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-bold text-zinc-100 leading-tight truncate">
                      {category.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: category.badgeBg,
                          color: category.accentLight,
                        }}
                      >
                        {category.colorName}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        • {category.items.length} itens
                      </span>
                    </div>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                )}
              </button>

              {/* Category Items */}
              {isOpen && (
                <div className="p-2 space-y-1.5">
                  {category.items.map((item) => (
                    <div
                      key={item.type}
                      onClick={() => onAddBlock(item)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className="group relative flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#1E1E24] hover:bg-[#26262F] border border-white/[0.06] hover:border-white/[0.18] cursor-pointer transition-all duration-150 active:scale-[0.99]"
                      style={{
                        borderLeft: `3px solid ${category.accent}`,
                      }}
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 cursor-grab mt-1" />
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: category.badgeBg,
                            color: category.accentLight,
                            border: `1px solid ${category.borderAccent}`,
                          }}
                        >
                          <DynamicIcon name={item.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0"
                              style={{
                                backgroundColor: category.badgeBg,
                                color: category.accentLight,
                              }}
                            >
                              {String(item.index).padStart(2, '0')}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-100 group-hover:text-white leading-snug line-clamp-2">
                              {item.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          backgroundColor: category.badgeBg,
                          color: category.accentLight,
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Color Legend */}
      <div className="p-3 border-t border-white/[0.08] bg-[#16161B] text-[10px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600" title="Tráfego" />
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" title="Páginas" />
          <span className="inline-block w-2 h-2 rounded-full bg-violet-600" title="Automação" />
          <span className="inline-block w-2 h-2 rounded-full bg-amber-600" title="Conversão" />
          <span className="ml-0.5">Categorias codificadas por cor</span>
        </div>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#25252E] text-zinc-300 border border-white/[0.08]">
          20 modelos
        </span>
      </div>
    </aside>
  );
}
