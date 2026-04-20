import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pennsylvania First-Time Homebuyer Guide",
  description: "Simple help for first-time homebuyers in Pennsylvania."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
