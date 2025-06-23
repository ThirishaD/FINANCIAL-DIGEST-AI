export interface FinancialDigest {
  company: string;
  symbol: string;
  sector: string;
  marketCap: number;
  revenue: number;
  netIncome: number;
  grossMargins: number;
  profitMargins: number;
  peRatio: number;
  pbRatio: number;
  insight?: string;
  comments?: {
    revenue?: string;
    netIncome?: string;
    grossMargins?: string;
    profitMargins?: string;
    peRatio?: string;
    pbRatio?: string;
    cashFlow?: string;
  };
  forecast?: {
    [year: string]: {
      revenue: number;
      netIncome: number;
    };
  };
  news?: Array<{
    title: string;
    link: string;
    publisher?: string;
  }>;
  graphInference?: string;
  industry?: string;
  historicalTrends?: {
    years: string[];
    revenue: number[];
    netIncome: number[];
    grossMargins: number[];
    profitMargins: number[];
  };
  cashFlow?: {
    years: string[];
    operating: number[];
    investing: number[];
    financing: number[];
  };
  industryInsights?: {
    competitors: Array<{
      symbol: string;
      company: string;
      revenue: number;
      netIncome: number;
      grossMargins: number;
      profitMargins: number;
      marketCap: number;
    }>;
  };
  marketShare?: {
    company: number;
    competitors: number[];
  };
  marketInsights?: string;
  netMargin?: number;
  qualitativeFactors?: string;
  companySegregation?: string;
  futureInvestments?: string;
  currentInvestments?: string;
  futureDemands?: string;
  financialHealth?: string;
}

export interface MetricCardProps {
  title: string;
  value: string;
  comment?: string;
  icon: string;
}

export interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}