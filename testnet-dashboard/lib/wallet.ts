import { SigningKey, Wallet, keccak256, getBytes, toBeHex, concat } from "ethers";

/**
 * Local-wallet storage.
 *
 * Wallets never leave the device: they're generated (or imported) in the
 * browser and kept in localStorage, namespaced so they don't collide with
 * anything else on the same origin. There is no encryption layer here --
 * anyone with access to this browser profile can read the private keys.
 * That's an acceptable tradeoff for a testnet toy wallet, but it's worth
 * being upfront about in the UI.
 */
const WALLETS_KEY = "pay3_testnet_wallets_v1";
const ACTIVE_KEY = "pay3_testnet_active_wallet_v1";

export interface StoredWallet {
  address: string;
  privateKey: string;
  label: string;
  createdAt: number;
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function listWallets(): StoredWallet[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(WALLETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWallets(wallets: StoredWallet[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
}

export function getActiveWalletAddress(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveWalletAddress(address: string) {
  if (!hasStorage()) return;
  window.localStorage.setItem(ACTIVE_KEY, address);
}

/** Add a wallet to local storage (generated or imported) and make it active. */
export function addWallet(
  address: string,
  privateKey: string,
  label?: string
): StoredWallet {
  const wallets = listWallets();
  const existing = wallets.find(
    (w) => w.address.toLowerCase() === address.toLowerCase()
  );
  if (existing) {
    setActiveWalletAddress(existing.address);
    return existing;
  }
  const wallet: StoredWallet = {
    address,
    privateKey,
    label: label || `Wallet ${wallets.length + 1}`,
    createdAt: Date.now(),
  };
  saveWallets([...wallets, wallet]);
  setActiveWalletAddress(wallet.address);
  return wallet;
}

export function removeWallet(address: string) {
  const wallets = listWallets().filter(
    (w) => w.address.toLowerCase() !== address.toLowerCase()
  );
  saveWallets(wallets);
  if (getActiveWalletAddress()?.toLowerCase() === address.toLowerCase()) {
    if (wallets.length > 0) {
      setActiveWalletAddress(wallets[0].address);
    } else if (hasStorage()) {
      window.localStorage.removeItem(ACTIVE_KEY);
    }
  }
}

export function renameWallet(address: string, label: string) {
  const wallets = listWallets().map((w) =>
    w.address.toLowerCase() === address.toLowerCase() ? { ...w, label } : w
  );
  saveWallets(wallets);
}

export function getActiveWallet(): StoredWallet | null {
  const address = getActiveWalletAddress();
  if (!address) return null;
  return (
    listWallets().find((w) => w.address.toLowerCase() === address.toLowerCase()) ??
    null
  );
}

/** Derive the address for a raw private key without storing it. */
export function addressFromPrivateKey(privateKey: string): string {
  const signingKey = new SigningKey(privateKey.trim());
  return addressFromPublicKey(signingKey.publicKey);
}

/** Same derivation the node uses: keccak256(uncompressed_pubkey[1:])[12:] */
export function addressFromPublicKey(uncompressedHex: string): string {
  const pub = getBytes(uncompressedHex);
  const hash = keccak256(pub.slice(1));
  return "0x" + hash.slice(-40);
}

export function createWallet() {
  const w = Wallet.createRandom();
  return { address: w.address, privateKey: w.privateKey };
}

/**
 * Sign a transfer with a raw private key, entirely client-side -- the key
 * never leaves the browser tab. Must match Transaction::signing_hash on
 * the Rust side exactly: keccak256(to(20) || amount_be(8) || nonce_be(8)).
 */
export function signTransfer(
  privateKey: string,
  to: string,
  amount: bigint,
  nonce: bigint
) {
  const signingKey = new SigningKey(privateKey);
  const from = addressFromPublicKey(signingKey.publicKey);

  const toBytes = getBytes(to);
  const amountBytes = getBytes(toBeHex(amount, 8));
  const nonceBytes = getBytes(toBeHex(nonce, 8));
  const hash = keccak256(concat([toBytes, amountBytes, nonceBytes]));

  const sig = signingKey.sign(hash);
  const signature = (sig.r + sig.s.slice(2)).toLowerCase();

  return {
    from,
    to,
    amount: Number(amount),
    nonce: Number(nonce),
    pubkey: signingKey.publicKey,
    signature,
  };
}
