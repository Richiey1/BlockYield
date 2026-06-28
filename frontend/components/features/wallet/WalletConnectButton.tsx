"use client";

import { useReown } from "@/contexts/ReownProvider";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalletConnectButton() {
  const { open, isConnected, address } = useReown();

  return (
    <Button
      onClick={() => open()}
      className="btn-retro flex items-center gap-2"
    >
      <Smartphone className="h-4 w-4" />
      <span className="font-pixel text-[10px] sm:text-xs">
        {isConnected && address
          ? `${address.slice(0, 6)}...${address.slice(-4)}`
          : "MOBILE WALLET"}
      </span>
    </Button>
  );
}
