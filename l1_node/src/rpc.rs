use crate::chain::Node;
use crate::crypto::Address;
use crate::types::Transaction;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};

pub type SharedNode = Arc<Mutex<Node>>;

pub fn router(node: SharedNode) -> Router {
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);

    Router::new()
        .route("/health", get(health))
        .route("/tx", post(submit_tx))
        .route("/account/:address", get(get_account))
        .route("/history/:address", get(get_history))
        .route("/block/:index", get(get_block))
        .route("/chain", get(get_chain))
        .layer(cors)
        .with_state(node)
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

// POST /tx  { "from", "to", "amount", "nonce", "pubkey", "signature" }
async fn submit_tx(
    State(node): State<SharedNode>,
    Json(tx): Json<Transaction>,
) -> (StatusCode, Json<serde_json::Value>) {
    let mut node = node.lock().await;
    match node.submit_tx(tx) {
        Ok(hash) => (StatusCode::OK, Json(json!({ "tx_hash": hash }))),
        Err(e) => (StatusCode::BAD_REQUEST, Json(json!({ "error": e }))),
    }
}

// GET /account/0x...
async fn get_account(
    State(node): State<SharedNode>,
    Path(address): Path<String>,
) -> (StatusCode, Json<serde_json::Value>) {
    let Some(addr) = Address::from_hex(&address) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "bad address" })),
        );
    };
    let node = node.lock().await;
    let acct = node.state.get(&addr);
    (
        StatusCode::OK,
        Json(json!({ "address": addr.to_hex(), "balance": acct.balance, "nonce": acct.nonce })),
    )
}

// GET /history/0x...  -- every transaction this address sent or received,
// oldest first. Scans the whole chain: fine for a devnet, a real chain
// would maintain an address -> tx index instead of scanning every block.
async fn get_history(
    State(node): State<SharedNode>,
    Path(address): Path<String>,
) -> (StatusCode, Json<serde_json::Value>) {
    let Some(addr) = Address::from_hex(&address) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "bad address" })),
        );
    };
    let addr_hex = addr.to_hex().to_lowercase();

    let node = node.lock().await;
    let mut events = Vec::new();
    for block in &node.chain {
        for tx in &block.transactions {
            let is_sender = tx.from.to_lowercase() == addr_hex;
            let is_receiver = tx.to.to_lowercase() == addr_hex;
            if !is_sender && !is_receiver {
                continue;
            }
            events.push(json!({
                "block": block.index,
                "timestamp": block.timestamp,
                "tx_hash": tx.hash_hex(),
                "direction": if is_sender { "sent" } else { "received" },
                "counterparty": if is_sender { &tx.to } else { &tx.from },
                "amount": tx.amount,
                "nonce": tx.nonce,
            }));
        }
    }

    (
        StatusCode::OK,
        Json(json!({ "address": addr.to_hex(), "count": events.len(), "history": events })),
    )
}

// GET /block/3
async fn get_block(
    State(node): State<SharedNode>,
    Path(index): Path<u64>,
) -> (StatusCode, Json<serde_json::Value>) {
    let node = node.lock().await;
    match node.chain.get(index as usize) {
        Some(block) => (StatusCode::OK, Json(json!(block))),
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "no such block" })),
        ),
    }
}

// GET /chain  -- full chain dump, handy for debugging a local devnet
async fn get_chain(State(node): State<SharedNode>) -> Json<serde_json::Value> {
    let node = node.lock().await;
    Json(json!({
        "height": node.chain.len(),
        "blocks": node.chain,
    }))
}
