import { useMemo } from "react";
import { Transaction } from "@/types/transaction";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface SpendingChartProps {
  transactions: Transaction[];
}

export function SpendingChart({ transactions }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, "MMM yyyy"),
        monthStart: startOfMonth(date),
        monthEnd: endOfMonth(date),
      };
    });

    return last6Months.map(({ month, monthStart, monthEnd }) => {
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const give = monthTransactions
        .filter((t) => t.type === "given")
        .reduce((sum, t) => sum + t.amount, 0);

      const take = monthTransactions
        .filter((t) => t.type === "taken")
        .reduce((sum, t) => sum + t.amount, 0);

      const leftToGive = monthTransactions
        .filter((t) => t.type === "left_to_give")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month,
        Give: parseFloat(give.toFixed(2)),
        Take: parseFloat(take.toFixed(2)),
        "Left to Give": parseFloat(leftToGive.toFixed(2)),
      };
    });
  }, [transactions]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Last 6 Months Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          <Bar dataKey="Give" fill="hsl(var(--given))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Take" fill="hsl(var(--taken))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Left to Give" fill="hsl(var(--left-to-give))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
