export type SimulationStatus = "Concluído" | "Recomendado" | "Atenção"

export type SimulationScenario = {
  id: string
  name: string
  shortName: string
  type: "baseline" | "recommended" | "previous"
  status: SimulationStatus
  summary: string
  createdAt: string
  score: number
  scoreDelta: number
  simulatedMonths: string[]
  knownCost: number | null
  knownCostDelta: number | null
  priceCoverage: number
  pricedLines: number
  totalLines: number
  unknownOriginLines: number
  costNote: string
  keyChanges: string[]
  monthlyChanges: {
    month: string
    item: string
    pn: string
    baseline: number
    scenario: number
    delta: number
  }[]
}

export const simulationScenarios: SimulationScenario[] = [
  {
    id: "baseline",
    name: "Baseline local",
    shortName: "Baseline",
    type: "baseline",
    status: "Concluído",
    summary: "Referência atual calculada apenas com linhas de origem local.",
    createdAt: "Executada agora",
    score: 674.42,
    scoreDelta: 0,
    simulatedMonths: ["Nov/26", "Dec/26"],
    knownCost: 15229485.18,
    knownCostDelta: 0,
    priceCoverage: 62.5,
    pricedLines: 30,
    totalLines: 48,
    unknownOriginLines: 18,
    costNote: "Somente custos conhecidos",
    keyChanges: [
      "Mantém a política de origem atual",
      "Base de comparação do relatório",
      "18 linhas sem origem identificada",
    ],
    monthlyChanges: [
      { month: "Nov/26", item: "Painel lateral", pn: "PN-901", baseline: 128.4, scenario: 128.4, delta: 0 },
      { month: "Nov/26", item: "Conjunto cabo", pn: "PN-654", baseline: 92.15, scenario: 92.15, delta: 0 },
      { month: "Dec/26", item: "Suporte fixação", pn: "PN-440", baseline: 65.7, scenario: 65.7, delta: 0 },
      { month: "Dec/26", item: "Módulo de controle", pn: "PN-218", baseline: 310.2, scenario: 310.2, delta: 0 },
      { month: "Nov/26", item: "Carcaça motor", pn: "PN-777", baseline: 184.6, scenario: 184.6, delta: 0 },
      { month: "Nov/26", item: "Blindagem térmica", pn: "PN-381", baseline: 146.8, scenario: 146.8, delta: 0 },
      { month: "Dec/26", item: "Conector principal", pn: "PN-532", baseline: 74.3, scenario: 74.3, delta: 0 },
      { month: "Dec/26", item: "Suporte traseiro", pn: "PN-744", baseline: 118.9, scenario: 118.9, delta: 0 },
    ],
  },
  {
    id: "recommended",
    name: "MILP recomendado",
    shortName: "MILP recomendado",
    type: "recommended",
    status: "Recomendado",
    summary: "Cenário recomendado com economia real e score dentro do limite calculável.",
    createdAt: "Executada agora",
    score: 674.73,
    scoreDelta: 0.31,
    simulatedMonths: ["Nov/26", "Dec/26"],
    knownCost: 15176320.44,
    knownCostDelta: -53164.74,
    priceCoverage: 62.5,
    pricedLines: 30,
    totalLines: 48,
    unknownOriginLines: 18,
    costNote: "Economia conhecida",
    keyChanges: [
      "Concentra compras locais em Dec/26",
      "Reduz custo conhecido em US$ 53.164,74",
      "Preserva 30 linhas com preço validado",
    ],
    monthlyChanges: [
      { month: "Nov/26", item: "Painel lateral", pn: "PN-901", baseline: 128.4, scenario: 128.4, delta: 0 },
      { month: "Nov/26", item: "Conjunto cabo", pn: "PN-654", baseline: 92.15, scenario: 92.15, delta: 0 },
      { month: "Dec/26", item: "Suporte fixação", pn: "PN-440", baseline: 65.7, scenario: 61.1, delta: -4.6 },
      { month: "Dec/26", item: "Módulo de controle", pn: "PN-218", baseline: 310.2, scenario: 274.8, delta: -35.4 },
      { month: "Nov/26", item: "Carcaça motor", pn: "PN-777", baseline: 184.6, scenario: 178.2, delta: -6.4 },
      { month: "Nov/26", item: "Blindagem térmica", pn: "PN-381", baseline: 146.8, scenario: 145.1, delta: -1.7 },
      { month: "Dec/26", item: "Conector principal", pn: "PN-532", baseline: 74.3, scenario: 71.5, delta: -2.8 },
      { month: "Dec/26", item: "Suporte traseiro", pn: "PN-744", baseline: 118.9, scenario: 116.4, delta: -2.5 },
    ],
  },
  {
    id: "previous",
    name: "Reconstrução anterior",
    shortName: "Reconstrução anterior",
    type: "previous",
    status: "Atenção",
    summary: "Cenário anterior mantido para explicar a divergência de premissas.",
    createdAt: "Importada do histórico",
    score: 668.31,
    scoreDelta: -6.11,
    simulatedMonths: ["Nov/26", "Dec/26"],
    knownCost: null,
    knownCostDelta: null,
    priceCoverage: 47.9,
    pricedLines: 23,
    totalLines: 48,
    unknownOriginLines: 25,
    costNote: "Custo não reconstruído",
    keyChanges: [
      "Usa apenas 23 linhas precificadas",
      "Não considera a cobertura atual de importados",
      "Score não é comparável sem o mesmo escopo",
    ],
    monthlyChanges: [
      { month: "Nov/26", item: "Painel lateral", pn: "PN-901", baseline: 128.4, scenario: 131.2, delta: 2.8 },
      { month: "Nov/26", item: "Conjunto cabo", pn: "PN-654", baseline: 92.15, scenario: 96.9, delta: 4.75 },
      { month: "Dec/26", item: "Suporte fixação", pn: "PN-440", baseline: 65.7, scenario: 71.3, delta: 5.6 },
      { month: "Dec/26", item: "Módulo de controle", pn: "PN-218", baseline: 310.2, scenario: 321.4, delta: 11.2 },
      { month: "Nov/26", item: "Carcaça motor", pn: "PN-777", baseline: 184.6, scenario: 188.1, delta: 3.5 },
      { month: "Nov/26", item: "Blindagem térmica", pn: "PN-381", baseline: 146.8, scenario: 149.2, delta: 2.4 },
      { month: "Dec/26", item: "Conector principal", pn: "PN-532", baseline: 74.3, scenario: 76.4, delta: 2.1 },
      { month: "Dec/26", item: "Suporte traseiro", pn: "PN-744", baseline: 118.9, scenario: 120.6, delta: 1.7 },
    ],
  },
]

