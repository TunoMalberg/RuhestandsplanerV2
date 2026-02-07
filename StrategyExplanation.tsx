"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export function StrategyExplanation() {
  return (
    <Card data-design-id="strategy-explanation-card" className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader data-design-id="strategy-explanation-header">
        <CardTitle data-design-id="strategy-explanation-title" className="flex items-center gap-3 text-slate-100">
          <span data-design-id="strategy-explanation-icon" className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </span>
          Wissenschaftliche Grundlagen
        </CardTitle>
      </CardHeader>
      <CardContent data-design-id="strategy-explanation-content" className="space-y-6 text-slate-300">
        <motion.section
          data-design-id="bucket-approach-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 data-design-id="bucket-approach-title" className="text-lg font-semibold text-emerald-400 mb-2">
            Der Bucket-Ansatz (3-Töpfe-Strategie)
          </h3>
          <p data-design-id="bucket-approach-text" className="text-sm leading-relaxed">
            Die 3-Töpfe-Strategie wurde von <strong className="text-slate-100">Harold Evensky</strong> entwickelt 
            und ist eine der effektivsten Methoden zur Verwaltung von Ruhestandsvermögen. 
            Die Grundidee ist es, das Vermögen in drei "Töpfe" mit unterschiedlichen Zeithorizonten 
            und Risikoprofilen aufzuteilen.
          </p>
        </motion.section>

        <Separator className="bg-slate-700/50" />

        <motion.section
          data-design-id="sequence-risk-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 data-design-id="sequence-risk-title" className="text-lg font-semibold text-blue-400 mb-2">
            Sequence-of-Returns-Risiko
          </h3>
          <p data-design-id="sequence-risk-text" className="text-sm leading-relaxed">
            Das größte Risiko im Ruhestand ist das <strong className="text-slate-100">Reihenfolge-Rendite-Risiko</strong>. 
            Wenn der Aktienmarkt in den ersten Jahren Ihres Ruhestands stark einbricht, 
            während Sie gleichzeitig Entnahmen tätigen, kann Ihr Vermögen schneller aufgebraucht werden 
            als bei einem späteren Einbruch – selbst bei gleicher Durchschnittsrendite.
          </p>
          <div data-design-id="sequence-risk-explanation" className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Beispiel:</strong> Bei einer durchschnittlichen Rendite von 7% über 20 Jahre 
              macht es einen enormen Unterschied, ob die negativen Jahre am Anfang oder am Ende liegen. 
              Frühe Verluste in Kombination mit Entnahmen können zu einem "Verarmungsspirale" führen.
            </p>
          </div>
        </motion.section>

        <Separator className="bg-slate-700/50" />

        <motion.section
          data-design-id="four-percent-rule-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 data-design-id="four-percent-rule-title" className="text-lg font-semibold text-amber-400 mb-2">
            Die 4%-Regel (Trinity-Studie)
          </h3>
          <p data-design-id="four-percent-rule-text" className="text-sm leading-relaxed">
            Die berühmte <strong className="text-slate-100">Trinity-Studie</strong> (1998) von Cooley, Hubbard und Walz 
            zeigte, dass bei einer Entnahmerate von 4% des Anfangsvermögens (inflationsbereinigt) 
            das Vermögen in 95% aller historischen 30-Jahres-Zeiträume ausreichte.
          </p>
          <ul data-design-id="four-percent-rule-list" className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span><strong className="text-emerald-400">≤ 3.5%:</strong> Sehr sicher, hohes Restvermögen wahrscheinlich</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span><strong className="text-amber-400">3.5-4.5%:</strong> Moderat sicher, empfohlen für die meisten</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span><strong className="text-red-400">&gt; 4.5%:</strong> Höheres Risiko, regelmäßige Überprüfung nötig</span>
            </li>
          </ul>
        </motion.section>

        <Separator className="bg-slate-700/50" />

        <motion.section
          data-design-id="monte-carlo-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 data-design-id="monte-carlo-title" className="text-lg font-semibold text-purple-400 mb-2">
            Monte Carlo Simulation
          </h3>
          <p data-design-id="monte-carlo-text" className="text-sm leading-relaxed">
            Die <strong className="text-slate-100">Monte Carlo Simulation</strong> ist eine statistische Methode, 
            die tausende mögliche Zukunftsszenarien durchspielt. Jeder Durchlauf verwendet zufällige Renditen 
            basierend auf historischen Durchschnittswerten und Volatilitäten.
          </p>
          <div data-design-id="monte-carlo-explanation" className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Annahmen unserer Simulation:</strong><br />
              Aktien: 7% erwartete Rendite, 18% Volatilität<br />
              Anleihen: 4% erwartete Rendite, 6% Volatilität<br />
              Cash: 2% erwartete Rendite, 0.5% Volatilität<br />
              Inflation: 2% jährlich
            </p>
          </div>
        </motion.section>

        <motion.section
          data-design-id="rebalancing-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 data-design-id="rebalancing-title" className="text-lg font-semibold text-cyan-400 mb-2">
            Umschichtungsstrategie
          </h3>
          <p data-design-id="rebalancing-text" className="text-sm leading-relaxed">
            Die automatische Umschichtung ("Rebalancing") ist entscheidend für den Erfolg. 
            Wenn Topf 1 unter die 2-Jahres-Marke fällt, wird aus Topf 3 (Aktien) nachgefüllt – 
            idealerweise wenn die Märkte gut gelaufen sind. So werden Gewinne gesichert 
            und das Sequence-of-Returns-Risiko reduziert.
          </p>
        </motion.section>
      </CardContent>
    </Card>
  );
}