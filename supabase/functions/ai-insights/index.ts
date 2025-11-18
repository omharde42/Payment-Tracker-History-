import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transactions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          insights: "No transactions found to analyze. Start adding transactions to get personalized insights!" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare transaction summary for AI
    const summary = {
      totalTransactions: transactions.length,
      totalGiven: transactions.filter((t: any) => t.type === "given").reduce((sum: number, t: any) => sum + t.amount, 0),
      totalTaken: transactions.filter((t: any) => t.type === "taken").reduce((sum: number, t: any) => sum + t.amount, 0),
      totalLeftToGive: transactions.filter((t: any) => t.type === "left_to_give").reduce((sum: number, t: any) => sum + t.amount, 0),
      recentTransactions: transactions.slice(0, 10).map((t: any) => ({
        person: t.personName,
        amount: t.amount,
        type: t.type,
        date: t.date
      }))
    };

    const systemPrompt = `You are a financial advisor analyzing personal transaction data. Provide clear, actionable insights about spending patterns, trends, and recommendations. Be concise and helpful.`;

    const userPrompt = `Analyze these transaction patterns and provide insights:

Total Transactions: ${summary.totalTransactions}
Total Given: ₹${summary.totalGiven.toFixed(2)}
Total Taken: ₹${summary.totalTaken.toFixed(2)}
Total Left to Give: ₹${summary.totalLeftToGive.toFixed(2)}

Recent transactions (up to 10):
${summary.recentTransactions.map((t: any) => `- ${t.person}: ₹${t.amount} (${t.type}) on ${t.date}`).join('\n')}

Please provide:
1. Key spending patterns or trends you notice
2. Financial health assessment (are they giving more than taking, or vice versa?)
3. 3-4 specific actionable recommendations
4. Any red flags or areas of concern

Keep your response structured and easy to read with clear sections.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
