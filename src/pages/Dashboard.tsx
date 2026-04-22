import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { formatCurrency, monthKey } from "@/lib/finance";
import { AiInsightCard } from "@/components/AiInsightCard";
import { CategoryPie } from "@/components/charts/CategoryPie";
import { MonthlyTrend } from "@/components/charts/MonthlyTrend";

const Dashboard = () => {
  const { transactions, loading, update, remove } = useTransactions();
  const { budgets } = useBudgets(new Date());
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = monthKey(now);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = monthKey(prevDate);

    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    let prevMonthExpense = 0;
    const byCategory: Record<string, number> = {};
    const previousByCategory: Record<string, number> = {};

    for (const t of transactions) {
      const amt = Number(t.amount);
      const m = monthKey(t.occurred_at);
      if (t.type === "income") totalIncome += amt;
      else totalExpense += amt;

      if (m === thisMonth) {
        if (t.type === "income") monthIncome += amt;
        else {
          monthExpense += amt;
          byCategory[t.category] = (byCategory[t.category] || 0) + amt;
        }
      }
      if (m === prevMonth) {
        if (t.type === "expense") {
          prevMonthExpense += amt;
          previousByCategory[t.category] = (previousByCategory[t.category] || 0) + amt;
        }
      }
    }

    const balance = totalIncome - totalExpense;
    const expenseTrend = prevMonthExpense > 0 ? ((monthExpense - prevMonthExpense) / prevMonthExpense) * 100 : undefined;

    return { totalIncome, totalExpense, balance, monthIncome, monthExpense, byCategory, previousByCategory, expenseTrend };
  }, [transactions]);

  const recent = transactions.slice(0, 6);

  const budgetSummary = useMemo(() =>
    budgets.map((b) => ({
      category: b.category,
      limit: Number(b.limit_amount),
      spent: stats.byCategory[b.category] || 0,
    })),
    [budgets, stats.byCategory]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your finances at a glance."
        actions={
          <Button onClick={() => navigate("/add")}>
            <Plus className="mr-1 h-4 w-4" /> Add transaction
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total balance"
          value={formatCurrency(stats.balance)}
          icon={<Wallet className="h-4 w-4" />}
          accent="primary"
          hint="All-time"
        />
        <StatCard
          label="Income (this month)"
          value={formatCurrency(stats.monthIncome)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Expenses (this month)"
          value={formatCurrency(stats.monthExpense)}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="danger"
          trend={stats.expenseTrend !== undefined ? -stats.expenseTrend : undefined}
          hint={stats.expenseTrend !== undefined ? "vs last month" : undefined}
        />
        <StatCard
          label="Net (this month)"
          value={formatCurrency(stats.monthIncome - stats.monthExpense)}
          accent={stats.monthIncome - stats.monthExpense >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Monthly trend</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <MonthlyTrend transactions={transactions} />
        </div>
        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">By category</h2>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>
          <CategoryPie data={stats.byCategory} />
        </div>
      </div>

      <AiInsightCard
        summary={{
          month: monthKey(new Date()),
          totalIncome: stats.monthIncome,
          totalExpense: stats.monthExpense,
          byCategory: stats.byCategory,
          previousByCategory: stats.previousByCategory,
          budgets: budgetSummary,
        }}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent transactions</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/analytics">View all</Link>
          </Button>
        </div>
        <TransactionList
          transactions={recent}
          loading={loading}
          onUpdate={update}
          onDelete={remove}
          emptyHint="Add your first transaction to see it here."
        />
      </div>
    </div>
  );
};

export default Dashboard;
