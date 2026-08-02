# testnet-dashboard

A live dashboard for `l1_node`: browse blocks and transactions, look up any
address, request testnet tokens from the faucet, and create or import a
wallet that's saved locally on your device. Built with Next.js + Tailwind,
styled after chain.base.org/vibenet, meant to be deployed on Vercel and
pointed at a publicly hosted node.

## Local development

```bash
npm install
cp .env.example .env.local   # already points at http://localhost:8080
npm run dev
```

Needs an `l1_node` instance running (see `../l1_node/README.md`). Copy the
"faucet privkey" line it prints on startup into `.env.local` as
`FAUCET_PRIVATE_KEY` if you want to test the Faucet page locally.

## Configuration

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_RPC_URL` | The node's RPC base URL | `https://pay3-l1-testnet.fly.dev` |
| `FAUCET_PRIVATE_KEY` | Faucet signing key (server-side only). Same key as the node's `FAUCET_PRIVATE_KEY`. Optional -- the Faucet page just shows "unavailable" without it. | `0x...` |

Set these in `.env.local` for local dev, or as Vercel project environment
variables for production (see `../DEPLOY.md`).

## Branding

Chain name, token symbol, faucet amount, and the daily faucet limit are all
in one place: `lib/chain-config.ts`. Drop your logo at `public/logo.png` --
it's picked up automatically (falls back to a plain badge until it's there).

## Pages

- **Overview** (`/`) -- network stats and the latest blocks
- **Explorer** (`/explorer`) -- paginated block and transaction lists, plus
  `/explorer/block/[index]` and `/explorer/address/[address]` detail pages
- **Faucet** (`/faucet`) -- request test tokens, capped at
  `FAUCET_DAILY_LIMIT` (default 3) requests per address per rolling 24h,
  enforced server-side in `app/api/faucet/route.ts`
- **Wallet** (`/wallet`) -- create or import a wallet, saved to this
  browser's `localStorage` only; balance, send, and history for whichever
  wallet is active

All backed by `lib/rpc.ts` (talks to the node) and `lib/wallet.ts`
(client-side secp256k1 signing + local wallet storage, mirrors
`l1_node/client/wallet.js`'s derivation exactly).
