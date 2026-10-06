import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CNC Monitor | Micro-Stoppage Monitoring",
  description: "Real-time CNC current, vibration, micro-stoppage events and machine performance monitoring.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
