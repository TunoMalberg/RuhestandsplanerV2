/**
 * Monte Carlo Simulation für Ruhestandsplanung
 * 
 * Diese Simulation verwendet eine geometrische Brownsche Bewegung
 * zur Modellierung der Renditen basierend auf historischen Daten.
 * 
 * Quellen für die Annahmen:
 * - Aktien: ~7% real nach Inflation (Dimson, Marsh, Staunton 2002)
 * - Anleihen: ~3-4% real (historischer Durchschnitt)
 * - Cash: ~1-2% real (Tagesgeld/Festgeld)
 */

import { 
  type BucketAllocation, 
  type BucketConfig,
  type BucketCostBasis,
  type TwoPhaseWithdrawal,
  DEFAULT_BUCKET_CONFIGS, 
  getRebalanceRecommendation, 
  type RebalanceRecommendation,
  wouldRealizeLoss,
  getMaxGainSellAmount
} from "./retirement-calculator";

export interface SimulationYear {
  year: number;
  age: number;
  buckets: BucketAllocation;
  totalValue: number;
  withdrawal: number;
  returns: {
    bucket1: number;
    bucket2: number;
    bucket3: number;
  };
  rebalanceAction: RebalanceRecommendation;
  inflationAdjustedWithdrawal: number;
  costBasis: BucketCostBasis;
}

