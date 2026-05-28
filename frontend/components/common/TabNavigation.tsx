"use client";

import { Gamepad2, PlusCircle, Crown, User, Settings, Search } from "lucide-react";

export type TabType = "games" | "create" | "leaderboard" | "challenges" | "verify" | "admin";

interface TabNavigationProps {
  activeTab: TabType | null;
  onTabChange: (tab: TabType) => void;
  showAdmin?: boolean;
}

export function TabNavigation({ activeTab, onTabChange, showAdmin = false }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "create", label: "Create", icon: PlusCircle },
    { id: "leaderboard", label: "Leaderboard", icon: Crown },
    { id: "challenges", label: "Players Profile", icon: User },
    { id: "verify", label: "Verify Game", icon: Search },
  ];

  if (showAdmin) {
    tabs.push({ id: "admin", label: "Admin", icon: Settings });
  }

  return (
    <div className="flex flex-col gap-6 w-full p-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-4 px-6 py-4 transition-all w-full text-left font-pixel uppercase text-xs md:text-sm border-4
              ${isActive
                ? "bg-orange-500 text-black border-orange-500 shadow-[4px_4px_0px_0px_#fff]"
                : "bg-black text-white border-white hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_#f97316]"
              }
            `}
          >
            <Icon className="w-8 h-8" />
            <span className="flex-1">{tab.label}</span>
            {isActive && <span className="animate-pulse">◄</span>}
          </button>
        );
      })}
    </div>
  );
}
