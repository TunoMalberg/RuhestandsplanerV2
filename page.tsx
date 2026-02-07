"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InputForm } from "@/components/InputForm";
import { BucketChart } from "@/components/BucketChart";
import { BucketDetails } from "@/components/BucketDetails";
import { SimulationTimeline } from "@/components/SimulationTimeline";
import { YearlyResultsTable } from "@/components/YearlyResultsTable";
import { MonteCarloSummaryCard } from "@/components/MonteCarloSummary";
import { StrategyExplanation } from "@/components/StrategyExplanation";
import { OptimalResult } from "@/components/OptimalResult";
import { ExportActions } from "@/components/ExportActions";
import { UserMenu } from "@/components/UserMenu";
import { useUser } from "@/components/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  calculateInitialAllocation, 
  type BucketAllocation,
  type BucketConfig,
  type RetirementInput,
  type TwoPhaseWithdrawal,
  type CalculationMode
} from "@/lib/retirement-calculator";
import { 
  runMonteCarloSimulation, 
  type SimulationResult,
  type MonteCarloSummary,
  type SimulationOptions
} from "@/lib/monte-carlo";

interface ExtendedInputData extends RetirementInput {
  customBuckets: BucketConfig[];
  inflationEnabled: boolean;
  inflationRate: number;
  avoidLossRealization: boolean;
  twoPhaseWithdrawal?: TwoPhaseWithdrawal;
  calculationMode: CalculationMode;
  targetSuccessRate?: number;
}

