import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { Transaction } from "@/hooks/useTransactions";
import { formatCurrency, monthKey } from "@/lib/finance";

export const MonthlyTrend = ({ transactions }: { transactions: Transaction[] }) => {
  const months: { key: string; label: string; income: number; expense: number; net: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString(undefined, { month: "short" }),
      income: 0,
      expense: 0,
      net: 0,
    });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const t of transactions) {
    const i = idx.get(monthKey(t.occurred_at));
    if (i === undefined) continue;
    const amt = Number(t.amount);
    if (t.type === "income") months[i].income += amt;
    else months[i].expense += amt;
  }
  for (const m of months) m.net = m.income - m.expense;

  const hasData = months.some((m) => m.income > 0 || m.expense > 0);
  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Add transactions to see trends.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={months} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => formatCurrency(v)}
          />
          <Line type="monotone" dataKey="net" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Net" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
