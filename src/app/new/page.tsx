"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CornerDownLeft, Loader2, ArrowLeft, Image as ImageIcon, Trash2, Sparkles, Clock } from "lucide-react";
import Link from "next/link";

export default function NewSharePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Custom states for photo support
  const [isPhoto, setIsPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Auto-detect title from the first line of content if title is empty
  const handleContentChange = (val: string) => {
    setContent(val);
    
    // Auto-generate title if empty
    if (!title.trim() && val.trim() && !isPhoto) {
      const firstLine = val.split("\n")[0].trim();
      let cleanTitle = firstLine
        .replace(/^(\/\/|\/\*|\*|#|<!--|--)\s*/, "")
        .replace(/\s*(\*\/|-->)$/, "")
        .trim();

      if (cleanTitle.length > 50) {
        cleanTitle = cleanTitle.substring(0, 47) + "...";
      }

      if (cleanTitle.length > 3) {
        setTitle(cleanTitle);
      }
    }
  };

  const processPhoto = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please upload an image.");
      return;
    }

    // Limit image size to 4MB for Base64 storage
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image size is too large. Max size is 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setPhotoPreview(result);
        setContent(result); // Base64 data URL goes to content
        setIsPhoto(true);
        
        // Auto set title to filename if empty
        if (!title.trim()) {
          setTitle(file.name);
        }
        toast.success(`Photo uploaded: ${file.name} (Expiring in 15 mins)`);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        processPhoto(file);
      } else {
        toast.error("Please drop an image file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processPhoto(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setContent("");
    setIsPhoto(false);
    toast.info("Photo removed. Switched to code mode.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !author.trim() || !content.trim()) {
      toast.error("Please fill in all fields before sharing");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      // Photos expire in 15 minutes, normal code pastes in 24 hours
      const expiryMinutes = isPhoto ? 15 : 24 * 60;
      const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

      const { error } = await supabase.from("shares").insert([
        {
          title: title.trim(),
          author: author.trim(),
          content: content.trim(),
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Shared successfully");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Error creating share:", err);
      toast.error(err.message || "Failed to create share. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Content counters
  const charCount = content.length;
  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const lineCount = content === "" ? 0 : content.split("\n").length;

  return (
    <div className="flex min-h-screen flex-col radial-dark-bg">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors font-mono mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>back_to_board</span>
        </Link>

        {/* Title Section */}
        <div className="mb-8 font-mono">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            share_something_new
          </h1>
          <p className="text-xs text-zinc-550 mt-1">
            Share code snippets (expires in 24h) or photos/mockups (expires in 15m).
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields Row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
                <span>Title</span>
                <span className="text-red-500">*</span>
                {!isPhoto && (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 font-sans">
                    <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                    <span>Auto-detect</span>
                  </span>
                )}
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isPhoto ? "e.g. Layout mockup, error screenshot" : "e.g. Auth middleware, docker-compose"}
                className="w-full rounded-lg border border-zinc-205 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="author" className="text-xs font-mono text-zinc-500">
                Author / Handle <span className="text-red-500">*</span>
              </label>
              <input
                id="author"
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. sarah_dev, alex"
                className="w-full rounded-lg border border-zinc-205 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Text/Photo Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="text-xs font-mono text-zinc-500">
                {isPhoto ? "Photo Preview" : "Content / Snippet"} <span className="text-red-500">*</span>
              </label>

              {/* Photo Upload Actions */}
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {isPhoto ? (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 hover:bg-red-100 text-[10px] text-red-650 font-mono px-2 py-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove Photo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[10px] text-zinc-650 font-mono px-2.5 py-1 transition-all cursor-pointer shadow-sm"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Upload Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content Field: conditional display */}
            {isPhoto && photoPreview ? (
              <div className="relative rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 flex flex-col items-center justify-center min-h-[250px] shadow-sm">
                <div className="relative max-h-[300px] rounded-lg overflow-hidden border border-zinc-200 bg-white max-w-full shadow-sm">
                  <img src={photoPreview} alt="Upload preview" className="object-contain max-h-[280px]" />
                </div>
                {/* Visual notice about 15m expiration */}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-200 px-3 py-1 font-mono text-[10px] text-pink-650">
                  <Clock className="h-3 w-3" />
                  <span>Photo detected — Auto-deletes after 15 minutes</span>
                </div>
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-lg border transition-all ${
                  isDragging 
                    ? "border-zinc-400 bg-zinc-100/50" 
                    : "border-zinc-200 bg-zinc-50/30"
                }`}
              >
                {isDragging && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-lg pointer-events-none z-10">
                    <ImageIcon className="h-8 w-8 text-zinc-400 animate-bounce" />
                    <span className="text-xs text-zinc-600 mt-2 font-mono">Drop image file here</span>
                  </div>
                )}
                <textarea
                  id="content"
                  required
                  rows={12}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Paste your code snippet, query or drag & drop a photo here..."
                  className="w-full bg-transparent p-4 font-mono text-xs text-zinc-800 placeholder-zinc-400 transition-all focus:outline-none resize-y min-h-[250px] block"
                />
              </div>
            )}
            
            {/* Word / Line counters */}
            {!isPhoto && (
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
                <span>You can drag & drop an image directly to upload</span>
                <div className="flex gap-3 text-zinc-500">
                  <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                  <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                  <span>{charCount} chars</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-550 transition-all hover:bg-zinc-100 hover:text-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-zinc-850 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <span>Create Share</span>
                  <CornerDownLeft className="h-3 w-3 opacity-60" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
