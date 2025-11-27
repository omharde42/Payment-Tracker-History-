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

  const totalLeftToGive = transactions
    .filter((t) => t.type === "left_to_give")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-given/10 to-given/5 border-given/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Give</p>
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
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Taken/Left to Take</p>
            <p className="text-2xl font-bold text-taken">₹{totalTaken.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-taken/20 flex items-center justify-center">
            <ArrowDownRight className="h-6 w-6 text-taken" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-left-to-give/10 to-left-to-give/5 border-left-to-give/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Left to Give</p>
            <p className="text-2xl font-bold text-left-to-give">₹{totalLeftToGive.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-left-to-give/20 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6 text-left-to-give" />
          </div>
        </div>
      </Card>
    </div>
  );
}