export interface SimulationResult {
  years: SimulationYear[];
  successRate: number;
  finalValue: number;
  ranOutOfMoney: boolean;
  yearRanOut?: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

export interface MonteCarloSummary {
  simulations: number;
  successRate: number;
  medianFinalValue: number;
  worstCase: number;
  bestCase: number;
  averageYearsLasted: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

export interface SimulationOptions {
  customBuckets?: BucketConfig[];
  inflationEnabled?: boolean;
  inflationRate?: number;
  avoidLossRealization?: boolean;
  twoPhaseWithdrawal?: TwoPhaseWithdrawal;
}

function boxMullerTransform(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function generateReturn(expectedReturn: number, volatility: number): number {
  const z = boxMullerTransform();
  const annualReturn = expectedReturn + volatility * z;
  return annualReturn;
}

export function runSingleSimulation(
  initialAllocation: BucketAllocation,
  annualWithdrawal: number,
  startAge: number,
  years: number,
  options: SimulationOptions = {}
): SimulationResult {
  const {
    customBuckets = DEFAULT_BUCKET_CONFIGS,
    inflationEnabled = true,
    inflationRate = 0.02,
    avoidLossRealization = true,
    twoPhaseWithdrawal
  } = options;
  
  const simulationYears: SimulationYear[] = [];
  let currentBuckets = { ...initialAllocation };
  
  // Initialize withdrawal based on two-phase config
  let baseWithdrawal = twoPhaseWithdrawal?.enabled 
    ? twoPhaseWithdrawal.phase1Withdrawal 
    : annualWithdrawal;
  let currentWithdrawal = baseWithdrawal;
  let ranOutOfMoney = false;
  let yearRanOut: number | undefined;
  
  // Initialize cost basis tracking (for loss avoidance)
  let costBasis: BucketCostBasis = {
    bucket1: initialAllocation.bucket1,
    bucket2: initialAllocation.bucket2,
    bucket3: initialAllocation.bucket3
  };

  for (let i = 0; i < years; i++) {
    const year = i + 1;
    const age = startAge + year;
    
    // Check for two-phase withdrawal transition
    if (twoPhaseWithdrawal?.enabled && age === twoPhaseWithdrawal.transitionAge) {
      // Switch to phase 2 withdrawal (may need inflation adjustment if enabled)
      if (inflationEnabled && i > 0) {
        // Calculate what the phase 2 withdrawal would be with inflation from start
        const yearsElapsed = age - startAge - 1;
        baseWithdrawal = twoPhaseWithdrawal.phase2Withdrawal * Math.pow(1 + inflationRate, yearsElapsed);
        currentWithdrawal = baseWithdrawal;
      } else {
        baseWithdrawal = twoPhaseWithdrawal.phase2Withdrawal;
        currentWithdrawal = baseWithdrawal;
      }
    } else if (i > 0 && inflationEnabled) {
      // Apply inflation to withdrawal if enabled
      currentWithdrawal *= (1 + inflationRate);
    }
    
    // Generate returns based on custom bucket configurations
    const return1 = generateReturn(customBuckets[0].expectedReturn, customBuckets[0].volatility);
    const return2 = generateReturn(customBuckets[1].expectedReturn, customBuckets[1].volatility);
    const return3 = generateReturn(customBuckets[2].expectedReturn, customBuckets[2].volatility);
    
    // Apply returns (before withdrawal)
    const prevBucket1 = currentBuckets.bucket1;
    const prevBucket2 = currentBuckets.bucket2;
    const prevBucket3 = currentBuckets.bucket3;
    
    currentBuckets.bucket1 = Math.max(0, currentBuckets.bucket1 * (1 + return1));
    currentBuckets.bucket2 = Math.max(0, currentBuckets.bucket2 * (1 + return2));
    currentBuckets.bucket3 = Math.max(0, currentBuckets.bucket3 * (1 + return3));
    
    // Update cost basis - cost basis only increases when we add money
    // It stays the same when value changes due to returns
    // (We'll update when rebalancing transfers occur)
    
    // Withdrawal from Bucket 1 (prioritize)
    const totalBefore = currentBuckets.bucket1 + currentBuckets.bucket2 + currentBuckets.bucket3;
    
    if (currentBuckets.bucket1 >= currentWithdrawal) {
      currentBuckets.bucket1 -= currentWithdrawal;
      // Reduce cost basis proportionally for bucket 1
      if (prevBucket1 > 0) {
        costBasis.bucket1 = Math.max(0, costBasis.bucket1 * (currentBuckets.bucket1 / (prevBucket1 * (1 + return1))));
      }
    } else if (currentBuckets.bucket1 + currentBuckets.bucket2 >= currentWithdrawal) {
      const remaining = currentWithdrawal - currentBuckets.bucket1;
      costBasis.bucket1 = 0;
      currentBuckets.bucket1 = 0;
      
      // Reduce cost basis for bucket 2
      const newBucket2 = currentBuckets.bucket2 - remaining;
      if (currentBuckets.bucket2 > 0) {
        costBasis.bucket2 = costBasis.bucket2 * (newBucket2 / currentBuckets.bucket2);
      }
      currentBuckets.bucket2 = newBucket2;
    } else if (totalBefore >= currentWithdrawal) {
      const remaining = currentWithdrawal - currentBuckets.bucket1 - currentBuckets.bucket2;
      costBasis.bucket1 = 0;
      costBasis.bucket2 = 0;
      currentBuckets.bucket1 = 0;
      currentBuckets.bucket2 = 0;
      
      // Reduce cost basis for bucket 3
      const newBucket3 = currentBuckets.bucket3 - remaining;
      if (currentBuckets.bucket3 > 0) {
        costBasis.bucket3 = costBasis.bucket3 * (newBucket3 / currentBuckets.bucket3);
      }
      currentBuckets.bucket3 = newBucket3;
    } else {
      // Not enough money
      currentBuckets = { bucket1: 0, bucket2: 0, bucket3: 0 };
      costBasis = { bucket1: 0, bucket2: 0, bucket3: 0 };
      if (!ranOutOfMoney) {
        ranOutOfMoney = true;
        yearRanOut = year;
      }
    }
    
    // Get rebalancing recommendation (with loss avoidance)
    const rebalanceAction = getRebalanceRecommendation(
      currentBuckets, 
      currentWithdrawal, 
      customBuckets,
      avoidLossRealization ? costBasis : undefined,
      avoidLossRealization
    );
    
    // Execute rebalancing if recommended
    if (rebalanceAction.action !== "none" && rebalanceAction.amount && rebalanceAction.fromBucket && rebalanceAction.toBucket) {
      const fromKey = `bucket${rebalanceAction.fromBucket}` as keyof BucketAllocation;
      const toKey = `bucket${rebalanceAction.toBucket}` as keyof BucketAllocation;
      const fromCostKey = `bucket${rebalanceAction.fromBucket}` as keyof BucketCostBasis;
      const toCostKey = `bucket${rebalanceAction.toBucket}` as keyof BucketCostBasis;
      
      let transferAmount = Math.min(rebalanceAction.amount, currentBuckets[fromKey]);
      
      // If avoiding loss realization, check if we would realize a loss
      if (avoidLossRealization) {
        if (wouldRealizeLoss(currentBuckets[fromKey], costBasis[fromCostKey], transferAmount)) {
          // Only transfer gains, not principal
          const maxGain = getMaxGainSellAmount(currentBuckets[fromKey], costBasis[fromCostKey]);
          transferAmount = Math.min(transferAmount, maxGain);
        }
      }
      
      if (transferAmount > 0) {
        // Update cost basis for the transfer
        // When we sell from one bucket and add to another:
        // - The "from" bucket's cost basis reduces proportionally
        // - The "to" bucket's cost basis increases by the transfer amount (at current value)
        const fromValueBefore = currentBuckets[fromKey];
        const fromCostBefore = costBasis[fromCostKey];
        
        currentBuckets[fromKey] -= transferAmount;
        currentBuckets[toKey] += transferAmount;
        
        // Update cost basis for source bucket (proportional reduction)
        if (fromValueBefore > 0) {
          costBasis[fromCostKey] = fromCostBefore * (currentBuckets[fromKey] / fromValueBefore);
        }
        
        // Update cost basis for target bucket (add at current value)
        costBasis[toCostKey] += transferAmount;
      }
    }
    
    const totalValue = currentBuckets.bucket1 + currentBuckets.bucket2 + currentBuckets.bucket3;
    
    simulationYears.push({
      year,
      age,
      buckets: { ...currentBuckets },
      totalValue: Math.round(totalValue),
      withdrawal: Math.round(currentWithdrawal),
      returns: {
        bucket1: return1,
        bucket2: return2,
        bucket3: return3
      },
      rebalanceAction,
      inflationAdjustedWithdrawal: Math.round(currentWithdrawal),
      costBasis: { ...costBasis }
    });
  }

  const finalValue = simulationYears[simulationYears.length - 1]?.totalValue ?? 0;
  
  return {
    years: simulationYears,
    successRate: ranOutOfMoney ? 0 : 100,
    finalValue,
    ranOutOfMoney,
    yearRanOut,
    percentiles: {
      p10: finalValue,
      p25: finalValue,
      p50: finalValue,
      p75: finalValue,
      p90: finalValue
    }
  };
}

export function runMonteCarloSimulation(
  initialAllocation: BucketAllocation,
  annualWithdrawal: number,
  startAge: number,
  years: number,
  numSimulations = 1000,
  options: SimulationOptions = {}
): { summary: MonteCarloSummary; sampleSimulation: SimulationResult } {
  const finalValues: number[] = [];
  const yearsLasted: number[] = [];
  let successCount = 0;
  let sampleSimulation: SimulationResult | null = null;

  for (let i = 0; i < numSimulations; i++) {
    const result = runSingleSimulation(initialAllocation, annualWithdrawal, startAge, years, options);
    
    if (i === 0) {
      sampleSimulation = result;
    }
    
    finalValues.push(result.finalValue);
    
    if (result.ranOutOfMoney && result.yearRanOut) {
      yearsLasted.push(result.yearRanOut);
    } else {
      yearsLasted.push(years);
      successCount++;
    }
  }

  // Sort for percentiles
  finalValues.sort((a, b) => a - b);
  yearsLasted.sort((a, b) => a - b);

  const getPercentile = (arr: number[], p: number): number => {
    const index = Math.ceil(arr.length * (p / 100)) - 1;
    return arr[Math.max(0, index)];
  };

  const summary: MonteCarloSummary = {
    simulations: numSimulations,
    successRate: (successCount / numSimulations) * 100,
    medianFinalValue: getPercentile(finalValues, 50),
    worstCase: finalValues[0],
    bestCase: finalValues[finalValues.length - 1],
    averageYearsLasted: yearsLasted.reduce((a, b) => a + b, 0) / yearsLasted.length,
    percentiles: {
      p10: getPercentile(finalValues, 10),
      p25: getPercentile(finalValues, 25),
      p50: getPercentile(finalValues, 50),
      p75: getPercentile(finalValues, 75),
      p90: getPercentile(finalValues, 90)
    }
  };

  return {
    summary,
    sampleSimulation: sampleSimulation!
  };
}

export function generateMultipleScenarios(
  initialAllocation: BucketAllocation,
  annualWithdrawal: number,
  startAge: number,
  years: number,
  count = 5,
  options: SimulationOptions = {}
): SimulationResult[] {
  const scenarios: SimulationResult[] = [];
  
  for (let i = 0; i < count; i++) {
    scenarios.push(runSingleSimulation(initialAllocation, annualWithdrawal, startAge, years, options));
  }
  
  return scenarios;
}