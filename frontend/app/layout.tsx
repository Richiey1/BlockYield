import type { Metadata, Viewport } from "next";
import { Space_Mono, Inter } from "next/font/google";
import { StacksProvider } from "@/contexts/StacksProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";
import { ReownProvider } from "@/contexts/ReownProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://blockbet.vercel.app'),
  title: {
    default: "BlockBet — Predict the Chain",
    template: "%s | BlockBet",
  },
  other: {
    "talentapp:project_verification": "97d883cdc7ea1ede55f79cdbd383c0b1c6eda74212c4305225a89ede1a0d4458d7ea1bed4a11b26c26dfac7d80df57436f0217a329abb99afda84218638f74ac"
  },
  description:
    "Real-time on-chain prediction game. Stake STX on verifiable blockchain behavior and win proportionally from the pool.",
  keywords: ["Stacks", "Bitcoin", "Prediction Market", "Gaming", "BlockBet", "Blockchain", "L2", "DeFi"],
  authors: [{ name: "BlockBet Protocol" }],
  creator: "BlockBet",
  openGraph: {
    title: "BlockBet — Predict the Chain",
    description: "Stake STX on verifiable blockchain behavior and win proportionally from the pool.",
    type: "website",
    siteName: "BlockBet",
    images: [{ url: "/blockbet-logo.png", width: 512, height: 512, alt: "BlockBet Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockBet — Predict the Chain",
    description: "Real-time on-chain prediction game on Stacks L2.",
    images: ["/blockbet-logo.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/blockbet-logo.png",
    shortcut: "/favicon.svg",
  },
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
              <Toaster position="top-right" 
                toastOptions={{
                  style: {
                    borderRadius: '12px',
                    border: '1px solid #F97316',
                    background: '#000',
                    color: '#fff',
                    fontFamily: 'var(--font-inter)',
                  }
                }}
              />
            </StacksProvider>
          </ReownProvider>
        </Providers>
      </body>
    </html>
  );
}
