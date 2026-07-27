# l1_node — Step-by-Step Guide

> Want to put this on a public testnet + a Vercel dashboard instead of just
> running it locally? See `../DEPLOY.md`.

Everything you need to run your own copy of the chain, create a wallet, send
a transaction, and check balances and history. No blockchain experience
assumed beyond what you already know from building pay3-wallet.

Two programs are involved:

| Program | Language | Job | Where it runs |
|---|---|---|---|
| `l1_node` | Rust | the actual blockchain — mempool, blocks, state | your machine, listens on `http://localhost:8080` |
| `client/wallet.js` | Node.js | a CLI wallet that talks to the node over that RPC | your machine, run from the `client/` folder |

They're two separate terminal windows: **one stays running** (the node),
**the other is where you type wallet commands**.

---

## Step 0: What you need installed

- **Rust** (`cargo --version` should work) — installs the node
- **Node.js** (`node --version` should work) — installs the wallet CLI
- **ethers.js** — installed automatically in Step 2

If `cargo` isn't installed: `apt-get install cargo rustc` (Linux) or see
[rust-lang.org/tools/install](https://www.rust-lang.org/tools/install).

---

## Step 1: Start the node

In terminal window #1:

```bash
cd l1_node
cargo run
```

First run compiles everything (~1 minute). After that you'll see:

```
================  l1_node dev chain  ================
faucet address : 0xede5a99fe4860f75b23dfe4c55a824c3dddf7354
faucet privkey : 0xf1481336...  (dev only, do not reuse)
faucet balance : 1000000
block time     : 3s
rpc listening  : http://0.0.0.0:8080
=======================================================
```

**Leave this running.** This is your blockchain — it's now producing a new
block every 3 seconds and listening for requests on port `8080`.

Copy the `faucet address` and `faucet privkey` somewhere — that account
starts with 1,000,000 units and is the only funded account when the chain
starts, so everything else gets funded *from* it.

---

## Step 2: Set up the wallet tool

In terminal window #2 (leave window #1 running):

```bash
cd l1_node/client
npm install
```

This installs `ethers`, which `wallet.js` uses to sign transactions — same
library you already use in pay3-wallet.

---

## Step 3: Create a wallet

```bash
node wallet.js new
```

```
New wallet created:

  address     : 0x41B09fB854D3669a466CFC2A004448EaaA4Dbb56
  private key : 0x5d5c54fd2a12181317072b58e4f5ba6edbafa52ebbed01f9e27b7cb2ba9efa72
```

This is a brand new, unfunded account. Save the private key — it's the only
way to spend from that address later.

---

## Step 4: Check your balance

```bash
node wallet.js balance <address>
```

```
0x41b09fb854d3669a466cfc2a004448eaaa4dbb56
  balance : 0
  nonce   : 0
```

`0`, as expected — you haven't received anything yet. (`nonce` counts how
many transactions this address has *sent*; you need it to send, but
`wallet.js` fills it in for you automatically.)

---

## Step 5: Get funds (send from the faucet)

Use the **faucet private key** from Step 1 to send your new wallet some funds:

```bash
node wallet.js send <faucet_privkey> <your_new_address> <amount>
```

Example:

```bash
node wallet.js send 0xf1481336...653a1c0 0x41B09fB854D3669a466CFC2A004448EaaA4Dbb56 10000
```

```
sent 10000 from 0xede5a99fe4860f75b23dfe4c55a824c3dddf7354 to 0x41B09fB854D3669a466CFC2A004448EaaA4Dbb56 (nonce 0)
tx_hash: 0x7ae162d3baf222998fce32b10cfec78469be37994190dc0414855b61dd071b3a
```

The transaction is now in the mempool. **Wait ~3-5 seconds** for the node
to seal the next block (watch window #1 — you'll see `[block 1] 1 tx(s) ...`
printed).

---

## Step 6: Check your balance again

```bash
node wallet.js balance <your_new_address>
```

```
0x41b09fb854d3669a466cfc2a004448eaaa4dbb56
  balance : 10000
  nonce   : 0
```

Funded. `nonce` is still `0` because *this* address hasn't sent anything yet
— that changes once you send from it.

---

## Step 7: Send a transaction

Now send from your own wallet to any other address:

```bash
node wallet.js send <your_privkey> <to_address> <amount>
```

```
sent 2500 from 0x41b09fb854d3669a466cfc2a004448eaaa4dbb56 to 0x00000000000000000000000000000000c0ffee00 (nonce 0)
tx_hash: 0xf5db88ecc60fa1586a57f663a2eb4bf2f65990742333fed752294996ed1e9d65
```

Wait for the next block, then check both sides:

```bash
node wallet.js balance <your_address>     # went down by 2500
node wallet.js balance <to_address>       # went up by 2500
```

---

## Step 8: View transaction history

```bash
node wallet.js history <address>
```

```
2 transaction(s) for 0x41b09fb854d3669a466cfc2a004448eaaa4dbb56

block    1  <- received     10000  from 0xede5a99fe4860f75b23dfe4c55a824c3dddf7354  (0x7ae162d3ba...)
block    2  -> sent          2500  to   0x00000000000000000000000000000000c0ffee00  (0xf5db88ecc6...)
```

Shows every transaction the address has been part of, in either direction,
oldest first.

---

## Quick command reference

| What you want | Command |
|---|---|
| Start the chain | `cargo run` (from `l1_node/`) |
| Create a wallet | `node wallet.js new` |
| Check a balance | `node wallet.js balance <address>` |
| View history | `node wallet.js history <address>` |
| Send funds | `node wallet.js send <your_privkey> <to_address> <amount>` |
| Send with a specific nonce | `node wallet.js send <privkey> <to> <amount> <nonce>` |
| Dump the whole chain (debug) | `curl http://localhost:8080/chain` |

All wallet commands accept `RPC_URL=http://otherhost:8080` before them if
your node isn't on `localhost`.

---

## Troubleshooting

- **`ECONNREFUSED` from wallet.js** — the node (window #1) isn't running, or
  crashed. Check that window for an error.
- **`"bad nonce"` on send** — someone else's transaction from that address
  already used that nonce. Omit the nonce argument and let `wallet.js`
  auto-fill the current one.
- **`"insufficient balance"`** — check `wallet.js balance` first; you're
  trying to send more than the account holds.
- **Balance/history not updated right after sending** — normal, wait for
  the next block (every 3 seconds — watch window #1's log).
- **Restarted the node and balances reset to zero** — expected for now,
  the chain is in-memory only (see "what's simplified" below).

---

## What's simplified (and what to build next)

This is a **teaching/prototype skeleton**, not a production chain:

- **Consensus** is single-authority — one process seals every block on a
  timer. Next: a real validator set with BFT voting.
- **No networking yet** — one process, one RPC. Next: `rust-libp2p` so
  multiple nodes gossip and agree together.
- **State root** is a simple hash, not a provable Merkle/Verkle trie.
- **Execution** only understands transfers. Next: `revm` for full EVM
  compatibility.
- **Storage is in-memory** — restarting the node wipes the chain. Next:
  persist to RocksDB.
- **History** is computed by scanning every block on each request — fine
  for a devnet, a real chain indexes this instead.

See `blockchain-l1-architecture-guide.md` for the full picture of how each
of these pieces fits together.
