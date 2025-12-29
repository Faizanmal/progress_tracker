import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/src/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { MainNav } from "@/src/components/layout/MainNav";
import { ClientBody } from "@/src/components/ClientBody";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: 'swap',
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Progress Tracker - Modern Employee Progress Management",
  description: "Track and manage employee progress, tasks, and projects with powerful analytics and AI-driven insights",
  keywords: "progress tracking, employee management, task management, analytics, AI insights",
  authors: [{ name: "Progress Tracker Team" }],
  openGraph: {
    title: "Progress Tracker - Modern Employee Progress Management",
    description: "Track and manage employee progress, tasks, and projects with powerful analytics and AI-driven insights",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground gradient-mesh">
        <ClientBody>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <MainNav />
            <main className="min-h-screen relative pt-16">
              <div className="animate-fade-in">
                {children}
              </div>
            </main>
            <Toaster />
          </ThemeProvider>
        </ClientBody>
      </body>
    </html>
  );
}
