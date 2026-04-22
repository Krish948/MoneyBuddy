import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { monthStartIso } from "@/lib/finance";

export type Budget = Tables<"budgets">;

export const useBudgets = (month: Date = new Date()) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const monthIso = monthStartIso(month);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", monthIso)
      .order("category");
    if (!error && data) setBudgets(data);
    setLoading(false);
  }, [user, monthIso]);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    fetchAll();

    const channel = supabase
      .channel(`budgets-realtime-${monthIso}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets", filter: `user_id=eq.${user.id}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAll, monthIso]);

  const upsert = async (category: string, limit_amount: number) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("budgets")
      .upsert(
        { user_id: user.id, category, limit_amount, month: monthIso },
        { onConflict: "user_id,category,month" }
      );
    if (error) throw error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw error;
  };

  return { budgets, loading, upsert, remove, refetch: fetchAll, monthIso };
};
