use crate::crypto::{keccak256, Address};
use crate::types::Transaction;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Default, Serialize)]
pub struct Account {
    pub balance: u64,
    pub nonce: u64,
}

#[derive(Debug, Default)]
pub struct State {
    pub accounts: HashMap<Address, Account>,
}

impl State {
    pub fn new() -> Self {
        State {
            accounts: HashMap::new(),
        }
    }

    pub fn get(&self, addr: &Address) -> Account {
        self.accounts.get(addr).cloned().unwrap_or_default()
    }

    pub fn credit(&mut self, addr: Address, amount: u64) {
        self.accounts.entry(addr).or_default().balance += amount;
    }

    /// Apply one transaction: check nonce + balance, move funds, bump nonce.
    /// `from` must already be verified (see Transaction::verify) before this
    /// is called -- this function trusts its caller on authenticity and only
    /// checks economic validity.
    pub fn apply(&mut self, tx: &Transaction, from: Address) -> Result<(), String> {
        let to = Address::from_hex(&tx.to).ok_or("bad `to` address")?;

        {
            let sender = self.accounts.entry(from).or_default();
            if tx.nonce != sender.nonce {
                return Err(format!(
                    "bad nonce: expected {}, got {}",
                    sender.nonce, tx.nonce
                ));
            }
            if sender.balance < tx.amount {
                return Err("insufficient balance".into());
            }
            sender.balance -= tx.amount;
            sender.nonce += 1;
        }

        self.accounts.entry(to).or_default().balance += tx.amount;
        Ok(())
    }

    /// NOT a real Merkle root -- just keccak256 over the sorted account
    /// set, enough to detect state divergence between nodes for this demo.
    /// Swap in a Patricia/Verkle trie for real proofs (README section 3).
    pub fn root_hash(&self) -> String {
        let mut entries: Vec<_> = self.accounts.iter().collect();
        entries.sort_by_key(|(addr, _)| addr.0);

        let mut buf = Vec::new();
        for (addr, acc) in entries {
            buf.extend_from_slice(&addr.0);
            buf.extend_from_slice(&acc.balance.to_be_bytes());
            buf.extend_from_slice(&acc.nonce.to_be_bytes());
        }
        format!("0x{}", hex::encode(keccak256(&buf)))
    }
}
