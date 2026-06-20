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
  title: "Extension Lab — Extensions de Navigateur augmentées par l’IA",
  description:
    "Analyse interactive de l’extension Chrome GLOBAL_KIROV3 (Manifest V3) : pont navigateur/IA, navigation augmentée, copilote utilisateur et transformation en application. Démonstrations live avec LLM, recherche web et lecture de pages.",
  keywords: [
    "extension navigateur",
    "Manifest V3",
    "Chrome extension",
    "IA",
    "copilote",
    "content script",
    "bridge",
    "KIROV3",
  ],
  authors: [{ name: "Extension Lab" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Extension Lab — Extensions augmentées par l’IA",
    description:
      "Explorez une extension Chrome Manifest V3 réelle et ses 4 piliers : bridge, navigation IA, copilote, transformation en application.",
    url: "https://chat.z.ai",
    siteName: "Extension Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Extension Lab — Extensions augmentées par l’IA",
    description:
      "Explorez une extension Chrome Manifest V3 réelle et ses 4 piliers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
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
