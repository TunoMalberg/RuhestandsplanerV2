"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  formatCurrency, 
  type BucketConfig, 
  DEFAULT_BUCKET_CONFIGS,
  type TwoPhaseWithdrawal,
  type CalculationMode,
  calculateOptimalWithdrawal,
  calculateRequiredCapital
} from "@/lib/retirement-calculator";
import { motion } from "framer-motion";
import { useUser } from "./UserContext";
import type { UserData } from "@/lib/user-storage";

// Helper function to parse numbers with German locale (comma as decimal separator)
const parseLocaleNumber = (value: string): number => {
  // Replace comma with dot for decimal parsing
  const normalized = value.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

interface InputFormProps {
  onCalculate: (data: {
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
  }) => void;
  isLoading?: boolean;
}

export function InputForm({ onCalculate, isLoading }: InputFormProps) {
  const { user, saveSettings } = useUser();
  
  const [capital, setCapital] = useState(500000);
  const [age, setAge] = useState(65);
  const [withdrawal, setWithdrawal] = useState(24000);
  const [lifeExpectancy, setLifeExpectancy] = useState(95);
  
  const [bucket1Name, setBucket1Name] = useState("Liquidität");
  const [bucket1Weight, setBucket1Weight] = useState(15);
  const [bucket1Return, setBucket1Return] = useState(2);
  
  const [bucket2Name, setBucket2Name] = useState("Anleihen");
  const [bucket2Weight, setBucket2Weight] = useState(35);
  const [bucket2Return, setBucket2Return] = useState(4);
  
  const [bucket3Name, setBucket3Name] = useState("Aktien");
  const [bucket3Weight, setBucket3Weight] = useState(50);
  const [bucket3Return, setBucket3Return] = useState(7);
  
  const [inflationEnabled, setInflationEnabled] = useState(true);
  const [inflationRate, setInflationRate] = useState(2);
  const [avoidLossRealization, setAvoidLossRealization] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Two-phase withdrawal settings
  const [twoPhaseEnabled, setTwoPhaseEnabled] = useState(false);
  const [transitionAge, setTransitionAge] = useState(75);
  const [phase2Withdrawal, setPhase2Withdrawal] = useState(18000);
  
  // Calculation mode
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('standard');
  const [targetSuccessRate, setTargetSuccessRate] = useState(95);
  const [desiredWithdrawal, setDesiredWithdrawal] = useState(24000);

  useEffect(() => {
    if (user && !initialized) {
      const s = user.settings;
      setCapital(s.capital);
      setAge(s.age);
      setWithdrawal(s.withdrawal);
      setLifeExpectancy(s.lifeExpectancy);
      setBucket1Name(s.bucket1Name);
      setBucket1Weight(s.bucket1Weight);
      setBucket1Return(s.bucket1Return);
      setBucket2Name(s.bucket2Name);
      setBucket2Weight(s.bucket2Weight);
      setBucket2Return(s.bucket2Return);
      setBucket3Name(s.bucket3Name);
      setBucket3Weight(s.bucket3Weight);
      setBucket3Return(s.bucket3Return);
      setInflationEnabled(s.inflationEnabled);
      setInflationRate(s.inflationRate);
      setAvoidLossRealization(s.avoidLossRealization);
      setInitialized(true);
    }
  }, [user, initialized]);

  const autoSave = useCallback(() => {
    if (user) {
      saveSettings({
        capital, age, withdrawal, lifeExpectancy,
        bucket1Name, bucket1Weight, bucket1Return,
        bucket2Name, bucket2Weight, bucket2Return,
        bucket3Name, bucket3Weight, bucket3Return,
        inflationEnabled, inflationRate, avoidLossRealization,
      });
    }
  }, [user, saveSettings, capital, age, withdrawal, lifeExpectancy, bucket1Name, bucket1Weight, bucket1Return, bucket2Name, bucket2Weight, bucket2Return, bucket3Name, bucket3Weight, bucket3Return, inflationEnabled, inflationRate, avoidLossRealization]);

  useEffect(() => {
    if (initialized && user) {
      const timeout = setTimeout(autoSave, 500);
      return () => clearTimeout(timeout);
    }
  }, [initialized, user, autoSave]);

  const withdrawalRate = (withdrawal / capital) * 100;
  const yearsOfCoverage = Math.floor(capital / withdrawal);
  
  // Normalize weights
  const totalWeight = bucket1Weight + bucket2Weight + bucket3Weight;
  const normalizedWeights = {
    bucket1: (bucket1Weight / totalWeight) * 100,
    bucket2: (bucket2Weight / totalWeight) * 100,
    bucket3: (bucket3Weight / totalWeight) * 100,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customBuckets: BucketConfig[] = [
      {
        name: bucket1Name,
        weight: bucket1Weight,
        expectedReturn: bucket1Return / 100,
        volatility: 0.005 + (bucket1Return / 100) * 0.1, // Higher return = higher volatility
        color: "#22c55e",
      },
      {
        name: bucket2Name,
        weight: bucket2Weight,
        expectedReturn: bucket2Return / 100,
        volatility: 0.03 + (bucket2Return / 100) * 0.5,
        color: "#3b82f6",
      },
      {
        name: bucket3Name,
        weight: bucket3Weight,
        expectedReturn: bucket3Return / 100,
        volatility: 0.08 + (bucket3Return / 100) * 1.5,
        color: "#8b5cf6",
      }
    ];
    
    // Handle different calculation modes
    let finalCapital = capital;
    let finalWithdrawal = withdrawal;
    
    if (calculationMode === 'optimal_withdrawal') {
      const result = calculateOptimalWithdrawal(capital, age, lifeExpectancy, targetSuccessRate);
      finalWithdrawal = result.withdrawal;
    } else if (calculationMode === 'required_capital') {
      const result = calculateRequiredCapital(desiredWithdrawal, age, lifeExpectancy, targetSuccessRate);
      finalCapital = result.capital;
      finalWithdrawal = desiredWithdrawal;
    }
    
    const twoPhaseConfig: TwoPhaseWithdrawal | undefined = twoPhaseEnabled ? {
      enabled: true,
      phase1Withdrawal: finalWithdrawal,
      transitionAge,
      phase2Withdrawal
    } : undefined;
    
    onCalculate({ 
      capital: finalCapital, 
      age, 
      withdrawal: finalWithdrawal, 
      lifeExpectancy,
      customBuckets,
      inflationEnabled,
      inflationRate: inflationRate / 100,
      avoidLossRealization,
      twoPhaseWithdrawal: twoPhaseConfig,
      calculationMode,
      targetSuccessRate: calculationMode !== 'standard' ? targetSuccessRate : undefined
    });
  };

  const getWithdrawalRateColor = () => {
    if (withdrawalRate <= 3.5) return "text-emerald-400";
    if (withdrawalRate <= 4.5) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <Card data-design-id="input-form-card" className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader data-design-id="input-form-header">
        <CardTitle data-design-id="input-form-title" className="flex items-center gap-3 text-slate-100">
          <span data-design-id="input-form-icon" className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </span>
          Ihre Ruhestandsdaten
        </CardTitle>
        <CardDescription data-design-id="input-form-description" className="text-slate-400">
          Geben Sie Ihre finanziellen Daten ein und konfigurieren Sie die 3-Töpfe-Strategie
        </CardDescription>
      </CardHeader>
      <CardContent data-design-id="input-form-content">
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            data-design-id="capital-input-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center">
              <Label htmlFor="capital" className="text-slate-300">Gesamtkapital</Label>
              <span className="text-lg font-semibold text-emerald-400">{formatCurrency(capital)}</span>
            </div>
            <Slider
              id="capital"
              data-design-id="capital-slider"
              min={50000}
              max={5000000}
              step={10000}
              value={[capital]}
              onValueChange={(v) => setCapital(v[0])}
              className="py-2"
            />
            <Input
              type="number"
              data-design-id="capital-input"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="bg-slate-800/50 border-slate-600 text-slate-200"
              min={10000}
            />
          </motion.div>

          <motion.div
            data-design-id="age-input-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center">
              <Label htmlFor="age" className="text-slate-300">Aktuelles Alter</Label>
              <span className="text-lg font-semibold text-blue-400">{age} Jahre</span>
            </div>
            <Slider
              id="age"
              data-design-id="age-slider"
              min={20}
              max={85}
              step={1}
              value={[age]}
              onValueChange={(v) => setAge(v[0])}
              className="py-2"
            />
          </motion.div>

          <motion.div
            data-design-id="life-expectancy-input-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center">
              <Label htmlFor="lifeExpectancy" className="text-slate-300">Geplante Lebenserwartung</Label>
              <span className="text-lg font-semibold text-purple-400">{lifeExpectancy} Jahre</span>
            </div>
            <Slider
              id="lifeExpectancy"
              data-design-id="life-expectancy-slider"
              min={age + 5}
              max={105}
              step={1}
              value={[lifeExpectancy]}
              onValueChange={(v) => setLifeExpectancy(v[0])}
              className="py-2"
            />
          </motion.div>

          <motion.div
            data-design-id="withdrawal-input-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center">
              <Label htmlFor="withdrawal" className="text-slate-300">Jährliche Entnahme</Label>
              <span className="text-lg font-semibold text-amber-400">{formatCurrency(withdrawal)}</span>
            </div>
            <Slider
              id="withdrawal"
              data-design-id="withdrawal-slider"
              min={6000}
              max={Math.min(200000, capital / 5)}
              step={1000}
              value={[withdrawal]}
              onValueChange={(v) => setWithdrawal(v[0])}
              className="py-2"
            />
            <Input
              type="number"
              data-design-id="withdrawal-input"
              value={withdrawal}
              onChange={(e) => setWithdrawal(Number(e.target.value))}
              className="bg-slate-800/50 border-slate-600 text-slate-200"
              min={1000}
            />
          </motion.div>

          <motion.div
            data-design-id="summary-stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30"
          >
            <div data-design-id="withdrawal-rate-stat" className="text-center">
              <p className="text-xs text-slate-400">Entnahmequote</p>
              <p className={`text-2xl font-bold ${getWithdrawalRateColor()}`}>
                {withdrawalRate.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {withdrawalRate <= 4 ? "Sicher (4%-Regel)" : "Erhöhtes Risiko"}
              </p>
            </div>
            <div data-design-id="coverage-stat" className="text-center">
              <p className="text-xs text-slate-400">Reichweite (ohne Rendite)</p>
              <p className="text-2xl font-bold text-blue-400">
                ~{yearsOfCoverage} Jahre
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Bis Alter {age + yearsOfCoverage}
              </p>
            </div>
          </motion.div>

          {/* Calculation Mode Selector */}
          <motion.div
            data-design-id="calculation-mode-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 space-y-4"
          >
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Berechnungsmodus
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                data-design-id="mode-standard"
                onClick={() => setCalculationMode('standard')}
                className={`p-3 rounded-lg text-left transition-all ${
                  calculationMode === 'standard' 
                    ? 'bg-indigo-600/40 border-2 border-indigo-400' 
                    : 'bg-slate-800/50 border border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className="text-sm font-medium text-slate-200">Standard-Berechnung</span>
                <p className="text-xs text-slate-400 mt-1">Sie geben Kapital und Entnahme vor</p>
              </button>
              
              <button
                type="button"
                data-design-id="mode-optimal-withdrawal"
                onClick={() => setCalculationMode('optimal_withdrawal')}
                className={`p-3 rounded-lg text-left transition-all ${
                  calculationMode === 'optimal_withdrawal' 
                    ? 'bg-emerald-600/40 border-2 border-emerald-400' 
                    : 'bg-slate-800/50 border border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className="text-sm font-medium text-slate-200">Optimale Rente berechnen</span>
                <p className="text-xs text-slate-400 mt-1">Wie viel kann ich bei meinem Kapital entnehmen?</p>
              </button>
              
              <button
                type="button"
                data-design-id="mode-required-capital"
                onClick={() => setCalculationMode('required_capital')}
                className={`p-3 rounded-lg text-left transition-all ${
                  calculationMode === 'required_capital' 
                    ? 'bg-amber-600/40 border-2 border-amber-400' 
                    : 'bg-slate-800/50 border border-slate-600 hover:border-slate-500'
                }`}
              >
                <span className="text-sm font-medium text-slate-200">Benötigtes Kapital berechnen</span>
                <p className="text-xs text-slate-400 mt-1">Wie viel Kapital brauche ich für meine Wunschrente?</p>
              </button>
            </div>
            
            {calculationMode !== 'standard' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-3 border-t border-slate-700/50"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-slate-400">Ziel-Erfolgsquote</Label>
                  <span className="text-sm font-medium text-indigo-400">{targetSuccessRate}%</span>
                </div>
                <Slider
                  data-design-id="target-success-rate-slider"
                  min={80}
                  max={99}
                  step={1}
                  value={[targetSuccessRate]}
                  onValueChange={(v) => setTargetSuccessRate(v[0])}
                  className="py-2"
                />
                
                {calculationMode === 'required_capital' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-slate-400">Gewünschte jährliche Entnahme</Label>
                      <span className="text-sm font-medium text-amber-400">{formatCurrency(desiredWithdrawal)}</span>
                    </div>
                    <Slider
                      data-design-id="desired-withdrawal-slider"
                      min={6000}
                      max={200000}
                      step={1000}
                      value={[desiredWithdrawal]}
                      onValueChange={(v) => setDesiredWithdrawal(v[0])}
                      className="py-2"
                    />
                    <Input
                      type="number"
                      data-design-id="desired-withdrawal-input"
                      value={desiredWithdrawal}
                      onChange={(e) => setDesiredWithdrawal(Number(e.target.value))}
                      className="bg-slate-800/50 border-slate-600 text-slate-200"
                      min={1000}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Two-Phase Withdrawal Section */}
          <motion.div
            data-design-id="two-phase-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43 }}
            className="p-4 rounded-xl bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Zwei-Phasen-Entnahme
                </h4>
                <p className="text-xs text-slate-400 mt-1">Höhere Entnahme am Anfang (Reisen etc.), später weniger</p>
              </div>
              <button
                type="button"
                data-design-id="two-phase-toggle"
                onClick={() => setTwoPhaseEnabled(!twoPhaseEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  twoPhaseEnabled ? 'bg-orange-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoPhaseEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {twoPhaseEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-3 border-t border-slate-700/50"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-slate-400">Phase 1 (Anfang)</Label>
                      <span className="text-sm font-medium text-orange-400">{formatCurrency(withdrawal)}</span>
                    </div>
                    <p className="text-xs text-slate-500">= Jährliche Entnahme oben</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-slate-400">Phase 2 (Später)</Label>
                      <span className="text-sm font-medium text-teal-400">{formatCurrency(phase2Withdrawal)}</span>
                    </div>
                    <Input
                      type="number"
                      data-design-id="phase2-withdrawal-input"
                      value={phase2Withdrawal}
                      onChange={(e) => setPhase2Withdrawal(Number(e.target.value))}
                      className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                      min={1000}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-slate-400">Wechsel ab Alter</Label>
                    <span className="text-sm font-medium text-purple-400">{transitionAge} Jahre</span>
                  </div>
                  <Slider
                    data-design-id="transition-age-slider"
                    min={age + 5}
                    max={lifeExpectancy - 5}
                    step={1}
                    value={[transitionAge]}
                    onValueChange={(v) => setTransitionAge(v[0])}
                    className="py-2"
                  />
                  <p className="text-xs text-slate-500">
                    Phase 1: {age} - {transitionAge - 1} Jahre ({transitionAge - age} Jahre, {formatCurrency(withdrawal)}/Jahr)
                    <br />
                    Phase 2: ab {transitionAge} Jahre ({formatCurrency(phase2Withdrawal)}/Jahr)
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          <Separator className="bg-slate-700/50" />

          <motion.div
            data-design-id="advanced-toggle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Button
              type="button"
              variant="ghost"
              data-design-id="advanced-toggle-button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Erweiterte Einstellungen
              </span>
              <svg 
                className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </motion.div>

          {showAdvanced && (
            <motion.div
              data-design-id="advanced-settings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              <div data-design-id="bucket-config-section" className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  3-Töpfe Konfiguration
                </h4>
                
                <div data-design-id="bucket1-config" className="space-y-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-emerald-400">Topf 1</span>
                    <span className="text-xs text-slate-500">({normalizedWeights.bucket1.toFixed(0)}% Anteil)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-slate-400">Bezeichnung</Label>
                      <Input
                        data-design-id="bucket1-name-input"
                        value={bucket1Name}
                        onChange={(e) => setBucket1Name(e.target.value)}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        placeholder="Liquidität"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Gewichtung %</Label>
                      <Input
                        type="number"
                        data-design-id="bucket1-weight-input"
                        value={bucket1Weight}
                        onChange={(e) => setBucket1Weight(Math.max(1, Number(e.target.value)))}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        min={1}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Rendite % p.a.</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        data-design-id="bucket1-return-input"
                        defaultValue={bucket1Return}
                        onChange={(e) => setBucket1Return(parseLocaleNumber(e.target.value))}
                        onBlur={(e) => e.target.value = String(bucket1Return)}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        placeholder="z.B. 2,5"
                      />
                    </div>
                  </div>
                </div>

                <div data-design-id="bucket2-config" className="space-y-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-blue-400">Topf 2</span>
                    <span className="text-xs text-slate-500">({normalizedWeights.bucket2.toFixed(0)}% Anteil)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-slate-400">Bezeichnung</Label>
                      <Input
                        data-design-id="bucket2-name-input"
                        value={bucket2Name}
                        onChange={(e) => setBucket2Name(e.target.value)}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        placeholder="Anleihen"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Gewichtung %</Label>
                      <Input
                        type="number"
                        data-design-id="bucket2-weight-input"
                        value={bucket2Weight}
                        onChange={(e) => setBucket2Weight(Math.max(1, Number(e.target.value)))}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        min={1}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Rendite % p.a.</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        data-design-id="bucket2-return-input"
                        defaultValue={bucket2Return}
                        onChange={(e) => setBucket2Return(parseLocaleNumber(e.target.value))}
                        onBlur={(e) => e.target.value = String(bucket2Return)}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        placeholder="z.B. 4,0"
                      />
                    </div>
                  </div>
                </div>

                <div data-design-id="bucket3-config" className="space-y-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-xs font-medium text-purple-400">Topf 3</span>
                    <span className="text-xs text-slate-500">({normalizedWeights.bucket3.toFixed(0)}% Anteil)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-slate-400">Bezeichnung</Label>
                      <Input
                        data-design-id="bucket3-name-input"
                        value={bucket3Name}
                        onChange={(e) => setBucket3Name(e.target.value)}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        placeholder="Aktien"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Gewichtung %</Label>
                      <Input
                        type="number"
                        data-design-id="bucket3-weight-input"
                        value={bucket3Weight}
                        onChange={(e) => setBucket3Weight(Math.max(1, Number(e.target.value)))}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        min={1}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Rendite % p.a.</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        data-design-id="bucket3-return-input"
                        defaultValue={bucket3Return}
                        onChange={(e) => setBucket3Return(parseLocaleNumber(e.target.value))}
                        onBlur={(e) => e.target.value = String(bucket3Return)}
                        className="h-8 text-sm bg-slate-900/50 border-slate-600 text-slate-200"
                        placeholder="z.B. 7,0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div data-design-id="inflation-section" className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Inflationsanpassung
                </h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Entnahme mit Inflation</Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Jährliche Erhöhung der Entnahme um Inflationsrate
                    </p>
                  </div>
                  <button
                    type="button"
                    data-design-id="inflation-toggle"
                    onClick={() => setInflationEnabled(!inflationEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      inflationEnabled ? 'bg-emerald-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        inflationEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {inflationEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-slate-400">Inflationsrate</Label>
                      <span className="text-sm font-medium text-amber-400">{inflationRate}% p.a.</span>
                    </div>
                    <Slider
                      data-design-id="inflation-rate-slider"
                      min={0}
                      max={5}
                      step={0.5}
                      value={[inflationRate]}
                      onValueChange={(v) => setInflationRate(v[0])}
                      className="py-2"
                    />
                  </motion.div>
                )}
              </div>

              <div data-design-id="loss-avoidance-section" className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Umschichtungsstrategie
                </h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Verluste vermeiden</Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Bei Umschichtungen nur Gewinne realisieren, keine Verluste
                    </p>
                  </div>
                  <button
                    type="button"
                    data-design-id="loss-avoidance-toggle"
                    onClick={() => setAvoidLossRealization(!avoidLossRealization)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      avoidLossRealization ? 'bg-emerald-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        avoidLossRealization ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              data-design-id="calculate-button"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 shadow-lg shadow-emerald-900/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Berechne Monte Carlo Simulation...
                </span>
              ) : (
                "Strategie berechnen & simulieren"
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}