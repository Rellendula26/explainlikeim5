import type { Metadata } from "next";
import "./globals.css";
import { CursorOrb } from "../components/CursorOrb";

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
      <body>
        <CursorOrb />
        {children}
      </body>
    </html>
  );
}
