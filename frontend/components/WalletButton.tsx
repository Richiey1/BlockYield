"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useStacksWallet } from "@/hooks/useStacksWallet";
import { Copy, LogOut, Check, ChevronDown, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";

type WalletState = ReturnType<typeof useStacksWallet>;

const formatAddress = (address: string | null) => {
  if (!address) return "CONNECT WALLET";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

type Props = {
  wallet?: WalletState;
};

export function WalletButton({ wallet }: Props) {
  const walletState = wallet ?? useStacksWallet();
  const { address, connect, disconnect, isReady, isSignedIn } = walletState;
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const label = useMemo(
    () => formatAddress(address ?? null),
    [address],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleConnect = () => {
    if (!isSignedIn) {
      connect();
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
      setIsDropdownOpen(false);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Disconnected");
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (!isMounted) {
    return (
      <button
        type="button"
        disabled
        className="w-full sm:w-auto min-w-[140px] sm:min-w-0 px-5 py-2.5 bg-zinc-950/80 text-orange-500/50 border border-orange-500/20 rounded-xl flex items-center justify-center gap-2 font-semibold text-xs tracking-wider uppercase opacity-60"
      >
        <span>LOADING...</span>
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        disabled={!isReady}
        className="w-full sm:w-auto min-w-[140px] sm:min-w-0 px-5 py-2.5 bg-zinc-950/80 hover:bg-orange-500/10 text-orange-500 hover:text-orange-400 border border-orange-500/30 hover:border-orange-500/50 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.05)] hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] flex items-center justify-center gap-2 font-semibold text-xs tracking-wider uppercase cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Connected Wallet Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="w-full sm:w-auto min-w-[140px] sm:min-w-0 px-5 py-2.5 bg-zinc-950/80 hover:bg-orange-500/10 text-orange-500 hover:text-orange-400 border border-orange-500/30 hover:border-orange-500/50 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.05)] hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] flex items-center justify-center gap-2 font-semibold text-xs tracking-wider uppercase cursor-pointer"
      >
        <Wallet className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-250 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-zinc-950/95 border border-zinc-800 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(249,115,22,0.03)] overflow-hidden z-50 animate-fadeIn">
          {/* Wallet Address */}
          <div className="px-4 py-3.5 border-b border-zinc-900 bg-zinc-900/10">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-[11px] font-mono font-medium text-orange-500 break-all">{label}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Copy Address */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/60 transition-colors text-left group cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">
                {copied ? "COPIED!" : "COPY ADDRESS"}
              </span>
            </button>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/60 transition-colors text-left group cursor-pointer border-t border-zinc-900/40"
            >
              <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">DISCONNECT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
