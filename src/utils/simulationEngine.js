// Motor de Simulação Financeira e Propagação de Fluxo em Grafo — Building Money

export function simulateFunnel(nodes = [], edges = [], scenario = {}) {
  const {
    trafficBoostPct = 0,
    conversionBoostPct = 0,
    costReductionPct = 0,
  } = scenario;

  if (!nodes.length) {
    return {
      nodeResults: {},
      edgeFlows: {},
      summary: {
        totalImpressions: 0,
        totalVisitors: 0,
        totalLeads: 0,
        totalCheckoutIntent: 0,
        totalCustomers: 0,
        totalUpsells: 0,
        totalInvestment: 0,
        totalRevenue: 0,
        netProfit: 0,
        profitMargin: 0,
        roas: 0,
        roiPct: 0,
        cpl: 0,
        cpa: 0,
        epc: 0,
        overallConversionRate: 0,
      },
      stageFunnel: [],
      bottlenecks: [],
    };
  }

  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Filtra conexões válidas
  const validEdges = edges.filter(
    (e) => nodeMap.has(e.from) && nodeMap.has(e.to) && e.from !== e.to
  );

  const incomingMap = new Map();
  const outgoingMap = new Map();
  nodes.forEach((n) => {
    incomingMap.set(n.id, []);
    outgoingMap.set(n.id, []);
  });

  validEdges.forEach((edge) => {
    incomingMap.get(edge.to).push(edge);
    outgoingMap.get(edge.from).push(edge);
  });

  // Ordenação topológica com proteção contra ciclos (Kahn's Algorithm + fallback por posição X)
  const inDegree = new Map();
  nodes.forEach((n) => inDegree.set(n.id, incomingMap.get(n.id).length));

  const queue = nodes
    .filter((n) => inDegree.get(n.id) === 0)
    .sort((a, b) => a.x - b.x);

  const orderedIds = [];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    orderedIds.push(current.id);

    const outEdges = outgoingMap.get(current.id) || [];
    outEdges.forEach((edge) => {
      const targetId = edge.to;
      inDegree.set(targetId, (inDegree.get(targetId) || 1) - 1);
      if (inDegree.get(targetId) <= 0 && !visited.has(targetId)) {
        const targetNode = nodeMap.get(targetId);
        if (targetNode) queue.push(targetNode);
      }
    });
  }

  // Adiciona quaisquer nós remanescentes (em caso de ciclo fechado) ordenados por X
  nodes
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => a.x - b.x)
    .forEach((n) => orderedIds.push(n.id));

  const nodeResults = {};
  const edgeFlows = {};

  orderedIds.forEach((nodeId) => {
    const node = nodeMap.get(nodeId);
    const inEdges = incomingMap.get(nodeId) || [];
    const hasIncoming = inEdges.length > 0;

    // Soma o fluxo vindo de nós pais já processados
    let upstreamFlow = 0;
    inEdges.forEach((edge) => {
      const parentRes = nodeResults[edge.from];
      const flow = parentRes ? parentRes.outputVolume : 0;
      edgeFlows[edge.id] = flow;
      upstreamFlow += flow;
    });

    // Determina volume de entrada no bloco
    const rawBaseVisitors = Math.max(0, Number(node.metrics?.visitors) || 0);
    const isTrafficSource = node.category === 'traffic';

    let inputVolume = 0;
    let isDrivenByFlow = false;

    if (hasIncoming && !node.metrics?.manualVisitorsOverride) {
      inputVolume = upstreamFlow;
      isDrivenByFlow = true;
    } else {
      const boostMultiplier = isTrafficSource ? 1 + trafficBoostPct / 100 : 1;
      inputVolume = rawBaseVisitors * boostMultiplier;
    }

    // Taxa de conversão efetiva da etapa
    const rawConv = Math.max(0, Math.min(100, Number(node.metrics?.conversionRate) || 0));
    const effectiveConversionRate = Math.min(
      100,
      Math.max(0, rawConv * (1 + conversionBoostPct / 100))
    );

    const outputVolume = inputVolume * (effectiveConversionRate / 100);
    const dropOffVolume = Math.max(0, inputVolume - outputVolume);
    const dropOffRate = Math.max(0, 100 - effectiveConversionRate);

    // Custos e Receita do Bloco
    const rawCostPerUnit = Math.max(0, Number(node.metrics?.costPerUnit) || 0);
    const effectiveCostPerUnit = Math.max(0, rawCostPerUnit * (1 - costReductionPct / 100));
    const totalCost = inputVolume * effectiveCostPerUnit;

    const averageTicket = Math.max(0, Number(node.metrics?.averageTicket) || 0);
    const totalRevenue = outputVolume * averageTicket;

    nodeResults[nodeId] = {
      nodeId,
      title: node.title,
      type: node.type,
      category: node.category,
      stage: node.stage,
      isDrivenByFlow,
      hasIncoming,
      inputVolume,
      outputVolume,
      dropOffVolume,
      dropOffRate,
      conversionRate: effectiveConversionRate,
      costPerUnit: effectiveCostPerUnit,
      totalCost,
      averageTicket,
      totalRevenue,
    };
  });

  // Preenche eventuais edgeFlows que apontavam para trás em ciclos
  validEdges.forEach((edge) => {
    if (edgeFlows[edge.id] === undefined) {
      edgeFlows[edge.id] = nodeResults[edge.from]?.outputVolume || 0;
    }
  });

  // Agregações financeiras e de volume de ponta a ponta
  let totalInvestment = 0;
  let totalRevenue = 0;

  const trafficNodes = nodes.filter((n) => n.category === 'traffic');
  const rootNodes = nodes.filter((n) => (incomingMap.get(n.id) || []).length === 0);

  let totalImpressions = 0;
  let totalVisitors = 0;

  if (trafficNodes.length > 0) {
    trafficNodes.forEach((n) => {
      const res = nodeResults[n.id];
      if (res) {
        totalImpressions += res.inputVolume;
        totalVisitors += res.outputVolume;
      }
    });
  } else {
    rootNodes.forEach((n) => {
      const res = nodeResults[n.id];
      if (res) {
        totalImpressions += res.inputVolume;
        totalVisitors += res.inputVolume;
      }
    });
  }

  // Cálculo de Leads Capturados (Landing Page, Quiz/Diagnóstico, Grupo VIP, Lead Capturado)
  const leadNodeTypes = new Set([
    'landing_page',
    'quiz_vsl',
    'lead_capturado',
    'grupo_vip',
  ]);
  const leadNodes = nodes.filter((n) => leadNodeTypes.has(n.type));

  let totalLeads = 0;
  if (leadNodes.length > 0) {
    // Evita somar duas vezes se uma Landing Page estiver conectada diretamente a um Grupo VIP ou Quiz
    const rootLeadNodes = leadNodes.filter((ln) => {
      const parents = incomingMap.get(ln.id) || [];
      return !parents.some((e) => leadNodeTypes.has(nodeMap.get(e.from)?.type));
    });
    const targetLeadSet = rootLeadNodes.length > 0 ? rootLeadNodes : leadNodes;
    targetLeadSet.forEach((ln) => {
      totalLeads += nodeResults[ln.id]?.outputVolume || 0;
    });
  } else {
    const engagementNodes = nodes.filter(
      (n) => n.category === 'pages' || n.category === 'communication'
    );
    if (engagementNodes.length > 0) {
      const firstPage = engagementNodes.sort((a, b) => a.x - b.x)[0];
      totalLeads = nodeResults[firstPage.id]?.outputVolume || 0;
    }
  }

  // Intenção de Compra / Checkout / VSL / Webinar / Sessão High-Ticket
  const intentNodes = nodes.filter((n) =>
    [
      'checkout',
      'pagina_vendas',
      'webinar_live',
      'sessao_high_ticket',
      'pix_gerado',
    ].includes(n.type)
  );
  let totalCheckoutIntent = 0;
  const checkoutNodes = nodes.filter((n) => n.type === 'checkout');
  if (checkoutNodes.length > 0) {
    checkoutNodes.forEach((cn) => {
      totalCheckoutIntent += nodeResults[cn.id]?.inputVolume || 0;
    });
  } else if (intentNodes.length > 0) {
    intentNodes.forEach((inNode) => {
      totalCheckoutIntent += nodeResults[inNode.id]?.outputVolume || 0;
    });
  }

  // Vendas Principais e Upsells / Downsells
  let totalCustomers = 0;
  let totalUpsells = 0;

  const upsellTypes = new Set(['upsell_downsell', 'downsell_page']);
  const primarySaleTypes = new Set([
    'compra_realizada',
    'pix_gerado',
    'sessao_high_ticket',
    'recuperacao_vendas',
  ]);

  nodes.forEach((n) => {
    const res = nodeResults[n.id];
    if (!res) return;

    totalInvestment += res.totalCost;
    totalRevenue += res.totalRevenue;

    if (upsellTypes.has(n.type)) {
      totalUpsells += res.outputVolume;
    } else if (
      primarySaleTypes.has(n.type) ||
      (res.averageTicket > 0 && !upsellTypes.has(n.type))
    ) {
      totalCustomers += res.outputVolume;
    }
  });

  if (totalCustomers === 0 && checkoutNodes.length > 0) {
    checkoutNodes.forEach((cn) => {
      totalCustomers += nodeResults[cn.id]?.outputVolume || 0;
    });
  }

  const netProfit = totalRevenue - totalInvestment;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const roas = totalInvestment > 0 ? totalRevenue / totalInvestment : 0;
  const roiPct = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  const cpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;
  const cpa = totalCustomers > 0 ? totalInvestment / totalCustomers : 0;
  const epc = totalVisitors > 0 ? totalRevenue / totalVisitors : 0;
  const overallConversionRate =
    totalVisitors > 0 ? (totalCustomers / totalVisitors) * 100 : 0;

  // Construção do Gráfico de Gargalos de Macro-Etapas (Paleta Corporativa Colorida: Azul, Esmeralda, Roxo, Âmbar)
  const rawStages = [
    {
      id: 'visitors',
      label: 'Visitantes Qualificados',
      shortLabel: 'Visitantes',
      volume: Math.round(totalVisitors || totalImpressions),
      color: '#2563EB',
      description: 'Tráfego total entregue às páginas de entrada',
    },
    {
      id: 'leads',
      label: 'Leads & Qualificação',
      shortLabel: 'Leads',
      volume: Math.round(totalLeads),
      color: '#059669',
      description: 'Usuários capturados ou qualificados na primeira etapa',
    },
    {
      id: 'intent',
      label: 'Intenção / Checkout',
      shortLabel: 'Checkout',
      volume: Math.round(totalCheckoutIntent || totalCustomers * 1.6),
      color: '#7C3AED',
      description: 'Leads que avançaram para oferta / checkout / reunião',
    },
    {
      id: 'customers',
      label: 'Clientes Convertidos (Vendas)',
      shortLabel: 'Clientes',
      volume: Math.round(totalCustomers),
      color: '#D97706',
      description: 'Conversões financeiras efetivadas no funil',
    },
  ].filter((stage, idx) => idx === 0 || stage.volume > 0 || idx === 3);

  const maxStageVolume = Math.max(1, ...rawStages.map((s) => s.volume));

  const stageFunnel = rawStages.map((stage, index) => {
    const prevVolume = index > 0 ? rawStages[index - 1].volume : stage.volume;
    const stepConversionPct =
      index === 0
        ? 100
        : prevVolume > 0
        ? Math.min(100, (stage.volume / prevVolume) * 100)
        : 0;
    const stepDropOffPct = index === 0 ? 0 : Math.max(0, 100 - stepConversionPct);
    const widthPct = Math.max(6, Math.min(100, (stage.volume / maxStageVolume) * 100));

    return {
      ...stage,
      stepConversionPct,
      stepDropOffPct,
      lostVolume: index === 0 ? 0 : Math.max(0, prevVolume - stage.volume),
      widthPct,
    };
  });

  // Ranking detalhado de gargalos por bloco individual
  const bottlenecks = nodes
    .map((n) => nodeResults[n.id])
    .filter(
      (res) =>
        res &&
        res.inputVolume > 0 &&
        res.type !== 'obrigado' &&
        res.type !== 'lead_capturado'
    )
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .map((res) => {
      let severity = 'normal';
      if (res.dropOffRate >= 80) severity = 'critical';
      else if (res.dropOffRate >= 60) severity = 'warning';

      return {
        ...res,
        severity,
      };
    });

  return {
    nodeResults,
    edgeFlows,
    summary: {
      totalImpressions,
      totalVisitors,
      totalLeads,
      totalCheckoutIntent,
      totalCustomers,
      totalUpsells,
      totalInvestment,
      totalRevenue,
      netProfit,
      profitMargin,
      roas,
      roiPct,
      cpl,
      cpa,
      epc,
      overallConversionRate,
    },
    stageFunnel,
    bottlenecks,
  };
}

export function formatCurrencyBRL(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumberBR(value) {
  const num = Math.round(Number(value) || 0);
  return num.toLocaleString('pt-BR');
}
