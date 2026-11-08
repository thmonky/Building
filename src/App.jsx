import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  LayoutGrid,
  MousePointerClick,
} from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FunnelNodeCard, { NODE_WIDTH, NODE_HEIGHT } from './components/FunnelNodeCard';
import SimulationDrawer from './components/SimulationDrawer';
import NewFunnelModal from './components/NewFunnelModal';
import { FUNNEL_TEMPLATES } from './data/funnelCatalog';
import {
  simulateFunnel,
  formatNumberBR,
  formatCurrencyBRL,
} from './utils/simulationEngine';

const STORAGE_KEY = 'building_money_funnel_state_v1';

// Helper para gerar caminho Curva de Bézier suave entre dois pontos
function getBezierPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const controlOffset = Math.max(70, Math.min(220, dx * 0.5));
  const cx1 = x1 + controlOffset;
  const cy1 = y1;
  const cx2 = x2 - controlOffset;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export default function App() {
  // Carrega estado inicial do LocalStorage ou usa o Template VSL Perpétuo padrão
  const loadInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Erro ao ler LocalStorage:', err);
    }
    const defaultTpl = FUNNEL_TEMPLATES.vsl_perpetuo;
    return {
      funnelName: defaultTpl.name,
      nodes: defaultTpl.nodes,
      edges: defaultTpl.edges,
      viewport: { x: 20, y: 30, zoom: 0.85 },
    };
  };

  const initialState = useMemo(() => loadInitialState(), []);

  const [funnelName, setFunnelName] = useState(initialState.funnelName);
  const [nodes, setNodes] = useState(initialState.nodes);
  const [edges, setEdges] = useState(initialState.edges);
  const [viewport, setViewport] = useState(
    initialState.viewport || { x: 20, y: 30, zoom: 0.85 }
  );

  // Estados de UI e Interação
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [autoConnectOnAdd, setAutoConnectOnAdd] = useState(true);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isNewFunnelModalOpen, setIsNewFunnelModalOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [toast, setToast] = useState(null);
  const [undoSnapshot, setUndoSnapshot] = useState(null);

  // Simulador "E se..." (What-if)
  const [scenario, setScenario] = useState({
    trafficBoostPct: 0,
    conversionBoostPct: 0,
    costReductionPct: 0,
  });

  // Estados de Arrasto (Canvas Pan, Node Drag e Criação de Conexões)
  const canvasRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [panningCanvas, setPanningCanvas] = useState(null);
  const [connectingState, setConnectingState] = useState(null);

  const showToast = useCallback((message, type = 'success', withUndo = false) => {
    setToast({ message, type, withUndo, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Auto-save contínuo no LocalStorage
  useEffect(() => {
    try {
      const payload = {
        funnelName,
        nodes,
        edges,
        viewport,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      const nowStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastSavedAt(nowStr);
    } catch (err) {
      console.error('Erro ao salvar no LocalStorage:', err);
    }
  }, [funnelName, nodes, edges, viewport]);

  // Cálculo em tempo real da simulação financeira
  const simulation = useMemo(
    () => simulateFunnel(nodes, edges, scenario),
    [nodes, edges, scenario]
  );

  // Conversão de coordenadas da tela (Mouse) para coordenadas internas do Canvas
  const screenToCanvasCoords = useCallback(
    (clientX, clientY) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (clientY - rect.top - viewport.y) / viewport.zoom;
      return { x, y };
    },
    [viewport]
  );

  // Adicionar bloco (via clique na Sidebar ou Drag-and-Drop no Canvas)
  const handleAddBlock = useCallback(
    (blockItem, customCoords = null) => {
      const newId = `node-${blockItem.type}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      let targetX = 160;
      let targetY = 160;

      const selectedNode = nodes.find((n) => n.id === selectedNodeId);

      if (customCoords) {
        targetX = Math.round(customCoords.x - NODE_WIDTH / 2);
        targetY = Math.round(customCoords.y - NODE_HEIGHT / 2);
      } else if (selectedNode) {
        targetX = selectedNode.x + 340;
        targetY = selectedNode.y + (Math.random() * 60 - 30);
      } else if (nodes.length > 0) {
        const rightmostNode = [...nodes].sort((a, b) => b.x - a.x)[0];
        targetX = rightmostNode.x + 330;
        targetY = rightmostNode.y;
      } else if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const center = screenToCanvasCoords(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        targetX = Math.round(center.x - NODE_WIDTH / 2);
        targetY = Math.round(center.y - NODE_HEIGHT / 2);
      }

      // Evita sobreposição exata se já houver bloco na mesma posição
      while (
        nodes.some(
          (n) => Math.abs(n.x - targetX) < 35 && Math.abs(n.y - targetY) < 35
        )
      ) {
        targetX += 36;
        targetY += 42;
      }

      const newNode = {
        id: newId,
        type: blockItem.type,
        title: blockItem.title,
        category: blockItem.category,
        stage: blockItem.stage,
        x: Math.round(targetX),
        y: Math.round(targetY),
        metrics: {
          ...blockItem.defaultMetrics,
          manualVisitorsOverride: false,
        },
      };

      setNodes((prev) => [...prev, newNode]);

      if (autoConnectOnAdd && selectedNodeId && selectedNode) {
        const newEdge = {
          id: `edge-${Date.now()}`,
          from: selectedNodeId,
          to: newId,
        };
        setEdges((prev) => [...prev, newEdge]);
      }

      setSelectedNodeId(newId);
      showToast(`"${blockItem.shortTitle || blockItem.title}" adicionado ao canvas.`);
    },
    [nodes, selectedNodeId, autoConnectOnAdd, screenToCanvasCoords, showToast]
  );

  // Atualizar título do bloco
  const handleUpdateNodeTitle = useCallback((nodeId, newTitle) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, title: newTitle } : n))
    );
  }, []);

  // Atualizar métrica inline do bloco
  const handleUpdateNodeMetric = useCallback(
    (nodeId, metricKey, value, isManualVisitorEdit = false) => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== nodeId) return n;
          const updatedMetrics = {
            ...n.metrics,
            [metricKey]: value,
          };
          if (isManualVisitorEdit) {
            updatedMetrics.manualVisitorsOverride = true;
          }
          return {
            ...n,
            metrics: updatedMetrics,
          };
        })
      );
    },
    []
  );

  // Duplicar bloco
  const handleDuplicateNode = useCallback(
    (nodeId) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;
      const copyId = `node-${source.type}-${Date.now()}`;
      const newNode = {
        ...source,
        id: copyId,
        title: `${source.title} (Cópia)`,
        x: source.x + 48,
        y: source.y + 48,
        metrics: { ...source.metrics },
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(copyId);
      showToast(`Bloco duplicado.`);
    },
    [nodes, showToast]
  );

  // Excluir bloco e suas conexões
  const handleDeleteNode = useCallback(
    (nodeId) => {
      const target = nodes.find((n) => n.id === nodeId);
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) =>
        prev.filter((e) => e.from !== nodeId && e.to !== nodeId)
      );
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (target) {
        showToast(`Bloco removido.`);
      }
    },
    [nodes, selectedNodeId, showToast]
  );

  // Excluir uma conexão específica
  const handleDeleteEdge = useCallback(
    (edgeId) => {
      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
      showToast('Conexão removida.');
    },
    [showToast]
  );

  // Iniciar arrasto de um card
  const handleStartDragNode = useCallback(
    (e, nodeId) => {
      if (e.button !== 0) return;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setDraggingNode({
        id: nodeId,
        startX: e.clientX,
        startY: e.clientY,
        initialNodeX: node.x,
        initialNodeY: node.y,
      });
    },
    [nodes]
  );

  // Iniciar conexão por arrasto a partir da porta de saída
  const handleStartConnectionDrag = useCallback(
    (e, fromNodeId) => {
      e.stopPropagation();
      const coords = screenToCanvasCoords(e.clientX, e.clientY);
      setConnectingState({
        fromNodeId,
        mode: 'drag',
        mouseX: coords.x,
        mouseY: coords.y,
      });
    },
    [screenToCanvasCoords]
  );

  // Alternar modo de conexão por clique
  const handleToggleClickConnect = useCallback(
    (nodeId) => {
      setConnectingState((prev) => {
        if (prev && prev.fromNodeId === nodeId) {
          return null;
        }
        const sourceNode = nodes.find((n) => n.id === nodeId);
        return {
          fromNodeId: nodeId,
          mode: 'click',
          mouseX: sourceNode ? sourceNode.x + NODE_WIDTH + 40 : 0,
          mouseY: sourceNode ? sourceNode.y + NODE_HEIGHT / 2 : 0,
        };
      });
    },
    [nodes]
  );

  // Completar conexão ao soltar/clicar no bloco de destino
  const handleCompleteConnection = useCallback(
    (toNodeId) => {
      if (!connectingState) return;
      const { fromNodeId } = connectingState;

      if (fromNodeId && toNodeId && fromNodeId !== toNodeId) {
        const alreadyExists = edges.some(
          (e) => e.from === fromNodeId && e.to === toNodeId
        );
        if (!alreadyExists) {
          const newEdge = {
            id: `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            from: fromNodeId,
            to: toNodeId,
          };
          setEdges((prev) => [...prev, newEdge]);
          setNodes((prev) =>
            prev.map((n) =>
              n.id === toNodeId
                ? {
                    ...n,
                    metrics: { ...n.metrics, manualVisitorsOverride: false },
                  }
                : n
            )
          );
          showToast('Fluxo conectado com sucesso.');
        }
      }
      setConnectingState(null);
    },
    [connectingState, edges, showToast]
  );

  // Eventos globais de MouseMove e MouseUp no Canvas
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (draggingNode) {
        const dx = (e.clientX - draggingNode.startX) / viewport.zoom;
        const dy = (e.clientY - draggingNode.startY) / viewport.zoom;
        const nextX = Math.round(draggingNode.initialNodeX + dx);
        const nextY = Math.round(draggingNode.initialNodeY + dy);

        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNode.id ? { ...n, x: nextX, y: nextY } : n
          )
        );
      } else if (panningCanvas) {
        const dx = e.clientX - panningCanvas.startX;
        const dy = e.clientY - panningCanvas.startY;
        setViewport((prev) => ({
          ...prev,
          x: Math.round(panningCanvas.initialPanX + dx),
          y: Math.round(panningCanvas.initialPanY + dy),
        }));
      } else if (connectingState) {
        const coords = screenToCanvasCoords(e.clientX, e.clientY);
        setConnectingState((prev) =>
          prev ? { ...prev, mouseX: coords.x, mouseY: coords.y } : null
        );
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggingNode) setDraggingNode(null);
      if (panningCanvas) setPanningCanvas(null);
      if (connectingState && connectingState.mode === 'drag') {
        setConnectingState(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingNode, panningCanvas, connectingState, viewport.zoom, screenToCanvasCoords]);

  // Atalho de teclado Delete / Backspace para excluir nó selecionado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'Escape') {
        setConnectingState(null);
        setSelectedNodeId(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        handleDeleteNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, handleDeleteNode]);

  // Zoom com roda do mouse no Canvas
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setViewport((prev) => {
      const newZoom = Math.min(1.6, Math.max(0.35, Number((prev.zoom * zoomFactor).toFixed(3))));
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - ((mouseX - prev.x) / prev.zoom) * newZoom;
      const newY = mouseY - ((mouseY - prev.y) / prev.zoom) * newZoom;

      return {
        x: Math.round(newX),
        y: Math.round(newY),
        zoom: newZoom,
      };
    });
  }, []);

  // Centralizar / Ajustar visualização para caber todos os blocos
  const handleFitView = useCallback(() => {
    if (!nodes.length || !canvasRef.current) {
      setViewport({ x: 60, y: 60, zoom: 0.9 });
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT));

    const contentW = Math.max(400, maxX - minX + 140);
    const contentH = Math.max(300, maxY - minY + 140);

    const scaleX = rect.width / contentW;
    const scaleY = rect.height / contentH;
    const newZoom = Math.min(1.1, Math.max(0.4, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setViewport({
      x: Math.round(rect.width / 2 - centerX * newZoom),
      y: Math.round(rect.height / 2 - centerY * newZoom),
      zoom: Number(newZoom.toFixed(2)),
    });
  }, [nodes]);

  // Auto-organizar blocos por estágios em colunas limpas
  const handleAutoLayout = useCallback(() => {
    if (!nodes.length) return;
    const stageOrder = {
      traffic: 0,
      leads: 1,
      engagement: 2,
      intent: 3,
      sales: 4,
      retention: 5,
    };

    const grouped = {};
    nodes.forEach((n) => {
      const col = stageOrder[n.stage] ?? 2;
      if (!grouped[col]) grouped[col] = [];
      grouped[col].push(n);
    });

    const sortedCols = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b);

    const updatedPositions = {};
    sortedCols.forEach((colKey, colIdx) => {
      const colNodes = grouped[colKey];
      colNodes.forEach((node, rowIdx) => {
        updatedPositions[node.id] = {
          x: 80 + colIdx * 340,
          y: 90 + rowIdx * 310,
        };
      });
    });

    setNodes((prev) =>
      prev.map((n) =>
        updatedPositions[n.id]
          ? { ...n, x: updatedPositions[n.id].x, y: updatedPositions[n.id].y }
          : n
      )
    );
    showToast('Layout do funil alinhado em colunas.');
  }, [nodes, showToast]);

  // Ações da Barra Superior (Header)
  const handleSaveProject = useCallback(() => {
    const payload = {
      funnelName,
      nodes,
      edges,
      viewport,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    showToast('Projeto salvo no navegador (LocalStorage).');
  }, [funnelName, nodes, edges, viewport, showToast]);

  const handleExportJSON = useCallback(() => {
    const reportData = {
      project: {
        application: 'Building Money — Funnel Mapper & Financial Simulator',
        funnelName,
        exportedAt: new Date().toISOString(),
      },
      financialSummary: simulation.summary,
      bottleneckStages: simulation.stageFunnel,
      nodeBreakdown: Object.values(simulation.nodeResults),
      canvasState: {
        nodes,
        edges,
        viewport,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSlug = funnelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `building-money-${safeSlug || 'funil'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Relatório JSON exportado com sucesso.');
  }, [funnelName, simulation, nodes, edges, viewport, showToast]);

  const handleImportJSON = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const importedNodes = parsed.canvasState?.nodes || parsed.nodes;
          const importedEdges = parsed.canvasState?.edges || parsed.edges;
          const importedName =
            parsed.project?.funnelName || parsed.funnelName || 'Funil Importado';

          if (Array.isArray(importedNodes) && Array.isArray(importedEdges)) {
            setFunnelName(importedName);
            setNodes(importedNodes);
            setEdges(importedEdges);
            showToast(`Funil "${importedName}" importado.`);
          } else {
            showToast('Arquivo JSON inválido.', 'error');
          }
        } catch (err) {
          showToast('Erro ao ler arquivo JSON.', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [showToast]
  );

  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) {
      showToast('O canvas já está vazio.');
      return;
    }
    setUndoSnapshot({ nodes, edges, funnelName });
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setConnectingState(null);
    showToast('Canvas limpo.', 'info', true);
  }, [nodes, edges, funnelName, showToast]);

  const handleUndoClear = useCallback(() => {
    if (!undoSnapshot) return;
    setNodes(undoSnapshot.nodes);
    setEdges(undoSnapshot.edges);
    setFunnelName(undoSnapshot.funnelName);
    setUndoSnapshot(null);
    setToast(null);
    showToast('Funil restaurado com sucesso.');
  }, [undoSnapshot, showToast]);

  const handleCreateNewFunnel = useCallback(
    (templateId, customTitle) => {
      if (templateId === 'blank') {
        setUndoSnapshot({ nodes, edges, funnelName });
        setFunnelName(customTitle);
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
        setViewport({ x: 60, y: 60, zoom: 0.95 });
        showToast(`Novo funil "${customTitle}" criado.`);
      } else {
        const tpl = FUNNEL_TEMPLATES[templateId];
        if (tpl) {
          setFunnelName(customTitle || tpl.name);
          setNodes(JSON.parse(JSON.stringify(tpl.nodes)));
          setEdges(JSON.parse(JSON.stringify(tpl.edges)));
          setSelectedNodeId(null);
          setViewport({ x: 20, y: 30, zoom: 0.85 });
          showToast(`Modelo "${tpl.name}" carregado.`);
        }
      }
    },
    [nodes, edges, funnelName, showToast]
  );

  // Suporte a Drag-and-Drop vindo da Sidebar
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/building-money-block');
    if (!raw) return;
    try {
      const blockItem = JSON.parse(raw);
      const dropCoords = screenToCanvasCoords(e.clientX, e.clientY);
      handleAddBlock(blockItem, dropCoords);
    } catch (err) {
      console.error('Erro ao soltar bloco no canvas:', err);
    }
  };

  // Mapa rápido de nós por ID para desenhar as conexões SVG
  const nodeById = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [nodes]);

  const connectingFromNode = connectingState
    ? nodeById[connectingState.fromNodeId]
    : null;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#121214] text-zinc-100 select-none">
      {/* 1. Barra Superior (Header) */}
      <Header
        funnelName={funnelName}
        setFunnelName={setFunnelName}
        onOpenNewFunnelModal={() => setIsNewFunnelModalOpen(true)}
        onSaveProject={handleSaveProject}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onClearCanvas={handleClearCanvas}
        onOpenSimulation={() => setIsSimulationOpen((prev) => !prev)}
        isSimulationOpen={isSimulationOpen}
        summary={simulation.summary}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        lastSavedAt={lastSavedAt}
      />

      {/* Área Principal: Sidebar + Canvas Infinito + Drawer de Simulação */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 2. Barra Lateral de Blocos (20 Modelos e Estratégias Coloridas) */}
        <Sidebar
          onAddBlock={(item) => handleAddBlock(item)}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          selectedNodeId={selectedNodeId}
          autoConnectOnAdd={autoConnectOnAdd}
          setAutoConnectOnAdd={setAutoConnectOnAdd}
        />

        {/* 3. Canvas de Mapeamento Visual (Área de Trabalho Principal) */}
        <main
          ref={canvasRef}
          onWheel={handleWheel}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            if (connectingState) {
              setConnectingState(null);
            }
            setSelectedNodeId(null);
            setPanningCanvas({
              startX: e.clientX,
              startY: e.clientY,
              initialPanX: viewport.x,
              initialPanY: viewport.y,
            });
          }}
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px)`,
            backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          }}
          className={`flex-1 relative overflow-hidden bg-[#121214] ${
            panningCanvas
              ? 'cursor-grabbing'
              : connectingState
              ? 'cursor-crosshair'
              : 'cursor-grab'
          }`}
        >
          {/* Banner flutuante quando modo Conectar estiver ativo */}
          {connectingState && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-[#1E1E24] border border-emerald-500/60 text-xs font-medium text-emerald-200 shadow-2xl flex items-center gap-2.5">
              <span>
                Conectando a partir de{' '}
                <strong className="text-white">
                  {connectingFromNode?.title || 'Bloco'}
                </strong>{' '}
                — clique no bloco de destino ou pressione ESC
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConnectingState(null);
                }}
                className="ml-1 px-2 py-0.5 rounded bg-[#272730] text-zinc-200 hover:bg-[#32323D] text-[10px] border border-white/[0.08]"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Estado Vazio (Quando o Canvas está limpo) */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-6">
              <div className="max-w-md w-full p-6 rounded-xl bg-[#1E1E24] border border-white/[0.09] text-center space-y-4 pointer-events-auto shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-700/50 flex items-center justify-center mx-auto text-sky-400">
                  <MousePointerClick className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Seu Canvas de Funil está pronto
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Clique em qualquer um dos 20 blocos estratégicos na barra
                    lateral esquerda (Tráfego em Azul, Páginas em Esmeralda,
                    Automação em Roxo ou Conversões em Âmbar) para adicioná-lo ao
                    quadro.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={() => setIsNewFunnelModalOpen(true)}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Carregar Modelo de Funil
                  </button>
                  {undoSnapshot && (
                    <button
                      onClick={handleUndoClear}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#272730] hover:bg-[#32323D] text-zinc-200 border border-white/[0.08] flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                      Restaurar Anterior
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Camada Transformável (Zoom & Pan) */}
          <div
            style={{
              transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
              transformOrigin: '0 0',
            }}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          >
            {/* Camada SVG de Conexões (Setas e Fluxo Corporativo Colorido) */}
            <svg
              className="overflow-visible absolute top-0 left-0 w-1 h-1 pointer-events-none"
              style={{ zIndex: 5 }}
            >
              <defs>
                <linearGradient
                  id="corporateColorEdgeGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>

                <marker
                  id="corporateArrowHead"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
                </marker>

                <marker
                  id="previewArrowHead"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                </marker>
              </defs>

              {edges.map((edge) => {
                const fromNode = nodeById[edge.from];
                const toNode = nodeById[edge.to];
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.x + NODE_WIDTH;
                const y1 = fromNode.y + NODE_HEIGHT / 2;
                const x2 = toNode.x;
                const y2 = toNode.y + NODE_HEIGHT / 2;

                const pathData = getBezierPath(x1, y1, x2, y2);
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const flowVolume = simulation.edgeFlows[edge.id] ?? 0;
                const isHovered = hoveredEdgeId === edge.id;

                return (
                  <g
                    key={edge.id}
                    className="pointer-events-auto cursor-pointer group"
                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                  >
                    {/* Área invisível mais larga para facilitar hover/clique na linha */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="22"
                    />

                    {/* Linha estrutural de fundo */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={
                        isHovered ? '#EF4444' : 'url(#corporateColorEdgeGradient)'
                      }
                      strokeWidth={isHovered ? '3.5' : '2'}
                      strokeOpacity={isHovered ? '0.9' : '0.4'}
                    />

                    {/* Linha tracejada animada sutil indicando direção do fluxo */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#corporateColorEdgeGradient)"
                      strokeWidth="2.2"
                      markerEnd="url(#corporateArrowHead)"
                      className="animate-flow-line"
                    />

                    {/* Badge Interativo no meio da conexão */}
                    <foreignObject
                      x={midX - 58}
                      y={midY - 15}
                      width="116"
                      height="30"
                      className="overflow-visible"
                    >
                      <div className="flex items-center justify-center">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEdge(edge.id);
                          }}
                          title="Clique para remover esta conexão"
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1.5 border transition-all shadow-md ${
                            isHovered
                              ? 'bg-red-950 text-red-200 border-red-600 scale-105'
                              : 'bg-[#1E1E24] text-emerald-300 border-emerald-700/50 hover:border-red-500/60'
                          }`}
                        >
                          <span>
                            {isHovered
                              ? 'Remover'
                              : `${formatNumberBR(flowVolume)} →`}
                          </span>
                          <span className="text-[11px] leading-none opacity-80">
                            ×
                          </span>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Linha de Pré-visualização ao arrastar/clicar uma nova conexão */}
              {connectingState && connectingFromNode && (
                <path
                  d={getBezierPath(
                    connectingFromNode.x + NODE_WIDTH,
                    connectingFromNode.y + NODE_HEIGHT / 2,
                    connectingState.mouseX,
                    connectingState.mouseY
                  )}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.2"
                  strokeDasharray="6 6"
                  markerEnd="url(#previewArrowHead)"
                  className="animate-flow-line"
                />
              )}
            </svg>

            {/* Camada de Cards de Blocos do Funil */}
            <div className="relative pointer-events-auto" style={{ zIndex: 10 }}>
              {nodes.map((node) => (
                <FunnelNodeCard
                  key={node.id}
                  node={node}
                  nodeResult={simulation.nodeResults[node.id]}
                  isSelected={selectedNodeId === node.id}
                  isConnectingFromThis={
                    connectingState?.fromNodeId === node.id
                  }
                  isValidConnectionTarget={
                    Boolean(connectingState) &&
                    connectingState.fromNodeId !== node.id
                  }
                  onSelect={setSelectedNodeId}
                  onStartDragNode={handleStartDragNode}
                  onUpdateNodeTitle={handleUpdateNodeTitle}
                  onUpdateNodeMetric={handleUpdateNodeMetric}
                  onDuplicateNode={handleDuplicateNode}
                  onDeleteNode={handleDeleteNode}
                  onStartConnectionDrag={handleStartConnectionDrag}
                  onCompleteConnection={handleCompleteConnection}
                  onToggleClickConnect={handleToggleClickConnect}
                />
              ))}
            </div>
          </div>

          {/* HUD Inferior Esquerdo: Controles de Zoom, Fit View e Auto-Layout */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-4 z-20 flex items-center gap-1 p-1.5 rounded-xl bg-[#1E1E24] border border-white/[0.08] shadow-xl"
          >
            <button
              onClick={() =>
                setViewport((prev) => ({
                  ...prev,
                  zoom: Math.max(0.35, Number((prev.zoom - 0.1).toFixed(2))),
                }))
              }
              className="p-2 rounded-lg hover:bg-[#272730] text-zinc-300 hover:text-white transition-colors"
              title="Diminuir Zoom (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewport((prev) => ({ ...prev, zoom: 1 }))}
              className="px-2.5 py-1 rounded-md font-mono text-xs font-bold text-sky-400 hover:bg-[#272730] transition-colors"
              title="Resetar Zoom para 100%"
            >
              {Math.round(viewport.zoom * 100)}%
            </button>

            <button
              onClick={() =>
                setViewport((prev) => ({
                  ...prev,
                  zoom: Math.min(1.6, Number((prev.zoom + 0.1).toFixed(2))),
                }))
              }
              className="p-2 rounded-lg hover:bg-[#272730] text-zinc-300 hover:text-white transition-colors"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/[0.08] mx-0.5" />

            <button
              onClick={handleFitView}
              className="p-2 rounded-lg hover:bg-[#272730] text-zinc-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Centralizar e enquadrar funil na tela"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline pr-1">Enquadrar</span>
            </button>

            <button
              onClick={handleAutoLayout}
              className="p-2 rounded-lg hover:bg-[#272730] text-zinc-300 hover:text-sky-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Organizar blocos em colunas automaticamente"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline pr-1">Auto-Alinhar</span>
            </button>
          </div>

          {/* HUD Inferior Direito: Resumo Financeiro Rápido + Atalho Simular */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-3 p-2.5 pl-4 rounded-xl bg-[#1E1E24] border border-white/[0.09] shadow-2xl"
          >
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 block">
                  Visitantes
                </span>
                <span className="font-mono font-bold text-sky-400">
                  {formatNumberBR(simulation.summary.totalVisitors)}
                </span>
              </div>
              <div className="h-6 w-px bg-white/[0.08]" />
              <div>
                <span className="text-[10px] text-zinc-400 block">Leads</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatNumberBR(simulation.summary.totalLeads)}
                </span>
              </div>
              <div className="h-6 w-px bg-white/[0.08]" />
              <div>
                <span className="text-[10px] text-zinc-400 block">Vendas</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatNumberBR(simulation.summary.totalCustomers)}
                </span>
              </div>
              <div className="h-6 w-px bg-white/[0.08]" />
              <div>
                <span className="text-[10px] text-zinc-400 block">
                  Lucro Projetado
                </span>
                <span
                  className={`font-mono font-extrabold ${
                    simulation.summary.netProfit >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {formatCurrencyBRL(simulation.summary.netProfit)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSimulationOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              Ver Gargalos →
            </button>
          </div>

          {/* Toast de Feedback Flutuante */}
          {toast && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#1E1E24] border border-emerald-600/50 text-xs font-medium text-white shadow-2xl"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toast.message}</span>
              {toast.withUndo && undoSnapshot && (
                <button
                  onClick={handleUndoClear}
                  className="ml-2 px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-[11px]"
                >
                  Desfazer
                </button>
              )}
            </div>
          )}
        </main>

        {/* 4. Painel de Simulação Financeira e Projeção (Drawer Lateral Retrátil) */}
        <SimulationDrawer
          isOpen={isSimulationOpen}
          onClose={() => setIsSimulationOpen(false)}
          simulation={simulation}
          scenario={scenario}
          setScenario={setScenario}
          onExportJSON={handleExportJSON}
        />
      </div>

      {/* Modal de Novo Funil / Templates */}
      <NewFunnelModal
        isOpen={isNewFunnelModalOpen}
        onClose={() => setIsNewFunnelModalOpen(false)}
        onCreateFunnel={handleCreateNewFunnel}
      />
    </div>
  );
}
