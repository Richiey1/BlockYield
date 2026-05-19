import axios from "axios";
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  uintCV,
  stringAsciiCV,
  PostConditionMode,
} from "@stacks/transactions";
import { StacksMainnet, StacksTestnet } from "@stacks/network";

// Configuration settings
const STACKS_API_URL = process.env.STACKS_API_URL || "https://api.hiro.so";
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS || "SP3TXKY0REKG6P3W6ACFB615N5556EC8VYS4MFA4D";
const CONTRACT_NAME = "blockbet";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || ""; // Set this in environment vars

const network = process.env.NETWORK === "mainnet" ? new StacksMainnet() : new StacksTestnet();

interface PredictionRound {
  targetBlock: number;
  outcomeType: string;
  status: string;
  totalPool: number;
}

// Fetch the current block height from the Stacks node
async function getLatestBlockHeight(): Promise<number> {
  try {
    const response = await axios.get(`${STACKS_API_URL}/extended/v1/block?limit=1`);
    const latestBlock = response.data.results[0];
    return latestBlock.height;
  } catch (error: any) {
    console.error("Failed to fetch latest block height:", error.message);
    throw error;
  }
}

// Query outcome of target block height
async function getBlockOutcome(height: number, outcomeType: string): Promise<number> {
  try {
    const response = await axios.get(`${STACKS_API_URL}/extended/v1/block/by_height/${height}`);
    const blockData = response.data;
    
    if (outcomeType === "tx-count") {
      // Return total transactions executed in block
      return blockData.txs.length;
    } else if (outcomeType === "block-fees") {
      // Calculate total block fees
      let totalFees = 0;
      for (const tx of blockData.txs) {
        totalFees += parseInt(tx.fee_rate || "0");
      }
      return totalFees;
    }
    
    return 0;
  } catch (error: any) {
    console.error(`Failed to fetch block outcome for block #${height}:`, error.message);
    throw error;
  }
}

// Triggers resolve-round transaction call on Stacks L2
async function resolveRound(roundId: number, outcome: number) {
  if (!ADMIN_PRIVATE_KEY) {
    console.warn(`[Dry Run] Would resolve round #${roundId} with outcome: ${outcome} (No private key set)`);
    return;
  }

  try {
    const txOptions = {
      contractAddress: DEPLOYER_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "resolve-round",
      functionArgs: [
        uintCV(roundId),
        uintCV(outcome),
      ],
      senderKey: ADMIN_PRIVATE_KEY,
      validateWithStxHeaders: true,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    
    if (broadcastResponse.error) {
      console.error(`Error broadcasting resolution for round #${roundId}:`, broadcastResponse.error);
    } else {
      console.log(`Successfully broadcasted resolution for round #${roundId}! TxID: ${broadcastResponse.txid}`);
    }
  } catch (error: any) {
    console.error(`Failed to resolve round #${roundId}:`, error.message);
  }
}

// Core Execution loop
async function runResolver() {
  console.log("-----------------------------------------");
  console.log("Starting BlockBet Automated Resolution Engine");
  console.log(`Polling API: ${STACKS_API_URL}`);
  console.log(`Target Contract: ${DEPLOYER_ADDRESS}.${CONTRACT_NAME}`);
  console.log("-----------------------------------------");

  try {
    const currentHeight = await getLatestBlockHeight();
    console.log(`Current Stacks Block Height: #${currentHeight}`);

    // Fetch active prediction rounds from the contract state
    // In production, the bot queries the blockchain for open rounds.
    // Here is a typical query sequence looping over active round IDs.
    const maxCheckedRounds = 50; 
    
    for (let roundId = 0; roundId < maxCheckedRounds; roundId++) {
      try {
        // Query read-only get-round
        const res = await axios.post(`${STACKS_API_URL}/v2/contracts/call-read/${DEPLOYER_ADDRESS}/${CONTRACT_NAME}/get-round`, {
          sender: DEPLOYER_ADDRESS,
          arguments: [`0x01${roundId.toString(16).padStart(16, '0')}`] // uint serialize hex
        });
        
        if (res.data && res.data.okay) {
          // Parse contract CV data
          const resultCV = res.data.result;
          // If status is "open" and current height >= target block height, trigger resolution
          console.log(`Checking prediction round #${roundId}...`);
          
          // Execute resolution if eligible
          // const outcome = await getBlockOutcome(targetBlock, outcomeType);
          // await resolveRound(roundId, outcome);
        }
      } catch (e) {
        // Round does not exist, break loop
        break;
      }
    }
    
    console.log("Resolution poll cycle completed.");
  } catch (error: any) {
    console.error("Resolution engine error:", error.message);
  }
}

// Start polling
if (require.main === module) {
  runResolver();
  setInterval(runResolver, 60000); // Poll every 60 seconds
}
