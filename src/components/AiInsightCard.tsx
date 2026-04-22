import { useMemo, useState } from "react";
import { Sparkles, Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/finance";
import { toast } from "sonner";

interface Summary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  byCategory: Record<string, number>;
  previousByCategory: Record<string, number>;
  budgets: Array<{ category: string; limit: number; spent: number }>;
}

interface InsightLine {
  kind: "info" | "warn" | "good";
  text: string;
}

const buildRuleInsights = (s: Summary): InsightLine[] => {
  const lines: InsightLine[] = [];

  // Budget breaches
  for (const b of s.budgets) {
    if (b.limit <= 0) continue;
    if (b.spent > b.limit) {
      lines.push({
        kind: "warn",
        text: `You're over budget on ${b.category}: ${formatCurrency(b.spent)} of ${formatCurrency(b.limit)}.`,
      });
    } else if (b.spent / b.limit >= 0.8) {
      lines.push({
        kind: "warn",
        text: `You're at ${Math.round((b.spent / b.limit) * 100)}% of your ${b.category} budget.`,
      });
    }
  }

  // Category spikes vs last month
  const changes: { cat: string; delta: number; pct: number; spent: number }[] = [];
  for (const [cat, spent] of Object.entries(s.byCategory)) {
    const prev = s.previousByCategory[cat] || 0;
    if (prev <= 0 && spent > 0) {
      changes.push({ cat, delta: spent, pct: Infinity, spent });
    } else if (prev > 0) {
      const pct = ((spent - prev) / prev) * 100;
      changes.push({ cat, delta: spent - prev, pct, spent });
    }
  }
  changes.sort((a, b) => b.pct - a.pct);
  const topSpike = changes[0];
  if (topSpike && topSpike.pct >= 25 && topSpike.spent > 20) {
    lines.push({
      kind: "warn",
      text:
        topSpike.pct === Infinity
          ? `New category this month: ${topSpike.cat} (${formatCurrency(topSpike.spent)}).`
          : `You spent ${Math.round(topSpike.pct)}% more on ${topSpike.cat} this month.`,
    });
  }

  // Savings rate
  if (s.totalIncome > 0) {
    const rate = ((s.totalIncome - s.totalExpense) / s.totalIncome) * 100;
    if (rate >= 20) {
      lines.push({ kind: "good", text: `Strong savings rate this month: ${rate.toFixed(0)}% of income.` });
    } else if (rate < 0) {
      lines.push({ kind: "warn", text: `You're spending more than you earned this month.` });
    } else {
      lines.push({ kind: "info", text: `Savings rate this month: ${rate.toFixed(0)}%.` });
    }
  }

  if (lines.length === 0) {
    lines.push({ kind: "info", text: "Looking steady — no overspending detected." });
  }
  return lines.slice(0, 4);
};

export const AiInsightCard = ({ summary }: { summary: Summary }) => {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ruleInsights = useMemo(() => buildRuleInsights(summary), [summary]);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: { summary },
      });
      if (error) throw error;
      if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);
      setNarrative((data as { narrative: string }).narrative);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary-soft/60 to-transparent px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">AI insights</h3>
            <p className="text-xs text-muted-foreground">Spotted patterns + a coach narrative.</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {narrative ? "Regenerate" : "Generate narrative"}
        </Button>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        <ul className="divide-y border-b md:border-b-0 md:border-r">
          {ruleInsights.map((line, i) => (
            <li key={i} className="flex items-start gap-3 px-5 py-3 text-sm">
              <span className="mt-0.5">
                {line.kind === "warn" && <AlertTriangle className="h-4 w-4 text-warning" />}
                {line.kind === "good" && <TrendingUp className="h-4 w-4 text-success" />}
                {line.kind === "info" && <TrendingDown className="h-4 w-4 text-muted-foreground" />}
              </span>
              <span className="leading-relaxed">{line.text}</span>
            </li>
          ))}
        </ul>
        <div className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          {narrative ? (
            <p className="whitespace-pre-wrap text-foreground">{narrative}</p>
          ) : (
            <p className="text-muted-foreground">
              Click <span className="font-medium text-foreground">Generate narrative</span> for a personalized AI summary of your month.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
