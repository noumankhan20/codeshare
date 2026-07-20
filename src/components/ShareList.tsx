"use client";

import { useState } from "react";
import { Search, ClipboardList, Info } from "lucide-react";
import ShareCard from "./ShareCard";
import { Share } from "@/lib/supabase";

interface ShareListProps {
  initialShares: Share[];
}

export default function ShareList({ initialShares }: ShareListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShares = initialShares.filter((share) => {
    const isExpired = new Date(share.expires_at).getTime() < new Date().getTime();
    if (isExpired) return false;

    const query = searchQuery.toLowerCase();
    return (
      share.title.toLowerCase().includes(query) ||
      share.author.toLowerCase().includes(query) ||
      share.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Input Container */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search shares by title, author, or content..."
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3.5 pr-4 pl-11 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-sm"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            clear
          </button>
        ) : (
          <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[10px] font-mono text-zinc-500 border border-zinc-200 rounded px-1.5 py-0.5 bg-zinc-50">
            <span>search matches instantly</span>
          </div>
        )}
      </div>

      {/* Helper text when typing */}
      {searchQuery && filteredShares.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
          <Info className="h-3.5 w-3.5 text-zinc-400" />
          <span>Found {filteredShares.length} matching {filteredShares.length === 1 ? 'share' : 'shares'}</span>
        </div>
      )}

      {/* Grid List */}
      {filteredShares.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {filteredShares.map((share) => (
            <ShareCard key={share.id} share={share} searchQuery={searchQuery} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-12 text-center bg-zinc-50/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200">
            <ClipboardList className="h-5 w-5 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-800">No active shares found</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-xs">
            {searchQuery 
              ? "No shares match your search query. Try typing something else." 
              : "Paste code snippets, SQL queries, or notes using the 'New Share' button above."
            }
          </p>
        </div>
      )}
    </div>
  );
}
