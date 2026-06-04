"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { showConnect } from "@stacks/connect";
import { appDetails, userSession } from "@/lib/stacks-session";
import { STACKS_NETWORK } from "@/config/constants";

type StacksUserData = {
  profile?: {
    stxAddress?: {
      mainnet?: string;
      testnet?: string;
    };
  };
};

export type Network = "mainnet" | "testnet" | "disconnected";

const getAppIcon = () => {
  if (typeof window === "undefined") return appDetails.icon;
  try {
    return new URL(appDetails.icon, window.location.origin).toString();
  } catch {
    return appDetails.icon;
  }
};

export function useStacksWallet() {
  const [userData, setUserData] = useState<StacksUserData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function hydrateSession() {
      if (userSession.isSignInPending()) {
        const data = await userSession.handlePendingSignIn();
        if (!cancelled) setUserData(data);
      } else if (userSession.isUserSignedIn()) {
        setUserData(userSession.loadUserData());
      }
      if (!cancelled) setIsReady(true);
    }

    hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    showConnect({
      userSession,
      appDetails: { ...appDetails, icon: getAppIcon() },
      onFinish: () => {
        setUserData(userSession.loadUserData());
      },
    });
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut();
    setUserData(null);
  }, []);

  const network: Network = useMemo(() => {
    if (!userData?.profile?.stxAddress) return "disconnected";
    return STACKS_NETWORK === 'mainnet' ? "mainnet" : "testnet";
  }, [userData]);

  const address = useMemo(() => {
    if (!userData?.profile?.stxAddress) return null;
    if (STACKS_NETWORK === 'mainnet') {
      return userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
    }
    return userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
  }, [userData]);

  return {
    address,
    connect,
    disconnect,
    isReady,
    isSignedIn: !!userData,
    network,
  };
}
