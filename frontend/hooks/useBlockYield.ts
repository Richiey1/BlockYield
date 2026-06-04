"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useStacks } from "@/contexts/StacksProvider";

export function useBlockYield() {
  const { address, isConnected } = useStacks();
  
  const [stxBalance, setStxBalance] = useState("0.0000");
  const [rawMicroStx, setRawMicroStx] = useState(BigInt(0));
  const [vaultPrincipal, setVaultPrincipal] = useState("0.0000");
  const [yieldCredits, setYieldCredits] = useState("0.00000000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch live STX balance
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
  }, [address, vaultPrincipal]);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
    }
  }, [isConnected, address, fetchBalance]);

  // Tick yield credits every second when connected and vaulted
  useEffect(() => {
    if (!isConnected || parseFloat(vaultPrincipal) <= 0) return;
    const interval = setInterval(() => {
      setYieldCredits(prev => {
        const principal = parseFloat(vaultPrincipal) || 0;
        const ratePerSecond = (principal * 0.05) / (365 * 24 * 3600);
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
    setStxBalance,
    setVaultPrincipal,
    setYieldCredits,
  };
}
