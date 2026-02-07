"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { SimulationResult } from "@/lib/monte-carlo";
import { type BucketConfig, DEFAULT_BUCKET_CONFIGS, formatCurrency } from "@/lib/retirement-calculator";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SimulationTimelineProps {
  simulation: SimulationResult;
  customBuckets?: BucketConfig[];
}

export function SimulationTimeline({ simulation, customBuckets }: SimulationTimelineProps) {
  const buckets = customBuckets || DEFAULT_BUCKET_CONFIGS;
  
  const data = useMemo(() => ({
    labels: simulation.years.map(y => `Jahr ${y.year}`),
    datasets: [
      {
        label: buckets[0].name,
        data: simulation.years.map(y => y.buckets.bucket1),
        borderColor: buckets[0].color,
        backgroundColor: `${buckets[0].color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: buckets[1].name,
        data: simulation.years.map(y => y.buckets.bucket2),
        borderColor: buckets[1].color,
        backgroundColor: `${buckets[1].color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: buckets[2].name,
        data: simulation.years.map(y => y.buckets.bucket3),
        borderColor: buckets[2].color,
        backgroundColor: `${buckets[2].color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: "Gesamtvermögen",
        data: simulation.years.map(y => y.totalValue),
        borderColor: "#f59e0b",
        backgroundColor: "transparent",
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 8,
        borderDash: [5, 5],
      },
    ],
  }), [simulation, buckets]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: "#e2e8f0",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        borderColor: "rgba(148, 163, 184, 0.2)",
        borderWidth: 1,
        padding: 14,
        displayColors: true,
        callbacks: {
          label: (context: { dataset?: { label?: string }; raw?: unknown }) => {
            const value = context.raw as number;
            return `${context.dataset?.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 10,
          },
          maxTicksLimit: 15,
        },
      },
      y: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 10,
          },
          callback: (value: number | string) => formatCurrency(Number(value)),
        },
      },
    },
  };

  return (
    <div data-design-id="simulation-timeline-container" className="w-full h-[400px]">
      <Line data={data} options={options} />
    </div>
  );
}