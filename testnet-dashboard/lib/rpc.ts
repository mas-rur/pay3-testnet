export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL?.replace(/\/$/, "") || "http://localhost:8080";

export interface Account {
  address: string;
  balance: number;
  nonce: number;
}

export interface HistoryEvent {
  block: number;
  timestamp: number;
  tx_hash: string;
  direction: "sent" | "received";
  counterparty: string;
  amount: number;
  nonce: number;
}

export interface HistoryResponse {
  address: string;
  count: number;
  history: HistoryEvent[];
}

export interface Block {
  index: number;
  timestamp: number;
  prev_hash: string;
  transactions: unknown[];
  state_root: string;
  hash: string;
}

export interface ChainResponse {
  height: number;
  blocks: Block[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${RPC_URL}${path}`, { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `request failed (${res.status})`);
  return body as T;
}

export const rpc = {
  health: () => get<{ status: string }>("/health"),
  account: (address: string) => get<Account>(`/account/${address}`),
  history: (address: string) => get<HistoryResponse>(`/history/${address}`),
  chain: () => get<ChainResponse>("/chain"),

  async sendTx(tx: {
    from: string;
    to: string;
    amount: number;
    nonce: number;
    pubkey: string;
    signature: string;
  }) {
    const res = await fetch(`${RPC_URL}/tx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `request failed (${res.status})`);
    return body as { tx_hash: string };
  },
};
