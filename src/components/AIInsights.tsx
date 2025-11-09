import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIInsightsProps {
  transactions: Transaction[];
}

export const AIInsights = ({ transactions }: AIInsightsProps) => {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    if (transactions.length === 0) {
      toast.error("No transactions to analyze. Add some transactions first!");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { transactions }
      });

      if (error) throw error;

      setInsights(data.insights);
      toast.success("AI insights generated successfully!");
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
            <p className="text-sm text-muted-foreground">Get personalized financial recommendations</p>
          </div>
        </div>
        <Button 
          onClick={generateInsights} 
          disabled={isLoading || transactions.length === 0}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      {insights ? (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap">
          {insights}
        </div>
      ) : (
        <div className="mt-4 p-8 rounded-lg bg-muted/50 text-center text-muted-foreground">
          Click "Generate Insights" to get AI-powered analysis of your transactions
        </div>
      )}
    </Card>
  );
};
