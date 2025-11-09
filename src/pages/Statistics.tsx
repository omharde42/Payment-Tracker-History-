import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { Transaction } from "@/types/transaction";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AIInsights } from "@/components/AIInsights";
import { ArrowLeft, TrendingUp, Users, Calendar, Wallet, Loader2, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const Statistics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    // Top people by total transaction amount
    const peopleMap = new Map<string, { given: number; taken: number; leftToGive: number; total: number; count: number }>();
    
    transactions.forEach((t) => {
      const existing = peopleMap.get(t.personName) || { given: 0, taken: 0, leftToGive: 0, total: 0, count: 0 };
      
      if (t.type === "given") {
        existing.given += t.amount;
      } else if (t.type === "taken") {
        existing.taken += t.amount;
      } else {
        existing.leftToGive += t.amount;
      }
      
      existing.total += t.amount;
      existing.count += 1;
      peopleMap.set(t.personName, existing);
    });

    const topPeople = Array.from(peopleMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Monthly trends (last 12 months)
    const monthlyData = new Map<string, { given: number; taken: number; leftToGive: number }>();
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(date, "MMM yyyy");
      monthlyData.set(key, { given: 0, taken: 0, leftToGive: 0 });
    }

    transactions.forEach((t) => {
      const date = parseISO(t.date);
      const key = format(date, "MMM yyyy");
      const existing = monthlyData.get(key);
      
      if (existing) {
        if (t.type === "given") {
          existing.given += t.amount;
        } else if (t.type === "taken") {
          existing.taken += t.amount;
        } else {
          existing.leftToGive += t.amount;
        }
      }
    });

    const monthlyTrends = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      Given: data.given,
      Taken: data.taken,
      "Left to Give": data.leftToGive,
    }));

    // Transaction type distribution
    const typeDistribution = {
      given: transactions.filter(t => t.type === "given").reduce((sum, t) => sum + t.amount, 0),
      taken: transactions.filter(t => t.type === "taken").reduce((sum, t) => sum + t.amount, 0),
      leftToGive: transactions.filter(t => t.type === "left_to_give").reduce((sum, t) => sum + t.amount, 0),
    };

    const distributionData = [
      { name: "Given", value: typeDistribution.given, color: "hsl(var(--given))" },
      { name: "Taken", value: typeDistribution.taken, color: "hsl(var(--taken))" },
      { name: "Left to Give", value: typeDistribution.leftToGive, color: "hsl(var(--left-to-give))" },
    ].filter(item => item.value > 0);

    // Transaction patterns
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    const givenCount = transactions.filter(t => t.type === "given").length;
    const takenCount = transactions.filter(t => t.type === "taken").length;
    const leftToGiveCount = transactions.filter(t => t.type === "left_to_give").length;

    return {
      topPeople,
      monthlyTrends,
      distributionData,
      totalTransactions,
      totalAmount,
      averageAmount,
      givenCount,
      takenCount,
      leftToGiveCount,
      totalGiven: typeDistribution.given,
      totalTaken: typeDistribution.taken,
      totalLeftToGive: typeDistribution.leftToGive,
    };
  }, [transactions]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Statistics & Analytics</h1>
                <p className="text-muted-foreground">Detailed insights into your transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <AIInsights transactions={transactions} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{stats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Amount</p>
                <p className="text-2xl font-bold">₹{stats.averageAmount.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique People</p>
                <p className="text-2xl font-bold">{stats.topPeople.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transaction Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Transaction Distribution</h2>
            {stats.distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No transaction data available
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Transaction Breakdown</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-lg bg-given/10">
                <div>
                  <p className="text-sm text-muted-foreground">Given</p>
                  <p className="text-2xl font-bold">₹{stats.totalGiven.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-xl font-semibold">{stats.givenCount}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg bg-taken/10">
                <div>
                  <p className="text-sm text-muted-foreground">Taken</p>
                  <p className="text-2xl font-bold">₹{stats.totalTaken.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-xl font-semibold">{stats.takenCount}</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg bg-left-to-give/10">
                <div>
                  <p className="text-sm text-muted-foreground">Left to Give</p>
                  <p className="text-2xl font-bold">₹{stats.totalLeftToGive.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-xl font-semibold">{stats.leftToGiveCount}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Monthly Trends (Last 12 Months)</h2>
          {stats.monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stats.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Given" stroke="hsl(var(--given))" strokeWidth={2} />
                <Line type="monotone" dataKey="Taken" stroke="hsl(var(--taken))" strokeWidth={2} />
                <Line type="monotone" dataKey="Left to Give" stroke="hsl(var(--left-to-give))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No monthly data available
            </div>
          )}
        </Card>

        {/* Top People by Transaction Amount */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top People by Total Amount</h2>
          {stats.topPeople.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.topPeople}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => `₹${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Bar dataKey="given" name="Given" fill="hsl(var(--given))" />
                  <Bar dataKey="taken" name="Taken" fill="hsl(var(--taken))" />
                  <Bar dataKey="leftToGive" name="Left to Give" fill="hsl(var(--left-to-give))" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {stats.topPeople.map((person, index) => (
                  <div key={person.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{person.name}</p>
                        <p className="text-sm text-muted-foreground">{person.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{person.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        G: ₹{person.given.toFixed(0)} | T: ₹{person.taken.toFixed(0)} | L: ₹{person.leftToGive.toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No transaction data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
