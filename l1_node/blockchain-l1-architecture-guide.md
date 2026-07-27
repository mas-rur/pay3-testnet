# Building an L1: From Code to Transaction

A reference for designing a custom Layer‑1 blockchain — how the pieces connect, how a wallet actually talks to the network, and what to build the whole thing in.

---

## 1. The Five Layers of Any Blockchain

Every blockchain — Bitcoin, Ethereum, Solana, or the one you're about to build — is really five cooperating subsystems running on every node:

| Layer | Job | Typical components |
|---|---|---|
| **Network (P2P)** | Discover peers, gossip transactions and blocks | libp2p, devp2p, custom gossip |
| **Consensus** | Agree on transaction *order* and finalize it | PoW, PoS+BFT, DAG-based |
| **Execution** | Run the transactions, update state | EVM, WASM VM, native runtime |
| **State / Storage** | Persist account balances & contract data, prove integrity | Merkle/Verkle trees + RocksDB/LevelDB |
| **API / RPC** | Let wallets and apps read state and submit transactions | JSON-RPC, gRPC, WebSockets |

A node binary is just these five modules wired together in a loop: **listen → validate → order → execute → commit → serve**. When you write your L1's codebase, you are writing (or choosing a library for) each of these five things.

---

## 2. Anatomy of a Transaction: Wallet → Finality

This is the part that ties directly into the wallet work you've already done with ethers.js — it's the same flow, just with your own chain on the other end of the RPC call.

```
[Wallet]
   │  1. Build the tx (to, value, data, nonce, gasLimit/fee)
   │  2. Sign it locally with the private key (ECDSA/secp256k1 or EdDSA)
   ▼
[Your RPC Node]  ── e.g. eth_sendRawTransaction / your own method
   │  3. Node verifies signature, nonce, balance, format
   ▼
[Mempool]  ── the node's local pending-tx pool, sorted by fee
   │  4. Node gossips the tx to peers over the P2P layer
   ▼
[Every other node's mempool converges on the same set of pending txs]
   │  5. A validator is selected for the current slot/round
   ▼
[Block Proposal]  ── proposer packs txs from mempool into a block
   │  6. Execution engine runs each tx → new account/contract state
   ▼
[New State Root]  ── a single hash committing to the entire state
   │  7. Proposed block + state root broadcast to all validators
   ▼
[Consensus Voting]  ── validators sign off once ≥2/3 of stake agrees
   │  8. Finality reached — the block cannot be reverted
   ▼
[Finalized Block]  ── propagated to every full node, added to the chain
   │  9. Wallet polls (or subscribes over WebSocket) for the receipt
   ▼
[Wallet]  ── shows "confirmed" ✅
```

Nothing here is magic — it's the same request/response and pub-sub patterns you already use with Alchemy endpoints, just self-hosted on infrastructure you control end to end.

---

## 3. What's Actually Inside a Node's Codebase

If you strip away the marketing language, an L1 client repo is these modules:

