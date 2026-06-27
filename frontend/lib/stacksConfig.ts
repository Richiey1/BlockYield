// src/lib/stacksConfig.ts
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { 
  STACKS_NETWORK as CONF_NETWORK, 
  CONTRACT_ADDRESS as CONF_CONTRACT_ADDRESS,
  CONTRACT_NAME as CONF_CONTRACT_NAME,
  APP_NAME as CONF_APP_NAME,
  APP_ICON as CONF_APP_ICON
} from '@/lib/constants/contracts';

// Network configuration
export const NETWORK = CONF_NETWORK === 'mainnet' 
  ? STACKS_MAINNET 
  : STACKS_TESTNET;

// Contract configuration
export const CONTRACT_ADDRESS = CONF_CONTRACT_ADDRESS;
export const CONTRACT_NAME = CONF_CONTRACT_NAME;

// App configuration
export const APP_NAME = CONF_APP_NAME;
export const APP_ICON = CONF_APP_ICON;

// API configuration
export const STACKS_API_URL = CONF_NETWORK === 'mainnet'
  ? 'https://api.mainnet.hiro.so'
  : 'https://api.testnet.hiro.so';
