import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";

import { EvmWalletProvider } from "@/components/evm/wallet-provider";
import { SolanaWalletProvider } from "@/components/solana/wallet-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { APP_DESCRIPTION } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://privii.xyz"),
  title: "Privii — Crypto Payments with Tags and Links",
  description: APP_DESCRIPTION,
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png"
  },
  openGraph: {
    title: "Privii — Crypto Payments with Tags and Links",
    description: APP_DESCRIPTION,
    url: "https://privii.xyz",
    siteName: "Privii",
    type: "website",
    images: ["/social-card.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Privii — Crypto Payments with Tags and Links",
    description: APP_DESCRIPTION,
    images: ["/social-card.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <EvmWalletProvider>
          <SolanaWalletProvider>
            <ToastProvider>{children}</ToastProvider>
          </SolanaWalletProvider>
        </EvmWalletProvider>
      </body>
    </html>
  );
}
