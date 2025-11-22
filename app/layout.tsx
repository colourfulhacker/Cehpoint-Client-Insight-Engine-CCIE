import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cehpoint Client Insight Engine",
  description: "AI-powered client insight extraction for B2B outreach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
