"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { WelcomeModal } from "@/components/WelcomeModal";
import { GlossaryModal } from "@/components/GlossaryModal";
import { TabPolicySimulator } from "@/components/TabPolicySimulator";
import { TabUnderwriting } from "@/components/TabUnderwriting";
import { TabStressTesting } from "@/components/TabStressTesting";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"policy" | "underwriting" | "stress">("underwriting");
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);

  // Auto trigger Welcome modal on first visit
  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_onboarding");
    if (!hasSeen) {
      setIsWelcomeOpen(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setIsWelcomeOpen(false);
    localStorage.setItem("has_seen_onboarding", "true");
  };

  return (
    <div className="min-h-screen pb-16 bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Clean Light Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWelcome={() => setIsWelcomeOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
      />

      {/* Main Container - Widescreen max-w-[1440px] */}
      <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 py-6">
        {activeTab === "policy" && <TabPolicySimulator />}
        {activeTab === "underwriting" && <TabUnderwriting />}
        {activeTab === "stress" && <TabStressTesting />}
      </main>

      {/* Onboarding Welcome Modal */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={handleCloseWelcome}
      />

      {/* Financial Glossary & Guide Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
