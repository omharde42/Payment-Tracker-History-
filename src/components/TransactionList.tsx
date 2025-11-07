import { Transaction } from "@/types/transaction";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No transactions yet. Add your first transaction to get started!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const date = new Date(transaction.date);
        const createdAt = new Date(transaction.createdAt);

        return (
          <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-lg">{transaction.personName}</h3>
                  <Badge 
                    variant="default"
                    className={
                      transaction.type === "given" 
                        ? "bg-given text-given-foreground" 
                        : transaction.type === "taken"
                        ? "bg-taken text-taken-foreground"
                        : "bg-left-to-give text-left-to-give-foreground"
                    }
                  >
                    {transaction.type === "given" ? "Give" : transaction.type === "taken" ? "Take" : "Left to Give"}
                  </Badge>
                  {transaction.type === "left_to_give" && (
                    <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                      Not Given
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    <span className="font-medium">{format(date, "dd MMM yyyy")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>{" "}
                    <span className="font-medium">{format(createdAt, "hh:mm a")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>{" "}
                    <span className="font-semibold">₹{transaction.amount.toFixed(2)}</span>
                  </div>
                </div>

                {transaction.note && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Note:</span> {transaction.note}
                  </p>
                )}
              </div>

              <div className="flex gap-2 sm:flex-col">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  className="h-9 w-9"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(transaction.id)}
                  className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
