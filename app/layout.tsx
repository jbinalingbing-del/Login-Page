import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coffee Relax",
  description: "Coffee Shop Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}