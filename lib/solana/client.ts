import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";

import { USDC_MINT_ADDRESS } from "@/lib/solana";

export async function addUsdcTransfer({
  connection,
  transaction,
  sender,
  recipient,
  amount
}: {
  connection: Connection;
  transaction: Transaction;
  sender: PublicKey;
  recipient: PublicKey;
  amount: number;
}) {
  const senderAta = getAssociatedTokenAddressSync(USDC_MINT_ADDRESS, sender);
  const recipientAta = getAssociatedTokenAddressSync(USDC_MINT_ADDRESS, recipient);
  let senderAccount;

  try {
    senderAccount = await getAccount(connection, senderAta);
  } catch {
    throw new Error("USDC wallet not initialized");
  }

  const requiredAmount = BigInt(Math.round(amount * 1_000_000));
  const solBalanceLamports = await connection.getBalance(sender, "confirmed");

  if (solBalanceLamports < Math.round(0.002 * LAMPORTS_PER_SOL)) {
    throw new Error("Insufficient SOL for transaction fees");
  }

  if (senderAccount.amount < requiredAmount) {
    throw new Error("Insufficient USDC balance");
  }

  try {
    await getAccount(connection, recipientAta);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientAta,
        recipient,
        USDC_MINT_ADDRESS
      )
    );
  }

  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      USDC_MINT_ADDRESS,
      recipientAta,
      sender,
      Number(requiredAmount),
      6,
      [],
      TOKEN_PROGRAM_ID
    )
  );
}

export async function fetchLatestBlockhashWithRetry(connection: Connection) {
  try {
    return await connection.getLatestBlockhash("confirmed");
  } catch (error) {
    console.error("Blockhash fetch error:", error);
    return connection.getLatestBlockhash("confirmed");
  }
}
