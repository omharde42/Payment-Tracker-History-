import { useState, useMemo, useRef } from "react";
import { Transaction, TransactionType } from "@/types/transaction";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { SummaryCards } from "@/components/SummaryCards";
import { SpendingChart } from "@/components/SpendingChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Upload, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { exportToPDF } from "@/utils/pdfExport";
import { toast } from "sonner";
import { transactionSchema } from "@/schemas/transaction";
import { z } from "zod";

const Index = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("finance-transactions", []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), "yyyy-MM"));
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Filter transactions by selected month and type
  const filteredTransactions = useMemo(() => {
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));

    return transactions
      .filter((t) => {
        const transactionDate = parseISO(t.date);
        const isInMonth = transactionDate >= monthStart && transactionDate <= monthEnd;
        const matchesType = typeFilter === "all" || t.type === typeFilter;
        return isInMonth && matchesType;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, selectedMonth, typeFilter]);

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

  const handleExportJSON = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export!");
      return;
    }

    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(importedData)) {
          toast.error("Invalid file format: Expected an array of transactions");
          return;
        }

        // Validate each transaction
        const validatedTransactions: Transaction[] = [];
        const errors: string[] = [];

        importedData.forEach((item, index) => {
          try {
            // Validate core transaction data
            const validated = transactionSchema.parse({
              personName: item.personName,
              amount: item.amount,
              type: item.type,
              note: item.note,
              date: item.date,
            });

            // Add with existing or new ID
            validatedTransactions.push({
              personName: validated.personName,
              amount: validated.amount,
              type: validated.type,
              note: validated.note,
              date: validated.date,
              id: item.id || crypto.randomUUID(),
              createdAt: item.createdAt || new Date().toISOString(),
            });
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push(`Transaction ${index + 1}: ${error.errors[0].message}`);
            }
          }
        });

        if (errors.length > 0) {
          toast.error(`Import failed with ${errors.length} error(s). First error: ${errors[0]}`);
          return;
        }

        if (validatedTransactions.length === 0) {
          toast.error("No valid transactions found in file");
          return;
        }

        if (confirm(`Import ${validatedTransactions.length} transactions? This will replace all existing data.`)) {
          setTransactions(validatedTransactions);
          toast.success(`Successfully imported ${validatedTransactions.length} transactions!`);
        }
      } catch (error) {
        toast.error("Failed to parse JSON file. Please check the file format.");
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Finance Tracker</h1>
                <p className="text-muted-foreground">Track your give and take transactions</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8">
          <SummaryCards transactions={filteredTransactions} />
        </div>

        {/* Spending Chart */}
        <div className="mb-8">
          <SpendingChart transactions={transactions} />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="month"
              aria-label="Select month and year"
              className="w-full sm:w-[200px]"
              min="2000-01"
              max="2045-12"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | "all")}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="given">Give</SelectItem>
                <SelectItem value="taken">Take</SelectItem>
                <SelectItem value="left_to_give">Left to Give</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={handleExportJSON} variant="outline" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 sm:flex-none">
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
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
