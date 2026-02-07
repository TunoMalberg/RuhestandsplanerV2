/**
 * 3-Töpfe-Strategie für die Ruhestandsplanung
 * 
 * Wissenschaftliche Basis:
 * - Topf 1 (Liquidität): 2-3 Jahre Entnahmen in sicheren Anlagen (Tagesgeld/Festgeld)
 * - Topf 2 (Mittelfristig): 4-7 Jahre in Anleihen/Rentenfonds
 * - Topf 3 (Langfristig): Rest in Aktien/ETFs für langfristiges Wachstum
 * 
 * Diese Strategie basiert auf dem "Bucket-Approach" von Harold Evensky
 * und dem Sequence-of-Returns-Risk Management.
 */

export interface RetirementInput {
  totalCapital: number;
  age: number;
  annualWithdrawal: number;
  lifeExpectancy?: number;
}

export interface BucketAllocation {
  bucket1: number;
  bucket2: number;
  bucket3: number;
}

export interface BucketConfig {
  name: string;
  weight: number; // Percentage weight (0-100)
  expectedReturn: number; // Annual return as decimal (e.g., 0.02 for 2%)
  volatility: number;
  color: string;
  initialCost?: number; // Track initial cost basis for loss avoidance
}

export interface CustomBucketSettings {
  buckets: BucketConfig[];
  inflationEnabled: boolean;
  inflationRate: number;
}

// Default bucket configurations
export const DEFAULT_BUCKET_CONFIGS: BucketConfig[] = [
  {
    name: "Liquidität",
    weight: 15,
    expectedReturn: 0.02,
    volatility: 0.005,
    color: "#22c55e",
  },
  {
    name: "Anleihen",
    weight: 35,
    expectedReturn: 0.04,
    volatility: 0.06,
    color: "#3b82f6",
  },
  {
    name: "Aktien",
    weight: 50,
    expectedReturn: 0.07,
    volatility: 0.18,
    color: "#8b5cf6",
  }
];

// Legacy BUCKET_CONFIGS for backward compatibility
export const BUCKET_CONFIGS: BucketConfig[] = DEFAULT_BUCKET_CONFIGS;

export function calculateInitialAllocation(
  input: RetirementInput,
  customBuckets?: BucketConfig[]
): BucketAllocation {
  const { totalCapital } = input;
  const buckets = customBuckets || DEFAULT_BUCKET_CONFIGS;
  
  // Normalize weights to ensure they sum to 100
  const totalWeight = buckets.reduce((sum, b) => sum + b.weight, 0);
  
  const bucket1 = Math.round(totalCapital * (buckets[0].weight / totalWeight));
  const bucket2 = Math.round(totalCapital * (buckets[1].weight / totalWeight));
  const bucket3 = totalCapital - bucket1 - bucket2; // Rest to avoid rounding issues
  
  return {
    bucket1: Math.max(0, bucket1),
    bucket2: Math.max(0, bucket2),
    bucket3: Math.max(0, bucket3)
  };
}

export function calculateWithdrawalRate(input: RetirementInput): number {
  return (input.annualWithdrawal / input.totalCapital) * 100;
}

export function calculateYearsOfCoverage(input: RetirementInput): number {
  const { totalCapital, annualWithdrawal } = input;
  if (annualWithdrawal <= 0) return Number.POSITIVE_INFINITY;
  
  return Math.floor(totalCapital / annualWithdrawal);
}

export interface RebalanceRecommendation {
  action: "none" | "refill_bucket1" | "refill_bucket2" | "reduce_withdrawal";
  fromBucket?: number;
  toBucket?: number;
  amount?: number;
  description: string;
  urgency: "low" | "medium" | "high";
  avoidedLoss?: boolean; // Flag if action was modified to avoid loss realization
}

export interface BucketCostBasis {
  bucket1: number;
  bucket2: number;
  bucket3: number;
}