export const reportFacts = {
  sopScore: 674.42,
  sopKnownCost: 15229485.18,
  requestedScore: 675.24,
  maxCalculableScore: 675.24,
  priceCoverage: 62.5,
  pricedLines: 30,
  totalLines: 48,
  unknownOriginLines: 18,
  baselineKnownCost: 15229485.18,
  recommendedKnownCost: 15176320.44,
  knownSavings: 53164.74,
  confidence: "Média",
  scope: "Jan/26 — Dez/26",
  generatedAt: "14 Jun 2025, 10:42",
}

export function getMockAnalysisReply(prompt: string, scenario: SimulationScenario) {
  const normalized = prompt.toLocaleLowerCase("pt-BR")
  const savings = scenario.knownCostDelta === null ? null : Math.abs(scenario.knownCostDelta)

  if (normalized.includes("score") || normalized.includes("675")) {
    return `No recorte de ${scenario.name}, o score observado fica em ${scenario.score.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. O SOP / plano atual está em ${reportFacts.sopScore.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}; a diferença é ${Math.abs(scenario.score - reportFacts.sopScore).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ponto.`
  }

  if (normalized.includes("econom") || normalized.includes("custo") || normalized.includes("linha")) {
    return savings === null
      ? `O custo da ${scenario.name} não foi reconstruído. A comparação financeira só fica disponível quando os preços do mesmo escopo do SOP estiverem confirmados.`
      : `A ${scenario.name} reduz o custo conhecido em ${usdText(savings)} frente ao SOP. A economia está concentrada nos itens simulados em Nov/26 e Dec/26.`
  }

  if (normalized.includes("dezembro") || normalized.includes("diverg") || normalized.includes("origem")) {
    return `A simulação cobre Nov/26 e Dec/26. As ${scenario.unknownOriginLines} linhas sem origem identificada ficam fora do score até a confirmação de origem e preço.`
  }

  if (normalized.includes("corrig") || normalized.includes("aprovar") || normalized.includes("pend") || normalized.includes("próxim")) {
    return `Antes de aprovar, eu revisaria as ${scenario.unknownOriginLines} linhas pendentes e manteria o mesmo escopo de meses e premissas do SOP para recalcular o comparativo.`
  }

  return `Posso explicar o score, a economia frente ao SOP ou o impacto dos meses simulados em ${scenario.name}.`
}

function usdText(value: number) {
  return `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
}
