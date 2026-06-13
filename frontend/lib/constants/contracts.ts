// Standardized Contract Constants for BlockYield
export const DEPLOYER_ADDRESS = 'SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF';
export const CONTRACT_NAME = 'blockyield-v3';
export const CONTRACT_FULL_NAME = `${DEPLOYER_ADDRESS}.${CONTRACT_NAME}`;

export const ADMIN_WALLETS = [
  'SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF', // Richiey1 / DamilareK
  'SPZYY7560YPR8BY63XNTDX36HBY1G8K0TST365B2', // TheBabalola
  'SP3TXKY0REKG6P3W6ACFB615N5556EC8VYS4MFA4D', // BbKenny
];

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

