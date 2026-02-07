"use client";

import type { MonteCarloSummary as SummaryType } from "@/lib/monte-carlo";
import { formatCurrency } from "@/lib/retirement-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface MonteCarloSummaryProps {
  summary: SummaryType;
}

export function MonteCarloSummaryCard({ summary }: MonteCarloSummaryProps) {
  const successColor = summary.successRate >= 90 
    ? "text-emerald-400" 
    : summary.successRate >= 75 
    ? "text-amber-400" 
    : "text-red-400";

  const successBgColor = summary.successRate >= 90 
    ? "bg-emerald-500" 
    : summary.successRate >= 75 
    ? "bg-amber-500" 
    : "bg-red-500";

  return (
    <Card data-design-id="monte-carlo-summary-card" className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader data-design-id="monte-carlo-summary-header">
        <CardTitle data-design-id="monte-carlo-summary-title" className="flex items-center gap-3 text-slate-100">
          <span data-design-id="monte-carlo-summary-icon" className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </span>
          Monte Carlo Analyse
        </CardTitle>
        <p data-design-id="monte-carlo-summary-subtitle" className="text-sm text-slate-400 mt-1">
          {summary.simulations.toLocaleString('de-DE')} Simulationen durchgeführt
        </p>
      </CardHeader>
      <CardContent data-design-id="monte-carlo-summary-content" className="space-y-6">
        <motion.div 
          data-design-id="success-rate-section"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 rounded-xl bg-slate-800/50 border border-slate-700/30"
        >
          <p data-design-id="success-rate-label" className="text-sm text-slate-400 mb-2">Erfolgswahrscheinlichkeit</p>
          <p data-design-id="success-rate-value" className={`text-5xl font-bold ${successColor}`}>
            {summary.successRate.toFixed(1)}%
          </p>
          <div data-design-id="success-rate-progress" className="mt-4">
            <Progress value={summary.successRate} className={`h-2 ${successBgColor}`} />
          </div>
          <p data-design-id="success-rate-description" className="text-xs text-slate-500 mt-3">
            Wahrscheinlichkeit, dass das Vermögen bis zum Lebensende reicht
          </p>
        </motion.div>

        <div data-design-id="stats-grid" className="grid grid-cols-2 gap-4">
          <motion.div 
            data-design-id="median-value-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
          >
            <p data-design-id="median-value-label" className="text-xs text-slate-400">Median Endvermögen</p>
            <p data-design-id="median-value" className="text-lg font-semibold text-blue-400 mt-1">
              {formatCurrency(summary.medianFinalValue)}
            </p>
          </motion.div>
          
          <motion.div 
            data-design-id="avg-years-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
          >
            <p data-design-id="avg-years-label" className="text-xs text-slate-400">Durchschn. Reichweite</p>
            <p data-design-id="avg-years-value" className="text-lg font-semibold text-emerald-400 mt-1">
              {summary.averageYearsLasted.toFixed(1)} Jahre
            </p>
          </motion.div>
          
          <motion.div 
            data-design-id="worst-case-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
          >
            <p data-design-id="worst-case-label" className="text-xs text-slate-400">Schlechtestes Szenario</p>
            <p data-design-id="worst-case-value" className="text-lg font-semibold text-red-400 mt-1">
              {formatCurrency(summary.worstCase)}
            </p>
          </motion.div>
          
          <motion.div 
            data-design-id="best-case-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
          >
            <p data-design-id="best-case-label" className="text-xs text-slate-400">Bestes Szenario</p>
            <p data-design-id="best-case-value" className="text-lg font-semibold text-emerald-400 mt-1">
              {formatCurrency(summary.bestCase)}
            </p>
          </motion.div>
        </div>

        <motion.div 
          data-design-id="percentiles-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
        >
          <p data-design-id="percentiles-title" className="text-sm font-medium text-slate-300 mb-3">Vermögensperzentile</p>
          <div data-design-id="percentiles-grid" className="space-y-2">
            {[
              { label: "10. Perzentil (pessimistisch)", value: summary.percentiles.p10, color: "text-red-400" },
              { label: "25. Perzentil", value: summary.percentiles.p25, color: "text-amber-400" },
              { label: "50. Perzentil (Median)", value: summary.percentiles.p50, color: "text-blue-400" },
              { label: "75. Perzentil", value: summary.percentiles.p75, color: "text-emerald-400" },
              { label: "90. Perzentil (optimistisch)", value: summary.percentiles.p90, color: "text-emerald-500" },
            ].map((item, index) => (
              <div key={index} data-design-id={`percentile-row-${index}`} className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className={`text-sm font-mono ${item.color}`}>{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}