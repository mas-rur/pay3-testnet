// Minimal wallet-side signer for l1_node.
//
// This plays the role your pay3-wallet / ethers.js code will eventually
// play for real: build a tx, hash it exactly how the chain expects,
// sign with a raw secp256k1 key, and POST it to the node's RPC.
//
// Usage:
//   node send.js <privkey_hex> <to_address> <amount> <nonce> [rpc_url]

const { SigningKey, keccak256, getBytes, toBeHex, concat } = require("ethers");

const [, , privKey, to, amountStr, nonceStr, rpcUrl] = process.argv;

if (!privKey || !to || !amountStr || !nonceStr) {
  console.error(
    "usage: node send.js <privkey_hex> <to_address> <amount> <nonce> [rpc_url]"
  );
  process.exit(1);
}

const amount = BigInt(amountStr);
const nonce = BigInt(nonceStr);
const rpc = rpcUrl || "http://localhost:8080";

async function main() {
  const signingKey = new SigningKey(privKey);
  const from = addressFromPublicKey(signingKey.publicKey);

  // Must match Transaction::signing_hash on the Rust side exactly:
  // keccak256(to_bytes(20) || amount_be(8) || nonce_be(8))
  const toBytes = getBytes(to);
  const amountBytes = getBytes(toBeHex(amount, 8));
  const nonceBytes = getBytes(toBeHex(nonce, 8));
  const hash = keccak256(concat([toBytes, amountBytes, nonceBytes]));

  // Plain ECDSA over the digest -- no extra "Ethereum Signed Message" prefix,
  // no recovery id needed since we send the pubkey alongside the signature.
  const sig = signingKey.sign(hash);
  const signature = (sig.r + sig.s.slice(2)).toLowerCase(); // r || s, 64 bytes

  const tx = {
    from,
    to,
    amount: Number(amount),
    nonce: Number(nonce),
    pubkey: signingKey.publicKey,
    signature,
  };

  console.log("submitting:", tx);

  const res = await fetch(`${rpc}/tx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  const body = await res.json();
  console.log(res.status, body);
}

// Same derivation as Ethereum / our Rust node: keccak256(pubkey[1:])[12:]
function addressFromPublicKey(uncompressedHex) {
  const pub = getBytes(uncompressedHex); // 0x04 || X(32) || Y(32)
  const hash = keccak256(pub.slice(1));
  return "0x" + hash.slice(-40);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
