import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import ShareViewClient from "./ShareViewClient";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getShare(id: string) {
  try {
    const { data, error } = await supabase
      .from("shares")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Error or not found share:", error);
      return null;
    }

    // Check if expired
    const isExpired = new Date(data.expires_at).getTime() < new Date().getTime();
    if (isExpired) {
      return null;
    }

    return data;
  } catch (err) {
    console.error("Failed to fetch share:", err);
    return null;
  }
}

export default async function ShareDetailPage({ params }: SharePageProps) {
  const resolvedParams = await params;
  const share = await getShare(resolvedParams.id);

  if (!share) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col radial-dark-bg">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <ShareViewClient share={share} />
      </main>
    </div>
  );
}
