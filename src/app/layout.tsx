import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeShare - Dev Shared Clipboard",
  description: "Temporary sharing board for development teams. Expire in 24 hours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-zinc-200 selection:text-zinc-800">
        <Toaster position="bottom-right" theme="light" toastOptions={{
          style: {
            background: "#ffffff",
            border: "1px solid #e7e5e4",
            color: "#1c1917"
          }
        }} />
        {children}
      </body>
    </html>
  );
}
