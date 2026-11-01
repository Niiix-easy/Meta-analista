import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/src/components/ui/sonner";

import { AuthProvider } from "@/src/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meta Ads AI Command Center",
  description: "Proactive AI-driven command center for Meta Ads optimization.",
  openGraph: {
    title: "Meta Ads AI Command Center",
    description: "Proactive AI-driven command center for Meta Ads optimization.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meta Ads AI Command Center",
    description: "Proactive AI-driven command center for Meta Ads optimization.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
