import type { Metadata } from "next";
import { Bricolage_Grotesque, Martian_Mono, Unbounded } from "next/font/google";
import "./globals.css";

const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const mono = Martian_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const sans = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aditya Kumar — AI & Backend Software Engineer",
  description: "Software engineer building production AI, backend infrastructure, and reliable automation. Selected experience and work by Aditya Kumar.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  openGraph: {
    title: "Aditya Kumar — Software Engineer",
    description: "Production AI, backend infrastructure, and reliable automation.",
    type: "website",
    images: [{ url: "/og.png", width: 1728, height: 910, alt: "The Core — Aditya Kumar, Software Engineer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditya Kumar — Software Engineer",
    description: "Production AI, backend infrastructure, and reliable automation.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${mono.variable} ${sans.variable}`}>{children}</body></html>;
}