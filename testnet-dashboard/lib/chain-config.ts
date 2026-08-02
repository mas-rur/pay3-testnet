/**
 * All the "branding" knobs for this dashboard in one place. Change these
 * to rename the chain/token without hunting through components.
 */
export const CHAIN_NAME = "Pay3 Testnet";
export const CHAIN_SHORT_NAME = "Pay3";
export const TOKEN_SYMBOL = "P3";

/** How many tokens a single faucet request sends. */
export const FAUCET_AMOUNT = 1000;

/** How many faucet requests a single address may make per rolling 24h window. */
export const FAUCET_DAILY_LIMIT = 3;

/** Matches l1_node's BLOCK_TIME_SECS -- used only for display estimates. */
export const BLOCK_TIME_SECS = 3;
