"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import content to avoid loading both at once
const HistoryContent = dynamic(() => import("./HistoryContent"), {
  loading: () => <LoadingSpinner />
});
const AnalyticsContent = dynamic(() => import("./AnalyticsContent"), {
  loading: () => <LoadingSpinner />
});

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
    </div>
  );
}

type TabId = "history" | "analytics";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "history", label: "History", icon: Clock },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function InsightsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam || "history");

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    router.replace(`/insights?tab=${tab}`, { scroll: false });
  };

  return (
    <main className="min-h-screen pb-20">
      {/* Header with Tabs */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4 pb-0">
          <h1 className="text-2xl font-bold mb-4">Insights</h1>

          {/* Tab Navigation */}
          <div className="flex gap-1 -mx-4 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    isActive
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <div>
        {activeTab === "history" && <HistoryContent />}
        {activeTab === "analytics" && <AnalyticsContent />}
      </div>
    </main>
  );
}
