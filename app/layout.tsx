import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";

import { SolanaWalletProvider } from "@/components/solana/wallet-provider";
import { APP_NAME } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} | Crypto payment links`,
  description: "Create premium crypto payment links without exposing your wallet address in the UI."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
