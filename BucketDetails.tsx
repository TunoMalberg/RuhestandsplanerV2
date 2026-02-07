"use client";

import { type BucketAllocation, type BucketConfig, DEFAULT_BUCKET_CONFIGS, formatCurrency } from "@/lib/retirement-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface BucketDetailsProps {
  allocation: BucketAllocation;
  annualWithdrawal: number;
  customBuckets?: BucketConfig[];
}

export function BucketDetails({ allocation, annualWithdrawal, customBuckets }: BucketDetailsProps) {
  const bucketConfigs = customBuckets || DEFAULT_BUCKET_CONFIGS;
  
  const buckets = [
    { ...bucketConfigs[0], value: allocation.bucket1 },
    { ...bucketConfigs[1], value: allocation.bucket2 },
    { ...bucketConfigs[2], value: allocation.bucket3 },
  ];

  const total = allocation.bucket1 + allocation.bucket2 + allocation.bucket3;

  return (
    <Card data-design-id="bucket-details-card" className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader data-design-id="bucket-details-header">
        <CardTitle data-design-id="bucket-details-title" className="flex items-center gap-3 text-slate-100">
          <span data-design-id="bucket-details-icon" className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
          Die 3-Töpfe-Strategie
        </CardTitle>
      </CardHeader>
      <CardContent data-design-id="bucket-details-content" className="space-y-4">
        {buckets.map((bucket, index) => {
          const yearsOfCoverage = bucket.value / annualWithdrawal;
          const percentage = (bucket.value / total) * 100;
          
          return (
            <motion.div
              key={index}
              data-design-id={`bucket-detail-item-${index + 1}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border transition-all duration-300 hover:shadow-lg"
              style={{ 
                borderColor: `${bucket.color}40`,
                background: `linear-gradient(135deg, ${bucket.color}10 0%, transparent 100%)`
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 data-design-id={`bucket-name-${index + 1}`} className="font-semibold text-slate-100" style={{ color: bucket.color }}>
                    Topf {index + 1}: {bucket.name}
                  </h3>
                  <p data-design-id={`bucket-description-${index + 1}`} className="text-xs text-slate-400 mt-1">
                    Gewichtung: {bucket.weight}% | Erwartete Rendite: {(bucket.expectedReturn * 100).toFixed(1)}% p.a.
                  </p>
                </div>
                <div data-design-id={`bucket-value-${index + 1}`} className="text-right">
                  <p className="text-xl font-bold" style={{ color: bucket.color }}>
                    {formatCurrency(bucket.value)}
                  </p>
                  <p className="text-xs text-slate-500">{percentage.toFixed(1)}% des Vermögens</p>
                </div>
              </div>
              
              <div data-design-id={`bucket-stats-${index + 1}`} className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-700/30">
                <div>
                  <p className="text-xs text-slate-500">Erwartete Rendite</p>
                  <p className="text-sm font-medium text-slate-300">
                    {(bucket.expectedReturn * 100).toFixed(1)}% p.a.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Volatilität</p>
                  <p className="text-sm font-medium text-slate-300">
                    ±{(bucket.volatility * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reichweite</p>
                  <p className="text-sm font-medium" style={{ color: bucket.color }}>
                    {yearsOfCoverage.toFixed(1)} Jahre
                  </p>
                </div>
              </div>

              <div data-design-id={`bucket-progress-${index + 1}`} className="mt-3">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          data-design-id="bucket-total-summary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
        >
          <div className="flex justify-between items-center">
            <div>
              <p data-design-id="total-label" className="text-sm text-slate-400">Gesamtvermögen</p>
              <p data-design-id="total-value" className="text-2xl font-bold text-amber-400">{formatCurrency(total)}</p>
            </div>
            <div className="text-right">
              <p data-design-id="total-coverage-label" className="text-sm text-slate-400">Gesamtreichweite</p>
              <p data-design-id="total-coverage-value" className="text-2xl font-bold text-emerald-400">
                ~{Math.floor(total / annualWithdrawal)} Jahre
              </p>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}