import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.103.3/cors";

interface InsightRequest {
  summary: {
    month: string;
    totalIncome: number;
    totalExpense: number;
    byCategory: Record<string, number>;
    previousByCategory: Record<string, number>;
    budgets: Array<{ category: string; limit: number; spent: number }>;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { summary } = (await req.json()) as InsightRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a friendly personal finance coach. Analyze this monthly spending snapshot and produce a concise narrative (3 short paragraphs max, plain text, no markdown headings).

Month: ${summary.month}
Total income: $${summary.totalIncome.toFixed(2)}
Total expense: $${summary.totalExpense.toFixed(2)}
Net: $${(summary.totalIncome - summary.totalExpense).toFixed(2)}

Spending by category this month:
${Object.entries(summary.byCategory).map(([c, v]) => `- ${c}: $${v.toFixed(2)}`).join("\n") || "- (none)"}

Spending by category last month:
${Object.entries(summary.previousByCategory).map(([c, v]) => `- ${c}: $${v.toFixed(2)}`).join("\n") || "- (none)"}

Budgets:
${summary.budgets.map((b) => `- ${b.category}: $${b.spent.toFixed(2)} / $${b.limit.toFixed(2)}`).join("\n") || "- (none set)"}

Write 1) a quick overview of the month, 2) the most notable change vs last month with % difference, 3) one specific actionable suggestion. Keep it warm, direct, under 120 words total.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a concise, helpful personal finance coach." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI gateway error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const narrative = data.choices?.[0]?.message?.content ?? "No insight generated.";

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
