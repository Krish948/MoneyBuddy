import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { PageHeader } from "@/components/PageHeader";
import { TransactionList } from "@/components/TransactionList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryPie } from "@/components/charts/CategoryPie";
import { MonthlyTrend } from "@/components/charts/MonthlyTrend";
import { IncomeVsExpenseBar } from "@/components/charts/IncomeVsExpenseBar";
import { ALL_CATEGORIES, formatCurrency } from "@/lib/finance";
import { format } from "date-fns";
import { toast } from "sonner";

const Analytics = () => {
  const { transactions, loading, update, remove } = useTransactions();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.category !== category) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.category.toLowerCase().includes(s) && !(t.note ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [transactions, search, type, category]);

  const expenseByCategory = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of filtered) {
      if (t.type === "expense") out[t.category] = (out[t.category] || 0) + Number(t.amount);
    }
    return out;
  }, [filtered]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const rows = [
      ["Date", "Type", "Category", "Amount", "Note"],
      ...filtered.map((t) => [
        format(new Date(t.occurred_at), "yyyy-MM-dd"),
        t.type,
        t.category,
        Number(t.amount).toFixed(2),
        (t.note ?? "").replace(/\n/g, " "),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const totalFiltered = filtered.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Analytics"
        description="Filter, search and export your full history."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5">
          <h3 className="font-display text-base font-semibold">Income vs Expense</h3>
          <p className="mb-3 text-xs text-muted-foreground">Last 6 months</p>
          <IncomeVsExpenseBar transactions={transactions} />
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-base font-semibold">Monthly trend</h3>
          <p className="mb-3 text-xs text-muted-foreground">Net flow</p>
          <MonthlyTrend transactions={transactions} />
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-base font-semibold">Spending by category</h3>
          <p className="mb-3 text-xs text-muted-foreground">{filtered.length} matching transactions</p>
          <CategoryPie data={expenseByCategory} />
        </div>
      </div>

      <div className="surface-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category or note…"
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {ALL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Income: <span className="font-mono font-medium text-success">{formatCurrency(totalFiltered.income)}</span></span>
          <span>Expense: <span className="font-mono font-medium text-danger">{formatCurrency(totalFiltered.expense)}</span></span>
          <span>Net: <span className="font-mono font-medium text-foreground">{formatCurrency(totalFiltered.income - totalFiltered.expense)}</span></span>
        </div>
      </div>

      <TransactionList
        transactions={filtered}
        loading={loading}
        onUpdate={update}
        onDelete={remove}
        emptyHint="No transactions match your filters."
      />
    </div>
  );
};

export default Analytics;
