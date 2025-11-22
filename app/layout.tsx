import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-white text-slate-950" style={{ fontFamily: 'Inter, sans-serif' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
