# Privii

Privii is a dark-mode MVP for registering crypto payment tags backed by Vercel KV. Users connect a supported wallet, claim a Privii identity, and accept SOL or USDC without exposing the recipient wallet in the public UI.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vercel deployment
- Vercel KV via `@vercel/kv`
- Solana wallet support with Phantom, Solflare, Backpack, Glow, and `@solana/wallet-adapter`

## Features

- Connect a supported Solana wallet
- Register a Privii tag and reuse it as a payment identity
- Keep one-time PayLinks available at `/pay/[slug]` for testing and ad hoc payment requests
- Optional fixed amount or payer-entered custom amount
- SOL and USDC payment support
- KV-backed API routes for tags and PayLinks
- Responsive dark UI with onboarding, dashboard placeholders, copy/share actions, and loading states
- Payment success page with transaction hash

## Environment variables

Create a `.env.local` file:

```bash
# Vercel KV REST endpoint URL for @vercel/kv reads and writes.
KV_REST_API_URL=

# Vercel KV REST token for @vercel/kv authentication.
KV_REST_API_TOKEN=

# Optional: override the Solana RPC endpoint used by the app.
NEXT_PUBLIC_SOLANA_RPC_URL=
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Vercel KV setup

1. Create a Vercel KV database in your Vercel project.
2. Add `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project environment variables.
3. Redeploy after adding the variables.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add the environment variables above.
4. Deploy.

## API routes

- `POST /api/links/create`
- `GET /api/links/[slug]`
- `POST /api/tags/create`
- `GET /api/tags/[tag]`
- `GET /api/tags/by-owner/[wallet]`

## Wildcard subdomain setup

Domain: `privii.cash`

Required DNS:

- Type: `CNAME`
- Name: `*`
- Value: `cname.vercel-dns.com`

Fallback route:

- `privii.xyz/[tag]`

## Notes

- Recipient wallet addresses are stored in KV and used for on-chain transfers, but are not rendered on the public payment UI.
- Public tag pages keep the wallet hidden in the UI today, and private receive addresses are marked as coming soon.
- The app defaults to Solana mainnet RPC unless `NEXT_PUBLIC_SOLANA_RPC_URL` is provided.
- For USDC transfers, the payer wallet covers any associated token account creation needed for the recipient.
