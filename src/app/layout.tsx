import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "React Forge — Générateur de projets React par IA",
  description:
    "Décris ton application, configure ta stack (Vite/Next, TypeScript, Tailwind, Router, Zustand, shadcn/ui), et l'IA génère un projet React complet, fonctionnel et téléchargeable en ZIP.",
  keywords: [
    "React",
    "générateur",
    "scaffold",
    "Vite",
    "Next.js",
    "TypeScript",
    "Tailwind",
    "IA",
    "boilerplate",
  ],
  authors: [{ name: "React Forge" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "React Forge — Générateur de projets React par IA",
    description:
      "Forge des applications React complètes avec l'IA : code source, configuration et composants générés automatiquement.",
    url: "https://chat.z.ai",
    siteName: "React Forge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "React Forge — Générateur de projets React par IA",
    description:
      "Forge des applications React complètes avec l'IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen overflow-hidden antialiased bg-slate-950 text-slate-100`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "rgb(2 6 23)",
              border: "1px solid rgb(30 41 59)",
              color: "rgb(226 232 240)",
            },
          }}
        />
      </body>
    </html>
  );
}
