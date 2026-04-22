import { useNavigate } from "react-router-dom";
import { TransactionForm } from "@/components/TransactionForm";
import { useTransactions } from "@/hooks/useTransactions";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

const AddTransaction = () => {
  const { add } = useTransactions();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add transaction" description="Log income or an expense." />
      <div className="surface-card p-6">
        <TransactionForm
          submitLabel="Add transaction"
          onSubmit={async (values) => {
            await add({
              amount: values.amount,
              category: values.category,
              type: values.type,
              note: values.note,
              occurred_at: values.occurred_at,
            });
            toast.success("Transaction added");
            navigate("/");
          }}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

export default AddTransaction;
