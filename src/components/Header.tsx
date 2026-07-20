import Link from "next/link";
import { Terminal, Plus } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight text-zinc-800 transition-colors hover:text-black"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200">
            <Terminal className="h-4 w-4 text-zinc-500" />
          </div>
          <span>
            code<span className="text-zinc-400">_</span>share
          </span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 border border-zinc-200">
            v1.0
          </span>
        </Link>

        {/* Action Button */}
        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Share</span>
        </Link>
      </div>
    </header>
  );
}
