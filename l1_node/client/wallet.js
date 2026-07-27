// Simple command-line wallet for l1_node.
//
//   node wallet.js new
//   node wallet.js balance <address>
//   node wallet.js history <address>
//   node wallet.js send <privkey> <to> <amount> [nonce]
//
// Set RPC_URL to point at a different node. Defaults to http://localhost:8080.

const { SigningKey, Wallet, keccak256, getBytes, toBeHex, concat } = require("ethers");

const RPC = process.env.RPC_URL || "http://localhost:8080";

function addressFromPublicKey(uncompressedHex) {
  const pub = getBytes(uncompressedHex); // 0x04 || X(32) || Y(32)
  const hash = keccak256(pub.slice(1));
  return "0x" + hash.slice(-40);
}

async function cmdNew() {
  const w = Wallet.createRandom();
  console.log("New wallet created:\n");
  console.log("  address     :", w.address);
  console.log("  private key :", w.privateKey);
  console.log("\nSave the private key somewhere safe -- it's the only way to");
  console.log("spend from this address. Fund it from the faucet, then use");
  console.log("this key with `wallet.js send`.");
}

async function cmdBalance(address) {
  const res = await fetch(`${RPC}/account/${address}`);
  const body = await res.json();
  if (!res.ok) return console.log("error:", body.error || body);
  console.log(`${body.address}`);
  console.log(`  balance : ${body.balance}`);
  console.log(`  nonce   : ${body.nonce}`);
}

async function cmdHistory(address) {
  const res = await fetch(`${RPC}/history/${address}`);
  const body = await res.json();
  if (!res.ok) return console.log("error:", body.error || body);

  if (body.count === 0) {
    console.log(`No transactions yet for ${body.address}`);
    return;
  }

  console.log(`${body.count} transaction(s) for ${body.address}\n`);
  for (const e of body.history) {
    const arrow = e.direction === "sent" ? "-> sent    " : "<- received";
    const other = e.direction === "sent" ? `to   ${e.counterparty}` : `from ${e.counterparty}`;
    console.log(
      `block ${String(e.block).padStart(4)}  ${arrow}  ${String(e.amount).padStart(8)}  ${other}  (${e.tx_hash.slice(0, 12)}...)`
    );
  }
}

async function cmdSend(privKey, to, amountStr, nonceArg) {
  const signingKey = new SigningKey(privKey);
  const from = addressFromPublicKey(signingKey.publicKey);

  let nonce;
  if (nonceArg !== undefined) {
    nonce = BigInt(nonceArg);
  } else {
    const acctRes = await fetch(`${RPC}/account/${from}`);
    const acct = await acctRes.json();
    nonce = BigInt(acct.nonce); // auto-fill the next expected nonce
  }

  const amount = BigInt(amountStr);

  // Must match Transaction::signing_hash on the Rust side exactly.
  const toBytes = getBytes(to);
  const amountBytes = getBytes(toBeHex(amount, 8));
  const nonceBytes = getBytes(toBeHex(nonce, 8));
  const hash = keccak256(concat([toBytes, amountBytes, nonceBytes]));

  const sig = signingKey.sign(hash);
  const signature = (sig.r + sig.s.slice(2)).toLowerCase();

  const tx = {
    from,
    to,
    amount: Number(amount),
    nonce: Number(nonce),
    pubkey: signingKey.publicKey,
    signature,
  };

  const res = await fetch(`${RPC}/tx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  const body = await res.json();

  if (!res.ok) {
    console.log("rejected:", body.error);
    return;
  }
  console.log(`sent ${amount} from ${from} to ${to} (nonce ${nonce})`);
  console.log(`tx_hash: ${body.tx_hash}`);
  console.log(`\nwait a few seconds for the next block, then check:`);
  console.log(`  node wallet.js balance ${to}`);
}

function usage() {
  console.log(`
Usage:
  node wallet.js new
  node wallet.js balance <address>
  node wallet.js history <address>
  node wallet.js send <privkey> <to> <amount> [nonce]

RPC_URL=http://localhost:8080 (default) -- set this env var to target a
different node.
`);
}

async function main() {
  const [, , cmd, ...args] = process.argv;
  if (cmd === "new") return cmdNew();
  if (cmd === "balance" && args[0]) return cmdBalance(args[0]);
  if (cmd === "history" && args[0]) return cmdHistory(args[0]);
  if (cmd === "send" && args.length >= 3) return cmdSend(args[0], args[1], args[2], args[3]);
  usage();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