- **`p2p/`** — peer discovery (Kademlia DHT, bootnodes), gossip protocol for txs and blocks, peer scoring/banning for spam resistance.
- **`mempool/`** — a priority queue of pending, signature-valid transactions; handles nonce ordering per account and fee-based prioritization; rejects duplicates/replays.
- **`consensus/`** — leader/validator selection, block proposal, voting rounds, fork-choice rule, finality gadget. This is the most safety-critical module — bugs here can fork or halt the chain.
- **`execution/`** (your VM) — the deterministic state-transition function: given a state + a transaction, produce a new state. Either an EVM implementation (like [revm](https://github.com/bluealloy/revm) in Rust or geth's in Go), a WASM runtime, or a fully custom instruction set.
- **`state/`** — the actual key-value store (RocksDB/LevelDB) plus a Merkle-style structure (Patricia trie, or newer Verkle trees) so any state value can be cryptographically proven against a single root hash.
- **`rpc/`** — the JSON-RPC/gRPC server wallets and dApps call. This is your chain's *entire public interface* — everything else is invisible to users.
- **`cli/` & node ops** — config, validator key management, metrics/monitoring.

Building an L1 is essentially building all six of these to work together deterministically — every honest node must reach the exact same state given the exact same transaction history.

---

## 4. How a Wallet Actually "Connects" to the Network

Worth demystifying since it's central to what you're building: a wallet doesn't hold a persistent connection to "the blockchain." It just talks to **one RPC node** (yours, or any node exposing your chain's API), the same way `ethers.JsonRpcProvider` talks to Alchemy today.

```js
// This is *all* "connecting to a blockchain" means at the code level
const provider = new ethers.JsonRpcProvider("https://rpc.yourl1.io");

// Reading state — a stateless HTTPS call, nothing "live" about it
const balance = await provider.getBalance(address);

// Submitting a transaction
const signedTx = await wallet.signTransaction(txRequest);
const txHash = await provider.send("eth_sendRawTransaction", [signedTx]);

// Waiting for confirmation — either polling or a WebSocket subscription
const receipt = await provider.waitForTransaction(txHash);
```

Design decisions that fall out of this for your L1:

- **EVM-compatible RPC** (mirror `eth_*` methods) → every existing wallet, MetaMask, and your own ethers.js code works against your chain with zero changes on the client side. Huge practical shortcut.
- **Fully custom RPC schema** → total design freedom, but you rebuild wallets, SDKs, explorers, and indexers from scratch. Bigger commitment, bigger differentiation.
- **Full node vs. light client vs. archive node** — wallets typically talk to a full node (has current state) rather than an archive node (keeps *all* historical state, much heavier). Deciding what "light clients" look like on your chain matters for how accessible it is to run infrastructure.

---

## 5. Engineering for Speed, Security, and Low Fees

These three goals are in real tension with each other (the "blockchain trilemma" also includes decentralization) — here's where the actual levers are.

**Consensus mechanism.** Classic Nakamoto consensus (PoW/longest-chain) gives probabilistic finality — you wait for confirmations to feel safe. Modern BFT-style PoS consensus (CometBFT, HotStuff-family, Monad's own "MonadBFT") gives **deterministic, sub-second finality**: once ≥2/3 of stake signs a block, it's final, full stop. If "super fast" is a core goal, a pipelined BFT consensus is almost certainly your starting point over anything PoW-based.

**Parallel execution.** The biggest recent lever for throughput. Instead of executing transactions one-by-one, analyze which transactions actually touch overlapping state and run the non-conflicting ones across CPU cores simultaneously. Solana's Sealevel, Aptos's Block-STM, and Monad's parallel execution engine are all variations on this idea — <cite index="6-1">Monad's parallel execution lets it handle many transactions simultaneously instead of processing them one after another, keeping the network fast under load</cite>. Monad also pipelines consensus and execution so the next block can be voted on while the previous one is still executing, rather than doing everything strictly in sequence.

**Fee design.** "Lowest fee" mostly falls out of throughput — the same demand spread across a much higher TPS ceiling means a much lower price-per-transaction in a fee-market model. You still need *some* anti-spam mechanism (a fee, however small, or stake-weighted rate limiting) or the mempool becomes trivially spammable. <cite index="6-1">Monad targets roughly 10,000 TPS with sub-second finality</cite> as its answer to this, while a project like MegaETH pushes even further — <cite index="11-1">it's built with a parallel node architecture that splits work across ordering, execution, and authentication roles to reach Web2-level performance with Ethereum-grade security</cite>, and <cite index="12-1">is aiming for over 100,000 transactions per second with sub-millisecond latency</cite>. Note MegaETH is an L2 settling to Ethereum, not a standalone L1 — but the execution-layer techniques transfer directly to L1 design.

**State growth & decentralization.** More throughput means more state written per second. If state grows unbounded, hardware requirements to run a node climb, and fewer people can afford to validate — quietly recentralizing your "decentralized" chain. Plan for state pruning/expiry from day one, not as a later patch.

**Validator key security.** Since you already think about secure key custody (hardware, secure elements) for wallets — the same problem exists on the other side of the network: validator signing keys are a prime target, and production chains typically isolate them behind HSMs or secure enclaves rather than leaving them as a plain file on a cloud VM.

---

## 6. Rust vs. Go — Which One For This

Both are legitimate, both have shipped real chains. The honest answer depends on what you're optimizing for.

| | **Rust** | **Go** |
|---|---|---|
| Memory model | Manual-but-safe via ownership/borrow checker — no garbage collector | Garbage collected — simpler to write, but introduces GC pause latency |
| Raw performance | Near C/C++, zero-cost abstractions | Very good, but a step below Rust for CPU-bound, latency-critical code |
| Concurrency | "Fearless concurrency" — compiler prevents data races at compile time; async via `tokio` | Goroutines + channels — famously easy to write, mature scheduler |
| Latency predictability | No GC pauses → more predictable tail latency (matters for sub-second finality targets) | GC pauses are small in modern Go but non-zero and less predictable under load |
| Learning curve | Steep — lifetimes and the borrow checker take real time to internalize | Gentle — productive within days |
| Time to a working prototype | Slower — you'll fight the compiler early on | Faster — much quicker to get an MVP chain running |
| Compile-time safety | Whole classes of memory bugs and data races are impossible to compile — valuable for consensus-critical code where a bug can fork or crash the chain | Relies more on runtime testing and discipline |
| Proven high-performance L1s built in it | Solana, NEAR, Polkadot/Substrate, Aptos, Sui, and Monad (execution + consensus, alongside C++) | Cosmos SDK / CometBFT, go-ethereum (Geth) |
| Networking libraries | `rust-libp2p`, mature `tokio` ecosystem | `go-libp2p` — the original libp2p implementation, extremely battle-tested (also used by IPFS) |

**My honest take:** given your stated goals — fastest, most secure, lowest fee — **Rust is the stronger choice**, for the same reason it's what nearly every recent performance-focused L1 has reached for: no GC pauses means more predictable latency in exactly the consensus/execution code paths where sub-second finality is being engineered, and the compiler catching memory bugs and data races *before* they ship is a big deal when a consensus bug means a chain fork or halt in production, not just a crashed process you restart.

Go is genuinely still the right call if your actual constraint is team velocity — a solo builder or small team can get a working testnet out the door in Go dramatically faster, and it's what you'd want if deep interoperability with the Cosmos/IBC ecosystem matters to you. Plenty of production chains run fine in Go; it just isn't the top pick when the explicit goal is squeezing out every millisecond.

A common middle path worth knowing about: **build the execution/consensus core in Rust, using an existing library instead of writing everything from zero** — e.g. `revm` for an EVM-compatible execution engine, `rust-libp2p` for networking, `tokio` for async, `jsonrpsee` for the RPC server. That gets you most of Rust's performance ceiling without hand-rolling a VM.

---

## 7. Practical Path Forward

You have three realistic starting points, in increasing order of control (and effort):

1. **Fork/extend an existing framework**
   - **Cosmos SDK + CometBFT** (Go) — batteries-included: consensus, P2P, and a module system are done for you; built-in IBC for cross-chain interoperability. Fastest way to a working custom chain.
   - **Substrate** (Rust, Polkadot ecosystem) — modular "pallets" for consensus/execution, compiles your runtime to WASM. More flexible than Cosmos SDK, steeper learning curve.
2. **Custom execution + off-the-shelf primitives** — write your own consensus/execution logic in Rust, but reuse `revm` (EVM compatibility), `rust-libp2p` (networking), and `tokio` (async runtime) rather than building those from scratch. This is roughly the Monad/MegaETH playbook.
3. **Fully custom, from scratch** — maximum differentiation, maximum work. Only worth it once you know precisely which part of existing designs is holding back your speed/fee targets.

Given where you're starting from (strong EVM/wallet-side experience, less systems-programming history), option 2 is probably the pragmatic sweet spot: you get Rust's performance ceiling and EVM compatibility (so your existing ethers.js/wallet knowledge transfers directly to testing and tooling) without reinventing a P2P stack or a VM from nothing.

---

## 8. Further Reading

- Monad docs — consensus (MonadBFT) and parallel/async execution design: https://docs.monad.xyz/
- MegaETH research — real-time execution engine deep dive: https://www.megaeth.com/research
- `rust-libp2p`: https://github.com/libp2p/rust-libp2p
- `revm` (Rust EVM implementation): https://github.com/bluealloy/revm
- Cosmos SDK docs: https://docs.cosmos.network/
- Substrate docs: https://docs.substrate.io/
