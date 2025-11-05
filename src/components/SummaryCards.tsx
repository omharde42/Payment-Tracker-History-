import { Transaction } from "@/types/transaction";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";

interface SummaryCardsProps {
  transactions: Transaction[];
}

export function SummaryCards({ transactions }: SummaryCardsProps) {
  const totalGiven = transactions
    .filter((t) => t.type === "given")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTaken = transactions
    .filter((t) => t.type === "taken")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPending = transactions.reduce((sum, t) => sum + t.pendingAmount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-given/10 to-given/5 border-given/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Given</p>
            <p className="text-2xl font-bold text-given">₹{totalGiven.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-given/20 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 text-given" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-taken/10 to-taken/5 border-taken/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Taken</p>
            <p className="text-2xl font-bold text-taken">₹{totalTaken.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-taken/20 flex items-center justify-center">
            <ArrowDownRight className="h-6 w-6 text-taken" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-pending/10 to-pending/5 border-pending/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-pending">₹{totalPending.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-pending/20 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-pending" />
          </div>
        </div>
      </Card>
    </div>
  );
}
