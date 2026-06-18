import { fetchCallReadOnlyFunction, uintCV, principalCV, cvToJSON } from "@stacks/transactions";
import { STACKS_MAINNET } from "@stacks/network";
import { DEPLOYER_ADDRESS, CONTRACT_NAME, FUNCTION_NAMES } from "@/lib/constants/contracts";

export async function fetchDynamicRounds(address: string | null) {
  // 1. Fetch current block height
  const res = await fetch("https://api.hiro.so/extended/v1/block?limit=1");
  const data = await res.json();
  const currentHeight = data.results?.[0]?.height;
  
  if (!currentHeight) return [];

  const targetHeights = [
    currentHeight + 2,
    currentHeight + 1,
    currentHeight,
    currentHeight - 1,
    currentHeight - 2
  ];

  const rounds = [];

  for (const height of targetHeights) {
    let totalPool = "0";
    let myStake = undefined;
    let outcome = undefined;
    let hasClaimed = false;
    let status: "open" | "resolved" = height <= currentHeight ? "resolved" : "open";

    try {
      // Fetch pool data
      const poolRes = await fetchCallReadOnlyFunction({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.GET_BLOCK_POOL,
        functionArgs: [uintCV(height)],
        network: STACKS_MAINNET,
        senderAddress: DEPLOYER_ADDRESS
      });
      const poolJson = cvToJSON(poolRes);
      if (poolJson.value) {
        totalPool = (Number(poolJson.value.value['total-pool'].value) / 1e6).toFixed(2);
        
        // If resolved, get outcome
        if (status === "resolved") {
          const outcomeRes = await fetchCallReadOnlyFunction({
            contractAddress: DEPLOYER_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: "get-outcome",
            functionArgs: [uintCV(height)],
            network: STACKS_MAINNET,
            senderAddress: DEPLOYER_ADDRESS
          });
          const outcomeJson = cvToJSON(outcomeRes);
          if (outcomeJson.value) {
            outcome = Number(outcomeJson.value.value);
          }
        }
      }

      // Fetch user stake if connected
      if (address) {
        const stakeRes = await fetchCallReadOnlyFunction({
          contractAddress: DEPLOYER_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: FUNCTION_NAMES.GET_USER_STAKE,
          functionArgs: [uintCV(height), principalCV(address)],
          network: STACKS_MAINNET,
          senderAddress: address
        });
        const stakeJson = cvToJSON(stakeRes);
        if (stakeJson.value) {
          myStake = {
            amount: (Number(stakeJson.value.value.amount.value) / 1e6).toFixed(2),
            prediction: Number(stakeJson.value.value.prediction.value)
          };
        }

        // Fetch claimed status
        if (status === "resolved" && myStake) {
          const claimRes = await fetchCallReadOnlyFunction({
            contractAddress: DEPLOYER_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: "has-user-claimed",
            functionArgs: [uintCV(height), principalCV(address)],
            network: STACKS_MAINNET,
            senderAddress: address
          });
          const claimJson = cvToJSON(claimRes);
          hasClaimed = claimJson.value === true;
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch data for height ${height}`, e);
    }

    rounds.push({
      id: height,
      targetBlock: height,
      outcomeType: "parity",
      status,
      totalPool,
      outcome,
      myStake,
      hasClaimed,
      options: [
        { label: "Even Block Height (0)", value: 0 },
        { label: "Odd Block Height (1)", value: 1 }
      ]
    });
  }

  return rounds;
}
