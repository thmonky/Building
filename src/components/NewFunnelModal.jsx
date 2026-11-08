import React, { useState } from 'react';
import {
  X,
  FilePlus2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { FUNNEL_TEMPLATES } from '../data/funnelCatalog';

export default function NewFunnelModal({
  isOpen,
  onClose,
  onCreateFunnel,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank');
  const [customTitle, setCustomTitle] = useState('Novo Funil Estratégico');

  if (!isOpen) return null;

  const templatesList = [
    {
      id: 'blank',
      name: 'Canvas em Branco (Do Zero)',
      description:
        'Comece com o quadro limpo e adicione livremente qualquer um dos 20 blocos e estratégias coloridas da barra lateral.',
      badge: 'Personalizado',
      badgeClass: 'bg-blue-950/90 text-sky-300 border-blue-700/60',
      nodeCount: 0,
    },
    ...Object.values(FUNNEL_TEMPLATES).map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      badge: `${tpl.nodes.length} Blocos`,
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60',
      nodeCount: tpl.nodes.length,
    })),
  ];

  const handleConfirm = (e) => {
    e.preventDefault();
    onCreateFunnel(selectedTemplateId, customTitle.trim() || 'Funil Building Money');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl bg-[#1E1E24] border border-white/[0.1] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#18181D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-teal-700 text-white flex items-center justify-center border border-blue-400/30">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Criar Novo Funil
              </h2>
              <p className="text-xs text-zinc-400">
                Inicie do zero ou carregue uma arquitetura corporativa validada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#272730] hover:bg-[#32323D] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          {/* Funnel Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Nome do Projeto / Funil
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Ex: Planejamento Perpétuo Q4"
              className="w-full bg-[#121214] text-sm text-white px-3.5 py-2.5 rounded-lg border border-white/[0.08] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Escolha a Estrutura Base
            </label>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {templatesList.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      if (tpl.id !== 'blank') {
                        setCustomTitle(tpl.name);
                      } else {
                        setCustomTitle('Meu Novo Funil');
                      }
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/80'
                        : 'bg-[#151519] border-white/[0.07] hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {tpl.name}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border ${tpl.badgeClass}`}
                        >
                          {tpl.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#272730] hover:bg-[#32323D] text-zinc-300 border border-white/[0.08] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
            >
              <span>Criar Funil Agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