/**
 * Check if selling from a bucket would realize a loss
 */
export function wouldRealizeLoss(
  currentValue: number,
  costBasis: number,
  amountToSell: number
): boolean {
  if (costBasis <= 0 || currentValue <= 0) return false;
  
  // Calculate the average cost per unit
  const currentPriceRatio = currentValue / costBasis;
  
  // If current value is less than cost basis, selling would realize a loss
  return currentPriceRatio < 1;
}

/**
 * Calculate how much can be sold without realizing a loss
 * Returns the maximum amount that can be sold while only realizing gains
 */
export function getMaxGainSellAmount(
  currentValue: number,
  costBasis: number
): number {
  if (costBasis <= 0 || currentValue <= costBasis) return 0;
  
  // Only the gain portion can be sold without realizing a loss
  return currentValue - costBasis;
}

export function getRebalanceRecommendation(
  currentAllocation: BucketAllocation,
  annualWithdrawal: number,
  customBuckets?: BucketConfig[],
  costBasis?: BucketCostBasis,
  avoidLossRealization = true
): RebalanceRecommendation {
  const { bucket1, bucket2, bucket3 } = currentAllocation;
  const buckets = customBuckets || DEFAULT_BUCKET_CONFIGS;
  
  // Calculate target allocation based on weights
  const totalValue = bucket1 + bucket2 + bucket3;
  const totalWeight = buckets.reduce((sum, b) => sum + b.weight, 0);
  
  const targetBucket1 = totalValue * (buckets[0].weight / totalWeight);
  const targetBucket2 = totalValue * (buckets[1].weight / totalWeight);
  
  // Calculate how many years of withdrawal each bucket covers
  const bucket1Years = bucket1 / annualWithdrawal;
  
  // Helper function to check and potentially reduce transfer amount to avoid loss
  const getAdjustedTransferAmount = (
    fromBucketNum: number,
    requestedAmount: number,
    fromValue: number
  ): { amount: number; avoidedLoss: boolean } => {
    if (!avoidLossRealization || !costBasis) {
      return { amount: requestedAmount, avoidedLoss: false };
    }
    
    const fromCostBasis = costBasis[`bucket${fromBucketNum}` as keyof BucketCostBasis];
    
    if (wouldRealizeLoss(fromValue, fromCostBasis, requestedAmount)) {
      // Check if there's any gain we can realize
      const maxGain = getMaxGainSellAmount(fromValue, fromCostBasis);
      if (maxGain > annualWithdrawal * 0.5) {
        // Only proceed if we can transfer at least half a year's worth
        return { amount: Math.round(maxGain), avoidedLoss: true };
      }
      // Skip this transfer entirely to avoid loss
      return { amount: 0, avoidedLoss: true };
    }
    
    return { amount: requestedAmount, avoidedLoss: false };
  };
  
  if (bucket1Years < 1.5) {
    // Urgent: Refill bucket 1
    if (bucket3 > annualWithdrawal) {
      const requestedAmount = Math.round(annualWithdrawal * 1.5);
      const { amount, avoidedLoss } = getAdjustedTransferAmount(3, requestedAmount, bucket3);
      
      if (amount > 0) {
        return {
          action: "refill_bucket1",
          fromBucket: 3,
          toBucket: 1,
          amount,
          description: avoidedLoss 
            ? `Topf 1 kritisch niedrig. Teilweise Umschichtung von Topf 3 (${buckets[2].name}) - nur Gewinne, um Verluste zu vermeiden.`
            : `Topf 1 (${buckets[0].name}) kritisch niedrig. Umschichtung von Topf 3 (${buckets[2].name}) empfohlen.`,
          urgency: "high",
          avoidedLoss
        };
      }
      // Try bucket 2 instead
    }
    
    if (bucket2 > annualWithdrawal) {
      const requestedAmount = Math.round(annualWithdrawal * 1.5);
      const { amount, avoidedLoss } = getAdjustedTransferAmount(2, requestedAmount, bucket2);
      
      if (amount > 0) {
        return {
          action: "refill_bucket1",
          fromBucket: 2,
          toBucket: 1,
          amount,
          description: avoidedLoss
            ? `Topf 1 kritisch niedrig. Teilweise Umschichtung von Topf 2 (${buckets[1].name}) - nur Gewinne.`
            : `Topf 1 (${buckets[0].name}) kritisch niedrig. Umschichtung von Topf 2 (${buckets[1].name}) empfohlen.`,
          urgency: "high",
          avoidedLoss
        };
      }
    }
    
    return {
      action: "reduce_withdrawal",
      description: "Kapital kritisch niedrig. Alle Töpfe im Verlust - Reduzierung der Entnahme empfohlen statt Verluste zu realisieren.",
      urgency: "high",
      avoidedLoss: true
    };
  }
  
  if (bucket1Years < 2.5 && bucket3 > annualWithdrawal * 2) {
    const requestedAmount = Math.round(annualWithdrawal);
    const { amount, avoidedLoss } = getAdjustedTransferAmount(3, requestedAmount, bucket3);
    
    if (amount > 0) {
      return {
        action: "refill_bucket1",
        fromBucket: 3,
        toBucket: 1,
        amount,
        description: avoidedLoss
          ? `Topf 1 sollte aufgefüllt werden. Nur Gewinne aus Topf 3 (${buckets[2].name}) werden umgeschichtet.`
          : `Topf 1 sollte aufgefüllt werden. Gute Marktbedingungen nutzen.`,
        urgency: "medium",
        avoidedLoss
      };
    }
    
    // Can't transfer without loss, skip this recommendation
    if (avoidedLoss) {
      return {
        action: "none",
        description: `Topf 1 niedrig, aber Umschichtung würde Verluste realisieren. Abwarten empfohlen.`,
        urgency: "low",
        avoidedLoss: true
      };
    }
  }
  
  const bucket2Years = bucket2 / annualWithdrawal;
  if (bucket2Years < 3 && bucket3 > annualWithdrawal * 3) {
    const requestedAmount = Math.round(annualWithdrawal * 2);
    const { amount, avoidedLoss } = getAdjustedTransferAmount(3, requestedAmount, bucket3);
    
    if (amount > 0) {
      return {
        action: "refill_bucket2",
        fromBucket: 3,
        toBucket: 2,
        amount,
        description: avoidedLoss
          ? `Topf 2 sollte aufgefüllt werden. Nur Gewinne aus Topf 3 (${buckets[2].name}) werden gesichert.`
          : `Topf 2 sollte aufgefüllt werden. Gewinne aus ${buckets[2].name} sichern.`,
        urgency: "low",
        avoidedLoss
      };
    }
  }
  
  return {
    action: "none",
    description: "Alle Töpfe sind gut gefüllt. Keine Umschichtung notwendig.",
    urgency: "low"
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}

/**
 * Two-Phase Withdrawal Configuration
 * Phase 1: Higher withdrawal (e.g., for travel, activities)
 * Phase 2: Lower withdrawal (e.g., less active lifestyle)
 */
export interface TwoPhaseWithdrawal {
  enabled: boolean;
  phase1Withdrawal: number;  // Initial higher withdrawal
  transitionAge: number;     // Age at which to switch to phase 2
  phase2Withdrawal: number;  // Later lower withdrawal
}

/**
 * Calculation Modes for reverse engineering
 */
export type CalculationMode = 
  | 'standard'           // User provides capital and withdrawal
  | 'optimal_withdrawal' // Calculate optimal withdrawal for given capital
  | 'required_capital';  // Calculate required capital for desired withdrawal

export interface ReverseCalculationResult {
  mode: CalculationMode;
  optimalWithdrawal?: number;
  requiredCapital?: number;
  successRate: number;
  withdrawalRate: number;
}

/**
 * Calculate optimal withdrawal for a given success rate target
 * Uses binary search to find the maximum sustainable withdrawal
 */
export function calculateOptimalWithdrawal(
  capital: number,
  age: number,
  lifeExpectancy: number,
  targetSuccessRate = 95,
  twoPhase?: TwoPhaseWithdrawal
): { withdrawal: number; successRate: number; withdrawalRate: number } {
  const years = lifeExpectancy - age;
  
  // Start with conservative 3% and aggressive 8% as bounds
  let low = capital * 0.02;
  let high = capital * 0.10;
  let bestWithdrawal = low;
  let bestSuccessRate = 100;
  
  // Binary search for optimal withdrawal
  for (let i = 0; i < 15; i++) {
    const mid = (low + high) / 2;
    
    // Simulate to get success rate (simplified estimate)
    // Real simulation is done in monte-carlo.ts
    const estimatedSuccessRate = estimateSuccessRate(capital, mid, years);
    
    if (estimatedSuccessRate >= targetSuccessRate) {
      bestWithdrawal = mid;
      bestSuccessRate = estimatedSuccessRate;
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return {
    withdrawal: Math.round(bestWithdrawal / 100) * 100, // Round to nearest 100
    successRate: bestSuccessRate,
    withdrawalRate: (bestWithdrawal / capital) * 100
  };
}

/**
 * Calculate required capital for a desired withdrawal
 */
export function calculateRequiredCapital(
  desiredWithdrawal: number,
  age: number,
  lifeExpectancy: number,
  targetSuccessRate = 95,
  twoPhase?: TwoPhaseWithdrawal
): { capital: number; successRate: number; withdrawalRate: number } {
  const years = lifeExpectancy - age;
  
  // Start with simple 25x rule (4% withdrawal rate) and adjust
  let low = desiredWithdrawal * 15;  // ~6.7% withdrawal rate
  let high = desiredWithdrawal * 40; // 2.5% withdrawal rate
  let bestCapital = high;
  let bestSuccessRate = 100;
  
  // Binary search for minimum capital needed
  for (let i = 0; i < 15; i++) {
    const mid = (low + high) / 2;
    
    const estimatedSuccessRate = estimateSuccessRate(mid, desiredWithdrawal, years);
    
    if (estimatedSuccessRate >= targetSuccessRate) {
      bestCapital = mid;
      bestSuccessRate = estimatedSuccessRate;
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return {
    capital: Math.round(bestCapital / 1000) * 1000, // Round to nearest 1000
    successRate: bestSuccessRate,
    withdrawalRate: (desiredWithdrawal / bestCapital) * 100
  };
}

/**
 * Simple success rate estimation based on historical data
 * Uses the 4% rule as baseline with adjustments
 */
function estimateSuccessRate(capital: number, withdrawal: number, years: number): number {
  const withdrawalRate = (withdrawal / capital) * 100;
  
  // Based on Trinity Study and subsequent research
  // 4% rule has ~95% success for 30 years
  // Adjust for different rates and time horizons
  
  const baseRate = 4.0;
  const baseYears = 30;
  const baseSuccess = 95;
  
  // Penalty for higher withdrawal rates
  const ratePenalty = Math.max(0, (withdrawalRate - baseRate) * 12);
  
  // Penalty for longer time horizons
  const yearsPenalty = Math.max(0, (years - baseYears) * 0.5);
  
  // Bonus for lower withdrawal rates
  const rateBonus = Math.max(0, (baseRate - withdrawalRate) * 5);
  
  // Bonus for shorter time horizons
  const yearsBonus = Math.max(0, (baseYears - years) * 0.3);
  
  const successRate = baseSuccess - ratePenalty - yearsPenalty + rateBonus + yearsBonus;
  
  return Math.min(99.9, Math.max(5, successRate));
}