import React from "react";
import { Lock, ShieldCheck, KeyRound, HelpCircle, History, Sparkles } from "lucide-react";

interface HeaderProps {
  activeTab: "create" | "verify" | "history";
  onSelectTab: (tab: "create" | "verify" | "history") => void;
  onOpenHowItWorks: () => void;
  recentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenHowItWorks,
  recentCount
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-4 ring-indigo-50">
            <Lock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                Locked File Generator
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                AES-256 / ZipCrypto
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
              Custom name &bull; Exact size up to 5 GB &bull; Password locked &bull; Instant download
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tab-create-file"
              onClick={() => onSelectTab("create")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "create"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Create File</span>
            </button>

            <button
              id="tab-verify-unlock"
              onClick={() => onSelectTab("verify")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "verify"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Test & Unlock</span>
            </button>

            <button
              id="tab-recent-files"
              onClick={() => onSelectTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === "history"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Recent</span>
              {recentCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {recentCount}
                </span>
              )}
            </button>
          </nav>

          <button
            id="btn-how-it-works"
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="How encryption and size generation works"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline">Help & Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
