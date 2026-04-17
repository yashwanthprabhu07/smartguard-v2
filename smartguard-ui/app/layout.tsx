import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartGuard — AI-Powered Machine Health Monitoring",
  description:
    "Predictive maintenance for every factory. SmartGuard monitors industrial machines 24/7, detects anomalies with AI, and alerts engineers before failure happens.",
  keywords: [
    "predictive maintenance",
    "IoT",
    "machine learning",
    "industrial AI",
    "anomaly detection",
  ],
  authors: [{ name: "Yashwanth Prabhu" }],
  openGraph: {
    title: "SmartGuard — AI-Powered Machine Health Monitoring",
    description: "Predicts equipment failure before it happens.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-ink-50 text-fog-100 antialiased">
        <SmoothScroll>{children}</SmoothScroll>
        <div className="noise" aria-hidden="true" />
      </body>
    </html>
  );
}
