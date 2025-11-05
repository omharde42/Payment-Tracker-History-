import { useState, useMemo } from "react";
import { Transaction } from "@/types/transaction";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { SummaryCards } from "@/components/SummaryCards";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { exportToPDF } from "@/utils/pdfExport";
import { toast } from "sonner";

const Index = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("finance-transactions", []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), "yyyy-MM"));

  // Get unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(format(new Date(), "yyyy-MM")); // Always include current month
    
    transactions.forEach((t) => {
      const month = format(parseISO(t.date), "yyyy-MM");
      months.add(month);
    });

    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));

    return transactions
      .filter((t) => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, selectedMonth]);

  const handleAddTransaction = (transactionData: Omit<Transaction, "id" | "createdAt">) => {
    if (editingTransaction) {
      // Update existing transaction
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id
            ? { ...transactionData, id: t.id, createdAt: t.createdAt }
            : t
        )
      );
      toast.success("Transaction updated successfully!");
      setEditingTransaction(undefined);
    } else {
      // Add new transaction
      const newTransaction: Transaction = {
        ...transactionData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [...prev, newTransaction]);
      toast.success("Transaction added successfully!");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transaction deleted successfully!");
    }
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export for this month!");
      return;
    }
    
    const monthYear = format(parseISO(selectedMonth + "-01"), "MMMM yyyy");
    exportToPDF(filteredTransactions, monthYear);
    toast.success("PDF exported successfully!");
  };

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingTransaction(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Finance Tracker</h1>
              <p className="text-muted-foreground">Track your given and taken transactions</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8">
          <SummaryCards transactions={filteredTransactions} />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(month + "-01"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Transaction List */}
        <TransactionList
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Transaction Form Modal */}
        <TransactionForm
          open={isFormOpen}
          onOpenChange={handleFormOpenChange}
          onSubmit={handleAddTransaction}
          editTransaction={editingTransaction}
        />
      </div>
    </div>
  );
};

export default Index;
