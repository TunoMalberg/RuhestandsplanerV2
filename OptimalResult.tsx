"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/retirement-calculator";
import { motion } from "framer-motion";
import type { CalculationMode } from "@/lib/retirement-calculator";

interface OptimalResultProps {
  calculationMode: CalculationMode;
  capital: number;
  withdrawal: number;
  targetSuccessRate?: number;
  actualSuccessRate?: number;
}

export function OptimalResult({
  calculationMode,
  capital,
  withdrawal,
  targetSuccessRate = 95,
  actualSuccessRate,
}: OptimalResultProps) {
  if (calculationMode === 'standard') {
    return null;
  }

  const withdrawalRate = (withdrawal / capital) * 100;
  const monthlyWithdrawal = withdrawal / 12;

  return (
    <motion.div
      data-design-id="optimal-result-container"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card 
        data-design-id="optimal-result-card" 
        className={`border-2 backdrop-blur-sm ${
          calculationMode === 'optimal_withdrawal' 
            ? 'bg-gradient-to-br from-emerald-950/80 to-teal-950/80 border-emerald-500/50' 
            : 'bg-gradient-to-br from-amber-950/80 to-orange-950/80 border-amber-500/50'
        }`}
      >
        <CardContent data-design-id="optimal-result-content" className="p-6">
          <div data-design-id="optimal-result-header" className="flex items-start gap-4 mb-6">
            <div 
              data-design-id="optimal-result-icon"
              className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
                calculationMode === 'optimal_withdrawal' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-900/30' 
                  : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-900/30'
              }`}
            >
              {calculationMode === 'optimal_withdrawal' ? (
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </div>
            <div>
              <h2 
                data-design-id="optimal-result-title"
                className={`text-xl font-bold ${
                  calculationMode === 'optimal_withdrawal' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {calculationMode === 'optimal_withdrawal' 
                  ? 'Ihre optimale Rente' 
                  : 'Benötigtes Kapital'}
              </h2>
              <p data-design-id="optimal-result-subtitle" className="text-sm text-slate-400 mt-1">
                {calculationMode === 'optimal_withdrawal' 
                  ? `Basierend auf ${formatCurrency(capital)} Kapital` 
                  : `Für eine Rente von ${formatCurrency(withdrawal)} pro Jahr`}
              </p>
            </div>
          </div>

          <div data-design-id="optimal-result-main" className="grid gap-4">
            {/* Main Result */}
            <motion.div 
              data-design-id="optimal-result-primary"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`p-6 rounded-xl text-center ${
                calculationMode === 'optimal_withdrawal' 
                  ? 'bg-emerald-900/40 border border-emerald-500/30' 
                  : 'bg-amber-900/40 border border-amber-500/30'
              }`}
            >
              {calculationMode === 'optimal_withdrawal' ? (
                <>
                  <p data-design-id="optimal-result-label" className="text-sm text-slate-400 mb-2">
                    Maximale jährliche Entnahme
                  </p>
                  <p data-design-id="optimal-result-value" className="text-4xl font-bold text-emerald-300">
                    {formatCurrency(withdrawal)}
                  </p>
                  <p data-design-id="optimal-result-monthly" className="text-lg text-emerald-400/80 mt-2">
                    = {formatCurrency(monthlyWithdrawal)} / Monat
                  </p>
                </>
              ) : (
                <>
                  <p data-design-id="optimal-result-label" className="text-sm text-slate-400 mb-2">
                    Erforderliches Startkapital
                  </p>
                  <p data-design-id="optimal-result-value" className="text-4xl font-bold text-amber-300">
                    {formatCurrency(capital)}
                  </p>
                </>
              )}
            </motion.div>

            {/* Secondary Stats */}
            <div data-design-id="optimal-result-stats" className="grid grid-cols-2 gap-3">
              <div 
                data-design-id="optimal-result-rate"
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <p className="text-xs text-slate-400">Entnahmerate</p>
                <p className={`text-xl font-semibold mt-1 ${
                  withdrawalRate <= 3.5 ? 'text-emerald-400' :
                  withdrawalRate <= 4.5 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {withdrawalRate.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {withdrawalRate <= 3.5 ? 'Sehr konservativ' :
                   withdrawalRate <= 4.0 ? 'Sicher (4%-Regel)' :
                   withdrawalRate <= 4.5 ? 'Moderat' : 'Risikoreich'}
                </p>
              </div>
              
              <div 
                data-design-id="optimal-result-success"
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <p className="text-xs text-slate-400">Ziel-Erfolgsrate</p>
                <p className="text-xl font-semibold text-indigo-400 mt-1">
                  {targetSuccessRate}%
                </p>
                {actualSuccessRate && (
                  <p className="text-xs text-slate-500 mt-1">
                    Simulation: {actualSuccessRate.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div 
              data-design-id="optimal-result-info"
              className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
            >
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-400">
                  {calculationMode === 'optimal_withdrawal' 
                    ? `Diese Berechnung zeigt die maximale jährliche Entnahme, bei der Ihr Vermögen mit ${targetSuccessRate}% Wahrscheinlichkeit bis zum geplanten Lebensende reicht.`
                    : `Diese Berechnung zeigt das Startkapital, das Sie benötigen, um ${formatCurrency(withdrawal)} pro Jahr mit ${targetSuccessRate}% Erfolgswahrscheinlichkeit entnehmen zu können.`
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}