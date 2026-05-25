// Standardized Contract Constants for BlockBet
export const DEPLOYER_ADDRESS = 'SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF';
export const CONTRACT_NAME = 'blockbet-beta';
export const CONTRACT_FULL_NAME = `${DEPLOYER_ADDRESS}.${CONTRACT_NAME}`;

export const FUNCTION_NAMES = {
  PLACE_STAKE: 'place-stake',
  RESOLVE_BLOCK: 'resolve-block',
  CLAIM_REWARD: 'claim-reward',
  GET_BLOCK_POOL: 'get-block-pool',
  GET_USER_STAKE: 'get-user-stake',
} as const;
