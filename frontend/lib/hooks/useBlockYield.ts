"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useStacks } from "@/contexts/StacksProvider";
import { DEPLOYER_ADDRESS, CONTRACT_NAME, FUNCTION_NAMES } from "@/lib/constants/contracts";
import { cvToValue, fetchCallReadOnlyFunction, principalCV, ClarityType } from "@stacks/transactions";
import { STACKS_MAINNET } from "@stacks/network";

export function useBlockYield() {
  const { address, isConnected } = useStacks();
  
  const [stxBalance, setStxBalance] = useState("0.0000");
  const [rawMicroStx, setRawMicroStx] = useState(BigInt(0));
  const [vaultPrincipal, setVaultPrincipal] = useState("0.0000");
  const [yieldCredits, setYieldCredits] = useState("0.00000000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch live STX balance from Hiro API
  const fetchBalance = useCallback(async () => {
    if (!address) return;
    setIsLoadingBalance(true);
    try {
      const res = await fetch(`https://api.hiro.so/extended/v1/address/${address}/balances`);
      const data = await res.json();
      if (data.stx) {
        const micro = BigInt(data.stx.balance || "0");
        setRawMicroStx(micro);
        setStxBalance((Number(micro) / 1e6).toFixed(4));
      }
    } catch {
      setRawMicroStx(BigInt(0));
      setStxBalance("0.0000");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address]);

  // Fetch real vault principal and yield credits via contract read-only calls
  const fetchVaultData = useCallback(async () => {
    if (!address) return;
    try {
      // get-vault-data: returns (optional { principal-amount: uint, last-yield-block: uint })
      const vaultResult = await fetchCallReadOnlyFunction({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.GET_VAULT_DATA,
        functionArgs: [principalCV(address)],
        network: STACKS_MAINNET,
        senderAddress: address,
      });

      if (vaultResult.type === ClarityType.OptionalSome) {
        const vaultData = cvToValue(vaultResult.value) as { "principal-amount": bigint };
        const principalMicro = BigInt(vaultData["principal-amount"] ?? 0);
        setVaultPrincipal((Number(principalMicro) / 1e6).toFixed(4));
      } else {
        setVaultPrincipal("0.0000");
      }

      // get-yield-balance: returns uint (accumulated + pending yield in micro-STX)
      const yieldResult = await fetchCallReadOnlyFunction({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: FUNCTION_NAMES.GET_YIELD_BALANCE,
        functionArgs: [principalCV(address)],
        network: STACKS_MAINNET,
        senderAddress: address,
      });

      if (yieldResult.type === ClarityType.UInt) {
        const yieldMicro = BigInt(yieldResult.value as bigint);
        setYieldCredits((Number(yieldMicro) / 1e6).toFixed(8));
      }
    } catch {
      // fail silently — keep previous values
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
      fetchVaultData();
    }
  }, [isConnected, address, fetchBalance, fetchVaultData]);

  // Tick yield credits every second when connected and vaulted
  // Rate aligned with contract: yield-rate-per-block = 95, precision = 1e9
  // Approx per-second: principal * 95 / 1e9 / ~10s_per_block = 9.5/1e9 per second
  useEffect(() => {
    if (!isConnected || parseFloat(vaultPrincipal) <= 0) return;
    const interval = setInterval(() => {
      setYieldCredits(prev => {
        const principal = parseFloat(vaultPrincipal) || 0;
        // ~0.5% APY: rate_per_block=95, 1B scale, ~52560 blocks/yr, ~10s/block
        const ratePerSecond = (principal * 0.005) / (365 * 24 * 3600);
        return (parseFloat(prev) + ratePerSecond).toFixed(8);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected, vaultPrincipal]);

  // Max deposit: full wallet balance
  const maxDepositSTX = useMemo(() => (Number(rawMicroStx) / 1e6).toString(), [rawMicroStx]);
  
  // Max yield redemption
  const maxRedeemCredits = useMemo(() => parseFloat(yieldCredits).toFixed(4), [yieldCredits]);

  return {
    stxBalance,
    rawMicroStx,
    vaultPrincipal,
    yieldCredits,
    isLoadingBalance,
    maxDepositSTX,
    maxRedeemCredits,
    fetchBalance,
    fetchVaultData,
    setStxBalance,
    setVaultPrincipal,
    setYieldCredits,
  };
}
