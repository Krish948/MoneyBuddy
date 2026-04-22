import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import type { Transaction } from "@/hooks/useTransactions";
import { formatCurrency, monthKey } from "@/lib/finance";

export const IncomeVsExpenseBar = ({ transactions }: { transactions: Transaction[] }) => {
  const months: { key: string; label: string; income: number; expense: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: d.toLocaleString(undefined, { month: "short" }), income: 0, expense: 0 });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const t of transactions) {
    const i = idx.get(monthKey(t.occurred_at));
    if (i === undefined) continue;
    const amt = Number(t.amount);
    if (t.type === "income") months[i].income += amt;
    else months[i].expense += amt;
  }

  const hasData = months.some((m) => m.income > 0 || m.expense > 0);
  if (!hasData) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data yet.</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={months} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => formatCurrency(v)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Income" />
          <Bar dataKey="expense" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
