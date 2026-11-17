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
      { month: "Jan/26", item: "Painel lateral", pn: "PN-901", baseline: 128.4, scenario: 128.4, delta: 0 },
      { month: "Fev/26", item: "Conjunto cabo", pn: "PN-654", baseline: 92.15, scenario: 92.15, delta: 0 },
      { month: "Mar/26", item: "Suporte fixação", pn: "PN-440", baseline: 65.7, scenario: 65.7, delta: 0 },
      { month: "Abr/26", item: "Módulo de controle", pn: "PN-218", baseline: 310.2, scenario: 310.2, delta: 0 },
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
    knownCost: 15176320.44,
    knownCostDelta: -53164.74,
    priceCoverage: 62.5,
    pricedLines: 30,
    totalLines: 48,
    unknownOriginLines: 18,
    costNote: "Economia conhecida",
    keyChanges: [
      "Concentra compras locais em abr/26",
      "Reduz custo conhecido em US$ 53.164,74",
      "Preserva 30 linhas com preço validado",
    ],
    monthlyChanges: [
      { month: "Jan/26", item: "Painel lateral", pn: "PN-901", baseline: 128.4, scenario: 128.4, delta: 0 },
      { month: "Fev/26", item: "Conjunto cabo", pn: "PN-654", baseline: 92.15, scenario: 92.15, delta: 0 },
      { month: "Mar/26", item: "Suporte fixação", pn: "PN-440", baseline: 65.7, scenario: 61.1, delta: -4.6 },
      { month: "Abr/26", item: "Módulo de controle", pn: "PN-218", baseline: 310.2, scenario: 274.8, delta: -35.4 },
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
      { month: "Jan/26", item: "Painel lateral", pn: "PN-901", baseline: 128.4, scenario: 131.2, delta: 2.8 },
      { month: "Fev/26", item: "Conjunto cabo", pn: "PN-654", baseline: 92.15, scenario: 96.9, delta: 4.75 },
      { month: "Mar/26", item: "Suporte fixação", pn: "PN-440", baseline: 65.7, scenario: 71.3, delta: 5.6 },
      { month: "Abr/26", item: "Módulo de controle", pn: "PN-218", baseline: 310.2, scenario: 321.4, delta: 11.2 },
    ],
  },
]

export const reportFacts = {
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

export function getMockAnalysisReply(prompt: string, scenarioNames: string[], unknownOriginLines = 18) {
  const normalized = prompt.toLocaleLowerCase("pt-BR")
  const context = scenarioNames.join(" + ") || "as simulações selecionadas"

  if (normalized.includes("score") || normalized.includes("675")) {
    return `No recorte de ${context}, o score observado fica em 674,73. O teto calculável também é 675,24, então a diferença restante não é causada pelo solver: ela vem das ${unknownOriginLines} linhas sem origem identificada, que ainda não entram no cálculo econômico.`
  }

  if (normalized.includes("econom") || normalized.includes("custo") || normalized.includes("linha")) {
    return `A economia conhecida do MILP recomendado é de US$ 53.164,74. As maiores variações aparecem em mar/26 e abr/26, com redução concentrada no suporte de fixação e no módulo de controle. A leitura combina o custo conhecido com as variações do relatório anexado.`
  }

  if (normalized.includes("dezembro") || normalized.includes("diverg") || normalized.includes("origem")) {
    return `A divergência de dezembro é uma pendência de cobertura, não uma decisão de sourcing. A base atual valida preço em 30 de 48 linhas; as outras ${unknownOriginLines} precisam de origem e preço antes de qualquer conclusão definitiva sobre o ano completo.`
  }

  if (normalized.includes("corrig") || normalized.includes("aprovar") || normalized.includes("pend") || normalized.includes("próxim")) {
    return `Antes de aprovar, eu revisaria as ${unknownOriginLines} linhas sem origem identificada, confirmaria as premissas cambiais e fecharia o preço importado do módulo de controle. Com isso, o comparativo fica auditável e o score pode ser recalculado em uma base completa.`
  }

  return `Posso explicar o score, a economia conhecida, as divergências de cobertura ou as pendências de aprovação do cenário selecionado.`
}
