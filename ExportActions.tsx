"use client";

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import type { SimulationResult, MonteCarloSummary } from "@/lib/monte-carlo";
import type { BucketAllocation, BucketConfig, TwoPhaseWithdrawal } from "@/lib/retirement-calculator";
import { formatCurrency } from "@/lib/retirement-calculator";
import { motion } from "framer-motion";

interface ExportActionsProps {
  simulation: SimulationResult;
  summary: MonteCarloSummary;
  allocation: BucketAllocation;
  inputData: {
    totalCapital: number;
    age: number;
    annualWithdrawal: number;
    lifeExpectancy?: number;
    inflationEnabled: boolean;
    inflationRate: number;
    avoidLossRealization: boolean;
    twoPhaseWithdrawal?: TwoPhaseWithdrawal;
    calculationMode: string;
  };
  customBuckets: BucketConfig[];
}

export function ExportActions({
  simulation,
  summary,
  allocation,
  inputData,
  customBuckets,
}: ExportActionsProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const exportToExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ["RUHESTANDSPLANER PRO - EXPORT"],
      ["Exportdatum", new Date().toLocaleDateString("de-DE")],
      [],
      ["=== EINGABEPARAMETER ==="],
      ["Startkapital", inputData.totalCapital],
      ["Startalter", inputData.age],
      ["Lebenserwartung", inputData.lifeExpectancy ?? 95],
      ["Jährliche Entnahme", inputData.annualWithdrawal],
      ["Inflation aktiv", inputData.inflationEnabled ? "Ja" : "Nein"],
      ["Inflationsrate", inputData.inflationEnabled ? `${(inputData.inflationRate * 100).toFixed(1)}%` : "-"],
      ["Verlustvermeidung", inputData.avoidLossRealization ? "Ja" : "Nein"],
      ["Berechnungsmodus", inputData.calculationMode === "standard" ? "Standard" : 
        inputData.calculationMode === "optimal_withdrawal" ? "Optimale Rente" : "Benötigtes Kapital"],
      [],
      ["=== ZWEI-PHASEN-ENTNAHME ==="],
      ["Aktiviert", inputData.twoPhaseWithdrawal?.enabled ? "Ja" : "Nein"],
      ...(inputData.twoPhaseWithdrawal?.enabled ? [
        ["Phase 1 Entnahme", inputData.twoPhaseWithdrawal.phase1Withdrawal],
        ["Übergangalter", inputData.twoPhaseWithdrawal.transitionAge],
        ["Phase 2 Entnahme", inputData.twoPhaseWithdrawal.phase2Withdrawal],
      ] : []),
      [],
      ["=== TÖPFE-KONFIGURATION ==="],
      ["Topf", "Gewichtung", "Erwartete Rendite", "Startwert"],
      ...customBuckets.map((bucket, i) => [
        bucket.name,
        `${bucket.weight}%`,
        `${bucket.expectedReturn}%`,
        i === 0 ? allocation.bucket1 : i === 1 ? allocation.bucket2 : allocation.bucket3,
      ]),
      [],
      ["=== MONTE CARLO ZUSAMMENFASSUNG ==="],
      ["Anzahl Simulationen", summary.simulations],
      ["Erfolgswahrscheinlichkeit", `${summary.successRate.toFixed(1)}%`],
      ["Median Endvermögen", summary.medianFinalValue],
      ["Durchschn. Reichweite (Jahre)", summary.averageYearsLasted.toFixed(1)],
      ["Bestes Szenario", summary.bestCase],
      ["Schlechtestes Szenario", summary.worstCase],
      [],
      ["=== PERZENTILE ==="],
      ["10. Perzentil (pessimistisch)", summary.percentiles.p10],
      ["25. Perzentil", summary.percentiles.p25],
      ["50. Perzentil (Median)", summary.percentiles.p50],
      ["75. Perzentil", summary.percentiles.p75],
      ["90. Perzentil (optimistisch)", summary.percentiles.p90],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Zusammenfassung");

    const yearlyHeaders = [
      "Jahr",
      "Alter",
      customBuckets[0].name,
      customBuckets[1].name,
      customBuckets[2].name,
      "Gesamtvermögen",
      "Entnahme",
      `Rendite ${customBuckets[0].name}`,
      `Rendite ${customBuckets[1].name}`,
      `Rendite ${customBuckets[2].name}`,
      "Umschichtung",
      "Beschreibung",
    ];

    const yearlyData = [
      yearlyHeaders,
      ...simulation.years.map((year) => [
        year.year,
        year.age,
        year.buckets.bucket1,
        year.buckets.bucket2,
        year.buckets.bucket3,
        year.totalValue,
        year.withdrawal,
        `${(year.returns.bucket1 * 100).toFixed(2)}%`,
        `${(year.returns.bucket2 * 100).toFixed(2)}%`,
        `${(year.returns.bucket3 * 100).toFixed(2)}%`,
        year.rebalanceAction.action === "none" ? "Keine" :
          year.rebalanceAction.action === "refill_bucket1" ? "→ Topf 1" :
          year.rebalanceAction.action === "refill_bucket2" ? "→ Topf 2" : year.rebalanceAction.action,
        year.rebalanceAction.description,
      ]),
    ];

    const wsYearly = XLSX.utils.aoa_to_sheet(yearlyData);
    wsYearly["!cols"] = [
      { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsYearly, "Jahresdetails");

    const allocationData = [
      ["=== STARTVERTEILUNG ==="],
      ["Topf", "Betrag", "Anteil", "Reichweite (Jahre)"],
      [customBuckets[0].name, allocation.bucket1, `${customBuckets[0].weight}%`, Math.floor(allocation.bucket1 / inputData.annualWithdrawal)],
      [customBuckets[1].name, allocation.bucket2, `${customBuckets[1].weight}%`, "-"],
      [customBuckets[2].name, allocation.bucket3, `${customBuckets[2].weight}%`, "-"],
      ["Gesamt", allocation.bucket1 + allocation.bucket2 + allocation.bucket3, "100%", "-"],
    ];

    const wsAllocation = XLSX.utils.aoa_to_sheet(allocationData);
    wsAllocation["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsAllocation, "Vermögensaufteilung");

    const fileName = `Ruhestandsplan_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [simulation, summary, allocation, inputData, customBuckets]);

  const handlePrint = useCallback(() => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Ruhestandsplaner Pro - Bericht</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            color: #1a1a2e; 
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #10b981; 
          }
          .header h1 { 
            color: #10b981; 
            font-size: 28px; 
            margin-bottom: 8px; 
          }
          .header p { 
            color: #666; 
            font-size: 14px; 
          }
          .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid; 
          }
          .section h2 { 
            color: #1a1a2e; 
            font-size: 18px; 
            margin-bottom: 16px; 
            padding-bottom: 8px; 
            border-bottom: 2px solid #e5e7eb; 
          }
          .grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 16px; 
          }
          .grid-3 { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 16px; 
          }
          .card { 
            background: #f9fafb; 
            padding: 16px; 
            border-radius: 8px; 
            border: 1px solid #e5e7eb; 
          }
          .card-highlight { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
          }
          .card-highlight .label { color: rgba(255,255,255,0.8); }
          .card .label { 
            font-size: 12px; 
            color: #6b7280; 
            margin-bottom: 4px; 
          }
          .card .value { 
            font-size: 20px; 
            font-weight: 600; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 11px; 
          }
          th, td { 
            padding: 8px 12px; 
            text-align: left; 
            border-bottom: 1px solid #e5e7eb; 
          }
          th { 
            background: #f3f4f6; 
            font-weight: 600; 
            color: #374151; 
          }
          tr:nth-child(even) { background: #f9fafb; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .success { color: #10b981; }
          .warning { color: #f59e0b; }
          .danger { color: #ef4444; }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            font-size: 11px; 
            color: #9ca3af; 
          }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ruhestandsplaner Pro</h1>
          <p>3-Töpfe-Strategie mit Monte Carlo Simulation</p>
          <p style="margin-top: 8px;">Erstellt am: ${new Date().toLocaleDateString("de-DE", { 
            year: "numeric", 
            month: "long", 
            day: "numeric", 
            hour: "2-digit", 
            minute: "2-digit" 
          })}</p>
        </div>

        <div class="section">
          <h2>Erfolgswahrscheinlichkeit</h2>
          <div class="grid">
            <div class="card card-highlight">
              <div class="label">Erfolgsrate</div>
              <div class="value" style="font-size: 32px;">${summary.successRate.toFixed(1)}%</div>
            </div>
            <div class="card">
              <div class="label">Basierend auf</div>
              <div class="value">${summary.simulations.toLocaleString("de-DE")} Simulationen</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Eingabeparameter</h2>
          <div class="grid">
            <div class="card">
              <div class="label">Startkapital</div>
              <div class="value">${formatCurrency(inputData.totalCapital)}</div>
            </div>
            <div class="card">
              <div class="label">Jährliche Entnahme</div>
              <div class="value">${formatCurrency(inputData.annualWithdrawal)}</div>
            </div>
            <div class="card">
              <div class="label">Startalter</div>
              <div class="value">${inputData.age} Jahre</div>
            </div>
            <div class="card">
              <div class="label">Lebenserwartung</div>
              <div class="value">${inputData.lifeExpectancy ?? 95} Jahre</div>
            </div>
          </div>
          ${inputData.twoPhaseWithdrawal?.enabled ? `
          <div style="margin-top: 16px;">
            <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Zwei-Phasen-Entnahme</h3>
            <div class="grid-3">
              <div class="card">
                <div class="label">Phase 1</div>
                <div class="value">${formatCurrency(inputData.twoPhaseWithdrawal.phase1Withdrawal)}/Jahr</div>
              </div>
              <div class="card">
                <div class="label">Übergang ab</div>
                <div class="value">${inputData.twoPhaseWithdrawal.transitionAge} Jahre</div>
              </div>
              <div class="card">
                <div class="label">Phase 2</div>
                <div class="value">${formatCurrency(inputData.twoPhaseWithdrawal.phase2Withdrawal)}/Jahr</div>
              </div>
            </div>
          </div>
          ` : ""}
        </div>

        <div class="section">
          <h2>Vermögensaufteilung (3-Töpfe)</h2>
          <div class="grid-3">
            ${customBuckets.map((bucket, i) => {
              const value = i === 0 ? allocation.bucket1 : i === 1 ? allocation.bucket2 : allocation.bucket3;
              return `
                <div class="card">
                  <div class="label">${bucket.name} (${bucket.weight}%)</div>
                  <div class="value">${formatCurrency(value)}</div>
                  <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    Erwartete Rendite: ${bucket.expectedReturn}% p.a.
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="section">
          <h2>Monte Carlo Statistiken</h2>
          <div class="grid">
            <div class="card">
              <div class="label">Median Endvermögen</div>
              <div class="value">${formatCurrency(summary.medianFinalValue)}</div>
            </div>
            <div class="card">
              <div class="label">Durchschn. Reichweite</div>
              <div class="value">${summary.averageYearsLasted.toFixed(1)} Jahre</div>
            </div>
            <div class="card">
              <div class="label">Bestes Szenario</div>
              <div class="value success">${formatCurrency(summary.bestCase)}</div>
            </div>
            <div class="card">
              <div class="label">Schlechtestes Szenario</div>
              <div class="value danger">${formatCurrency(summary.worstCase)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Vermögensperzentile</h2>
          <table>
            <thead>
              <tr>
                <th>Perzentil</th>
                <th class="text-right">Endvermögen</th>
                <th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>10. Perzentil</td>
                <td class="text-right danger">${formatCurrency(summary.percentiles.p10)}</td>
                <td>Pessimistisches Szenario</td>
              </tr>
              <tr>
                <td>25. Perzentil</td>
                <td class="text-right warning">${formatCurrency(summary.percentiles.p25)}</td>
                <td>Unterdurchschnittlich</td>
              </tr>
              <tr>
                <td>50. Perzentil</td>
                <td class="text-right">${formatCurrency(summary.percentiles.p50)}</td>
                <td>Median (typisches Ergebnis)</td>
              </tr>
              <tr>
                <td>75. Perzentil</td>
                <td class="text-right success">${formatCurrency(summary.percentiles.p75)}</td>
                <td>Überdurchschnittlich</td>
              </tr>
              <tr>
                <td>90. Perzentil</td>
                <td class="text-right success">${formatCurrency(summary.percentiles.p90)}</td>
                <td>Optimistisches Szenario</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Jahresdetails (Beispiel-Simulation)</h2>
          <table>
            <thead>
              <tr>
                <th>Jahr</th>
                <th>Alter</th>
                <th class="text-right">${customBuckets[0].name}</th>
                <th class="text-right">${customBuckets[1].name}</th>
                <th class="text-right">${customBuckets[2].name}</th>
                <th class="text-right">Gesamt</th>
                <th class="text-right">Entnahme</th>
                <th class="text-center">Aktion</th>
              </tr>
            </thead>
            <tbody>
              ${simulation.years.slice(0, 35).map((year) => `
                <tr>
                  <td>${year.year}</td>
                  <td>${year.age}</td>
                  <td class="text-right">${formatCurrency(year.buckets.bucket1)}</td>
                  <td class="text-right">${formatCurrency(year.buckets.bucket2)}</td>
                  <td class="text-right">${formatCurrency(year.buckets.bucket3)}</td>
                  <td class="text-right" style="font-weight: 600;">${formatCurrency(year.totalValue)}</td>
                  <td class="text-right">${formatCurrency(year.withdrawal)}</td>
                  <td class="text-center">${
                    year.rebalanceAction.action === "none" ? "OK" :
                    year.rebalanceAction.action === "refill_bucket1" ? "→ T1" :
                    year.rebalanceAction.action === "refill_bucket2" ? "→ T2" : "-"
                  }</td>
                </tr>
              `).join("")}
              ${simulation.years.length > 35 ? `
                <tr>
                  <td colspan="8" style="text-align: center; color: #6b7280; font-style: italic;">
                    ... und ${simulation.years.length - 35} weitere Jahre
                  </td>
                </tr>
              ` : ""}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p><strong>Hinweis:</strong> Diese Berechnung dient nur zu Informationszwecken und stellt keine Finanzberatung dar.</p>
          <p style="margin-top: 8px;">Basierend auf der Trinity-Studie und Harold Evenskys Bucket-Strategie</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [simulation, summary, allocation, inputData, customBuckets]);

  return (
    <motion.div
      data-design-id="export-actions-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30"
    >
      <span data-design-id="export-label" className="text-sm text-slate-400 mr-2">
        Export:
      </span>
      
      <Button
        data-design-id="excel-download-button"
        onClick={exportToExcel}
        variant="outline"
        size="sm"
        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Excel (.xlsx)
      </Button>

      <Button
        data-design-id="print-button"
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Drucken
      </Button>
    </motion.div>
  );
}