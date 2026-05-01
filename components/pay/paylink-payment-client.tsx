"use client";

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { getWalletClient } from "@wagmi/core";
import { isAddress, parseUnits } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import {
  ArrowRight,
  Check,
  Copy,
  LoaderCircle,
  ExternalLink,
  Send
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";

import { EvmConnectWalletButton } from "@/components/evm/connect-wallet-button";
import { evmConfig } from "@/components/evm/wallet-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEvmNetworkOption, type EvmNetworkOption, EVM_NETWORK_OPTIONS } from "@/lib/evm/chains";
import { getEvmPublicClient } from "@/lib/evm/client";
import { getEvmTokenConfig } from "@/lib/evm/tokens";
import { ConnectWalletButton } from "@/components/solana/connect-wallet-button";
import { addUsdcTransfer, fetchLatestBlockhashWithRetry } from "@/lib/solana/client";
import { resolveTagWalletType } from "@/lib/tags";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  EvmNetwork,
  PaymentAsset,
  PaymentNetwork,
  PayLinkResponse,
  PayLinkToken,
  PriviiTagRecord
} from "@/lib/types";
import { buildWhatsAppShareUrl, buildXShareUrl } from "@/lib/utils";

type Props = {
  tag: string;
  kind?: "paylink" | "tag";
};

type PayTarget =
  | { kind: "paylink"; link: PayLinkResponse["link"]; status: PayLinkResponse["status"] }
  | { kind: "tag"; tagRecord: PriviiTagRecord };

type PaymentInit = {
  kind: "paylink" | "tag";
  tag: string;
  asset: PaymentAsset;
  network: PaymentNetwork;
  expectedAmount: string;
  payerWallet?: string | null;
  recipientWallet: string;
  token?: PaymentAsset;
  amount?: string | null;
  expiresAt: number | null;
  expired: boolean;
};

type PaymentStage =
  | "idle"
  | "initializing"
  | "awaiting_signature"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "failed";

