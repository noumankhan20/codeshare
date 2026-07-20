"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Clock, 
  User, 
  Calendar, 
  WrapText, 
  ZoomIn, 
  ZoomOut, 
  Image as ImageIcon, 
  Download, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { supabase, Share } from "@/lib/supabase";

interface ShareViewClientProps {
  share: Share;
}

type FontSize = "xs" | "sm" | "base";

export default function ShareViewClient({ share }: ShareViewClientProps) {
  const router = useRouter();
  
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [wrapContent, setWrapContent] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>("sm");
  
  // Edit state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(share.title);
  const [editContent, setEditContent] = useState(share.content);
  const [isSaving, setIsSaving] = useState(false);

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
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [share.expires_at]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(share.content);
      setCopied(true);
      toast.success("Copied Successfully");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy content");
    }
  };

  const handleDownload = () => {
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

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this share?`)) {
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
        toast.error("Delete failed: Please add a DELETE policy in your Supabase dashboard → Table Editor → shares → RLS Policies.");
        return;
      }

      toast.success("Deleted successfully");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Title and Content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("shares")
        .update({
          title: editTitle.trim(),
          content: editContent.trim()
        })
        .eq("id", share.id);

      if (error) throw new Error(error.message);
      toast.success("Saved successfully");
      setIsEditing(false);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to update: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = new Date(share.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const isImage = share.content.startsWith("data:image/");
  const lines = isImage ? [] : share.content.split("\n");

  const fontSizes = {
    xs: "text-[11px] leading-relaxed",
    sm: "text-xs leading-relaxed",
    base: "text-sm leading-relaxed",
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors font-mono"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>back_to_board</span>
        </Link>

        {/* Expiry Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 font-mono text-[11px] text-stone-600 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-stone-400 animate-pulse" />
          <span>expires_in: <span className="text-stone-800 font-semibold">{timeLeft || "calculating..."}</span></span>
        </div>
      </div>

      {/* Share Meta Title Info */}
      <div className="space-y-3 border-b border-stone-200 pb-5">
        {isEditing ? (
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-stone-400">Edit Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base font-mono text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-sm"
            />
          </div>
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-stone-850 font-mono break-all">
            {share.title}
          </h1>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
            <div className="flex items-center gap-1.5 font-mono">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span>shared_by: <span className="text-stone-700 font-medium">{share.author}</span></span>
            </div>
            <div className="hidden sm:block text-stone-300">•</div>
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span>created_at: <span className="text-stone-700 font-medium">{formattedDate}</span></span>
            </div>
          </div>

          {/* Action buttons (Edit, Delete) */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-white transition-all hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(share.title);
                    setEditContent(share.content);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-50 cursor-pointer shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 cursor-pointer shadow-sm"
                >
                  <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      {isImage ? (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-md">
          {/* Header Controls */}
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-mono text-stone-500">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-pink-600" />
              <span>photo_viewer</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-95 cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Photo</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-95 cursor-pointer shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-650">Copied Data</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Image Data</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Photo Frame Container */}
          <div className="p-4 sm:p-8 flex items-center justify-center bg-stone-100/50 min-h-[350px]">
            <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-white max-w-full shadow-md">
              <img 
                src={share.content} 
                alt={share.title} 
                className="max-w-full max-h-[75vh] object-contain block select-text" 
              />
            </div>
          </div>
        </div>
      ) : (
        /* Main Code/Text View Card */
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-md">
          {/* Code Block Header Controls */}
          <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs font-mono text-stone-500">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                <span>code_block ({lines.length} lines)</span>
              </div>

              {/* Config controls */}
              <div className="flex items-center gap-1.5 border-l border-stone-200 pl-4">
                {/* Word wrap button */}
                <button
                  onClick={() => setWrapContent(!wrapContent)}
                  title={wrapContent ? "Disable Word Wrap" : "Enable Word Wrap"}
                  className={`p-1.5 rounded hover:bg-stone-100 transition-colors cursor-pointer ${
                    wrapContent ? "text-stone-850 bg-stone-200" : "text-stone-400"
                  }`}
                >
                  <WrapText className="h-3.5 w-3.5" />
                </button>

                {/* Font Sizing control */}
                <button
                  onClick={() => setFontSize(fontSize === "xs" ? "sm" : fontSize === "sm" ? "base" : "xs")}
                  title="Toggle Font Size"
                  className="flex items-center gap-1 p-1.5 rounded hover:bg-stone-100 transition-colors text-stone-400 cursor-pointer"
                >
                  {fontSize === "xs" ? (
                    <ZoomIn className="h-3.5 w-3.5" />
                  ) : (
                    <ZoomOut className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[10px] uppercase font-bold">{fontSize}</span>
                </button>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-95 cursor-pointer w-full sm:w-auto shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Content</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Conditional content editing view */}
          {isEditing ? (
            <div className="p-4 bg-stone-50/20">
              <label className="text-[10px] font-mono text-stone-400">Edit Code / Snippet</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={16}
                className="w-full bg-white p-4 font-mono text-xs text-zinc-900 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 resize-y min-h-[300px]"
              />
            </div>
          ) : (
            /* Text Area Code Container with aligned line numbers */
            <div className="overflow-auto max-h-[70vh] bg-stone-50/20 py-4 scrollbar-thin">
              <div className={`font-mono ${fontSizes[fontSize]} select-none`}>
                {lines.map((line, index) => (
                  <div 
                    key={index} 
                    className="group/line flex hover:bg-stone-100/50 transition-colors min-h-[1.5rem]"
                  >
                    {/* Line number gutter */}
                    <div className="select-none text-right text-stone-400 group-hover/line:text-stone-500 pr-4 border-r border-stone-200/50 min-w-[3.5rem] shrink-0 text-[10px] pt-[2px] transition-colors bg-stone-50/40">
                      {index + 1}
                    </div>
                    {/* Line content */}
                    <pre className={`pl-4 pr-6 select-text text-stone-850 leading-normal ${
                      wrapContent ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-visible"
                    }`}>
                      {line || " "}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
