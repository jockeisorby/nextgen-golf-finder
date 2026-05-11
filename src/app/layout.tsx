import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tävla Golf",
  description: "Hitta svenska golftävlingar snabbt och öppna dem i Min Golf.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
