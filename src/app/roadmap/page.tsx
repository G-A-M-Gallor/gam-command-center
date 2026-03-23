"use client";
// ===================================================
// GAM Command Center — Roadmap Page
// Assembles all PM components into tabbed interface
// ===================================================

import { useState } from "react";
import { TabNav, type TabId } from "@/components/pm/TabNav";
import { QuickCapture } from "@/components/pm/QuickCapture";
import { AIChatBar } from "@/components/pm/AIChatBar";
import { HomeScreen } from "@/components/pm/HomeScreen";
import { HierarchyScreen } from "@/components/pm/HierarchyScreen";
import { TasksScreen } from "@/components/pm/TasksScreen";
import { WikiScreen } from "@/components/pm/WikiScreen";
import { BIScreen } from "@/components/pm/BIScreen";

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={setActiveTab} />;
      case "hierarchy":
        return <HierarchyScreen />;
      case "tasks":
        return <TasksScreen />;
      case "wiki":
        return <WikiScreen />;
      case "bi":
        return <BIScreen />;
      default:
        return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white" dir="rtl">
      {/* Quick Capture - Desktop */}
      <div className="hidden md:block">
        <QuickCapture />
      </div>

      {/* Tab Navigation */}
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="min-h-screen pb-20">
        {renderContent()}
      </main>

      {/* Quick Capture - Mobile FAB */}
      <div className="md:hidden">
        <QuickCapture showAsFAB />
      </div>

      {/* AI Chat Bar */}
      <AIChatBar />
    </div>
  );
}