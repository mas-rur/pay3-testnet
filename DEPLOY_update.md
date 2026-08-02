# Deploying your testnet

Two separate deployments, in this order:

1. **`l1_node`** → Railway or Fly.io (needs to run continuously, so it can't go on Vercel)
2. **`testnet-dashboard`** → Vercel (a normal frontend, this is the part Vercel is actually for)

Do them in that order — the dashboard needs the node's live URL before it's useful.

---

## Part 1: Deploy the node (pick one host)

Both work the same way once live — a public HTTPS URL your dashboard and
`wallet.js` point at. Pick whichever gets you unblocked.

### Option A: Railway (doesn't require a card to start)

Railway's free trial ($5 of usage credit, ~30 days) doesn't ask for a card
at signup — good if your cards keep declining on Fly.io. It auto-detects
the `Dockerfile` already in `l1_node/`, so no extra config needed.

**1. Install the CLI**

```bash
npm i -g @railway/cli
```

**2. Log in**

```bash
railway login
```

Opens a browser to sign up (GitHub login is fastest) or log in.

**3. Generate a stable faucet key** (same as the Fly.io steps below)

```bash
cd l1_node
openssl rand -hex 32
```

Copy the output.

**4. Create the project and deploy**

```bash
railway init
railway up
```

`railway init` creates a new Railway project; `railway up` builds your
`Dockerfile` and deploys it. First build takes a couple minutes.

**5. Set the faucet key**

```bash
railway variable set FAUCET_PRIVATE_KEY=0x<paste_the_hex_from_step_3>
```

Railway redeploys automatically when a variable changes.

**6. Expose it publicly**

```bash
railway domain
```

Prints a URL like `https://l1-node-production-xxxx.up.railway.app` — that's
your node's public RPC URL, the same role `https://<app>.fly.dev` plays below.

**7. Verify**

```bash
curl https://<your-railway-url>/health
```

Should return `{"status":"ok"}`.

**Prefer clicking through a UI instead of the CLI?** Push `l1_node/` to a
GitHub repo, then in Railway: **New Project → Deploy from GitHub repo** →
pick it → set any env vars under the **Variables** tab → **Settings →
Networking → Generate Domain**.

One honest caveat: the $5 trial credit is enough to keep a small service
like this running for a while, but it's not unlimited — once it runs out
you'll be asked to add a card to continue (Railway's Hobby tier is $5/mo).
So this gets you unblocked *now*; the card question may resurface later
once you're past the trial. If it does and the decline issue is still
unresolved, it's worth asking your bank specifically whether the card is
enabled for international/online transactions — that's the single most
common cause of these platforms' small authorization holds getting rejected.

### Option B: Fly.io (requires a card)

Keep this if you get a working card later, or already have one that works
for other services.

### 1. Install the Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```
(or see [fly.io/docs/flyctl/install](https://fly.io/docs/flyctl/install/) for
Windows/other options)

### 2. Log in

```bash
flyctl auth login
```

Opens a browser to sign up/log in. Free account is enough to start.

### 3. Generate a stable faucet key (do this once)

```bash
cd l1_node
openssl rand -hex 32
```

Copy the output — this becomes your permanent faucet private key so it doesn't
change every time you redeploy.

### 4. Launch the app

```bash
flyctl launch --no-deploy
```

- It'll ask to reuse the `fly.toml` already in this folder — say yes.
- If the app name `pay3-l1-testnet` is taken, it'll ask you to pick a new one
  (edit the `app = "..."` line in `fly.toml`, or accept its suggestion).
- Choose a region close to you or your users.

### 5. Set the faucet key as a secret

```bash
flyctl secrets set FAUCET_PRIVATE_KEY=0x<paste_the_hex_from_step_3>
```

Secrets are encrypted and injected as env vars — never hardcode this in the repo.

### 6. Deploy

```bash
flyctl deploy
```

This builds the `Dockerfile` on Fly's servers and starts the container. Takes
a couple minutes the first time.

### 7. Verify it's live

```bash
curl https://<your-app-name>.fly.dev/health
```

Should return `{"status":"ok"}`. Then:

```bash
curl https://<your-app-name>.fly.dev/account/<faucet_address_from_step_3>
```

To get the faucet **address** (not just the private key), run the node
locally once with that same key to print it:

```bash
FAUCET_PRIVATE_KEY=0x<your_key> cargo run
```

Copy the `faucet address` line, then Ctrl+C — you don't need to keep this
local instance running.

**Redeploys wipe the chain**, on either host. State lives entirely in RAM
(see `l1_node/README.md` → "what's simplified"). Every deploy, and any
crash/restart, resets the chain back to genesis. The faucet *address* stays
the same (because of the env var/secret you set), but its balance resets to
1,000,000 and every account/transaction since genesis is gone. Fine for a
testnet in active development; add the RocksDB persistence step before
anyone should treat balances as durable.

---

## Part 2: Deploy the dashboard to Vercel

### 1. Install the Vercel CLI

```bash
npm install -g vercel
```

### 2. Point it at your node

```bash
cd testnet-dashboard
vercel env add NEXT_PUBLIC_RPC_URL
```

When prompted, paste your node's public URL from Part 1 — e.g.
`https://l1-node-production-xxxx.up.railway.app` (Railway) or
`https://<your-app-name>.fly.dev` (Fly.io) — no trailing slash, and select
all three environments (Production, Preview, Development).

### 2b. Give the dashboard's Faucet page its own copy of the faucet key

The Faucet page is powered by a serverless API route (`app/api/faucet`) that
signs and submits transactions on the faucet's behalf — so it needs the
**same** `FAUCET_PRIVATE_KEY` you generated and set on the node in Part 1.

```bash
vercel env add FAUCET_PRIVATE_KEY
```

Paste the same `0x...` hex key from Part 1, step 3, again for all three
environments. It's stored server-side only (no `NEXT_PUBLIC_` prefix), so it
never reaches the browser — same handling as on the node: treat it as a
secret, and rotate it if a collaborator with access to it leaves.

Skip this step if you're fine leaving the Faucet page unavailable — every
other page (Overview, Explorer, Wallet) works without it.

### 3. Deploy

```bash
vercel --prod
```

First run asks a few setup questions (link to a Vercel account/project) —
defaults are fine for all of them.

### 4. Open it

Vercel prints a URL like `https://testnet-dashboard-xyz.vercel.app`. Open it,
go to the **Balance** tab, and paste in the faucet address from Part 1 — you
should see `1000000`.

### Prefer GitHub instead of the CLI?

Push both folders to a repo, then in the Vercel dashboard: **Add New →
Project → Import** that repo, set the **Root Directory** to
`testnet-dashboard`, and add `NEXT_PUBLIC_RPC_URL` under **Settings →
Environment Variables** before deploying. Every push to `main` auto-deploys
after that.

---

## Quick sanity check once both are live

```bash
# from your own machine, using the wallet CLI against the live node
cd l1_node/client
RPC_URL=https://<your-node-url> node wallet.js balance <faucet_address>
```

Should match what the Vercel dashboard shows.

---

## Security notes for a public testnet

- The faucet private key is a **testnet-only** secret. Never reuse it, never
  fund it with anything of real value, and treat it as public once it's
  stored as a platform secret/variable other collaborators can see (rotate
  it if you add/remove team members).
- Nothing in this stack is audited. Don't point real users at it as anything
  more than a demo/testnet.
- CORS is currently wide open (`Any` origin) so the dashboard can reach it
  from `*.vercel.app`. Fine for a testnet; tighten to your dashboard's exact
  domain in `l1_node/src/rpc.rs` before it matters.
