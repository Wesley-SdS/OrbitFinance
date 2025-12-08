export const MARKET_DATA = {
  cdi: 13.75,
  selic: 13.75,
  poupanca: 9.5,
  ipca: 4.5,

  stocks: {
    COCA34: {
      name: "Coca-Cola",
      price: 25.0,
      dividendYield: 3.2,
      sector: "Consumo",
    },
    PETR4: {
      name: "Petrobras",
      price: 35.0,
      dividendYield: 8.5,
      sector: "Energia",
    },
    ITUB4: {
      name: "Itaú Unibanco",
      price: 30.0,
      dividendYield: 5.0,
      sector: "Financeiro",
    },
    BBAS3: {
      name: "Banco do Brasil",
      price: 28.0,
      dividendYield: 7.0,
      sector: "Financeiro",
    },
    VALE3: {
      name: "Vale",
      price: 65.0,
      dividendYield: 6.0,
      sector: "Mineração",
    },
    BBDC4: {
      name: "Bradesco",
      price: 15.0,
      dividendYield: 6.5,
      sector: "Financeiro",
    },
  },

  investments: {
    tesouro_selic: {
      name: "Tesouro Selic",
      rate: 13.75,
      liquidity: "diária",
      risk: "baixo",
    },
    tesouro_ipca: {
      name: "Tesouro IPCA+ 2029",
      rate: 6.5,
      liquidity: "baixa",
      risk: "médio",
    },
    cdb_100_cdi: {
      name: "CDB 100% CDI",
      rate: 13.75,
      liquidity: "baixa",
      risk: "baixo",
    },
    lci_90_cdi: {
      name: "LCI 90% CDI",
      rate: 12.38,
      liquidity: "baixa",
      risk: "baixo",
    },
  },
} as const

export type StockSymbol = keyof typeof MARKET_DATA.stocks
export type InvestmentType = keyof typeof MARKET_DATA.investments

export function getStockInfo(symbol: StockSymbol) {
  return MARKET_DATA.stocks[symbol]
}

export function getInvestmentInfo(type: InvestmentType) {
  return MARKET_DATA.investments[type]
}

export function calculateDividendYield(stockPrice: number, annualDividend: number): number {
  return (annualDividend / stockPrice) * 100
}

export function getStocksByDividendYield(minYield: number) {
  return Object.entries(MARKET_DATA.stocks)
    .filter(([_, stock]) => stock.dividendYield >= minYield)
    .sort(([_, a], [__, b]) => b.dividendYield - a.dividendYield)
}
