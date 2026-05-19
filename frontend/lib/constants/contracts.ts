// Standardized Contract Constants for BlockBet
export const DEPLOYER_ADDRESS = 'SP258BY8D71JCTV73A4V3ADPHCVWSBEM6G4FETPYF';
export const CONTRACT_NAME = 'blockbet';
export const CONTRACT_FULL_NAME = `${DEPLOYER_ADDRESS}.${CONTRACT_NAME}`;

export const FUNCTION_NAMES = {
  CREATE_ROUND: 'create-round',
  PLACE_STAKE: 'place-stake',
  RESOLVE_ROUND: 'resolve-round',
  GET_ROUND: 'get-round',
  GET_USER_STAKE: 'get-user-stake',
} as const;
