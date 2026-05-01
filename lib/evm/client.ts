import { createPublicClient, decodeEventLog, formatUnits, http, parseUnits } from "viem";
import { erc20Abi } from "viem";

import { getEvmNetworkOption, getEvmRpcUrl } from "@/lib/evm/chains";
import { getEvmTokenConfig } from "@/lib/evm/tokens";
import type { EvmNetwork, PaymentAsset } from "@/lib/types";

const publicClients = new Map<EvmNetwork, ReturnType<typeof createPublicClient>>();

export function getEvmPublicClient(network: EvmNetwork) {
  const cached = publicClients.get(network);

  if (cached) {
    return cached;
  }

  const option = getEvmNetworkOption(network);
  const client = createPublicClient({
    chain: option.chain,
    transport: http(getEvmRpcUrl(network))
  });
  publicClients.set(network, client);
  return client;
}

export function parseEvmAmount(amount: string, asset: PaymentAsset, network: EvmNetwork) {
  const token = getEvmTokenConfig(network, asset);

  if (!token) {
    return null;
  }

  try {
    return parseUnits(amount, token.decimals);
  } catch {
    return null;
  }
}

export function formatEvmAmount(amount: bigint, asset: PaymentAsset, network: EvmNetwork) {
  const token = getEvmTokenConfig(network, asset);

  if (!token) {
    return amount.toString();
  }

  return formatUnits(amount, token.decimals);
}

export async function verifyEvmTransaction(input: {
  network: EvmNetwork;
  asset: PaymentAsset;
  recipientWallet: `0x${string}`;
  payerWallet: `0x${string}`;
  txHash: `0x${string}`;
  expectedAmount: string;
}) {
  const token = getEvmTokenConfig(input.network, input.asset);

  if (!token) {
    return { ok: false as const };
  }

  const expectedAmount = parseEvmAmount(input.expectedAmount, input.asset, input.network);

  if (!expectedAmount || expectedAmount <= BigInt(0)) {
    return { ok: false as const };
  }

  const client = getEvmPublicClient(input.network);

  try {
    const receipt = await client.getTransactionReceipt({ hash: input.txHash });

    if (receipt.status !== "success") {
      return { ok: false as const };
    }

    if (token.isNative) {
      const tx = await client.getTransaction({ hash: input.txHash });

      if (
        tx.from.toLowerCase() !== input.payerWallet.toLowerCase() ||
        !tx.to ||
        tx.to.toLowerCase() !== input.recipientWallet.toLowerCase() ||
        tx.value < expectedAmount
      ) {
        return { ok: false as const };
      }

      return {
        ok: true as const,
        amount: formatEvmAmount(tx.value, input.asset, input.network),
        explorerUrl: `${token.explorerUrl}${input.txHash}`
      };
    }

    if (!token.contractAddress) {
      return { ok: false as const };
    }

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== token.contractAddress.toLowerCase()) {
        continue;
      }

      try {
        const decoded = decodeEventLog({
          abi: erc20Abi,
          data: log.data,
          topics: log.topics,
        });

        if (
          decoded.eventName === "Transfer" &&
          String(decoded.args.from).toLowerCase() === input.payerWallet.toLowerCase() &&
          String(decoded.args.to).toLowerCase() === input.recipientWallet.toLowerCase() &&
          BigInt(decoded.args.value) >= expectedAmount
        ) {
          return {
            ok: true as const,
            amount: formatEvmAmount(BigInt(decoded.args.value), input.asset, input.network),
            explorerUrl: `${token.explorerUrl}${input.txHash}`
          };
        }
      } catch {
        continue;
      }
    }

    return { ok: false as const };
  } catch {
    return { ok: false as const };
  }
}
