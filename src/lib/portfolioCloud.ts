import type { PortfolioState } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function pushPortfolio(state: PortfolioState) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("dlta_portfolios")
    .upsert(
      {
        user_id: session.user.id,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}

export async function pullPortfolio(): Promise<PortfolioState | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("dlta_portfolios")
    .select("state")
    .eq("user_id", session.user.id)
    .limit(1);

  if (error) throw error;
  const row = data?.[0];
  return (row?.state as PortfolioState) ?? null;
}
