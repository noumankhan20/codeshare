import Header from "@/components/Header";
import ShareList from "@/components/ShareList";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getShares() {
  try {
    const { data, error } = await supabase
      .from("shares")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shares from Supabase:", error);
      return { shares: [], error: error.message };
    }

    return { shares: data || [], error: null };
  } catch (err: any) {
    console.error("Unexpected error fetching shares:", err);
    return { shares: [], error: err.message || "Failed to load shares" };
  }
}

export default async function Home() {
  const { shares, error } = await getShares();

  return (
    <div className="flex min-h-screen flex-col radial-dark-bg">
      {/* Sticky Navigation */}
      <Header />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Banner / Title Area */}
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Active Clipboard
          </h1>
          <p className="text-sm text-zinc-550">
            A temporary board for sharing snippets, queries, and logs. Items automatically self-destruct after 24 hours.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Database Connection Error</p>
              <p className="text-xs text-red-400/80 mt-1">
                Could not connect to Supabase: {error}. Please verify your environment variables and database table schema.
              </p>
            </div>
          </div>
        )}

        {/* Share list handles dynamic rendering, filtering & search */}
        <ShareList initialShares={shares} />
      </main>
    </div>
  );
}
