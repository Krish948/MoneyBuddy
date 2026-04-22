import { useState } from "react";
import { Pencil, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TransactionForm } from "./TransactionForm";
import type { Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/finance";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  loading?: boolean;
  onUpdate: (id: string, patch: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  emptyHint?: string;
}

export const TransactionList = ({ transactions, loading, onUpdate, onDelete, emptyHint }: Props) => {
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (loading) {
    return (
      <div className="surface-card p-8 text-center text-sm text-muted-foreground">Loading transactions…</div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyHint ?? "No transactions yet."}</p>
      </div>
    );
  }

  return (
    <div className="surface-card divide-y overflow-hidden">
      {transactions.map((t) => {
        const isIncome = t.type === "income";
        return (
          <div key={t.id} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                isIncome ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
              )}
            >
              {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{t.category}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{format(new Date(t.occurred_at), "MMM d, yyyy")}</span>
              </div>
              {t.note && <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.note}</p>}
            </div>

            <div className={cn("font-mono text-sm font-semibold tabular-nums", isIncome ? "text-success" : "text-foreground")}>
              {isIncome ? "+" : "−"}{formatCurrency(Number(t.amount))}
            </div>

            <div className="flex items-center gap-1">
              <Dialog open={editing?.id === t.id} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit transaction</DialogTitle>
                  </DialogHeader>
                  {editing && (
                    <TransactionForm
                      initial={editing}
                      onCancel={() => setEditing(null)}
                      onSubmit={async (values) => {
                        await onUpdate(editing.id, values);
                        setEditing(null);
                        toast.success("Transaction updated");
                      }}
                      submitLabel="Save changes"
                    />
                  )}
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await onDelete(t.id);
                        toast.success("Transaction deleted");
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
};
