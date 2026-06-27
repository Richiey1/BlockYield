'use client'

import Link from 'next/link';
import { WalletButton } from '@/components/features/wallet/WalletButton';
import { WalletConnectButton } from '@/components/features/wallet/WalletConnectButton';
import { Grid3x3 } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <Grid3x3 className="w-7 h-7 text-orange-500" strokeWidth={2.5} />
            <span className="text-2xl font-bold font-pixel tracking-tight">
              <span className="text-orange-500">STACKS</span>
              <span className="text-white">TacToe</span>
            </span>
          </Link>

          {/* Wallet Button */}
          <div className="flex items-center gap-3">
             <WalletConnectButton />
             <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
