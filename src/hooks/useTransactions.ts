import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/transaction";
import { toast } from "sonner";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data.map((t) => ({
        id: t.id,
        personName: t.person_name,
        amount: Number(t.amount),
        type: t.type as Transaction["type"],
        note: t.note || undefined,
        date: t.date,
        createdAt: t.created_at,
      }));

      setTransactions(formatted);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTransaction = async (transactionData: Omit<Transaction, "id" | "createdAt">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        person_name: transactionData.personName,
        amount: transactionData.amount,
        type: transactionData.type,
        note: transactionData.note,
        date: transactionData.date,
      });

      if (error) throw error;
      toast.success("Transaction added successfully!");
      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
      return false;
    }
  };

  const updateTransaction = async (id: string, transactionData: Omit<Transaction, "id" | "createdAt">) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          person_name: transactionData.personName,
          amount: transactionData.amount,
          type: transactionData.type,
          note: transactionData.note,
          date: transactionData.date,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Transaction updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
      return false;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);

      if (error) throw error;
      toast.success("Transaction deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
      return false;
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
};
