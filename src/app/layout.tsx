import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trainer Card Generator",
  description: "Create custom Pokémon trainer cards",
  icons: {
    icon: "/pokeball.svg",
  },
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
