import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";

import { SolanaWalletProvider } from "@/components/solana/wallet-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { APP_DESCRIPTION } from "@/lib/constants";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://privii.xyz"),
  title: "Privii — Private Crypto Payments via Links",
  description: APP_DESCRIPTION,
  openGraph: {
    title: "Privii — Private Crypto Payments via Links",
    description: APP_DESCRIPTION,
    type: "website",
    images: ["/social-card.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Privii — Private Crypto Payments via Links",
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
        <SolanaWalletProvider>
          <ToastProvider>{children}</ToastProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
