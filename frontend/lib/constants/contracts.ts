// Standardized Contract Constants for BlockYield
export const DEPLOYER_ADDRESS = 'SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF';
export const CONTRACT_NAME = 'blockyields';
export const CONTRACT_FULL_NAME = `${DEPLOYER_ADDRESS}.${CONTRACT_NAME}`;

export const FUNCTION_NAMES = {
  DEPOSIT_STX: 'deposit-stx',
  WITHDRAW_STX: 'withdraw-stx',
  REDEEM_YIELD_CREDITS: 'redeem-yield-credits',
  PLACE_YIELD_BET: 'place-yield-bet',
  RESOLVE_BLOCK: 'resolve-block',
  CLAIM_REWARD: 'claim-reward',
  GET_VAULT_DATA: 'get-vault-data',
  GET_YIELD_BALANCE: 'get-yield-balance',
  GET_BLOCK_POOL: 'get-block-pool',
  GET_USER_STAKE: 'get-user-stake',
} as const;
