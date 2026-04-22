import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { LogOut, User as UserIcon, Hash } from "lucide-react";
import { formatCurrency } from "@/lib/finance";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { transactions } = useTransactions();

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" description="Account details and lifetime summary." />

      <div className="surface-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.email}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{user?.id.slice(0, 8)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <span className="stat-label">Transactions</span>
          <div className="mt-2 font-display text-2xl font-semibold">{transactions.length}</div>
        </div>
        <div className="surface-card p-5">
          <span className="stat-label">Lifetime income</span>
          <div className="mt-2 font-display text-2xl font-semibold text-success">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="surface-card p-5">
          <span className="stat-label">Lifetime expense</span>
          <div className="mt-2 font-display text-2xl font-semibold text-danger">{formatCurrency(totalExpense)}</div>
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-display text-base font-semibold">Session</h3>
        <p className="mt-1 text-sm text-muted-foreground">Sign out of your account on this device.</p>
        <Button variant="outline" className="mt-4" onClick={signOut}>
          <LogOut className="mr-1.5 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
};

export default Profile;