export function PayLinkPaymentClient({ tag, kind = "paylink" }: Props) {
  const router = useRouter();
  const { connection } = useAppKitConnection();
  const solanaAccount = useAppKitAccount({ namespace: "solana" });
  const evmAccount = useAppKitAccount({ namespace: "eip155" });
  const { walletProvider: solanaWalletProvider } = useAppKitProvider<{
    publicKey?: PublicKey;
    sendTransaction?: (transaction: Transaction, connection: Connection) => Promise<string>;
  }>("solana");
  const { address: evmAddress, isConnected: evmConnected, chainId: evmChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [data, setData] = useState<PayTarget | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<PaymentNetwork>("solana");
  const [selectedToken, setSelectedToken] = useState<PaymentAsset>("USDC");
  const [isFetching, setIsFetching] = useState(true);
  const [isInitializingPayment, setIsInitializingPayment] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [paymentInit, setPaymentInit] = useState<PaymentInit | null>(null);
  const [paymentStage, setPaymentStage] = useState<PaymentStage>("idle");

  useEffect(() => {
    let cancelled = false;

    async function fetchLink() {
      setIsFetching(true);
      setError(null);

      try {
        const response = await fetch(kind === "tag" ? `/api/tags/${tag}` : `/api/links/${tag}`, {
          cache: "no-store"
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || (kind === "tag" ? "Privii tag not found" : "Payment link not found")
          );
        }

        if (!cancelled) {
          if (kind === "tag") {
            setData({ kind: "tag", tagRecord: result.tag });
          } else {
            setData({ kind: "paylink", link: result.link, status: result.status });
          }
        }
      } catch (fetchError) {
        console.error(fetchError);
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : kind === "tag"
                ? "Privii tag not found"
                : "Payment link not found"
          );
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    }

    fetchLink();

    return () => {
      cancelled = true;
    };
  }, [kind, tag]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    const nextNetwork =
      data.kind === "tag"
        ? resolveTagWalletType(data.tagRecord) === "solana"
          ? "solana"
          : "ethereum"
        : data.link.walletType === "solana"
          ? "solana"
          : data.link.network || "ethereum";
    setSelectedNetwork(nextNetwork);

    const nextTokens = getNetworkTokenOptions(nextNetwork);
    setSelectedToken(
      data.kind === "paylink" && nextTokens.includes(data.link.token) ? data.link.token : nextTokens[0]
    );
  }, [data]);

  const receiverWalletType =
    data?.kind === "tag"
      ? resolveTagWalletType(data.tagRecord)
      : data?.kind === "paylink"
        ? data.link.walletType || "solana"
        : "solana";
  const availableNetworkOptions: Array<{ value: PaymentNetwork; label: string }> =
    receiverWalletType === "solana"
      ? [{ value: "solana", label: "Solana" }]
      : EVM_NETWORK_OPTIONS.map((option) => ({
          value: option.key as PaymentNetwork,
          label: option.label
        }));
  const availableTokens =
    selectedNetwork === "solana"
      ? (["SOL", "USDC"] as PaymentAsset[])
      : getNetworkTokenOptions(selectedNetwork);
  const paymentToken =
    availableTokens.includes(selectedToken) ? selectedToken : availableTokens[0];
  const selectedEvmNetworkOption =
    selectedNetwork === "solana" ? null : getEvmNetworkOption(selectedNetwork as EvmNetwork);
  const activePaymentWallet = getActivePaymentWallet({
    selectedNetwork,
    solanaAddress: solanaAccount.address ?? null,
    solanaConnected: Boolean(solanaAccount.isConnected && solanaAccount.address),
    evmAddress: evmAccount.address ?? evmAddress ?? null,
    evmConnected: Boolean((evmAccount.isConnected || evmConnected) && (evmAccount.address || evmAddress)),
  });
  const activePaymentWalletConnected = activePaymentWallet.connected;
  const connectedEvmAddress = (evmAccount.address ?? evmAddress ?? "").trim();
  const currentEvmChainId = evmChainId ?? null;
  const isWrongEvmChain =
    selectedNetwork !== "solana" &&
    Boolean(activePaymentWalletConnected && selectedEvmNetworkOption) &&
    currentEvmChainId !== selectedEvmNetworkOption?.chain.id;
  const initAmount =
    data?.kind === "paylink" && data.link.amount ? data.link.amount : customAmount.trim();
  const needsAmountToInitialize =
    data?.kind === "tag" || (data?.kind === "paylink" && !data.link.amount);
  const canInitializePayment =
    Boolean(data) &&
    (!needsAmountToInitialize || (Boolean(initAmount) && Number(initAmount) > 0));

  useEffect(() => {
    let cancelled = false;

    async function initializePayment() {
      if (!data || !canInitializePayment) {
        setPaymentInit(null);
        setIsInitializingPayment(false);
        setPaymentStage("idle");
        return;
      }

      setIsInitializingPayment(true);
      setPaymentStage("initializing");
      setError(null);

      try {
        const response = await fetch("/api/payments/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            kind: data.kind,
            tag: data.kind === "tag" ? data.tagRecord.tag : data.link.tag,
            asset: paymentToken,
            network: selectedNetwork,
            expectedAmount: initAmount,
            payerWallet:
              selectedNetwork === "solana"
                ? solanaAccount.address ?? null
                : connectedEvmAddress || null
            })
          });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Payment failed. Please try again");
        }

        if (!cancelled) {
          setPaymentInit(result.payment as PaymentInit);
          setPaymentStage("idle");
        }
      } catch (initializationError) {
        console.error(initializationError);
        if (!cancelled) {
          setPaymentInit(null);
          setPaymentStage("failed");
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : "Payment failed. Please try again"
          );
        }
      } finally {
        if (!cancelled) {
          setIsInitializingPayment(false);
        }
      }
    }

    void initializePayment();

    return () => {
      cancelled = true;
    };
  }, [canInitializePayment, connectedEvmAddress, data, initAmount, paymentToken, selectedNetwork, solanaAccount.address]);

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : `/${tag}`;

  const enteredAmount = useMemo(() => {
    if (data?.kind === "paylink" && data.link.amount) {
      return data.link.amount;
    }

    return customAmount;
  }, [customAmount, data]);

  const isExpired = Boolean(
    paymentInit?.expired ||
      (data?.kind === "paylink" &&
        (data.status === "expired" || (data.link.expiresAt ? data.link.expiresAt <= now : false)))
  );
  const recipientWallet = paymentInit?.recipientWallet ?? null;
  const normalizedRecipientWallet = recipientWallet?.trim() ?? null;
  const connectedWalletAddress = (solanaAccount.address ?? "").trim() || null;
  const normalizedEvmAddress = connectedEvmAddress.toLowerCase() || null;
  const isCreator =
    selectedNetwork === "solana"
      ? Boolean(connectedWalletAddress && normalizedRecipientWallet) &&
        connectedWalletAddress === normalizedRecipientWallet
      : Boolean(normalizedEvmAddress && normalizedRecipientWallet) &&
        normalizedEvmAddress === (normalizedRecipientWallet?.toLowerCase() ?? null);
  const canPay =
    Boolean(paymentInit) &&
    !isInitializingPayment &&
    activePaymentWalletConnected &&
    !isWrongEvmChain &&
    !isCreator &&
    !isExpired &&
    Boolean(enteredAmount) &&
    Number(enteredAmount) > 0;

  async function handleCopy() {
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleShare() {
    if (!data) {
      return;
    }

    if (navigator.share) {
      try {
        const shareTag = data.kind === "tag" ? data.tagRecord.tag : data.link.tag;
        await navigator.share({
          title: "Privii PayLink",
          text: `Pay me privately with my Privii link (@${shareTag})`,
          url: currentUrl
        });
        return;
      } catch {
        // Fall back to copy when native share is dismissed or unavailable.
      }
    }

    await handleCopy();
  }

  async function handlePay() {
    if (!data) {
      return;
    }

    if (!paymentInit || !normalizedRecipientWallet) {
      setError(
        data.kind === "tag"
          ? selectedNetwork === "solana"
            ? "Recipient wallet not configured for this tag."
            : "This user has not added a wallet for this network"
          : "Payment failed. Please try again"
      );
      return;
    }

    if (
      selectedNetwork === "solana" &&
      (!solanaAccount.isConnected || !solanaAccount.address || !solanaWalletProvider?.sendTransaction)
    ) {
      setError("Please connect your wallet first");
      return;
    }

    if (selectedNetwork !== "solana" && !activePaymentWalletConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (selectedNetwork !== "solana" && isWrongEvmChain) {
      setError("Please switch network");
      return;
    }

    const amountNumber = Number(enteredAmount);

    if (!enteredAmount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError("Enter an amount to continue");
      return;
    }

    setError(null);
    setIsPaying(true);
    setPaymentStage("awaiting_signature");

    try {
      const signature =
        selectedNetwork === "solana"
          ? await sendSolanaPayment({
              connection,
              wallet: solanaWalletProvider,
              recipientWallet: normalizedRecipientWallet,
              amountNumber,
              paymentToken: paymentToken as PayLinkToken,
            })
          : await sendEvmPayment({
              network: selectedNetwork as EvmNetwork,
              token: paymentToken,
              recipientWallet: normalizedRecipientWallet,
              senderWallet: connectedEvmAddress,
              amount: enteredAmount,
              currentChainId: currentEvmChainId,
              switchChainAsync,
            });

      setPaymentStage("submitted");
      setPaymentStage("confirming");

      const confirmed = await pollForConfirmedPayment({
        kind: data.kind,
        tag: data.kind === "tag" ? data.tagRecord.tag : data.link.tag,
        network: selectedNetwork,
        asset: paymentToken,
        expectedAmount: enteredAmount,
        payerWallet: selectedNetwork === "solana" ? solanaAccount.address! : connectedEvmAddress,
        txSignature: signature
      });

      if (confirmed.status !== "confirmed") {
        throw new Error("Payment failed. Please try again");
      }

      setPaymentStage("confirmed");

      router.push(
        `/success?tx=${encodeURIComponent(signature)}&tag=${encodeURIComponent(
          data.kind === "tag" ? data.tagRecord.tag : data.link.tag
        )}`
      );
    } catch (paymentError) {
      if (paymentToken === "SOL") {
        console.error("SOL transfer error:", paymentError);
      }
      console.error(paymentError);
      setError(
        paymentError instanceof Error
          ? getReadablePaymentError(paymentError.message)
          : "Payment failed. Please try again"
      );
      setPaymentStage("failed");
    } finally {
      setIsPaying(false);
    }
  }

  async function handleSwitchNetwork() {
    if (selectedNetwork === "solana" || !selectedEvmNetworkOption) {
      return;
    }

    if (!switchChainAsync) {
      setError("Please switch network in your wallet");
      return;
    }

    try {
      setError(null);
      await switchChainAsync({ chainId: selectedEvmNetworkOption.chain.id });
    } catch (switchError) {
      console.error(switchError);
      setError("Please switch network in your wallet");
    }
  }

  if (isFetching) {
    return (
      <Card className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 text-secondary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          {kind === "tag" ? "Loading Privii tag" : "Loading PayLink"}
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold">
          {kind === "tag" ? "Privii tag not found" : "Payment link not found"}
        </h1>
        <p className="text-sm text-secondary">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const shareTag = data.kind === "tag" ? data.tagRecord.tag : data.link.tag;
  const expiryLabel =
    data.kind === "tag"
      ? "No expiry"
      : paymentInit?.expiresAt
        ? formatExpiryLabel(paymentInit.expiresAt, now)
        : data.link.type === "permanent"
        ? "No expiry"
        : formatExpiryLabel(data.link.expiresAt, now);
  const shouldShowCustomAmount =
    !isCreator && !isExpired && (data.kind === "tag" || !data.link.amount);
  const title =
    data.kind === "tag"
      ? `Pay @${data.tagRecord.tag}`
      : "Send payment";
  const subtitle =
    data.kind === "tag"
      ? "Choose an amount and complete the payment."
      : data.link.amount
        ? "Complete this payment with your connected wallet."
        : "Enter an amount and complete the payment.";

  return (
    <div className="mx-auto w-full max-w-xl pt-16 sm:pt-20">
      <div className="relative rounded-[34px] border border-border bg-card/95 px-6 pb-8 pt-24 shadow-[0_30px_120px_rgba(0,0,0,0.5)] sm:px-8 sm:pb-10 sm:pt-28">
        <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <TokenBadge token={paymentToken} />
        </div>

        <div className="space-y-8">
          <div className="flex justify-center">
            <ExpiryPill expired={isExpired} label={isExpired ? "Expired" : expiryLabel} />
          </div>

          <div className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-secondary">
              {data.kind === "tag" ? "Privii tag" : "Payment Request"}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto max-w-md text-sm leading-6 text-secondary sm:text-base">
              {subtitle}
            </p>
          </div>

          {shouldShowCustomAmount ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm text-secondary">Network</span>
                <Select
                  value={selectedNetwork}
                  onChange={(event) => {
                    const nextNetwork = event.target.value as PaymentNetwork;
                    setSelectedNetwork(nextNetwork);
                    const nextTokens = getNetworkTokenOptions(nextNetwork);
                    setSelectedToken(nextTokens[0]);
                  }}
                >
                  {availableNetworkOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-secondary">Amount to send</span>
                <Input
                  inputMode="decimal"
                  placeholder={`Enter ${paymentToken} amount`}
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-secondary">Token</span>
                <Select
                  value={paymentToken}
                  onChange={(event) => setSelectedToken(event.target.value as PaymentAsset)}
                >
                  {availableTokens.map((tokenOption) => (
                    <option key={tokenOption} value={tokenOption}>
                      {tokenOption}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          ) : data.kind === "paylink" && data.link.amount ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm text-secondary">Network</span>
                <Select
                  value={selectedNetwork}
                  onChange={(event) => {
                    const nextNetwork = event.target.value as PaymentNetwork;
                    setSelectedNetwork(nextNetwork);
                    const nextTokens = getNetworkTokenOptions(nextNetwork);
                    setSelectedToken(nextTokens.includes(data.link.token) ? data.link.token : nextTokens[0]);
                  }}
                >
                  {availableNetworkOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-secondary">Amount to send</span>
                <Input value={data.link.amount} disabled />
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-secondary">Token</span>
                <Select
                  value={paymentToken}
                  onChange={(event) => setSelectedToken(event.target.value as PaymentAsset)}
                >
                  {availableTokens.map((tokenOption) => (
                    <option key={tokenOption} value={tokenOption}>
                      {tokenOption}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          ) : null}

          {selectedNetwork === "solana" && !solanaAccount.isConnected && !isCreator && !isExpired ? (
            <div className="space-y-3">
              <p className="text-sm text-secondary">Please connect your wallet first</p>
              <ConnectWalletButton className="!w-full" />
            </div>
          ) : null}

          {selectedNetwork !== "solana" && !activePaymentWalletConnected && !isCreator && !isExpired ? (
            <div className="space-y-3">
              <p className="text-sm text-secondary">Please connect your wallet first</p>
              <EvmConnectWalletButton className="!w-full" />
            </div>
          ) : null}

          {selectedNetwork !== "solana" && isWrongEvmChain && !isExpired ? (
            <div className="space-y-3">
              <p className="text-sm text-secondary">Please switch network</p>
              <Button className="w-full" onClick={handleSwitchNetwork}>
                Switch to {selectedEvmNetworkOption?.label}
              </Button>
            </div>
          ) : null}

          {isInitializingPayment ? (
            <div className="flex items-center justify-center gap-2 text-sm text-secondary">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Initializing payment
            </div>
          ) : null}

          {paymentStageMessage(paymentStage) ? (
            <p className="text-sm text-secondary">{paymentStageMessage(paymentStage)}</p>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {isExpired ? (
            <p className="text-sm text-red-400">This payment link has expired</p>
          ) : null}

          {isCreator ? (
            <>
              <div className="flex items-center justify-center gap-4 pt-2">
                <IconActionButton
                  label={copied ? "Copied" : "Copy"}
                  icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  onClick={handleCopy}
                />
                <IconActionLink
                  href={buildXShareUrl(currentUrl, shareTag)}
                  label="Share on X"
                  icon={<span className="text-sm font-medium">X</span>}
                />
                <IconActionLink
                  href={buildWhatsAppShareUrl(currentUrl, shareTag)}
                  label="Share on WhatsApp"
                  icon={<Send className="h-4 w-4" />}
                />
                <IconActionLink
                  href={currentUrl}
                  label="Open payment page"
                  icon={<ExternalLink className="h-4 w-4" />}
                />
              </div>

              <Button className="w-full" onClick={handleShare}>
                Share PayLink
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </>
          ) : null}

          {!isCreator && !isExpired ? (
            <Button className="w-full" disabled={!canPay || isPaying} onClick={handlePay}>
              {isPaying ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Sending payment
                </span>
              ) : (
                <>
                  Pay Now
                  <ArrowRight className="ml-3 h-5 w-5" />
                </>
              )}
            </Button>
          ) : null}

          {isCreator ? (
            <p className="text-center text-sm text-secondary">
              This is your PayLink. Share it instead of paying yourself.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TokenBadge({ token }: { token: PaymentAsset }) {
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-[#171717] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl font-semibold text-white">
        {token === "USDC" || token === "USDT" ? "$" : token === "SOL" ? "S" : token.charAt(0)}
      </div>
    </div>
  );
}

function getNetworkTokenOptions(network: PaymentNetwork): PaymentAsset[] {
  if (network === "solana") {
    return ["SOL", "USDC"];
  }

  const option = EVM_NETWORK_OPTIONS.find((item) => item.key === network);

  if (!option) {
    return ["ETH"];
  }

  return getNetworkTokenSymbols(option);
}

function getNetworkTokenSymbols(option: EvmNetworkOption): PaymentAsset[] {
  if (option.key === "ethereum") {
    return ["ETH", "USDC", "USDT"];
  }

  if (option.key === "base") {
    return ["ETH", "USDC"];
  }

  if (option.key === "arbitrum") {
    return ["ETH", "USDC"];
  }

  return ["BNB"];
}

function getActivePaymentWallet(input: {
  selectedNetwork: PaymentNetwork;
  solanaAddress: string | null;
  solanaConnected: boolean;
  evmAddress: string | null;
  evmConnected: boolean;
}) {
  if (input.selectedNetwork === "solana") {
    return {
      address: input.solanaAddress?.trim() || null,
      connected: input.solanaConnected && Boolean(input.solanaAddress)
    };
  }

  return {
    address: input.evmAddress?.trim() || null,
    connected: input.evmConnected && Boolean(input.evmAddress)
  };
}

async function sendSolanaPayment({
  connection,
  wallet,
  recipientWallet,
  amountNumber,
  paymentToken,
}: {
  connection: Connection | undefined;
  wallet:
    | {
        publicKey?: PublicKey;
        sendTransaction?: (transaction: Transaction, connection: Connection) => Promise<string>;
      }
    | undefined;
  recipientWallet: string;
  amountNumber: number;
  paymentToken: PayLinkToken;
}) {
  if (!connection || !wallet?.publicKey || !wallet.sendTransaction) {
    throw new Error("Please connect your wallet first");
  }

  const recipient = new PublicKey(recipientWallet);
  const transaction = new Transaction();

  if (paymentToken === "SOL") {
    const balanceLamports = await connection.getBalance(wallet.publicKey, "confirmed");
    const requiredLamports = Math.round(amountNumber * 1e9);

    if (balanceLamports < requiredLamports) {
      throw new Error("Insufficient wallet balance");
    }

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipient,
        lamports: requiredLamports
      })
    );
  } else {
    await addUsdcTransfer({
      connection,
      transaction,
      sender: wallet.publicKey,
      recipient,
      amount: amountNumber
    });
  }

  const blockhash = await fetchLatestBlockhashWithRetry(connection);
  transaction.recentBlockhash = blockhash.blockhash;
  transaction.feePayer = wallet.publicKey;

  const signature = await wallet.sendTransaction(transaction, connection);
  await connection.confirmTransaction(
    {
      signature,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight
    },
    "confirmed"
  );

  return signature;
}

async function sendEvmPayment({
  network,
  token,
  recipientWallet,
  senderWallet,
  amount,
  currentChainId,
  switchChainAsync,
}: {
  network: EvmNetwork;
  token: PaymentAsset;
  recipientWallet: string;
  senderWallet: string;
  amount: string;
  currentChainId: number | null;
  switchChainAsync?: ((args: { chainId: number }) => Promise<unknown>) | undefined;
}) {
  console.log("EVM payment debug", {
    selectedNetwork: network,
    selectedChainId: getEvmNetworkOption(network).chain.id,
    connectedEvmAddress: senderWallet,
    receiverWallet: recipientWallet,
    token,
    amount,
    currentChainId
  });

  const networkOption = getEvmNetworkOption(network);
  const tokenConfig = getEvmTokenConfig(network, token);
  const parsedAmount = Number(amount);

  if (!tokenConfig) {
    throw new Error("Payment failed. Please try again");
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Enter an amount to continue");
  }

  if (!isAddress(recipientWallet)) {
    throw new Error("This user has not added a wallet for this network");
  }

  if (!isAddress(senderWallet)) {
    throw new Error("Please connect your wallet first");
  }

  if (currentChainId !== networkOption.chain.id) {
    if (!switchChainAsync) {
      throw new Error("Please switch network");
    }

    try {
      await switchChainAsync({ chainId: networkOption.chain.id });
    } catch (error) {
      console.error(error);
      throw new Error("Please switch network in your wallet");
    }
  }

  const walletClient = await getWalletClient(evmConfig, { chainId: networkOption.chain.id });

  if (!walletClient) {
    throw new Error("Please connect your wallet first");
  }

  const publicClient = getEvmPublicClient(network);
  const atomicAmount = parseUnits(amount, tokenConfig.decimals);
  const nativeBalance = await publicClient.getBalance({ address: senderWallet as `0x${string}` });

  if (tokenConfig.isNative) {
    const gas = await publicClient.estimateGas({
      account: senderWallet as `0x${string}`,
      to: recipientWallet as `0x${string}`,
      value: atomicAmount
    });
    const gasPrice = await publicClient.getGasPrice();
    const feeCost = gas * gasPrice;

    if (nativeBalance < feeCost) {
      throw new Error("Insufficient gas balance");
    }

    if (nativeBalance < atomicAmount + feeCost) {
      throw new Error("Insufficient wallet balance");
    }

    return walletClient.sendTransaction({
      account: senderWallet as `0x${string}`,
      chain: networkOption.chain,
      to: recipientWallet as `0x${string}`,
      value: atomicAmount,
      gas,
    });
  }

  if (!tokenConfig.contractAddress) {
    throw new Error("Payment failed. Please try again");
  }

  const tokenBalance = await publicClient.readContract({
    address: tokenConfig.contractAddress,
    abi: tokenConfig.abi!,
    functionName: "balanceOf",
    args: [senderWallet as `0x${string}`]
  }) as bigint;

  if (tokenBalance < atomicAmount) {
    throw new Error("Insufficient token balance");
  }

  const gas = await publicClient.estimateContractGas({
    address: tokenConfig.contractAddress,
    abi: tokenConfig.abi!,
    functionName: "transfer",
    args: [recipientWallet as `0x${string}`, atomicAmount],
    account: senderWallet as `0x${string}`,
  });
  const gasPrice = await publicClient.getGasPrice();
  const feeCost = gas * gasPrice;

  if (nativeBalance < feeCost) {
    throw new Error("Insufficient gas balance");
  }

  const hash = await walletClient.writeContract({
    account: senderWallet as `0x${string}`,
    chain: networkOption.chain,
    address: tokenConfig.contractAddress,
    abi: tokenConfig.abi!,
    functionName: "transfer",
    args: [recipientWallet as `0x${string}`, atomicAmount],
    gas,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

function IconActionButton({
  icon,
  label,
  onClick
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function IconActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-primary transition hover:border-white/20 hover:bg-white/[0.03]"
    >
      {icon}
    </a>
  );
}

function ExpiryPill({ label, expired }: { label: string; expired?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        expired
          ? "border-white/10 bg-white/[0.03] text-secondary"
          : "border-accent/20 bg-accent/10 text-accent"
      }`}
    >
      {expired ? "This payment link has expired" : label}
    </span>
  );
}

function formatExpiryLabel(expiresAt: number | null, now: number) {
  if (!expiresAt) {
    return "No expiry";
  }

  const diff = expiresAt - now;

  if (diff <= 0) {
    return "Expires soon";
  }

  const totalSeconds = Math.max(Math.floor(diff / 1000), 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `Expires in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Expires in ${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `Expires in ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

async function pollForConfirmedPayment(input: {
  kind: "tag" | "paylink";
  tag: string;
  network: PaymentNetwork;
  asset: PaymentAsset;
  expectedAmount: string;
  payerWallet: string;
  txSignature: string;
}) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const confirmResponse = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });
    const confirmResult = await confirmResponse.json();

    if (!confirmResponse.ok) {
      throw new Error(confirmResult.error || "Payment failed. Please try again");
    }

    if (confirmResult.status === "confirmed" || confirmResult.status === "failed") {
      return confirmResult as { status: "confirmed" | "failed" };
    }

    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }

  throw new Error("Payment failed. Please try again");
}

function paymentStageMessage(stage: PaymentStage) {
  switch (stage) {
    case "initializing":
      return "Initializing payment";
    case "awaiting_signature":
      return "Confirm transaction in wallet";
    case "submitted":
      return "Payment submitted";
    case "confirming":
      return "Confirming payment";
    case "confirmed":
      return "Payment confirmed";
    case "failed":
      return "Payment failed. Please try again";
    default:
      return null;
  }
}

function getReadablePaymentError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("usdc wallet not initialized")) {
    return "USDC wallet not initialized";
  }

  if (normalized.includes("insufficient usdc")) {
    return "Insufficient USDC balance";
  }

  if (normalized.includes("insufficient token")) {
    return "Insufficient token balance";
  }

  if (normalized.includes("insufficient sol")) {
    return "Insufficient SOL for transaction fees";
  }

  if (normalized.includes("insufficient gas")) {
    return "Insufficient gas balance";
  }

  if (normalized.includes("please switch network")) {
    return "Please switch network";
  }

  if (normalized.includes("switch network in your wallet")) {
    return "Please switch network in your wallet";
  }

  if (
    normalized.includes("insufficient") ||
    normalized.includes("no record of a prior credit") ||
    normalized.includes("attempt to debit")
  ) {
    return "Insufficient wallet balance";
  }

  if (
    normalized.includes("user rejected") ||
    normalized.includes("rejected") ||
    normalized.includes("cancelled")
  ) {
    return "Transaction rejected";
  }

  return "Payment failed. Please try again";
}
