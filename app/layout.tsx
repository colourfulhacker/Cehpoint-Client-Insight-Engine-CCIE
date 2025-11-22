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
      <body className="antialiased min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {children}
      </body>
    </html>
  );
}
