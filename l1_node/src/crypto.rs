use k256::ecdsa::signature::hazmat::{PrehashSigner, PrehashVerifier};
use k256::ecdsa::{Signature, SigningKey, VerifyingKey};
use sha3::{Digest, Keccak256};

/// keccak256(data) -> 32 bytes. Same hash Ethereum uses everywhere
/// (addresses, tx hashes, storage keys).
pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(data);
    let out = hasher.finalize();
    let mut buf = [0u8; 32];
    buf.copy_from_slice(&out);
    buf
}

/// A 20-byte account address, derived the same way Ethereum does it:
/// keccak256(uncompressed_pubkey[1:])[12..32]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Address(pub [u8; 20]);

impl Address {
    pub fn from_verifying_key(vk: &VerifyingKey) -> Self {
        let uncompressed = vk.to_encoded_point(false);
        // skip the leading 0x04 prefix byte, hash the raw 64-byte X||Y point
        let hash = keccak256(&uncompressed.as_bytes()[1..]);
        let mut addr = [0u8; 20];
        addr.copy_from_slice(&hash[12..32]);
        Address(addr)
    }

    pub fn to_hex(&self) -> String {
        format!("0x{}", hex::encode(self.0))
    }

    pub fn from_hex(s: &str) -> Option<Self> {
        let s = s.strip_prefix("0x").unwrap_or(s);
        let bytes = hex::decode(s).ok()?;
        if bytes.len() != 20 {
            return None;
        }
        let mut addr = [0u8; 20];
        addr.copy_from_slice(&bytes);
        Some(Address(addr))
    }
}

impl std::fmt::Display for Address {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}

/// Generate a brand new keypair (this is your "create wallet" function).
pub fn generate_keypair() -> (SigningKey, VerifyingKey) {
    let sk = SigningKey::random(&mut rand::thread_rng());
    let vk = *sk.verifying_key();
    (sk, vk)
}

/// Load a keypair from a raw 32-byte hex private key (with or without an
/// `0x` prefix). Used so a hosted node can keep a stable, known faucet
/// address across restarts instead of generating a new one every boot.
pub fn keypair_from_hex(hex_str: &str) -> Option<(SigningKey, VerifyingKey)> {
    let hex_str = hex_str.trim().trim_start_matches("0x");
    let bytes = hex::decode(hex_str).ok()?;
    let sk = SigningKey::from_bytes(bytes.as_slice().into()).ok()?;
    let vk = *sk.verifying_key();
    Some((sk, vk))
}

/// Sign a 32-byte hash with a private key (raw ECDSA over secp256k1,
/// same curve Ethereum/Bitcoin use).
pub fn sign_hash(sk: &SigningKey, hash: &[u8; 32]) -> Signature {
    sk.sign_prehash(hash).expect("signing failed")
}

/// Verify a signature over a 32-byte hash against a public key.
pub fn verify_hash(vk: &VerifyingKey, hash: &[u8; 32], sig: &Signature) -> bool {
    vk.verify_prehash(hash, sig).is_ok()
}
