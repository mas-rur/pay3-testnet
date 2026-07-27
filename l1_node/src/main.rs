mod chain;
mod crypto;
mod rpc;
mod state;
mod types;

use chain::Node;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

const BLOCK_TIME_SECS: u64 = 3;
const FAUCET_BALANCE: u64 = 1_000_000;

#[tokio::main]
async fn main() {
    // On a hosted testnet, set FAUCET_PRIVATE_KEY so the faucet address
    // stays the same across redeploys. Without it, a fresh one is
    // generated every boot (fine for local dev, disruptive for a public
    // testnet where people expect the faucet address not to move).
    let (faucet_sk, faucet_vk) = match std::env::var("FAUCET_PRIVATE_KEY")
        .ok()
        .and_then(|k| crypto::keypair_from_hex(&k))
    {
        Some(pair) => pair,
        None => crypto::generate_keypair(),
    };
    let faucet_addr = crypto::Address::from_verifying_key(&faucet_vk);
    let faucet_priv_hex = hex::encode(faucet_sk.to_bytes());

    println!("================  l1_node dev chain  ================");
    println!("faucet address : {}", faucet_addr);
    println!("faucet privkey : 0x{}  (dev only, do not reuse)", faucet_priv_hex);
    println!("faucet balance : {}", FAUCET_BALANCE);
    println!("block time     : {}s", BLOCK_TIME_SECS);
    println!("=======================================================");

    let node = Node::new_with_genesis(faucet_addr, FAUCET_BALANCE);
    let shared: rpc::SharedNode = Arc::new(Mutex::new(node));

    // Block producer: the "consensus" loop. Every tick, pull pending txs
    // out of the mempool, execute them, and seal a new block.
    let producer_node = shared.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(BLOCK_TIME_SECS));
        loop {
            interval.tick().await;
            let mut node = producer_node.lock().await;
            if let Some(block) = node.produce_block() {
                println!(
                    "[block {}] {} tx(s)  state_root={}  hash={}",
                    block.index,
                    block.transactions.len(),
                    &block.state_root[..10],
                    &block.hash[..10]
                );
            }
        }
    });

    let app = rpc::router(shared);
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .unwrap();
    println!("listening on 0.0.0.0:{port}");
    axum::serve(listener, app).await.unwrap();
}
