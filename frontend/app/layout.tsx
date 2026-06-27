import type { Metadata, Viewport } from "next";
import { Space_Mono, Inter } from "next/font/google";
import { StacksProvider } from "@/contexts/StacksProvider";
import { Navbar } from '@/components/features/navigation/CommonNavbar';
import { GameToaster } from "@/components/ui/Toast";
import OnboardingTour from "@/components/features/onboarding/OnboardingTour";
import { Providers } from '@/components/providers/Providers';
import { ReownProvider } from "@/contexts/ReownProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://block-bets.vercel.app"),
  title: {
    default: "BlockYield — Lossless Yield Tournament Engine",
    template: "%s | BlockYield",
  },
  other: {
    "talentapp:project_verification":
      "97d883cdc7ea1ede55f79cdbd383c0b1c6eda74212c4305225a89ede1a0d4458d7ea1bed4a11b26c26dfac7d80df57436f0217a329abb99afda84218638f74ac",
  },
  description:
    "Decentralized Lossless Yield-Backed Tournament & Competition Engine on Stacks. Stake STX safely, compound yield, and wager risk-free.",
  keywords: [
    "Stacks",
    "Bitcoin",
    "Lossless Staking",
    "PoX Yield",
    "BlockYield",
    "Blockchain",
    "L2",
    "DeFi",
  ],
  authors: [{ name: "BlockYield Protocol" }],
  creator: "BlockYield",
  openGraph: {
    title: "BlockYield — Lossless Yield Tournament Engine",
    description:
      "Decentralized Lossless Yield-Backed Tournament & Competition Engine on Stacks L2.",
    type: "website",
    siteName: "BlockYield",
    images: [
      {
        url: "/favicon.svg",
        width: 512,
        height: 512,
        alt: "BlockYield Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockYield — Lossless Yield Tournament Engine",
    description:
      "Decentralized Lossless Yield-Backed Tournament Engine on Stacks L2.",
    images: ["/favicon.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceMono.variable} antialiased bg-black min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>
          <ReownProvider>
            <StacksProvider>
              <Navbar />
              {children}
              <OnboardingTour />
              <GameToaster />
            </StacksProvider>
          </ReownProvider>
        </Providers>
      </body>
    </html>
  );
}