export default function Home() {
  const [allocation, setAllocation] = useState<BucketAllocation | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [summary, setSummary] = useState<MonteCarloSummary | null>(null);
  const [inputData, setInputData] = useState<ExtendedInputData | null>(null);
  const [customBuckets, setCustomBuckets] = useState<BucketConfig[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = useCallback((data: {
    capital: number;
    age: number;
    withdrawal: number;
    lifeExpectancy: number;
    customBuckets: BucketConfig[];
    inflationEnabled: boolean;
    inflationRate: number;
    avoidLossRealization: boolean;
    twoPhaseWithdrawal?: TwoPhaseWithdrawal;
    calculationMode: CalculationMode;
    targetSuccessRate?: number;
  }) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const input: ExtendedInputData = {
        totalCapital: data.capital,
        age: data.age,
        annualWithdrawal: data.withdrawal,
        lifeExpectancy: data.lifeExpectancy,
        customBuckets: data.customBuckets,
        inflationEnabled: data.inflationEnabled,
        inflationRate: data.inflationRate,
        avoidLossRealization: data.avoidLossRealization,
        twoPhaseWithdrawal: data.twoPhaseWithdrawal,
        calculationMode: data.calculationMode,
        targetSuccessRate: data.targetSuccessRate,
      };
      
      setInputData(input);
      setCustomBuckets(data.customBuckets);
      
      const initialAllocation = calculateInitialAllocation(input, data.customBuckets);
      setAllocation(initialAllocation);
      
      const years = data.lifeExpectancy - data.age;
      const simulationOptions: SimulationOptions = {
        customBuckets: data.customBuckets,
        inflationEnabled: data.inflationEnabled,
        inflationRate: data.inflationRate,
        avoidLossRealization: data.avoidLossRealization,
        twoPhaseWithdrawal: data.twoPhaseWithdrawal,
      };
      
      const { summary: mcSummary, sampleSimulation } = runMonteCarloSimulation(
        initialAllocation,
        data.withdrawal,
        data.age,
        years,
        1000,
        simulationOptions
      );
      
      setSummary(mcSummary);
      setSimulation(sampleSimulation);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div data-design-id="page-container" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div data-design-id="background-effects" className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <header data-design-id="header" className="relative z-10 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div data-design-id="header-content" className="flex items-center justify-between">
            <div data-design-id="logo-section" className="flex items-center gap-4">
              <div data-design-id="logo-icon" className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-900/30">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 data-design-id="site-title" className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Ruhestandsplaner Pro
                </h1>
                <p data-design-id="site-subtitle" className="text-sm text-slate-400">
                  Individuelle 3-Töpfe-Strategie mit Monte Carlo Simulation
                </p>
              </div>
            </div>
            <div data-design-id="header-right" className="flex items-center gap-4">
              <div data-design-id="header-badges" className="hidden lg:flex items-center gap-3">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Wissenschaftlich fundiert
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  1.000 Simulationen
                </span>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main data-design-id="main-content" className="relative z-10 container mx-auto px-4 py-8">
        <div data-design-id="main-grid" className="grid lg:grid-cols-3 gap-6">
          <div data-design-id="sidebar" className="lg:col-span-1 space-y-6">
            <InputForm onCalculate={handleCalculate} isLoading={isLoading} />
            
            <AnimatePresence mode="wait">
              {allocation && inputData && customBuckets && (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  data-design-id="chart-section"
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm"
                >
                  <h3 data-design-id="chart-title" className="text-lg font-semibold text-slate-100 mb-4 text-center">
                    Vermögensaufteilung
                  </h3>
                  <BucketChart allocation={allocation} customBuckets={customBuckets} />
                  
                  {inputData.inflationEnabled && (
                    <div data-design-id="inflation-indicator" className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>Inflation: {(inputData.inflationRate * 100).toFixed(1)}% p.a.</span>
                      </div>
                    </div>
                  )}
                  
                  {inputData.avoidLossRealization && (
                    <div data-design-id="loss-protection-indicator" className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Verlustvermeidung aktiv</span>
                      </div>
                    </div>
                  )}
                  
                  {inputData.twoPhaseWithdrawal?.enabled && (
                    <div data-design-id="two-phase-indicator" className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2 text-orange-400 text-sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Zwei-Phasen: ab {inputData.twoPhaseWithdrawal.transitionAge} Jahre reduziert</span>
                      </div>
                    </div>
                  )}
                  
                  {inputData.calculationMode !== 'standard' && (
                    <div data-design-id="calc-mode-indicator" className="mt-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <div className="flex items-center gap-2 text-indigo-400 text-sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {inputData.calculationMode === 'optimal_withdrawal' 
                            ? 'Optimale Rente berechnet' 
                            : 'Benötigtes Kapital berechnet'}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div data-design-id="content-area" className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {!allocation ? (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <StrategyExplanation />
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {inputData && inputData.calculationMode !== 'standard' && (
                    <OptimalResult
                      calculationMode={inputData.calculationMode}
                      capital={inputData.totalCapital}
                      withdrawal={inputData.annualWithdrawal}
                      targetSuccessRate={inputData.targetSuccessRate}
                      actualSuccessRate={summary?.successRate}
                    />
                  )}

                  {summary && (
                    <MonteCarloSummaryCard summary={summary} />
                  )}

                  {simulation && summary && inputData && customBuckets && allocation && (
                    <ExportActions
                      simulation={simulation}
                      summary={summary}
                      allocation={allocation}
                      inputData={inputData}
                      customBuckets={customBuckets}
                    />
                  )}

                  {inputData && customBuckets && (
                    <BucketDetails 
                      allocation={allocation} 
                      annualWithdrawal={inputData.annualWithdrawal}
                      customBuckets={customBuckets}
                    />
                  )}

                  {simulation && customBuckets && (
                    <Tabs defaultValue="chart" data-design-id="results-tabs" className="w-full">
                      <TabsList data-design-id="results-tabs-list" className="grid w-full grid-cols-3 bg-slate-800/50 p-1 rounded-xl">
                        <TabsTrigger 
                          value="chart" 
                          data-design-id="chart-tab-trigger"
                          className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-lg"
                        >
                          Vermögensverlauf
                        </TabsTrigger>
                        <TabsTrigger 
                          value="table" 
                          data-design-id="table-tab-trigger"
                          className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-lg"
                        >
                          Jahresdetails
                        </TabsTrigger>
                        <TabsTrigger 
                          value="info" 
                          data-design-id="info-tab-trigger"
                          className="data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-lg"
                        >
                          Wissenschaft
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="chart" data-design-id="chart-tab-content" className="mt-4">
                        <div data-design-id="timeline-card" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
                          <h3 data-design-id="timeline-title" className="text-lg font-semibold text-slate-100 mb-4">
                            Beispiel-Simulation: Vermögensentwicklung über Zeit
                          </h3>
                          <p data-design-id="timeline-description" className="text-sm text-slate-400 mb-6">
                            Diese Grafik zeigt eine einzelne Monte Carlo Simulation mit zufälligen Renditen. 
                            {inputData?.inflationEnabled ? " Die Entnahmen werden jährlich um die Inflationsrate erhöht." : " Die Entnahmen bleiben konstant (ohne Inflationsanpassung)."}
                            {inputData?.avoidLossRealization && " Umschichtungen vermeiden Verluste."}
                          </p>
                          <SimulationTimeline simulation={simulation} customBuckets={customBuckets} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="table" data-design-id="table-tab-content" className="mt-4">
                        <div data-design-id="table-card" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
                          <h3 data-design-id="table-title" className="text-lg font-semibold text-slate-100 mb-4">
                            Jahresergebnisse mit Umschichtungsempfehlungen
                          </h3>
                          <p data-design-id="table-description" className="text-sm text-slate-400 mb-6">
                            Detaillierte Übersicht der Jahresergebnisse mit Renditen für jeden Topf 
                            und automatischen Umschichtungsempfehlungen.
                            {inputData?.avoidLossRealization && (
                              <span className="text-emerald-400"> Umschichtungen, die Verluste realisieren würden, werden vermieden oder reduziert.</span>
                            )}
                          </p>
                          <YearlyResultsTable years={simulation.years} customBuckets={customBuckets} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="info" data-design-id="info-tab-content" className="mt-4">
                        <StrategyExplanation />
                      </TabsContent>
                    </Tabs>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer data-design-id="footer" className="relative z-10 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-xl mt-12">
        <div className="container mx-auto px-4 py-6">
          <div data-design-id="footer-content" className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p data-design-id="footer-disclaimer">
              <strong className="text-slate-400">Hinweis:</strong> Diese Berechnung dient nur zu Informationszwecken 
              und stellt keine Finanzberatung dar.
            </p>
            <p data-design-id="footer-credits">
              Basierend auf der Trinity-Studie und Harold Evenskys Bucket-Strategie
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}