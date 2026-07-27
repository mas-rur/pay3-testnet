# testnet-dashboard

A live dashboard for `l1_node`: check balances, view transaction history,
send transactions (signed client-side, key never leaves the browser), and
generate new wallets. Built with Next.js + Tailwind, meant to be deployed
on Vercel and pointed at a publicly hosted node.

## Local development

```bash
npm install
cp .env.example .env.local   # already points at http://localhost:8080
npm run dev
```

Needs an `l1_node` instance running (see `../l1_node/README.md`).

## Configuration

One environment variable controls everything:

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_RPC_URL` | The node's RPC base URL | `https://pay3-l1-testnet.fly.dev` |

Set it in `.env.local` for local dev, or as a Vercel project environment
variable for production (see `../DEPLOY.md`).

## Pages

One page, four tabs: **Balance**, **History**, **Send**, **New wallet** —
all backed by `lib/rpc.ts` (talks to the node) and `lib/wallet.ts` (client-side
secp256k1 signing, mirrors `l1_node/client/wallet.js` exactly).
