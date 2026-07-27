use crate::crypto::{keccak256, verify_hash, Address};
use k256::ecdsa::{Signature, VerifyingKey};
use serde::{Deserialize, Serialize};

/// What a wallet submits to the node. `pubkey` + `signature` let the node
/// verify authenticity without needing Ethereum's recoverable-signature
/// dance (v/r/s recovery) -- a deliberate MVP simplification, see README.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub from: String,
    pub to: String,
    pub amount: u64,
    pub nonce: u64,
    pub pubkey: String,
    pub signature: String,
}

impl Transaction {
    /// The exact bytes a wallet must sign: keccak256(to || amount || nonce).
    /// A real chain would include chain_id, gas price, calldata, etc. here.
    pub fn signing_hash(to: &Address, amount: u64, nonce: u64) -> [u8; 32] {
        let mut buf = Vec::with_capacity(36);
        buf.extend_from_slice(&to.0);
        buf.extend_from_slice(&amount.to_be_bytes());
        buf.extend_from_slice(&nonce.to_be_bytes());
        keccak256(&buf)
    }

    /// Full validity check: well-formed addresses, pubkey matches `from`,
    /// and the signature actually verifies over the signing hash.
    /// Returns the sender's Address on success.
    pub fn verify(&self) -> Result<Address, String> {
        let to = Address::from_hex(&self.to).ok_or("bad `to` address")?;

        let pubkey_bytes =
            hex::decode(self.pubkey.trim_start_matches("0x")).map_err(|_| "bad pubkey hex")?;
        let vk = VerifyingKey::from_sec1_bytes(&pubkey_bytes).map_err(|_| "bad pubkey")?;

        let derived = Address::from_verifying_key(&vk);
        if derived.to_hex().to_lowercase() != self.from.to_lowercase() {
            return Err("`from` does not match pubkey".into());
        }

        let sig_bytes =
            hex::decode(self.signature.trim_start_matches("0x")).map_err(|_| "bad sig hex")?;
        let sig = Signature::try_from(sig_bytes.as_slice()).map_err(|_| "bad signature")?;

        let hash = Self::signing_hash(&to, self.amount, self.nonce);
        if !verify_hash(&vk, &hash, &sig) {
            return Err("signature does not verify".into());
        }

        Ok(derived)
    }

    pub fn hash(&self) -> [u8; 32] {
        keccak256(&serde_json::to_vec(self).unwrap())
    }

    pub fn hash_hex(&self) -> String {
        format!("0x{}", hex::encode(self.hash()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: i64,
    pub prev_hash: String,
    pub transactions: Vec<Transaction>,
    /// Simplified state commitment: keccak256 of the sorted account set
    /// after applying this block. A production chain uses a Merkle/Verkle
    /// trie here so individual balances can be *proven* without trusting
    /// the whole state -- see README section 5.
    pub state_root: String,
    pub hash: String,
}

impl Block {
    pub fn compute_hash(
        index: u64,
        timestamp: i64,
        prev_hash: &str,
        transactions: &[Transaction],
        state_root: &str,
    ) -> String {
        let mut buf = Vec::new();
        buf.extend_from_slice(&index.to_be_bytes());
        buf.extend_from_slice(&timestamp.to_be_bytes());
        buf.extend_from_slice(prev_hash.as_bytes());
        for tx in transactions {
            buf.extend_from_slice(&tx.hash());
        }
        buf.extend_from_slice(state_root.as_bytes());
        format!("0x{}", hex::encode(keccak256(&buf)))
    }
}
