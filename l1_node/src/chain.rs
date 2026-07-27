use crate::crypto::Address;
use crate::state::State;
use crate::types::{Block, Transaction};
use chrono::Utc;

/// A single-authority ("Proof of Authority") node: one validator proposes
/// a block every tick. This is deliberately the
/// simplest possible consensus so you can see the full tx-to-finality
/// pipeline end to end before swapping in real BFT voting across many
/// validators (README section 5).
pub struct Node {
    pub chain: Vec<Block>,
    pub state: State,
    pub mempool: Vec<Transaction>,
    pub max_txs_per_block: usize,
}

impl Node {
    pub fn new_with_genesis(faucet: Address, faucet_balance: u64) -> Self {
        let mut state = State::new();
        state.credit(faucet, faucet_balance);

        let state_root = state.root_hash();
        let hash = Block::compute_hash(0, Utc::now().timestamp(), "0x0", &[], &state_root);
        let genesis = Block {
            index: 0,
            timestamp: Utc::now().timestamp(),
            prev_hash: "0x0".to_string(),
            transactions: vec![],
            state_root,
            hash,
        };

        Node {
            chain: vec![genesis],
            state,
            mempool: Vec::new(),
            max_txs_per_block: 50,
        }
    }

    pub fn submit_tx(&mut self, tx: Transaction) -> Result<String, String> {
        let from = tx.verify()?; // signature + pubkey<->from check

        // Reject if it can't possibly apply against *current* state --
        // real mempools re-check this continuously as state changes.
        let acct = self.state.get(&from);
        if tx.nonce < acct.nonce {
            return Err("nonce too low (already used)".into());
        }
        if tx.nonce == acct.nonce && tx.amount > acct.balance {
            return Err("insufficient balance".into());
        }

        let hash = tx.hash_hex();
        self.mempool.push(tx);
        Ok(hash)
    }

    /// Called on a timer by the block-producer task. Pulls pending txs,
    /// applies the ones that are still valid, and seals a new block.
    /// Returns None if there was nothing to include.
    pub fn produce_block(&mut self) -> Option<Block> {
        if self.mempool.is_empty() {
            return None;
        }

        let pending: Vec<Transaction> = self.mempool.drain(..).collect();
        let mut included = Vec::new();

        for tx in pending {
            match tx.verify() {
                Ok(from) => {
                    if self.state.apply(&tx, from).is_ok() {
                        included.push(tx);
                    }
                    // invalid (bad nonce/balance at execution time) -> dropped
                }
                Err(_) => { /* dropped: shouldn't happen, already checked on submit */ }
            }
        }

        if included.is_empty() {
            return None;
        }

        let prev = self.chain.last().unwrap();
        let index = self.chain.len() as u64;
        let timestamp = Utc::now().timestamp();
        let state_root = self.state.root_hash();
        let hash = Block::compute_hash(index, timestamp, &prev.hash, &included, &state_root);

        let block = Block {
            index,
            timestamp,
            prev_hash: prev.hash.clone(),
            transactions: included,
            state_root,
            hash,
        };

        self.chain.push(block.clone());
        Some(block)
    }
}
