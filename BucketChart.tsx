"use client";

import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { type BucketAllocation, type BucketConfig, DEFAULT_BUCKET_CONFIGS, formatCurrency } from "@/lib/retirement-calculator";

ChartJS.register(ArcElement, Tooltip, Legend);

interface BucketChartProps {
  allocation: BucketAllocation;
  customBuckets?: BucketConfig[];
}

export function BucketChart({ allocation, customBuckets }: BucketChartProps) {
  const buckets = customBuckets || DEFAULT_BUCKET_CONFIGS;
  
  const data = useMemo(() => ({
    labels: buckets.map(b => b.name),
    datasets: [
      {
        data: [allocation.bucket1, allocation.bucket2, allocation.bucket3],
        backgroundColor: buckets.map(b => b.color),
        borderColor: buckets.map(b => b.color),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }), [allocation, buckets]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "#e2e8f0",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        borderColor: "rgba(148, 163, 184, 0.2)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context: { label?: string; raw?: unknown }) => {
            const value = context.raw as number;
            const total = allocation.bucket1 + allocation.bucket2 + allocation.bucket3;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div data-design-id="bucket-chart-container" className="w-full max-w-[280px] mx-auto">
      <Pie data={data} options={options} />
    </div>
  );
}