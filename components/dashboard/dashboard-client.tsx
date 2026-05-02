"use client";

import {
  Check,
  Copy,
  ExternalLink,
  History,
  Link2,
  LoaderCircle,
  Send,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { isAddress } from "viem";
import { PublicKey } from "@solana/web3.js";

import { ConnectMenuButton } from "@/components/wallet/connect-menu-button";
import { useConnectedWallets } from "@/components/wallet/use-connected-wallets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PayLinkRecord, PaymentRecord, PriviiTagRecord } from "@/lib/types";
import {
  resolveTagEvmWallet,
  resolveTagSolanaWallet,
  resolveTagWalletAddress,
  resolveTagWalletType
} from "@/lib/tags";
import { buildFallbackTagUrl, buildXShareUrl, truncateWalletAddress } from "@/lib/utils";

type DashboardTab = "tag" | "links" | "history" | "pay";
type PaymentHistoryItem = Pick<
  PaymentRecord,
  | "id"
  | "amount"
  | "asset"
  | "status"
  | "tx_signature"
  | "chain"
  | "explorer_url"
  | "created_at"
  | "updated_at"
  | "confirmed_at"
  | "payer_wallet"
  | "recipient_wallet"
> & {
  direction: "sent" | "received";
};

export function DashboardClient() {
  const router = useRouter();
  const { anyWalletConnected, evmAddress, solanaAddress } = useConnectedWallets();
  const [tagRecord, setTagRecord] = useState<PriviiTagRecord | null>(null);
  const [links, setLinks] = useState<PayLinkRecord[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [walletLinkError, setWalletLinkError] = useState<string | null>(null);
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [linkingWalletType, setLinkingWalletType] = useState<"solana" | "evm" | null>(null);
  const [walletInputValue, setWalletInputValue] = useState("");
  const [payTarget, setPayTarget] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("tag");

  useEffect(() => {
    async function fetchData() {
      const connectedWallets = [solanaAddress, evmAddress].filter(
        (value): value is string => Boolean(value)
      );

      if (!connectedWallets.length) {
        setTagRecord(null);
        setLinks([]);
        setPayments([]);
        setHistoryError(null);
        return;
      }

      setIsLoading(true);

      try {
        let currentTagRecord: PriviiTagRecord | null = null;

        for (const owner of connectedWallets) {
          const tagResponse = await fetch(`/api/tags/by-owner/${encodeURIComponent(owner)}`, {
            cache: "no-store"
          });

          if (tagResponse.ok) {
            const result = (await tagResponse.json()) as { tag: PriviiTagRecord };
            currentTagRecord = result.tag;
            break;
          }
        }

        if (!currentTagRecord) {
          setTagRecord(null);
          setLinks([]);
          setPayments([]);
          setHistoryError(null);
          return;
        }

        setTagRecord(currentTagRecord);

        const historyWallet = resolveTagWalletAddress(currentTagRecord);

        if (!historyWallet) {
          setLinks([]);
          setPayments([]);
          setHistoryError(null);
          return;
        }

        const [linksResponse, paymentsResponse] = await Promise.all([
          fetch(`/api/links/by-owner/${encodeURIComponent(historyWallet)}`, {
            cache: "no-store"
          }),
          fetch(`/api/payments/by-wallet/${encodeURIComponent(historyWallet)}`, {
            cache: "no-store"
          })
        ]);

        if (linksResponse.ok) {
          const result = (await linksResponse.json()) as { links: PayLinkRecord[] };
          setLinks(result.links);
        } else {
          setLinks([]);
        }

        if (paymentsResponse.ok) {
          const result = (await paymentsResponse.json()) as { payments: PaymentHistoryItem[] };
          setPayments(result.payments);
          setHistoryError(null);
        } else {
          setPayments([]);
          const result = (await paymentsResponse
            .json()
            .catch(() => ({ error: "Unable to load payment history." }))) as {
            error?: string;
          };
          setHistoryError(result.error || "Unable to load payment history.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [evmAddress, solanaAddress]);

  const publicUrl = useMemo(() => {
    if (!tagRecord) {
      return null;
    }

    if (typeof window === "undefined") {
      return buildFallbackTagUrl(tagRecord.tag);
    }

    return `${window.location.origin}/${tagRecord.tag}`;
  }, [tagRecord]);
  const linkedSolanaWallet = tagRecord ? resolveTagSolanaWallet(tagRecord) || null : null;
  const linkedEvmWallet = tagRecord ? resolveTagEvmWallet(tagRecord) || null : null;
  const historyWalletAddress = tagRecord
    ? resolveTagWalletAddress(tagRecord) || tagRecord.ownerWallet
    : "";
  const ownerWalletForUpdate = useMemo(() => {
    if (!tagRecord) {
      return "";
    }

    const candidates = [solanaAddress, evmAddress].filter((value): value is string => Boolean(value));
    const normalizedOwner = tagRecord.ownerWallet?.trim().toLowerCase();
    const normalizedSolana = linkedSolanaWallet?.trim().toLowerCase() ?? null;
    const normalizedEvm = linkedEvmWallet?.trim().toLowerCase() ?? null;

    return (
      candidates.find((wallet) => {
        const normalizedWallet = wallet.trim().toLowerCase();
        return (
          normalizedWallet === normalizedOwner ||
          normalizedWallet === normalizedSolana ||
          normalizedWallet === normalizedEvm
        );
      }) ||
      tagRecord.ownerWallet ||
      ""
    );
  }, [evmAddress, linkedEvmWallet, linkedSolanaWallet, solanaAddress, tagRecord]);

  async function handleCopyTagLink() {
    if (!publicUrl) {
      return;
    }

    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleShareTag() {
    if (!tagRecord || !publicUrl) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Privii tag",
          text: `Pay me with my Privii tag @${tagRecord.tag}`,
          url: publicUrl
        });
        return;
      } catch {
        // Fall through to external share.
      }
    }

    window.open(buildXShareUrl(publicUrl, tagRecord.tag), "_blank", "noopener,noreferrer");
  }

  async function handleSaveLinkedWallet() {
    if (!tagRecord || !linkingWalletType) {
      return;
    }

    const nextWallet = walletInputValue.trim();

    if (!nextWallet) {
      setWalletLinkError("Enter a wallet address");
      return;
    }

    if (linkingWalletType === "evm" && !isAddress(nextWallet)) {
      setWalletLinkError("Invalid EVM address");
      return;
    }

    if (linkingWalletType === "solana") {
      try {
        new PublicKey(nextWallet);
      } catch {
        setWalletLinkError("Invalid Solana address");
        return;
      }
    }

    if (!ownerWalletForUpdate) {
      setWalletLinkError("You do not own this tag");
      return;
    }

    setIsLinkingWallet(true);
    setWalletLinkError(null);

    try {
      const response = await fetch(`/api/tags/${encodeURIComponent(tagRecord.tag)}/wallets`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletType: linkingWalletType,
          walletAddress: nextWallet,
          ownerWallet: ownerWalletForUpdate
        })
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        tag?: PriviiTagRecord;
      };

      if (!response.ok || !result.tag) {
        throw new Error(result.error || "Failed to link wallet. Please try again");
      }

      setTagRecord(result.tag);
      setLinkingWalletType(null);
      setWalletInputValue("");
    } catch (linkError) {
      console.error(linkError);
      setWalletLinkError(
        linkError instanceof Error ? linkError.message : "Failed to link wallet. Please try again"
      );
    } finally {
      setIsLinkingWallet(false);
    }
  }

  function handlePaySomeone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = payTarget.trim();

    if (!value) {
      return;
    }

    try {
      const url = new URL(value);
      const pathname = url.pathname.replace(/^\/+/, "");

      if (pathname.startsWith("pay/")) {
        router.push(`/${pathname}`);
        return;
      }

      if (pathname) {
        router.push(`/${pathname}`);
        return;
      }
    } catch {
      // Not a full URL, handle as path or tag below.
    }

    if (value.includes("/pay/")) {
      const slug = value.split("/pay/").pop();

      if (slug) {
        router.push(`/pay/${slug.replace(/^\/+/, "")}`);
        return;
      }
    }

    if (value.startsWith("pay/")) {
      router.push(`/${value}`);
      return;
    }

    router.push(`/${value.replace(/^\/+/, "")}`);
  }

  if (!anyWalletConnected) {
    return (
      <div className="mx-auto flex w-full max-w-3xl justify-center pt-4 sm:pt-6">
        <Card className="w-full rounded-[32px] p-6 text-center sm:p-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mx-auto max-w-lg text-sm leading-6 text-secondary">
              Connect at least one wallet to manage your Privii tag, payment links, and payment
              activity.
            </p>
            <div className="flex justify-center pt-2">
              <ConnectMenuButton />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl justify-center pt-4 sm:pt-6">
      <div className="w-full space-y-8">
        {isLoading ? (
          <Card className="flex min-h-[240px] items-center justify-center rounded-[32px]">
            <div className="flex items-center gap-3 text-secondary">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Loading dashboard
            </div>
          </Card>
        ) : tagRecord ? (
          <>
            <div className="flex justify-center">
              <div className="grid w-full max-w-3xl grid-cols-2 gap-2 rounded-[28px] border border-border bg-card/80 p-2 sm:grid-cols-4">
                <TabButton
                  active={activeTab === "tag"}
                  icon={<UserRound className="h-4 w-4" />}
                  label="My Tag"
                  onClick={() => setActiveTab("tag")}
                />
                <TabButton
                  active={activeTab === "links"}
                  icon={<Link2 className="h-4 w-4" />}
                  label="Payment Links"
                  onClick={() => setActiveTab("links")}
                />
                <TabButton
                  active={activeTab === "history"}
                  icon={<History className="h-4 w-4" />}
                  label="Payment History"
                  onClick={() => setActiveTab("history")}
                />
                <TabButton
                  active={activeTab === "pay"}
                  icon={<Send className="h-4 w-4" />}
                  label="Pay Someone"
                  onClick={() => setActiveTab("pay")}
                />
              </div>
            </div>

            {activeTab === "tag" ? (
              <Card className="rounded-[32px] px-6 py-8 text-center sm:px-10 sm:py-10">
                <p className="text-sm uppercase tracking-[0.2em] text-accent/90">My Tag</p>
                <p className="mt-3 text-sm text-secondary">
                  Wallet type: {resolveTagWalletType(tagRecord) === "solana" ? "Solana" : "EVM"}
                </p>
                <p className="mx-auto mt-4 max-w-2xl break-all text-2xl font-medium text-primary sm:text-3xl">
                  {publicUrl}
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <IconActionButton
                    label={copied ? "Copied" : "Copy"}
                    icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    onClick={handleCopyTagLink}
                  />
                  <IconActionLink
                    href={publicUrl ?? "#"}
                    label="Open"
                    icon={<ExternalLink className="h-5 w-5" />}
                  />
                  <IconActionButton
                    label="Share"
                    icon={<Send className="h-5 w-5" />}
                    onClick={handleShareTag}
                  />
                </div>
                <div className="mt-8 rounded-[24px] border border-border bg-background/60 p-5 text-left">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-accent/90">My Wallets</p>
                      <p className="mt-2 text-sm text-secondary">
                        Manage wallets linked to your Privii tag.
                      </p>
                    </div>

                    <WalletRow
                      label="EVM Wallet"
                      value={linkedEvmWallet}
                      isPrimary={resolveTagWalletType(tagRecord) === "evm"}
                      isBusy={isLinkingWallet && linkingWalletType === "evm"}
                      action={
                        linkedEvmWallet ? null : linkingWalletType === "evm" ? (
                          <div className="w-full max-w-[240px] space-y-2">
                            <Input
                              value={walletInputValue}
                              placeholder="Paste EVM address"
                              onChange={(event) => setWalletInputValue(event.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                type="button"
                                onClick={() => {
                                  setLinkingWalletType(null);
                                  setWalletInputValue("");
                                  setWalletLinkError(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="button" onClick={handleSaveLinkedWallet}>
                                Link wallet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-sm font-medium text-accent transition hover:text-accent/80"
                            onClick={() => {
                              setWalletLinkError(null);
                              setWalletInputValue("");
                              setLinkingWalletType("evm");
                            }}
                          >
                            Link
                          </button>
                        )
                      }
                    />

                    <WalletRow
                      label="Solana Wallet"
                      value={linkedSolanaWallet}
                      isPrimary={resolveTagWalletType(tagRecord) === "solana"}
                      isBusy={isLinkingWallet && linkingWalletType === "solana"}
                      action={
                        linkedSolanaWallet ? null : linkingWalletType === "solana" ? (
                          <div className="w-full max-w-[240px] space-y-2">
                            <Input
                              value={walletInputValue}
                              placeholder="Paste Solana address"
                              onChange={(event) => setWalletInputValue(event.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                type="button"
                                onClick={() => {
                                  setLinkingWalletType(null);
                                  setWalletInputValue("");
                                  setWalletLinkError(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="button" onClick={handleSaveLinkedWallet}>
                                Link wallet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-sm font-medium text-accent transition hover:text-accent/80"
                            onClick={() => {
                              setWalletLinkError(null);
                              setWalletInputValue("");
                              setLinkingWalletType("solana");
                            }}
                          >
                            Link
                          </button>
                        )
                      }
                    />

                    {walletLinkError ? (
                      <p className="text-sm text-red-400">{walletLinkError}</p>
                    ) : null}
                  </div>
                </div>
              </Card>
            ) : null}

            {activeTab === "links" ? (
              <Card className="rounded-[32px] px-6 py-8 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-accent/90">
                      Payment Links
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your links</h2>
                    <p className="mt-2 text-sm text-secondary">
                      Manage the PayLinks you&apos;ve already created.
                    </p>
                  </div>
                  <Link href="/create">
                    <Button className="w-full sm:w-auto">Create Link</Button>
                  </Link>
                </div>

                <div className="mt-8 space-y-4">
                  {links.length ? (
                    links.map((link) => (
                      <div
                        key={link.tag}
                        className="rounded-[24px] border border-border bg-background/60 p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-lg font-medium text-primary">
                              {link.ownerTag ? `@${link.ownerTag}` : link.tag}
                            </p>
                            <p className="text-sm text-secondary">
                              {link.paymentPurpose || "General payment"} •{" "}
                              {link.amount ? `${link.amount} ${link.token}` : "Custom amount"}
                            </p>
                          </div>
                          <Link href={`/pay/${link.tag}`}>
                            <Button variant="secondary" className="w-full sm:w-auto">
                              Open PayLink
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-secondary">No payment links yet</p>
                  )}
                </div>
              </Card>
            ) : null}

            {activeTab === "history" ? (
              <Card className="rounded-[32px] px-6 py-8 sm:px-8 sm:py-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-accent/90">
                    Payment History
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Activity</h2>
                </div>
                <div className="mt-6 space-y-4">
                  {historyError ? (
                    <p className="text-sm text-red-400">{historyError}</p>
                  ) : payments.length ? (
                    payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-[24px] border border-border bg-background/60 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-lg font-medium text-primary">
                              <span className="text-accent/90">
                                {payment.direction === "sent" ? "Sent" : "Received"}
                              </span>{" "}
                              • {payment.amount || "Pending"} {payment.asset}
                            </p>
                            <p className="text-sm text-secondary">
                              {formatPaymentStatus(payment.status)} •{" "}
                              {new Date(
                                payment.confirmed_at || payment.updated_at || payment.created_at
                              ).toLocaleString()}
                            </p>
                            <p className="text-sm text-secondary">
                              {payment.direction === "sent" ? "To" : "From"}{" "}
                              {truncateCounterparty(payment, historyWalletAddress)}
                            </p>
                          </div>
                          {payment.tx_signature &&
                          (payment.explorer_url || payment.chain === "solana") ? (
                            <a
                              href={
                                payment.explorer_url ||
                                (payment.chain === "solana"
                                  ? `https://solscan.io/tx/${payment.tx_signature}`
                                  : "#")
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex"
                            >
                              <Button variant="secondary" className="w-full sm:w-auto">
                                View on Solscan
                              </Button>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-secondary">No payments yet</p>
                  )}
                </div>
              </Card>
            ) : null}

            {activeTab === "pay" ? (
              <Card className="rounded-[32px] px-6 py-8 sm:px-8 sm:py-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-accent/90">Quick Pay</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Pay Someone</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Paste a tag or payment link and continue with the existing payment flow.
                </p>
                <form className="mt-6 flex flex-col gap-4 sm:flex-row" onSubmit={handlePaySomeone}>
                  <Input
                    value={payTarget}
                    placeholder="prince or https://privii.xyz/prince"
                    onChange={(event) => setPayTarget(event.target.value)}
                  />
                  <Button className="w-full sm:w-auto">Continue</Button>
                </form>
              </Card>
            ) : null}
          </>
        ) : (
          <Card className="rounded-[32px] px-6 py-8 sm:px-8 sm:py-8">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-secondary">
              No Privii tag yet. Register your payment identity to unlock your dashboard.
            </p>
            <Link href="/get-started" className="mt-6 inline-flex">
              <Button>Get Started</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition ${
        active
          ? "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(124,92,255,0.16)]"
          : "text-secondary hover:bg-white/[0.03] hover:text-primary"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
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
      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/60 text-primary transition hover:border-white/20 hover:bg-white/[0.04]"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function IconActionLink({
  href,
  icon,
  label
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
      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/60 text-primary transition hover:border-white/20 hover:bg-white/[0.04]"
      aria-label={label}
      title={label}
    >
      {icon}
    </a>
  );
}

function formatPaymentStatus(status: PaymentRecord["status"]) {
  switch (status) {
    case "initialized":
      return "Initialized";
    case "submitted":
      return "Submitted";
    case "confirmed":
      return "Confirmed";
    case "failed":
      return "Failed";
    case "expired":
      return "Expired";
    default:
      return "Pending";
  }
}

function WalletRow({
  action,
  isPrimary = false,
  isBusy = false,
  label,
  value
}: {
  action?: ReactNode;
  isPrimary?: boolean;
  isBusy?: boolean;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-border bg-card/40 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-secondary">{label}</p>
          {value && isPrimary ? (
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
              Receiving wallet
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-primary">
          {value ? truncateWalletAddress(value) : "Not linked"}
        </p>
      </div>
      <div className="shrink-0">
        {isBusy ? (
          <span className="inline-flex items-center gap-2 text-sm text-secondary">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Linking
          </span>
        ) : (
          action
        )}
      </div>
    </div>
  );
}

function truncateCounterparty(payment: PaymentHistoryItem, walletAddress: string) {
  const rawCounterparty =
    payment.direction === "sent" ? payment.recipient_wallet : payment.payer_wallet;

  if (!rawCounterparty) {
    return "Unknown wallet";
  }

  if (rawCounterparty === walletAddress) {
    return "Your wallet";
  }

  return truncateWalletAddress(rawCounterparty);
}
