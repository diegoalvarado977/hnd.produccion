import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HND Producción — Taller Cumbres",
  description: "Sistema de gestión operativa y KPIs del taller",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        <div className="flex h-full min-h-screen">
          <Nav />
          <main className="flex-1 overflow-auto p-4 sm:p-6 pt-[4.5rem] md:pt-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
