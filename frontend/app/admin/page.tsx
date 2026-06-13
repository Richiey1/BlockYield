"use client";

import { ShieldAlert, ShieldCheck, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStacksWallet } from "@/hooks/useStacksWallet";
import { ADMIN_WALLETS, DEPLOYER_ADDRESS } from "@/lib/constants/contracts";

export default function AdminPage() {
  const wallet = useStacksWallet();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!wallet.isSignedIn) {
      setIsAuthorized(false);
      return;
    }
    
    if (wallet.address && ADMIN_WALLETS.includes(wallet.address)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      setTimeout(() => router.push("/"), 2000);
    }
  }, [wallet.isSignedIn, wallet.address, router]);

  if (isAuthorized === null) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="bg-slate-900 max-w-md w-full p-8 rounded-3xl text-center border border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black uppercase text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 text-sm font-medium">
            This area is restricted to the protocol deployer address only. Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden text-white">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              Admin <span className="text-amber-500">Dashboard</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">
              Deployer Access Verified
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Protocol Actions
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Administrative functions will be enabled here in the next protocol iteration. You can manage yield rates, platform fees, and transfer admin rights from this dashboard.
            </p>
            <div className="space-y-4">
              <button disabled className="w-full py-4 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                Set Yield Rate
              </button>
              <button disabled className="w-full py-4 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                Transfer Admin
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
            <h2 className="text-xl font-bold mb-6 text-white">Contract Address</h2>
            <div className="space-y-4 font-mono text-[10px] sm:text-xs text-slate-400 break-all">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="font-bold text-amber-500 mb-1 uppercase font-sans tracking-wider">BlockYield Contract (v3)</p>
                <p>{DEPLOYER_ADDRESS}.blockyield-v3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
