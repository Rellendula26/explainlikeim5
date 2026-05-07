import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Explain My Repo Like I'm Five",
  description: "Get a simple, kid-friendly summary of any GitHub repository."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
