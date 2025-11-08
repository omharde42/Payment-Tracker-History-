import { useState, useEffect } from "react";
import { Transaction, TransactionType } from "@/types/transaction";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transactionSchema } from "@/schemas/transaction";
import { toast } from "sonner";
import { z } from "zod";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transaction: Omit<Transaction, "id" | "createdAt">) => void;
  editTransaction?: Transaction;
}

export function TransactionForm({ open, onOpenChange, onSubmit, editTransaction }: TransactionFormProps) {
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("given");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editTransaction) {
      setPersonName(editTransaction.personName);
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setNote(editTransaction.note || "");
      setDate(editTransaction.date);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
    }
  }, [editTransaction, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = transactionSchema.parse({
        personName: personName.trim(),
        amount: parseFloat(amount),
        type,
        note: note.trim() || undefined,
        date,
      });

      const transactionData: Omit<Transaction, "id" | "createdAt"> = {
        personName: validated.personName,
        amount: validated.amount,
        type: validated.type,
        note: validated.note,
        date: validated.date,
      };

      onSubmit(transactionData);
      
      // Reset form
      setPersonName("");
      setAmount("");
      setType("given");
      setNote("");
      setDate(new Date().toISOString().split("T")[0]);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the errors in the form");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personName">Person Name</Label>
            <Input
              id="personName"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Enter person's name"
              maxLength={100}
            />
            {errors.personName && (
              <p className="text-sm text-destructive">{errors.personName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: TransactionType) => setType(value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="given">Give</SelectItem>
                  <SelectItem value="taken">Take</SelectItem>
                  <SelectItem value="left_to_give">Left to Give</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              maxLength={500}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editTransaction ? "Update" : "Add"} Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
