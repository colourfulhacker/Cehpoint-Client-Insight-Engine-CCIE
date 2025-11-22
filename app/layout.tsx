import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Cehpoint Client Insight Engine | AI-Powered B2B Sales Intelligence",
  description: "Transform your LinkedIn prospect data into actionable insights with AI-powered analysis. Generate personalized pitch suggestions and conversation starters for B2B outreach.",
  keywords: ["B2B sales", "client insights", "AI analysis", "prospect intelligence", "sales enablement"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={`${inter.className} antialiased min-h-screen bg-white text-slate-950`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
