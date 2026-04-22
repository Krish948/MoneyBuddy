import { useMemo, useState } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, formatCurrency, monthKey } from "@/lib/finance";
import { Progress } from "@/components/ui/progress";
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Budgets = () => {
  const { budgets, upsert, remove, loading } = useBudgets(new Date());
  const { transactions } = useTransactions();
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const thisMonth = monthKey(new Date());
  const spentByCategory = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === "expense" && monthKey(t.occurred_at) === thisMonth) {
        out[t.category] = (out[t.category] || 0) + Number(t.amount);
      }
    }
    return out;
  }, [transactions, thisMonth]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(amount);
    if (!category || !Number.isFinite(limit) || limit <= 0) {
      toast.error("Pick a category and enter a positive amount");
      return;
    }
    try {
      await upsert(category, limit);
      toast.success("Budget saved");
      setCategory("");
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save budget");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Budgets" description={`Monthly limits — ${new Date().toLocaleString(undefined, { month: "long", year: "numeric" })}`} />

      <div className="surface-card p-5">
        <h3 className="mb-3 font-display text-base font-semibold">Set or update a category budget</h3>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr,180px,auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="limit">Monthly limit</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Button type="submit">Save budget</Button>
        </form>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="surface-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : budgets.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <p className="text-sm text-muted-foreground">No budgets yet. Add one above to start tracking.</p>
          </div>
        ) : (
          budgets.map((b) => {
            const limit = Number(b.limit_amount);
            const spent = spentByCategory[b.category] || 0;
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            const over = spent > limit;
            const warn = !over && pct >= 80;
            return (
              <div key={b.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{b.category}</span>
                      {over && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-1.5 py-0.5 text-xs font-medium text-danger">
                          <AlertTriangle className="h-3 w-3" /> Over budget
                        </span>
                      )}
                      {warn && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">
                          <AlertTriangle className="h-3 w-3" /> Near limit
                        </span>
                      )}
                      {!over && !warn && spent > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-1.5 py-0.5 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3 w-3" /> On track
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(spent)} of {formatCurrency(limit)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => { await remove(b.id); toast.success("Budget removed"); }}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Progress
                  value={pct}
                  className={cn("mt-3 h-2", over && "[&>div]:bg-danger", warn && !over && "[&>div]:bg-warning")}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Budgets;
