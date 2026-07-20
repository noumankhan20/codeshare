"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Copy, 
  ExternalLink, 
  Clock, 
  User, 
  Check, 
  Braces, 
  Database, 
  Terminal, 
  Code2, 
  FileText,
  Image as ImageIcon,
  Download,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { supabase, Share } from "@/lib/supabase";

interface ShareCardProps {
  share: Share;
  searchQuery?: string;
}

// Simple language/type detector for badge mapping
function getLanguageInfo(title: string, content: string) {
  if (content.startsWith("data:image/")) {
    return { label: "Photo", icon: ImageIcon, colorClass: "text-pink-600 bg-pink-50 border-pink-200" };
  }

  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerTitle.endsWith(".json") || (content.trim().startsWith("{") && content.trim().endsWith("}"))) {
    return { label: "JSON", icon: Braces, colorClass: "text-amber-700 bg-amber-50 border-amber-200" };
  }
  if (
    lowerTitle.endsWith(".sql") || 
    lowerContent.includes("select ") || 
    lowerContent.includes("insert into") || 
    lowerContent.includes("create table") ||
    lowerContent.includes("update ")
  ) {
    return { label: "SQL", icon: Database, colorClass: "text-blue-700 bg-blue-50 border-blue-200" };
  }
  if (
    lowerTitle.endsWith(".sh") ||
    lowerTitle.endsWith(".bat") ||
    lowerContent.startsWith("npm ") ||
    lowerContent.startsWith("git ") ||
    lowerContent.startsWith("docker ") ||
    lowerContent.startsWith("yarn ") ||
    lowerContent.startsWith("npx ") ||
    lowerContent.startsWith("pip ") ||
    lowerContent.startsWith("cargo ")
  ) {
    return { label: "Shell", icon: Terminal, colorClass: "text-emerald-750 bg-emerald-50 border-emerald-200" };
  }
  if (
    lowerTitle.endsWith(".js") ||
    lowerTitle.endsWith(".ts") ||
    lowerTitle.endsWith(".tsx") ||
    lowerTitle.endsWith(".jsx") ||
    lowerTitle.endsWith(".py") ||
    lowerTitle.endsWith(".go") ||
    lowerTitle.endsWith(".rs") ||
    lowerTitle.endsWith(".yaml") ||
    lowerTitle.endsWith(".yml") ||
    lowerContent.includes("import ") ||
    lowerContent.includes("const ") ||
    lowerContent.includes("function ") ||
    lowerContent.includes("export ") ||
    lowerContent.includes("def ")
  ) {
    return { label: "Code", icon: Code2, colorClass: "text-purple-700 bg-purple-50 border-purple-200" };
  }
  return { label: "Text", icon: FileText, colorClass: "text-stone-600 bg-stone-100 border-stone-200" };
}

// Highlight text helper
function highlightText(text: string, search: string) {
  if (!search.trim()) return <span>{text}</span>;
  
  try {
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="search-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
}

export default function ShareCard({ share, searchQuery = "" }: ShareCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(share.expires_at).getTime() - new Date().getTime();
      if (difference <= 0) {
        return "Expired";
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const nextTime = calculateTimeLeft();
      setTimeLeft(nextTime);
      if (nextTime === "Expired") {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [share.expires_at]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(share.content);
      setCopied(true);
      toast.success("Copied Successfully");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy content");
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const link = document.createElement("a");
      link.href = share.content;
      let extension = "png";
      const match = share.content.match(/^data:image\/(\w+);base64,/);
      if (match) {
        extension = match[1];
      }
      link.download = `${share.title.replace(/[^a-zA-Z0-9]/g, "_") || "image"}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloading image...");
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${share.title}"?`)) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shares")
        .delete()
        .eq("id", share.id)
        .select();

      if (error) {
        console.error("Supabase delete error:", error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        // RLS silently blocked the delete — no policy for DELETE exists
        toast.error("Delete failed: Please add a DELETE policy in Supabase dashboard → Table Editor → shares → RLS Policies.");
        return;
      }

      toast.success("Deleted successfully");
      window.location.reload();
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete: " + err.message);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const diff = new Date().getTime() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "recently";
    }
  };

  const isImage = share.content.startsWith("data:image/");

  const lines = isImage ? [] : share.content.split("\n");
  const previewText = isImage ? "" : lines.slice(0, 4).join("\n");
  const hasMore = !isImage && lines.length > 4;

  const charCount = share.content.length;
  const lineCount = lines.length;

  const langInfo = getLanguageInfo(share.title, share.content);
  const LangIcon = langInfo.icon;

  if (timeLeft === "Expired") {
    return null;
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 transition-all duration-300 hover:border-stone-400 hover:shadow-md hover:shadow-stone-200/50">
      <div>
        {/* Top Meta info */}
        <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-medium text-stone-600">
            <User className="h-3.5 w-3.5 text-stone-400" />
            <span className="truncate max-w-[120px] font-mono">
              {highlightText(share.author, searchQuery)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Lang Badge */}
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono border ${langInfo.colorClass}`}>
              <LangIcon className="h-2.5 w-2.5" />
              <span>{langInfo.label}</span>
            </div>
            {!isImage && (
              <span className="font-mono text-[10px] text-stone-400">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-semibold tracking-tight text-stone-800 transition-colors line-clamp-1 font-mono">
          {highlightText(share.title, searchQuery)}
        </h3>

        {/* Content Preview Container (Code or Image) */}
        {isImage ? (
          <div 
            onClick={handleCopy}
            title="Click to copy Image Data"
            className="relative mt-3 rounded-lg border border-stone-200 bg-stone-50 aspect-video flex items-center justify-center overflow-hidden cursor-pointer hover:border-stone-300"
          >
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900/10 opacity-0 hover:opacity-100 transition-opacity duration-200 z-10">
              <div className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs text-white shadow-lg">
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Data URL</span>
              </div>
            </div>
            {/* Image element */}
            <img 
              src={share.content} 
              alt={share.title} 
              className="object-cover w-full h-full opacity-90 transition-opacity" 
            />
          </div>
        ) : (
          <div 
            onClick={handleCopy}
            title="Click to copy full text"
            className="relative mt-3 rounded-lg border border-stone-200 bg-stone-50/50 p-3 font-mono text-[11px] text-stone-600 hover:text-stone-900 transition-colors cursor-pointer hover:border-stone-350 overflow-hidden"
          >
            {/* Click to copy overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900/5 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center gap-1.5 rounded-lg bg-white border border-stone-200 px-3 py-1.5 text-xs text-stone-850 shadow-md">
                <Copy className="h-3.5 w-3.5" />
                <span>Click to Copy</span>
              </div>
            </div>
            <pre className="overflow-hidden whitespace-pre-wrap break-all line-clamp-4 leading-relaxed">
              {previewText}
              {hasMore && "\n..."}
            </pre>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3">
        {/* Countdown */}
        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
          <Clock className="h-3.5 w-3.5 text-stone-400 animate-pulse" />
          <span className="text-[11px] text-stone-500">
            expires: <span className="text-stone-700 font-medium">{timeLeft || "..."}</span>
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {/* Show download button only if it's an image */}
          {isImage && (
            <button
              onClick={handleDownload}
              title="Download image"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-all hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            title="Delete share"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-red-50 hover:text-red-650 hover:border-red-200 transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleCopy}
            title="Copy content"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-all hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 active:scale-95 cursor-pointer"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          
          <Link
            href={`/share/${share.id}`}
            title="Open full view"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-all hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
