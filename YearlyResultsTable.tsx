"use client";

import type { SimulationYear } from "@/lib/monte-carlo";
import { formatCurrency, type BucketConfig, DEFAULT_BUCKET_CONFIGS } from "@/lib/retirement-calculator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface YearlyResultsTableProps {
  years: SimulationYear[];
  maxRows?: number;
  customBuckets?: BucketConfig[];
}

export function YearlyResultsTable({ years, maxRows = 30, customBuckets }: YearlyResultsTableProps) {
  const displayYears = years.slice(0, maxRows);
  const buckets = customBuckets || DEFAULT_BUCKET_CONFIGS;

  const getUrgencyColor = (urgency: string, avoidedLoss?: boolean) => {
    if (avoidedLoss) {
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
    switch (urgency) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
  };

  const formatReturn = (value: number) => {
    const percent = (value * 100).toFixed(1);
    const isPositive = value >= 0;
    return (
      <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
        {isPositive ? "+" : ""}{percent}%
      </span>
    );
  };

  const getActionLabel = (action: string, avoidedLoss?: boolean) => {
    if (action === "none") {
      return avoidedLoss ? "Warte" : "OK";
    }
    if (action === "refill_bucket1") {
      return avoidedLoss ? "→ T1*" : "→ T1";
    }
    if (action === "refill_bucket2") {
      return avoidedLoss ? "→ T2*" : "→ T2";
    }
    if (action === "reduce_withdrawal") {
      return "Warnung";
    }
    return action;
  };

  return (
    <TooltipProvider>
      <div data-design-id="yearly-results-table-wrapper" className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table data-design-id="yearly-results-table" className="w-full text-sm">
          <thead data-design-id="yearly-results-table-header">
            <tr className="border-b border-slate-700/50 bg-slate-800/50">
              <th className="px-4 py-3 text-left font-medium text-slate-300">Jahr</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Alter</th>
              <th className="px-4 py-3 text-right font-medium" style={{ color: buckets[0].color }}>
                {buckets[0].name}
              </th>
              <th className="px-4 py-3 text-right font-medium" style={{ color: buckets[1].color }}>
                {buckets[1].name}
              </th>
              <th className="px-4 py-3 text-right font-medium" style={{ color: buckets[2].color }}>
                {buckets[2].name}
              </th>
              <th className="px-4 py-3 text-right font-medium text-amber-400">Gesamt</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Entnahme</th>
              <th className="px-4 py-3 text-center font-medium text-slate-300">Renditen</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Umschichtung</th>
            </tr>
          </thead>
          <tbody data-design-id="yearly-results-table-body">
            {displayYears.map((year, index) => (
              <motion.tr
                key={year.year}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                data-design-id={`yearly-results-row-${year.year}`}
                className={`border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors ${
                  year.totalValue === 0 ? "bg-red-900/20" : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-slate-400">{year.year}</td>
                <td className="px-4 py-3 text-slate-300">{year.age}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatCurrency(year.buckets.bucket1)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatCurrency(year.buckets.bucket2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatCurrency(year.buckets.bucket3)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-amber-400">
                  {formatCurrency(year.totalValue)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">
                  -{formatCurrency(year.withdrawal)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs">
                    {formatReturn(year.returns.bucket1)}
                    <span className="text-slate-600">/</span>
                    {formatReturn(year.returns.bucket2)}
                    <span className="text-slate-600">/</span>
                    {formatReturn(year.returns.bucket3)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={`cursor-help ${getUrgencyColor(year.rebalanceAction.urgency, year.rebalanceAction.avoidedLoss)}`}
                      >
                        {getActionLabel(year.rebalanceAction.action, year.rebalanceAction.avoidedLoss)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="left" 
                      className="max-w-xs bg-slate-900 border-slate-700 text-slate-200"
                    >
                      <p className="text-sm">{year.rebalanceAction.description}</p>
                      {year.rebalanceAction.amount && (
                        <p className="text-xs text-slate-400 mt-1">
                          Empfohlener Betrag: {formatCurrency(year.rebalanceAction.amount)}
                        </p>
                      )}
                      {year.rebalanceAction.avoidedLoss && (
                        <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Verlustrealisierung vermieden
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {years.length > maxRows && (
          <div data-design-id="yearly-results-more-indicator" className="px-4 py-3 text-center text-slate-500 text-sm bg-slate-800/30">
            ... und {years.length - maxRows} weitere Jahre
          </div>
        )}
        
        <div data-design-id="yearly-results-legend" className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/30">
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">OK</Badge>
              = Keine Aktion nötig
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">→ T1</Badge>
              = Umschichtung zu Topf 1
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">*</Badge>
              = Teilweise (Verlust vermieden)
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}